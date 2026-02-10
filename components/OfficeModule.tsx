
import React, { useState } from 'react';
import { Mail, PenTool, FileSearch2, FileText, Languages, Link } from 'lucide-react';
import { EmailTemplate, Signature, UserEvent } from '../types';
import { EmailManager } from './EmailManager';
import { SignatureManager } from './SignatureManager';
import { PdfManager } from './PdfManager';
import { DocumentGenerator } from './DocumentGenerator';
import { TranslatorTool } from './TranslatorTool';
import { MessageLinker } from './MessageLinker';
import { Button } from './ui/Button';

interface OfficeModuleProps {
  emails: EmailTemplate[];
  onEmailChange: (emails: EmailTemplate[]) => void;
  signatures: Signature[];
  onSignatureChange: (signatures: Signature[]) => void;
  onAddEvent: (event: UserEvent) => void;
}

export const OfficeModule: React.FC<OfficeModuleProps> = ({
  emails,
  onEmailChange,
  signatures,
  onSignatureChange,
  onAddEvent
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'email' | 'signatures' | 'pdf' | 'docs' | 'translate' | 'linker'>('email');

  return (
    <div className="h-full flex flex-col gap-2">
      {/* Sub-navegação interna */}
      <div className="flex gap-2 shrink-0 border-b border-white pb-1 overflow-x-auto">
        <Button 
          onClick={() => setActiveSubTab('email')} 
          className={activeSubTab === 'email' ? 'bg-white win95-sunken' : ''}
          icon={<Mail size={14} />}
        >
          E-mails
        </Button>
        <Button 
          onClick={() => setActiveSubTab('docs')} 
          className={activeSubTab === 'docs' ? 'bg-white win95-sunken' : ''}
          icon={<FileText size={14} />}
        >
          Criador de Docs
        </Button>
        <Button 
          onClick={() => setActiveSubTab('linker')} 
          className={activeSubTab === 'linker' ? 'bg-white win95-sunken' : ''}
          icon={<Link size={14} />}
        >
          Mensageiro Linkado
        </Button>
        <Button 
          onClick={() => setActiveSubTab('translate')} 
          className={activeSubTab === 'translate' ? 'bg-white win95-sunken' : ''}
          icon={<Languages size={14} />}
        >
          Tradutor
        </Button>
        <Button 
          onClick={() => setActiveSubTab('signatures')} 
          className={activeSubTab === 'signatures' ? 'bg-white win95-sunken' : ''}
          icon={<PenTool size={14} />}
        >
          Assinador Digital
        </Button>
        <Button 
          onClick={() => setActiveSubTab('pdf')} 
          className={activeSubTab === 'pdf' ? 'bg-white win95-sunken' : ''}
          icon={<FileSearch2 size={14} />}
        >
          Utilitários PDF
        </Button>
      </div>

      {/* Área de Conteúdo */}
      <div className="flex-1 win95-sunken bg-[#808080] p-0.5 overflow-hidden border-2 border-white border-t-[#808080] border-l-[#808080] border-r-white border-b-white">
        <div className="h-full w-full bg-win95-bg">
            {activeSubTab === 'email' && (
                <EmailManager emails={emails} onChange={onEmailChange} />
            )}
            {activeSubTab === 'docs' && (
                <DocumentGenerator />
            )}
            {activeSubTab === 'linker' && (
                <MessageLinker mode="create" />
            )}
            {activeSubTab === 'translate' && (
                <TranslatorTool />
            )}
            {activeSubTab === 'signatures' && (
                <SignatureManager signatures={signatures} onChange={onSignatureChange} onAddEvent={onAddEvent} />
            )}
            {activeSubTab === 'pdf' && (
                <PdfManager />
            )}
        </div>
      </div>
    </div>
  );
};
