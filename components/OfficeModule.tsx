
import React, { useState } from 'react';
import { Mail, FileSearch2, Languages, Link, FolderOpen, StickyNote, ClipboardList, Phone, Globe, FileText } from 'lucide-react';
import { EmailTemplate, Signature, UserEvent, PostIt, ImportantNote, ShiftHandoff, User, ProfessionalLink, Extension, StoredFile } from '../types';
import { EmailManager } from './EmailManager';
import { StickyNotesWall } from './StickyNotesWall';
import { ImportantNotes } from './ImportantNotes';
import { ShiftHandoffModule } from './ShiftHandoff';
import { ProfessionalLinks } from './ProfessionalLinks';
import { ExtensionsDirectory } from './ExtensionsDirectory';
import { DocumentsModule } from './DocumentsModule';
import { Button } from './ui/Button';

interface OfficeModuleProps {
  // Emails
  emails: EmailTemplate[];
  onEmailChange: (emails: EmailTemplate[]) => void;
  
  // Signatures & Events
  signatures: Signature[];
  onSignatureChange: (signatures: Signature[]) => void;
  onAddEvent: (event: UserEvent) => void;
  
  // Notes & Handoff
  postIts: PostIt[];
  onPostItChange: (notes: PostIt[]) => void;
  importantNotes: ImportantNote[];
  onNoteChange: (notes: ImportantNote[]) => void;
  handoffs: ShiftHandoff[];
  onHandoffChange: (handoffs: ShiftHandoff[]) => void;
  currentUser: User | null;
  
  // Directory & Extensions
  links: ProfessionalLink[];
  onLinkChange: (links: ProfessionalLink[]) => void;
  extensions: Extension[];
  onExtensionChange: (extensions: Extension[]) => void;
  
  // Files
  personalFiles: StoredFile[];
  onFilesChange: (files: StoredFile[]) => void;
}

type SubTab = 'mural' | 'notes' | 'handoff' | 'directory' | 'extensions' | 'docs' | 'emails';

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
  personalFiles, onFilesChange
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('mural');

  // Botão de navegação estilo "Tab" do Windows 95
  const NavTab = ({ id, label, icon }: { id: SubTab, label: string, icon: React.ReactNode }) => (
    <button 
      onClick={() => setActiveSubTab(id)} 
      className={`
        flex items-center gap-2 px-4 py-2 text-[11px] font-bold uppercase transition-all border-t-2 border-l-2 border-r-2 rounded-t-md
        ${activeSubTab === id 
          ? 'bg-win95-bg border-white border-b-win95-bg relative z-10 -mb-[2px] text-blue-800' 
          : 'bg-[#c0c0c0] border-gray-400 text-gray-600 hover:bg-[#d0d0d0]'}
      `}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div className="h-full flex flex-col gap-0 overflow-hidden bg-[#c0c0c0]">
      {/* Barra de Abas do Escritório - Plana e Direta */}
      <div className="flex gap-1 shrink-0 px-2 pt-2 border-b border-white overflow-x-auto no-scrollbar">
        <NavTab id="mural" label="Mural" icon={<StickyNote size={14} />} />
        <NavTab id="notes" label="Anotações" icon={<FileText size={14} />} />
        <NavTab id="handoff" label="Passagem" icon={<ClipboardList size={14} />} />
        <NavTab id="directory" label="Diretório" icon={<Globe size={14} />} />
        <NavTab id="extensions" label="Ramais" icon={<Phone size={14} />} />
        <NavTab id="docs" label="Documentos" icon={<FolderOpen size={14} />} />
        <NavTab id="emails" label="E-mails" icon={<Mail size={14} />} />
      </div>

      {/* Área de Conteúdo da Sessão Selecionada */}
      <div className="flex-1 win95-sunken bg-white overflow-hidden border-2 border-white m-1 mt-0">
        <div className="h-full w-full bg-win95-bg">
            
            {/* 1. MURAL DE AVISOS */}
            {activeSubTab === 'mural' && (
                <StickyNotesWall notes={postIts} onChange={onPostItChange} />
            )}

            {/* 2. ANOTAÇÕES (IMPORTANTE) */}
            {activeSubTab === 'notes' && (
                <ImportantNotes notes={importantNotes} onChange={onNoteChange} />
            )}

            {/* 3. PASSAGEM DE SERVIÇO */}
            {activeSubTab === 'handoff' && (
                <ShiftHandoffModule handoffs={handoffs} onChange={onHandoffChange} currentUser={currentUser} />
            )}

            {/* 4. DIRETÓRIO (LINKS) */}
            {activeSubTab === 'directory' && (
                <ProfessionalLinks links={links} onChange={onLinkChange} />
            )}

            {/* 5. RAMAIS */}
            {activeSubTab === 'extensions' && (
                <ExtensionsDirectory extensions={extensions} onChange={onExtensionChange} />
            )}

            {/* 6. DOCUMENTOS (Arquivos, Gerador, Assinador) */}
            {activeSubTab === 'docs' && (
                <DocumentsModule 
                  personalFiles={personalFiles}
                  onFilesChange={onFilesChange}
                  signatures={signatures}
                  onSignatureChange={onSignatureChange}
                  onAddEvent={onAddEvent}
                />
            )}

            {/* 7. E-MAILS (Mantido no Escritório por contexto profissional) */}
            {activeSubTab === 'emails' && (
                <EmailManager emails={emails} onChange={onEmailChange} />
            )}
        </div>
      </div>

      {/* Barra de Status do Escritório */}
      <div className="px-2 py-1 bg-win95-bg border-t border-white text-[9px] font-bold text-gray-500 uppercase flex justify-between items-center italic">
        <span>Sessão: {activeSubTab.toUpperCase()}</span>
        <div className="flex gap-4">
           <span>Total de Arquivos: {personalFiles.length}</span>
           <span>Ramais: {extensions.length}</span>
        </div>
      </div>
    </div>
  );
};
