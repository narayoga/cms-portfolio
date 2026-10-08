import { useParams } from 'react-router-dom';
import { useFetch } from '../../hooks/useFetch';
import { ProductPage } from './ProductList.jsx';

// Route handler for /products/:catSlug/:subSlug/:subSubSlug/:leafSlug
// (a product page nested under a group node)
export default function ProductLeaf() {
  const { catSlug, subSlug, subSubSlug, leafSlug } = useParams();
  const { data, loading } = useFetch(
    `/public/subsubcategories/${catSlug}/${subSlug}/${subSubSlug}/${leafSlug}`,
    [catSlug, subSlug, subSubSlug, leafSlug]
  );

  if (loading) return null;
  if (!data) return <div className="empty">Product not found.</div>;
  return <ProductPage data={data} />;
}
