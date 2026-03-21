
import React, { useState, useEffect } from 'react';
import { IconCalendar, IconSettings, IconRepeat, IconRefresh } from '@tabler/icons-react';
import { CalendarConfig, UserEvent, ShiftConfig, FinancialTransaction, OrderAnnotation } from '../types';
import { CalendarTool } from './CalendarTool';
import { ShiftManager } from './ShiftManager';
import { Button } from './ui/Button';
import { fetchGoogleCalendarEvents } from '../services/googleCalendarService';

interface CalendarModuleProps {
  calendarConfig: CalendarConfig;
  onCalendarConfigChange: (config: CalendarConfig) => void;
  events: UserEvent[];
  onEventsChange: (events: UserEvent[]) => void;
  shiftConfig?: ShiftConfig;
  onShiftConfigChange: (config: ShiftConfig) => void;
  googleAccessToken?: string;
  financialTransactions?: FinancialTransaction[];
  warehouseLogs?: any[];
  warehouseInventory?: any[];
  orderAnnotations?: OrderAnnotation[];
}

export const CalendarModule: React.FC<CalendarModuleProps> = ({
  calendarConfig,
  onCalendarConfigChange,
  events,
  onEventsChange,
  shiftConfig,
  onShiftConfigChange,
  googleAccessToken,
  financialTransactions,
  warehouseLogs,
  warehouseInventory,
  orderAnnotations
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'view' | 'config'>('view');
  const [googleEvents, setGoogleEvents] = useState<UserEvent[]>([]);
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);

  useEffect(() => {
    if (googleAccessToken) {
      syncGoogleCalendar();
    }
  }, [googleAccessToken]);

  const syncGoogleCalendar = async () => {
    if (!googleAccessToken) return;
    setIsSyncingGoogle(true);
    try {
      const gEvents = await fetchGoogleCalendarEvents(googleAccessToken);
      setGoogleEvents(gEvents);
    } finally {
      setIsSyncingGoogle(false);
    }
  };

  const allEvents = [...events, ...googleEvents];

  return (
    <div className="h-full flex flex-col gap-2">
      {/* Sub-navegação interna */}
      <div className="flex gap-2 shrink-0 border-b border-white pb-1 justify-between items-center">
        <div className="flex gap-2">
          <Button 
            onClick={() => setActiveSubTab('view')} 
            className={activeSubTab === 'view' ? 'bg-white win95-sunken' : ''}
            icon={<IconCalendar size={14} />}
          >
            Visão Geral
          </Button>
          <Button 
            onClick={() => setActiveSubTab('config')} 
            className={activeSubTab === 'config' ? 'bg-white win95-sunken' : ''}
            icon={<IconRepeat size={14} />}
          >
            Editor de Escalas
          </Button>
        </div>
        
        {googleAccessToken && (
          <button 
            onClick={syncGoogleCalendar}
            disabled={isSyncingGoogle}
            className="win95-btn px-2 py-1 flex items-center gap-2 text-[10px] font-bold uppercase"
          >
            <IconRefresh size={12} className={isSyncingGoogle ? 'animate-spin' : ''} />
            {isSyncingGoogle ? 'Sincronizando Google...' : 'Sincronizar Google'}
          </button>
        )}
      </div>

      {/* Área de Conteúdo */}
      <div className="flex-1 win95-sunken bg-[#808080] p-0.5 overflow-hidden border-2 border-white border-t-[#808080] border-l-[#808080] border-r-white border-b-white">
        <div className="h-full w-full bg-win95-bg">
            {activeSubTab === 'view' ? (
                <CalendarTool 
                  config={calendarConfig} 
                  events={allEvents} 
                  shiftConfig={shiftConfig}
                  onConfigChange={onCalendarConfigChange} 
                  onEventsChange={onEventsChange} 
                  financialTransactions={financialTransactions}
                  warehouseLogs={warehouseLogs}
                  warehouseInventory={warehouseInventory}
                  orderAnnotations={orderAnnotations}
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
