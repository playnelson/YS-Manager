'use client';

import { generateUUID } from '../uuid';
import React, { useState, useEffect } from 'react';
import { DollarSign, Calculator, Percent, TrendingUp, Info, RefreshCw, Save, Trash2, History } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PricingCalculation {
  id: string;
  name: string;
  cost: number;
  markup: number;
  price: number;
  date: string;
}

export const PricingCalculator: React.FC = () => {
  const [cost, setCost] = useState<string>('');
  const [markup, setMarkup] = useState<string>('30');
  const [taxes, setTaxes] = useState<string>('15');
  const [fixedCosts, setFixedCosts] = useState<string>('10');
  const [otherFees, setOtherFees] = useState<string>('0');
  
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [profit, setProfit] = useState<number>(0);
  const [marginPct, setMarginPct] = useState<number>(0);
  
  const [name, setName] = useState('');
  const [history, setHistory] = useState<PricingCalculation[]>(() => {
    const saved = localStorage.getItem('ysoffice_pricing_history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const c = parseFloat(cost) || 0;
    const m = parseFloat(markup) || 0;
    const t = parseFloat(taxes) || 0;
    const f = parseFloat(fixedCosts) || 0;
    const o = parseFloat(otherFees) || 0;

    // Fórmula de Markup Divisor: Preço = Custo / (1 - (Soma das % / 100))
    const totalDespesas = (m + t + f + o);
    
    if (totalDespesas >= 100) {
      setSellingPrice(0);
      setProfit(0);
      setMarginPct(0);
      return;
    }

    const divisor = (100 - totalDespesas) / 100;
    const price = c / divisor;
    
    setSellingPrice(price);
    setProfit(price - c);
    setMarginPct(m);
  }, [cost, markup, taxes, fixedCosts, otherFees]);

  const saveCalculation = () => {
    if (!name || sellingPrice <= 0) return alert("Dê um nome e insira um custo válido.");
    const newItem: PricingCalculation = {
      id: generateUUID(),
      name,
      cost: parseFloat(cost),
      markup: parseFloat(markup),
      price: sellingPrice,
      date: new Date().toISOString()
    };
    const newHistory = [newItem, ...history].slice(0, 20);
    setHistory(newHistory);
    localStorage.setItem('ysoffice_pricing_history', JSON.stringify(newHistory));
    setName('');
  };

  const deleteHistory = (id: string) => {
    const newHistory = history.filter(h => h.id !== id);
    setHistory(newHistory);
    localStorage.setItem('ysoffice_pricing_history', JSON.stringify(newHistory));
  };

  const formatBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="h-full flex flex-col gap-4 bg-win95-bg p-4 overflow-y-auto custom-scrollbar">
      <div className="bg-[#000080] text-white px-2 py-1 text-sm font-bold flex items-center gap-2 shrink-0">
        <Calculator size={16} /> Calculadora de Precificação Profissional
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Formulário de Input */}
        <div className="flex-1 space-y-4">
          <div className="win95-raised p-4 bg-[#d4d0c8]">
            <h3 className="text-xs font-black uppercase mb-4 border-b border-gray-400 pb-1 flex items-center gap-2">
               <DollarSign size={14}/> Custos e Variáveis
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-700">Custo Unitário (R$)</label>
                  <input 
                    type="number" 
                    className="w-full win95-sunken px-2 py-1.5 font-mono font-bold text-lg text-blue-900"
                    value={cost}
                    onChange={e => setCost(e.target.value)}
                    placeholder="0,00"
                  />
               </div>

               <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-700">Margem de Lucro Desejada (%)</label>
                  <div className="relative">
                    <input 
                        type="number" 
                        className="w-full win95-sunken px-2 py-1.5 font-bold"
                        value={markup}
                        onChange={e => setMarkup(e.target.value)}
                    />
                    <Percent size={12} className="absolute right-2 top-2.5 text-gray-400" />
                  </div>
               </div>

               <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-700">Impostos sobre Venda (%)</label>
                  <div className="relative">
                    <input 
                        type="number" 
                        className="w-full win95-sunken px-2 py-1.5"
                        value={taxes}
                        onChange={e => setTaxes(e.target.value)}
                    />
                    <Percent size={12} className="absolute right-2 top-2.5 text-gray-400" />
                  </div>
               </div>

               <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-700">Custos Fixos / Operacionais (%)</label>
                  <div className="relative">
                    <input 
                        type="number" 
                        className="w-full win95-sunken px-2 py-1.5"
                        value={fixedCosts}
                        onChange={e => setFixedCosts(e.target.value)}
                    />
                    <Percent size={12} className="absolute right-2 top-2.5 text-gray-400" />
                  </div>
               </div>

               <div className="space-y-1 col-span-full">
                  <label className="text-[10px] font-bold uppercase text-gray-700">Taxas de Plataforma / Outros (%)</label>
                  <div className="relative">
                    <input 
                        type="number" 
                        className="w-full win95-sunken px-2 py-1.5"
                        value={otherFees}
                        onChange={e => setOtherFees(e.target.value)}
                    />
                    <Percent size={12} className="absolute right-2 top-2.5 text-gray-400" />
                  </div>
               </div>
            </div>

            <div className="mt-6 flex gap-2">
                <input 
                    className="flex-1 win95-sunken px-2 text-xs"
                    placeholder="Nome do Produto para Salvar..."
                    value={name}
                    onChange={e => setName(e.target.value)}
                />
                <Button onClick={saveCalculation} icon={<Save size={14}/>}>SALVAR</Button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-3 text-[10px] text-blue-800 flex gap-2 items-start">
             <Info size={16} className="shrink-0"/>
             <p>A calculadora utiliza o método <b>Markup Divisor</b>, que garante que a margem de lucro informada seja calculada sobre o <b>preço de venda final</b> e não apenas sobre o custo, protegendo sua rentabilidade contra as taxas e impostos.</p>
          </div>
        </div>

        {/* Resultado em Tempo Real */}
        <div className="w-full lg:w-80 space-y-4">
           <div className="win95-raised p-4 bg-white border-2 border-win95-blue h-full flex flex-col">
              <h3 className="text-xs font-black uppercase mb-4 text-win95-blue flex items-center gap-2">
                 <TrendingUp size={16}/> Resultado Sugerido
              </h3>

              <div className="flex-1 space-y-6">
                 <div className="text-center p-4 bg-gray-50 win95-sunken">
                    <span className="text-[10px] font-bold uppercase text-gray-500 block mb-1">Preço de Venda Final</span>
                    <div className={`text-3xl font-black ${sellingPrice > 0 ? 'text-green-700' : 'text-gray-300'}`}>
                       {formatBRL(sellingPrice)}
                    </div>
                 </div>

                 <div className="space-y-3">
                    <div className="flex justify-between border-b border-gray-100 pb-1">
                       <span className="text-[10px] font-bold text-gray-500 uppercase">Lucro Bruto:</span>
                       <span className="text-xs font-black text-green-600">{formatBRL(profit)}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-1">
                       <span className="text-[10px] font-bold text-gray-500 uppercase">Margem Efetiva:</span>
                       <span className="text-xs font-black">{marginPct}%</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-1">
                       <span className="text-[10px] font-bold text-gray-500 uppercase">Markup Multiplicador:</span>
                       <span className="text-xs font-mono">{(sellingPrice / (parseFloat(cost) || 1)).toFixed(2)}x</span>
                    </div>
                 </div>

                 <div className="pt-4 mt-auto">
                    <div className="text-[9px] font-bold uppercase text-gray-400 mb-2">Composição do Preço</div>
                    <div className="w-full h-4 bg-gray-200 flex rounded-full overflow-hidden border border-gray-300 shadow-inner">
                       <div className="bg-blue-600 h-full" style={{ width: `${(parseFloat(cost)/sellingPrice)*100}%` }} title="Custo"></div>
                       <div className="bg-red-500 h-full" style={{ width: `${(parseFloat(taxes)/100)*100}%` }} title="Impostos"></div>
                       <div className="bg-orange-400 h-full" style={{ width: `${(parseFloat(fixedCosts)/100)*100}%` }} title="Fixos"></div>
                       <div className="bg-green-500 h-full" style={{ width: `${(parseFloat(markup)/100)*100}%` }} title="Lucro"></div>
                    </div>
                    <div className="flex justify-between text-[8px] font-bold uppercase mt-1 opacity-60">
                       <span>Custo</span>
                       <span>Impostos</span>
                       <span>Lucro</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Histórico Recente */}
      <div className="win95-raised p-2 bg-[#d4d0c8] mt-4">
         <div className="bg-[#808080] text-white px-2 py-1 text-[10px] font-bold uppercase mb-2 flex items-center gap-2">
            <History size={12} /> Cálculos Recentes
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            {history.length === 0 ? (
                <div className="col-span-full text-center p-4 text-gray-500 italic text-[10px]">Nenhum cálculo salvo.</div>
            ) : (
                history.map(h => (
                    <div key={h.id} className="win95-sunken bg-white p-2 flex justify-between items-start group">
                        <div>
                            <div className="text-[10px] font-black uppercase truncate max-w-[120px]">{h.name}</div>
                            <div className="text-xs font-black text-green-700">{formatBRL(h.price)}</div>
                            <div className="text-[8px] text-gray-400">{new Date(h.date).toLocaleDateString()}</div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <button onClick={() => {
                                setCost(h.cost.toString());
                                setMarkup(h.markup.toString());
                            }} className="p-1 hover:bg-blue-50 text-blue-600"><RefreshCw size={10}/></button>
                            <button onClick={() => deleteHistory(h.id)} className="p-1 hover:bg-red-50 text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={10}/></button>
                        </div>
                    </div>
                ))
            )}
         </div>
      </div>
    </div>
  );
};
