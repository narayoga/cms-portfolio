import { useParams, Navigate } from 'react-router-dom';

export default function CategoryRedirect() {
  const { catSlug } = useParams();
  return <Navigate to="/products" state={{ openCat: catSlug }} replace />;
}
