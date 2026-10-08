import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { api } from '../../api/client';
import './Contact.css';

const MAP_SRC =
  'https://maps.google.com/maps?q=' +
  encodeURIComponent('Rukan Kencana Niaga, Jl. Aries Utama IV No.7, Meruya Utara, Kembangan, Jakarta Barat 11620') +
  '&t=&z=14&ie=UTF8&iwloc=&output=embed';

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div className="contact-field">
      <div className="contact-field-label">{label}</div>
      <div className="contact-field-value">{value}</div>
    </div>
  );
}

export default function Contact() {
  const { data: s } = useFetch('/public/settings', []);
  const address = s?.contact_address || '';
  const phone = s?.contact_phone || '';
  const email = s?.contact_email || '';
  const igUrl = s?.social_instagram || '#';
  const liUrl = s?.social_linkedin || '#';
  const waUrl = s?.social_whatsapp || (phone ? `https://wa.me/${phone.replace(/\D/g, '')}` : '#');

  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState({ state: 'idle', msg: '' });
  const upd = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setStatus({ state: 'sending', msg: '' });
    try {
      await api.post('/public/contact', {
        name: form.name,
        email: form.email,
        subject: 'Website Contact',
        message: form.message || 'Contact request',
      });
      setStatus({ state: 'sent', msg: 'Thank you — your message has been sent.' });
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      setStatus({ state: 'error', msg: err.message || 'Failed to send message.' });
    }
  };

  return (
    <div className="contact-page">

      <header className="contact-header">
        <h1 className="contact-page-title">Contact</h1>
      </header>

      {/* ── Section 1: map + office ── */}
      <section className="contact-info">
        <div className="container contact-info-grid">
          <div className="contact-map">
            <iframe title="Head office location" src={MAP_SRC} loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" />
          </div>

          <div className="contact-office">
            <h2 className="contact-office-title">Head Office</h2>
            <Field label="Address" value={address} />
            <Field label="Phone" value={phone} />
            <Field label="Email" value={email ? <a href={`mailto:${email}`}>{email}</a> : null} />
            <div className="contact-field">
              <div className="contact-field-label">Open Time</div>
              <div className="contact-field-value">
                Monday to Friday : 8.00 AM – 5.00 PM{'\n'}Saturday : 8.00 AM – 12.00 PM
              </div>
            </div>

            <div className="contact-socials">
              <a className="contact-social-btn" href={igUrl} target="_blank" rel="noreferrer" aria-label="Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
              </a>
              <a className="contact-social-btn" href={liUrl} target="_blank" rel="noreferrer" aria-label="LinkedIn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="2" width="20" height="20" rx="3"/><line x1="8" y1="11" x2="8" y2="16"/><line x1="8" y1="8" x2="8" y2="8.5"/><path d="M12 11v5M12 11a3 3 0 016 0v5"/></svg>
              </a>
              <a className="contact-social-btn" href={waUrl} target="_blank" rel="noreferrer" aria-label="WhatsApp">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2: connect form ── */}
      <section className="contact-cta">
        <div className="container contact-cta-inner">
          <h2 className="contact-cta-title">Connect With Us</h2>
          <p className="contact-cta-sub">Take the next step and discuss how our solutions can best help you in your projects</p>

          <form className="contact-cta-form" onSubmit={submit}>
            <div className="ccf-row">
              <input type="text" placeholder="Name *" required value={form.name} onChange={upd('name')} />
              <input type="email" placeholder="Email *" required value={form.email} onChange={upd('email')} />
            </div>
            <textarea placeholder="Message" rows={8} value={form.message} onChange={upd('message')} />
            <button className="ccf-send" type="submit" disabled={status.state === 'sending'}>
              {status.state === 'sending' ? 'Sending…' : 'Send'}
            </button>
            {status.msg && <div className={`ccf-status ccf-status-${status.state}`}>{status.msg}</div>}
          </form>
        </div>
      </section>

    </div>
  );
}
