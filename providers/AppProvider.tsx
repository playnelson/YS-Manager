'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { SEED_DATA } from '@/seeds';
import {
  AppData, FlowState, EmailTemplate, User, ProfessionalLink, PostIt,
  CalendarConfig, Extension, UserEvent, ImportantNote, ShiftConfig,
  Signature, ShiftHandoff, StoredFile, LogisticsState, KanbanState,
  KanbanPriority, NotePriority, OrderAnnotation
} from '@/types';

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

const AppContext = createContext<any>(null);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  // UI State
  const [hiddenTabs, setHiddenTabs] = useState<string[]>(['warehouse', 'brasil-hub']);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDark, setIsDark] = useState<boolean>(false);
  
  // Initialize dark mode on client only
  useEffect(() => {
    setIsDark(localStorage.getItem('ysoffice_dark') === 'true');
  }, []);

  const [companySettings, setCompanySettings] = useState<{ name: string; logoUrl: string }>({ name: '', logoUrl: '' });
  
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ysoffice_company');
      if (saved) setCompanySettings(JSON.parse(saved));
    } catch { }
  }, []);

  const saveCompanySettings = (data: { name: string; logoUrl: string }) => {
    setCompanySettings(data);
    localStorage.setItem('ysoffice_company', JSON.stringify(data));
  };

  // Business State
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
  const [warehouseCategories, setWarehouseCategories] = useState<any[]>([]);
  const [whatsappTemplates, setWhatsappTemplates] = useState<any[]>([]);
  const [whatsappHistory, setWhatsappHistory] = useState<any[]>([]);
  const [kanbanData, setKanbanData] = useState<KanbanState>(initialKanban);
  const [orderAnnotations, setOrderAnnotations] = useState<OrderAnnotation[]>([]);

  const initializedTables = useRef<Set<string>>(new Set());

  // Supabase Auth and Data Loading
  useEffect(() => {
    const refreshAndGetSession = async () => {
      try { await supabase.auth.refreshSession(); } catch (e) { }
      const { data: { session } } = await supabase.auth.getSession();
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
        else setIsDataLoaded(true); // Se não há sessão nem demo, terminou de carregar (ficará na tela de login)
      }
    };

    refreshAndGetSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          nick: session.user.user_metadata.username || session.user.user_metadata.full_name || 'Usuário',
          photoUrl: session.user.user_metadata.avatar_url,
          googleAccessToken: session.provider_token
        });
      }
    });

    return () => { subscription.unsubscribe(); };
  }, []);

  // Sync Logic (Fetch)
  useEffect(() => {
    if (!user) { setIsDataLoaded(false); return; }
    
    // Evitar fetch duplo
    if (isDataLoaded) return;

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
            if (parsed.warehouseInventory) setWarehouseInventory(parsed.warehouseInventory || []);
            if (parsed.warehouseEmployees) setWarehouseEmployees(parsed.warehouseEmployees || []);
            if (parsed.warehouseLogs) setWarehouseLogs(parsed.warehouseLogs || []);
            if (parsed.warehouseCategories) setWarehouseCategories(parsed.warehouseCategories || SEED_DATA.warehouse.categories);
          }
        } else {
          const safeFetch = async (query: any, tableName: string) => {
            try {
              const res = await query;
              if (res.error) return { data: null, error: res.error };
              return res;
            } catch (e) {
              return { data: null, error: e };
            }
          };

          const [
            kbCols, kbCards, evts, notes, pts, trans, freight, settings, emailsRes, linksRes, 
            exts, sigs, files, flow, logData, whInv, whEmps, whLogs, whCats, waTemp, waHist, orderAnnRes
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
            safeFetch(supabase.from('warehouse_categories').select('*').eq('user_id', user.id), 'warehouse_categories'),
            safeFetch(supabase.from('whatsapp_templates').select('*').eq('user_id', user.id), 'whatsapp_templates'),
            safeFetch(supabase.from('whatsapp_history').select('*').eq('user_id', user.id).limit(50).order('timestamp', { ascending: false }), 'whatsapp_history'),
            safeFetch(supabase.from('order_annotations').select('*').eq('user_id', user.id).order('date', { ascending: false }), 'order_annotations')
          ]);
          
          const isFirstTimeUser = !settings.data;

          if (kbCols.data && kbCards.data) {
            initializedTables.current.add('kanban_columns'); initializedTables.current.add('kanban_cards');
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
            } else if (isFirstTimeUser) setKanbanData(SEED_DATA.kanban as any);
          }

          if (whInv.data) {
            initializedTables.current.add('warehouse_inventory');
            if (whInv.data.length > 0) {
              setWarehouseInventory(whInv.data.map((i: any) => ({
                id: i.id, code: i.code, name: i.name, category: i.category, consumable: i.consumable ?? false, 
                quantity: i.quantity, minStock: i.min_stock, unit: i.unit, itemsPerContainer: i.items_per_container || 1, 
                lastUpdated: i.last_updated
              })));
            } else if (isFirstTimeUser) setWarehouseInventory(SEED_DATA.warehouse.inventory);
          }

          if (whEmps.data) {
            initializedTables.current.add('warehouse_employees');
            if (whEmps.data.length > 0) setWarehouseEmployees(whEmps.data);
            else if (isFirstTimeUser) setWarehouseEmployees(SEED_DATA.warehouse.employees);
          }

          if (whLogs.data) {
            initializedTables.current.add('warehouse_logs');
            setWarehouseLogs(whLogs.data.map((l: any) => ({
              id: l.id, itemId: l.item_id, type: l.type, quantity: l.quantity, employeeId: l.employee_id || '', 
              employeeName: l.employee_name, note: l.note, date: l.date, itemCode: l.item_code || '', itemName: l.item_name || ''
            })));
          }

          if (whCats.data) {
            initializedTables.current.add('warehouse_categories');
            if (whCats.data.length > 0) setWarehouseCategories(whCats.data);
            else setWarehouseCategories(SEED_DATA.warehouse.categories);
          } else { setWarehouseCategories(SEED_DATA.warehouse.categories); }

          if (freight.data) {
            initializedTables.current.add('logistics');
            if (freight.data.length > 0) {
              setLogisticsData({
                freightTables: freight.data.map((t: any) => ({ id: t.id, name: t.name, fuelPrice: t.fuel_price, avgConsumption: t.avg_consumption, driverPerDieum: t.driver_per_dieum, insuranceRate: t.insurance_rate, updatedAt: t.updated_at || new Date().toISOString() })),
                checklists: logData.data?.checklists || SEED_DATA.logistics.checklists,
                savedRoutes: logData.data?.saved_routes || []
              });
            } else if (isFirstTimeUser) setLogisticsData(SEED_DATA.logistics as any);
          }

          if (trans.data) {
            initializedTables.current.add('financial_transactions');
            if (trans.data.length > 0) setFinancialTransactions(trans.data);
            else if (isFirstTimeUser) setFinancialTransactions(SEED_DATA.financial);
          }

          if (notes.data) {
            initializedTables.current.add('important_notes');
            if (notes.data.length > 0) setImportantNotes(notes.data.map((n: any) => ({ ...n, priority: n.priority || 'normal' })));
            else if (isFirstTimeUser) setImportantNotes(SEED_DATA.notes as any);
          }

          if (waTemp.data) {
            initializedTables.current.add('whatsapp_templates');
            if (waTemp.data.length > 0) setWhatsappTemplates(waTemp.data);
            else if (isFirstTimeUser) setWhatsappTemplates(SEED_DATA.whatsapp.templates);
          }

          if (waHist.data) { initializedTables.current.add('whatsapp_history'); setWhatsappHistory(waHist.data); }

          if (settings.data) {
            initializedTables.current.add('user_settings');
            setCalendarConfig(settings.data.calendar_config || { uf: 'SP', city: 'São Paulo' });
            setHiddenTabs(settings.data.hidden_tabs || []);
            setShiftConfig(settings.data.shift_config);
            setIsSidebarCollapsed(!!settings.data.sidebar_collapsed);
          } else initializedTables.current.add('user_settings');

          if (orderAnnRes && orderAnnRes.data) {
            initializedTables.current.add('order_annotations');
            setOrderAnnotations(orderAnnRes.data.map((o: any) => ({
              id: o.id, orderNumber: o.order_number, type: o.type || 'purchase', requester: o.requester || o.customer_name || '',
              supplier: o.supplier || '', date: o.date, expectedDelivery: o.expected_delivery, items: o.items || [],
              notes: o.notes || '', paymentMethod: o.payment_method || '', status: o.status || 'draft', priority: o.priority || 'normal',
              totalValue: o.total_value || 0, statusHistory: o.status_history || []
            })));
          } else initializedTables.current.add('order_annotations');

          if (evts.data) { initializedTables.current.add('calendar_events'); setCalendarEvents(evts.data); }
          if (pts.data) { initializedTables.current.add('post_its'); setPostIts(pts.data); }
          if (emailsRes.data) { initializedTables.current.add('email_templates'); setEmails(emailsRes.data); }
          if (linksRes.data) {
            initializedTables.current.add('professional_links');
            if (linksRes.data.length > 0) setLinks(linksRes.data.map((l: any) => ({ ...l, customIcon: l.custom_icon })));
            else if (isFirstTimeUser) setLinks(SEED_DATA.links);
          }
          if (exts.data) { initializedTables.current.add('extensions'); setExtensions(exts.data); }
          if (sigs.data) { initializedTables.current.add('signatures'); setSignatures(sigs.data.map((s: any) => ({ ...s, dataUrl: s.data_url }))); }
          if (files.data) { initializedTables.current.add('personal_files'); setPersonalFiles(files.data); }
          if (flow.data) { initializedTables.current.add('flow_builder_states'); setFlowData(flow.data.payload || initialFlow); }
        }
      } catch (err) { console.error('Error loading data', err); }
      finally { setIsSyncing(false); setIsDataLoaded(true); }
    };

    fetchData();
  }, [user?.id]); // Removido isDataLoaded das dependências para evitar reload infinito

  // Data Save Effect
  useEffect(() => {
    if (!user || !isDataLoaded) return;
    const saveData = async () => {
      if (user.id === 'demo_user_id') {
        const payload = { kanban: kanbanData, flow: flowData, calendarConfig, calendarEvents, emails, links, extensions, postIts, importantNotes, shiftHandoffs, shiftConfig, signatures, personalFiles, logistics: logisticsData, hiddenTabs, financialTransactions, warehouseInventory, warehouseLogs };
        localStorage.setItem('ysoffice_demo_data', JSON.stringify(payload));
        setHasUnsavedChanges(false);
        setIsSyncing(false);
        return;
      }

      try {
        const kanbanCols = kanbanData.columns.map((col, idx) => ({ id: col.id, user_id: user.id, title: col.title, color: col.color, order: idx }));
        const kanbanCards = kanbanData.columns.flatMap(col => col.cards.map((card, idx) => ({ 
            id: card.id, user_id: user.id, column_id: col.id, order: idx, title: card.title, description: card.description || '', priority: card.priority || 'medium', due_date: card.dueDate, labels: card.labels || [], created_at: card.createdAt || new Date().toISOString()
        })));

        const safeSave = async (query: any, tableName: string) => {
          try {
            const res = await query;
            return res;
          } catch (e) {
            console.error(tableName, e);
          }
        };

        const logisticsFreightToSave = logisticsData.freightTables.map(t => ({
          id: t.id, user_id: user.id, name: t.name, fuel_price: t.fuelPrice, avg_consumption: t.avgConsumption, driver_per_dieum: t.driverPerDieum, insurance_rate: t.insuranceRate, updated_at: t.updatedAt
        }));

        const syncTableData = async (tableName: string, currentData: any[], initKey: string = tableName) => {
          if (!initializedTables.current.has(initKey)) return;
          try {
            const currentIds = currentData.map(item => item.id).filter(Boolean);
            if (currentIds.length > 0) {
              const { data: existing } = await supabase.from(tableName).select('id').eq('user_id', user.id);
              if (existing) {
                const idsToDelete = existing.map(r => r.id).filter(id => !currentIds.includes(id));
                if (idsToDelete.length > 0) await supabase.from(tableName).delete().in('id', idsToDelete);
              }
              await safeSave(supabase.from(tableName).upsert(currentData), tableName);
            } else {
              await supabase.from(tableName).delete().eq('user_id', user.id);
            }
          } catch (e) {}
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
          syncTableData('warehouse_categories', warehouseCategories.map(c => ({ id: c.id, user_id: user.id, name: c.name, color: c.color }))),
          syncTableData('whatsapp_templates', whatsappTemplates.map(t => ({ id: t.id, user_id: user.id, title: t.title, content: t.content }))),
          syncTableData('whatsapp_history', whatsappHistory.map(h => ({ id: h.id, user_id: user.id, name: h.name, phone: h.phone, message: h.message, method: h.method, timestamp: h.timestamp }))),
          syncTableData('logistics_freight_tables', logisticsFreightToSave, 'logistics'),
          
          initializedTables.current.has('user_settings') && safeSave(supabase.from('user_settings').upsert({ user_id: user.id, calendar_config: calendarConfig, hidden_tabs: hiddenTabs, shift_config: shiftConfig, sidebar_collapsed: isSidebarCollapsed, updated_at: new Date().toISOString() }), 'user_settings'),
          initializedTables.current.has('flow_builder_states') && safeSave(supabase.from('flow_builder_states').upsert({ user_id: user.id, payload: flowData }), 'flow_builder_states'),
          initializedTables.current.has('logistics') && safeSave(supabase.from('logistics_data').upsert({ user_id: user.id, checklists: logisticsData.checklists, saved_routes: logisticsData.savedRoutes }), 'logistics_data'),
          initializedTables.current.has('order_annotations') && safeSave(supabase.from('order_annotations').upsert(
            orderAnnotations.map(o => ({
              id: o.id, user_id: user.id, order_number: o.orderNumber, type: o.type, requester: o.requester, customer_name: o.requester,
              supplier: o.supplier, date: o.date, expected_delivery: o.expectedDelivery || null, items: o.items, notes: o.notes || null,
              payment_method: o.paymentMethod || null, status: o.status, priority: o.priority, total_value: o.totalValue || 0, status_history: o.statusHistory || []
            }))
          ), 'order_annotations')
        ].filter(Boolean));
      } catch (err) {} finally { 
        setIsSyncing(false); 
        setHasUnsavedChanges(false);
        setLastSavedAt(new Date().toLocaleTimeString('pt-BR'));
      }
    };

    const timeout = setTimeout(() => {
        if (!isDataLoaded || !hasUnsavedChanges) return;
        setIsSyncing(true);
        saveData();
    }, 2000);
    return () => clearTimeout(timeout);
  }, [flowData, calendarConfig, calendarEvents, emails, links, extensions, postIts, importantNotes, shiftHandoffs, shiftConfig, signatures, personalFiles, logisticsData, hiddenTabs, user, isDataLoaded, financialTransactions, warehouseInventory, warehouseEmployees, warehouseLogs, warehouseCategories, whatsappTemplates, whatsappHistory, kanbanData, isSidebarCollapsed, orderAnnotations]);

  const handleLogout = async () => {
    if (user?.id !== 'demo_user_id') await supabase.auth.signOut();
    localStorage.removeItem('ysoffice_demo_session');
    setUser(null);
    setIsDataLoaded(false);
  };

  const contextValue = {
    user, setUser, isDataLoaded, isSyncing, hasUnsavedChanges, setHasUnsavedChanges,
    lastSavedAt, hiddenTabs, setHiddenTabs, isSidebarCollapsed, setIsSidebarCollapsed,
    isDark, setIsDark, companySettings, saveCompanySettings, flowData, setFlowData,
    calendarConfig, setCalendarConfig, calendarEvents, setCalendarEvents, emails, setEmails,
    links, setLinks, extensions, setExtensions, postIts, setPostIts, importantNotes, setImportantNotes,
    shiftHandoffs, setShiftHandoffs, shiftConfig, setShiftConfig, signatures, setSignatures,
    personalFiles, setPersonalFiles, driveFiles, setDriveFiles, logisticsData, setLogisticsData,
    financialTransactions, setFinancialTransactions, warehouseInventory, setWarehouseInventory,
    warehouseEmployees, setWarehouseEmployees, warehouseLogs, setWarehouseLogs,
    warehouseCategories, setWarehouseCategories, whatsappTemplates, setWhatsappTemplates,
    whatsappHistory, setWhatsappHistory, kanbanData, setKanbanData, orderAnnotations, setOrderAnnotations,
    handleLogout
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
