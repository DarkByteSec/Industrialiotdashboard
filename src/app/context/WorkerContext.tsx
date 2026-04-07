import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Worker, initialWorkers, Alert } from '../data/mockData';
// @ts-ignore
import uibuilder from 'node-red-contrib-uibuilder/front-end/uibuilder.esm.js';

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

  // Receive real-time data from Node-RED via uibuilder
  useEffect(() => {
    uibuilder.start();

    uibuilder.onChange('msg', (newMsg: any) => {
      if (newMsg.payload && newMsg.payload.id) {
        const data = newMsg.payload;

        setWorkers((prevWorkers) =>
          prevWorkers.map((worker) => {
            if (worker.id !== data.id) return worker;

            // 1. أخذ البيانات الجديدة لو مبعوتة، أو الاحتفاظ بالقديمة لو مش مبعوتة
            let currentHeartRate = data.heartRate !== undefined ? data.heartRate : worker.heartRate;
            let currentTemp = data.temperature !== undefined ? data.temperature : worker.temperature;
            let currentState = data.state !== undefined ? data.state : worker.state;
            let currentPosition = data.position !== undefined ? data.position : worker.position;
            let currentInZone = data.inZone !== undefined ? data.inZone : worker.inZone;

            // 2. تحديد حالة الخطر بناءً على الداتا الجديدة
            let newStatus = worker.status;
            if (currentState === 'SOS' || currentState === 'Fall Detected' || currentHeartRate > 110 || currentTemp > 37.8) {
              newStatus = 'danger';
            } else if (currentHeartRate > 90 || currentTemp > 37.3) {
              newStatus = 'warning';
            } else {
              newStatus = 'safe';
            }

            // 3. التعديل الذكي: التأكد إن في خطر "جديد" حصل عشان نطلع صوت ونسجله
            let shouldAlert = false;
            let alertType = 'high_heart_rate';
            let alertMsg = '';

            if (currentState === 'SOS' && worker.state !== 'SOS') {
              shouldAlert = true; alertType = 'sos'; alertMsg = 'SOS Button Pressed';
            } else if (currentState === 'Fall Detected' && worker.state !== 'Fall Detected') {
              shouldAlert = true; alertType = 'fall'; alertMsg = 'Fall Detected';
            } else if (currentHeartRate > 110 && worker.heartRate <= 110) {
              shouldAlert = true; alertType = 'high_heart_rate'; alertMsg = `Heart rate elevated to ${Math.round(currentHeartRate)} BPM`;
            } else if (currentTemp > 37.8 && worker.temperature <= 37.8) {
              shouldAlert = true; alertType = 'high_temperature'; alertMsg = `Body temperature elevated to ${currentTemp}°C`;
            }

            let updatedAlerts = [...worker.alerts];

            // لو في أي خطر من اللي فوق لسه حاصل حالا، طلع الصوت وسجله في الـ Charts
            if (notificationCallback && shouldAlert) {
              const newAlert = {
                id: `alert-${Date.now()}-${worker.id}`,
                type: alertType as any,
                message: alertMsg,
                timestamp: new Date(),
              };
              updatedAlerts = [newAlert, ...updatedAlerts];
              notificationCallback({ ...newAlert, workerId: worker.id, workerName: worker.name, status: 'active' });
            }

            // 4. حفظ وتحديث بيانات العامل بالكامل
            return {
              ...worker,
              heartRate: Math.round(currentHeartRate),
              temperature: Math.round(currentTemp * 10) / 10,
              state: currentState,
              position: currentPosition,
              inZone: currentInZone,
              status: newStatus,
              alerts: updatedAlerts, // عشان الـ Charts تشتغل
            };
          })
        );
      }
    });
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