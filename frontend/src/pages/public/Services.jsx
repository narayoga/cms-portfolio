import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { mediaUrl } from '../../api/client';
import SmoothImg from '../../components/public/SmoothImg.jsx';
import './Services.css';

// Mega-menu hash → which tab to activate
const HASH_TO_TAB = { specifications: 'spec', 'after-sales': 'sales' };

const BANNER = '/uploads/site/mega-menu/mega-menu-banner.jpg';
const SPEC_IMAGE = '/uploads/site/services/spesification-and-consultation.webp';
const SALES_IMAGE = '/uploads/site/services/after-sales-service.webp';

function IconTraining() {
  return (
    <svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="8" width="32" height="22" rx="2" />
      <path d="M24 30v8M16 38h16" />
      <circle cx="24" cy="18" r="4" />
      <path d="M24 12v-2M24 26v0M18.7 15l-1.7-1M30.9 20l-1.7-1M18.7 21l-1.7 1M30.9 16l-1.7 1" />
    </svg>
  );
}
function IconSupport() {
  return (
    <svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 34c0-6 4-9 9-9h4" />
      <circle cx="30" cy="20" r="7" />
      <path d="M30 13v-3M30 30v-3M37 20h3M20 20h-3M35 15l2-2M35 25l2 2M25 15l-2-2M25 25l-2 2" />
    </svg>
  );
}
function IconRepair() {
  return (
    <svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M38 14a16 16 0 1 0 4 12" />
      <path d="M42 12v8h-8" />
      <circle cx="24" cy="24" r="5" />
    </svg>
  );
}

const FEATURES = [
  { Icon: IconTraining, title: 'Product Training', text: 'We believe sufficient care must be exercised when installing the materials. We learn in-depth about how products are installed correctly and provide training on the field to ensure the job is done properly.' },
  { Icon: IconSupport, title: 'Technical Support', text: 'Every door should not be treated equally and sometimes different conditions and locations can affect how products perform. Our technical team is equipped with a strong technical background and multiple years of experience to inspect problems that arise on site and identify acceptable solutions.' },
  { Icon: IconRepair, title: 'Product Repair and Replacement', text: 'We are committed to ensure that our products are free of flaws in materials and workmanship. Hence, we provide a reliable warranty service during product usage that repairs and replaces any products and/or spare parts which are defective due to production.' },
];

export default function Services() {
  const [active, setActive] = useState('spec');
  const location = useLocation();
  const sectionRef = useRef(null);

  // React to the mega-menu hash: switch tab, then scroll to the content.
  // rAF defers the scroll so it wins over App's scroll-to-top on navigation.
  useEffect(() => {
    const tab = HASH_TO_TAB[location.hash.replace('#', '')];
    if (!tab) return;
    setActive(tab);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      })
    );
  }, [location.hash, location.key]);

  return (
    <div className="svc-page">

      {/* ── Hero: 90vh banner + tab bar ── */}
      <div className="svc-hero">
        <div className="svc-banner" style={{ backgroundImage: `url(${mediaUrl(BANNER)})` }}>
          <div className="container svc-banner-inner">
            <h1 className="svc-banner-title">
              We are with our customers in every step of the way with our value added services
            </h1>
            <p className="svc-banner-sub">
              Projects always require something more than excellent product quality. Therefore we offer
              holistic door hardware experience by providing product consultation and after sales services.
            </p>
          </div>
        </div>

        <div className="svc-tabs">
          <div className="container svc-tabs-inner">
            <button className={`svc-tab ${active === 'spec' ? 'is-active' : ''}`} onClick={() => setActive('spec')}>
              Specification and Consultancy
            </button>
            <button className={`svc-tab ${active === 'sales' ? 'is-active' : ''}`} onClick={() => setActive('sales')}>
              After Sales Services
            </button>
          </div>
        </div>
      </div>

      {/* ── Tab content ── */}
      <section className="section" ref={sectionRef}>
        <div className="container">

          {active === 'spec' && (
            <div className="svc-panel">
              <h2 className="svc-h2">Specification and Product Consultation</h2>
              <div className="svc-two-col">
                <div className="svc-text">
                  <p>
                    Planning a building project is always a complex and intricate task, involving multiple
                    disciplines and materials to work in harmony. With a strong understanding that every project
                    and each industry is unique, we support architects in <strong>making exact specifications</strong> related
                    to door hardware, entrance systems and electronic locking systems which suit the projects’
                    specific security requirements. Our specifications are <strong>forward-thinking</strong> and <strong>dynamic</strong> –
                    we realize that practices and norms change over time, and hence, we consistently update our
                    knowledge base to ensure our specifications are always current and relevant.
                  </p>
                </div>
                <div className="svc-media">
                  <SmoothImg src={mediaUrl(SPEC_IMAGE)} alt="Specification and product consultation" loading="lazy" decoding="async" />
                </div>
              </div>

              <div className="svc-contact">
                <h3 className="svc-contact-heading">Get in Touch</h3>
                <div className="svc-contact-card">
                  <div className="svc-avatar" aria-hidden="true">
                    <svg viewBox="0 0 64 64" width="64" height="64" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="32" cy="32" r="30" />
                      <circle cx="32" cy="26" r="9" />
                      <path d="M16 50c2-8 8-12 16-12s14 4 16 12" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div className="svc-contact-body">
                    <div className="svc-contact-name">Michael Putra Indrawan</div>
                    <div className="svc-contact-role">Specifications Manager</div>
                    <a className="svc-contact-line" href="tel:+628111709001">
                      <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 3h3l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A15 15 0 0 1 2 5a2 2 0 0 1 2-2z"/></svg>
                      +62 811 1709 001
                    </a>
                    <a className="svc-contact-line" href="mailto:michael@sag-locks.com">
                      <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="2.5" y="4" width="15" height="12" rx="2"/><path d="M3 5l7 5 7-5"/></svg>
                      michael@sag-locks.com
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {active === 'sales' && (
            <div className="svc-panel">
              <h2 className="svc-h2">After Sales Services</h2>
              <div className="svc-two-col">
                <div className="svc-text">
                  <p>
                    We understand that sometimes problems are bound to happen during construction or doors need
                    to be maintained and repaired during usage while allowing for minimal down time. Our
                    after-sales services are here to tackle these issues and relieve you from any unnecessary worries.
                  </p>
                </div>
                <div className="svc-media">
                  <SmoothImg src={mediaUrl(SALES_IMAGE)} alt="After sales services" loading="lazy" decoding="async" />
                </div>
              </div>

              <div className="svc-features">
                {FEATURES.map(({ Icon, title, text }) => (
                  <div className="svc-feature" key={title}>
                    <div className="svc-feature-icon"><Icon /></div>
                    <h4 className="svc-feature-title">{title}</h4>
                    <p className="svc-feature-text">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </section>
    </div>
  );
}
