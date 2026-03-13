
import React, { useState, useRef } from 'react';
import {
  Package, Plus, Search, AlertTriangle, History, ArrowUpRight, ArrowDownLeft,
  Trash2, Archive, Box, Download, Upload, Users, X, Check, FileSpreadsheet,
  UserPlus, ChevronDown
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minStock: number;
  location: string;
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
  itemName: string;
  type: 'entry' | 'exit';
  quantity: number;
  date: string;
  employeeId: string;
  employeeName: string;
  note?: string;
}

// ── CSV Helpers ──────────────────────────────────────────────────────────────

function downloadTemplate() {
  const header = 'nome,categoria,quantidade,unidade,estoque_minimo,localizacao';
  const example = 'Papel A4,Escritório,50,Resma,10,Prateleira A1\nCaneta Azul,Escritório,120,Unidade,20,Gaveta B2';
  const blob = new Blob([header + '\n' + example], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'planilha_estoque.csv'; a.click();
  URL.revokeObjectURL(url);
}

function parseCSV(text: string): Partial<InventoryItem>[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim());
    const obj: any = {};
    headers.forEach((h, i) => { obj[h] = vals[i] ?? ''; });
    return {
      name: obj['nome'] || obj['name'] || '',
      category: obj['categoria'] || obj['category'] || 'Geral',
      quantity: Number(obj['quantidade'] || obj['quantity'] || 0),
      unit: obj['unidade'] || obj['unit'] || 'Unidade',
      minStock: Number(obj['estoque_minimo'] || obj['min_stock'] || 0),
      location: obj['localizacao'] || obj['location'] || 'N/A',
    };
  }).filter(i => i.name);
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className={`px-5 py-4 flex items-center justify-between ${type === 'entry' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            {type === 'entry' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
            {type === 'entry' ? 'Entrada' : 'Saída'} — {item.name}
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">Quantidade</label>
            <input
              type="number" min={1} value={qty}
              onChange={e => setQty(Math.max(1, Number(e.target.value)))}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
            <p className="text-[10px] text-gray-400 mt-1">Estoque atual: {item.quantity} {item.unit}</p>
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 block mb-1.5 flex items-center gap-1"><Users size={11} /> Funcionário Responsável</label>
            {activeEmps.length === 0 ? (
              <p className="text-xs text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">Nenhum funcionário cadastrado. Cadastre na aba Funcionários.</p>
            ) : (
              <select
                value={empId}
                onChange={e => setEmpId(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="">Selecionar funcionário...</option>
                {activeEmps.map(e => <option key={e.id} value={e.id}>{e.name} — {e.role}</option>)}
              </select>
            )}
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">Observação (opcional)</label>
            <input
              type="text" value={note} onChange={e => setNote(e.target.value)}
              placeholder="Ex: Reposição mensal, Uso em projeto X..."
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
        </div>
        <div className="px-5 pb-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Cancelar</button>
          <button
            onClick={() => onConfirm(qty, empId, note)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold text-white shadow-sm transition-all ${type === 'entry' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'}`}
          >
            <Check size={14} className="inline mr-1.5" />Confirmar {type === 'entry' ? 'Entrada' : 'Saída'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Module ───────────────────────────────────────────────────────────────

type ActiveTab = 'inventory' | 'employees' | 'history';

function genId() { return `wh_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`; }

export const WarehouseModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('inventory');

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('ysoffice_warehouse_inventory') || 'null') || [
        { id: '1', name: 'Papel A4', category: 'Escritório', quantity: 50, unit: 'Resma', minStock: 10, location: 'Prateleira A1', lastUpdated: new Date().toISOString() },
        { id: '2', name: 'Caneta Azul', category: 'Escritório', quantity: 120, unit: 'Unidade', minStock: 20, location: 'Gaveta B2', lastUpdated: new Date().toISOString() },
        { id: '3', name: 'Grampeador', category: 'Equipamento', quantity: 5, unit: 'Unidade', minStock: 2, location: 'Armário C3', lastUpdated: new Date().toISOString() },
      ];
    } catch { return []; }
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    try { return JSON.parse(localStorage.getItem('ysoffice_employees') || 'null') || []; } catch { return []; }
  });

  const [logs, setLogs] = useState<StockLog[]>(() => {
    try { return JSON.parse(localStorage.getItem('ysoffice_warehouse_logs') || 'null') || []; } catch { return []; }
  });

  // persist
  const saveInventory = (data: InventoryItem[]) => { setInventory(data); localStorage.setItem('ysoffice_warehouse_inventory', JSON.stringify(data)); };
  const saveEmployees = (data: Employee[]) => { setEmployees(data); localStorage.setItem('ysoffice_employees', JSON.stringify(data)); };
  const saveLogs = (data: StockLog[]) => { setLogs(data); localStorage.setItem('ysoffice_warehouse_logs', JSON.stringify(data)); };

  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [movementTarget, setMovementTarget] = useState<{ item: InventoryItem; type: 'entry' | 'exit' } | null>(null);
  const [importPreview, setImportPreview] = useState<Partial<InventoryItem>[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // New item form
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({ name: '', category: 'Geral', quantity: 0, unit: 'Unidade', minStock: 0, location: '' });

  // New employee form
  const [showAddEmp, setShowAddEmp] = useState(false);
  const [newEmp, setNewEmp] = useState<Partial<Employee>>({ name: '', role: '', department: '', active: true });

  // ── Handlers ──

  const handleAddItem = () => {
    if (!newItem.name?.trim()) return;
    const item: InventoryItem = { id: genId(), name: newItem.name, category: newItem.category || 'Geral', quantity: Number(newItem.quantity) || 0, unit: newItem.unit || 'Unidade', minStock: Number(newItem.minStock) || 0, location: newItem.location || 'N/A', lastUpdated: new Date().toISOString() };
    saveInventory([...inventory, item]);
    setShowAddModal(false);
    setNewItem({ name: '', category: 'Geral', quantity: 0, unit: 'Unidade', minStock: 0, location: '' });
  };

  const handleMovement = (qty: number, employeeId: string, note: string) => {
    if (!movementTarget) return;
    const { item, type } = movementTarget;
    const emp = employees.find(e => e.id === employeeId);
    const delta = type === 'entry' ? qty : -qty;
    saveInventory(inventory.map(i => i.id === item.id ? { ...i, quantity: Math.max(0, i.quantity + delta), lastUpdated: new Date().toISOString() } : i));
    const log: StockLog = { id: genId(), itemId: item.id, itemName: item.name, type, quantity: qty, date: new Date().toISOString(), employeeId: employeeId, employeeName: emp?.name || 'Não informado', note };
    saveLogs([log, ...logs].slice(0, 100));
    setMovementTarget(null);
  };

  const handleAddEmployee = () => {
    if (!newEmp.name?.trim()) return;
    const emp: Employee = { id: genId(), name: newEmp.name, role: newEmp.role || 'N/A', department: newEmp.department || 'Geral', active: true };
    saveEmployees([...employees, emp]);
    setShowAddEmp(false);
    setNewEmp({ name: '', role: '', department: '', active: true });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      setImportPreview(parsed);
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  const handleImportConfirm = () => {
    if (!importPreview) return;
    const newItems: InventoryItem[] = importPreview.map(p => ({ id: genId(), name: p.name!, category: p.category || 'Geral', quantity: Number(p.quantity) || 0, unit: p.unit || 'Unidade', minStock: Number(p.minStock) || 0, location: p.location || 'N/A', lastUpdated: new Date().toISOString() }));
    saveInventory([...inventory, ...newItems]);
    setImportPreview(null);
  };

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const lowStockItems = inventory.filter(i => i.quantity <= i.minStock);

  const TABS: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'inventory', label: 'Estoque', icon: <Package size={14} /> },
    { id: 'employees', label: 'Funcionários', icon: <Users size={14} /> },
    { id: 'history', label: 'Histórico', icon: <History size={14} /> },
  ];

  return (
    <div className="h-full flex flex-col bg-palette-mediumLight dark:bg-[#111111] overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-3 bg-white/80 dark:bg-gray-900/50 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 flex-shrink-0 gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center flex-shrink-0">
            <Archive size={14} className="text-white dark:text-gray-900" />
          </div>
          <span className="font-bold text-sm text-gray-800 dark:text-white hidden sm:block">Almoxarifado</span>
          {lowStockItems.length > 0 && (
            <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[10px] font-bold rounded-full">
              {lowStockItems.length} alerta{lowStockItems.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === t.id ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {activeTab === 'inventory' && (
            <>
              <button onClick={downloadTemplate} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-200 dark:border-gray-700" title="Baixar planilha modelo">
                <Download size={13} /><span className="hidden sm:inline">Planilha Modelo</span>
              </button>
              <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors border border-blue-200 dark:border-blue-800" title="Importar planilha CSV">
                <Upload size={13} /><span className="hidden sm:inline">Importar CSV</span>
              </button>
              <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
              <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-all shadow-sm">
                <Plus size={13} /> Novo Item
              </button>
            </>
          )}
          {activeTab === 'employees' && (
            <button onClick={() => setShowAddEmp(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-all shadow-sm">
              <UserPlus size={13} /> Novo Funcionário
            </button>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-hidden">

        {/* === INVENTORY TAB === */}
        {activeTab === 'inventory' && (
          <div className="h-full flex gap-0 overflow-hidden">
            {/* Table */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Search bar */}
              <div className="px-5 py-2.5 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2 flex-shrink-0">
                <Search size={14} className="text-gray-400" />
                <input type="text" placeholder="Buscar por nome, categoria ou local..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400" />
                <span className="text-xs text-gray-400">{filteredInventory.length} itens</span>
              </div>

              {/* Column headers */}
              <div className="grid grid-cols-12 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-5 py-2 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
                <div className="col-span-4">Produto</div>
                <div className="col-span-2">Categoria</div>
                <div className="col-span-2 text-center">Qtd / Mín</div>
                <div className="col-span-2">Localização</div>
                <div className="col-span-2 text-right">Ações</div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {filteredInventory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                    <Box size={40} className="opacity-30" />
                    <p className="text-sm">Nenhum item encontrado</p>
                    <p className="text-xs">Use "Novo Item" ou importe uma planilha CSV</p>
                  </div>
                ) : filteredInventory.map(item => {
                  const low = item.quantity <= item.minStock;
                  return (
                    <div key={item.id} className={`grid grid-cols-12 items-center px-5 py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${low ? 'bg-rose-50/50 dark:bg-rose-900/10' : ''}`}>
                      <div className="col-span-4 flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${low ? 'bg-rose-100 dark:bg-rose-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                          <Box size={13} className={low ? 'text-rose-500' : 'text-gray-500 dark:text-gray-400'} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{item.name}</p>
                          <p className="text-[10px] text-gray-400">{item.unit}</p>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[10px] font-semibold rounded-lg">{item.category}</span>
                      </div>
                      <div className="col-span-2 text-center">
                        <span className={`text-base font-bold font-mono ${low ? 'text-rose-500' : 'text-gray-800 dark:text-white'}`}>{item.quantity}</span>
                        <p className="text-[9px] text-gray-400">mín {item.minStock}</p>
                      </div>
                      <div className="col-span-2 text-xs text-gray-500 dark:text-gray-400">{item.location}</div>
                      <div className="col-span-2 flex justify-end items-center gap-1">
                        <button onClick={() => setMovementTarget({ item, type: 'entry' })} className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition-colors" title="Entrada">
                          <ArrowDownLeft size={13} />
                        </button>
                        <button onClick={() => setMovementTarget({ item, type: 'exit' })} className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors" title="Saída">
                          <ArrowUpRight size={13} />
                        </button>
                        <button onClick={() => { if (confirm('Remover este item?')) saveInventory(inventory.filter(i => i.id !== item.id)); }} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-red-500 transition-colors" title="Excluir">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Alerts sidebar */}
            {lowStockItems.length > 0 && (
              <div className="w-64 shrink-0 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-y-auto flex flex-col">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                  <AlertTriangle size={13} className="text-rose-500" />
                  <span className="text-xs font-bold uppercase text-rose-500">Estoque Baixo</span>
                </div>
                {lowStockItems.map(item => (
                  <div key={item.id} className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                    <p className="text-xs font-semibold text-gray-800 dark:text-white">{item.name}</p>
                    <p className="text-[10px] text-rose-500">{item.quantity} / {item.minStock} {item.unit}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* === EMPLOYEES TAB === */}
        {activeTab === 'employees' && (
          <div className="h-full overflow-y-auto p-5">
            {employees.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-3">
                <Users size={40} className="opacity-30" />
                <p className="text-sm">Nenhum funcionário cadastrado</p>
                <button onClick={() => setShowAddEmp(true)} className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-sm font-semibold shadow-sm hover:bg-gray-700 transition-colors">
                  <UserPlus size={14} /> Cadastrar primeiro funcionário
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
                      <p className="text-[11px] text-gray-400 truncate">{emp.role} · {emp.department}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => saveEmployees(employees.map(e => e.id === emp.id ? { ...e, active: !e.active } : e))}
                        className={`w-8 h-4 rounded-full transition-colors ${emp.active ? 'bg-emerald-400' : 'bg-gray-300 dark:bg-gray-600'}`}
                        title={emp.active ? 'Ativo — clique para desativar' : 'Inativo — clique para ativar'}
                      >
                        <div className={`w-3 h-3 bg-white rounded-full shadow transition-transform mx-0.5 ${emp.active ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                      <button onClick={() => { if (confirm('Remover funcionário?')) saveEmployees(employees.filter(e => e.id !== emp.id)); }} className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ml-1">
                        <Trash2 size={13} />
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
                <History size={40} className="opacity-30" />
                <p className="text-sm">Nenhuma movimentação registrada</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {logs.map(log => {
                  const isEntry = log.type === 'entry';
                  return (
                    <div key={log.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${isEntry ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-rose-50 dark:bg-rose-900/20'}`}>
                        {isEntry ? <ArrowDownLeft size={15} className="text-emerald-500" /> : <ArrowUpRight size={15} className="text-rose-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-800 dark:text-white">{log.itemName}</span>
                          <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${isEntry ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'}`}>
                            {isEntry ? '+' : '-'}{log.quantity}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[11px] text-gray-400 flex items-center gap-1">
                            <Users size={9} /> {log.employeeName}
                          </span>
                          {log.note && <span className="text-[11px] text-gray-400">· {log.note}</span>}
                        </div>
                      </div>
                      <div className="text-[10px] text-gray-400 text-right flex-shrink-0">
                        <p>{new Date(log.date).toLocaleDateString('pt-BR')}</p>
                        <p>{new Date(log.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
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
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <span className="font-bold text-sm text-gray-800 dark:text-white">Novo Item de Estoque</span>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X size={15} /></button>
            </div>
            <div className="p-5 space-y-3">
              {[
                { label: 'Nome do Item *', key: 'name', type: 'text', full: true, placeholder: 'Ex: Papel A4' },
                { label: 'Categoria', key: 'category', type: 'select', options: ['Geral', 'Escritório', 'Limpeza', 'Equipamento', 'EPI', 'Manutenção', 'TI'] },
                { label: 'Unidade', key: 'unit', type: 'text', placeholder: 'Un, Kg, Resma...' },
                { label: 'Qtd Inicial', key: 'quantity', type: 'number' },
                { label: 'Estoque Mínimo', key: 'minStock', type: 'number' },
                { label: 'Localização', key: 'location', type: 'text', full: true, placeholder: 'Ex: Prateleira A1' },
              ].map(f => (
                <div key={f.key} className={f.full ? '' : 'inline-block w-1/2 pr-2'}>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block mb-1">{f.label}</label>
                  {f.type === 'select' ? (
                    <select value={(newItem as any)[f.key] || ''} onChange={e => setNewItem({ ...newItem, [f.key]: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                      {(f.options || []).map(o => <option key={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input type={f.type} placeholder={f.placeholder} value={(newItem as any)[f.key] || ''}
                      onChange={e => setNewItem({ ...newItem, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value })}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="px-5 pb-5 flex justify-end gap-2">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Cancelar</button>
              <button onClick={handleAddItem} className="px-5 py-2 rounded-xl text-sm font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm hover:bg-gray-700 transition-all">
                <Check size={13} className="inline mr-1.5" /> Salvar Item
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
              <button onClick={() => setShowAddEmp(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X size={15} /></button>
            </div>
            <div className="p-5 space-y-3">
              {[
                { label: 'Nome Completo *', key: 'name', placeholder: 'Ex: João da Silva' },
                { label: 'Cargo', key: 'role', placeholder: 'Ex: Almoxarife, Operador...' },
                { label: 'Setor / Departamento', key: 'department', placeholder: 'Ex: Produção, TI, RH...' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block mb-1">{f.label}</label>
                  <input type="text" placeholder={f.placeholder} value={(newEmp as any)[f.key] || ''}
                    onChange={e => setNewEmp({ ...newEmp, [f.key]: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              ))}
            </div>
            <div className="px-5 pb-5 flex justify-end gap-2">
              <button onClick={() => setShowAddEmp(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Cancelar</button>
              <button onClick={handleAddEmployee} className="px-5 py-2 rounded-xl text-sm font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm hover:bg-gray-700 transition-all">
                <Check size={13} className="inline mr-1.5" /> Cadastrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Movement Modal ── */}
      {movementTarget && (
        <MovementModal
          item={movementTarget.item}
          type={movementTarget.type}
          employees={employees}
          onConfirm={handleMovement}
          onClose={() => setMovementTarget(null)}
        />
      )}

      {/* ── CSV Import Preview ── */}
      {importPreview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={16} className="text-emerald-500" />
                <span className="font-bold text-sm text-gray-800 dark:text-white">Prévia da Importação — {importPreview.length} itens encontrados</span>
              </div>
              <button onClick={() => setImportPreview(null)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X size={15} /></button>
            </div>
            <div className="overflow-y-auto max-h-80">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                    {['Nome', 'Categoria', 'Qtd', 'Unidade', 'Mín', 'Local'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left font-bold uppercase tracking-wider text-gray-400 text-[10px]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {importPreview.map((item, i) => (
                    <tr key={i} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-2.5 font-semibold text-gray-800 dark:text-white">{item.name}</td>
                      <td className="px-4 py-2.5 text-gray-500">{item.category}</td>
                      <td className="px-4 py-2.5 text-gray-500">{item.quantity}</td>
                      <td className="px-4 py-2.5 text-gray-500">{item.unit}</td>
                      <td className="px-4 py-2.5 text-gray-500">{item.minStock}</td>
                      <td className="px-4 py-2.5 text-gray-500">{item.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <p className="text-xs text-gray-400">Os itens serão adicionados ao estoque existente</p>
              <div className="flex gap-2">
                <button onClick={() => setImportPreview(null)} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Cancelar</button>
                <button onClick={handleImportConfirm} className="px-5 py-2 rounded-xl text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm transition-all">
                  <Check size={13} className="inline mr-1.5" /> Importar {importPreview.length} itens
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
