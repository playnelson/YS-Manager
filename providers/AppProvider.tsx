'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { SEED_DATA } from '@/seeds';
import { generateUUID } from '../uuid';
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
  const [dirtyTables, setDirtyTables] = useState<Set<string>>(new Set());

  const markDirty = (tableName: string) => {
    // Permitir marcar como dirty mesmo se não estiver carregado se for uma operação crítica,
    // mas em geral queremos evitar loops durante o fetch inicial.
    if (!isDataLoaded && !initializedTables.current.has(tableName)) return;
    
    setDirtyTables(prev => {
      const next = new Set(prev);
      if (next.has(tableName)) return prev; // Evita re-render se já estiver lá
      next.add(tableName);
      return next;
    });
    setHasUnsavedChanges(true);
  };

  const SYSTEM_UUID = '00000000-0000-0000-0000-000000000000';

  // UI State
  const [hiddenTabs, setHiddenTabs] = useState<string[]>(['warehouse', 'brasil-hub']);
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
        // Limpar qualquer resquício de sessão demo se o usuário estiver realmente logado
        localStorage.removeItem('ysoffice_demo_session');
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
        const demoSession = localStorage.getItem('ysoffice_demo_session');
        if (demoSession) {
           setUser(JSON.parse(demoSession));
        } else {
           setUser(null);
           setIsDataLoaded(false);
        }
      }
    });

    // Proteção contra saída acidental com alterações pendentes
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges || isSyncing) {
        e.preventDefault();
        e.returnValue = 'Você tem alterações que ainda não foram salvas. Deseja realmente sair?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => { 
      subscription.unsubscribe(); 
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, isSyncing]);

  // Sync Logic (Fetch)
  useEffect(() => {
    if (!user) {
      lastLoadedUserId.current = null;
      initializedTables.current.clear();
      setIsDataLoaded(false); 
      return; 
    }
    
    // Force clean data fetch on each user identification
    console.log("IDENTIDADE_YURI: User ID:", user.id);
    
    const fetchData = async () => {
      setIsSyncing(true);
      setIsDataLoaded(false);
      console.log("SINC_YURI: Iniciando fetch para", user.id);
      try {
        if (user.id === 'demo_user_id') {
          // Initialize all tables as ready for demo mode
          const allTables = [
            'kanban_columns', 'kanban_cards', 'calendar_events', 'important_notes', 'post_its',
            'financial_transactions', 'logistics', 'user_settings', 'email_templates',
            'professional_links', 'extensions', 'signatures', 'personal_files',
            'flow_builder_states', 'warehouse_inventory', 'warehouse_employees',
            'warehouse_logs', 'warehouse_categories', 'whatsapp_templates',
            'whatsapp_history', 'order_annotations', 'purchased_material_links'
          ];
          allTables.forEach(t => initializedTables.current.add(t));

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
          
          const isFirstTimeUser = !settings.data && whInv.data?.length === 0;

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
                id: i.id || generateUUID(), 
                itemId: i.id || generateUUID(), 
                code: i.code || 'MAT-???', 
                name: i.name || 'Sem nome', 
                category: i.category || 'Geral', 
                consumable: !!i.consumable, 
                quantity: parseFloat(i.quantity) || 0, 
                minStock: parseFloat(i.min_stock) || 0, 
                unit: i.unit || 'Unid.', 
                itemsPerContainer: parseFloat(i.items_per_container) || 1, 
                lastUpdated: i.last_updated || new Date().toISOString(),
                location: i.location || ''
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
        return false; // Don't proceed with deletion if we can't fetch current state
      }

      if (existing) {
        const idsToDelete = existing.map(r => r.id).filter(id => !currentIds.includes(id));
        if (idsToDelete.length > 0) {
          await supabase.from(tableName).delete().in('id', idsToDelete);
        }
      }

      if (currentData.length > 0) {
        const { error: upsertErr } = await supabase.from(tableName).upsert(currentData);
        if (upsertErr) {
          console.error(`Sync upsert error for ${tableName}:`, upsertErr);
          return false;
        }
      }
      return true;
    } catch (e) {
      console.error(`Fatal sync error for ${tableName}:`, e);
      return false;
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


  // ── MOTOR DE SINCRONIZAÇÃO CENTRALIZADO ──────────────────────────────────
  useEffect(() => {
    if (!user || !isDataLoaded || dirtyTables.size === 0) return;

    const timeout = setTimeout(async () => {
      setIsSyncing(true);
      const tablesToSave = Array.from(dirtyTables);
      console.log("MOTOR_SYNC: Salvando tabelas sujas:", tablesToSave);

      try {
        // Real user: sync to Supabase
        if (user.id !== 'demo_user_id') {
          // Ordenar tabelas para respeitar Chaves Estrangeiras (Inventory -> Logs)
          const priorityTables = ['warehouse_inventory', 'warehouse_employees', 'kanban_columns'];
          const otherTables = tablesToSave.filter(t => !priorityTables.includes(t));
          
          const savedTables: string[] = [];
          
          // 1. Salvar tabelas de prioridade primeiro (sequencialmente ou em um lote controlado)
          for (const table of priorityTables) {
            if (tablesToSave.includes(table)) {
              const success = await processTableSave(table);
              if (success) savedTables.push(table);
            }
          }

          // 2. Salvar o resto concorrentemente
          const otherResults = await Promise.all(otherTables.map(async (table) => {
            const success = await processTableSave(table);
            return success ? table : null;
          }));
          otherResults.forEach(t => { if (t) savedTables.push(t); });

          setDirtyTables(prev => {
            const next = new Set(prev);
            savedTables.forEach(t => next.delete(t));
            return next;
          });

          setHasUnsavedChanges(prev => {
            const currentDirty = Array.from(dirtyTables);
            return currentDirty.some(t => !savedTables.includes(t));
          });
        } else {
          // Demo user: sync to localStorage
          localStorage.setItem('ysoffice_demo_data', JSON.stringify({
            flow: flowData, calendarConfig, calendarEvents, emails, links, extensions, postIts, 
            importantNotes, shiftHandoffs, shiftConfig, signatures, personalFiles, 
            logistics: logisticsData, hiddenTabs, kanban: kanbanData, 
            financialTransactions, warehouseInventory, warehouseEmployees, 
            warehouseLogs, warehouseCategories, orderAnnotations, purchasedMaterialLinks
          }));

          setDirtyTables(prev => {
            const next = new Set(prev);
            tablesToSave.forEach(t => next.delete(t));
            return next;
          });
          setHasUnsavedChanges(false);
        }

        setLastSavedAt(new Date().toLocaleTimeString('pt-BR'));
      } catch (err) {
        console.error("MOTOR_SYNC: Erro fatal na sincronização:", err);
      } finally {
        setIsSyncing(false);
      }
    }, 1000);

    async function processTableSave(table: string) {
      let dataToSave: any[] = [];
      
      switch (table) {
        case 'warehouse_inventory':
          dataToSave = warehouseInventory.map(i => ({ 
            id: i.id, user_id: user.id, code: i.code, name: i.name, 
            category: i.category, quantity: i.quantity, min_stock: i.minStock, 
            unit: i.unit, consumable: i.consumable, 
            items_per_container: i.itemsPerContainer || 1, 
            last_updated: i.lastUpdated,
            location: i.location || ''
          }));
          break;
        case 'warehouse_employees':
          dataToSave = warehouseEmployees.map(e => ({ id: e.id, user_id: user.id, name: e.name, role: e.role, department: e.department, active: e.active, cpf: e.cpf }));
          break;
        case 'warehouse_logs':
          dataToSave = warehouseLogs.map(l => ({ id: l.id, user_id: user.id, item_id: l.itemId, item_code: l.itemCode, item_name: l.itemName, type: l.type, quantity: l.quantity, employee_id: (l.employeeId === 'system' || !l.employeeId) ? SYSTEM_UUID : l.employeeId, employee_name: l.employeeName || 'Sistema', note: l.note, date: l.date }));
          break;
        case 'user_settings':
          await supabase.from('user_settings').upsert({ user_id: user.id, calendar_config: calendarConfig, hidden_tabs: hiddenTabs, shift_config: shiftConfig, updated_at: new Date().toISOString() });
          return; 
        case 'kanban_columns':
          dataToSave = kanbanData.columns.map((col, idx) => ({ id: col.id, user_id: user.id, title: col.title, color: col.color, order: idx }));
          break;
        case 'kanban_cards':
          dataToSave = kanbanData.columns.flatMap(col => col.cards.map((card, idx) => ({ id: card.id, user_id: user.id, column_id: col.id, order: idx, title: card.title, description: card.description || '', priority: card.priority || 'medium', due_date: card.dueDate, labels: card.labels || [], created_at: card.createdAt || new Date().toISOString() })));
          break;
        case 'calendar_events':
          dataToSave = calendarEvents.map(e => ({ id: e.id, user_id: user.id, date: e.date, title: e.title, type: e.type, description: e.description }));
          break;
        case 'financial_transactions':
          dataToSave = financialTransactions.map(t => ({ id: t.id, user_id: user.id, description: t.description, amount: t.amount, type: t.type, category: t.category, date: t.date }));
          break;
        case 'logistics_freight_tables':
          dataToSave = logisticsData.freightTables.map(t => ({ id: t.id, user_id: user.id, name: t.name, fuel_price: t.fuelPrice, avg_consumption: t.avgConsumption, driver_per_dieum: t.driverPerDieum, insurance_rate: t.insuranceRate, updated_at: t.updatedAt }));
          break;
        case 'email_templates':
          dataToSave = emails.map(e => ({ id: e.id, user_id: user.id, name: e.name, category: e.category, subject: e.subject, body: e.body, to: e.to, cc: e.cc, saved_at: e.savedAt }));
          break;
        case 'extensions':
          dataToSave = extensions.map(e => ({ id: e.id, user_id: user.id, name: e.name, department: e.department, number: e.number, notes: e.notes }));
          break;
        case 'signatures':
          dataToSave = signatures.map(s => ({ id: s.id, user_id: user.id, name: s.name, data_url: s.dataUrl, created_at: s.createdAt }));
          break;
        case 'personal_files':
          dataToSave = personalFiles.map(f => ({ id: f.id, user_id: user.id, name: f.name, type: f.type, size: f.size, data: f.data, category: f.category, uploaded_at: f.uploadedAt }));
          break;
        case 'whatsapp_templates':
          dataToSave = whatsappTemplates.map(t => ({ id: t.id, user_id: user.id, title: t.title, content: t.content }));
          break;
        case 'important_notes':
          dataToSave = importantNotes.map(n => ({ id: n.id, user_id: user.id, title: n.title, content: n.content, category: n.category, priority: n.priority, updated_at: n.updatedAt }));
          break;
        case 'post_its':
          dataToSave = postIts.map(p => ({ id: p.id, user_id: user.id, text: p.text, color: p.color, rotation: p.rotation }));
          break;
        case 'professional_links':
          dataToSave = links.map(l => ({ id: l.id, user_id: user.id, title: l.title, url: l.url, category: l.category, custom_icon: l.customIcon }));
          break;
         case 'order_annotations':
          dataToSave = orderAnnotations.map(o => ({ 
            id: o.id, user_id: user.id, customer_name: o.requester, 
            order_number: o.orderNumber, type: o.type, 
            requester: o.requester, supplier: o.supplier, date: o.date, 
            expected_delivery: o.expectedDelivery, items: o.items, notes: o.notes, 
            payment_method: o.paymentMethod, status: o.status, priority: o.priority,
            total_value: o.totalValue, status_history: o.statusHistory,
            deleted_at: o.deletedAt, archived: !!o.archived
          }));
          break;
        case 'purchased_material_links':
          dataToSave = purchasedMaterialLinks.map(p => ({ 
            id: p.id, user_id: user.id, name: p.name, url: p.url, 
            category: p.category, notes: p.notes, created_at: p.createdAt 
          }));
          break;
        case 'flow_builder_states':
          await supabase.from('flow_builder_states').upsert({ user_id: user.id, payload: flowData });
          return;
        case 'logistics_data':
          await supabase.from('logistics_data').upsert({ user_id: user.id, checklists: logisticsData.checklists, saved_routes: logisticsData.savedRoutes });
          return;
        case 'warehouse_categories':
          dataToSave = warehouseCategories.map(c => ({ id: c.id, user_id: user.id, name: c.name, color: c.color }));
          break;
      }

      if (dataToSave.length > 0) {
         return await syncTableData(table, dataToSave);
      }
      return true; // Nada a salvar conta como sucesso
    }

    return () => clearTimeout(timeout);
  }, [
    dirtyTables, warehouseInventory, warehouseEmployees, warehouseLogs, 
    calendarConfig, hiddenTabs, shiftConfig,
    kanbanData, calendarEvents, financialTransactions, logisticsData,
    emails, extensions, signatures, personalFiles, whatsappTemplates,
    importantNotes, postIts, links, orderAnnotations, purchasedMaterialLinks,
    flowData, warehouseCategories
  ]);


  // ── GATILHOS DE SUJEIRA (AUTO-DIRTY) ─────────────────────────────────────
  useEffect(() => markDirty('warehouse_inventory'), [warehouseInventory]);
  useEffect(() => markDirty('warehouse_employees'), [warehouseEmployees]);
  useEffect(() => markDirty('warehouse_logs'), [warehouseLogs]);
  useEffect(() => markDirty('warehouse_categories'), [warehouseCategories]);
  useEffect(() => markDirty('kanban_columns'), [kanbanData.columns]);
  useEffect(() => markDirty('kanban_cards'), [kanbanData.columns]); // Mapeado no motor
  useEffect(() => markDirty('calendar_events'), [calendarEvents]);
  useEffect(() => markDirty('financial_transactions'), [financialTransactions]);
  useEffect(() => markDirty('logistics_freight_tables'), [logisticsData.freightTables]);
  useEffect(() => markDirty('logistics_data'), [logisticsData.checklists, logisticsData.savedRoutes]);
  useEffect(() => markDirty('email_templates'), [emails]);
  useEffect(() => markDirty('extensions'), [extensions]);
  useEffect(() => markDirty('signatures'), [signatures]);
  useEffect(() => markDirty('personal_files'), [personalFiles]);
  useEffect(() => markDirty('whatsapp_templates'), [whatsappTemplates]);
  useEffect(() => markDirty('important_notes'), [importantNotes]);
  useEffect(() => markDirty('post_its'), [postIts]);
  useEffect(() => markDirty('professional_links'), [links]);
  useEffect(() => markDirty('order_annotations'), [orderAnnotations]);
  useEffect(() => markDirty('purchased_material_links'), [purchasedMaterialLinks]);
  useEffect(() => markDirty('flow_builder_states'), [flowData]);
  useEffect(() => markDirty('user_settings'), [calendarConfig, hiddenTabs, shiftConfig]);

  const handleLogout = async () => {
    if (user?.id !== 'demo_user_id') await supabase.auth.signOut();
    localStorage.removeItem('ysoffice_demo_session');
    setUser(null);
    setIsDataLoaded(false);
  };

  const contextValue = {
    user, setUser, isDataLoaded, isSyncing, hasUnsavedChanges, setHasUnsavedChanges,
    lastSavedAt, hiddenTabs, setHiddenTabs,
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
    handleLogout,
    markDirty
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
