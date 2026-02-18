import React, { useState } from 'react';
import TicketForm from './components/TicketForm';
import TicketList from './components/TicketList';
import StatsDashboard from './components/StatsDashboard';

export default function App() {
  const [tab, setTab] = useState('submit');
  const [refresh, setRefresh] = useState(0);
  const [toast, setToast] = useState(null);

  const handleCreated = (ticket) => {
    setRefresh(r => r + 1);
    setToast(`Ticket "${ticket.title}" submitted!`);
    setTimeout(() => setToast(null), 3000);
    setTab('list');
  };

  return (
    <div className="app">
      <div className="header">
        <div>
          <h1>🎫 Support Ticket System</h1>
          <p>AI-powered ticket classification with Anthropic Claude</p>
        </div>
      </div>

      <div className="nav-tabs">
        <button className={`nav-tab ${tab === 'submit' ? 'active' : ''}`} onClick={() => setTab('submit')}>
          ➕ Submit Ticket
        </button>
        <button className={`nav-tab ${tab === 'list' ? 'active' : ''}`} onClick={() => setTab('list')}>
          📋 All Tickets
        </button>
        <button className={`nav-tab ${tab === 'stats' ? 'active' : ''}`} onClick={() => setTab('stats')}>
          📊 Dashboard
        </button>
      </div>

      {tab === 'submit' && <TicketForm onCreated={handleCreated} />}
      {tab === 'list' && <TicketList refresh={refresh} />}
      {tab === 'stats' && <StatsDashboard refresh={refresh} />}

      {toast && <div className="toast">✅ {toast}</div>}
    </div>
  );
}
