import { useParams } from 'react-router-dom';
import { useFetch } from '../../hooks/useFetch';
import { mediaUrl } from '../../api/client';
import SmoothImg from '../../components/public/SmoothImg.jsx';
import './ProjectDetail.css';

function Spec({ label, value }) {
  if (!value) return null;
  return (
    <div className="pd-spec">
      <div className="pd-spec-label">{label}</div>
      <div className="pd-spec-value">{value}</div>
    </div>
  );
}

export default function ProjectDetail() {
  const { slug } = useParams();
  const { data, loading } = useFetch(`/public/projects/${slug}`, [slug]);
  if (loading) return null;
  if (!data) return <div className="empty">Project not found.</div>;

  const year = data.published_at ? String(data.published_at).slice(0, 4) : null;

  return (
    <div className="pd-page">
      <div className="container">

        <header className="pd-header">
          <h1 className="pd-title">{data.title}</h1>
          {data.location && <p className="pd-location">{data.location}</p>}
        </header>

        {data.cover_image && (
          <div className="pd-cover">
            <SmoothImg src={mediaUrl(data.cover_image)} alt={data.title} fetchpriority="high" decoding="async" />
          </div>
        )}

        <div className="pd-specs">
          <Spec label="Products" value={data.products} />
          <Spec label="Project Type" value={data.category} />
          <Spec label="Completion Year" value={year} />
          <Spec label="Owner" value={data.owner} />
          <Spec label="Architect Consultant" value={data.architect} />
          <Spec label="Main Contractor" value={data.contractor} />
        </div>

      </div>
    </div>
  );
}
