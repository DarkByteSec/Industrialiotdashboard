import React from 'react';
import { motion } from 'motion/react';
import { Clock, Calendar, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';

export interface AttendanceRecord {
  id: string;
  date: Date;
  checkInTime: string;
  checkOutTime: string;
  status: 'Present' | 'Late' | 'Absent';
  lateDuration: number; // minutes
  overtimeDuration: number; // minutes
  totalWorkHours: number; // hours
}

interface AttendanceHistoryProps {
  records: AttendanceRecord[];
}

export const AttendanceHistory: React.FC<AttendanceHistoryProps> = ({ records }) => {
  const getStatusBadge = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'Present':
        return <Badge className="bg-green-500 hover:bg-green-600">Present</Badge>;
      case 'Late':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-slate-900">Late</Badge>;
      case 'Absent':
        return <Badge variant="destructive">Absent</Badge>;
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes === 0) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getTotalStats = () => {
    const present = records.filter((r) => r.status === 'Present').length;
    const late = records.filter((r) => r.status === 'Late').length;
    const absent = records.filter((r) => r.status === 'Absent').length;
    const totalLate = records.reduce((sum, r) => sum + r.lateDuration, 0);
    const totalOvertime = records.reduce((sum, r) => sum + r.overtimeDuration, 0);
    const avgWorkHours =
      records.length > 0
        ? records.reduce((sum, r) => sum + r.totalWorkHours, 0) / records.length
        : 0;

    return { present, late, absent, totalLate, totalOvertime, avgWorkHours };
  };

  const stats = getTotalStats();

  return (
    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
          <Calendar className="w-5 h-5" />
          Attendance History
        </CardTitle>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Complete attendance records and work hour tracking
        </p>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 dark:bg-green-500/10 p-3 rounded-lg border border-green-200 dark:border-green-500/30"
          >
            <p className="text-xs text-green-700 dark:text-green-400 mb-1">Days Present</p>
            <p className="text-2xl font-bold text-green-900 dark:text-white">{stats.present}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-yellow-50 dark:bg-yellow-500/10 p-3 rounded-lg border border-yellow-200 dark:border-yellow-500/30"
          >
            <p className="text-xs text-yellow-700 dark:text-yellow-400 mb-1">Late Days</p>
            <p className="text-2xl font-bold text-yellow-900 dark:text-white">{stats.late}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-red-50 dark:bg-red-500/10 p-3 rounded-lg border border-red-200 dark:border-red-500/30"
          >
            <p className="text-xs text-red-700 dark:text-red-400 mb-1">Absent Days</p>
            <p className="text-2xl font-bold text-red-900 dark:text-white">{stats.absent}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-blue-50 dark:bg-blue-500/10 p-3 rounded-lg border border-blue-200 dark:border-blue-500/30"
          >
            <p className="text-xs text-blue-700 dark:text-blue-400 mb-1">Avg Work Hours</p>
            <p className="text-2xl font-bold text-blue-900 dark:text-white">
              {stats.avgWorkHours.toFixed(1)}h
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-orange-50 dark:bg-orange-500/10 p-3 rounded-lg border border-orange-200 dark:border-orange-500/30"
          >
            <p className="text-xs text-orange-700 dark:text-orange-400 mb-1">Total Late Time</p>
            <p className="text-2xl font-bold text-orange-900 dark:text-white">
              {formatDuration(stats.totalLate)}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-purple-50 dark:bg-purple-500/10 p-3 rounded-lg border border-purple-200 dark:border-purple-500/30"
          >
            <p className="text-xs text-purple-700 dark:text-purple-400 mb-1">Total Overtime</p>
            <p className="text-2xl font-bold text-purple-900 dark:text-white">
              {formatDuration(stats.totalOvertime)}
            </p>
          </motion.div>
        </div>

        {/* Attendance Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left p-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Date
                  </th>
                  <th className="text-left p-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Check-In
                  </th>
                  <th className="text-left p-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Check-Out
                  </th>
                  <th className="text-left p-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Status
                  </th>
                  <th className="text-left p-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Late Duration
                  </th>
                  <th className="text-left p-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Overtime
                  </th>
                  <th className="text-left p-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Total Hours
                  </th>
                </tr>
              </thead>
            </table>
          </div>
          <ScrollArea className="h-[300px]">
            <table className="w-full">
              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-8 text-slate-500 dark:text-slate-400">
                      No attendance records found
                    </td>
                  </tr>
                ) : (
                  records.map((record, index) => (
                    <motion.tr
                      key={record.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="p-3 text-sm text-slate-900 dark:text-white">
                        {record.date.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="p-3 text-sm text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {record.checkInTime}
                        </div>
                      </td>
                      <td className="p-3 text-sm text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {record.checkOutTime}
                        </div>
                      </td>
                      <td className="p-3">{getStatusBadge(record.status)}</td>
                      <td className="p-3 text-sm text-slate-700 dark:text-slate-300">
                        {record.lateDuration > 0 ? (
                          <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                            <TrendingDown className="w-3 h-3" />
                            {formatDuration(record.lateDuration)}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="p-3 text-sm text-slate-700 dark:text-slate-300">
                        {record.overtimeDuration > 0 ? (
                          <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                            <TrendingUp className="w-3 h-3" />
                            {formatDuration(record.overtimeDuration)}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="p-3 text-sm font-semibold text-slate-900 dark:text-white">
                        {record.totalWorkHours.toFixed(1)}h
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};
