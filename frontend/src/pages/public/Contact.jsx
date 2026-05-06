import { useFetch } from '../../hooks/useFetch';
import ContactForm from '../../components/public/ContactForm.jsx';

export default function Contact() {
  const { data: s } = useFetch('/public/settings', []);
  return (
    <>
      <div className="page-header">
        <div className="container"><h1>Contact Us</h1></div>
      </div>
      <section className="section">
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--sp-7)' }}>
          <div className="contact-grid">
            <div>
              <h3 style={{ marginBottom: 'var(--sp-4)' }}>Get in touch</h3>
              <p className="text-muted" style={{ marginBottom: 'var(--sp-5)' }}>
                We'd love to hear from you. Fill out the form and our team will respond as soon as possible.
              </p>
              {s?.contact_address && <p style={{ marginBottom: 'var(--sp-2)' }}><strong>Address:</strong><br />{s.contact_address}</p>}
              {s?.contact_phone && <p style={{ marginBottom: 'var(--sp-2)' }}><strong>Phone:</strong> {s.contact_phone}</p>}
              {s?.contact_email && <p style={{ marginBottom: 'var(--sp-2)' }}><strong>Email:</strong> {s.contact_email}</p>}
            </div>
            <div>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
      <style>{`
        .contact-grid { display: grid; grid-template-columns: 1fr; gap: var(--sp-7); }
        @media (min-width: 768px) { .contact-grid { grid-template-columns: 1fr 1.2fr; } }
      `}</style>
    </>
  );
}
