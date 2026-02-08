
import React, { useState, useRef, useEffect } from 'react';
import { PenTool, Upload, Eraser, Save, FileCheck, Trash2, Download, MousePointer2, Move, ZoomIn, ZoomOut, Loader2, Sliders } from 'lucide-react';
import { Button } from './ui/Button';
import { Signature } from '../types';
import { PDFDocument } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist';

// Configuração do worker (mesma do PdfManager)
pdfjs.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${pdfjs.version}/build/pdf.worker.mjs`;

interface SignatureManagerProps {
  signatures: Signature[];
  onChange: (signatures: Signature[]) => void;
}

export const SignatureManager: React.FC<SignatureManagerProps> = ({ signatures = [], onChange }) => {
  const [activeTab, setActiveTab] = useState<'manage' | 'sign'>('manage');

  return (
    <div className="h-full flex flex-col gap-2 bg-win95-bg">
      <div className="flex gap-2 p-1 bg-win95-bg border-b border-white shrink-0">
        <Button 
          onClick={() => setActiveTab('manage')} 
          className={activeTab === 'manage' ? 'bg-white win95-sunken' : ''}
          icon={<PenTool size={14} />}
        >
          Minhas Assinaturas
        </Button>
        <Button 
          onClick={() => setActiveTab('sign')} 
          className={activeTab === 'sign' ? 'bg-white win95-sunken' : ''}
          icon={<FileCheck size={14} />}
        >
          Assinar Documento
        </Button>
      </div>

      <div className="flex-1 win95-raised p-2 bg-[#d0d0d0] overflow-hidden">
        {activeTab === 'manage' && <SignatureCreator signatures={signatures} onChange={onChange} />}
        {activeTab === 'sign' && <DocumentSigner signatures={signatures} />}
      </div>
    </div>
  );
};

// --- SUB-COMPONENTE: CRIADOR DE ASSINATURA ---
const SignatureCreator: React.FC<SignatureManagerProps> = ({ signatures, onChange }) => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  
  // Controles de Edição
  const [threshold, setThreshold] = useState(200); // Nível de corte do branco
  const [contrast, setContrast] = useState(1.2); // Reforço da tinta
  
  const [name, setName] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setOriginalImage(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Algoritmo de remoção de fundo MELHORADO
  useEffect(() => {
    if (!originalImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Redimensiona mantendo aspect ratio, mas limitando tamanho máximo para performance
      const maxWidth = 800;
      const scale = img.width > maxWidth ? maxWidth / img.width : 1;
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Calcula luminância (percepção de brilho humana)
        // 0.299R + 0.587G + 0.114B
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

        if (luminance > threshold) {
          // Se for claro (papel), torna transparente
          data[i + 3] = 0; 
        } else {
          // Se for escuro (tinta), mantém opaco
          // Aplica contraste para escurecer a tinta (remover cinzas claros)
          // Fórmula simples de contraste: NewColor = (Color - 128) * Contrast + 128
          // Mas aqui queremos apenas escurecer, então multiplicamos por um fator < 1 para escurecer
          // ou usamos o valor inverso da luminância.
          
          // Abordagem "Ink Booster":
          // Se é tinta, forçamos para ser mais escura para ficar nítida no PDF
          const booster = contrast; 
          data[i] = Math.max(0, r / booster);     // R
          data[i + 1] = Math.max(0, g / booster); // G
          data[i + 2] = Math.max(0, b / booster); // B
          data[i + 3] = 255; // Alpha total
        }
      }

      ctx.putImageData(imageData, 0, 0);
      setProcessedImage(canvas.toDataURL('image/png'));
    };
    img.src = originalImage;

  }, [originalImage, threshold, contrast]);

  const saveSignature = () => {
    if (!processedImage || !name) return alert("Defina um nome para salvar.");
    const newSig: Signature = {
      id: `sig_${Date.now()}`,
      name,
      dataUrl: processedImage,
      createdAt: new Date().toISOString()
    };
    onChange([...signatures, newSig]);
    setOriginalImage(null);
    setProcessedImage(null);
    setName('');
    setThreshold(200);
  };

  const deleteSignature = (id: string) => {
    if (confirm("Excluir assinatura?")) {
      onChange(signatures.filter(s => s.id !== id));
    }
  };

  return (
    <div className="h-full flex gap-4">
      {/* Esquerda: Lista */}
      <div className="w-64 flex flex-col gap-2">
         <div className="win95-raised p-2 bg-win95-bg">
            <h3 className="text-xs font-black uppercase mb-2">Salvas</h3>
            <div className="win95-sunken bg-white h-[400px] overflow-y-auto p-1 space-y-2">
              {signatures.length === 0 && <div className="text-center p-4 text-xs italic text-gray-400">Nenhuma assinatura salva.</div>}
              {signatures.map(sig => (
                <div key={sig.id} className="border border-dashed border-gray-300 p-2 group relative hover:bg-gray-50">
                   <div className="text-[10px] font-bold uppercase mb-1">{sig.name}</div>
                   <img src={sig.dataUrl} className="h-12 object-contain mx-auto" />
                   <button onClick={() => deleteSignature(sig.id)} className="absolute top-1 right-1 p-1 text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={12}/></button>
                </div>
              ))}
            </div>
         </div>
      </div>

      {/* Direita: Editor */}
      <div className="flex-1 win95-raised p-4 flex flex-col bg-win95-bg overflow-y-auto">
        <h3 className="text-sm font-black uppercase mb-4 border-b border-white pb-2 flex items-center gap-2">
          <Upload size={16} /> Nova Assinatura
        </h3>

        {!originalImage ? (
          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-400 rounded p-8">
            <p className="text-sm font-bold mb-4">Tire uma foto da sua assinatura em papel branco e envie.</p>
            <label className="win95-btn px-4 py-2 cursor-pointer flex items-center gap-2">
              <Upload size={16} /> Selecionar Imagem
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </label>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex gap-4 items-start h-40">
               <div className="flex-1 h-full flex flex-col">
                 <div className="text-[10px] font-bold uppercase mb-1">Original:</div>
                 <div className="flex-1 win95-sunken bg-gray-500 flex items-center justify-center overflow-hidden">
                    <img src={originalImage} className="max-h-full max-w-full object-contain" />
                 </div>
               </div>
               <div className="flex-1 h-full flex flex-col">
                 <div className="text-[10px] font-bold uppercase mb-1">Resultado (Transparente):</div>
                 <div className="flex-1 win95-sunken bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAHElEQVQYR2NkYGAwYcAAf4GEQUWjCkamwyg3EgB2Hh0B/qj6SAAAAABJRU5ErkJggg==')] flex items-center justify-center overflow-hidden">
                    {processedImage ? <img src={processedImage} className="max-h-full max-w-full object-contain" /> : <Loader2 className="animate-spin"/>}
                 </div>
               </div>
            </div>

            <div className="win95-raised p-4 bg-[#e0e0e0] grid grid-cols-2 gap-4">
               <div>
                 <label className="text-[10px] font-bold block mb-1 flex justify-between">
                   <span>Limiar de Fundo (Corte do Branco)</span>
                   <span>{threshold}</span>
                 </label>
                 <input 
                   type="range" 
                   min="100" 
                   max="255" 
                   value={threshold} 
                   onChange={e => setThreshold(Number(e.target.value))}
                   className="w-full cursor-pointer accent-win95-blue"
                 />
                 <p className="text-[9px] mt-1 text-gray-600">Aumente se o fundo ainda aparecer. Diminua se a assinatura estiver sumindo.</p>
               </div>
               
               <div>
                 <label className="text-[10px] font-bold block mb-1 flex justify-between">
                   <span>Reforço de Tinta (Contraste)</span>
                   <span>{contrast.toFixed(1)}x</span>
                 </label>
                 <input 
                   type="range" 
                   min="1" 
                   max="3" 
                   step="0.1"
                   value={contrast} 
                   onChange={e => setContrast(Number(e.target.value))}
                   className="w-full cursor-pointer accent-win95-blue"
                 />
                 <p className="text-[9px] mt-1 text-gray-600">Aumente para deixar a tinta mais escura e nítida.</p>
               </div>
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="flex gap-2 items-end pt-4 border-t border-white mt-auto">
               <div className="flex-1">
                 <label className="text-[10px] font-bold uppercase block mb-1">Nome da Assinatura:</label>
                 <input className="w-full win95-sunken px-2 py-1" placeholder="Ex: Assinatura Formal" value={name} onChange={e => setName(e.target.value)} />
               </div>
               <Button onClick={() => setOriginalImage(null)} variant="danger">CANCELAR</Button>
               <Button onClick={saveSignature} icon={<Save size={14} />}>SALVAR ASSINATURA</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- SUB-COMPONENTE: ASSINADOR DE PDF ---
const DocumentSigner: React.FC<{ signatures: Signature[] }> = ({ signatures }) => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null); // PDFJS Document Proxy
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  
  const [selectedSig, setSelectedSig] = useState<Signature | null>(null);
  const [sigAspectRatio, setSigAspectRatio] = useState(1); // Ratio Width/Height

  // Posição visual da assinatura sobre o canvas
  const [sigPos, setSigPos] = useState({ x: 50, y: 50 });
  const [sigWidth, setSigWidth] = useState(150); // Controlamos apenas a largura, altura é calculada pelo ratio
  const [isDragging, setIsDragging] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Carregar PDF
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfFile(file);
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    setPdfDoc(pdf);
    setNumPages(pdf.numPages);
    setCurrentPage(1);
  };

  // Quando seleciona uma assinatura, calcula o aspect ratio dela
  const handleSelectSig = (sig: Signature) => {
    setSelectedSig(sig);
    const img = new Image();
    img.onload = () => {
      setSigAspectRatio(img.width / img.height);
      setSigWidth(150); // Reset width to default
    };
    img.src = sig.dataUrl;
  };

  // Renderizar Página
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    
    const renderPage = async () => {
      const page = await pdfDoc.getPage(currentPage);
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current!;
      const context = canvas.getContext('2d')!;
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: context, viewport }).promise;
    };
    renderPage();
  }, [pdfDoc, currentPage, scale]);

  // Drag and Drop Logic Simples
  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
  };

  const handleDragMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currentHeight = sigWidth / sigAspectRatio;
    const x = e.clientX - rect.left - (sigWidth / 2); // Centraliza no mouse
    const y = e.clientY - rect.top - (currentHeight / 2);
    setSigPos({ x, y });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const saveSignedPdf = async () => {
    if (!pdfFile || !selectedSig) return;

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfDocLib = await PDFDocument.load(arrayBuffer);
      
      // Embed assinatura
      const sigImageBytes = await fetch(selectedSig.dataUrl).then(res => res.arrayBuffer());
      const sigImage = await pdfDocLib.embedPng(sigImageBytes);
      
      // Get page
      const page = pdfDocLib.getPage(currentPage - 1);
      const { width, height } = page.getSize();
      
      // Converter coordenadas do Canvas para PDF
      const currentSigHeight = sigWidth / sigAspectRatio;

      const xPercent = sigPos.x / canvasRef.current!.width;
      const yPercent = sigPos.y / canvasRef.current!.height;
      const wPercent = sigWidth / canvasRef.current!.width;
      const hPercent = currentSigHeight / canvasRef.current!.height;

      // PDF Lib Coordinates: (0,0) is bottom left
      const x = xPercent * width;
      // Invert Y axis
      const y = height - (yPercent * height) - (hPercent * height);
      
      const sigW = wPercent * width;
      const sigH = hPercent * height;

      page.drawImage(sigImage, {
        x,
        y,
        width: sigW,
        height: sigH,
      });

      const pdfBytes = await pdfDocLib.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `assinado_${pdfFile.name}`;
      link.click();

    } catch (e) {
      console.error(e);
      alert("Erro ao salvar PDF. Tente novamente.");
    }
  };

  return (
    <div className="h-full flex gap-4">
      {/* Esquerda: Controles */}
      <div className="w-64 flex flex-col gap-4">
        {!pdfFile ? (
           <div className="win95-raised p-4 bg-white text-center">
              <Upload size={32} className="mx-auto mb-2 text-gray-400"/>
              <p className="text-xs font-bold mb-2">Carregar PDF</p>
              <input type="file" accept=".pdf" onChange={handlePdfUpload} />
           </div>
        ) : (
          <>
            <div className="win95-raised p-2 bg-win95-bg">
               <h3 className="text-[10px] font-bold uppercase mb-2">Navegação</h3>
               <div className="flex justify-between items-center mb-2">
                  <Button size="sm" onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage <= 1}>Ant</Button>
                  <span className="text-xs font-bold">{currentPage} / {numPages}</span>
                  <Button size="sm" onClick={() => setCurrentPage(p => Math.min(numPages, p+1))} disabled={currentPage >= numPages}>Próx</Button>
               </div>
               <div className="flex justify-between items-center">
                  <Button size="sm" onClick={() => setScale(s => Math.max(0.5, s-0.1))}><ZoomOut size={12}/></Button>
                  <span className="text-xs font-mono">{(scale * 100).toFixed(0)}%</span>
                  <Button size="sm" onClick={() => setScale(s => Math.min(2, s+0.1))}><ZoomIn size={12}/></Button>
               </div>
            </div>

            <div className="win95-raised p-2 bg-win95-bg flex-1 flex flex-col">
               <h3 className="text-[10px] font-bold uppercase mb-2">1. Escolha a Assinatura</h3>
               <div className="flex-1 overflow-y-auto win95-sunken bg-white p-1 space-y-2 max-h-48 mb-2">
                 {signatures.map(sig => (
                   <div 
                      key={sig.id} 
                      onClick={() => handleSelectSig(sig)}
                      className={`p-1 border cursor-pointer hover:bg-blue-50 ${selectedSig?.id === sig.id ? 'bg-blue-100 border-blue-500' : 'border-transparent'}`}
                   >
                     <img src={sig.dataUrl} className="h-8 object-contain mx-auto" />
                   </div>
                 ))}
               </div>
               
               <h3 className="text-[10px] font-bold uppercase mb-2 mt-2 flex justify-between">
                 <span>2. Ajuste o Tamanho</span>
                 <span>{sigWidth}px</span>
               </h3>
               <input 
                 type="range" min="50" max="800" 
                 value={sigWidth} 
                 onChange={(e) => setSigWidth(Number(e.target.value))} 
                 className="w-full"
               />

               <div className="mt-auto pt-4">
                 <Button onClick={saveSignedPdf} disabled={!selectedSig} className="w-full h-10 font-bold" icon={<Download size={16}/>}>
                    BAIXAR PDF ASSINADO
                 </Button>
               </div>
            </div>
          </>
        )}
      </div>

      {/* Direita: Visualização */}
      <div className="flex-1 win95-sunken bg-gray-500 overflow-auto flex items-center justify-center p-4 relative" 
           onMouseMove={handleDragMove} 
           onMouseUp={handleDragEnd}
           onMouseLeave={handleDragEnd}
      >
         {pdfFile ? (
           <div 
             ref={containerRef} 
             className="relative shadow-2xl" 
             style={{ width: canvasRef.current?.width, height: canvasRef.current?.height }}
           >
             <canvas ref={canvasRef} className="block bg-white" />
             
             {selectedSig && (
               <div 
                 onMouseDown={handleDragStart}
                 style={{ 
                   position: 'absolute', 
                   left: sigPos.x, 
                   top: sigPos.y,
                   width: sigWidth,
                   height: sigWidth / sigAspectRatio, // Mantém proporção
                   cursor: isDragging ? 'grabbing' : 'grab',
                   border: '1px dashed blue'
                 }}
                 className="group"
               >
                 <img src={selectedSig.dataUrl} className="w-full h-full object-fill pointer-events-none" />
                 <div className="absolute -top-3 -right-3 bg-blue-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                   <Move size={10} />
                 </div>
               </div>
             )}
           </div>
         ) : (
           <div className="text-white text-center opacity-50">
             <FileCheck size={64} className="mx-auto mb-2" />
             <p>Nenhum documento carregado.</p>
           </div>
         )}
      </div>
    </div>
  );
};
