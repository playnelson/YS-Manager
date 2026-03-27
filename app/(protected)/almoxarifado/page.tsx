'use client';
import { lazy, Suspense } from 'react';
import { useAppContext } from '@/providers/AppProvider';
import { LoadingPlaceholder } from '@/components/LoadingPlaceholder';

const WarehouseModule = lazy(() => import('@/components/WarehouseModule').then(m => ({ default: m.WarehouseModule })));

export default function AlmoxarifadoPage() {
  const {
    warehouseInventory, setWarehouseInventory,
    warehouseEmployees, setWarehouseEmployees,
    warehouseLogs, setWarehouseLogs,
    warehouseCategories, setWarehouseCategories,
    setHasUnsavedChanges,
  } = useAppContext();

  return (
    <Suspense fallback={<LoadingPlaceholder />}>
      <WarehouseModule
        inventory={warehouseInventory}
        onInventoryChange={(data: any) => { setWarehouseInventory(data); setHasUnsavedChanges(true); }}
        employees={warehouseEmployees}
        onEmployeesChange={(data: any) => { setWarehouseEmployees(data); setHasUnsavedChanges(true); }}
        logs={warehouseLogs}
        onLogsChange={(data: any) => { setWarehouseLogs(data); setHasUnsavedChanges(true); }}
        categories={warehouseCategories}
        onCategoriesChange={(data: any) => { setWarehouseCategories(data); setHasUnsavedChanges(true); }}
      />
    </Suspense>
  );
}
