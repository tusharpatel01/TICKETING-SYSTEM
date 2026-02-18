const BASE = '/api';

export const api = {
  getTickets: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`${BASE}/tickets/${qs ? '?' + qs : ''}`).then(r => r.json());
  },
  createTicket: (data) =>
    fetch(`${BASE}/tickets/`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json().then(d => ({ ok: r.ok, data: d }))),
  patchTicket: (id, data) =>
    fetch(`${BASE}/tickets/${id}/`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json()),
  getStats: () => fetch(`${BASE}/tickets/stats/`).then(r => r.json()),
  classify: (description) =>
    fetch(`${BASE}/tickets/classify/`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description }),
    }).then(r => r.json()),
};
