
import React, { useState } from 'react';
import {
    ShoppingBag,
    Briefcase,
    Calendar as CalendarIcon,
    GitMerge,
    Truck,
    Search,
    MessageSquare,
    Cloud,
    Wallet,
    Package,
    Info,
    Layers,
    ShieldCheck,
    Globe,
    Sparkles,
    ZapOff,
    Zap,
    Lock,
    CheckCircle,
    Stars
} from 'lucide-react';

interface Module {
    id: string;
    name: string;
    description: string;
    longDescription: string;
    icon: React.ReactNode;
    accentColor: string;
    category: 'Produtividade' | 'Operacional' | 'Comunicação' | 'Gestão' | 'Inteligência';
    isEssential?: boolean;
    badge?: string;
}

const AVAILABLE_MODULES: Module[] = [
    {
        id: 'office',
        name: 'Escritório',
        description: 'Central de ferramentas para produtividade diária.',
        longDescription: 'Post-its, templates de email, links profissionais, assinaturas e passagem de turno em um só lugar.',
        icon: <Briefcase size={28} />,
        accentColor: 'from-blue-400 to-blue-600',
        category: 'Produtividade',
        isEssential: true,
        badge: 'ESSENCIAL'
    },
    {
        id: 'calendar',
        name: 'Calendário',
        description: 'Gestão completa de eventos e escalas.',
        longDescription: 'Integra feriados nacionais via BrasilAPI, permite criar eventos personalizados e configurar escalas de trabalho.',
        icon: <CalendarIcon size={28} />,
        accentColor: 'from-red-400 to-rose-600',
        category: 'Produtividade'
    },
    {
        id: 'flow',
        name: 'Fluxograma',
        description: 'Crie e visualize fluxos de processos.',
        longDescription: 'Editor de fluxo drag-and-drop com nodes configuráveis, conexões e templates de automação pré-prontos.',
        icon: <GitMerge size={28} />,
        accentColor: 'from-purple-400 to-indigo-600',
        category: 'Produtividade'
    },
    {
        id: 'logistics',
        name: 'Logística',
        description: 'Cálculo de fretes e gestão de rotas.',
        longDescription: 'Tabelas de frete configuráveis, checklists de veículos e controle inteligente de expedição.',
        icon: <Truck size={28} />,
        accentColor: 'from-orange-400 to-amber-600',
        category: 'Operacional'
    },
    {
        id: 'consultas',
        name: 'Consultas Brasil',
        description: 'Busca rápida de CNPJ, CEP e muito mais.',
        longDescription: 'Integração com BrasilAPI: busca de CNPJ, CEP, DDD, e informações oficiais confiáveis em segundos.',
        icon: <Search size={28} />,
        accentColor: 'from-emerald-400 to-teal-600',
        category: 'Inteligência'
    },
    {
        id: 'whatsapp',
        name: 'WhatsApp',
        description: 'Integrador de mensagens e atalhos.',
        longDescription: 'Gere links de mensagem para clientes, gerencie templates e acesse contatos rápidos direto do sistema.',
        icon: <MessageSquare size={28} />,
        accentColor: 'from-green-400 to-emerald-600',
        category: 'Comunicação'
    },
    {
        id: 'shared_docs',
        name: 'Documentos',
        description: 'Gerenciador de docs e integração cloud.',
        longDescription: 'Geração profissional de documentos com preenchimento automático via BrasilAPI, templates e export PDF.',
        icon: <Cloud size={28} />,
        accentColor: 'from-sky-400 to-blue-600',
        category: 'Produtividade'
    },
    {
        id: 'financial',
        name: 'Financeiro',
        description: 'Controle de fluxo de caixa e relatórios.',
        longDescription: 'Dashboard de receitas e despesas com filtros por período, gráficos e exportação de dados.',
        icon: <Wallet size={28} />,
        accentColor: 'from-yellow-400 to-amber-600',
        category: 'Gestão',
        badge: 'BETA'
    },
    {
        id: 'warehouse',
        name: 'Almoxarifado',
        description: 'Controle de estoque e rastreio de materiais.',
        longDescription: 'Gestão rigorosa de entradas e saídas de materiais com histórico detalhado e alertas de estoque mínimo.',
        icon: <Package size={28} />,
        accentColor: 'from-brown-400 to-amber-800',
        category: 'Operacional',
        badge: 'BETA'
    },
    {
        id: 'brasil-hub',
        name: 'Brasil Intelligence Hub',
        description: 'Dados governamentais em tempo real.',
        longDescription: 'Hub completo de APIs brasileiras: CEP, CNPJ/QSA, Registro de Domínios, FIPE, taxas SELIC, feriados, DDD e muito mais.',
        icon: <Globe size={28} />,
        accentColor: 'from-green-600 to-teal-700',
        category: 'Inteligência',
        badge: 'NOVO'
    },
];

interface ModuleStoreProps {
    hiddenTabs: string[];
    onToggleTab: (tabId: string) => void;
}

export const ModuleStore: React.FC<ModuleStoreProps> = ({ hiddenTabs, onToggleTab }) => {
    const [filter, setFilter] = useState<string>('Todos');
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const categories = ['Todos', 'Produtividade', 'Operacional', 'Comunicação', 'Gestão', 'Inteligência'];

    const countByCategory = (cat: string) =>
        cat === 'Todos'
            ? AVAILABLE_MODULES.length
            : AVAILABLE_MODULES.filter(m => m.category === cat).length;

    const filteredModules = AVAILABLE_MODULES.filter(m =>
        filter === 'Todos' || m.category === filter
    );

    const activeCount = AVAILABLE_MODULES.filter(m => !hiddenTabs.includes(m.id)).length;

    return (
        <div className="flex flex-col min-h-screen bg-[#f0f2f5] overflow-hidden font-sans">
            {/* ── Hero Banner ── */}
            <div className="relative bg-slate-900 text-white overflow-hidden px-8 py-14 shrink-0">
                {/* Abstract Background */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-0 w-72 h-72 bg-blue-600/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>
                    <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-teal-500/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
                </div>

                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6] animate-pulse"></div>
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400">YS Manager — Module Marketplace</span>
                            </div>
                            <h1 className="text-5xl font-black italic tracking-tighter text-white leading-none mb-3">
                                LOJA DE<br />MÓDULOS
                            </h1>
                            <p className="text-slate-400 font-medium text-sm max-w-md leading-relaxed">
                                Personalize sua plataforma. Ative apenas o que você precisa e mantenha o ambiente limpo e eficiente.
                            </p>
                        </div>

                        {/* Stats Panel */}
                        <div className="flex gap-4 shrink-0">
                            <div className="bg-white/5 border border-white/10 rounded-3xl px-8 py-6 text-center backdrop-blur-sm">
                                <p className="text-4xl font-black italic text-white leading-none">{activeCount}</p>
                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mt-2">Módulos Ativos</p>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-3xl px-8 py-6 text-center backdrop-blur-sm">
                                <p className="text-4xl font-black italic text-blue-400 leading-none">{AVAILABLE_MODULES.length}</p>
                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mt-2">Total Disponíveis</p>
                            </div>
                        </div>
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-6 mt-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <span className="flex items-center gap-2"><ShieldCheck size={14} className="text-green-400" /> Todos verificados</span>
                        <span className="flex items-center gap-2"><Layers size={14} className="text-blue-400" /> 100% Modular</span>
                        <span className="flex items-center gap-2"><Sparkles size={14} className="text-amber-400" /> Pronto para uso</span>
                    </div>
                </div>
            </div>

            {/* ── Category Filter Bar ── */}
            <div className="bg-white border-b border-gray-200 sticky top-[88px] z-20 shadow-sm">
                <div className="max-w-6xl mx-auto px-6 py-3 flex gap-2 overflow-x-auto no-scrollbar">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`
                                flex items-center gap-2 px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap border
                                ${filter === cat
                                    ? 'bg-slate-900 text-white border-transparent shadow-xl scale-105'
                                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100 hover:text-gray-800'}
                            `}
                        >
                            {cat}
                            <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black ${filter === cat ? 'bg-white/20' : 'bg-gray-200'}`}>
                                {countByCategory(cat)}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Module Grid ── */}
            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredModules.map(module => {
                        const isActive = !hiddenTabs.includes(module.id);
                        const isHovered = hoveredId === module.id;

                        return (
                            <div
                                key={module.id}
                                onMouseEnter={() => setHoveredId(module.id)}
                                onMouseLeave={() => setHoveredId(null)}
                                className={`
                                    bg-white rounded-[2rem] flex flex-col overflow-hidden border transition-all duration-300 shadow-sm
                                    ${isActive
                                        ? 'border-blue-100 shadow-blue-500/5 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1'
                                        : 'border-gray-100 opacity-70 grayscale-[0.6] hover:opacity-90 hover:grayscale-0'}
                                `}
                            >
                                {/* Card Header with gradient */}
                                <div className={`bg-gradient-to-br ${module.accentColor} p-6 relative overflow-hidden`}>
                                    <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none scale-150 rotate-[-15deg] origin-top-right">
                                        {module.icon}
                                    </div>
                                    <div className="flex items-start justify-between relative z-10">
                                        <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl text-white shadow-inner">
                                            {module.icon}
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            {module.badge && (
                                                <span className="text-[8px] font-black px-2 py-0.5 bg-white/20 text-white rounded-full uppercase tracking-widest border border-white/30">
                                                    {module.badge}
                                                </span>
                                            )}
                                            <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wide ${isActive ? 'bg-white text-green-600 shadow-sm' : 'bg-black/20 text-white/70'}`}>
                                                {isActive ? '● ATIVO' : '○ INATIVO'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="mb-1">
                                        <span className="text-[8px] font-black uppercase text-gray-400 tracking-[0.25em]">{module.category}</span>
                                    </div>
                                    <h3 className="text-lg font-black text-gray-900 italic uppercase tracking-tight mb-2 flex items-center gap-2">
                                        {module.name}
                                        {module.isEssential && <Lock size={12} className="text-blue-400 shrink-0" />}
                                    </h3>
                                    <p className="text-xs text-gray-500 leading-relaxed mb-2">{module.description}</p>
                                    {isHovered && (
                                        <p className="text-[10px] text-gray-400 leading-relaxed italic animate-in fade-in duration-200">
                                            {module.longDescription}
                                        </p>
                                    )}
                                </div>

                                {/* Card Footer */}
                                <div className="px-6 pb-6">
                                    {module.isEssential ? (
                                        <div className="w-full py-3 rounded-2xl bg-blue-50 border border-blue-100 text-center flex items-center justify-center gap-2 text-xs font-black text-blue-600 uppercase tracking-wide">
                                            <CheckCircle size={14} /> Módulo Essencial
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => onToggleTab(module.id)}
                                            className={`
                                                w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm
                                                ${isActive
                                                    ? 'bg-white border-2 border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200'
                                                    : 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30'}
                                            `}
                                        >
                                            {isActive
                                                ? <><ZapOff size={14} /> Desativar Módulo</>
                                                : <><Zap size={14} /> Ativar Módulo</>}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer Banner */}
                <div className="max-w-6xl mx-auto mt-12 bg-gradient-to-r from-slate-900 to-blue-900 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-white/10 rounded-2xl">
                            <Stars size={28} className="text-amber-400" />
                        </div>
                        <div>
                            <h4 className="text-lg font-black italic uppercase tracking-tight mb-1">Mais módulos em breve</h4>
                            <p className="text-slate-400 text-xs">A plataforma YS Manager cresce continuamente com novos módulos de inteligência.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 px-6 py-3 bg-white/10 rounded-2xl border border-white/10 text-xs font-black uppercase tracking-widest text-white/80">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                        Sistema Online
                    </div>
                </div>
            </div>
        </div>
    );
};
