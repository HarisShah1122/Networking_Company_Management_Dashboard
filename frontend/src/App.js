import { MantineProvider } from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
import 'dayjs/locale/en';
import dayjs from 'dayjs';
import AppRoutes from './AppRoutes';
import './index.css';

function App() {
  return (
    <MantineProvider>
      <DatesProvider settings={{ locale: 'en', firstDayOfWeek: 0 }}>
        <AppRoutes />
      </DatesProvider>
    </MantineProvider>
  );
}

export default App;

