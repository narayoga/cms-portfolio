import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useFetch } from '../../hooks/useFetch';
import { mediaUrl } from '../../api/client';
import SmoothImg from '../../components/public/SmoothImg.jsx';
import './DownloadCenter.css';

const BANNER = '/uploads/site/download-center/web-banner-download-center.jpg';

function DownloadIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 3v9m0 0l-3.5-3.5M10 12l3.5-3.5" />
      <path d="M4 15v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-1" />
    </svg>
  );
}

function DownloadCard({ item }) {
  // Square covers (e.g. Fidelio) get cropped into the portrait shape of the others.
  const cropLB = /fidelio/i.test(item.title || '') || /FIDELIO/i.test(item.image_path || '');
  return (
    <div className="dl-card">
      <div className={`dl-card-cover ${cropLB ? 'is-crop-lb' : ''}`}>
        {item.image_path
          ? <SmoothImg src={mediaUrl(item.image_path)} alt={item.title} loading="lazy" />
          : <div className="dl-card-ph" aria-hidden="true" />}
      </div>
      <div className="dl-card-title">{item.title}</div>
      {item.file_path && (
        <a className="dl-card-download" href={mediaUrl(item.file_path)} download target="_blank" rel="noreferrer">
          <DownloadIcon /> Download
        </a>
      )}
    </div>
  );
}

function DownloadSection({ id, title, items }) {
  return (
    <div className="dl-section" id={id}>
      <h2 className="dl-section-title">{title}</h2>
      {items.length ? (
        <div className="dl-grid">
          {items.map(it => <DownloadCard key={it.id} item={it} />)}
        </div>
      ) : (
        <div className="empty">No items yet.</div>
      )}
    </div>
  );
}

export default function DownloadCenter() {
  const { data, loading } = useFetch('/public/downloads', []);
  const location = useLocation();
  const catalogues = (data || []).filter(d => d.section === 'catalogues');
  const manuals = (data || []).filter(d => d.section === 'manuals');

  // Scroll to the section named in the mega-menu hash (#catalogues / #manuals)
  // once content has loaded. rAF defers past App's scroll-to-top on navigation.
  useEffect(() => {
    if (loading) return;
    const id = location.hash.replace('#', '');
    if (id !== 'catalogues' && id !== 'manuals') return;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      })
    );
  }, [loading, location.hash, location.key]);

  return (
    <div className="dl-page">

      {/* ── Banner ── */}
      <div className="dl-hero" style={{ backgroundImage: `url(${mediaUrl(BANNER)})` }}>
        <div className="container dl-hero-inner">
          <h1 className="dl-hero-title">Product Catalogues and Manuals</h1>
        </div>
      </div>

      <section className="section">
        <div className="container">
          {loading ? null : (
            <>
              <DownloadSection id="catalogues" title="Product Catalogues" items={catalogues} />
              <DownloadSection id="manuals" title="Product Manuals" items={manuals} />
            </>
          )}
        </div>
      </section>
    </div>
  );
}
