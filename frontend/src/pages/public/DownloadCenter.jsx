import { useFetch } from '../../hooks/useFetch';
import { mediaUrl } from '../../api/client';

export default function DownloadCenter() {
  const { data, loading } = useFetch('/public/downloads', []);
  return (
    <>
      <div className="page-header">
        <div className="container"><h1>Download Center</h1></div>
      </div>
      <section className="section">
        <div className="container">
          {loading ? <div className="spinner" /> : (
            !data || data.length === 0 ? (
              <div className="empty">No downloads available yet.</div>
            ) : (
              <div className="grid grid-cols-3">
                {data.map(d => (
                  <div key={d.id} className="card">
                    <div className="card-img">
                      {d.image_path
                        ? <img src={mediaUrl(d.image_path)} alt={d.title} />
                        : <div style={{ height: '100%', background: 'var(--color-bg-alt)' }} />}
                    </div>
                    <div className="card-body">
                      <div className="card-title">{d.title}</div>
                      {d.description && <p className="text-muted text-small" style={{ marginBottom: 'var(--sp-3)' }}>{d.description}</p>}
                      {d.file_path && (
                        <a className="btn btn-primary" href={mediaUrl(d.file_path)} download target="_blank" rel="noreferrer">
                          Download
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </section>
    </>
  );
}
