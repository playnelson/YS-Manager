
import React from 'react';
import { Plus } from 'lucide-react';
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
    onChange({ ...data, [column]: [newCard, ...data[column]] });
  };

  const updateCard = (column: keyof KanbanState, id: string, field: keyof KanbanCard, value: string) => {
    const newColumns = { ...data };
    newColumns[column] = newColumns[column].map(card => card.id === id ? { ...card, [field]: value } : card);
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

  return (
    <div className="flex h-full gap-2 overflow-x-auto p-2 bg-win95-bg">
      {(Object.keys(data) as Array<keyof KanbanState>).map((col) => (
        <div key={col} className="w-64 flex flex-col shrink-0">
          <div className="bg-[#808080] text-white px-2 py-1 text-xs font-bold uppercase flex justify-between items-center mb-1">
             <span>{col === 'todo' ? 'Pendentes' : col === 'doing' ? 'Execução' : 'Pronto'}</span>
             <span>[{data[col].length}]</span>
          </div>
          
          <div className="flex-1 win95-sunken p-2 space-y-2 overflow-y-auto bg-white">
            {data[col].map((card) => (
              <div key={card.id} className="win95-raised p-2 bg-win95-bg group">
                <div className="flex justify-between items-start mb-1">
                  <input 
                    className="text-[11px] font-bold bg-transparent outline-none w-full border-b border-win95-shadow focus:border-win95-blue text-black"
                    value={card.title}
                    onChange={(e) => updateCard(col, card.id, 'title', e.target.value)}
                  />
                  <button onClick={() => deleteCard(col, card.id)} className="text-xs font-bold text-win95-shadow hover:text-red-700">×</button>
                </div>
                <textarea
                  className="w-full text-[10px] bg-white win95-sunken p-1 outline-none resize-none text-black"
                  rows={2}
                  value={card.description}
                  onChange={(e) => updateCard(col, card.id, 'description', e.target.value)}
                />
                <div className="mt-2 flex justify-end">
                   <button onClick={() => moveCard(col, card.id)} className="win95-raised px-2 py-0.5 text-[9px] font-bold uppercase active:shadow-none text-black">Avançar ►</button>
                </div>
              </div>
            ))}
            
            <button onClick={() => addCard(col)} className="w-full py-1 win95-raised text-[10px] font-bold uppercase hover:bg-[#e0e0e0] text-black">+ Novo Card</button>
          </div>
        </div>
      ))}
    </div>
  );
};
