
import React, { useState } from 'react';
import { StickyNote, FileText } from 'lucide-react';
import { PostIt, ImportantNote } from '../types';
import { StickyNotesWall } from './StickyNotesWall';
import { ImportantNotes } from './ImportantNotes';
import { Button } from './ui/Button';

interface NotesModuleProps {
  postIts: PostIt[];
  onPostItChange: (notes: PostIt[]) => void;
  importantNotes: ImportantNote[];
  onNoteChange: (notes: ImportantNote[]) => void;
}

export const NotesModule: React.FC<NotesModuleProps> = ({ 
  postIts, 
  onPostItChange, 
  importantNotes, 
  onNoteChange 
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'wall' | 'docs'>('wall');

  return (
    <div className="h-full flex flex-col gap-2">
      {/* Sub-navegação interna */}
      <div className="flex gap-2 shrink-0 border-b border-white pb-1">
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
      </div>

      {/* Área de Conteúdo */}
      <div className="flex-1 win95-sunken bg-[#808080] p-0.5 overflow-hidden border-2 border-white border-t-[#808080] border-l-[#808080] border-r-white border-b-white">
        <div className="h-full w-full bg-win95-bg">
            {activeSubTab === 'wall' ? (
                <StickyNotesWall notes={postIts} onChange={onPostItChange} />
            ) : (
                <ImportantNotes notes={importantNotes} onChange={onNoteChange} />
            )}
        </div>
      </div>
    </div>
  );
};
