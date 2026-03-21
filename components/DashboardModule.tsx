
import React, { useMemo } from 'react';
import { 
  DollarSign, 
  Package, 
  Truck, 
  Calendar, 
  StickyNote, 
  MessageSquare, 
  TrendingUp, 
  AlertCircle,
  Clock,
  LayoutDashboard,
  Plus
} from 'lucide-react';
import { 
  FinancialTransaction, 
  KanbanState, 
  UserEvent, 
  ImportantNote, 
  LogisticsState,
  WhatsAppHistoryItem
} from '../types';

interface DashboardModuleProps {
  financialTransactions: FinancialTransaction[];
  warehouseInventory: any[];
  kanbanData: KanbanState;
  calendarEvents: UserEvent[];
  importantNotes: ImportantNote[];
  logisticsData: LogisticsState;
  whatsappHistory: WhatsAppHistoryItem[];
  setActiveTab: (tab: string) => void;
}

const Widget: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; onClick?: () => void }> = ({ title, icon, children, onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white dark:bg-gray-800 p-5 rounded-2xl border border-palette-mediumDark dark:border-gray-700 shadow-sm hover:shadow-md transition-all group ${onClick ? 'cursor-pointer' : ''}`}
  >
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-palette-mediumLight dark:bg-gray-700 rounded-lg text-palette-darkest dark:text-gray-300 group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-200">{title}</h3>
      </div>
      {onClick && <Plus size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />}
    </div>
    {children}
  </div>
);

export const DashboardModule: React.FC<DashboardModuleProps> = ({
  financialTransactions,
  warehouseInventory,
  kanbanData,
  calendarEvents,
  importantNotes,
  logisticsData,
  whatsappHistory,
  setActiveTab
}) => {
  // Financial Stats
  const financialStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthTrans = financialTransactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const income = monthTrans.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = monthTrans.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [financialTransactions]);

  // Warehouse Alerts
  const lowStockItems = useMemo(() => {
    return (warehouseInventory || [])
      .filter(i => i.quantity <= i.minStock)
      .sort((a, b) => (a.quantity / a.minStock) - (b.quantity / b.minStock))
      .slice(0, 4);
  }, [warehouseInventory]);

  // Kanban Snapshot
  const kanbanStats = useMemo(() => {
    return kanbanData.columns.map(col => ({
      title: col.title,
      count: col.cards.length,
      color: col.color
    }));
  }, [kanbanData]);

  // Upcoming Events
  const upcomingEvents = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return calendarEvents
      .filter(e => e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 3);
  }, [calendarEvents]);

  // Recent Notes
  const recentNotes = useMemo(() => {
    return [...importantNotes]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 3);
  }, [importantNotes]);

  return (
    <div className="p-6 h-full overflow-y-auto bg-palette-mediumLight dark:bg-[#111111]/50">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <LayoutDashboard className="text-palette-darkest dark:text-white" size={24} />
            Resumo Geral
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Bem-vindo ao seu painel de controle personalizado.</p>
        </div>

        {/* Top Row: Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 rounded-2xl text-white shadow-lg shadow-emerald-500/20">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium opacity-80 uppercase tracking-wider">Saldo Mensal</span>
              <TrendingUp size={18} className="opacity-80" />
            </div>
            <p className="text-2xl font-bold">R$ {financialStats.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <div className="mt-2 text-xs opacity-80 flex items-center gap-2">
              <span className="bg-white/20 px-1.5 py-0.5 rounded">↑ {financialStats.income.toLocaleString('pt-BR')}</span>
              <span className="bg-black/10 px-1.5 py-0.5 rounded">↓ {financialStats.expense.toLocaleString('pt-BR')}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-palette-mediumDark dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg">
                <AlertCircle size={18} />
              </div>
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estoque Crítico</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{lowStockItems.length} itens</p>
            <p className="text-[10px] text-gray-400 mt-1 italic">Itens abaixo do estoque mínimo</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-palette-mediumDark dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                <Clock size={18} />
              </div>
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tarefas Ativas</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {kanbanData.columns.find(c => c.id === 'col_doing')?.cards.length || 0} em andamento
            </p>
            <p className="text-[10px] text-gray-400 mt-1 italic">No quadro Kanban</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-palette-mediumDark dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                <Calendar size={18} />
              </div>
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Próximos Eventos</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{upcomingEvents.length} marcados</p>
            <p className="text-[10px] text-gray-400 mt-1 italic">Para os próximos dias</p>
          </div>
        </div>

        {/* Main Grid Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Warehouse Widget */}
          <Widget title="Almoxarifado" icon={<Package size={18} />} onClick={() => setActiveTab('warehouse')}>
            <div className="space-y-3">
              {lowStockItems.length > 0 ? (
                lowStockItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400 truncate max-w-[150px]">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-red-500">{item.quantity}</span>
                      <span className="text-gray-400 text-[10px]">/ {item.minStock}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-center text-gray-400 py-4 italic">Tudo sob controle no estoque</p>
              )}
            </div>
          </Widget>

          {/* Kanban Widget */}
          <Widget title="Kanban" icon={<TrendingUp size={18} />} onClick={() => setActiveTab('office')}>
            <div className="space-y-3 mt-1">
              {kanbanStats.map(stat => (
                <div key={stat.title} className="space-y-1">
                  <div className="flex justify-between text-[10px] font-medium text-gray-500 dark:text-gray-400">
                    <span>{stat.title}</span>
                    <span>{stat.count}</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-palette-darkest dark:bg-white" 
                      style={{ width: `${Math.min(100, (stat.count / (kanbanData.columns.reduce((acc, c) => acc + c.cards.length, 0) || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Widget>

          {/* Financial Widget */}
          <Widget title="Financeiro" icon={<DollarSign size={18} />} onClick={() => setActiveTab('financial')}>
            <div className="space-y-4">
              <div className="flex justify-around text-center">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-tighter">Entradas</p>
                  <p className="text-sm font-bold text-emerald-500">R$ {financialStats.income.toLocaleString()}</p>
                </div>
                <div className="w-px h-8 bg-gray-100 dark:bg-gray-700 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-tighter">Saídas</p>
                  <p className="text-sm font-bold text-rose-500">R$ {financialStats.expense.toLocaleString()}</p>
                </div>
              </div>
              <div className="bg-palette-mediumLight dark:bg-gray-700/50 p-3 rounded-xl flex items-center justify-between">
                 <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Total Líquido</span>
                 <span className={`text-sm font-bold ${financialStats.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    R$ {financialStats.balance.toLocaleString()}
                 </span>
              </div>
            </div>
          </Widget>

          {/* Calendar Widget */}
          <Widget title="Calendário" icon={<Calendar size={18} />} onClick={() => setActiveTab('calendar')}>
            <div className="space-y-3">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map(event => (
                  <div key={event.id} className="flex items-start gap-3 text-xs">
                    <div className="bg-palette-mediumLight dark:bg-gray-700 px-2 py-1 rounded text-[10px] font-bold text-palette-darkest dark:text-white uppercase whitespace-nowrap">
                      {new Date(event.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </div>
                    <div className="flex-1 truncate">
                      <p className="font-semibold text-gray-700 dark:text-gray-200 truncate">{event.title}</p>
                      <p className="text-[10px] text-gray-400 capitalize">{event.type}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-center text-gray-400 py-4 italic">Nenhum evento próximo</p>
              )}
            </div>
          </Widget>

          {/* Notes Widget */}
          <Widget title="Anotações Recentes" icon={<StickyNote size={18} />} onClick={() => setActiveTab('office')}>
            <div className="space-y-3">
              {recentNotes.length > 0 ? (
                recentNotes.map(note => (
                  <div key={note.id} className="p-2 border border-palette-mediumLight dark:border-gray-700 rounded-lg bg-gray-50/50 dark:bg-gray-900/30">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">{note.title}</p>
                    <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">{note.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-center text-gray-400 py-4 italic">Sem notas cadastradas</p>
              )}
            </div>
          </Widget>

          {/* WhatsApp Widget */}
          <Widget title="Últimas Mensagens" icon={<MessageSquare size={18} />} onClick={() => setActiveTab('whatsapp')}>
            <div className="space-y-3">
              {whatsappHistory.slice(0, 3).length > 0 ? (
                whatsappHistory.slice(0, 3).map(msg => (
                  <div key={msg.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center flex-shrink-0">
                      <MessageSquare size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">{msg.name || msg.phone}</p>
                      <p className="text-[10px] text-gray-400 truncate">{msg.message}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-center text-gray-400 py-4 italic">Nenhum contato recente</p>
              )}
            </div>
          </Widget>

          {/* Logistics Widget */}
          <Widget title="Logística" icon={<Truck size={18} />} onClick={() => setActiveTab('logistics')}>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-2 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-palette-mediumLight dark:border-gray-700">
                <p className="text-lg font-bold text-palette-darkest dark:text-white">{logisticsData.freightTables.length}</p>
                <p className="text-[10px] text-gray-400 uppercase">Tabelas</p>
              </div>
              <div className="p-2 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-palette-mediumLight dark:border-gray-700">
                <p className="text-lg font-bold text-palette-darkest dark:text-white">{logisticsData.savedRoutes?.length || 0}</p>
                <p className="text-[10px] text-gray-400 uppercase">Rotas</p>
              </div>
            </div>
          </Widget>

        </div>
      </div>
    </div>
  );
};
