import { Link } from 'react-router-dom';
import { Fragment } from 'react';

export default function Breadcrumb({ items = [] }) {
  return (
    <div className="container">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        {items.map((it, i) => (
          <Fragment key={i}>
            {i > 0 && <span className="sep">/</span>}
            {it.to ? <Link to={it.to}>{it.label}</Link> : <span>{it.label}</span>}
          </Fragment>
        ))}
      </nav>
    </div>
  );
}
