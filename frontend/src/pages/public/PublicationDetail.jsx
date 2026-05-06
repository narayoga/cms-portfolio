import { useParams } from 'react-router-dom';
import { useFetch } from '../../hooks/useFetch';
import { mediaUrl } from '../../api/client';
import Breadcrumb from '../../components/public/Breadcrumb.jsx';
import RichText from '../../components/public/RichText.jsx';

export default function PublicationDetail() {
  const { slug } = useParams();
  const { data, loading } = useFetch(`/public/publications/${slug}`, [slug]);
  if (loading) return <div className="spinner" />;
  if (!data) return <div className="empty">Publication not found.</div>;
  return (
    <>
      <Breadcrumb items={[
        { to: '/', label: 'Home' },
        { to: '/publications', label: 'Publications' },
        { label: data.title },
      ]} />
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container" style={{ maxWidth: 860 }}>
          <h1 style={{ marginBottom: 'var(--sp-3)' }}>{data.title}</h1>
          <p className="text-muted text-uppercase text-small" style={{ marginBottom: 'var(--sp-5)' }}>{data.published_at}</p>
          {data.cover_image && (
            <img
              src={mediaUrl(data.cover_image)}
              alt={data.title}
              style={{ width: '100%', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--sp-6)' }}
            />
          )}
          <RichText html={data.content_html} />
        </div>
      </section>
    </>
  );
}
