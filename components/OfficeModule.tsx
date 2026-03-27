'use client';

import React, { useState } from 'react';
import { EmailTemplate, Signature, UserEvent, PostIt, ImportantNote, ShiftHandoff, User, ProfessionalLink, Extension, StoredFile, KanbanState } from '@/types';
import { EmailManager } from '@/components/EmailManager';
import { StickyNotesWall } from '@/components/StickyNotesWall';
import { ImportantNotes } from '@/components/ImportantNotes';
import { ShiftHandoffModule } from '@/components/ShiftHandoff';
import { ProfessionalLinks } from '@/components/ProfessionalLinks';
import { ExtensionsDirectory } from '@/components/ExtensionsDirectory';
import { DocumentGenerator } from '@/components/DocumentGenerator';
import { SignatureManager } from '@/components/SignatureManager';
import { PersonalFileManager } from '@/components/DocumentsModule';
import { PricingCalculator } from '@/components/PricingCalculator';
import { BrasilApiModule } from '@/components/BrasilApiModule';
import { KanbanBoard } from '@/components/KanbanBoard';

interface OfficeModuleProps {
  emails: EmailTemplate[];
  onEmailChange: (emails: EmailTemplate[]) => void;
  signatures: Signature[];
  onSignatureChange: (signatures: Signature[]) => void;
  onAddEvent: (event: UserEvent) => void;
  postIts: PostIt[];
  onPostItChange: (notes: PostIt[]) => void;
  importantNotes: ImportantNote[];
  onNoteChange: (notes: ImportantNote[]) => void;
  handoffs: ShiftHandoff[];
  onHandoffChange: (handoffs: ShiftHandoff[]) => void;
  currentUser: User | null;
  links: ProfessionalLink[];
  onLinkChange: (links: ProfessionalLink[]) => void;
  extensions: Extension[];
  onExtensionChange: (extensions: Extension[]) => void;
  personalFiles: StoredFile[];
  onFilesChange: (files: StoredFile[]) => void;
  hiddenTabs?: string[];
  kanbanData: KanbanState;
  onKanbanChange: (data: KanbanState) => void;
}

type SubTab = 'kanban' | 'mural' | 'notes' | 'handoff' | 'directory' | 'extensions' | 'arquivos' | 'gerador' | 'assinador' | 'precificacao' | 'emails' | 'brasil';

const SUB_TABS: { id: SubTab; label: string }[] = [
  { id: 'kanban', label: 'Kanban' },
  { id: 'mural', label: 'Mural' },
  { id: 'notes', label: 'Pedidos' },
  { id: 'handoff', label: 'Passagem' },
  { id: 'directory', label: 'Diretório' },
  { id: 'extensions', label: 'Ramais' },
  { id: 'assinador', label: 'Assinador' },
  { id: 'precificacao', label: 'Precificação' },
  { id: 'emails', label: 'E-mails' },
];

export const OfficeModule: React.FC<OfficeModuleProps> = ({
  emails, onEmailChange,
  signatures, onSignatureChange,
  onAddEvent,
  postIts, onPostItChange,
  importantNotes, onNoteChange,
  handoffs, onHandoffChange,
  currentUser,
  links, onLinkChange,
  extensions, onExtensionChange,
  personalFiles, onFilesChange,
  hiddenTabs = [],
  kanbanData, onKanbanChange,
}) => {
  const showBrasilHub = !hiddenTabs.includes('brasil-hub');
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('mural');

  const allSubTabs = showBrasilHub
    ? [...SUB_TABS, { id: 'brasil' as SubTab, label: 'Brasil Hub' }]
    : SUB_TABS;

  return (
    <div className="flex flex-col h-full bg-palette-mediumLight dark:bg-[#111111]">

      {/* ── Sub-tabs pill bar ── */}
      <div
        className="px-6 py-3 flex gap-2 overflow-x-auto border-b border-palette-mediumDark dark:border-gray-800 bg-palette-lightest dark:bg-gray-900 flex-shrink-0"
        style={{ scrollbarWidth: 'none' }}
      >
        {allSubTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`px-4 py-1.5 text-[11px] font-semibold rounded-full whitespace-nowrap uppercase tracking-wide transition-all ${activeSubTab === tab.id
              ? 'bg-palette-darkest dark:bg-white text-white dark:text-gray-900 shadow-sm'
              : 'text-palette-darkest/70 dark:text-gray-400 hover:bg-palette-mediumLight dark:hover:bg-gray-800 border border-transparent hover:border-palette-mediumDark dark:hover:border-gray-700'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto">
        {activeSubTab === 'kanban' && <KanbanBoard data={kanbanData} onChange={onKanbanChange} />}
        {activeSubTab === 'mural' && <StickyNotesWall notes={postIts} onChange={onPostItChange} />}
        {activeSubTab === 'notes' && <ImportantNotes notes={importantNotes} onChange={onNoteChange} />}
        {activeSubTab === 'handoff' && <ShiftHandoffModule handoffs={handoffs} onChange={onHandoffChange} currentUser={currentUser} />}
        {activeSubTab === 'directory' && <ProfessionalLinks links={links} onChange={onLinkChange} />}
        {activeSubTab === 'extensions' && <ExtensionsDirectory extensions={extensions} onChange={onExtensionChange} />}
        {activeSubTab === 'assinador' && <SignatureManager signatures={signatures} onChange={onSignatureChange} onAddEvent={onAddEvent} />}
        {activeSubTab === 'precificacao' && <PricingCalculator />}
        {activeSubTab === 'emails' && <EmailManager emails={emails} onChange={onEmailChange} />}
        {activeSubTab === 'brasil' && <BrasilApiModule />}
      </div>

      {/* ── Footer status bar ── */}
      <div className="h-10 px-6 flex items-center justify-between bg-palette-mediumLight/50 dark:bg-gray-900 border-t border-palette-mediumDark dark:border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-4 text-[10px] text-gray-500 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            <span className="uppercase">Sessão: {activeSubTab}</span>
          </div>
          <span className="text-gray-300 dark:text-gray-700">|</span>
          <span className="uppercase">LogB v2.7</span>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-gray-500 font-medium">
          <span className="uppercase tracking-widest">Documentos: {personalFiles.length}</span>
          <span className="text-gray-300 dark:text-gray-700">|</span>
          <span className="uppercase tracking-widest">Contatos: {extensions.length}</span>
        </div>
      </div>
    </div>
  );
};
