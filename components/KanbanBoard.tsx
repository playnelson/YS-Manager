
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
    // Pequeno hack para esconder a imagem fantasma padrão se quiséssemos customizar, 
    // mas vamos deixar o padrão para simplicidade.
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

    // Se soltou na mesma coluna, e não implementamos reordenação intra-lista ainda, não faz nada
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

  const getPriorityColor = (p: KanbanPriority) => {
    switch (p) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-400';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0079bf] overflow-hidden rounded shadow-inner">
      {/* Trello-like Header */}
      <div className="p-2 flex justify-between items-center bg-black/20 text-white shrink-0">
         <h2 className="text-sm font-bold pl-2 flex items-center gap-2">
            <span className="opacity-80">Quadro de Projetos</span>
         </h2>
         <Button onClick={addColumn} className="bg-white/20 hover:bg-white/30 text-white border-none shadow-none text-xs h-7">
            <Plus size={14} /> Adicionar Lista
         </Button>
      </div>

      {/* Board Area (Horizontal Scrolling) */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-3 flex gap-3 items-start">
        {data.columns.map(col => (
          <div 
            key={col.id}
            className={`w-72 shrink-0 flex flex-col max-h-full rounded-md bg-[#ebecf0] shadow-md transition-colors ${dragOverCol === col.id ? 'bg-[#d0d4db]' : ''}`}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            {/* Column Header */}
            <div className="p-2 px-3 flex justify-between items-center font-bold text-sm text-[#172b4d] shrink-0 cursor-pointer group">
              {editingColumnId === col.id ? (
                <input 
                  autoFocus
                  className="w-full px-1 py-0.5 rounded border border-blue-500 outline-none text-sm"
                  value={editingColumnTitle}
                  onChange={e => setEditingColumnTitle(e.target.value)}
                  onBlur={() => updateColumnTitle(col.id)}
                  onKeyDown={e => e.key === 'Enter' && updateColumnTitle(col.id)}
                />
              ) : (
                <div onClick={() => { setEditingColumnId(col.id); setEditingColumnTitle(col.title); }} className="flex-1 py-1 truncate">
                  {col.title}
                </div>
              )}
              <button 
                onClick={() => deleteColumn(col.id)}
                className="p-1 rounded hover:bg-gray-300 text-gray-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical size={14} />
              </button>
            </div>

            {/* Cards List */}
            <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-2 custom-scrollbar min-h-[20px]">
              {col.cards.map(card => (
                <div 
                  key={card.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, card.id, col.id)}
                  className="bg-white p-2 rounded shadow-sm border-b border-gray-200 hover:bg-gray-50 group cursor-grab active:cursor-grabbing relative"
                >
                  {/* Priority Strip */}
                  <div 
                    className={`w-8 h-1.5 rounded-full mb-1 ${getPriorityColor(card.priority)}`} 
                    title={`Prioridade: ${card.priority}`}
                  />

                  {editingCardId === card.id ? (
                    <div className="space-y-2">
                       <textarea 
                          className="w-full text-sm p-1 border rounded resize-none focus:ring-2 focus:ring-blue-400 outline-none"
                          rows={2}
                          autoFocus
                          value={editingTitle}
                          onChange={e => setEditingTitle(e.target.value)}
                          onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); updateCardTitle(col.id, card.id); }}}
                       />
                       <div className="flex justify-between items-center">
                          <button onClick={() => updateCardTitle(col.id, card.id)} className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700">Salvar</button>
                          <div className="flex gap-1">
                             {(['low', 'medium', 'high'] as KanbanPriority[]).map(p => (
                               <button 
                                key={p}
                                onClick={() => updateCardPriority(col.id, card.id, p)}
                                className={`w-4 h-4 rounded-full ${getPriorityColor(p)} border border-transparent hover:border-black`}
                                title={p}
                               />
                             ))}
                          </div>
                       </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <div 
                        className="flex-1 text-sm text-[#172b4d]" 
                        onClick={() => { setEditingCardId(card.id); setEditingTitle(card.title); }}
                      >
                        {card.title}
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteCard(col.id, card.id); }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Column Footer */}
            <div className="p-2 pt-1 shrink-0">
               <button 
                 onClick={() => addCard(col.id)}
                 className="w-full text-left p-1.5 rounded text-[#5e6c84] hover:bg-[#091e4214] text-sm flex items-center gap-1 transition-colors"
               >
                 <Plus size={14} /> Adicionar cartão
               </button>
            </div>
          </div>
        ))}
        
        {/* Placeholder for Add List Button to keep layout sane */}
        <div className="w-72 shrink-0">
           <button 
             onClick={addColumn}
             className="w-full bg-white/20 hover:bg-white/30 text-white p-2 rounded text-left text-sm font-bold flex items-center gap-2 transition-colors"
           >
             <Plus size={14} /> Adicionar outra lista
           </button>
        </div>
      </div>
    </div>
  );
};
