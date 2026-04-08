import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { useWorkers } from '../context/WorkerContext';
import { useNotifications, AlertStatus } from '../context/NotificationContext';
import { GlobalNavbar } from '../components/GlobalNavbar';
import { FactoryMap } from '../components/FactoryMap';
import { ZoneActivityChart } from '../components/ZoneActivityChart';
import { IncidentChart } from '../components/IncidentChart';
import { IncidentHistoryLog } from '../components/IncidentHistoryLog';
import { DataFilterPanel, DateFilterType } from '../components/DataFilterPanel';
import { AttendanceHistory } from '../components/AttendanceHistory';
import { useWorkerDetails } from '../utils/useWorkerDetails';
import {
  filterAttendanceByDateRange,
  getDateRangeForFilter,
} from '../utils/attendanceUtils';
import {
  ArrowLeft,
  Heart,
  Thermometer,
  Activity,
  MapPin,
  User,
  Bell,
  VolumeX,
  Check,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const WorkerDetails: React.FC = () => {
  const { workerId } = useParams<{ workerId: string }>();
  const navigate = useNavigate();
  const { workers, getWorkerById, refetchWorkers } = useWorkers();
  const {
    markAsResolved,
    muteNotification,
    getAlertStatus,
    getAllAlerts,
  } = useNotifications();
  const worker = getWorkerById(workerId || '');

  // ── Supabase data via hook ──
  const {
    attendance: attendanceRecords,
    incidents:  dbIncidents,
    zoneActivity: zoneActivityData,
    loading:    detailsLoading,
    refetch:    refetchDetails,
  } = useWorkerDetails(workerId || '');

  const [selectedIncidentId, setSelectedIncidentId] = useState<string | undefined>();
  const [hoveredAlertId, setHoveredAlertId] = useState<string | null>(null);
  const [filteredAttendance, setFilteredAttendance] = useState(attendanceRecords);
  const [dateFilter, setDateFilter] = useState<{
    type: DateFilterType;
    startDate?: Date;
    endDate?: Date;
  }>({ type: 'month' });

  const handleExportWorkerData = () => {
    if (!worker) return;

    // 1. معلومات العامل الأساسية
    const workerInfo = [{
      "ID": worker.id,
      "Name": worker.name,
      "Status": worker.status,
      "Heart Rate": worker.heartRate,
      "Temperature": worker.temperature,
      "Total Incidents": worker.alerts.length,
    }];

    // 2. سجل الحوادث الخاص بالعامل ده بس
    const incidentHistory = worker.alerts.map(alert => ({
      "Date & Time": new Date(alert.timestamp).toLocaleString(),
      "Incident Type": alert.type,
      "Details": alert.message
    }));

    const wb = XLSX.utils.book_new();
    // عملنا شيتين جوه ملف الإكسيل: واحد لمعلوماته، والتاني لتاريخه
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(workerInfo), "Worker Info");
    if (incidentHistory.length > 0) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(incidentHistory), "Incident History");
    }

    XLSX.writeFile(wb, `${worker.name}_Personal_Report.xlsx`);
  };

  const handleExportWorkerDataPDF = () => {
    if (!worker) return;
    toast.success(`Exporting ${worker.name}'s data to PDF...`);

    const doc = new jsPDF();
    
    // عنوان التقرير وبيانات العامل
    doc.text(`Worker Safety Report: ${worker.name}`, 14, 15);
    doc.setFontSize(11);
    doc.text(`ID: ${worker.id} | Status: ${worker.status.toUpperCase()} | Zone: ${worker.zone}`, 14, 25);

    // جدول تاريخ الحوادث
    if (worker.alerts.length > 0) {
      doc.text("Incident History:", 14, 35);
      const tableColumn = ["Date & Time", "Incident Type", "Details"];
      const tableRows = worker.alerts.map(alert => [
        new Date(alert.timestamp).toLocaleString(),
        alert.type,
        alert.message
      ]);
      
      autoTable(doc, { head: [tableColumn], body: tableRows, startY: 40 });
    } else {
      doc.text("No incidents recorded for this worker.", 14, 35);
    }

    doc.save(`${worker.name}_Personal_Report.pdf`);
  };

  // sync filteredAttendance when Supabase data loads
  useEffect(() => {
    if (attendanceRecords.length > 0) {
      applyDateFilter('month');
    }
  }, [attendanceRecords]);

  const applyDateFilter = (
    filterType: DateFilterType,
    customStart?: Date,
    customEnd?: Date
  ) => {
    let startDate: Date, endDate: Date;

    if (filterType === 'custom' && customStart && customEnd) {
      startDate = customStart;
      endDate = customEnd;
    } else if (filterType !== 'custom') {
      const range = getDateRangeForFilter(filterType);
      startDate = range.startDate;
      endDate = range.endDate;
    } else {
      return;
    }

    const filtered = filterAttendanceByDateRange(attendanceRecords, startDate, endDate);
    setFilteredAttendance(filtered);
    setDateFilter({ type: filterType, startDate, endDate });
  };

  if (!worker) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <p className="text-slate-900 dark:text-white text-xl mb-4">Worker not found</p>
          <Button onClick={() => navigate('/')}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  // Get worker-specific alerts from notification system
  // بدمج الـ alerts اللي من Supabase مع اللي من NotificationContext (realtime)
  const realtimeAlerts = getAllAlerts().filter((alert) => alert.workerId === worker.id);
  const allAlertIds    = new Set(realtimeAlerts.map((a) => a.id));
  const workerAlerts   = [
    ...realtimeAlerts,
    ...dbIncidents
      .filter((inc) => !allAlertIds.has(inc.id))
      .map((inc) => ({ ...inc, workerId: worker.id, workerName: worker.name, status: 'active' as const, soundPlayed: true })),
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const handleExportExcel = () => {
    toast.success(`Exporting ${worker.name}'s data to Excel...`, {
      description: `Date range: ${dateFilter.startDate?.toLocaleDateString()} - ${dateFilter.endDate?.toLocaleDateString()}`,
    });
  };

  const handleExportPDF = () => {
    toast.success(`Exporting ${worker.name}'s data to PDF...`, {
      description: `Date range: ${dateFilter.startDate?.toLocaleDateString()} - ${dateFilter.endDate?.toLocaleDateString()}`,
    });
  };

  const handleImportData = (file: File) => {
    toast.success(`Importing historical data from ${file.name}`, {
      description: 'Processing file and merging with existing data...',
    });
    // In production, parse and merge the file data
  };

  const handleResolveAlert = (alertId: string) => {
    markAsResolved(alertId);
    toast.success('Incident resolved', {
      description: 'Alert has been marked as resolved and moved to history',
    });
  };

  const handleMuteAlert = (alertId: string) => {
    muteNotification(alertId);
    toast.info('Alert muted', {
      description: 'Sound notifications disabled for this alert',
    });
  };

  const getStatusColor = (status: typeof worker.status) => {
    switch (status) {
      case 'safe':
        return 'bg-green-500';
      case 'danger':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: typeof worker.status) => {
    switch (status) {
      case 'safe':
        return <Badge className="bg-green-500 hover:bg-green-600">Safe</Badge>;
      case 'danger':
        return <Badge variant="destructive">Danger</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-slate-900">Warning</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'fall':
        return <Activity className="w-4 h-4" />;
      case 'high_heart_rate':
        return <Heart className="w-4 h-4" />;
      case 'sos':
        return <VolumeX className="w-4 h-4" />;
      case 'high_temperature':
        return <Thermometer className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getAlertStatusFromContext = (alertId: string): AlertStatus => {
    return getAlertStatus(alertId);
  };

  const getAlertStatusBadge = (status: AlertStatus) => {
    switch (status) {
      case 'active':
        return <Badge variant="destructive" className="text-xs">Active</Badge>;
      case 'resolved':
        return <Badge variant="secondary" className="text-xs">Resolved</Badge>;
      case 'muted':
        return (
          <Badge variant="outline" className="text-xs flex items-center gap-1">
            <VolumeX className="w-3 h-3" />
            Muted
          </Badge>
        );
    }
  };

  // Get active alerts (not resolved)
  const activeAlerts = workerAlerts.filter((alert) => alert.status !== 'resolved');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Global Navbar */}
      <GlobalNavbar />

      {/* Worker Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate('/')}
                variant="ghost"
                size="icon"
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <div className="flex items-center gap-3">
                  <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-2xl font-bold text-slate-900 dark:text-white"
                  >
                    {worker.name}
                  </motion.h1>
                  {getStatusBadge(worker.status)}
                </div>
                <p className="text-slate-600 dark:text-slate-400 mt-1">{worker.id} • {worker.zone}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Left Column - Worker Info & Filters */}
          <div className="xl:col-span-1 space-y-6">
            {/* Worker Info Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 transition-colors duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                    <User className="w-5 h-5" />
                    Worker Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Attendance</span>
                    <Badge variant={worker.attendance === 'Present' ? 'default' : 'secondary'}>
                      {worker.attendance}
                    </Badge>
                  </div>
                  <Separator className="bg-slate-200 dark:bg-slate-800" />

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg transition-colors duration-300">
                      <div className={`p-2 rounded-lg ${worker.heartRate > 100 ? 'bg-red-500/20' : 'bg-blue-500/20'}`}>
                        <Heart className={`w-5 h-5 ${worker.heartRate > 100 ? 'text-red-400' : 'text-blue-400'}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-slate-600 dark:text-slate-400">Heart Rate</p>
                        <p className="text-lg font-semibold text-slate-900 dark:text-white">{worker.heartRate} BPM</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg transition-colors duration-300">
                      <div className={`p-2 rounded-lg ${worker.temperature > 37.5 ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
                        <Thermometer className={`w-5 h-5 ${worker.temperature > 37.5 ? 'text-red-400' : 'text-green-400'}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-slate-600 dark:text-slate-400">Body Temperature</p>
                        <p className="text-lg font-semibold text-slate-900 dark:text-white">{worker.temperature}°C</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg transition-colors duration-300">
                      <div className="p-2 rounded-lg bg-purple-500/20">
                        <MapPin className="w-5 h-5 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-slate-600 dark:text-slate-400">Current Zone</p>
                        <p className="text-lg font-semibold text-slate-900 dark:text-white">{worker.zone}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg transition-colors duration-300">
                      <div className={`p-2 rounded-lg ${worker.state !== 'Normal' ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
                        <Activity className={`w-5 h-5 ${worker.state !== 'Normal' ? 'text-red-400' : 'text-green-400'}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-slate-600 dark:text-slate-400">Fall Detection</p>
                        <p className="text-lg font-semibold text-slate-900 dark:text-white">
                          {worker.state === 'Fall Detected' ? 'Yes' : 'No'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-slate-200 dark:bg-slate-800" />

                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Last Known Activity</p>
                    <p className="text-sm text-slate-900 dark:text-white">{worker.lastActivity}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Data Filter Panel */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <DataFilterPanel
                onFilterChange={applyDateFilter}
                onExportExcel={handleExportWorkerData} // <--- ربطناها بالدالة بتاعتك
                onExportPDF={handleExportWorkerDataPDF}
                onImportData={handleImportData}
              />
            </motion.div>
          </div>

          {/* Right Column - Main Content */}
          <div className="xl:col-span-3 space-y-6">
            {/* Mini Map */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 transition-colors duration-300">
                <CardHeader>
                  <CardTitle className="text-slate-900 dark:text-white">Worker Location</CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ height: '400px' }}>
                    <FactoryMap workers={workers} selectedWorkerId={worker.id} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Zone Activity Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 transition-colors duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-slate-900 dark:text-white">Zone Activity Timeline</CardTitle>
                    <Badge variant={worker.inZone ? 'default' : 'secondary'}>
                      {worker.inZone ? 'Inside Zone' : 'Outside Zone'}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Real-time tracking of worker presence in assigned zone
                  </p>
                </CardHeader>
                <CardContent>
                  <ZoneActivityChart data={zoneActivityData} />
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg transition-colors duration-300">
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Current Status</p>
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">
                        {worker.inZone ? 'Inside Zone' : 'Outside Zone'}
                      </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg transition-colors duration-300">
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Assigned Zone</p>
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">{worker.zone}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Incident Analytics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 transition-colors duration-300">
                <CardHeader>
                  <CardTitle className="text-slate-900 dark:text-white">Incident Analytics</CardTitle>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Incident distribution and timeline visualization
                  </p>
                </CardHeader>
                <CardContent>
                  <IncidentChart
                    alerts={activeAlerts}
                    selectedIncidentId={selectedIncidentId}
                    onIncidentClick={setSelectedIncidentId}
                  />
                </CardContent>
              </Card>
            </motion.div>

            {/* Incident History Log (Read-only) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 transition-colors duration-300">
                <CardContent className="p-6">
                  <IncidentHistoryLog alerts={workerAlerts} />
                </CardContent>
              </Card>
            </motion.div>

            {/* Attendance History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <AttendanceHistory records={filteredAttendance} />
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};