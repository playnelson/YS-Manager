
import React, { useState } from 'react';
import { FileText, Wand2, Download, Printer, ChevronRight, FileCheck, RefreshCw, Bot, Globe, FolderOpen, Search, Briefcase, Home, Scale, User, FileBadge, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import { DocTemplate } from '../types';
import { GoogleGenAI } from "@google/genai";
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

// --- CATALOGO CLOUD (SIMULADO) ---
const CLOUD_CATALOG = {
  'Imobiliário': [
    { id: 'cloud_aluguel_res', name: 'Contrato de Locação Residencial' },
    { id: 'cloud_aluguel_com', name: 'Contrato de Locação Comercial' },
    { id: 'cloud_vistoria', name: 'Laudo de Vistoria de Imóvel' },
    { id: 'cloud_desocupacao', name: 'Aviso de Desocupação de Imóvel' },
    { id: 'cloud_compra_venda_imv', name: 'Promessa de Compra e Venda de Imóvel' },
  ],
  'Serviços & Negócios': [
    { id: 'cloud_prestacao_serv', name: 'Contrato de Prestação de Serviços' },
    { id: 'cloud_orcamento', name: 'Modelo de Orçamento Formal' },
    { id: 'cloud_nda', name: 'Acordo de Confidencialidade (NDA)' },
    { id: 'cloud_parceria', name: 'Memorando de Parceria Comercial' },
    { id: 'cloud_social_midia', name: 'Contrato de Gestão de Redes Sociais' },
  ],
  'Trabalhista & RH': [
    { id: 'cloud_demissao', name: 'Carta de Pedido de Demissão' },
    { id: 'cloud_advertencia', name: 'Carta de Advertência Disciplinar' },
    { id: 'cloud_experiencia', name: 'Contrato de Trabalho (Experiência)' },
    { id: 'cloud_recomendacao', name: 'Carta de Recomendação Profissional' },
    { id: 'cloud_homeoffice', name: 'Aditivo de Teletrabalho (Home Office)' },
  ],
  'Jurídico & Pessoal': [
    { id: 'cloud_procuracao_amp', name: 'Procuração de Amplos Poderes' },
    { id: 'cloud_uniao_estavel', name: 'Declaração de União Estável' },
    { id: 'cloud_divorcio', name: 'Minuta de Divórcio Consensual' },
    { id: 'cloud_viagem_menor', name: 'Autorização de Viagem para Menor' },
    { id: 'cloud_contestacao', name: 'Modelo de Contestação Simples' },
  ],
  'Financeiro': [
    { id: 'cloud_confissao_divida', name: 'Termo de Confissão de Dívida' },
    { id: 'cloud_recibo_aluguel', name: 'Recibo de Aluguel Detalhado' },
    { id: 'cloud_cobranca', name: 'Carta de Cobrança Amigável' },
    { id: 'cloud_distrato', name: 'Termo de Quitação e Distrato' },
  ]
};

// --- TEMPLATES NATIVOS (Offline) ---
const NATIVE_TEMPLATES: DocTemplate[] = [
  {
    id: 'recibo_simples',
    name: 'Recibo de Pagamento',
    category: 'Financeiro',
    description: 'Recibo padrão para comprovação de pagamentos diversos.',
    fields: ['Valor (R$)', 'Pagador', 'Referente a', 'Cidade', 'Data'],
    contentPattern: `RECIBO DE PAGAMENTO\n\nVALOR: R$ {{Valor (R$)}}\n\nRecebi(emos) de {{Pagador}} a quantia de R$ {{Valor (R$)}}, referente a {{Referente a}}.\n\nPor ser verdade, firmo(amos) o presente.\n\n{{Cidade}}, {{Data}}.\n\n__________________________\nAssinatura do Recebedor`
  },
  {
    id: 'declaracao_residencia',
    name: 'Declaração de Residência',
    category: 'Jurídico',
    description: 'Declaração formal para comprovação de endereço.',
    fields: ['Nome Completo', 'CPF', 'RG', 'Endereço Completo', 'Cidade', 'Data'],
    contentPattern: `DECLARAÇÃO DE RESIDÊNCIA\n\nEu, {{Nome Completo}}, inscrito(a) no CPF sob o nº {{CPF}} e portador(a) do RG nº {{RG}}, DECLARO para os devidos fins de comprovação de residência, que sou residente e domiciliado(a) no endereço:\n\n{{Endereço Completo}}\n\nDeclaro ainda estar ciente de que a falsidade da presente declaração pode implicar na sanção penal prevista no Art. 299 do Código Penal.\n\n{{Cidade}}, {{Data}}.\n\n__________________________\n{{Nome Completo}}`
  },
  {
    id: 'vale_transporte',
    name: 'Opção de Vale Transporte',
    category: 'RH',
    description: 'Formulário para opção ou desistência de VT.',
    fields: ['Nome do Colaborador', 'Cargo', 'Empresa', 'Cidade', 'Data'],
    contentPattern: `TERMO DE OPÇÃO DE VALE TRANSPORTE\n\nEmpregador: {{Empresa}}\nColaborador: {{Nome do Colaborador}}\nCargo: {{Cargo}}\n\n(  ) OPTO pela utilização do Vale-Transporte.\nComprometo-me a utilizá-lo exclusivamente para meu efetivo deslocamento residência-trabalho e vice-versa.\n\n(  ) NÃO OPTO pelo Vale-Transporte.\nDeclaro que utilizo meios próprios para meu deslocamento.\n\n{{Cidade}}, {{Data}}.\n\n__________________________\nAssinatura do Colaborador`
  },
  {
    id: 'promissoria',
    name: 'Nota Promissória',
    category: 'Financeiro',
    description: 'Promessa de pagamento de dívida.',
    fields: ['Número', 'Vencimento', 'Valor (R$)', 'Credor', 'Devedor', 'CPF/CNPJ Devedor', 'Endereço Devedor'],
    contentPattern: `NOTA PROMISSÓRIA\n\nNº: {{Número}}\nVencimento: {{Vencimento}}\nValor: R$ {{Valor (R$)}}\n\nAo(s) dia(s) do vencimento acima estipulado, pagarei(emos) por esta única via de NOTA PROMISSÓRIA a {{Credor}}, ou à sua ordem, a quantia de R$ {{Valor (R$)}}, em moeda corrente deste país.\n\nPagável em: Domicílio do Credor.\n\nEmitente (Devedor): {{Devedor}}\nCPF/CNPJ: {{CPF/CNPJ Devedor}}\nEndereço: {{Endereço Devedor}}\n\n__________________________\nAssinatura`
  },
  {
    id: 'ia_custom',
    name: '✨ Criar com IA',
    category: 'IA',
    description: 'Descreva o que você precisa e a IA gera o documento.',
    fields: ['Descrição Detalhada'],
    contentPattern: '' // Dynamic
  }
];

export const DocumentGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'native' | 'cloud'>('native');
  const [selectedTemplate, setSelectedTemplate] = useState<DocTemplate>(NATIVE_TEMPLATES[0]);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [searchCloud, setSearchCloud] = useState('');

  // Inicializa o conteúdo ao mudar de template
  React.useEffect(() => {
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
      setGeneratedContent(content);
    }
  };

  const fetchCloudTemplate = async (templateName: string, category: string) => {
    setIsGenerating(true);
    try {
      const apiKey = (import.meta as any).env?.VITE_GOOGLE_API_KEY || sessionStorage.getItem('gemini_key') || '';
      if (!apiKey) {
         const userKey = window.prompt("API Key do Google Gemini não encontrada. Insira para carregar o modelo:");
         if(userKey) sessionStorage.setItem('gemini_key', userKey);
         else { setIsGenerating(false); return; }
      }
      
      const ai = new GoogleGenAI({ apiKey: apiKey || sessionStorage.getItem('gemini_key')! });
      
      const systemPrompt = `
        Aja como uma API de modelos de documentos brasileiros. 
        Gere um objeto JSON para o documento "${templateName}".
        O JSON deve ter estritamente este formato:
        {
          "fields": ["Campo1", "Campo2"],
          "contentPattern": "Texto do documento com placeholders no formato {{Campo1}}..."
        }
        Regras:
        1. Use linguagem jurídica formal e correta para o Brasil.
        2. "fields" devem ser as variáveis que o usuário precisa preencher.
        3. "contentPattern" deve ser o texto completo.
        4. Retorne APENAS o JSON, sem markdown.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: systemPrompt,
      });

      // FIX: Access .text property directly
      let text = response.text || '';
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const result = JSON.parse(text);
      
      const newTemplate: DocTemplate = {
        id: `cloud_${Date.now()}`,
        name: templateName,
        category: category as any,
        description: 'Modelo gerado via Cloud API',
        fields: result.fields,
        contentPattern: result.contentPattern
      };

      setSelectedTemplate(newTemplate);
      setActiveTab('native');
      
    } catch (error) {
      console.error(error);
      alert("Erro ao baixar o modelo da nuvem. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAiGeneration = async () => {
    if (!aiPrompt) return alert("Por favor, descreva o documento que deseja.");
    setIsGenerating(true);

    try {
      const apiKey = (import.meta as any).env?.VITE_GOOGLE_API_KEY || sessionStorage.getItem('gemini_key') || '';
      
      if (!apiKey) {
         const userKey = window.prompt("API Key do Google Gemini não encontrada. Insira para testar (não será salva):");
         if(userKey) sessionStorage.setItem('gemini_key', userKey);
         else { setIsGenerating(false); return; }
      }
      
      const keyToUse = apiKey || sessionStorage.getItem('gemini_key') || '';
      const ai = new GoogleGenAI({ apiKey: keyToUse });
      
      const generationPrompt = `Você é um advogado e assistente administrativo experiente. 
      Crie um documento formal brasileiro com base nesta solicitação: "${aiPrompt}".
      Regras: Linguagem formal, espaços para assinatura, sem explicações extras.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: generationPrompt,
      });

      // FIX: Access .text property directly
      if (response.text) {
        setGeneratedContent(response.text);
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao gerar com IA.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPDF = async () => {
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage();
      const { width, height } = page.getSize();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontSize = 12;
      const margin = 50;
      const text = generatedContent;
      const lines = text.split('\n');
      let y = height - margin;

      const writeLine = (line: string) => {
         const maxWidth = width - (margin * 2);
         const words = line.split(' ');
         let currentLine = '';
         for (const word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const textWidth = font.widthOfTextAtSize(testLine, fontSize);
            if (textWidth > maxWidth) {
               page.drawText(currentLine, { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0) });
               y -= (fontSize + 5);
               currentLine = word;
            } else {
               currentLine = testLine;
            }
         }
         if (currentLine) {
            page.drawText(currentLine, { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0) });
            y -= (fontSize + 5);
         }
      };

      lines.forEach(line => {
         writeLine(line);
         y -= 5; 
         if (y < margin) { 
             const newPage = pdfDoc.addPage(); 
             y = height - margin; 
         }
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `documento_${selectedTemplate.name.toLowerCase().replace(/\s/g, '_')}.pdf`;
      link.click();

    } catch (err) {
      console.error(err);
      alert("Erro ao criar PDF.");
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch(cat) {
      case 'Imobiliário': return <Home size={14}/>;
      case 'Serviços & Negócios': return <Briefcase size={14}/>;
      case 'Trabalhista & RH': return <User size={14}/>;
      case 'Jurídico & Pessoal': return <Scale size={14}/>;
      default: return <FileBadge size={14}/>;
    }
  };

  return (
    <div className="h-full flex gap-4 bg-win95-bg p-2 overflow-hidden">
      {/* Sidebar: Seletor e Inputs */}
      <div className="w-80 flex flex-col gap-2 overflow-hidden">
         {/* Navegação de Abas */}
         <div className="flex gap-1 shrink-0">
            <button 
              onClick={() => setActiveTab('native')}
              className={`flex-1 px-2 py-1 text-[10px] font-bold uppercase flex items-center justify-center gap-1 border-t-2 border-l-2 border-r-2 ${activeTab === 'native' ? 'bg-win95-bg border-white border-b-0 relative top-[1px] z-10' : 'bg-[#c0c0c0] border-gray-400 text-gray-600'}`}
            >
              <FileText size={12}/> Modelos Locais
            </button>
            <button 
              onClick={() => setActiveTab('cloud')}
              className={`flex-1 px-2 py-1 text-[10px] font-bold uppercase flex items-center justify-center gap-1 border-t-2 border-l-2 border-r-2 ${activeTab === 'cloud' ? 'bg-win95-bg border-white border-b-0 relative top-[1px] z-10' : 'bg-[#c0c0c0] border-gray-400 text-gray-600'}`}
            >
              <Globe size={12}/> Catálogo Cloud
            </button>
         </div>

         {/* Conteúdo da Sidebar */}
         <div className="flex-1 win95-raised p-2 bg-win95-bg border-t-white flex flex-col overflow-hidden">
            
            {activeTab === 'native' && (
              <>
                <div className="mb-4">
                  <h3 className="text-[10px] font-bold uppercase mb-2 text-[#555]">Selecionar Modelo</h3>
                  <div className="space-y-1 max-h-40 overflow-y-auto win95-sunken bg-white p-1">
                    {NATIVE_TEMPLATES.map(tmpl => (
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
                    {selectedTemplate.category === 'IA' ? 'Prompt Inteligente' : 'Preenchimento'}
                  </div>

                  {selectedTemplate.category === 'IA' ? (
                    <div className="flex-1 flex flex-col gap-2">
                        <textarea 
                          className="flex-1 w-full win95-sunken p-2 text-xs outline-none resize-none"
                          placeholder="Descreva o documento..."
                          value={aiPrompt}
                          onChange={e => setAiPrompt(e.target.value)}
                        />
                        <Button onClick={handleAiGeneration} disabled={isGenerating} icon={isGenerating ? <RefreshCw className="animate-spin" size={14}/> : <Bot size={14}/>}>
                          {isGenerating ? 'ESCREVENDO...' : 'GERAR DOC'}
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
                      placeholder="Filtrar catálogo..." 
                      value={searchCloud}
                      onChange={e => setSearchCloud(e.target.value)}
                    />
                 </div>
                 <div className="flex-1 overflow-y-auto custom-scrollbar win95-sunken bg-white p-1 space-y-4">
                    {isGenerating ? (
                      <div className="h-full flex flex-col items-center justify-center text-win95-blue">
                         <Loader2 className="animate-spin mb-2" size={24} />
                         <p className="text-xs font-bold uppercase">Baixando Modelo...</p>
                      </div>
                    ) : (
                      Object.entries(CLOUD_CATALOG).map(([category, items]) => {
                        const filteredItems = items.filter(i => i.name.toLowerCase().includes(searchCloud.toLowerCase()));
                        if (filteredItems.length === 0) return null;
                        
                        return (
                          <div key={category}>
                             <div className="flex items-center gap-1 text-[10px] font-black uppercase text-win95-blue mb-1 px-1 border-b border-gray-100">
                                {getCategoryIcon(category)} {category}
                             </div>
                             <div className="space-y-0.5">
                                {filteredItems.map(item => (
                                  <button
                                    key={item.id}
                                    onClick={() => fetchCloudTemplate(item.name, category)}
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
                    API de Modelos via Google Gemini
                 </div>
              </div>
            )}

         </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 win95-raised p-1 bg-[#808080] flex flex-col">
         <div className="bg-win95-blue text-white px-2 py-1 text-xs font-bold uppercase flex justify-between items-center mb-1">
            <span>Pré-visualização</span>
            <span className="text-[9px] opacity-70">A4 • {selectedTemplate.name}</span>
         </div>
         
         <div className="flex-1 bg-[#555] p-8 overflow-y-auto custom-scrollbar flex justify-center">
             <div className="bg-white w-[210mm] min-h-[297mm] shadow-2xl p-[20mm] flex flex-col relative transition-all">
                <textarea 
                  className="w-full h-full resize-none outline-none font-serif text-[12pt] leading-relaxed bg-transparent text-black whitespace-pre-wrap"
                  value={generatedContent}
                  onChange={e => setGeneratedContent(e.target.value)}
                  placeholder="O documento gerado aparecerá aqui..."
                />
                
                {generatedContent && (
                   <div className="absolute bottom-[20mm] right-[20mm] opacity-10 pointer-events-none">
                      <FileCheck size={100} className="text-black"/>
                   </div>
                )}
             </div>
         </div>

         <div className="bg-win95-bg p-2 flex justify-end gap-2 border-t border-white">
             <Button onClick={() => window.print()} variant="secondary" icon={<Printer size={16}/>}>IMPRIMIR</Button>
             <Button onClick={downloadPDF} className="bg-win95-blue text-white" icon={<Download size={16}/>}>BAIXAR PDF</Button>
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
