import { createBrowserRouter } from 'react-router';
import { Dashboard } from './pages/Dashboard';
import { WorkerDetails } from './pages/WorkerDetails';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Dashboard,
  },
  {
    path: '/worker/:workerId',
    Component: WorkerDetails,
  },
]);
