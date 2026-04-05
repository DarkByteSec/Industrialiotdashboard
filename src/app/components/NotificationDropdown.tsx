import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, BellOff, Check, VolumeX, X } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export const NotificationDropdown: React.FC = () => {
  const {
    notifications,
    markAsResolved,
    muteNotification,
    clearNotification,
    unreadCount,
  } = useNotifications();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const getAlertIcon = (type: string) => {
    const icons: Record<string, string> = {
      fall: '🤕',
      high_heart_rate: '❤️',
      sos: '🆘',
      high_temperature: '🌡️',
      zone_exit: '📍',
    };
    return icons[type] || '⚠️';
  };

  const getAlertColor = (type: string) => {
    if (type === 'fall' || type === 'sos') return 'text-red-500';
    if (type === 'high_heart_rate' || type === 'high_temperature') return 'text-orange-500';
    return 'text-yellow-500';
  };

  const getStatusBadge = (status: string) => {
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
      default:
        return null;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative transition-all duration-200 hover:bg-slate-100 dark:hover:bg-[#334155]">
          <Bell className="w-5 h-5 text-slate-600 dark:text-[#94A3B8]" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 bg-[#EF4444] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold shadow-lg"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[420px] p-0 bg-white dark:bg-[#1E293B] border-slate-300 dark:border-[#334155] shadow-lg dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
      >
        <div className="p-4 border-b border-slate-300 dark:border-[#334155]">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-[#F1F5F9]">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="bg-[#EF4444]">{unreadCount} Active</Badge>
            )}
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-[#94A3B8]">
              <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="p-2">
              <AnimatePresence>
                {notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{
                      opacity: notification.status === 'resolved' ? 0.6 : 1,
                      x: hoveredId === notification.id ? -8 : 0,
                    }}
                    exit={{ opacity: 0, x: -20, height: 0 }}
                    transition={{ duration: 0.2 }}
                    onHoverStart={() => setHoveredId(notification.id)}
                    onHoverEnd={() => setHoveredId(null)}
                    className={`relative mb-2 p-3 rounded-lg border transition-all duration-200 ${
                      notification.status === 'active'
                        ? 'bg-red-50 dark:bg-[#EF4444]/10 border-red-200 dark:border-[#EF4444]/30 shadow-sm dark:shadow-[0_0_10px_rgba(239,68,68,0.1)]'
                        : 'bg-slate-50 dark:bg-[#334155]/50 border-slate-200 dark:border-[#334155]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl mt-0.5 relative">
                        {getAlertIcon(notification.type)}
                        {notification.status === 'muted' && (
                          <VolumeX className="absolute -bottom-1 -right-1 w-3 h-3 text-[#F59E0B] bg-white dark:bg-[#1E293B] rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="font-semibold text-sm text-slate-900 dark:text-[#F1F5F9]">
                            {notification.workerName}
                          </p>
                          {getStatusBadge(notification.status)}
                        </div>
                        <p className={`text-sm ${getAlertColor(notification.type)} mb-1`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                          {notification.timestamp.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons - visible on hover */}
                    <AnimatePresence>
                      {hoveredId === notification.id && notification.status !== 'resolved' && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-[#334155]"
                        >
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsResolved(notification.id);
                            }}
                            className="flex-1 text-xs bg-white dark:bg-[#334155] hover:bg-green-50 dark:hover:bg-[#22C55E]/20 border-slate-300 dark:border-[#334155] transition-all duration-200"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Resolve
                          </Button>
                          {notification.status === 'active' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                muteNotification(notification.id);
                              }}
                              className="flex-1 text-xs bg-white dark:bg-[#334155] hover:bg-orange-50 dark:hover:bg-[#F59E0B]/20 border-slate-300 dark:border-[#334155] transition-all duration-200"
                            >
                              <VolumeX className="w-3 h-3 mr-1" />
                              Mute
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              clearNotification(notification.id);
                            }}
                            className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-[#475569] transition-all duration-200"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Show clear button for resolved */}
                    {hoveredId === notification.id && notification.status === 'resolved' && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute top-2 right-2"
                      >
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearNotification(notification.id);
                          }}
                          className="h-6 w-6 p-0 hover:bg-slate-100 dark:hover:bg-[#475569] transition-all duration-200"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};