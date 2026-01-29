
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

// Initial Data States
const initialKanban: KanbanState = {
  todo: [{ id: '1', title: 'Bem-vindo', description: 'Este é um cartão de exemplo.' }],
  doing: [],
  done: []
};

const initialFlow: FlowState = {
  nodes: [],
  connections: []
};

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

  // 1. Verificar sessão ativa no Supabase ao carregar
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({ 
          id: session.user.id, 
          nick: session.user.user_metadata.username || session.user.email?.split('@')[0] || 'Usuário' 
        });
      } else {
        const demoSession = localStorage.getItem('ysoffice_demo_session');
        if (demoSession) {
          setUser(JSON.parse(demoSession));
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ 
          id: session.user.id, 
          nick: session.user.user_metadata.username || session.user.email?.split('@')[0] || 'Usuário' 
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Buscar dados quando o usuário logar
  useEffect(() => {
    if (!user) return;

    if (user.id === 'demo_user_id') {
      const saved = localStorage.getItem('ysoffice_demo_data');
      if (saved) {
        try {
          const parsed: AppData = JSON.parse(saved);
          if (parsed.kanban) setKanbanData(parsed.kanban);
          if (parsed.flow) setFlowData(parsed.flow);
          if (parsed.emails) setEmails(parsed.emails);
          if (parsed.links) setLinks(parsed.links);
          if (parsed.postIts) setPostIts(parsed.postIts);
        } catch (e) { console.error("Falha ao carregar dados demo", e); }
      }
      return;
    }

    const fetchData = async () => {
      setIsSyncing(true);
      try {
        const { data, error } = await supabase
          .from('user_data')
          .select('payload')
          .eq('user_id', user.id)
          .single();

        if (data && data.payload) {
          const payload = data.payload as AppData;
          if (payload.kanban) setKanbanData(payload.kanban);
          if (payload.flow) setFlowData(payload.flow);
          if (payload.emails) setEmails(payload.emails);
          if (payload.links) setLinks(payload.links);
          if (payload.postIts) setPostIts(payload.postIts);
        }
      } catch (err) {
        console.error("Erro ao carregar dados do Supabase:", err);
      }
      setIsSyncing(false);
    };

    fetchData();
  }, [user]);

  // 3. Salvar dados automaticamente ao mudar
  useEffect(() => {
    if (!user) return;

    const saveData = async () => {
      const payload: AppData = { kanban: kanbanData, flow: flowData, emails, links, postIts };

      if (user.id === 'demo_user_id') {
        localStorage.setItem('ysoffice_demo_data', JSON.stringify(payload));
        return;
      }

      setIsSyncing(true);
      try {
        const { error } = await supabase
          .from('user_data')
          .upsert({ 
            user_id: user.id, 
            payload,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });

        if (error) console.error("Erro ao sincronizar com Supabase:", error);
      } catch (err) {
        console.error("Exceção ao salvar dados:", err);
      }
      setIsSyncing(false);
    };

    const timeout = setTimeout(saveData, 1500);
    return () => clearTimeout(timeout);
  }, [kanbanData, flowData, emails, links, postIts, user]);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    if (newUser.id === 'demo_user_id') {
      localStorage.setItem('ysoffice_demo_session', JSON.stringify(newUser));
    }
  };

  const handleLogout = async () => {
    if (confirm("Deseja realmente sair?")) {
      if (user?.id !== 'demo_user_id') {
        try { await supabase.auth.signOut(); } catch(e) {}
      }
      localStorage.removeItem('ysoffice_demo_session');
      setUser(null);
      setKanbanData(initialKanban);
      setFlowData(initialFlow);
      setEmails([]);
      setLinks([]);
      setPostIts([]);
    }
  };

  const handleExport = () => {
    const data: AppData = { kanban: kanbanData, flow: flowData, emails, links, postIts };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ysoffice_backup_${user?.nick}_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  const tabs = [
    { id: 'mural', label: 'Mural de Idéias', icon: <StickyNote size={20} /> },
    { id: 'kanban', label: 'Quadro Kanban', icon: <Trello size={20} /> },
    { id: 'flow', label: 'Calculadora Fluxo', icon: <GitMerge size={20} /> },
    { id: 'email', label: 'Modelos E-mail', icon: <Mail size={20} /> },
    { id: 'links', label: 'Central de Links', icon: <Globe size={20} /> },
    { id: 'whatsapp', label: 'WhatsApp', icon: <MessageSquare size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800">
      
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-slate-200 flex flex-col transition-all duration-300 shadow-xl z-20`}>
        <div className="p-5 flex items-center justify-between border-b border-slate-100">
          {isSidebarOpen && <h1 className="font-bold text-xl text-indigo-700 tracking-tighter">YSoffice</h1>}
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
            <Menu size={20} />
          </button>
        </div>

        <div className="px-4 pt-4">
          <div className={`flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl ${!isSidebarOpen && 'justify-center'}`}>
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-black relative">
              {user.nick[0].toUpperCase()}
              {isSyncing && <RefreshCw size={10} className="absolute -top-1 -right-1 text-indigo-500 animate-spin" />}
            </div>
            {isSidebarOpen && (
              <div className="overflow-hidden">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">
                  {user.id === 'demo_user_id' ? 'Modo Demo' : 'Logado como'}
                </p>
                <p className="text-sm font-black text-slate-700 truncate">{user.nick}</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                activeTab === tab.id 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className={activeTab === tab.id ? 'text-indigo-100' : 'text-slate-400'}>{tab.icon}</span>
              {isSidebarOpen && <span className="font-medium">{tab.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-2">
          {isSidebarOpen ? (
            <>
              <button 
                onClick={handleExport}
                className="w-full flex items-center gap-3 p-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg"
              >
                <Download size={16} /> Exportar JSON
              </button>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 p-2 text-sm text-red-600 hover:bg-red-50 rounded-lg font-bold"
              >
                <LogOut size={16} /> {user.id === 'demo_user_id' ? 'Sair do Demo' : 'Encerrar Sessão'}
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-4 items-center">
              <button onClick={handleExport} title="Exportar" className="text-slate-500 hover:text-indigo-600"><Download size={20}/></button>
              <button onClick={handleLogout} title="Sair" className="text-red-500 hover:text-red-700"><LogOut size={20}/></button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 justify-between lg:hidden">
           <span className="font-bold text-lg text-slate-700">
             {tabs.find(t => t.id === activeTab)?.label}
           </span>
        </header>

        <main className="flex-1 p-6 overflow-hidden relative">
           <div className="h-full w-full">
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
