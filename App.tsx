import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import {
  LogOut,
  CalendarDays,
  Menu,
  X,
  RefreshCw,
  Box,
  Truck,
  Users,
  Settings,
  Link, // renamed below
  StickyNote,
  DollarSign,
  Cloud,
  Puzzle,
  FileSignature,
  FolderOpen,
  LayoutDashboard,
  KanbanSquare,
  Network,
  MessageCircle,
  Check,
  GitMerge,
  MessageSquare,
  Calendar as CalendarIcon,
  Search,
  Home,
  Package,
  Store
} from 'lucide-react';
import { AppData, FlowState, EmailTemplate, User, ProfessionalLink, PostIt, CalendarConfig, Extension, UserEvent, ImportantNote, ShiftConfig, Signature, ShiftHandoff, StoredFile, LogisticsState, KanbanState, KanbanPriority, NotePriority } from './types';
import { Auth } from './components/Auth';
import { MessageLinker } from './components/MessageLinker';
import { DigitalClock } from './components/DigitalClock';
import { LoadingPlaceholder } from './components/LoadingPlaceholder';
import { supabase } from './supabase';
import { SEED_DATA } from './seeds';

// Lazy Loading de Módulos Pesados para rapidez inicial
const OfficeModule = lazy(() => import('./components/OfficeModule').then(m => ({ default: m.OfficeModule })));
const CalendarModule = lazy(() => import('./components/CalendarModule').then(m => ({ default: m.CalendarModule })));
const FlowBuilder = lazy(() => import('./components/FlowBuilder').then(m => ({ default: m.FlowBuilder })));
const ConsultationModule = lazy(() => import('./components/ConsultationModule').then(m => ({ default: m.ConsultationModule })));
const WhatsAppTool = lazy(() => import('./components/WhatsAppTool').then(m => ({ default: m.WhatsAppTool })));
const LogisticsModule = lazy(() => import('./components/LogisticsModule').then(m => ({ default: m.LogisticsModule })));
const SharedDocumentsModule = lazy(() => import('./components/SharedDocumentsModule').then(m => ({ default: m.SharedDocumentsModule })));
const ModuleStore = lazy(() => import('./components/ModuleStore').then(m => ({ default: m.ModuleStore })));
const FinancialModule = lazy(() => import('./components/FinancialModule').then(m => ({ default: m.FinancialModule })));
const WarehouseModule = lazy(() => import('./components/WarehouseModule').then(m => ({ default: m.WarehouseModule })));

const initialFlow: FlowState = { nodes: [], connections: [], templates: [] };
const initialLogistics: LogisticsState = { freightTables: [], checklists: [] };
const initialKanban: KanbanState = {
  columns: [
    { id: 'col_backlog', title: 'Backlog', color: 'gray', cards: [] },
    { id: 'col_todo', title: 'A Fazer', color: 'blue', cards: [] },
    { id: 'col_doing', title: 'Em Andamento', color: 'orange', cards: [] },
    { id: 'col_done', title: 'Concluído', color: 'green', cards: [] },
  ]
};

const DEFAULT_TABS = [
  { id: 'office', label: 'Escritório', icon: <Home size={18} /> },
  { id: 'calendar', label: 'Calendário', icon: <CalendarIcon size={18} /> },
  { id: 'flow', label: 'Fluxo', icon: <GitMerge size={18} /> },
  { id: 'logistics', label: 'Logística', icon: <Truck size={18} /> },
  { id: 'consultas', label: 'Consultas', icon: <Search size={18} /> },
  { id: 'whatsapp', label: 'WhatsApp', icon: <MessageSquare size={18} /> },
  { id: 'shared_docs', label: 'Docs', icon: <Cloud size={18} /> },
  { id: 'financial', label: 'Financeiro', icon: <DollarSign size={18} /> },
  { id: 'warehouse', label: 'Almoxarifado', icon: <Package size={18} /> },
  { id: 'modules', label: 'Loja', icon: <Store size={18} /> },
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
  const [hiddenTabs, setHiddenTabs] = useState<string[]>(['financial', 'warehouse']);

  // Dark mode via Tailwind dark class
  const [isDark, setIsDark] = useState(() => localStorage.getItem('ysoffice_dark') === 'true');

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
  const [financialTransactions, setFinancialTransactions] = useState<any[]>([]);
  const [warehouseInventory, setWarehouseInventory] = useState<any[]>([]);
  const [warehouseEmployees, setWarehouseEmployees] = useState<any[]>([]);
  const [warehouseLogs, setWarehouseLogs] = useState<any[]>([]);
  const [whatsappTemplates, setWhatsappTemplates] = useState<any[]>([]);
  const [whatsappHistory, setWhatsappHistory] = useState<any[]>([]);
  const [kanbanData, setKanbanData] = useState<KanbanState>(initialKanban);

  const [isSyncing, setIsSyncing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const initializedTables = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('ysoffice_dark', String(isDark));
  }, [isDark]);

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

  // Removed handleSort as drag-and-drop tabs are no longer in the main navigation

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
    // Força atualização da sessão no carregamento para capturar o provider_token do Google
    // após o redirecionamento do linkIdentity.
    const refreshAndGetSession = async () => {
      try {
        await supabase.auth.refreshSession();
      } catch (e) {
        console.error("Erro ao fazer refresh da sessão:", e);
      }

      const { data: { session } } = await supabase.auth.getSession();
      console.log('Sessão Supabase:', session);
      if (session?.user) {
        console.log('Provider Token:', session.provider_token);
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
    };

    refreshAndGetSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      console.log('Auth Change:', _event, session);
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
            if (parsed.calendarEvents) setCalendarEvents(parsed.calendarEvents || []);
            if (parsed.emails) setEmails(parsed.emails || []);
            if (parsed.links) setLinks(parsed.links || []);
            if (parsed.extensions) setExtensions(parsed.extensions || []);
            if (parsed.postIts) setPostIts(parsed.postIts || []);
            if (parsed.importantNotes) setImportantNotes(parsed.importantNotes || []);
            if (parsed.shiftHandoffs) setShiftHandoffs(parsed.shiftHandoffs || []);
            if (parsed.shiftConfig) setShiftConfig(parsed.shiftConfig);
            if (parsed.signatures) setSignatures(parsed.signatures || []);
            if (parsed.personalFiles) setPersonalFiles(parsed.personalFiles || []);
            if (parsed.logistics) setLogisticsData(parsed.logistics || initialLogistics);
            if (parsed.hiddenTabs) setHiddenTabs(parsed.hiddenTabs || []);
            if (parsed.kanban) setKanbanData(parsed.kanban || initialKanban);
            if (parsed.financialTransactions) setFinancialTransactions(parsed.financialTransactions || []);
          }
        } else {
          // Helper to fetch and log individual table status
          const safeFetch = async (query: any, tableName: string) => {
            try {
              const res = await query;
              if (res.error) {
                console.warn(`Safe Fetch: Erro em ${tableName}:`, res.error);
                return { data: null, error: res.error };
              }
              return res;
            } catch (e) {
              console.error(`Safe Fetch: Exceção crítica em ${tableName}:`, e);
              return { data: null, error: e };
            }
          };

          const [
            kbCols, kbCards, evts, notes, pts, trans, freight, settings, emailsRes, linksRes, exts, sigs, files, flow, logData, whInv, whEmps, whLogs, waTemp, waHist
          ] = await Promise.all([
            safeFetch(supabase.from('kanban_columns').select('*').eq('user_id', user.id).order('order'), 'kanban_columns'),
            safeFetch(supabase.from('kanban_cards').select('*').eq('user_id', user.id).order('order'), 'kanban_cards'),
            safeFetch(supabase.from('calendar_events').select('*').eq('user_id', user.id), 'calendar_events'),
            safeFetch(supabase.from('important_notes').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }), 'important_notes'),
            safeFetch(supabase.from('post_its').select('*').eq('user_id', user.id), 'post_its'),
            safeFetch(supabase.from('financial_transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }), 'financial_transactions'),
            safeFetch(supabase.from('logistics_freight_tables').select('*').eq('user_id', user.id), 'logistics_freight_tables'),
            safeFetch(supabase.from('user_settings').select('*').eq('user_id', user.id).maybeSingle(), 'user_settings'),
            safeFetch(supabase.from('email_templates').select('*').eq('user_id', user.id), 'email_templates'),
            safeFetch(supabase.from('professional_links').select('*').eq('user_id', user.id), 'professional_links'),
            safeFetch(supabase.from('extensions').select('*').eq('user_id', user.id), 'extensions'),
            safeFetch(supabase.from('signatures').select('*').eq('user_id', user.id), 'signatures'),
            safeFetch(supabase.from('personal_files').select('*').eq('user_id', user.id), 'personal_files'),
            safeFetch(supabase.from('flow_builder_states').select('payload').eq('user_id', user.id).maybeSingle(), 'flow_builder_states'),
            safeFetch(supabase.from('logistics_data').select('checklists, saved_routes').eq('user_id', user.id).maybeSingle(), 'logistics_data'),
            safeFetch(supabase.from('warehouse_inventory').select('*').eq('user_id', user.id), 'warehouse_inventory'),
            safeFetch(supabase.from('warehouse_employees').select('*').eq('user_id', user.id), 'warehouse_employees'),
            safeFetch(supabase.from('warehouse_logs').select('*').eq('user_id', user.id), 'warehouse_logs'),
            safeFetch(supabase.from('whatsapp_templates').select('*').eq('user_id', user.id), 'whatsapp_templates'),
            safeFetch(supabase.from('whatsapp_history').select('*').eq('user_id', user.id).limit(50).order('timestamp', { ascending: false }), 'whatsapp_history')
          ]);
          const isFirstTimeUser = !settings.data;

          // --- Kanban ---
          if (kbCols.data && kbCards.data) {
            initializedTables.current.add('kanban_columns');
            initializedTables.current.add('kanban_cards');
            if (kbCols.data.length > 0) {
              setKanbanData({
                columns: kbCols.data.map((col: any) => ({
                  id: col.id, title: col.title, color: col.color,
                  cards: (kbCards.data || []).filter((c: any) => c.column_id === col.id).map((c: any) => ({
                    id: c.id, title: c.title, description: c.description || '',
                    priority: (c.priority as KanbanPriority) || 'medium', createdAt: c.created_at,
                    dueDate: c.due_date, labels: c.labels || []
                  }))
                }))
              });
            } else if (isFirstTimeUser) {
              setKanbanData(SEED_DATA.kanban as any);
            } else {
              setKanbanData({ columns: [] });
            }
          }

          // --- Warehouse ---
          if (whInv.data) {
            initializedTables.current.add('warehouse_inventory');
            if (whInv.data.length > 0) {
              setWarehouseInventory(whInv.data.map((i: any) => ({
                id: i.id, code: i.code, name: i.name, category: i.category,
                consumable: i.consumable ?? false, quantity: i.quantity, minStock: i.min_stock,
                unit: i.unit, itemsPerContainer: i.items_per_container || 1, lastUpdated: i.last_updated
              })));
            } else if (isFirstTimeUser) {
              setWarehouseInventory(SEED_DATA.warehouse.inventory);
            } else {
              setWarehouseInventory([]);
            }
          }

          if (whEmps.data) {
            initializedTables.current.add('warehouse_employees');
            if (whEmps.data.length > 0) {
              setWarehouseEmployees(whEmps.data);
            } else if (isFirstTimeUser) {
              setWarehouseEmployees(SEED_DATA.warehouse.employees);
            } else {
              setWarehouseEmployees([]);
            }
          }

          if (whLogs.data) {
            initializedTables.current.add('warehouse_logs');
            setWarehouseLogs(whLogs.data.map((l: any) => ({
              id: l.id, itemId: l.item_id, type: l.type, quantity: l.quantity,
              employeeId: l.employee_id || '', employeeName: l.employee_name,
              note: l.note, date: l.date, itemCode: l.item_code || '', itemName: l.item_name || ''
            })));
          }

          // --- Logistics ---
          if (freight.data) {
            initializedTables.current.add('logistics');
            if (freight.data.length > 0) {
              setLogisticsData({
                freightTables: freight.data.map((t: any) => ({
                  id: t.id, name: t.name, fuelPrice: t.fuel_price, avgConsumption: t.avg_consumption,
                  driverPerDieum: t.driver_per_dieum, insuranceRate: t.insurance_rate,
                  updatedAt: t.updated_at || new Date().toISOString()
                })),
                checklists: logData.data?.checklists || SEED_DATA.logistics.checklists,
                savedRoutes: logData.data?.saved_routes || []
              });
            } else if (isFirstTimeUser) {
              setLogisticsData(SEED_DATA.logistics as any);
            } else {
              setLogisticsData({ freightTables: [], checklists: [], savedRoutes: [] });
            }
          }

          // --- Financial ---
          if (trans.data) {
            initializedTables.current.add('financial_transactions');
            if (trans.data.length > 0) {
              setFinancialTransactions(trans.data);
            } else if (isFirstTimeUser) {
              setFinancialTransactions(SEED_DATA.financial);
            } else {
              setFinancialTransactions([]);
            }
          }

          // --- Notes ---
          if (notes.data) {
            initializedTables.current.add('important_notes');
            if (notes.data.length > 0) {
              setImportantNotes(notes.data.map((n: any) => ({
                ...n,
                priority: (n.priority as NotePriority) || 'normal'
              })));
            } else if (isFirstTimeUser) {
              setImportantNotes(SEED_DATA.notes as any);
            } else {
              setImportantNotes([]);
            }
          }

          // --- WhatsApp ---
          if (waTemp.data) {
            initializedTables.current.add('whatsapp_templates');
            if (waTemp.data.length > 0) {
              setWhatsappTemplates(waTemp.data);
            } else if (isFirstTimeUser) {
              setWhatsappTemplates(SEED_DATA.whatsapp.templates);
            } else {
              setWhatsappTemplates([]);
            }
          }

          if (waHist.data) {
            initializedTables.current.add('whatsapp_history');
            setWhatsappHistory(waHist.data);
          }

          // --- Settings & Metadata ---
          if (settings.data) {
            initializedTables.current.add('user_settings');
            setCalendarConfig(settings.data.calendar_config || { uf: 'SP', city: 'São Paulo' });
            setHiddenTabs(settings.data.hidden_tabs || []);
            setShiftConfig(settings.data.shift_config);
          } else {
            initializedTables.current.add('user_settings');
          }

          // --- Rest ---
          if (evts.data) { initializedTables.current.add('calendar_events'); setCalendarEvents(evts.data); }
          if (pts.data) { initializedTables.current.add('post_its'); setPostIts(pts.data); }
          if (emailsRes.data) { initializedTables.current.add('email_templates'); setEmails(emailsRes.data); }
          if (linksRes.data) {
            initializedTables.current.add('professional_links');
            if (linksRes.data.length > 0) {
              setLinks(linksRes.data.map((l: any) => ({ ...l, customIcon: l.custom_icon })));
            } else if (isFirstTimeUser) {
              setLinks(SEED_DATA.links);
            } else {
              setLinks([]);
            }
          }
          if (exts.data) { initializedTables.current.add('extensions'); setExtensions(exts.data); }
          if (sigs.data) { initializedTables.current.add('signatures'); setSignatures(sigs.data.map((s: any) => ({ ...s, dataUrl: s.data_url }))); }
          if (files.data) { initializedTables.current.add('personal_files'); setPersonalFiles(files.data); }
          if (flow.data) { initializedTables.current.add('flow_builder_states'); setFlowData(flow.data.payload || initialFlow); }
        }
      } catch (err) { console.error('Erro ao carregar dados:', err); }
      finally { setIsSyncing(false); setIsDataLoaded(true); }
    };
    fetchData();
  }, [user?.id]);

  // Page Unload Protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'Você tem alterações que ainda não foram salvas. Deseja realmente sair?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!user || !isDataLoaded) return;
    setIsSyncing(true);
    setHasUnsavedChanges(true);
    const saveData = async () => {
      if (user.id === 'demo_user_id') {
        const payload: AppData = { kanban: kanbanData, flow: flowData, calendarConfig, calendarEvents, emails, links, extensions, postIts, importantNotes, shiftHandoffs, shiftConfig, signatures, personalFiles, logistics: logisticsData, hiddenTabs, financialTransactions, warehouseInventory, warehouseLogs };
        localStorage.setItem('ysoffice_demo_data', JSON.stringify(payload));
        setHasUnsavedChanges(false);
        setIsSyncing(false);
        return;
      }

         try {
        const kanbanCols = kanbanData.columns.map((col, idx) => ({ id: col.id, user_id: user.id, title: col.title, color: col.color, order: idx }));

        const kanbanCards = kanbanData.columns.flatMap(col => col.cards.map((card, idx) => ({ 
            id: card.id,
            user_id: user.id,
            column_id: col.id,
            order: idx,
            title: card.title,
            description: card.description || '',
            priority: card.priority || 'medium',
            due_date: card.dueDate,
            labels: card.labels || [],
            created_at: card.createdAt || new Date().toISOString()
        })));

        const safeSave = async (query: any, tableName: string) => {
          try {
            const res = await query;
            if (res.error) console.warn(`Safe Save: Erro em ${tableName}:`, res.error);
            return res;
          } catch (e) {
            console.error(`Safe Save: Exceção crítica em ${tableName}:`, e);
          }
        };

        const logisticsFreightToSave = logisticsData.freightTables.map(t => ({
          id: t.id, user_id: user.id, name: t.name, fuel_price: t.fuelPrice,
          avg_consumption: t.avgConsumption, driver_per_dieum: t.driverPerDieum,
          insurance_rate: t.insuranceRate, updated_at: t.updatedAt
        }));

        const syncTableData = async (tableName: string, currentData: any[], initKey: string = tableName) => {
          if (!initializedTables.current.has(initKey)) return;
          try {
            const currentIds = currentData.map(item => item.id).filter(Boolean);
            if (currentIds.length > 0) {
              const { data: existing } = await supabase.from(tableName).select('id').eq('user_id', user.id);
              if (existing) {
                const idsToDelete = existing.map(r => r.id).filter(id => !currentIds.includes(id));
                if (idsToDelete.length > 0) {
                  await supabase.from(tableName).delete().in('id', idsToDelete);
                }
              }
              await safeSave(supabase.from(tableName).upsert(currentData), tableName);
            } else {
              await supabase.from(tableName).delete().eq('user_id', user.id);
            }
          } catch (e) {
            console.error(`Erro na sincronização de ${tableName}:`, e);
          }
        };

        await Promise.all([
          syncTableData('kanban_columns', kanbanCols),
          syncTableData('kanban_cards', kanbanCards),
          syncTableData('calendar_events', calendarEvents.map(e => ({ id: e.id, user_id: user.id, date: e.date, title: e.title, type: e.type, description: e.description }))),
          syncTableData('important_notes', importantNotes.map(n => ({ id: n.id, user_id: user.id, title: n.title, content: n.content, category: n.category, priority: n.priority, updated_at: n.updatedAt }))),
          syncTableData('post_its', postIts.map(p => ({ id: p.id, user_id: user.id, text: p.text, color: p.color, rotation: p.rotation }))),
          syncTableData('financial_transactions', financialTransactions.map(t => ({ id: t.id, user_id: user.id, description: t.description, amount: t.amount, type: t.type, category: t.category, date: t.date }))),
          syncTableData('email_templates', emails.map(e => ({ id: e.id, user_id: user.id, name: e.name, category: e.category, subject: e.subject, body: e.body, to: e.to, cc: e.cc, saved_at: e.savedAt }))),
          syncTableData('professional_links', links.map(l => ({ id: l.id, user_id: user.id, title: l.title, url: l.url, category: l.category, custom_icon: l.customIcon }))),
          syncTableData('extensions', extensions.map(e => ({ id: e.id, user_id: user.id, name: e.name, department: e.department, number: e.number, notes: e.notes }))),
          syncTableData('signatures', signatures.map(s => ({ id: s.id, user_id: user.id, name: s.name, data_url: s.dataUrl, created_at: s.createdAt }))),
          syncTableData('personal_files', personalFiles.map(f => ({ id: f.id, user_id: user.id, name: f.name, type: f.type, size: f.size, data: f.data, category: f.category, uploaded_at: f.uploadedAt }))),
          syncTableData('warehouse_inventory', warehouseInventory.map(i => ({ id: i.id, user_id: user.id, code: i.code, name: i.name, category: i.category, quantity: i.quantity, min_stock: i.minStock, unit: i.unit, consumable: i.consumable, items_per_container: i.itemsPerContainer || 1, last_updated: i.lastUpdated }))),
          syncTableData('warehouse_employees', warehouseEmployees.map(e => ({ id: e.id, user_id: user.id, name: e.name, role: e.role, department: e.department, active: e.active, cpf: e.cpf }))),
          syncTableData('warehouse_logs', warehouseLogs.map(l => ({ id: l.id, user_id: user.id, item_id: l.itemId, item_code: l.itemCode, item_name: l.itemName, type: l.type, quantity: l.quantity, employee_id: l.employeeId || null, employee_name: l.employeeName, note: l.note, date: l.date }))),
          syncTableData('whatsapp_templates', whatsappTemplates.map(t => ({ id: t.id, user_id: user.id, title: t.title, content: t.content }))),
          syncTableData('whatsapp_history', whatsappHistory.map(h => ({ id: h.id, user_id: user.id, name: h.name, phone: h.phone, message: h.message, method: h.method, timestamp: h.timestamp }))),
          syncTableData('logistics_freight_tables', logisticsFreightToSave, 'logistics'),
          
          initializedTables.current.has('user_settings') && safeSave(supabase.from('user_settings').upsert({ user_id: user.id, calendar_config: calendarConfig, hidden_tabs: hiddenTabs, shift_config: shiftConfig, updated_at: new Date().toISOString() }), 'user_settings'),
          initializedTables.current.has('flow_builder_states') && safeSave(supabase.from('flow_builder_states').upsert({ user_id: user.id, payload: flowData }), 'flow_builder_states'),
          initializedTables.current.has('logistics') && safeSave(supabase.from('logistics_data').upsert({ user_id: user.id, checklists: logisticsData.checklists, saved_routes: logisticsData.savedRoutes }), 'logistics_data')
        ].filter(Boolean));
      } catch (err) {
        console.error('Erro ao salvar dados:', err);
      } finally { 
        setIsSyncing(false); 
        setHasUnsavedChanges(false);
      }
    };

    const timeout = setTimeout(saveData, 1000);
    return () => clearTimeout(timeout);
  }, [flowData, calendarConfig, calendarEvents, emails, links, extensions, postIts, importantNotes, shiftHandoffs, shiftConfig, signatures, personalFiles, logisticsData, hiddenTabs, user, isDataLoaded, financialTransactions, warehouseInventory, warehouseEmployees, warehouseLogs, whatsappTemplates, whatsappHistory, kanbanData]);

  const handleLogout = async () => {
    if (user?.id !== 'demo_user_id') await supabase.auth.signOut();
    localStorage.removeItem('ysoffice_demo_session');
    setUser(null);
    setIsDataLoaded(false);
  };

  const handleLinkGoogle = async () => {
    try {
      console.log('🔴 Iniciando vinculação com o Google...');
      // alert('Iniciando vinculação com conta Google...'); // Opcional, ajudaria a debugar

      const { data, error } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          scopes: 'email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/contacts.readonly',
          redirectTo: window.location.origin
        }
      });

      console.log('🔴 Resultado da vinculação:', data, error);

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
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
    <div className="flex h-screen overflow-hidden bg-palette-lightest dark:bg-[#111111] text-gray-900 dark:text-gray-100 transition-colors duration-300 font-sans">

      {/* ── Sidebar ── */}
      <aside className="w-16 lg:w-64 flex-shrink-0 bg-palette-lightest dark:bg-gray-900 border-r border-palette-mediumDark dark:border-gray-800 flex flex-col">
        {/* Logo */}
        <div className="p-5 flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-gray-900 flex-shrink-0">
            <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>deployed_code</span>
          </div>
          <span className="font-bold text-lg tracking-tight hidden lg:block whitespace-nowrap">BRAIN OFFICE</span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-2 space-y-0.5">
          {visibleTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              title={tab.label}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${activeTab === tab.id
                ? 'bg-white dark:bg-gray-800 shadow-sm border border-palette-mediumDark dark:border-gray-700 text-gray-900 dark:text-white font-semibold'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-gray-800/60 font-medium'
                }`}
            >
              {tab.icon}
              <span className="hidden lg:block truncate">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* User info */}
        <div className="p-3 border-t border-palette-mediumDark dark:border-gray-800">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
              {user.photoUrl
                ? <img src={user.photoUrl} alt={user.nick} className="w-full h-full object-cover" />
                : <span className="material-symbols-outlined text-gray-500" style={{ fontSize: '18px' }}>person</span>
              }
            </div>
            <div className="hidden lg:block overflow-hidden flex-1">
              <p className="text-xs font-semibold truncate">{user.nick}</p>
              <p className="text-[10px] text-gray-500 truncate">{isSyncing ? 'Sincronizando...' : 'Online'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="ml-auto hidden lg:flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
              title="Sair"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Panel ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── Top Header ── */}
        <header className="h-14 border-b border-palette-mediumLight dark:border-gray-800 flex items-center justify-between px-6 bg-white/80 dark:bg-gray-900/50 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-palette-mediumLight dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-palette-mediumDark dark:border-gray-700">
              <span className="material-symbols-outlined text-gray-500" style={{ fontSize: '16px' }}>calendar_month</span>
              <span className="text-xs font-medium">{getFullDate()}</span>
            </div>
            
            {/* Sync Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/50 dark:bg-gray-800/50 border border-palette-mediumDark dark:border-gray-700">
              {(isSyncing || hasUnsavedChanges) ? (
                <>
                  <RefreshCw size={13} className="animate-spin text-blue-500" />
                  <span className="text-blue-600 dark:text-blue-400">Salvando...</span>
                </>
              ) : (
                <>
                  <Check size={14} className="text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Sincronizado</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {user.id !== 'demo_user_id' && !user.googleAccessToken && (
              <button
                onClick={handleLinkGoogle}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 transition-all"
              >
                <Cloud size={13} />
                <span className="hidden sm:inline">Vincular Google</span>
              </button>
            )}
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500 transition-all"
              title="Alternar tema"
            >
              {isDark
                ? <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>light_mode</span>
                : <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>dark_mode</span>
              }
            </button>
            <button
              onClick={() => setActiveTab('modules')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500 transition-all"
              title="Loja de Módulos"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>settings</span>
            </button>
            <div className="h-4 w-px bg-palette-mediumDark dark:bg-gray-700 mx-1"></div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-red-500 transition-colors px-2 py-1.5"
            >
              SAIR
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
            </button>
          </div>
        </header>

        {/* ── Content Area (fills remaining height) ── */}
        <div className="flex-1 overflow-hidden bg-palette-mediumLight dark:bg-black/30">
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
                hiddenTabs={hiddenTabs}
                kanbanData={kanbanData} onKanbanChange={setKanbanData}
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
            {activeTab === 'whatsapp' && (
              <WhatsAppTool
                googleAccessToken={user.googleAccessToken}
                templates={whatsappTemplates}
                onTemplatesChange={setWhatsappTemplates}
                history={whatsappHistory}
                onHistoryChange={setWhatsappHistory}
              />
            )}
            {activeTab === 'shared_docs' && (
              <SharedDocumentsModule
                driveFiles={driveFiles}
                onDriveFilesChange={setDriveFiles}
                currentUser={user}
              />
            )}
            {activeTab === 'financial' && (
              <FinancialModule
                transactions={financialTransactions}
                onChange={setFinancialTransactions}
              />
            )}
            {activeTab === 'warehouse' && (
              <WarehouseModule
                inventory={warehouseInventory}
                onInventoryChange={setWarehouseInventory}
                employees={warehouseEmployees}
                onEmployeesChange={setWarehouseEmployees}
                logs={warehouseLogs}
                onLogsChange={setWarehouseLogs}
              />
            )}
            {activeTab === 'modules' && (
              <ModuleStore
                hiddenTabs={hiddenTabs}
                onToggleTab={toggleTabVisibility}
              />
            )}
          </Suspense>
        </div>
      </main>
    </div>
  );
};

export default App;
