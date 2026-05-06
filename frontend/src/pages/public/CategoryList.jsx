import { useFetch } from '../../hooks/useFetch';
import Card from '../../components/public/Card.jsx';
import Breadcrumb from '../../components/public/Breadcrumb.jsx';

export default function CategoryList() {
  const { data, loading } = useFetch('/public/categories', []);
  return (
    <>
      <div className="page-header">
        <div className="container"><h1>Products</h1></div>
      </div>
      <Breadcrumb items={[{ to: '/', label: 'Home' }, { label: 'Products' }]} />
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          {loading ? <div className="spinner" /> :
            !data?.length ? <div className="empty">No categories yet.</div> :
            <div className="grid grid-cols-3">
              {data.map(c => (
                <Card key={c.id} to={`/products/${c.slug}`} image={c.image_path} title={c.name} subtitle={c.description} />
              ))}
            </div>
          }
        </div>
      </section>
    </>
  );
}
