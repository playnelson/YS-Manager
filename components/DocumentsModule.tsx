
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { FolderOpen, FileText, PenTool, Upload, Download, Trash2, File, AlertCircle, HardDrive, Folder, FolderPlus, ArrowRightLeft, Edit2, Check, X, CornerDownRight } from 'lucide-react';
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
  
  // Estado para pastas temporárias (criadas mas ainda vazias)
  const [tempFolders, setTempFolders] = useState<string[]>([]);
  
  // Estados de Edição de Pasta
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Estado do Modal de Mover
  const [fileToMove, setFileToMove] = useState<StoredFile | null>(null);

  // Consolida pastas (existentes nos arquivos + temporárias criadas)
  const categories = useMemo(() => {
    const cats = new Set<string>();
    files.forEach(f => cats.add(f.category || 'Geral'));
    tempFolders.forEach(t => cats.add(t));
    
    // Remove 'Geral' explicitamente para não aparecer na lista, mantendo apenas 'Todos' e as personalizadas
    cats.delete('Geral');
    const sorted = Array.from(cats).sort();
    return ['Todos', ...sorted];
  }, [files, tempFolders]);

  const filteredFiles = useMemo(() => {
    if (activeCategory === 'Todos') return files;
    return files.filter(f => (f.category || 'Geral') === activeCategory);
  }, [files, activeCategory]);

  // --- AÇÕES DE ARQUIVO ---

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > 500 * 1024) {
      alert("Limite de 500KB excedido.");
      return;
    }

    setIsUploading(true);
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      // Define a categoria baseada na pasta aberta. Se for "Todos", vai para "Geral" (interno).
      const targetCat = activeCategory === 'Todos' ? 'Geral' : activeCategory;

      const newFile: StoredFile = {
        id: `file_${Date.now()}`,
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size,
        data: base64,
        uploadedAt: new Date().toISOString(),
        category: targetCat
      };
      
      onChange([newFile, ...files]);
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDeleteFile = (id: string) => {
    if (confirm("Excluir arquivo permanentemente?")) {
      onChange(files.filter(f => f.id !== id));
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

  // --- AÇÕES DE PASTA ---

  const handleCreateFolder = () => {
    const name = prompt("Nome da Nova Pasta:");
    if (name && name.trim()) {
      const cleanName = name.trim();
      if (!categories.includes(cleanName) && cleanName !== 'Geral') {
        setTempFolders(prev => [...prev, cleanName]);
        setActiveCategory(cleanName); // Já abre a pasta nova
      } else {
        alert("Esta pasta já existe ou nome inválido.");
      }
    }
  };

  const startRenameCategory = (cat: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCategory(cat);
    setEditName(cat);
  };

  const saveRenameCategory = () => {
    if (!editingCategory || !editName.trim()) return;
    const newName = editName.trim();
    
    if (newName !== editingCategory) {
        // Atualiza todos os arquivos
        const updatedFiles = files.map(f => (f.category === editingCategory ? { ...f, category: newName } : f));
        onChange(updatedFiles);
        
        // Atualiza temp folders se necessário
        if (tempFolders.includes(editingCategory)) {
            setTempFolders(prev => prev.map(t => t === editingCategory ? newName : t));
        }

        if (activeCategory === editingCategory) setActiveCategory(newName);
    }
    setEditingCategory(null);
  };

  const deleteCategory = (cat: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Atenção: Excluir a pasta "${cat}" moverá todos os arquivos para a pasta "Geral". Deseja continuar?`)) {
        const updatedFiles = files.map(f => (f.category === cat ? { ...f, category: 'Geral' } : f));
        onChange(updatedFiles);
        setTempFolders(prev => prev.filter(t => t !== cat));
        if (activeCategory === cat) setActiveCategory('Todos');
    }
  };

  const handleMoveFileConfirm = (targetCategory: string) => {
    if (fileToMove) {
        onChange(files.map(f => f.id === fileToMove.id ? { ...f, category: targetCategory } : f));
        setFileToMove(null);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    return (bytes / 1024).toFixed(1) + ' KB';
  };

  return (
    <div className="h-full flex flex-col relative">
      {/* Header / Toolbar */}
      <div className="flex justify-between items-center bg-[#000080] text-white p-2 shrink-0">
         <div className="flex items-center gap-2 text-xs font-bold uppercase">
            <FolderOpen size={16} /> Arquivo Digital Pessoal
         </div>
         <div className="text-[10px] opacity-70">
            {files.length} Arqs • {categories.length - 1} Pastas
         </div>
      </div>

      <div className="win95-raised p-2 bg-[#d0d0d0] flex items-center justify-between shrink-0">
         <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleCreateFolder} icon={<FolderPlus size={14}/>}>
               NOVA PASTA
            </Button>
            <div className="text-[10px] font-bold text-[#555] flex items-center gap-1 bg-white px-2 py-1 border border-gray-400">
                <AlertCircle size={12} className="text-blue-600"/> 
                Limite: 500KB/arq
            </div>
         </div>
         
         <div>
            <input type="file" className="hidden" ref={fileInputRef} onChange={handleUpload} />
            <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading} icon={<Upload size={14}/>}>
               {isUploading ? 'SALVANDO...' : `UPLOAD EM "${activeCategory.toUpperCase()}"`}
            </Button>
         </div>
      </div>

      {/* Main Content: Split View */}
      <div className="flex-1 flex overflow-hidden p-1 gap-1">
        
        {/* Sidebar: Categories Tree */}
        <div className="w-56 win95-raised bg-win95-bg flex flex-col shrink-0">
            <div className="p-1 bg-[#000080] text-white text-[10px] font-bold uppercase mb-1 flex justify-between items-center">
                <span>Diretório</span>
            </div>
            <div className="flex-1 win95-sunken bg-white overflow-y-auto p-1">
                {categories.map(cat => {
                    const isEditing = editingCategory === cat;
                    const isSystem = cat === 'Todos';
                    
                    return (
                        <div 
                            key={cat}
                            onClick={() => !isEditing && setActiveCategory(cat)}
                            className={`flex items-center justify-between px-2 py-1.5 cursor-pointer mb-0.5 text-xs group ${activeCategory === cat && !isEditing ? 'bg-[#000080] text-white' : 'hover:bg-gray-100 text-black'}`}
                        >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Folder size={14} className={activeCategory === cat ? 'text-yellow-300 fill-yellow-300' : 'text-yellow-500 fill-yellow-500'} />
                                
                                {isEditing ? (
                                    <div className="flex items-center gap-1 flex-1" onClick={e => e.stopPropagation()}>
                                        <input 
                                            className="w-full text-xs p-0.5 border border-black text-black"
                                            value={editName}
                                            onChange={e => setEditName(e.target.value)}
                                            autoFocus
                                            onKeyDown={e => e.key === 'Enter' && saveRenameCategory()}
                                        />
                                        <button onClick={saveRenameCategory} className="text-green-600 hover:bg-green-100 p-0.5"><Check size={12}/></button>
                                        <button onClick={() => setEditingCategory(null)} className="text-red-600 hover:bg-red-100 p-0.5"><X size={12}/></button>
                                    </div>
                                ) : (
                                    <span className="truncate font-bold">{cat}</span>
                                )}
                            </div>

                            {/* Action Buttons (Only for non-system and not-editing) */}
                            {!isSystem && !isEditing && (
                                <div className={`flex gap-1 ${activeCategory === cat ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                    <button 
                                        onClick={(e) => startRenameCategory(cat, e)}
                                        className={`p-0.5 rounded ${activeCategory === cat ? 'hover:bg-white/20 text-white' : 'hover:bg-gray-200 text-gray-500'}`}
                                        title="Renomear"
                                    >
                                        <Edit2 size={10} />
                                    </button>
                                    <button 
                                        onClick={(e) => deleteCategory(cat, e)}
                                        className={`p-0.5 rounded ${activeCategory === cat ? 'hover:bg-red-500 text-white' : 'hover:bg-red-100 text-red-500'}`}
                                        title="Excluir Pasta"
                                    >
                                        <Trash2 size={10} />
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>

        {/* File List */}
        <div className="flex-1 win95-sunken bg-white overflow-y-auto custom-scrollbar flex flex-col">
            {/* Breadcrumb simples */}
            <div className="bg-gray-100 border-b border-gray-300 px-2 py-1 text-[10px] text-gray-500 font-mono flex items-center gap-1">
                <HardDrive size={10} /> C:\Brain\Arquivos\{activeCategory}
            </div>

            {filteredFiles.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center opacity-30 text-[#808080]">
                    <div className="w-16 h-16 border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center mb-2">
                        <FolderOpen size={32} />
                    </div>
                    <p className="mt-2 text-xs font-bold uppercase">Pasta Vazia</p>
                    <p className="text-[10px]">Arraste arquivos ou use o botão Upload</p>
                </div>
            ) : (
                <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-100 sticky top-0 font-bold uppercase border-b border-gray-300 z-10">
                    <tr>
                        <th className="p-2 border-r w-8">Type</th>
                        <th className="p-2 border-r">Nome do Arquivo</th>
                        <th className="p-2 border-r w-24">Data</th>
                        <th className="p-2 border-r w-20">Tam.</th>
                        <th className="p-2 text-right w-24">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filteredFiles.map(file => (
                        <tr key={file.id} className="hover:bg-blue-50 group">
                            <td className="p-2 text-center">
                                <File size={14} className="text-blue-600 mx-auto" />
                            </td>
                            <td className="p-2 font-bold">
                                <div className="flex flex-col min-w-0">
                                    <span className="truncate max-w-[200px] md:max-w-[300px]" title={file.name}>{file.name}</span>
                                    {activeCategory === 'Todos' && (
                                        <div className="flex items-center gap-1 text-[9px] text-gray-400 font-normal">
                                            <CornerDownRight size={8} /> {file.category || 'Geral'}
                                        </div>
                                    )}
                                </div>
                            </td>
                            <td className="p-2 text-[#555]">{new Date(file.uploadedAt).toLocaleDateString()}</td>
                            <td className="p-2 font-mono text-[#555]">{formatSize(file.size)}</td>
                            <td className="p-2 text-right">
                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setFileToMove(file)} className="p-1 win95-raised hover:bg-white text-gray-700" title="Mover para outra pasta">
                                        <ArrowRightLeft size={12} />
                                    </button>
                                    <button onClick={() => handleDownload(file)} className="p-1 win95-raised hover:bg-white text-blue-700" title="Baixar">
                                        <Download size={12} />
                                    </button>
                                    <button onClick={() => handleDeleteFile(file.id)} className="p-1 win95-raised hover:bg-white text-red-600" title="Excluir">
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

      {/* MODAL DE MOVER ARQUIVO */}
      {fileToMove && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
            <div className="bg-win95-bg w-72 win95-raised p-1 shadow-2xl">
                <div className="bg-win95-blue text-white px-2 py-1 text-xs font-bold flex justify-between items-center mb-2">
                    <span className="flex items-center gap-2"><ArrowRightLeft size={12}/> Mover Arquivo</span>
                    <button onClick={() => setFileToMove(null)} className="win95-raised bg-win95-bg text-black w-4 h-4 flex items-center justify-center text-[10px] font-bold">×</button>
                </div>
                <div className="p-2">
                    <p className="text-[10px] mb-2 truncate font-bold">Arquivo: {fileToMove.name}</p>
                    <p className="text-[10px] mb-1">Selecione o destino:</p>
                    <div className="max-h-40 overflow-y-auto win95-sunken bg-white p-1 mb-2">
                        {categories.filter(c => c !== 'Todos').map(cat => (
                            <button
                                key={cat}
                                onClick={() => handleMoveFileConfirm(cat)}
                                className={`w-full text-left px-2 py-1 text-xs flex items-center gap-2 hover:bg-blue-100 ${fileToMove.category === cat ? 'font-bold bg-gray-100 text-gray-500 cursor-default' : ''}`}
                                disabled={fileToMove.category === cat}
                            >
                                <Folder size={12} className={fileToMove.category === cat ? 'text-gray-400' : 'text-yellow-500 fill-yellow-500'} />
                                {cat} {fileToMove.category === cat && '(Atual)'}
                            </button>
                        ))}
                    </div>
                    <div className="flex justify-end">
                        <Button size="sm" onClick={() => setFileToMove(null)}>Cancelar</Button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
