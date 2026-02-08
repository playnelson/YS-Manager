
import React, { useState, useEffect } from 'react';
import { MessageCircle, Smartphone, Globe, Monitor, Zap, User, History, Clock, Trash2, RotateCcw } from 'lucide-react';
import { Button } from './ui/Button';

interface HistoryItem {
  id: string;
  name: string;
  phone: string;
  message: string;
  timestamp: string;
  method: 'api' | 'web' | 'app';
}

export const WhatsAppTool: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [openMethod, setOpenMethod] = useState<'api' | 'web' | 'app'>('api');
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('ysoffice_whatsapp_history');
    return saved ? JSON.parse(saved) : [];
  });

  // Salvar histórico no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem('ysoffice_whatsapp_history', JSON.stringify(history));
  }, [history]);

  // Formatação Automática de Telefone
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove não números
    
    // Limita a 11 dígitos (DDD + 9 + 8 dígitos)
    if (value.length > 11) value = value.slice(0, 11);

    // Aplica máscara (XX) XXXXX-XXXX
    if (value.length > 2) {
      value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    }
    if (value.length > 10) {
      value = `${value.slice(0, 10)}-${value.slice(10)}`;
    } else if (value.length > 9 && value.length <= 10) {
      // Ajuste para números fixos ou incompletos se necessário, mas foca no celular
      // Formato (XX) XXXX-XXXX para fixo seria outra lógica, mas aqui assumimos celular principal
      // Para manter simples e funcional para celular:
    }

    setPhone(value);

    // Tenta encontrar identificação no histórico
    const rawNum = value.replace(/\D/g, '');
    if (rawNum.length >= 10) {
      const found = history.find(h => h.phone.replace(/\D/g, '') === rawNum);
      if (found && found.name && !name) {
        setName(found.name);
      }
    }
  };

  const handleLaunch = () => {
    if (!phone) return;
    
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Validação básica
    if (cleanPhone.length < 10) {
      alert("Número inválido. Digite DDD + Número.");
      return;
    }

    let finalPhone = cleanPhone;
    if (finalPhone.length <= 11) {
      finalPhone = '55' + finalPhone;
    } else if (finalPhone.length > 11 && !finalPhone.startsWith('55')) {
      // Já tem DDI mas não é 55? Mantém. Se não, assume 55.
    }

    const textParam = encodeURIComponent(message);
    let url = '';

    switch (openMethod) {
      case 'web':
        url = `https://web.whatsapp.com/send?phone=${finalPhone}&text=${textParam}`;
        break;
      case 'app':
        url = `whatsapp://send?phone=${finalPhone}&text=${textParam}`;
        break;
      case 'api':
      default:
        url = `https://wa.me/${finalPhone}?text=${textParam}`;
        break;
    }

    // Adicionar ao Histórico
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      name: name || 'Sem identificação',
      phone: phone, // Salva formatado
      message,
      timestamp: new Date().toISOString(),
      method: openMethod
    };

    // Remove duplicatas exatas recentes para não poluir, ou apenas adiciona no topo
    setHistory(prev => [newItem, ...prev].slice(0, 50)); // Mantém os últimos 50

    window.open(url, '_blank');
  };

  const loadFromHistory = (item: HistoryItem) => {
    setPhone(item.phone);
    setName(item.name);
    setMessage(item.message);
    setOpenMethod(item.method);
  };

  const clearHistory = () => {
    if(confirm('Limpar todo o histórico?')) {
      setHistory([]);
    }
  };

  return (
    <div className="h-full flex gap-2 bg-[#c0c0c0] p-1 overflow-hidden">
      {/* Esquerda: Formulário de Envio (Centralizado e Limitado) */}
      <div className="flex-1 flex flex-col items-center pt-6 overflow-y-auto bg-[#808080]/5">
        <div className="win95-raised bg-win95-bg border border-white p-1 w-full max-w-[400px] shadow-xl">
          <div className="bg-[#000080] text-white p-2 flex items-center gap-2 text-xs font-bold uppercase mb-1 select-none">
            <Smartphone size={14} />
            <span>Nova Mensagem</span>
          </div>
          
          <div className="p-4 space-y-4">
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-[#444]">Identificação (Nome do Contato)</label>
              <div className="flex items-center gap-2">
                <div className="win95-sunken bg-gray-100 p-1.5 border border-gray-400">
                  <User size={14} className="text-gray-500" />
                </div>
                <input 
                  type="text"
                  className="flex-1 px-3 py-1.5 border border-gray-400 win95-sunken bg-white text-sm outline-none focus:bg-yellow-50"
                  placeholder="Ex: João Silva (Cliente)"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-[#444]">Número (Automático)</label>
              <div className="flex gap-2">
                <div className="win95-sunken bg-gray-100 px-3 py-2 text-sm text-gray-500 font-bold flex items-center border border-gray-400 select-none">
                  +55
                </div>
                <input 
                  type="tel"
                  className="flex-1 px-3 py-2 border border-gray-400 win95-sunken bg-white text-lg font-mono font-bold outline-none focus:bg-yellow-50"
                  placeholder="(00) 00000-0000"
                  value={phone}
                  onChange={handlePhoneChange}
                  maxLength={15}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-[#444]">Método de Envio</label>
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => setOpenMethod('api')}
                  className={`flex flex-col items-center justify-center p-2 border-2 text-[9px] font-bold gap-1 active:translate-x-[1px] active:translate-y-[1px] ${openMethod === 'api' ? 'win95-sunken bg-white border-gray-400 text-blue-800' : 'win95-raised bg-win95-bg border-white text-black'}`}
                >
                  <Zap size={12} />
                  <span>Automático</span>
                </button>
                <button 
                  onClick={() => setOpenMethod('web')}
                  className={`flex flex-col items-center justify-center p-2 border-2 text-[9px] font-bold gap-1 active:translate-x-[1px] active:translate-y-[1px] ${openMethod === 'web' ? 'win95-sunken bg-white border-gray-400 text-green-800' : 'win95-raised bg-win95-bg border-white text-black'}`}
                >
                  <Globe size={12} />
                  <span>Web</span>
                </button>
                <button 
                  onClick={() => setOpenMethod('app')}
                  className={`flex flex-col items-center justify-center p-2 border-2 text-[9px] font-bold gap-1 active:translate-x-[1px] active:translate-y-[1px] ${openMethod === 'app' ? 'win95-sunken bg-white border-gray-400 text-purple-800' : 'win95-raised bg-win95-bg border-white text-black'}`}
                >
                  <Monitor size={12} />
                  <span>App</span>
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-[#444]">Mensagem</label>
              <textarea 
                className="w-full px-3 py-2 border border-gray-400 win95-sunken bg-white text-sm outline-none resize-none focus:bg-yellow-50"
                rows={4}
                placeholder="Digite aqui..."
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
            </div>

            <Button 
              onClick={handleLaunch}
              className="w-full h-10"
              icon={<MessageCircle size={16} />}
            >
              ENVIAR MENSAGEM
            </Button>
          </div>
        </div>
      </div>

      {/* Direita: Histórico */}
      <div className="w-72 flex flex-col bg-win95-bg win95-raised p-1 h-full">
        <div className="flex items-center justify-between bg-[#000080] text-white p-1 mb-1 px-2">
           <div className="flex items-center gap-1 text-[10px] font-bold uppercase">
             <History size={12} /> Histórico Recente
           </div>
           <button onClick={clearHistory} className="text-white hover:bg-red-600 p-0.5 rounded" title="Limpar Histórico">
             <Trash2 size={12} />
           </button>
        </div>
        
        <div className="flex-1 win95-sunken bg-white overflow-y-auto custom-scrollbar p-1 space-y-2">
          {history.length === 0 ? (
            <div className="text-center p-4 text-[#808080] text-[10px] italic">
              Nenhuma mensagem enviada.
            </div>
          ) : (
            history.map(item => (
              <div key={item.id} className="border border-dotted border-gray-300 p-2 hover:bg-blue-50 group relative bg-gray-50">
                <div className="flex justify-between items-start mb-1">
                  <div className="font-bold text-xs text-blue-800 truncate max-w-[140px]">{item.name}</div>
                  <div className="text-[9px] text-gray-500 flex items-center gap-0.5">
                    <Clock size={8} /> {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
                <div className="text-[10px] font-mono font-bold text-black mb-1">{item.phone}</div>
                {item.message && (
                  <div className="text-[9px] text-gray-600 italic truncate border-t border-gray-200 pt-1">
                    "{item.message}"
                  </div>
                )}
                
                <button 
                  onClick={() => loadFromHistory(item)}
                  className="absolute bottom-1 right-1 p-1 bg-white border border-gray-300 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-100"
                  title="Reutilizar dados"
                >
                  <RotateCcw size={12} className="text-blue-600"/>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
