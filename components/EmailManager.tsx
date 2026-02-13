
import React, { useState, useMemo, useRef } from 'react';
import { Plus, Save, Mail, Trash2, Send, ExternalLink, Filter, Tag, Folder, FolderPlus, Edit2, Check, X, ArrowRightLeft, FileText, LayoutList } from 'lucide-react';
import { EmailTemplate } from '../types';
import { Button } from './ui/Button';

interface EmailManagerProps {
  emails: EmailTemplate[];
  onChange: (emails: EmailTemplate[]) => void;
}

export const EmailManager: React.FC<EmailManagerProps> = ({ emails, onChange }) => {
  // --- ESTADOS DE SELEÇÃO E DADOS ---
  const [activeCategory, setActiveCategory] = useState<string>('Todas');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<EmailTemplate>>({});
  
  // --- ESTADOS DE GESTÃO DE PASTAS ---
  const [tempFolders, setTempFolders] = useState<string[]>([]);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editFolderInput, setEditFolderInput] = useState('');

  // --- ESTADOS AUXILIARES ---
  const [emailToMove, setEmailToMove] = useState<EmailTemplate | null>(null);

  // --- CÁLCULO DE CATEGORIAS ---
  const categories = useMemo(() => {
    const cats = new Set<string>();
    emails.forEach(e => cats.add(e.category || 'Geral'));
    tempFolders.forEach(t => cats.add(t));
    
    // Remove 'Geral' explicitamente para não aparecer na lista
    cats.delete('Geral'); 
    const sorted = Array.from(cats).sort();
    return ['Todas', ...sorted];
  }, [emails, tempFolders]);

  // --- FILTRAGEM DE EMAILS ---
  const filteredEmails = useMemo(() => {
    if (activeCategory === 'Todas') return emails;
    return emails.filter(e => (e.category || 'Geral') === activeCategory);
  }, [emails, activeCategory]);

  // --- AÇÕES DE PASTA ---
  const handleCreateFolder = () => {
    const name = prompt("Nome da Nova Pasta:");
    if (name && name.trim()) {
      const cleanName = name.trim();
      if (!categories.includes(cleanName) && cleanName !== 'Geral') {
        setTempFolders(prev => [...prev, cleanName]);
        setActiveCategory(cleanName);
      } else {
        alert("Esta pasta já existe ou nome inválido.");
      }
    }
  };

  const startRenameFolder = (cat: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCategory(cat);
    setEditFolderInput(cat);
  };

  const saveRenameFolder = () => {
    if (!editingCategory || !editFolderInput.trim()) return;
    const newName = editFolderInput.trim();

    if (newName !== editingCategory) {
      // Atualiza e-mails
      const updatedEmails = emails.map(e => (e.category === editingCategory ? { ...e, category: newName } : e));
      onChange(updatedEmails);

      // Atualiza pastas temporárias
      if (tempFolders.includes(editingCategory)) {
        setTempFolders(prev => prev.map(t => t === editingCategory ? newName : t));
      }

      if (activeCategory === editingCategory) setActiveCategory(newName);
    }
    setEditingCategory(null);
  };

  const deleteFolder = (cat: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Excluir a pasta "${cat}" moverá os e-mails para "Geral". Continuar?`)) {
      const updatedEmails = emails.map(e => (e.category === cat ? { ...e, category: 'Geral' } : e));
      onChange(updatedEmails);
      setTempFolders(prev => prev.filter(t => t !== cat));
      if (activeCategory === cat) setActiveCategory('Todas');
    }
  };

  // --- AÇÕES DE E-MAIL (CRUD) ---
  const handleSelect = (id: string) => {
    setSelectedId(id);
    const email = emails.find(e => e.id === id);
    if (email) setFormData(email);
  };

  const handleNewEmail = () => {
    setSelectedId(null);
    setFormData({
      name: '',
      category: activeCategory !== 'Todas' ? activeCategory : 'Geral', // Herda a pasta atual ou vai para Geral
      to: '',
      cc: '',
      subject: '',
      body: ''
    });
  };

  const handleSaveEmail = () => {
    if (!formData.name) return alert("Por favor, dê um nome ao modelo");

    const newEmail: EmailTemplate = {
      id: selectedId || `email_${Date.now()}`,
      name: formData.name || 'Sem Título',
      category: formData.category || 'Geral',
      to: formData.to || '',
      cc: formData.cc || '',
      subject: formData.subject || '',
      body: formData.body || '',
      savedAt: new Date().toISOString()
    };

    if (selectedId) {
      onChange(emails.map(e => e.id === selectedId ? newEmail : e));
    } else {
      onChange([...emails, newEmail]);
      setSelectedId(newEmail.id);
    }
    alert("Salvo com sucesso!");
  };

  const handleDeleteEmail = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Excluir este modelo permanentemente?")) {
      onChange(emails.filter(em => em.id !== id));
      if (selectedId === id) handleNewEmail();
    }
  };

  const handleMoveEmailConfirm = (targetCategory: string) => {
    if (emailToMove) {
      onChange(emails.map(e => e.id === emailToMove.id ? { ...e, category: targetCategory } : e));
      // Se estamos editando o email movido, atualiza o form data também
      if (selectedId === emailToMove.id) {
          setFormData(prev => ({ ...prev, category: targetCategory }));
      }
      setEmailToMove(null);
    }
  };

  // --- AÇÕES EXTERNAS ---
  const openInOutlook = () => {
    const params = new URLSearchParams({
        to: formData.to || '',
        cc: formData.cc || '',
        subject: formData.subject || '',
        body: formData.body || ''
    });
    window.open(`https://outlook.office.com/mail/deeplink/compose?${params.toString()}`, '_blank');
  };

  const openInDefaultMail = () => {
    const { to, cc, subject, body } = formData;
    window.location.href = `mailto:${to || ''}?cc=${encodeURIComponent(cc || '')}&subject=${encodeURIComponent(subject || '')}&body=${encodeURIComponent(body || '')}`;
  };

  return (
    <div className="flex h-full gap-1 overflow-hidden bg-win95-bg relative">
      
      {/* COLUNA 1: PASTAS (DIRETÓRIO) */}
      <div className="w-48 flex flex-col bg-win95-bg win95-raised p-1 shrink-0">
        <div className="px-2 py-1 mb-1 bg-[#000080] text-white flex justify-between items-center shadow-sm">
          <span className="text-[10px] font-bold uppercase flex items-center gap-2"><Folder size={12} /> Pastas</span>
          <button onClick={handleCreateFolder} className="text-white hover:bg-white/20 p-0.5 rounded" title="Nova Pasta">
             <FolderPlus size={12} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto win95-sunken bg-white p-1">
          {categories.map(cat => {
            const isEditing = editingCategory === cat;
            const isSystem = cat === 'Todas';

            return (
                <div 
                    key={cat}
                    onClick={() => !isEditing && setActiveCategory(cat)}
                    className={`flex items-center justify-between px-2 py-1.5 cursor-pointer mb-0.5 text-xs group ${activeCategory === cat && !isEditing ? 'bg-[#000080] text-white' : 'hover:bg-gray-100 text-black'}`}
                >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Folder size={12} className={activeCategory === cat ? 'text-yellow-300 fill-yellow-300' : 'text-yellow-500 fill-yellow-500'} />
                        
                        {isEditing ? (
                            <div className="flex items-center gap-1 flex-1" onClick={e => e.stopPropagation()}>
                                <input 
                                    className="w-full text-xs p-0.5 border border-black text-black"
                                    value={editFolderInput}
                                    onChange={e => setEditFolderInput(e.target.value)}
                                    autoFocus
                                    onKeyDown={e => e.key === 'Enter' && saveRenameFolder()}
                                />
                                <button onClick={saveRenameFolder} className="text-green-600 hover:bg-green-100 p-0.5"><Check size={10}/></button>
                                <button onClick={() => setEditingCategory(null)} className="text-red-600 hover:bg-red-100 p-0.5"><X size={10}/></button>
                            </div>
                        ) : (
                            <span className="truncate font-bold">{cat}</span>
                        )}
                    </div>

                    {!isSystem && !isEditing && (
                        <div className={`flex gap-1 ${activeCategory === cat ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                            <button onClick={(e) => startRenameFolder(cat, e)} className="p-0.5 hover:bg-white/20 rounded"><Edit2 size={10} /></button>
                            <button onClick={(e) => deleteFolder(cat, e)} className="p-0.5 hover:bg-red-500 hover:text-white rounded text-red-500"><Trash2 size={10} /></button>
                        </div>
                    )}
                </div>
            );
          })}
        </div>
      </div>

      {/* COLUNA 2: LISTA DE E-MAILS */}
      <div className="w-60 flex flex-col bg-win95-bg win95-raised p-1 shrink-0">
        <div className="px-2 py-1 mb-1 bg-[#808080] text-white flex justify-between items-center shadow-sm">
           <span className="text-[10px] font-bold uppercase flex items-center gap-2"><LayoutList size={12} /> Modelos</span>
           <button onClick={handleNewEmail} className="text-white hover:bg-white/20 p-0.5 rounded" title="Novo Modelo">
             <Plus size={12} />
           </button>
        </div>

        <div className="bg-gray-100 border-b border-win95-shadow px-2 py-1 text-[9px] font-bold uppercase text-gray-500 mb-1 truncate">
            {activeCategory} ({filteredEmails.length})
        </div>

        <div className="flex-1 overflow-y-auto win95-sunken bg-white p-1 space-y-0.5">
          {filteredEmails.length === 0 ? (
            <div className="text-center p-4 text-[#808080] text-[10px] italic">Pasta vazia.</div>
          ) : (
            filteredEmails.map(email => (
              <div 
                key={email.id}
                onClick={() => handleSelect(email.id)}
                className={`px-2 py-1.5 cursor-pointer text-xs group border border-transparent flex justify-between items-start ${
                  selectedId === email.id ? 'bg-[#000080] text-white' : 'text-black hover:bg-[#e0e0e0]'
                }`}
              >
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="truncate font-bold leading-tight">{email.name}</span>
                  <span className={`text-[9px] truncate ${selectedId === email.id ? 'text-gray-300' : 'text-gray-500'}`}>{email.subject || '(Sem Assunto)'}</span>
                </div>
                
                <div className={`flex flex-col gap-1 ml-1 ${selectedId === email.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setEmailToMove(email); }} 
                        className={`p-0.5 rounded ${selectedId === email.id ? 'hover:bg-white/20' : 'hover:bg-gray-300 text-gray-600'}`}
                        title="Mover para outra pasta"
                    >
                        <ArrowRightLeft size={10} />
                    </button>
                    <button 
                        onClick={(e) => handleDeleteEmail(email.id, e)} 
                        className={`p-0.5 rounded ${selectedId === email.id ? 'hover:bg-red-500' : 'hover:bg-red-200 text-red-600'}`}
                        title="Excluir"
                    >
                        <Trash2 size={10} />
                    </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* COLUNA 3: EDITOR */}
      <div className="flex-1 flex flex-col bg-win95-bg win95-raised p-1 overflow-hidden min-w-[300px]">
        <div className="p-1 mb-2 bg-[#808080] flex justify-between items-center border-b border-white shrink-0 shadow-sm">
           <h3 className="font-bold text-white text-xs flex items-center gap-2 px-2 uppercase">
             <Mail size={12} />
             {selectedId ? `Editando: ${formData.name}` : 'Criando Novo Modelo'}
           </h3>
           <div className="flex gap-1">
             {formData.name && (
               <>
                 <Button onClick={openInOutlook} size="sm" className="h-6 text-[10px]" icon={<ExternalLink size={10} />}>Outlook</Button>
                 <Button onClick={openInDefaultMail} size="sm" className="h-6 text-[10px]" icon={<Send size={10} />}>Enviar</Button>
               </>
             )}
             <div className="w-px h-6 bg-gray-400 mx-1"></div>
             <Button onClick={handleSaveEmail} size="sm" className="h-6 text-[10px] bg-win95-bg" icon={<Save size={10} />}>SALVAR</Button>
           </div>
        </div>
        
        <div className="p-2 flex flex-col gap-3 overflow-y-auto flex-1 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 shrink-0">
            <div>
              <label className="block text-[9px] font-bold text-black mb-0.5 uppercase">Nome do Modelo:</label>
              <input 
                className="w-full px-2 py-1 win95-sunken bg-white outline-none text-xs text-black font-bold border-none"
                value={formData.name || ''}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="Ex: Relatório Mensal"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-black mb-0.5 uppercase">Categoria (Pasta):</label>
              <div className="flex gap-1 items-center bg-gray-100 win95-sunken px-2 py-1">
                  <Folder size={12} className="text-yellow-600" />
                  <span className="text-xs font-bold text-gray-700">{formData.category || 'Geral'}</span>
                  <span className="text-[9px] text-gray-400 ml-auto italic">(Use "Mover" na lista)</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2 p-2 win95-raised bg-[#d4d0c8]">
             <div className="flex items-center gap-2">
                <label className="w-12 text-[9px] font-bold text-black uppercase text-right">Para:</label>
                <input 
                    className="flex-1 px-2 py-1 win95-sunken bg-white outline-none text-xs text-black font-medium"
                    value={formData.to || ''}
                    onChange={e => setFormData({...formData, to: e.target.value})}
                    placeholder="destinatario@email.com"
                />
             </div>
             <div className="flex items-center gap-2">
                <label className="w-12 text-[9px] font-bold text-black uppercase text-right">CC:</label>
                <input 
                    className="flex-1 px-2 py-1 win95-sunken bg-white outline-none text-xs text-black font-medium"
                    value={formData.cc || ''}
                    onChange={e => setFormData({...formData, cc: e.target.value})}
                    placeholder="copia@email.com"
                />
             </div>
             <div className="flex items-center gap-2">
                <label className="w-12 text-[9px] font-bold text-black uppercase text-right">Assunto:</label>
                <input 
                    className="flex-1 px-2 py-1 win95-sunken bg-white outline-none text-xs text-black font-bold"
                    value={formData.subject || ''}
                    onChange={e => setFormData({...formData, subject: e.target.value})}
                    placeholder="Assunto do E-mail"
                />
             </div>
          </div>

          <div className="flex-1 flex flex-col min-h-[200px]">
            <label className="block text-[9px] font-bold text-black mb-0.5 uppercase flex items-center gap-2">
                <FileText size={10} /> Corpo da Mensagem:
            </label>
            <textarea 
              className="flex-1 w-full p-3 win95-sunken bg-white outline-none resize-none font-mono text-xs leading-relaxed text-black"
              value={formData.body || ''}
              onChange={e => setFormData({...formData, body: e.target.value})}
              placeholder="Digite o conteúdo do seu e-mail aqui..."
            />
          </div>
        </div>
      </div>

      {/* MODAL DE MOVER E-MAIL */}
      {emailToMove && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
            <div className="bg-win95-bg w-64 win95-raised p-1 shadow-2xl">
                <div className="bg-win95-blue text-white px-2 py-1 text-xs font-bold flex justify-between items-center mb-2">
                    <span className="flex items-center gap-2"><ArrowRightLeft size={12}/> Mover Modelo</span>
                    <button onClick={() => setEmailToMove(null)} className="win95-raised bg-win95-bg text-black w-4 h-4 flex items-center justify-center text-[10px] font-bold">×</button>
                </div>
                <div className="p-2">
                    <p className="text-[10px] mb-2 truncate font-bold">Item: {emailToMove.name}</p>
                    <p className="text-[10px] mb-1">Selecione a pasta de destino:</p>
                    <div className="max-h-40 overflow-y-auto win95-sunken bg-white p-1 mb-2">
                        {categories.filter(c => c !== 'Todas').map(cat => (
                            <button
                                key={cat}
                                onClick={() => handleMoveEmailConfirm(cat)}
                                className={`w-full text-left px-2 py-1 text-xs flex items-center gap-2 hover:bg-blue-100 ${emailToMove.category === cat ? 'font-bold bg-gray-100 text-gray-500 cursor-default' : ''}`}
                                disabled={emailToMove.category === cat}
                            >
                                <Folder size={12} className={emailToMove.category === cat ? 'text-gray-400' : 'text-yellow-500 fill-yellow-500'} />
                                {cat} {emailToMove.category === cat && '(Atual)'}
                            </button>
                        ))}
                    </div>
                    <div className="flex justify-end">
                        <Button size="sm" onClick={() => setEmailToMove(null)}>Cancelar</Button>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};
