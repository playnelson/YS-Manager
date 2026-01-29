import React, { useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
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
      title: 'Nova Tarefa',
      description: ''
    };
    onChange({
      ...data,
      [column]: [...data[column], newCard]
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
    if(!window.confirm("Excluir este cartão?")) return;
    const newColumns = { ...data };
    newColumns[column] = newColumns[column].filter(card => card.id !== id);
    onChange(newColumns);
  };

  // Simple move function (cycling through columns)
  const moveCard = (currentCol: keyof KanbanState, id: string) => {
    const order: (keyof KanbanState)[] = ['todo', 'doing', 'done'];
    const currentIndex = order.indexOf(currentCol);
    const nextCol = order[(currentIndex + 1) % 3];

    const cardToMove = data[currentCol].find(c => c.id === id);
    if (!cardToMove) return;

    const newData = { ...data };
    newData[currentCol] = newData[currentCol].filter(c => c.id !== id);
    newData[nextCol] = [...newData[nextCol], cardToMove];
    onChange(newData);
  };

  return (
    <div className="flex h-full gap-6 overflow-x-auto p-2">
      {(Object.keys(data) as Array<keyof KanbanState>).map((col) => (
        <div key={col} className="flex-1 min-w-[300px] flex flex-col bg-slate-100 rounded-xl border border-slate-200 shadow-sm max-w-md">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white rounded-t-xl">
            <h3 className="font-bold text-slate-700 uppercase text-sm tracking-wide">
              {col === 'todo' ? 'A Fazer' : col === 'doing' ? 'Em Progresso' : 'Concluído'}
            </h3>
            <span className="bg-slate-200 text-slate-600 text-xs px-2 py-1 rounded-full font-bold">
              {data[col].length}
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {data[col].map((card) => (
              <div key={card.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex justify-between items-start mb-2">
                  <input 
                    className="font-semibold text-slate-800 bg-transparent focus:bg-slate-50 w-full outline-none border-b border-transparent focus:border-indigo-300 transition-colors"
                    value={card.title}
                    onChange={(e) => updateCard(col, card.id, 'title', e.target.value)}
                  />
                  <button 
                    onClick={() => deleteCard(col, card.id)}
                    className="text-slate-400 hover:text-red-500 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <textarea
                  className="w-full text-sm text-slate-600 bg-transparent resize-none outline-none focus:bg-slate-50 rounded p-1"
                  rows={2}
                  placeholder="Adicionar detalhes..."
                  value={card.description}
                  onChange={(e) => updateCard(col, card.id, 'description', e.target.value)}
                />
                <div className="mt-3 flex justify-end">
                   <button 
                    onClick={() => moveCard(col, card.id)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 bg-indigo-50 rounded"
                   >
                     Mover &rarr;
                   </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-3 border-t border-slate-200 bg-slate-50 rounded-b-xl">
            <Button 
              variant="secondary" 
              size="sm" 
              className="w-full border-dashed"
              onClick={() => addCard(col)}
              icon={<Plus size={14}/>}
            >
              Adicionar Cartão
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};