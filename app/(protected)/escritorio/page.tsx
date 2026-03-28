'use client';
import { lazy, Suspense } from 'react';
import { useAppContext } from '@/providers/AppProvider';
import { LoadingPlaceholder } from '@/components/LoadingPlaceholder';

const OfficeModule = lazy(() => import('@/components/OfficeModule').then(m => ({ default: m.OfficeModule })));

export default function EscritorioPage() {
  const {
    emails, setEmails, signatures, setSignatures, setCalendarEvents,
    postIts, setPostIts, importantNotes, setImportantNotes,
    shiftHandoffs, setShiftHandoffs, user, links, setLinks,
    extensions, setExtensions, personalFiles, setPersonalFiles,
    hiddenTabs, kanbanData, setKanbanData,
  } = useAppContext();

  return (
    <Suspense fallback={<LoadingPlaceholder />}>
      <OfficeModule
        emails={emails} onEmailChange={setEmails}
        signatures={signatures} onSignatureChange={setSignatures}
        onAddEvent={(ev: any) => setCalendarEvents((prev: any) => [...prev, ev])}
        postIts={postIts} onPostItChange={setPostIts}
        importantNotes={importantNotes} onNoteChange={setImportantNotes}
        handoffs={shiftHandoffs} onHandoffChange={setShiftHandoffs}
        currentUser={user} links={links} onLinkChange={setLinks}
        personalFiles={personalFiles} onFilesChange={setPersonalFiles}
        hiddenTabs={hiddenTabs}
        kanbanData={kanbanData} onKanbanChange={setKanbanData}
      />
    </Suspense>
  );
}
