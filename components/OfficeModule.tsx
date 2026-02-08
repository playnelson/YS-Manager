
import React, { useState } from 'react';
import { Mail, PenTool, FileSearch2, Globe } from 'lucide-react';
import { EmailTemplate, Signature, UserEvent, ProfessionalLink } from '../types';
import { EmailManager } from './EmailManager';
import { SignatureManager } from './SignatureManager';
import { PdfManager } from './PdfManager';
import { ProfessionalLinks } from './ProfessionalLinks';
import { Button } from './ui/Button';

interface OfficeModuleProps {
  emails: EmailTemplate[];
  onEmailChange: (emails: EmailTemplate[]) => void;
  signatures: Signature[];
  onSignatureChange: (signatures: Signature[]) => void;
  onAddEvent: (event: UserEvent) => void;
  links: ProfessionalLink[];
  onLinkChange: (links: ProfessionalLink[]) => void;
}

export const OfficeModule: React.FC<OfficeModuleProps> = ({
  emails,
  onEmailChange,
  signatures,
  onSignatureChange,
  onAddEvent,
  links,
  onLinkChange
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'email' | 'signatures' | 'pdf' | 'links'>('email');

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
        <Button 
          onClick={() => setActiveSubTab('links')} 
          className={activeSubTab === 'links' ? 'bg-white win95-sunken' : ''}
          icon={<Globe size={14} />}
        >
          Diretório Web
        </Button>
      </div>

      {/* Área de Conteúdo */}
      <div className="flex-1 win95-sunken bg-[#808080] p-0.5 overflow-hidden border-2 border-white border-t-[#808080] border-l-[#808080] border-r-white border-b-white">
        <div className="h-full w-full bg-win95-bg">
            {activeSubTab === 'email' && (
                <EmailManager emails={emails} onChange={onEmailChange} />
            )}
            {activeSubTab === 'signatures' && (
                <SignatureManager signatures={signatures} onChange={onSignatureChange} onAddEvent={onAddEvent} />
            )}
            {activeSubTab === 'pdf' && (
                <PdfManager />
            )}
            {activeSubTab === 'links' && (
                <ProfessionalLinks links={links} onChange={onLinkChange} />
            )}
        </div>
      </div>
    </div>
  );
};
