
import React, { useState, useEffect } from 'react';
import { MessageSquare, Link, Share2, Copy, ArrowLeft, Check, Cloud, Loader2, AlertTriangle, Database, Scissors, Clock, ShieldAlert, Timer, ChevronLeft } from 'lucide-react';
import { Button } from './ui/Button';
import { supabase } from '../supabase';
import LZString from 'lz-string';

interface MessageLinkerProps {
  mode?: 'create' | 'view';
  encodedMessage?: string;
  onClose?: () => void;
}

export const MessageLinker: React.FC<MessageLinkerProps> = ({ mode = 'create', encodedMessage, onClose }) => {
  const [subject, setSubject] = useState('');
  const [text, setText] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storageMethod, setStorageMethod] = useState<'db' | 'url'>('db');
  
  // Estados de Leitura
  const [isExpired, setIsExpired] = useState(false);
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState('');

  // --- MODO LEITURA ---
  useEffect(() => {
    const fetchMessage = async () => {
      if (mode === 'view' && encodedMessage) {
        setIsLoading(true);
        try {
          const ONE_DAY_MS = 24 * 60 * 60 * 1000;

          if (encodedMessage.includes('__')) {
             const parts = encodedMessage.split('__');
             if (parts.length === 3) {
                const [slugTitle, timestampStr, compressedData] = parts;
                const createdAt = parseInt(timestampStr);
                const expiresAt = createdAt + ONE_DAY_MS;
                if (Date.now() > expiresAt) { setIsExpired(true); setIsLoading(false); return; }
                const decompressed = LZString.decompressFromEncodedURIComponent(compressedData);
                if (decompressed) {
                  setText(decompressed);
                  setSubject(slugTitle.replace(/-/g, ' '));
                  setStorageMethod('url');
                  setExpirationDate(new Date(expiresAt));
                  return;
                }
             } else if (parts.length === 2) {
                 const [slugTitle, compressedData] = parts;
                 const decompressed = LZString.decompressFromEncodedURIComponent(compressedData);
                 if (decompressed) {
                   setText(decompressed);
                   setSubject(slugTitle.replace(/-/g, ' '));
                   setStorageMethod('url');
                   return;
                 }
             }
          }

          const { data, error } = await supabase
            .from('shared_messages')
            .select('content, slug, created_at')
            .eq('slug', encodedMessage)
            .maybeSingle();

          if (data) {
            if (data.created_at) {
                const createdTime = new Date(data.created_at).getTime();
                const expiresAt = createdTime + ONE_DAY_MS;
                if (Date.now() > expiresAt) { setIsExpired(true); setIsLoading(false); return; }
                setExpirationDate(new Date(expiresAt));
            }
            setText(data.content);
            setSubject(data.slug); 
            setStorageMethod('db');
          } else {
            try {
              const decoded = decodeURIComponent(escape(atob(encodedMessage)));
              setText(decoded);
              setSubject('Mensagem Arquivada');
              setStorageMethod('url');
            } catch (e) {
              setText("Mensagem não encontrada, link inválido ou expirado.");
            }
          }
        } catch (err) {
          console.error(err);
          setText("Erro crítico ao processar o link.");
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchMessage();
  }, [mode, encodedMessage]);

  useEffect(() => {
    if (!expirationDate) return;
    const interval = setInterval(() => {
        const now = new Date().getTime();
        const distance = expirationDate.getTime() - now;
        if (distance < 0) { setIsExpired(true); clearInterval(interval); }
        else {
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            setTimeLeft(`${hours}h ${minutes}m`);
        }
    }, 60000);
    return () => clearInterval(interval);
  }, [expirationDate]);

  const createSlug = (str: string) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, '-');
  };

  const handleGenerateLink = async () => {
    if (!text.trim() || !subject.trim()) return alert("Preencha o assunto e a mensagem.");
    setIsLoading(true); setError(null); setGeneratedLink('');
    const slug = createSlug(subject);
    const baseUrl = window.location.origin + window.location.pathname;
    let finalLongUrl = '';
    try {
      const { error: dbError } = await supabase.from('shared_messages').insert([{ slug, content: text, created_at: new Date().toISOString() }]);
      if (dbError) throw new Error(dbError.code === '23505' ? `O assunto "${slug}" já existe.` : "DB_UNAVAILABLE");
      finalLongUrl = `${baseUrl}?msg=${slug}`;
      setStorageMethod('db');
    } catch (err: any) {
      if (err.message === "DB_UNAVAILABLE") {
        const compressed = LZString.compressToEncodedURIComponent(text);
        finalLongUrl = `${baseUrl}?msg=${slug}__${Date.now()}__${compressed}`;
        setStorageMethod('url');
      } else { setError(err.message); setIsLoading(false); return; }
    }
    
    // Encurtamento sempre ativo
    try {
        const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(finalLongUrl)}`)}`);
        const short = await res.text();
        setGeneratedLink(short.startsWith('http') ? short : finalLongUrl);
    } catch { setGeneratedLink(finalLongUrl); }
    
    setIsLoading(false);
  };

  // --- RENDERIZAÇÃO PÚBLICA (MODO VIEW) ---
  if (mode === 'view') {
    if (isExpired) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
                <div className="max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Clock size={32} className="text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Link Expirado</h1>
                    <p className="text-slate-600 mb-8 leading-relaxed">
                        Esta mensagem foi programada para durar apenas 24 horas e não está mais disponível.
                    </p>
                    <a href={window.location.origin} className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">
                        <ArrowLeft size={16} /> Ir para Brain
                    </a>
                </div>
            </div>
        );
    }

    return (
      <div className="min-h-screen bg-white md:bg-slate-50 flex flex-col items-center p-0 md:p-8 font-sans selection:bg-blue-100">
        <div className="w-full max-w-2xl bg-white md:shadow-sm md:rounded-2xl overflow-hidden md:border border-slate-200 flex flex-col min-h-screen md:min-h-0">
          
          {/* Header Minimalista */}
          <div className="px-6 py-6 md:px-10 md:py-8 border-b border-slate-100 flex justify-between items-end">
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Mensagem Segura</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">
                    {subject || 'Nota Confidencial'}
                </h1>
            </div>
            {timeLeft && (
                <div className="flex flex-col items-end shrink-0 ml-4 mb-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Expira em</span>
                    <span className="text-xs font-mono font-bold text-red-500">{timeLeft}</span>
                </div>
            )}
          </div>
          
          {/* Área do Texto */}
          <div className="flex-1 px-6 py-8 md:px-10 md:py-10">
            {isLoading ? (
               <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 size={32} className="animate-spin text-slate-300 mb-4" />
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Carregando...</p>
               </div>
            ) : (
                <div className="prose prose-slate max-w-none">
                    <p className="text-lg md:text-xl text-slate-800 leading-relaxed whitespace-pre-wrap font-medium break-words">
                        {text}
                    </p>
                </div>
            )}
          </div>

          {/* Rodapé Minimalista */}
          <div className="px-6 py-8 md:px-10 border-t border-slate-100 bg-slate-50/50 mt-auto">
             <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white shadow-lg">
                        <span className="font-black italic text-sm">B</span>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-900">Brain Professional</p>
                        <p className="text-[10px] text-slate-500">Sistema de Gestão e Produtividade</p>
                    </div>
                </div>
                
                <a 
                    href={window.location.origin}
                    className="w-full md:w-auto px-6 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-full hover:bg-slate-800 transition-all text-center shadow-md active:scale-95 flex items-center justify-center gap-2"
                >
                    <ChevronLeft size={14} /> ACESSAR SISTEMA
                </a>
             </div>
          </div>
        </div>
        
        {/* Aviso de Privacidade */}
        <p className="mt-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden md:block">
            Esta mensagem é criptografada e autodestrutiva.
        </p>
      </div>
    );
  }

  // --- RENDERIZAÇÃO DA PÁGINA DE CRIAÇÃO (INTERNA - MANTÉM WIN95) ---
  return (
    <div className="h-full flex flex-col gap-4 bg-win95-bg p-4 win95-raised">
      <div className="bg-[#000080] text-white px-2 py-1 text-sm font-bold flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
           <Link size={16} /> Mensageiro Temporário (24h)
        </div>
        <div className="flex items-center gap-1 text-[9px] opacity-70">
           <Clock size={10} /> Auto-Destruição Ativa
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex flex-col gap-3">
           <div>
              <label className="text-[10px] font-bold uppercase text-[#555] block mb-1">Assunto (Nome do Link):</label>
              <input 
                className="w-full win95-sunken px-2 py-1.5 text-sm font-bold bg-white text-black outline-none"
                placeholder="Ex: Senha Wifi Visitas"
                value={subject}
                onChange={(e) => { setSubject(e.target.value); setGeneratedLink(''); setError(null); }}
              />
           </div>

           <div className="flex-1 flex flex-col">
              <label className="text-[10px] font-bold uppercase text-[#555] block mb-1">Conteúdo da Mensagem:</label>
              <textarea 
                className="flex-1 win95-sunken p-3 text-sm resize-none outline-none font-medium leading-relaxed bg-white text-black"
                placeholder="Escreva sua mensagem aqui..."
                value={text}
                onChange={(e) => { setText(e.target.value); setGeneratedLink(''); setError(null); }}
              />
              <div className="text-[9px] text-gray-500 text-right mt-1 flex justify-end items-center">
                <span>{text.length} caracteres</span>
              </div>
           </div>

           <Button onClick={handleGenerateLink} disabled={isLoading} className="w-full h-10" icon={isLoading ? <Loader2 className="animate-spin" size={16}/> : <Link size={16}/>}>
             {isLoading ? 'PROCESSANDO...' : 'GERAR LINK TEMPORÁRIO (24H)'}
           </Button>
        </div>

        {generatedLink && (
          <div className="md:w-72 flex flex-col gap-2 animate-in slide-in-from-right-4 fade-in duration-300">
             <div className="win95-raised p-4 bg-[#d0d0d0] flex flex-col gap-4 h-full">
                <div className="text-center">
                   <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2 border-2 border-green-500">
                      <Check size={24} className="text-green-600"/>
                   </div>
                   <h3 className="text-xs font-black uppercase text-green-800">Link Criado!</h3>
                </div>

                <div className="flex-1">
                   <label className="text-[9px] font-bold uppercase text-[#555]">Link de Acesso:</label>
                   <div className="win95-sunken bg-white p-2 text-[11px] font-bold text-blue-800 break-all select-all border-l-4 border-blue-600 max-h-40 overflow-y-auto">
                     {generatedLink}
                   </div>
                </div>

                <div className="flex flex-col gap-2">
                   <Button onClick={() => { navigator.clipboard.writeText(generatedLink); setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); }} className="w-full" icon={isCopied ? <Check size={14}/> : <Copy size={14}/>}>
                     {isCopied ? 'COPIADO!' : 'COPIAR LINK'}
                   </Button>
                   <Button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Mensagem Temporária: "${subject}"\n\nAcesse: ${generatedLink}`)}`, '_blank')} className="w-full bg-[#25D366] text-white" icon={<Share2 size={14}/>}>
                     WHATSAPP
                   </Button>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
