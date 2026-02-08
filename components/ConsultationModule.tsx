
import React, { useState, useEffect } from 'react';
import { 
  Building2, User, Car, MapPin, Landmark, DollarSign, 
  Search, Copy, Check, ExternalLink, AlertTriangle, 
  Loader2, ArrowUp, ArrowDown, RefreshCw, ShieldCheck, 
  Truck, Key, Info, FileText, Users, Briefcase, CheckCircle2, XCircle
} from 'lucide-react';
import { Button } from './ui/Button';
import { CnpjData, CepData, BankData, CurrencyQuote, FipeBrand, FipeModel, FipeYear, FipeResult } from '../types';

export const ConsultationModule: React.FC = () => {
  const [activeTool, setActiveTool] = useState<'cnpj' | 'cpf' | 'veiculos' | 'cep' | 'finance' | 'banks'>('cnpj');

  return (
    <div className="h-full flex gap-2 overflow-hidden">
      {/* Sidebar de Navegação */}
      <div className="w-20 flex flex-col gap-2 win95-raised bg-win95-bg p-2 shrink-0 overflow-y-auto">
        <NavButton 
          active={activeTool === 'cnpj'} 
          onClick={() => setActiveTool('cnpj')} 
          icon={<Building2 size={20} />} 
          label="Empresas" 
        />
        <NavButton 
          active={activeTool === 'cpf'} 
          onClick={() => setActiveTool('cpf')} 
          icon={<User size={20} />} 
          label="Pessoas" 
        />
        <NavButton 
          active={activeTool === 'veiculos'} 
          onClick={() => setActiveTool('veiculos')} 
          icon={<Car size={20} />} 
          label="Veículos" 
        />
        <NavButton 
          active={activeTool === 'cep'} 
          onClick={() => setActiveTool('cep')} 
          icon={<MapPin size={20} />} 
          label="Endereços" 
        />
        <NavButton 
          active={activeTool === 'finance'} 
          onClick={() => setActiveTool('finance')} 
          icon={<DollarSign size={20} />} 
          label="Cotações" 
        />
        <NavButton 
          active={activeTool === 'banks'} 
          onClick={() => setActiveTool('banks')} 
          icon={<Landmark size={20} />} 
          label="Bancos" 
        />
      </div>

      {/* Área Principal */}
      <div className="flex-1 win95-sunken bg-[#d4d0c8] border-2 border-white overflow-hidden relative">
        <div className="absolute inset-0 overflow-auto custom-scrollbar p-2">
           {activeTool === 'cnpj' && <CnpjTool />}
           {activeTool === 'cpf' && <CpfTool />}
           {activeTool === 'veiculos' && <VehicleTool />}
           {activeTool === 'cep' && <CepTool />}
           {activeTool === 'finance' && <FinanceTool />}
           {activeTool === 'banks' && <BanksTool />}
        </div>
      </div>
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`w-full aspect-square flex flex-col items-center justify-center gap-1 p-1 border-2 transition-all ${active ? 'border-black bg-white shadow-[inset_1px_1px_0px_#000] text-blue-700' : 'win95-raised hover:bg-gray-100 text-[#444]'}`}
  >
    {icon}
    <span className="text-[9px] font-bold uppercase text-center leading-none">{label}</span>
  </button>
);

// --- 1. FERRAMENTA CNPJ (BrasilAPI) ---
const CnpjTool: React.FC = () => {
  const [cnpj, setCnpj] = useState('');
  const [data, setData] = useState<CnpjData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'resumo' | 'socios'>('resumo');

  const formatCnpj = (v: string) => v.replace(/\D/g, '').replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2').substring(0, 18);
  const formatDate = (v: string | null) => v ? new Date(v).toLocaleDateString('pt-BR') : '-';
  const formatMoney = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const handleSearch = async () => {
    const clean = cnpj.replace(/\D/g, '');
    if (clean.length !== 14) return setError('CNPJ inválido (14 dígitos).');
    setLoading(true); setError(''); setData(null);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`);
      if (!res.ok) throw new Error(res.status === 404 ? 'CNPJ não encontrado.' : 'Erro na consulta.');
      setData(await res.json());
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const CopyField = ({ label, value }: any) => (
    <div className="mb-2">
      <span className="text-[9px] font-bold uppercase text-gray-500">{label}</span>
      <div className="flex justify-between border-b border-gray-300 bg-white px-1">
        <span className="text-sm font-bold truncate">{value || '-'}</span>
        <button onClick={() => navigator.clipboard.writeText(String(value))} className="text-gray-400 hover:text-blue-600"><Copy size={12}/></button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="win95-raised p-3 bg-win95-bg flex gap-2 items-end">
        <div className="flex-1">
          <label className="text-[10px] font-bold uppercase block mb-1">Digite o CNPJ</label>
          <input className="w-full win95-sunken p-1.5 font-mono font-bold" value={cnpj} onChange={e => setCnpj(formatCnpj(e.target.value))} placeholder="00.000.000/0001-00" onKeyDown={e => e.key === 'Enter' && handleSearch()} />
        </div>
        <Button onClick={handleSearch} disabled={loading} className="h-9 w-24">{loading ? <Loader2 className="animate-spin" size={16}/> : 'CONSULTAR'}</Button>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 p-2 text-xs font-bold flex items-center gap-2"><AlertTriangle size={14}/> {error}</div>}

      {data && (
        <div className="flex-1 bg-white win95-sunken p-4 overflow-y-auto">
          <div className="flex justify-between items-start mb-4 border-b pb-2">
            <div>
              <h2 className="text-lg font-black uppercase text-blue-800 leading-tight">{data.razao_social}</h2>
              <p className="text-xs font-bold text-gray-500">{data.nome_fantasia}</p>
            </div>
            <span className={`px-2 py-1 text-xs font-bold text-white ${data.descricao_situacao_cadastral === 'ATIVA' ? 'bg-green-600' : 'bg-red-600'}`}>{data.descricao_situacao_cadastral}</span>
          </div>

          <div className="flex gap-2 mb-4">
             <Button size="sm" onClick={() => setTab('resumo')} className={tab === 'resumo' ? 'bg-blue-100' : ''}>Resumo</Button>
             <Button size="sm" onClick={() => setTab('socios')} className={tab === 'socios' ? 'bg-blue-100' : ''}>Sócios ({data.qsa?.length || 0})</Button>
          </div>

          {tab === 'resumo' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <CopyField label="CNPJ" value={formatCnpj(data.cnpj)} />
               <CopyField label="Abertura" value={formatDate(data.data_inicio_atividade)} />
               <CopyField label="Natureza Jurídica" value={`${data.codigo_natureza_juridica} - Natureza Jurídica`} />
               <CopyField label="Porte" value={data.descricao_porte} />
               <CopyField label="Capital Social" value={formatMoney(data.capital_social)} />
               <div className="col-span-full">
                  <CopyField label="Endereço" value={`${data.descricao_tipo_de_logradouro} ${data.logradouro}, ${data.numero} ${data.complemento} - ${data.bairro}, ${data.municipio}/${data.uf} - CEP: ${data.cep}`} />
               </div>
               <div className="col-span-full bg-blue-50 p-2 border border-blue-100">
                  <span className="text-[9px] font-bold uppercase text-blue-800">Atividade Principal (CNAE)</span>
                  <div className="font-bold text-sm">{data.cnae_fiscal} - {data.cnae_fiscal_descricao}</div>
               </div>
            </div>
          )}

          {tab === 'socios' && (
            <div className="space-y-2">
               {data.qsa?.map((socio, i) => (
                 <div key={i} className="win95-raised bg-gray-50 p-2">
                    <div className="font-bold text-sm">{socio.nome_socio}</div>
                    <div className="text-xs text-gray-600">{socio.qualificacao_socio}</div>
                 </div>
               ))}
               {(!data.qsa || data.qsa.length === 0) && <div className="text-center italic text-gray-500">Sem sócios listados.</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// --- 2. FERRAMENTA CPF (Validação Algorítmica) ---
const CpfTool: React.FC = () => {
  const [cpf, setCpf] = useState('');
  const [status, setStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

  const validate = () => {
    const str = cpf.replace(/\D/g, '');
    if (str.length !== 11 || /^(\d)\1+$/.test(str)) return setStatus('invalid');
    let soma = 0, resto;
    for (let i = 1; i <= 9; i++) soma += parseInt(str.substring(i - 1, i)) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(str.substring(9, 10))) return setStatus('invalid');
    soma = 0;
    for (let i = 1; i <= 10; i++) soma += parseInt(str.substring(i - 1, i)) * (12 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(str.substring(10, 11))) return setStatus('invalid');
    setStatus('valid');
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-4">
      <div className="win95-raised p-6 bg-win95-bg max-w-md w-full">
        <h2 className="text-lg font-black uppercase mb-4 flex items-center gap-2"><User size={24}/> Validador de CPF</h2>
        <div className="flex gap-2 mb-4">
          <input 
            className="flex-1 win95-sunken p-2 text-xl font-mono font-bold text-center" 
            value={cpf}
            onChange={e => { setCpf(e.target.value.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4').substring(0, 14)); setStatus('idle'); }}
            placeholder="000.000.000-00"
          />
          <Button onClick={validate}>Validar</Button>
        </div>
        
        {status === 'valid' && (
          <div className="bg-green-100 border-2 border-green-500 p-4 text-center">
             <ShieldCheck size={32} className="mx-auto text-green-600 mb-2"/>
             <div className="font-black text-green-800 text-lg">CPF VÁLIDO</div>
             <p className="text-xs text-green-700 mt-1">A estrutura matemática está correta.</p>
             <Button className="mt-4 w-full" onClick={() => window.open('https://servicos.receita.fazenda.gov.br/Servicos/CPF/ConsultaSituacao/ConsultaPublica.asp', '_blank')}>
               Consultar Nome na Receita <ExternalLink size={12} className="ml-1"/>
             </Button>
          </div>
        )}
        
        {status === 'invalid' && (
          <div className="bg-red-100 border-2 border-red-500 p-4 text-center">
             <AlertTriangle size={32} className="mx-auto text-red-600 mb-2"/>
             <div className="font-black text-red-800 text-lg">CPF INVÁLIDO</div>
             <p className="text-xs text-red-700 mt-1">Dígitos verificadores incorretos.</p>
          </div>
        )}

        <div className="mt-4 text-[10px] text-gray-500 border-t border-white pt-2">
          * Devido à LGPD, APIs gratuitas não podem retornar o nome do titular. Use o botão acima para consulta oficial.
        </div>
      </div>
    </div>
  );
};

// --- 3. FERRAMENTA VEÍCULOS (FIPE + Placa) ---
const VehicleTool: React.FC = () => {
  const [mode, setMode] = useState<'fipe' | 'placa'>('fipe');
  // FIPE States
  const [type, setType] = useState('carros');
  const [brands, setBrands] = useState<FipeBrand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [models, setModels] = useState<FipeModel[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [years, setYears] = useState<FipeYear[]>([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [result, setResult] = useState<FipeResult | null>(null);

  useEffect(() => { fetch(`https://parallelum.com.br/fipe/api/v1/${type}/marcas`).then(r => r.json()).then(setBrands); setSelectedBrand(''); setModels([]); setYears([]); setResult(null); }, [type]);
  useEffect(() => { if(selectedBrand) fetch(`https://parallelum.com.br/fipe/api/v1/${type}/marcas/${selectedBrand}/modelos`).then(r => r.json()).then(d => setModels(d.modelos)); setSelectedModel(''); setYears([]); setResult(null); }, [selectedBrand]);
  useEffect(() => { if(selectedModel) fetch(`https://parallelum.com.br/fipe/api/v1/${type}/marcas/${selectedBrand}/modelos/${selectedModel}/anos`).then(r => r.json()).then(setYears); setSelectedYear(''); setResult(null); }, [selectedModel]);
  useEffect(() => { if(selectedYear) fetch(`https://parallelum.com.br/fipe/api/v1/${type}/marcas/${selectedBrand}/modelos/${selectedModel}/anos/${selectedYear}`).then(r => r.json()).then(setResult); }, [selectedYear]);

  // Placa Logic
  const [placa, setPlaca] = useState('');
  const [placaInfo, setPlacaInfo] = useState<any>(null);
  const decodePlate = () => {
     const p = placa.toUpperCase().replace(/[^A-Z0-9]/g, '');
     const isMercosul = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(p);
     const isOld = /^[A-Z]{3}[0-9]{4}$/.test(p);
     if (isMercosul || isOld) {
       setPlacaInfo({ type: isMercosul ? 'Mercosul' : 'Padrão Antigo (Cinza)', valid: true, uf: 'BR' });
     } else setPlacaInfo({ valid: false });
  };

  return (
    <div className="h-full flex flex-col">
       <div className="flex gap-2 mb-4 bg-win95-bg win95-raised p-2">
          <Button onClick={() => setMode('fipe')} className={mode === 'fipe' ? 'bg-white win95-sunken' : ''} icon={<DollarSign size={14}/>}>Tabela FIPE</Button>
          <Button onClick={() => setMode('placa')} className={mode === 'placa' ? 'bg-white win95-sunken' : ''} icon={<Search size={14}/>}>Decodificar Placa</Button>
       </div>

       {mode === 'fipe' && (
         <div className="space-y-4 p-2">
            <div className="flex gap-2">
               {[{id: 'carros', icon: <Car size={14}/>}, {id: 'motos', icon: <Key size={14}/>}, {id: 'caminhoes', icon: <Truck size={14}/>}].map(t => (
                 <button key={t.id} onClick={() => setType(t.id)} className={`flex-1 py-2 win95-raised capitalize flex items-center justify-center gap-2 ${type === t.id ? 'font-bold bg-blue-100' : ''}`}>{t.icon} {t.id}</button>
               ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
               <select className="win95-sunken p-2 h-32" multiple value={[selectedBrand]} onChange={e => setSelectedBrand(e.target.value)}>{brands.map(b => <option key={b.codigo} value={b.codigo}>{b.nome}</option>)}</select>
               <select className="win95-sunken p-2 h-32" multiple value={[selectedModel]} onChange={e => setSelectedModel(e.target.value)}>{models.map(m => <option key={m.codigo} value={m.codigo}>{m.nome}</option>)}</select>
               <select className="win95-sunken p-2 h-32" multiple value={[selectedYear]} onChange={e => setSelectedYear(e.target.value)}>{years.map(y => <option key={y.codigo} value={y.codigo}>{y.nome}</option>)}</select>
            </div>
            {result && (
              <div className="win95-raised bg-green-50 border-2 border-green-600 p-4 text-center animate-in zoom-in">
                 <h3 className="font-black text-lg">{result.Modelo}</h3>
                 <div className="text-sm text-gray-600 mb-2">{result.AnoModelo} - {result.Combustivel}</div>
                 <div className="text-3xl font-black text-green-800 bg-white inline-block px-4 py-1 border border-green-200">{result.Valor}</div>
                 <div className="text-[10px] text-gray-400 mt-2">Ref: {result.MesReferencia} | Fipe: {result.CodigoFipe}</div>
              </div>
            )}
         </div>
       )}

       {mode === 'placa' && (
          <div className="flex flex-col items-center justify-center flex-1">
             <div className="win95-raised p-6 bg-gray-200 flex flex-col items-center gap-4">
                 <div className="relative w-64 h-24 bg-white border-4 border-black rounded-lg flex items-center justify-center shadow-lg">
                    <div className="absolute top-0 left-0 w-full h-6 bg-blue-700 flex justify-between px-2 items-center">
                       <span className="text-[8px] text-white font-bold">BRASIL</span>
                       <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Flag_of_Brazil.svg/64px-Flag_of_Brazil.svg.png" className="h-3 w-4" alt="BR"/>
                    </div>
                    <input 
                      className="w-full h-full text-center text-5xl font-black uppercase bg-transparent outline-none pt-4 tracking-widest font-mono"
                      placeholder="ABC1234"
                      maxLength={7}
                      value={placa}
                      onChange={e => setPlaca(e.target.value)}
                    />
                 </div>
                 <Button onClick={decodePlate} className="w-64 h-10 font-bold text-sm">ANALISAR ESTRUTURA</Button>
                 
                 {placaInfo && (
                   <div className={`w-full p-2 text-center border-2 ${placaInfo.valid ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500'}`}>
                      {placaInfo.valid ? `Formato Válido: ${placaInfo.type}` : 'Formato Inválido'}
                      {placaInfo.valid && (
                         <Button size="sm" className="mt-2 w-full" onClick={() => window.open('https://www.gov.br/transportes/pt-br/assuntos/transito/senatran', '_blank')}>Consultar no Senatran</Button>
                      )}
                   </div>
                 )}
              </div>
          </div>
       )}
    </div>
  );
};

// --- 4. FERRAMENTA CEP ---
const CepTool: React.FC = () => {
  const [cep, setCep] = useState('');
  const [data, setData] = useState<CepData | null>(null);

  const search = () => {
    fetch(`https://brasilapi.com.br/api/cep/v2/${cep.replace(/\D/g,'')}`)
      .then(r => { if(r.ok) return r.json(); throw new Error(); })
      .then(setData)
      .catch(() => alert('CEP não encontrado'));
  };

  return (
    <div className="h-full p-4 flex flex-col items-center">
       <div className="max-w-md w-full win95-raised bg-win95-bg p-4">
          <h3 className="font-bold mb-2 flex items-center gap-2"><MapPin size={16}/> Buscar Endereço</h3>
          <div className="flex gap-2 mb-4">
             <input className="flex-1 win95-sunken p-2 font-mono" placeholder="00000-000" value={cep} onChange={e => setCep(e.target.value)} />
             <Button onClick={search}>Buscar</Button>
          </div>
          {data && (
             <div className="win95-sunken bg-white p-4 space-y-2">
                <div className="font-bold text-lg">{data.street}</div>
                <div>{data.neighborhood}</div>
                <div>{data.city} - {data.state}</div>
                <div className="text-sm text-gray-500">{data.cep}</div>
                <a href={`https://www.google.com/maps/search/?api=1&query=${data.street},${data.city}`} target="_blank" className="text-blue-600 underline text-xs block mt-2">Ver no Mapa</a>
             </div>
          )}
       </div>
    </div>
  );
};

// --- 5. FERRAMENTA FINANCEIRO ---
const FinanceTool: React.FC = () => {
  const [quotes, setQuotes] = useState<CurrencyQuote[]>([]);
  
  useEffect(() => {
    fetch('https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,BTC-BRL,GBP-BRL')
      .then(r => r.json())
      .then(d => setQuotes(Object.values(d)));
  }, []);

  return (
    <div className="h-full p-2">
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quotes.map(q => {
             const up = parseFloat(q.pctChange) >= 0;
             return (
               <div key={q.code} className="win95-raised p-4 bg-win95-bg relative overflow-hidden">
                  <div className="font-bold text-xs text-gray-500">{q.name.split('/')[0]}</div>
                  <div className="text-2xl font-black">{parseFloat(q.bid).toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</div>
                  <div className={`text-xs font-bold flex items-center gap-1 ${up ? 'text-green-700' : 'text-red-700'}`}>
                     {up ? <ArrowUp size={12}/> : <ArrowDown size={12}/>} {q.pctChange}%
                  </div>
                  <div className="text-[9px] text-gray-400 mt-2">Atualizado: {q.create_date}</div>
               </div>
             );
          })}
       </div>
       <div className="mt-4 text-center text-xs text-gray-500">Dados fornecidos por AwesomeAPI</div>
    </div>
  );
};

// --- 6. FERRAMENTA BANCOS ---
const BanksTool: React.FC = () => {
  const [banks, setBanks] = useState<BankData[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('https://brasilapi.com.br/api/banks/v1').then(r => r.json()).then(setBanks);
  }, []);

  const filtered = banks.filter(b => b.name.toLowerCase().includes(search.toLowerCase()) || String(b.code).includes(search));

  return (
     <div className="h-full flex flex-col gap-2 p-2">
        <div className="win95-raised bg-win95-bg p-2 flex gap-2">
           <Search size={16}/>
           <input className="flex-1 win95-sunken px-2 outline-none" placeholder="Buscar banco ou código COMPE..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex-1 win95-sunken bg-white overflow-y-auto">
           <table className="w-full text-xs text-left">
              <thead className="bg-gray-100 sticky top-0 font-bold uppercase">
                 <tr>
                    <th className="p-2 border-r">Código</th>
                    <th className="p-2 border-r">ISPB</th>
                    <th className="p-2">Instituição</th>
                 </tr>
              </thead>
              <tbody>
                 {filtered.map(b => (
                    <tr key={b.ispb} className="hover:bg-blue-50 border-b">
                       <td className="p-2 font-mono font-bold text-blue-800 text-center">{b.code}</td>
                       <td className="p-2 font-mono text-center text-gray-500">{b.ispb}</td>
                       <td className="p-2">{b.name}</td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
     </div>
  );
};
