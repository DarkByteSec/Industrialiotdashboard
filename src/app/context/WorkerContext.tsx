import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Worker, Alert } from '../data/mockData';
import { supabase, DBWorker, DBVitalSigns, DBIncident } from '../lib/supabase';

// vite alias بيحوّل الـ import ده لـ stub في dev،
// وفي Node-RED build الـ uibuilder الحقيقي بيتحمّل من الـ window
import uibuilder from 'uibuilder';

// ─── حوّل incident_type من Supabase لـ Alert type ───
function mapIncidentType(t: string | null): Alert['type'] {
  if (!t) return 'high_heart_rate';
  const lower = t.toLowerCase();
  if (lower.includes('fall'))        return 'fall';
  if (lower.includes('sos'))         return 'sos';
  if (lower.includes('temp'))        return 'high_temperature';
  if (lower.includes('zone'))        return 'zone_exit';
  return 'high_heart_rate';
}

// ─── حوّل DBWorker → Worker (بدون vitals، بيتملوا بعدين) ───
function dbWorkerToFrontend(db: DBWorker): Worker {
  return {
    id:           db.id,
    name:         db.full_name,
    status:       'safe',
    heartRate:    0,
    temperature:  0,
    state:        'Normal',
    attendance:   'Present',
    position:     { x: 100, y: 100 },
    zone:         db.assigned_zone,
    inZone:       true,
    lastActivity: 'Awaiting data...',
    alerts:       [],
  };
}

// ─── احسب status من vitals ───
function calcStatus(hr: number, temp: number, state: string): Worker['status'] {
  if (state === 'SOS' || state === 'Fall Detected' || hr > 110 || temp > 37.8) return 'danger';
  if (hr > 90 || temp > 37.3) return 'warning';
  return 'safe';
}

// ─── Context Type ───
interface WorkerContextType {
  workers:              Worker[];
  loading:              boolean;
  updateWorkerPosition: (workerId: string, position: { x: number; y: number }) => void;
  updateWorkerVitals:   (workerId: string, updates: Partial<Worker>) => void;
  getWorkerById:        (workerId: string) => Worker | undefined;
  refetchWorkers:       () => Promise<void>;
}

const WorkerContext = createContext<WorkerContextType | undefined>(undefined);

export const useWorkers = () => {
  const ctx = useContext(WorkerContext);
  if (!ctx) throw new Error('useWorkers must be used within WorkerProvider');
  return ctx;
};

export const WorkerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [workers, setWorkers]                   = useState<Worker[]>([]);
  const [loading, setLoading]                   = useState(true);
  const [notificationCallback, setNotificationCallback] = useState<((n: any) => void) | null>(null);

  // ══════════════════════════════════════════════════════
  //  FETCH: workers + آخر vital signs + incidents لكل عامل
  // ══════════════════════════════════════════════════════
  const fetchWorkers = useCallback(async () => {
    setLoading(true);

    // 1. جيب كل العمال
    const { data: workersData, error: workersError } = await supabase
      .from('workers')
      .select('*')
      .order('created_at', { ascending: true });

    if (workersError) {
      console.error('Workers fetch error:', workersError.message);
      setLoading(false);
      return;
    }

    const dbWorkers = workersData as DBWorker[];

    // 2. جيب آخر vital signs لكل عامل دفعة واحدة
    //    (بنجيب أحدث record لكل worker_id)
    const { data: vitalsData } = await supabase
      .from('vital_signs')
      .select('worker_id, heart_rate, body_temp, recorded_at')
      .order('recorded_at', { ascending: false });

    // خلّي map: worker_id → أحدث vital
    const latestVitals = new Map<string, { hr: number; temp: number }>();
    if (vitalsData) {
      for (const row of vitalsData as DBVitalSigns[]) {
        if (!latestVitals.has(row.worker_id)) {
          latestVitals.set(row.worker_id, {
            hr:   row.heart_rate ?? 0,
            temp: row.body_temp  ?? 0,
          });
        }
      }
    }

    // 3. جيب كل الـ incidents النشطة
    const { data: incidentsData } = await supabase
      .from('incidents')
      .select('*')
      .order('recorded_at', { ascending: false });

    // خلّي map: worker_id → alerts[]
    const workerAlerts = new Map<string, Alert[]>();
    if (incidentsData) {
      for (const inc of incidentsData as DBIncident[]) {
        const alert: Alert = {
          id:        inc.alert_id_code ?? `inc-${inc.id}`,
          type:      mapIncidentType(inc.incident_type),
          message:   inc.description ?? inc.incident_type ?? 'Incident',
          timestamp: new Date(inc.recorded_at),
        };
        const existing = workerAlerts.get(inc.worker_id) ?? [];
        workerAlerts.set(inc.worker_id, [...existing, alert]);
      }
    }

    // 4. جيب آخر attendance لكل عامل
    const { data: attendanceData } = await supabase
      .from('attendance')
      .select('worker_id, status, check_in, check_out')
      .order('work_date', { ascending: false });

    const latestAttendance = new Map<string, string>();
    if (attendanceData) {
      for (const row of attendanceData as any[]) {
        if (!latestAttendance.has(row.worker_id)) {
          // لو check_out موجود = انصرف، لو check_in بس = Present
          const att = row.check_out ? 'Absent' : (row.check_in ? 'Present' : 'Absent');
          latestAttendance.set(row.worker_id, att);
        }
      }
    }

    // 5. دمّج كل الداتا مع بعض
    const enriched: Worker[] = dbWorkers.map((db) => {
      const vitals  = latestVitals.get(db.id);
      const hr      = vitals?.hr   ?? 0;
      const temp    = vitals?.temp ?? 0;
      const alerts  = workerAlerts.get(db.id)    ?? [];
      const attendance = (latestAttendance.get(db.id) ?? 'Present') as 'Present' | 'Absent';

      return {
        ...dbWorkerToFrontend(db),
        heartRate:    Math.round(hr),
        temperature:  Math.round(temp * 10) / 10,
        status:       calcStatus(hr, temp, 'Normal'),
        alerts,
        attendance,
        lastActivity: vitals
          ? `HR: ${Math.round(hr)} BPM | Temp: ${Math.round(temp * 10) / 10}°C`
          : 'No data yet',
      };
    });

    setWorkers(enriched);
    setLoading(false);
  }, []);

  // أول تحميل
  useEffect(() => { fetchWorkers(); }, [fetchWorkers]);

  // ══════════════════════════════════════════════════════
  //  REALTIME: vital_signs INSERT → حدّث العامل مباشرة
  // ══════════════════════════════════════════════════════
  useEffect(() => {
    const channel = supabase
      .channel('vital_signs_live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'vital_signs' },
        (payload) => {
          const row = payload.new as DBVitalSigns;
          applyWorkerUpdate({
            id:          row.worker_id,
            heartRate:   row.heart_rate  ?? undefined,
            temperature: row.body_temp   ?? undefined,
          } as any);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [notificationCallback]);

  // ══════════════════════════════════════════════════════
  //  REALTIME: incidents INSERT → أضف alert للعامل
  // ══════════════════════════════════════════════════════
  useEffect(() => {
    const channel = supabase
      .channel('incidents_live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'incidents' },
        (payload) => {
          const inc = payload.new as DBIncident;
          const newAlert: Alert = {
            id:        inc.alert_id_code ?? `inc-${inc.id}`,
            type:      mapIncidentType(inc.incident_type),
            message:   inc.description ?? 'Incident detected',
            timestamp: new Date(inc.recorded_at),
          };
          setWorkers((prev) =>
            prev.map((w) => {
              if (w.id !== inc.worker_id) return w;
              const updatedAlerts = [newAlert, ...w.alerts];
              if (notificationCallback) {
                notificationCallback({
                  ...newAlert,
                  workerId:   w.id,
                  workerName: w.name,
                  status:     'active',
                });
              }
              return { ...w, alerts: updatedAlerts, status: 'danger' };
            })
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [notificationCallback]);

  // ══════════════════════════════════════════════════════
  //  uibuilder (Node-RED) — شغّال لما الفرونت يتبني
  // ══════════════════════════════════════════════════════
  useEffect(() => {
    uibuilder.start();
    uibuilder.onChange('msg', (newMsg: any) => {
      if (newMsg?.payload?.id) applyWorkerUpdate(newMsg.payload);
    });
  }, [notificationCallback]);

  // Subscribe للتنبيهات
  useEffect(() => {
    (window as any).__workerAlertSubscriber = (cb: (n: any) => void) => {
      setNotificationCallback(() => cb);
    };
    return () => { delete (window as any).__workerAlertSubscriber; };
  }, []);

  // ══════════════════════════════════════════════════════
  //  applyWorkerUpdate — مشترك بين Realtime وuibuilder
  // ══════════════════════════════════════════════════════
  const applyWorkerUpdate = (data: Partial<Worker> & { id: string }) => {
    setWorkers((prev) =>
      prev.map((worker) => {
        if (worker.id !== data.id) return worker;

        const hr     = data.heartRate   ?? worker.heartRate;
        const temp   = data.temperature ?? worker.temperature;
        const state  = data.state       ?? worker.state;
        const pos    = data.position    ?? worker.position;
        const inZone = data.inZone      ?? worker.inZone;

        const newStatus = calcStatus(hr, temp, state);

        // كشف حوادث جديدة
        let shouldAlert = false, alertType = 'high_heart_rate', alertMsg = '';
        if      (state === 'SOS'           && worker.state !== 'SOS')           { shouldAlert = true; alertType = 'sos';              alertMsg = 'SOS Button Pressed'; }
        else if (state === 'Fall Detected' && worker.state !== 'Fall Detected') { shouldAlert = true; alertType = 'fall';             alertMsg = 'Fall Detected'; }
        else if (hr > 110  && worker.heartRate  <= 110)                         { shouldAlert = true; alertType = 'high_heart_rate';  alertMsg = `Heart rate elevated to ${Math.round(hr)} BPM`; }
        else if (temp > 37.8 && worker.temperature <= 37.8)                    { shouldAlert = true; alertType = 'high_temperature'; alertMsg = `Body temperature elevated to ${temp}°C`; }

        let updatedAlerts = [...worker.alerts];
        if (notificationCallback && shouldAlert) {
          const newAlert: Alert = {
            id:        `alert-${Date.now()}-${worker.id}`,
            type:      alertType as Alert['type'],
            message:   alertMsg,
            timestamp: new Date(),
          };
          updatedAlerts = [newAlert, ...updatedAlerts];
          notificationCallback({ ...newAlert, workerId: worker.id, workerName: worker.name, status: 'active' });
        }

        return {
          ...worker,
          heartRate:    Math.round(hr),
          temperature:  Math.round(temp * 10) / 10,
          state, position: pos, inZone,
          status:       newStatus,
          alerts:       updatedAlerts,
          lastActivity: `HR: ${Math.round(hr)} BPM | Temp: ${Math.round(temp * 10) / 10}°C`,
        };
      })
    );
  };

  const updateWorkerPosition = (workerId: string, position: { x: number; y: number }) =>
    setWorkers((prev) => prev.map((w) => (w.id === workerId ? { ...w, position } : w)));

  const updateWorkerVitals = (workerId: string, updates: Partial<Worker>) =>
    setWorkers((prev) => prev.map((w) => (w.id === workerId ? { ...w, ...updates } : w)));

  const getWorkerById = (workerId: string) => workers.find((w) => w.id === workerId);

  return (
    <WorkerContext.Provider value={{
      workers, loading,
      updateWorkerPosition, updateWorkerVitals,
      getWorkerById, refetchWorkers: fetchWorkers,
    }}>
      {children}
    </WorkerContext.Provider>
  );
};
