'use client';
import dynamic from 'next/dynamic';
import { useAppContext } from '@/providers/AppProvider';
import { LoadingPlaceholder } from '@/components/LoadingPlaceholder';

const DocumentsModule = dynamic(() => import('@/components/DocumentsModule').then(m => m.DocumentsModule), {
  ssr: false,
  loading: () => <LoadingPlaceholder />
});

export default function DocumentosPage() {
  const { personalFiles, setPersonalFiles, driveFiles, setDriveFiles, signatures, setSignatures, setCalendarEvents, user } = useAppContext();
  return (
    <DocumentsModule
      personalFiles={personalFiles} onFilesChange={setPersonalFiles}
      driveFiles={driveFiles} onDriveFilesChange={setDriveFiles}
      signatures={signatures} onSignatureChange={setSignatures}
      onAddEvent={(ev: any) => setCalendarEvents((prev: any) => [...prev, ev])}
      currentUser={user}
    />
  );
}
