import { useState } from 'react';
import { api } from '../../api/client';
import './ContactForm.css';

export default function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '', website: '' });
  const [status, setStatus] = useState({ state: 'idle', msg: '' });

  const update = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setStatus({ state: 'sending', msg: '' });
    try {
      await api.post('/public/contact', form);
      setStatus({ state: 'sent', msg: 'Thank you — your message has been sent.' });
      setForm({ name: '', email: '', subject: '', message: '', website: '' });
    } catch (err) {
      setStatus({ state: 'error', msg: err.message || 'Failed to send' });
    }
  };

  return (
    <form className="contact-form" onSubmit={submit}>
      {/* honeypot */}
      <input type="text" name="website" value={form.website} onChange={update('website')} style={{display:'none'}} tabIndex={-1} autoComplete="off" />

      <div className="form-row">
        <label>
          <span>Your Name *</span>
          <input type="text" required value={form.name} onChange={update('name')} />
        </label>
        <label>
          <span>Email *</span>
          <input type="email" required value={form.email} onChange={update('email')} />
        </label>
      </div>
      <label>
        <span>Subject *</span>
        <input type="text" required value={form.subject} onChange={update('subject')} />
      </label>
      <label>
        <span>Message *</span>
        <textarea rows={6} required value={form.message} onChange={update('message')} />
      </label>
      <button className="btn btn-primary" type="submit" disabled={status.state === 'sending'}>
        {status.state === 'sending' ? 'Sending…' : 'Send Message'}
      </button>
      {status.msg && <div className={`form-status form-status-${status.state}`}>{status.msg}</div>}
    </form>
  );
}
