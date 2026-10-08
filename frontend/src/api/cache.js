import { api, mediaUrl } from './client';

// In-memory cache for public (read-only) GET endpoints.
// Two maps solve two problems:
//   - `cache`    keeps responses so navigating back to a page is instant.
//   - `inflight` collapses concurrent identical requests into one network call.
// Admin endpoints intentionally bypass this and keep using `api.get` directly.

const DEFAULT_TTL = 5 * 60_000; // 5 minutes

const cache = new Map();    // path -> { data, time }
const inflight = new Map(); // path -> Promise

export function getCached(path) {
  return cache.get(path); // { data, time } | undefined
}

export function isFresh(entry, maxAge = DEFAULT_TTL) {
  return !!entry && Date.now() - entry.time < maxAge;
}

// Resolve from cache when fresh, share an in-flight request when one is pending,
// otherwise fetch and store. `force` skips the freshness check (still deduped).
export function cachedGet(path, { maxAge = DEFAULT_TTL, force = false } = {}) {
  const hit = cache.get(path);
  if (!force && isFresh(hit, maxAge)) return Promise.resolve(hit.data);
  if (inflight.has(path)) return inflight.get(path);

  const p = api.get(path)
    .then(data => { cache.set(path, { data, time: Date.now() }); return data; })
    .finally(() => inflight.delete(path));
  inflight.set(path, p);
  return p;
}

// Drop one path (or everything) from the cache — e.g. after a mutation.
export function invalidate(path) {
  if (path) cache.delete(path);
  else cache.clear();
}

// ── Prefetch ────────────────────────────────────────────────────────
// Warm an image into the browser's HTTP cache so it's already decoded/available
// when a component renders it. Deduped so we never kick off the same load twice.
const warmedImages = new Set();
export function prefetchImage(pathOrUrl) {
  if (!pathOrUrl) return;
  if (typeof navigator !== 'undefined' && navigator.connection?.saveData) return;
  const url = mediaUrl(pathOrUrl);
  if (!url || warmedImages.has(url)) return;
  warmedImages.add(url);
  const img = new Image();
  img.decoding = 'async';
  img.src = url;
}

// Warm the cache ahead of a likely navigation so the click renders instantly.
// Never gates, never throws, deduped by cachedGet, and skips on data-saver.
// Optional `pickImages(data)` returns image paths to warm alongside the JSON,
// so the destination page appears complete (with images) the moment it opens.
export function prefetch(path, pickImages) {
  if (!path) return;
  if (typeof navigator !== 'undefined' && navigator.connection?.saveData) return;
  const warm = (data) => {
    if (!pickImages || !data) return;
    try { for (const u of pickImages(data) || []) prefetchImage(u); } catch { /* ignore */ }
  };
  const hit = getCached(path);
  if (hit) { warm(hit.data); return; }
  cachedGet(path).then(warm).catch(() => {});
}

// Prefetch a list of paths during idle time, one per idle tick so we never
// fire a burst of requests. Returns a cleanup function to stop early.
export function prefetchAllIdle(paths) {
  if (typeof window === 'undefined') return () => {};
  if (navigator.connection?.saveData) return () => {};

  const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 200));
  const cancel = window.cancelIdleCallback || clearTimeout;
  const queue = paths.filter((p) => p && !getCached(p));
  let handle = null;
  let stopped = false;

  const step = () => {
    if (stopped) return;
    const next = queue.shift();
    if (next) prefetch(next);
    if (queue.length) handle = idle(step);
  };
  handle = idle(step);

  return () => { stopped = true; if (handle != null) cancel(handle); };
}

// ── Global loading gate ─────────────────────────────────────────────
// Counts in-flight *cold* fetches (ones with no data to show yet) so the
// layout can hold the whole page hidden until the first paint is complete.
let pending = 0;
const loadingSubs = new Set();

function notifyLoading() { for (const fn of loadingSubs) fn(pending); }

export function getPending() { return pending; }
export function subscribeLoading(fn) { loadingSubs.add(fn); return () => loadingSubs.delete(fn); }
export function trackStart() { pending++; notifyLoading(); }
export function trackEnd() { pending = Math.max(0, pending - 1); notifyLoading(); }

// Like cachedGet, but a truly cold fetch (no cached value at all) counts toward
// the loading gate. Warm/cached paths resolve instantly and never gate.
export function gatedGet(path, opts) {
  const hit = getCached(path);
  if (hit) return Promise.resolve(hit.data);
  trackStart();
  return cachedGet(path, opts).finally(trackEnd);
}
