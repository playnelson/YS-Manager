
import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { GitMerge, MessageSquare, RefreshCw, Contrast, Calendar as CalendarIcon, Briefcase, Search, Truck, Settings, Cloud } from 'lucide-react';
import { AppData, FlowState, EmailTemplate, User, ProfessionalLink, PostIt, CalendarConfig, Extension, UserEvent, ImportantNote, ShiftConfig, Signature, ShiftHandoff, StoredFile, LogisticsState } from './types';
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
const LogisticsModule = lazy(() => import('./components/LogisticsModule').then(m => ({ default: m.LogisticsModule })));
const SharedDocumentsModule = lazy(() => import('./components/SharedDocumentsModule').then(m => ({ default: m.SharedDocumentsModule })));

const initialFlow: FlowState = { nodes: [], connections: [], templates: [] };
const initialLogistics: LogisticsState = { freightTables: [], checklists: [] };

const DEFAULT_TABS = [
  { id: 'office', label: 'Escritório', icon: <Briefcase size={16} /> },
  { id: 'calendar', label: 'Calendário', icon: <CalendarIcon size={16} /> },
  { id: 'flow', label: 'Fluxo', icon: <GitMerge size={16} /> },
  { id: 'logistics', label: 'Logística', icon: <Truck size={16} /> },
  { id: 'consultas', label: 'Consultas', icon: <Search size={16} /> },
  { id: 'whatsapp', label: 'WhatsApp', icon: <MessageSquare size={16} /> },
  { id: 'shared_docs', label: 'Docs', icon: <Cloud size={16} /> },
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
  const [isTabsDropdownOpen, setIsTabsDropdownOpen] = useState(false);
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
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [logisticsData, setLogisticsData] = useState<LogisticsState>(initialLogistics);

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

  const toggleTabVisibility = (tabId: string) => {
    setHiddenTabs(prev => {
      const isHidden = prev.includes(tabId);
      if (isHidden) {
        // Se a aba estiver oculta, mostre-a (remova de hiddenTabs)
        // E se for a aba ativa, não faça nada. Se não, mude a aba ativa para ela.
        if (activeTab !== tabId) setActiveTab(tabId);
        return prev.filter(id => id !== tabId);
      } else {
        // Se a aba estiver visível, oculte-a (adicione a hiddenTabs)
        // Se for a aba ativa, mude para a primeira aba visível
        if (activeTab === tabId) {
          const nextVisibleTab = tabs.find(t => !prev.includes(t.id) && t.id !== tabId);
          if (nextVisibleTab) setActiveTab(nextVisibleTab.id);
        }
        return [...prev, tabId];
      }
    });
  };

  const getFullDate = () => {
    const date = new Date();
    const formatted = date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          nick: session.user.user_metadata.username || session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'Usuário',
          photoUrl: session.user.user_metadata.avatar_url,
          googleAccessToken: session.provider_token
        });
      } else {
        const demoSession = localStorage.getItem('ysoffice_demo_session');
        if (demoSession) setUser(JSON.parse(demoSession));
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          nick: session.user.user_metadata.username || session.user.user_metadata.full_name || 'Usuário',
          photoUrl: session.user.user_metadata.avatar_url,
          googleAccessToken: session.provider_token
        });
      }
    }) as any;

    window.addEventListener('link-google', handleLinkGoogle);
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('link-google', handleLinkGoogle);
    };
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
            if (parsed.logistics) setLogisticsData(parsed.logistics);
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
            setLogisticsData(payload.logistics || initialLogistics);
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
      const payload: AppData = { kanban: { columns: [] }, flow: flowData, calendarConfig, calendarEvents, emails, links, extensions, postIts, importantNotes, shiftHandoffs, shiftConfig, signatures, personalFiles, logistics: logisticsData, hiddenTabs };
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
  }, [flowData, calendarConfig, calendarEvents, emails, links, extensions, postIts, importantNotes, shiftHandoffs, shiftConfig, signatures, personalFiles, logisticsData, hiddenTabs, user, isDataLoaded]);

  const handleLogout = async () => {
    if (user?.id !== 'demo_user_id') await supabase.auth.signOut();
    localStorage.removeItem('ysoffice_demo_session');
    setUser(null);
    setIsDataLoaded(false);
  };

  const handleLinkGoogle = async () => {
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          scopes: 'email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/drive.readonly',
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('Erro ao vincular conta Google:', err);
      const msg = err.message || JSON.stringify(err);
      alert('Erro ao vincular conta Google [v2]: ' + msg);
    }
  };

  if (viewMessage) return <MessageLinker mode="view" encodedMessage={viewMessage} />;
  if (!user) return <Auth onLogin={setUser} />;

  const visibleTabs = tabs.filter(t => !hiddenTabs.includes(t.id));

  return (
    <div className="min-h-screen bg-win95-bg font-sans text-gray-800">

      {/* ── Navbar fixa no topo ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#e0e5ec] border-b border-gray-300 shadow-sm">
        <div className="flex justify-between items-center px-4 py-2">
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

            {user.id !== 'demo_user_id' && !user.googleAccessToken && (
              <button
                onClick={handleLinkGoogle}
                className="flex items-center gap-1.5 px-2 py-0.5 bg-white border border-gray-300 win95-raised hover:bg-gray-50 text-[10px] text-blue-700 font-bold uppercase"
                title="Vincular sua conta ao Google para usar o Drive"
              >
                <Cloud size={12} /> Vincular Google
              </button>
            )}

            <button onClick={() => setIsInverted(!isInverted)} className="hover:text-blue-600 transition-colors" title="Modo Escuro"><Contrast size={16} /></button>
            <button onClick={handleLogout} className="hover:text-red-600 transition-colors font-bold">Sair</button>
          </div>
        </div>

        {/* ── Barra de abas (sticky, logo abaixo da navbar) ── */}
        <div className="flex px-2 bg-[#d1d5db] border-t border-gray-300 gap-1 items-end relative">
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
          <div className="relative">
            <button
              onClick={() => setIsTabsDropdownOpen(!isTabsDropdownOpen)}
              className="p-2 rounded-t-md hover:bg-gray-200 transition-colors"
              title="Gerenciar abas"
            >
              <Settings size={16} className="text-gray-600" />
            </button>
            {isTabsDropdownOpen && (
              <div
                className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-300 rounded-md shadow-lg z-20 win95-raised p-1"
                onMouseLeave={() => setIsTabsDropdownOpen(false)}
              >
                <div className="px-2 py-1 text-xs font-bold text-gray-700 border-b border-gray-200 mb-1">Exibir Abas</div>
                <ul>
                  {DEFAULT_TABS.map(tab => (
                    <li key={tab.id}>
                      <label className="flex items-center gap-2 px-2 py-1.5 text-xs text-gray-800 hover:bg-blue-100 rounded-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!hiddenTabs.includes(tab.id)}
                          onChange={() => toggleTabVisibility(tab.id)}
                          className="h-4 w-4 rounded-sm border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="flex-1 select-none">{tab.label}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Conteúdo principal — scroll natural de site ── */}
      {/* pt-[calc] compensa a navbar (aprox. 88px: header ~48px + tabs ~40px) */}
      <main className="pt-[88px] win95-raised bg-gray-100 shadow-inner min-h-screen">
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
          {activeTab === 'logistics' && <LogisticsModule data={logisticsData} onChange={setLogisticsData} />}
          {activeTab === 'consultas' && <ConsultationModule />}
          {activeTab === 'whatsapp' && <WhatsAppTool />}
          {activeTab === 'shared_docs' && (
            <SharedDocumentsModule
              driveFiles={driveFiles}
              onDriveFilesChange={setDriveFiles}
              currentUser={user}
            />
          )}
        </Suspense>
      </main>

      {/* ── Rodapé ── */}
      <footer className="bg-[#e0e5ec] border-t border-gray-300 px-3 py-1 flex justify-between items-center text-[10px] text-gray-500 font-medium select-none">
        <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Brain v2.5 - Optimized Engine</span>
        <DigitalClock />
        <span>{isDataLoaded ? 'Conectado' : 'Sincronizando...'}</span>
      </footer>
    </div>
  );
};

export default App;
