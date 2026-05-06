import { useParams } from 'react-router-dom';
import { useFetch } from '../../hooks/useFetch';
import Card from '../../components/public/Card.jsx';
import Breadcrumb from '../../components/public/Breadcrumb.jsx';

export default function ProductList() {
  const { catSlug, subSlug } = useParams();
  const { data, loading } = useFetch(`/public/subcategories/${catSlug}/${subSlug}`, [catSlug, subSlug]);
  if (loading) return <div className="spinner" />;
  if (!data) return <div className="empty">Sub-category not found.</div>;
  return (
    <>
      <div className="page-header">
        <div className="container"><h1>{data.name}</h1></div>
      </div>
      <Breadcrumb items={[
        { to: '/', label: 'Home' },
        { to: '/products', label: 'Products' },
        { to: `/products/${catSlug}`, label: data.category_name },
        { label: data.name },
      ]} />
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          {!data.products?.length ? (
            <div className="empty">No products yet.</div>
          ) : (
            <div className="grid grid-cols-4">
              {data.products.map(p => (
                <Card
                  key={p.id}
                  to={`/products/${catSlug}/${subSlug}/${p.slug}`}
                  image={p.cover_image}
                  title={p.name}
                  subtitle={p.short_desc}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
