'use client';
import { lazy, Suspense } from 'react';
import { useAppContext } from '@/providers/AppProvider';
import { LoadingPlaceholder } from '@/components/LoadingPlaceholder';

const DocumentsModule = lazy(() => import('@/components/DocumentsModule').then(m => ({ default: m.DocumentsModule })));

export default function DocumentosPage() {
  const { personalFiles, setPersonalFiles, driveFiles, setDriveFiles, signatures, setSignatures, setCalendarEvents, user } = useAppContext();
  return (
    <Suspense fallback={<LoadingPlaceholder />}>
      <DocumentsModule
        personalFiles={personalFiles} onFilesChange={setPersonalFiles}
        driveFiles={driveFiles} onDriveFilesChange={setDriveFiles}
        signatures={signatures} onSignatureChange={setSignatures}
        onAddEvent={(ev: any) => setCalendarEvents((prev: any) => [...prev, ev])}
        currentUser={user}
      />
    </Suspense>
  );
}
