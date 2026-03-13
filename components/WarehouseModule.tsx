
import React, { useState, useRef } from 'react';
import {
  Package, Plus, Search, AlertTriangle, History, ArrowUpRight, ArrowDownLeft,
  Trash2, Archive, Box, Download, Upload, Users, X, Check, FileSpreadsheet,
  UserPlus
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface InventoryItem {
  id: string;
  code: string;         // MAT-001
  name: string;         // Descrição
  category: string;     // Categoria
  consumable: boolean;  // Consumível?
  quantity: number;     // Qtd. Atual
  minStock: number;     // Qtd. Mínima
  unit: string;         // Unidade
  lastUpdated: string;
}

interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  active: boolean;
}

interface StockLog {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  type: 'entry' | 'exit';
  quantity: number;
  date: string;
  employeeId: string;
  employeeName: string;
  note?: string;
}

// ── Default data (from spreadsheet image) ───────────────────────────────────

const DEFAULT_INVENTORY: InventoryItem[] = [
  { id:'1',  code:'MAT-001', name:'Bota de Segurança Nº 42',                  category:'EPI',       consumable:false, quantity:10, minStock:0, unit:'Par',   lastUpdated:new Date().toISOString() },
  { id:'2',  code:'MAT-002', name:'Perneira Bidim com Fivela',                 category:'EPI',       consumable:false, quantity:30, minStock:0, unit:'Par',   lastUpdated:new Date().toISOString() },
  { id:'3',  code:'MAT-003', name:'Capacete Azul',                             category:'EPI',       consumable:false, quantity:33, minStock:0, unit:'Unid.', lastUpdated:new Date().toISOString() },
  { id:'4',  code:'MAT-004', name:'Óculos de Segurança Lente Escura',          category:'EPI',       consumable:false, quantity:48, minStock:0, unit:'Unid.', lastUpdated:new Date().toISOString() },
  { id:'5',  code:'MAT-005', name:'Óculos de Segurança Lente Incolor',         category:'EPI',       consumable:false, quantity:36, minStock:0, unit:'Unid.', lastUpdated:new Date().toISOString() },
  { id:'6',  code:'MAT-006', name:'Óculos de Segurança Incolor (Sobrepor)',    category:'EPI',       consumable:false, quantity:12, minStock:0, unit:'Unid.', lastUpdated:new Date().toISOString() },
  { id:'7',  code:'MAT-007', name:'Luva de Vaqueta Cano Longo',                category:'EPI',       consumable:true,  quantity:40, minStock:0, unit:'Par',   lastUpdated:new Date().toISOString() },
  { id:'8',  code:'MAT-008', name:'Luva de Impacto',                           category:'EPI',       consumable:true,  quantity:29, minStock:0, unit:'Par',   lastUpdated:new Date().toISOString() },
  { id:'9',  code:'MAT-009', name:'Luva Vibraflex',                            category:'EPI',       consumable:true,  quantity:14, minStock:0, unit:'Par',   lastUpdated:new Date().toISOString() },
  { id:'10', code:'MAT-010', name:'Manga de Raspa para Soldador',              category:'EPI',       consumable:true,  quantity:24, minStock:0, unit:'Unid.', lastUpdated:new Date().toISOString() },
  { id:'11', code:'MAT-011', name:'Máscara de Solda com Carneira',             category:'EPI',       consumable:false, quantity:15, minStock:0, unit:'Unid.', lastUpdated:new Date().toISOString() },
  { id:'12', code:'MAT-012', name:'Máscara PFF2 (Valvulada)',                  category:'EPI',       consumable:true,  quantity:45, minStock:0, unit:'Unid.', lastUpdated:new Date().toISOString() },
  { id:'13', code:'MAT-013', name:'Protetor Auricular Tipo Concha (Capacete)', category:'EPI',       consumable:false, quantity:20, minStock:0, unit:'Unid.', lastUpdated:new Date().toISOString() },
  { id:'14', code:'MAT-014', name:'Protetor Auricular Tipo Plug',              category:'EPI',       consumable:true,  quantity:50, minStock:0, unit:'Unid.', lastUpdated:new Date().toISOString() },
  { id:'15', code:'MAT-015', name:'Spray Repelente de Insetos',                category:'EPI',       consumable:true,  quantity:6,  minStock:0, unit:'Unid.', lastUpdated:new Date().toISOString() },
  { id:'16', code:'MAT-016', name:'Protetor Solar 1L',                         category:'EPI',       consumable:true,  quantity:4,  minStock:0, unit:'Unid.', lastUpdated:new Date().toISOString() },
  { id:'17', code:'MAT-017', name:'Mala de Ferramentas',                       category:'Ferramenta',consumable:false, quantity:3,  minStock:0, unit:'Unid.', lastUpdated:new Date().toISOString() },
  { id:'18', code:'MAT-018', name:'Caixa de Ferramenta',                       category:'Ferramenta',consumable:false, quantity:3,  minStock:0, unit:'Unid.', lastUpdated:new Date().toISOString() },
  { id:'19', code:'MAT-019', name:'Espátula 12"',                              category:'Ferramenta',consumable:false, quantity:13, minStock:0, unit:'Unid.', lastUpdated:new Date().toISOString() },
  { id:'20', code:'MAT-020', name:'Manilha 3/4',                               category:'Ferramenta',consumable:false, quantity:8,  minStock:0, unit:'Unid.', lastUpdated:new Date().toISOString() },
  { id:'21', code:'MAT-021', name:'Trincha 1"',                                category:'Ferramenta',consumable:true,  quantity:12, minStock:0, unit:'Unid.', lastUpdated:new Date().toISOString() },
  { id:'22', code:'MAT-022', name:'Trincha 1 1/2"',                            category:'Ferramenta',consumable:true,  quantity:12, minStock:0, unit:'Unid.', lastUpdated:new Date().toISOString() },
  { id:'23', code:'MAT-023', name:'Trincha 2"',                                category:'Ferramenta',consumable:true,  quantity:12, minStock:0, unit:'Unid.', lastUpdated:new Date().toISOString() },
  { id:'24', code:'MAT-024', name:'Lâmina de Serra',                           category:'Ferramenta',consumable:true,  quantity:50, minStock:0, unit:'Unid.', lastUpdated:new Date().toISOString() },
  { id:'25', code:'MAT-025', name:'Trena 5m',                                  category:'Ferramenta',consumable:false, quantity:5,  minStock:0, unit:'Unid.', lastUpdated:new Date().toISOString() },
];

// ── CSV Helpers ──────────────────────────────────────────────────────────────

function downloadTemplate() {
  const link = document.createElement('a');
  link.href = '/planilha_estoque.xlsx';
  link.download = 'controle_estoque.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function parseCSV(text: string): Partial<InventoryItem>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z_]/g, ''));
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim());
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = vals[i] ?? ''; });
    const consumivel = (obj['consumivel'] || '').toLowerCase();
    return {
      code:       obj['codigo']    || obj['code']     || '',
      name:       obj['descricao'] || obj['name']     || obj['nome'] || '',
      category:   obj['categoria'] || obj['category'] || 'Geral',
      consumable: consumivel === 'sim' || consumivel === 'yes' || consumivel === 'true',
      quantity:   Number(obj['qtd_atual']  || obj['quantidade'] || 0),
      minStock:   Number(obj['qtd_minima'] || obj['estoque_minimo'] || 0),
      unit:       obj['unidade'] || obj['unit'] || 'Unid.',
    };
  }).filter(i => i.name);
}

function nextCode(inventory: InventoryItem[]): string {
  const nums = inventory.map(i => {
    const m = i.code.match(/MAT-(\d+)/);
    return m ? parseInt(m[1]) : 0;
  });
  const next = (Math.max(0, ...nums) + 1);
  return `MAT-${String(next).padStart(3, '0')}`;
}

// ── Movement Modal ────────────────────────────────────────────────────────────

interface MovementModalProps {
  item: InventoryItem;
  type: 'entry' | 'exit';
  employees: Employee[];
  onConfirm: (qty: number, employeeId: string, note: string) => void;
  onClose: () => void;
}

const MovementModal: React.FC<MovementModalProps> = ({ item, type, employees, onConfirm, onClose }) => {
  const [qty, setQty] = useState(1);
  const [empId, setEmpId] = useState('');
  const [note, setNote] = useState('');
  const activeEmps = employees.filter(e => e.active);
  const isEntry = type === 'entry';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className={`px-5 py-4 flex items-center justify-between ${isEntry ? 'bg-emerald-500' : 'bg-rose-500'}`}>
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            {isEntry ? <ArrowDownLeft size={18}/> : <ArrowUpRight size={18}/>}
            {isEntry ? 'Entrada' : 'Saída'} — {item.code} · {item.name}
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X size={18}/></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">Quantidade</label>
            <input type="number" min={1} value={qty} onChange={e => setQty(Math.max(1, Number(e.target.value)))}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"/>
            <p className="text-[10px] text-gray-400 mt-1">Estoque atual: <b>{item.quantity}</b> {item.unit}</p>
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 block mb-1.5 flex items-center gap-1"><Users size={11}/> Funcionário Responsável</label>
            {activeEmps.length === 0 ? (
              <p className="text-xs text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">Nenhum funcionário ativo. Cadastre na aba Funcionários.</p>
            ) : (
              <select value={empId} onChange={e => setEmpId(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                <option value="">Selecionar funcionário...</option>
                {activeEmps.map(e => <option key={e.id} value={e.id}>{e.name} — {e.role}</option>)}
              </select>
            )}
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">Observação (opcional)</label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Ex: Entregue ao colaborador João..."
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"/>
          </div>
        </div>
        <div className="px-5 pb-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Cancelar</button>
          <button onClick={() => onConfirm(qty, empId, note)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold text-white shadow-sm transition-all ${isEntry ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'}`}>
            <Check size={14} className="inline mr-1.5"/>Confirmar {isEntry ? 'Entrada' : 'Saída'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Module ───────────────────────────────────────────────────────────────

type ActiveTab = 'inventory' | 'employees' | 'history';
function genId() { return `wh_${Date.now()}_${Math.random().toString(36).slice(2,6)}`; }

const CATEGORIES = ['Geral','EPI','Ferramenta','Escritório','Limpeza','Equipamento','Manutenção','TI','Elétrico','Hidráulico'];
const UNITS = ['Unid.','Par','Resma','Kg','L','m','m²','cx','pct','rolo'];

export const WarehouseModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('inventory');

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('ysoffice_warehouse_inventory');
      if (saved) { const p = JSON.parse(saved); if (p?.length) return p; }
    } catch {}
    return DEFAULT_INVENTORY;
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    try { return JSON.parse(localStorage.getItem('ysoffice_employees') || 'null') || []; } catch { return []; }
  });

  const [logs, setLogs] = useState<StockLog[]>(() => {
    try { return JSON.parse(localStorage.getItem('ysoffice_warehouse_logs') || 'null') || []; } catch { return []; }
  });

  const saveInventory = (data: InventoryItem[]) => { setInventory(data); localStorage.setItem('ysoffice_warehouse_inventory', JSON.stringify(data)); };
  const saveEmployees = (data: Employee[]) => { setEmployees(data); localStorage.setItem('ysoffice_employees', JSON.stringify(data)); };
  const saveLogs     = (data: StockLog[])   => { setLogs(data);      localStorage.setItem('ysoffice_warehouse_logs', JSON.stringify(data)); };

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [movementTarget, setMovementTarget] = useState<{ item: InventoryItem; type: 'entry' | 'exit' } | null>(null);
  const [importPreview, setImportPreview] = useState<Partial<InventoryItem>[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const emptyItem: Partial<InventoryItem> = { code: '', name: '', category: 'EPI', consumable: false, quantity: 0, minStock: 0, unit: 'Unid.' };
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>(emptyItem);

  const [showAddEmp, setShowAddEmp] = useState(false);
  const [newEmp, setNewEmp] = useState<Partial<Employee>>({ name: '', role: '', department: '', active: true });

  const handleAddItem = () => {
    if (!newItem.name?.trim()) return;
    const item: InventoryItem = {
      id: genId(),
      code: newItem.code?.trim() || nextCode(inventory),
      name: newItem.name,
      category: newItem.category || 'Geral',
      consumable: !!newItem.consumable,
      quantity: Number(newItem.quantity) || 0,
      minStock: Number(newItem.minStock) || 0,
      unit: newItem.unit || 'Unid.',
      lastUpdated: new Date().toISOString(),
    };
    saveInventory([...inventory, item]);
    setShowAddModal(false);
    setNewItem(emptyItem);
  };

  const handleMovement = (qty: number, employeeId: string, note: string) => {
    if (!movementTarget) return;
    const { item, type } = movementTarget;
    const emp = employees.find(e => e.id === employeeId);
    const delta = type === 'entry' ? qty : -qty;
    saveInventory(inventory.map(i => i.id === item.id ? { ...i, quantity: Math.max(0, i.quantity + delta), lastUpdated: new Date().toISOString() } : i));
    const log: StockLog = { id: genId(), itemId: item.id, itemCode: item.code, itemName: item.name, type, quantity: qty, date: new Date().toISOString(), employeeId, employeeName: emp?.name || 'Não informado', note };
    saveLogs([log, ...logs].slice(0, 200));
    setMovementTarget(null);
  };

  const handleAddEmployee = () => {
    if (!newEmp.name?.trim()) return;
    saveEmployees([...employees, { id: genId(), name: newEmp.name, role: newEmp.role || '', department: newEmp.department || '', active: true }]);
    setShowAddEmp(false); setNewEmp({ name: '', role: '', department: '', active: true });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setImportPreview(parseCSV(ev.target?.result as string));
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  const handleImportConfirm = () => {
    if (!importPreview) return;
    const newItems: InventoryItem[] = importPreview.map(p => ({
      id: genId(), code: p.code || nextCode(inventory), name: p.name!, category: p.category || 'Geral',
      consumable: !!p.consumable, quantity: Number(p.quantity) || 0, minStock: Number(p.minStock) || 0,
      unit: p.unit || 'Unid.', lastUpdated: new Date().toISOString(),
    }));
    saveInventory([...inventory, ...newItems]);
    setImportPreview(null);
  };

  const categories = Array.from(new Set(inventory.map(i => i.category))).sort();
  const filtered = inventory.filter(item =>
    (!filterCategory || item.category === filterCategory) &&
    (!searchTerm || item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.code.toLowerCase().includes(searchTerm.toLowerCase()) || item.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const lowStock = inventory.filter(i => i.minStock > 0 && i.quantity <= i.minStock);

  const TABS: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'inventory', label: 'Estoque', icon: <Package size={14}/> },
    { id: 'employees', label: 'Funcionários', icon: <Users size={14}/> },
    { id: 'history',   label: 'Histórico',    icon: <History size={14}/> },
  ];

  return (
    <div className="h-full flex flex-col bg-palette-mediumLight dark:bg-[#111111] overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-3 bg-white/80 dark:bg-gray-900/50 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 flex-shrink-0 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center flex-shrink-0">
            <Archive size={14} className="text-white dark:text-gray-900"/>
          </div>
          <span className="font-bold text-sm text-gray-800 dark:text-white hidden sm:block">Almoxarifado</span>
          <span className="text-xs text-gray-400">{inventory.length} itens</span>
          {lowStock.length > 0 && <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[10px] font-bold rounded-full">{lowStock.length} alerta{lowStock.length > 1 ? 's' : ''}</span>}
        </div>

        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === t.id ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {activeTab === 'inventory' && <>
            <button onClick={downloadTemplate} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-200 dark:border-gray-700">
              <Download size={13}/><span className="hidden sm:inline">Planilha Modelo</span>
            </button>
            <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors border border-blue-200 dark:border-blue-800">
              <Upload size={13}/><span className="hidden sm:inline">Importar CSV</span>
            </button>
            <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden"/>
            <button onClick={() => { setNewItem({ ...emptyItem, code: nextCode(inventory) }); setShowAddModal(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-all shadow-sm">
              <Plus size={13}/> Novo Item
            </button>
          </>}
          {activeTab === 'employees' && (
            <button onClick={() => setShowAddEmp(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-all shadow-sm">
              <UserPlus size={13}/> Novo Funcionário
            </button>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-hidden">

        {/* === INVENTORY TAB === */}
        {activeTab === 'inventory' && (
          <div className="h-full flex flex-col overflow-hidden">
            {/* Search + filter bar */}
            <div className="px-5 py-2.5 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3 flex-shrink-0 flex-wrap">
              <div className="flex items-center gap-2 flex-1 min-w-[160px]">
                <Search size={14} className="text-gray-400 shrink-0"/>
                <input type="text" placeholder="Buscar código ou descrição..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400"/>
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                <button onClick={() => setFilterCategory('')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${!filterCategory ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                  Todos
                </button>
                {categories.map(cat => (
                  <button key={cat} onClick={() => setFilterCategory(cat === filterCategory ? '' : cat)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${filterCategory === cat ? 'bg-blue-500 text-white' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                    {cat}
                  </button>
                ))}
              </div>
              <span className="text-xs text-gray-400 shrink-0">{filtered.length} de {inventory.length}</span>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm border-collapse min-w-[700px]">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-[#3a5f8a] text-white text-xs font-bold uppercase tracking-wide">
                    <th className="px-4 py-2.5 text-left w-24">Código</th>
                    <th className="px-4 py-2.5 text-left">Descrição</th>
                    <th className="px-4 py-2.5 text-left w-32">Categoria</th>
                    <th className="px-4 py-2.5 text-center w-28">Consumível?</th>
                    <th className="px-4 py-2.5 text-center w-24">Qtd. Atual</th>
                    <th className="px-4 py-2.5 text-center w-24">Qtd. Mínima</th>
                    <th className="px-4 py-2.5 text-center w-20">Unidade</th>
                    <th className="px-4 py-2.5 text-right w-24">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-16 text-gray-400">
                      <Box size={36} className="mx-auto mb-2 opacity-30"/>
                      <p className="text-sm">Nenhum item encontrado</p>
                    </td></tr>
                  ) : filtered.map((item, idx) => {
                    const low = item.minStock > 0 && item.quantity <= item.minStock;
                    const rowBg = low
                      ? 'bg-rose-50 dark:bg-rose-900/10'
                      : idx % 2 === 0
                        ? 'bg-white dark:bg-gray-900'
                        : 'bg-[#eef2f7] dark:bg-gray-800/50';
                    return (
                      <tr key={item.id} className={`${rowBg} border-b border-gray-200 dark:border-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors`}>
                        <td className="px-4 py-2.5 font-mono text-xs font-semibold text-[#3a5f8a] dark:text-blue-400">{item.code}</td>
                        <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-gray-100">{item.name}</td>
                        <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400 text-xs">{item.category}</td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold ${item.consumable ? 'bg-[#f4c97e] text-[#7a4f00]' : 'bg-[#b7e3b7] text-[#1a5c1a]'}`}>
                            {item.consumable ? 'Sim' : 'Não'}
                          </span>
                        </td>
                        <td className={`px-4 py-2.5 text-center font-bold font-mono ${low ? 'text-rose-600 dark:text-rose-400' : 'text-gray-800 dark:text-white'}`}>{item.quantity}</td>
                        <td className="px-4 py-2.5 text-center text-gray-500 dark:text-gray-400">{item.minStock || '—'}</td>
                        <td className="px-4 py-2.5 text-center text-gray-500 dark:text-gray-400 text-xs">{item.unit}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => setMovementTarget({ item, type: 'entry' })} className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition-colors" title="Entrada"><ArrowDownLeft size={13}/></button>
                            <button onClick={() => setMovementTarget({ item, type: 'exit' })} className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors" title="Saída"><ArrowUpRight size={13}/></button>
                            <button onClick={() => { if (confirm('Remover item?')) saveInventory(inventory.filter(i => i.id !== item.id)); }} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-red-500 transition-colors" title="Excluir"><Trash2 size={13}/></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* === EMPLOYEES TAB === */}
        {activeTab === 'employees' && (
          <div className="h-full overflow-y-auto p-5">
            {employees.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-3">
                <Users size={40} className="opacity-30"/>
                <p className="text-sm">Nenhum funcionário cadastrado</p>
                <button onClick={() => setShowAddEmp(true)} className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-sm font-semibold shadow-sm hover:bg-gray-700 transition-colors">
                  <UserPlus size={14}/> Cadastrar primeiro funcionário
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {employees.map(emp => (
                  <div key={emp.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-violet-500 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{emp.name}</p>
                      <p className="text-[11px] text-gray-400 truncate">{emp.role}{emp.department ? ` · ${emp.department}` : ''}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => saveEmployees(employees.map(e => e.id === emp.id ? { ...e, active: !e.active } : e))}
                        className={`relative w-8 h-4 rounded-full transition-colors ${emp.active ? 'bg-emerald-400' : 'bg-gray-300 dark:bg-gray-600'}`} title={emp.active ? 'Ativo' : 'Inativo'}>
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${emp.active ? 'translate-x-4' : 'translate-x-0.5'}`}/>
                      </button>
                      <button onClick={() => { if (confirm('Remover funcionário?')) saveEmployees(employees.filter(e => e.id !== emp.id)); }} className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <Trash2 size={13}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* === HISTORY TAB === */}
        {activeTab === 'history' && (
          <div className="h-full overflow-y-auto">
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-3">
                <History size={40} className="opacity-30"/>
                <p className="text-sm">Nenhuma movimentação registrada ainda</p>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-6 text-[10px] font-bold uppercase tracking-wider text-gray-400 px-5 py-2.5 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800 sticky top-0">
                  <div>Tipo</div><div>Código</div><div className="col-span-2">Produto</div><div>Funcionário</div><div>Data/Hora</div>
                </div>
                {logs.map(log => {
                  const isEntry = log.type === 'entry';
                  return (
                    <div key={log.id} className="grid grid-cols-6 items-center px-5 py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-sm transition-colors">
                      <div>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold ${isEntry ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'}`}>
                          {isEntry ? <ArrowDownLeft size={10}/> : <ArrowUpRight size={10}/>}
                          {isEntry ? `+${log.quantity}` : `-${log.quantity}`}
                        </span>
                      </div>
                      <div className="font-mono text-xs text-[#3a5f8a] dark:text-blue-400">{log.itemCode}</div>
                      <div className="col-span-2">
                        <p className="font-medium text-gray-800 dark:text-gray-100 truncate">{log.itemName}</p>
                        {log.note && <p className="text-[10px] text-gray-400 truncate">{log.note}</p>}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><Users size={10}/>{log.employeeName}</div>
                      <div className="text-[10px] text-gray-400">
                        <p>{new Date(log.date).toLocaleDateString('pt-BR')}</p>
                        <p>{new Date(log.date).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Add Item Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <span className="font-bold text-sm text-gray-800 dark:text-white">Novo Item de Estoque</span>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X size={15}/></button>
            </div>
            <div className="p-5 grid grid-cols-2 gap-3">
              {/* Código */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block mb-1">Código</label>
                <input type="text" value={newItem.code||''} onChange={e => setNewItem({...newItem,code:e.target.value})} placeholder="MAT-001"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"/>
              </div>
              {/* Categoria */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block mb-1">Categoria</label>
                <select value={newItem.category||'EPI'} onChange={e => setNewItem({...newItem,category:e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              {/* Descrição */}
              <div className="col-span-2">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block mb-1">Descrição *</label>
                <input type="text" value={newItem.name||''} onChange={e => setNewItem({...newItem,name:e.target.value})} placeholder="Ex: Capacete de Segurança Azul"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"/>
              </div>
              {/* Consumível */}
              <div className="col-span-2">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">Consumível?</label>
                <div className="flex gap-2">
                  {[false, true].map(v => (
                    <button key={String(v)} onClick={() => setNewItem({...newItem,consumable:v})}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all ${newItem.consumable===v ? v ? 'bg-[#f4c97e] border-[#d4a030] text-[#7a4f00]' : 'bg-[#b7e3b7] border-[#4a9a4a] text-[#1a5c1a]' : 'border-gray-200 dark:border-gray-700 text-gray-400'}`}>
                      {v ? 'Sim' : 'Não'}
                    </button>
                  ))}
                </div>
              </div>
              {/* Qtd Atual */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block mb-1">Qtd. Atual</label>
                <input type="number" min={0} value={newItem.quantity||0} onChange={e => setNewItem({...newItem,quantity:Number(e.target.value)})}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"/>
              </div>
              {/* Qtd Mínima */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block mb-1">Qtd. Mínima</label>
                <input type="number" min={0} value={newItem.minStock||0} onChange={e => setNewItem({...newItem,minStock:Number(e.target.value)})}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"/>
              </div>
              {/* Unidade */}
              <div className="col-span-2">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block mb-1">Unidade</label>
                <select value={newItem.unit||'Unid.'} onChange={e => setNewItem({...newItem,unit:e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                  {UNITS.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div className="px-5 pb-5 flex justify-end gap-2">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Cancelar</button>
              <button onClick={handleAddItem} className="px-5 py-2 rounded-xl text-sm font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm hover:bg-gray-700 transition-all">
                <Check size={13} className="inline mr-1.5"/>Salvar Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Employee Modal ── */}
      {showAddEmp && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <span className="font-bold text-sm text-gray-800 dark:text-white">Cadastrar Funcionário</span>
              <button onClick={() => setShowAddEmp(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X size={15}/></button>
            </div>
            <div className="p-5 space-y-3">
              {[{label:'Nome Completo *',key:'name',ph:'Ex: João da Silva'},{label:'Cargo',key:'role',ph:'Ex: Almoxarife'},{label:'Setor',key:'department',ph:'Ex: Produção, TI...'}].map(f => (
                <div key={f.key}>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block mb-1">{f.label}</label>
                  <input type="text" placeholder={f.ph} value={(newEmp as any)[f.key]||''} onChange={e => setNewEmp({...newEmp,[f.key]:e.target.value})}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"/>
                </div>
              ))}
            </div>
            <div className="px-5 pb-5 flex justify-end gap-2">
              <button onClick={() => setShowAddEmp(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Cancelar</button>
              <button onClick={handleAddEmployee} className="px-5 py-2 rounded-xl text-sm font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm hover:bg-gray-700 transition-all">
                <Check size={13} className="inline mr-1.5"/>Cadastrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Movement Modal ── */}
      {movementTarget && <MovementModal item={movementTarget.item} type={movementTarget.type} employees={employees} onConfirm={handleMovement} onClose={() => setMovementTarget(null)}/>}

      {/* ── CSV Import Preview ── */}
      {importPreview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={16} className="text-emerald-500"/>
                <span className="font-bold text-sm text-gray-800 dark:text-white">Prévia da Importação — {importPreview.length} itens</span>
              </div>
              <button onClick={() => setImportPreview(null)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X size={15}/></button>
            </div>
            <div className="overflow-auto max-h-80">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#3a5f8a] text-white">
                    {['Código','Descrição','Categoria','Consumível?','Qtd. Atual','Qtd. Mínima','Unidade'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left font-bold uppercase tracking-wider text-[10px] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {importPreview.map((item, i) => (
                    <tr key={i} className={`border-b border-gray-100 dark:border-gray-800 ${i%2===0?'bg-white dark:bg-gray-900':'bg-[#eef2f7] dark:bg-gray-800/50'}`}>
                      <td className="px-4 py-2 font-mono text-[#3a5f8a] dark:text-blue-400">{item.code||'—'}</td>
                      <td className="px-4 py-2 font-medium text-gray-800 dark:text-gray-100">{item.name}</td>
                      <td className="px-4 py-2 text-gray-500">{item.category}</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${item.consumable?'bg-[#f4c97e] text-[#7a4f00]':'bg-[#b7e3b7] text-[#1a5c1a]'}`}>{item.consumable?'Sim':'Não'}</span>
                      </td>
                      <td className="px-4 py-2 text-center font-mono">{item.quantity}</td>
                      <td className="px-4 py-2 text-center">{item.minStock||'—'}</td>
                      <td className="px-4 py-2 text-center">{item.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <p className="text-xs text-gray-400">Itens serão adicionados ao estoque atual</p>
              <div className="flex gap-2">
                <button onClick={() => setImportPreview(null)} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Cancelar</button>
                <button onClick={handleImportConfirm} className="px-5 py-2 rounded-xl text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm transition-all">
                  <Check size={13} className="inline mr-1.5"/>Importar {importPreview.length} itens
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
