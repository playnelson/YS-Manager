
import React, { useState } from 'react';
import { Calendar as CalendarIcon, Settings, Repeat } from 'lucide-react';
import { CalendarConfig, UserEvent, ShiftConfig } from '../types';
import { CalendarTool } from './CalendarTool';
import { ShiftManager } from './ShiftManager';
import { Button } from './ui/Button';

interface CalendarModuleProps {
  calendarConfig: CalendarConfig;
  onCalendarConfigChange: (config: CalendarConfig) => void;
  events: UserEvent[];
  onEventsChange: (events: UserEvent[]) => void;
  shiftConfig?: ShiftConfig;
  onShiftConfigChange: (config: ShiftConfig) => void;
}

export const CalendarModule: React.FC<CalendarModuleProps> = ({
  calendarConfig,
  onCalendarConfigChange,
  events,
  onEventsChange,
  shiftConfig,
  onShiftConfigChange
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'view' | 'config'>('view');

  return (
    <div className="h-full flex flex-col gap-2">
      {/* Sub-navegação interna */}
      <div className="flex gap-2 shrink-0 border-b border-white pb-1">
        <Button 
          onClick={() => setActiveSubTab('view')} 
          className={activeSubTab === 'view' ? 'bg-white win95-sunken' : ''}
          icon={<CalendarIcon size={14} />}
        >
          Visão Geral
        </Button>
        <Button 
          onClick={() => setActiveSubTab('config')} 
          className={activeSubTab === 'config' ? 'bg-white win95-sunken' : ''}
          icon={<Repeat size={14} />}
        >
          Editor de Escalas
        </Button>
      </div>

      {/* Área de Conteúdo */}
      <div className="flex-1 win95-sunken bg-[#808080] p-0.5 overflow-hidden border-2 border-white border-t-[#808080] border-l-[#808080] border-r-white border-b-white">
        <div className="h-full w-full bg-win95-bg">
            {activeSubTab === 'view' ? (
                <CalendarTool 
                  config={calendarConfig} 
                  events={events} 
                  shiftConfig={shiftConfig}
                  onConfigChange={onCalendarConfigChange} 
                  onEventsChange={onEventsChange} 
                />
            ) : (
                <ShiftManager 
                  config={shiftConfig} 
                  onChange={onShiftConfigChange} 
                />
            )}
        </div>
      </div>
    </div>
  );
};
