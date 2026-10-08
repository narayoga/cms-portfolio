import { useEffect, useState } from 'react';
import { cachedGet, getCached, isFresh, trackStart, trackEnd } from '../api/cache';

export function useFetch(path, deps = [], { maxAge } = {}) {
  // Seed from cache synchronously so a warm path renders with no spinner flash.
  const seed = getCached(path);
  const [data, setData] = useState(seed ? seed.data : null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(!seed);

  useEffect(() => {
    let cancel = false;
    const entry = getCached(path);

    if (entry) {
      // Show cached data immediately (stale-while-revalidate).
      setData(entry.data);
      setLoading(false);
    } else {
      // Cold path: reset so we don't flash the previous route's data.
      setData(null);
      setLoading(true);
    }
    setError(null);

    // Skip the network entirely when the cached copy is still fresh.
    if (!isFresh(entry, maxAge)) {
      // A cold fetch (nothing cached yet) counts toward the global loading gate
      // so the layout can stay hidden until first content is ready.
      const cold = !entry;
      if (cold) trackStart();
      cachedGet(path, { maxAge })
        .then(d => { if (!cancel) { setData(d); setLoading(false); } })
        .catch(e => { if (!cancel) { setError(e); setLoading(false); } })
        .finally(() => { if (cold) trackEnd(); });
    }

    return () => { cancel = true; };
    // eslint-disable-next-line
  }, deps);

  return { data, error, loading };
}
