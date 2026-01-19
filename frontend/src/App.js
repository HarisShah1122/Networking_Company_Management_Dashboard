import { useEffect } from 'react';
import { MantineProvider } from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ToastContainer } from 'react-toastify';
import useAuthStore from './stores/authStore';
import AppRoutes from './AppRoutes';
import { LayoutProvider } from './contexts/LayoutContext';
import { queryClient } from './config/queryClient';
import './index.css';

function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth(); 
  }, [checkAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        <DatesProvider settings={{ locale: 'en', firstDayOfWeek: 0 }}>
          <LayoutProvider>
            <AppRoutes />
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />
          </LayoutProvider>
        </DatesProvider>
      </MantineProvider>
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

export default App;
