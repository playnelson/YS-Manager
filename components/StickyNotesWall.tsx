
import React from 'react';
import { Plus, Trash2, Palette, FileText, Calendar } from 'lucide-react';
import { PostIt } from '../types';
import { Button } from './ui/Button';

interface StickyNotesWallProps {
  notes: PostIt[];
  onChange: (notes: PostIt[]) => void;
}

const COLORS = [
  { name: 'white', bg: 'bg-[#ffffff]', border: 'border-[#dee2e6]', bar: 'bg-[#ced4da]', text: 'text-[#1c2d3d]' },
  { name: 'blue', bg: 'bg-[#f0f7ff]', border: 'border-[#cfe2ff]', bar: 'bg-[#0064d2]', text: 'text-[#002d5e]' },
  { name: 'gray', bg: 'bg-[#f8f9fa]', border: 'border-[#e9ecef]', bar: 'bg-[#556b82]', text: 'text-[#343a40]' },
  { name: 'mint', bg: 'bg-[#f3faf8]', border: 'border-[#d1e7dd]', bar: 'bg-[#198754]', text: 'text-[#0f5132]' },
  { name: 'sand', bg: 'bg-[#fffcf5]', border: 'border-[#fff3cd]', bar: 'bg-[#ffc107]', text: 'text-[#664d03]' },
];

export const StickyNotesWall: React.FC<StickyNotesWallProps> = ({ notes, onChange }) => {
  
  const addNote = () => {
    const newNote: PostIt = {
      id: `note_${Date.now()}`,
      text: '',
      color: 'white',
      rotation: 0
    };
    onChange([newNote, ...notes]);
  };

  const updateNote = (id: string, text: string) => {
    onChange(notes.map(n => n.id === id ? { ...n, text } : n));
  };

  const changeColor = (id: string) => {
    onChange(notes.map(n => {
      if (n.id === id) {
        const currentIndex = COLORS.findIndex(c => c.name === n.color);
        const nextIndex = (currentIndex + 1) % COLORS.length;
        return { ...n, color: COLORS[nextIndex].name };
      }
      return n;
    }));
  };

  const deleteNote = (id: string) => {
    onChange(notes.filter(n => n.id !== id));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6 flex justify-between items-center border-b border-[#f0f0f0] pb-4">
        <div>
          <h2 className="text-xl font-bold text-[#1c2d3d] flex items-center gap-2">
            Anotações Corporativas
          </h2>
          <p className="text-xs text-[#556b82] mt-1">Gestão de rascunhos e lembretes operacionais.</p>
        </div>
        <Button onClick={addNote} icon={<Plus size={14} />}>
           NOVA ENTRADA
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        {notes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-[#dee2e6] border-2 border-dashed border-[#dee2e6] rounded-md">
            <FileText size={48} className="mb-2 opacity-10" />
            <p className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em]">Nenhum dado registrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-8">
            {notes.map((note) => {
              const colorInfo = COLORS.find(c => c.name === note.color) || COLORS[0];
              return (
                <div 
                  key={note.id}
                  className={`${colorInfo.bg} ${colorInfo.border} border rounded shadow-sm min-h-[160px] flex flex-col transition-all group overflow-hidden hover:shadow-md`}
                >
                  <div className={`h-1 w-full ${colorInfo.bar}`} />
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2">
                       <Calendar size={12} className="text-[#556b82] opacity-40" />
                       <span className="text-[8px] font-bold text-[#556b82] opacity-40">AUTO-SAVE ACTIVE</span>
                    </div>
                    <textarea
                      className={`flex-1 w-full bg-transparent resize-none outline-none text-sm font-medium leading-relaxed ${colorInfo.text} placeholder:opacity-20`}
                      placeholder="Inserir conteúdo..."
                      value={note.text}
                      onChange={(e) => updateNote(note.id, e.target.value)}
                    />
                    
                    <div className="mt-3 flex justify-between items-center pt-2 border-t border-black/5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => changeColor(note.id)}
                        className="p-1.5 hover:bg-black/5 rounded text-[#556b82] transition-colors"
                        title="Alternar Categoria"
                      >
                        <Palette size={14} />
                      </button>
                      <button 
                        onClick={() => deleteNote(note.id)}
                        className="p-1.5 hover:bg-red-50 text-red-600 rounded transition-colors"
                        title="Remover Registro"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
