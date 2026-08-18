import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { router } from './router';
import { queryClient } from './lib/query-client';
import { api, setAccessToken } from './lib/axios';
import { useAuthStore } from './stores/auth.store';
import { PageSpinner } from './components/ui/Spinner';

export default function App() {
  const { authReady, setAuth, clearAuth, setAuthReady } = useAuthStore();

  useEffect(() => {
    let cancelled = false;

    const bootstrapAuth = async () => {
      try {
        const refreshResponse = await api.post('/auth/refresh', {}, { _skipAuthRefresh: true });
        const refreshedToken = refreshResponse.data.data?.accessToken ?? refreshResponse.data.accessToken;
        if (!refreshedToken) throw new Error('Refresh response did not contain an access token');

        setAccessToken(refreshedToken);
        const meResponse = await api.get('/auth/me');
        const user = meResponse.data.data ?? meResponse.data;

        if (!cancelled) setAuth(user, refreshedToken);
      } catch {
        if (!cancelled) clearAuth();
      } finally {
        if (!cancelled) setAuthReady(true);
      }
    };

    bootstrapAuth();
    return () => {
      cancelled = true;
    };
  }, [clearAuth, setAuth, setAuthReady]);

  if (!authReady) return <PageSpinner />;

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
