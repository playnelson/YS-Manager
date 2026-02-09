
import React, { useState, useEffect, useRef } from 'react';
import { Trello, GitMerge, MessageSquare, RefreshCw, StickyNote, Contrast, Calendar as CalendarIcon, Phone, Clock as ClockIcon, Briefcase, Search, Globe, Menu, Eye, EyeOff, GripHorizontal, LayoutGrid } from 'lucide-react';
import { AppData, KanbanState, FlowState, EmailTemplate, User, ProfessionalLink, PostIt, CalendarConfig, Extension, UserEvent, ImportantNote, ShiftConfig, Signature, KanbanColumn, ShiftHandoff } from './types';
import { KanbanBoard } from './components/KanbanBoard';
import { FlowBuilder } from './components/FlowBuilder';
import { CalendarModule } from './components/CalendarModule';
import { OfficeModule } from './components/OfficeModule';
import { ConsultationModule } from './components/ConsultationModule';
import { WhatsAppTool } from './components/WhatsAppTool';
import { ExtensionsDirectory } from './components/ExtensionsDirectory';
import { NotesModule } from './components/NotesModule';
import { ProfessionalLinks } from './components/ProfessionalLinks';
import { Auth } from './components/Auth';
import { supabase } from './supabase';
import { Button } from './components/ui/Button';

// Initial Kanban com estrutura Trello-like
const initialKanban: KanbanState = { 
  columns: [
    { id: 'col_1', title: 'A Fazer', cards: [] },
    { id: 'col_2', title: 'Em Andamento', cards: [] },
    { id: 'col_3', title: 'Concluído', cards: [] }
  ]
};

const initialFlow: FlowState = { nodes: [], connections: [], templates: [] };

// Definição das Abas Disponíveis
const DEFAULT_TABS = [
  { id: 'notes_combined', label: 'Anotações', icon: <StickyNote size={16} /> },
  { id: 'calendar', label: 'Calendário', icon: <CalendarIcon size={16} /> },
  { id: 'office', label: 'Escritório', icon: <Briefcase size={16} /> },
  { id: 'directory', label: 'Diretório', icon: <Globe size={16} /> },
  { id: 'kanban', label: 'Tarefas', icon: <Trello size={16} /> },
  { id: 'flow', label: 'Fluxo', icon: <GitMerge size={16} /> },
  { id: 'consultas', label: 'Consultas', icon: <Search size={16} /> },
  { id: 'ramais', label: 'Ramais', icon: <Phone size={16} /> },
  { id: 'whatsapp', label: 'Whats', icon: <MessageSquare size={16} /> },
];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  
  // Estado das Abas (Ordem e Seleção)
  const [activeTab, setActiveTab] = useState('notes_combined');
  const [tabs, setTabs] = useState(DEFAULT_TABS);
  
  // Menu Cascata e Visibilidade
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hiddenTabs, setHiddenTabs] = useState<string[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Drag and Drop State
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('pt-BR'));
  
  // Data States
  const [kanbanData, setKanbanData] = useState<KanbanState>(initialKanban);
  const [flowData, setFlowData] = useState<FlowState>(initialFlow);
  const [calendarConfig, setCalendarConfig] = useState<CalendarConfig>({ uf: 'SP', city: 'São Paulo' });
  const [calendarEvents, setCalendarEvents] = useState<UserEvent[]>([]);
  const [emails, setEmails] = useState<EmailTemplate[]>([]);
  const [links, setLinks] = useState<ProfessionalLink[]>([]);
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [postIts, setPostIts] = useState<PostIt[]>([]);
  const [importantNotes, setImportantNotes] = useState<ImportantNote[]>([]);
  const [shiftHandoffs, setShiftHandoffs] = useState<ShiftHandoff[]>([]);
  const [shiftConfig, setShiftConfig] = useState<ShiftConfig | undefined>(undefined);
  const [signatures, setSignatures] = useState<Signature[]>([]);
  
  // System States
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  
  const [isInverted, setIsInverted] = useState(() => localStorage.getItem('ysoffice_inverted') === 'true');

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Carregar ordem das abas do localStorage
  useEffect(() => {
    const savedOrder = localStorage.getItem('ysoffice_tab_order');
    if (savedOrder) {
      try {
        const parsedOrder = JSON.parse(savedOrder) as string[];
        
        // Filtra abas que ainda existem no sistema novo
        const reorderedTabs = parsedOrder
          .map(id => DEFAULT_TABS.find(t => t.id === id))
          .filter(Boolean) as typeof DEFAULT_TABS;
        
        // Adiciona abas novas que podem não estar no storage antigo
        const missingTabs = DEFAULT_TABS.filter(t => !parsedOrder.includes(t.id));
        setTabs([...reorderedTabs, ...missingTabs]);
      } catch (e) {
        setTabs(DEFAULT_TABS);
      }
    }
  }, []);

  // Salvar ordem das abas
  const handleSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    
    const _tabs = [...tabs];
    const draggedItemContent = _tabs[dragItem.current];
    
    _tabs.splice(dragItem.current, 1);
    _tabs.splice(dragOverItem.current, 0, draggedItemContent);
    
    dragItem.current = null;
    dragOverItem.current = null;
    
    setTabs(_tabs);
    localStorage.setItem('ysoffice_tab_order', JSON.stringify(_tabs.map(t => t.id)));
  };

  const getFullDate = () => {
    const date = new Date();
    const formatted = date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('pt-BR'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    (supabase.auth as any).getSession().then(({ data: { session } }: any) => {
      if (session?.user) {
        setUser({ id: session.user.id, nick: session.user.user_metadata.username || session.user.email?.split('@')[0] || 'Usuário' });
      } else {
        const demoSession = localStorage.getItem('ysoffice_demo_session');
        if (demoSession) setUser(JSON.parse(demoSession));
      }
    });
    const { data: { subscription } } = (supabase.auth as any).onAuthStateChange((_event: any, session: any) => {
      if (session?.user) setUser({ id: session.user.id, nick: session.user.user_metadata.username || 'Usuário' });
    }) as any;
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isInverted) document.body.classList.add('invert-colors');
    else document.body.classList.remove('invert-colors');
    localStorage.setItem('ysoffice_inverted', String(isInverted));
  }, [isInverted]);

  useEffect(() => {
    if (!user) {
      setIsDataLoaded(false);
      return;
    }

    const fetchData = async () => {
      setIsSyncing(true);
      setSyncError(null);
      try {
        if (user.id === 'demo_user_id') {
          const saved = localStorage.getItem('ysoffice_demo_data');
          if (saved) {
            const parsed: any = JSON.parse(saved);
            
            // Migração de Dados Kanban (Old -> New)
            let safeKanban = initialKanban;
            if (parsed.kanban) {
               if (Array.isArray(parsed.kanban.columns)) {
                  safeKanban = parsed.kanban;
               } else if (parsed.kanban.todo) {
                  // Migrar estrutura antiga
                  safeKanban = {
                    columns: [
                      { id: 'todo', title: 'Pendentes', cards: parsed.kanban.todo || [] },
                      { id: 'doing', title: 'Em Execução', cards: parsed.kanban.doing || [] },
                      { id: 'done', title: 'Concluído', cards: parsed.kanban.done || [] }
                    ]
                  };
               }
            }
            
            setKanbanData(safeKanban);
            if (parsed.flow) setFlowData({ ...initialFlow, ...parsed.flow });
            if (parsed.calendarConfig) setCalendarConfig(parsed.calendarConfig);
            if (parsed.calendarEvents) setCalendarEvents(parsed.calendarEvents);
            if (parsed.emails) setEmails(parsed.emails);
            if (parsed.links) setLinks(parsed.links);
            if (parsed.extensions) setExtensions(parsed.extensions);
            if (parsed.postIts) setPostIts(parsed.postIts);
            if (parsed.importantNotes) setImportantNotes(parsed.importantNotes);
            if (parsed.shiftHandoffs) setShiftHandoffs(parsed.shiftHandoffs);
            if (parsed.shiftConfig) setShiftConfig(parsed.shiftConfig);
            if (parsed.signatures) setSignatures(parsed.signatures);
            if (parsed.hiddenTabs) setHiddenTabs(parsed.hiddenTabs);
          }
        } else {
          const { data, error } = await supabase.from('user_data').select('payload').eq('user_id', user.id).maybeSingle();
          if (!error && data?.payload) {
            const payload = data.payload as any;

            // Migração de Dados Kanban (Old -> New) no Supabase
            let safeKanban = initialKanban;
            if (payload.kanban) {
               if (Array.isArray(payload.kanban.columns)) {
                  safeKanban = payload.kanban;
               } else if (payload.kanban.todo) {
                  safeKanban = {
                    columns: [
                      { id: 'todo', title: 'Pendentes', cards: payload.kanban.todo || [] },
                      { id: 'doing', title: 'Em Execução', cards: payload.kanban.doing || [] },
                      { id: 'done', title: 'Concluído', cards: payload.kanban.done || [] }
                    ]
                  };
               }
            }

            setKanbanData(safeKanban);
            setFlowData({ ...initialFlow, ...(payload.flow || {}) });
            setCalendarConfig(payload.calendarConfig || { uf: 'SP', city: 'São Paulo' });
            setCalendarEvents(payload.calendarEvents || []);
            setEmails(payload.emails || []);
            setLinks(payload.links || []);
            setExtensions(payload.extensions || []);
            setPostIts(payload.postIts || []);
            setImportantNotes(payload.importantNotes || []);
            setShiftHandoffs(payload.shiftHandoffs || []);
            setShiftConfig(payload.shiftConfig);
            setSignatures(payload.signatures || []);
            setHiddenTabs(payload.hiddenTabs || []);
          }
        }
      } catch (err) {
        setSyncError('Falha de conexão.');
      } finally {
        setIsSyncing(false);
        setIsDataLoaded(true);
      }
    };
    fetchData();
  }, [user]);

  useEffect(() => {
    if (!user || !isDataLoaded) return;
    const saveData = async () => {
      const payload: AppData = { kanban: kanbanData, flow: flowData, calendarConfig, calendarEvents, emails, links, extensions, postIts, importantNotes, shiftHandoffs, shiftConfig, signatures, hiddenTabs };
      if (user.id === 'demo_user_id') {
        localStorage.setItem('ysoffice_demo_data', JSON.stringify(payload));
      } else {
        setIsSyncing(true);
        try {
          await supabase.from('user_data').upsert({ user_id: user.id, payload, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
        } catch (err) {
           setSyncError('Erro ao salvar.');
        } finally {
          setIsSyncing(false);
        }
      }
    };
    const timeout = setTimeout(saveData, 2000);
    return () => clearTimeout(timeout);
  }, [kanbanData, flowData, calendarConfig, calendarEvents, emails, links, extensions, postIts, importantNotes, shiftHandoffs, shiftConfig, signatures, hiddenTabs, user, isDataLoaded]);

  const handleLogout = async () => {
    if (user?.id !== 'demo_user_id') await (supabase.auth as any).signOut();
    localStorage.removeItem('ysoffice_demo_session');
    setUser(null);
    setIsDataLoaded(false);
  };

  const toggleTabVisibility = (tabId: string) => {
    setHiddenTabs(prev => {
      if (prev.includes(tabId)) return prev.filter(id => id !== tabId);
      return [...prev, tabId];
    });
  };

  if (!user) return <Auth onLogin={setUser} />;

  // Filter only visible tabs for the top bar
  const visibleTabs = tabs.filter(t => !hiddenTabs.includes(t.id));

  return (
    <div className="flex flex-col h-screen bg-win95-bg p-4 font-sans text-gray-800">
      <div className="flex justify-between items-center px-2 mb-4">
        <div className="flex items-center gap-4">
           <button onClick={() => setActiveTab('calendar')} className="flex items-center gap-2 group">
             <div className="win95-sunken px-3 py-1.5 bg-white flex items-center gap-2 group-hover:border-blue-300 transition-colors">
               <CalendarIcon size={16} className="text-win95-blue" />
               <span className="font-semibold text-sm text-gray-700">{getFullDate()}</span>
             </div>
           </button>
           {isSyncing && <RefreshCw size={14} className="animate-spin text-win95-blue" />}
        </div>
        <div className="flex items-center gap-4 text-xs font-medium bg-white/50 px-3 py-1.5 rounded-full shadow-sm border border-white/50">
           <span className="text-gray-600">Usuário: <b className="text-gray-900">{user.nick}</b></span>
           <div className="h-4 w-px bg-gray-300"></div>
           <button onClick={() => setIsInverted(!isInverted)} className="hover:text-blue-600 transition-colors" title="Modo Escuro"><Contrast size={16} /></button>
           <button onClick={handleLogout} className="hover:text-red-600 transition-colors font-bold">Sair</button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden win95-raised bg-gray-100 shadow-2xl">
        {/* Modern Tabs Bar with Start Menu */}
        <div className="flex px-2 pt-2 bg-[#d1d5db] border-b border-gray-300 gap-1 items-end relative">
          
          {/* Botão Menu Iniciar / Navegação */}
          <div ref={menuRef} className="relative z-50">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-black uppercase rounded-t-lg transition-all duration-200 border-t-2 border-l-2 border-r-2 ${isMenuOpen ? 'bg-win95-blue text-white border-white shadow-xl' : 'bg-gray-300 text-black border-white hover:bg-gray-200'}`}
            >
              <LayoutGrid size={14} /> Iniciar
            </button>

            {isMenuOpen && (
              <div className="absolute top-full left-0 w-64 win95-raised bg-win95-bg p-1 shadow-[4px_4px_10px_rgba(0,0,0,0.3)] animate-in slide-in-from-top-2 fade-in duration-100 border-2 border-win95-light">
                 <div className="bg-[#000080] text-white px-2 py-4 mb-1 flex items-center gap-2">
                    <span className="text-lg font-black italic transform -rotate-2 origin-left">YSoffice</span>
                    <span className="text-[10px] uppercase tracking-widest opacity-80 mt-1">Professional</span>
                 </div>
                 
                 <div className="flex flex-col gap-0.5 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {tabs.map(tab => {
                      const isHidden = hiddenTabs.includes(tab.id);
                      const isActive = activeTab === tab.id;
                      
                      return (
                        <div key={tab.id} className="group flex items-center p-1 hover:bg-[#000080] hover:text-white transition-colors">
                           <button 
                             onClick={() => { setActiveTab(tab.id); setIsMenuOpen(false); }}
                             className="flex-1 flex items-center gap-3 px-2 text-xs font-bold text-left"
                           >
                             <div className="w-6 h-6 flex items-center justify-center bg-white/20 rounded shadow-sm group-hover:bg-white/10">
                               {tab.icon}
                             </div>
                             <span className={isActive ? 'underline decoration-2 underline-offset-2' : ''}>
                               {tab.label}
                             </span>
                           </button>
                           
                           <button 
                             onClick={(e) => { e.stopPropagation(); toggleTabVisibility(tab.id); }}
                             className="p-1.5 hover:bg-white/20 rounded text-gray-500 group-hover:text-white"
                             title={isHidden ? "Mostrar na Barra" : "Esconder da Barra"}
                           >
                             {isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                           </button>
                        </div>
                      );
                    })}
                 </div>
                 
                 <div className="border-t border-white border-b border-[#808080] my-1 h-0.5"></div>
                 
                 <button onClick={handleLogout} className="w-full text-left flex items-center gap-3 px-3 py-2 hover:bg-[#000080] hover:text-white text-xs font-bold transition-colors">
                    <div className="w-6 h-6 bg-red-600 flex items-center justify-center text-white rounded"><div className="w-2 h-2 border-2 border-white rounded-full"></div></div>
                    Encerrar Sessão
                 </button>
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-gray-400 mx-1 mb-1"></div>

          {/* Visible Tabs List */}
          <div className="flex-1 flex overflow-x-auto no-scrollbar gap-1 items-end">
            {visibleTabs.map((tab, index) => (
              <div
                key={tab.id}
                draggable
                onDragStart={() => (dragItem.current = index)}
                onDragEnter={() => (dragOverItem.current = index)}
                onDragEnd={handleSort}
                onDragOver={(e) => e.preventDefault()}
                className="relative"
              >
                <button 
                  onClick={() => setActiveTab(tab.id)} 
                  className={`
                    relative flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-lg transition-all duration-200 whitespace-nowrap
                    ${activeTab === tab.id 
                      ? 'bg-white text-blue-700 shadow-[0_-2px_5px_rgba(0,0,0,0.05)] z-10 -mb-[1px] border-t-2 border-blue-500 pb-2.5' 
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-800 border-t-2 border-transparent pb-2 opacity-80 hover:opacity-100'}
                  `}
                >
                  {tab.icon} {tab.label}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative bg-white">
            <div className="absolute inset-0 overflow-auto p-4 bg-gray-50">
              {/* Módulo Unificado de Notas */}
              {activeTab === 'notes_combined' && (
                <NotesModule 
                  postIts={postIts} 
                  onPostItChange={setPostIts}
                  importantNotes={importantNotes}
                  onNoteChange={setImportantNotes}
                  handoffs={shiftHandoffs}
                  onHandoffChange={setShiftHandoffs}
                  currentUser={user}
                />
              )}
              
              {activeTab === 'calendar' && (
                <CalendarModule 
                    calendarConfig={calendarConfig}
                    onCalendarConfigChange={setCalendarConfig}
                    events={calendarEvents}
                    onEventsChange={setCalendarEvents}
                    shiftConfig={shiftConfig}
                    onShiftConfigChange={setShiftConfig}
                />
              )}
              
              {/* Módulo Unificado de Escritório */}
              {activeTab === 'office' && (
                <OfficeModule 
                  emails={emails}
                  onEmailChange={setEmails}
                  signatures={signatures}
                  onSignatureChange={setSignatures}
                  onAddEvent={(ev) => setCalendarEvents(prev => [...prev, ev])}
                />
              )}

              {/* Módulo de Diretório Web (Grid de Ícones) */}
              {activeTab === 'directory' && (
                <ProfessionalLinks 
                    links={links}
                    onChange={setLinks}
                />
              )}
              
              {/* Módulo Unificado de Consultas */}
              {activeTab === 'consultas' && <ConsultationModule />}
              
              {activeTab === 'kanban' && <KanbanBoard data={kanbanData} onChange={setKanbanData} />}
              {activeTab === 'flow' && <FlowBuilder data={flowData} onChange={setFlowData} />}
              {activeTab === 'whatsapp' && <WhatsAppTool />}
              {activeTab === 'ramais' && <ExtensionsDirectory extensions={extensions} onChange={setExtensions} />}
            </div>
        </div>
        
        {/* Footer Status Bar */}
        <div className="bg-[#e0e5ec] border-t border-gray-300 px-3 py-1 flex justify-between items-center text-[10px] text-gray-500 font-medium select-none">
           <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> YSoffice v2.1 - Enhanced Navigation</span>
           <span className="flex items-center gap-1 font-mono">
             <ClockIcon size={10} /> {currentTime}
           </span>
           <span>{isDataLoaded ? 'Conectado' : 'Sincronizando...'}</span>
        </div>
      </div>
    </div>
  );
};

export default App;
