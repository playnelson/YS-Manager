'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  IconMessageDots, 
  IconSend, 
  IconRobot, 
  IconUser, 
  IconBolt, 
  IconSparkles, 
  IconTerminal,
  IconBrain,
  IconCommand,
  IconX,
  IconLoader2
} from '@tabler/icons-react';
import { GoogleGenAI, Type } from "@google/genai";
import { Button } from '@/components/ui/Button';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface AISecretaryProps {
  onAddNote: (content: string) => void;
  onAddEvent: (title: string, date: string, time: string) => void;
  onSearchInventory: (query: string) => any[];
  onNavigate: (tabId: string) => void;
  onSendWhatsApp: (phone: string, message: string) => void;
  onClose: () => void;
  onCreatePostIt: (text: string, color: string) => void;
}

export const AISecretary: React.FC<AISecretaryProps> = ({ 
  onAddNote, 
  onAddEvent, 
  onSearchInventory, 
  onNavigate,
  onSendWhatsApp,
  onClose,
  onCreatePostIt
}) => {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('ysoffice_ai_messages');
    return saved ? JSON.parse(saved) : [
      { 
        role: 'assistant', 
        content: 'Olá! Sou sua Secretária IA. Posso te ajudar a organizar notas, marcar compromissos no calendário, consultar o estoque ou preparar mensagens de WhatsApp. Como posso ser útil hoje?',
        timestamp: new Date().toISOString()
      }
    ];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('ysoffice_ai_messages', JSON.stringify(messages));
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      
      const tools = [
        {
          functionDeclarations: [
            {
              name: "add_note",
              description: "Adiciona uma nota importante ou lembrete ao sistema.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  content: { type: Type.STRING, description: "O conteúdo da nota ou lembrete." }
                },
                required: ["content"]
              }
            },
            {
              name: "add_calendar_event",
              description: "Agenda um novo compromisso ou evento no calendário.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Título do evento." },
                  date: { type: Type.STRING, description: "Data do evento (YYYY-MM-DD)." },
                  time: { type: Type.STRING, description: "Horário do evento (HH:MM)." }
                },
                required: ["title", "date", "time"]
              }
            },
            {
              name: "search_inventory",
              description: "Consulta itens no estoque do almoxarifado.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  query: { type: Type.STRING, description: "Nome ou categoria do item para buscar." }
                },
                required: ["query"]
              }
            },
            {
              name: "navigate_to_tab",
              description: "Muda a aba ativa do sistema para o usuário.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  tabId: { 
                    type: Type.STRING, 
                    description: "ID da aba (office, calendar, flow, logistics, warehouse, consultas, whatsapp)." 
                  }
                },
                required: ["tabId"]
              }
            },
            {
              name: "prepare_whatsapp",
              description: "Prepara uma mensagem de WhatsApp para um número específico.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  phone: { type: Type.STRING, description: "Número de telefone com DDD." },
                  message: { type: Type.STRING, description: "Mensagem a ser enviada." }
                },
                required: ["phone", "message"]
              }
            },
            {
              name: "create_post_it",
              description: "Cria um post-it (lembrete visual) na tela inicial.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING, description: "Texto do post-it." },
                  color: { type: Type.STRING, description: "Cor (yellow, blue, green, pink)." }
                },
                required: ["text"]
              }
            }
          ]
        }
      ];

      const now = new Date();
      const contextPrompt = `CONTEXTO ATUAL:
Data de Hoje: ${now.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
Hora Atual: ${now.toLocaleTimeString('pt-BR')}
Sistema: Brain v2.5 (Gestão de Escritório, Logística e Almoxarifado)

INSTRUÇÕES:
Você é a Secretária IA 'Brainy'. Você tem controle total sobre as funções do site através de ferramentas.
Se o usuário pedir algo relativo (ex: 'amanhã', 'dia 25'), use a data de hoje para calcular.
Sempre confirme as ações realizadas de forma amigável.
Se não puder fazer algo, explique o porquê e sugira uma alternativa dentro das abas disponíveis.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: messages.concat(userMsg).map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        })),
        config: {
          systemInstruction: contextPrompt,
          tools: tools as any
        }
      });

      const functionCalls = response.functionCalls;
      let finalResponseText = response.text || "Entendido. O que mais posso fazer?";

      if (functionCalls) {
        for (const call of functionCalls) {
          if (call.name === 'add_note') {
            onAddNote(call.args.content as string);
            finalResponseText = `Nota adicionada com sucesso: "${call.args.content}"`;
          } else if (call.name === 'add_calendar_event') {
            onAddEvent(call.args.title as string, call.args.date as string, call.args.time as string);
            finalResponseText = `Evento "${call.args.title}" agendado para ${call.args.date} às ${call.args.time}.`;
          } else if (call.name === 'search_inventory') {
            const results = onSearchInventory(call.args.query as string);
            if (results.length > 0) {
              finalResponseText = `Encontrei os seguintes itens no estoque: \n` + 
                results.map(r => `- ${r.name}: ${r.quantity} ${r.unit} (Local: ${r.location})`).join('\n');
            } else {
              finalResponseText = `Não encontrei nenhum item correspondente a "${call.args.query}" no estoque.`;
            }
          } else if (call.name === 'navigate_to_tab') {
            onNavigate(call.args.tabId as string);
            finalResponseText = `Navegando para a aba ${call.args.tabId}...`;
          } else if (call.name === 'prepare_whatsapp') {
            onSendWhatsApp(call.args.phone as string, call.args.message as string);
            finalResponseText = `Preparei a mensagem de WhatsApp para ${call.args.phone}. Navegando para a aba de WhatsApp...`;
          } else if (call.name === 'create_post_it') {
            onCreatePostIt(call.args.text as string, (call.args.color as string) || 'yellow');
            finalResponseText = `Post-it criado com sucesso: "${call.args.text}"`;
          }
        }
      }

      const assistantMsg: Message = {
        role: 'assistant',
        content: finalResponseText,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, assistantMsg]);

    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Desculpe, tive um problema técnico ao processar sua solicitação. Pode tentar novamente?',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    if (confirm('Deseja limpar o histórico da conversa?')) {
      setMessages([
        { 
          role: 'assistant', 
          content: 'Histórico limpo. Como posso te ajudar agora?',
          timestamp: new Date().toISOString()
        }
      ]);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#c0c0c0] p-1 overflow-hidden">
      <div className="win95-raised bg-win95-bg border border-white p-1 flex-1 flex flex-col shadow-xl overflow-hidden">
        {/* Title Bar */}
        <div className="bg-[#000080] text-white p-1.5 flex items-center justify-between text-xs font-bold uppercase mb-1 select-none">
          <div className="flex items-center gap-2">
            <IconBrain size={14} className="text-yellow-400" />
            <span>Secretária IA - Assistente Virtual</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={clearChat} className="win95-btn p-0.5 px-2 text-[9px]">Limpar</button>
            <button onClick={onClose} className="win95-btn p-0.5 px-2 text-[9px] bg-red-600 text-white">X</button>
          </div>
        </div>

        {/* Chat Area */}
        <div 
          ref={scrollRef}
          className="flex-1 win95-sunken bg-white overflow-y-auto p-4 space-y-4 custom-scrollbar"
        >
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 shrink-0 flex items-center justify-center rounded shadow-sm ${msg.role === 'user' ? 'bg-blue-100 text-blue-700' : 'bg-win95-blue text-white'}`}>
                  {msg.role === 'user' ? <IconUser size={16} /> : <IconRobot size={16} />}
                </div>
                <div className={`p-3 text-sm shadow-sm border ${msg.role === 'user' ? 'bg-blue-50 border-blue-200 rounded-l-lg rounded-br-lg' : 'bg-gray-50 border-gray-200 rounded-r-lg rounded-bl-lg'}`}>
                  <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                  <div className="text-[9px] text-gray-400 mt-2 text-right">
                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] flex gap-3 items-center">
                <div className="w-8 h-8 shrink-0 flex items-center justify-center rounded shadow-sm bg-win95-blue text-white">
                  <IconRobot size={16} />
                </div>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-r-lg rounded-bl-lg flex items-center gap-2">
                  <IconLoader2 size={16} className="animate-spin text-blue-600" />
                  <span className="text-xs italic text-gray-500">Processando solicitação...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-3 bg-win95-bg border-t border-white flex gap-2 items-end">
          <div className="flex-1 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-[9px] font-bold uppercase text-gray-500 ml-1">
              <IconCommand size={10} /> Digite seu comando ou dúvida
            </div>
            <textarea 
              className="w-full win95-sunken bg-white p-2 text-sm outline-none resize-none focus:bg-yellow-50"
              rows={2}
              placeholder="Ex: 'Marque uma reunião amanhã às 14h' ou 'Verifique se tem papel A4 no estoque'..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
          </div>
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className={`win95-btn h-12 px-4 flex items-center gap-2 font-bold text-xs ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <IconSend size={16} />
            <span>ENVIAR</span>
          </button>
        </div>

        {/* Status Bar */}
        <div className="bg-gray-200 p-1 px-2 border-t border-gray-400 flex justify-between items-center text-[9px] text-gray-500">
          <div className="flex items-center gap-2">
            <IconBolt size={10} className="text-yellow-600" />
            <span>Gemini 1.5 Flash Ativo</span>
          </div>
          <div className="flex items-center gap-2">
            <IconSparkles size={10} className="text-blue-600" />
            <span>IA Generativa Integrada</span>
          </div>
        </div>
      </div>
    </div>
  );
};
