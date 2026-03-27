'use client';
import { lazy, Suspense } from 'react';
import { useAppContext } from '@/providers/AppProvider';
import { LoadingPlaceholder } from '@/components/LoadingPlaceholder';

const WhatsAppTool = lazy(() => import('@/components/WhatsAppTool').then(m => ({ default: m.WhatsAppTool })));

export default function WhatsAppPage() {
  const { user, whatsappTemplates, setWhatsappTemplates, whatsappHistory, setWhatsappHistory } = useAppContext();
  return (
    <Suspense fallback={<LoadingPlaceholder />}>
      <WhatsAppTool
        googleAccessToken={user?.googleAccessToken}
        templates={whatsappTemplates} onTemplatesChange={setWhatsappTemplates}
        history={whatsappHistory} onHistoryChange={setWhatsappHistory}
      />
    </Suspense>
  );
}
