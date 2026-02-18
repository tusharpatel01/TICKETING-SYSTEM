import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api';

const STATUSES = ['open', 'in_progress', 'resolved', 'closed'];

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function TicketList({ refresh }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [filters, setFilters] = useState({ search: '', category: '', priority: '', status: '' });

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.category) params.category = filters.category;
    if (filters.priority) params.priority = filters.priority;
    if (filters.status) params.status = filters.status;
    const data = await api.getTickets(params);
    setTickets(data);
    setLoading(false);
  }, [filters]);

  useEffect(() => { fetchTickets(); }, [fetchTickets, refresh]);

  const handleStatusChange = async (id, newStatus) => {
    await api.patchTicket(id, { status: newStatus });
    setTickets(ts => ts.map(t => t.id === id ? { ...t, status: newStatus } : t));
  };

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val }));

  return (
    <div className="card">
      <h2>🗂️ All Tickets</h2>
      <div className="filters">
        <input
          placeholder="🔍 Search tickets..."
          value={filters.search}
          onChange={e => setFilter('search', e.target.value)}
        />
        <select value={filters.category} onChange={e => setFilter('category', e.target.value)}>
          <option value="">All Categories</option>
          {['billing','technical','account','general'].map(c =>
            <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
        </select>
        <select value={filters.priority} onChange={e => setFilter('priority', e.target.value)}>
          <option value="">All Priorities</option>
          {['low','medium','high','critical'].map(p =>
            <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
        </select>
        <select value={filters.status} onChange={e => setFilter('status', e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.map(s =>
            <option key={s} value={s}>{s.replace('_',' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="empty">Loading tickets...</div>
      ) : tickets.length === 0 ? (
        <div className="empty">No tickets found.</div>
      ) : (
        <div className="ticket-list">
          {tickets.map(t => (
            <div
              key={t.id}
              className={`ticket-card ${expanded === t.id ? 'expanded' : ''}`}
              onClick={() => setExpanded(expanded === t.id ? null : t.id)}
            >
              <div className="ticket-card-header">
                <div style={{ flex: 1 }}>
                  <div className="ticket-title">{t.title}</div>
                  <div className="ticket-desc">
                    {t.description.length > 120 ? t.description.slice(0, 120) + '…' : t.description}
                  </div>
                  <div className="ticket-meta">
                    <span className={`badge badge-category-${t.category}`}>{t.category}</span>
                    <span className={`badge badge-priority-${t.priority}`}>{t.priority}</span>
                    <span className={`badge badge-status-${t.status}`}>{t.status.replace('_', ' ')}</span>
                    <span className="ticket-time">{timeAgo(t.created_at)}</span>
                  </div>
                </div>
              </div>

              {expanded === t.id && (
                <div className="ticket-expand" onClick={e => e.stopPropagation()}>
                  <div style={{ marginBottom: 10, fontSize: '0.88rem', color: '#555', lineHeight: 1.6 }}>
                    {t.description}
                  </div>
                  <label>Change Status:</label>
                  <select
                    value={t.status}
                    onChange={e => handleStatusChange(t.id, e.target.value)}
                  >
                    {STATUSES.map(s =>
                      <option key={s} value={s}>{s.replace('_',' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
