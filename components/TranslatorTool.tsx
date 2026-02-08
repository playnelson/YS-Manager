
import React, { useState } from 'react';
import { Languages, ArrowRightLeft, Copy, Check, Sparkles, Loader2, Eraser } from 'lucide-react';
import { Button } from './ui/Button';
import { GoogleGenAI } from "@google/genai";

const LANGUAGES = [
  { code: 'pt', name: 'Português' },
  { code: 'en', name: 'Inglês' },
  { code: 'es', name: 'Espanhol' },
  { code: 'fr', name: 'Francês' },
  { code: 'de', name: 'Alemão' },
  { code: 'it', name: 'Italiano' },
  { code: 'ja', name: 'Japonês' },
  { code: 'zh', name: 'Chinês (Simplificado)' },
  { code: 'ru', name: 'Russo' },
];

export const TranslatorTool: React.FC = () => {
  const [sourceLang, setSourceLang] = useState('pt');
  const [targetLang, setTargetLang] = useState('en');
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    setIsTranslating(true);
    try {
      const apiKey = (import.meta as any).env?.VITE_GOOGLE_API_KEY || sessionStorage.getItem('gemini_key') || '';
      
      if (!apiKey) {
         const userKey = window.prompt("API Key do Google Gemini necessária. Insira:");
         if(userKey) sessionStorage.setItem('gemini_key', userKey);
         else { setIsTranslating(false); return; }
      }
      
      const keyToUse = apiKey || sessionStorage.getItem('gemini_key') || '';
      const ai = new GoogleGenAI({ apiKey: keyToUse });
      
      const sLang = LANGUAGES.find(l => l.code === sourceLang)?.name;
      const tLang = LANGUAGES.find(l => l.code === targetLang)?.name;

      const prompt = `Act as a professional translator. Translate the following text from ${sLang} to ${tLang}.
      Rules:
      1. Maintain the original tone and intent.
      2. If it's technical code, do not translate the code keywords.
      3. Return ONLY the translated text, no preamble or quotes.
      
      Text to translate:
      "${inputText}"`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      // FIX: Access .text property directly
      if (response.text) {
        setOutputText(response.text);
      }
    } catch (error) {
      console.error(error);
      alert("Erro na tradução. Verifique a chave API ou tente novamente.");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSwap = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setInputText(outputText);
    setOutputText(inputText);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col gap-4 bg-win95-bg p-4 win95-raised">
      <div className="bg-[#000080] text-white px-2 py-1 text-sm font-bold flex items-center gap-2 shadow-sm">
        <Languages size={16} /> Tradutor Neural Inteligente
      </div>

      <div className="flex items-center gap-2 bg-[#d4d0c8] p-2 win95-raised">
        <select 
          className="flex-1 win95-sunken px-2 py-1 text-sm font-bold bg-white outline-none"
          value={sourceLang}
          onChange={(e) => setSourceLang(e.target.value)}
        >
          {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
        </select>

        <button onClick={handleSwap} className="win95-btn p-1 hover:bg-white active:translate-y-[1px]" title="Inverter Idiomas">
          <ArrowRightLeft size={16} />
        </button>

        <select 
          className="flex-1 win95-sunken px-2 py-1 text-sm font-bold bg-white outline-none"
          value={targetLang}
          onChange={(e) => setTargetLang(e.target.value)}
        >
          {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
        </select>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        <div className="flex-1 flex flex-col">
           <div className="flex justify-between items-center mb-1 px-1">
              <label className="text-[10px] font-bold uppercase text-[#555]">Texto Original</label>
              {inputText && (
                <button onClick={() => setInputText('')} className="text-red-600 hover:bg-red-50 p-0.5 rounded text-[10px] flex items-center gap-1 font-bold">
                  <Eraser size={10} /> Limpar
                </button>
              )}
           </div>
           <textarea 
             className="flex-1 win95-sunken p-3 text-sm resize-none outline-none font-medium leading-relaxed bg-white text-black"
             placeholder="Digite ou cole o texto aqui..."
             value={inputText}
             onChange={(e) => setInputText(e.target.value)}
             onKeyDown={(e) => {
               if (e.key === 'Enter' && e.ctrlKey) handleTranslate();
             }}
           />
        </div>

        <div className="flex-1 flex flex-col">
           <div className="flex justify-between items-center mb-1 px-1">
              <label className="text-[10px] font-bold uppercase text-win95-blue">Tradução</label>
              {outputText && (
                <button onClick={copyToClipboard} className="text-blue-700 hover:bg-blue-50 p-0.5 rounded text-[10px] flex items-center gap-1 font-bold">
                  {copied ? <Check size={10} /> : <Copy size={10} />} {copied ? 'Copiado' : 'Copiar'}
                </button>
              )}
           </div>
           <div className="flex-1 win95-sunken bg-gray-50 p-3 text-sm font-medium leading-relaxed overflow-y-auto relative">
              {isTranslating ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 backdrop-blur-[1px]">
                   <Loader2 size={24} className="animate-spin text-win95-blue mb-2" />
                   <span className="text-xs font-bold text-win95-blue animate-pulse">Traduzindo...</span>
                </div>
              ) : outputText ? (
                <p className="whitespace-pre-wrap">{outputText}</p>
              ) : (
                <span className="text-gray-400 italic text-xs">A tradução aparecerá aqui.</span>
              )}
           </div>
        </div>
      </div>

      <div className="flex justify-end pt-2 border-t border-white">
         <Button 
           onClick={handleTranslate} 
           disabled={!inputText.trim() || isTranslating}
           className="w-40 h-10 bg-win95-blue text-white"
           icon={isTranslating ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16}/>}
         >
           {isTranslating ? 'PROCESSANDO' : 'TRADUZIR AGORA'}
         </Button>
      </div>
    </div>
  );
};
