
import React, { useState, useEffect } from 'react';
import { MapPin, Landmark, DollarSign, Search, Loader2, ArrowUp, ArrowDown, Copy, ExternalLink, RefreshCw, Building2, Users, Phone, Mail, FileText, Briefcase, CheckCircle2, XCircle, Info, Check } from 'lucide-react';
import { Button } from './ui/Button';
import { CepData, BankData, CurrencyQuote, CnpjData } from '../types';

export const BrasilTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cep' | 'cnpj' | 'banks' | 'finance'>('cep');

  return (
    <div className="h-full flex flex-col bg-palette-lightest gap-2">
      <div className="flex gap-2 p-1 bg-palette-lightest border-b border-palette-mediumDark overflow-x-auto">
        <Button
          onClick={() => setActiveTab('cep')}
          className={activeTab === 'cep' ? 'bg-palette-mediumLight win95-sunken' : ''}
          icon={<MapPin size={14} />}
        >
          CEP
        </Button>
        <Button
          onClick={() => setActiveTab('cnpj')}
          className={activeTab === 'cnpj' ? 'bg-white win95-sunken' : ''}
          icon={<Building2 size={14} />}
        >
          CNPJ
        </Button>
        <Button
          onClick={() => setActiveTab('banks')}
          className={activeTab === 'banks' ? 'bg-white win95-sunken' : ''}
          icon={<Landmark size={14} />}
        >
          Bancos
        </Button>
        <Button
          onClick={() => setActiveTab('finance')}
          className={activeTab === 'finance' ? 'bg-white win95-sunken' : ''}
          icon={<DollarSign size={14} />}
        >
          Cotações
        </Button>
      </div>

      <div className="flex-1 win95-raised p-2 bg-palette-lightest overflow-hidden">
        {activeTab === 'cep' && <CepTool />}
        {activeTab === 'cnpj' && <CnpjTool />}
        {activeTab === 'banks' && <BanksTool />}
        {activeTab === 'finance' && <FinanceTool />}
      </div>
    </div>
  );
};

// --- Sub-componente: CEP ---
const CepTool: React.FC = () => {
  const [cep, setCep] = useState('');
  const [data, setData] = useState<CepData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      setError('CEP inválido. Digite 8 números.');
      return;
    }
    setLoading(true);
    setError('');
    setData(null);

    try {
      const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCep}`);
      if (!res.ok) throw new Error('CEP não encontrado.');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError('CEP não encontrado ou erro na conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="win95-raised p-4 bg-palette-mediumLight max-w-lg mx-auto w-full">
        <h3 className="text-xs font-black uppercase mb-3 flex items-center gap-2">
          <MapPin size={14} /> Localizador de Endereços
        </h3>
        <div className="flex gap-2 mb-4">
          <input
            className="flex-1 win95-sunken px-2 py-1 text-sm font-mono outline-none bg-white text-black"
            placeholder="00000-000"
            value={cep}
            onChange={(e) => setCep(e.target.value.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2'))}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            maxLength={9}
          />
          <Button onClick={handleSearch} disabled={loading} className="w-24">
            {loading ? <Loader2 size={14} className="animate-spin" /> : 'BUSCAR'}
          </Button>
        </div>

        {error && (
          <div className="win95-sunken bg-red-100 p-2 text-red-700 text-xs font-bold mb-2 text-center border-red-500">
            {error}
          </div>
        )}

        {data && (
          <div className="space-y-2 animate-in fade-in zoom-in duration-200">
            <div className="win95-sunken bg-palette-lightest p-3 space-y-2">
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-3">
                  <label className="text-[9px] font-bold text-[#555] uppercase block">Logradouro</label>
                  <div className="text-sm font-bold text-black border-b border-[#eee]">{data.street}</div>
                </div>
                <div className="col-span-1">
                  <label className="text-[9px] font-bold text-[#555] uppercase block">UF</label>
                  <div className="text-sm font-bold text-black border-b border-[#eee]">{data.state}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-bold text-[#555] uppercase block">Bairro</label>
                  <div className="text-sm font-bold text-black border-b border-[#eee]">{data.neighborhood}</div>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-[#555] uppercase block">Cidade</label>
                  <div className="text-sm font-bold text-black border-b border-[#eee]">{data.city}</div>
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${data.street}, ${data.city} - ${data.state}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="win95-btn px-2 py-1 text-[10px] font-bold flex items-center gap-1 bg-win95-bg text-black no-underline"
                >
                  <ExternalLink size={10} /> Ver no Mapa
                </a>
              </div>
            </div>
            <div className="text-[9px] text-[#555] text-center">Fonte: Correios / BrasilAPI</div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Sub-componente: CNPJ Completo ---
const CnpjTool: React.FC = () => {
  const [cnpj, setCnpj] = useState('');
  const [data, setData] = useState<CnpjData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resultTab, setResultTab] = useState<'resumo' | 'contato' | 'socios' | 'cnaes'>('resumo');

  const formatCnpj = (val: string) => {
    return val
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .substring(0, 18);
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatDate = (val: string | null) => val ? new Date(val).toLocaleDateString('pt-BR') : '-';

  const handleSearch = async () => {
    const cleanCnpj = cnpj.replace(/\D/g, '');
    if (cleanCnpj.length !== 14) {
      setError('CNPJ inválido. Digite 14 números.');
      return;
    }
    setLoading(true);
    setError('');
    setData(null);

    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error('CNPJ não encontrado.');
        if (res.status === 429) throw new Error('Muitas requisições. Aguarde um momento.');
        throw new Error('Erro ao consultar API.');
      }
      const json = await res.json();
      setData(json);
      setResultTab('resumo');
    } catch (err: any) {
      setError(err.message || 'Erro na conexão.');
    } finally {
      setLoading(false);
    }
  };

  const isAtiva = data?.descricao_situacao_cadastral === 'ATIVA';

  // Componente de Campo de Dados Copiável
  const DataField = ({ label, value, full = false, isMono = false, highlight = false }: { label: string, value: string | number | null, full?: boolean, isMono?: boolean, highlight?: boolean }) => {
    const [copied, setCopied] = useState(false);

    if (!value && value !== 0) return null;
    const displayValue = String(value);

    const handleCopy = () => {
      navigator.clipboard.writeText(displayValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    };

    return (
      <div className={`flex flex-col ${full ? 'col-span-2' : ''}`}>
        <span className="text-[9px] font-bold text-[#555] uppercase">{label}</span>
        <div className={`flex items-center justify-between border-b border-palette-mediumLight pb-0.5 min-h-[1.25rem] group hover:bg-palette-mediumLight/20 transition-colors rounded-sm px-1 -ml-1`}>
          <span className={`text-xs ${highlight ? 'font-black text-win95-blue' : 'font-bold text-black'} ${isMono ? 'font-mono' : ''} truncate pr-2`}>
            {displayValue}
          </span>
          <button
            onClick={handleCopy}
            className={`opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white hover:shadow-sm transition-all ${copied ? 'text-green-600' : 'text-gray-400'}`}
            title="Copiar"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="win95-raised p-4 bg-palette-mediumLight max-w-3xl mx-auto w-full flex flex-col h-full overflow-hidden">
        {/* Header de Busca */}
        <div className="shrink-0 mb-4">
          <h3 className="text-xs font-black uppercase mb-3 flex items-center gap-2">
            <Building2 size={14} /> Consulta de Empresas
          </h3>
          <div className="flex gap-2">
            <input
              className="flex-1 win95-sunken px-2 py-1 text-sm font-mono outline-none bg-white text-black font-bold"
              placeholder="00.000.000/0001-00"
              value={cnpj}
              onChange={(e) => setCnpj(formatCnpj(e.target.value))}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              maxLength={18}
            />
            <Button onClick={handleSearch} disabled={loading} className="w-24">
              {loading ? <Loader2 size={14} className="animate-spin" /> : 'BUSCAR'}
            </Button>
          </div>
          {error && (
            <div className="win95-sunken bg-red-100 p-2 text-red-700 text-xs font-bold mt-2 text-center border-red-500">
              {error}
            </div>
          )}
        </div>

        {/* Área de Resultados */}
        {data && (
          <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Cabeçalho da Empresa */}
            <div className="win95-sunken bg-palette-lightest p-3 mb-2 flex justify-between items-start shrink-0">
              <div className="flex-1 min-w-0 mr-2">
                <div className="text-[10px] font-bold text-palette-darkest/40 uppercase">Razão Social</div>
                <div className="text-sm font-black text-palette-darkest uppercase leading-tight truncate" title={data.razao_social}>{data.razao_social}</div>
                <div className="text-xs font-bold text-gray-500 uppercase mt-1 truncate">{data.nome_fantasia || 'Sem Nome Fantasia'}</div>
              </div>
              <div className={`px-2 py-1 text-[10px] font-bold text-white uppercase border shrink-0 ${isAtiva ? 'bg-green-600 border-green-800' : 'bg-red-600 border-red-800'}`}>
                {data.descricao_situacao_cadastral}
              </div>
            </div>

            {/* Navegação de Abas */}
            <div className="flex gap-1 px-1 shrink-0">
              {[
                { id: 'resumo', label: 'Resumo Geral', icon: <FileText size={12} /> },
                { id: 'contato', label: 'Endereço e Contato', icon: <MapPin size={12} /> },
                { id: 'socios', label: `Sócios (${data.qsa?.length || 0})`, icon: <Users size={12} /> },
                { id: 'cnaes', label: 'Atividades', icon: <Briefcase size={12} /> },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setResultTab(tab.id as any)}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase flex items-center gap-2 rounded-t-sm border-t-2 border-l-2 border-r-2 transition-none ${resultTab === tab.id
                      ? 'bg-palette-lightest border-white border-r-palette-mediumDark pb-2 -mb-[1px] relative z-10 text-palette-darkest'
                      : 'bg-palette-mediumLight border-white text-palette-darkest/60 hover:bg-palette-mediumLight/80'
                    }`}
                >
                  {tab.icon} <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Conteúdo da Aba */}
            <div className="flex-1 win95-sunken bg-palette-lightest p-4 overflow-y-auto custom-scrollbar border-t-white relative z-0">

              {resultTab === 'resumo' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <DataField label="CNPJ" value={formatCnpj(data.cnpj)} isMono highlight />
                    <DataField label="Data de Abertura" value={formatDate(data.data_inicio_atividade)} />
                    <DataField label="Natureza Jurídica" value={`${data.codigo_natureza_juridica} - Natureza Jurídica`} full />
                    <DataField label="Porte da Empresa" value={data.descricao_porte || 'NÃO INFORMADO'} />
                    <DataField label="Capital Social" value={formatCurrency(data.capital_social)} />
                  </div>

                  <div className="border-t border-gray-200 pt-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-2 border border-gray-200">
                        <div className="text-[9px] font-bold text-[#555] uppercase mb-1 flex items-center gap-1">
                          Simples Nacional
                        </div>
                        <div className="flex items-center gap-2">
                          {data.opcao_pelo_simples ? <CheckCircle2 size={14} className="text-green-600" /> : <XCircle size={14} className="text-gray-400" />}
                          <span className="text-xs font-bold">{data.opcao_pelo_simples ? `Optante (${formatDate(data.data_opcao_pelo_simples)})` : 'Não Optante'}</span>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-2 border border-gray-200">
                        <div className="text-[9px] font-bold text-[#555] uppercase mb-1 flex items-center gap-1">
                          MEI (Microempreendedor)
                        </div>
                        <div className="flex items-center gap-2">
                          {data.opcao_pelo_mei ? <CheckCircle2 size={14} className="text-green-600" /> : <XCircle size={14} className="text-gray-400" />}
                          <span className="text-xs font-bold">{data.opcao_pelo_mei ? 'Sim' : 'Não'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {resultTab === 'contato' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-win95-blue mb-2 flex items-center gap-1"><MapPin size={10} /> Localização</h4>
                    <div className="bg-gray-50 p-3 border border-gray-200 grid grid-cols-2 gap-4">
                      <DataField label="Logradouro" value={`${data.descricao_tipo_de_logradouro} ${data.logradouro}`} />
                      <DataField label="Número" value={data.numero} />
                      <DataField label="Complemento" value={data.complemento} />
                      <DataField label="Bairro" value={data.bairro} />
                      <DataField label="Município / UF" value={`${data.municipio} - ${data.uf}`} />
                      <DataField label="CEP" value={data.cep} isMono />
                    </div>
                    <div className="mt-2 text-right">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${data.logradouro}, ${data.numero} - ${data.municipio}, ${data.uf}`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-win95-blue hover:underline"
                      >
                        <ExternalLink size={10} /> Ver no Google Maps
                      </a>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-black uppercase text-win95-blue mb-2 flex items-center gap-1"><Phone size={10} /> Contatos</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <DataField label="Telefone Primário" value={data.ddd_telefone_1} />
                      <DataField label="Telefone Secundário" value={data.ddd_telefone_2} />
                      <DataField label="E-mail" value={data.email} full highlight />
                    </div>
                  </div>
                </div>
              )}

              {resultTab === 'socios' && (
                <div>
                  {data.qsa && data.qsa.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2">
                      {data.qsa.map((socio, idx) => (
                        <div key={idx} className="win95-raised p-2 bg-gray-50 flex flex-col sm:flex-row justify-between gap-4 group hover:bg-white">
                          <div className="flex-1">
                            <DataField label="Nome / Razão Social" value={socio.nome_socio} highlight />
                          </div>
                          <div className="flex-1">
                            <DataField label="Qualificação" value={socio.qualificacao_socio} />
                          </div>
                          <div className="w-24">
                            <DataField label="Entrada" value={formatDate(socio.data_entrada_sociedade)} isMono />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-gray-500 italic border border-dashed border-gray-300">
                      Nenhum sócio informado na base de dados (comum para MEIs ou Natureza Jurídica Específica).
                    </div>
                  )}
                </div>
              )}

              {resultTab === 'cnaes' && (
                <div className="space-y-4">
                  <div>
                    <div className="bg-win95-blue text-white px-2 py-1 text-[10px] font-bold uppercase mb-2">Atividade Principal</div>
                    <div className="p-3 border-2 border-win95-blue bg-blue-50 group hover:bg-white transition-colors">
                      <div className="text-lg font-mono font-black text-win95-blue mb-1 flex justify-between items-center">
                        {data.cnae_fiscal}
                        <button
                          onClick={() => { navigator.clipboard.writeText(`${data.cnae_fiscal} - ${data.cnae_fiscal_descricao}`) }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-blue-100 rounded text-blue-500"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                      <div className="text-sm font-bold leading-tight uppercase">{data.cnae_fiscal_descricao}</div>
                    </div>
                  </div>

                  <div>
                    <div className="bg-[#808080] text-white px-2 py-1 text-[10px] font-bold uppercase mb-2">Atividades Secundárias ({data.cnaes_secundarios?.length || 0})</div>
                    {data.cnaes_secundarios && data.cnaes_secundarios.length > 0 ? (
                      <div className="max-h-[200px] overflow-y-auto border border-gray-300 bg-gray-50 divide-y divide-gray-200">
                        {data.cnaes_secundarios.map((cnae) => (
                          <div key={cnae.codigo} className="p-2 hover:bg-white transition-colors group">
                            <div className="flex items-start gap-2">
                              <span className="font-mono font-bold text-xs text-[#666]">{cnae.codigo}</span>
                              <span className="text-xs font-medium leading-tight uppercase flex-1">{cnae.descricao}</span>
                              <button
                                onClick={() => { navigator.clipboard.writeText(`${cnae.codigo} - ${cnae.descricao}`) }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded text-gray-500"
                              >
                                <Copy size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-2 text-xs text-gray-500 italic">Nenhuma atividade secundária.</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="text-[9px] text-[#555] text-center mt-2 border-t pt-2 shrink-0">
              Dados oficiais da Receita Federal via BrasilAPI
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Sub-componente: Bancos ---
const BanksTool: React.FC = () => {
  const [banks, setBanks] = useState<BankData[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://brasilapi.com.br/api/banks/v1')
      .then(r => r.json())
      .then(data => {
        // Ordena por código
        const sorted = data.sort((a: BankData, b: BankData) => (a.code || 9999) - (b.code || 9999));
        setBanks(sorted);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = banks.filter(b =>
    (b.fullName || b.name).toLowerCase().includes(filter.toLowerCase()) ||
    String(b.code).includes(filter)
  );

  return (
    <div className="h-full flex flex-col gap-2">
      <div className="win95-raised bg-palette-lightest p-2 flex gap-2 items-center">
        <Search size={14} className="text-win95-shadow" />
        <input
          className="flex-1 win95-sunken px-2 py-1 text-xs outline-none bg-white text-black"
          placeholder="Filtrar por nome ou código..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
        <div className="win95-sunken bg-palette-lightest px-2 py-1 text-xs font-mono font-bold w-20 text-center text-palette-darkest">
          {loading ? '...' : filtered.length}
        </div>
      </div>

      <div className="flex-1 win95-sunken bg-palette-lightest overflow-y-auto custom-scrollbar">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 bg-[#e0e0e0] font-bold text-[10px] uppercase border-b border-win95-shadow z-10">
            <tr>
              <th className="px-2 py-1 w-16 text-center border-r border-white">Código</th>
              <th className="px-2 py-1 w-24 text-center border-r border-white">ISPB</th>
              <th className="px-2 py-1">Nome da Instituição</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(bank => (
              <tr key={bank.ispb} className="hover:bg-blue-50">
                <td className="px-2 py-1 font-mono font-bold text-center text-win95-blue">{bank.code ?? '-'}</td>
                <td className="px-2 py-1 font-mono text-center text-[#555] text-[10px]">{bank.ispb}</td>
                <td className="px-2 py-1 text-black font-medium">{bank.name || bank.fullName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Sub-componente: Financeiro ---
const FinanceTool: React.FC = () => {
  const [quotes, setQuotes] = useState<CurrencyQuote[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      // Dólar, Euro, BTC
      const res = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,BTC-BRL');
      const json = await res.json();
      setQuotes(Object.values(json));
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
    const interval = setInterval(fetchQuotes, 30000); // Atualiza a cada 30s
    return () => clearInterval(interval);
  }, []);

  const formatMoney = (val: string) => {
    return parseFloat(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatPct = (val: string) => {
    const num = parseFloat(val);
    return (num > 0 ? '+' : '') + num.toFixed(2) + '%';
  };

  return (
    <div className="h-full flex flex-col gap-4 p-2 overflow-y-auto custom-scrollbar">
      <div className="flex justify-between items-center mb-2">
        <div className="text-[10px] font-bold uppercase text-[#555]">Mercado Financeiro (Real Time)</div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-[#555]">Atualizado às {lastUpdate}</span>
          <button onClick={fetchQuotes} className="p-1 win95-raised bg-win95-bg hover:bg-white active:shadow-none" disabled={loading}>
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quotes.map(quote => {
          const isPositive = parseFloat(quote.pctChange) >= 0;
          return (
            <div key={quote.code} className="win95-raised bg-win95-bg p-3 border-2 border-white relative overflow-hidden group hover:-translate-y-1 transition-transform">
              <div className="absolute top-0 right-0 p-1 opacity-10 group-hover:opacity-20 transition-opacity">
                <DollarSign size={48} />
              </div>

              <div className="flex justify-between items-start mb-2 relative z-10">
                <div className="font-black text-sm text-win95-blue">{quote.code}</div>
                <div className={`text-[10px] font-bold px-1.5 py-0.5 border ${isPositive ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300'} flex items-center gap-1`}>
                  {isPositive ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                  {formatPct(quote.pctChange)}
                </div>
              </div>

              <div className="text-2xl font-black text-black tracking-tighter mb-1 relative z-10">
                {formatMoney(quote.bid)}
              </div>

              <div className="text-[9px] text-[#555] font-mono border-t border-white pt-1 relative z-10">
                Min: {formatMoney(quote.low)} | Max: {formatMoney(quote.high)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 win95-sunken bg-white p-3 text-[10px]">
        <h4 className="font-bold uppercase mb-1 text-win95-blue">Notícias Rápidas:</h4>
        <div className="text-[#555] italic">O módulo de notícias será integrado em breve.</div>
      </div>
    </div>
  );
};
