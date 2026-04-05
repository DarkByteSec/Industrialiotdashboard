import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Worker, initialWorkers, Alert } from '../data/mockData';

interface WorkerContextType {
  workers: Worker[];
  updateWorkerPosition: (workerId: string, position: { x: number; y: number }) => void;
  updateWorkerVitals: (workerId: string, updates: Partial<Worker>) => void;
  getWorkerById: (workerId: string) => Worker | undefined;
}

const WorkerContext = createContext<WorkerContextType | undefined>(undefined);

export const useWorkers = () => {
  const context = useContext(WorkerContext);
  if (!context) {
    throw new Error('useWorkers must be used within WorkerProvider');
  }
  return context;
};

interface WorkerProviderProps {
  children: ReactNode;
}

export const WorkerProvider: React.FC<WorkerProviderProps> = ({ children }) => {
  const [workers, setWorkers] = useState<Worker[]>(initialWorkers);
  const [notificationCallback, setNotificationCallback] = useState<((notification: any) => void) | null>(null);

  // Allow external subscription to worker alerts
  useEffect(() => {
    const handleWorkerAlerts = (callback: (notification: any) => void) => {
      setNotificationCallback(() => callback);
    };

    // Expose to window for notification context to use
    (window as any).__workerAlertSubscriber = handleWorkerAlerts;

    return () => {
      delete (window as any).__workerAlertSubscriber;
    };
  }, []);

  // Simulate real-time worker movement
  useEffect(() => {
    const interval = setInterval(() => {
      setWorkers((prevWorkers) =>
        prevWorkers.map((worker) => {
          // Skip workers in danger state
          if (worker.status === 'danger') return worker;

          // Random small movement
          const dx = (Math.random() - 0.5) * 20;
          const dy = (Math.random() - 0.5) * 20;
          
          const newX = Math.max(30, Math.min(720, worker.position.x + dx));
          const newY = Math.max(30, Math.min(390, worker.position.y + dy));

          return {
            ...worker,
            position: { x: newX, y: newY },
          };
        })
      );
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, []);

  // Simulate real-time vital signs updates
  useEffect(() => {
    const interval = setInterval(() => {
      setWorkers((prevWorkers) =>
        prevWorkers.map((worker) => {
          let newHeartRate = worker.heartRate + (Math.random() - 0.5) * 4;
          let newTemp = worker.temperature + (Math.random() - 0.5) * 0.2;

          // Keep within realistic ranges
          newHeartRate = Math.max(60, Math.min(130, newHeartRate));
          newTemp = Math.max(36, Math.min(39, newTemp));

          // Update status based on vitals
          let newStatus = worker.status;
          let newState = worker.state;

          if (worker.state !== 'Fall Detected' && worker.state !== 'SOS') {
            if (newHeartRate > 110 || newTemp > 37.8) {
              newStatus = 'danger';
            } else if (newHeartRate > 90 || newTemp > 37.3) {
              newStatus = 'warning';
            } else {
              newStatus = 'safe';
            }
          }

          // Trigger notification if status changed to danger or warning
          if (notificationCallback && newStatus !== worker.status && (newStatus === 'danger' || newStatus === 'warning')) {
            const alertType = newHeartRate > 110 ? 'high_heart_rate' : 'high_temperature';
            const notification = {
              id: `alert-${Date.now()}-${worker.id}`,
              workerId: worker.id,
              workerName: worker.name,
              type: alertType,
              message: alertType === 'high_heart_rate' 
                ? `Heart rate elevated to ${Math.round(newHeartRate)} BPM`
                : `Body temperature elevated to ${newTemp.toFixed(1)}°C`,
              timestamp: new Date(),
              status: 'active' as const,
            };
            notificationCallback(notification);
          }

          return {
            ...worker,
            heartRate: Math.round(newHeartRate),
            temperature: Math.round(newTemp * 10) / 10,
            status: newStatus,
            state: newState,
          };
        })
      );
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [notificationCallback]);

  const updateWorkerPosition = (workerId: string, position: { x: number; y: number }) => {
    setWorkers((prev) =>
      prev.map((w) => (w.id === workerId ? { ...w, position } : w))
    );
  };

  const updateWorkerVitals = (workerId: string, updates: Partial<Worker>) => {
    setWorkers((prev) =>
      prev.map((w) => (w.id === workerId ? { ...w, ...updates } : w))
    );
  };

  const getWorkerById = (workerId: string) => {
    return workers.find((w) => w.id === workerId);
  };

  return (
    <WorkerContext.Provider
      value={{
        workers,
        updateWorkerPosition,
        updateWorkerVitals,
        getWorkerById,
      }}
    >
      {children}
    </WorkerContext.Provider>
  );
};