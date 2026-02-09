
import React, { useState, useEffect } from 'react';
import { FileText, Download, Printer, ChevronRight, FileCheck, RefreshCw, Bot, Globe, Search, Briefcase, Home, Scale, User, FileBadge, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import { DocTemplate } from '../types';
import { PDFDocument } from 'pdf-lib';
import { generate } from '@pdfme/generator';
import { text } from '@pdfme/schemas';

// --- BIBLIOTECA EXTENDIDA (Simulando Cloud) ---
const EXTENDED_LIBRARY: DocTemplate[] = [
  // Imobiliário
  {
    id: 'cloud_aluguel_res',
    name: 'Contrato de Locação Residencial',
    category: 'Jurídico',
    description: 'Contrato padrão para aluguel de imóvel residencial.',
    fields: ['Locador', 'Locatário', 'Endereço do Imóvel', 'Valor do Aluguel', 'Data de Início', 'Prazo (Meses)', 'Cidade'],
    contentPattern: `CONTRATO DE LOCAÇÃO RESIDENCIAL\n\nLOCADOR: {{Locador}}\nLOCATÁRIO: {{Locatário}}\n\nOBJETO: O presente contrato tem como objeto a locação do imóvel residencial situado em: {{Endereço do Imóvel}}.\n\nVALOR: O aluguel mensal será de R$ {{Valor do Aluguel}}, a ser pago até o dia 05 de cada mês.\n\nPRAZO: O prazo de locação é de {{Prazo (Meses)}} meses, iniciando-se em {{Data de Início}}.\n\nFORO: As partes elegem o foro da comarca de {{Cidade}} para dirimir quaisquer dúvidas.\n\n{{Cidade}}, ____ de _______________ de ______.\n\n__________________________\n{{Locador}}\n\n__________________________\n{{Locatário}}`
  },
  {
    id: 'cloud_recibo_aluguel',
    name: 'Recibo de Aluguel',
    category: 'Financeiro',
    description: 'Recibo simples de pagamento de aluguel.',
    fields: ['Valor', 'Inquilino', 'Endereço', 'Mês de Referência', 'Proprietário', 'Cidade'],
    contentPattern: `RECIBO DE ALUGUEL\n\nRecebi de {{Inquilino}} a importância de R$ {{Valor}}, referente ao aluguel do imóvel situado em {{Endereço}}, relativo ao mês de {{Mês de Referência}}.\n\nPor ser verdade, firmo o presente.\n\n{{Cidade}}, {{Data}}.\n\n__________________________\n{{Proprietário}}`
  },
  // Serviços
  {
    id: 'cloud_prestacao_serv',
    name: 'Contrato de Prestação de Serviços',
    category: 'Serviços',
    description: 'Modelo genérico para prestação de serviços autônomos.',
    fields: ['Contratante', 'Contratado', 'Serviço', 'Valor Total', 'Prazo de Entrega', 'Cidade'],
    contentPattern: `CONTRATO DE PRESTAÇÃO DE SERVIÇOS\n\nCONTRATANTE: {{Contratante}}\nCONTRATADO: {{Contratado}}\n\nOBJETO: Prestação de serviços de {{Serviço}}.\n\nVALOR: Pelos serviços prestados, o CONTRATANTE pagará ao CONTRATADO o valor de R$ {{Valor Total}}.\n\nPRAZO: O serviço deverá ser entregue até {{Prazo de Entrega}}.\n\n{{Cidade}}, ____ de _______________ de ______.\n\n__________________________\n{{Contratante}}\n\n__________________________\n{{Contratado}}`
  },
  {
    id: 'cloud_orcamento',
    name: 'Modelo de Orçamento',
    category: 'Serviços',
    description: 'Orçamento formal para clientes.',
    fields: ['Cliente', 'Descrição do Serviço', 'Materiais', 'Mão de Obra', 'Valor Total', 'Validade (Dias)', 'Empresa'],
    contentPattern: `ORÇAMENTO DE SERVIÇOS\n\nEMPRESA: {{Empresa}}\nCLIENTE: {{Cliente}}\n\nDESCRIÇÃO:\n{{Descrição do Serviço}}\n\nMATERIAIS: R$ {{Materiais}}\nMÃO DE OBRA: R$ {{Mão de Obra}}\n\nTOTAL: R$ {{Valor Total}}\n\nEste orçamento é válido por {{Validade (Dias)}} dias.\n\nData: {{Data}}`
  },
  // RH
  {
    id: 'cloud_demissao',
    name: 'Carta de Pedido de Demissão',
    category: 'RH',
    description: 'Carta formal de solicitação de desligamento.',
    fields: ['Nome do Empregado', 'Nome da Empresa', 'Cargo', 'Cidade'],
    contentPattern: `À {{Nome da Empresa}}\nPrezados Senhores,\n\nPor motivos pessoais, venho por meio desta apresentar meu pedido de demissão do cargo de {{Cargo}} que ocupo nesta empresa.\n\nSolicito a dispensa do cumprimento do aviso prévio.\n\nAtenciosamente,\n\n{{Cidade}}, {{Data}}.\n\n__________________________\n{{Nome do Empregado}}`
  },
  {
    id: 'cloud_advertencia',
    name: 'Advertência Disciplinar',
    category: 'RH',
    description: 'Documento de advertência para funcionário.',
    fields: ['Empregado', 'Motivo', 'Data do Fato', 'Empresa', 'Cidade'],
    contentPattern: `ADVERTÊNCIA DISCIPLINAR\n\nAo Sr(a). {{Empregado}}\n\nVimos pela presente aplicar-lhe ADVERTÊNCIA DISCIPLINAR em razão de: {{Motivo}}, ocorrido em {{Data do Fato}}.\n\nEsclarecemos que a reincidência poderá ocasionar medidas mais severas, conforme CLT.\n\n{{Empresa}}\n{{Cidade}}, {{Data}}.\n\n__________________________\nEmpregador\n\n__________________________\nCiente do Empregado`
  },
  // Jurídico
  {
    id: 'cloud_procuracao',
    name: 'Procuração Simples',
    category: 'Jurídico',
    description: 'Procuração para representação geral.',
    fields: ['Outorgante', 'Nacionalidade', 'Estado Civil', 'Profissão', 'CPF', 'Outorgado', 'Poderes', 'Cidade'],
    contentPattern: `PROCURAÇÃO\n\nOUTORGANTE: {{Outorgante}}, {{Nacionalidade}}, {{Estado Civil}}, {{Profissão}}, inscrito no CPF sob nº {{CPF}}.\n\nOUTORGADO: {{Outorgado}}.\n\nPODERES: Por este instrumento particular, o OUTORGANTE nomeia o OUTORGADO seu procurador para: {{Poderes}}.\n\n{{Cidade}}, ____ de _______________ de ______.\n\n__________________________\n{{Outorgante}}`
  },
  {
    id: 'cloud_declaracao_residencia',
    name: 'Declaração de Residência',
    category: 'Jurídico',
    description: 'Para comprovação de endereço.',
    fields: ['Nome Completo', 'CPF', 'Endereço', 'Cidade'],
    contentPattern: `DECLARAÇÃO DE RESIDÊNCIA\n\nEu, {{Nome Completo}}, inscrito no CPF nº {{CPF}}, DECLARO para os devidos fins que resido e domicilio no endereço:\n\n{{Endereço}}\n\nPor ser expressão da verdade, firmo a presente.\n\n{{Cidade}}, {{Data}}.\n\n__________________________\n{{Nome Completo}}`
  }
];

export const DocumentGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'native' | 'cloud'>('native');
  const [selectedTemplate, setSelectedTemplate] = useState<DocTemplate>(EXTENDED_LIBRARY[0]);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [searchCloud, setSearchCloud] = useState('');

  // Inicializa o conteúdo
  useEffect(() => {
    setFormValues({});
    if (selectedTemplate.category !== 'IA') {
      let content = selectedTemplate.contentPattern;
      selectedTemplate.fields.forEach(field => {
        content = content.split(`{{${field}}}`).join(`[${field.toUpperCase()}]`);
      });
      setGeneratedContent(content);
    } else {
      setGeneratedContent('');
    }
  }, [selectedTemplate]);

  const handleInputChange = (field: string, value: string) => {
    const newValues = { ...formValues, [field]: value };
    setFormValues(newValues);

    if (selectedTemplate.category !== 'IA') {
      let content = selectedTemplate.contentPattern;
      selectedTemplate.fields.forEach(f => {
        const val = newValues[f] || `[${f.toUpperCase()}]`;
        content = content.split(`{{${f}}}`).join(val);
      });
      // Replace genérico de {{Data}}
      const today = new Date().toLocaleDateString('pt-BR');
      content = content.replace(/{{Data}}/g, today);
      
      setGeneratedContent(content);
    }
  };

  // Simula busca na "Nuvem" usando a biblioteca estendida local
  const fetchCloudTemplate = (template: DocTemplate) => {
    setIsGenerating(true);
    setTimeout(() => {
      setSelectedTemplate(template);
      setActiveTab('native');
      setIsGenerating(false);
    }, 600);
  };

  // "IA" Lógica - Keyword Matching
  const handleAiGeneration = async () => {
    if (!aiPrompt) return alert("Por favor, descreva o documento que deseja.");
    setIsGenerating(true);

    const keywords = aiPrompt.toLowerCase().split(' ');
    let bestMatch: DocTemplate | null = null;
    let maxScore = 0;

    EXTENDED_LIBRARY.forEach(tmpl => {
      let score = 0;
      const text = (tmpl.name + ' ' + tmpl.description + ' ' + tmpl.category).toLowerCase();
      keywords.forEach(word => {
        if (word.length > 3 && text.includes(word)) score++;
      });
      if (score > maxScore) {
        maxScore = score;
        bestMatch = tmpl;
      }
    });

    setTimeout(() => {
      if (bestMatch && maxScore > 0) {
        setGeneratedContent(`[MODELO ENCONTRADO: ${bestMatch.name}]\n\n` + bestMatch.contentPattern);
        setSelectedTemplate({
            ...bestMatch,
            id: 'ia_result',
            name: 'Resultado da Busca Inteligente'
        });
      } else {
        setGeneratedContent(`DOCUMENTO GENÉRICO\n\nRef: ${aiPrompt}\n\nPrezados,\n\nVenho por meio desta tratar sobre ${aiPrompt}.\n\nSem mais para o momento,\n\nAtenciosamente,\n\n___________________\nAssinatura`);
      }
      setIsGenerating(false);
    }, 1000);
  };

  // --- PDFME INTEGRATION ---
  const downloadPDF = async () => {
    setIsGenerating(true);
    try {
      // 1. Criar um Base PDF em branco (A4)
      const doc = await PDFDocument.create();
      const page = doc.addPage([595.28, 841.89]); // A4 em points
      const basePdf = await doc.saveAsBase64({ dataUri: true });

      // 2. Definir o Schema do PDFME
      // Criamos um campo de texto único que ocupa a página (margem 20mm)
      const template = {
        basePdf,
        schemas: [
          [
            {
              name: 'content',
              type: 'text',
              content: 'Conteúdo do Documento',
              position: { x: 20, y: 20 },
              width: 170, // 210mm (A4) - 40mm (margens)
              height: 250, // Altura útil
              fontSize: 11,
              fontName: 'Roboto', // Fonte padrão do pdfme
              lineHeight: 1.5,
              alignment: 'left',
              verticalAlignment: 'top',
            }
          ]
        ]
      };

      // 3. Inputs
      const inputs = [{ content: generatedContent }];

      // 4. Gerar PDF usando @pdfme/generator
      // Passamos o plugin 'text' para renderizar o texto corretamente
      const pdf = await generate({ template, inputs, plugins: { text } });

      // 5. Download
      const blob = new Blob([pdf.buffer], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `documento_${selectedTemplate.name.toLowerCase().replace(/\s/g, '_')}.pdf`;
      link.click();

    } catch (err) {
      console.error(err);
      alert("Erro ao gerar PDF com PDFME.");
    } finally {
      setIsGenerating(false);
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch(cat) {
      case 'Imobiliário': return <Home size={14}/>;
      case 'Serviços': return <Briefcase size={14}/>;
      case 'RH': return <User size={14}/>;
      case 'Jurídico': return <Scale size={14}/>;
      default: return <FileBadge size={14}/>;
    }
  };

  const cloudCategories = Array.from(new Set(EXTENDED_LIBRARY.map(t => t.category)));

  return (
    <div className="h-full flex gap-4 bg-win95-bg p-2 overflow-hidden flex-col md:flex-row">
      {/* Sidebar: Seletor e Inputs */}
      <div className="w-full md:w-80 flex flex-col gap-2 overflow-hidden shrink-0">
         {/* Navegação de Abas */}
         <div className="flex gap-1 shrink-0">
            <button 
              onClick={() => setActiveTab('native')}
              className={`flex-1 px-2 py-1 text-[10px] font-bold uppercase flex items-center justify-center gap-1 border-t-2 border-l-2 border-r-2 ${activeTab === 'native' ? 'bg-win95-bg border-white border-b-0 relative top-[1px] z-10' : 'bg-[#c0c0c0] border-gray-400 text-gray-600'}`}
            >
              <FileText size={12}/> Modelos
            </button>
            <button 
              onClick={() => setActiveTab('cloud')}
              className={`flex-1 px-2 py-1 text-[10px] font-bold uppercase flex items-center justify-center gap-1 border-t-2 border-l-2 border-r-2 ${activeTab === 'cloud' ? 'bg-win95-bg border-white border-b-0 relative top-[1px] z-10' : 'bg-[#c0c0c0] border-gray-400 text-gray-600'}`}
            >
              <Globe size={12}/> Biblioteca
            </button>
         </div>

         {/* Conteúdo da Sidebar */}
         <div className="flex-1 win95-raised p-2 bg-win95-bg border-t-white flex flex-col overflow-hidden relative">
            
            {activeTab === 'native' && (
              <>
                <div className="mb-4">
                  <h3 className="text-[10px] font-bold uppercase mb-2 text-[#555]">Selecionar Modelo</h3>
                  <div className="space-y-1 max-h-40 overflow-y-auto win95-sunken bg-white p-1">
                    {/* Botão Especial IA */}
                    <button
                        onClick={() => {
                            setSelectedTemplate({ id: 'ia_custom', name: '✨ Assistente de Criação', category: 'IA', description: 'Busca inteligente', fields: [], contentPattern: '' });
                            setGeneratedContent('');
                        }}
                        className={`w-full text-left px-2 py-1 text-xs font-bold border border-transparent flex items-center justify-between group ${selectedTemplate.category === 'IA' ? 'bg-purple-700 text-white' : 'hover:bg-purple-100 text-purple-900'}`}
                    >
                        <span>✨ Assistente de Criação</span>
                    </button>

                    {EXTENDED_LIBRARY.slice(0, 5).map(tmpl => (
                        <button
                          key={tmpl.id}
                          onClick={() => setSelectedTemplate(tmpl)}
                          className={`w-full text-left px-2 py-1 text-xs font-bold border border-transparent flex items-center justify-between group ${
                            selectedTemplate.id === tmpl.id 
                            ? 'bg-win95-blue text-white' 
                            : 'hover:bg-blue-50 text-gray-700'
                          }`}
                        >
                          <span>{tmpl.name}</span>
                          {selectedTemplate.id === tmpl.id && <ChevronRight size={10}/>}
                        </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 flex flex-col border-t border-gray-300 pt-2 overflow-hidden">
                  <div className="mb-2 text-[10px] font-bold uppercase text-gray-500">
                    {selectedTemplate.category === 'IA' ? 'O que você precisa?' : 'Preenchimento'}
                  </div>

                  {selectedTemplate.category === 'IA' ? (
                    <div className="flex-1 flex flex-col gap-2">
                        <textarea 
                          className="flex-1 w-full win95-sunken p-2 text-xs outline-none resize-none"
                          placeholder="Ex: Contrato de aluguel, carta de demissão..."
                          value={aiPrompt}
                          onChange={e => setAiPrompt(e.target.value)}
                        />
                        <Button onClick={handleAiGeneration} disabled={isGenerating} icon={isGenerating ? <RefreshCw className="animate-spin" size={14}/> : <Bot size={14}/>}>
                          {isGenerating ? 'BUSCANDO...' : 'ENCONTRAR MODELO'}
                        </Button>
                    </div>
                  ) : (
                    <div className="space-y-2 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                        {selectedTemplate.fields.map(field => (
                          <div key={field}>
                              <label className="text-[9px] font-bold uppercase block mb-0.5">{field}:</label>
                              <input 
                                className="w-full win95-sunken px-2 py-1 text-sm outline-none bg-white text-black font-bold"
                                value={formValues[field] || ''}
                                onChange={e => handleInputChange(field, e.target.value)}
                              />
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'cloud' && (
              <div className="flex flex-col h-full">
                 <div className="mb-2 flex gap-1">
                    <Search size={14} className="text-gray-500"/>
                    <input 
                      className="w-full win95-sunken px-1 text-xs outline-none" 
                      placeholder="Filtrar biblioteca..." 
                      value={searchCloud}
                      onChange={e => setSearchCloud(e.target.value)}
                    />
                 </div>
                 <div className="flex-1 overflow-y-auto custom-scrollbar win95-sunken bg-white p-1 space-y-4">
                    {isGenerating ? (
                      <div className="h-full flex flex-col items-center justify-center text-win95-blue">
                         <Loader2 className="animate-spin mb-2" size={24} />
                         <p className="text-xs font-bold uppercase">Carregando...</p>
                      </div>
                    ) : (
                      cloudCategories.map(cat => {
                        const items = EXTENDED_LIBRARY.filter(t => t.category === cat && t.name.toLowerCase().includes(searchCloud.toLowerCase()));
                        if (items.length === 0) return null;
                        
                        return (
                          <div key={cat}>
                             <div className="flex items-center gap-1 text-[10px] font-black uppercase text-win95-blue mb-1 px-1 border-b border-gray-100">
                                {getCategoryIcon(cat)} {cat}
                             </div>
                             <div className="space-y-0.5">
                                {items.map(item => (
                                  <button
                                    key={item.id}
                                    onClick={() => fetchCloudTemplate(item)}
                                    className="w-full text-left px-2 py-1 text-[11px] hover:bg-yellow-50 hover:text-blue-800 flex items-center gap-2 group transition-colors"
                                  >
                                    <div className="w-1 h-1 bg-gray-400 rounded-full group-hover:bg-blue-500"></div>
                                    {item.name}
                                  </button>
                                ))}
                             </div>
                          </div>
                        );
                      })
                    )}
                 </div>
                 <div className="mt-2 text-[9px] text-gray-500 text-center border-t border-gray-300 pt-1">
                    Biblioteca Local v2.0 (Offline)
                 </div>
              </div>
            )}

         </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 win95-raised p-1 bg-[#808080] flex flex-col min-w-0">
         <div className="bg-win95-blue text-white px-2 py-1 text-xs font-bold uppercase flex justify-between items-center mb-1">
            <span>Pré-visualização</span>
            <span className="text-[9px] opacity-70 truncate max-w-[150px]">A4 • {selectedTemplate.name}</span>
         </div>
         
         <div className="flex-1 bg-[#555] p-4 md:p-8 overflow-y-auto custom-scrollbar flex justify-center">
             <div className="bg-white w-full max-w-[210mm] min-h-[297mm] shadow-2xl p-8 md:p-[20mm] flex flex-col relative transition-all shrink-0">
                <textarea 
                  className="w-full h-full resize-none outline-none font-serif text-[12pt] leading-relaxed bg-transparent text-black whitespace-pre-wrap"
                  value={generatedContent}
                  onChange={e => setGeneratedContent(e.target.value)}
                  placeholder="O documento gerado aparecerá aqui..."
                />
             </div>
         </div>

         <div className="bg-win95-bg p-2 flex justify-end gap-2 border-t border-white">
             <Button onClick={() => window.print()} variant="secondary" icon={<Printer size={16}/>}>IMPRIMIR</Button>
             <Button onClick={downloadPDF} disabled={isGenerating} className="bg-win95-blue text-white" icon={isGenerating ? <Loader2 className="animate-spin" size={16}/> : <Download size={16}/>}>
               {isGenerating ? 'GERANDO PDF...' : 'BAIXAR PDF (PDFME)'}
             </Button>
         </div>
      </div>
      
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .bg-white, .bg-white * { visibility: visible; }
          .bg-white { position: absolute; left: 0; top: 0; margin: 0; padding: 0; width: 100%; min-height: 100%; box-shadow: none; }
        }
      `}</style>
    </div>
  );
};
