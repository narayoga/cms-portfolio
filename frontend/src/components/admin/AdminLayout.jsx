import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './admin.css';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const links = [
    { to: '/admin', label: 'Dashboard', end: true },
    { to: '/admin/categories', label: 'Categories' },
    { to: '/admin/subcategories', label: 'Sub-categories' },
    { to: '/admin/products', label: 'Products' },
    { to: '/admin/projects', label: 'Projects' },
    { to: '/admin/publications', label: 'Publications' },
    { to: '/admin/downloads', label: 'Downloads' },
    { to: '/admin/banners', label: 'Homepage Banners' },
    { to: '/admin/nav-menus', label: 'Navigation Menus' },
    { to: '/admin/service', label: 'Service Page' },
    { to: '/admin/settings', label: 'Site Settings' },
  ];
  if (user?.role === 'admin') links.push({ to: '/admin/users', label: 'Users' });

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">CMS Admin</div>
        <nav className="admin-nav">
          {links.map(l => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => `admin-nav-link ${isActive ? 'is-active' : ''}`}>
              {l.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <div className="text-muted text-small">Signed in as <strong>{user?.name}</strong> ({user?.role})</div>
          <button className="btn btn-outline" onClick={() => { logout(); nav('/admin/login'); }}>Logout</button>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
