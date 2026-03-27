'use client';

import { generateUUID } from '../uuid';
import React, { useState, useRef, useCallback } from 'react';
import {
  Plus, X, Trash2, Edit2, Check, Flag, Calendar,
  AlignLeft, Tag, Maximize2, Minimize2, MoreHorizontal,
  Circle, CheckCircle2, Clock, ChevronDown, Search, Filter
} from 'lucide-react';
import { KanbanState, KanbanCard, KanbanColumn, KanbanPriority } from '@/types';

interface KanbanBoardProps {
  data: KanbanState;
  onChange: (data: KanbanState) => void;
  wallMode?: boolean; // true = modo mural canvas expandido
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<KanbanPriority, { label: string; color: string; bg: string; dot: string }> = {
  high: { label: 'Alta', color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20', dot: 'bg-rose-500' },
  medium: { label: 'Média', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', dot: 'bg-amber-500' },
  low: { label: 'Baixa', color: 'text-sky-500', bg: 'bg-sky-50 dark:bg-sky-900/20', dot: 'bg-sky-500' },
};

const COLUMN_COLORS = [
  { label: 'Cinza', value: 'gray', header: 'bg-gray-100 dark:bg-gray-800', accent: 'border-gray-300 dark:border-gray-600' },
  { label: 'Azul', value: 'blue', header: 'bg-blue-50 dark:bg-blue-900/30', accent: 'border-blue-300 dark:border-blue-700' },
  { label: 'Roxo', value: 'purple', header: 'bg-purple-50 dark:bg-purple-900/30', accent: 'border-purple-300 dark:border-purple-700' },
  { label: 'Verde', value: 'green', header: 'bg-emerald-50 dark:bg-emerald-900/30', accent: 'border-emerald-300 dark:border-emerald-700' },
  { label: 'Laranja', value: 'orange', header: 'bg-orange-50 dark:bg-orange-900/30', accent: 'border-orange-300 dark:border-orange-700' },
  { label: 'Rosa', value: 'rose', header: 'bg-rose-50 dark:bg-rose-900/30', accent: 'border-rose-300 dark:border-rose-700' },
];

const LABEL_COLORS = [
  { label: 'Design', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  { label: 'Dev', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  { label: 'Bug', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
  { label: 'Feature', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  { label: 'Urgente', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' },
  { label: 'Review', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  { label: 'Conteúdo', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' },
  { label: 'Infraestrutura', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
];

function genId() { return generateUUID(); }

// ── Card Detail Modal ────────────────────────────────────────────────────────

interface CardModalProps {
  card: KanbanCard;
  colId: string;
  onClose: () => void;
  onUpdate: (colId: string, cardId: string, updates: Partial<KanbanCard>) => void;
  onDelete: (colId: string, cardId: string) => void;
}

const CardModal: React.FC<CardModalProps> = ({ card, colId, onClose, onUpdate, onDelete }) => {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description);
  const [priority, setPriority] = useState(card.priority);
  const [dueDate, setDueDate] = useState(card.dueDate || '');
  const [labels, setLabels] = useState<string[]>(card.labels || []);

  const save = () => {
    onUpdate(colId, card.id, { title, description, priority, dueDate: dueDate || undefined, labels });
    onClose();
  };

  const toggleLabel = (label: string) => {
    setLabels(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Detalhes do Cartão</span>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">Título</label>
            <textarea
              className="w-full text-base font-semibold bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-gray-900 dark:text-white transition-colors"
              rows={2}
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 block mb-1.5 flex items-center gap-1.5">
              <AlignLeft size={12} /> Descrição
            </label>
            <textarea
              className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-gray-700 dark:text-gray-300 transition-colors"
              rows={4}
              placeholder="Adicione uma descrição..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          {/* Priority + Due Date row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 block mb-1.5 flex items-center gap-1.5">
                <Flag size={12} /> Prioridade
              </label>
              <div className="flex gap-1.5">
                {(['low', 'medium', 'high'] as KanbanPriority[]).map(p => {
                  const cfg = PRIORITY_CONFIG[p];
                  return (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${priority === p
                          ? `${cfg.bg} ${cfg.color} border-current`
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-400 border-transparent hover:border-gray-300'
                        }`}
                    >
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 block mb-1.5 flex items-center gap-1.5">
                <Calendar size={12} /> Prazo
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-colors"
              />
            </div>
          </div>

          {/* Labels */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 block mb-2 flex items-center gap-1.5">
              <Tag size={12} /> Etiquetas
            </label>
            <div className="flex flex-wrap gap-1.5">
              {LABEL_COLORS.map(l => (
                <button
                  key={l.label}
                  onClick={() => toggleLabel(l.label)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all border-2 ${labels.includes(l.label)
                      ? `${l.color} border-current shadow-sm`
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400 border-transparent hover:border-gray-300'
                    }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <button
            onClick={() => { onDelete(colId, card.id); onClose(); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 size={13} /> Excluir
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              Cancelar
            </button>
            <button
              onClick={save}
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-100 shadow-sm transition-all"
            >
              <Check size={13} className="inline mr-1.5" />Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Mini Card (board card) ────────────────────────────────────────────────────

interface MiniCardProps {
  card: KanbanCard;
  colId: string;
  onOpenModal: (card: KanbanCard, colId: string) => void;
  onDragStart: (e: React.DragEvent, cardId: string, colId: string) => void;
}

const MiniCard: React.FC<MiniCardProps> = ({ card, colId, onOpenModal, onDragStart }) => {
  const cfg = PRIORITY_CONFIG[card.priority];
  const isOverdue = card.dueDate && card.dueDate < new Date().toISOString().split('T')[0];

  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, card.id, colId)}
      onClick={() => onOpenModal(card, colId)}
      className="group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3.5 cursor-pointer
                 hover:shadow-md hover:-translate-y-0.5 hover:border-gray-300 dark:hover:border-gray-600
                 transition-all duration-150 active:scale-[0.98]"
    >
      {/* Priority stripe */}
      <div className={`absolute left-0 top-2 bottom-2 w-0.5 rounded-full ${cfg.dot}`} style={{ left: '-1px' }} />

      {/* Labels */}
      {card.labels && card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {card.labels.slice(0, 3).map(label => {
            const lc = LABEL_COLORS.find(l => l.label === label);
            return (
              <span key={label} className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${lc?.color ?? 'bg-gray-100 text-gray-600'}`}>
                {label}
              </span>
            );
          })}
          {card.labels.length > 3 && (
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 dark:bg-gray-700 text-gray-500">
              +{card.labels.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Title */}
      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-snug mb-2 line-clamp-2">
        {card.title}
      </p>

      {/* Description snippet */}
      {card.description && (
        <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed line-clamp-1 mb-2">
          {card.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 mt-1">
        <div className="flex items-center gap-2">
          {/* Priority pill */}
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${cfg.bg} ${cfg.color}`}>
            <span className={`w-1 h-1 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>

          {/* Due date */}
          {card.dueDate && (
            <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${isOverdue ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}`}>
              <Clock size={9} />
              {new Date(card.dueDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            </span>
          )}
        </div>

        {/* Edit hint */}
        <button
          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
          onClick={e => { e.stopPropagation(); onOpenModal(card, colId); }}
        >
          <Edit2 size={11} className="text-gray-400" />
        </button>
      </div>
    </div>
  );
};

// ── Main Board ───────────────────────────────────────────────────────────────

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ data, onChange, wallMode = false }) => {
  const [modalCard, setModalCard] = useState<{ card: KanbanCard; colId: string } | null>(null);
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [editingColTitle, setEditingColTitle] = useState('');
  const [dragging, setDragging] = useState<{ cardId: string; colId: string } | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [dragOverCard, setDragOverCard] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(wallMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<KanbanPriority | 'all'>('all');

  // ── Columns ──
  const addColumn = () => {
    const newCol: KanbanColumn = {
      id: genId(),
      title: 'Nova Lista',
      cards: [],
      color: 'gray',
    };
    onChange({ columns: [...data.columns, newCol] });
    setTimeout(() => { setEditingColId(newCol.id); setEditingColTitle(newCol.title); }, 50);
  };

  const deleteColumn = (colId: string) => {
    if (!confirm('Excluir esta lista e todos os cartões?')) return;
    onChange({ columns: data.columns.filter(c => c.id !== colId) });
  };

  const saveColumnTitle = (colId: string) => {
    if (!editingColTitle.trim()) { setEditingColId(null); return; }
    onChange({ columns: data.columns.map(c => c.id === colId ? { ...c, title: editingColTitle } : c) });
    setEditingColId(null);
  };

  const setColumnColor = (colId: string, color: string) => {
    onChange({ columns: data.columns.map(c => c.id === colId ? { ...c, color } : c) });
  };

  // ── Cards ──
  const addCard = (colId: string) => {
    const newCard: KanbanCard = {
      id: genId(),
      title: 'Nova Tarefa',
      description: '',
      priority: 'medium',
      createdAt: new Date().toISOString(),
      labels: [],
    };
    onChange({ columns: data.columns.map(c => c.id === colId ? { ...c, cards: [newCard, ...c.cards] } : c) });
    setModalCard({ card: newCard, colId });
  };

  const updateCard = (colId: string, cardId: string, updates: Partial<KanbanCard>) => {
    onChange({
      columns: data.columns.map(c => c.id === colId ? {
        ...c, cards: c.cards.map(card => card.id === cardId ? { ...card, ...updates } : card)
      } : c)
    });
  };

  const deleteCard = (colId: string, cardId: string) => {
    onChange({
      columns: data.columns.map(c => c.id === colId ? {
        ...c, cards: c.cards.filter(card => card.id !== cardId)
      } : c)
    });
  };

  // ── Drag & Drop ──
  const handleDragStart = (e: React.DragEvent, cardId: string, colId: string) => {
    setDragging({ cardId, colId });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, colId: string, cardId?: string) => {
    e.preventDefault();
    setDragOverCol(colId);
    if (cardId) setDragOverCard(cardId);
    else setDragOverCard(null);
  };

  const handleDrop = (e: React.DragEvent, targetColId: string, insertBeforeCardId?: string) => {
    e.preventDefault();
    setDragOverCol(null);
    setDragOverCard(null);
    if (!dragging) return;

    const { cardId, colId: sourceColId } = dragging;
    const sourceCol = data.columns.find(c => c.id === sourceColId);
    if (!sourceCol) return;
    const card = sourceCol.cards.find(c => c.id === cardId);
    if (!card) return;

    const newColumns = data.columns.map(c => {
      if (c.id === sourceColId && c.id !== targetColId) {
        return { ...c, cards: c.cards.filter(cc => cc.id !== cardId) };
      }
      if (c.id === targetColId) {
        let cards = c.id === sourceColId ? c.cards.filter(cc => cc.id !== cardId) : [...c.cards];
        if (insertBeforeCardId) {
          const idx = cards.findIndex(cc => cc.id === insertBeforeCardId);
          if (idx !== -1) { cards = [...cards.slice(0, idx), card, ...cards.slice(idx)]; }
          else { cards = [...cards, card]; }
        } else {
          cards = [...cards, card];
        }
        return { ...c, cards };
      }
      return c;
    });

    onChange({ columns: newColumns });
    setDragging(null);
  };

  const handleDragEnd = () => {
    setDragging(null);
    setDragOverCol(null);
    setDragOverCard(null);
  };

  // ── Filter ──
  const filteredData: KanbanState = {
    columns: data.columns.map(col => ({
      ...col,
      cards: col.cards.filter(card => {
        const matchSearch = !searchQuery || card.title.toLowerCase().includes(searchQuery.toLowerCase()) || card.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchPriority = filterPriority === 'all' || card.priority === filterPriority;
        return matchSearch && matchPriority;
      })
    }))
  };

  const totalCards = data.columns.reduce((acc, c) => acc + c.cards.length, 0);
  const doneCards = data.columns.filter(c => c.title.toLowerCase().includes('conclu') || c.title.toLowerCase().includes('done') || c.title.toLowerCase().includes('pronto')).reduce((acc, c) => acc + c.cards.length, 0);

  const boardContent = (
    <div className={`flex flex-col h-full ${isExpanded ? 'bg-gray-50 dark:bg-[#0a0a0a]' : 'bg-palette-mediumLight dark:bg-[#111111]'}`}>

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/50 backdrop-blur-sm flex-shrink-0 gap-3">
        <div className="flex items-center gap-3">
          {/* Stats */}
          <div className="hidden sm:flex items-center gap-3 text-xs text-gray-400 font-medium">
            <span>{totalCards} cartões</span>
            {doneCards > 0 && (
              <>
                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                <span className="text-emerald-500">{doneCards} concluídos</span>
              </>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-800 border border-transparent dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-gray-700 dark:text-gray-300 w-36 transition-all"
            />
          </div>

          {/* Priority filter */}
          <div className="flex items-center gap-1.5">
            {(['all', 'high', 'medium', 'low'] as const).map(p => (
              <button
                key={p}
                onClick={() => setFilterPriority(p)}
                className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg transition-all ${filterPriority === p
                    ? p === 'all' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                      : p === 'high' ? 'bg-rose-500 text-white'
                        : p === 'medium' ? 'bg-amber-400 text-white'
                          : 'bg-sky-500 text-white'
                    : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
              >
                {p === 'all' ? 'Todos' : PRIORITY_CONFIG[p].label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={addColumn}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-semibold rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-all shadow-sm"
          >
            <Plus size={13} /> Lista
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-400"
            title={isExpanded ? 'Modo compacto' : 'Modo mural'}
          >
            {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </div>

      {/* ── Board Columns ── */}
      <div
        className="flex-1 overflow-x-auto overflow-y-hidden"
        style={{ scrollbarWidth: 'thin' }}
      >
        <div className="flex gap-4 p-5 h-full items-start min-w-max">
          {filteredData.columns.map((col, colIdx) => {
            const colCfg = COLUMN_COLORS.find(cc => cc.value === (col.color || 'gray')) || COLUMN_COLORS[0];
            const isDragOver = dragOverCol === col.id;

            return (
              <div
                key={col.id}
                className={`w-72 flex-shrink-0 flex flex-col rounded-2xl border transition-all duration-150 ${colCfg.accent} ${isDragOver ? 'ring-2 ring-blue-400 ring-offset-2 shadow-lg scale-[1.01]' : 'shadow-sm'
                  } bg-white dark:bg-gray-900/70`}
                onDragOver={e => handleDragOver(e, col.id)}
                onDrop={e => handleDrop(e, col.id)}
                onDragLeave={() => { if (dragOverCol === col.id) setDragOverCol(null); }}
                style={{ maxHeight: 'calc(100vh - 160px)' }}
              >
                {/* Column header */}
                <div className={`rounded-t-2xl px-4 py-3 flex items-center justify-between flex-shrink-0 ${colCfg.header}`}>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {/* Color dot picker */}
                    <div className="relative group/color">
                      <div className={`w-2.5 h-2.5 rounded-full cursor-pointer ring-1 ring-white dark:ring-gray-900 ${col.color === 'blue' ? 'bg-blue-400' : col.color === 'purple' ? 'bg-purple-400' : col.color === 'green' ? 'bg-emerald-400' : col.color === 'orange' ? 'bg-orange-400' : col.color === 'rose' ? 'bg-rose-400' : 'bg-gray-400'
                        }`} />
                      <div className="absolute top-5 left-0 z-10 hidden group-hover/color:flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-xl p-2 gap-1.5 border border-gray-200 dark:border-gray-700 min-w-[130px]">
                        {COLUMN_COLORS.map(cc => (
                          <button key={cc.value} onClick={() => setColumnColor(col.id, cc.value)} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded-lg transition-colors">
                            <div className={`w-3 h-3 rounded-full ${cc.value === 'blue' ? 'bg-blue-400' : cc.value === 'purple' ? 'bg-purple-400' : cc.value === 'green' ? 'bg-emerald-400' : cc.value === 'orange' ? 'bg-orange-400' : cc.value === 'rose' ? 'bg-rose-400' : 'bg-gray-400'}`} />
                            {cc.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Title */}
                    {editingColId === col.id ? (
                      <input
                        autoFocus
                        className="flex-1 bg-transparent text-sm font-bold text-gray-800 dark:text-white focus:outline-none border-b border-gray-400 dark:border-gray-500"
                        value={editingColTitle}
                        onChange={e => setEditingColTitle(e.target.value)}
                        onBlur={() => saveColumnTitle(col.id)}
                        onKeyDown={e => { if (e.key === 'Enter') saveColumnTitle(col.id); if (e.key === 'Escape') setEditingColId(null); }}
                      />
                    ) : (
                      <button
                        className="flex-1 text-left text-sm font-bold text-gray-800 dark:text-white truncate hover:text-blue-500 transition-colors"
                        onClick={() => { setEditingColId(col.id); setEditingColTitle(col.title); }}
                      >
                        {col.title}
                      </button>
                    )}

                    {/* Count badge */}
                    <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-white/60 dark:bg-gray-700/60 text-gray-500 dark:text-gray-400">
                      {col.cards.length}
                    </span>
                  </div>

                  <button onClick={() => deleteColumn(col.id)} className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 text-gray-400 transition-colors ml-1">
                    <X size={13} />
                  </button>
                </div>

                {/* Cards area */}
                <div
                  className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-[60px]"
                  style={{ scrollbarWidth: 'thin' }}
                >
                  {col.cards.map((card) => (
                    <div
                      key={card.id}
                      onDragOver={e => { e.preventDefault(); setDragOverCard(card.id); }}
                      onDrop={e => handleDrop(e, col.id, card.id)}
                    >
                      {/* Drop indicator */}
                      {dragging && dragOverCard === card.id && dragOverCol === col.id && (
                        <div className="h-1 rounded-full bg-blue-400 mb-2 transition-all" />
                      )}
                      <MiniCard
                        card={card}
                        colId={col.id}
                        onOpenModal={(c, cid) => setModalCard({ card: c, colId: cid })}
                        onDragStart={handleDragStart}
                      />
                    </div>
                  ))}

                  {col.cards.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-2">
                        <CheckCircle2 size={18} className="text-gray-300 dark:text-gray-600" />
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-600">Nenhuma tarefa aqui</p>
                    </div>
                  )}
                </div>

                {/* Column footer */}
                <div className="p-3 pt-0 flex-shrink-0">
                  <button
                    onClick={() => addCard(col.id)}
                    className="w-full flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300 transition-all border border-dashed border-gray-200 dark:border-gray-700"
                  >
                    <Plus size={12} /> Adicionar tarefa
                  </button>
                </div>
              </div>
            );
          })}

          {/* Add column button */}
          <button
            onClick={addColumn}
            className="w-72 flex-shrink-0 h-16 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center gap-2 text-sm font-semibold text-gray-400 dark:text-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-all"
          >
            <Plus size={16} /> Nova lista
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {isExpanded ? (
        <div className="fixed inset-0 z-40 flex flex-col bg-gray-50 dark:bg-[#0a0a0a]">
          {/* Mural header */}
          <div className="flex items-center justify-between px-6 py-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-blue-500 rounded-lg flex items-center justify-center">
                <CheckCircle2 size={14} className="text-white" />
              </div>
              <span className="text-sm font-bold text-gray-800 dark:text-white">Kanban — Modo Mural</span>
            </div>
            <button onClick={() => setIsExpanded(false)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Minimize2 size={13} /> Fechar mural
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            {boardContent}
          </div>
        </div>
      ) : (
        <div className="h-full overflow-hidden">
          {boardContent}
        </div>
      )}

      {/* Card Detail Modal */}
      {modalCard && (
        <CardModal
          card={modalCard.card}
          colId={modalCard.colId}
          onClose={() => setModalCard(null)}
          onUpdate={updateCard}
          onDelete={deleteCard}
        />
      )}
    </>
  );
};
