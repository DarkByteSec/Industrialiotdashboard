import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { Worker, factoryZones } from '../data/mockData';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface FactoryMapProps {
  workers: Worker[];
  selectedWorkerId?: string;
  onWorkerClick?: (workerId: string) => void;
}

export const FactoryMap: React.FC<FactoryMapProps> = ({ 
  workers, 
  selectedWorkerId,
  onWorkerClick 
}) => {
  const navigate = useNavigate();

  const handleWorkerClick = (workerId: string) => {
    if (onWorkerClick) {
      onWorkerClick(workerId);
    } else {
      navigate(`/worker/${workerId}`);
    }
  };

  const getStatusColor = (status: Worker['status']) => {
    switch (status) {
      case 'safe':
        return '#10b981'; // green
      case 'danger':
        return '#ef4444'; // red
      case 'warning':
        return '#f59e0b'; // yellow
      default:
        return '#6b7280'; // gray
    }
  };

  return (
    <div className="relative w-full h-full bg-slate-900 dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden transition-colors duration-300">
      {/* Factory Layout SVG */}
      <svg
        viewBox="0 0 800 450"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid pattern */}
        <defs>
          <pattern
            id="grid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="rgba(148, 163, 184, 0.1)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="800" height="450" fill="url(#grid)" />

        {/* Factory Zones */}
        {factoryZones.map((zone) => (
          <g key={zone.id}>
            <rect
              x={zone.x}
              y={zone.y}
              width={zone.width}
              height={zone.height}
              fill="rgba(59, 130, 246, 0.1)"
              stroke="rgba(59, 130, 246, 0.3)"
              strokeWidth="2"
              rx="8"
            />
            <text
              x={zone.x + zone.width / 2}
              y={zone.y + 25}
              textAnchor="middle"
              fill="rgba(148, 163, 184, 0.8)"
              fontSize="14"
              fontWeight="600"
            >
              {zone.name}
            </text>
          </g>
        ))}

        {/* Workers */}
        {workers.map((worker) => {
          const isSelected = selectedWorkerId === worker.id;
          const opacity = selectedWorkerId && !isSelected ? 0.3 : 1;

          return (
            <TooltipProvider key={worker.id}>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <g
                    style={{ cursor: 'pointer', opacity }}
                    onClick={() => handleWorkerClick(worker.id)}
                  >
                    {/* Worker circle */}
                    <motion.circle
                      cx={worker.position.x}
                      cy={worker.position.y}
                      r={isSelected ? 16 : 12}
                      fill={getStatusColor(worker.status)}
                      stroke={isSelected ? '#fff' : 'none'}
                      strokeWidth={isSelected ? 3 : 0}
                      initial={false}
                      animate={{
                        cx: worker.position.x,
                        cy: worker.position.y,
                        scale: worker.status === 'danger' ? [1, 1.2, 1] : 1,
                      }}
                      transition={{
                        duration: 0.5,
                        scale: {
                          repeat: worker.status === 'danger' ? Infinity : 0,
                          duration: 1,
                        },
                      }}
                    />
                    
                    {/* Pulse effect for danger status */}
                    {worker.status === 'danger' && (
                      <motion.circle
                        cx={worker.position.x}
                        cy={worker.position.y}
                        r={12}
                        fill="none"
                        stroke={getStatusColor(worker.status)}
                        strokeWidth="2"
                        initial={{ r: 12, opacity: 1 }}
                        animate={{
                          r: 24,
                          opacity: 0,
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: 'easeOut',
                        }}
                      />
                    )}

                    {/* Worker initial */}
                    <text
                      x={worker.position.x}
                      y={worker.position.y + 5}
                      textAnchor="middle"
                      fill="white"
                      fontSize={isSelected ? "12" : "10"}
                      fontWeight="bold"
                      pointerEvents="none"
                    >
                      {worker.name.split(' ').map(n => n[0]).join('')}
                    </text>
                  </g>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-800 border-slate-700">
                  <div className="text-sm">
                    <p className="font-semibold">{worker.name}</p>
                    <p className="text-slate-400">Status: <span className="capitalize">{worker.status}</span></p>
                    <p className="text-slate-400">Zone: {worker.zone}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-3 rounded-lg border border-slate-300 dark:border-slate-700 transition-colors duration-300">
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-slate-700 dark:text-slate-300">Safe</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-slate-700 dark:text-slate-300">Warning</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-slate-700 dark:text-slate-300">Danger</span>
          </div>
        </div>
      </div>
    </div>
  );
};