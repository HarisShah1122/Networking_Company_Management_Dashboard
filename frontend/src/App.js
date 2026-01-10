import { MantineProvider } from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'dayjs/locale/en';
import dayjs from 'dayjs';
import AppRoutes from './AppRoutes';
import './index.css';

function App() {
  return (
    <MantineProvider>
      <DatesProvider settings={{ locale: 'en', firstDayOfWeek: 0 }}>
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
      </DatesProvider>
    </MantineProvider>
  );
}

export default App;

