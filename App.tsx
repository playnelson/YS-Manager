
import React, { useState, useEffect } from 'react';
import { Trello, GitMerge, Mail, MessageSquare, RefreshCw, Globe, StickyNote, Contrast, Calendar as CalendarIcon, Phone } from 'lucide-react';
import { AppData, KanbanState, FlowState, EmailTemplate, User, ProfessionalLink, PostIt, CalendarConfig, Extension } from './types';
import { KanbanBoard } from './components/KanbanBoard';
import { FlowBuilder } from './components/FlowBuilder';
import { CalendarTool } from './components/CalendarTool';
import { EmailManager } from './components/EmailManager';
import { WhatsAppTool } from './components/WhatsAppTool';
import { ProfessionalLinks } from './components/ProfessionalLinks';
import { ExtensionsDirectory } from './components/ExtensionsDirectory';
import { StickyNotesWall } from './components/StickyNotesWall';
import { Auth } from './components/Auth';
import { supabase } from './supabase';
import { Button } from './components/ui/Button';

const initialKanban: KanbanState = { todo: [], doing: [], done: [] };
const initialFlow: FlowState = { nodes: [], connections: [], templates: [] };

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'mural' | 'calendar' | 'kanban' | 'flow' | 'email' | 'whatsapp' | 'links' | 'ramais'>('mural');
  
  // Data States
  const [kanbanData, setKanbanData] = useState<KanbanState>(initialKanban);
  const [flowData, setFlowData] = useState<FlowState>(initialFlow);
  const [calendarConfig, setCalendarConfig] = useState<CalendarConfig>({ uf: 'SP', city: 'São Paulo' });
  const [emails, setEmails] = useState<EmailTemplate[]>([]);
  const [links, setLinks] = useState<ProfessionalLink[]>([]);
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [postIts, setPostIts] = useState<PostIt[]>([]);
  
  // System States
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  
  const [isInverted, setIsInverted] = useState(() => localStorage.getItem('ysoffice_inverted') === 'true');

  // Helper for date string
  const getFullDate = () => {
    const date = new Date();
    const formatted = date.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

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
            const parsed: AppData = JSON.parse(saved);
            if (parsed.kanban) setKanbanData(parsed.kanban);
            if (parsed.flow) setFlowData({ ...initialFlow, ...parsed.flow });
            if (parsed.calendarConfig) setCalendarConfig(parsed.calendarConfig);
            if (parsed.emails) setEmails(parsed.emails);
            if (parsed.links) setLinks(parsed.links);
            if (parsed.extensions) setExtensions(parsed.extensions);
            if (parsed.postIts) setPostIts(parsed.postIts);
          }
        } else {
          const { data, error } = await supabase.from('user_data').select('payload').eq('user_id', user.id).maybeSingle();
          if (error) {
             setSyncError('Erro ao carregar dados.');
          } else if (data?.payload) {
            const payload = data.payload as AppData;
            setKanbanData(payload.kanban || initialKanban);
            setFlowData({ ...initialFlow, ...(payload.flow || {}) });
            setCalendarConfig(payload.calendarConfig || { uf: 'SP', city: 'São Paulo' });
            setEmails(payload.emails || []);
            setLinks(payload.links || []);
            setExtensions(payload.extensions || []);
            setPostIts(payload.postIts || []);
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
      const payload: AppData = { kanban: kanbanData, flow: flowData, calendarConfig, emails, links, extensions, postIts };
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
  }, [kanbanData, flowData, calendarConfig, emails, links, extensions, postIts, user, isDataLoaded]);

  const handleLogout = async () => {
    if (user?.id !== 'demo_user_id') await (supabase.auth as any).signOut();
    localStorage.removeItem('ysoffice_demo_session');
    setUser(null);
    setIsDataLoaded(false);
  };

  if (!user) return <Auth onLogin={setUser} />;

  const tabs = [
    { id: 'mural', label: 'Notas', icon: <StickyNote size={14} /> },
    { id: 'calendar', label: 'Calendário', icon: <CalendarIcon size={14} /> },
    { id: 'ramais', label: 'Ramais', icon: <Phone size={14} /> },
    { id: 'kanban', label: 'Tarefas', icon: <Trello size={14} /> },
    { id: 'flow', label: 'Fluxo', icon: <GitMerge size={14} /> },
    { id: 'email', label: 'E-mails', icon: <Mail size={14} /> },
    { id: 'links', label: 'Links', icon: <Globe size={14} /> },
    { id: 'whatsapp', label: 'Whats', icon: <MessageSquare size={14} /> },
  ];

  return (
    <div className="flex flex-col h-screen bg-[#c0c0c0] p-2 font-sans text-black">
      <div className="flex justify-between items-center px-1 mb-2">
        <div className="flex items-center gap-2">
           <button 
             onClick={() => setActiveTab('calendar')}
             className="font-bold text-sm text-[#555] hover:text-win95-blue flex items-center gap-2 transition-colors cursor-pointer group"
             title="Ver Calendário"
           >
             <div className="win95-sunken px-2 py-0.5 bg-white flex items-center gap-2 group-hover:bg-[#f0f0f0]">
               <CalendarIcon size={14} className="text-win95-blue" />
               <span>{getFullDate()}</span>
             </div>
           </button>
           {isSyncing && <RefreshCw size={12} className="animate-spin text-[#000080]" />}
        </div>
        <div className="flex items-center gap-4 text-xs">
           <span>Usuário: <b>{user.nick}</b></span>
           <Button onClick={() => setIsInverted(!isInverted)} size="sm" className="min-w-[30px]" title="Inverter Cores">
             <Contrast size={14} />
           </Button>
           <Button onClick={handleLogout} size="sm" className="min-w-[60px]">Sair</Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex gap-1 px-1 z-10">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                   relative px-4 py-1.5 flex items-center gap-2 text-xs font-bold rounded-t-sm transition-none
                   border-t-2 border-l-2 border-r-2 outline-none
                   ${isActive 
                     ? 'bg-[#c0c0c0] border-white border-r-[#808080] pb-2 -mb-[2px] z-20' 
                     : 'bg-[#c0c0c0] border-white border-r-[#808080] border-b-2 border-b-white text-[#555] mb-0 z-0 hover:text-black'}
                `}
              >
                {tab.icon}
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="flex-1 win95-raised p-1 relative z-10 flex flex-col overflow-hidden">
             <div className="flex-1 win95-sunken bg-white overflow-hidden relative">
                <div className="absolute inset-0 overflow-auto p-4">
                  {activeTab === 'mural' && <StickyNotesWall notes={postIts} onChange={setPostIts} />}
                  {activeTab === 'calendar' && <CalendarTool config={calendarConfig} onChange={setCalendarConfig} />}
                  {activeTab === 'kanban' && <KanbanBoard data={kanbanData} onChange={setKanbanData} />}
                  {activeTab === 'flow' && <FlowBuilder data={flowData} onChange={setFlowData} />}
                  {activeTab === 'email' && <EmailManager emails={emails} onChange={setEmails} />}
                  {activeTab === 'links' && <ProfessionalLinks links={links} onChange={setLinks} />}
                  {activeTab === 'whatsapp' && <WhatsAppTool />}
                  {activeTab === 'ramais' && <ExtensionsDirectory extensions={extensions} onChange={setExtensions} />}
                </div>
             </div>
        </div>
      </div>
      
      <div className="mt-1 px-1 flex justify-between text-[10px] text-[#555]">
         <span>YSoffice v1.0.3</span>
         <span>{isDataLoaded ? 'Dados Sincronizados' : 'Conectando...'}</span>
      </div>
    </div>
  );
};

export default App;
