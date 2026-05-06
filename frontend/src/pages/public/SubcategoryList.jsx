import { useParams } from 'react-router-dom';
import { useFetch } from '../../hooks/useFetch';
import Card from '../../components/public/Card.jsx';
import Breadcrumb from '../../components/public/Breadcrumb.jsx';

export default function SubcategoryList() {
  const { catSlug } = useParams();
  const { data, loading } = useFetch(`/public/categories/${catSlug}`, [catSlug]);
  if (loading) return <div className="spinner" />;
  if (!data) return <div className="empty">Category not found.</div>;
  return (
    <>
      <div className="page-header">
        <div className="container"><h1>{data.name}</h1></div>
      </div>
      <Breadcrumb items={[
        { to: '/', label: 'Home' },
        { to: '/products', label: 'Products' },
        { label: data.name },
      ]} />
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          {!data.subcategories?.length ? (
            <div className="empty">No sub-categories yet.</div>
          ) : (
            <div className="grid grid-cols-3">
              {data.subcategories.map(s => (
                <Card
                  key={s.id}
                  to={`/products/${catSlug}/${s.slug}`}
                  image={s.image_path}
                  title={s.name}
                  subtitle={s.description}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
