import React from 'react';
import { cn } from '../lib/utils';

interface DataPulseProps {
  className?: string;
  active?: boolean;
}

export const DataPulse: React.FC<DataPulseProps> = ({ className, active = true }) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="relative flex h-2 w-2">
        {active && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary-fixed-dim opacity-75"></span>
        )}
        <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary-fixed-dim"></span>
      </span>
      <span className="text-[10px] font-bold uppercase tracking-wider text-outline">
        {active ? "Real-time monitoring active" : "Monitoring inactive"}
      </span>
    </div>
  );
};
