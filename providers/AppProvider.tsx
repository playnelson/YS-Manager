'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { SEED_DATA } from '@/seeds';
import {
  AppData, FlowState, EmailTemplate, User, ProfessionalLink, PostIt,
  CalendarConfig, Extension, UserEvent, ImportantNote, ShiftConfig,
  Signature, ShiftHandoff, StoredFile, LogisticsState, KanbanState,
  KanbanPriority, NotePriority, OrderAnnotation, PurchasedMaterialLink
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
  const [purchasedMaterialLinks, setPurchasedMaterialLinks] = useState<PurchasedMaterialLink[]>([]);

  const initializedTables = useRef<Set<string>>(new Set());
  const lastLoadedUserId = useRef<string | null>(null);

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
        if (demoSession) {
          setUser(JSON.parse(demoSession));
        } else {
          setIsDataLoaded(true);
        }
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
      } else {
        setUser(null);
        setIsDataLoaded(false);
      }
    });

    return () => { subscription.unsubscribe(); };
  }, []);

  // Sync Logic (Fetch)
  useEffect(() => {
    if (!user) {
      lastLoadedUserId.current = null;
      initializedTables.current.clear();
      setIsDataLoaded(false); 
      return; 
    }
    
    if (lastLoadedUserId.current === user.id) {
      setIsDataLoaded(true);
      return;
    }

    const fetchData = async () => {
      setIsSyncing(true);
      setIsDataLoaded(false); // Reset while loading new user
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
            if (parsed.orderAnnotations) setOrderAnnotations(parsed.orderAnnotations || []);
            if (parsed.purchasedMaterialLinks) setPurchasedMaterialLinks(parsed.purchasedMaterialLinks || []);
          }
        } else {
          const safeFetch = async (query: any, tableName: string) => {
            try {
              const res = await query;
              if (res.error) {
                console.warn(`Fetch warning for ${tableName}:`, res.error);
                return { data: null, error: res.error };
              }
              return res;
            } catch (e) {
              console.error(`Fetch crash for ${tableName}:`, e);
              return { data: null, error: e };
            }
          };

          const [
            kbCols, kbCards, evts, notes, pts, trans, freight, settings, emailsRes, linksRes, 
            exts, sigs, files, flow, logData, whInv, whEmps, whLogs, whCats, waTemp, waHist, orderAnnRes, pmlRes
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
            safeFetch(supabase.from('order_annotations').select('*').eq('user_id', user.id).order('date', { ascending: false }), 'order_annotations'),
            safeFetch(supabase.from('purchased_material_links').select('*').eq('user_id', user.id).order('created_at', { ascending: false }), 'purchased_material_links')
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
                id: i.id, 
                itemId: i.id, // Adicionado para compatibilidade com componentes
                code: i.code, 
                name: i.name, 
                category: i.category, 
                consumable: i.consumable ?? false, 
                quantity: parseFloat(i.quantity) || 0, 
                minStock: parseFloat(i.min_stock) || 0, 
                unit: i.unit, 
                itemsPerContainer: parseFloat(i.items_per_container) || 1, 
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
              id: l.id, 
              itemId: l.item_id || l.id, 
              type: l.type, 
              quantity: parseFloat(l.quantity) || 0, 
              employeeId: l.employee_id || '', 
              employeeName: l.employee_name, 
              note: l.note, 
              date: l.date, 
              itemCode: l.item_code || '', 
              itemName: l.item_name || ''
            })));
          }

          if (whCats.data) {
            initializedTables.current.add('warehouse_categories');
            if (whCats.data.length > 0) setWarehouseCategories(whCats.data);
            else setWarehouseCategories(SEED_DATA.warehouse.categories);
          }

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
              totalValue: o.total_value || 0, statusHistory: o.status_history || [],
              deletedAt: o.deleted_at, archived: o.archived || false
            })));
          } else initializedTables.current.add('order_annotations');

          if (pmlRes && pmlRes.data) {
            initializedTables.current.add('purchased_material_links');
            setPurchasedMaterialLinks(pmlRes.data.map((p: any) => ({
              id: p.id, name: p.name, url: p.url, category: p.category, notes: p.notes, createdAt: p.created_at
            })));
          } else initializedTables.current.add('purchased_material_links');

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
 
        lastLoadedUserId.current = user.id;
        setHasUnsavedChanges(false);
        console.log("Environment loaded for user:", user.id);
      } catch (err) { 
        console.error('Error loading data', err); 
        lastLoadedUserId.current = user.id; // Still set to prevent infinite retry loops
      } finally { 
        setIsSyncing(false); 
        setIsDataLoaded(true); 
      }
    };
 
    fetchData();
  }, [user?.id]);

  // Shared sync utility (Safe Version)
  const syncTableData = async (tableName: string, currentData: any[], initKey: string = tableName) => {
    if (!user || !isDataLoaded || !initializedTables.current.has(initKey)) return;
    
    try {
      const currentIds = currentData.map(item => item.id).filter(Boolean);
      
      // Get existing IDs to perform a proper diff (Delete only what was removed)
      const { data: existing, error: fetchErr } = await supabase.from(tableName).select('id').eq('user_id', user.id);
      
      if (fetchErr) {
        console.warn(`Sync fetch error for ${tableName}:`, fetchErr);
        return; // Don't proceed with deletion if we can't fetch current state
      }

      if (existing) {
        const idsToDelete = existing.map(r => r.id).filter(id => !currentIds.includes(id));
        if (idsToDelete.length > 0) {
          await supabase.from(tableName).delete().in('id', idsToDelete);
        }
      }

      if (currentData.length > 0) {
        const { error: upsertErr } = await supabase.from(tableName).upsert(currentData);
        if (upsertErr) console.error(`Sync upsert error for ${tableName}:`, upsertErr);
      }
    } catch (e) {
      console.error(`Fatal sync error for ${tableName}:`, e);
    }
  };

  const safeSave = async (query: any, tableName: string) => {
    try {
      const res = await query;
      if (res.error) console.error(`Save error for ${tableName}:`, res.error);
      return res;
    } catch (e) {
      console.error(`Save crash for ${tableName}:`, e);
    }
  };

  // individual debounced effect for general settings
  useEffect(() => {
    if (!user || !isDataLoaded || !initializedTables.current.has('user_settings')) return;
    const timeout = setTimeout(() => {
      setIsSyncing(true);
      safeSave(supabase.from('user_settings').upsert({
        user_id: user.id, calendar_config: calendarConfig, hidden_tabs: hiddenTabs,
        shift_config: shiftConfig, sidebar_collapsed: isSidebarCollapsed, updated_at: new Date().toISOString()
      }), 'user_settings').finally(() => setIsSyncing(false));
    }, 2000);
    return () => clearTimeout(timeout);
  }, [calendarConfig, hiddenTabs, shiftConfig, isSidebarCollapsed]);

  // Warehouse Sync
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (hasUnsavedChanges) {
        setIsSyncing(true);
        Promise.all([
          syncTableData('warehouse_inventory', warehouseInventory.map(i => ({ id: i.id, user_id: user.id, code: i.code, name: i.name, category: i.category, quantity: i.quantity, min_stock: i.minStock, unit: i.unit, consumable: i.consumable, items_per_container: i.itemsPerContainer || 1, last_updated: i.lastUpdated }))),
          syncTableData('warehouse_employees', warehouseEmployees.map(e => ({ id: e.id, user_id: user.id, name: e.name, role: e.role, department: e.department, active: e.active, cpf: e.cpf }))),
          syncTableData('warehouse_logs', warehouseLogs.map(l => ({ id: l.id, user_id: user.id, item_id: l.itemId, item_code: l.itemCode, item_name: l.itemName, type: l.type, quantity: l.quantity, employee_id: l.employeeId || null, employee_name: l.employeeName, note: l.note, date: l.date }))),
          syncTableData('warehouse_categories', warehouseCategories.map(c => ({ id: c.id, user_id: user.id, name: c.name, color: c.color })))
        ]).finally(() => { 
          setIsSyncing(false); 
          setHasUnsavedChanges(false); 
          setLastSavedAt(new Date().toLocaleTimeString('pt-BR'));
        });
      }
    }, 3000);
    return () => clearTimeout(timeout);
  }, [warehouseInventory, warehouseEmployees, warehouseLogs, warehouseCategories]);

  // Kanban & Flow Sync
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (hasUnsavedChanges) {
        setIsSyncing(true);
        const kanbanCols = kanbanData.columns.map((col, idx) => ({ id: col.id, user_id: user.id, title: col.title, color: col.color, order: idx }));
        const kanbanCards = kanbanData.columns.flatMap(col => col.cards.map((card, idx) => ({ 
            id: card.id, user_id: user.id, column_id: col.id, order: idx, title: card.title, description: card.description || '', priority: card.priority || 'medium', due_date: card.dueDate, labels: card.labels || [], created_at: card.createdAt || new Date().toISOString()
        })));

        Promise.all([
          syncTableData('kanban_columns', kanbanCols),
          syncTableData('kanban_cards', kanbanCards),
          syncTableData('flow_builder_states', [{ user_id: user.id, payload: flowData }], 'flow_builder_states')
        ]).finally(() => { 
          setIsSyncing(false); 
          setHasUnsavedChanges(false);
          setLastSavedAt(new Date().toLocaleTimeString('pt-BR'));
        });
      }
    }, 4000);
    return () => clearTimeout(timeout);
  }, [kanbanData, flowData]);

  // Logistics & Finance Sync
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!user || !isDataLoaded || !hasUnsavedChanges) return;
      setIsSyncing(true);
      const logisticsFreightToSave = logisticsData.freightTables.map(t => ({
        id: t.id, user_id: user.id, name: t.name, fuel_price: t.fuelPrice, avg_consumption: t.avgConsumption, driver_per_dieum: t.driverPerDieum, insurance_rate: t.insuranceRate, updated_at: t.updatedAt
      }));
      Promise.all([
        syncTableData('financial_transactions', financialTransactions.map(t => ({ id: t.id, user_id: user.id, description: t.description, amount: t.amount, type: t.type, category: t.category, date: t.date }))),
        syncTableData('logistics_freight_tables', logisticsFreightToSave, 'logistics'),
        initializedTables.current.has('logistics') && safeSave(supabase.from('logistics_data').upsert({ user_id: user.id, checklists: logisticsData.checklists, saved_routes: logisticsData.savedRoutes }), 'logistics_data')
      ]).finally(() => { 
        setIsSyncing(false); 
        setHasUnsavedChanges(false);
        setLastSavedAt(new Date().toLocaleTimeString('pt-BR'));
      });
    }, 6000);
    return () => clearTimeout(timeout);
  }, [financialTransactions, logisticsData]);

  // Communication & Files Sync
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!user || !isDataLoaded || !hasUnsavedChanges) return;
      setIsSyncing(true);
      Promise.all([
        syncTableData('email_templates', emails.map(e => ({ id: e.id, user_id: user.id, name: e.name, category: e.category, subject: e.subject, body: e.body, to: e.to, cc: e.cc, saved_at: e.savedAt }))),
        syncTableData('extensions', extensions.map(e => ({ id: e.id, user_id: user.id, name: e.name, department: e.department, number: e.number, notes: e.notes }))),
        syncTableData('signatures', signatures.map(s => ({ id: s.id, user_id: user.id, name: s.name, data_url: s.dataUrl, created_at: s.createdAt }))),
        syncTableData('personal_files', personalFiles.map(f => ({ id: f.id, user_id: user.id, name: f.name, type: f.type, size: f.size, data: f.data, category: f.category, uploaded_at: f.uploadedAt }))),
        syncTableData('whatsapp_templates', whatsappTemplates.map(t => ({ id: t.id, user_id: user.id, title: t.title, content: t.content })))
      ]).finally(() => { 
        setIsSyncing(false); 
        setHasUnsavedChanges(false);
        setLastSavedAt(new Date().toLocaleTimeString('pt-BR'));
      });
    }, 7000);
    return () => clearTimeout(timeout);
  }, [emails, extensions, signatures, personalFiles, whatsappTemplates]);

  // Others & Documents Sync
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!user || !isDataLoaded || !hasUnsavedChanges) return;
      setIsSyncing(true);
      Promise.all([
        syncTableData('calendar_events', calendarEvents.map(e => ({ id: e.id, user_id: user.id, date: e.date, title: e.title, type: e.type, description: e.description }))),
        syncTableData('important_notes', importantNotes.map(n => ({ id: n.id, user_id: user.id, title: n.title, content: n.content, category: n.category, priority: n.priority, updated_at: n.updatedAt }))),
        syncTableData('post_its', postIts.map(p => ({ id: p.id, user_id: user.id, text: p.text, color: p.color, rotation: p.rotation }))),
        syncTableData('professional_links', links.map(l => ({ id: l.id, user_id: user.id, title: l.title, url: l.url, category: l.category, custom_icon: l.customIcon }))),
        syncTableData('order_annotations', orderAnnotations.map(o => ({ id: o.id, user_id: user.id, order_number: o.orderNumber, type: o.type, requester: o.requester, date: o.date, items: o.items, status: o.status }))),
        syncTableData('purchased_material_links', purchasedMaterialLinks.map(p => ({ id: p.id, user_id: user.id, name: p.name, url: p.url, category: p.category, created_at: p.createdAt })))
      ]).finally(() => { 
        setIsSyncing(false); 
        setHasUnsavedChanges(false); 
        setLastSavedAt(new Date().toLocaleTimeString('pt-BR'));
      });
    }, 8000);
    return () => clearTimeout(timeout);
  }, [calendarEvents, importantNotes, postIts, links, orderAnnotations, purchasedMaterialLinks]);

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
    purchasedMaterialLinks, setPurchasedMaterialLinks,
    handleLogout
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
