
import React from 'react';
import { Plus, Trash2, Palette } from 'lucide-react';
import { PostIt } from '../types';

interface StickyNotesWallProps {
  notes: PostIt[];
  onChange: (notes: PostIt[]) => void;
}

const COLORS = [
  { name: 'yellow', bg: 'bg-yellow-200', border: 'border-yellow-300', text: 'text-yellow-900' },
  { name: 'blue', bg: 'bg-blue-200', border: 'border-blue-300', text: 'text-blue-900' },
  { name: 'green', bg: 'bg-green-200', border: 'border-green-300', text: 'text-green-900' },
  { name: 'pink', bg: 'bg-pink-200', border: 'border-pink-300', text: 'text-pink-900' },
  { name: 'orange', bg: 'bg-orange-200', border: 'border-orange-300', text: 'text-orange-900' },
];

export const StickyNotesWall: React.FC<StickyNotesWallProps> = ({ notes, onChange }) => {
  
  const addNote = () => {
    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)].name;
    const randomRotation = Math.floor(Math.random() * 6) - 3; // -3 to +3 degrees
    const newNote: PostIt = {
      id: `note_${Date.now()}`,
      text: '',
      color: randomColor,
      rotation: randomRotation
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
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Mural de Idéias</h2>
          <p className="text-sm text-slate-500 font-medium">Anote pensamentos rápidos e lembretes.</p>
        </div>
        <button 
          onClick={addNote}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-indigo-200 transition-all active:scale-95"
        >
          <Plus size={18} /> Novo Post-it
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {notes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center border-4 border-dashed border-slate-200 rounded-3xl opacity-40">
            <Plus size={48} className="text-slate-300 mb-2" />
            <p className="font-bold text-slate-400 uppercase tracking-widest">Seu mural está vazio</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-12">
            {notes.map((note) => {
              const colorInfo = COLORS.find(c => c.name === note.color) || COLORS[0];
              return (
                <div 
                  key={note.id}
                  style={{ transform: `rotate(${note.rotation}deg)` }}
                  className={`${colorInfo.bg} ${colorInfo.border} border shadow-lg p-5 min-h-[220px] flex flex-col transition-all hover:scale-105 hover:shadow-xl group relative`}
                >
                  {/* Pin logic visualization */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-500 rounded-full shadow-inner border-2 border-red-600 z-10" />
                  
                  <textarea
                    className={`flex-1 w-full bg-transparent resize-none outline-none font-medium leading-relaxed ${colorInfo.text} placeholder:text-black/20`}
                    placeholder="Escreva algo..."
                    value={note.text}
                    onChange={(e) => updateNote(note.id, e.target.value)}
                  />
                  
                  <div className="mt-4 flex justify-between items-center pt-3 border-t border-black/5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => changeColor(note.id)}
                      className="p-1.5 hover:bg-black/5 rounded-lg transition-colors"
                      title="Mudar Cor"
                    >
                      <Palette size={16} className={colorInfo.text} />
                    </button>
                    <button 
                      onClick={() => deleteNote(note.id)}
                      className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors text-red-700"
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
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
