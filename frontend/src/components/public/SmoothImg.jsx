import { useState } from 'react';

// 1x1 transparent gif — swapped in on error so a broken URL shows the neutral
// placeholder instead of the browser's broken-image icon + bare alt text.
const TRANSPARENT = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

// Drop-in <img> replacement: shows a shimmer placeholder while loading, fades
// the image in on load, and never renders the alt text as bare text (the CSS
// keeps the element's text transparent). Forwards loading/decoding/fetchpriority.
// Pass `plain` for transparent logos where a grey placeholder box would look
// worse than the image simply fading in (still hides alt text).
export default function SmoothImg({ src, alt = '', className = '', plain = false, onLoad, onError, ...rest }) {
  const [state, setState] = useState('loading'); // loading | loaded | error

  const cls = [
    'smooth-img',
    plain && 'smooth-img--plain',
    state === 'loaded' && 'is-loaded',
    state === 'error' && 'is-error',
    className,
  ].filter(Boolean).join(' ');

  return (
    <img
      src={state === 'error' ? TRANSPARENT : src}
      alt={alt}
      className={cls}
      onLoad={(e) => { setState((s) => (s === 'error' ? s : 'loaded')); onLoad?.(e); }}
      onError={(e) => { setState('error'); onError?.(e); }}
      {...rest}
    />
  );
}
