import { Link } from 'react-router-dom';
import { useFetch } from '../../hooks/useFetch';
import { mediaUrl } from '../../api/client';
import SmoothImg from '../../components/public/SmoothImg.jsx';
import './ProjectList.css';

export default function ProjectList() {
  const { data, loading } = useFetch('/public/projects?limit=50', []);
  const items = data?.items || [];

  return (
    <div className="proj-container">
      {loading ? null :
        !items.length ? <div className="empty">No projects yet.</div> :
        <div className="proj-masonry">
          {items.map(p => (
            <Link className="proj-card" to={`/projects/${p.slug}`} key={p.id}>
              <div className="proj-card-img">
                {p.cover_image
                  ? <SmoothImg src={mediaUrl(p.cover_image)} alt={p.title} loading="lazy" />
                  : <div className="proj-card-ph" aria-hidden="true" />}
              </div>
              {p.published_at && (
                <div className="proj-card-year">Completion Year: {String(p.published_at).slice(0, 4)}</div>
              )}
              <h3 className="proj-card-title">{p.title}</h3>
              {p.category && <div className="proj-card-cat">{p.category}</div>}
            </Link>
          ))}
        </div>
      }
    </div>
  );
}
