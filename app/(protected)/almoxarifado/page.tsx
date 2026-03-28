'use client';
import dynamic from 'next/dynamic';
import { useAppContext } from '@/providers/AppProvider';
import { LoadingPlaceholder } from '@/components/LoadingPlaceholder';

const WarehouseModule = dynamic(() => import('@/components/WarehouseModule').then(m => m.WarehouseModule), {
  ssr: false,
  loading: () => <LoadingPlaceholder />
});

export default function AlmoxarifadoPage() {
  const {
    warehouseInventory, setWarehouseInventory,
    warehouseEmployees, setWarehouseEmployees,
    warehouseLogs, setWarehouseLogs,
    warehouseCategories, setWarehouseCategories,
    setHasUnsavedChanges,
  } = useAppContext();

  return (
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
  );
}
