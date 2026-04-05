import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { Worker } from '../data/mockData';
import { Heart, Thermometer, AlertTriangle, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface WorkerCardProps {
  worker: Worker;
}

export const WorkerCard: React.FC<WorkerCardProps> = ({ worker }) => {
  const navigate = useNavigate();

  const getStatusColor = (status: Worker['status']) => {
    switch (status) {
      case 'safe':
        return 'bg-[#22C55E]';
      case 'danger':
        return 'bg-[#EF4444]';
      case 'warning':
        return 'bg-[#F59E0B]';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusBadgeVariant = (status: Worker['status']) => {
    switch (status) {
      case 'safe':
        return 'default';
      case 'danger':
        return 'destructive';
      case 'warning':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStateColor = (state: Worker['state']) => {
    if (state === 'Fall Detected' || state === 'SOS') return 'text-[#EF4444]';
    return 'text-[#22C55E]';
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="bg-white dark:bg-[#1E293B] border-slate-300 dark:border-[#334155] cursor-pointer hover:border-slate-400 dark:hover:border-[#3B82F6] transition-all duration-300 h-full hover:shadow-lg dark:hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
        onClick={() => navigate(`/worker/${worker.id}`)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-[#F1F5F9]">
                {worker.name}
              </CardTitle>
              <p className="text-sm text-slate-600 dark:text-[#94A3B8] mt-1">{worker.id}</p>
            </div>
            <div className="flex items-center gap-2">
              <motion.div
                className={`w-3 h-3 rounded-full ${getStatusColor(worker.status)}`}
                animate={
                  worker.status === 'danger'
                    ? { scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }
                    : {}
                }
                transition={
                  worker.status === 'danger'
                    ? { duration: 1, repeat: Infinity }
                    : {}
                }
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <Badge
              variant={getStatusBadgeVariant(worker.status)}
              className={`capitalize ${
                worker.status === 'safe' 
                  ? 'bg-[#22C55E] hover:bg-[#16A34A]' 
                  : worker.status === 'warning'
                  ? 'bg-[#F59E0B] hover:bg-[#D97706] text-slate-900'
                  : ''
              }`}
            >
              {worker.status}
            </Badge>
            <span className={`text-sm font-semibold ${getStateColor(worker.state)}`}>
              {worker.state}
            </span>
          </div>

          {/* Vitals */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#334155]/50 p-2 rounded transition-all duration-300 hover:bg-slate-200 dark:hover:bg-[#334155]">
              <Heart className="w-4 h-4 text-red-400" />
              <div>
                <p className="text-xs text-slate-600 dark:text-[#94A3B8]">Heart Rate</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-[#F1F5F9]">{worker.heartRate} BPM</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#334155]/50 p-2 rounded transition-all duration-300 hover:bg-slate-200 dark:hover:bg-[#334155]">
              <Thermometer className="w-4 h-4 text-blue-400" />
              <div>
                <p className="text-xs text-slate-600 dark:text-[#94A3B8]">Temp</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-[#F1F5F9]">{worker.temperature}°C</p>
              </div>
            </div>
          </div>

          {/* Zone Info */}
          <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-[#F1F5F9]">
            <Activity className="w-4 h-4 text-slate-500 dark:text-[#94A3B8]" />
            <span className="truncate">{worker.zone}</span>
          </div>

          {/* Alert indicator */}
          {worker.alerts.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-[#F59E0B] bg-orange-100 dark:bg-[#F59E0B]/10 p-2 rounded transition-all duration-300 border border-orange-200 dark:border-[#F59E0B]/30">
              <AlertTriangle className="w-4 h-4" />
              <span>{worker.alerts.length} active alert{worker.alerts.length > 1 ? 's' : ''}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};