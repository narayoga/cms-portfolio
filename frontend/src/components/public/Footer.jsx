import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import './Footer.css';

export default function Footer() {
  const [settings, setSettings] = useState({});

  useEffect(() => {
    api.get('/public/settings').then(setSettings).catch(() => {});
  }, []);

  const phone    = settings.contact_phone   || '021 5858 660';
  const email    = settings.contact_email   || 'sales.project@sag-locks.com';
  const address  = settings.contact_address || 'Perkantoran Kencana Niaga Blok D1 No.3S\nMeruya Utara, Kembangan, Jakarta Barat\nDKI Jakarta, 11620';
  const siteName = settings.site_name       || 'Sarana Artha Grahawisesa';
  const igUrl    = settings.social_instagram || '#';
  const liUrl    = settings.social_linkedin  || '#';
  const waUrl    = settings.social_whatsapp  || `https://wa.me/${phone.replace(/\D/g,'')}`;

  return (
    <footer className="site-footer">

      {/* ── Top colour bar ─────────────────────────── */}
      <div className="footer-colorbar">
        <div className="footer-colorbar__blue"  />
        <div className="footer-colorbar__red"   />
        <div className="footer-colorbar__black" />
      </div>

      {/* ── Main content ───────────────────────────── */}
      <div className="footer-main container">

        {/* Col 1: Business Hours + socials */}
        <div className="footer-col">
          <h4 className="footer-col__title">Business Hours</h4>
          <table className="footer-hours">
            <tbody>
              <tr>
                <td>Monday to Friday:</td>
                <td>8.00 am – 5.00 pm</td>
              </tr>
              <tr>
                <td>Saturday:</td>
                <td>8.00 am – 12.00 pm</td>
              </tr>
            </tbody>
          </table>
          <p className="footer-contact-line">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.56 21 3 13.44 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.25 1.01l-2.2 2.2z"/></svg>
            {phone}
          </p>
          <p className="footer-contact-line">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></svg>
            {email}
          </p>

          {/* Social icons */}
          <div className="footer-socials">
            <a href={igUrl} target="_blank" rel="noreferrer" aria-label="Instagram" className="footer-social-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
            </a>
            <a href={liUrl} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="footer-social-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="2" width="20" height="20" rx="3"/><line x1="8" y1="11" x2="8" y2="16"/><line x1="8" y1="8" x2="8" y2="8.5"/><path d="M12 11v5M12 11a3 3 0 016 0v5"/></svg>
            </a>
            <a href={waUrl} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="footer-social-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
            </a>
          </div>
        </div>

        {/* Col 2: Showroom */}
        <div className="footer-col footer-col--center">
          <h4 className="footer-col__title">Visit Our Showroom</h4>
          <div className="footer-showroom">
            <svg className="footer-showroom__icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>
            <p className="footer-showroom__label">Location</p>
            <p className="footer-showroom__sub">Experience how our solutions work in person</p>
          </div>
        </div>

        {/* Col 3: Company info */}
        <div className="footer-col footer-col--right">
          <div className="write-alignment-wrapper">
            <h4 className="footer-col__title">{siteName}</h4>
            <p className="footer-address">
              {address.split('\n').map((line, i) => (
                <span key={i}>{line}<br /></span>
              ))}
            </p>
          </div>
        </div>

      </div>

      {/* ── Copyright ──────────────────────────────── */}
      <div className="footer-bottom">
        &copy; 2010–{new Date().getFullYear()} powered by 82cart
      </div>

    </footer>
  );
}
