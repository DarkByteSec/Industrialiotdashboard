import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ZoneActivityChartProps {
  data: { time: string; value: number }[];
}

export const ZoneActivityChart: React.FC<ZoneActivityChartProps> = ({ data }) => {
  // Ensure we have data
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center text-slate-500 dark:text-slate-400">
        No zone activity data available
      </div>
    );
  }

  // Add unique identifiers to each data point to prevent duplicate key warnings
  const dataWithKeys = data.map((item, index) => ({
    ...item,
    id: `${item.time}-${index}`,
  }));

  return (
    <div className="w-full h-[300px] min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={dataWithKeys}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
          <XAxis
            dataKey="time"
            stroke="#94a3b8"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 1]}
            ticks={[0, 1]}
            stroke="#94a3b8"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            label={{
              value: 'Zone Status',
              angle: -90,
              position: 'insideLeft',
              style: { fill: '#94a3b8', fontSize: 12 },
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#fff',
            }}
            labelStyle={{ color: '#94a3b8' }}
            formatter={(value: number) => [value === 1 ? 'Inside Zone' : 'Outside Zone', 'Status']}
          />
          <Line
            type="stepAfter"
            dataKey="value"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};