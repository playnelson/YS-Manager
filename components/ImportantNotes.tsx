
import React, { useState, useMemo } from 'react';
import { Folder, FileText, Plus, Search, Trash2, Save, AlertTriangle, Lock, Archive, Clock, Hash } from 'lucide-react';
import { ImportantNote, NotePriority } from '../types';
import { Button } from './ui/Button';

interface ImportantNotesProps {
  notes: ImportantNote[];
  onChange: (notes: ImportantNote[]) => void;
}

export const ImportantNotes: React.FC<ImportantNotesProps> = ({ notes = [], onChange }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Todas');

  const categories = useMemo(() => {
    const cats = new Set<string>();
    notes.forEach(n => cats.add(n.category || 'Geral'));
    return ['Todas', ...Array.from(cats).sort()];
  }, [notes]);

  const filteredNotes = useMemo(() => {
    return notes.filter(n => {
      const matchSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          n.content.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = activeCategory === 'Todas' || n.category === activeCategory;
      return matchSearch && matchCat;
    });
  }, [notes, searchTerm, activeCategory]);

  const selectedNote = useMemo(() => notes.find(n => n.id === selectedId), [notes, selectedId]);

  const addNote = () => {
    const newNote: ImportantNote = {
      id: `note_${Date.now()}`,
      title: 'Nova Anotação',
      content: '',
      category: activeCategory !== 'Todas' ? activeCategory : 'Geral',
      priority: 'normal',
      updatedAt: new Date().toISOString()
    };
    onChange([newNote, ...notes]);
    setSelectedId(newNote.id);
  };

  const updateNote = (id: string, updates: Partial<ImportantNote>) => {
    onChange(notes.map(n => n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n));
  };

  const deleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Deseja excluir permanentemente este documento?")) {
      onChange(notes.filter(n => n.id !== id));
      if (selectedId === id) setSelectedId(null);
    }
  };

  const priorityMeta: Record<NotePriority, { icon: React.ReactNode, color: string, label: string }> = {
    normal: { icon: <FileText size={12} />, color: 'text-black', label: 'Normal' },
    urgent: { icon: <AlertTriangle size={12} className="text-red-600" />, color: 'text-red-700', label: 'Urgente' },
    secret: { icon: <Lock size={12} className="text-win95-blue" />, color: 'text-win95-blue', label: 'Confidencial' },
    archived: { icon: <Archive size={12} className="text-win95-shadow" />, color: 'text-win95-shadow', label: 'Arquivado' }
  };

  return (
    <div className="flex h-full gap-2 bg-win95-bg overflow-hidden p-1">
      {/* Sidebar - Explorador de Notas */}
      <div className="w-72 flex flex-col bg-win95-bg win95-raised p-1 h-full">
        <div className="bg-win95-blue text-white px-2 py-1 text-[11px] font-black uppercase flex items-center justify-between shadow-md mb-2">
          <div className="flex items-center gap-2">
            <Folder size={12} />
            <span>Documentos</span>
          </div>
          <button onClick={addNote} className="win95-raised bg-win95-bg text-black p-0.5"><Plus size={10} /></button>
        </div>

        <div className="px-2 mb-2">
          <div className="relative">
            <Search className="absolute left-2 top-2 text-win95-shadow" size={12} />
            <input 
              className="w-full pl-7 pr-2 py-1 win95-sunken text-[11px] bg-white outline-none placeholder:italic"
              placeholder="Pesquisar no arquivo..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Categorias / Pastas */}
        <div className="flex-1 overflow-y-auto win95-sunken bg-white p-1 flex flex-col gap-0.5">
          {categories.map(cat => (
            <div key={cat} className="flex flex-col">
              <div 
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-2 px-1 py-1 cursor-pointer text-[11px] font-bold ${activeCategory === cat ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
              >
                <Folder size={12} className={activeCategory === cat ? 'text-win95-blue' : 'text-win95-shadow'} />
                <span className="truncate uppercase">{cat}</span>
              </div>
              
              {activeCategory === cat && (
                <div className="ml-4 border-l-2 border-dotted border-win95-shadow pl-1 flex flex-col gap-0.5 mt-0.5">
                  {filteredNotes.length === 0 ? (
                    <div className="text-[9px] text-win95-shadow italic p-1">(Vazio)</div>
                  ) : (
                    filteredNotes.map(note => (
                      <div 
                        key={note.id}
                        onClick={(e) => { e.stopPropagation(); setSelectedId(note.id); }}
                        className={`flex items-center justify-between px-2 py-1 cursor-pointer text-[11px] group ${selectedId === note.id ? 'bg-win95-blue text-white' : 'hover:bg-gray-50 text-black'}`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {priorityMeta[note.priority].icon}
                          <span className="truncate">{note.title}</span>
                        </div>
                        <button onClick={(e) => deleteNote(note.id, e)} className={`opacity-0 group-hover:opacity-100 ${selectedId === note.id ? 'text-white' : 'text-red-600'}`}>
                          <Trash2 size={10} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Área de Edição - Bloco de Notas */}
      <div className="flex-1 flex flex-col win95-raised p-1 h-full bg-win95-bg">
        {selectedNote ? (
          <>
            <div className="bg-[#808080] text-white px-2 py-1 text-[11px] font-bold flex justify-between items-center mb-1">
              <div className="flex items-center gap-3">
                <span className="uppercase tracking-widest">Editando: {selectedNote.title}.txt</span>
                <div className="flex gap-1">
                  <select 
                    className="bg-win95-bg text-black text-[9px] px-1 outline-none border border-black/20 font-black uppercase"
                    value={selectedNote.priority}
                    onChange={e => updateNote(selectedNote.id, { priority: e.target.value as NotePriority })}
                  >
                    <option value="normal">Prioridade: Normal</option>
                    <option value="urgent">Prioridade: URGENTE</option>
                    <option value="secret">Prioridade: CONFIDENCIAL</option>
                    <option value="archived">Status: ARQUIVADO</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                 <button className="win95-raised bg-win95-bg text-black px-2 py-0.5 text-[10px] flex items-center gap-1 active:shadow-none"><Save size={10}/> Salvar</button>
              </div>
            </div>

            <div className="p-3 bg-win95-bg flex flex-col gap-3 flex-1 overflow-hidden">
               <div className="grid grid-cols-2 gap-4 shrink-0">
                  <div>
                    <label className="text-[10px] font-black uppercase block mb-1">Título do Documento:</label>
                    <input 
                      className="w-full px-2 py-1 win95-sunken bg-white text-xs outline-none font-bold text-black uppercase"
                      value={selectedNote.title}
                      onChange={e => updateNote(selectedNote.id, { title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase block mb-1">Categoria / Pasta:</label>
                    <div className="relative">
                       <Hash className="absolute left-2 top-1.5 text-win95-shadow" size={12} />
                       <input 
                        list="note-cats"
                        className="w-full pl-7 pr-2 py-1 win95-sunken bg-white text-xs outline-none font-bold text-black uppercase"
                        value={selectedNote.category}
                        onChange={e => updateNote(selectedNote.id, { category: e.target.value })}
                      />
                      <datalist id="note-cats">
                        {categories.filter(c => c !== 'Todas').map(c => <option key={c} value={c} />)}
                      </datalist>
                    </div>
                  </div>
               </div>

               <div className="flex-1 flex flex-col min-h-0">
                  <label className="text-[10px] font-black uppercase block mb-1">Conteúdo da Anotação:</label>
                  <textarea 
                    className="flex-1 w-full p-4 win95-sunken bg-white outline-none resize-none font-mono text-xs leading-relaxed text-black custom-scrollbar"
                    value={selectedNote.content}
                    onChange={e => updateNote(selectedNote.id, { content: e.target.value })}
                    placeholder="Comece a digitar aqui seu relatório ou anotação importante..."
                  />
               </div>

               <div className="win95-sunken bg-win95-bg border-none p-1 px-3 flex justify-between items-center text-[9px] font-bold text-[#555] uppercase italic">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1"><Clock size={10} /> Atualizado: {new Date(selectedNote.updatedAt).toLocaleString('pt-BR')}</span>
                    <span>Modo: Texto Estruturado</span>
                  </div>
                  <div>Caracteres: {selectedNote.content.length}</div>
               </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-30 grayscale p-10 text-center">
             <FileText size={64} className="mb-4" />
             <h3 className="text-sm font-black uppercase tracking-widest mb-2">Arquivo de Documentos v1.0</h3>
             <p className="text-[10px] max-w-xs font-bold leading-tight">SELECIONE UM DOCUMENTO NA ÁRVORE AO LADO OU CLIQUE NO BOTÃO "+" PARA CRIAR UM NOVO REGISTRO.</p>
          </div>
        )}
      </div>
    </div>
  );
};
