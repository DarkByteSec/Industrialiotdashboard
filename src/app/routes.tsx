import { createHashRouter } from 'react-router';
import { Dashboard } from './pages/Dashboard';
import { WorkerDetails } from './pages/WorkerDetails';

const ErrorPage = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900">
    <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">404</h1>
    <p className="text-slate-600 dark:text-slate-400 mb-6">Page Not Found / مسار غير صحيح</p>
    <a href="#/" className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
      Return to Home
    </a>
  </div>
);

export const router = createHashRouter([
  {
    path: '/',
    Component: Dashboard,
  },
  {
    path: '/worker/:workerId',
    Component: WorkerDetails,
  },
]);