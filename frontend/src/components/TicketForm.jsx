import React, { useState, useRef } from 'react';
import { api } from '../api';

const CATEGORIES = ['billing', 'technical', 'account', 'general'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

export default function TicketForm({ onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', category: '', priority: '' });
  const [classifying, setClassifying] = useState(false);
  const [aiSuggested, setAiSuggested] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const classifyTimeout = useRef(null);

  const handleDescChange = (e) => {
    const desc = e.target.value;
    setForm(f => ({ ...f, description: desc }));
    setAiSuggested(false);

    if (classifyTimeout.current) clearTimeout(classifyTimeout.current);
    if (desc.trim().length > 20) {
      setClassifying(true);
      classifyTimeout.current = setTimeout(async () => {
        try {
          const result = await api.classify(desc);
          setForm(f => ({
            ...f,
            category: result.suggested_category || f.category,
            priority: result.suggested_priority || f.priority,
          }));
          setAiSuggested(true);
        } catch {
          // silent fail
        } finally {
          setClassifying(false);
        }
      }, 800);
    } else {
      setClassifying(false);
    }
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (!form.category) e.category = 'Category is required';
    if (!form.priority) e.priority = 'Priority is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);
    try {
      const { ok, data } = await api.createTicket(form);
      if (ok) {
        setForm({ title: '', description: '', category: '', priority: '' });
        setAiSuggested(false);
        onCreated(data);
      } else {
        setErrors(data);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card">
      <h2>🎫 Submit a New Ticket</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Title *</label>
          <input
            maxLength={200}
            placeholder="Brief summary of the issue"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          />
          {errors.title && <div style={{ color: '#c62828', fontSize: '0.8rem', marginTop: 4 }}>{errors.title}</div>}
        </div>

        <div className="form-group">
          <label>Description *</label>
          <textarea
            placeholder="Describe your issue in detail..."
            value={form.description}
            onChange={handleDescChange}
          />
          {errors.description && <div style={{ color: '#c62828', fontSize: '0.8rem', marginTop: 4 }}>{errors.description}</div>}
        </div>

        {classifying && (
          <div className="ai-banner">
            <span className="ai-spinner" />
            AI is analyzing your description...
          </div>
        )}
        {aiSuggested && !classifying && (
          <div className="ai-banner">
            ✨ AI suggested category and priority below — you can change them.
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>Category *</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              <option value="">Select category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
            {errors.category && <div style={{ color: '#c62828', fontSize: '0.8rem', marginTop: 4 }}>{errors.category}</div>}
          </div>

          <div className="form-group">
            <label>Priority *</label>
            <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
              <option value="">Select priority</option>
              {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
            {errors.priority && <div style={{ color: '#c62828', fontSize: '0.8rem', marginTop: 4 }}>{errors.priority}</div>}
          </div>
        </div>

        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Ticket'}
        </button>
      </form>
    </div>
  );
}
