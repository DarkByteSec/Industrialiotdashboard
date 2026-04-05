import React from 'react';
import { motion } from 'motion/react';
import { useWorkers } from '../context/WorkerContext';
import { GlobalNavbar } from '../components/GlobalNavbar';
import { FactoryMap } from '../components/FactoryMap';
import { WorkerCard } from '../components/WorkerCard';
import { FileDown, FileSpreadsheet } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

export const Dashboard: React.FC = () => {
  const { workers } = useWorkers();

  const handleExportExcel = () => {
    toast.success('Exporting all data to Excel...', {
      description: 'Download will start shortly',
    });
  };

  const handleExportPDF = () => {
    toast.success('Exporting all data to PDF...', {
      description: 'Download will start shortly',
    });
  };

  const safeCoun = workers.filter((w) => w.status === 'safe').length;
  const warningCount = workers.filter((w) => w.status === 'warning').length;
  const dangerCount = workers.filter((w) => w.status === 'danger').length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A] transition-colors duration-300">
      {/* Global Navbar */}
      <GlobalNavbar subtitle="Workforce Safety Dashboard" />

      {/* Header with Stats and Export */}
      <div className="bg-white dark:bg-[#1E293B] border-b border-slate-200 dark:border-[#334155] transition-colors duration-300 shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-3">
              <Button
                onClick={handleExportExcel}
                variant="outline"
                className="bg-slate-50 dark:bg-[#334155] border-slate-300 dark:border-[#334155] text-slate-900 dark:text-[#F1F5F9] hover:bg-slate-100 dark:hover:bg-[#475569] transition-all duration-200"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export All (Excel)
              </Button>
              <Button
                onClick={handleExportPDF}
                variant="outline"
                className="bg-slate-50 dark:bg-[#334155] border-slate-300 dark:border-[#334155] text-slate-900 dark:text-[#F1F5F9] hover:bg-slate-100 dark:hover:bg-[#475569] transition-all duration-200"
              >
                <FileDown className="w-4 h-4 mr-2" />
                Export All (PDF)
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 dark:bg-[#22C55E]/10 border border-green-200 dark:border-[#22C55E]/30 rounded-lg p-4 transition-all duration-300 hover:shadow-lg dark:hover:shadow-[0_0_15px_rgba(34,197,94,0.15)]"
            >
              <p className="text-green-700 dark:text-[#22C55E] text-sm font-medium">Safe</p>
              <p className="text-2xl font-bold text-green-900 dark:text-[#F1F5F9] mt-1">{safeCoun}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-yellow-50 dark:bg-[#F59E0B]/10 border border-yellow-200 dark:border-[#F59E0B]/30 rounded-lg p-4 transition-all duration-300 hover:shadow-lg dark:hover:shadow-[0_0_15px_rgba(245,158,11,0.15)]"
            >
              <p className="text-yellow-700 dark:text-[#F59E0B] text-sm font-medium">Warning</p>
              <p className="text-2xl font-bold text-yellow-900 dark:text-[#F1F5F9] mt-1">{warningCount}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-red-50 dark:bg-[#EF4444]/10 border border-red-200 dark:border-[#EF4444]/30 rounded-lg p-4 transition-all duration-300 hover:shadow-lg dark:hover:shadow-[0_0_15px_rgba(239,68,68,0.15)]"
            >
              <p className="text-red-700 dark:text-[#EF4444] text-sm font-medium">Danger</p>
              <p className="text-2xl font-bold text-red-900 dark:text-[#F1F5F9] mt-1">{dangerCount}</p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Factory Map Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-slate-900 dark:text-[#F1F5F9] mb-4">Live Factory Map</h2>
          <div className="bg-white dark:bg-[#1E293B] rounded-lg border border-slate-200 dark:border-[#334155] p-4 transition-colors duration-300 shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]" style={{ height: '500px' }}>
            <FactoryMap workers={workers} />
          </div>
        </motion.section>

        {/* Worker Cards Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-slate-900 dark:text-[#F1F5F9] mb-4">Worker Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {workers.map((worker, index) => (
              <motion.div
                key={worker.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
              >
                <WorkerCard worker={worker} />
              </motion.div>
            ))}
          </div>
        </motion.section>
      </main>
    </div>
  );
};