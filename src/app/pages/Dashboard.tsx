import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useWorkers } from '../context/WorkerContext';
import { GlobalNavbar } from '../components/GlobalNavbar';
import { FactoryMap } from '../components/FactoryMap';
import { WorkerCard } from '../components/WorkerCard';
import { FileDown, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // <-- التعديل هنا

export const Dashboard: React.FC = () => {
  const { workers, loading, refetchWorkers } = useWorkers();
  
  // 1. هنا ضفنا الـ State اللي بيحفظ إنت دايس على أي فلتر (في البداية بيكون all)
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // 2. ده المتغير اللي بيصفي العمال بناءً على الفلتر اللي إنت مختاره
  const displayedWorkers = workers.filter(w => {
    if (activeFilter === 'all') return true;
    return w.status === activeFilter;
  });

  const handleExportExcel = () => {
    toast.success('Exporting comprehensive data to Excel...');
    
    const dataToExport = workers.map(w => ({
      "Worker ID": w.id,
      "Name": w.name,
      "Current Status": w.status.toUpperCase(),
      "Phone State": w.state,
      "Heart Rate (BPM)": w.heartRate,
      "Temperature (°C)": w.temperature,
      "Factory Zone": w.zone || 'Unknown',
      "Total Incidents": w.alerts.length,
      "Last Activity": w.lastActivity
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "All Workers Live Data");
    XLSX.writeFile(workbook, "Factory_Comprehensive_Report.xlsx");
  };

  const handleExportPDF = () => {
    toast.success('Exporting all data to PDF...');
    const doc = new jsPDF();
    const tableColumn = ["ID", "Name", "Status", "Heart Rate", "Temp", "Zone"];
    const tableRows = workers.map(w => [w.id, w.name, w.status, w.heartRate, w.temperature, w.zone]);

    doc.text("Workers Safety Report", 14, 15);
    // استخدمنا autoTable بالطريقة الصحيحة اللي مش بتضرب إيرور
    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 });
    doc.save(`Factory_Comprehensive_Report.pdf`);
  };

  const allCount = workers.length;
  const safeCount = workers.filter((w) => w.status === 'safe').length;
  const warningCount = workers.filter((w) => w.status === 'warning').length;
  const dangerCount = workers.filter((w) => w.status === 'danger').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 dark:text-slate-400 text-sm">Loading workers from database...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A] transition-colors duration-300">
      <GlobalNavbar subtitle="Workforce Safety Dashboard" />

      <div className="bg-white dark:bg-[#1E293B] border-b border-slate-200 dark:border-[#334155] transition-colors duration-300 shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-3">
              <Button onClick={handleExportExcel} variant="outline" className="bg-slate-50 dark:bg-[#334155] border-slate-300 dark:border-[#334155] text-slate-900 dark:text-[#F1F5F9] hover:bg-slate-100 dark:hover:bg-[#475569] transition-all duration-200">
                <FileSpreadsheet className="w-4 h-4 mr-2" /> Export All (Excel)
              </Button>
              <Button onClick={handleExportPDF} variant="outline" className="bg-slate-50 dark:bg-[#334155] border-slate-300 dark:border-[#334155] text-slate-900 dark:text-[#F1F5F9] hover:bg-slate-100 dark:hover:bg-[#475569] transition-all duration-200">
                <FileDown className="w-4 h-4 mr-2" /> Export All (PDF)
              </Button>
              <Button onClick={refetchWorkers} variant="outline" className="bg-slate-50 dark:bg-[#334155] border-slate-300 dark:border-[#334155] text-slate-900 dark:text-[#F1F5F9] hover:bg-slate-100 dark:hover:bg-[#475569] transition-all duration-200">
                <RefreshCw className="w-4 h-4 mr-2" /> Refresh
              </Button>
            </div>
          </div>

          {/* 3. خلينا المربعات دي تشتغل كزراير، وضفنا مربع الـ All */}
          <div className="grid grid-cols-4 gap-4">
            <motion.div
              onClick={() => setActiveFilter('all')}
              className={`cursor-pointer rounded-lg p-4 transition-all duration-300 hover:shadow-lg ${activeFilter === 'all' ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500' : 'bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700'}`}
            >
              <p className="text-blue-700 dark:text-blue-400 text-sm font-medium">All Workers</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-[#F1F5F9] mt-1">{allCount}</p>
            </motion.div>

            <motion.div
              onClick={() => setActiveFilter('safe')}
              className={`cursor-pointer rounded-lg p-4 transition-all duration-300 hover:shadow-lg ${activeFilter === 'safe' ? 'bg-green-100 dark:bg-[#22C55E]/20 border-2 border-green-500' : 'bg-green-50 dark:bg-[#22C55E]/10 border border-green-200 dark:border-[#22C55E]/30'}`}
            >
              <p className="text-green-700 dark:text-[#22C55E] text-sm font-medium">Safe</p>
              <p className="text-2xl font-bold text-green-900 dark:text-[#F1F5F9] mt-1">{safeCount}</p>
            </motion.div>

            <motion.div
              onClick={() => setActiveFilter('warning')}
              className={`cursor-pointer rounded-lg p-4 transition-all duration-300 hover:shadow-lg ${activeFilter === 'warning' ? 'bg-yellow-100 dark:bg-[#F59E0B]/20 border-2 border-yellow-500' : 'bg-yellow-50 dark:bg-[#F59E0B]/10 border border-yellow-200 dark:border-[#F59E0B]/30'}`}
            >
              <p className="text-yellow-700 dark:text-[#F59E0B] text-sm font-medium">Warning</p>
              <p className="text-2xl font-bold text-yellow-900 dark:text-[#F1F5F9] mt-1">{warningCount}</p>
            </motion.div>

            <motion.div
              onClick={() => setActiveFilter('danger')}
              className={`cursor-pointer rounded-lg p-4 transition-all duration-300 hover:shadow-lg ${activeFilter === 'danger' ? 'bg-red-100 dark:bg-[#EF4444]/20 border-2 border-red-500' : 'bg-red-50 dark:bg-[#EF4444]/10 border border-red-200 dark:border-[#EF4444]/30'}`}
            >
              <p className="text-red-700 dark:text-[#EF4444] text-sm font-medium">Danger</p>
              <p className="text-2xl font-bold text-red-900 dark:text-[#F1F5F9] mt-1">{dangerCount}</p>
            </motion.div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-6 py-8">
        <motion.section className="mb-8">
          <h2 className="text-slate-900 dark:text-[#F1F5F9] mb-4">Live Factory Map</h2>
          <div className="bg-white dark:bg-[#1E293B] rounded-lg border border-slate-200 dark:border-[#334155] p-4 transition-colors duration-300 shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]" style={{ height: '500px' }}>
            {/* 4. خلينا الخريطة تاخد displayedWorkers بدل workers */}
            <FactoryMap workers={displayedWorkers} />
          </div>
        </motion.section>

        <motion.section>
          <h2 className="text-slate-900 dark:text-[#F1F5F9] mb-4">Worker Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* 5. خلينا الكروت تاخد displayedWorkers بدل workers */}
            {displayedWorkers.map((worker, index) => (
              <motion.div
                key={worker.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
              >
                <WorkerCard worker={worker} />
              </motion.div>
            ))}
            {displayedWorkers.length === 0 && (
              <p className="col-span-full text-center text-slate-500 py-8">No workers found in this status.</p>
            )}
          </div>
        </motion.section>
      </main>
    </div>
  );
};