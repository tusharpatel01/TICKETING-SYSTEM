import React, { useEffect, useState } from 'react';
import { api } from '../api';

function Bar({ count, max, color }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="breakdown-bar-wrap">
      <div className="breakdown-bar" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

const PRIORITY_COLORS = { low: '#4caf50', medium: '#ff9800', high: '#ff5722', critical: '#e53935' };
const CATEGORY_COLORS = { billing: '#1565c0', technical: '#2e7d32', account: '#e65100', general: '#6a1b9a' };

export default function StatsDashboard({ refresh }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.getStats().then(setStats).catch(() => {});
  }, [refresh]);

  if (!stats) return <div className="card"><div className="empty">Loading stats...</div></div>;

  const maxPriority = Math.max(...Object.values(stats.priority_breakdown), 1);
  const maxCategory = Math.max(...Object.values(stats.category_breakdown), 1);

  return (
    <div className="card">
      <h2>📊 Dashboard</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{stats.total_tickets}</div>
          <div className="stat-label">Total Tickets</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#1565c0' }}>{stats.open_tickets}</div>
          <div className="stat-label">Open Tickets</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#388e3c' }}>{stats.avg_tickets_per_day}</div>
          <div className="stat-label">Avg / Day</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#e53935' }}>{stats.priority_breakdown.critical}</div>
          <div className="stat-label">Critical</div>
        </div>
      </div>

      <div className="breakdown-grid">
        <div>
          <div className="breakdown-title">By Priority</div>
          {Object.entries(stats.priority_breakdown).map(([p, count]) => (
            <div className="breakdown-row" key={p}>
              <div className="breakdown-label">{p}</div>
              <Bar count={count} max={maxPriority} color={PRIORITY_COLORS[p]} />
              <div className="breakdown-count">{count}</div>
            </div>
          ))}
        </div>
        <div>
          <div className="breakdown-title">By Category</div>
          {Object.entries(stats.category_breakdown).map(([c, count]) => (
            <div className="breakdown-row" key={c}>
              <div className="breakdown-label">{c}</div>
              <Bar count={count} max={maxCategory} color={CATEGORY_COLORS[c]} />
              <div className="breakdown-count">{count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
