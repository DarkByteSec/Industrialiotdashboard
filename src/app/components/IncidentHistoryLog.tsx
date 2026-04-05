import React from 'react';
import { motion } from 'motion/react';
import { Clock, AlertTriangle, Activity, Heart, Thermometer, Radio, VolumeX } from 'lucide-react';
import { Alert } from '../context/NotificationContext';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';

interface IncidentHistoryLogProps {
  alerts: Alert[];
  title?: string;
  description?: string;
}

export const IncidentHistoryLog: React.FC<IncidentHistoryLogProps> = ({
  alerts,
  title = 'Incident History',
  description = 'Read-only log of all incidents and their resolution status',
}) => {
  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'fall':
        return <Activity className="w-4 h-4" />;
      case 'high_heart_rate':
        return <Heart className="w-4 h-4" />;
      case 'sos':
        return <Radio className="w-4 h-4" />;
      case 'high_temperature':
        return <Thermometer className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: Alert['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="destructive" className="text-xs bg-[#EF4444]">Critical</Badge>;
      case 'resolved':
        return <Badge variant="secondary" className="text-xs bg-[#334155] text-[#F1F5F9]">Resolved</Badge>;
      case 'muted':
        return (
          <Badge variant="outline" className="text-xs flex items-center gap-1 border-[#F59E0B] text-[#F59E0B]">
            <VolumeX className="w-3 h-3" />
            Muted
          </Badge>
        );
    }
  };

  const getSeverityColor = (type: Alert['type']) => {
    if (type === 'fall' || type === 'sos') {
      return {
        bg: 'bg-red-50 dark:bg-[#EF4444]/10',
        border: 'border-red-200 dark:border-[#EF4444]/30',
        icon: 'text-[#EF4444]',
      };
    }
    return {
      bg: 'bg-orange-50 dark:bg-[#F59E0B]/10',
      border: 'border-orange-200 dark:border-[#F59E0B]/30',
      icon: 'text-[#F59E0B]',
    };
  };

  const sortedAlerts = [...alerts].sort((a, b) => 
    b.timestamp.getTime() - a.timestamp.getTime()
  );

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-[#F1F5F9]">{title}</h3>
        <p className="text-sm text-slate-600 dark:text-[#94A3B8] mt-1">{description}</p>
      </div>

      {sortedAlerts.length === 0 ? (
        <div className="text-center py-12 text-slate-500 dark:text-[#94A3B8] bg-slate-50 dark:bg-[#334155]/30 rounded-lg border border-slate-200 dark:border-[#334155]">
          <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No incidents recorded</p>
        </div>
      ) : (
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-3">
            {sortedAlerts.map((alert, index) => {
              const colors = getSeverityColor(alert.type);

              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: alert.status === 'resolved' ? 0.7 : 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`
                    p-4 rounded-lg border transition-all duration-300
                    ${colors.bg} ${colors.border}
                    ${alert.status === 'resolved' ? 'opacity-70' : ''}
                    ${alert.status === 'active' ? 'shadow-sm dark:shadow-[0_0_10px_rgba(239,68,68,0.1)]' : ''}
                  `}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`p-2 rounded-lg bg-white dark:bg-[#1E293B]/50 ${colors.icon}`}>
                      {getAlertIcon(alert.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900 dark:text-[#F1F5F9] mb-1">
                            {alert.message}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-[#94A3B8]">
                            <Clock className="w-3 h-3" />
                            <span>{alert.timestamp.toLocaleString()}</span>
                            {alert.resolvedAt && (
                              <>
                                <span>•</span>
                                <span>Resolved: {alert.resolvedAt.toLocaleString()}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {alert.status === 'muted' && (
                            <VolumeX className="w-4 h-4 text-[#F59E0B]" />
                          )}
                          {getStatusBadge(alert.status)}
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-[#94A3B8] mt-2 pt-2 border-t border-slate-200 dark:border-[#334155]">
                        <div>
                          <span className="font-medium">Type:</span>{' '}
                          <span className="capitalize">{alert.type.replace(/_/g, ' ')}</span>
                        </div>
                        <div>
                          <span className="font-medium">ID:</span> <span>{alert.id}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};