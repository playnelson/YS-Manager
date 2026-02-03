
import React, { useState, useEffect } from 'react';
import { Layout, Trello, GitMerge, Mail, MessageSquare, Download, Menu, LogOut, User as UserIcon, RefreshCw, Globe, StickyNote, X } from 'lucide-react';
import { AppData, KanbanState, FlowState, EmailTemplate, User, ProfessionalLink, PostIt } from './types';
import { KanbanBoard } from './components/KanbanBoard';
import { FlowBuilder } from './components/FlowBuilder';
import { EmailManager } from './components/EmailManager';
import { WhatsAppTool } from './components/WhatsAppTool';
import { ProfessionalLinks } from './components/ProfessionalLinks';
import { StickyNotesWall } from './components/StickyNotesWall';
import { Auth } from './components/Auth';
import { supabase } from './supabase';
import { Button } from './components/ui/Button';

const initialKanban: KanbanState = { todo: [], doing: [], done: [] };
const initialFlow: FlowState = { nodes: [], connections: [], templates: [] };

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'mural' | 'kanban' | 'flow' | 'email' | 'whatsapp' | 'links'>('mural');
  const [kanbanData, setKanbanData] = useState<KanbanState>(initialKanban);
  const [flowData, setFlowData] = useState<FlowState>(initialFlow);
  const [emails, setEmails] = useState<EmailTemplate[]>([]);
  const [links, setLinks] = useState<ProfessionalLink[]>([]);
  const [postIts, setPostIts] = useState<PostIt[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

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
    if (!user) return;
    const fetchData = async () => {
      setIsSyncing(true);
      if (user.id === 'demo_user_id') {
        const saved = localStorage.getItem('ysoffice_demo_data');
        if (saved) {
          const parsed: AppData = JSON.parse(saved);
          if (parsed.kanban) setKanbanData(parsed.kanban);
          if (parsed.flow) setFlowData({ ...initialFlow, ...parsed.flow }); // Ensure template array exists
          if (parsed.emails) setEmails(parsed.emails);
          if (parsed.links) setLinks(parsed.links);
          if (parsed.postIts) setPostIts(parsed.postIts);
        }
      } else {
        const { data } = await supabase.from('user_data').select('payload').eq('user_id', user.id).single();
        if (data?.payload) {
          const payload = data.payload as AppData;
          setKanbanData(payload.kanban || initialKanban);
          setFlowData({ ...initialFlow, ...(payload.flow || {}) });
          setEmails(payload.emails || []);
          setLinks(payload.links || []);
          setPostIts(payload.postIts || []);
        }
      }
      setIsSyncing(false);
    };
    fetchData();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const saveData = async () => {
      const payload: AppData = { kanban: kanbanData, flow: flowData, emails, links, postIts };
      if (user.id === 'demo_user_id') {
        localStorage.setItem('ysoffice_demo_data', JSON.stringify(payload));
      } else {
        setIsSyncing(true);
        await supabase.from('user_data').upsert({ user_id: user.id, payload, updated_at: new Date().toISOString() });
        setIsSyncing(false);
      }
    };
    const timeout = setTimeout(saveData, 2000);
    return () => clearTimeout(timeout);
  }, [kanbanData, flowData, emails, links, postIts, user]);

  const handleLogout = async () => {
    if (user?.id !== 'demo_user_id') await (supabase.auth as any).signOut();
    localStorage.removeItem('ysoffice_demo_session');
    setUser(null);
  };

  if (!user) return <Auth onLogin={setUser} />;

  const tabs = [
    { id: 'mural', label: 'Notas', icon: <StickyNote size={14} /> },
    { id: 'kanban', label: 'Tarefas', icon: <Trello size={14} /> },
    { id: 'flow', label: 'Fluxo', icon: <GitMerge size={14} /> },
    { id: 'email', label: 'E-mails', icon: <Mail size={14} /> },
    { id: 'links', label: 'Links', icon: <Globe size={14} /> },
    { id: 'whatsapp', label: 'Whats', icon: <MessageSquare size={14} /> },
  ];

  return (
    <div className="flex flex-col h-screen bg-[#c0c0c0] p-2 font-sans text-black">
      {/* Header Info */}
      <div className="flex justify-between items-center px-1 mb-2">
        <div className="flex items-center gap-2">
           <span className="font-bold text-lg italic text-[#555]">YSoffice</span>
           {isSyncing && <RefreshCw size={12} className="animate-spin text-[#000080]" />}
        </div>
        <div className="flex items-center gap-4 text-xs">
           <span>Usuário: <b>{user.nick}</b></span>
           <Button onClick={handleLogout} size="sm" className="min-w-[60px]">Sair</Button>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Tab Headers */}
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

        {/* Tab Content Area */}
        <div className="flex-1 win95-raised p-1 relative z-10 flex flex-col overflow-hidden">
             <div className="flex-1 win95-sunken bg-white overflow-hidden relative">
                <div className="absolute inset-0 overflow-auto p-4">
                  {activeTab === 'mural' && <StickyNotesWall notes={postIts} onChange={setPostIts} />}
                  {activeTab === 'kanban' && <KanbanBoard data={kanbanData} onChange={setKanbanData} />}
                  {activeTab === 'flow' && <FlowBuilder data={flowData} onChange={setFlowData} />}
                  {activeTab === 'email' && <EmailManager emails={emails} onChange={setEmails} />}
                  {activeTab === 'links' && <ProfessionalLinks links={links} onChange={setLinks} />}
                  {activeTab === 'whatsapp' && <WhatsAppTool />}
                </div>
             </div>
        </div>
      </div>
      
      {/* Footer Status */}
      <div className="mt-1 px-1 flex justify-between text-[10px] text-[#555]">
         <span>YSoffice v1.0</span>
         <span>{new Date().toLocaleDateString()}</span>
      </div>
    </div>
  );
};

export default App;
