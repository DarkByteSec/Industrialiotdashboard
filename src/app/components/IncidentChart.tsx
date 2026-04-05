import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Alert } from '../data/mockData';

interface IncidentChartProps {
  alerts: Alert[];
  selectedIncidentId?: string;
  onIncidentClick?: (incidentId: string) => void;
}

export const IncidentChart: React.FC<IncidentChartProps> = ({
  alerts,
  selectedIncidentId,
  onIncidentClick,
}) => {
  // Group incidents by hour
  const chartData = useMemo(() => {
    const hourMap = new Map<number, { hour: string; critical: number; warning: number }>();

    // Initialize 24 hours
    for (let i = 0; i < 24; i++) {
      const hour = i.toString().padStart(2, '0') + ':00';
      hourMap.set(i, { hour, critical: 0, warning: 0 });
    }

    // Count incidents by hour
    alerts.forEach((alert) => {
      const hour = alert.timestamp.getHours();
      const data = hourMap.get(hour);
      if (data) {
        if (alert.type === 'fall' || alert.type === 'sos') {
          data.critical++;
        } else {
          data.warning++;
        }
      }
    });

    // Get current hour and show a window around it
    const currentHour = new Date().getHours();
    const startHour = Math.max(0, currentHour - 6);
    const endHour = Math.min(23, currentHour + 6);

    const result = [];
    for (let i = startHour; i <= endHour; i++) {
      const data = hourMap.get(i);
      if (data) {
        // Add unique id to prevent duplicate key warnings
        result.push({
          ...data,
          id: `hour-${i}`,
        });
      }
    }

    return result;
  }, [alerts]);

  // Handle empty data
  if (!chartData || chartData.length === 0) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center text-slate-500 dark:text-slate-400">
        No incident data available
      </div>
    );
  }

  return (
    <div className="w-full h-[300px] min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
          <XAxis
            dataKey="hour"
            stroke="#94a3b8"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
          />
          <YAxis
            stroke="#94a3b8"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            label={{
              value: 'Incidents',
              angle: -90,
              position: 'insideLeft',
              style: { fill: '#94a3b8', fontSize: 12 },
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(30, 41, 59, 0.95)',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#fff',
            }}
            labelStyle={{ color: '#94a3b8', marginBottom: '8px' }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />
          <Bar
            dataKey="critical"
            fill="#ef4444"
            name="Critical"
            radius={[4, 4, 0, 0]}
            onClick={(data) => onIncidentClick?.(data.hour)}
          />
          <Bar
            dataKey="warning"
            fill="#f59e0b"
            name="Warning"
            radius={[4, 4, 0, 0]}
            onClick={(data) => onIncidentClick?.(data.hour)}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};