import ArticleResource from '../../components/admin/ArticleResource.jsx';

export default function Publications() {
  return <ArticleResource endpoint="/admin/publications" label="Publication" />;
}
