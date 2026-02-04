
import React, { useState } from 'react';
import { Plus, Search, Trash2, ArrowRight, ArrowLeft, AlertCircle, Clock, Filter, Archive } from 'lucide-react';
import { KanbanState, KanbanCard, KanbanPriority } from '../types';
import { Button } from './ui/Button';

interface KanbanBoardProps {
  data: KanbanState;
  onChange: (data: KanbanState) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ data, onChange }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const addCard = (column: keyof KanbanState) => {
    const newCard: KanbanCard = {
      id: `card_${Date.now()}`,
      title: 'Nova Atividade',
      description: '',
      priority: 'medium',
      createdAt: new Date().toISOString()
    };
    onChange({ ...data, [column]: [newCard, ...data[column]] });
  };

  const updateCard = (column: keyof KanbanState, id: string, field: keyof KanbanCard, value: any) => {
    const newColumns = { ...data };
    newColumns[column] = newColumns[column].map(card => card.id === id ? { ...card, [field]: value } : card);
    onChange(newColumns);
  };

  const deleteCard = (column: keyof KanbanState, id: string) => {
    if (!window.confirm("Deseja excluir permanentemente este card?")) return;
    const newColumns = { ...data };
    newColumns[column] = newColumns[column].filter(card => card.id !== id);
    onChange(newColumns);
  };

  const moveCard = (currentCol: keyof KanbanState, id: string, direction: 'next' | 'prev') => {
    const order: (keyof KanbanState)[] = ['todo', 'doing', 'done'];
    const currentIndex = order.indexOf(currentCol);
    
    let nextIndex;
    if (direction === 'next') {
      nextIndex = currentIndex + 1;
    } else {
      nextIndex = currentIndex - 1;
    }

    if (nextIndex < 0 || nextIndex >= order.length) return;

    const nextCol = order[nextIndex];
    const cardToMove = data[currentCol].find(c => c.id === id);
    if (!cardToMove) return;

    const newData = { ...data };
    newData[currentCol] = newData[currentCol].filter(c => c.id !== id);
    newData[nextCol] = [cardToMove, ...newData[nextCol]];
    onChange(newData);
  };

  const clearDone = () => {
    if (!window.confirm("Arquivar todos os cards concluídos?")) return;
    onChange({ ...data, done: [] });
  };

  const priorityConfig = {
    high: { label: 'Alta', color: 'bg-red-600', text: 'text-white' },
    medium: { label: 'Média', color: 'bg-yellow-400', text: 'text-black' },
    low: { label: 'Baixa', color: 'bg-blue-500', text: 'text-white' }
  };

  const filterCards = (cards: KanbanCard[]) => {
    return cards.filter(c => 
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const columns: { id: keyof KanbanState, label: string, color: string }[] = [
    { id: 'todo', label: 'Pendentes', color: 'bg-[#000080]' },
    { id: 'doing', label: 'Em Execução', color: 'bg-[#808000]' },
    { id: 'done', label: 'Concluído', color: 'bg-[#008000]' }
  ];

  return (
    <div className="flex flex-col h-full bg-[#c0c0c0]">
      {/* Kanban Toolbar */}
      <div className="flex justify-between items-center bg-win95-bg p-2 win95-raised mb-2 gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2 text-win95-shadow" size={14} />
          <input 
            type="text"
            placeholder="Pesquisar tarefas..."
            className="w-full pl-8 pr-3 py-1 win95-sunken text-xs outline-none focus:bg-white text-black"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="win95-sunken px-3 py-1 bg-white text-[10px] font-bold text-win95-blue hidden sm:block">
            TOTAL: {data.todo.length + data.doing.length + data.done.length} TAREFAS
          </div>
          <Button size="sm" onClick={clearDone} icon={<Archive size={14} />} title="Arquivar Concluídos">
            LIMPAR
          </Button>
        </div>
      </div>

      {/* Kanban Board Layout */}
      <div className="flex-1 flex gap-2 overflow-x-auto p-1 pb-4">
        {columns.map((col) => (
          <div key={col.id} className="w-80 flex flex-col shrink-0">
            {/* Column Header */}
            <div className={`${col.color} text-white px-3 py-1.5 text-xs font-bold uppercase flex justify-between items-center mb-1 win95-raised border-none shadow-md`}>
               <div className="flex items-center gap-2">
                 <Filter size={12} className="opacity-50" />
                 <span>{col.label}</span>
               </div>
               <span className="bg-white/20 px-2 rounded-sm">{data[col.id].length}</span>
            </div>
            
            {/* Column Body */}
            <div className="flex-1 win95-sunken p-2 space-y-3 overflow-y-auto bg-[#808080]/10">
              {filterCards(data[col.id]).map((card) => (
                <div key={card.id} className="win95-raised p-2 bg-win95-bg group relative hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-transform">
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col gap-1 w-full">
                      <div className="flex items-center gap-2 mb-1">
                        <select 
                          className={`text-[9px] font-bold px-1 py-0.5 uppercase border border-black/20 outline-none ${priorityConfig[card.priority].color} ${priorityConfig[card.priority].text}`}
                          value={card.priority}
                          onChange={(e) => updateCard(col.id, card.id, 'priority', e.target.value)}
                        >
                          <option value="high">Alta</option>
                          <option value="medium">Média</option>
                          <option value="low">Baixa</option>
                        </select>
                        <span className="text-[9px] text-[#555] flex items-center gap-1 font-mono">
                          <Clock size={10} /> {new Date(card.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <input 
                        className="text-[11px] font-bold bg-transparent outline-none w-full border-b border-transparent focus:border-win95-blue text-black truncate"
                        value={card.title}
                        onChange={(e) => updateCard(col.id, card.id, 'title', e.target.value)}
                      />
                    </div>
                    <button onClick={() => deleteCard(col.id, card.id)} className="text-[#808080] hover:text-red-700 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>

                  {/* Card Description */}
                  <textarea
                    className="w-full text-[10px] bg-white win95-sunken p-1.5 outline-none resize-none text-black leading-relaxed"
                    rows={3}
                    placeholder="Descrição da atividade..."
                    value={card.description}
                    onChange={(e) => updateCard(col.id, card.id, 'description', e.target.value)}
                  />

                  {/* Card Actions */}
                  <div className="mt-3 flex justify-between items-center gap-1">
                     <div className="flex gap-1">
                        {col.id !== 'todo' && (
                          <button 
                            onClick={() => moveCard(col.id, card.id, 'prev')} 
                            className="win95-raised p-1 text-[#000080] hover:bg-white active:shadow-none"
                            title="Mover para coluna anterior"
                          >
                            <ArrowLeft size={12} />
                          </button>
                        )}
                     </div>
                     <div className="flex gap-1">
                        {col.id !== 'done' && (
                          <button 
                            onClick={() => moveCard(col.id, card.id, 'next')} 
                            className="win95-raised px-2 py-1 text-[9px] font-bold uppercase flex items-center gap-1 bg-win95-bg hover:bg-white active:shadow-none text-black"
                          >
                            Avançar <ArrowRight size={10} />
                          </button>
                        )}
                     </div>
                  </div>
                </div>
              ))}
              
              <button 
                onClick={() => addCard(col.id)} 
                className="w-full py-2 win95-raised text-[10px] font-bold uppercase hover:bg-white transition-colors text-black flex items-center justify-center gap-2"
              >
                <Plus size={14} /> Adicionar Atividade
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Footer Info */}
      <div className="p-1 px-3 bg-win95-bg border-t border-white text-[9px] flex justify-between text-[#555] font-bold">
        <span className="flex items-center gap-1"><AlertCircle size={10} /> Arraste os cards (Em breve) ou use os botões de ação para organizar o fluxo.</span>
        <span>MODO: GESTÃO EMPRESARIAL</span>
      </div>
    </div>
  );
};
