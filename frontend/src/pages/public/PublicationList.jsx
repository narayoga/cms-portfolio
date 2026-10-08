import { Link } from 'react-router-dom';
import { useFetch } from '../../hooks/useFetch';
import { mediaUrl } from '../../api/client';
import SmoothImg from '../../components/public/SmoothImg.jsx';
import './PublicationList.css';

function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(String(d).length <= 10 ? `${d}T00:00:00` : d);
  return dt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();
}

// Split "Headline: subtitle" into a bold headline + lighter subtitle.
export function splitTitle(t) {
  const i = (t || '').indexOf(':');
  if (i < 0) return [t || '', ''];
  return [t.slice(0, i + 1), t.slice(i + 1).trim()];
}

export default function PublicationList() {
  const { data, loading } = useFetch('/public/publications?limit=50', []);
  const items = data?.items || [];

  return (
    <div className="pub-page">
      <header className="pub-header">
        <h1 className="pub-title">Featured Publications</h1>
        <p className="pub-sub">
          Stay informed on our current projects and newest product launches with the official announcements published in this space
        </p>
      </header>

      <div className="container">
        {loading ? null :
          !items.length ? <div className="empty">No publications yet.</div> :
          <div className="pub-grid">
            {items.map(p => {
              const [head, sub] = splitTitle(p.title);
              return (
                <Link className="pub-card" to={`/publications/${p.slug}`} key={p.id}>
                  <div className="pub-card-img">
                    {p.cover_image
                      ? <SmoothImg src={mediaUrl(p.cover_image)} alt={head} loading="lazy" />
                      : <div className="pub-card-ph" aria-hidden="true" />}
                  </div>
                  <div className="pub-card-date">{fmtDate(p.published_at)}</div>
                  <h3 className="pub-card-title">{head}</h3>
                  {sub && <p className="pub-card-sub">{sub}</p>}
                </Link>
              );
            })}
          </div>
        }
      </div>
    </div>
  );
}
