import React, { useState } from 'react';
import { MessageCircle, ExternalLink } from 'lucide-react';
import { Button } from './ui/Button';

export const WhatsAppTool: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  const handleLaunch = () => {
    if (!phone) return alert("Por favor, insira um número de telefone");
    // Strip non-numeric chars
    const cleanPhone = phone.replace(/\D/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="h-full flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden">
        <div className="bg-[#25D366] p-6 text-center">
          <MessageCircle className="w-16 h-16 text-white mx-auto mb-2" />
          <h2 className="text-2xl font-bold text-white">WhatsApp Direto</h2>
          <p className="text-green-50 text-sm">Inicie uma conversa sem salvar o contato.</p>
        </div>
        
        <div className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Número de Telefone (com código do país)</label>
            <div className="relative">
               <span className="absolute left-3 top-2.5 text-slate-400 font-bold">+</span>
               <input 
                 type="tel"
                 className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-[#25D366] outline-none"
                 placeholder="55 11 99999-9999"
                 value={phone}
                 onChange={e => setPhone(e.target.value)}
               />
            </div>
            <p className="text-xs text-slate-500 mt-1">Exemplo: 5511999999999 (Brasil)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mensagem Opcional</label>
            <textarea 
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-[#25D366] outline-none resize-none"
              rows={3}
              placeholder="Olá, gostaria de falar sobre..."
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
          </div>

          <button 
            onClick={handleLaunch}
            className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span>Abrir WhatsApp</span>
            <ExternalLink size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};