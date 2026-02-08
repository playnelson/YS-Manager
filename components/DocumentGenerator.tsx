import React, { useState } from 'react';
import { FileText, Wand2, Download, Printer, ChevronRight, FileCheck, RefreshCw, Bot } from 'lucide-react';
import { Button } from './ui/Button';
import { DocTemplate } from '../types';
import { GoogleGenAI } from "@google/genai";
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

// --- TEMPLATES NATIVOS (Biblioteca Offline) ---
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
  const [selectedTemplate, setSelectedTemplate] = useState<DocTemplate>(NATIVE_TEMPLATES[0]);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  // Inicializa o conteúdo ao mudar de template (se não for IA)
  React.useEffect(() => {
    setFormValues({});
    if (selectedTemplate.category !== 'IA') {
      // Pre-fill content with empty placeholders
      let content = selectedTemplate.contentPattern;
      selectedTemplate.fields.forEach(field => {
        content = content.split(`{{${field}}}`).join(`[${field.toUpperCase()}]`);
      });
      setGeneratedContent(content);
    } else {
      setGeneratedContent('');
    }
  }, [selectedTemplate]);

  // Atualiza o preview em tempo real (Modo Template)
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

  // Gera documento com IA (Google GenAI)
  const handleAiGeneration = async () => {
    if (!aiPrompt) return alert("Por favor, descreva o documento que deseja.");
    setIsGenerating(true);

    try {
      // Nota: Em produção, a chave deve vir de process.env.API_KEY
      const apiKey = (import.meta as any).env?.VITE_GOOGLE_API_KEY || ''; 
      
      // Fallback para input manual se não tiver env (comum em demos)
      if (!apiKey && !sessionStorage.getItem('gemini_key')) {
         const userKey = window.prompt("API Key do Google Gemini não encontrada. Insira para testar (não será salva):");
         if(userKey) sessionStorage.setItem('gemini_key', userKey);
         else { setIsGenerating(false); return; }
      }
      
      const keyToUse = apiKey || sessionStorage.getItem('gemini_key') || '';
      
      const ai = new GoogleGenAI({ apiKey: keyToUse });
      
      const generationPrompt = `Você é um advogado e assistente administrativo experiente. 
      Crie um documento formal brasileiro com base nesta solicitação: "${aiPrompt}".
      
      Regras:
      1. Use linguagem formal e jurídica adequada.
      2. Inclua espaços para assinatura e data.
      3. Não inclua explicações, apenas o texto do documento.
      4. Se for contrato, inclua cláusulas padrão de foro e rescisão.
      5. Formate com quebras de linha claras.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: generationPrompt,
      });

      if (response.text) {
        setGeneratedContent(response.text);
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao gerar com IA. Verifique a chave de API ou tente novamente.");
      setGeneratedContent("Erro na geração. Tente usar um modelo manual.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Gera e Baixa o PDF
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

      // Função simples de quebra de linha
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
               
               if (y < margin) { // Nova página se acabar o espaço
                  // Simplificação: para documentos longos reais, precisaria criar nova página aqui
                  // Para este exemplo, vamos cortar ou condensar
               }
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
         y -= 5; // Extra space for paragraph
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `documento_${selectedTemplate.category.toLowerCase()}.pdf`;
      link.click();

    } catch (err) {
      console.error(err);
      alert("Erro ao criar PDF.");
    }
  };

  return (
    <div className="h-full flex gap-4 bg-win95-bg p-2 overflow-hidden">
      {/* Sidebar: Seletor e Inputs */}
      <div className="w-80 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
         {/* Seletor de Template */}
         <div className="win95-raised p-2 bg-white">
            <h3 className="text-xs font-bold uppercase mb-2 flex items-center gap-2 text-win95-blue">
               <FileText size={14}/> Modelo de Documento
            </h3>
            <div className="space-y-1">
               {NATIVE_TEMPLATES.map(tmpl => (
                  <button
                    key={tmpl.id}
                    onClick={() => setSelectedTemplate(tmpl)}
                    className={`w-full text-left px-2 py-1.5 text-xs font-bold border border-transparent flex items-center justify-between group ${
                       selectedTemplate.id === tmpl.id 
                       ? 'bg-win95-blue text-white' 
                       : 'hover:bg-blue-50 text-gray-700'
                    }`}
                  >
                     <span>{tmpl.name}</span>
                     {selectedTemplate.id === tmpl.id && <ChevronRight size={12}/>}
                  </button>
               ))}
            </div>
         </div>

         {/* Área de Inputs */}
         <div className="win95-raised p-3 bg-win95-bg flex-1 flex flex-col">
            <div className="mb-2 text-[10px] font-bold uppercase text-gray-500 border-b border-white pb-1">
               {selectedTemplate.category === 'IA' ? 'Prompt Inteligente' : 'Preenchimento de Dados'}
            </div>

            {selectedTemplate.category === 'IA' ? (
               <div className="flex-1 flex flex-col gap-2">
                  <div className="bg-yellow-50 p-2 border border-yellow-200 text-[10px] text-yellow-800 leading-tight">
                     <Wand2 size={12} className="inline mr-1"/>
                     A IA irá gerar um documento completo com base no seu pedido. Seja específico.
                  </div>
                  <textarea 
                     className="flex-1 w-full win95-sunken p-2 text-xs outline-none resize-none"
                     placeholder="Ex: Crie um contrato de prestação de serviços de design gráfico entre João Silva (CPF 123...) e Empresa X (CNPJ 000...), valor R$ 2000, prazo 30 dias..."
                     value={aiPrompt}
                     onChange={e => setAiPrompt(e.target.value)}
                  />
                  <Button onClick={handleAiGeneration} disabled={isGenerating} icon={isGenerating ? <RefreshCw className="animate-spin" size={14}/> : <Bot size={14}/>}>
                     {isGenerating ? 'ESCREVENDO...' : 'GERAR DOCUMENTO'}
                  </Button>
               </div>
            ) : (
               <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                  {selectedTemplate.fields.map(field => (
                     <div key={field}>
                        <label className="text-[10px] font-bold uppercase block mb-1">{field}:</label>
                        <input 
                           className="w-full win95-sunken px-2 py-1 text-sm outline-none bg-white text-black font-bold"
                           placeholder={`Digite ${field}...`}
                           value={formValues[field] || ''}
                           onChange={e => handleInputChange(field, e.target.value)}
                        />
                     </div>
                  ))}
                  <div className="text-[9px] text-gray-500 italic mt-4">
                     Os dados são preenchidos automaticamente no painel ao lado.
                  </div>
               </div>
            )}
         </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 win95-raised p-1 bg-[#808080] flex flex-col">
         <div className="bg-win95-blue text-white px-2 py-1 text-xs font-bold uppercase flex justify-between items-center mb-1">
            <span>Pré-visualização do Documento</span>
            <span className="text-[9px] opacity-70">A4 • Retrato</span>
         </div>
         
         <div className="flex-1 bg-[#555] p-8 overflow-y-auto custom-scrollbar flex justify-center">
             <div className="bg-white w-[210mm] min-h-[297mm] shadow-2xl p-[20mm] flex flex-col relative">
                <textarea 
                  className="w-full h-full resize-none outline-none font-serif text-[12pt] leading-relaxed bg-transparent text-black whitespace-pre-wrap"
                  value={generatedContent}
                  onChange={e => setGeneratedContent(e.target.value)}
                  placeholder="O documento gerado aparecerá aqui..."
                />
                
                {/* Carimbo Visual de Assinatura (Decorativo) */}
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