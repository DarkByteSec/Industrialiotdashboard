import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dyvfmqazhtcchnootiuw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5dmZtcWF6aHRjY2hub290aXV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1ODM2OTQsImV4cCI6MjA5MTE1OTY5NH0.fAijnDTQZyEboV_u22zP0pckEUPQetV_rE9WPPlY9NA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== Types (متطابقة مع جداول Supabase) ==========

export interface DBWorker {
  id: string;               // UUID
  full_name: string;
  rfid_tag: string;
  role: string;
  assigned_zone: string;
  created_at: string;
}

export interface DBAttendance {
  id: number;
  worker_id: string;
  work_date: string;
  check_in: string | null;
  check_out: string | null;
  status: string | null;
  late_duration: string | null;
  overtime: string | null;
  total_hours: string | null;
  created_at: string;
}

export interface DBIncident {
  id: number;
  worker_id: string;
  incident_type: string | null;
  severity: string | null;
  description: string | null;
  alert_id_code: string | null;
  recorded_at: string;
}

export interface DBZoneActivity {
  id: number;
  worker_id: string;
  assigned_zone: string | null;
  current_zone: string | null;
  is_inside_zone: number;
  recorded_at: string;
}

export interface DBVitalSigns {
  id: number;
  worker_id: string;
  heart_rate: number | null;
  body_temp: number | null;
  recorded_at: string;
}
