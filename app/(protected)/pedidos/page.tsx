'use client';
import { lazy, Suspense } from 'react';
import { useAppContext } from '@/providers/AppProvider';
import { LoadingPlaceholder } from '@/components/LoadingPlaceholder';

const OrdersModule = lazy(() => import('@/components/OrdersModule').then(m => ({ default: m.OrdersModule })));

export default function PedidosPage() {
  const { orderAnnotations, setOrderAnnotations, setHasUnsavedChanges, warehouseInventory, user } = useAppContext();
  return (
    <Suspense fallback={<LoadingPlaceholder />}>
      <OrdersModule
        orders={orderAnnotations}
        onOrdersChange={(data: any) => { setOrderAnnotations(data); setHasUnsavedChanges(true); }}
        inventory={warehouseInventory}
        currentUser={user}
      />
    </Suspense>
  );
}
