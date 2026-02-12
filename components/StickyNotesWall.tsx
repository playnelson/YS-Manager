
import React from 'react';
import { Plus, Trash2, Palette, Calendar, StickyNote, Download, Clock } from 'lucide-react';
import { PostIt } from '../types';
import { Button } from './ui/Button';

interface StickyNotesWallProps {
  notes: PostIt[];
  onChange: (notes: PostIt[]) => void;
}

const COLORS = [
  { name: 'sand', bg: 'bg-[#ffff88]', border: 'border-[#e6e600]', bar: 'bg-[#cccc00]', text: 'text-black' }, // Amarelo clássico
  { name: 'blue', bg: 'bg-[#c0ebff]', border: 'border-[#a0d8f0]', bar: 'bg-[#0064d2]', text: 'text-black' },
  { name: 'mint', bg: 'bg-[#cfffcf]', border: 'border-[#a8e0a8]', bar: 'bg-[#198754]', text: 'text-black' },
  { name: 'pink', bg: 'bg-[#ffc0cb]', border: 'border-[#f0a0b0]', bar: 'bg-[#d63384]', text: 'text-black' },
  { name: 'white', bg: 'bg-[#ffffff]', border: 'border-[#dee2e6]', bar: 'bg-[#808080]', text: 'text-black' },
];

export const StickyNotesWall: React.FC<StickyNotesWallProps> = ({ notes, onChange }) => {
  
  const addNote = () => {
    const newNote: PostIt = {
      id: `note_${Date.now()}`,
      text: '',
      color: 'sand',
      rotation: 0,
      createdAt: new Date().toISOString()
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
    if (confirm("Deseja remover este post-it?")) {
      onChange(notes.filter(n => n.id !== id));
    }
  };

  const downloadDailyReport = () => {
    const todayStr = new Date().toLocaleDateString('pt-BR');
    
    // Filtrar notas criadas hoje ou que não tem data (assumidas como antigas/permanentes)
    // Se quiser estritamente apenas HOJE, altere a lógica. Aqui pegaremos as de hoje.
    const todaysNotes = notes.filter(n => {
      if (!n.createdAt) return false;
      return new Date(n.createdAt).toLocaleDateString('pt-BR') === todayStr;
    });

    if (todaysNotes.length === 0) {
      alert("Nenhum post-it foi criado hoje para gerar o relatório.");
      return;
    }

    // Ordenar por hora
    todaysNotes.sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());

    let content = `RELATÓRIO DIÁRIO DE LEMBRETES - ${todayStr}\n`;
    content += `Gerado pelo Sistema Brain\n`;
    content += `=================================================\n\n`;

    todaysNotes.forEach((n, index) => {
      const time = new Date(n.createdAt!).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});
      const cleanText = n.text || "(Sem conteúdo)";
      
      content += `[${time}] NOTA #${index + 1}\n`;
      content += `---------------------------------\n`;
      content += `${cleanText}\n`;
      content += `\n`;
    });

    content += `=================================================\n`;
    content += `Total de notas: ${todaysNotes.length}`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Relatorio_PostIts_${todayStr.replace(/\//g, '-')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-full flex flex-col bg-[#808080]/5">
      {/* Toolbar estilo Win95 */}
      <div className="mb-4 flex justify-between items-center bg-win95-bg win95-raised p-2 shrink-0 gap-2">
        <div className="flex items-center gap-2 px-2 flex-1">
          <StickyNote size={18} className="text-win95-blue" />
          <h2 className="text-sm font-black uppercase text-black tracking-tight hidden md:block">
            Mural de Lembretes Rápidos
          </h2>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={downloadDailyReport} icon={<Download size={14} />} variant="secondary" title="Baixar relatório de hoje">
             RELATÓRIO DIÁRIO
          </Button>
          <Button onClick={addNote} icon={<Plus size={14} />} className="bg-win95-bg">
             NOVA ANOTAÇÃO
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {notes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-[#808080] opacity-30">
            <StickyNote size={64} className="mb-4" />
            <p className="text-xs font-black uppercase tracking-[0.2em]">O mural está vazio</p>
            <p className="text-[10px]">Clique em 'Nova Anotação' para colar um lembrete</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 pb-8">
            {notes.map((note) => {
              const colorInfo = COLORS.find(c => c.name === note.color) || COLORS[0];
              const timeStr = note.createdAt 
                ? new Date(note.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                : '';

              return (
                <div 
                  key={note.id}
                  className={`${colorInfo.bg} ${colorInfo.border} border-t border-l shadow-[4px_4px_0px_rgba(0,0,0,0.15)] aspect-square flex flex-col transition-all group overflow-hidden hover:-translate-y-1 hover:shadow-[6px_6px_0px_rgba(0,0,0,0.1)] relative`}
                >
                  {/* Barra superior do Post-it */}
                  <div className={`h-1.5 w-full ${colorInfo.bar} opacity-40`} />
                  
                  <div className="p-3 flex flex-col flex-1">
                    <div className="flex justify-between items-center mb-1 select-none">
                       <div className="flex items-center gap-1 opacity-40">
                          <Calendar size={10} className="text-black" />
                          <span className="text-[8px] font-bold text-black uppercase">Lembrete</span>
                       </div>
                       {timeStr && (
                         <div className="flex items-center gap-0.5 opacity-60 text-black">
                            <Clock size={8} />
                            <span className="text-[8px] font-mono font-bold">{timeStr}</span>
                         </div>
                       )}
                    </div>
                    
                    <textarea
                      className={`flex-1 w-full bg-transparent resize-none outline-none text-xs font-bold leading-snug ${colorInfo.text} placeholder:text-black/20 custom-scrollbar`}
                      placeholder="Escreva algo..."
                      value={note.text}
                      onChange={(e) => updateNote(note.id, e.target.value)}
                    />
                    
                    <div className="mt-2 flex justify-between items-center pt-2 border-t border-black/10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => changeColor(note.id)}
                        className="p-1 hover:bg-black/5 rounded text-black/60 transition-colors"
                        title="Mudar Cor"
                      >
                        <Palette size={14} />
                      </button>
                      <button 
                        onClick={() => deleteNote(note.id)}
                        className="p-1 hover:bg-red-50 text-red-700 rounded transition-colors"
                        title="Remover"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Detalhe de "papel" no canto inferior direito */}
                  <div className="absolute bottom-0 right-0 w-4 h-4 overflow-hidden pointer-events-none">
                    <div className="absolute bottom-[-8px] right-[-8px] w-8 h-8 bg-black/5 rotate-45 transform" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-1 px-3 bg-win95-bg border-t border-white text-[9px] font-bold text-win95-shadow uppercase italic shrink-0">
        <span>Dica: Use o botão de relatório para salvar suas anotações do dia.</span>
      </div>
    </div>
  );
};
