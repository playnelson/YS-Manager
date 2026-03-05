
import React, { useState, useEffect } from 'react';
import {
    IconSearch,
    IconBuildingBank,
    IconMapPin,
    IconId,
    IconActivity,
    IconExternalLink,
    IconLoader2,
    IconAlertCircle,
    IconRefresh,
    IconInfoCircle,
    IconDeviceTv,
    IconUser,
    IconNews,
    IconCurrencyDollar,
    IconGlobe,
    IconTruck,
    IconPhoneIncoming,
    IconCar,
    IconBrowser,
    IconUsers
} from '@tabler/icons-react';

interface BrasilApiState {
    cep: string;
    cnpj: string;
    bankCode: string;
    ddd: string;
    domain: string;
    fipeCode: string;
    data: any;
    loading: boolean;
    error: string | null;
    activeType: 'cep' | 'cnpj' | 'bank' | 'taxas' | 'ddd' | 'feriados' | 'fipe' | 'domain';
}

export const BrasilApiModule: React.FC = () => {
    const [state, setState] = useState<BrasilApiState>({
        cep: '',
        cnpj: '',
        bankCode: '',
        ddd: '',
        domain: '',
        fipeCode: '',
        data: null,
        loading: false,
        error: null,
        activeType: 'feriados'
    });

    const [rates, setRates] = useState<any[]>([]);

    // Fetch some "General Info" on mount to make it feel alive
    useEffect(() => {
        fetchFeriados();
        fetchRates();
    }, []);

    const fetchFeriados = async () => {
        setState(s => ({ ...s, loading: true, activeType: 'feriados' }));
        try {
            const year = new Date().getFullYear();
            const res = await fetch(`https://brasilapi.com.br/api/feriados/v1/${year}`);
            const data = await res.json();
            setState(s => ({ ...s, data: { type: 'feriados', items: data }, loading: false }));
        } catch (e) {
            setState(s => ({ ...s, error: 'Erro ao carregar feriados', loading: false }));
        }
    };

    const fetchRates = async () => {
        try {
            const res = await fetch('https://brasilapi.com.br/api/taxas/v1');
            const data = await res.json();
            setRates(data);
        } catch (e) {
            console.error('Erro ao carregar taxas');
        }
    };

    const fetchData = async (type: BrasilApiState['activeType'], param?: string) => {
        const p = param || (
            type === 'cep' ? state.cep :
                type === 'cnpj' ? state.cnpj :
                    type === 'bank' ? state.bankCode :
                        type === 'ddd' ? state.ddd :
                            type === 'fipe' ? state.fipeCode :
                                type === 'domain' ? state.domain : ''
        );

        setState(s => ({ ...s, loading: true, error: null, activeType: type }));
        let url = '';

        const cleanParam = (v: string) => v.replace(/\D/g, '');

        if (type === 'cep') url = `https://brasilapi.com.br/api/cep/v2/${cleanParam(p)}`;
        if (type === 'cnpj') url = `https://brasilapi.com.br/api/cnpj/v1/${cleanParam(p)}`;
        if (type === 'bank') url = `https://brasilapi.com.br/api/banks/v1/${p}`;
        if (type === 'ddd') url = `https://brasilapi.com.br/api/ddd/v1/${cleanParam(p)}`;
        if (type === 'taxas') url = `https://brasilapi.com.br/api/taxas/v1`;
        if (type === 'domain') url = `https://brasilapi.com.br/api/registrobr/v1/${p}`;
        if (type === 'fipe') url = `https://brasilapi.com.br/api/fipe/preco/v1/${p}`;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Informação não encontrada ou limite de requisições excedido');
            const data = await response.json();
            setState(s => ({ ...s, data: { type, ...data }, loading: false }));
        } catch (err: any) {
            setState(s => ({ ...s, error: err.message, loading: false }));
        }
    };

    const crossReferenceCep = (cep: string) => {
        setState(s => ({ ...s, cep }));
        fetchData('cep', cep);
    };

    const renderContent = () => {
        if (state.loading && state.activeType !== 'feriados') {
            return (
                <div className="flex flex-col items-center justify-center h-64 text-blue-800">
                    <IconLoader2 className="animate-spin mb-4" size={48} />
                    <span className="text-xs font-black uppercase tracking-widest">Acessando Rede Federal...</span>
                </div>
            );
        }

        if (state.error) {
            return (
                <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
                    <div className="p-6 bg-red-50 text-red-600 rounded-full">
                        <IconAlertCircle size={48} />
                    </div>
                    <div>
                        <h4 className="text-lg font-black uppercase text-red-600 italic leading-none">Erro de Protocolo</h4>
                        <p className="text-xs font-bold text-gray-400 uppercase mt-2">{state.error}</p>
                    </div>
                    <button onClick={() => setState(s => ({ ...s, error: null }))} className="px-6 py-3 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-red-500/20 active:scale-95 transition-all">Reportar / Resetar</button>
                </div>
            );
        }

        if (!state.data) return (
            <div className="flex flex-col items-center justify-center h-[400px] opacity-10">
                <IconGlobe size={160} stroke={0.4} />
                <p className="text-2xl font-black italic tracking-widest uppercase mt-4">Terminal Standby</p>
            </div>
        );

        const { type, ...data } = state.data;

        switch (type) {
            case 'cep':
                return (
                    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-8">
                        <div className="flex items-center gap-6 border-b pb-6 border-blue-50">
                            <div className="p-6 bg-blue-600 rounded-[2rem] text-white shadow-2xl">
                                <IconMapPin size={40} />
                            </div>
                            <div>
                                <h3 className="text-4xl font-black italic tracking-tighter text-blue-900 leading-none">{data.cep}</h3>
                                <p className="text-xs font-black text-blue-400 uppercase tracking-widest mt-2">{data.city} • {data.state} Brasil</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { label: 'Rua / Logradouro', value: data.street },
                                { label: 'Bairro / Setor', value: data.neighborhood },
                                { label: 'Coordenadas Geográficas', value: `${data.location?.coordinates?.latitude}, ${data.location?.coordinates?.longitude}` },
                                { label: 'Provedor de Dados', value: data.service, special: true }
                            ].map((item, i) => (
                                <div key={i} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm group hover:border-blue-500 transition-all">
                                    <label className="text-[9px] font-black text-gray-400 uppercase block mb-1 tracking-widest">{item.label}</label>
                                    <p className={`text-sm font-black ${item.special ? 'text-green-600 italic' : 'text-blue-900'}`}>{item.value || 'NÃO INFORMADO'}</p>
                                </div>
                            ))}
                        </div>

                        <a href={`https://www.google.com/maps/search/?api=1&query=${data.street},${data.neighborhood},${data.city},${data.state}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-3 w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-[2rem] text-sm font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all">
                            <IconExternalLink size={20} /> Mapeamento Satelital Real-Time
                        </a>
                    </div>
                );

            case 'cnpj':
                return (
                    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-8">
                        <div className="flex items-center gap-6 border-b pb-6 border-indigo-50">
                            <div className="p-6 bg-indigo-600 rounded-[2rem] text-white shadow-2xl shrink-0">
                                <IconBuildingBank size={40} />
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <h3 className="text-2xl font-black italic tracking-tighter text-blue-900 uppercase leading-none truncate">{data.razao_social}</h3>
                                <div className="flex items-center gap-3 mt-3">
                                    <span className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em]">{data.cnpj}</span>
                                    <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${data.descricao_situacao_cadastral === 'ATIVA' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        SITUAÇÃO: {data.descricao_situacao_cadastral}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm col-span-2">
                                <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">CNAE Primário (Atividade)</label>
                                <p className="text-xs font-black text-blue-900 leading-tight uppercase italic">{data.cnae_fiscal_descricao}</p>
                            </div>
                            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                                <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Capital Social Integralizado</label>
                                <p className="text-lg font-black text-green-600">R$ {data.capital_social?.toLocaleString('pt-BR')}</p>
                            </div>
                            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                                <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Início das Operações</label>
                                <p className="text-lg font-black text-blue-900">{data.data_inicio_atividade}</p>
                            </div>
                        </div>

                        {data.qsa && data.qsa.length > 0 && (
                            <div className="bg-slate-900 p-6 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10 text-white pointer-events-none">
                                    <IconUsers size={80} />
                                </div>
                                <h4 className="text-[10px] font-black uppercase text-indigo-300 mb-4 flex items-center gap-2">
                                    <IconId size={14} /> Quadro de Sócios e Administradores (QSA)
                                </h4>
                                <div className="space-y-3">
                                    {data.qsa.map((socio: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0">
                                            <div>
                                                <p className="text-xs font-black text-white uppercase italic truncate max-w-[200px]">{socio.nome_socio}</p>
                                                <p className="text-[9px] font-bold text-indigo-400 uppercase">{socio.qualificacao_socio}</p>
                                            </div>
                                            <span className="text-[8px] font-black text-indigo-200 bg-white/5 px-2 py-1 rounded">FAIXA ETÁRIA: {socio.faixa_etaria || 'N/A'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 'bank':
                return (
                    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-8">
                        <div className="flex items-center gap-6 border-b pb-6 border-emerald-50">
                            <div className="p-6 bg-emerald-600 rounded-[2rem] text-white shadow-2xl">
                                <IconBuildingBank size={40} />
                            </div>
                            <div>
                                <h3 className="text-4xl font-black italic tracking-tighter text-blue-900 uppercase leading-none">{data.fullName}</h3>
                                <p className="text-xs font-black text-emerald-400 uppercase tracking-widest mt-2">Rede Bancária Interconectada • {data.code ? `COMPE ${String(data.code).padStart(3, '0')}` : 'DIGITAL ONLY'}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                                <label className="text-[9px] font-black text-gray-400 uppercase block mb-3">ISPB Protocol</label>
                                <div className="text-2xl font-black italic text-emerald-600 truncate w-full">{data.ispb}</div>
                            </div>
                            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                                <label className="text-[9px] font-black text-gray-400 uppercase block mb-3">COMPE</label>
                                <div className="text-4xl font-black italic text-gray-900">{data.code || '---'}</div>
                            </div>
                            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                                <label className="text-[9px] font-black text-gray-400 uppercase block mb-3">System Status</label>
                                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full border border-green-100">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest">Active</span>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'ddd':
                return (
                    <div className="p-8 space-y-8 animate-in fade-in">
                        <div className="flex items-center gap-6 border-b pb-6 border-purple-50">
                            <div className="p-6 bg-purple-600 rounded-[2rem] text-white shadow-2xl">
                                <IconPhoneIncoming size={40} />
                            </div>
                            <div>
                                <h3 className="text-4xl font-black italic tracking-tighter text-blue-900 leading-none">Região DDD {state.ddd}</h3>
                                <p className="text-xs font-black text-purple-400 uppercase tracking-widest mt-2">Cobertura em {data.state} • {data.cities.length} Cidades</p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
                            <label className="text-[9px] font-black text-gray-400 uppercase block mb-4 tracking-widest">Cidades Atendidas:</label>
                            <div className="max-h-64 overflow-y-auto custom-scrollbar flex flex-wrap gap-3">
                                {data.cities.map((city: string, i: number) => (
                                    <span key={i} className="px-4 py-2 bg-purple-50 text-purple-700 text-[10px] font-black rounded-xl border border-purple-100 uppercase tracking-tight">{city}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 'domain':
                return (
                    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-8">
                        <div className="flex items-center gap-6 border-b pb-6 border-gray-100">
                            <div className={`p-6 ${data.status === 'AVAILABLE' ? 'bg-green-600' : 'bg-orange-600'} rounded-[2rem] text-white shadow-2xl`}>
                                <IconBrowser size={40} />
                            </div>
                            <div>
                                <h3 className="text-4xl font-black italic tracking-tighter text-blue-900 uppercase leading-none">{data.fqdn}</h3>
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mt-2">{data.status === 'AVAILABLE' ? 'DURMÍNIO DISPONÍVEL PARA AQUISIÇÃO' : 'DOMÍNIO REGISTRADO • REGISTRO.BR'}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm border-l-8 border-l-orange-500">
                                <h4 className="text-[10px] font-black uppercase text-gray-400 mb-2">Metadata de Registro</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                    <div>
                                        <label className="text-[8px] font-black text-gray-400 uppercase block">Status</label>
                                        <p className="text-xs font-black uppercase text-blue-900 italic mt-1">{data.status}</p>
                                    </div>
                                    {data.publication_status && (
                                        <div>
                                            <label className="text-[8px] font-black text-gray-400 uppercase block">Publicação</label>
                                            <p className="text-xs font-black uppercase text-blue-900 italic mt-1">{data.publication_status}</p>
                                        </div>
                                    )}
                                    {data.expires_at && (
                                        <div>
                                            <label className="text-[8px] font-black text-gray-400 uppercase block">Expiração</label>
                                            <p className="text-xs font-black uppercase text-red-600 italic mt-1">{new Date(data.expires_at).toLocaleDateString()}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'fipe':
                return (
                    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-8">
                        <div className="flex items-center gap-6 border-b pb-6 border-amber-50">
                            <div className="p-6 bg-amber-600 rounded-[2rem] text-white shadow-2xl shrink-0">
                                <IconCar size={40} />
                            </div>
                            <div>
                                <h3 className="text-4xl font-black italic tracking-tighter text-blue-900 leading-none">Intelligence FIPE</h3>
                                <p className="text-xs font-black text-amber-500 uppercase tracking-widest mt-2">{Array.isArray(data) ? `Múltiplas Ocorrências (${data.length})` : 'Cotação Oficial Mercado'}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(Array.isArray(data) ? data : [data]).map((item: any, i: number) => (
                                <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group hover:border-amber-500 transition-all">
                                    <div className="absolute top-0 right-0 p-4 opacity-[0.05] pointer-events-none group-hover:scale-125 transition-transform">
                                        <IconCar size={64} />
                                    </div>
                                    <div className="flex flex-col h-full">
                                        <div className="mb-4">
                                            <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-tighter">{item.marca}</span>
                                        </div>
                                        <h4 className="text-sm font-black text-blue-900 uppercase italic line-clamp-2 mb-2">{item.modelo}</h4>
                                        <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                                            <div>
                                                <p className="text-[8px] font-black uppercase text-gray-400">Referência / Ano</p>
                                                <p className="text-xs font-black text-slate-900">{item.anoModelo} / {item.mesReferencia}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[8px] font-black uppercase text-gray-400">Avaliação do Bem</p>
                                                <p className="text-lg font-black text-green-600">{item.valor}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'feriados':
                return (
                    <div className="p-8 animate-in fade-in">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-2xl font-black italic tracking-tighter text-blue-900 uppercase">Calendário Nacional Pro</h3>
                            <div className="flex gap-2">
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-black rounded-full uppercase tracking-widest">{data.items.length} DATAS</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {data.items.map((f: any, i: number) => (
                                <div key={i} className="flex items-center gap-4 p-5 bg-white rounded-3xl border border-gray-50 shadow-sm transition-all hover:translate-x-1 border-l-4 border-l-blue-600">
                                    <div className="flex flex-col items-center bg-blue-50 px-4 py-3 rounded-2xl min-w-[60px]">
                                        <span className="text-[10px] font-black text-blue-400 uppercase leading-none mb-1">{new Date(f.date + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short' })}</span>
                                        <span className="text-2xl font-black italic text-blue-900 leading-none">{new Date(f.date + 'T00:00:00').getDate()}</span>
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-sm font-black text-gray-900 uppercase tracking-tight truncate">{f.name}</p>
                                        <p className="text-[9px] font-bold text-blue-300 uppercase tracking-widest mt-0.5">{f.type === 'national' ? 'Feriado Federal' : f.type}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="flex h-[calc(100vh-140px)] bg-[#f8fbff] overflow-hidden font-sans">
            {/* Sidebar de Controle de Inteligência */}
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-2xl z-30">
                <div className="p-8 bg-slate-900 text-white shrink-0 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none rotate-[20deg]">
                        <IconGlobe size={180} />
                    </div>
                    <div className="flex items-center gap-2 mb-3 relative z-10">
                        <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"></div>
                        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-blue-400">Security Module v4.7</span>
                    </div>
                    <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-tight relative z-10">Cyber Intelligence</h2>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 relative z-10 italic">Acesso Restrito: Protocolo SSL/TLS 1.3</p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gray-50/40">
                    {/* Buscas Interativas */}
                    <div className="space-y-6">
                        {/* CEP Search */}
                        <div className="group">
                            <label className="text-[9px] font-black uppercase text-gray-400 flex items-center justify-between tracking-widest mb-2 px-1 group-focus-within:text-blue-500 transition-colors">
                                <span>Localização / Logística</span>
                                <IconMapPin size={12} />
                            </label>
                            <div className="flex gap-2">
                                <input className="flex-1 bg-white border border-gray-200 outline-none px-4 py-3 rounded-2xl text-xs font-black focus:ring-2 ring-blue-500/20 shadow-sm transition-all tracking-widest" placeholder="00000-000" value={state.cep} onChange={e => setState(s => ({ ...s, cep: e.target.value }))} onKeyDown={e => e.key === 'Enter' && fetchData('cep')} />
                                <button onClick={() => fetchData('cep')} className="p-3.5 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all active:scale-90 shadow-lg shadow-blue-500/20"><IconSearch size={18} /></button>
                            </div>
                        </div>

                        {/* CNPJ Search */}
                        <div className="group">
                            <label className="text-[9px] font-black uppercase text-gray-400 flex items-center justify-between tracking-widest mb-2 px-1 group-focus-within:text-indigo-500 transition-colors">
                                <span>Receita Federal / QSA</span>
                                <IconBuildingBank size={12} />
                            </label>
                            <div className="flex gap-2">
                                <input className="flex-1 bg-white border border-gray-200 outline-none px-4 py-3 rounded-2xl text-xs font-black focus:ring-2 ring-indigo-500/20 shadow-sm transition-all tracking-widest" placeholder="00.000.000/0001-00" value={state.cnpj} onChange={e => setState(s => ({ ...s, cnpj: e.target.value }))} onKeyDown={e => e.key === 'Enter' && fetchData('cnpj')} />
                                <button onClick={() => fetchData('cnpj')} className="p-3.5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all active:scale-90 shadow-lg shadow-indigo-500/20"><IconSearch size={18} /></button>
                            </div>
                        </div>

                        {/* DDD */}
                        <div className="group">
                            <label className="text-[9px] font-black uppercase text-gray-400 flex items-center justify-between tracking-widest mb-2 px-1 group-focus-within:text-purple-500 transition-colors">
                                <span>Região por DDD</span>
                                <IconPhoneIncoming size={12} />
                            </label>
                            <div className="flex gap-2">
                                <input
                                    className="flex-1 bg-white border border-gray-200 outline-none px-4 py-3 rounded-2xl text-xs font-black focus:ring-2 ring-purple-500/20 shadow-sm transition-all tracking-widest"
                                    placeholder="Ex: 11, 21, 51"
                                    value={state.ddd}
                                    onChange={e => setState(s => ({ ...s, ddd: e.target.value }))}
                                    onKeyDown={e => e.key === 'Enter' && fetchData('ddd')}
                                />
                                <button onClick={() => fetchData('ddd')} className="p-3.5 bg-purple-600 text-white rounded-2xl hover:bg-purple-700 transition-all active:scale-90 shadow-lg shadow-purple-500/20"><IconSearch size={18} /></button>
                            </div>
                        </div>

                        {/* Domain Search */}
                        <div className="group">
                            <label className="text-[9px] font-black uppercase text-gray-400 flex items-center justify-between tracking-widest mb-2 px-1 group-focus-within:text-orange-500 transition-colors">
                                <span>Domínios / Whois</span>
                                <IconBrowser size={12} />
                            </label>
                            <div className="flex gap-2">
                                <input className="flex-1 bg-white border border-gray-200 outline-none px-4 py-3 rounded-2xl text-xs font-black focus:ring-2 ring-orange-500/20 shadow-sm transition-all tracking-tight" placeholder="Ex: google.com.br" value={state.domain} onChange={e => setState(s => ({ ...s, domain: e.target.value }))} onKeyDown={e => e.key === 'Enter' && fetchData('domain')} />
                                <button onClick={() => fetchData('domain')} className="p-3.5 bg-orange-600 text-white rounded-2xl hover:bg-orange-700 transition-all active:scale-90 shadow-lg shadow-orange-500/20"><IconSearch size={18} /></button>
                            </div>
                        </div>

                        {/* FIPE Search */}
                        <div className="group">
                            <label className="text-[9px] font-black uppercase text-gray-400 flex items-center justify-between tracking-widest mb-2 px-1 group-focus-within:text-amber-500 transition-colors">
                                <span>Tabela FIPE / Veículos</span>
                                <IconCar size={12} />
                            </label>
                            <div className="flex gap-2">
                                <input className="flex-1 bg-white border border-gray-200 outline-none px-4 py-3 rounded-2xl text-xs font-black focus:ring-2 ring-amber-500/20 shadow-sm transition-all tracking-widest" placeholder="Ex: 001294-7" value={state.fipeCode} onChange={e => setState(s => ({ ...s, fipeCode: e.target.value }))} onKeyDown={e => e.key === 'Enter' && fetchData('fipe')} />
                                <button onClick={() => fetchData('fipe')} className="p-3.5 bg-amber-600 text-white rounded-2xl hover:bg-amber-700 transition-all active:scale-90 shadow-lg shadow-amber-500/20"><IconSearch size={18} /></button>
                            </div>
                        </div>
                    </div>

                    {/* Dashboard de Taxas (Carga Global) */}
                    {rates.length > 0 && (
                        <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-xl space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400">Live Global Indices</span>
                                <IconActivity size={12} className="text-blue-500 animate-pulse" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {rates.map((r, i) => (
                                    <div key={i} className="flex flex-col group cursor-help">
                                        <span className="text-[8px] font-black uppercase text-slate-400 group-hover:text-blue-500 transition-colors">{r.nome}</span>
                                        <span className="text-xl font-black italic tracking-tighter text-slate-800">{r.valor}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Painel Central de Visualização */}
            <div className="flex-1 flex flex-col relative overflow-hidden">
                {/* Visual Artifacts */}
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none scale-[2.5] rotate-[-20deg] origin-top-right select-none">
                    <IconActivity size={400} />
                </div>

                {/* Navbar de Navegação Interna */}
                <div className="h-20 bg-white border-b border-gray-200 px-8 flex items-center justify-between z-20 shrink-0">
                    <div className="flex items-center gap-8">
                        <div className="flex flex-col">
                            <h3 className="text-xl font-black italic tracking-tighter text-slate-900 uppercase leading-none">Intelligence Terminal</h3>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1.5 flex items-center gap-2">
                                <IconRefresh size={10} className={state.loading ? 'animate-spin' : ''} /> Sync Status: Real-Time Stream Active
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="text-right">
                                <p className="text-xs font-black text-slate-900 uppercase leading-none italic">Admin Session</p>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Encryption: AES-256</p>
                            </div>
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white shadow-lg">
                                <IconUser size={22} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Área de Dados Dinâmica */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
                    <div className="max-w-5xl mx-auto space-y-10">
                        {/* Container Principal com Estilo Industrial de Software */}
                        <div className="bg-white rounded-[3.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.08)] overflow-hidden border border-white relative flex flex-col min-h-[600px]">
                            {/* Fake Terminal Header */}
                            <div className="bg-slate-900 p-3 px-8 flex items-center justify-between">
                                <div className="flex gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]"></div>
                                </div>
                                <div className="text-[8px] font-black text-slate-500 uppercase tracking-[0.5em] italic">Brasil Multi-API Streaming Interface Professional Edition</div>
                                <div className="flex gap-4">
                                    <IconDeviceTv size={14} className="text-slate-500 hover:text-white transition-colors cursor-pointer" />
                                </div>
                            </div>

                            <div className="flex-1">
                                {renderContent()}
                            </div>
                        </div>

                        {/* Footer de Widgets Expandível */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { icon: <IconActivity size={24} />, label: 'SELIC TARGET', value: '10.75%', color: 'text-blue-600', bg: 'bg-blue-50' },
                                { icon: <IconCurrencyDollar size={24} />, label: 'USD/BRL SPOT', value: 'R$ 5.92', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                { icon: <IconTruck size={24} />, label: 'CORREIOS I/O', value: 'SINC.', color: 'text-orange-600', bg: 'bg-orange-50' }
                            ].map((w, i) => (
                                <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl transition-all cursor-pointer group">
                                    <div className={`p-4 ${w.bg} ${w.color} rounded-2xl w-fit mb-5 group-hover:scale-110 transition-transform`}>{w.icon}</div>
                                    <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">{w.label}</h4>
                                    <p className="text-2xl font-black italic text-slate-900 tracking-tighter leading-none uppercase">{w.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
