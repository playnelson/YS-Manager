
import React, { useState, useEffect } from 'react';
import { Trello, GitMerge, Mail, MessageSquare, RefreshCw, Globe, StickyNote, Contrast, Calendar as CalendarIcon, Phone, FileText, Clock as ClockIcon, FileSearch2, Repeat, Briefcase, PenTool } from 'lucide-react';
import { AppData, KanbanState, FlowState, EmailTemplate, User, ProfessionalLink, PostIt, CalendarConfig, Extension, UserEvent, ImportantNote, ShiftConfig, Signature } from './types';
import { KanbanBoard } from './components/KanbanBoard';
import { FlowBuilder } from './components/FlowBuilder';
import { CalendarTool } from './components/CalendarTool';
import { EmailManager } from './components/EmailManager';
import { WhatsAppTool } from './components/WhatsAppTool';
import { ProfessionalLinks } from './components/ProfessionalLinks';
import { ExtensionsDirectory } from './components/ExtensionsDirectory';
import { StickyNotesWall } from './components/StickyNotesWall';
import { ImportantNotes } from './components/ImportantNotes';
import { PdfManager } from './components/PdfManager';
import { ShiftManager } from './components/ShiftManager';
import { BrasilTools } from './components/BrasilTools';
import { SignatureManager } from './components/SignatureManager';
import { Auth } from './components/Auth';
import { supabase } from './supabase';
import { Button } from './components/ui/Button';

const initialKanban: KanbanState = { todo: [], doing: [], done: [] };
const initialFlow: FlowState = { nodes: [], connections: [], templates: [] };

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'postits' | 'notes' | 'calendar' | 'shifts' | 'kanban' | 'email' | 'flow' | 'pdf' | 'ramais' | 'links' | 'whatsapp' | 'brtools' | 'signatures'>('postits');
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
  const [shiftConfig, setShiftConfig] = useState<ShiftConfig | undefined>(undefined);
  const [signatures, setSignatures] = useState<Signature[]>([]);
  
  // System States
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  
  const [isInverted, setIsInverted] = useState(() => localStorage.getItem('ysoffice_inverted') === 'true');

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
            const parsed: AppData = JSON.parse(saved);
            if (parsed.kanban) setKanbanData(parsed.kanban);
            if (parsed.flow) setFlowData({ ...initialFlow, ...parsed.flow });
            if (parsed.calendarConfig) setCalendarConfig(parsed.calendarConfig);
            if (parsed.calendarEvents) setCalendarEvents(parsed.calendarEvents);
            if (parsed.emails) setEmails(parsed.emails);
            if (parsed.links) setLinks(parsed.links);
            if (parsed.extensions) setExtensions(parsed.extensions);
            if (parsed.postIts) setPostIts(parsed.postIts);
            if (parsed.importantNotes) setImportantNotes(parsed.importantNotes);
            if (parsed.shiftConfig) setShiftConfig(parsed.shiftConfig);
            if (parsed.signatures) setSignatures(parsed.signatures);
          }
        } else {
          const { data, error } = await supabase.from('user_data').select('payload').eq('user_id', user.id).maybeSingle();
          if (!error && data?.payload) {
            const payload = data.payload as AppData;
            setKanbanData(payload.kanban || initialKanban);
            setFlowData({ ...initialFlow, ...(payload.flow || {}) });
            setCalendarConfig(payload.calendarConfig || { uf: 'SP', city: 'São Paulo' });
            setCalendarEvents(payload.calendarEvents || []);
            setEmails(payload.emails || []);
            setLinks(payload.links || []);
            setExtensions(payload.extensions || []);
            setPostIts(payload.postIts || []);
            setImportantNotes(payload.importantNotes || []);
            setShiftConfig(payload.shiftConfig);
            setSignatures(payload.signatures || []);
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
      const payload: AppData = { kanban: kanbanData, flow: flowData, calendarConfig, calendarEvents, emails, links, extensions, postIts, importantNotes, shiftConfig, signatures };
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
  }, [kanbanData, flowData, calendarConfig, calendarEvents, emails, links, extensions, postIts, importantNotes, shiftConfig, signatures, user, isDataLoaded]);

  const handleLogout = async () => {
    if (user?.id !== 'demo_user_id') await (supabase.auth as any).signOut();
    localStorage.removeItem('ysoffice_demo_session');
    setUser(null);
    setIsDataLoaded(false);
  };

  if (!user) return <Auth onLogin={setUser} />;

  const tabs = [
    { id: 'postits', label: 'Post-its', icon: <StickyNote size={14} /> },
    { id: 'notes', label: 'Anotações', icon: <FileText size={14} /> },
    { id: 'calendar', label: 'Calendário', icon: <CalendarIcon size={14} /> },
    { id: 'shifts', label: 'Escalas', icon: <Repeat size={14} /> },
    { id: 'kanban', label: 'Tarefas', icon: <Trello size={14} /> },
    { id: 'email', label: 'E-mails', icon: <Mail size={14} /> },
    { id: 'flow', label: 'Fluxo', icon: <GitMerge size={14} /> },
    { id: 'signatures', label: 'Assinador', icon: <PenTool size={14} /> },
    { id: 'pdf', label: 'PDF', icon: <FileSearch2 size={14} /> },
    { id: 'brtools', label: 'Serviços BR', icon: <Briefcase size={14} /> },
    { id: 'ramais', label: 'Ramais', icon: <Phone size={14} /> },
    { id: 'links', label: 'Diretório', icon: <Globe size={14} /> },
    { id: 'whatsapp', label: 'Whats', icon: <MessageSquare size={14} /> },
  ];

  return (
    <div className="flex flex-col h-screen bg-[#c0c0c0] p-2 font-sans text-black">
      <div className="flex justify-between items-center px-1 mb-2">
        <div className="flex items-center gap-2">
           <button onClick={() => setActiveTab('calendar')} className="font-bold text-sm text-[#555] hover:text-win95-blue flex items-center gap-2 transition-colors cursor-pointer group">
             <div className="win95-sunken px-2 py-0.5 bg-white flex items-center gap-2 group-hover:bg-[#f0f0f0]">
               <CalendarIcon size={14} className="text-win95-blue" />
               <span>{getFullDate()}</span>
             </div>
           </button>
           {isSyncing && <RefreshCw size={12} className="animate-spin text-[#000080]" />}
        </div>
        <div className="flex items-center gap-4 text-xs">
           <span>Usuário: <b>{user.nick}</b></span>
           <Button onClick={() => setIsInverted(!isInverted)} size="sm" className="min-w-[30px]" title="Inverter Cores"><Contrast size={14} /></Button>
           <Button onClick={handleLogout} size="sm" className="min-w-[60px]">Sair</Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex gap-1 px-1 z-10 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`relative shrink-0 px-4 py-1.5 flex items-center gap-2 text-xs font-bold rounded-t-sm border-t-2 border-l-2 border-r-2 outline-none ${activeTab === tab.id ? 'bg-[#c0c0c0] border-white border-r-[#808080] pb-2 -mb-[2px] z-20' : 'bg-[#c0c0c0] border-white border-r-[#808080] border-b-2 border-b-white text-[#555] mb-0 z-0 hover:text-black'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 win95-raised p-1 relative z-10 flex flex-col overflow-hidden">
             <div className="flex-1 win95-sunken bg-white overflow-hidden relative">
                <div className="absolute inset-0 overflow-auto p-4">
                  {activeTab === 'postits' && <StickyNotesWall notes={postIts} onChange={setPostIts} />}
                  {activeTab === 'notes' && <ImportantNotes notes={importantNotes} onChange={setImportantNotes} />}
                  {activeTab === 'calendar' && <CalendarTool config={calendarConfig} events={calendarEvents} onConfigChange={setCalendarConfig} onEventsChange={setCalendarEvents} />}
                  {activeTab === 'shifts' && <ShiftManager config={shiftConfig} onChange={setShiftConfig} />}
                  {activeTab === 'kanban' && <KanbanBoard data={kanbanData} onChange={setKanbanData} />}
                  {activeTab === 'flow' && <FlowBuilder data={flowData} onChange={setFlowData} />}
                  {activeTab === 'email' && <EmailManager emails={emails} onChange={setEmails} />}
                  {activeTab === 'links' && <ProfessionalLinks links={links} onChange={setLinks} />}
                  {activeTab === 'whatsapp' && <WhatsAppTool />}
                  {activeTab === 'ramais' && <ExtensionsDirectory extensions={extensions} onChange={setExtensions} />}
                  {activeTab === 'pdf' && <PdfManager />}
                  {activeTab === 'brtools' && <BrasilTools />}
                  {activeTab === 'signatures' && <SignatureManager signatures={signatures} onChange={setSignatures} />}
                </div>
             </div>
        </div>
      </div>
      
      <div className="mt-1 px-1 flex justify-between items-center text-[10px] text-[#555] font-bold">
         <span className="flex-1 text-left">YSoffice v1.2.0</span>
         <span className="flex-1 text-center flex items-center justify-center gap-1">
           <ClockIcon size={10} /> {currentTime}
         </span>
         <span className="flex-1 text-right">{isDataLoaded ? 'Base de Dados Conectada' : 'Aguardando Sincronização...'}</span>
      </div>
    </div>
  );
};

export default App;
