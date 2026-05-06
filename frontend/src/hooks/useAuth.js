import { useEffect, useState, useCallback } from 'react';
import { api, setToken } from '../api/client';

export function useAuth() {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('cms_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const data = await api.post('/auth/login', { email, password });
      setToken(data.token);
      localStorage.setItem('cms_user', JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setToken('');
    localStorage.removeItem('cms_user');
    setUser(null);
  }, []);

  // Validate token still works on mount
  useEffect(() => {
    if (!user) return;
    api.get('/auth/me').catch(() => logout());
  }, []); // eslint-disable-line

  return { user, loading, login, logout };
}
