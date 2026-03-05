
import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Minus,
  Search,
  AlertTriangle,
  History,
  ArrowUpRight,
  ArrowDownLeft,
  Trash2,
  Edit3,
  Archive,
  Box
} from 'lucide-react';
import { Button } from './ui/Button';

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

interface StockLog {
  id: string;
  itemId: string;
  itemName: string;
  type: 'entry' | 'exit';
  quantity: number;
  date: string;
  user: string;
}

export const WarehouseModule: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('ysoffice_warehouse_inventory');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Papel A4', category: 'Escritório', quantity: 50, unit: 'Resma', minStock: 10, location: 'Prateleira A1', lastUpdated: new Date().toISOString() },
      { id: '2', name: 'Caneta Azul', category: 'Escritório', quantity: 120, unit: 'Unidade', minStock: 20, location: 'Gaveta B2', lastUpdated: new Date().toISOString() },
      { id: '3', name: 'Grampeador', category: 'Equipamento', quantity: 5, unit: 'Unidade', minStock: 2, location: 'Armário C3', lastUpdated: new Date().toISOString() },
    ];
  });

  const [logs, setLogs] = useState<StockLog[]>(() => {
    const saved = localStorage.getItem('ysoffice_warehouse_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    name: '',
    category: 'Geral',
    quantity: 0,
    unit: 'Unidade',
    minStock: 0,
    location: ''
  });

  useEffect(() => {
    localStorage.setItem('ysoffice_warehouse_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('ysoffice_warehouse_logs', JSON.stringify(logs));
  }, [logs]);

  const handleAddItem = () => {
    if (!newItem.name) return;
    const item: InventoryItem = {
      id: Date.now().toString(),
      name: newItem.name || '',
      category: newItem.category || 'Geral',
      quantity: Number(newItem.quantity) || 0,
      unit: newItem.unit || 'Unidade',
      minStock: Number(newItem.minStock) || 0,
      location: newItem.location || 'N/A',
      lastUpdated: new Date().toISOString()
    };
    setInventory([...inventory, item]);
    setShowAddModal(false);
    setNewItem({ name: '', category: 'Geral', quantity: 0, unit: 'Unidade', minStock: 0, location: '' });
  };

  const updateQuantity = (id: string, delta: number, type: 'entry' | 'exit') => {
    setInventory(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);

        // Add log
        const log: StockLog = {
          id: Date.now().toString(),
          itemId: id,
          itemName: item.name,
          type,
          quantity: Math.abs(delta),
          date: new Date().toISOString(),
          user: 'Usuário Atual'
        };
        setLogs(prevLogs => [log, ...prevLogs].slice(0, 50));

        return { ...item, quantity: newQty, lastUpdated: new Date().toISOString() };
      }
      return item;
    }));
  };

  const deleteItem = (id: string) => {
    if (confirm('Tem certeza que deseja remover este item do inventário?')) {
      setInventory(inventory.filter(i => i.id !== id));
    }
  };

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockItems = inventory.filter(item => item.quantity <= item.minStock);

  return (
    <div className="h-full flex flex-col bg-[#c0c0c0] dark:bg-[#1a1a1a] p-1 overflow-hidden">
      {/* Header / Toolbar */}
      <div className="win95-raised bg-win95-bg dark:bg-[#1a1a1a] border border-white dark:border-gray-800 p-2 mb-2 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-[#000080] text-white px-3 py-1 text-xs font-bold uppercase">
            <Archive size={14} />
            <span>Controle de Almoxarifado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="win95-sunken bg-white dark:bg-gray-800 flex items-center px-2 py-1 border border-gray-400 dark:border-gray-700">
              <Search size={14} className="text-gray-400 dark:text-gray-500 mr-2" />
              <input
                type="text"
                placeholder="Buscar item, categoria ou local..."
                className="bg-transparent outline-none text-xs w-64 text-black dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          icon={<Plus size={14} />}
          className="h-8"
        >
          Novo Item
        </Button>
      </div>

      <div className="flex-1 flex gap-2 overflow-hidden">
        {/* Main Inventory Table */}
        <div className="flex-1 win95-raised bg-white dark:bg-gray-900 border border-gray-400 dark:border-gray-800 overflow-hidden flex flex-col">
          <div className="bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 grid grid-cols-12 text-[10px] font-bold uppercase p-2 text-gray-600 dark:text-gray-400">
            <div className="col-span-4">Item</div>
            <div className="col-span-2">Categoria</div>
            <div className="col-span-2 text-center">Qtd Atual</div>
            <div className="col-span-2">Localização</div>
            <div className="col-span-2 text-right">Ações</div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredInventory.length === 0 ? (
              <div className="p-10 text-center text-gray-400 italic text-sm">
                Nenhum item encontrado no inventário.
              </div>
            ) : (
              filteredInventory.map(item => (
                <div key={item.id} className={`grid grid-cols-12 items-center p-2 border-b border-gray-100 dark:border-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/10 text-xs ${item.quantity <= item.minStock ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                  <div className="col-span-4 flex items-center gap-2">
                    <Box size={14} className={item.quantity <= item.minStock ? 'text-red-500' : 'text-[#000080] dark:text-blue-400'} />
                    <div>
                      <div className="font-bold text-black dark:text-white">{item.name}</div>
                      <div className="text-[9px] text-gray-400 dark:text-gray-500 uppercase">{item.unit}</div>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className="bg-gray-200 dark:bg-gray-700 text-black dark:text-white px-2 py-0.5 rounded text-[9px] font-bold uppercase">{item.category}</span>
                  </div>
                  <div className="col-span-2 flex flex-col items-center">
                    <div className={`text-sm font-mono font-bold ${item.quantity <= item.minStock ? 'text-red-600 dark:text-red-400' : 'text-black dark:text-white'}`}>
                      {item.quantity}
                    </div>
                    <div className="text-[8px] text-gray-400 dark:text-gray-500">Mín: {item.minStock}</div>
                  </div>
                  <div className="col-span-2 text-gray-600 dark:text-gray-400 font-mono text-[10px]">
                    {item.location}
                  </div>
                  <div className="col-span-2 flex justify-end gap-1">
                    <button
                      onClick={() => updateQuantity(item.id, 1, 'entry')}
                      className="win95-btn p-1 text-green-700" title="Entrada">
                      <ArrowDownLeft size={14} />
                    </button>
                    <button
                      onClick={() => updateQuantity(item.id, -1, 'exit')}
                      className="win95-btn p-1 text-red-700" title="Saída">
                      <ArrowUpRight size={14} />
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="win95-btn p-1 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400" title="Excluir">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar: Alerts and Logs */}
        <div className="w-80 flex flex-col gap-2 shrink-0">
          {/* Alerts */}
          <div className="win95-raised bg-win95-bg dark:bg-[#1a1a1a] p-1 flex flex-col h-1/3 border border-white dark:border-gray-800">
            <div className="bg-[#800000] dark:bg-red-900 text-white p-1 px-2 text-[10px] font-bold uppercase flex items-center gap-2 mb-1">
              <AlertTriangle size={12} /> Alertas de Estoque Baixo
            </div>
            <div className="flex-1 win95-sunken bg-white dark:bg-gray-800 overflow-y-auto p-1 space-y-1 border border-gray-400 dark:border-gray-700">
              {lowStockItems.length === 0 ? (
                <div className="text-center p-4 text-gray-400 dark:text-gray-500 text-[9px] italic">Estoque em dia.</div>
              ) : (
                lowStockItems.map(item => (
                  <div key={item.id} className="p-2 border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 flex justify-between items-center text-black dark:text-white">
                    <div>
                      <div className="font-bold text-[10px]">{item.name}</div>
                      <div className="text-[9px] text-red-600 dark:text-red-400">Apenas {item.quantity} {item.unit} restantes</div>
                    </div>
                    <AlertTriangle size={14} className="text-red-500" />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* History Logs */}
          <div className="win95-raised bg-win95-bg dark:bg-[#1a1a1a] p-1 flex flex-col flex-1 border border-white dark:border-gray-800">
            <div className="bg-[#000080] dark:bg-blue-900 text-white p-1 px-2 text-[10px] font-bold uppercase flex items-center gap-2 mb-1">
              <History size={12} /> Movimentações Recentes
            </div>
            <div className="flex-1 win95-sunken bg-white dark:bg-gray-800 overflow-y-auto p-1 space-y-1 border border-gray-400 dark:border-gray-700">
              {logs.length === 0 ? (
                <div className="text-center p-4 text-gray-400 dark:text-gray-500 text-[9px] italic">Nenhuma movimentação.</div>
              ) : (
                logs.map(log => (
                  <div key={log.id} className="p-2 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                    <div className={`p-1 win95-sunken border border-gray-400 dark:border-gray-700 ${log.type === 'entry' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-500' : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-500'}`}>
                      {log.type === 'entry' ? <ArrowDownLeft size={10} /> : <ArrowUpRight size={10} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[10px] truncate text-black dark:text-white">{log.itemName}</div>
                      <div className="text-[8px] text-gray-500 dark:text-gray-400 flex justify-between">
                        <span>{log.type === 'entry' ? 'Entrada' : 'Saída'}: {log.quantity} un</span>
                        <span>{new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="win95-raised bg-win95-bg dark:bg-[#1a1a1a] border border-white dark:border-gray-800 p-1 w-full max-w-md shadow-2xl">
            <div className="bg-[#000080] dark:bg-blue-900 text-white p-1 px-2 flex items-center justify-between font-bold text-xs uppercase">
              <div className="flex items-center gap-2"><Plus size={14} /> Adicionar Novo Item</div>
              <button onClick={() => setShowAddModal(false)} className="win95-btn px-1.5 py-0">X</button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold uppercase text-black dark:text-white">Nome do Item</label>
                  <input
                    type="text"
                    className="w-full win95-sunken bg-white dark:bg-gray-800 p-2 text-sm outline-none text-black dark:text-white border border-gray-400 dark:border-gray-700"
                    value={newItem.name}
                    onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-black dark:text-white">Categoria</label>
                  <select
                    className="w-full win95-sunken bg-white dark:bg-gray-800 p-2 text-sm outline-none text-black dark:text-white border border-gray-400 dark:border-gray-700"
                    value={newItem.category}
                    onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                  >
                    <option value="Geral">Geral</option>
                    <option value="Escritório">Escritório</option>
                    <option value="Limpeza">Limpeza</option>
                    <option value="Equipamento">Equipamento</option>
                    <option value="EPI">EPI</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-black dark:text-white">Unidade</label>
                  <input
                    type="text"
                    className="w-full win95-sunken bg-white dark:bg-gray-800 p-2 text-sm outline-none text-black dark:text-white border border-gray-400 dark:border-gray-700"
                    placeholder="Un, Kg, Resma..."
                    value={newItem.unit}
                    onChange={e => setNewItem({ ...newItem, unit: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-black dark:text-white">Qtd Inicial</label>
                  <input
                    type="number"
                    className="w-full win95-sunken bg-white dark:bg-gray-800 p-2 text-sm outline-none text-black dark:text-white border border-gray-400 dark:border-gray-700"
                    value={newItem.quantity}
                    onChange={e => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-black dark:text-white">Estoque Mínimo</label>
                  <input
                    type="number"
                    className="w-full win95-sunken bg-white dark:bg-gray-800 p-2 text-sm outline-none text-black dark:text-white border border-gray-400 dark:border-gray-700"
                    value={newItem.minStock}
                    onChange={e => setNewItem({ ...newItem, minStock: Number(e.target.value) })}
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold uppercase text-black dark:text-white">Localização</label>
                  <input
                    type="text"
                    className="w-full win95-sunken bg-white dark:bg-gray-800 p-2 text-sm outline-none text-black dark:text-white border border-gray-400 dark:border-gray-700"
                    placeholder="Ex: Prateleira A, Gaveta 2..."
                    value={newItem.location}
                    onChange={e => setNewItem({ ...newItem, location: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button onClick={() => setShowAddModal(false)} className="bg-gray-200">Cancelar</Button>
                <Button onClick={handleAddItem}>Salvar Item</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
