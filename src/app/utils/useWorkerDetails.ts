import { useState, useEffect, useCallback } from 'react';
import { supabase, DBAttendance, DBIncident, DBZoneActivity } from '../lib/supabase';
import { AttendanceRecord } from '../components/AttendanceHistory';
import { Alert } from '../data/mockData';

// ─── helpers ───────────────────────────────────────────

function mapIncidentType(t: string | null): Alert['type'] {
  if (!t) return 'high_heart_rate';
  const l = t.toLowerCase();
  if (l.includes('fall'))  return 'fall';
  if (l.includes('sos'))   return 'sos';
  if (l.includes('temp'))  return 'high_temperature';
  if (l.includes('zone'))  return 'zone_exit';
  return 'high_heart_rate';
}

function parseDurationMinutes(str: string | null): number {
  if (!str || str === '-' || str === '0m') return 0;
  const hMatch = str.match(/(\d+)h/);
  const mMatch = str.match(/(\d+)m/);
  return (hMatch ? parseInt(hMatch[1]) * 60 : 0) + (mMatch ? parseInt(mMatch[1]) : 0);
}

function parseWorkHours(str: string | null): number {
  if (!str || str === '-') return 0;
  const hMatch = str.match(/(\d+)h/);
  const mMatch = str.match(/(\d+)m/);
  const hrs  = hMatch ? parseInt(hMatch[1]) : 0;
  const mins = mMatch ? parseInt(mMatch[1]) : 0;
  return hrs + mins / 60;
}

// ─── types ─────────────────────────────────────────────

export interface WorkerDetailsData {
  attendance:       AttendanceRecord[];
  incidents:        Alert[];
  zoneActivity:     { time: string; value: number }[];
  loading:          boolean;
  error:            string | null;
  refetch:          () => Promise<void>;
}

// ─── hook ──────────────────────────────────────────────

export function useWorkerDetails(workerId: string): WorkerDetailsData {
  const [attendance,   setAttendance]   = useState<AttendanceRecord[]>([]);
  const [incidents,    setIncidents]    = useState<Alert[]>([]);
  const [zoneActivity, setZoneActivity] = useState<{ time: string; value: number }[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!workerId) return;
    setLoading(true);
    setError(null);

    try {
      // ── 1. Attendance ──────────────────────────────────
      const { data: attData, error: attErr } = await supabase
        .from('attendance')
        .select('*')
        .eq('worker_id', workerId)
        .order('work_date', { ascending: false })
        .limit(90);

      if (attErr) throw new Error(attErr.message);

      const mappedAttendance: AttendanceRecord[] = (attData as DBAttendance[]).map((row) => {
        const checkIn  = row.check_in  ? new Date(row.check_in)  : null;
        const checkOut = row.check_out ? new Date(row.check_out) : null;

        const checkInTime  = checkIn  ? checkIn.toLocaleTimeString('en-US',  { hour: '2-digit', minute: '2-digit' }) : '--:--';
        const checkOutTime = checkOut ? checkOut.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--';

        const lateDuration   = parseDurationMinutes(row.late_duration);
        const totalWorkHours = parseWorkHours(row.total_hours);

        // overtime: فرق total_hours عن 8 ساعات لو أكتر
        const overtimeDuration = totalWorkHours > 8 ? Math.round((totalWorkHours - 8) * 60) : 0;

        return {
          id:              `att-${row.id}`,
          date:            new Date(row.work_date),
          checkInTime,
          checkOutTime,
          status:          (row.status ?? 'Absent') as AttendanceRecord['status'],
          lateDuration,
          overtimeDuration,
          totalWorkHours,
        };
      });

      setAttendance(mappedAttendance);

      // ── 2. Incidents ───────────────────────────────────
      const { data: incData, error: incErr } = await supabase
        .from('incidents')
        .select('*')
        .eq('worker_id', workerId)
        .order('recorded_at', { ascending: false });

      if (incErr) throw new Error(incErr.message);

      const mappedIncidents: Alert[] = (incData as DBIncident[]).map((row) => ({
        id:        row.alert_id_code ?? `inc-${row.id}`,
        type:      mapIncidentType(row.incident_type),
        message:   row.description ?? row.incident_type ?? 'Incident',
        timestamp: new Date(row.recorded_at),
      }));

      setIncidents(mappedIncidents);

      // ── 3. Zone Activity (آخر 30 نقطة) ────────────────
      const { data: zoneData, error: zoneErr } = await supabase
        .from('zone_activity_logs')
        .select('is_inside_zone, recorded_at')
        .eq('worker_id', workerId)
        .order('recorded_at', { ascending: false })
        .limit(30);

      if (zoneErr) throw new Error(zoneErr.message);

      const mappedZone = (zoneData as DBZoneActivity[])
        .reverse()
        .map((row) => ({
          time:  new Date(row.recorded_at).toLocaleTimeString('en-US', {
            hour:   '2-digit',
            minute: '2-digit',
          }),
          value: row.is_inside_zone ?? 0,
        }));

      setZoneActivity(mappedZone);

    } catch (err: any) {
      console.error('useWorkerDetails error:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [workerId]);

  // أول تحميل
  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Realtime: zone_activity_logs جديد لنفس العامل
  useEffect(() => {
    if (!workerId) return;

    const channel = supabase
      .channel(`zone_activity_${workerId}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'zone_activity_logs',
          filter: `worker_id=eq.${workerId}`,
        },
        (payload) => {
          const row = payload.new as DBZoneActivity;
          const newPoint = {
            time:  new Date(row.recorded_at).toLocaleTimeString('en-US', {
              hour: '2-digit', minute: '2-digit',
            }),
            value: row.is_inside_zone ?? 0,
          };
          setZoneActivity((prev) => [...prev.slice(-29), newPoint]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [workerId]);

  // Realtime: incidents جديد لنفس العامل
  useEffect(() => {
    if (!workerId) return;

    const channel = supabase
      .channel(`incidents_${workerId}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'incidents',
          filter: `worker_id=eq.${workerId}`,
        },
        (payload) => {
          const row = payload.new as DBIncident;
          const newAlert: Alert = {
            id:        row.alert_id_code ?? `inc-${row.id}`,
            type:      mapIncidentType(row.incident_type),
            message:   row.description ?? 'Incident detected',
            timestamp: new Date(row.recorded_at),
          };
          setIncidents((prev) => [newAlert, ...prev]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [workerId]);

  return { attendance, incidents, zoneActivity, loading, error, refetch: fetchAll };
}
