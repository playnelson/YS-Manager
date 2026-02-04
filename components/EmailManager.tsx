
import React, { useState, useMemo } from 'react';
import { Plus, Save, Mail, Trash2, Send, ExternalLink, Filter, Tag } from 'lucide-react';
import { EmailTemplate } from '../types';
import { Button } from './ui/Button';

interface EmailManagerProps {
  emails: EmailTemplate[];
  onChange: (emails: EmailTemplate[]) => void;
}

export const EmailManager: React.FC<EmailManagerProps> = ({ emails, onChange }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<EmailTemplate>>({});
  const [filterCategory, setFilterCategory] = useState<string>('Todas');

  const categories = useMemo(() => {
    const cats = new Set<string>();
    emails.forEach(e => { if (e.category) cats.add(e.category); });
    return ['Todas', ...Array.from(cats).sort()];
  }, [emails]);

  const filteredEmails = useMemo(() => {
    if (filterCategory === 'Todas') return emails;
    return emails.filter(e => e.category === filterCategory);
  }, [emails, filterCategory]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    const email = emails.find(e => e.id === id);
    if (email) setFormData(email);
  };

  const handleNew = () => {
    setSelectedId(null);
    setFormData({
      name: '',
      category: filterCategory !== 'Todas' ? filterCategory : 'Geral',
      to: '',
      cc: '',
      subject: '',
      body: ''
    });
  };

  const handleSave = () => {
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

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm("Deseja realmente excluir este modelo permanentemente?")) {
      const updatedEmails = emails.filter(em => em.id !== id);
      onChange(updatedEmails);
      if (selectedId === id) handleNew();
    }
  };

  const openInOutlook = () => {
    const to = encodeURIComponent(formData.to || '');
    const cc = encodeURIComponent(formData.cc || '');
    const subject = encodeURIComponent(formData.subject || '');
    const body = encodeURIComponent(formData.body || '');
    const outlookUrl = `https://outlook.office.com/mail/deeplink/compose?to=${to}&cc=${cc}&subject=${subject}&body=${body}`;
    window.open(outlookUrl, '_blank');
  };

  const openInDefaultMail = () => {
    const to = formData.to || '';
    const cc = encodeURIComponent(formData.cc || '');
    const subject = encodeURIComponent(formData.subject || '');
    const body = encodeURIComponent(formData.body || '');
    window.location.href = `mailto:${to}?cc=${cc}&subject=${subject}&body=${body}`;
  };

  return (
    <div className="flex h-full gap-2 overflow-hidden">
      {/* Sidebar List */}
      <div className="w-64 flex flex-col bg-win95-bg win95-raised p-1 overflow-hidden">
        <div className="px-2 py-1 mb-1 bg-[#000080] text-white flex justify-between items-center">
          <h3 className="font-bold text-xs">Modelos</h3>
          <button onClick={handleNew} className="text-white hover:bg-[#0000d0] p-0.5"><Plus size={12} /></button>
        </div>
        
        {/* Filtro de Categoria */}
        <div className="mb-2 px-1 py-1 bg-win95-bg flex items-center gap-2 border-b border-win95-shadow">
          <Filter size={10} className="text-[#808080]" />
          <select 
            className="flex-1 win95-sunken bg-white text-[10px] outline-none h-5 px-1"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto win95-sunken bg-white p-1 space-y-0.5">
          {filteredEmails.length === 0 && (
            <div className="text-center p-4 text-[#808080] text-xs">Nenhum modelo.</div>
          )}
          {filteredEmails.map(email => (
            <div 
              key={email.id}
              onClick={() => handleSelect(email.id)}
              className={`px-2 py-1 cursor-pointer text-xs flex justify-between items-center group border border-transparent ${
                selectedId === email.id ? 'bg-[#000080] text-white border-dotted border-white' : 'text-black hover:bg-[#e0e0e0]'
              }`}
            >
              <div className="flex flex-col truncate flex-1 pr-2">
                <span className="truncate font-bold">{email.name}</span>
                <span className={`text-[8px] opacity-70 ${selectedId === email.id ? 'text-white' : 'text-[#808080]'}`}>
                  {email.category || 'Geral'}
                </span>
              </div>
              <button 
                onClick={(e) => handleDelete(email.id, e)} 
                className="w-5 h-5 flex items-center justify-center win95-raised bg-[#c0c0c0] hover:bg-red-600 group/btn shrink-0"
                title="Excluir"
              >
                <Trash2 size={10} className="text-red-600 group-hover/btn:text-white" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col bg-win95-bg win95-raised p-1 overflow-hidden">
        <div className="p-1 mb-2 bg-[#808080] flex justify-between items-center border-b border-white shrink-0">
           <h3 className="font-bold text-white text-xs flex items-center gap-2 px-2">
             <Mail size={14} />
             {selectedId ? 'EDITOR DE MODELO' : 'NOVO MODELO'}
           </h3>
           <div className="flex gap-2">
             {formData.name && (
               <>
                 <button 
                   onClick={openInOutlook}
                   className="flex items-center gap-1 px-3 py-1 bg-[#0078d4] text-white text-[10px] font-bold border-t-2 border-l-2 border-white border-b-2 border-r-2 border-[#000000] shadow-[1px_1px_0px_#808080] active:border-t-[#000000] active:border-l-[#000000] active:border-b-white active:border-r-white active:shadow-none active:translate-y-[1px] active:translate-x-[1px]"
                 >
                   <ExternalLink size={12} /> Outlook
                 </button>
                 <button 
                   onClick={openInDefaultMail}
                   className="flex items-center gap-1 px-3 py-1 bg-[#334155] text-white text-[10px] font-bold border-t-2 border-l-2 border-white border-b-2 border-r-2 border-[#000000] shadow-[1px_1px_0px_#808080] active:border-t-[#000000] active:border-l-[#000000] active:border-b-white active:border-r-white active:shadow-none active:translate-y-[1px] active:translate-x-[1px]"
                 >
                   <Send size={12} /> Enviar
                 </button>
               </>
             )}
             <Button onClick={handleSave} size="sm" icon={<Save size={12} />}>SALVAR</Button>
           </div>
        </div>
        
        <div className="p-2 flex flex-col gap-3 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 shrink-0">
            <div>
              <label className="block text-[10px] font-bold text-black mb-0.5 uppercase">Nome do Modelo:</label>
              <input 
                className="w-full px-2 py-1 win95-sunken bg-white outline-none text-xs text-black font-medium"
                value={formData.name || ''}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="ex: Relatório Mensal"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-black mb-0.5 uppercase">Categoria:</label>
              <div className="flex gap-1">
                <div className="flex-1 relative">
                  <Tag size={10} className="absolute left-1.5 top-2 text-win95-shadow" />
                  <input 
                    list="email-cats"
                    className="w-full pl-5 pr-2 py-1 win95-sunken bg-white outline-none text-xs text-black font-medium"
                    value={formData.category || ''}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    placeholder="Geral"
                  />
                  <datalist id="email-cats">
                    {categories.filter(c => c !== 'Todas').map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 shrink-0">
             <div>
              <label className="block text-[10px] font-bold text-black mb-0.5 uppercase">Para:</label>
              <input 
                className="w-full px-2 py-1 win95-sunken bg-white outline-none text-xs text-black font-medium"
                value={formData.to || ''}
                onChange={e => setFormData({...formData, to: e.target.value})}
                placeholder="cliente@exemplo.com"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-black mb-0.5 uppercase">CC:</label>
              <input 
                className="w-full px-2 py-1 win95-sunken bg-white outline-none text-xs text-black font-medium"
                value={formData.cc || ''}
                onChange={e => setFormData({...formData, cc: e.target.value})}
                placeholder="copia@exemplo.com"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-black mb-0.5 uppercase">Assunto:</label>
              <input 
                className="w-full px-2 py-1 win95-sunken bg-white outline-none text-xs text-black font-medium"
                value={formData.subject || ''}
                onChange={e => setFormData({...formData, subject: e.target.value})}
                placeholder="Acompanhamento de Reunião"
              />
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-[200px]">
            <label className="block text-[10px] font-bold text-black mb-0.5 uppercase">Mensagem:</label>
            <textarea 
              className="flex-1 w-full p-2 win95-sunken bg-white outline-none resize-none font-mono text-xs leading-relaxed text-black"
              value={formData.body || ''}
              onChange={e => setFormData({...formData, body: e.target.value})}
              placeholder="Digite o conteúdo do seu e-mail aqui..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};
