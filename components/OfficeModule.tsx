
import React, { useState } from 'react';
import { Mail, FileSearch2, Languages, Link, FolderOpen, StickyNote, ClipboardList, Phone, Globe, FileText, ChevronRight } from 'lucide-react';
import { EmailTemplate, Signature, UserEvent, PostIt, ImportantNote, ShiftHandoff, User, ProfessionalLink, Extension, StoredFile } from '../types';
import { EmailManager } from './EmailManager';
import { PdfManager } from './PdfManager';
import { TranslatorTool } from './TranslatorTool';
import { MessageLinker } from './MessageLinker';
import { StickyNotesWall } from './StickyNotesWall';
import { ImportantNotes } from './ImportantNotes';
import { ShiftHandoffModule } from './ShiftHandoff';
import { ProfessionalLinks } from './ProfessionalLinks';
import { ExtensionsDirectory } from './ExtensionsDirectory';
import { DocumentsModule } from './DocumentsModule';
import { Button } from './ui/Button';

interface OfficeModuleProps {
  // Emails & Signatures
  emails: EmailTemplate[];
  onEmailChange: (emails: EmailTemplate[]) => void;
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

type SubTab = 'docs' | 'email' | 'notes' | 'directory' | 'extensions' | 'utils';

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
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('docs');

  // Helper para renderizar os grupos de botões estilo Win95
  const NavButton = ({ id, label, icon }: { id: SubTab, label: string, icon: React.ReactNode }) => (
    <Button 
      onClick={() => setActiveSubTab(id)} 
      className={`h-8 px-4 border-b-0 rounded-b-none ${activeSubTab === id ? 'bg-white win95-sunken text-blue-700' : 'bg-[#d1d5db] grayscale opacity-80'}`}
      icon={icon}
    >
      {label}
    </Button>
  );

  return (
    <div className="h-full flex flex-col gap-0 overflow-hidden">
      {/* Barra de Navegação de Escritório */}
      <div className="flex gap-1 shrink-0 bg-[#c0c0c0] p-1 pb-0 border-b border-gray-400 overflow-x-auto no-scrollbar">
        <NavButton id="docs" label="Documentos" icon={<FolderOpen size={14} />} />
        <NavButton id="email" label="E-mails" icon={<Mail size={14} />} />
        <NavButton id="notes" label="Organização" icon={<StickyNote size={14} />} />
        <NavButton id="directory" label="Diretório" icon={<Globe size={14} />} />
        <NavButton id="extensions" label="Ramais" icon={<Phone size={14} />} />
        <NavButton id="utils" label="Ferramentas" icon={<FileSearch2 size={14} />} />
      </div>

      {/* Área de Conteúdo do Sub-Módulo */}
      <div className="flex-1 win95-sunken bg-white overflow-hidden border-2 border-white">
        <div className="h-full w-full bg-win95-bg">
            
            {/* 1. DOCUMENTOS (Files, Generator, Signer) */}
            {activeSubTab === 'docs' && (
                <DocumentsModule 
                  personalFiles={personalFiles}
                  onFilesChange={onFilesChange}
                  signatures={signatures}
                  onSignatureChange={onSignatureChange}
                  onAddEvent={onAddEvent}
                />
            )}

            {/* 2. E-MAILS */}
            {activeSubTab === 'email' && (
                <EmailManager emails={emails} onChange={onEmailChange} />
            )}

            {/* 3. ORGANIZAÇÃO (Mural, Notas, Passagem) */}
            {activeSubTab === 'notes' && (
                <div className="h-full flex flex-col">
                   <div className="p-2 bg-[#808080] text-white text-[10px] font-bold uppercase flex items-center gap-2">
                      <StickyNote size={12}/> Gestão de Informação e Turnos
                   </div>
                   <div className="flex-1 overflow-hidden">
                      {/* Reusamos o NotesModule que já tem a lógica de sub-abas interna para Mural/Notas/Passagem */}
                      <div className="h-full p-1">
                        <NotesModuleInternal 
                            postIts={postIts} onPostItChange={onPostItChange}
                            importantNotes={importantNotes} onNoteChange={onNoteChange}
                            handoffs={handoffs} onHandoffChange={onHandoffChange}
                            currentUser={currentUser}
                        />
                      </div>
                   </div>
                </div>
            )}

            {/* 4. DIRETÓRIO (Links) */}
            {activeSubTab === 'directory' && (
                <ProfessionalLinks links={links} onChange={onLinkChange} />
            )}

            {/* 5. RAMAIS */}
            {activeSubTab === 'extensions' && (
                <ExtensionsDirectory extensions={extensions} onChange={onExtensionChange} />
            )}

            {/* 6. FERRAMENTAS (PDF, Tradutor, Linker) */}
            {activeSubTab === 'utils' && (
                <div className="h-full flex flex-col">
                   <OfficeUtilsModule />
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

// Componente Interno para organizar Mural, Notas e Passagem
const NotesModuleInternal: React.FC<any> = ({ postIts, onPostItChange, importantNotes, onNoteChange, handoffs, onHandoffChange, currentUser }) => {
    const [sub, setSub] = useState<'wall' | 'docs' | 'handoff'>('wall');
    return (
        <div className="h-full flex flex-col gap-2">
            <div className="flex gap-2 shrink-0 border-b border-white pb-1">
                <Button size="sm" onClick={() => setSub('wall')} className={sub === 'wall' ? 'bg-white win95-sunken' : ''} icon={<StickyNote size={12}/>}>Mural</Button>
                <Button size="sm" onClick={() => setSub('docs')} className={sub === 'docs' ? 'bg-white win95-sunken' : ''} icon={<FileText size={12}/>}>Anotações</Button>
                <Button size="sm" onClick={() => setSub('handoff')} className={sub === 'handoff' ? 'bg-white win95-sunken' : ''} icon={<ClipboardList size={12}/>}>Passagem</Button>
            </div>
            <div className="flex-1 bg-white win95-sunken overflow-hidden">
                {sub === 'wall' && <StickyNotesWall notes={postIts} onChange={onPostItChange} />}
                {sub === 'docs' && <ImportantNotes notes={importantNotes} onChange={onNoteChange} />}
                {sub === 'handoff' && <ShiftHandoffModule handoffs={handoffs} onChange={onHandoffChange} currentUser={currentUser} />}
            </div>
        </div>
    );
};

// Componente Interno para as Ferramentas Utilitárias
const OfficeUtilsModule: React.FC = () => {
    const [sub, setSub] = useState<'pdf' | 'translate' | 'linker'>('pdf');
    return (
        <div className="h-full flex flex-col gap-2 p-1">
            <div className="flex gap-2 shrink-0 border-b border-white pb-1">
                <Button size="sm" onClick={() => setSub('pdf')} className={sub === 'pdf' ? 'bg-white win95-sunken' : ''} icon={<FileSearch2 size={12}/>}>PDF Utils</Button>
                <Button size="sm" onClick={() => setSub('translate')} className={sub === 'translate' ? 'bg-white win95-sunken' : ''} icon={<Languages size={12}/>}>Tradutor</Button>
                <Button size="sm" onClick={() => setSub('linker')} className={sub === 'linker' ? 'bg-white win95-sunken' : ''} icon={<Link size={12}/>}>Mensageiro</Button>
            </div>
            <div className="flex-1 bg-white win95-sunken overflow-hidden">
                {sub === 'pdf' && <PdfManager />}
                {sub === 'translate' && <TranslatorTool />}
                {sub === 'linker' && <MessageLinker mode="create" />}
            </div>
        </div>
    );
};
