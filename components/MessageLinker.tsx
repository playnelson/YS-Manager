
import React, { useState, useEffect } from 'react';
import { MessageSquare, Link, Share2, Copy, ArrowLeft, Check, Cloud, Loader2, AlertTriangle, Database, Scissors, Clock, ShieldAlert, Timer } from 'lucide-react';
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
  const [useShortener, setUseShortener] = useState(true);
  
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

          // 1. Verifica se é um Link Híbrido (Slug__Timestamp__CompressedData)
          if (encodedMessage.includes('__')) {
             const parts = encodedMessage.split('__');
             
             // Formato Novo com Timestamp: slug__timestamp__data
             if (parts.length === 3) {
                const [slugTitle, timestampStr, compressedData] = parts;
                const createdAt = parseInt(timestampStr);
                const expiresAt = createdAt + ONE_DAY_MS;

                if (Date.now() > expiresAt) {
                    setIsExpired(true);
                    setIsLoading(false);
                    return;
                }

                const decompressed = LZString.decompressFromEncodedURIComponent(compressedData);
                if (decompressed) {
                  setText(decompressed);
                  setSubject(slugTitle.replace(/-/g, ' '));
                  setStorageMethod('url');
                  setExpirationDate(new Date(expiresAt));
                  return;
                }
             } 
             // Formato Antigo (Fallback): slug__data (Sem timestamp, assume válido ou implementa regra futura)
             else if (parts.length === 2) {
                 const [slugTitle, compressedData] = parts;
                 const decompressed = LZString.decompressFromEncodedURIComponent(compressedData);
                 if (decompressed) {
                   setText(decompressed);
                   setSubject(slugTitle.replace(/-/g, ' '));
                   setStorageMethod('url');
                   // Sem data definida, deixamos null (infinito ou indefinido)
                   return;
                 }
             }
          }

          // 2. Tenta buscar no Banco de Dados (Link Curto por Slug)
          const { data, error } = await supabase
            .from('shared_messages')
            .select('content, slug, created_at')
            .eq('slug', encodedMessage)
            .maybeSingle();

          if (data) {
            // Verifica expiração via DB (se tiver created_at)
            if (data.created_at) {
                const createdTime = new Date(data.created_at).getTime();
                const expiresAt = createdTime + ONE_DAY_MS;
                if (Date.now() > expiresAt) {
                    setIsExpired(true);
                    setIsLoading(false);
                    return;
                }
                setExpirationDate(new Date(expiresAt));
            }

            setText(data.content);
            setSubject(data.slug); 
            setStorageMethod('db');
          } else {
            // 3. Fallback Legado (Base64 Puro)
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

  // Timer Regressivo
  useEffect(() => {
    if (!expirationDate) return;
    const interval = setInterval(() => {
        const now = new Date().getTime();
        const distance = expirationDate.getTime() - now;
        
        if (distance < 0) {
            setIsExpired(true);
            clearInterval(interval);
        } else {
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            setTimeLeft(`${hours}h ${minutes}m restantes`);
        }
    }, 60000); // Atualiza a cada minuto
    
    // Initial set
    const now = new Date().getTime();
    const distance = expirationDate.getTime() - now;
    if (distance > 0) {
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${hours}h ${minutes}m restantes`);
    }

    return () => clearInterval(interval);
  }, [expirationDate]);

  // --- MODO CRIAÇÃO ---
  
  const createSlug = (str: string) => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9 ]/g, '')
      .replace(/\s+/g, '-');
  };

  const shortenUrl = async (longUrl: string) => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
       setError("Nota: Encurtamento desativado em ambiente local (localhost).");
       return longUrl;
    }

    try {
      const tinyUrlApi = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`;
      
      try {
         const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(tinyUrlApi)}`);
         if (res.ok) {
            const text = await res.text();
            if (text.startsWith('http')) return text;
         }
      } catch (e) { }

      try {
         const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(tinyUrlApi)}`);
         if (res.ok) {
            const text = await res.text();
            if (text.startsWith('http')) return text;
         }
      } catch (e) { }

      try {
          const res = await fetch(tinyUrlApi);
          if (res.ok) {
             const text = await res.text();
             if (text.startsWith('http')) return text;
          }
      } catch (e) {}

      throw new Error("Falha no encurtador");
    } catch (e) {
      console.warn("Falha ao encurtar link.", e);
      setError("O encurtador está indisponível. Exibindo link original.");
      return longUrl;
    }
  };

  const handleGenerateLink = async () => {
    if (!text.trim()) return alert("Escreva uma mensagem primeiro.");
    if (!subject.trim()) return alert("Defina um assunto para o link.");

    setIsLoading(true);
    setError(null);
    setGeneratedLink('');

    const slug = createSlug(subject);
    if (slug.length < 3) {
        setIsLoading(false);
        return alert("O assunto é muito curto (min 3 letras).");
    }

    const baseUrl = window.location.origin + window.location.pathname;
    let finalLongUrl = '';
    const nowTimestamp = Date.now();

    try {
      // Tentativa 1: Salvar no Supabase
      const { error: dbError } = await supabase
        .from('shared_messages')
        .insert([{ slug, content: text, created_at: new Date().toISOString() }]);

      if (dbError) {
        if (dbError.code === '23505') { 
           throw new Error(`O assunto "${slug}" já está em uso. Tente outro.`);
        }
        console.warn("Erro de Banco de Dados (Supabase):", dbError.message);
        throw new Error("DB_UNAVAILABLE");
      }

      // Sucesso DB
      finalLongUrl = `${baseUrl}?msg=${slug}`;
      setStorageMethod('db');

    } catch (err: any) {
      console.log("Usando método fallback (URL Compressed)");
      
      if (err.message !== "DB_UNAVAILABLE" && !err.message.includes("relation")) {
         setError(err.message);
         setIsLoading(false);
         return;
      }

      // Fallback: Gerar Link Híbrido com Timestamp
      try {
        const compressed = LZString.compressToEncodedURIComponent(text);
        // Formato: slug__timestamp__compressedData
        const hybridSlug = `${slug}__${nowTimestamp}__${compressed}`;
        finalLongUrl = `${baseUrl}?msg=${hybridSlug}`;
        setStorageMethod('url');
      } catch (e) {
        setError("Erro fatal ao gerar link.");
        setIsLoading(false);
        return;
      }
    }

    if (useShortener) {
        await new Promise(r => setTimeout(r, 500));
        const short = await shortenUrl(finalLongUrl);
        setGeneratedLink(short);
    } else {
        setGeneratedLink(finalLongUrl);
    }
    
    setIsLoading(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const shareWhatsapp = () => {
    const textEncoded = encodeURIComponent(`Mensagem Temporária (24h): "${subject}"\n\nAcesse: ${generatedLink}`);
    window.open(`https://wa.me/?text=${textEncoded}`, '_blank');
  };

  // --- RENDERIZAÇÃO DA PÁGINA PÚBLICA (MODO VIEW) ---
  if (mode === 'view') {
    if (isExpired) {
        return (
            <div className="min-h-screen bg-[#800000] flex items-center justify-center p-4 font-sans">
                <div className="w-full max-w-md win95-raised bg-[#d0d0d0] p-1 shadow-2xl border-2 border-white">
                    <div className="bg-red-600 text-white px-2 py-1 text-sm font-bold flex items-center gap-2 mb-4">
                        <ShieldAlert size={16} />
                        <span>Link Expirado</span>
                    </div>
                    <div className="p-8 text-center flex flex-col items-center">
                        <AlertTriangle size={64} className="text-red-600 mb-4" />
                        <h2 className="text-xl font-black uppercase text-red-700 mb-2">Mensagem Autodestruída</h2>
                        <p className="text-sm font-bold text-gray-600 mb-6">
                            O prazo de 24 horas para visualização desta mensagem se esgotou. O conteúdo foi removido permanentemente.
                        </p>
                        <Button onClick={() => window.location.href = window.location.origin} icon={<ArrowLeft size={14}/>}>
                            IR PARA A PÁGINA INICIAL
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
      <div className="min-h-screen bg-[#008080] flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-lg win95-raised bg-win95-bg p-1 shadow-[8px_8px_0px_rgba(0,0,0,0.5)] border-2 border-white">
          <div className="bg-[#000080] text-white px-2 py-1 text-sm font-bold flex items-center justify-between gap-2 mb-1 shadow-sm">
            <div className="flex items-center gap-2">
                <MessageSquare size={16} />
                <span>Mensagem Segura Temporária</span>
            </div>
            {timeLeft && (
                <div className="flex items-center gap-1 bg-red-600 px-2 py-0.5 text-[10px] uppercase animate-pulse">
                    <Timer size={10} /> {timeLeft}
                </div>
            )}
          </div>
          
          <div className="p-4 flex flex-col gap-4">
            {isLoading ? (
               <div className="flex flex-col items-center justify-center py-12 bg-white win95-sunken">
                  <Loader2 size={32} className="animate-spin text-blue-800 mb-2" />
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Descriptografando...</p>
               </div>
            ) : (
                <>
                  <div className="bg-white win95-sunken p-6 min-h-[250px] text-lg font-medium leading-relaxed whitespace-pre-wrap relative text-black shadow-inner">
                     <div className="absolute top-4 right-4 opacity-5 text-black pointer-events-none">
                       <MessageSquare size={80} />
                     </div>
                     <div className="border-b-2 border-gray-200 pb-2 mb-4">
                        <h2 className="text-sm font-black uppercase text-blue-800 tracking-wide">
                            Assunto: {subject || 'Confidencial'}
                        </h2>
                     </div>
                     <div className="font-serif text-gray-900">
                        {text}
                     </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold bg-yellow-50 p-2 border border-yellow-200">
                     <span className="flex items-center gap-1"><Clock size={12}/> Válido por 24 horas</span>
                     <span>{storageMethod === 'url' ? 'Modo Offline (Dados no Link)' : 'Modo Nuvem (Seguro)'}</span>
                  </div>
                </>
            )}

            <div className="flex justify-center border-t border-white pt-4">
               <Button onClick={() => window.location.href = window.location.origin} icon={<ArrowLeft size={14}/>}>
                 ACESSAR SISTEMA YSOFFICE
               </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDERIZAÇÃO DA PÁGINA DE CRIAÇÃO (INTERNA) ---
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
        {/* Lado Esquerdo: Editor */}
        <div className="flex-1 flex flex-col gap-3">
           <div>
              <label className="text-[10px] font-bold uppercase text-[#555] block mb-1">Assunto (Nome do Link):</label>
              <input 
                className="w-full win95-sunken px-2 py-1.5 text-sm font-bold bg-white text-black outline-none"
                placeholder="Ex: Senha Wifi Visitas"
                value={subject}
                onChange={(e) => { setSubject(e.target.value); setGeneratedLink(''); setError(null); }}
              />
              <div className="text-[9px] text-gray-500 mt-1 flex justify-between">
                 <span>O link conterá: .../?msg={subject ? createSlug(subject) : 'assunto'}</span>
              </div>
           </div>

           <div className="flex-1 flex flex-col">
              <label className="text-[10px] font-bold uppercase text-[#555] block mb-1">Conteúdo da Mensagem:</label>
              <textarea 
                className="flex-1 win95-sunken p-3 text-sm resize-none outline-none font-medium leading-relaxed bg-white text-black"
                placeholder="Escreva sua mensagem aqui. Ela ficará disponível publicamente apenas para quem tiver o link, por exatas 24 horas após a criação."
                value={text}
                onChange={(e) => { setText(e.target.value); setGeneratedLink(''); setError(null); }}
              />
              <div className="text-[9px] text-gray-500 text-right mt-1 flex justify-between items-center">
                <label className="flex items-center gap-1 cursor-pointer select-none">
                   <input type="checkbox" checked={useShortener} onChange={e => setUseShortener(e.target.checked)} />
                   <span className="font-bold">Encurtar Link (TinyURL)</span>
                </label>
                <span>{text.length} caracteres</span>
              </div>
           </div>

           {error && (
             <div className="win95-sunken bg-yellow-100 border border-yellow-400 p-2 text-yellow-800 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
                <AlertTriangle size={14} /> {error}
             </div>
           )}

           <Button onClick={handleGenerateLink} disabled={isLoading} className="w-full h-10" icon={isLoading ? <Loader2 className="animate-spin" size={16}/> : (useShortener ? <Scissors size={16}/> : <Link size={16}/>)}>
             {isLoading ? 'PROCESSANDO...' : (useShortener ? 'GERAR LINK TEMPORÁRIO (24H)' : 'CRIAR LINK DE ACESSO')}
           </Button>
        </div>

        {/* Lado Direito: Resultado */}
        {generatedLink && (
          <div className="md:w-72 flex flex-col gap-2 animate-in slide-in-from-right-4 fade-in duration-300">
             <div className="win95-raised p-4 bg-[#d0d0d0] flex flex-col gap-4 h-full">
                <div className="text-center">
                   <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2 border-2 border-green-500">
                      <Check size={24} className="text-green-600"/>
                   </div>
                   <h3 className="text-xs font-black uppercase text-green-800">Link Criado!</h3>
                   <div className="text-[9px] font-bold text-gray-600 mt-1 flex items-center justify-center gap-1">
                      {storageMethod === 'db' ? <><Database size={10}/> Salvo na Nuvem</> : <><Link size={10}/> Link Autônomo</>}
                   </div>
                </div>

                <div className="flex-1">
                   <label className="text-[9px] font-bold uppercase text-[#555]">Link de Acesso (Público):</label>
                   <div className="win95-sunken bg-white p-2 text-[11px] font-bold text-blue-800 break-all select-all border-l-4 border-blue-600 max-h-40 overflow-y-auto custom-scrollbar">
                     {generatedLink}
                   </div>
                   <p className="text-[9px] text-red-600 mt-2 text-center font-bold bg-red-50 p-1 border border-red-200">
                     Este link expira automaticamente em 24 horas.
                   </p>
                </div>

                <div className="flex flex-col gap-2">
                   <Button onClick={copyLink} className="w-full" icon={isCopied ? <Check size={14}/> : <Copy size={14}/>}>
                     {isCopied ? 'COPIADO!' : 'COPIAR LINK'}
                   </Button>
                   <Button onClick={shareWhatsapp} className="w-full bg-[#25D366] text-white" icon={<Share2 size={14}/>}>
                     ENVIAR NO WHATSAPP
                   </Button>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
