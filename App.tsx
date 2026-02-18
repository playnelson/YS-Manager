
import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { GitMerge, MessageSquare, RefreshCw, Contrast, Calendar as CalendarIcon, Briefcase, Search } from 'lucide-react';
import { AppData, FlowState, EmailTemplate, User, ProfessionalLink, PostIt, CalendarConfig, Extension, UserEvent, ImportantNote, ShiftConfig, Signature, ShiftHandoff, StoredFile } from './types';
import { Auth } from './components/Auth';
import { MessageLinker } from './components/MessageLinker';
import { DigitalClock } from './components/DigitalClock';
import { LoadingPlaceholder } from './components/LoadingPlaceholder';
import { supabase } from './supabase';

// Lazy Loading de Módulos Pesados para rapidez inicial
const OfficeModule = lazy(() => import('./components/OfficeModule').then(m => ({ default: m.OfficeModule })));
const CalendarModule = lazy(() => import('./components/CalendarModule').then(m => ({ default: m.CalendarModule })));
const FlowBuilder = lazy(() => import('./components/FlowBuilder').then(m => ({ default: m.FlowBuilder })));
const ConsultationModule = lazy(() => import('./components/ConsultationModule').then(m => ({ default: m.ConsultationModule })));
const WhatsAppTool = lazy(() => import('./components/WhatsAppTool').then(m => ({ default: m.WhatsAppTool })));

const initialFlow: FlowState = { nodes: [], connections: [], templates: [] };

const DEFAULT_TABS = [
  { id: 'office', label: 'Escritório', icon: <Briefcase size={16} /> },
  { id: 'calendar', label: 'Calendário', icon: <CalendarIcon size={16} /> },
  { id: 'flow', label: 'Fluxo', icon: <GitMerge size={16} /> },
  { id: 'consultas', label: 'Consultas', icon: <Search size={16} /> },
  { id: 'whatsapp', label: 'WhatsApp', icon: <MessageSquare size={16} /> },
];

const App: React.FC = () => {
  const [viewMessage, setViewMessage] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const msg = params.get('msg');
    if (msg) setViewMessage(msg);
  }, []);

  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('office');
  const [tabs, setTabs] = useState(DEFAULT_TABS);
  const [hiddenTabs, setHiddenTabs] = useState<string[]>([]);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  
  // Estados de Dados
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
  const [personalFiles, setPersonalFiles] = useState<StoredFile[]>([]);
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isInverted, setIsInverted] = useState(() => localStorage.getItem('ysoffice_inverted') === 'true');

  useEffect(() => {
    const savedOrder = localStorage.getItem('ysoffice_tab_order');
    if (savedOrder) {
      try {
        const parsedOrder = JSON.parse(savedOrder) as string[];
        const reorderedTabs = parsedOrder
          .map(id => DEFAULT_TABS.find(t => t.id === id))
          .filter(Boolean) as typeof DEFAULT_TABS;
        const missingTabs = DEFAULT_TABS.filter(t => !parsedOrder.includes(t.id));
        setTabs([...reorderedTabs, ...missingTabs]);
      } catch (e) { setTabs(DEFAULT_TABS); }
    }
  }, []);

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
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      if (session?.user) {
        setUser({ id: session.user.id, nick: session.user.user_metadata.username || session.user.email?.split('@')[0] || 'Usuário' });
      } else {
        const demoSession = localStorage.getItem('ysoffice_demo_session');
        if (demoSession) setUser(JSON.parse(demoSession));
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
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
    if (!user) { setIsDataLoaded(false); return; }
    const fetchData = async () => {
      setIsSyncing(true);
      try {
        if (user.id === 'demo_user_id') {
          const saved = localStorage.getItem('ysoffice_demo_data');
          if (saved) {
            const parsed: any = JSON.parse(saved);
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
            if (parsed.personalFiles) setPersonalFiles(parsed.personalFiles);
            if (parsed.hiddenTabs) setHiddenTabs(parsed.hiddenTabs);
          }
        } else {
          const { data, error } = await supabase.from('user_data').select('payload').eq('user_id', user.id).maybeSingle();
          if (!error && data?.payload) {
            const payload = data.payload as any;
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
            setPersonalFiles(payload.personalFiles || []);
            setHiddenTabs(payload.hiddenTabs || []);
          }
        }
      } catch (err) { console.error(err); } 
      finally { setIsSyncing(false); setIsDataLoaded(true); }
    };
    fetchData();
  }, [user]);

  useEffect(() => {
    if (!user || !isDataLoaded) return;
    const saveData = async () => {
      const payload: AppData = { kanban: { columns: [] }, flow: flowData, calendarConfig, calendarEvents, emails, links, extensions, postIts, importantNotes, shiftHandoffs, shiftConfig, signatures, personalFiles, hiddenTabs };
      if (user.id === 'demo_user_id') {
        localStorage.setItem('ysoffice_demo_data', JSON.stringify(payload));
      } else {
        setIsSyncing(true);
        try {
          await supabase.from('user_data').upsert({ user_id: user.id, payload, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
        } finally { setIsSyncing(false); }
      }
    };
    const timeout = setTimeout(saveData, 2500); // Maior intervalo para menos carga
    return () => clearTimeout(timeout);
  }, [flowData, calendarConfig, calendarEvents, emails, links, extensions, postIts, importantNotes, shiftHandoffs, shiftConfig, signatures, personalFiles, hiddenTabs, user, isDataLoaded]);

  const handleLogout = async () => {
    if (user?.id !== 'demo_user_id') await supabase.auth.signOut();
    localStorage.removeItem('ysoffice_demo_session');
    setUser(null);
    setIsDataLoaded(false);
  };

  if (viewMessage) return <MessageLinker mode="view" encodedMessage={viewMessage} />;
  if (!user) return <Auth onLogin={setUser} />;

  const visibleTabs = tabs.filter(t => !hiddenTabs.includes(t.id));

  return (
    <div className="flex flex-col h-screen bg-win95-bg p-4 font-sans text-gray-800">
      <div className="flex justify-between items-center px-2 mb-4 shrink-0">
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
        <div className="flex px-2 pt-2 bg-[#d1d5db] border-b border-gray-300 gap-1 items-end relative shrink-0">
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
            <div className="absolute inset-0 overflow-auto bg-white">
              <Suspense fallback={<LoadingPlaceholder />}>
                {activeTab === 'office' && (
                  <OfficeModule 
                    emails={emails} onEmailChange={setEmails}
                    signatures={signatures} onSignatureChange={setSignatures}
                    onAddEvent={(ev) => setCalendarEvents(prev => [...prev, ev])}
                    postIts={postIts} onPostItChange={setPostIts}
                    importantNotes={importantNotes} onNoteChange={setImportantNotes}
                    handoffs={shiftHandoffs} onHandoffChange={setShiftHandoffs}
                    currentUser={user} links={links} onLinkChange={setLinks}
                    extensions={extensions} onExtensionChange={setExtensions}
                    personalFiles={personalFiles} onFilesChange={setPersonalFiles}
                  />
                )}
                {activeTab === 'calendar' && (
                  <CalendarModule 
                    calendarConfig={calendarConfig} onCalendarConfigChange={setCalendarConfig}
                    events={calendarEvents} onEventsChange={setCalendarEvents}
                    shiftConfig={shiftConfig} onShiftConfigChange={setShiftConfig}
                  />
                )}
                {activeTab === 'flow' && <FlowBuilder data={flowData} onChange={setFlowData} />}
                {activeTab === 'consultas' && <ConsultationModule />}
                {activeTab === 'whatsapp' && <WhatsAppTool />}
              </Suspense>
            </div>
        </div>
        
        <div className="bg-[#e0e5ec] border-t border-gray-300 px-3 py-1 flex justify-between items-center text-[10px] text-gray-500 font-medium select-none shrink-0">
           <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Brain v2.5 - Optimized Engine</span>
           <DigitalClock />
           <span>{isDataLoaded ? 'Conectado' : 'Sincronizando...'}</span>
        </div>
      </div>
    </div>
  );
};

export default App;
