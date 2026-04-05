// Mock data for EyeSafeU Dashboard

export type WorkerStatus = 'safe' | 'danger' | 'warning';
export type WorkerState = 'Normal' | 'Fall Detected' | 'SOS';

export interface Worker {
  id: string;
  name: string;
  status: WorkerStatus;
  heartRate: number;
  temperature: number;
  state: WorkerState;
  attendance: 'Present' | 'Absent';
  position: { x: number; y: number };
  zone: string;
  inZone: boolean;
  lastActivity: string;
  alerts: Alert[];
}

export interface Alert {
  id: string;
  type: 'fall' | 'high_heart_rate' | 'sos' | 'zone_exit' | 'high_temperature';
  message: string;
  timestamp: Date;
}

// Factory zones
export const factoryZones = [
  { id: 'zone1', name: 'Assembly Area', x: 50, y: 50, width: 200, height: 150 },
  { id: 'zone2', name: 'Welding Station', x: 300, y: 50, width: 180, height: 150 },
  { id: 'zone3', name: 'Quality Control', x: 50, y: 250, width: 200, height: 120 },
  { id: 'zone4', name: 'Storage', x: 300, y: 250, width: 180, height: 120 },
  { id: 'zone5', name: 'Packaging', x: 530, y: 50, width: 200, height: 320 },
];

// Initial worker data
export const initialWorkers: Worker[] = [
  {
    id: 'W001',
    name: 'John Smith',
    status: 'safe',
    heartRate: 72,
    temperature: 36.5,
    state: 'Normal',
    attendance: 'Present',
    position: { x: 150, y: 120 },
    zone: 'Assembly Area',
    inZone: true,
    lastActivity: 'Operating machinery',
    alerts: [],
  },
  {
    id: 'W002',
    name: 'Sarah Johnson',
    status: 'danger',
    heartRate: 125,
    temperature: 38.2,
    state: 'SOS',
    attendance: 'Present',
    position: { x: 380, y: 100 },
    zone: 'Welding Station',
    inZone: false,
    lastActivity: 'SOS button pressed',
    alerts: [
      {
        id: 'a1',
        type: 'sos',
        message: 'SOS button activated',
        timestamp: new Date(Date.now() - 300000),
      },
      {
        id: 'a2',
        type: 'high_heart_rate',
        message: 'Heart rate exceeds 120 BPM',
        timestamp: new Date(Date.now() - 600000),
      },
    ],
  },
  {
    id: 'W003',
    name: 'Michael Chen',
    status: 'safe',
    heartRate: 68,
    temperature: 36.8,
    state: 'Normal',
    attendance: 'Present',
    position: { x: 140, y: 300 },
    zone: 'Quality Control',
    inZone: true,
    lastActivity: 'Inspecting products',
    alerts: [],
  },
  {
    id: 'W004',
    name: 'Emily Davis',
    status: 'warning',
    heartRate: 95,
    temperature: 37.4,
    state: 'Normal',
    attendance: 'Present',
    position: { x: 380, y: 300 },
    zone: 'Storage',
    inZone: true,
    lastActivity: 'Moving equipment',
    alerts: [
      {
        id: 'a3',
        type: 'high_temperature',
        message: 'Elevated body temperature detected',
        timestamp: new Date(Date.now() - 900000),
      },
    ],
  },
  {
    id: 'W005',
    name: 'David Martinez',
    status: 'danger',
    heartRate: 110,
    temperature: 36.9,
    state: 'Fall Detected',
    attendance: 'Present',
    position: { x: 630, y: 200 },
    zone: 'Packaging',
    inZone: true,
    lastActivity: 'Fall detected',
    alerts: [
      {
        id: 'a4',
        type: 'fall',
        message: 'Fall detected - immediate attention required',
        timestamp: new Date(Date.now() - 120000),
      },
    ],
  },
  {
    id: 'W006',
    name: 'Lisa Anderson',
    status: 'safe',
    heartRate: 75,
    temperature: 36.6,
    state: 'Normal',
    attendance: 'Present',
    position: { x: 200, y: 150 },
    zone: 'Assembly Area',
    inZone: true,
    lastActivity: 'Assembly work',
    alerts: [],
  },
  {
    id: 'W007',
    name: 'Robert Wilson',
    status: 'safe',
    heartRate: 70,
    temperature: 36.7,
    state: 'Normal',
    attendance: 'Present',
    position: { x: 420, y: 120 },
    zone: 'Welding Station',
    inZone: true,
    lastActivity: 'Welding operations',
    alerts: [],
  },
  {
    id: 'W008',
    name: 'Jennifer Brown',
    status: 'warning',
    heartRate: 88,
    temperature: 37.2,
    state: 'Normal',
    attendance: 'Present',
    position: { x: 150, y: 280 },
    zone: 'Quality Control',
    inZone: true,
    lastActivity: 'Quality checks',
    alerts: [],
  },
];

// Generate historical zone activity data (last 30 data points)
export const generateZoneActivity = (workerId: string, currentInZone: boolean): { time: string; value: number }[] => {
  const data: { time: string; value: number }[] = [];
  const now = Date.now();
  let inZone = currentInZone;
  
  // Create a pattern where worker goes in and out of zone
  for (let i = 29; i >= 0; i--) {
    const timestamp = new Date(now - i * 60000); // 1 minute intervals
    // Use a more unique time format to prevent duplicate keys
    const timeStr = timestamp.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
    });
    
    // Randomly change zone status every few minutes for variation
    if (i % 8 === 0 && i !== 0) {
      inZone = !inZone;
    }
    
    data.push({
      time: timeStr,
      value: inZone ? 1 : 0,
    });
  }
  
  // Ensure the last value matches current status
  data[data.length - 1].value = currentInZone ? 1 : 0;
  
  return data;
};