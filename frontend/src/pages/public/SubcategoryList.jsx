import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useFetch } from '../../hooks/useFetch';
import { mediaUrl } from '../../api/client';
import { prefetch, prefetchAllIdle } from '../../api/cache';
import SmoothImg from '../../components/public/SmoothImg.jsx';
import './SubcategoryList.css';

const ssubPath = (cat, sub, ssub) => `/public/subsubcategories/${cat}/${sub}/${ssub}`;

// Images shown on a sub-subcategory (product) page — warmed on hover.
const ssubImages = (d) => [
  d.image_path,
  d.brand_logo,
  ...(d.features || []).map((f) => f.image_path),
  ...(d.children || []).map((c) => c.image_path),
];
const warmSsub = (cat, sub, ssub) => prefetch(ssubPath(cat, sub, ssub), ssubImages);

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

const DUMMY_ITEMS = [
  { id: 'd1', name: 'Item 1', slug: null, image_path: null },
  { id: 'd2', name: 'Item 2', slug: null, image_path: null },
  { id: 'd3', name: 'Item 3', slug: null, image_path: null },
];

export default function SubcategoryList() {
  const { catSlug, subSlug } = useParams();
  const { data, loading } = useFetch(`/public/subcategories/${catSlug}/${subSlug}`, [catSlug, subSlug]);

  // Warm every sub-subcategory page in the background so the next click is instant.
  useEffect(() => {
    const kids = data?.sub_subcategories || [];
    const paths = kids.filter((k) => k.slug).map((k) => ssubPath(catSlug, subSlug, k.slug));
    return prefetchAllIdle(paths);
  }, [data, catSlug, subSlug]);

  if (loading) return null;
  if (!data) return <div className="empty">Category not found.</div>;

  const items = data.sub_subcategories?.length ? data.sub_subcategories : DUMMY_ITEMS;

  return (
    <div className="subcat-page">

      {/* ── Hero ── */}
      <header className="subcat-hero">
        <div className="container">
          <div className="subcat-hero-inner">

            <div className="subcat-hero-text">
              <nav className="subcat-breadcrumb" aria-label="Breadcrumb">
                <Link to="/">Home</Link>
                <span className="subcat-sep">»</span>
                <Link to="/products">Catalog</Link>
                <span className="subcat-sep">»</span>
                <Link to={`/products/${data.category_slug}`}>{data.category_name}</Link>
                <span className="subcat-sep">»</span>
                <span>{data.name}</span>
              </nav>

              <h1 className="subcat-hero-title">{data.name}</h1>

              {data.subtitle && (
                <p className="subcat-hero-subtitle">{data.subtitle}</p>
              )}

              {data.description && (
                <p className="subcat-hero-desc">{data.description}</p>
              )}
            </div>

            <div className="subcat-hero-media">
              {data.image_path
                ? <SmoothImg src={mediaUrl(data.image_path)} alt={data.name} fetchpriority="high" decoding="async" />
                : <ImgPlaceholder />}
            </div>

          </div>
        </div>
      </header>

      {/* ── Featured Products ── */}
      <section className="subcat-section">
        <div className="container">
          <h2 className="subcat-section-title">Featured Products</h2>
          <div className="subcat-grid">
            {items.map((item) => (
              <Link
                key={item.id}
                className="subcat-tile"
                to={item.slug ? `/products/${catSlug}/${subSlug}/${item.slug}` : '#'}
                onMouseEnter={() => item.slug && warmSsub(catSlug, subSlug, item.slug)}
                onFocus={() => item.slug && warmSsub(catSlug, subSlug, item.slug)}
              >
                <div className="subcat-tile-img">
                  {item.image_path
                    ? <SmoothImg src={mediaUrl(item.image_path)} alt={item.name} loading="lazy" />
                    : <ImgPlaceholder />}
                </div>
                <div className="subcat-tile-name">{item.name}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
