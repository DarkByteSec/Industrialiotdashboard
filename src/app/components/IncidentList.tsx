import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Alert } from '../data/mockData';
import { Activity, Heart, Thermometer, Radio, AlertTriangle, Clock, Check, VolumeX } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface IncidentListProps {
  alerts: Alert[];
  selectedIncidentId?: string;
  onIncidentClick?: (incidentId: string) => void;
  onResolve?: (incidentId: string) => void;
  onMute?: (incidentId: string) => void;
  incidentStatuses?: Map<string, 'active' | 'resolved' | 'muted'>;
}

export const IncidentList: React.FC<IncidentListProps> = ({
  alerts,
  selectedIncidentId,
  onIncidentClick,
  onResolve,
  onMute,
  incidentStatuses = new Map(),
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

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

  const getAlertColor = (type: Alert['type']) => {
    if (type === 'fall' || type === 'sos') {
      return {
        bg: 'bg-red-50 dark:bg-red-950/20',
        border: 'border-red-200 dark:border-red-900/30',
        icon: 'text-red-500',
        glow: 'shadow-red-500/20',
      };
    }
    return {
      bg: 'bg-orange-50 dark:bg-orange-950/20',
      border: 'border-orange-200 dark:border-orange-900/30',
      icon: 'text-orange-500',
      glow: 'shadow-orange-500/20',
    };
  };

  const getStatusBadge = (status: 'active' | 'resolved' | 'muted') => {
    switch (status) {
      case 'active':
        return <Badge variant="destructive" className="text-xs">Active</Badge>;
      case 'resolved':
        return <Badge variant="secondary" className="text-xs">Resolved</Badge>;
      case 'muted':
        return <Badge variant="outline" className="text-xs">Muted</Badge>;
    }
  };

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400 p-8">
        <AlertTriangle className="w-12 h-12 mb-2 opacity-50" />
        <p className="text-sm">No incidents recorded</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-2">
        <AnimatePresence>
          {alerts.map((alert) => {
            const colors = getAlertColor(alert.type);
            const status = incidentStatuses.get(alert.id) || 'active';
            const isSelected = selectedIncidentId === alert.id;
            const isHovered = hoveredId === alert.id;

            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{
                  opacity: status === 'resolved' ? 0.6 : 1,
                  scale: isSelected ? 1.02 : 1,
                }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                whileHover={{ x: -4 }}
                transition={{ duration: 0.2 }}
                onHoverStart={() => setHoveredId(alert.id)}
                onHoverEnd={() => setHoveredId(null)}
                onClick={() => onIncidentClick?.(alert.id)}
                className={`
                  relative p-3 rounded-lg border cursor-pointer
                  ${colors.bg} ${colors.border}
                  ${isSelected ? `ring-2 ring-blue-500 ${colors.glow} shadow-lg` : ''}
                  ${status === 'active' ? 'animate-pulse-glow' : ''}
                  transition-all duration-200
                `}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`p-2 rounded-lg bg-white/50 dark:bg-slate-900/50 ${colors.icon}`}>
                    {getAlertIcon(alert.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-2">
                        {alert.message}
                      </p>
                      {getStatusBadge(status)}
                    </div>

                    <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                      <Clock className="w-3 h-3" />
                      {alert.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                {/* Action buttons - show on hover for active incidents */}
                <AnimatePresence>
                  {isHovered && status === 'active' && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700"
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          onResolve?.(alert.id);
                        }}
                        className="flex-1 text-xs h-7 bg-white dark:bg-slate-800 hover:bg-green-50 dark:hover:bg-green-950"
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Resolve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMute?.(alert.id);
                        }}
                        className="flex-1 text-xs h-7 bg-white dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-950"
                      >
                        <VolumeX className="w-3 h-3 mr-1" />
                        Mute
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Pulse effect for active critical alerts */}
                {status === 'active' && (alert.type === 'fall' || alert.type === 'sos') && (
                  <motion.div
                    className="absolute inset-0 rounded-lg border-2 border-red-500 pointer-events-none"
                    animate={{
                      opacity: [0.5, 0, 0.5],
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ScrollArea>
  );
};
