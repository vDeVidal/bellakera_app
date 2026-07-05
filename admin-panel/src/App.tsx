import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AppRouter } from '@/router/AppRouter';
import { useThemeStore } from '@/stores/themeStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30 * 1000,
    },
  },
});

function App() {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    // Aplicar tema al montar
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <AppRouter />
      <Toaster
        theme={theme}
        position="top-right"
        richColors
        toastOptions={{ style: { fontFamily: 'inherit' } }}
      />
    </QueryClientProvider>
  );
}

export default App;