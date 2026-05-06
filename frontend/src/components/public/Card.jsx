import { Link } from 'react-router-dom';
import { mediaUrl } from '../../api/client';

export default function Card({ to, image, title, subtitle, meta }) {
  const Wrap = to ? Link : 'div';
  return (
    <Wrap to={to} className="card">
      <div className="card-img">
        {image ? <img src={mediaUrl(image)} alt={title} loading="lazy" /> : <div style={{height:'100%',background:'var(--color-bg-alt)'}} />}
      </div>
      <div className="card-body">
        {meta && <div className="text-muted text-small text-uppercase" style={{marginBottom:4}}>{meta}</div>}
        <div className="card-title">{title}</div>
        {subtitle && <div className="text-muted text-small">{subtitle}</div>}
      </div>
    </Wrap>
  );
}
