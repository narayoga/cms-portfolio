import DOMPurify from 'dompurify';
import { htmlForDisplay } from '../../api/client';

export default function RichText({ html, className = 'rich-content' }) {
  const clean = DOMPurify.sanitize(htmlForDisplay(html), { ADD_ATTR: ['target', 'rel'] });
  return <div className={className} dangerouslySetInnerHTML={{ __html: clean }} />;
}
