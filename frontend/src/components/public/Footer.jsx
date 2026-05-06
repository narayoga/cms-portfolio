import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import './Footer.css';

export default function Footer() {
  const [settings, setSettings] = useState({});
  const [explore, setExplore] = useState([]);
  const [resources, setResources] = useState([]);

  useEffect(() => {
    // Fetch settings (site name, contact info, socials)
    api.get('/public/settings')
      .then(setSettings)
      .catch(() => {});

    // Fetch footer nav links dari database
    api.get('/public/nav-menus')
      .then(menus => {
        if (menus?.footer_explore)   setExplore(menus.footer_explore);
        if (menus?.footer_resources) setResources(menus.footer_resources);
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="site-footer">
      <div className="container footer-grid">

        {/* Kolom 1: info perusahaan */}
        <div>
          <h4 className="footer-title">{settings.site_name || ''}</h4>
          {settings.contact_address && (
            <p className="text-muted text-small">{settings.contact_address}</p>
          )}
          {settings.contact_phone && (
            <p className="text-muted text-small" style={{ marginTop: 4 }}>
              {settings.contact_phone}
            </p>
          )}
          {settings.contact_email && (
            <p className="text-muted text-small" style={{ marginTop: 4 }}>
              {settings.contact_email}
            </p>
          )}
        </div>

        {/* Kolom 2: Explore — dari database */}
        <div>
          <h4 className="footer-title">Explore</h4>
          <ul className="footer-list">
            {explore.map(item => (
              <li key={item.id}>
                <Link to={item.url}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Kolom 3: Resources — dari database */}
        <div>
          <h4 className="footer-title">Resources</h4>
          <ul className="footer-list">
            {resources.map(item => (
              <li key={item.id}>
                <Link to={item.url}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Kolom 4: Social media */}
        <div>
          <h4 className="footer-title">Follow Us</h4>
          <ul className="footer-list">
            {settings.social_facebook && (
              <li>
                <a href={settings.social_facebook} target="_blank" rel="noreferrer">
                  Facebook
                </a>
              </li>
            )}
            {settings.social_instagram && (
              <li>
                <a href={settings.social_instagram} target="_blank" rel="noreferrer">
                  Instagram
                </a>
              </li>
            )}
            {settings.social_linkedin && (
              <li>
                <a href={settings.social_linkedin} target="_blank" rel="noreferrer">
                  LinkedIn
                </a>
              </li>
            )}
          </ul>
        </div>

      </div>

      <div className="footer-bottom">
        <div className="container">
          &copy; {new Date().getFullYear()} {settings.site_name || ''}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
