import { AttendanceRecord } from '../components/AttendanceHistory';

// Generate attendance records for a worker
export const generateAttendanceRecords = (workerId: string, days: number = 30): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  const today = new Date();

  // Standard shift: 9 AM - 5 PM (8 hours)
  const shiftStart = 9 * 60; // 9:00 AM in minutes
  const shiftEnd = 17 * 60; // 5:00 PM in minutes
  const shiftDuration = 8; // hours

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    // Random attendance patterns (90% present, 7% late, 3% absent)
    const rand = Math.random();
    let status: AttendanceRecord['status'] = 'Present';
    let checkIn = shiftStart;
    let checkOut = shiftEnd;
    let lateDuration = 0;
    let overtimeDuration = 0;

    if (rand < 0.03) {
      // Absent
      status = 'Absent';
      checkIn = 0;
      checkOut = 0;
    } else if (rand < 0.1) {
      // Late
      status = 'Late';
      lateDuration = Math.floor(Math.random() * 60) + 10; // 10-70 minutes late
      checkIn = shiftStart + lateDuration;
    } else {
      // Present - occasionally early or on time
      const earlyMinutes = Math.floor(Math.random() * 15);
      checkIn = shiftStart - earlyMinutes;
    }

    // Add random overtime (20% chance)
    if (status !== 'Absent' && Math.random() < 0.2) {
      overtimeDuration = Math.floor(Math.random() * 120) + 30; // 30-150 minutes
      checkOut = shiftEnd + overtimeDuration;
    }

    // Calculate total work hours
    let totalWorkHours = 0;
    if (status !== 'Absent') {
      totalWorkHours = (checkOut - checkIn) / 60;
    }

    const formatTime = (minutes: number) => {
      if (minutes === 0) return '--:--';
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    };

    records.push({
      id: `attendance-${workerId}-${date.toISOString().split('T')[0]}`,
      date,
      checkInTime: formatTime(checkIn),
      checkOutTime: formatTime(checkOut),
      status,
      lateDuration,
      overtimeDuration,
      totalWorkHours,
    });
  }

  return records.reverse(); // Oldest first
};

// Filter attendance records by date range
export const filterAttendanceByDateRange = (
  records: AttendanceRecord[],
  startDate: Date,
  endDate: Date
): AttendanceRecord[] => {
  return records.filter((record) => {
    const recordDate = new Date(record.date);
    recordDate.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return recordDate >= start && recordDate <= end;
  });
};

// Get date range based on filter type
export const getDateRangeForFilter = (
  filterType: 'day' | 'week' | 'month' | 'year'
): { startDate: Date; endDate: Date } => {
  const today = new Date();
  const startDate = new Date(today);
  const endDate = new Date(today);

  switch (filterType) {
    case 'day':
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'week':
      const dayOfWeek = today.getDay();
      startDate.setDate(today.getDate() - dayOfWeek);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'month':
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setMonth(endDate.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'year':
      startDate.setMonth(0, 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setMonth(11, 31);
      endDate.setHours(23, 59, 59, 999);
      break;
  }

  return { startDate, endDate };
};
