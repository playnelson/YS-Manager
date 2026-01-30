
import React, { useState } from 'react';
import { MessageCircle, ExternalLink, Smartphone } from 'lucide-react';
import { Button } from './ui/Button';

export const WhatsAppTool: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  const handleLaunch = () => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="h-full flex items-center justify-center bg-[#f8f9fa]">
      <div className="bg-white border border-[#dee2e6] rounded shadow-sm w-full max-w-md overflow-hidden">
        <div className="bg-[#f1f4f6] p-4 border-b border-[#dee2e6] flex items-center gap-3 text-[#556b82]">
          <Smartphone size={20} />
          <h2 className="text-sm font-bold uppercase tracking-wide">Comunicação Externa</h2>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-[#556b82]">Número de Destino</label>
            <input 
              type="tel"
              className="w-full px-3 py-2 border border-[#dee2e6] rounded bg-white text-sm outline-none focus:border-[#0064d2]"
              placeholder="Ex: 5511999999999"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
            <p className="text-[9px] text-[#556b82]/60 italic">Formato: Código do país + DDD + Número</p>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-[#556b82]">Corpo da Mensagem (Opcional)</label>
            <textarea 
              className="w-full px-3 py-2 border border-[#dee2e6] rounded bg-white text-sm outline-none focus:border-[#0064d2] resize-none"
              rows={4}
              placeholder="Digite o texto padrão..."
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
          </div>

          <Button 
            onClick={handleLaunch}
            className="w-full"
            icon={<MessageCircle size={16} />}
          >
            DISPARAR MENSAGEM
          </Button>
        </div>
        <div className="p-3 bg-[#f8f9fa] border-t border-[#dee2e6] text-center">
          <p className="text-[9px] font-bold text-[#556b82] uppercase opacity-50">Transmissão via WhatsApp Web Protocol</p>
        </div>
      </div>
    </div>
  );
};
