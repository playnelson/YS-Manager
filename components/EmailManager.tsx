import React, { useState } from 'react';
import { Plus, Save, Mail, Trash2, Send, ExternalLink } from 'lucide-react';
import { EmailTemplate } from '../types';
import { Button } from './ui/Button';

interface EmailManagerProps {
  emails: EmailTemplate[];
  onChange: (emails: EmailTemplate[]) => void;
}

export const EmailManager: React.FC<EmailManagerProps> = ({ emails, onChange }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<EmailTemplate>>({});

  const handleSelect = (id: string) => {
    setSelectedId(id);
    const email = emails.find(e => e.id === id);
    if (email) setFormData(email);
  };

  const handleNew = () => {
    setSelectedId(null);
    setFormData({
      name: '',
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
    e.stopPropagation();
    if (confirm("Excluir este modelo?")) {
      onChange(emails.filter(em => em.id !== id));
      if (selectedId === id) handleNew();
    }
  };

  // Funções de Integração
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
    <div className="flex h-full gap-6">
      {/* Sidebar List */}
      <div className="w-64 flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-700">Modelos</h3>
          <Button size="sm" variant="ghost" onClick={handleNew}><Plus size={16} /></Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {emails.length === 0 && (
            <div className="text-center p-4 text-slate-400 text-sm">Nenhum modelo ainda.</div>
          )}
          {emails.map(email => (
            <div 
              key={email.id}
              onClick={() => handleSelect(email.id)}
              className={`p-3 rounded-lg cursor-pointer text-sm flex justify-between items-center group transition-colors ${
                selectedId === email.id ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'hover:bg-slate-50 border border-transparent'
              }`}
            >
              <div className="truncate font-medium">{email.name}</div>
              <button onClick={(e) => handleDelete(email.id, e)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
           <h3 className="font-bold text-slate-700 flex items-center gap-2">
             <Mail size={18} />
             {selectedId ? 'Editar Modelo' : 'Novo Modelo'}
           </h3>
           <div className="flex gap-2">
             {formData.name && (
               <>
                 <button 
                   onClick={openInOutlook}
                   className="flex items-center gap-2 px-3 py-1.5 bg-[#0078d4] hover:bg-[#005a9e] text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                   title="Abrir no Outlook Web"
                 >
                   <ExternalLink size={14} /> Outlook
                 </button>
                 <button 
                   onClick={openInDefaultMail}
                   className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                   title="Abrir no App de E-mail padrão"
                 >
                   <Send size={14} /> Enviar
                 </button>
               </>
             )}
             <Button onClick={handleSave} size="sm" icon={<Save size={16} />}>Salvar</Button>
           </div>
        </div>
        
        <div className="p-6 flex flex-col gap-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome do Modelo</label>
            <input 
              className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              value={formData.name || ''}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="ex: Relatório Mensal"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Para</label>
              <input 
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                value={formData.to || ''}
                onChange={e => setFormData({...formData, to: e.target.value})}
                placeholder="cliente@exemplo.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CC</label>
              <input 
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                value={formData.cc || ''}
                onChange={e => setFormData({...formData, cc: e.target.value})}
                placeholder="copia@exemplo.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Assunto</label>
              <input 
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                value={formData.subject || ''}
                onChange={e => setFormData({...formData, subject: e.target.value})}
                placeholder="Acompanhamento de Reunião"
              />
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Corpo da Mensagem</label>
            <textarea 
              className="flex-1 w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none font-mono text-sm leading-relaxed"
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