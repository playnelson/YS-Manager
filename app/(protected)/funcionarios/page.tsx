'use client';
import dynamic from 'next/dynamic';
import { useAppContext } from '@/providers/AppProvider';
import { LoadingPlaceholder } from '@/components/LoadingPlaceholder';

const StaffBoardModule = dynamic(() => import('@/components/StaffBoardModule').then(m => m.StaffBoardModule), {
  ssr: false,
  loading: () => <LoadingPlaceholder />
});

export default function FuncionariosPage() {
  const { warehouseEmployees, setWarehouseEmployees, setHasUnsavedChanges, warehouseInventory, warehouseLogs, companySettings } = useAppContext();
  return (
    <StaffBoardModule
      employees={warehouseEmployees}
      onEmployeesChange={(data: any) => { setWarehouseEmployees(data); setHasUnsavedChanges(true); }}
      inventory={warehouseInventory}
      logs={warehouseLogs}
      companySettings={companySettings}
    />
  );
}
