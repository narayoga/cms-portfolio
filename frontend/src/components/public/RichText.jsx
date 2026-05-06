import DOMPurify from 'dompurify';

export default function RichText({ html, className = 'rich-content' }) {
  const clean = DOMPurify.sanitize(html || '', { ADD_ATTR: ['target', 'rel'] });
  return <div className={className} dangerouslySetInnerHTML={{ __html: clean }} />;
}
