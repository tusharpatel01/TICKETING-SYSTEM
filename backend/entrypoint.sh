#!/bin/bash
set -e

echo "Waiting for database..."

for i in $(seq 1 30); do
  python << 'EOF'
import psycopg2, os, sys
try:
    psycopg2.connect(
        dbname=os.environ.get('POSTGRES_DB','ticketdb'),
        user=os.environ.get('POSTGRES_USER','ticketuser'),
        password=os.environ.get('POSTGRES_PASSWORD','ticketpass'),
        host=os.environ.get('POSTGRES_HOST','db'),
        port=int(os.environ.get('POSTGRES_PORT','5432')),
        connect_timeout=3,
    )
    sys.exit(0)
except Exception as e:
    print(f"  Not ready: {e}")
    sys.exit(1)
EOF
  if [ $? -eq 0 ]; then
    echo "Database is ready!"
    break
  fi
  echo "Waiting... attempt $i/30"
  sleep 3
done

echo "Running migrations..."
python manage.py migrate --noinput

echo "Starting server..."
gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 2