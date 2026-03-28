'use client';
import dynamic from 'next/dynamic';
import { useAppContext } from '@/providers/AppProvider';
import { LoadingPlaceholder } from '@/components/LoadingPlaceholder';

const OrdersModule = dynamic(() => import('@/components/OrdersModule').then(m => m.OrdersModule), {
  ssr: false,
  loading: () => <LoadingPlaceholder />
});

export default function PedidosPage() {
  const { orderAnnotations, setOrderAnnotations, setHasUnsavedChanges, warehouseInventory, user } = useAppContext();
  return (
    <OrdersModule
      orders={orderAnnotations}
      onOrdersChange={(data: any) => { setOrderAnnotations(data); setHasUnsavedChanges(true); }}
      inventory={warehouseInventory}
      currentUser={user}
    />
  );
}
