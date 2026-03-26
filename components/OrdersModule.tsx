import React, { useState, useMemo } from 'react';
import { 
  ClipboardList, Plus, Search, Trash2, Clock, XCircle, 
  User, Package, FileText, ChevronDown, Check, Filter,
  Building2, Calendar, DollarSign, AlertCircle, Copy, Printer,
  MoreVertical, CheckCircle2, Factory, ExternalLink, RefreshCw, Download
} from 'lucide-react';
import { OrderAnnotation, OrderItem, OrderType, OrderStatus, OrderPriority } from '../types';
import { generateUUID } from '../uuid';
import * as XLSX from 'xlsx';

interface OrdersModuleProps {
  orders: OrderAnnotation[];
  onOrdersChange: (orders: OrderAnnotation[]) => void;
  inventory: any[]; // InventoryItem from Warehouse
  currentUser?: { nick: string };
}

export const OrdersModule: React.FC<OrdersModuleProps> = ({
  orders,
  onOrdersChange,
  inventory,
  currentUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<OrderType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');

  // Export state
  const [showExport, setShowExport] = useState(false);
  const [exportDateFrom, setExportDateFrom] = useState('');
  const [exportDateTo, setExportDateTo] = useState('');
  const [exportGroupBy, setExportGroupBy] = useState<'type' | 'requester'>('type');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showItemSearch, setShowItemSearch] = useState(false);
  const [itemSearchText, setItemSearchText] = useState('');
  
  const [editingOrder, setEditingOrder] = useState<OrderAnnotation | null>(null);
  const [viewDetailOrder, setViewDetailOrder] = useState<OrderAnnotation | null>(null);

  const [formState, setFormState] = useState<Partial<OrderAnnotation>>({
    type: 'purchase',
    requester: currentUser?.nick || '',
    supplier: '',
    expectedDelivery: '',
    items: [],
    notes: '',
    paymentMethod: '',
    status: 'draft',
    priority: 'normal'
  });

  const [newItem, setNewItem] = useState<Partial<OrderItem>>({
    description: '',
    unit: 'UN',
    quantity: 1,
    unitPrice: 0
  });

  // Calculate stats
  const stats = useMemo(() => {
    return {
      draft: orders.filter(o => o.status === 'draft').length,
      pending: orders.filter(o => o.status === 'pending_approval' || o.status === 'approved').length,
      inProgress: orders.filter(o => o.status === 'in_progress').length,
      completed: orders.filter(o => o.status === 'completed').length,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchSearch = 
        (o.requester?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (o.supplier?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (o.orderNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (o.id.toLowerCase()).includes(searchTerm.toLowerCase());
        
      const matchType = filterType === 'all' || o.type === filterType;
      const matchStatus = filterStatus === 'all' || o.status === filterStatus;
      
      return matchSearch && matchType && matchStatus;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [orders, searchTerm, filterType, filterStatus]);

  const calculateTotal = (items: OrderItem[]) => {
    return items.reduce((sum, item) => sum + (item.quantity * (item.unitPrice || 0)), 0);
  };

  const openForm = (order?: OrderAnnotation) => {
    if (order) {
      setEditingOrder(order);
      setFormState({ ...order });
    } else {
      setEditingOrder(null);
      
      // Auto-generate order number PED-YYYYMM-XXXX
      const date = new Date();
      const prefix = `PED-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      const count = orders.filter(o => o.orderNumber?.startsWith(prefix)).length + 1;
      const orderNumber = `${prefix}-${count.toString().padStart(3, '0')}`;
      
      setFormState({
        orderNumber,
        type: 'purchase',
        requester: currentUser?.nick || '',
        supplier: '',
        expectedDelivery: '',
        items: [],
        notes: '',
        paymentMethod: '',
        status: 'draft',
        priority: 'normal'
      });
    }
    setNewItem({ description: '', unit: 'UN', quantity: 1, unitPrice: 0 });
    setShowAddModal(true);
  };

  const handleSaveOrder = () => {
    if (!formState.requester || !formState.items?.length) return;
    
    const now = new Date().toISOString();
    const totalValue = calculateTotal(formState.items as OrderItem[]);
    const user = currentUser?.nick || 'Sistema';

    let updatedOrders = [...orders];

    if (editingOrder) {
      // Update existing
      const statusChanged = editingOrder.status !== formState.status;
      const statusHistory = editingOrder.statusHistory || [];
      
      if (statusChanged) {
        statusHistory.unshift({ status: formState.status as OrderStatus, date: now, by: user });
      }

      const updatedMap = updatedOrders.map(o => o.id === editingOrder.id ? {
        ...editingOrder,
        ...formState,
        totalValue,
        statusHistory
      } as OrderAnnotation : o);
      
      onOrdersChange(updatedMap);
    } else {
      // Create new
      const newOrderObj: OrderAnnotation = {
        id: generateUUID(),
        orderNumber: formState.orderNumber || `PED-${generateUUID().substring(0, 6).toUpperCase()}`,
        type: formState.type as OrderType,
        requester: formState.requester,
        supplier: formState.supplier,
        date: now,
        expectedDelivery: formState.expectedDelivery,
        items: formState.items as OrderItem[],
        notes: formState.notes,
        paymentMethod: formState.paymentMethod,
        status: formState.status as OrderStatus || 'draft',
        priority: formState.priority as OrderPriority || 'normal',
        totalValue,
        statusHistory: [{ status: formState.status as OrderStatus || 'draft', date: now, by: user }]
      };

      onOrdersChange([newOrderObj, ...orders]);
    }

    setShowAddModal(false);
  };

  const handleAddFreeItem = () => {
    if (!newItem.description?.trim()) return;
    
    setFormState({
      ...formState,
      items: [
        ...(formState.items || []),
        {
          id: generateUUID(),
          description: newItem.description,
          code: newItem.code,
          unit: newItem.unit || 'UN',
          quantity: newItem.quantity || 1,
          unitPrice: newItem.unitPrice || 0
        }
      ]
    });
    
    setNewItem({ description: '', code: '', unit: 'UN', quantity: 1, unitPrice: 0 });
  };

  const addItemFromInventory = (invItem: any) => {
    setFormState({
      ...formState,
      items: [
        ...(formState.items || []),
        { 
          id: generateUUID(),
          description: invItem.name, 
          code: invItem.code, 
          quantity: 1, 
          unit: invItem.unit,
          unitPrice: 0,
          warehouseItemId: invItem.id
        }
      ]
    });
    setShowItemSearch(false);
  };

  const removeItem = (id: string) => {
    setFormState({
      ...formState,
      items: formState.items?.filter(i => i.id !== id)
    });
  };

  const updateItem = (id: string, field: keyof OrderItem, value: any) => {
    setFormState({
      ...formState,
      items: formState.items?.map(i => 
        i.id === id ? { ...i, [field]: value } : i
      )
    });
  };

  const quickChangeStatus = (order: OrderAnnotation, newStatus: OrderStatus) => {
    const now = new Date().toISOString();
    const user = currentUser?.nick || 'Sistema';
    
    const statusHistory = [{ status: newStatus, date: now, by: user }, ...(order.statusHistory || [])];
    
    const updated = orders.map(o => o.id === order.id ? {
      ...o,
      status: newStatus,
      statusHistory
    } : o);
    
    onOrdersChange(updated);
    if (viewDetailOrder?.id === order.id) {
      setViewDetailOrder({ ...order, status: newStatus, statusHistory });
    }
  };

  const duplicateOrder = (order: OrderAnnotation) => {
    const newOrderObj: OrderAnnotation = {
      ...order,
      id: generateUUID(),
      orderNumber: `COPY-${order.orderNumber}`,
      date: new Date().toISOString(),
      status: 'draft',
      statusHistory: [{ status: 'draft', date: new Date().toISOString(), by: currentUser?.nick || 'Sistema' }]
    };
    
    // Refresh item IDs
    newOrderObj.items = newOrderObj.items.map(i => ({...i, id: generateUUID()}));
    
    onOrdersChange([newOrderObj, ...orders]);
    setViewDetailOrder(null);
  };

  const copyToClipboard = (order: OrderAnnotation) => {
    const lines = [
      `PEDIDO: ${order.orderNumber || order.id.split('-')[0]}`,
      `Tipo: ${getTypeLabel(order.type)} | Status: ${getStatusLabel(order.status)}`,
      `Solicitante: ${order.requester}`,
      order.supplier ? `Fornecedor: ${order.supplier}` : null,
      order.expectedDelivery ? `Entrega Esperada: ${new Date(order.expectedDelivery).toLocaleDateString('pt-BR')}` : null,
      `--- ITENS ---`,
      ...order.items.map(i => `- ${i.quantity}x ${i.unit} | ${i.description} ${i.code ? `(${i.code})` : ''} ${i.unitPrice ? `| R$ ${i.unitPrice?.toFixed(2)}` : ''}`),
      `---`,
      order.totalValue ? `TOTAL: R$ ${order.totalValue.toFixed(2)}` : null,
      order.notes ? `Observações: ${order.notes}` : null
    ].filter(Boolean);

    navigator.clipboard.writeText(lines.join('\n'));
    alert('Resumo do pedido copiado para a área de transferência!');
  };

  // UI Helpers
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'purchase': return 'Compra';
      case 'sale': return 'Venda';
      case 'internal': return 'Uso Interno';
      default: return type;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'purchase': return <Factory size={14} />;
      case 'sale': return <DollarSign size={14} />;
      case 'internal': return <RefreshCw size={14} />;
      default: return <Package size={14} />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Rascunho';
      case 'pending_approval': return 'Aguardando Aprovação';
      case 'approved': return 'Aprovado';
      case 'in_progress': return 'Em Andamento';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
      case 'pending_approval': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400';
      case 'approved': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400';
      case 'in_progress': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400';
      case 'completed': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400';
      case 'cancelled': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-rose-600 bg-rose-50 dark:bg-rose-900/20';
      case 'high': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
      case 'low': return 'text-gray-500 bg-gray-50 dark:bg-gray-800';
      default: return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  const formatCurrency = (val?: number) => {
    if (val === undefined || isNaN(val)) return 'R$ 0,00';
    return `R$ ${val.toFixed(2).replace('.', ',')}`;
  };

  const exportToXLSX = () => {
    const from = exportDateFrom ? new Date(exportDateFrom + 'T00:00:00') : null;
    const to = exportDateTo ? new Date(exportDateTo + 'T23:59:59') : null;

    const filtered = orders.filter(o => {
      const d = new Date(o.date);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });

    if (filtered.length === 0) {
      alert('Nenhum pedido encontrado no intervalo selecionado.');
      return;
    }

    const wb = XLSX.utils.book_new();

    const buildRows = (orderList: OrderAnnotation[]) => {
      const rows: any[] = [];
      orderList.forEach(o => {
        if (o.items.length === 0) {
          rows.push({
            'Número': o.orderNumber || o.id.substring(0, 8),
            'Data': new Date(o.date).toLocaleDateString('pt-BR'),
            'Tipo': getTypeLabel(o.type),
            'Status': getStatusLabel(o.status),
            'Solicitante': o.requester,
            'Fornecedor/Destino': o.supplier || '-',
            'Entrega Prevista': o.expectedDelivery ? new Date(o.expectedDelivery).toLocaleDateString('pt-BR') : '-',
            'Código Item': '-',
            'Descrição': '-',
            'Qtd': '',
            'Unidade': '',
            'Preço Un. (R$)': '',
            'Total Item (R$)': '',
            'Total Pedido (R$)': o.totalValue ? o.totalValue.toFixed(2) : '0,00',
            'Observações': o.notes || ''
          });
        } else {
          o.items.forEach((item, idx) => {
            rows.push({
              'Número': idx === 0 ? (o.orderNumber || o.id.substring(0, 8)) : '',
              'Data': idx === 0 ? new Date(o.date).toLocaleDateString('pt-BR') : '',
              'Tipo': idx === 0 ? getTypeLabel(o.type) : '',
              'Status': idx === 0 ? getStatusLabel(o.status) : '',
              'Solicitante': idx === 0 ? o.requester : '',
              'Fornecedor/Destino': idx === 0 ? (o.supplier || '-') : '',
              'Entrega Prevista': idx === 0 && o.expectedDelivery ? new Date(o.expectedDelivery).toLocaleDateString('pt-BR') : (idx === 0 ? '-' : ''),
              'Código Item': item.code || '-',
              'Descrição': item.description,
              'Qtd': item.quantity,
              'Unidade': item.unit,
              'Preço Un. (R$)': item.unitPrice ? item.unitPrice.toFixed(2) : '0,00',
              'Total Item (R$)': item.unitPrice ? (item.unitPrice * item.quantity).toFixed(2) : '0,00',
              'Total Pedido (R$)': idx === 0 && o.totalValue ? o.totalValue.toFixed(2) : '',
              'Observações': idx === 0 ? (o.notes || '') : ''
            });
          });
        }
      });
      return rows;
    };

    if (exportGroupBy === 'type') {
      const types: Record<string, OrderAnnotation[]> = {};
      filtered.forEach(o => {
        const key = getTypeLabel(o.type);
        if (!types[key]) types[key] = [];
        types[key].push(o);
      });
      Object.entries(types).forEach(([label, list]) => {
        const ws = XLSX.utils.json_to_sheet(buildRows(list));
        XLSX.utils.book_append_sheet(wb, ws, label.substring(0, 31));
      });
    } else {
      const requesters: Record<string, OrderAnnotation[]> = {};
      filtered.forEach(o => {
        const key = o.requester || 'Sem Solicitante';
        if (!requesters[key]) requesters[key] = [];
        requesters[key].push(o);
      });
      Object.entries(requesters).forEach(([name, list]) => {
        const ws = XLSX.utils.json_to_sheet(buildRows(list));
        XLSX.utils.book_append_sheet(wb, ws, name.substring(0, 31));
      });
    }

    const fromStr = exportDateFrom || 'inicio';
    const toStr = exportDateTo || 'hoje';
    XLSX.writeFile(wb, `pedidos_${fromStr}_ate_${toStr}.xlsx`);
    setShowExport(false);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-black/20 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
            <ClipboardList className="text-blue-600" />
            Gestão de Pedidos
          </h2>
          <p className="text-sm text-gray-500">Controle completo de compras, vendas e solicitações internas</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => setShowExport(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
          >
            <Download size={16} /> Exportar Planilha
          </button>
          <button 
            onClick={() => openForm()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg hover:shadow-blue-500/30 w-full md:w-auto justify-center"
          >
            <Plus size={18} /> Novo Pedido
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400">
            <FileText size={20} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Rascunhos</p>
            <p className="text-xl font-black text-gray-900 dark:text-white">{stats.draft}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Pendentes</p>
            <p className="text-xl font-black text-gray-900 dark:text-white">{stats.pending}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600">
            <Factory size={20} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Em Andamento</p>
            <p className="text-xl font-black text-gray-900 dark:text-white">{stats.inProgress}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Concluídos</p>
            <p className="text-xl font-black text-gray-900 dark:text-white">{stats.completed}</p>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-3 bg-white dark:bg-gray-900 p-3 rounded-2xl border border-gray-100 dark:border-gray-800">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por número, pessoa ou empresa..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-sm"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select 
            className="bg-gray-50 dark:bg-gray-800 text-sm font-semibold border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-700 dark:text-gray-300"
            value={filterType}
            onChange={e => setFilterType(e.target.value as any)}
          >
            <option value="all">Todos Tipos</option>
            <option value="purchase">Compras</option>
            <option value="sale">Vendas</option>
            <option value="internal">Interno</option>
          </select>
          <select 
            className="bg-gray-50 dark:bg-gray-800 text-sm font-semibold border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-700 dark:text-gray-300"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as any)}
          >
            <option value="all">Qualquer Status</option>
            <option value="draft">Rascunhos</option>
            <option value="pending_approval">Aguardando Aprov.</option>
            <option value="approved">Aprovados</option>
            <option value="in_progress">Em Andamento</option>
            <option value="completed">Concluídos</option>
          </select>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-10">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-40">
            <ClipboardList size={64} className="mb-4" />
            <p className="font-semibold text-lg">Nenhum pedido encontrado</p>
            <p className="text-sm">Tente ajustar seus filtros ou crie um novo pedido.</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <div key={order.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-0 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden">
              {/* Card Header */}
              <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {order.orderNumber || order.id.substring(0,8).toUpperCase()}
                    </span>
                    {order.priority !== 'normal' && (
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${getPriorityColor(order.priority)}`}>
                        {order.priority}
                      </span>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>
                
                <h3 className="font-bold text-base text-gray-900 dark:text-white line-clamp-1 mb-1">
                  {order.supplier ? `Para: ${order.supplier}` : order.requester}
                </h3>
                
                <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                  <div className="flex items-center gap-1">
                    {getTypeIcon(order.type)} {getTypeLabel(order.type)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Package size={14} /> {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                  </div>
                </div>
              </div>
              
              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-center">
                <div className="space-y-2 mb-3">
                  {order.items.slice(0, 3).map((item, idx) => (
                    <div key={item.id || idx} className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400">
                      <span className="truncate flex-1 pr-2">- {item.description}</span>
                      <span className="font-mono text-[10px] text-gray-400 whitespace-nowrap">{item.quantity} {item.unit}</span>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <p className="text-[10px] text-gray-400 italic mt-1 font-medium bg-gray-50 dark:bg-gray-800/50 inline-block px-2 py-0.5 rounded">
                      + {order.items.length - 3} outros itens
                    </p>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 border-t border-gray-100 dark:border-gray-800">
                <div className="flex justify-between items-center mb-3">
                  <div className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                    <Clock size={12} />
                    {new Date(order.date).toLocaleDateString('pt-BR')}
                  </div>
                  {(order.totalValue || 0) > 0 && (
                    <div className="font-bold text-sm text-gray-900 dark:text-white">
                      {formatCurrency(order.totalValue)}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => setViewDetailOrder(order)}
                    className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-500 text-gray-700 dark:text-gray-300 py-1.5 rounded-lg text-xs font-bold transition-colors"
                  >
                    Ver Detalhes
                  </button>
                  
                  {order.status === 'draft' && (
                    <button 
                      onClick={() => quickChangeStatus(order, 'pending_approval')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow flex items-center justify-center"
                      title="Enviar para Aprovação"
                    >
                      <Check size={14} />
                    </button>
                  )}
                  {order.status === 'in_progress' && (
                    <button 
                      onClick={() => quickChangeStatus(order, 'completed')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow flex items-center justify-center"
                      title="Marcar como Concluído"
                    >
                      <CheckCircle2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      {viewDetailOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-3xl max-h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-gray-200 dark:border-gray-800">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-3 py-1 rounded-lg">
                  {viewDetailOrder.orderNumber || viewDetailOrder.id.split('-')[0]}
                </span>
                <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${getStatusColor(viewDetailOrder.status)}`}>
                  {getStatusLabel(viewDetailOrder.status)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => duplicateOrder(viewDetailOrder)}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
                  title="Duplicar Pedido"
                ><Copy size={18} /></button>
                <button 
                  onClick={() => copyToClipboard(viewDetailOrder)}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
                  title="Copiar Resumo / Imprimir"
                ><Printer size={18} /></button>
                <button onClick={() => setViewDetailOrder(null)} className="p-2 text-gray-400 hover:text-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-200 rounded-xl transition-colors"><XCircle size={20} /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              {/* Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400">Tipo</p>
                  <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5 mt-1">
                    {getTypeIcon(viewDetailOrder.type)} {getTypeLabel(viewDetailOrder.type)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400">Solicitante</p>
                  <p className="font-semibold text-gray-900 dark:text-white mt-1">{viewDetailOrder.requester}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400">Data de Emissão</p>
                  <p className="font-semibold text-gray-900 dark:text-white mt-1">{new Date(viewDetailOrder.date).toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400">Entrega Esperada</p>
                  <p className="font-semibold text-gray-900 dark:text-white mt-1">
                    {viewDetailOrder.expectedDelivery ? new Date(viewDetailOrder.expectedDelivery).toLocaleDateString('pt-BR') : '-'}
                  </p>
                </div>
              </div>

              {viewDetailOrder.supplier && (
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Fornecedor / Destinatário</p>
                  <p className="font-bold text-base text-gray-900 dark:text-white">{viewDetailOrder.supplier}</p>
                </div>
              )}

              {/* Items Table */}
              <div>
                <h4 className="font-bold mb-3 flex items-center gap-2">
                  <Package size={16} className="text-blue-500" /> Itens do Pedido ({viewDetailOrder.items.length})
                </h4>
                <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 text-xs uppercase font-bold">
                      <tr>
                        <th className="px-4 py-3">Item</th>
                        <th className="px-4 py-3 w-24 text-right">Qtd</th>
                        <th className="px-4 py-3 w-28 text-right">Preço Un.</th>
                        <th className="px-4 py-3 w-28 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {viewDetailOrder.items.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-gray-900 dark:text-white">{item.description}</p>
                            {item.code && <p className="text-[10px] font-mono text-gray-400">{item.code}</p>}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-gray-600 dark:text-gray-300">
                            {item.quantity} <span className="text-[10px]">{item.unit}</span>
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">
                            {item.unitPrice ? formatCurrency(item.unitPrice) : '-'}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">
                            {item.unitPrice && item.quantity ? formatCurrency(item.unitPrice * item.quantity) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {(viewDetailOrder.totalValue || 0) > 0 && (
                      <tfoot className="bg-green-50 dark:bg-green-900/10 border-t-2 border-green-100 dark:border-green-900/30">
                        <tr>
                          <td colSpan={3} className="px-4 py-3 text-right font-bold text-green-700 dark:text-green-500 uppercase text-xs">Total Geral</td>
                          <td className="px-4 py-3 text-right font-black text-green-700 dark:text-green-400 text-base">
                            {formatCurrency(viewDetailOrder.totalValue)}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>

              {viewDetailOrder.notes && (
                <div>
                  <h4 className="font-bold text-xs uppercase text-gray-500 mb-2">Observações</h4>
                  <p className="text-sm bg-amber-50 dark:bg-amber-900/10 text-amber-900 dark:text-amber-200 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30 whitespace-pre-line">
                    {viewDetailOrder.notes}
                  </p>
                </div>
              )}

              {/* Status History */}
              {viewDetailOrder.statusHistory && viewDetailOrder.statusHistory.length > 0 && (
                <div>
                  <h4 className="font-bold text-xs uppercase text-gray-500 mb-3 mt-4 border-t border-gray-100 pt-4">Histórico de Status</h4>
                  <div className="space-y-3">
                    {viewDetailOrder.statusHistory.map((hist, idx) => (
                      <div key={idx} className="flex gap-3 text-sm border-l-2 border-gray-200 dark:border-gray-700 pl-3 ml-2 relative">
                        <div className="absolute w-2 h-2 rounded-full bg-gray-400 -left-[5px] top-1.5 border-2 border-white dark:border-gray-900"></div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            Aterado para: <span className={`text-[10px] px-2 py-0.5 rounded ${getStatusColor(hist.status)}`}>{getStatusLabel(hist.status)}</span>
                          </p>
                          <p className="text-xs text-gray-500">
                            Por {hist.by || 'Sistema'} em {new Date(hist.date).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-black/50 border-t border-gray-100 dark:border-gray-800 flex justify-between gap-3">
              <div className="flex gap-2">
                {['draft', 'pending_approval', 'approved', 'in_progress'].includes(viewDetailOrder.status) && (
                  <button 
                    onClick={() => {
                      openForm(viewDetailOrder);
                      setViewDetailOrder(null);
                    }}
                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
                  >
                    Editar Pedido
                  </button>
                )}
              </div>
              
              <div className="flex gap-2">
                {viewDetailOrder.status !== 'completed' && viewDetailOrder.status !== 'cancelled' && (
                  <div className="flex items-center bg-gray-200 dark:bg-gray-800 rounded-xl p-1 gap-1">
                    <select 
                      className="bg-transparent text-xs font-bold px-3 outline-none text-gray-700 dark:text-gray-300"
                      onChange={(e) => {
                        if (e.target.value) {
                          quickChangeStatus(viewDetailOrder, e.target.value as OrderStatus);
                          e.target.value = ""; // reset
                        }
                      }}
                      value=""
                    >
                      <option value="" disabled>Mudar Status...</option>
                      <option value="draft">Rascunho</option>
                      <option value="pending_approval">Aguar. Aprovação</option>
                      <option value="approved">Aprovado</option>
                      <option value="in_progress">Em Andamento</option>
                      <option value="completed">Concluído</option>
                      <option value="cancelled">Cancelar Pedido</option>
                    </select>
                  </div>
                )}
                
                {viewDetailOrder.status === 'in_progress' && (
                  <button 
                    onClick={() => quickChangeStatus(viewDetailOrder, 'completed')}
                    className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all flex items-center gap-2"
                  >
                    <CheckCircle2 size={18} /> Finalizar Pedido
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                  <Download className="text-blue-600" size={20} />
                  Exportar Pedidos
                </h3>
                <button onClick={() => setShowExport(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                  <XCircle size={20} className="text-gray-400" />
                </button>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Data Inicial</label>
                    <input 
                      type="date" 
                      className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/30 text-sm font-medium"
                      value={exportDateFrom}
                      onChange={e => setExportDateFrom(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Data Final</label>
                    <input 
                      type="date" 
                      className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/30 text-sm font-medium"
                      value={exportDateTo}
                      onChange={e => setExportDateTo(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Agrupar por</label>
                  <div className="grid grid-cols-2 gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                    <button
                      onClick={() => setExportGroupBy('type')}
                      className={`py-2 text-xs font-bold rounded-lg transition-all ${exportGroupBy === 'type' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Tipo de Pedido
                    </button>
                    <button
                      onClick={() => setExportGroupBy('requester')}
                      className={`py-2 text-xs font-bold rounded-lg transition-all ${exportGroupBy === 'requester' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Solicitante
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 px-1 italic">
                    {exportGroupBy === 'type' 
                      ? '* Gera uma aba separada para Compras, Vendas e Uso Interno.' 
                      : '* Gera uma aba separada para cada pessoa que fez o pedido.'}
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={exportToXLSX}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
                  >
                    <FileText size={18} /> Gerar Planilha XLSX
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-5xl max-h-[95vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-gray-200 dark:border-gray-800">
            {/* Form Header */}
            <div className="px-6 py-4 bg-gray-900 dark:bg-black text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600/20 p-2 rounded-xl text-blue-400">
                  <ClipboardList size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">
                    {editingOrder ? 'Editar Pedido' : 'Novo Pedido'}
                  </h3>
                  <p className="text-xs text-blue-300 font-mono">{formState.orderNumber}</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="hover:bg-white/10 p-2 rounded-xl transition-colors"><XCircle size={24} /></button>
            </div>

            {/* Form Content - Split View */}
            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
              
              {/* Left Column: Form Details */}
              <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-gray-100 dark:border-gray-800 p-6 overflow-y-auto space-y-6 bg-gray-50/50 dark:bg-gray-900/50">
                <div className="space-y-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1 mb-1.5">
                        <FileText size={12} /> Tipo de Pedido
                      </label>
                      <select 
                        className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-2.5 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                        value={formState.type}
                        onChange={e => setFormState({...formState, type: e.target.value as OrderType})}
                      >
                        <option value="purchase">Compra (Fornecedor)</option>
                        <option value="sale">Venda (Cliente)</option>
                        <option value="internal">Uso Interno</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1 mb-1.5">
                        <AlertCircle size={12} /> Prioridade
                      </label>
                      <select 
                        className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-2.5 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/30"
                        value={formState.priority}
                        onChange={e => setFormState({...formState, priority: e.target.value as OrderPriority})}
                      >
                        <option value="low">Baixa</option>
                        <option value="normal">Normal</option>
                        <option value="high">Alta</option>
                        <option value="urgent">Urgente</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1 mb-1.5">
                      <User size={12} /> Solicitante / Comprador
                    </label>
                    <input 
                      type="text" 
                      placeholder="Nome de quem pediu..." 
                      className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/30"
                      value={formState.requester}
                      onChange={e => setFormState({...formState, requester: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1 mb-1.5">
                      <Building2 size={12} /> Fornecedor / Destinatário
                    </label>
                    <input 
                      type="text" 
                      placeholder="Empresa, fornecedor, cliente..." 
                      className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/30"
                      value={formState.supplier}
                      onChange={e => setFormState({...formState, supplier: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1 mb-1.5">
                        <Calendar size={12} /> Entrega Esperada
                      </label>
                      <input 
                        type="date" 
                        className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/30 text-sm"
                        value={formState.expectedDelivery}
                        onChange={e => setFormState({...formState, expectedDelivery: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1 mb-1.5">
                        <CheckCircle2 size={12} /> Status
                      </label>
                      <select 
                        className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-2.5 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/30"
                        value={formState.status}
                        onChange={e => setFormState({...formState, status: e.target.value as OrderStatus})}
                      >
                        <option value="draft">Rascunho</option>
                        <option value="pending_approval">Aguar. Aprovação</option>
                        <option value="approved">Aprovado</option>
                        <option value="in_progress">Em Andamento</option>
                        <option value="completed">Concluído</option>
                        <option value="cancelled">Cancelado</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1 mb-1.5">
                      <FileText size={12} /> Observações Internas
                    </label>
                    <textarea 
                      placeholder="Condições, CC, instruções de entrega..." 
                      rows={4}
                      className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/30 resize-none text-sm"
                      value={formState.notes}
                      onChange={e => setFormState({...formState, notes: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Items Manager */}
              <div className="flex-1 flex flex-col min-h-[500px]">
                {/* Item Entry Bar */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                  <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 flex justify-between items-center">
                    <span>Adicionar Item</span>
                    <button 
                      onClick={() => setShowItemSearch(!showItemSearch)}
                      className="text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded"
                    >
                      <Search size={12}/> Buscar no Estoque
                    </button>
                  </h4>
                  
                  {/* Warehouse Search Panel (Conditional) */}
                  {showItemSearch && (
                    <div className="mb-4 bg-gray-50 dark:bg-gray-800/80 p-3 rounded-xl border border-blue-200 dark:border-blue-900 shadow-inner relative">
                      <button onClick={() => setShowItemSearch(false)} className="absolute right-2 top-2 p-1 text-gray-400 hover:text-gray-700">
                        <XCircle size={16}/>
                      </button>
                      <input 
                        type="text" 
                        placeholder="Buscar item no estoque..." 
                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-3 py-2 rounded-lg text-sm mb-2"
                        value={itemSearchText}
                        onChange={e => setItemSearchText(e.target.value)}
                        autoFocus
                      />
                      <div className="max-h-32 overflow-y-auto rounded border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900">
                        {inventory.filter(i => 
                          i.name.toLowerCase().includes(itemSearchText.toLowerCase()) || 
                          i.code.toLowerCase().includes(itemSearchText.toLowerCase())
                        ).slice(0,10).map(item => (
                          <button 
                            key={item.id}
                            onClick={() => addItemFromInventory(item)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 border-b border-gray-50 dark:border-gray-800 flex justify-between items-center"
                          >
                            <span className="font-semibold">{item.name} <span className="text-xs text-gray-400 font-mono">({item.code})</span></span>
                            <Plus size={14} className="text-blue-500" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap md:flex-nowrap gap-2 items-end">
                    <div className="flex-1 min-w-[200px]">
                      <label className="text-[10px] text-gray-500 font-bold block mb-1">Descrição</label>
                      <input 
                        type="text" 
                        placeholder="Nome do produto ou serviço..." 
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-2 rounded-lg outline-none text-sm"
                        value={newItem.description}
                        onChange={e => setNewItem({...newItem, description: e.target.value})}
                        onKeyDown={e => e.key === 'Enter' && handleAddFreeItem()}
                      />
                    </div>
                    <div className="w-20">
                      <label className="text-[10px] text-gray-500 font-bold block mb-1">Unid.</label>
                      <input 
                        type="text" 
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-2 rounded-lg outline-none text-sm uppercase text-center"
                        value={newItem.unit}
                        onChange={e => setNewItem({...newItem, unit: e.target.value})}
                      />
                    </div>
                    <div className="w-24">
                      <label className="text-[10px] text-gray-500 font-bold block mb-1">Qtd.</label>
                      <input 
                        type="number" 
                        min="0.01" step="0.01"
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-2 rounded-lg outline-none text-sm text-center"
                        value={newItem.quantity}
                        onChange={e => setNewItem({...newItem, quantity: Number(e.target.value)})}
                      />
                    </div>
                    <div className="w-32">
                      <label className="text-[10px] text-gray-500 font-bold block mb-1">Preço Un. (R$)</label>
                      <input 
                        type="number" 
                        min="0" step="0.01"
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-2 rounded-lg outline-none text-sm text-right"
                        value={newItem.unitPrice || ''}
                        onChange={e => setNewItem({...newItem, unitPrice: Number(e.target.value)})}
                      />
                    </div>
                    <button 
                      onClick={handleAddFreeItem}
                      className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg h-[38px] w-[38px] flex items-center justify-center transition-colors"
                      disabled={!newItem.description}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50/30 dark:bg-gray-900/30">
                  {formState.items?.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
                      <Package size={48} className="mb-4 opacity-50" />
                      <p className="font-semibold text-lg text-gray-600 dark:text-gray-300">Nenhum item adicionado</p>
                      <p className="text-sm mt-2 max-w-sm">Adicione os produtos ou serviços digitando livremente no campo acima ou buscando do estoque.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {formState.items?.map((item, index) => (
                        <div key={item.id || index} className="flex flex-col md:flex-row md:items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl group relative">
                          <div className="flex-1 min-w-0">
                            <input 
                              type="text" 
                              value={item.description}
                              onChange={e => updateItem(item.id, 'description', e.target.value)}
                              className="w-full font-bold text-gray-900 dark:text-white bg-transparent outline-none hover:bg-gray-50 dark:hover:bg-gray-900 px-1 rounded transition-colors"
                            />
                            {item.warehouseItemId && (
                              <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded ml-1 font-mono uppercase">Vinc. Estoque: {item.code}</span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 p-1.5 rounded-lg border border-gray-100 dark:border-gray-700">
                            <input 
                              type="number" 
                              value={item.quantity}
                              onChange={e => updateItem(item.id, 'quantity', Number(e.target.value))}
                              className="w-16 bg-white dark:bg-gray-800 text-center text-sm font-bold outline-none py-1 border border-gray-200 dark:border-gray-700 rounded"
                            />
                            <input 
                              type="text" 
                              value={item.unit}
                              onChange={e => updateItem(item.id, 'unit', e.target.value.toUpperCase())}
                              className="w-12 bg-transparent text-center text-[10px] text-gray-500 font-bold outline-none uppercase"
                            />
                            <span className="text-gray-300">×</span>
                            <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
                              <span className="text-[10px] text-gray-400 pl-2">R$</span>
                              <input 
                                type="number" step="0.01"
                                value={item.unitPrice || 0}
                                onChange={e => updateItem(item.id, 'unitPrice', Number(e.target.value))}
                                className="w-20 bg-transparent text-right text-sm font-bold outline-none py-1 pr-2"
                              />
                            </div>
                            <span className="text-gray-300">=</span>
                            <span className="w-24 text-right pr-2 font-bold text-green-600 dark:text-green-500 text-sm">
                              {formatCurrency(item.quantity * (item.unitPrice || 0))}
                            </span>
                          </div>
                          
                          <button 
                            onClick={() => removeItem(item.id)}
                            className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors absolute -right-2 top-1/2 -translate-y-1/2 md:relative md:top-auto md:right-auto md:translate-y-0 opacity-0 group-hover:opacity-100"
                          ><Trash2 size={18} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Total Bar */}
                <div className="p-4 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <div className="text-sm font-medium text-gray-500">
                    Total de Itens: <span className="font-bold text-gray-900 dark:text-white">{formState.items?.length || 0}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-0.5">Valor Total do Pedido</p>
                    <p className="text-2xl font-black text-green-600 dark:text-green-400">
                      {formatCurrency(calculateTotal(formState.items as OrderItem[]))}
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Form Footer */}
            <div className="px-6 py-4 bg-white dark:bg-black/50 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3 sticky bottom-0">
              <button 
                onClick={() => setShowAddModal(false)}
                className="px-6 py-2 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >Cancelar</button>
              <button 
                onClick={handleSaveOrder}
                className="px-8 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!formState.requester || !formState.items?.length}
              >
                <Check size={18} /> Salvar Pedido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
