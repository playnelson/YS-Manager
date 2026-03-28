'use client';
import dynamic from 'next/dynamic';
import { useAppContext } from '@/providers/AppProvider';
import { LoadingPlaceholder } from '@/components/LoadingPlaceholder';

const CalendarModule = dynamic(() => import('@/components/CalendarModule').then(m => m.CalendarModule), {
  ssr: false,
  loading: () => <LoadingPlaceholder />
});

export default function CalendarioPage() {
  const {
    calendarConfig, setCalendarConfig,
    calendarEvents, setCalendarEvents,
    shiftConfig, setShiftConfig,
    financialTransactions, warehouseLogs,
    warehouseInventory, orderAnnotations,
  } = useAppContext();

  return (
    <CalendarModule
      calendarConfig={calendarConfig} onCalendarConfigChange={setCalendarConfig}
      events={calendarEvents} onEventsChange={setCalendarEvents}
      shiftConfig={shiftConfig} onShiftConfigChange={setShiftConfig}
      financialTransactions={financialTransactions}
      warehouseLogs={warehouseLogs}
      warehouseInventory={warehouseInventory}
      orderAnnotations={orderAnnotations}
    />
  );
}
