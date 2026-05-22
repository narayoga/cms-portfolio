import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { api, mediaUrl } from '../../api/client';
import './Header.css';

const LOGO_PATH = '/uploads/15_SAG-warna-ri4cltobofltnbnvjndxax4uuic9o83fh7mq7ac1wy.png';

const MEGA_KEYS = ['products', 'services', 'download center'];

// Static left-panel content per mega key. `items` for products is filled from DB.
const MEGA_META = {
  products: { title: 'Solutions', subtitle: 'Solutions For Your Area Of Use', cta: 'Explore Products', ctaUrl: '/products' },
  services: { title: 'Services', subtitle: 'Support For Every Stage', cta: 'Explore Services', ctaUrl: '/services' },
  'download center': { title: 'Downloads', subtitle: 'Resources & Documentation', cta: 'Browse Downloads', ctaUrl: '/download-center' },
};

function ChevronDown() {
  return (
    <svg className="mega-caret" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="8" height="12" viewBox="0 0 8 12" aria-hidden="true">
      <path d="M1 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MegaMenu({ meta, items, onNavigate }) {
  const [activeIdx, setActiveIdx] = useState(null);
  const active = activeIdx !== null ? items[activeIdx] : null;

  return (
    <div className="mega-inner">
      <div className="mega-left">
        <div className="mega-image" />
        <h3 className="mega-title">{meta.title}</h3>
        <p className="mega-subtitle">{meta.subtitle}</p>
        <Link className="mega-cta" to={meta.ctaUrl} onClick={onNavigate}>{meta.cta}</Link>
      </div>

      <div className="mega-right">
        <ul className="mega-col mega-col-primary">
          {items.map((it, i) => (
            <li key={it.label}>
              <button
                type="button"
                className={`mega-item ${i === activeIdx ? 'active' : ''}`}
                onClick={() => setActiveIdx(i === activeIdx ? null : i)}
              >
                <span>{it.label}</span>
                <ChevronRight />
              </button>
            </li>
          ))}
        </ul>

        <ul className="mega-col mega-col-secondary" key={activeIdx ?? 'empty'}>
          {active && active.children.map((c) => (
            <li key={c.url || c.label}>
              <Link className="mega-subitem" to={c.url} onClick={onNavigate}>{c.label}</Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [siteName, setSiteName] = useState('');
  const [navLinks, setNavLinks] = useState([]);
  const [openMega, setOpenMega] = useState(null);
  const [productItems, setProductItems] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  const closeTimer = useRef(null);

  const isHero = location.pathname === '/' && !scrolled && !openMega;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setScrolled(window.scrollY > 10);
    setOpen(false);
    setOpenMega(null);
  }, [location.pathname]);

  useEffect(() => {
    api.get('/public/settings')
      .then(s => { if (s?.site_name) setSiteName(s.site_name); })
      .catch(() => {});

    api.get('/public/nav-menus')
      .then(menus => { if (menus?.header) setNavLinks(menus.header); })
      .catch(() => {});

    api.get('/public/categories')
      .then(cats => {
        if (Array.isArray(cats)) {
          setProductItems(cats.map(c => ({
            label: c.name,
            children: (c.subcategories || []).map(s => ({
              label: s.name,
              url: `/products/${c.slug}/${s.slug}`,
            })),
          })));
        }
      })
      .catch(() => {});
  }, []);

  const scheduleClose = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenMega(null), 150);
  };
  const cancelClose = () => clearTimeout(closeTimer.current);

  const closeAll = () => { setOpen(false); setOpenMega(null); };

  const megaKeyFor = (label) => {
    const k = label?.trim().toLowerCase();
    return MEGA_KEYS.includes(k) ? k : null;
  };

  const itemsFor = (key) => (key === 'products' ? productItems : []);

  const handleAnchor = (e, url) => {
    e.preventDefault();
    closeAll();
    const hash = url.split('#')[1];
    if (!hash) return;
    if (location.pathname === '/') {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(`/#${hash}`);
    }
  };

  return (
    <header
      className={`site-header ${isHero ? 'is-hero' : ''} ${scrolled ? 'is-scrolled' : ''} ${openMega ? 'has-mega-open' : ''}`}
      onMouseLeave={scheduleClose}
    >
      <div className="header-inner">
        <div className="header-col header-left">
          <Link to="/" className="logo" onClick={() => setOpen(false)}>
            <img src={mediaUrl(LOGO_PATH)} alt={siteName || 'Logo'} />
          </Link>
        </div>

        <div className="header-col header-center">
          <button
            className="nav-toggle"
            aria-label="Toggle menu"
            onClick={() => setOpen(o => !o)}
          >
            <span /><span /><span />
          </button>

          <nav className={`nav ${open ? 'is-open' : ''}`}>
            {navLinks.map(link => {
              const mk = megaKeyFor(link.label);
              if (mk) {
                const isOpen = openMega === mk;
                return (
                  <div
                    key={link.id}
                    className={`nav-item has-mega ${isOpen ? 'is-open' : ''}`}
                    onMouseEnter={() => { cancelClose(); setOpenMega(mk); }}
                  >
                    <button
                      type="button"
                      className="nav-link"
                      onClick={() => setOpenMega(isOpen ? null : mk)}
                      aria-expanded={isOpen}
                    >
                      {link.label}
                      <ChevronDown />
                    </button>
                    <div className="mega-wrap" aria-hidden={!isOpen}>
                      <MegaMenu meta={MEGA_META[mk]} items={itemsFor(mk)} onNavigate={closeAll} />
                    </div>
                  </div>
                );
              }

              if (link.url.includes('#')) {
                return (
                  <a
                    key={link.id}
                    href={link.url}
                    className="nav-link"
                    onClick={(e) => handleAnchor(e, link.url)}
                    onMouseEnter={() => { cancelClose(); setOpenMega(null); }}
                  >
                    {link.label}
                  </a>
                );
              }

              return (
                <NavLink
                  key={link.id}
                  to={link.url}
                  end={link.url === '/'}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={closeAll}
                  onMouseEnter={() => { cancelClose(); setOpenMega(null); }}
                >
                  {link.label}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="header-col header-right" />
      </div>
    </header>
  );
}
