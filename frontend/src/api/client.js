const API = import.meta.env.VITE_API_URL || '/api';
export const MEDIA = import.meta.env.VITE_MEDIA_URL || '';

export function mediaUrl(path) {
  if (!path) return '';
  if (/^https?:/i.test(path)) return path;
  return MEDIA + path;
}

function getToken() {
  return localStorage.getItem('cms_token') || '';
}

export function setToken(t) {
  if (t) localStorage.setItem('cms_token', t);
  else localStorage.removeItem('cms_token');
}

async function request(method, path, body, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  let payload = body;
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(API + path, { method, headers, body: payload });
  let data;
  try { data = await res.json(); } catch { data = null; }
  if (!res.ok || (data && data.ok === false)) {
    const msg = (data && (data.error || data.message)) || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data?.data ?? data;
}

export const api = {
  get:    (p, o) => request('GET', p, null, o),
  post:   (p, b, o) => request('POST', p, b, o),
  put:    (p, b, o) => request('PUT', p, b, o),
  del:    (p, o) => request('DELETE', p, null, o),
  upload: async (file, kind = 'image') => {
    const fd = new FormData();
    fd.append('file', file);
    return request('POST', `/admin/upload?kind=${kind}`, fd);
  },
};
