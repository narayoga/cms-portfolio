import ArticleResource from '../../components/admin/ArticleResource.jsx';

export default function Projects() {
  return <ArticleResource endpoint="/admin/projects" label="Project" showCategory projectFields />;
}
