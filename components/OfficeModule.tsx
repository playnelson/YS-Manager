
import React, { useState } from 'react';
import { Mail, FileSearch2, Languages, Link, FolderOpen, StickyNote, ClipboardList, Phone, Globe, FileText, PenTool, HardDrive, Calculator, Wallet } from 'lucide-react';
import { EmailTemplate, Signature, UserEvent, PostIt, ImportantNote, ShiftHandoff, User, ProfessionalLink, Extension, StoredFile, FinancialTransaction } from '../types';
import { EmailManager } from './EmailManager';
import { StickyNotesWall } from './StickyNotesWall';
import { ImportantNotes } from './ImportantNotes';
import { ShiftHandoffModule } from './ShiftHandoff';
import { ProfessionalLinks } from './ProfessionalLinks';
import { ExtensionsDirectory } from './ExtensionsDirectory';
import { DocumentGenerator } from './DocumentGenerator';
import { SignatureManager } from './SignatureManager';
import { PersonalFileManager } from './DocumentsModule';
import { PricingCalculator } from './PricingCalculator';
import { FinancialModule } from './FinancialModule';
import { Button } from './ui/Button';

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
  transactions: FinancialTransaction[];
  onTransactionChange: (transactions: FinancialTransaction[]) => void;
}

type SubTab = 'mural' | 'notes' | 'handoff' | 'directory' | 'extensions' | 'arquivos' | 'financas' | 'gerador' | 'assinador' | 'precificacao' | 'emails';

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
  transactions, onTransactionChange
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('mural');

  const NavTab = ({ id, label, icon }: { id: SubTab, label: string, icon: React.ReactNode }) => (
    <button 
      onClick={() => setActiveSubTab(id)} 
      className={`
        flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase transition-all border-t-2 border-l-2 border-r-2 rounded-t-md whitespace-nowrap
        ${activeSubTab === id 
          ? 'bg-win95-bg border-white border-b-win95-bg relative z-10 -mb-[2px] text-blue-800 shadow-sm' 
          : 'bg-[#c0c0c0] border-gray-400 text-gray-600 hover:bg-[#d0d0d0]'}
      `}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div className="h-full flex flex-col gap-0 overflow-hidden bg-[#c0c0c0]">
      {/* Barra de Abas do Escritório - Navegação Plana Completa sem Margens Inúteis */}
      <div className="flex gap-1 shrink-0 px-2 pt-2 border-b border-white overflow-x-auto no-scrollbar scroll-smooth">
        <NavTab id="mural" label="Mural" icon={<StickyNote size={14} />} />
        <NavTab id="notes" label="Anotações" icon={<FileText size={14} />} />
        <NavTab id="handoff" label="Passagem" icon={<ClipboardList size={14} />} />
        <NavTab id="directory" label="Diretório" icon={<Globe size={14} />} />
        <NavTab id="extensions" label="Ramais" icon={<Phone size={14} />} />
        <div className="w-px h-6 bg-gray-400 mx-1 self-center opacity-50"></div>
        <NavTab id="arquivos" label="Arquivos" icon={<HardDrive size={14} />} />
        <NavTab id="financas" label="Finanças" icon={<Wallet size={14} className="text-blue-700" />} />
        <NavTab id="gerador" label="Gerador" icon={<FileSearch2 size={14} />} />
        <NavTab id="assinador" label="Assinador" icon={<PenTool size={14} />} />
        <div className="w-px h-6 bg-gray-400 mx-1 self-center opacity-50"></div>
        <NavTab id="precificacao" label="Precificação" icon={<Calculator size={14} />} />
        <NavTab id="emails" label="E-mails" icon={<Mail size={14} />} />
      </div>

      {/* Área de Conteúdo Única e Integrada (sem margens m-1) */}
      <div className="flex-1 win95-sunken bg-white overflow-hidden border-2 border-white">
        <div className="h-full w-full bg-win95-bg">
            
            {activeSubTab === 'mural' && (
                <StickyNotesWall notes={postIts} onChange={onPostItChange} />
            )}

            {activeSubTab === 'notes' && (
                <ImportantNotes notes={importantNotes} onChange={onNoteChange} />
            )}

            {activeSubTab === 'handoff' && (
                <ShiftHandoffModule handoffs={handoffs} onChange={onHandoffChange} currentUser={currentUser} />
            )}

            {activeSubTab === 'directory' && (
                <ProfessionalLinks links={links} onChange={onLinkChange} />
            )}

            {activeSubTab === 'extensions' && (
                <ExtensionsDirectory extensions={extensions} onChange={onExtensionChange} />
            )}

            {activeSubTab === 'arquivos' && (
                <PersonalFileManager files={personalFiles} onChange={onFilesChange} />
            )}

            {activeSubTab === 'financas' && (
                <FinancialModule transactions={transactions} onChange={onTransactionChange} />
            )}

            {activeSubTab === 'gerador' && (
                <DocumentGenerator />
            )}

            {activeSubTab === 'assinador' && (
                <SignatureManager signatures={signatures} onChange={onSignatureChange} onAddEvent={onAddEvent} />
            )}

            {activeSubTab === 'precificacao' && (
                <PricingCalculator />
            )}

            {activeSubTab === 'emails' && (
                <EmailManager emails={emails} onChange={onEmailChange} />
            )}
        </div>
      </div>

      {/* Barra de Status Inferior do Escritório */}
      <div className="px-2 py-1 bg-win95-bg border-t border-white text-[9px] font-bold text-gray-500 uppercase flex justify-between items-center italic select-none shrink-0">
        <div className="flex gap-4">
           <span>Sessão: {activeSubTab.toUpperCase()}</span>
           <span>•</span>
           <span>Brain Office v2.7</span>
        </div>
        <div className="flex gap-4">
           <span>Documentos: {personalFiles.length}</span>
           <span>Contatos: {extensions.length}</span>
        </div>
      </div>
    </div>
  );
};
