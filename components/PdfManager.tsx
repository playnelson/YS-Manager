
import React, { useState, useRef } from 'react';
import { FileUp, Scissors, Combine, Download, Trash2, ArrowUp, ArrowDown, FileText, Loader2, AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { PDFDocument } from 'pdf-lib';
import { getDocument, GlobalWorkerOptions, version } from 'pdfjs-dist';

// Configuração do worker usando CDN para garantir compatibilidade em build
GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;

interface PdfFile {
  id: string;
  file: File;
  name: string;
  size: number;
}

export const PdfManager: React.FC = () => {
  const [mode, setMode] = useState<'merge' | 'split'>('merge');
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [splitRange, setSplitRange] = useState('');
  const [splitTotalPages, setSplitTotalPages] = useState<number | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []) as File[];
    if (selectedFiles.length === 0) return;

    if (mode === 'split') {
      const file = selectedFiles[0];
      const pdfFile = { id: `pdf_${Date.now()}`, file, name: file.name, size: file.size };
      setFiles([pdfFile]);
      
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        setSplitTotalPages(pdf.getPageCount());
      } catch (err) {
        alert("Erro ao carregar PDF. Certifique-se de que o arquivo não está corrompido.");
        setFiles([]);
      }
    } else {
      const newFiles = selectedFiles.map(f => ({
        id: `pdf_${Math.random().toString(36).substr(2, 9)}`,
        file: f,
        name: f.name,
        size: f.size
      }));
      setFiles(prev => [...prev, ...newFiles]);
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    if (mode !== 'merge') setSplitTotalPages(null);
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    const newFiles = [...files];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newFiles.length) return;
    
    [newFiles[index], newFiles[targetIndex]] = [newFiles[targetIndex], newFiles[index]];
    setFiles(newFiles);
  };

  const handleMerge = async () => {
    if (files.length < 2) return alert("Adicione pelo menos 2 arquivos para mesclar.");
    setIsProcessing(true);
    try {
      const mergedPdf = await PDFDocument.create();
      for (const pdfItem of files) {
        const arrayBuffer = await pdfItem.file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }
      const pdfBytes = await mergedPdf.save();
      downloadBlob(pdfBytes, "documento_mesclado.pdf", 'application/pdf');
    } catch (err) {
      console.error(err);
      alert("Falha ao mesclar os arquivos.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSplit = async () => {
    if (files.length === 0 || !splitRange) return alert("Selecione um arquivo e defina as páginas.");
    setIsProcessing(true);
    try {
      const sourcePdfItem = files[0];
      const arrayBuffer = await sourcePdfItem.file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const totalPages = pdf.getPageCount();
      
      const pagesToKeep = parseRange(splitRange, totalPages);
      if (pagesToKeep.length === 0) throw new Error("Intervalo inválido.");

      const splitPdf = await PDFDocument.create();
      const copiedPages = await splitPdf.copyPages(pdf, pagesToKeep.map(p => p - 1));
      copiedPages.forEach((page) => splitPdf.addPage(page));
      
      const pdfBytes = await splitPdf.save();
      downloadBlob(pdfBytes, `extraido_${sourcePdfItem.name}`, 'application/pdf');
    } catch (err: any) {
      alert(err.message || "Erro ao dividir PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const parseRange = (rangeStr: string, maxPages: number): number[] => {
    const pages = new Set<number>();
    const parts = rangeStr.split(',').map(p => p.trim());
    
    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number);
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = Math.max(1, start); i <= Math.min(end, maxPages); i++) {
            pages.add(i);
          }
        }
      } else {
        const page = Number(part);
        if (!isNaN(page) && page >= 1 && page <= maxPages) {
          pages.add(page);
        }
      }
    }
    return Array.from(pages).sort((a, b) => a - b);
  };

  const downloadBlob = (bytes: Uint8Array, filename: string, type: string) => {
    const blob = new Blob([bytes as any], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  return (
    <div className="h-full flex flex-col bg-win95-bg p-2 gap-4">
      <div className="flex gap-2 shrink-0">
        <Button 
          onClick={() => { setMode('merge'); setFiles([]); setSplitTotalPages(null); }}
          className={`flex-1 h-10 ${mode === 'merge' ? 'bg-white win95-sunken' : ''}`}
          icon={<Combine size={16} />}
        >
          MESCLAR (UNIR)
        </Button>
        <Button 
          onClick={() => { setMode('split'); setFiles([]); setSplitTotalPages(null); }}
          className={`flex-1 h-10 ${mode === 'split' ? 'bg-white win95-sunken' : ''}`}
          icon={<Scissors size={16} />}
        >
          DIVIDIR (EXTRAIR)
        </Button>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        <div className="flex-1 flex flex-col win95-raised p-2 overflow-hidden">
          <div className="bg-win95-blue text-white px-2 py-1 text-xs font-bold uppercase flex justify-between items-center mb-2 shrink-0">
             <span className="flex items-center gap-2">
               <FileUp size={14} /> 
               {mode === 'merge' ? 'Fila de Arquivos' : 'Arquivo de Origem'}
             </span>
             <input 
               type="file" 
               accept=".pdf" 
               multiple={mode === 'merge'} 
               className="hidden" 
               ref={fileInputRef} 
               onChange={handleFileChange}
             />
             <Button size="sm" onClick={() => fileInputRef.current?.click()} className="bg-win95-bg text-black px-4">ADICIONAR</Button>
          </div>

          <div className="flex-1 win95-sunken bg-white overflow-y-auto p-1 custom-scrollbar">
            {files.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-30 text-center p-4">
                <FileText size={48} className="mb-2" />
                <p className="text-xs font-bold uppercase">Nenhum PDF selecionado</p>
                <p className="text-[10px]">Clique em Adicionar para começar</p>
              </div>
            ) : (
              <div className="space-y-1">
                {files.map((f, index) => (
                  <div key={f.id} className="flex items-center gap-2 p-2 border border-dotted border-win95-shadow hover:bg-blue-50 group">
                    <FileText size={16} className="text-win95-blue shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-bold truncate text-black uppercase">{f.name}</div>
                      <div className="text-[9px] text-[#666]">{formatSize(f.size)}</div>
                    </div>
                    {mode === 'merge' && (
                      <div className="flex gap-1">
                        <button onClick={() => moveFile(index, 'up')} className="win95-raised p-0.5"><ArrowUp size={10} /></button>
                        <button onClick={() => moveFile(index, 'down')} className="win95-raised p-0.5"><ArrowDown size={10} /></button>
                      </div>
                    )}
                    <button onClick={() => removeFile(f.id)} className="win95-raised p-1 text-red-600 hover:bg-red-50"><Trash2 size={12} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="w-80 flex flex-col win95-raised p-4 bg-[#d0d0d0] shrink-0">
          <h3 className="text-xs font-black uppercase mb-4 border-b border-win95-shadow pb-2">Configurações de Saída</h3>
          
          <div className="flex-1 space-y-6 overflow-y-auto pr-1 custom-scrollbar">
            {mode === 'split' && (
              <div className="space-y-3">
                <div className="win95-sunken p-2 bg-yellow-50 flex items-center gap-2">
                   <AlertCircle size={14} className="text-orange-600" />
                   <div className="text-[10px] font-bold">
                     TOTAL DE PÁGINAS: {splitTotalPages || '...'}
                   </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase block mb-1">Intervalo de Páginas:</label>
                  <input 
                    className="w-full win95-sunken p-2 text-xs outline-none bg-white font-mono" 
                    placeholder="Ex: 1-3, 5, 8-10"
                    value={splitRange}
                    onChange={e => setSplitRange(e.target.value)}
                  />
                  <p className="text-[9px] text-win95-shadow mt-1 italic">Use vírgulas para separar e hífens para intervalos.</p>
                </div>
              </div>
            )}

            {mode === 'merge' && (
              <div className="text-[10px] space-y-2">
                <p className="font-bold">Atenção:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Os arquivos serão unidos na ordem listada ao lado.</li>
                  <li>Use as setas para reorganizar se necessário.</li>
                  <li>Arquivos grandes podem levar alguns segundos.</li>
                </ul>
              </div>
            )}

            <div className="win95-sunken p-3 bg-white space-y-2">
               <div className="text-[9px] font-bold text-win95-shadow uppercase">Estado do Processador</div>
               <div className="flex items-center gap-2">
                 {isProcessing ? (
                   <>
                    <Loader2 size={14} className="animate-spin text-win95-blue" />
                    <span className="text-[10px] font-black text-win95-blue animate-pulse">PROCESSANDO...</span>
                   </>
                 ) : (
                   <span className="text-[10px] font-black text-green-700">PRONTO PARA EXECUTAR</span>
                 )}
               </div>
               <div className="w-full h-2 bg-[#e0e0e0] border border-win95-shadow overflow-hidden">
                 {isProcessing && <div className="h-full bg-win95-blue w-1/2 animate-[progress_1s_infinite_linear]" style={{backgroundSize: '20px 20px', backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)'}}></div>}
               </div>
            </div>
          </div>

          <Button 
            onClick={mode === 'merge' ? handleMerge : handleSplit}
            disabled={isProcessing || files.length === 0}
            className={`w-full h-12 text-sm font-black mt-4 ${isProcessing ? 'opacity-50' : 'bg-win95-blue text-white'}`}
            icon={<Download size={18} />}
          >
            {mode === 'merge' ? 'MESCLAR E BAIXAR' : 'EXTRAIR E BAIXAR'}
          </Button>
        </div>
      </div>

      <div className="bg-win95-bg border-t border-white p-1 text-[10px] font-bold text-win95-shadow uppercase flex justify-between italic shrink-0">
         <span>YS-PDF-ENGINE v1.1</span>
         <span>Privacidade Total: Processamento Local</span>
      </div>

      <style>{`
        @keyframes progress {
          from { background-position: 0 0; }
          to { background-position: 40px 0; }
        }
      `}</style>
    </div>
  );
};
