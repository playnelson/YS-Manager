
import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileText, Download, Printer, Search, Star, Scale, User, 
  Briefcase, Home, Shield, DollarSign, ChevronRight, 
  ArrowLeft, LayoutGrid, List, Loader2, Sparkles, Filter, Info
} from 'lucide-react';
import { Button } from './ui/Button';
import { DocTemplate } from '../types';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { generate } from '@pdfme/generator';
import { text } from '@pdfme/schemas';

// --- BIBLIOTECA ROBUSTA DE TEMPLATES (CONTEÚDO REAL) ---
const TEMPLATE_LIBRARY: DocTemplate[] = [
  // JURÍDICO
  {
    id: 'jur_procuracao',
    name: 'Procuração Ad Judicia',
    category: 'Jurídico',
    description: 'Padrão para representação por advogados em juízo.',
    fields: ['Outorgante', 'Nacionalidade', 'Estado Civil', 'CPF', 'Endereço', 'Advogado', 'OAB', 'Cidade'],
    contentPattern: `PROCURAÇÃO AD JUDICIA ET EXTRA\n\nOUTORGANTE: {{Outorgante}}, {{Nacionalidade}}, {{Estado Civil}}, portador do CPF nº {{CPF}}, residente em {{Endereço}}.\n\nOUTORGADO: Dr. {{Advogado}}, inscrito na OAB/{{Cidade}} sob nº {{OAB}}.\n\nPODERES: Por este instrumento particular de procuração, o outorgante nomeia e constitui o outorgado seu bastante procurador para o foro em geral, em qualquer instância ou tribunal, outorgando-lhe os poderes da cláusula ad judicia et extra, para propor as ações que se fizerem necessárias e defender os seus interesses.\n\n{{Cidade}}, {{Data}}.\n\n__________________________\n{{Outorgante}}`
  },
  {
    id: 'jur_nda',
    name: 'Termo de Confidencialidade (NDA)',
    category: 'Jurídico',
    description: 'Para proteção de informações sigilosas em reuniões ou projetos.',
    fields: ['Parte Reveladora', 'Parte Receptora', 'Objeto do Sigilo', 'Prazo (Anos)', 'Cidade'],
    contentPattern: `TERMO DE CONFIDENCIALIDADE E SIGILO\n\nPARTE REVELADORA: {{Parte Reveladora}}\nPARTE RECEPTORA: {{Parte Receptora}}\n\nOBJETO: As partes desejam trocar informações relativas a {{Objeto do Sigilo}}, que serão tratadas como confidenciais.\n\nOBRIGAÇÕES: A Parte Receptora compromete-se a não divulgar, sob qualquer pretexto, as informações reveladas por um período de {{Prazo (Anos)}} anos.\n\n{{Cidade}}, {{Data}}.\n\n__________________________\nAssinatura do Responsável`
  },
  // IMOBILIÁRIO
  {
    id: 'imo_aluguel',
    name: 'Contrato de Locação Residencial',
    category: 'Imobiliário',
    description: 'Modelo completo para aluguel de imóveis particulares.',
    fields: ['Locador', 'Locatário', 'Endereço do Imóvel', 'Valor Aluguel', 'Prazo (Meses)', 'Garantia', 'Cidade'],
    contentPattern: `CONTRATO DE LOCAÇÃO DE IMÓVEL RESIDENCIAL\n\nLOCADOR: {{Locador}}\nLOCATÁRIO: {{Locatário}}\n\nOBJETO: Locação do imóvel situado em: {{Endereço do Imóvel}}.\n\nPRAZO: O prazo é de {{Prazo (Meses)}} meses.\n\nVALOR: O valor mensal é de R$ {{Valor Aluguel}}, pago até o dia 05 de cada mês.\n\nGARANTIA: Fica estabelecido o uso de {{Garantia}} como garantia contratual.\n\n{{Cidade}}, {{Data}}.\n\n__________________________\n{{Locador}}\n\n__________________________\n{{Locatário}}`
  },
  // RH
  {
    id: 'rh_demissao',
    name: 'Carta de Pedido de Demissão',
    category: 'RH',
    description: 'Solicitação formal de desligamento voluntário.',
    fields: ['Nome Colaborador', 'Empresa', 'Cargo', 'Cidade'],
    contentPattern: `À {{Empresa}}\nPrezados,\n\nVenho por meio desta apresentar meu pedido de demissão do cargo de {{Cargo}} que ocupo nesta empresa.\n\nSolicito a dispensa do cumprimento do aviso prévio, caso seja possível.\n\nAgradeço pelas oportunidades de crescimento oferecidas durante meu tempo de serviço.\n\nAtenciosamente,\n\n{{Cidade}}, {{Data}}.\n\n__________________________\n{{Nome Colaborador}}`
  },
  {
    id: 'rh_advertencia',
    name: 'Aviso de Advertência',
    category: 'RH',
    description: 'Documento disciplinar para registro de faltas ou conduta.',
    fields: ['Empregado', 'Motivo da Falta', 'Data do Fato', 'Gestor', 'Cidade'],
    contentPattern: `ADVERTÊNCIA DISCIPLINAR\n\nAo Sr(a). {{Empregado}}\n\nFica o(a) senhor(a) advertido(a) formalmente nesta data em razão de: {{Motivo da Falta}}, ocorrido no dia {{Data do Fato}}.\n\nInformamos que a reincidência poderá acarretar medidas mais severas conforme a CLT.\n\n{{Cidade}}, {{Data}}.\n\n__________________________\n{{Gestor}}\n\n__________________________\nCiente do Empregado`
  },
  // FINANCEIRO
  {
    id: 'fin_recibo',
    name: 'Recibo de Pagamento Geral',
    category: 'Financeiro',
    description: 'Comprovante simples de recebimento de valores.',
    fields: ['Valor', 'Pagador', 'Referente a', 'Recebedor', 'Cidade'],
    contentPattern: `RECIBO DE PAGAMENTO\n\nVALOR: R$ {{Valor}}\n\nRecebi de {{Pagador}} a importância supra de R$ {{Valor}}, referente a {{Referente a}}.\n\nPara clareza, firmo o presente recibo.\n\n{{Cidade}}, {{Data}}.\n\n__________________________\n{{Recebedor}}`
  }
];

export const DocumentGenerator: React.FC = () => {
  const [view, setView] = useState<'library' | 'editor'>('library');
  const [selectedTmpl, setSelectedTmpl] = useState<DocTemplate | null>(null);
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('Todos');
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Favoritos persistidos
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('ysoffice_doc_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('ysoffice_doc_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const categories = ['Todos', 'Jurídico', 'RH', 'Financeiro', 'Imobiliário', 'Comercial', 'Pessoal'];

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

  const handleSelect = (tmpl: DocTemplate) => {
    setSelectedTmpl(tmpl);
    setFormValues({});
    setView('editor');
  };

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const generatedContent = useMemo(() => {
    if (!selectedTmpl) return '';
    let content = selectedTmpl.contentPattern;
    selectedTmpl.fields.forEach(f => {
      const val = formValues[f] || `[${f.toUpperCase()}]`;
      content = content.split(`{{${f}}}`).join(val);
    });
    return content.replace(/{{Data}}/g, new Date().toLocaleDateString('pt-BR'));
  }, [selectedTmpl, formValues]);

  const downloadPdf = async () => {
    if (!selectedTmpl) return;
    setIsGenerating(true);
    try {
      const doc = await PDFDocument.create();
      doc.addPage([595.28, 841.89]);
      const basePdf = await doc.saveAsBase64({ dataUri: true });

      const template: any = {
        basePdf,
        schemas: [[{
          name: 'content',
          type: 'text',
          position: { x: 25, y: 25 },
          width: 160,
          height: 250,
          fontSize: 11,
          lineHeight: 1.5,
          fontName: 'Courier'
        }]]
      };

      const pdf = await generate({ 
        template, 
        inputs: [{ content: generatedContent }],
        plugins: { text }
      });

      const blob = new Blob([pdf.buffer], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Documento_${selectedTmpl.name.replace(/\s/g, '_')}.pdf`;
      link.click();
    } catch (e) {
      alert("Erro ao gerar PDF.");
    } finally {
      setIsGenerating(false);
    }
  };

  const CategoryIcon = ({ cat }: { cat: string }) => {
    switch(cat) {
      case 'Jurídico': return <Scale size={16} className="text-blue-600"/>;
      case 'RH': return <User size={16} className="text-orange-600"/>;
      case 'Financeiro': return <DollarSign size={16} className="text-green-600"/>;
      case 'Imobiliário': return <Home size={16} className="text-purple-600"/>;
      case 'Comercial': return <Briefcase size={16} className="text-red-600"/>;
      default: return <FileText size={16} className="text-gray-600"/>;
    }
  };

  return (
    <div className="h-full flex flex-col bg-win95-bg overflow-hidden">
      
      {/* HEADER / TOOLBAR */}
      <div className="win95-raised p-2 flex justify-between items-center bg-win95-bg shrink-0 border-b border-white z-20">
        <div className="flex items-center gap-4">
          {view === 'editor' && (
            <button onClick={() => setView('library')} className="win95-raised px-2 py-1 flex items-center gap-1 hover:bg-white text-xs font-bold">
              <ArrowLeft size={14}/> VOLTAR
            </button>
          )}
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-win95-blue" />
            <h2 className="text-sm font-black uppercase text-black tracking-tight">
              {view === 'library' ? 'Biblioteca de Documentos Prontos' : `Editando: ${selectedTmpl?.name}`}
            </h2>
          </div>
        </div>
        
        {view === 'library' && (
          <div className="flex items-center gap-2 flex-1 max-w-md ml-8">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2 text-gray-400" size={14} />
              <input 
                className="w-full pl-8 pr-2 py-1.5 win95-sunken bg-white text-xs outline-none"
                placeholder="Pesquisar modelos (ex: aluguel, demissão...)"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select 
              className="win95-sunken px-2 py-1.5 text-xs font-bold outline-none bg-white h-full"
              value={activeCat}
              onChange={e => setActiveCat(e.target.value)}
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}

        {view === 'editor' && (
          <div className="flex gap-2">
             <Button size="sm" onClick={() => window.print()} icon={<Printer size={14}/>}>IMPRIMIR</Button>
             <Button 
                onClick={downloadPdf} 
                disabled={isGenerating} 
                className="bg-win95-blue text-white" 
                icon={isGenerating ? <Loader2 className="animate-spin" size={14}/> : <Download size={14}/>}
             >
                {isGenerating ? 'PROCESSANDO...' : 'BAIXAR PDF'}
             </Button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden relative">
        
        {/* VIEW: BIBLIOTECA (GRID) */}
        {view === 'library' && (
          <div className="h-full overflow-y-auto p-4 custom-scrollbar">
            {filteredLibrary.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-40 text-[#808080]">
                    <Search size={64} strokeWidth={1} />
                    <p className="mt-4 font-black uppercase tracking-widest text-xs">Nenhum template encontrado</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-8">
                    {filteredLibrary.map(tmpl => {
                        const isFav = favorites.includes(tmpl.id);
                        return (
                            <div 
                                key={tmpl.id}
                                onClick={() => handleSelect(tmpl)}
                                className="win95-raised bg-white p-3 group cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition-all flex flex-col relative"
                            >
                                <button 
                                    onClick={(e) => toggleFavorite(e, tmpl.id)}
                                    className={`absolute top-2 right-2 p-1.5 rounded-full transition-colors ${isFav ? 'text-yellow-500 bg-yellow-50' : 'text-gray-300 hover:text-gray-500'}`}
                                >
                                    <Star size={16} fill={isFav ? "currentColor" : "none"} />
                                </button>

                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-2 bg-win95-bg rounded border border-white">
                                        <CategoryIcon cat={tmpl.category}/>
                                    </div>
                                    <div>
                                        <div className="text-[9px] font-black text-blue-600 uppercase tracking-tighter">{tmpl.category}</div>
                                        <div className="text-xs font-black text-black leading-tight truncate max-w-[160px]">{tmpl.name}</div>
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-500 line-clamp-2 mb-4 flex-1">{tmpl.description}</p>
                                
                                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase">{tmpl.fields.length} campos p/ preencher</span>
                                    <div className="text-win95-blue group-hover:translate-x-1 transition-transform">
                                        <ChevronRight size={14}/>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
          </div>
        )}

        {/* VIEW: EDITOR (SPLIT) */}
        {view === 'editor' && selectedTmpl && (
           <div className="h-full flex flex-col md:flex-row">
              {/* Painel de Preenchimento */}
              <div className="w-full md:w-80 flex flex-col bg-win95-bg border-r border-white overflow-hidden shrink-0">
                 <div className="p-3 bg-[#d4d0c8] border-b border-gray-400 flex items-center gap-2 shrink-0">
                    <Info size={14} className="text-blue-700"/>
                    <span className="text-[10px] font-black uppercase">Dados do Documento</span>
                 </div>
                 <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {selectedTmpl.fields.map(field => (
                        <div key={field}>
                            <label className="text-[10px] font-black uppercase block mb-1 text-[#555]">{field}:</label>
                            <input 
                                className="w-full win95-sunken px-2 py-1.5 text-sm outline-none bg-white text-black font-bold focus:bg-yellow-50 transition-colors"
                                value={formValues[field] || ''}
                                onChange={e => setFormValues({...formValues, [field]: e.target.value})}
                                placeholder={`Digite ${field}...`}
                            />
                        </div>
                    ))}
                    
                    <div className="bg-blue-50 border border-blue-200 p-3 mt-6">
                        <h4 className="text-[10px] font-black uppercase text-blue-800 mb-1 flex items-center gap-1">
                            <Sparkles size={12}/> Sugestão Brain
                        </h4>
                        <p className="text-[9px] text-blue-700 leading-tight italic">
                            Revise todos os dados antes de gerar o PDF. Você pode editar o texto final diretamente na visualização ao lado se desejar.
                        </p>
                    </div>
                 </div>
              </div>

              {/* Pré-visualização do Papel */}
              <div className="flex-1 bg-[#808080] p-4 md:p-8 overflow-y-auto custom-scrollbar flex justify-center selection:bg-blue-200">
                 <div className="bg-white w-full max-w-[210mm] min-h-[297mm] shadow-2xl p-12 md:p-[25mm] flex flex-col relative animate-in slide-in-from-right-10 duration-500">
                    {/* Marca d'água de edição */}
                    <div className="absolute top-4 right-4 text-[8px] font-black text-gray-300 uppercase tracking-widest pointer-events-none">
                       Editor de Pré-visualização A4
                    </div>
                    
                    <div 
                        className="w-full h-full outline-none font-serif text-[11pt] leading-[1.8] text-black whitespace-pre-wrap text-justify"
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => {
                            // Poderíamos salvar o estado editado aqui se quiséssemos
                        }}
                    >
                        {generatedContent}
                    </div>
                 </div>
              </div>
           </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-3 py-1 bg-win95-bg border-t border-white flex justify-between items-center text-[9px] font-bold text-gray-500 uppercase italic shrink-0">
         <div className="flex gap-4">
            <span>Biblioteca V2.8 • Offline Ready</span>
            <span>Motor: PDFme Generation System</span>
         </div>
         <span>Privacidade Garantida: Dados não saem deste computador</span>
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
                padding: 20mm !important;
                box-shadow: none !important;
            }
        }
      `}</style>
    </div>
  );
};
