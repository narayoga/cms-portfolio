import { useEffect, useState } from 'react';
import { api } from '../../api/client';

export default function Dashboard() {
  const [stats, setStats] = useState({ products: 0, projects: 0, publications: 0, downloads: 0, categories: 0 });
  useEffect(() => {
    Promise.all([
      api.get('/admin/products').then(d => ['products', d.length]),
      api.get('/admin/projects').then(d => ['projects', d.length]),
      api.get('/admin/publications').then(d => ['publications', d.length]),
      api.get('/admin/downloads').then(d => ['downloads', d.length]),
      api.get('/admin/categories').then(d => ['categories', d.length]),
    ]).then(rs => {
      const obj = {};
      rs.forEach(([k, v]) => obj[k] = v);
      setStats(s => ({ ...s, ...obj }));
    }).catch(() => {});
  }, []);

  const cards = [
    ['Categories', stats.categories],
    ['Products', stats.products],
    ['Projects', stats.projects],
    ['Publications', stats.publications],
    ['Downloads', stats.downloads],
  ];

  return (
    <>
      <div className="admin-page-header">
        <h2>Dashboard</h2>
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
        {cards.map(([label, val]) => (
          <div key={label} className="admin-card" style={{ marginBottom: 0 }}>
            <div className="text-muted text-uppercase text-small" style={{ marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{val}</div>
          </div>
        ))}
      </div>
    </>
  );
}
