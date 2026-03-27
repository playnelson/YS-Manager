'use client';
import { lazy, Suspense } from 'react';
import { useAppContext } from '@/providers/AppProvider';
import { LoadingPlaceholder } from '@/components/LoadingPlaceholder';

const CalendarModule = lazy(() => import('@/components/CalendarModule').then(m => ({ default: m.CalendarModule })));

export default function CalendarioPage() {
  const {
    calendarConfig, setCalendarConfig,
    calendarEvents, setCalendarEvents,
    shiftConfig, setShiftConfig,
    financialTransactions, warehouseLogs,
    warehouseInventory, orderAnnotations,
  } = useAppContext();

  return (
    <Suspense fallback={<LoadingPlaceholder />}>
      <CalendarModule
        calendarConfig={calendarConfig} onCalendarConfigChange={setCalendarConfig}
        events={calendarEvents} onEventsChange={setCalendarEvents}
        shiftConfig={shiftConfig} onShiftConfigChange={setShiftConfig}
        financialTransactions={financialTransactions}
        warehouseLogs={warehouseLogs}
        warehouseInventory={warehouseInventory}
        orderAnnotations={orderAnnotations}
      />
    </Suspense>
  );
}
