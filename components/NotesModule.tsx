'use client';

import React, { useState } from 'react';
import { StickyNote, FileText, ClipboardList } from 'lucide-react';
import { PostIt, ImportantNote, ShiftHandoff, User } from '@/types';
import { StickyNotesWall } from '@/components/StickyNotesWall';
import { ImportantNotes } from '@/components/ImportantNotes';
import { ShiftHandoffModule } from '@/components/ShiftHandoff';
import { Button } from '@/components/ui/Button';

interface NotesModuleProps {
  postIts: PostIt[];
  onPostItChange: (notes: PostIt[]) => void;
  importantNotes: ImportantNote[];
  onNoteChange: (notes: ImportantNote[]) => void;
  handoffs?: ShiftHandoff[];
  onHandoffChange?: (handoffs: ShiftHandoff[]) => void;
  currentUser?: User | null;
}

export const NotesModule: React.FC<NotesModuleProps> = ({ 
  postIts, 
  onPostItChange, 
  importantNotes, 
  onNoteChange,
  handoffs = [],
  onHandoffChange = () => {},
  currentUser = null
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'wall' | 'docs' | 'handoff'>('wall');

  return (
    <div className="h-full flex flex-col gap-2">
      {/* Sub-navegação interna */}
      <div className="flex gap-2 shrink-0 border-b border-white pb-1 overflow-x-auto">
        <Button 
          onClick={() => setActiveSubTab('wall')} 
          className={activeSubTab === 'wall' ? 'bg-white win95-sunken' : ''}
          icon={<StickyNote size={14} />}
        >
          Mural de Avisos
        </Button>
        <Button 
          onClick={() => setActiveSubTab('docs')} 
          className={activeSubTab === 'docs' ? 'bg-white win95-sunken' : ''}
          icon={<FileText size={14} />}
        >
          Anotações
        </Button>
        <Button 
          onClick={() => setActiveSubTab('handoff')} 
          className={activeSubTab === 'handoff' ? 'bg-white win95-sunken' : ''}
          icon={<ClipboardList size={14} />}
        >
          Passagem de Serviço
        </Button>
      </div>

      {/* Área de Conteúdo */}
      <div className="flex-1 win95-sunken bg-[#808080] p-0.5 overflow-hidden border-2 border-white border-t-[#808080] border-l-[#808080] border-r-white border-b-white">
        <div className="h-full w-full bg-win95-bg">
            {activeSubTab === 'wall' && (
                <StickyNotesWall notes={postIts} onChange={onPostItChange} />
            )}
            {activeSubTab === 'docs' && (
                <ImportantNotes notes={importantNotes} onChange={onNoteChange} />
            )}
            {activeSubTab === 'handoff' && (
                <ShiftHandoffModule handoffs={handoffs} onChange={onHandoffChange} currentUser={currentUser} />
            )}
        </div>
      </div>
    </div>
  );
};
