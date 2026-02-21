
import React, { useState, useRef, useEffect } from 'react';
import { PenTool, Upload, Eraser, Save, FileCheck, Trash2, Download, MousePointer2, Move, ZoomIn, ZoomOut, Loader2, Sliders, Calendar, Type, Stamp } from 'lucide-react';
import { Button } from './ui/Button';
import { Signature, UserEvent } from '../types';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { getDocument, GlobalWorkerOptions, version } from 'pdfjs-dist';

// Configuração do worker com importação nomeada para evitar erros de build
GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;

interface SignatureManagerProps {
  signatures: Signature[];
  onChange: (signatures: Signature[]) => void;
  onAddEvent: (event: UserEvent) => void;
}

export const SignatureManager: React.FC<SignatureManagerProps> = ({ signatures = [], onChange, onAddEvent }) => {
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
        {activeTab === 'manage' && <SignatureCreator signatures={signatures} onChange={onChange} onAddEvent={onAddEvent} />}
        {activeTab === 'sign' && <DocumentSigner signatures={signatures} onAddEvent={onAddEvent} />}
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

  useEffect(() => {
    if (!originalImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
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
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

        if (luminance > threshold) {
          data[i + 3] = 0; 
        } else {
          const booster = contrast; 
          data[i] = Math.max(0, r / booster);
          data[i + 1] = Math.max(0, g / booster);
          data[i + 2] = Math.max(0, b / booster);
          data[i + 3] = 255;
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
const DocumentSigner: React.FC<{ signatures: Signature[], onAddEvent: (event: UserEvent) => void }> = ({ signatures, onAddEvent }) => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null); // PDFJS Document Proxy
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [selectedSig, setSelectedSig] = useState<Signature | null>(null);
  const [sigAspectRatio, setSigAspectRatio] = useState(1); 
  const [sigPos, setSigPos] = useState({ x: 50, y: 50 });
  const [sigWidth, setSigWidth] = useState(150);
  const [addDate, setAddDate] = useState(false);
  const [dateText, setDateText] = useState(new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}));
  const [isDragging, setIsDragging] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfFile(file);
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    setPdfDoc(pdf);
    setNumPages(pdf.numPages);
    setCurrentPage(1);
  };

  const handleSelectSig = (sig: Signature) => {
    setSelectedSig(sig);
    const img = new Image();
    img.onload = () => {
      setSigAspectRatio(img.width / img.height);
      setSigWidth(150);
    };
    img.src = sig.dataUrl;
  };

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

  const handleDragStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const h = sigWidth / sigAspectRatio;
    setSigPos({ x: x - (sigWidth/2), y: y - (h/2) });
  };

  const handleDragEnd = () => setIsDragging(false);

  const saveSignedPdf = async () => {
    if (!pdfFile || !selectedSig) return alert("Selecione uma assinatura.");

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfDocLib = await PDFDocument.load(arrayBuffer);
      const page = pdfDocLib.getPage(currentPage - 1);
      const { width, height } = page.getSize();
      
      const pdfW = width;
      const pdfH = height;
      const canvasW = canvasRef.current!.width;
      const canvasH = canvasRef.current!.height;
      
      const scaleX = pdfW / canvasW;
      const scaleY = pdfH / canvasH;

      const sigImageBytes = await fetch(selectedSig.dataUrl).then(res => res.arrayBuffer());
      const sigImage = await pdfDocLib.embedPng(sigImageBytes);
      
      const currentSigHeight = sigWidth / sigAspectRatio;
      const x = sigPos.x * scaleX;
      const yImage = pdfH - (sigPos.y * scaleY) - (currentSigHeight * scaleY);
      
      page.drawImage(sigImage, {
        x,
        y: yImage,
        width: sigWidth * scaleX,
        height: currentSigHeight * scaleY,
      });

      if (addDate) {
         const courierFont = await pdfDocLib.embedFont(StandardFonts.Courier);
         const fontSizePdf = 10 * scaleY;
         const lineHeight = fontSizePdf * 1.2;
         const yTextStart = yImage - lineHeight - (2 * scaleY); 
         const textLines = [`Assinado digitalmente por: ${selectedSig.name.toUpperCase()}`, `Data: ${dateText}`];

         textLines.forEach((line, index) => {
            page.drawText(line, {
                x: x,
                y: yTextStart - (index * lineHeight),
                size: fontSizePdf,
                font: courierFont,
                color: rgb(0.3, 0.3, 0.3),
            });
         });
      }

      const pdfBytes = await pdfDocLib.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `assinado_${pdfFile.name}`;
      link.click();

      const now = new Date();
      onAddEvent({
        id: `sign_${Date.now()}`,
        date: now.toISOString().split('T')[0],
        title: `Assinou: ${pdfFile.name}`,
        type: 'meeting',
        description: `Documento assinado digitalmente às ${now.toLocaleTimeString()} com identificação: ${selectedSig.name}`
      });

      alert("Documento assinado e carimbado com sucesso!");

    } catch (e) {
      console.error(e);
      alert("Erro ao salvar PDF. Tente novamente.");
    }
  };

  return (
    <div className="h-full flex gap-4">
      <div className="w-72 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2">
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

            <div className="win95-raised p-2 bg-win95-bg flex flex-col">
               <h3 className="text-[10px] font-bold uppercase mb-2 flex items-center gap-1">
                 <PenTool size={12}/> 1. Escolha a Assinatura
               </h3>
               <div className="flex-1 overflow-y-auto win95-sunken bg-white p-1 space-y-2 max-h-32 mb-2">
                 {signatures.length === 0 && <div className="text-[10px] text-gray-400 text-center p-2">Sem assinaturas salvas</div>}
                 {signatures.map(sig => (
                   <div key={sig.id} onClick={() => handleSelectSig(sig)} className={`p-1 border cursor-pointer hover:bg-blue-50 ${selectedSig?.id === sig.id ? 'bg-blue-100 border-blue-500' : 'border-transparent'}`}>
                     <img src={sig.dataUrl} className="h-8 object-contain mx-auto" />
                   </div>
                 ))}
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-[9px] font-bold uppercase">Tamanho: {sigWidth}px</span>
                 <input type="range" min="50" max="600" value={sigWidth} onChange={(e) => setSigWidth(Number(e.target.value))} className="w-24 h-4"/>
               </div>
            </div>

            <div className="win95-raised p-2 bg-win95-bg flex flex-col">
               <div className="flex items-center gap-2 mb-2 border-b border-white pb-1">
                 <input type="checkbox" checked={addDate} onChange={e => setAddDate(e.target.checked)} id="chkDate" />
                 <label htmlFor="chkDate" className="text-[10px] font-bold uppercase flex items-center gap-1 cursor-pointer">
                   <Stamp size={12}/> 2. Adicionar Carimbo Digital
                 </label>
               </div>
               {addDate && (
                 <div className="space-y-2 animate-in slide-in-from-top-2">
                    <label className="text-[9px] font-bold block">Texto da Data:</label>
                    <input type="text" className="w-full win95-sunken px-1 py-0.5 text-xs font-mono" value={dateText} onChange={e => setDateText(e.target.value)} />
                 </div>
               )}
            </div>

            <div className="mt-auto">
                 <Button onClick={saveSignedPdf} disabled={!selectedSig} className="w-full h-12 font-bold" icon={<Download size={16}/>}>BAIXAR PDF</Button>
            </div>
          </>
        )}
      </div>

      <div className="flex-1 win95-sunken bg-gray-500 overflow-auto flex items-center justify-center p-4 relative" onMouseMove={handleDragMove} onMouseUp={handleDragEnd} onMouseLeave={handleDragEnd}>
         {pdfFile ? (
           <div ref={containerRef} className="relative shadow-2xl" style={{ width: canvasRef.current?.width, height: canvasRef.current?.height }}>
             <canvas ref={canvasRef} className="block bg-white" />
             {selectedSig && (
               <div onMouseDown={handleDragStart} style={{ position: 'absolute', left: sigPos.x, top: sigPos.y, width: sigWidth, cursor: isDragging ? 'grabbing' : 'grab', border: '1px dashed rgba(0,0,255,0.3)' }} className="group flex flex-col">
                 <img src={selectedSig.dataUrl} style={{ width: '100%', height: sigWidth / sigAspectRatio, pointerEvents: 'none' }} />
                 {addDate && (
                   <div className="mt-1 font-mono text-[10px] text-gray-600 leading-tight border-t border-gray-400 pt-1 select-none pointer-events-none">
                      <div className="font-bold">Assinado digitalmente por:</div>
                      <div className="uppercase">{selectedSig.name}</div>
                      <div>Data: {dateText}</div>
                   </div>
                 )}
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
