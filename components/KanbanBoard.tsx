
import React from 'react';
import { Plus, Trash2, ArrowRight, CheckCircle2, Clock, ListTodo } from 'lucide-react';
import { KanbanState, KanbanCard } from '../types';
import { Button } from './ui/Button';

interface KanbanBoardProps {
  data: KanbanState;
  onChange: (data: KanbanState) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ data, onChange }) => {
  
  const addCard = (column: keyof KanbanState) => {
    const newCard: KanbanCard = {
      id: `card_${Date.now()}`,
      title: 'Nova Atividade',
      description: ''
    };
    onChange({
      ...data,
      [column]: [newCard, ...data[column]]
    });
  };

  const updateCard = (column: keyof KanbanState, id: string, field: keyof KanbanCard, value: string) => {
    const newColumns = { ...data };
    newColumns[column] = newColumns[column].map(card => 
      card.id === id ? { ...card, [field]: value } : card
    );
    onChange(newColumns);
  };

  const deleteCard = (column: keyof KanbanState, id: string) => {
    if(!window.confirm("Excluir este registro?")) return;
    const newColumns = { ...data };
    newColumns[column] = newColumns[column].filter(card => card.id !== id);
    onChange(newColumns);
  };

  const moveCard = (currentCol: keyof KanbanState, id: string) => {
    const order: (keyof KanbanState)[] = ['todo', 'doing', 'done'];
    const currentIndex = order.indexOf(currentCol);
    const nextCol = order[(currentIndex + 1) % 3];
    const cardToMove = data[currentCol].find(c => c.id === id);
    if (!cardToMove) return;

    const newData = { ...data };
    newData[currentCol] = newData[currentCol].filter(c => c.id !== id);
    newData[nextCol] = [cardToMove, ...newData[nextCol]];
    onChange(newData);
  };

  const getColIcon = (col: string) => {
    if (col === 'todo') return <ListTodo size={14} className="text-[#556b82]" />;
    if (col === 'doing') return <Clock size={14} className="text-[#0064d2]" />;
    return <CheckCircle2 size={14} className="text-[#198754]" />;
  };

  return (
    <div className="flex h-full gap-4 overflow-x-auto">
      {(Object.keys(data) as Array<keyof KanbanState>).map((col) => (
        <div key={col} className="w-80 flex flex-col bg-[#f8f9fa] border border-[#dee2e6] rounded-sm shrink-0">
          <div className="p-3 border-b border-[#dee2e6] flex justify-between items-center bg-white">
            <div className="flex items-center gap-2">
              {getColIcon(col)}
              <h3 className="font-bold text-[#1c2d3d] uppercase text-[11px] tracking-wider">
                {col === 'todo' ? 'Pendente' : col === 'doing' ? 'Em Execução' : 'Finalizado'}
              </h3>
            </div>
            <span className="text-[10px] font-bold text-[#556b82] bg-[#f1f4f6] px-2 py-0.5 rounded">
              {data[col].length}
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {data[col].map((card) => (
              <div key={card.id} className="bg-white p-3 border border-[#dee2e6] rounded shadow-sm hover:border-[#0064d2]/30 transition-all group">
                <div className="flex justify-between items-start mb-2">
                  <input 
                    className="text-sm font-bold text-[#1c2d3d] bg-transparent outline-none w-full focus:text-[#0064d2]"
                    value={card.title}
                    onChange={(e) => updateCard(col, card.id, 'title', e.target.value)}
                  />
                  <button 
                    onClick={() => deleteCard(col, card.id)}
                    className="text-[#dee2e6] hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <textarea
                  className="w-full text-xs text-[#556b82] bg-transparent resize-none outline-none leading-relaxed"
                  rows={2}
                  placeholder="Descrição da atividade..."
                  value={card.description}
                  onChange={(e) => updateCard(col, card.id, 'description', e.target.value)}
                />
                <div className="mt-2 pt-2 border-t border-[#f1f4f6] flex justify-end">
                   <button 
                    onClick={() => moveCard(col, card.id)}
                    className="flex items-center gap-1 text-[10px] text-[#0064d2] hover:underline font-bold uppercase"
                   >
                     Mover Etapa <ArrowRight size={10} />
                   </button>
                </div>
              </div>
            ))}
            
            <button 
              onClick={() => addCard(col)}
              className="w-full py-2 border border-dashed border-[#ced4da] rounded text-[10px] font-bold text-[#556b82] hover:bg-white hover:border-[#0064d2] hover:text-[#0064d2] transition-all uppercase tracking-widest"
            >
              + Novo Registro
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
