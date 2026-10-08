import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useFetch } from '../../hooks/useFetch';
import { mediaUrl } from '../../api/client';
import SmoothImg from '../../components/public/SmoothImg.jsx';
import './ProductList.css';

// Feature media: single image, or a swipeable carousel with arrows when >1 image.
function FeatureMedia({ images, alt }) {
  const [idx, setIdx] = useState(0);
  const startX = useRef(null);

  if (!images || images.length === 0) return <div className="ssc-media-ph" aria-hidden="true" />;
  if (images.length === 1) return <SmoothImg src={mediaUrl(images[0])} alt={alt} loading="lazy" />;

  const go = (d) => setIdx((i) => (i + d + images.length) % images.length);
  const onStart = (e) => { startX.current = e.touches ? e.touches[0].clientX : e.clientX; };
  const onEnd = (e) => {
    if (startX.current == null) return;
    const endX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const dx = endX - startX.current;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    startX.current = null;
  };

  return (
    <div
      className="ssc-carousel"
      onTouchStart={onStart}
      onTouchEnd={onEnd}
      onMouseDown={onStart}
      onMouseUp={onEnd}
    >
      <div className="ssc-carousel-track" style={{ transform: `translateX(-${idx * 100}%)` }}>
        {images.map((src, i) => (
          <div className="ssc-carousel-slide" key={i}>
            <img src={mediaUrl(src)} alt={alt} loading="lazy" draggable="false" />
          </div>
        ))}
      </div>
      <button type="button" className="ssc-carousel-arrow ssc-carousel-prev" onClick={() => go(-1)} aria-label="Previous image">‹</button>
      <button type="button" className="ssc-carousel-arrow ssc-carousel-next" onClick={() => go(1)} aria-label="Next image">›</button>
      <div className="ssc-carousel-dots">
        {images.map((_, i) => (
          <button
            key={i}
            type="button"
            className={`ssc-carousel-dot ${i === idx ? 'is-active' : ''}`}
            onClick={() => setIdx(i)}
            aria-label={`Go to image ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
import './SubcategoryList.css';

const NAV = [
  { id: 'overview', label: 'Overview' },
  { id: 'technical-features', label: 'Technical Features' },
  { id: 'download', label: 'Download' },
];

// Static Download section — identical across all product pages (not from DB).
// Swap this path for the real composite product image when available.
const DOWNLOAD_IMAGE = '/uploads/catalog/placeholder.png';

function ImgPlaceholder() {
  return (
    <div className="subcat-ph" aria-hidden="true">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="8.5" cy="9" r="1.5" fill="currentColor" />
        <path d="M5 17l4.5-4.5L13 16l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

// Renders a feature description: multiple newline-separated lines become a
// bullet list, a single line becomes a paragraph.
function FeatureDesc({ text }) {
  const lines = (text || '').split('\n').map(s => s.trim()).filter(Boolean);
  if (lines.length === 0) return null;
  if (lines.length === 1) return <p className="ssc-feature-text">{lines[0]}</p>;
  return (
    <ul className="ssc-feature-list">
      {lines.map((l, i) => <li key={i}>{l}</li>)}
    </ul>
  );
}

// ── Product page (leaf): cream sticky header + Overview / Technical Features / Download
export function ProductPage({ data }) {
  const [active, setActive] = useState('overview');

  // On this page the global nav is not fixed — it scrolls away and the
  // product header takes over the top. Scoped via a body class.
  useEffect(() => {
    document.body.classList.add('pdp-mode');
    return () => document.body.classList.remove('pdp-mode');
  }, []);

  // Scroll-spy: highlight the nav item for the section currently in view.
  useEffect(() => {
    const onScroll = () => {
      const probe = 140;
      let current = NAV[0].id;
      for (const n of NAV) {
        const el = document.getElementById(n.id);
        if (el && el.getBoundingClientRect().top <= probe) current = n.id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (e, id) => {
    const el = document.getElementById(id);
    if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth' }); }
  };

  return (
    <div className="ssc-page">

      {/* ── Sticky product header ── */}
      <header className="ssc-header">
        <div className="container ssc-header-inner">
          <div className="ssc-header-brand">
            {data.brand_logo && (
              <SmoothImg className="ssc-brand-logo" src={mediaUrl(data.brand_logo)} alt={`${data.name} logo`} decoding="async" />
            )}
            <span className="ssc-header-title">{data.name}</span>
          </div>
          <nav className="ssc-header-nav" aria-label="Section navigation">
            {NAV.map(item => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={active === item.id ? 'is-active' : ''}
                onClick={(e) => scrollTo(e, item.id)}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      {/* ── Overview / gallery ── */}
      <section className="ssc-overview" id="overview">
        <div className="container">
          <div className="ssc-overview-top">
            <div className="ssc-overview-text">
              <nav className="ssc-breadcrumb" aria-label="Breadcrumb">
                <Link to="/">Home</Link>
                <span className="ssc-sep">»</span>
                <Link to="/products">Catalog</Link>
                <span className="ssc-sep">»</span>
                <span>{data.name}</span>
              </nav>
              <h1 className="ssc-title">{data.name}</h1>
              {data.description && <p className="ssc-desc">{data.description}</p>}
            </div>
            <div className="ssc-overview-media">
              {data.image_path
                ? <SmoothImg src={mediaUrl(data.image_path)} alt={data.name} fetchpriority="high" decoding="async" />
                : <div className="ssc-media-ph" aria-hidden="true" />}
            </div>
          </div>

          {data.advantages?.length > 0 && (
            <ul className="ssc-advantages">
              {data.advantages.map(a => (
                <li key={a.id} className="ssc-advantage">{a.label}</li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ── Technical Features ── */}
      {data.features?.length > 0 && (
        <section className="ssc-tech" id="technical-features">
          <div className="container">
            {data.features.map(f => (
              <article className="ssc-feature" key={f.id}>
                <h2 className="ssc-feature-title">{f.title}</h2>
                <div className="ssc-feature-body">
                  <div className="ssc-feature-media">
                    <FeatureMedia images={f.images} alt={f.title} />
                  </div>
                  <div className="ssc-feature-desc">
                    <FeatureDesc text={f.description} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ── Download (static, same for all products) ── */}
      <section className="ssc-download-section" id="download">
        <div className="container">
          <h2 className="ssc-feature-title">Download</h2>
          <div className="ssc-feature-body">
            <div className="ssc-feature-media">
              <SmoothImg src={mediaUrl(DOWNLOAD_IMAGE)} alt="Product catalog" loading="lazy" />
            </div>
            <div className="ssc-download-info">
              <p className="ssc-download-text">Find Our Product Details in One Place</p>
              <Link to="/download-center" className="ssc-download-btn">Download Center</Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

// ── Group node: a listing of child product pages (SubcategoryList-style)
function GroupListing({ data, basePath }) {
  const items = data.children || [];
  return (
    <div className="subcat-page">
      <header className="subcat-hero">
        <div className="container">
          <div className="subcat-hero-inner">
            <div className="subcat-hero-text">
              <nav className="subcat-breadcrumb" aria-label="Breadcrumb">
                <Link to="/">Home</Link>
                <span className="subcat-sep">»</span>
                <Link to="/products">Catalog</Link>
                <span className="subcat-sep">»</span>
                <Link to={`/products/${data.category_slug}/${data.subcategory_slug}`}>{data.subcategory_name}</Link>
                <span className="subcat-sep">»</span>
                <span>{data.name}</span>
              </nav>
              <h1 className="subcat-hero-title">{data.name}</h1>
              {data.description && <p className="subcat-hero-desc">{data.description}</p>}
            </div>
            <div className="subcat-hero-media">
              {data.image_path
                ? <SmoothImg src={mediaUrl(data.image_path)} alt={data.name} fetchpriority="high" decoding="async" />
                : <ImgPlaceholder />}
            </div>
          </div>
        </div>
      </header>

      <section className="subcat-section">
        <div className="container">
          <h2 className="subcat-section-title">Featured Product</h2>
          {items.length ? (
            <div className="subcat-grid">
              {items.map(item => (
                <Link key={item.id} className="subcat-tile" to={`${basePath}/${item.slug}`}>
                  <div className="subcat-tile-img">
                    {item.image_path
                      ? <SmoothImg src={mediaUrl(item.image_path)} alt={item.name} loading="lazy" />
                      : <ImgPlaceholder />}
                  </div>
                  <div className="subcat-tile-name">{item.name}</div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty">No items yet.</div>
          )}
        </div>
      </section>
    </div>
  );
}

// Route handler for /products/:catSlug/:subSlug/:subSubSlug
export default function ProductList() {
  const { catSlug, subSlug, subSubSlug } = useParams();
  const { data, loading } = useFetch(
    `/public/subsubcategories/${catSlug}/${subSlug}/${subSubSlug}`,
    [catSlug, subSlug, subSubSlug]
  );

  if (loading) return null;
  if (!data) return <div className="empty">Not found.</div>;

  if (data.type === 'group') {
    return <GroupListing data={data} basePath={`/products/${catSlug}/${subSlug}/${subSubSlug}`} />;
  }
  return <ProductPage data={data} />;
}
