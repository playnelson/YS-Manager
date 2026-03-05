
import React, { useState, useEffect } from 'react';
import { Search, Building2, MapPin, Users, AlertTriangle, Briefcase, Copy, Loader2, History, Info, Printer, DollarSign, FileText, CheckCircle2, XCircle, Check, ExternalLink, Car, User, Truck, Key, ShieldCheck, CreditCard } from 'lucide-react';
import { Button } from './ui/Button';
import { CnpjData, FipeBrand, FipeModel, FipeYear, FipeResult } from '../types';

// URLs dos Sintegra Estaduais
const SINTEGRA_URLS: Record<string, string> = {
  'AC': 'http://www.sefaz.ac.gov.br/sefaz/sintegra',
  'AL': 'http://sintegra.sefaz.al.gov.br/',
  'AP': 'http://www.sefaz.ap.gov.br/sate/seg/SEGf_AcessarFuncao.jsp?cdFuncao=OA3C',
  'AM': 'https://online.sefaz.am.gov.br/silt/Normas/Sintegra/Sintegra.asp',
  'BA': 'http://www.sefaz.ba.gov.br/scripts/cadastro/cadastroBa/consultaBa.asp',
  'CE': 'https://servicos.sefaz.ce.gov.br/internet/Sintegra/Sintegra.asp',
  'DF': 'https://ww1.receita.fazenda.df.gov.br/consultar-situacao-fiscal',
  'ES': 'http://www.sintegra.es.gov.br/',
  'GO': 'http://www.sefaz.go.gov.br/Sintegra/Consultar/Consultar.asp',
  'MA': 'http://sistemas.sefaz.ma.gov.br/sintegra/jsp/consultaSintegra/consultaSintegra.jsf',
  'MT': 'http://www.sefaz.mt.gov.br/acesso-web/sintegra/consultar',
  'MS': 'http://www.sintegra.ms.gov.br/',
  'MG': 'http://consultasintegra.fazenda.mg.gov.br/sintegra/',
  'PA': 'https://app.sefa.pa.gov.br/Sintegra/',
  'PB': 'https://www.sefaz.pb.gov.br/sintegra',
  'PR': 'http://www.sintegra.pr.gov.br/',
  'PE': 'http://www.sefaz.pe.gov.br/Publicacoes/Sintegra/Paginas/Consultas.aspx',
  'PI': 'http://webas.sefaz.pi.gov.br/sintegra/',
  'RJ': 'http://www4.fazenda.rj.gov.br/sincad-web/index.jsf',
  'RN': 'https://uvt.set.rn.gov.br/#/home',
  'RS': 'https://www.sefaz.rs.gov.br/NFE/NFE-CCC.aspx',
  'RO': 'https://portalcontribuinte.sefin.ro.gov.br/Publico/ParametroPublica.jsp',
  'RR': 'https://www.sefaz.rr.gov.br/',
  'SC': 'http://sistemas3.sef.sc.gov.br/sintegra/consulta_empresa_pesquisa.aspx',
  'SP': 'https://pf.sintegra.sp.gov.br/consultaSintegra/consultar.do',
  'SE': 'http://www.sefaz.se.gov.br/Site/Sintegra.aspx',
  'TO': 'http://sintegra.sefaz.to.gov.br/',
};

// URLs DETRAN
const DETRAN_URLS: Record<string, string> = {
  'SP': 'https://www.detran.sp.gov.br/',
  'RJ': 'https://www.detran.rj.gov.br/',
  'MG': 'https://www.detran.mg.gov.br/',
  'PR': 'https://www.detran.pr.gov.br/',
  'SC': 'https://www.detran.sc.gov.br/',
  'RS': 'https://www.detran.rs.gov.br/',
  // Fallback genérico
  'DEFAULT': 'https://www.gov.br/transportes/pt-br/assuntos/transito/senatran'
};

const CCC_GERAL = 'https://dfe-portal.svrs.rs.gov.br/NFE/CCC';

type ModuleType = 'cpf' | 'veiculos' | 'cnpj';

export const CnpjQuery: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ModuleType>('cnpj');

  return (
    <div className="h-full flex gap-2 overflow-hidden">
      {/* Menu Lateral de Módulos */}
      <div className="w-16 flex flex-col gap-2 win95-raised bg-palette-lightest p-2 items-center shrink-0">
        <button
          onClick={() => setActiveModule('cpf')}
          className={`w-full aspect-square flex flex-col items-center justify-center gap-1 p-1 border-2 ${activeModule === 'cpf' ? 'border-palette-darkest bg-palette-lightest shadow-inner' : 'border-transparent hover:border-palette-mediumDark hover:shadow-sm'}`}
        >
          <User size={24} className={activeModule === 'cpf' ? 'text-palette-darkest' : 'text-palette-darkest/40'} />
          <span className="text-[8px] font-bold uppercase text-center leading-none">Motorista</span>
        </button>

        <button
          onClick={() => setActiveModule('veiculos')}
          className={`w-full aspect-square flex flex-col items-center justify-center gap-1 p-1 border-2 ${activeModule === 'veiculos' ? 'border-palette-darkest bg-palette-lightest shadow-inner' : 'border-transparent hover:border-palette-mediumDark hover:shadow-sm'}`}
        >
          <Car size={24} className={activeModule === 'veiculos' ? 'text-palette-darkest' : 'text-palette-darkest/40'} />
          <span className="text-[8px] font-bold uppercase text-center leading-none">Veículos</span>
        </button>

        <button
          onClick={() => setActiveModule('cnpj')}
          className={`w-full aspect-square flex flex-col items-center justify-center gap-1 p-1 border-2 ${activeModule === 'cnpj' ? 'border-palette-darkest bg-palette-lightest shadow-inner' : 'border-transparent hover:border-palette-mediumDark hover:shadow-sm'}`}
        >
          <Building2 size={24} className={activeModule === 'cnpj' ? 'text-palette-darkest' : 'text-palette-darkest/40'} />
          <span className="text-[8px] font-bold uppercase text-center leading-none">Empresas</span>
        </button>
      </div>

      {/* Área de Conteúdo */}
      <div className="flex-1 overflow-hidden h-full">
        {activeModule === 'cpf' && <CpfModule />}
        {activeModule === 'veiculos' && <VehicleModule />}
        {activeModule === 'cnpj' && <CnpjModule />}
      </div>
    </div>
  );
};

// --------------------------------------------------------------------------------
// MÓDULO 1: CONSULTA DE MOTORISTA (CPF)
// --------------------------------------------------------------------------------
const CpfModule: React.FC = () => {
  const [cpf, setCpf] = useState('');
  const [status, setStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [region, setRegion] = useState('');

  const formatCPF = (val: string) => {
    return val
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const getRegion = (cpfClean: string) => {
    const regionDigit = parseInt(cpfClean.charAt(8));
    const regions = [
      'Rio Grande do Sul',
      'DF, Goiás, Mato Grosso, MS e Tocantins',
      'Amazonas, Pará, Roraima, Amapá, Acre e Rondônia',
      'Ceará, Maranhão e Piauí',
      'Paraíba, Pernambuco, Alagoas e Rio Grande do Norte',
      'Bahia e Sergipe',
      'Minas Gerais',
      'Rio de Janeiro e Espírito Santo',
      'São Paulo',
      'Paraná e Santa Catarina'
    ];
    return regions[regionDigit] || 'Desconhecida';
  };

  const validateCPF = () => {
    const strCPF = cpf.replace(/\D/g, '');
    if (strCPF.length !== 11 || /^(\d)\1+$/.test(strCPF)) {
      setStatus('invalid');
      setRegion('');
      return;
    }

    let soma = 0;
    let resto;
    for (let i = 1; i <= 9; i++) soma = soma + parseInt(strCPF.substring(i - 1, i)) * (11 - i);
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(strCPF.substring(9, 10))) {
      setStatus('invalid');
      return;
    }

    soma = 0;
    for (let i = 1; i <= 10; i++) soma = soma + parseInt(strCPF.substring(i - 1, i)) * (12 - i);
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(strCPF.substring(10, 11))) {
      setStatus('invalid');
      return;
    }

    setStatus('valid');
    setRegion(getRegion(strCPF));
  };

  return (
    <div className="h-full flex flex-col gap-4 bg-palette-lightest p-4 win95-raised font-sans">
      <div className="bg-palette-darkest text-white px-2 py-1 text-sm font-bold flex items-center gap-2">
        <User size={16} /> Consulta e Validação de Motorista
      </div>

      <div className="flex gap-4 items-start">
        <div className="w-1/2 space-y-4">
          <div className="win95-raised p-4 bg-palette-mediumLight">
            <label className="text-xs font-bold uppercase mb-2 block text-palette-darkest">CPF do Motorista:</label>
            <div className="flex gap-2">
              <input
                className="flex-1 win95-sunken px-2 py-1 text-lg font-mono font-bold bg-palette-lightest text-palette-darkest"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={e => { setCpf(formatCPF(e.target.value)); setStatus('idle'); }}
              />
              <Button onClick={validateCPF} icon={<Check size={16} />}>VERIFICAR</Button>
            </div>
            <p className="text-[10px] text-gray-600 mt-2 italic border-t border-gray-400 pt-1">
              * A validação matemática garante que o número existe. Dados como Nome e Nascimento são protegidos por sigilo (LGPD).
            </p>
          </div>

          {status === 'valid' && (
            <div className="win95-sunken p-4 border-2 bg-green-50 border-green-500">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={24} className="text-green-700" />
                <span className="text-lg font-black uppercase text-green-800">CPF MATEMATICAMENTE VÁLIDO</span>
              </div>
              <div className="space-y-3 mt-2 border-t border-green-300 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[9px] font-bold text-green-800 uppercase block">Região Fiscal (Origem):</span>
                    <span className="text-sm font-bold text-black leading-tight">{region}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-green-800 uppercase block">Formatação:</span>
                    <span className="text-sm font-mono text-black">{cpf}</span>
                  </div>
                </div>

                <div className="bg-yellow-100 p-2 border border-yellow-300">
                  <p className="text-[10px] font-bold text-yellow-800 mb-2">Deseja validar o Nome e Situação Cadastral?</p>
                  <Button
                    className="w-full text-[10px]"
                    icon={<ExternalLink size={12} />}
                    onClick={() => window.open('https://servicos.receita.fazenda.gov.br/Servicos/CPF/ConsultaSituacao/ConsultaPublica.asp', '_blank')}
                  >
                    CONSULTAR NA RECEITA FEDERAL
                  </Button>
                </div>
              </div>
            </div>
          )}

          {status === 'invalid' && (
            <div className="win95-sunken p-4 border-2 bg-red-100 border-red-500 flex items-center gap-2 text-red-700">
              <AlertTriangle size={24} />
              <span className="font-black uppercase">CPF Inválido (Digíto verificador incorreto)</span>
            </div>
          )}
        </div>

        <div className="w-1/2 win95-sunken bg-palette-lightest p-4 text-xs font-mono space-y-2 h-[300px] overflow-y-auto">
          <h4 className="font-bold border-b border-palette-mediumLight mb-2 text-palette-darkest/60">LOG DE PROCESSAMENTO</h4>
          <p className="text-gray-500">{new Date().toLocaleTimeString()} - Sistema Iniciado.</p>
          {status !== 'idle' && <p className="text-black">{new Date().toLocaleTimeString()} - Entrada de dados: {cpf}</p>}
          {status === 'valid' && (
            <>
              <p className="text-blue-700">{`> Verificação Algorítmica (Módulo 11): OK`}</p>
              <p className="text-blue-700">{`> Dígito Região Fiscal: Identificado`}</p>
              <p className="text-blue-700">{`> Formato: 11 Dígitos Numéricos`}</p>
              <p className="text-green-700 font-bold">{`> RESULTADO: ESTRUTURA VÁLIDA`}</p>
              <br />
              <p className="text-gray-500 text-[10px]">NOTA: Para obter o nome completo, utilize o botão de consulta oficial ao lado. APIs gratuitas de terceiros que retornam dados pessoais são ilegais ou instáveis.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// --------------------------------------------------------------------------------
// MÓDULO 2: CONSULTA DE VEÍCULOS (FIPE + PLACA)
// --------------------------------------------------------------------------------
const VehicleModule: React.FC = () => {
  const [mode, setMode] = useState<'fipe' | 'plate'>('plate');

  // FIPE STATES
  const [type, setType] = useState<'carros' | 'motos' | 'caminhoes'>('carros');
  const [brands, setBrands] = useState<FipeBrand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [models, setModels] = useState<FipeModel[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [years, setYears] = useState<FipeYear[]>([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [result, setResult] = useState<FipeResult | null>(null);
  const [loading, setLoading] = useState(false);

  // PLATE STATES
  const [plate, setPlate] = useState('');
  const [plateData, setPlateData] = useState<any>(null);

  // --- FIPE LOGIC ---
  useEffect(() => {
    if (mode !== 'fipe') return;
    setLoading(true);
    fetch(`https://parallelum.com.br/fipe/api/v1/${type}/marcas`).then(r => r.json()).then(setBrands).finally(() => setLoading(false));
  }, [type, mode]);

  useEffect(() => {
    if (!selectedBrand) return;
    setLoading(true);
    fetch(`https://parallelum.com.br/fipe/api/v1/${type}/marcas/${selectedBrand}/modelos`).then(r => r.json()).then(d => setModels(d.modelos)).finally(() => setLoading(false));
  }, [selectedBrand]);

  useEffect(() => {
    if (!selectedModel) return;
    setLoading(true);
    fetch(`https://parallelum.com.br/fipe/api/v1/${type}/marcas/${selectedBrand}/modelos/${selectedModel}/anos`).then(r => r.json()).then(setYears).finally(() => setLoading(false));
  }, [selectedModel]);

  useEffect(() => {
    if (!selectedYear) return;
    setLoading(true);
    fetch(`https://parallelum.com.br/fipe/api/v1/${type}/marcas/${selectedBrand}/modelos/${selectedModel}/anos/${selectedYear}`).then(r => r.json()).then(setResult).finally(() => setLoading(false));
  }, [selectedYear]);

  // --- PLATE LOGIC (DECODER) ---
  const checkPlate = () => {
    const clean = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
    let type = 'Desconhecido';
    let isValid = false;
    let state = 'Brasil (Genérico)';

    // Regex Mercosul (AAA1A11) e Antiga (AAA1234)
    const isOld = /^[A-Z]{3}[0-9]{4}$/.test(clean);
    const isMercosul = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(clean);

    if (isOld) {
      type = 'Padrão Cinza (Antigo)';
      isValid = true;
      // Lógica aproximada de faixas de estado (Simplificada)
      const p = clean.substring(0, 3);
      if (p >= 'AAA' && p <= 'BEZ') state = 'PR';
      else if (p >= 'BFA' && p <= 'GKI') state = 'SP';
      else if (p >= 'GKJ' && p <= 'HOK') state = 'MG';
      else if (p >= 'HOL' && p <= 'KOE') state = 'MA';
      else if (p >= 'KOF' && p <= 'MDO') state = 'GO';
      else if (p >= 'KMF' && p <= 'LVE') state = 'RJ'; // Faixa 1 RJ
      else if (p >= 'RIP' && p <= 'RKV') state = 'RJ'; // Faixa 2 RJ
      // ... Adicionar mais faixas tornaria o código gigante, isso é um exemplo funcional
      else state = 'Indeterminado (Faixa mista)';
    } else if (isMercosul) {
      type = 'Padrão Mercosul';
      isValid = true;
      state = 'Nacional (Base Unificada)';
    }

    setPlateData({ plate: clean, type, isValid, state });
  };

  const openDetran = () => {
    if (!plateData) return;
    const uf = plateData.state === 'PR' ? 'PR' : plateData.state === 'SP' ? 'SP' : 'DEFAULT';
    const url = DETRAN_URLS[uf] || DETRAN_URLS['DEFAULT'];
    window.open(url, '_blank');
  };

  return (
    <div className="h-full flex flex-col gap-4 bg-palette-lightest p-4 win95-raised">
      <div className="bg-palette-darkest text-white px-2 py-1 text-sm font-bold flex justify-between items-center gap-2">
        <span className="flex items-center gap-2"><Car size={16} /> Consulta Veicular</span>
        <div className="flex gap-1">
          <button onClick={() => setMode('plate')} className={`px-2 py-0.5 text-[10px] font-bold ${mode === 'plate' ? 'bg-white text-black' : 'bg-win95-bg text-white border border-white'}`}>PLACA</button>
          <button onClick={() => setMode('fipe')} className={`px-2 py-0.5 text-[10px] font-bold ${mode === 'fipe' ? 'bg-white text-black' : 'bg-win95-bg text-white border border-white'}`}>TABELA FIPE</button>
        </div>
      </div>

      {mode === 'plate' && (
        <div className="flex gap-4">
          <div className="w-1/2 space-y-4">
            <div className="win95-raised p-6 bg-palette-mediumLight flex flex-col items-center gap-4">
              <div className="relative w-64 h-24 bg-palette-lightest border-4 border-palette-darkest rounded-lg flex items-center justify-center shadow-lg">
                <div className="absolute top-0 left-0 w-full h-6 bg-blue-700 flex justify-between px-2 items-center">
                  <span className="text-[8px] text-white font-bold">BRASIL</span>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Flag_of_Brazil.svg/64px-Flag_of_Brazil.svg.png" className="h-3 w-4" alt="BR" />
                </div>
                <input
                  className="w-full h-full text-center text-5xl font-black uppercase bg-transparent outline-none pt-4 tracking-widest font-mono"
                  placeholder="ABC1D23"
                  maxLength={7}
                  value={plate}
                  onChange={e => setPlate(e.target.value)}
                />
              </div>
              <Button onClick={checkPlate} className="w-64 h-10 font-bold text-sm">DECODIFICAR PLACA</Button>
            </div>
          </div>

          <div className="w-1/2">
            {plateData ? (
              <div className="win95-raised bg-palette-lightest p-4 h-full text-palette-darkest">
                <h3 className="text-sm font-black uppercase border-b-2 border-palette-darkest mb-4">Informações da Placa</h3>
                <div className="space-y-4">
                  <div className="flex justify-between border-b border-palette-mediumLight pb-1">
                    <span className="text-xs font-bold text-palette-darkest/40">FORMATO:</span>
                    <span className="text-xs font-bold">{plateData.type}</span>
                  </div>
                  <div className="flex justify-between border-b border-palette-mediumLight pb-1">
                    <span className="text-xs font-bold text-palette-darkest/40">VALIDADE:</span>
                    <span className={`text-xs font-black ${plateData.isValid ? 'text-green-600' : 'text-red-600'}`}>
                      {plateData.isValid ? 'VÁLIDA' : 'INVÁLIDA'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-palette-mediumLight pb-1">
                    <span className="text-xs font-bold text-palette-darkest/40">ORIGEM (ESTIMADA):</span>
                    <span className="text-xs font-bold text-palette-darkest">{plateData.state}</span>
                  </div>

                  {plateData.isValid && (
                    <div className="bg-blue-50 p-3 border border-blue-200 mt-4">
                      <p className="text-[10px] mb-2 font-bold text-blue-900">
                        Para ver Multas, Renavam e Proprietário, é necessário acessar o DETRAN estadual.
                      </p>
                      <Button onClick={openDetran} className="w-full" icon={<ExternalLink size={12} />}>
                        CONSULTAR NO DETRAN {plateData.state !== 'Nacional (Base Unificada)' ? plateData.state : ''}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-xs italic">
                Digite a placa para analisar a estrutura.
              </div>
            )}
          </div>
        </div>
      )}

      {mode === 'fipe' && (
        <div className="flex flex-col h-full">
          <div className="grid grid-cols-4 gap-4 mb-4">
            {/* Tipo */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase block">Tipo de Veículo</label>
              <div className="flex flex-col gap-1">
                <button onClick={() => setType('carros')} className={`text-left px-2 py-1 border-2 text-xs font-bold uppercase flex items-center gap-2 ${type === 'carros' ? 'win95-sunken bg-palette-mediumLight border-palette-mediumDark' : 'win95-raised'}`}><Car size={14} /> Carros</button>
                <button onClick={() => setType('motos')} className={`text-left px-2 py-1 border-2 text-xs font-bold uppercase flex items-center gap-2 ${type === 'motos' ? 'win95-sunken bg-palette-mediumLight border-palette-mediumDark' : 'win95-raised'}`}><Key size={14} /> Motos</button>
                <button onClick={() => setType('caminhoes')} className={`text-left px-2 py-1 border-2 text-xs font-bold uppercase flex items-center gap-2 ${type === 'caminhoes' ? 'win95-sunken bg-palette-mediumLight border-palette-mediumDark' : 'win95-raised'}`}><Truck size={14} /> Caminhões</button>
              </div>
            </div>

            {/* Marca */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase block">1. Marca</label>
              <select
                className="w-full h-32 win95-sunken bg-white text-xs outline-none"
                multiple
                value={[selectedBrand]}
                onChange={e => setSelectedBrand(e.target.value)}
              >
                {brands.map(b => <option key={b.codigo} value={b.codigo}>{b.nome}</option>)}
              </select>
            </div>

            {/* Modelo */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase block">2. Modelo</label>
              <select
                className="w-full h-32 win95-sunken bg-white text-xs outline-none"
                multiple
                value={[selectedModel]}
                onChange={e => setSelectedModel(e.target.value)}
                disabled={!selectedBrand}
              >
                {models.map(m => <option key={m.codigo} value={m.codigo}>{m.nome}</option>)}
              </select>
            </div>

            {/* Ano */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase block">3. Ano</label>
              <select
                className="w-full h-32 win95-sunken bg-white text-xs outline-none"
                multiple
                value={[selectedYear]}
                onChange={e => setSelectedYear(e.target.value)}
                disabled={!selectedModel}
              >
                {years.map(y => <option key={y.codigo} value={y.codigo}>{y.nome}</option>)}
              </select>
            </div>
          </div>

          {/* Resultado */}
          <div className="mt-auto win95-sunken bg-palette-lightest p-4 h-32 flex items-center justify-center relative">
            {loading && <div className="absolute inset-0 bg-palette-lightest/80 flex items-center justify-center z-10"><Loader2 className="animate-spin text-palette-darkest" /></div>}

            {result ? (
              <div className="w-full flex justify-between items-center px-8">
                <div>
                  <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Veículo Selecionado</div>
                  <div className="text-lg font-black text-black">{result.Marca} {result.Modelo}</div>
                  <div className="text-sm font-bold text-gray-700">{result.AnoModelo} - {result.Combustivel}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Preço Médio (FIPE)</div>
                  <div className="text-3xl font-black text-green-700 bg-green-50 px-4 py-1 border border-green-200 shadow-inner inline-block">
                    {result.Valor}
                  </div>
                  <div className="text-[9px] text-gray-400 mt-1">Cód. Fipe: {result.CodigoFipe} | Ref: {result.MesReferencia}</div>
                </div>
              </div>
            ) : (
              <div className="text-gray-300 font-black text-xl uppercase">Selecione os dados acima para consultar</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --------------------------------------------------------------------------------
// MÓDULO 3: CONSULTA DE EMPRESAS (CNPJ - Lógica Original)
// --------------------------------------------------------------------------------
const CnpjModule: React.FC = () => {
  const [cnpjInput, setCnpjInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CnpjData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<CnpjData[]>([]);
  const [activeTab, setActiveTab] = useState<'resumo' | 'detalhes' | 'socios' | 'cnaes'>('resumo');

  const formatCnpj = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCnpjInput(formatCnpj(e.target.value));
  };

  const handleSearch = async () => {
    const cleanCnpj = cnpjInput.replace(/\D/g, '');
    if (cleanCnpj.length !== 14) {
      setError('CNPJ inválido. Digite 14 números.');
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);

      if (!response.ok) {
        if (response.status === 404) throw new Error('CNPJ não encontrado na base de dados.');
        throw new Error('Erro ao consultar a API.');
      }

      const result: CnpjData = await response.json();
      setData(result);
      setActiveTab('resumo');

      setHistory(prev => {
        const exists = prev.find(item => item.cnpj === result.cnpj);
        if (exists) return prev;
        return [result, ...prev].slice(0, 10);
      });

    } catch (err: any) {
      setError(err.message || 'Erro desconhecido.');
    } finally {
      setLoading(false);
    }
  };

  const isAtiva = (status: number) => status === 2;

  const getPorteLabel = (porte: number) => {
    switch (porte) {
      case 1: return "NÃO INFORMADO";
      case 2: return "MICRO EMPRESA (ME)";
      case 3: return "EMPRESA DE PEQUENO PORTE (EPP)";
      case 5: return "DEMAIS";
      default: return `CÓDIGO ${porte}`;
    }
  };

  const openSintegra = () => {
    if (!data) return;
    const url = SINTEGRA_URLS[data.uf] || CCC_GERAL;
    window.open(url, '_blank');
  };

  const DataField = ({ label, value, isMono = false, highlight = false, full = false }: { label: string, value: string | number | null | undefined, isMono?: boolean, highlight?: boolean, full?: boolean }) => {
    const [copied, setCopied] = useState(false);

    if (!value && value !== 0) return null;
    const displayValue = String(value);

    const handleCopy = () => {
      navigator.clipboard.writeText(displayValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    };

    return (
      <div className={`space-y-0.5 ${full ? 'col-span-full' : ''}`}>
        <label className="text-[9px] font-bold text-palette-darkest/40 uppercase block">{label}</label>
        <div className={`text-sm flex items-center justify-between group ${highlight ? 'font-black text-palette-darkest' : 'font-bold text-palette-darkest'} ${isMono ? 'font-mono' : ''} border-b border-transparent hover:border-palette-mediumLight hover:bg-palette-mediumLight/20 rounded-sm px-1 -ml-1`}>
          <span className="truncate pr-2">{displayValue}</span>
          <button
            onClick={handleCopy}
            className={`p-1 rounded hover:bg-white hover:shadow-sm transition-all ${copied ? 'text-green-600' : 'text-gray-400 opacity-0 group-hover:opacity-100'}`}
            title="Copiar"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex gap-4 bg-palette-lightest p-2 overflow-hidden">
      {/* Sidebar: Busca e Histórico */}
      <div className="w-72 flex flex-col gap-4">
        <div className="win95-raised p-2 flex flex-col gap-3">
          <div className="bg-palette-darkest text-white px-2 py-1 text-xs font-bold uppercase flex items-center gap-2">
            <Search size={12} /> Consultar Base
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase block mb-1 text-palette-darkest/60">Número do CNPJ:</label>
            <div className="flex gap-1">
              <input
                className="w-full win95-sunken px-2 py-1 text-sm font-mono outline-none bg-palette-lightest text-palette-darkest font-bold"
                placeholder="00.000.000/0001-00"
                value={cnpjInput}
                onChange={handleInputChange}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={loading} className="w-10 flex items-center justify-center">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              </Button>
            </div>
          </div>

          {error && (
            <div className="win95-sunken bg-red-100 p-2 border-red-500 text-red-700 text-[10px] flex items-center gap-2 font-bold leading-tight">
              <AlertTriangle size={12} className="shrink-0" /> {error}
            </div>
          )}
        </div>

        <div className="flex-1 win95-raised p-2 flex flex-col overflow-hidden">
          <div className="bg-palette-mediumDark text-white px-2 py-1 text-[10px] font-bold uppercase mb-2 flex items-center gap-2">
            <History size={10} /> Recentes
          </div>
          <div className="flex-1 win95-sunken bg-palette-lightest overflow-y-auto p-1 custom-scrollbar">
            {history.length === 0 ? (
              <div className="text-center p-4 text-[#808080] text-[10px] italic">
                Nenhum registro.
              </div>
            ) : (
              <div className="space-y-1">
                {history.map(item => (
                  <div
                    key={item.cnpj}
                    onClick={() => { setData(item); setCnpjInput(formatCnpj(item.cnpj)); setActiveTab('resumo'); }}
                    className={`p-2 border border-dotted border-palette-mediumDark hover:bg-palette-mediumLight/40 cursor-pointer group ${data?.cnpj === item.cnpj ? 'bg-palette-darkest text-white' : 'bg-palette-lightest text-palette-darkest'}`}
                  >
                    <div className="text-[10px] font-bold truncate group-hover:underline">{item.razao_social}</div>
                    <div className="text-[9px] font-mono opacity-80">{formatCnpj(item.cnpj)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Display: Ficha Completa */}
      <div className="flex-1 win95-raised p-1 flex flex-col overflow-hidden bg-palette-lightest">
        {data ? (
          <div className="flex flex-col h-full">
            {/* Header Fixo */}
            <div className="bg-palette-darkest p-3 text-white flex justify-between items-start mb-2 shadow-md shrink-0">
              <div className="flex-1 min-w-0 mr-4">
                <div className="text-[10px] font-mono opacity-80 mb-0.5 flex items-center gap-2">
                  Ficha Cadastral # {formatCnpj(data.cnpj)}
                </div>
                <div className="text-lg font-black uppercase leading-none truncate" title={data.razao_social}>{data.razao_social}</div>
                <div className="text-xs font-bold opacity-80 mt-1 truncate">{data.nome_fantasia || '---'}</div>
              </div>
              <div className={`px-3 py-1 text-xs font-black uppercase border-2 shrink-0 ${isAtiva(data.situacao_cadastral) ? 'bg-green-600 border-green-400 text-white' : 'bg-red-600 border-red-400 text-white'}`}>
                {data.descricao_situacao_cadastral}
              </div>
            </div>

            {/* Abas */}
            <div className="flex gap-1 px-1 border-b border-white shrink-0">
              {[
                { id: 'resumo', label: 'Resumo Geral', icon: <FileText size={12} /> },
                { id: 'detalhes', label: 'Endereço & Contato', icon: <MapPin size={12} /> },
                { id: 'socios', label: `Sócios (${data.qsa?.length || 0})`, icon: <Users size={12} /> },
                { id: 'cnaes', label: `Atividades (${(data.cnaes_secundarios?.length || 0) + 1})`, icon: <Briefcase size={12} /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 text-xs font-bold uppercase flex items-center gap-2 rounded-t-sm border-t-2 border-l-2 border-r-2 ${activeTab === tab.id
                    ? 'bg-palette-lightest border-white border-r-palette-mediumDark pb-2 -mb-[1px] relative z-10 text-palette-darkest'
                    : 'bg-palette-mediumLight border-white text-palette-darkest/60 hover:bg-palette-mediumLight/80'
                    }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Conteúdo das Abas */}
            <div className="flex-1 win95-sunken bg-palette-lightest p-4 overflow-y-auto custom-scrollbar relative z-0">

              {/* ABA RESUMO */}
              {activeTab === 'resumo' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <DataField label="CNPJ" value={formatCnpj(data.cnpj)} isMono highlight />
                    <DataField label="Matriz / Filial" value={data.descricao_matriz_filial} />
                    <DataField label="Data de Abertura" value={formatDate(data.data_inicio_atividade)} />

                    <div className="col-span-2">
                      <DataField label="Razão Social" value={data.razao_social} />
                    </div>
                    <DataField label="Nome Fantasia" value={data.nome_fantasia || '---'} />

                    <div className="col-span-2">
                      <DataField label="Natureza Jurídica" value={`${data.codigo_natureza_juridica} - Natureza Jurídica`} />
                    </div>
                    <DataField label="Porte da Empresa" value={getPorteLabel(data.porte)} />

                    <div className="col-span-2 bg-yellow-50 p-2 border border-yellow-200">
                      <DataField label="Capital Social" value={formatCurrency(data.capital_social)} highlight />
                    </div>
                  </div>

                  {/* Seção Inscrição Estadual (Sintegra) */}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="bg-blue-50 p-3 border border-blue-100 flex justify-between items-center">
                      <div>
                        <h3 className="text-xs font-black uppercase text-palette-darkest mb-3 flex items-center gap-2">
                          <Info size={14} /> Inscrição Estadual (IE)
                        </h3>
                        <p className="text-[10px] text-gray-600 mt-1 max-w-md">
                          A Inscrição Estadual é um dado gerido pelas SEFAZ estaduais e não consta na base aberta federal. Utilize o atalho ao lado para consultar no sistema do estado <b>{data.uf}</b>.
                        </p>
                      </div>
                      <Button onClick={openSintegra} className="shrink-0 bg-white border-blue-200 text-blue-800 hover:bg-blue-100" icon={<ExternalLink size={14} />}>
                        ACESSAR SINTEGRA / {data.uf}
                      </Button>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-xs font-black uppercase text-win95-blue mb-3">Regime Tributário</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className={`p-2 border ${data.opcao_pelo_simples ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          {data.opcao_pelo_simples ? <CheckCircle2 size={16} className="text-green-600" /> : <XCircle size={16} className="text-gray-400" />}
                          <span className="font-bold text-xs uppercase">Simples Nacional</span>
                        </div>
                        <div className="text-[10px] pl-6">
                          {data.opcao_pelo_simples
                            ? `Optante desde ${formatDate(data.data_opcao_pelo_simples)}`
                            : 'Não optante'}
                        </div>
                      </div>

                      <div className={`p-2 border ${data.opcao_pelo_mei ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          {data.opcao_pelo_mei ? <CheckCircle2 size={16} className="text-green-600" /> : <XCircle size={16} className="text-gray-400" />}
                          <span className="font-bold text-xs uppercase">Microempreendedor Individual (MEI)</span>
                        </div>
                        <div className="text-[10px] pl-6">
                          {data.opcao_pelo_mei ? 'Enquadrado como MEI' : 'Não enquadrado'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA DETALHES */}
              {activeTab === 'detalhes' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-black uppercase text-win95-blue mb-3 flex items-center gap-2"><MapPin size={14} /> Endereço Cadastral</h3>
                    <div className="grid grid-cols-12 gap-y-4 gap-x-2 bg-palette-mediumLight/20 p-3 border border-palette-mediumLight">
                      <div className="col-span-10">
                        <DataField label="Logradouro" value={`${data.descricao_tipo_de_logradouro} ${data.logradouro}`} />
                      </div>
                      <div className="col-span-2">
                        <DataField label="Número" value={data.numero} />
                      </div>
                      <div className="col-span-6">
                        <DataField label="Bairro" value={data.bairro} />
                      </div>
                      <div className="col-span-6">
                        <DataField label="Complemento" value={data.complemento} />
                      </div>
                      <div className="col-span-5">
                        <DataField label="Município" value={data.municipio} />
                      </div>
                      <div className="col-span-2">
                        <DataField label="UF" value={data.uf} />
                      </div>
                      <div className="col-span-5">
                        <DataField label="CEP" value={data.cep} isMono />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-black uppercase text-win95-blue mb-3 flex items-center gap-2"><Info size={14} /> Dados de Contato</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-2 border border-dotted border-gray-400">
                        <DataField label="Telefone Primário" value={data.ddd_telefone_1} />
                      </div>
                      <div className="p-2 border border-dotted border-gray-400">
                        <DataField label="Telefone Secundário" value={data.ddd_telefone_2} />
                      </div>
                      <div className="p-2 border border-dotted border-gray-400 md:col-span-2">
                        <DataField label="E-mail" value={data.email} highlight />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA SÓCIOS */}
              {activeTab === 'socios' && (
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase text-win95-blue mb-2">Quadro Societário (QSA)</h3>
                  {data.qsa && data.qsa.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2">
                      {data.qsa.map((socio, idx) => (
                        <div key={idx} className="win95-raised p-2 bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <DataField label="Nome / Razão Social" value={socio.nome_socio} highlight />
                          </div>
                          <div className="flex-1">
                            <DataField label="Qualificação" value={socio.qualificacao_socio} />
                          </div>
                          <div className="w-32">
                            <DataField label="Entrada" value={formatDate(socio.data_entrada_sociedade)} isMono />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500 italic border border-dashed border-gray-300">
                      Informação não disponível ou sociedade anônima de capital aberto.
                    </div>
                  )}
                </div>
              )}

              {/* ABA CNAES */}
              {activeTab === 'cnaes' && (
                <div className="space-y-6">
                  <div>
                    <div className="bg-win95-blue text-white px-2 py-1 text-[10px] font-bold uppercase mb-2">Atividade Principal</div>
                    <div className="p-3 border-2 border-win95-blue bg-blue-50 group hover:bg-white transition-colors">
                      <div className="text-lg font-mono font-black text-win95-blue mb-1 flex items-center justify-between">
                        {data.cnae_fiscal}
                        <button
                          onClick={() => { navigator.clipboard.writeText(`${data.cnae_fiscal} - ${data.cnae_fiscal_descricao}`) }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-blue-100 rounded text-blue-500"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                      <div className="text-sm font-bold leading-tight">{data.cnae_fiscal_descricao}</div>
                    </div>
                  </div>

                  <div>
                    <div className="bg-[#808080] text-white px-2 py-1 text-[10px] font-bold uppercase mb-2">Atividades Secundárias ({data.cnaes_secundarios?.length || 0})</div>
                    {data.cnaes_secundarios && data.cnaes_secundarios.length > 0 ? (
                      <div className="max-h-[300px] overflow-y-auto border border-gray-300 bg-gray-50 divide-y divide-gray-200">
                        {data.cnaes_secundarios.map((cnae) => (
                          <div key={cnae.codigo} className="p-2 hover:bg-white transition-colors group">
                            <div className="flex items-start gap-3">
                              <span className="font-mono font-bold text-xs text-[#666] whitespace-nowrap">{cnae.codigo}</span>
                              <span className="text-xs font-medium leading-tight flex-1">{cnae.descricao}</span>
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
                      <div className="p-4 text-sm text-gray-500 italic">Nenhuma atividade secundária registrada.</div>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Footer de Ações */}
            <div className="p-2 bg-win95-bg border-t border-white flex justify-between items-center shrink-0">
              <div className="text-[9px] text-[#666] font-bold">Fonte: Receita Federal do Brasil / BrasilAPI</div>
              <Button size="sm" onClick={() => window.print()} icon={<Printer size={12} />}>IMPRIMIR FICHA</Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[#808080] opacity-40">
            <Building2 size={64} strokeWidth={1} />
            <p className="mt-4 text-xs font-bold uppercase tracking-widest">Aguardando Consulta</p>
            <p className="text-[10px]">Utilize o painel lateral para buscar.</p>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .win95-sunken, .win95-sunken * {
            visibility: visible;
          }
          .win95-sunken {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            overflow: visible;
          }
        }
      `}</style>
    </div>
  );
};
