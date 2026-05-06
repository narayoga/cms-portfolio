import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="section">
      <div className="container" style={{ textAlign: 'center', paddingBlock: 'var(--sp-8)' }}>
        <h1 style={{ fontSize: '5rem', color: 'var(--color-primary)' }}>404</h1>
        <h2>Page not found</h2>
        <p className="text-muted" style={{ margin: 'var(--sp-4) 0' }}>The page you're looking for doesn't exist.</p>
        <Link to="/" className="btn btn-primary">Back to Home</Link>
      </div>
    </section>
  );
}
