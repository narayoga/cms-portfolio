import { NavLink, Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import './Header.css';

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [siteName, setSiteName] = useState('');
  const [navLinks, setNavLinks] = useState([]);
  const location = useLocation();

  // Transparan hanya di homepage saat belum di-scroll
  const isHero = location.pathname === '/' && !scrolled;

  // Scroll effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Reset scroll state saat pindah halaman
  useEffect(() => {
    setScrolled(window.scrollY > 10);
    setOpen(false);
  }, [location.pathname]);

  // Fetch site name + nav links dari database
  useEffect(() => {
    api.get('/public/settings')
      .then(s => { if (s?.site_name) setSiteName(s.site_name); })
      .catch(() => {});

    api.get('/public/nav-menus')
      .then(menus => { if (menus?.header) setNavLinks(menus.header); })
      .catch(() => {});
  }, []);

  return (
    <header className={`site-header ${isHero ? 'is-hero' : ''} ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="container header-inner">
        <Link to="/" className="logo" onClick={() => setOpen(false)}>
          {siteName || '…'}
        </Link>

        <button
          className="nav-toggle"
          aria-label="Toggle menu"
          onClick={() => setOpen(o => !o)}
        >
          <span /><span /><span />
        </button>

        <nav className={`nav ${open ? 'is-open' : ''}`}>
          {navLinks.map(link => (
            <NavLink
              key={link.id}
              to={link.url}
              end={link.url === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
