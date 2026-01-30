
import React, { useState, useEffect } from 'react';
import { Layout, Trello, GitMerge, Mail, MessageSquare, Download, Menu, LogOut, User as UserIcon, RefreshCw, Globe, StickyNote } from 'lucide-react';
import { AppData, KanbanState, FlowState, EmailTemplate, User, ProfessionalLink, PostIt } from './types';
import { KanbanBoard } from './components/KanbanBoard';
import { FlowBuilder } from './components/FlowBuilder';
import { EmailManager } from './components/EmailManager';
import { WhatsAppTool } from './components/WhatsAppTool';
import { ProfessionalLinks } from './components/ProfessionalLinks';
import { StickyNotesWall } from './components/StickyNotesWall';
import { Auth } from './components/Auth';
import { supabase } from './supabase';

const initialKanban: KanbanState = { todo: [], doing: [], done: [] };
const initialFlow: FlowState = { nodes: [], connections: [] };

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'mural' | 'kanban' | 'flow' | 'email' | 'whatsapp' | 'links'>('mural');
  const [kanbanData, setKanbanData] = useState<KanbanState>(initialKanban);
  const [flowData, setFlowData] = useState<FlowState>(initialFlow);
  const [emails, setEmails] = useState<EmailTemplate[]>([]);
  const [links, setLinks] = useState<ProfessionalLink[]>([]);
  const [postIts, setPostIts] = useState<PostIt[]>([]);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Using any cast to bypass SupabaseAuthClient type mismatch in the build environment
    (supabase.auth as any).getSession().then(({ data: { session } }: any) => {
      if (session?.user) {
        setUser({ id: session.user.id, nick: session.user.user_metadata.username || session.user.email?.split('@')[0] || 'Usuário' });
      } else {
        const demoSession = localStorage.getItem('ysoffice_demo_session');
        if (demoSession) setUser(JSON.parse(demoSession));
      }
    });
    // Using any cast to bypass SupabaseAuthClient type mismatch in the build environment
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
          if (parsed.flow) setFlowData(parsed.flow);
          if (parsed.emails) setEmails(parsed.emails);
          if (parsed.links) setLinks(parsed.links);
          if (parsed.postIts) setPostIts(parsed.postIts);
        }
      } else {
        const { data } = await supabase.from('user_data').select('payload').eq('user_id', user.id).single();
        if (data?.payload) {
          const payload = data.payload as AppData;
          setKanbanData(payload.kanban || initialKanban);
          setFlowData(payload.flow || initialFlow);
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
    // Using any cast to bypass SupabaseAuthClient type mismatch in the build environment
    if (user?.id !== 'demo_user_id') await (supabase.auth as any).signOut();
    localStorage.removeItem('ysoffice_demo_session');
    setUser(null);
  };

  if (!user) return <Auth onLogin={setUser} />;

  const tabs = [
    { id: 'mural', label: 'Painel de Notas', icon: <StickyNote size={18} /> },
    { id: 'kanban', label: 'Gestão de Tarefas', icon: <Trello size={18} /> },
    { id: 'flow', label: 'Fluxos de Cálculo', icon: <GitMerge size={18} /> },
    { id: 'email', label: 'Modelos Oficiais', icon: <Mail size={18} /> },
    { id: 'links', label: 'Repositório de Links', icon: <Globe size={18} /> },
    { id: 'whatsapp', label: 'Mensagens Rápidas', icon: <MessageSquare size={18} /> },
  ];

  return (
    <div className="flex h-screen bg-[#f3f5f8] text-[#1c2d3d] overflow-hidden">
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-16'} bg-[#1b2631] text-white flex flex-col transition-all duration-200 z-20`}>
        <div className="h-14 flex items-center px-4 border-b border-white/10 bg-[#161e27]">
          {isSidebarOpen && <span className="font-bold tracking-tight text-lg">YSoffice <span className="text-[10px] font-normal opacity-50 ml-1 italic">Enterprise</span></span>}
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="ml-auto p-1.5 hover:bg-white/10 rounded">
            <Menu size={18} />
          </button>
        </div>

        <div className="p-3 border-b border-white/5">
          <div className="flex items-center gap-2 p-2 bg-white/5 rounded border border-white/10">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-xs font-bold uppercase shrink-0">
              {user.nick[0]}
            </div>
            {isSidebarOpen && (
              <div className="min-w-0">
                <p className="text-[10px] uppercase opacity-40 font-bold leading-none mb-1">Usuário Atual</p>
                <p className="text-sm font-semibold truncate">{user.nick}</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-sm ${
                activeTab === tab.id ? 'bg-[#0064d2] text-white shadow-inner' : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="shrink-0">{tab.icon}</span>
              {isSidebarOpen && <span className="truncate">{tab.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-2 border-t border-white/10 bg-[#161e27]">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-white/50 hover:text-red-400 hover:bg-red-950/20 rounded transition-colors">
            <LogOut size={16} />
            {isSidebarOpen && <span>Encerrar Sessão</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-[#dee2e6] flex items-center px-6 justify-between shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-bold text-[#556b82] uppercase tracking-wide">
              {tabs.find(t => t.id === activeTab)?.label}
            </h2>
            {isSyncing && <div className="flex items-center gap-2 text-[10px] text-primary font-bold animate-pulse"><RefreshCw size={10} className="animate-spin" /> SINCRONIZANDO</div>}
          </div>
          <div className="flex items-center gap-2">
             <button onClick={() => window.location.reload()} className="p-2 text-[#556b82] hover:bg-[#f3f5f8] rounded" title="Recarregar">
               <RefreshCw size={16} />
             </button>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-hidden">
          <div className="h-full bg-white border border-[#dee2e6] rounded-md shadow-sm p-6 overflow-auto">
            {activeTab === 'mural' && <StickyNotesWall notes={postIts} onChange={setPostIts} />}
            {activeTab === 'kanban' && <KanbanBoard data={kanbanData} onChange={setKanbanData} />}
            {activeTab === 'flow' && <FlowBuilder data={flowData} onChange={setFlowData} />}
            {activeTab === 'email' && <EmailManager emails={emails} onChange={setEmails} />}
            {activeTab === 'links' && <ProfessionalLinks links={links} onChange={setLinks} />}
            {activeTab === 'whatsapp' && <WhatsAppTool />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
