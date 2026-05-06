import { useEffect, useState } from 'react';
import { api } from '../api/client';

export function useFetch(path, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    setError(null);
    api.get(path)
      .then(d => { if (!cancel) setData(d); })
      .catch(e => { if (!cancel) setError(e); })
      .finally(() => { if (!cancel) setLoading(false); });
    return () => { cancel = true; };
    // eslint-disable-next-line
  }, deps);

  return { data, error, loading };
}
