import { useParams } from 'react-router-dom';
import { useFetch } from '../../hooks/useFetch';
import { mediaUrl } from '../../api/client';
import SmoothImg from '../../components/public/SmoothImg.jsx';
import RichText from '../../components/public/RichText.jsx';
import { splitTitle } from './PublicationList.jsx';
import './PublicationDetail.css';

function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(String(d).length <= 10 ? `${d}T00:00:00` : d);
  return dt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();
}

export default function PublicationDetail() {
  const { slug } = useParams();
  const { data, loading } = useFetch(`/public/publications/${slug}`, [slug]);
  if (loading) return null;
  if (!data) return <div className="empty">Publication not found.</div>;

  const [head, sub] = splitTitle(data.title);

  return (
    <div className="pubd-page">
      <div className="container pubd-inner">
        <div className="pubd-date">{fmtDate(data.published_at)}</div>
        <h1 className="pubd-title">{head}</h1>
        {sub && <p className="pubd-sub">{sub}</p>}

        {data.cover_image && (
          <div className="pubd-cover">
            <SmoothImg src={mediaUrl(data.cover_image)} alt={head} fetchpriority="high" decoding="async" />
          </div>
        )}

        <div className="pubd-body">
          <RichText html={data.content_html} />
        </div>
      </div>
    </div>
  );
}
