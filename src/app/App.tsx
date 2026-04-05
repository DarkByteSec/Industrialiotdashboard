import { RouterProvider } from 'react-router';
import { router } from './routes';
import { ThemeProvider } from './context/ThemeContext';
import { WorkerProvider } from './context/WorkerContext';
import { NotificationProvider } from './context/NotificationContext';
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <WorkerProvider>
          <RouterProvider router={router} />
          <Toaster theme="dark" richColors />
        </WorkerProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}