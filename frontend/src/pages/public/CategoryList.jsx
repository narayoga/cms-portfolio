import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useFetch } from '../../hooks/useFetch';
import { mediaUrl } from '../../api/client';
import { prefetch, prefetchAllIdle } from '../../api/cache';
import SmoothImg from '../../components/public/SmoothImg.jsx';
import './CategoryList.css';

const subPath = (cat, sub) => `/public/subcategories/${cat}/${sub}`;

// Images shown on a subcategory page — warmed on hover so the click is complete.
const subImages = (d) => [
  d.image_path,
  ...(d.sub_subcategories || []).map((s) => s.image_path),
  ...(d.products || []).map((p) => p.cover_image),
];
const warmSub = (cat, sub) => prefetch(subPath(cat, sub), subImages);

function ImgPlaceholder() {
  return (
    <div className="catalog-ph" aria-hidden="true">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="8.5" cy="9" r="1.5" fill="currentColor" />
        <path d="M5 17l4.5-4.5L13 16l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function CatalogAccordion({ categories, activeSlug, openSlug, onToggle }) {
  return (
    <ul className="acc">
      {categories.map((c) => {
        const isActive = c.slug === activeSlug;
        const isOpen = c.slug === openSlug;
        return (
          <li key={c.id} className={`acc-item${isActive ? ' is-active' : ''}${isOpen ? ' is-open' : ''}`}>
            <button
              type="button"
              className="acc-head"
              onClick={() => onToggle(c.slug)}
              aria-expanded={isOpen}
            >
              <span>{c.name}</span>
              <span className="acc-icon" aria-hidden="true" />
            </button>
            {/* Panel is always rendered so it can animate open/closed */}
            <div className="acc-panel-wrap">
              <div className="acc-panel-inner">
                <ul className="acc-panel">
                  {(c.subcategories || []).map((s) => (
                    <li key={s.id}>
                      <Link
                        className="acc-link"
                        to={`/products/${c.slug}/${s.slug}`}
                        onMouseEnter={() => warmSub(c.slug, s.slug)}
                        onFocus={() => warmSub(c.slug, s.slug)}
                      >
                        {s.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default function CategoryList() {
  const location = useLocation();
  const { data, loading } = useFetch('/public/categories', []);
  // activeSlug = category shown on the right/hero (never null once set).
  // openSlug  = which accordion panel is expanded (null = all collapsed).
  const [activeSlug, setActiveSlug] = useState(location.state?.openCat || null);
  const [openSlug, setOpenSlug] = useState(location.state?.openCat || null);

  useEffect(() => {
    if (Array.isArray(data) && data.length > 0) {
      setActiveSlug((s) => s || data[0].slug);
      setOpenSlug((s) => s || data[0].slug);
    }
  }, [data]);

  // Warm every subcategory page in the background so clicking one is instant.
  useEffect(() => {
    if (!Array.isArray(data)) return;
    const paths = data.flatMap((c) =>
      (c.subcategories || []).map((s) => subPath(c.slug, s.slug))
    );
    return prefetchAllIdle(paths);
  }, [data]);

  if (loading) return null;

  const categories = Array.isArray(data) ? data : [];
  const active = categories.find((c) => c.slug === activeSlug) || null;
  const subs = active?.subcategories || [];

  return (
    <div className="catalog">
      <header className="catalog-hero">
        <div className="container catalog-grid3 catalog-hero-inner">
          <div className="catalog-hero-spacer" />
          <h1 className="catalog-hero-title">{active?.name || ''}</h1>
          <div className="catalog-hero-media">
            {active?.image_path
              ? <SmoothImg src={mediaUrl(active.image_path)} alt={active?.name} fetchpriority="high" decoding="async" />
              : <ImgPlaceholder />}
          </div>
        </div>
      </header>

      <div className="container catalog-grid3 catalog-body">
        <aside className="catalog-aside">
          <CatalogAccordion
            categories={categories}
            activeSlug={activeSlug}
            openSlug={openSlug}
            onToggle={(slug) => {
              setActiveSlug(slug);                                   // content stays on last clicked
              setOpenSlug((cur) => (cur === slug ? null : slug));    // panel toggles open/closed
            }}
          />
        </aside>

        <main className="catalog-main">
          {!subs.length ? (
            <div className="empty">No sub-categories yet.</div>
          ) : (
            <div className="catalog-tiles" key={activeSlug}>
              {subs.map((s) => (
                <Link
                  key={s.id}
                  className="catalog-tile"
                  to={`/products/${activeSlug}/${s.slug}`}
                  onMouseEnter={() => warmSub(activeSlug, s.slug)}
                  onFocus={() => warmSub(activeSlug, s.slug)}
                >
                  <div className="catalog-tile-img">
                    {s.image_path
                      ? <SmoothImg src={mediaUrl(s.image_path)} alt={s.name} loading="lazy" />
                      : <ImgPlaceholder />}
                  </div>
                  <div className="catalog-tile-title">{s.name}</div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
