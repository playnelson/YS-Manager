
import React, { useState } from 'react';
import { Plus, Trash2, Palette, Calendar, StickyNote, Download, Clock, X, FileText, ArrowRight } from 'lucide-react';
import { PostIt } from '../types';
import { Button } from './ui/Button';

interface StickyNotesWallProps {
  notes: PostIt[];
  onChange: (notes: PostIt[]) => void;
}

const COLORS = [
  { name: 'sand', bg: 'bg-[#FEF9E1]', border: 'border-[#E6D5B8]', bar: 'bg-[#B4B4B8]', text: 'text-palette-darkest' },
  { name: 'blue', bg: 'bg-[#E3F2FD]', border: 'border-[#BBDEFB]', bar: 'bg-[#B4B4B8]', text: 'text-palette-darkest' },
  { name: 'mint', bg: 'bg-[#E8F5E9]', border: 'border-[#C8E6C9]', bar: 'bg-[#B4B4B8]', text: 'text-palette-darkest' },
  { name: 'pink', bg: 'bg-[#FCE4EC]', border: 'border-[#F8BBD0]', bar: 'bg-[#B4B4B8]', text: 'text-palette-darkest' },
  { name: 'white', bg: 'bg-palette-lightest', border: 'border-palette-mediumDark', bar: 'bg-palette-mediumDark', text: 'text-palette-darkest' },
];

export const StickyNotesWall: React.FC<StickyNotesWallProps> = ({ notes, onChange }) => {
  // Estados para o Modal de Relatório
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Agora usamos Data Inicio e Data Fim separadas para cobrir turnos noturnos (ex: 22h as 06h do dia seguinte)
  const [reportStartDate, setReportStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().split('T')[0]);

  const [reportStartTime, setReportStartTime] = useState('00:00');
  const [reportEndTime, setReportEndTime] = useState('23:59');

  const addNote = () => {
    const newNote: PostIt = {
      id: crypto.randomUUID(),
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

  const handleGenerateReport = () => {
    // Cria objetos Date combinando Data + Hora para inicio e fim
    const startDateTime = new Date(`${reportStartDate}T${reportStartTime}:00`);
    const endDateTime = new Date(`${reportEndDate}T${reportEndTime}:59`);

    if (endDateTime < startDateTime) {
      alert("A data/hora final não pode ser anterior à data/hora inicial.");
      return;
    }

    const filteredNotes = notes.filter(n => {
      if (!n.createdAt) return false;
      const noteTime = new Date(n.createdAt);
      return noteTime >= startDateTime && noteTime <= endDateTime;
    });

    if (filteredNotes.length === 0) {
      alert("Nenhum post-it encontrado neste período.");
      return;
    }

    // Ordenar por hora
    filteredNotes.sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());

    const dateStartFmt = new Date(startDateTime).toLocaleDateString('pt-BR');
    const dateEndFmt = new Date(endDateTime).toLocaleDateString('pt-BR');

    let content = `RELATÓRIO DE LEMBRETES - BRAIN\n`;
    content += `=================================================\n`;
    content += `Período: ${dateStartFmt} ${reportStartTime}  ATÉ  ${dateEndFmt} ${reportEndTime}\n`;
    content += `Total de itens: ${filteredNotes.length}\n`;
    content += `=================================================\n\n`;

    filteredNotes.forEach((n, index) => {
      const noteDate = new Date(n.createdAt!);
      const dateStr = noteDate.toLocaleDateString('pt-BR');
      const timeStr = noteDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const cleanText = n.text || "(Sem conteúdo)";

      content += `#${index + 1} - [${dateStr} às ${timeStr}]\n`;
      content += `---------------------------------\n`;
      content += `${cleanText}\n`;
      content += `\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Relatorio_Turno_${reportStartDate}_${reportStartTime.replace(':', '')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsReportModalOpen(false);
  };

  return (
    <div className="h-full flex flex-col bg-palette-mediumLight/10 font-sans">
      <div className="mb-4 flex justify-between items-center bg-palette-lightest win95-raised p-2 shrink-0 gap-2">
        <div className="flex items-center gap-2 px-2 flex-1">
          <StickyNote size={18} className="text-palette-darkest" />
          <h2 className="text-sm font-black uppercase text-black tracking-tight hidden md:block">
            Mural de Lembretes Rápidos
          </h2>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => setIsReportModalOpen(true)} icon={<Download size={14} />} variant="secondary" title="Gerar relatório personalizado">
            RELATÓRIO
          </Button>
          <Button onClick={addNote} icon={<Plus size={14} />} className="bg-palette-lightest">
            NOVA ANOTAÇÃO
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {notes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-palette-darkest opacity-30">
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
              const dateStr = note.createdAt
                ? new Date(note.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
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
                        <span className="text-[8px] font-bold text-black uppercase">{dateStr}</span>
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

                    <div className="mt-2 flex justify-between items-center pt-2 border-t border-palette-mediumDark/30 opacity-0 group-hover:opacity-100 transition-opacity">
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

      <div className="p-1 px-3 bg-palette-lightest border-t border-palette-mediumDark text-[9px] font-bold text-palette-darkest/60 uppercase italic shrink-0">
        <span>Dica: Use o botão de relatório para salvar suas anotações do turno.</span>
      </div>

      {isReportModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 backdrop-blur-[1px]">
          <div className="bg-palette-lightest w-full max-w-sm win95-raised p-1 shadow-2xl animate-in zoom-in duration-200">
            <div className="bg-palette-darkest text-white px-2 py-1 text-xs font-bold flex justify-between items-center mb-2 shadow-sm">
              <span className="flex items-center gap-2"><FileText size={12} /> Gerar Relatório de Turno</span>
              <button onClick={() => setIsReportModalOpen(false)} className="win95-raised bg-palette-lightest text-black w-5 h-5 flex items-center justify-center text-xs font-black">×</button>
            </div>

            <div className="p-4 space-y-4">
              {/* Intervalo de Início */}
              <div className="bg-white/50 p-2 win95-sunken">
                <div className="flex items-center gap-2 mb-1 text-win95-blue font-bold uppercase text-[10px]">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Início do Turno
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[9px] font-bold block">DATA:</label>
                    <input
                      type="date"
                      className="w-full win95-raised px-1 py-1 text-xs font-bold bg-white"
                      value={reportStartDate}
                      onChange={(e) => setReportStartDate(e.target.value)}
                    />
                  </div>
                  <div className="w-24">
                    <label className="text-[9px] font-bold block">HORA:</label>
                    <input
                      type="time"
                      className="w-full win95-raised px-1 py-1 text-xs font-bold bg-white"
                      value={reportStartTime}
                      onChange={(e) => setReportStartTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-center -my-2 relative z-10">
                <div className="bg-palette-lightest p-1 rounded-full border border-palette-mediumDark">
                  <ArrowRight size={12} className="text-palette-darkest/60 rotate-90" />
                </div>
              </div>

              {/* Intervalo de Fim */}
              <div className="bg-white/50 p-2 win95-sunken">
                <div className="flex items-center gap-2 mb-1 text-win95-blue font-bold uppercase text-[10px]">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  Fim do Turno
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[9px] font-bold block">DATA:</label>
                    <input
                      type="date"
                      className="w-full win95-raised px-1 py-1 text-xs font-bold bg-white"
                      value={reportEndDate}
                      onChange={(e) => setReportEndDate(e.target.value)}
                    />
                  </div>
                  <div className="w-24">
                    <label className="text-[9px] font-bold block">HORA:</label>
                    <input
                      type="time"
                      className="w-full win95-raised px-1 py-1 text-xs font-bold bg-white"
                      value={reportEndTime}
                      onChange={(e) => setReportEndTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 p-2 text-[9px] text-yellow-800 leading-tight">
                <span className="font-bold">Dica:</span> Para turno da noite, defina o "Início" no dia atual (ex: 22:00) e o "Fim" no dia seguinte (ex: 06:00).
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-300">
                <Button onClick={() => setIsReportModalOpen(false)} variant="secondary" size="sm">Cancelar</Button>
                <Button onClick={handleGenerateReport} icon={<Download size={12} />} size="sm">Baixar Arquivo</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
