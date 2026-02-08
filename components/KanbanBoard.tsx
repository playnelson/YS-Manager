
import React, { useState, useRef } from 'react';
import { Plus, X, Trash2, Edit2, GripVertical, Check, MoreVertical } from 'lucide-react';
import { KanbanState, KanbanCard, KanbanColumn, KanbanPriority } from '../types';
import { Button } from './ui/Button';

interface KanbanBoardProps {
  data: KanbanState;
  onChange: (data: KanbanState) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ data, onChange }) => {
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingColumnTitle, setEditingColumnTitle] = useState('');

  // Drag State
  const [draggingCard, setDraggingCard] = useState<{ cardId: string, colId: string } | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  // --- COLUMN ACTIONS ---
  const addColumn = () => {
    const newCol: KanbanColumn = {
      id: `col_${Date.now()}`,
      title: 'Nova Lista',
      cards: []
    };
    onChange({ columns: [...data.columns, newCol] });
  };

  const deleteColumn = (colId: string) => {
    if (confirm("Excluir esta lista e todos os seus cartões?")) {
      onChange({ columns: data.columns.filter(c => c.id !== colId) });
    }
  };

  const updateColumnTitle = (colId: string) => {
    if (!editingColumnTitle.trim()) return;
    onChange({
      columns: data.columns.map(c => c.id === colId ? { ...c, title: editingColumnTitle } : c)
    });
    setEditingColumnId(null);
  };

  // --- CARD ACTIONS ---
  const addCard = (colId: string) => {
    const newCard: KanbanCard = {
      id: `card_${Date.now()}`,
      title: 'Nova Tarefa',
      description: '',
      priority: 'medium',
      createdAt: new Date().toISOString()
    };
    onChange({
      columns: data.columns.map(c => c.id === colId ? { ...c, cards: [...c.cards, newCard] } : c)
    });
    // Auto-start edit
    setEditingCardId(newCard.id);
    setEditingTitle(newCard.title);
  };

  const updateCardTitle = (colId: string, cardId: string) => {
    onChange({
      columns: data.columns.map(c => c.id === colId ? {
        ...c,
        cards: c.cards.map(card => card.id === cardId ? { ...card, title: editingTitle } : card)
      } : c)
    });
    setEditingCardId(null);
  };

  const updateCardPriority = (colId: string, cardId: string, priority: KanbanPriority) => {
    onChange({
      columns: data.columns.map(c => c.id === colId ? {
        ...c,
        cards: c.cards.map(card => card.id === cardId ? { ...card, priority } : card)
      } : c)
    });
  };

  const deleteCard = (colId: string, cardId: string) => {
    if (!confirm("Remover cartão?")) return;
    onChange({
      columns: data.columns.map(c => c.id === colId ? {
        ...c,
        cards: c.cards.filter(card => card.id !== cardId)
      } : c)
    });
  };

  // --- DRAG AND DROP LOGIC (Native HTML5) ---
  const handleDragStart = (e: React.DragEvent, cardId: string, colId: string) => {
    setDraggingCard({ cardId, colId });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault(); // Necessário para permitir o drop
    setDragOverCol(colId);
  };

  const handleDrop = (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    setDragOverCol(null);

    if (!draggingCard) return;
    const { cardId, colId: sourceColId } = draggingCard;

    if (sourceColId === targetColId) {
      setDraggingCard(null);
      return;
    }

    // Move Card Logic
    const sourceCol = data.columns.find(c => c.id === sourceColId);
    const targetCol = data.columns.find(c => c.id === targetColId);
    if (!sourceCol || !targetCol) return;

    const cardToMove = sourceCol.cards.find(c => c.id === cardId);
    if (!cardToMove) return;

    const newColumns = data.columns.map(c => {
      if (c.id === sourceColId) {
        return { ...c, cards: c.cards.filter(card => card.id !== cardId) };
      }
      if (c.id === targetColId) {
        return { ...c, cards: [...c.cards, cardToMove] };
      }
      return c;
    });

    onChange({ columns: newColumns });
    setDraggingCard(null);
  };

  return (
    <div className="h-full flex flex-col gap-2 bg-win95-bg">
      {/* Toolbar / Header */}
      <div className="win95-raised p-1 flex justify-between items-center bg-win95-bg shrink-0">
         <div className="flex items-center gap-2 px-2">
            <div className="bg-win95-blue text-white px-2 py-1 text-xs font-bold uppercase shadow-sm flex items-center gap-2">
                <span>Gerenciador de Tarefas</span>
            </div>
         </div>
         <Button onClick={addColumn} icon={<Plus size={14} />}>
            NOVA LISTA
         </Button>
      </div>

      {/* Board Area */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 flex gap-4 items-start win95-sunken bg-[#808080] border-2 border-white">
        {data.columns.map(col => (
          <div 
            key={col.id}
            className={`w-72 shrink-0 flex flex-col max-h-full win95-raised bg-win95-bg p-1 transition-colors ${dragOverCol === col.id ? 'outline outline-2 outline-white' : ''}`}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            {/* Column Header - Style Title Bar */}
            <div className="bg-win95-blue text-white px-2 py-1 mb-1 text-xs font-bold uppercase flex justify-between items-center group cursor-grab active:cursor-grabbing select-none shadow-sm">
              {editingColumnId === col.id ? (
                <input 
                  autoFocus
                  className="w-full bg-blue-800 text-white outline-none border-b border-white px-1"
                  value={editingColumnTitle}
                  onChange={e => setEditingColumnTitle(e.target.value)}
                  onBlur={() => updateColumnTitle(col.id)}
                  onKeyDown={e => e.key === 'Enter' && updateColumnTitle(col.id)}
                />
              ) : (
                <div onClick={() => { setEditingColumnId(col.id); setEditingColumnTitle(col.title); }} className="flex-1 truncate">
                  {col.title}
                </div>
              )}
              <button 
                onClick={() => deleteColumn(col.id)}
                className="hover:bg-red-600 p-0.5 rounded-sm"
                title="Excluir Lista"
              >
                <X size={10} />
              </button>
            </div>

            {/* Cards List */}
            <div className="flex-1 overflow-y-auto p-1 win95-sunken bg-[#d4d0c8] min-h-[50px] space-y-2 custom-scrollbar border-t border-l border-[#404040] border-b border-r border-white">
              {col.cards.map(card => (
                <div 
                  key={card.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, card.id, col.id)}
                  className="win95-raised bg-white p-2 group relative cursor-grab active:cursor-grabbing hover:bg-[#ffffe0]"
                >
                  {/* Priority Indicator */}
                  <div className={`w-full h-1 mb-2 border-b border-[#eee] ${
                    card.priority === 'high' ? 'bg-red-600' : 
                    card.priority === 'medium' ? 'bg-yellow-400' : 
                    card.priority === 'low' ? 'bg-green-600' : 'bg-gray-300'
                  }`} />

                  {editingCardId === card.id ? (
                    <div className="space-y-2">
                       <textarea 
                          className="w-full text-xs p-1 win95-sunken outline-none resize-none font-sans bg-white text-black"
                          rows={3}
                          autoFocus
                          value={editingTitle}
                          onChange={e => setEditingTitle(e.target.value)}
                          onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); updateCardTitle(col.id, card.id); }}}
                       />
                       <div className="flex justify-between items-center gap-2">
                          <div className="flex gap-1 bg-gray-100 p-1 win95-sunken">
                             {(['low', 'medium', 'high'] as KanbanPriority[]).map(p => (
                               <button 
                                key={p}
                                onClick={() => updateCardPriority(col.id, card.id, p)}
                                className={`w-3 h-3 border border-black ${
                                  p === 'high' ? 'bg-red-600' : 
                                  p === 'medium' ? 'bg-yellow-400' : 'bg-green-600'
                                } ${card.priority === p ? 'ring-1 ring-black ring-offset-1' : ''}`}
                                title={p}
                               />
                             ))}
                          </div>
                          <Button size="sm" onClick={() => updateCardTitle(col.id, card.id)}>OK</Button>
                       </div>
                    </div>
                  ) : (
                    <>
                      <div 
                        className="text-xs font-bold text-black mb-1 leading-tight" 
                        onDoubleClick={() => { setEditingCardId(card.id); setEditingTitle(card.title); }}
                      >
                        {card.title}
                      </div>
                      
                      <div className="flex justify-end opacity-0 group-hover:opacity-100 absolute top-1 right-1 gap-1">
                         <button 
                          onClick={(e) => { e.stopPropagation(); setEditingCardId(card.id); setEditingTitle(card.title); }}
                          className="p-1 hover:bg-blue-100 text-blue-600 bg-white border border-gray-300 shadow-sm"
                          title="Editar"
                        >
                          <Edit2 size={10} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteCard(col.id, card.id); }}
                          className="p-1 hover:bg-red-100 text-red-600 bg-white border border-gray-300 shadow-sm"
                          title="Excluir"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {col.cards.length === 0 && (
                <div className="text-center py-4 text-[10px] text-gray-500 italic">
                  Lista Vazia
                </div>
              )}
            </div>

            {/* Column Footer */}
            <div className="pt-1 mt-1">
               <Button 
                 onClick={() => addCard(col.id)}
                 className="w-full text-[10px]"
                 icon={<Plus size={10} />}
               >
                 Adicionar Tarefa
               </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
