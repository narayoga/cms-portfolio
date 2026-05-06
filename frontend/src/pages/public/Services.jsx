import { useFetch } from '../../hooks/useFetch';
import RichText from '../../components/public/RichText.jsx';
import { mediaUrl } from '../../api/client';

export default function Services() {
  const { data, loading } = useFetch('/public/service', []);
  if (loading) return <div className="spinner" />;
  return (
    <>
      {data?.hero_image ? (
        <div style={{ height: 320, position: 'relative', overflow: 'hidden' }}>
          <img src={mediaUrl(data.hero_image)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,32,.5)' }} />
          <div className="container" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
            <h1 style={{ color: '#fff' }}>Services</h1>
          </div>
        </div>
      ) : (
        <div className="page-header">
          <div className="container"><h1>Services</h1></div>
        </div>
      )}
      <section className="section">
        <div className="container" style={{ maxWidth: 860 }}>
          <RichText html={data?.content_html} />
        </div>
      </section>
    </>
  );
}
