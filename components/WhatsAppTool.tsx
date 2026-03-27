'use client';

import { generateUUID } from '../uuid';
import React, { useState, useEffect, useRef } from 'react';
import {
  MessageCircle, Smartphone, Globe, Monitor, Zap, User, History,
  Clock, Trash2, RotateCcw, QrCode, Copy, Check, Send,
  Plus, FileText, Share2, ExternalLink, Search as SearchIcon, RefreshCw, Users, Book
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { QRCodeCanvas } from 'qrcode.react';
import { Contact, WhatsAppHistoryItem, WhatsAppTemplate } from '@/types';
import { fetchGoogleContacts } from '../services/googleContactsService';

interface WhatsAppToolProps {
  googleAccessToken?: string;
  templates: WhatsAppTemplate[];
  onTemplatesChange: (data: WhatsAppTemplate[]) => void;
  history: WhatsAppHistoryItem[];
  onHistoryChange: (data: WhatsAppHistoryItem[]) => void;
}

export const WhatsAppTool: React.FC<WhatsAppToolProps> = ({
  googleAccessToken,
  templates,
  onTemplatesChange,
  history,
  onHistoryChange
}) => {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [openMethod, setOpenMethod] = useState<'api' | 'web' | 'app'>('api');
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const [contacts, setContacts] = useState<Contact[]>(() => {
    const saved = localStorage.getItem('ysoffice_whatsapp_contacts');
    return saved ? JSON.parse(saved) : [];
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeRightTab, setActiveRightTab] = useState<'history' | 'contacts'>('history');

  useEffect(() => {
    const pending = sessionStorage.getItem('ysoffice_pending_wa');
    if (pending) {
      try {
        const { phone, message } = JSON.parse(pending);
        setPhone(phone);
        setMessage(message);
        sessionStorage.removeItem('ysoffice_pending_wa');
      } catch (e) { console.error(e); }
    }
  }, []);

  // Removed local storage effects as data is now managed by App.tsx props

  // Formatação Automática de Telefone
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove não números

    if (value.length > 11) value = value.slice(0, 11);

    if (value.length > 2) {
      value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    }
    if (value.length > 10) {
      value = `${value.slice(0, 10)}-${value.slice(10)}`;
    }

    setPhone(value);

    const rawNum = value.replace(/\D/g, '');
    if (rawNum.length >= 10) {
      const found = history.find(h => h.phone.replace(/\D/g, '') === rawNum);
      if (found && found.name && !name) {
        setName(found.name);
      }
    }
  };

  const getFinalUrl = () => {
    const cleanPhone = phone.replace(/\D/g, '');
    let finalPhone = cleanPhone;
    if (finalPhone.length <= 11) {
      finalPhone = '55' + finalPhone;
    }
    const textParam = encodeURIComponent(message);

    switch (openMethod) {
      case 'web':
        return `https://web.whatsapp.com/send?phone=${finalPhone}&text=${textParam}`;
      case 'app':
        return `whatsapp://send?phone=${finalPhone}&text=${textParam}`;
      case 'api':
      default:
        return `https://wa.me/${finalPhone}?text=${textParam}`;
    }
  };

  const handleLaunch = () => {
    if (!phone) return;

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      alert("Número inválido. Digite DDD + Número.");
      return;
    }

    const url = getFinalUrl();

    // Adicionar ao Histórico
    const newItem: WhatsAppHistoryItem = {
      id: generateUUID(),
      name: name || 'Sem identificação',
      phone: phone,
      message,
      timestamp: new Date().toISOString(),
      method: openMethod
    };

    onHistoryChange([newItem, ...history].slice(0, 50));
    window.open(url, '_blank');
  };

  const copyLink = () => {
    const url = `https://wa.me/${phone.replace(/\D/g, '').length <= 11 ? '55' + phone.replace(/\D/g, '') : phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadFromHistory = (item: WhatsAppHistoryItem) => {
    setPhone(item.phone);
    setName(item.name);
    setMessage(item.message);
    setOpenMethod(item.method);
  };

  const clearHistory = () => {
    if (confirm('Limpar todo o histórico?')) {
      onHistoryChange([]);
    }
  };

  const applyTemplate = (content: string) => {
    setMessage(content);
  };

  const syncContacts = async () => {
    if (!googleAccessToken) {
      alert("Por favor, vincule sua conta Google nas configurações.");
      return;
    }
    setIsSyncing(true);
    try {
      const gContacts = await fetchGoogleContacts(googleAccessToken);
      setContacts(gContacts);
      localStorage.setItem('ysoffice_whatsapp_contacts', JSON.stringify(gContacts));
      setActiveRightTab('contacts');
    } catch (e) {
      console.error(e);
      alert("Erro ao sincronizar contatos.");
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  const selectContact = (c: Contact) => {
    setName(c.name);
    setPhone(c.phone);
  };

  return (
    <div className="h-full flex gap-2 bg-palette-mediumLight dark:bg-[#1a1a1a] p-1 overflow-hidden">
      {/* Esquerda: Formulário e Ferramentas */}
      <div className="flex-1 flex flex-col gap-2 overflow-y-auto custom-scrollbar p-1">

        <div className="win95-raised border border-palette-lightest dark:border-gray-800 p-1 w-full shadow-md">
          <div className="bg-[#000080] dark:bg-blue-900 text-white p-1.5 flex items-center justify-between text-xs font-bold uppercase mb-1">
            <div className="flex items-center gap-2">
              <Smartphone size={14} />
              <span>Gerador de Link e Mensagem</span>
            </div>
          </div>

          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-[#444] dark:text-gray-400">Nome do Contato</label>
                <div className="flex items-center gap-2">
                  <div className="win95-sunken bg-palette-mediumLight dark:bg-gray-800 p-1.5 border border-palette-mediumDark dark:border-gray-700">
                    <User size={14} className="text-gray-500 dark:text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="flex-1 px-3 py-1.5 border border-gray-400 dark:border-gray-700 win95-sunken bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white outline-none focus:bg-yellow-50 dark:focus:bg-gray-800"
                    placeholder="Ex: João Silva"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-[#444] dark:text-gray-400">Número do WhatsApp</label>
                <div className="flex gap-2">
                  <div className="win95-sunken bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 font-bold flex items-center border border-gray-400 dark:border-gray-700 select-none">
                    +55
                  </div>
                  <input
                    type="tel"
                    className="flex-1 px-3 py-2 border border-gray-400 dark:border-gray-700 win95-sunken bg-white dark:bg-gray-900 text-lg font-mono font-bold text-gray-900 dark:text-white outline-none focus:bg-yellow-50 dark:focus:bg-gray-800"
                    placeholder="(00) 00000-0000"
                    value={phone}
                    onChange={handlePhoneChange}
                    maxLength={15}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-[#444] dark:text-gray-400">Mensagem</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-400 dark:border-gray-700 win95-sunken bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white outline-none resize-none focus:bg-yellow-50 dark:focus:bg-gray-800"
                  rows={4}
                  placeholder="Digite sua mensagem aqui..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleLaunch}
                  className="flex-1 h-10"
                  icon={<Send size={16} />}
                >
                  ENVIAR AGORA
                </Button>
                <button
                  onClick={copyLink}
                  className={`win95-btn px-3 flex items-center gap-2 ${copied ? 'text-green-700' : ''}`}
                  title="Copiar Link wa.me"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  <span className="text-[10px] font-bold uppercase">Link</span>
                </button>
                <button
                  onClick={() => setShowQR(!showQR)}
                  className={`win95-btn px-3 flex items-center gap-2 ${showQR ? 'win95-sunken bg-white dark:bg-gray-800' : ''}`}
                  title="Gerar QR Code"
                >
                  <QrCode size={16} />
                  <span className="text-[10px] font-bold uppercase">QR</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {showQR ? (
                <div className="win95-sunken bg-white dark:bg-gray-900 p-4 flex flex-col items-center justify-center h-full min-h-[250px]">
                  <div className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 mb-4">Aponte a câmera para escanear</div>
                  {phone ? (
                    <div className="p-2 border-4 border-black bg-white">
                      <QRCodeCanvas
                        value={`https://wa.me/${phone.replace(/\D/g, '').length <= 11 ? '55' + phone.replace(/\D/g, '') : phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`}
                        size={180}
                        level="H"
                      />
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 text-xs italic">
                      Insira um número para gerar o QR Code
                    </div>
                  )}
                  <div className="mt-4 text-[9px] text-center text-gray-500">
                    O QR Code abrirá o WhatsApp diretamente com este contato e mensagem.
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-bold uppercase text-[#444] dark:text-gray-400">Modelos de Mensagem</label>
                    <button className="text-blue-700 hover:underline text-[9px] font-bold uppercase flex items-center gap-1">
                      <Plus size={10} /> Novo
                    </button>
                  </div>
                  <div className="win95-sunken bg-white dark:bg-gray-900 flex-1 overflow-y-auto p-2 space-y-2 max-h-[250px]">
                    {templates.map(t => (
                      <div
                        key={t.id}
                        onClick={() => applyTemplate(t.content)}
                        className="p-2 border border-gray-200 dark:border-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer group relative"
                      >
                        <div className="font-bold text-[10px] text-blue-800 dark:text-blue-400 mb-1 flex items-center gap-1">
                          <FileText size={10} /> {t.title}
                        </div>
                        <div className="text-[9px] text-gray-600 dark:text-gray-400 line-clamp-2 italic">
                          "{t.content}"
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-palette-lightest p-2 border-t border-palette-mediumDark flex gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold uppercase text-gray-500">Método:</span>
              <div className="flex gap-1">
                {['api', 'web', 'app'].map(m => (
                  <button
                    key={m}
                    onClick={() => setOpenMethod(m as any)}
                    className={`px-2 py-0.5 text-[9px] font-bold uppercase border ${openMethod === m ? 'win95-sunken bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-400' : 'win95-raised'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1"></div>
            <div className="flex items-center gap-1 text-[9px] text-gray-400 italic">
              <Zap size={10} /> Envio rápido habilitado
            </div>
          </div>
        </div>

        {/* Dicas e Atalhos */}
        <div className="win95-raised border border-white dark:border-gray-800 p-3 shadow-sm">
          <h4 className="text-[10px] font-bold uppercase text-win95-blue dark:text-blue-400 mb-2 flex items-center gap-1">
            <Zap size={12} /> Dicas de Produtividade
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-[9px] text-gray-600 dark:text-gray-400 flex gap-2">
              <div className="win95-sunken bg-white dark:bg-gray-800 p-1 h-fit"><Globe size={12} /></div>
              <div>
                <span className="font-bold block text-black dark:text-white">WhatsApp Web</span>
                Ideal para quando você já está logado no navegador.
              </div>
            </div>
            <div className="text-[9px] text-gray-600 dark:text-gray-400 flex gap-2">
              <div className="win95-sunken bg-white dark:bg-gray-800 p-1 h-fit"><Monitor size={12} /></div>
              <div>
                <span className="font-bold block text-black dark:text-white">WhatsApp Desktop</span>
                Abre diretamente o aplicativo instalado no seu Windows.
              </div>
            </div>
            <div className="text-[9px] text-gray-600 dark:text-gray-400 flex gap-2">
              <div className="win95-sunken bg-white dark:bg-gray-800 p-1 h-fit"><ExternalLink size={12} /></div>
              <div>
                <span className="font-bold block text-black dark:text-white">Link Direto</span>
                Gere links curtos para colocar em bios de redes sociais ou sites.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Direita: Abas de Histórico e Contatos */}
      <div className="w-80 flex flex-col win95-raised p-1 h-full shrink-0">
        <div className="flex bg-gray-200 dark:bg-gray-800 p-0.5 gap-1 mb-1">
          <button
            onClick={() => setActiveRightTab('history')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold uppercase border ${activeRightTab === 'history' ? 'win95-sunken bg-white dark:bg-gray-900 text-blue-800 dark:text-blue-400' : 'win95-raised hover:bg-gray-100'}`}
          >
            <History size={12} /> Histórico
          </button>
          <button
            onClick={() => setActiveRightTab('contacts')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold uppercase border ${activeRightTab === 'contacts' ? 'win95-sunken bg-white dark:bg-gray-900 text-blue-800 dark:text-blue-400' : 'win95-raised hover:bg-gray-100'}`}
          >
            <Users size={12} /> Contatos
          </button>
        </div>

        {activeRightTab === 'history' ? (
          <>
            <div className="flex items-center justify-between bg-[#000080] dark:bg-blue-900 text-white p-1 mb-1 px-2">
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase">
                <History size={12} /> Histórico Recente
              </div>
              <button onClick={clearHistory} className="text-white hover:bg-red-600 p-0.5 rounded" title="Limpar Histórico">
                <Trash2 size={12} />
              </button>
            </div>

            <div className="flex-1 win95-sunken bg-white dark:bg-gray-900 overflow-y-auto custom-scrollbar p-1 space-y-2">
              {history.length === 0 ? (
                <div className="text-center p-4 text-[#808080] text-[10px] italic">
                  Nenhuma mensagem enviada.
                </div>
              ) : (
                history.map(item => (
                  <div key={item.id} className="border border-dotted border-gray-300 dark:border-gray-700 p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 group relative bg-gray-50 dark:bg-gray-800">
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-bold text-xs text-blue-800 dark:text-blue-400 truncate max-w-[140px]">{item.name}</div>
                      <div className="text-[9px] text-gray-500 flex items-center gap-0.5">
                        <Clock size={8} /> {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="text-[10px] font-mono font-bold text-black dark:text-white mb-1">{item.phone}</div>
                    {item.message && (
                      <div className="text-[9px] text-gray-600 dark:text-gray-400 italic truncate border-t border-gray-200 dark:border-gray-700 pt-1">
                        "{item.message}"
                      </div>
                    )}

                    <button
                      onClick={() => loadFromHistory(item)}
                      className="absolute bottom-1 right-1 p-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-100 dark:hover:bg-blue-900/50"
                      title="Reutilizar dados"
                    >
                      <RotateCcw size={12} className="text-blue-600 dark:text-blue-400" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="bg-[#000080] dark:bg-blue-900 text-white p-1.5 flex items-center justify-between mb-1 px-2">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase">
                <Book size={12} /> Catálogo
              </div>
              <button
                onClick={syncContacts}
                disabled={isSyncing}
                className="text-white hover:bg-blue-700 p-0.5 rounded disabled:opacity-50"
                title="Sincronizar Google"
              >
                <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
              </button>
            </div>

            <div className="px-2 mb-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar contato..."
                  className="w-full pl-7 pr-2 py-1.5 win95-sunken bg-white dark:bg-gray-800 text-xs outline-none"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
                <SearchIcon size={12} className="absolute left-2 top-2 text-gray-400" />
              </div>
            </div>

            <div className="flex-1 win95-sunken bg-white dark:bg-gray-900 overflow-y-auto custom-scrollbar p-1 space-y-1">
              {filteredContacts.length === 0 ? (
                <div className="text-center p-8 text-[#808080] text-[10px] italic">
                  {contacts.length === 0 ? 'Sincronize sua conta Google para ver seus contatos.' : 'Nenhum contato encontrado.'}
                </div>
              ) : (
                filteredContacts.map(c => (
                  <div
                    key={c.id}
                    onClick={() => selectContact(c)}
                    className="flex items-center gap-3 p-2 border border-transparent hover:border-gray-300 dark:hover:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0 border border-gray-200 dark:border-gray-700">
                      {c.photoUrl ? (
                        <img src={c.photoUrl} alt={c.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <User size={14} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-gray-900 dark:text-white truncate">{c.name}</div>
                      <div className="text-[10px] text-gray-500 font-mono">{c.phone}</div>
                    </div>
                    {c.source === 'google' && (
                      <div className="text-[8px] font-black text-blue-600 opacity-40 group-hover:opacity-100">GOOGLE</div>
                    )}
                  </div>
                ))
              )}
            </div>

            {!googleAccessToken && (
              <div className="mt-1 p-2 bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-200 dark:border-yellow-800">
                <p className="text-[9px] text-yellow-800 dark:text-yellow-200 flex items-center gap-1">
                  <ExternalLink size={10} /> Vincule o Google para importar contatos.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
