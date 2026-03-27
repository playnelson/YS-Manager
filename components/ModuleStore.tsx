'use client';

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
    const [searchTerm, setSearchTerm] = useState('');
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const categories = ['Todos', 'Produtividade', 'Operacional', 'Comunicação', 'Gestão', 'Inteligência'];

    const countByCategory = (cat: string) =>
        cat === 'Todos'
            ? AVAILABLE_MODULES.length
            : AVAILABLE_MODULES.filter(m => m.category === cat).length;

    const filteredModules = AVAILABLE_MODULES.filter(m => {
        const matchesCategory = filter === 'Todos' || m.category === filter;
        const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const activeCount = AVAILABLE_MODULES.filter(m => !hiddenTabs.includes(m.id)).length;

    return (
        <div className="flex flex-col h-full bg-palette-lightest overflow-hidden font-sans selection:bg-blue-100 italic-none">
            {/* ── Discreet Hero Section ── */}
            <div className="relative bg-palette-lightest px-8 py-8 shrink-0 overflow-hidden border-b border-palette-mediumLight">
                {/* Subtle Mesh Gradient Background */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-400/5 blur-[100px] rounded-full"></div>
                </div>

                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="text-center md:text-left">
                            <h1 className="text-3xl font-black tracking-tight text-palette-darkest dark:text-white mb-1">
                                Loja de <span className="text-blue-600">Módulos</span>
                            </h1>
                            <p className="text-[#86868B] text-sm font-medium">
                                Personalize sua workspace com ferramentas sob medida.
                            </p>
                        </div>

                        {/* Integrated Stats */}
                        <div className="flex gap-2 shrink-0">
                            <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl px-5 py-3 flex flex-col items-center min-w-[80px]">
                                <span className="text-xl font-black text-palette-darkest leading-none">{activeCount}</span>
                                <span className="text-[8px] font-bold uppercase text-[#86868B] tracking-widest mt-1">Ativos</span>
                            </div>
                            <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl px-5 py-3 flex flex-col items-center min-w-[80px]">
                                <span className="text-xl font-black text-blue-600 leading-none">{AVAILABLE_MODULES.length}</span>
                                <span className="text-[8px] font-bold uppercase text-[#86868B] tracking-widest mt-1">Total</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Navigation & Search Bar (Sticky) ── */}
            <div className="sticky top-0 z-30 px-8 py-3 bg-palette-lightest/80 backdrop-blur-2xl border-b border-palette-mediumDark/50">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    {/* Categories */}
                    <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0 w-full md:w-auto">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setFilter(cat)}
                                className={`
                                    px-5 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap
                                    ${filter === cat
                                        ? 'bg-palette-darkest text-white shadow-lg'
                                        : 'bg-white/50 text-palette-darkest/70 hover:bg-white hover:text-palette-darkest border border-transparent hover:border-palette-mediumDark'}
                                `}
                            >
                                {cat}
                                <span className={`ml-2 text-[10px] font-black opacity-40`}>
                                    {countByCategory(cat)}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Search Field */}
                    <div className="relative w-full md:w-64 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#86868B] group-focus-within:text-blue-500 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar ferramenta..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white/50 backdrop-blur-md border border-gray-200 rounded-2xl text-sm outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* ── Module Grid ── */}
            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                <div className="max-w-6xl mx-auto">
                    {filteredModules.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredModules.map(module => {
                                const isActive = !hiddenTabs.includes(module.id);
                                const isHovered = hoveredId === module.id;

                                return (
                                    <div
                                        key={module.id}
                                        onMouseEnter={() => setHoveredId(module.id)}
                                        onMouseLeave={() => setHoveredId(null)}
                                        className={`
                                            group relative bg-white rounded-[2.5rem] flex flex-col overflow-hidden transition-all duration-500
                                            ${isActive
                                                ? 'shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:-translate-y-2'
                                                : 'opacity-80 grayscale-[0.2] hover:opacity-100 hover:grayscale-0 hover:shadow-xl'}
                                        `}
                                    >
                                        {/* Card Top: Gradient & Icon */}
                                        <div className={`h-36 bg-gradient-to-br ${module.accentColor} relative flex items-center justify-center`}>
                                            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            <div className="z-10 bg-white/20 backdrop-blur-md p-5 rounded-3xl text-white shadow-2xl scale-110 group-hover:scale-125 transition-transform duration-500">
                                                {module.icon}
                                            </div>

                                            {/* Status Badge */}
                                            <div className="absolute top-6 right-6">
                                                <div className={`
                                                    px-3 py-1 rounded-full text-[9px] font-black tracking-widest flex items-center gap-1.5 backdrop-blur-xl border
                                                    ${isActive
                                                        ? 'bg-green-400/20 text-green-700 border-green-400/30'
                                                        : 'bg-white/20 text-white/80 border-white/30'}
                                                `}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-white/50'}`}></div>
                                                    {isActive ? 'ATIVO' : 'INATIVO'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card Content */}
                                        <div className="p-8 flex-1 flex flex-col">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-bold uppercase text-blue-600/70 tracking-widest">{module.category}</span>
                                                {module.badge && (
                                                    <span className="text-[9px] font-black px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md border border-gray-200">
                                                        {module.badge}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-2xl font-black text-[#1D1D1F] tracking-tight mb-3 flex items-center gap-2">
                                                {module.name}
                                                {module.isEssential && (
                                                    <div title="Módulo Essencial">
                                                        <Lock size={14} className="text-[#86868B] opacity-40 shrink-0" />
                                                    </div>
                                                )}
                                            </h3>
                                            <p className="text-[#86868B] text-sm leading-relaxed mb-6 font-medium">
                                                {isHovered ? module.longDescription : module.description}
                                            </p>

                                            <div className="mt-auto">
                                                {module.isEssential ? (
                                                    <div className="w-full py-4 rounded-2xl bg-gray-50 border border-gray-100 text-[#86868B] flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest">
                                                        Módulo do Sistema
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => onToggleTab(module.id)}
                                                        className={`
                                                            w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2
                                                            ${isActive
                                                                ? 'bg-white border-2 border-red-50/50 text-red-500 hover:bg-red-50 hover:border-red-100'
                                                                : 'bg-[#1D1D1F] text-white shadow-xl shadow-gray-200 hover:bg-black'}
                                                        `}
                                                    >
                                                        {isActive
                                                            ? <><ZapOff size={16} /> Desativar Módulo</>
                                                            : <><Zap size={16} /> Ativar Módulo</>}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="p-6 bg-white rounded-full shadow-inner mb-6">
                                <Search size={48} className="text-gray-200" />
                            </div>
                            <h3 className="text-xl font-bold text-[#1D1D1F] mb-1">Nenhum módulo encontrado</h3>
                            <p className="text-[#86868B] max-w-xs">Tente ajustar seus filtros ou termos de pesquisa para encontrar o que procura.</p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
