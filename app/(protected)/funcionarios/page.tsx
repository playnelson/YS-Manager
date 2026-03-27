'use client';
import { lazy, Suspense } from 'react';
import { useAppContext } from '@/providers/AppProvider';
import { LoadingPlaceholder } from '@/components/LoadingPlaceholder';

const StaffBoardModule = lazy(() => import('@/components/StaffBoardModule').then(m => ({ default: m.StaffBoardModule })));

export default function FuncionariosPage() {
  const { warehouseEmployees, setWarehouseEmployees, setHasUnsavedChanges, warehouseInventory, warehouseLogs, companySettings } = useAppContext();
  return (
    <Suspense fallback={<LoadingPlaceholder />}>
      <StaffBoardModule
        employees={warehouseEmployees}
        onEmployeesChange={(data: any) => { setWarehouseEmployees(data); setHasUnsavedChanges(true); }}
        inventory={warehouseInventory}
        logs={warehouseLogs}
        companySettings={companySettings}
      />
    </Suspense>
  );
}
