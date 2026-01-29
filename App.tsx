import React, { useState, useEffect } from 'react';
import { Layout, Trello, GitMerge, Mail, MessageSquare, Download, Upload, Menu } from 'lucide-react';
import { AppData, KanbanState, FlowState, EmailTemplate } from './types';
import { KanbanBoard } from './components/KanbanBoard';
import { FlowBuilder } from './components/FlowBuilder';
import { EmailManager } from './components/EmailManager';
import { WhatsAppTool } from './components/WhatsAppTool';

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
  const [activeTab, setActiveTab] = useState<'kanban' | 'flow' | 'email' | 'whatsapp'>('kanban');
  const [kanbanData, setKanbanData] = useState<KanbanState>(initialKanban);
  const [flowData, setFlowData] = useState<FlowState>(initialFlow);
  const [emails, setEmails] = useState<EmailTemplate[]>([]);
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('ys_manager_data');
    if (saved) {
      try {
        const parsed: AppData = JSON.parse(saved);
        if (parsed.kanban) setKanbanData(parsed.kanban);
        if (parsed.flow) setFlowData(parsed.flow);
        if (parsed.emails) setEmails(parsed.emails);
      } catch (e) {
        console.error("Failed to load local data", e);
      }
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    const data: AppData = { kanban: kanbanData, flow: flowData, emails };
    localStorage.setItem('ys_manager_data', JSON.stringify(data));
  }, [kanbanData, flowData, emails]);

  // File Import/Export
  const handleExport = () => {
    const data: AppData = { kanban: kanbanData, flow: flowData, emails };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ys_manager_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed: AppData = JSON.parse(event.target?.result as string);
        if (parsed.kanban) setKanbanData(parsed.kanban);
        if (parsed.flow) setFlowData(parsed.flow);
        if (parsed.emails) setEmails(parsed.emails);
        alert("Dados carregados com sucesso!");
      } catch (err) {
        alert("Arquivo JSON inválido");
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const tabs = [
    { id: 'kanban', label: 'Quadro Kanban', icon: <Trello size={20} /> },
    { id: 'flow', label: 'Calculadora Fluxo', icon: <GitMerge size={20} /> },
    { id: 'email', label: 'Modelos E-mail', icon: <Mail size={20} /> },
    { id: 'whatsapp', label: 'WhatsApp', icon: <MessageSquare size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800">
      
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-slate-200 flex flex-col transition-all duration-300 shadow-xl z-20`}>
        <div className="p-5 flex items-center justify-between border-b border-slate-100">
          {isSidebarOpen && <h1 className="font-bold text-xl text-indigo-700 tracking-tight">YS Manager</h1>}
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
            <Menu size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
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
                <Download size={16} /> Salvar Backup
              </button>
              <label className="w-full flex items-center gap-3 p-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer">
                <Upload size={16} /> Carregar Backup
                <input type="file" className="hidden" accept=".json" onChange={handleImport} />
              </label>
            </>
          ) : (
            <div className="flex flex-col gap-4 items-center">
              <button onClick={handleExport} title="Salvar" className="text-slate-500 hover:text-indigo-600"><Download size={20}/></button>
              <label className="cursor-pointer text-slate-500 hover:text-indigo-600" title="Carregar">
                 <Upload size={20}/>
                 <input type="file" className="hidden" accept=".json" onChange={handleImport} />
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header (Mobile/Tablet view helper or just visual spacer) */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 justify-between lg:hidden">
           <span className="font-bold text-lg text-slate-700">
             {tabs.find(t => t.id === activeTab)?.label}
           </span>
        </header>

        <main className="flex-1 p-6 overflow-hidden relative">
           <div className="h-full w-full">
            {activeTab === 'kanban' && <KanbanBoard data={kanbanData} onChange={setKanbanData} />}
            {activeTab === 'flow' && <FlowBuilder data={flowData} onChange={setFlowData} />}
            {activeTab === 'email' && <EmailManager emails={emails} onChange={setEmails} />}
            {activeTab === 'whatsapp' && <WhatsAppTool />}
           </div>
        </main>
      </div>
    </div>
  );
};

export default App;