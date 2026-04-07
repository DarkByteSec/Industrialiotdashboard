import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert as AlertType, initialWorkers } from '../data/mockData';

export type AlertStatus = 'active' | 'muted' | 'resolved';

export interface Alert extends AlertType {
  workerId: string;
  workerName: string;
  status: AlertStatus;
  soundPlayed: boolean;
  resolvedAt?: Date;
}

interface NotificationContextType {
  notifications: Alert[];
  addNotification: (notification: Alert) => void;
  markAsResolved: (notificationId: string) => void;
  muteNotification: (notificationId: string) => void;
  clearNotification: (notificationId: string) => void;
  globalMute: boolean;
  toggleGlobalMute: () => void;
  unreadCount: number;
  getAlertStatus: (alertId: string) => AlertStatus;
  updateAlertStatus: (alertId: string, status: AlertStatus) => void;
  getResolvedAlerts: () => Alert[];
  getAllAlerts: () => Alert[];
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

// Alert sound URLs - In production, these would be actual sound files
const ALERT_SOUNDS: Record<AlertType['type'], string> = {
  fall: 'critical-alarm', // Loud, fast beeping
  sos: 'emergency-siren', // Urgent siren
  high_temperature: 'warning-tone', // Medium warning
  high_heart_rate: 'warning-tone', // Medium warning
  zone_exit: 'notification-beep', // Soft beep
};

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Alert[]>([]);
  const [resolvedNotifications, setResolvedNotifications] = useState<Alert[]>([]);
  const [globalMute, setGlobalMute] = useState(false);
  const [soundQueue, setSoundQueue] = useState<Set<string>>(new Set());

  // Initialize notifications from worker alerts
  useEffect(() => {
    const initialNotifications: Alert[] = [];
    initialWorkers.forEach((worker) => {
      worker.alerts.forEach((alert) => {
        initialNotifications.push({
          ...alert,
          workerId: worker.id,
          workerName: worker.name,
          status: 'active',
          soundPlayed: false,
        });
      });
    });
    setNotifications(initialNotifications);
  }, []);

  // Subscribe to worker alerts
  useEffect(() => {
    const subscriber = (window as any).__workerAlertSubscriber;
    if (subscriber) {
      subscriber(addNotification);
    }
  }, []);

  // Play alert sounds
  useEffect(() => {
    if (globalMute || soundQueue.size === 0) return;

    soundQueue.forEach((soundType) => {
      playAlertSound(soundType as AlertType['type']);
    });

    setSoundQueue(new Set());
  }, [soundQueue, globalMute]);

  const addNotification = (notification: Alert) => {
    setNotifications((prev) => {
      // Check if notification already exists
      const exists = prev.find((n) => n.id === notification.id);
      if (exists) return prev;

      // Queue sound if not muted and not already played
      if (!globalMute && !notification.soundPlayed && notification.status === 'active') {
        setSoundQueue((queue) => new Set(queue).add(notification.type));
        notification.soundPlayed = true;
      }

      return [notification, ...prev];
    });
  };

  const markAsResolved = (notificationId: string) => {
    setNotifications((prev) => {
      const alert = prev.find((n) => n.id === notificationId);
      if (!alert) return prev;

      // Move to resolved list
      const resolvedAlert = { ...alert, status: 'resolved' as AlertStatus, resolvedAt: new Date() };
      setResolvedNotifications((resolved) => [resolvedAlert, ...resolved]);

      // Remove from active notifications
      return prev.filter((n) => n.id !== notificationId);
    });
  };

  const muteNotification = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, status: 'muted' as AlertStatus } : n
      )
    );
  };

  const clearNotification = (notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  const toggleGlobalMute = () => {
    setGlobalMute((prev) => !prev);
  };

  const getAlertStatus = (alertId: string): AlertStatus => {
    const activeAlert = notifications.find((n) => n.id === alertId);
    if (activeAlert) return activeAlert.status;

    const resolvedAlert = resolvedNotifications.find((n) => n.id === alertId);
    if (resolvedAlert) return 'resolved';

    return 'active';
  };

  const updateAlertStatus = (alertId: string, status: AlertStatus) => {
    if (status === 'resolved') {
      markAsResolved(alertId);
    } else if (status === 'muted') {
      muteNotification(alertId);
    }
  };

  const getResolvedAlerts = () => resolvedNotifications;

  const getAllAlerts = () => [...notifications, ...resolvedNotifications];

  const unreadCount = notifications.filter((n) => n.status === 'active').length;

  // Real alert sound player
  const playAlertSound = (type: AlertType['type']) => {
    const soundType = ALERT_SOUNDS[type] || 'notification-beep';
    const audioPath = `/sounds/${soundType}.mp3`;

    console.log(`🔊 Attempting to play: ${audioPath}`);

    const audio = new Audio(audioPath);

    // الجزء ده هيشتغل لو الملف مش موجود (Error 404)
    audio.onerror = () => {
      console.error(`❌ Sound file is missing! Please make sure you have the file exactly at: public${audioPath}`);
    };

    audio.play().catch(error => {
      console.warn("Autoplay prevented or playback error. User interaction might be needed:", error);
    });
  };
  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        markAsResolved,
        muteNotification,
        clearNotification,
        globalMute,
        toggleGlobalMute,
        unreadCount,
        getAlertStatus,
        updateAlertStatus,
        getResolvedAlerts,
        getAllAlerts,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};