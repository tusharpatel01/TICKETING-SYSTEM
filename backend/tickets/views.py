import json
import os
from django.db.models import Q, Count
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Ticket
from .serializers import TicketSerializer


@api_view(['GET', 'POST'])
def ticket_list(request):
    if request.method == 'GET':
        qs = Ticket.objects.all()
        category = request.query_params.get('category')
        priority = request.query_params.get('priority')
        ticket_status = request.query_params.get('status')
        search = request.query_params.get('search')
        if category:
            qs = qs.filter(category=category)
        if priority:
            qs = qs.filter(priority=priority)
        if ticket_status:
            qs = qs.filter(status=ticket_status)
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(description__icontains=search))
        serializer = TicketSerializer(qs, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = TicketSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH'])
def ticket_detail(request, pk):
    try:
        ticket = Ticket.objects.get(pk=pk)
    except Ticket.DoesNotExist:
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(TicketSerializer(ticket).data)
    elif request.method == 'PATCH':
        serializer = TicketSerializer(ticket, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def ticket_stats(request):
    total = Ticket.objects.count()
    open_tickets = Ticket.objects.filter(status='open').count()

    if total > 0:
        oldest = Ticket.objects.order_by('created_at').first()
        days = max((timezone.now() - oldest.created_at).days, 1)
        avg_per_day = round(total / days, 1)
    else:
        avg_per_day = 0.0

    priority_breakdown = dict(
        Ticket.objects.values('priority').annotate(count=Count('id')).values_list('priority', 'count')
    )
    category_breakdown = dict(
        Ticket.objects.values('category').annotate(count=Count('id')).values_list('category', 'count')
    )

    for p in ['low', 'medium', 'high', 'critical']:
        priority_breakdown.setdefault(p, 0)
    for c in ['billing', 'technical', 'account', 'general']:
        category_breakdown.setdefault(c, 0)

    return Response({
        'total_tickets': total,
        'open_tickets': open_tickets,
        'avg_tickets_per_day': avg_per_day,
        'priority_breakdown': priority_breakdown,
        'category_breakdown': category_breakdown,
    })


@api_view(['POST'])
def classify_ticket(request):
    description = request.data.get('description', '').strip()
    if not description:
        return Response({'error': 'description required'}, status=status.HTTP_400_BAD_REQUEST)

    api_key = os.environ.get('ANTHROPIC_API_KEY', '')
    if not api_key:
        return Response({'suggested_category': 'general', 'suggested_priority': 'medium'})

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)
        prompt = f"""You are a support ticket classifier. Given the ticket description below, return ONLY a JSON object with two fields:
- "category": one of "billing", "technical", "account", "general"
- "priority": one of "low", "medium", "high", "critical"

Guidelines:
- billing: payment, invoice, subscription, charge, refund
- technical: bugs, errors, crashes, performance, API
- account: login, password, profile, access, permissions
- general: everything else

Priority:
- critical: system down, data loss, cannot access at all
- high: major feature broken
- medium: feature partially working
- low: minor issue or question

Ticket: {description}

Respond with ONLY valid JSON."""

        message = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=100,
            messages=[{"role": "user", "content": prompt}]
        )
        result = json.loads(message.content[0].text.strip())
        category = result.get('category', 'general')
        priority = result.get('priority', 'medium')
        if category not in ['billing', 'technical', 'account', 'general']:
            category = 'general'
        if priority not in ['low', 'medium', 'high', 'critical']:
            priority = 'medium'
        return Response({'suggested_category': category, 'suggested_priority': priority})
    except Exception as e:
        return Response({'suggested_category': 'general', 'suggested_priority': 'medium'})