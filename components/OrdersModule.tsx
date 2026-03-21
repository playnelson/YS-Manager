
import React, { useState } from 'react';
import { 
  ClipboardList, Plus, Search, Trash2, CheckCircle, Clock, XCircle, 
  User, Package, FileText, ChevronDown, Check, Filter
} from 'lucide-react';
import { OrderAnnotation, OrderItem, OrderItem as OrderItemType } from '../types';
import { generateUUID } from '../uuid';

interface OrdersModuleProps {
  orders: OrderAnnotation[];
  onOrdersChange: (orders: OrderAnnotation[]) => void;
  inventory: any[]; // InventoryItem from Warehouse
}

export const OrdersModule: React.FC<OrdersModuleProps> = ({
  orders,
  onOrdersChange,
  inventory
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newOrder, setNewOrder] = useState<Partial<OrderAnnotation>>({
    customerName: '',
    items: [],
    notes: '',
    status: 'pending'
  });
  const [itemSearch, setItemSearch] = useState('');

  const filteredOrders = orders.filter(o => 
    o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.id.includes(searchTerm)
  );

  const handleAddOrder = () => {
    if (!newOrder.customerName || !newOrder.items?.length) return;
    
    const order: OrderAnnotation = {
      id: generateUUID(),
      customerName: newOrder.customerName,
      date: new Date().toISOString(),
      items: newOrder.items as OrderItem[],
      notes: newOrder.notes,
      status: 'pending'
    };

    onOrdersChange([order, ...orders]);
    setShowAddModal(false);
    setNewOrder({ customerName: '', items: [], notes: '', status: 'pending' });
  };

  const addItemToOrder = (invItem: any) => {
    const existing = newOrder.items?.find(i => i.itemId === invItem.id);
    if (existing) {
      setNewOrder({
        ...newOrder,
        items: newOrder.items?.map(i => 
          i.itemId === invItem.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      });
    } else {
      setNewOrder({
        ...newOrder,
        items: [
          ...(newOrder.items || []),
          { 
            itemId: invItem.id, 
            code: invItem.code, 
            name: invItem.name, 
            quantity: 1, 
            unit: invItem.unit 
          }
        ]
      });
    }
  };

  const removeItemFromOrder = (itemId: string) => {
    setNewOrder({
      ...newOrder,
      items: newOrder.items?.filter(i => i.itemId !== itemId)
    });
  };

  const updateItemQty = (itemId: string, qty: number) => {
    setNewOrder({
      ...newOrder,
      items: newOrder.items?.map(i => 
        i.itemId === itemId ? { ...i, quantity: Math.max(1, qty) } : i
      )
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'cancelled': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
      default: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-black/20 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="text-blue-600" />
            Anotações de Pedidos
          </h2>
          <p className="text-sm text-gray-500">Gerencie anotações rápidas e rascunhos de pedidos</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg"
        >
          <Plus size={18} /> Nova Anotação
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por cliente ou ID..." 
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Orders Grid */}
      <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-40">
            <ClipboardList size={64} />
            <p className="mt-4 font-semibold">Nenhuma anotação encontrada</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <div key={order.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">{order.customerName}</h3>
                  <p className="text-[10px] font-mono text-gray-400">ID: {order.id.split('-')[0]}</p>
                </div>
                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
              
              <div className="flex-1 space-y-2 mb-4">
                {order.items.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span className="truncate">{item.quantity}x {item.name}</span>
                  </div>
                ))}
                {order.items.length > 3 && (
                  <p className="text-[10px] text-gray-400 italic">+ {order.items.length - 3} outros itens</p>
                )}
              </div>

              <div className="pt-4 border-t border-gray-50 dark:border-gray-800 flex justify-between items-center text-xs text-gray-400 font-medium">
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  {new Date(order.date).toLocaleDateString('pt-BR')}
                </div>
                <button className="text-blue-600 hover:underline">Ver Detalhes</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-gray-200 dark:border-gray-800">
            <div className="px-6 py-4 bg-gray-900 dark:bg-black text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <ClipboardList size={20} className="text-blue-400" />
                <span className="font-bold">Nova Anotação de Pedido</span>
              </div>
              <button onClick={() => setShowAddModal(false)} className="hover:bg-white/10 p-1 rounded-lg transition-colors"><XCircle size={24} /></button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              {/* Form Side */}
              <div className="flex-1 p-6 overflow-y-auto space-y-6 border-r border-gray-100 dark:border-gray-800">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-2">
                      <User size={12} /> Cliente / Descrição
                    </label>
                    <input 
                      type="text" 
                      placeholder="Nome do cliente ou referência..." 
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/30"
                      value={newOrder.customerName}
                      onChange={e => setNewOrder({...newOrder, customerName: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-2">
                      <FileText size={12} /> Observações
                    </label>
                    <textarea 
                      placeholder="Combine aqui detalhes, condições, etc..." 
                      rows={3}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
                      value={newOrder.notes}
                      onChange={e => setNewOrder({...newOrder, notes: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-500 uppercase">Itens do Pedido</h4>
                  {newOrder.items?.length === 0 ? (
                    <div className="bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-8 text-center text-sm text-gray-400 font-medium italic">
                      Selecione itens na busca ao lado →
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {newOrder.items?.map(item => (
                        <div key={item.itemId} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 group">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate">{item.name}</p>
                            <p className="text-[10px] font-mono text-gray-400">{item.code}</p>
                          </div>
                          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 px-2 py-1 rounded-lg">
                            <input 
                              type="number" 
                              value={item.quantity}
                              onChange={e => updateItemQty(item.itemId, Number(e.target.value))}
                              className="w-10 bg-transparent text-center text-xs font-bold outline-none"
                            />
                            <span className="text-[10px] text-gray-400 uppercase">{item.unit}</span>
                          </div>
                          <button 
                            onClick={() => removeItemFromOrder(item.itemId)}
                            className="p-1.5 text-gray-300 hover:text-rose-500 transition-colors"
                          ><Trash2 size={16} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Inventory Lookup Side */}
              <div className="w-full md:w-80 bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col shrink-0">
                <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 text-gray-400" size={14} />
                    <input 
                      type="text" 
                      placeholder="Buscar no estoque..." 
                      className="w-full pl-8 pr-3 py-2 bg-white dark:bg-gray-800 border-none rounded-xl text-xs outline-none focus:ring-1 ring-blue-500/30"
                      value={itemSearch}
                      onChange={e => setItemSearch(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {inventory
                    .filter(i => i.name.toLowerCase().includes(itemSearch.toLowerCase()) || i.code.toLowerCase().includes(itemSearch.toLowerCase()))
                    .slice(0, 20)
                    .map(item => (
                      <button 
                        key={item.id}
                        onClick={() => addItemToOrder(item)}
                        className="w-full text-left p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-500/50 hover:bg-blue-50/10 transition-all group"
                      >
                        <p className="text-[10px] font-mono text-blue-600 dark:text-blue-400">{item.code}</p>
                        <p className="text-xs font-bold group-hover:text-blue-600 transition-colors truncate">{item.name}</p>
                        <div className="flex items-center justify-between mt-1 text-[9px] text-gray-400">
                          <span>Estoque: {item.quantity} {item.unit}</span>
                          <Plus size={12} className="text-blue-600" />
                        </div>
                      </button>
                    ))
                  }
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 dark:bg-black/50 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
              <button 
                onClick={() => setShowAddModal(false)}
                className="px-6 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors"
              >Cancelar</button>
              <button 
                onClick={handleAddOrder}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-lg flex items-center gap-2"
              >
                <Check size={14} /> Salvar Anotação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
