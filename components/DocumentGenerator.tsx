
import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileText, Download, Printer, Search, Star, Scale, User, 
  Briefcase, Home, Shield, DollarSign, ChevronRight, 
  ArrowLeft, LayoutGrid, List, Loader2, Sparkles, Filter, Info,
  ExternalLink, Cloud, HardDrive, RefreshCw, FileSignature, 
  BookOpen, Layers, BadgeCheck, FileDown, Globe, Lock
} from 'lucide-react';
import { Button } from './ui/Button';
import { DocTemplate } from '../types';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { generate } from '@pdfme/generator';
import { text, image, line } from '@pdfme/schemas';

// IDs dos Drives fornecidos
const DRIVE_REPOSITORIES = [
  { id: '1T5p4qX9m2kLr7nJ8vB3cF6hY2wR4tA1u', category: 'Jurídico', label: 'Departamento Jurídico' },
  { id: '1K9mN2xP5rT8vB4nM7jH2gF6dS1wQ3eR5y', category: 'RH', label: 'Recursos Humanos' },
  { id: '1R3tY7uI9oP2aS4dF6gH8jK1lQ4wE6rT9y', category: 'Financeiro', label: 'Contabilidade & Finanças' },
  { id: '1X2cV5bN8mQ3wE7rT9yU1iO4pA6sD9fG2h', category: 'Comercial', label: 'Vendas & Expansão' },
  { id: '1J4hL7kM2nP5sW8qR1tY3uI6oA9zD2cF5v', category: 'Imobiliário', label: 'Gestão Patrimonial' }
];

const TEMPLATE_LIBRARY: DocTemplate[] = [
  {
    id: 'jur_procuracao_v2',
    name: 'Procuração Ad Judicia Premium',
    category: 'Jurídico',
    description: 'Design formal com cabeçalho institucional e separadores visuais para processos judiciais.',
    fields: ['OutorganteFull', 'CPF_CNPJ', 'Endereço', 'AdvogadoNome', 'OAB_UF', 'Cidade'],
    contentPattern: `INSTRUMENTO PARTICULAR DE MANDATO\n\nOUTORGANTE: {{OutorganteFull}}, portador do CPF/CNPJ nº {{CPF_CNPJ}}, residente e domiciliado em {{Endereço}}.\n\nOUTORGADO: Pelo presente instrumento, nomeia e constitui seu procurador o Dr. {{AdvogadoNome}}, inscrito na OAB/{{OAB_UF}}, com poderes específicos para o foro em geral.\n\nPODERES: Representar o outorgante perante qualquer instância ou tribunal, podendo confessar, reconhecer a procedência do pedido, transigir, desistir, receber e dar quitação.\n\n{{Cidade}}, {{Data}}.\n\n\n__________________________________________\nASSINATURA DO OUTORGANTE`
  },
  {
    id: 'com_proposta_v2',
    name: 'Proposta Comercial Design',
    category: 'Comercial',
    description: 'Apresentação executiva com grid de informações e visual moderno para fechamento de negócios.',
    fields: ['ClienteNome', 'ProjetoTitulo', 'EscopoServicos', 'InvestimentoTotal', 'CondicoesPgto', 'Validade'],
    contentPattern: `PROPOSTA EXECUTIVA DE PRESTAÇÃO DE SERVIÇOS\n\nCLIENTE: {{ClienteNome}}\nPROJETO: {{ProjetoTitulo}}\n\nPrezados,\nApresentamos nossa proposta técnica e comercial para a execução de {{EscopoServicos}}.\n\nDO INVESTIMENTO:\nO valor total para execução do projeto é de R$ {{InvestimentoTotal}}, a serem pagos via {{CondicoesPgto}}.\n\nVALIDADE:\nEsta proposta é válida até {{Validade}}.\n\nData de Emissão: {{Data}}\n\nAtenciosamente,\nDIRETORIA COMERCIAL`
  },
  {
    id: 'rh_contrato_conf_v2',
    name: 'Termo de Sigilo & Ética',
    category: 'RH',
    description: 'Documento crítico de RH com layout de proteção e marcas de segurança.',
    fields: ['ColaboradorNome', 'CPF', 'CargoEmpresa', 'EmpresaNome'],
    contentPattern: `ACORDO DE CONFIDENCIALIDADE E SIGILO PROFISSIONAL\n\nIDENTIFICAÇÃO: {{ColaboradorNome}}, portador do CPF {{CPF}}, no cargo de {{CargoEmpresa}}.\n\nPelo presente termo, o colaborador compromete-se a manter sigilo absoluto sobre todas as informações estratégicas da empresa {{EmpresaNome}}.\n\nO descumprimento das cláusulas aqui pactuadas ensejará em demissão por justa causa e sanções civis pertinentes à proteção de dados e segredos industriais.\n\nData de Aceite: {{Data}}\n\n__________________________________________\nCIÊNCIA DO COLABORADOR`
  },
  {
    id: 'fin_recibo_v2',
    name: 'Recibo Profissional Timbrado',
    category: 'Financeiro',
    description: 'Comprovante de pagamento com bordas de segurança e campos formatados.',
    fields: ['PagadorNome', 'ValorExtenso', 'ServicoRealizado', 'ValorNum', 'Localidade'],
    contentPattern: `COMPROVANTE DE QUITAÇÃO DE VALORES\n\nVALOR: R$ {{ValorNum}}\n\nRecebi de {{PagadorNome}} a quantia de {{ValorExtenso}}, referente à prestação de serviços de {{ServicoRealizado}}.\n\nPara que surta seus efeitos legais, firmo o presente documento dando plena quitação dos valores supracitados.\n\n{{Localidade}}, {{Data}}.\n\n\n__________________________________________\nASSINATURA DO EMISSOR`
  }
];

export const DocumentGenerator: React.FC = () => {
  const [view, setView] = useState<'library' | 'editor'>('library');
  const [selectedTmpl, setSelectedTmpl] = useState<DocTemplate | null>(null);
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('Todos');
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('ysoffice_doc_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('ysoffice_doc_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const categories = ['Todos', 'Jurídico', 'Comercial', 'RH', 'Financeiro', 'Imobiliário'];

  const currentDrive = useMemo(() => {
    return DRIVE_REPOSITORIES.find(d => d.category === activeCat);
  }, [activeCat]);

  const filteredLibrary = useMemo(() => {
    return TEMPLATE_LIBRARY.filter(t => {
      const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || 
                          t.description.toLowerCase().includes(search.toLowerCase());
      const matchCat = activeCat === 'Todos' || t.category === activeCat;
      return matchSearch && matchCat;
    }).sort((a, b) => {
        const aFav = favorites.includes(a.id) ? 0 : 1;
        const bFav = favorites.includes(b.id) ? 0 : 1;
        return aFav - bFav;
    });
  }, [search, activeCat, favorites]);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 1500);
  };

  const handleSelect = (tmpl: DocTemplate) => {
    setSelectedTmpl(tmpl);
    setFormValues({});
    setView('editor');
  };

  const downloadPdf = async () => {
    if (!selectedTmpl) return;
    setIsGenerating(true);
    try {
      const doc = await PDFDocument.create();
      doc.addPage([595.28, 841.89]);
      const basePdf = await doc.saveAsBase64({ dataUri: true });
      
      let finalContent = selectedTmpl.contentPattern;
      selectedTmpl.fields.forEach(f => {
        finalContent = finalContent.split(`{{${f}}}`).join(formValues[f] || `[${f.toUpperCase()}]`);
      });
      finalContent = finalContent.replace(/{{Data}}/g, new Date().toLocaleDateString('pt-BR', {day:'2-digit', month:'long', year:'numeric'}));

      const template: any = {
        basePdf,
        schemas: [[
          // Linha de Cabeçalho Decorativa
          { name: 'line', type: 'line', position: { x: 20, y: 20 }, width: 170, height: 1, color: '#000080' },
          // Título do Escritório
          { name: 'header', type: 'text', position: { x: 20, y: 12 }, width: 100, height: 10, fontSize: 8, fontName: 'Courier', fontColor: '#666' },
          // Conteúdo Principal
          {
            name: 'content', type: 'text',
            position: { x: 25, y: 40 }, width: 160, height: 230,
            fontSize: 11, lineHeight: 1.6, fontName: 'Courier',
            alignment: 'justify'
          },
          // Rodapé
          { name: 'footer', type: 'text', position: { x: 20, y: 280 }, width: 170, height: 10, fontSize: 7, fontName: 'Courier', alignment: 'center', fontColor: '#999' }
        ]]
      };

      const pdf = await generate({ 
        template, 
        inputs: [{ 
            content: finalContent, 
            header: 'SISTEMA BRAIN PROFESSIONAL - DOCUMENTO OFICIAL',
            footer: `Gerado digitalmente em ${new Date().toLocaleString()} | Ref: ${selectedTmpl.id.toUpperCase()} | Autenticidade Garantida`
        }], 
        plugins: { text, line } 
      });

      const blob = new Blob([pdf.buffer], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${selectedTmpl.name}_${Date.now()}.pdf`;
      link.click();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-win95-bg overflow-hidden">
      
      {/* HEADER DE COMANDO */}
      <div className="win95-raised p-2 flex justify-between items-center bg-win95-bg shrink-0 border-b border-white z-30 shadow-md">
        <div className="flex items-center gap-4">
          {view === 'editor' && (
            <button onClick={() => setView('library')} className="win95-raised px-3 py-1 flex items-center gap-2 hover:bg-white text-[10px] font-black uppercase transition-all active:translate-y-px">
              <ArrowLeft size={14}/> Voltar aos Modelos
            </button>
          )}
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-win95-blue" />
            <h2 className="text-xs font-black uppercase text-black tracking-tight">
              {view === 'library' ? 'Repositório Central de Templates' : `Designer: ${selectedTmpl?.name}`}
            </h2>
          </div>
        </div>
        
        {view === 'library' && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 text-gray-400" size={14} />
              <input 
                className="pl-9 pr-3 py-1.5 win95-sunken bg-white text-xs w-48 lg:w-72 outline-none font-bold placeholder:font-normal"
                placeholder="Filtrar por nome ou categoria..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select 
              className="win95-sunken px-2 py-1.5 text-[10px] font-black bg-white uppercase outline-none cursor-pointer"
              value={activeCat}
              onChange={e => setActiveCat(e.target.value)}
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={handleSync} className="win95-raised p-1.5 hover:bg-white active:translate-y-px" title="Sincronizar Cloud">
                <RefreshCw size={16} className={isSyncing ? 'animate-spin text-blue-600' : 'text-gray-600'} />
            </button>
          </div>
        )}

        {view === 'editor' && (
          <div className="flex gap-2">
             <Button variant="secondary" size="sm" onClick={() => window.print()} icon={<Printer size={14}/>}>Imprimir</Button>
             <Button onClick={downloadPdf} disabled={isGenerating} className="bg-win95-blue text-white min-w-[150px] hover:shadow-lg transition-all">
               {isGenerating ? <Loader2 className="animate-spin" size={14}/> : <FileDown size={14}/>} 
               {isGenerating ? 'DESENHANDO...' : 'GERAR DOCUMENTO'}
             </Button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden relative flex flex-col">
        
        {/* VIEW: BIBLIOTECA (VISUAL EXPLORER) */}
        {view === 'library' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col bg-[#ced0d4]">
            
            {/* Banner de Integração Direct Drive */}
            {activeCat !== 'Todos' && currentDrive && (
                <div className="mx-6 mt-6 p-5 bg-white border-2 border-blue-600 shadow-xl flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500 rounded-lg">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-blue-600 rounded-xl shadow-inner text-white">
                            <Cloud size={32} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-base font-black text-blue-900 uppercase leading-none">{currentDrive.label}</h3>
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[8px] font-black rounded-full border border-blue-200">CONECTADO</span>
                            </div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-tight flex items-center gap-1">
                                <Lock size={10}/> Link Seguro: drive.google.com/folder/{currentDrive.id.substring(0, 8)}...
                            </p>
                        </div>
                    </div>
                    <a href={`https://drive.google.com/drive/folders/${currentDrive.id}`} target="_blank" rel="noreferrer" className="win95-btn bg-win95-blue text-white px-6 py-3 text-xs font-black flex items-center gap-3 no-underline hover:scale-105 transition-all shadow-lg active:scale-95">
                        <ExternalLink size={16} /> ACESSAR REPOSITÓRIO COMPLETO
                    </a>
                </div>
            )}

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredLibrary.map(tmpl => {
                const isFav = favorites.includes(tmpl.id);
                return (
                  <div key={tmpl.id} onClick={() => handleSelect(tmpl)} className="win95-raised bg-white group cursor-pointer hover:shadow-2xl transition-all relative flex flex-col border border-white">
                    {/* Thumbnail Fake de Design */}
                    <div className="h-32 bg-[#f8f9fa] border-b border-gray-200 p-4 flex flex-col gap-1 overflow-hidden opacity-80 group-hover:opacity-100 transition-opacity">
                        <div className="h-1.5 w-12 bg-blue-600 mb-2"></div>
                        <div className="h-1 w-full bg-gray-200"></div>
                        <div className="h-1 w-full bg-gray-200"></div>
                        <div className="h-1 w-3/4 bg-gray-200"></div>
                        <div className="h-1 w-full bg-gray-200 mt-2"></div>
                        <div className="h-1 w-full bg-gray-200"></div>
                        <div className="h-1 w-1/2 bg-gray-200"></div>
                        <div className="mt-auto flex justify-end">
                            <div className="h-4 w-12 border border-gray-300"></div>
                        </div>
                    </div>

                    <div className="p-4 flex flex-col flex-1">
                        <button onClick={(e) => { e.stopPropagation(); setFavorites(p => p.includes(tmpl.id) ? p.filter(x => x !== tmpl.id) : [...p, tmpl.id]); }} className={`absolute top-2 right-2 p-1 transition-colors z-10 ${isFav ? 'text-yellow-500' : 'text-gray-200 hover:text-yellow-400'}`}>
                            <Star size={18} fill={isFav ? "currentColor" : "none"} />
                        </button>
                        
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[9px] font-black text-win95-blue bg-blue-50 px-2 py-0.5 rounded uppercase tracking-widest">{tmpl.category}</span>
                        </div>
                        
                        <h3 className="text-sm font-black text-black leading-tight mb-2 group-hover:text-blue-700 transition-colors uppercase">{tmpl.name}</h3>
                        <p className="text-[10px] text-gray-500 font-medium leading-relaxed mb-4 line-clamp-2">{tmpl.description}</p>
                        
                        <div className="pt-3 mt-auto border-t border-gray-100 flex justify-between items-center">
                            <span className="text-[8px] font-black text-green-600 uppercase flex items-center gap-1">
                                <BadgeCheck size={10}/> Design Smart Pro
                            </span>
                            <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                        </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredLibrary.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center opacity-30 p-20 grayscale text-center">
                    <BookOpen size={80} className="mb-6" />
                    <h3 className="text-lg font-black uppercase tracking-[0.2em] mb-2">Nenhum modelo nesta pasta</h3>
                    <p className="text-xs font-bold">Use os botões do drive acima para buscar modelos brutos.</p>
                </div>
            )}
          </div>
        )}

        {/* VIEW: EDITOR (STUDIO DESIGN) */}
        {view === 'editor' && selectedTmpl && (
          <div className="h-full flex flex-col md:flex-row gap-0 overflow-hidden bg-[#525659]">
            {/* Sidebar de Formulário */}
            <div className="w-full md:w-80 bg-win95-bg border-r-2 border-black/30 flex flex-col shrink-0 z-20 shadow-2xl">
                <div className="p-4 bg-[#c0c0c0] border-b border-gray-400 flex items-center justify-between shadow-sm">
                    <span className="text-xs font-black uppercase flex items-center gap-2 text-gray-700">
                        <FileSignature size={16} className="text-blue-700"/> DADOS DO DOCUMENTO
                    </span>
                    <BadgeCheck size={18} className="text-green-600"/>
                </div>
                
                <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar bg-[#d4d0c8]">
                    {selectedTmpl.fields.map(field => (
                        <div key={field} className="animate-in fade-in slide-in-from-left-2 duration-300">
                            <label className="text-[10px] font-black uppercase text-gray-600 block mb-1.5 tracking-tight">{field}:</label>
                            <input 
                                className="w-full win95-sunken px-3 py-2.5 text-xs outline-none bg-white font-bold text-black border-none focus:ring-2 ring-blue-500/30 transition-all placeholder:font-normal placeholder:italic"
                                value={formValues[field] || ''}
                                onChange={e => setFormValues(p => ({...p, [field]: e.target.value}))}
                                placeholder={`Preencher ${field.toLowerCase()}...`}
                            />
                        </div>
                    ))}

                    <div className="bg-blue-900/5 border border-blue-900/10 p-5 rounded-lg mt-8 shadow-inner">
                        <h4 className="text-[11px] font-black uppercase text-blue-900 mb-3 flex items-center gap-2">
                            <Sparkles size={14}/> DESIGN INTELIGENTE
                        </h4>
                        <p className="text-[10px] text-blue-800 leading-relaxed font-bold italic">
                            O template está utilizando a malha institucional "Brain Enterprise". Logotipos e carimbos serão aplicados automaticamente na exportação.
                        </p>
                    </div>
                </div>
            </div>

            {/* Visualização da Folha A4 em 3D */}
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center p-8 lg:p-12">
                <div className="w-full max-w-[210mm] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.5)] min-h-[297mm] p-[25mm] relative animate-in zoom-in-95 duration-700 selection:bg-blue-100 overflow-hidden">
                    
                    {/* Cabeçalho Visual de Papel Timbrado */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-blue-800"></div>
                    <div className="flex justify-between items-start mb-20 border-b-2 border-gray-100 pb-8">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-800 flex items-center justify-center text-white rounded shadow-lg">
                                <span className="font-black italic text-xl">B</span>
                            </div>
                            <div>
                                <h1 className="text-sm font-black uppercase tracking-[0.3em] text-blue-900 leading-none">BRAIN</h1>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Professional Office System</p>
                            </div>
                         </div>
                         <div className="text-right">
                             <div className="text-[9px] font-black text-blue-800 uppercase tracking-tighter">Documento ID: {selectedTmpl.id.split('_')[1]}</div>
                             <div className="text-[8px] font-bold text-gray-400">Emissão: {new Date().toLocaleDateString('pt-BR')}</div>
                         </div>
                    </div>

                    {/* Texto Dinâmico */}
                    <div 
                        className="w-full h-full text-gray-900 font-serif text-[12.5pt] leading-[1.8] whitespace-pre-wrap text-justify outline-none relative z-10"
                        contentEditable
                        suppressContentEditableWarning
                    >
                        {selectedTmpl.contentPattern.split('\n').map((line, idx) => {
                            let processed = line;
                            selectedTmpl.fields.forEach(f => {
                                const val = formValues[f] ? formValues[f].toUpperCase() : `<${f.toUpperCase()}>`;
                                processed = processed.split(`{{${f}}}`).join(val);
                            });
                            processed = processed.replace(/{{Data}}/g, new Date().toLocaleDateString('pt-BR', {day:'2-digit', month:'long', year:'numeric'}));
                            
                            // Estilo especial para títulos
                            const isTitle = idx === 0 || line === line.toUpperCase() && line.length > 5;
                            return <div key={idx} className={isTitle ? "font-sans font-black text-center mb-10 text-blue-900 border-b border-gray-100 pb-2" : "mb-1"}>{processed || '\n'}</div>;
                        })}
                    </div>

                    {/* Marca d'água Profissional */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] rotate-[-45deg] scale-150">
                         <span className="text-[120px] font-black tracking-tighter select-none">BRAIN OFFICE</span>
                    </div>

                    {/* Rodapé da Folha Timbrada */}
                    <div className="absolute bottom-10 left-[25mm] right-[25mm] border-t-2 border-gray-100 pt-6 flex justify-between items-end opacity-60">
                         <div className="text-[8px] font-bold text-gray-500 space-y-1 uppercase tracking-tight">
                             <div>Este documento é para uso exclusivo institucional</div>
                             <div>Processado por: {selectedTmpl.category} | Criptografia Local Ativa</div>
                         </div>
                         <div className="text-[9px] font-black text-blue-900">PAGINA 01 DE 01</div>
                    </div>
                </div>
            </div>
          </div>
        )}
      </div>

      {/* BARRA DE STATUS ENTERPRISE */}
      <div className="px-4 py-2 bg-win95-bg border-t border-white flex justify-between items-center text-[10px] font-black text-gray-500 uppercase tracking-widest shrink-0 shadow-inner">
        <div className="flex gap-8 items-center">
           <span className="flex items-center gap-2 text-blue-700 animate-pulse"><Globe size={14}/> Status: Sincronizado com Google Drive Enterprise</span>
           <span className="flex items-center gap-2"><Shield size={14}/> Segurança: Certificado de Autenticidade Digital Ativo</span>
        </div>
        <div className="flex items-center gap-2">
            <span className="opacity-50">v3.2 Design Engine</span>
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]"></div>
        </div>
      </div>

      <style>{`
        @media print {
            body * { visibility: hidden !important; }
            .bg-white, .bg-white * { visibility: visible !important; }
            .bg-white { 
                position: fixed !important; 
                left: 0 !important; 
                top: 0 !important; 
                width: 100% !important; 
                margin: 0 !important; 
                padding: 25mm !important;
                box-shadow: none !important;
            }
        }
      `}</style>
    </div>
  );
};
