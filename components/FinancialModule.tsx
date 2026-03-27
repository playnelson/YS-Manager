'use client';

import { generateUUID } from '../uuid';
import React, { useState, useMemo } from 'react';
import {
  Wallet, TrendingUp, TrendingDown, Plus, Trash2,
  DollarSign, Calendar, Tag, FileText, PieChart,
  ArrowUpCircle, ArrowDownCircle, Filter, ChevronDown,
  Briefcase, Home, ShoppingCart, Car, HeartPulse, MoreHorizontal
} from 'lucide-react';
import { FinancialTransaction, TransactionType } from '@/types';
import { Button } from '@/components/ui/Button';

interface FinancialModuleProps {
  transactions: FinancialTransaction[];
  onChange: (transactions: FinancialTransaction[]) => void;
}

const CATEGORIES = [
  { id: 'Trabalho', icon: <Briefcase size={12} />, color: 'text-blue-600' },
  { id: 'Moradia', icon: <Home size={12} />, color: 'text-orange-600' },
  { id: 'Alimentação', icon: <ShoppingCart size={12} />, color: 'text-green-600' },
  { id: 'Transporte', icon: <Car size={12} />, color: 'text-purple-600' },
  { id: 'Saúde', icon: <HeartPulse size={12} />, color: 'text-red-600' },
  { id: 'Outros', icon: <MoreHorizontal size={12} />, color: 'text-gray-600' },
];

export const FinancialModule: React.FC<FinancialModuleProps> = ({ transactions = [], onChange }) => {
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState('Outros');
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().substring(0, 7));

  // --- Lógica de Cálculos ---
  const filtered = useMemo(() => {
    return transactions.filter(t => t.date.startsWith(filterMonth));
  }, [transactions, filterMonth]);

  const totals = useMemo(() => {
    return filtered.reduce((acc, t) => {
      if (t.type === 'income') acc.income += t.amount;
      else acc.expense += t.amount;
      return acc;
    }, { income: 0, expense: 0 });
  }, [filtered]);

  const balance = totals.income - totals.expense;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amount) return;

    const newEntry: FinancialTransaction = {
      id: generateUUID(),
      description: desc,
      amount: parseFloat(amount),
      type,
      category,
      date: new Date().toISOString()
    };

    onChange([newEntry, ...transactions]);
    setDesc('');
    setAmount('');
  };

  const removeEntry = (id: string) => {
    if (confirm("Remover este registro financeiro?")) {
      onChange(transactions.filter(t => t.id !== id));
    }
  };

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="h-full flex flex-col bg-palette-lightest dark:bg-[#1a1a1a] overflow-hidden p-1">
      {/* TOOLBAR SUPERIOR */}
      <div className="win95-raised p-2 flex justify-between items-center bg-palette-lightest dark:bg-[#1a1a1a] shrink-0 mb-2 border-b border-palette-lightest dark:border-gray-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-2">
            <Wallet size={18} className="text-[#000080] dark:text-blue-400" />
            <h2 className="text-xs font-black uppercase text-black dark:text-white tracking-tight">Fluxo de Caixa Profissional</h2>
          </div>
          <div className="win95-sunken bg-palette-lightest dark:bg-gray-800 flex items-center gap-2 px-2 py-1 border border-palette-mediumDark dark:border-gray-700">
            <Calendar size={14} className="text-gray-400" />
            <input
              type="month"
              className="bg-transparent text-[10px] font-bold outline-none border-none uppercase text-black dark:text-white"
              value={filterMonth}
              onChange={e => setFilterMonth(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-gray-500 uppercase">Status do Ledger:</span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_green] dark:shadow-[0_0_8px_green]"></div>
            <span className="text-[9px] font-black text-green-700 dark:text-green-500">ONLINE</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-2 overflow-hidden">
        {/* COLUNA ESQUERDA: DASHBOARD & NOVO LANÇAMENTO */}
        <div className="w-80 flex flex-col gap-2 shrink-0">
          {/* Dashboard Cards */}
          <div className="win95-raised p-3 bg-palette-mediumLight dark:bg-[#1a1a1a] space-y-3 shadow-md border border-palette-lightest dark:border-gray-800">
            <div className="win95-sunken bg-palette-lightest dark:bg-gray-800 p-3 border-l-4 border-l-blue-600 dark:border-l-blue-500 border border-palette-mediumDark dark:border-gray-700">
              <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Receita Mensal</span>
              <div className="flex items-center justify-between">
                <span className="text-lg font-black text-blue-700 dark:text-blue-400">{formatBRL(totals.income)}</span>
                <ArrowUpCircle size={20} className="text-blue-200 dark:text-blue-900" />
              </div>
            </div>

            <div className="win95-sunken bg-palette-lightest dark:bg-gray-800 p-3 border-l-4 border-l-red-600 dark:border-l-red-500 border border-palette-mediumDark dark:border-gray-700">
              <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Despesa Mensal</span>
              <div className="flex items-center justify-between">
                <span className="text-lg font-black text-red-700 dark:text-red-400">{formatBRL(totals.expense)}</span>
                <ArrowDownCircle size={20} className="text-red-200 dark:text-red-900" />
              </div>
            </div>

            <div className={`win95-sunken p-3 border-l-4 border border-palette-mediumDark dark:border-gray-700 ${balance >= 0 ? 'bg-green-50 dark:bg-green-900/20 border-l-green-600 dark:border-l-green-500' : 'bg-red-50 dark:bg-red-900/20 border-l-red-600 dark:border-l-red-500'}`}>
              <span className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Saldo Líquido</span>
              <div className="flex items-center justify-between">
                <span className={`text-xl font-black ${balance >= 0 ? 'text-green-800 dark:text-green-400' : 'text-red-800 dark:text-red-400'}`}>
                  {formatBRL(balance)}
                </span>
                <PieChart size={20} className="opacity-20 dark:opacity-10" />
              </div>
            </div>
          </div>

          {/* Formulário de Lançamento */}
          <div className="flex-1 win95-raised p-4 bg-palette-lightest dark:bg-[#1a1a1a] flex flex-col border border-palette-lightest dark:border-gray-800">
            <h3 className="text-[10px] font-black uppercase mb-4 flex items-center gap-2 border-b border-palette-mediumLight dark:border-gray-700 pb-1 text-black dark:text-white">
              <Plus size={14} /> Novo Lançamento
            </h3>

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="text-[9px] font-bold uppercase text-gray-600 dark:text-gray-400 block mb-1">Descrição</label>
                <input
                  className="w-full win95-sunken px-2 py-1.5 text-xs outline-none bg-palette-lightest dark:bg-gray-800 text-black dark:text-white font-bold border border-palette-mediumDark dark:border-gray-700"
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  placeholder="Ex: Salário, Aluguel..."
                />
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase text-gray-600 dark:text-gray-400 block mb-1">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full win95-sunken px-2 py-1.5 text-xs outline-none bg-palette-lightest dark:bg-gray-800 font-mono font-bold text-palette-darkest dark:text-blue-400 border border-palette-mediumDark dark:border-gray-700"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0,00"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase text-gray-600 dark:text-gray-400 block mb-1">Tipo de Operação</label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setType('income')}
                    className={`flex-1 py-1.5 text-[10px] font-black uppercase border-2 flex items-center justify-center gap-1 ${type === 'income' ? 'win95-sunken bg-green-100 dark:bg-green-900/20 border-green-600 dark:border-green-500 text-green-800 dark:text-green-400' : 'win95-raised bg-palette-mediumLight dark:bg-gray-800 border-palette-lightest dark:border-gray-700 text-palette-darkest/50 dark:text-gray-600'}`}
                  >
                    <TrendingUp size={12} /> Entrada
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={`flex-1 py-1.5 text-[10px] font-black uppercase border-2 flex items-center justify-center gap-1 ${type === 'expense' ? 'win95-sunken bg-red-100 dark:bg-red-900/20 border-red-600 dark:border-red-500 text-red-800 dark:text-red-400' : 'win95-raised bg-gray-100 dark:bg-gray-800 border-white dark:border-gray-700 text-gray-400 dark:text-gray-600'}`}
                  >
                    <TrendingDown size={12} /> Saída
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase text-gray-600 dark:text-gray-400 block mb-1">Categoria</label>
                <div className="grid grid-cols-2 gap-1">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`px-2 py-1.5 text-[9px] font-bold flex items-center gap-1.5 transition-all border ${category === cat.id ? 'bg-palette-lightest dark:bg-gray-800 border-palette-darkest dark:border-blue-500 shadow-inner text-black dark:text-white' : 'bg-palette-mediumLight dark:bg-[#222] border-palette-mediumDark dark:border-gray-700 hover:bg-palette-lightest dark:hover:bg-gray-800 text-black dark:text-white'}`}
                    >
                      <span className={cat.color}>{cat.icon}</span>
                      {cat.id.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <Button type="submit" className="w-full h-10 bg-[#000080] dark:bg-blue-900 text-white" icon={<DollarSign size={16} />}>
                  CONFIRMAR LANÇAMENTO
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* COLUNA DIREITA: LIVRO CAIXA (LEDGER) */}
        <div className="flex-1 win95-sunken bg-palette-lightest dark:bg-gray-900 flex flex-col overflow-hidden relative border border-palette-mediumDark dark:border-gray-800">
          <div className="bg-palette-darkest dark:bg-blue-900 text-white p-2 flex justify-between items-center shrink-0 shadow-sm border-b-2 border-palette-lightest dark:border-gray-800">
            <div className="flex items-center gap-2">
              <FileText size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Livro Caixa de {new Date(filterMonth + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}</span>
            </div>
            <span className="text-[9px] font-bold opacity-60">Visualizando {filtered.length} registros</span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filtered.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center grayscale opacity-30">
                <TrendingUp size={64} className="mb-4 text-gray-300 dark:text-gray-700" />
                <p className="text-xs font-black uppercase tracking-widest text-black dark:text-white">Nenhuma movimentação este mês</p>
                <p className="text-[10px] font-bold">Lançamentos via painel lateral serão listados aqui.</p>
              </div>
            ) : (
              <table className="w-full text-left text-[11px] border-collapse">
                <thead className="bg-palette-mediumLight dark:bg-gray-800 sticky top-0 z-10 border-b-2 border-palette-mediumDark dark:border-gray-700">
                  <tr>
                    <th className="p-3 font-black text-palette-darkest/60 dark:text-gray-400 uppercase border-r border-palette-mediumLight dark:border-gray-700">Data</th>
                    <th className="p-3 font-black text-palette-darkest/60 dark:text-gray-400 uppercase border-r border-palette-mediumLight dark:border-gray-700">Categoria</th>
                    <th className="p-3 font-black text-palette-darkest/60 dark:text-gray-400 uppercase border-r border-palette-mediumLight dark:border-gray-700">Descrição</th>
                    <th className="p-3 font-black text-palette-darkest/60 dark:text-gray-400 uppercase border-r border-palette-mediumLight dark:border-gray-700 text-right">Valor</th>
                    <th className="p-3 text-center w-10 text-palette-darkest/60 dark:text-gray-400">...</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filtered.map(tx => {
                    const catIcon = CATEGORIES.find(c => c.id === tx.category)?.icon || <Tag size={12} />;
                    const isInc = tx.type === 'income';
                    return (
                      <tr key={tx.id} className="hover:bg-palette-mediumLight/50 dark:hover:bg-blue-900/10 group transition-colors">
                        <td className="p-3 font-mono font-bold text-palette-darkest/40 dark:text-gray-500 border-r border-palette-mediumLight dark:border-gray-800">
                          {new Date(tx.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </td>
                        <td className="p-3 border-r border-palette-mediumLight dark:border-gray-800">
                          <div className="flex items-center gap-2">
                            <span className={`p-1 bg-palette-mediumLight dark:bg-gray-800 rounded border border-palette-mediumDark dark:border-gray-700 ${isInc ? 'text-blue-600 dark:text-blue-400' : 'text-palette-darkest/40 dark:text-gray-500'}`}>{catIcon}</span>
                            <span className="font-black text-palette-darkest/60 dark:text-gray-400 uppercase tracking-tighter">{tx.category}</span>
                          </div>
                        </td>
                        <td className="p-3 border-r border-palette-mediumLight dark:border-gray-800 font-bold text-black dark:text-white uppercase">
                          {tx.description}
                        </td>
                        <td className={`p-3 text-right border-r border-palette-mediumLight dark:border-gray-800 font-black text-sm ${isInc ? 'text-green-700 dark:text-green-500' : 'text-red-700 dark:text-red-500'}`}>
                          {isInc ? '+' : '-'} {formatBRL(tx.amount)}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => removeEntry(tx.id)}
                            className="text-gray-300 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="p-2 bg-palette-mediumLight dark:bg-gray-800 border-t-2 border-palette-mediumDark dark:border-gray-700 flex justify-between items-center italic text-[9px] font-bold text-palette-darkest/40 dark:text-gray-500 uppercase">
            <div className="flex gap-4">
              <span>Ref: BD_FINANCE_v1.2</span>
              <span>•</span>
              <span>Dados Criptografados no Supabase</span>
            </div>
            <Button variant="secondary" size="sm" icon={<TrendingUp size={12} />} onClick={() => window.print()}>EXPORTAR RELATÓRIO</Button>
          </div>
        </div>
      </div>
    </div>
  );
};
