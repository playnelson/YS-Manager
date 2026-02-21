
import React, { useState, useEffect } from 'react';
import { 
  Calculator, Search, Book, CheckSquare, Anchor, Truck, 
  MapPin, Scale, Plus, Trash2, Save, Info, ChevronRight,
  Globe, Box, FileText, CheckCircle2, AlertCircle, Navigation
} from 'lucide-react';
import { LogisticsState, FreightTable, LogisticsChecklist } from '../types';

interface LogisticsModuleProps {
  data: LogisticsState;
  onChange: (data: LogisticsState) => void;
}

const GLOSSARY = [
  { term: 'NCM', definition: 'Nomenclatura Comum do Mercosul. Código de 8 dígitos para identificar mercadorias.' },
  { term: 'CFOP', definition: 'Código Fiscal de Operações e Prestações. Identifica a natureza da circulação de mercadorias.' },
  { term: 'CE Mercante', definition: 'Conhecimento de Embarque Eletrônico. Registro no sistema da Marinha Mercante.' },
  { term: 'BL', definition: 'Bill of Lading. Conhecimento de embarque marítimo, título de propriedade da carga.' },
  { term: 'HBL', definition: 'House Bill of Lading. BL emitido por um agente de carga (NVOCC).' },
  { term: 'THC', definition: 'Terminal Handling Charge. Taxa de movimentação de contêiner no terminal portuário.' },
  { term: 'DTA', definition: 'Declaração de Trânsito Aduaneiro. Permite mover carga entre recintos alfandegados com suspensão de impostos.' },
  { term: 'TEU', definition: 'Twenty-foot Equivalent Unit. Unidade padrão de medida para contêineres de 20 pés.' },
  { term: 'FEU', definition: 'Forty-foot Equivalent Unit. Unidade padrão para contêineres de 40 pés.' },
  { term: 'SISCARGA', definition: 'Sistema de Controle de Carga e de Trânsito na Importação e Exportação.' },
];

const PORT_CODES = [
  { city: 'Santos', code: 'BRSSZ', type: 'Porto' },
  { city: 'Itajaí', code: 'BRITJ', type: 'Porto' },
  { city: 'Paranaguá', code: 'BRPNG', type: 'Porto' },
  { city: 'Rio Grande', code: 'BRRIG', type: 'Porto' },
  { city: 'Vitória', code: 'BRVIX', type: 'Porto' },
  { city: 'Salvador', code: 'BRSSA', type: 'Porto' },
  { city: 'Manaus', code: 'BRMAO', type: 'Porto/EADI' },
  { city: 'Suape', code: 'BRSUA', type: 'Porto' },
  { city: 'Pecém', code: 'BRPEC', type: 'Porto' },
  { city: 'Rio de Janeiro', code: 'BRRIO', type: 'Porto' },
];

export const LogisticsModule: React.FC<LogisticsModuleProps> = ({ data, onChange }) => {
  const [activeTab, setActiveTab] = useState<'costs' | 'search' | 'tools' | 'checklists' | 'routing' | 'map' | 'scales'>('costs');

  // --- Cost Calculator State ---
  const [calc, setCalc] = useState({
    km: 0,
    tolls: 0,
    fuelPrice: 5.80,
    avgConsumption: 2.5,
    driverDays: 1,
    driverPerDieum: 150,
    containerCost: 0,
    portFees: 0,
    cargoValue: 0,
    insuranceRate: 0.1, // %
  });

  const [tableName, setTableName] = useState('');

  const totalCost = (
    (calc.km / (calc.avgConsumption || 1)) * calc.fuelPrice +
    calc.tolls +
    (calc.driverDays * calc.driverPerDieum) +
    calc.containerCost +
    calc.portFees +
    (calc.cargoValue * (calc.insuranceRate / 100))
  );

  const handleSaveTable = () => {
    if (!tableName) return;
    const newTable: FreightTable = {
      id: crypto.randomUUID(),
      name: tableName,
      fuelPrice: calc.fuelPrice,
      avgConsumption: calc.avgConsumption,
      driverPerDieum: calc.driverPerDieum,
      insuranceRate: calc.insuranceRate,
      updatedAt: new Date().toISOString()
    };
    onChange({ ...data, freightTables: [newTable, ...(data.freightTables || [])] });
    setTableName('');
  };

  const loadTable = (table: FreightTable) => {
    setCalc({
      ...calc,
      fuelPrice: table.fuelPrice,
      avgConsumption: table.avgConsumption,
      driverPerDieum: table.driverPerDieum,
      insuranceRate: table.insuranceRate
    });
  };

  // --- Search State ---
  const [cep, setCep] = useState('');
  const [cepResult, setCepResult] = useState<any>(null);
  const [portSearch, setPortSearch] = useState('');
  const [loadingCep, setLoadingCep] = useState(false);

  const searchCep = async () => {
    if (cep.length < 8) return;
    setLoadingCep(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cep/v1/${cep}`);
      const json = await res.json();
      setCepResult(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCep(false);
    }
  };

  // --- Checklists State ---
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  
  const handleAddChecklist = (type: 'maritime' | 'land' | 'custom') => {
    let items: string[] = [];
    let title = '';

    if (type === 'maritime') {
      title = 'Checklist Embarque Marítimo';
      items = ['BL Draft aprovado?', 'Packing List pronto?', 'Invoice assinada?', 'SISCARGA inserido?', 'VGM declarado?'];
    } else if (type === 'land') {
      title = 'Checklist Rastreamento Terrestre';
      items = ['Documento motorista OK?', 'Lacre conferido?', 'Isca de carga ativa?', 'Checklist do veículo OK?', 'Manifesto emitido?'];
    } else {
      title = newChecklistTitle || 'Novo Checklist';
      items = ['Item 1'];
    }

    const newList: LogisticsChecklist = {
      id: crypto.randomUUID(),
      title,
      items: items.map(label => ({ id: crypto.randomUUID(), label, completed: false })),
      updatedAt: new Date().toISOString()
    };

    onChange({ ...data, checklists: [newList, ...(data.checklists || [])] });
    setNewChecklistTitle('');
  };

  const toggleChecklistItem = (listId: string, itemId: string) => {
    const updated = data.checklists.map(list => {
      if (list.id === listId) {
        return {
          ...list,
          items: list.items.map(item => item.id === itemId ? { ...item, completed: !item.completed } : item)
        };
      }
      return list;
    });
    onChange({ ...data, checklists: updated });
  };

  // --- Tools State ---
  const [conv, setConv] = useState({ value: 0, from: 'ft3', to: 'm3' });
  const [convResult, setConvResult] = useState(0);

  const convert = () => {
    let res = 0;
    const v = conv.value;
    if (conv.from === 'ft3' && conv.to === 'm3') res = v * 0.0283168;
    if (conv.from === 'm3' && conv.to === 'ft3') res = v / 0.0283168;
    if (conv.from === 'ft' && conv.to === 'm') res = v * 0.3048;
    if (conv.from === 'm' && conv.to === 'ft') res = v / 0.3048;
    if (conv.from === 'kg' && conv.to === 'ton') res = v / 1000;
    if (conv.from === 'ton' && conv.to === 'kg') res = v * 1000;
    setConvResult(res);
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2 shrink-0">
        <button onClick={() => setActiveTab('costs')} className={`win95-btn px-4 py-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'costs' ? 'bg-win95-blue text-white' : ''}`}>
          <Calculator size={16} /> Custos e Tabelas
        </button>
        <button onClick={() => setActiveTab('search')} className={`win95-btn px-4 py-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'search' ? 'bg-win95-blue text-white' : ''}`}>
          <Globe size={16} /> CEP e Portos
        </button>
        <button onClick={() => setActiveTab('tools')} className={`win95-btn px-4 py-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'tools' ? 'bg-win95-blue text-white' : ''}`}>
          <Book size={16} /> Glossário e Conversor
        </button>
        <button onClick={() => setActiveTab('checklists')} className={`win95-btn px-4 py-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'checklists' ? 'bg-win95-blue text-white' : ''}`}>
          <CheckSquare size={16} /> Checklists
        </button>
        <button onClick={() => setActiveTab('routing')} className={`win95-btn px-4 py-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'routing' ? 'bg-win95-blue text-white' : ''}`}>
          <Navigation size={16} /> Roteirizador
        </button>
        <button onClick={() => setActiveTab('map')} className={`win95-btn px-4 py-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'map' ? 'bg-win95-blue text-white' : ''}`}>
          <MapPin size={16} /> Mapa de Apoio
        </button>
        <button onClick={() => setActiveTab('scales')} className={`win95-btn px-4 py-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'scales' ? 'bg-win95-blue text-white' : ''}`}>
          <Scale size={16} /> Balança e Cubagem
        </button>
      </div>

      <div className="win95-sunken flex-1 p-4 overflow-y-auto bg-white/40">
        {/* --- ROUTING TAB --- */}
        {activeTab === 'routing' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="win95-raised p-6 bg-white">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-win95-blue"><Navigation size={20} /> Roteirizador Inteligente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold">Origem (CEP ou Cidade)</label>
                    <input type="text" className="win95-sunken p-2 outline-none" placeholder="Ex: Santos, SP" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold">Destino (CEP ou Cidade)</label>
                    <input type="text" className="win95-sunken p-2 outline-none" placeholder="Ex: Cuiabá, MT" />
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 mb-6">
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input type="checkbox" className="accent-win95-blue" defaultChecked /> Evitar estradas não pavimentadas
                  </label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input type="checkbox" className="accent-win95-blue" defaultChecked /> Restrição para Carretas/Bitrens
                  </label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input type="checkbox" className="accent-win95-blue" defaultChecked /> Aplicar Lei do Motorista
                  </label>
                </div>
                <button className="win95-btn w-full py-3 bg-win95-blue text-white font-bold">Calcular Rotas Otimizadas</button>
                
                <div className="mt-8 space-y-4">
                  <div className="win95-raised p-4 border-l-4 border-green-500 bg-green-50/30">
                    <div className="flex justify-between items-start mb-2">
                      <span className="bg-green-500 text-white text-[10px] px-2 py-0.5 font-bold rounded">ROTA 1 - MAIS RÁPIDA</span>
                      <span className="font-mono font-bold text-green-700">1.240 km</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-[9px] text-gray-400 uppercase">Tempo Direção</div>
                        <div className="font-bold">14h 30min</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-gray-400 uppercase">Paradas (Lei)</div>
                        <div className="font-bold">3 paradas</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-gray-400 uppercase">Tempo Total</div>
                        <div className="font-bold text-win95-blue">26h 15min</div>
                      </div>
                    </div>
                  </div>
                  <div className="win95-raised p-4 border-l-4 border-blue-500 opacity-60">
                    <div className="flex justify-between items-start mb-2">
                      <span className="bg-blue-500 text-white text-[10px] px-2 py-0.5 font-bold rounded">ROTA 2 - MENOR PEDÁGIO</span>
                      <span className="font-mono font-bold text-blue-700">1.310 km</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="win95-raised p-4 bg-white">
                <h4 className="font-bold text-xs mb-3 flex items-center gap-2"><AlertCircle size={14} className="text-orange-500" /> Lei do Motorista (13.103/15)</h4>
                <ul className="text-[10px] space-y-2 text-gray-600">
                  <li className="flex gap-2"><ChevronRight size={10} className="shrink-0 mt-0.5" /> Máximo 5h30 ininterruptas de direção.</li>
                  <li className="flex gap-2"><ChevronRight size={10} className="shrink-0 mt-0.5" /> Descanso obrigatório de 30min a cada 6h.</li>
                  <li className="flex gap-2"><ChevronRight size={10} className="shrink-0 mt-0.5" /> Repouso diário de 11h (pode ser fracionado).</li>
                </ul>
              </div>
              <div className="win95-raised p-4 bg-win95-blue text-white">
                <h4 className="font-bold text-xs mb-2">Dica de Rota</h4>
                <p className="text-[10px] opacity-90">A BR-163 possui restrição de tráfego para veículos especiais neste período. Recomendamos a rota via BR-364.</p>
              </div>
            </div>
          </div>
        )}

        {/* --- MAP TAB --- */}
        {activeTab === 'map' && (
          <div className="flex flex-col h-full gap-4">
            <div className="win95-raised p-4 bg-white flex gap-4 items-center shrink-0">
              <span className="text-xs font-bold">Filtros no Mapa:</span>
              <label className="flex items-center gap-2 text-xs cursor-pointer bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                <input type="checkbox" className="accent-win95-blue" defaultChecked /> Postos de Combustível
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                <input type="checkbox" className="accent-win95-blue" defaultChecked /> Borracharias 24h
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer bg-green-50 px-3 py-1 rounded-full border border-green-200">
                <input type="checkbox" className="accent-win95-blue" defaultChecked /> Balanças Rodoviárias
              </label>
              <div className="flex-1"></div>
              <div className="text-[10px] text-gray-400 italic">Dados baseados em redes colaborativas</div>
            </div>
            <div className="win95-sunken flex-1 bg-gray-200 relative overflow-hidden flex items-center justify-center">
              <div className="text-center space-y-4">
                <MapPin size={48} className="mx-auto text-win95-blue animate-bounce" />
                <div>
                  <div className="font-bold text-lg">Mapa de Apoio Logístico</div>
                  <div className="text-sm text-gray-500">Integração com Google Maps API aguardando chave...</div>
                </div>
                <div className="win95-raised p-4 bg-white max-w-sm mx-auto text-left text-xs space-y-2">
                  <div className="font-bold border-b pb-1 mb-2">Próximos Pontos (Simulação):</div>
                  <div className="flex justify-between"><span>Posto Graal (KM 240)</span> <span className="text-green-600 font-bold">ABERTO</span></div>
                  <div className="flex justify-between"><span>Borracharia do Zé (KM 255)</span> <span className="text-blue-600 font-bold">24H</span></div>
                  <div className="flex justify-between"><span>Balança ANTT (KM 280)</span> <span className="text-orange-600 font-bold">ATIVA</span></div>
                </div>
              </div>
              {/* Overlay de UI do Mapa */}
              <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                <button className="win95-btn w-10 h-10 flex items-center justify-center bg-white text-xl font-bold">+</button>
                <button className="win95-btn w-10 h-10 flex items-center justify-center bg-white text-xl font-bold">-</button>
              </div>
            </div>
          </div>
        )}

        {/* --- SCALES TAB --- */}
        {activeTab === 'scales' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="win95-raised p-6 bg-white">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-win95-blue"><Scale size={20} /> Lei da Balança (Pesos Permitidos)</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { type: 'Toco (2 eixos)', pbt: '16t', tara: '6t', liq: '10t' },
                    { type: 'Truck (3 eixos)', pbt: '23t', tara: '8t', liq: '15t' },
                    { type: 'Bitruck (4 eixos)', pbt: '29t', tara: '10t', liq: '19t' },
                    { type: 'Carreta (3 eixos)', pbt: '41.5t', tara: '14t', liq: '27.5t' },
                    { type: 'Bitrem (7 eixos)', pbt: '57t', tara: '20t', liq: '37t' },
                    { type: 'Rodotrem (9 eixos)', pbt: '74t', tara: '25t', liq: '49t' },
                  ].map((t, i) => (
                    <div key={i} className="win95-sunken p-3 flex justify-between items-center hover:bg-blue-50 transition-colors">
                      <div className="font-bold text-xs">{t.type}</div>
                      <div className="flex gap-4 text-center">
                        <div><div className="text-[8px] text-gray-400 uppercase">PBT</div><div className="text-xs font-black text-win95-blue">{t.pbt}</div></div>
                        <div><div className="text-[8px] text-gray-400 uppercase">Tara</div><div className="text-xs font-bold text-gray-500">{t.tara}</div></div>
                        <div><div className="text-[8px] text-gray-400 uppercase">Líquido</div><div className="text-xs font-bold text-green-600">{t.liq}</div></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 bg-orange-50 border border-orange-200 rounded text-[10px] text-orange-700 flex gap-2">
                  <Info size={14} className="shrink-0" />
                  <span>Atenção: Tolerância de 5% no PBT e 10% no peso por eixo. Valores podem variar conforme a configuração de eixos.</span>
                </div>
              </div>
            </div>

            <div className="win95-raised p-6 bg-white">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-win95-blue"><Box size={20} /> Cubicagem de Carreta Sider</h3>
              <div className="space-y-4">
                <div className="win95-sunken p-4 bg-gray-50 mb-4">
                  <div className="text-xs font-bold mb-2 uppercase text-gray-400">Dimensões Padrão Sider (13.5m)</div>
                  <div className="flex justify-between text-sm">
                    <span>Comp: 13.50m</span>
                    <span>Larg: 2.50m</span>
                    <span>Alt: 2.80m</span>
                    <span className="font-bold text-win95-blue">~94.5 m³</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold">Comp. Caixa (cm)</label>
                    <input type="number" className="win95-sunken p-2 outline-none font-mono" placeholder="50" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold">Larg. Caixa (cm)</label>
                    <input type="number" className="win95-sunken p-2 outline-none font-mono" placeholder="50" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold">Alt. Caixa (cm)</label>
                    <input type="number" className="win95-sunken p-2 outline-none font-mono" placeholder="50" />
                  </div>
                </div>
                
                <button className="win95-btn w-full py-3 bg-win95-blue text-white font-bold">Calcular Capacidade Máxima</button>
                
                <div className="mt-6 p-6 win95-sunken bg-emerald-50 border-emerald-200 text-center">
                  <div className="text-xs font-bold text-emerald-600 uppercase mb-1">Capacidade Estimada</div>
                  <div className="text-4xl font-black text-emerald-600">756 Caixas</div>
                  <div className="text-[10px] text-gray-400 mt-2">Considerando empilhamento máximo e aproveitamento de 100% do volume.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- COSTS TAB --- */}
        {activeTab === 'costs' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="win95-raised p-6 bg-white">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-win95-blue"><Calculator size={20} /> Calculadora de Operação</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase border-b pb-1">Terrestre</h4>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold">KM Rodados (Total)</label>
                      <input type="number" className="win95-sunken p-2 outline-none font-mono" value={calc.km} onChange={e => setCalc({...calc, km: Number(e.target.value)})} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold">Pedágios (R$)</label>
                      <input type="number" className="win95-sunken p-2 outline-none font-mono" value={calc.tolls} onChange={e => setCalc({...calc, tolls: Number(e.target.value)})} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold">Consumo (km/l)</label>
                        <input type="number" step="0.1" className="win95-sunken p-2 outline-none font-mono" value={calc.avgConsumption} onChange={e => setCalc({...calc, avgConsumption: Number(e.target.value)})} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold">Diesel (R$/l)</label>
                        <input type="number" step="0.01" className="win95-sunken p-2 outline-none font-mono" value={calc.fuelPrice} onChange={e => setCalc({...calc, fuelPrice: Number(e.target.value)})} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold">Diárias Motorista</label>
                        <input type="number" className="win95-sunken p-2 outline-none font-mono" value={calc.driverDays} onChange={e => setCalc({...calc, driverDays: Number(e.target.value)})} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold">Valor Diária (R$)</label>
                        <input type="number" className="win95-sunken p-2 outline-none font-mono" value={calc.driverPerDieum} onChange={e => setCalc({...calc, driverPerDieum: Number(e.target.value)})} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase border-b pb-1">Marítimo / Aduaneiro</h4>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold">Custo Contêiner (TEU/FEU)</label>
                      <input type="number" className="win95-sunken p-2 outline-none font-mono" value={calc.containerCost} onChange={e => setCalc({...calc, containerCost: Number(e.target.value)})} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold">Taxas Portuárias (THC, etc)</label>
                      <input type="number" className="win95-sunken p-2 outline-none font-mono" value={calc.portFees} onChange={e => setCalc({...calc, portFees: Number(e.target.value)})} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold">Valor da Carga (R$)</label>
                      <input type="number" className="win95-sunken p-2 outline-none font-mono" value={calc.cargoValue} onChange={e => setCalc({...calc, cargoValue: Number(e.target.value)})} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold">Taxa Seguro (%)</label>
                      <input type="number" step="0.01" className="win95-sunken p-2 outline-none font-mono" value={calc.insuranceRate} onChange={e => setCalc({...calc, insuranceRate: Number(e.target.value)})} />
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 win95-sunken bg-win95-blue/10 border-win95-blue/20 flex justify-between items-center">
                  <div>
                    <div className="text-[10px] font-bold text-win95-blue uppercase">Custo Total Estimado</div>
                    <div className="text-3xl font-black text-win95-blue">R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" placeholder="Nome da Tabela" 
                      className="win95-sunken p-2 text-xs outline-none w-32"
                      value={tableName} onChange={e => setTableName(e.target.value)}
                    />
                    <button onClick={handleSaveTable} className="win95-btn px-3 py-2 bg-win95-blue text-white flex items-center gap-1">
                      <Save size={14} /> Salvar
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="win95-raised p-4 bg-white h-full">
                <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><FileText size={16} /> Tabelas Salvas</h3>
                <div className="space-y-2">
                  {data.freightTables?.map(t => (
                    <div key={t.id} className="win95-raised p-2 text-xs flex justify-between items-center hover:bg-gray-50 cursor-pointer" onClick={() => loadTable(t)}>
                      <div>
                        <div className="font-bold">{t.name}</div>
                        <div className="text-[10px] text-gray-400">{new Date(t.updatedAt).toLocaleDateString()}</div>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onChange({...data, freightTables: data.freightTables.filter(x => x.id !== t.id)}) }}
                        className="text-gray-300 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {(!data.freightTables || data.freightTables.length === 0) && (
                    <div className="text-center py-8 text-gray-400 italic text-xs">Nenhuma tabela salva.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- SEARCH TAB --- */}
        {activeTab === 'search' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="win95-raised p-6 bg-white">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-win95-blue"><MapPin size={20} /> Busca de CEP (Terra)</h3>
              <div className="flex gap-2 mb-4">
                <input 
                  type="text" placeholder="00000-000" 
                  className="win95-sunken p-3 flex-1 outline-none font-mono text-lg"
                  value={cep} onChange={e => setCep(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={e => e.key === 'Enter' && searchCep()}
                />
                <button onClick={searchCep} className="win95-btn px-6 bg-win95-blue text-white" disabled={loadingCep}>
                  {loadingCep ? '...' : <Search size={20} />}
                </button>
              </div>
              {cepResult && (
                <div className="win95-sunken p-4 bg-gray-50 space-y-2 text-sm">
                  <div className="flex justify-between border-b pb-1"><span className="text-gray-500">Logradouro:</span> <span className="font-bold">{cepResult.street || 'N/A'}</span></div>
                  <div className="flex justify-between border-b pb-1"><span className="text-gray-500">Bairro:</span> <span className="font-bold">{cepResult.neighborhood || 'N/A'}</span></div>
                  <div className="flex justify-between border-b pb-1"><span className="text-gray-500">Cidade:</span> <span className="font-bold">{cepResult.city} - {cepResult.state}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Serviço:</span> <span className="text-[10px] uppercase font-bold text-win95-blue">{cepResult.service}</span></div>
                </div>
              )}
            </div>

            <div className="win95-raised p-6 bg-white">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-win95-blue"><Anchor size={20} /> Códigos Portuários (Mar)</h3>
              <div className="relative mb-4">
                <input 
                  type="text" placeholder="Buscar cidade ou porto... (ex: Santos)" 
                  className="win95-sunken p-3 w-full outline-none pl-10"
                  value={portSearch} onChange={e => setPortSearch(e.target.value)}
                />
                <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {PORT_CODES.filter(p => p.city.toLowerCase().includes(portSearch.toLowerCase()) || p.code.toLowerCase().includes(portSearch.toLowerCase())).map(p => (
                  <div key={p.code} className="win95-raised p-3 flex justify-between items-center group hover:border-win95-blue transition-colors">
                    <div>
                      <div className="font-bold">{p.city}</div>
                      <div className="text-[10px] text-gray-400 uppercase">{p.type}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-black text-win95-blue text-lg">{p.code}</div>
                      <div className="text-[9px] text-gray-400">UN LOCODE</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- TOOLS TAB --- */}
        {activeTab === 'tools' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="win95-raised p-6 bg-white">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-win95-blue"><Book size={20} /> Glossário Técnico</h3>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {GLOSSARY.map(g => (
                  <div key={g.term} className="border-b border-gray-100 pb-2 last:border-0">
                    <div className="font-black text-win95-blue text-sm">{g.term}</div>
                    <div className="text-xs text-gray-600 leading-relaxed">{g.definition}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="win95-raised p-6 bg-white">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-win95-blue"><Scale size={20} /> Conversor de Unidades</h3>
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold">Valor</label>
                  <input type="number" className="win95-sunken p-3 outline-none font-mono text-xl" value={conv.value} onChange={e => setConv({...conv, value: Number(e.target.value)})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold">De</label>
                    <select className="win95-sunken p-2 outline-none" value={conv.from} onChange={e => setConv({...conv, from: e.target.value})}>
                      <option value="ft3">Pés Cúbicos (ft³)</option>
                      <option value="m3">Metros Cúbicos (m³)</option>
                      <option value="ft">Pés (ft)</option>
                      <option value="m">Metros (m)</option>
                      <option value="kg">Quilogramas (kg)</option>
                      <option value="ton">Toneladas (ton)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold">Para</label>
                    <select className="win95-sunken p-2 outline-none" value={conv.to} onChange={e => setConv({...conv, to: e.target.value})}>
                      <option value="m3">Metros Cúbicos (m³)</option>
                      <option value="ft3">Pés Cúbicos (ft³)</option>
                      <option value="m">Metros (m)</option>
                      <option value="ft">Pés (ft)</option>
                      <option value="ton">Toneladas (ton)</option>
                      <option value="kg">Quilogramas (kg)</option>
                    </select>
                  </div>
                </div>
                <button onClick={convert} className="win95-btn w-full py-3 bg-win95-blue text-white">Converter</button>
                {convResult > 0 && (
                  <div className="win95-sunken p-6 bg-blue-50 text-center">
                    <div className="text-xs font-bold text-blue-600 uppercase mb-1">Resultado</div>
                    <div className="text-4xl font-black text-win95-blue">{convResult.toLocaleString('pt-BR', { maximumFractionDigits: 4 })}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- CHECKLISTS TAB --- */}
        {activeTab === 'checklists' && (
          <div className="space-y-6">
            <div className="win95-raised p-4 bg-white flex flex-wrap gap-4 items-center">
              <h3 className="font-bold text-sm mr-4">Gerar Checklist:</h3>
              <button onClick={() => handleAddChecklist('maritime')} className="win95-btn px-4 py-2 flex items-center gap-2 bg-blue-50 text-blue-700">
                <Anchor size={14} /> Marítimo
              </button>
              <button onClick={() => handleAddChecklist('land')} className="win95-btn px-4 py-2 flex items-center gap-2 bg-orange-50 text-orange-700">
                <Truck size={14} /> Terrestre
              </button>
              <div className="flex-1 min-w-[200px] flex gap-2">
                <input 
                  type="text" placeholder="Título Personalizado..." 
                  className="win95-sunken p-2 flex-1 text-xs outline-none"
                  value={newChecklistTitle} onChange={e => setNewChecklistTitle(e.target.value)}
                />
                <button onClick={() => handleAddChecklist('custom')} className="win95-btn px-4 py-2 bg-gray-100">
                  <Plus size={14} /> Criar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {data.checklists?.map(list => (
                <div key={list.id} className="win95-raised p-4 bg-white flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-black text-win95-blue uppercase text-xs flex items-center gap-2">
                      <CheckCircle2 size={14} /> {list.title}
                    </h4>
                    <button onClick={() => onChange({...data, checklists: data.checklists.filter(x => x.id !== list.id)})} className="text-gray-300 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="space-y-2 flex-1">
                    {list.items.map(item => (
                      <label key={item.id} className="flex items-center gap-3 p-2 win95-sunken bg-gray-50/50 cursor-pointer hover:bg-white transition-colors">
                        <input 
                          type="checkbox" 
                          checked={item.completed} 
                          onChange={() => toggleChecklistItem(list.id, item.id)}
                          className="w-4 h-4 accent-win95-blue"
                        />
                        <span className={`text-xs ${item.completed ? 'line-through text-gray-400' : 'text-gray-700 font-medium'}`}>
                          {item.label}
                        </span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-4 pt-2 border-t text-[9px] text-gray-400 flex justify-between">
                    <span>{list.items.filter(i => i.completed).length} de {list.items.length} concluídos</span>
                    <span>{new Date(list.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              {(!data.checklists || data.checklists.length === 0) && (
                <div className="col-span-full text-center py-20 text-gray-400 italic">Nenhum checklist ativo. Gere um acima para começar.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
