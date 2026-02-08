
import React, { useState, useEffect } from 'react';
import { 
  Building2, MapPin, Landmark, Search, Copy, Check, ExternalLink, AlertTriangle, 
  Loader2, FileText, FileCheck, Barcode
} from 'lucide-react';
import { Button } from './ui/Button';
import { CnpjData, CepData, BankData } from '../types';

export const ConsultationModule: React.FC = () => {
  const [activeTool, setActiveTool] = useState<'cnpj' | 'nfe' | 'cep' | 'banks'>('cnpj');

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
          active={activeTool === 'nfe'} 
          onClick={() => setActiveTool('nfe')} 
          icon={<Barcode size={20} />} 
          label="Notas Fiscais" 
        />
        <NavButton 
          active={activeTool === 'cep'} 
          onClick={() => setActiveTool('cep')} 
          icon={<MapPin size={20} />} 
          label="Endereços" 
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
           {activeTool === 'nfe' && <NFeTool />}
           {activeTool === 'cep' && <CepTool />}
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

  // Campo de Dados com Seleção de Texto Habilitada
  const DataField = ({ label, value }: any) => (
    <div className="mb-2 group">
      <span className="text-[9px] font-bold uppercase text-gray-500 block mb-0.5">{label}</span>
      <div className="flex items-start bg-white border-b border-gray-300 hover:border-win95-blue transition-colors">
        {/* 'select-text' e 'break-all' permitem selecionar partes do texto */}
        <span className="text-sm font-bold text-black px-1 py-0.5 select-text cursor-text break-all whitespace-normal flex-1 leading-snug">
          {value || '-'}
        </span>
        <button 
            onClick={() => navigator.clipboard.writeText(String(value))} 
            className="p-1 text-gray-300 hover:text-blue-600 active:scale-95 transition-all shrink-0 opacity-0 group-hover:opacity-100"
            title="Copiar tudo"
        >
            <Copy size={12}/>
        </button>
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
            <div className="flex-1 pr-4">
              <h2 className="text-lg font-black uppercase text-blue-800 leading-tight select-text cursor-text">{data.razao_social}</h2>
              <p className="text-xs font-bold text-gray-500 select-text cursor-text">{data.nome_fantasia}</p>
            </div>
            <span className={`px-2 py-1 text-xs font-bold text-white shrink-0 ${data.descricao_situacao_cadastral === 'ATIVA' ? 'bg-green-600' : 'bg-red-600'}`}>{data.descricao_situacao_cadastral}</span>
          </div>

          <div className="flex gap-2 mb-4">
             <Button size="sm" onClick={() => setTab('resumo')} className={tab === 'resumo' ? 'bg-blue-100' : ''}>Resumo</Button>
             <Button size="sm" onClick={() => setTab('socios')} className={tab === 'socios' ? 'bg-blue-100' : ''}>Sócios ({data.qsa?.length || 0})</Button>
          </div>

          {tab === 'resumo' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <DataField label="CNPJ" value={formatCnpj(data.cnpj)} />
               <DataField label="Abertura" value={formatDate(data.data_inicio_atividade)} />
               <DataField label="Natureza Jurídica" value={`${data.codigo_natureza_juridica} - Natureza Jurídica`} />
               <DataField label="Porte" value={data.descricao_porte} />
               <DataField label="Capital Social" value={formatMoney(data.capital_social)} />
               <div className="col-span-full">
                  <DataField label="Endereço" value={`${data.descricao_tipo_de_logradouro} ${data.logradouro}, ${data.numero} ${data.complemento} - ${data.bairro}, ${data.municipio}/${data.uf} - CEP: ${data.cep}`} />
               </div>
               <div className="col-span-full">
                  <DataField label="E-mail" value={data.email || 'Não informado'} />
               </div>
               <div className="col-span-full bg-blue-50 p-2 border border-blue-100">
                  <span className="text-[9px] font-bold uppercase text-blue-800">Atividade Principal (CNAE)</span>
                  <div className="font-bold text-sm select-text cursor-text">{data.cnae_fiscal} - {data.cnae_fiscal_descricao}</div>
               </div>
            </div>
          )}

          {tab === 'socios' && (
            <div className="space-y-2">
               {data.qsa?.map((socio, i) => (
                 <div key={i} className="win95-raised bg-gray-50 p-2">
                    <div className="font-bold text-sm select-text cursor-text">{socio.nome_socio}</div>
                    <div className="text-xs text-gray-600 select-text cursor-text">{socio.qualificacao_socio}</div>
                 </div>
               ))}
               {(!data.qsa || data.qsa.length === 0) && <div className="text-center italic text-gray-500">Sem sócios listados ou Capital Aberto.</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// --- 2. FERRAMENTA NFe (Validador de Chave) ---
const NFeTool: React.FC = () => {
  const [key, setKey] = useState('');
  const [info, setInfo] = useState<any>(null);
  const [error, setError] = useState('');

  const UFS: Record<string, string> = { '11':'RO','12':'AC','13':'AM','14':'RR','15':'PA','16':'AP','17':'TO','21':'MA','22':'PI','23':'CE','24':'RN','25':'PB','26':'PE','27':'AL','28':'SE','29':'BA','31':'MG','32':'ES','33':'RJ','35':'SP','41':'PR','42':'SC','43':'RS','50':'MS','51':'MT','52':'GO','53':'DF' };
  
  const validateKey = () => {
    setError('');
    setInfo(null);
    const cleanKey = key.replace(/\D/g, '');
    
    if (cleanKey.length !== 44) {
      setError('A chave deve conter exatamente 44 dígitos numéricos.');
      return;
    }

    // Validação Modulo 11
    let soma = 0;
    let peso = 2;
    for (let i = 42; i >= 0; i--) {
        soma += parseInt(cleanKey.charAt(i)) * peso;
        peso++;
        if (peso > 9) peso = 2;
    }
    const resto = soma % 11;
    const dvCalculado = (resto === 0 || resto === 1) ? 0 : 11 - resto;
    const dvInformado = parseInt(cleanKey.charAt(43));
    const isValid = dvCalculado === dvInformado;

    // Extração de Dados
    const ufCode = cleanKey.substring(0, 2);
    const aamm = cleanKey.substring(2, 6);
    const cnpj = cleanKey.substring(6, 20);
    const mod = cleanKey.substring(20, 22);
    const serie = cleanKey.substring(22, 25);
    const nNF = cleanKey.substring(25, 34);
    const tpEmis = cleanKey.substring(34, 35);

    const formattedCNPJ = cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    const uf = UFS[ufCode] || 'Desconhecido';
    const mes = aamm.substring(2, 4);
    const ano = '20' + aamm.substring(0, 2);

    setInfo({
      uf,
      periodo: `${mes}/${ano}`,
      cnpj: formattedCNPJ,
      modelo: mod === '55' ? 'NFe (Nota Fiscal Eletrônica)' : mod === '65' ? 'NFCe (Consumidor)' : `Modelo ${mod}`,
      serie,
      numero: parseInt(nNF),
      tipoEmissao: tpEmis,
      valida: isValid
    });
  };

  return (
    <div className="h-full flex flex-col p-4 bg-win95-bg">
      <div className="win95-raised p-4 bg-win95-bg max-w-2xl mx-auto w-full">
         <h3 className="text-sm font-black uppercase mb-4 flex items-center gap-2">
            <Barcode size={16} /> Consulta de Chave de Acesso (NFe / NFCe)
         </h3>
         
         <div className="mb-4">
            <label className="text-[10px] font-bold uppercase block mb-1">Chave de Acesso (44 dígitos):</label>
            <div className="flex gap-2">
              <input 
                className="w-full win95-sunken p-2 font-mono font-bold text-sm" 
                value={key} 
                onChange={e => setKey(e.target.value.replace(/\D/g, ''))}
                placeholder="0000 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000"
                maxLength={44}
              />
              <Button onClick={validateKey}>ANALISAR</Button>
            </div>
            {error && <div className="text-red-600 text-xs font-bold mt-1 flex items-center gap-1"><AlertTriangle size={10}/> {error}</div>}
         </div>

         {info && (
           <div className={`win95-sunken bg-white p-4 border-l-4 ${info.valida ? 'border-l-green-600' : 'border-l-red-600'}`}>
              <div className="flex items-center gap-2 mb-4 border-b pb-2">
                 {info.valida ? <FileCheck size={24} className="text-green-600"/> : <AlertTriangle size={24} className="text-red-600"/>}
                 <div>
                    <h4 className="font-black text-sm uppercase">{info.valida ? 'Estrutura da Chave Válida' : 'Dígito Verificador Inválido'}</h4>
                    <span className="text-[10px] text-gray-500">Algoritmo Módulo 11</span>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                 <div className="p-2 bg-gray-50 border border-gray-200">
                    <span className="text-[9px] font-bold text-gray-500 uppercase block">UF de Origem</span>
                    <span className="font-bold">{info.uf}</span>
                 </div>
                 <div className="p-2 bg-gray-50 border border-gray-200">
                    <span className="text-[9px] font-bold text-gray-500 uppercase block">Período (AA/MM)</span>
                    <span className="font-bold">{info.periodo}</span>
                 </div>
                 <div className="p-2 bg-gray-50 border border-gray-200 col-span-2">
                    <span className="text-[9px] font-bold text-gray-500 uppercase block">CNPJ do Emitente</span>
                    <span className="font-bold font-mono text-sm select-text cursor-text">{info.cnpj}</span>
                 </div>
                 <div className="p-2 bg-gray-50 border border-gray-200">
                    <span className="text-[9px] font-bold text-gray-500 uppercase block">Modelo</span>
                    <span className="font-bold">{info.modelo}</span>
                 </div>
                 <div className="p-2 bg-gray-50 border border-gray-200">
                    <span className="text-[9px] font-bold text-gray-500 uppercase block">Série / Número</span>
                    <span className="font-bold">{info.serie} / {info.numero}</span>
                 </div>
              </div>

              {info.valida && (
                 <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                    <p className="text-[10px] mb-2 font-bold text-blue-900">
                      Para visualizar os produtos e valores, acesse o Portal Nacional:
                    </p>
                    <Button 
                      className="w-full" 
                      icon={<ExternalLink size={12}/>}
                      onClick={() => window.open(`http://www.nfe.fazenda.gov.br/portal/consultarNFe.aspx`, '_blank')}
                    >
                      ABRIR PORTAL NACIONAL DA NFE
                    </Button>
                 </div>
              )}
           </div>
         )}
         
         <div className="mt-4 text-[9px] text-gray-500 text-center italic">
           Este módulo valida a estrutura da chave de acesso e extrai metadados. A consulta completa requer certificado digital no site da SEFAZ.
         </div>
      </div>
    </div>
  );
};

// --- 3. FERRAMENTA CEP ---
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
                <div className="font-bold text-lg select-text">{data.street}</div>
                <div className="select-text">{data.neighborhood}</div>
                <div className="select-text">{data.city} - {data.state}</div>
                <div className="text-sm text-gray-500 select-text">{data.cep}</div>
                <a href={`https://www.google.com/maps/search/?api=1&query=${data.street},${data.city}`} target="_blank" className="text-blue-600 underline text-xs block mt-2">Ver no Mapa</a>
             </div>
          )}
       </div>
    </div>
  );
};

// --- 4. FERRAMENTA BANCOS ---
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
                       <td className="p-2 font-mono font-bold text-blue-800 text-center select-text">{b.code}</td>
                       <td className="p-2 font-mono text-center text-gray-500 select-text">{b.ispb}</td>
                       <td className="p-2 select-text">{b.name}</td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
     </div>
  );
};
