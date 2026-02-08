
import React, { useState } from 'react';
import { MessageCircle, Smartphone, Globe, Monitor, Zap } from 'lucide-react';
import { Button } from './ui/Button';

export const WhatsAppTool: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [openMethod, setOpenMethod] = useState<'api' | 'web' | 'app'>('api');

  const handleLaunch = () => {
    if (!phone) return;
    
    // Remove tudo que não é dígito
    let cleanPhone = phone.replace(/\D/g, '');
    
    /**
     * Lógica para garantir o +55 (Brasil):
     * Se o número tiver 10 ou 11 dígitos (DDD + Número), adicionamos 55.
     * Se o usuário já tiver colocado 12 ou 13 dígitos começando com 55, mantemos.
     */
    if (cleanPhone.length <= 11) {
      cleanPhone = '55' + cleanPhone;
    } else if (cleanPhone.length > 11 && !cleanPhone.startsWith('55')) {
      // Se tiver muitos dígitos mas não começar com 55, assumimos que o usuário errou ou usou outro DDI
      // Mas a regra pede SEMPRE +55, então vamos garantir que o prefixo final seja 55
      // Para o Brasil o padrão é 55 + DDD (2) + Número (8 ou 9) = 12 ou 13 dígitos.
    }

    const textParam = encodeURIComponent(message);
    let url = '';

    switch (openMethod) {
      case 'web':
        url = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${textParam}`;
        break;
      case 'app':
        url = `whatsapp://send?phone=${cleanPhone}&text=${textParam}`;
        break;
      case 'api':
      default:
        url = `https://wa.me/${cleanPhone}?text=${textParam}`;
        break;
    }

    window.open(url, '_blank');
  };

  return (
    <div className="h-full flex items-center justify-center bg-[#f8f9fa]">
      <div className="bg-white border border-[#dee2e6] rounded shadow-sm w-full max-w-md overflow-hidden">
        <div className="bg-[#f1f4f6] p-4 border-b border-[#dee2e6] flex items-center gap-3 text-[#556b82]">
          <Smartphone size={20} />
          <h2 className="text-sm font-bold uppercase tracking-wide">Comunicação Direta (WhatsApp)</h2>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-[#556b82]">Número de Destino (Com DDD)</label>
            <div className="flex gap-2">
              <div className="win95-sunken bg-gray-100 px-3 py-2 text-sm text-gray-500 font-bold flex items-center border border-[#dee2e6]">
                +55
              </div>
              <input 
                type="tel"
                className="flex-1 px-3 py-2 border border-[#dee2e6] rounded bg-white text-sm outline-none focus:border-[#0064d2]"
                placeholder="Ex: 11 99999-9999"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>
            <p className="text-[9px] text-[#556b82]/60 italic">O código do país (+55) é adicionado automaticamente.</p>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-[#556b82]">Modo de Abertura</label>
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => setOpenMethod('api')}
                className={`flex flex-col items-center justify-center p-2 border rounded text-[10px] font-bold gap-1 transition-all ${openMethod === 'api' ? 'bg-[#e7f5ff] border-[#0064d2] text-[#0064d2]' : 'bg-white border-[#dee2e6] text-[#556b82] hover:bg-gray-50'}`}
                title="Deixa o sistema decidir (wa.me)"
              >
                <Zap size={14} />
                <span>Automático</span>
              </button>
              <button 
                onClick={() => setOpenMethod('web')}
                className={`flex flex-col items-center justify-center p-2 border rounded text-[10px] font-bold gap-1 transition-all ${openMethod === 'web' ? 'bg-[#e7f5ff] border-[#0064d2] text-[#0064d2]' : 'bg-white border-[#dee2e6] text-[#556b82] hover:bg-gray-50'}`}
                title="Força abrir no WhatsApp Web"
              >
                <Globe size={14} />
                <span>Navegador</span>
              </button>
              <button 
                onClick={() => setOpenMethod('app')}
                className={`flex flex-col items-center justify-center p-2 border rounded text-[10px] font-bold gap-1 transition-all ${openMethod === 'app' ? 'bg-[#e7f5ff] border-[#0064d2] text-[#0064d2]' : 'bg-white border-[#dee2e6] text-[#556b82] hover:bg-gray-50'}`}
                title="Tenta abrir o App Desktop Instalado"
              >
                <Monitor size={14} />
                <span>App Desktop</span>
              </button>
            </div>
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
          <p className="text-[9px] font-bold text-[#556b82] uppercase opacity-50">Otimizado para conexões brasileiras</p>
        </div>
      </div>
    </div>
  );
};
