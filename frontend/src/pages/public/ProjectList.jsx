import { useFetch } from '../../hooks/useFetch';
import Card from '../../components/public/Card.jsx';

export default function ProjectList() {
  const { data, loading } = useFetch('/public/projects', []);
  return (
    <>
      <div className="page-header">
        <div className="container"><h1>Project References</h1></div>
      </div>
      <section className="section" style={{ paddingTop: 'var(--sp-6)' }}>
        <div className="container">
          {loading ? <div className="spinner" /> :
            !data?.items?.length ? <div className="empty">No projects yet.</div> :
            <div className="grid grid-cols-3">
              {data.items.map(p => (
                <Card key={p.id} to={`/projects/${p.slug}`} image={p.cover_image} title={p.title} meta={p.published_at} />
              ))}
            </div>
          }
        </div>
      </section>
    </>
  );
}
