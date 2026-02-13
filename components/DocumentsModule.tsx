
import React, { useState, useRef, useMemo } from 'react';
import { FolderOpen, FileText, PenTool, Upload, Download, Trash2, File, AlertCircle, HardDrive, Folder, FolderPlus, ArrowRightLeft } from 'lucide-react';
import { Button } from './ui/Button';
import { StoredFile, Signature, UserEvent } from '../types';
import { DocumentGenerator } from './DocumentGenerator';
import { SignatureManager } from './SignatureManager';

interface DocumentsModuleProps {
  personalFiles: StoredFile[];
  onFilesChange: (files: StoredFile[]) => void;
  signatures: Signature[];
  onSignatureChange: (signatures: Signature[]) => void;
  onAddEvent: (event: UserEvent) => void;
}

export const DocumentsModule: React.FC<DocumentsModuleProps> = ({
  personalFiles = [],
  onFilesChange,
  signatures,
  onSignatureChange,
  onAddEvent
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'myfiles' | 'generator' | 'signer'>('myfiles');

  return (
    <div className="h-full flex flex-col gap-2">
      {/* Sub-navegação interna */}
      <div className="flex gap-2 shrink-0 border-b border-white pb-1 overflow-x-auto">
        <Button 
          onClick={() => setActiveSubTab('myfiles')} 
          className={activeSubTab === 'myfiles' ? 'bg-white win95-sunken' : ''}
          icon={<HardDrive size={14} />}
        >
          Meus Arquivos
        </Button>
        <Button 
          onClick={() => setActiveSubTab('generator')} 
          className={activeSubTab === 'generator' ? 'bg-white win95-sunken' : ''}
          icon={<FileText size={14} />}
        >
          Criador de Docs
        </Button>
        <Button 
          onClick={() => setActiveSubTab('signer')} 
          className={activeSubTab === 'signer' ? 'bg-white win95-sunken' : ''}
          icon={<PenTool size={14} />}
        >
          Assinador Digital
        </Button>
      </div>

      {/* Área de Conteúdo */}
      <div className="flex-1 win95-sunken bg-[#808080] p-0.5 overflow-hidden border-2 border-white border-t-[#808080] border-l-[#808080] border-r-white border-b-white">
        <div className="h-full w-full bg-win95-bg">
            {activeSubTab === 'myfiles' && (
                <PersonalFileManager files={personalFiles} onChange={onFilesChange} />
            )}
            {activeSubTab === 'generator' && (
                <DocumentGenerator />
            )}
            {activeSubTab === 'signer' && (
                <SignatureManager signatures={signatures} onChange={onSignatureChange} onAddEvent={onAddEvent} />
            )}
        </div>
      </div>
    </div>
  );
};

// --- SUB-COMPONENTE: GERENCIADOR DE ARQUIVOS PESSOAIS ---
const PersonalFileManager: React.FC<{ files: StoredFile[], onChange: (files: StoredFile[]) => void }> = ({ files, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [uploadCategory, setUploadCategory] = useState('');

  // Extrai categorias únicas dos arquivos existentes
  const categories = useMemo(() => {
    const cats = new Set<string>();
    files.forEach(f => cats.add(f.category || 'Geral'));
    return ['Todos', ...Array.from(cats).sort()];
  }, [files]);

  const filteredFiles = useMemo(() => {
    if (activeCategory === 'Todos') return files;
    return files.filter(f => (f.category || 'Geral') === activeCategory);
  }, [files, activeCategory]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Limite de 500KB
    if (selectedFile.size > 500 * 1024) {
      alert("Arquivo muito grande! O limite é de 500KB para garantir o desempenho.");
      return;
    }

    setIsUploading(true);
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      const finalCategory = uploadCategory.trim() || activeCategory === 'Todos' ? 'Geral' : activeCategory;

      const newFile: StoredFile = {
        id: `file_${Date.now()}`,
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size,
        data: base64,
        uploadedAt: new Date().toISOString(),
        category: finalCategory
      };
      
      onChange([newFile, ...files]);
      setIsUploading(false);
      setUploadCategory(''); // Limpa o input
      setActiveCategory(finalCategory); // Muda para a categoria do upload
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este arquivo permanentemente?")) {
      onChange(files.filter(f => f.id !== id));
    }
  };

  const handleMoveFile = (file: StoredFile) => {
    const newCat = prompt("Mover para qual categoria?", file.category || 'Geral');
    if (newCat && newCat !== file.category) {
        onChange(files.map(f => f.id === file.id ? { ...f, category: newCat } : f));
    }
  };

  const handleDownload = (file: StoredFile) => {
    const link = document.createElement('a');
    link.href = file.data;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    return (bytes / 1024).toFixed(1) + ' KB';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header / Toolbar */}
      <div className="flex justify-between items-center bg-[#000080] text-white p-2 shrink-0">
         <div className="flex items-center gap-2 text-xs font-bold uppercase">
            <FolderOpen size={16} /> Arquivo Digital Pessoal
         </div>
         <div className="text-[10px] opacity-70">
            {files.length} Itens
         </div>
      </div>

      <div className="win95-raised p-2 bg-[#d0d0d0] flex flex-col md:flex-row gap-2 items-center justify-between shrink-0">
         <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="text-[10px] font-bold text-[#555] flex items-center gap-1 bg-white px-2 py-1 border border-gray-400">
                <AlertCircle size={12} className="text-blue-600"/> 
                Limite: 500KB/arq.
            </div>
         </div>
         
         <div className="flex items-center gap-1 w-full md:w-auto">
            <div className="relative flex-1">
                <FolderPlus size={14} className="absolute left-2 top-1.5 text-gray-500"/>
                <input 
                    type="text" 
                    list="cat-options"
                    className="w-full md:w-48 pl-7 pr-2 py-1 win95-sunken text-xs outline-none"
                    placeholder="Pasta de Destino..."
                    value={uploadCategory}
                    onChange={e => setUploadCategory(e.target.value)}
                />
                <datalist id="cat-options">
                    {categories.filter(c => c !== 'Todos').map(c => <option key={c} value={c} />)}
                </datalist>
            </div>
            
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleUpload}
            />
            <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading} icon={<Upload size={14}/>}>
               {isUploading ? 'ENVIANDO...' : 'UPLOAD'}
            </Button>
         </div>
      </div>

      {/* Main Content: Split View */}
      <div className="flex-1 flex overflow-hidden p-1 gap-1">
        
        {/* Sidebar: Categories */}
        <div className="w-48 win95-raised bg-win95-bg flex flex-col shrink-0">
            <div className="p-1 bg-[#000080] text-white text-[10px] font-bold uppercase mb-1">Pastas</div>
            <div className="flex-1 win95-sunken bg-white overflow-y-auto p-1">
                {categories.map(cat => (
                    <div 
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer mb-0.5 text-xs group ${activeCategory === cat ? 'bg-[#000080] text-white' : 'hover:bg-gray-100 text-black'}`}
                    >
                        <Folder size={14} className={activeCategory === cat ? 'text-yellow-300 fill-yellow-300' : 'text-yellow-500 fill-yellow-500'} />
                        <span className="truncate font-bold">{cat}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* File List */}
        <div className="flex-1 win95-sunken bg-white overflow-y-auto custom-scrollbar">
            {filteredFiles.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30 text-[#808080]">
                <File size={48} strokeWidth={1} />
                <p className="mt-2 text-xs font-bold uppercase">Pasta Vazia</p>
                </div>
            ) : (
                <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-100 sticky top-0 font-bold uppercase border-b border-gray-300 z-10">
                    <tr>
                        <th className="p-2 border-r">Nome</th>
                        <th className="p-2 border-r w-24">Data</th>
                        <th className="p-2 border-r w-20">Tam.</th>
                        <th className="p-2 text-right w-28">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filteredFiles.map(file => (
                        <tr key={file.id} className="hover:bg-blue-50 group">
                            <td className="p-2 font-bold flex items-center gap-2">
                                <File size={14} className="text-blue-600" />
                                <div className="flex flex-col min-w-0">
                                    <span className="truncate max-w-[150px] md:max-w-[300px]" title={file.name}>{file.name}</span>
                                    {activeCategory === 'Todos' && (
                                        <span className="text-[9px] text-gray-400 font-normal">{file.category || 'Geral'}</span>
                                    )}
                                </div>
                            </td>
                            <td className="p-2 text-[#555]">{new Date(file.uploadedAt).toLocaleDateString()}</td>
                            <td className="p-2 font-mono text-[#555]">{formatSize(file.size)}</td>
                            <td className="p-2 text-right">
                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleMoveFile(file)} className="p-1 win95-raised hover:bg-white text-gray-700" title="Mover / Alterar Categoria">
                                        <ArrowRightLeft size={12} />
                                    </button>
                                    <button onClick={() => handleDownload(file)} className="p-1 win95-raised hover:bg-white text-blue-700" title="Baixar">
                                        <Download size={12} />
                                    </button>
                                    <button onClick={() => handleDelete(file.id)} className="p-1 win95-raised hover:bg-white text-red-600" title="Excluir">
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
                </table>
            )}
        </div>
      </div>
    </div>
  );
};
