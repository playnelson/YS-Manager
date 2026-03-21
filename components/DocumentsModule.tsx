import { generateUUID } from '../uuid';
import React, { useState, useRef, useMemo } from 'react';
import { 
  FolderOpen, FileText, PenTool, Upload, Download, Trash2, 
  File, AlertCircle, HardDrive, Folder, FolderPlus, 
  ArrowRightLeft, Edit2, Check, X, CornerDownRight,
  Search, FileDown, Layers, Sparkles, Cloud, FileCheck
} from 'lucide-react';
import { Button } from './ui/Button';
import { StoredFile, Signature, UserEvent, User } from '../types';
import { DocumentGenerator } from './DocumentGenerator';
import { SharedDocumentsModule } from './SharedDocumentsModule';
import { SignatureManager } from './SignatureManager';

// --- Sub-Component: PersonalFileManager ---
export const PersonalFileManager: React.FC<{ 
  files: StoredFile[], 
  onChange: (files: StoredFile[]) => void,
  onSignFile?: (file: StoredFile) => void,
  isFullView?: boolean
}> = ({ files, onChange, onSignFile, isFullView = true }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['Todos']));
  const [tempFolders, setTempFolders] = useState<string[]>([]);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [fileToMove, setFileToMove] = useState<StoredFile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  interface FolderNode {
    name: string;
    path: string;
    children: FolderNode[];
  }

  const buildTree = (paths: string[]): FolderNode[] => {
    const root: FolderNode[] = [];
    paths.forEach(path => {
      if (!path || path === 'Geral' || path === 'Todos') return;
      const parts = path.split('/');
      let currentLevel = root;
      let currentPath = '';
      parts.forEach(part => {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        let node = currentLevel.find(n => n.name === part);
        if (!node) {
          node = { name: part, path: currentPath, children: [] };
          currentLevel.push(node);
        }
        currentLevel = node.children;
      });
    });
    return root;
  };

  const folderTree = useMemo(() => {
    const allPaths = new Set<string>();
    [...files.map(f => f.category), ...tempFolders].forEach(cat => {
      if (cat && cat !== 'Geral' && cat !== 'Todos') {
        const parts = cat.split('/');
        let p = '';
        parts.forEach(part => {
          p = p ? `${p}/${part}` : part;
          allPaths.add(p);
        });
      }
    });
    return buildTree(Array.from(allPaths).sort());
  }, [files, tempFolders]);

  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    files.forEach(f => cats.add(f.category || 'Geral'));
    tempFolders.forEach(t => cats.add(t));
    return Array.from(cats).sort();
  }, [files, tempFolders]);

  const filteredFiles = useMemo(() => {
    let result = files;
    if (activeCategory !== 'Todos') {
      result = files.filter(f => (f.category || 'Geral') === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(f => f.name.toLowerCase().includes(q) || (f.category || '').toLowerCase().includes(q));
    }
    return result;
  }, [files, activeCategory, searchQuery]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (!selectedFile || selectedFile.size > MAX_SIZE) {
      if (selectedFile) alert("Limite de 10MB excedido.");
      return;
    }
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      const targetCat = activeCategory === 'Todos' ? 'Geral' : activeCategory;
      const newFile: StoredFile = {
        id: generateUUID(),
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

  const handleCreateFolder = () => {
    const name = prompt("Nome da Nova Pasta:");
    if (!name?.trim()) return;
    const cleanName = name.trim();
    if (cleanName.includes('/')) { alert("O nome não pode conter '/'"); return; }
    
    const parentPath = activeCategory === 'Todos' || activeCategory === 'Geral' ? '' : activeCategory;
    const newPath = parentPath ? `${parentPath}/${cleanName}` : cleanName;

    if (!allCategories.includes(newPath)) {
      setTempFolders(prev => [...prev, newPath]);
      setActiveCategory(newPath);
      if (parentPath) setExpandedFolders(prev => new Set(prev).add(parentPath));
    } else {
      alert("Esta pasta já existe nesta localização.");
    }
  };

  const saveRenameCategory = () => {
    if (!editingCategory || !editName.trim()) return;
    const newName = editName.trim();
    const parts = editingCategory.split('/');
    parts[parts.length - 1] = newName;
    const newPath = parts.join('/');
    
    if (newPath !== editingCategory) {
        onChange(files.map(f => f.category === editingCategory ? { ...f, category: newPath } : f));
        setTempFolders(prev => prev.map(t => t === editingCategory ? newPath : t));
        if (activeCategory === editingCategory) setActiveCategory(newPath);
    }
    setEditingCategory(null);
  };

  const deleteCategory = (cat: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Excluir a pasta "${cat}" e mover arquivos para "Geral"?`)) {
        onChange(files.map(f => f.category?.startsWith(cat) ? { ...f, category: 'Geral' } : f));
        setTempFolders(prev => prev.filter(t => !t.startsWith(cat)));
        if (activeCategory.startsWith(cat)) setActiveCategory('Todos');
    }
  };

  const renderFolderTree = (nodes: FolderNode[], level = 0) => {
    return nodes.map(node => {
      const isExpanded = expandedFolders.has(node.path);
      const isActive = activeCategory === node.path;
      const isEditing = editingCategory === node.path;

      return (
        <div key={node.path} className="flex flex-col">
          <div 
            onClick={() => setActiveCategory(node.path)}
            className={`flex items-center justify-between px-2 py-1 cursor-pointer group text-xs ${isActive ? 'bg-[#000080] text-white' : 'hover:bg-gray-100 text-black'}`}
            style={{ paddingLeft: `${(level + 1) * 12}px` }}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <button 
                onClick={(e) => { e.stopPropagation(); setExpandedFolders(prev => {
                  const n = new Set(prev);
                  if (n.has(node.path)) n.delete(node.path); else n.add(node.path);
                  return n;
                })}}
                className={`p-0.5 hover:bg-black/10 rounded ${node.children.length === 0 ? 'invisible' : ''}`}
              >
                <CornerDownRight size={10} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              </button>
              <Folder size={14} className={isActive ? 'text-yellow-300 fill-yellow-300' : 'text-yellow-500 fill-yellow-500'} />
              {isEditing ? (
                <input 
                  className="bg-white text-black border border-black px-1 py-0 w-24" 
                  autoFocus 
                  value={editName} 
                  onChange={e => setEditName(e.target.value)}
                  onBlur={saveRenameCategory}
                  onKeyDown={e => e.key === 'Enter' && saveRenameCategory()}
                />
              ) : (
                <span className="truncate font-bold uppercase">{node.name}</span>
              )}
            </div>
            {!isEditing && (
              <div className={`flex gap-1 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <button onClick={(e) => { e.stopPropagation(); setEditingCategory(node.path); setEditName(node.name); }} className="hover:text-blue-400"><Edit2 size={10}/></button>
                <button onClick={(e) => deleteCategory(node.path, e)} className="hover:text-red-500"><Trash2 size={10}/></button>
              </div>
            )}
          </div>
          {isExpanded && node.children.length > 0 && renderFolderTree(node.children, level + 1)}
        </div>
      );
    });
  };

  const Breadcrumbs = () => {
    if (activeCategory === 'Todos') return null;
    const parts = activeCategory.split('/');
    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 border-b border-gray-200 text-[10px] text-gray-500 font-bold uppercase overflow-x-auto whitespace-nowrap">
        <button onClick={() => setActiveCategory('Todos')} className="hover:text-blue-600">RAIZ</button>
        {parts.map((p, i) => {
          const path = parts.slice(0, i + 1).join('/');
          return (
            <React.Fragment key={path}>
              <span className="opacity-30">/</span>
              <button onClick={() => setActiveCategory(path)} className="hover:text-blue-600">{p}</button>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col relative bg-win95-bg">
      <div className="flex justify-between items-center bg-[#000080] text-white p-2 shrink-0">
         <div className="flex items-center gap-2 text-xs font-bold uppercase">
            <FolderOpen size={16} /> Meus Arquivos Salvos
         </div>
         <div className="text-[10px] opacity-70 italic">Organização por Subpastas</div>
      </div>

      <div className="win95-raised p-2 bg-[#d0d0d0] flex items-center justify-between shrink-0">
         <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleCreateFolder} icon={<FolderPlus size={14}/>}>NOVA PASTA</Button>
            <div className="relative ml-2">
                <Search size={12} className="absolute left-2 top-2 text-gray-500" />
                <input 
                    className="win95-sunken bg-white text-[10px] pl-6 pr-2 py-1 w-40 outline-none font-bold uppercase"
                    placeholder="BUSCAR ARQUIVOS..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
            </div>
            <div className="text-[10px] font-bold text-[#555] flex items-center gap-1 bg-white px-2 py-1 border border-gray-400">
                <AlertCircle size={12} className="text-blue-600"/> Limite: 10MB
            </div>
         </div>
         <div>
            <input type="file" className="hidden" ref={fileInputRef} onChange={handleUpload} />
            <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading} icon={<Upload size={14}/>}>
               {isUploading ? 'ENVIANDO...' : `UPLOAD EM "${activeCategory.toUpperCase()}"`}
            </Button>
         </div>
      </div>

      <div className="flex-1 flex overflow-hidden p-1 gap-1">
        <div className="w-56 win95-raised bg-win95-bg flex flex-col shrink-0">
            <div className="p-1 bg-[#808080] text-white text-[10px] font-bold uppercase mb-1">Estrutura</div>
            <div className="flex-1 win95-sunken bg-white overflow-y-auto p-1 custom-scrollbar">
                <div onClick={() => setActiveCategory('Todos')} className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer mb-0.5 text-xs font-bold uppercase ${activeCategory === 'Todos' ? 'bg-[#000080] text-white' : 'hover:bg-gray-100 text-black'}`}>
                    <HardDrive size={14} className={activeCategory === 'Todos' ? 'text-yellow-300' : 'text-gray-500'} />
                    TODOS OS ARQUIVOS
                </div>
                {renderFolderTree(folderTree)}
            </div>
        </div>

        <div className="flex-1 win95-sunken bg-white overflow-y-auto custom-scrollbar flex flex-col">
            <Breadcrumbs />
            <div className="bg-gray-100 px-2 py-1 text-[10px] text-gray-400 font-mono italic">
                 C:\Brain\Arquivos\{activeCategory.replace(/\//g, '\\')}
            </div>

            {filteredFiles.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center opacity-20 text-[#808080]">
                    <FolderOpen size={48} />
                    <p className="mt-2 text-xs font-bold uppercase">Pasta Vazia</p>
                </div>
            ) : (
                <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-gray-100 sticky top-0 font-bold uppercase border-b border-gray-300 z-10 shadow-sm">
                        <tr>
                            <th className="p-2 border-r w-8">#</th>
                            <th className="p-2 border-r">Nome do Arquivo</th>
                            <th className="p-2 border-r w-24 text-center">Tamanho</th>
                            <th className="p-2 text-right w-24">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredFiles.map(file => (
                            <tr key={file.id} className="hover:bg-blue-50 group">
                                <td className="p-2 text-center text-blue-600"><File size={14} className="mx-auto" /></td>
                                <td className="p-2 font-bold min-w-0">
                                    <div className="flex flex-col">
                                        <span className="truncate max-w-xs">{file.name}</span>
                                        {activeCategory === 'Todos' && <span className="text-[9px] text-gray-400 font-normal italic uppercase">Local: {file.category || 'Geral'}</span>}
                                    </div>
                                </td>
                                <td className="p-2 font-mono text-center text-[#555]">{ (file.size / 1024).toFixed(1) } KB</td>
                                <td className="p-2 text-right">
                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100">
                                        <button onClick={() => setFileToMove(file)} className="p-1 win95-raised bg-win95-bg"><ArrowRightLeft size={12} /></button>
                                        <button onClick={() => { const l=document.createElement('a'); l.href=file.data; l.download=file.name; l.click(); }} className="p-1 win95-raised bg-win95-bg text-blue-700" title="Baixar"><Download size={12} /></button>
                                         {file.type === 'application/pdf' && onSignFile && (
                                            <button onClick={() => onSignFile(file)} className="p-1 win95-raised bg-win95-bg text-green-700" title="Assinar Digitalmente"><FileCheck size={12}/></button>
                                         )}
                                         <button onClick={() => confirm("Excluir?") && onChange(files.filter(f => f.id !== file.id))} className="p-1 win95-raised bg-win95-bg text-red-600" title="Excluir"><Trash2 size={12} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
      </div>

      {fileToMove && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
            <div className="bg-win95-bg w-80 win95-raised p-1 shadow-2xl">
                <div className="bg-[#000080] text-white px-2 py-1 text-xs font-bold flex justify-between items-center mb-2">
                    <span className="flex items-center gap-2"><ArrowRightLeft size={12}/> Mover Arquivo</span>
                    <button onClick={() => setFileToMove(null)} className="win95-raised bg-win95-bg text-black w-4 h-4 flex items-center justify-center text-xs">×</button>
                </div>
                <div className="p-2">
                    <p className="text-[10px] mb-2 truncate font-bold uppercase">Mover: {fileToMove.name}</p>
                    <div className="max-h-52 overflow-y-auto win95-sunken bg-white p-1 mb-2 custom-scrollbar">
                        <button onClick={() => { onChange(files.map(f => f.id === fileToMove.id ? { ...f, category: 'Geral' } : f)); setFileToMove(null); }} className="w-full text-left px-2 py-1 text-xs hover:bg-blue-100 flex items-center gap-2">
                            <HardDrive size={12} className="text-gray-400" /> RAIZ (GERAL)
                        </button>
                        {allCategories.filter(c => c !== 'Geral' && c !== 'Todos').sort().map(cat => (
                            <button key={cat} onClick={() => { onChange(files.map(f => f.id === fileToMove.id ? { ...f, category: cat } : f)); setFileToMove(null); }} 
                                className={`w-full text-left px-2 py-1 text-xs flex items-center gap-2 hover:bg-blue-100 ${fileToMove.category === cat ? 'bg-gray-100 text-gray-400' : ''}`}
                                disabled={fileToMove.category === cat}
                            >
                                <Folder size={12} className={fileToMove.category === cat ? 'text-gray-300' : 'text-yellow-500 fill-yellow-500'} />
                                {cat}
                            </button>
                        ))}
                    </div>
                    <div className="flex justify-end"><Button size="sm" onClick={() => setFileToMove(null)}>CANCELAR</Button></div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

// --- Main Component: DocumentsModule (Unified) ---
export interface DocumentsModuleProps {
  personalFiles: StoredFile[];
  onFilesChange: (files: StoredFile[]) => void;
  driveFiles: any[];
  onDriveFilesChange: (files: any[]) => void;
  signatures: Signature[];
  onSignatureChange: (signatures: Signature[]) => void;
  onAddEvent: (event: UserEvent) => void;
  currentUser: User | null;
}

export const DocumentsModule: React.FC<DocumentsModuleProps> = ({
  personalFiles,
  onFilesChange,
  driveFiles,
  onDriveFilesChange,
  signatures,
  onSignatureChange,
  onAddEvent,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<'files' | 'generator' | 'drive' | 'signer'>('files');
  const [fileToSign, setFileToSign] = useState<StoredFile | null>(null);

  const TABS = [
    { id: 'files', label: 'Arquivos Pessoais', icon: <FolderOpen size={16} /> },
    { id: 'generator', label: 'Gerador de Documentos', icon: <PenTool size={16} /> },
    { id: 'signer', label: 'Assinador Digital', icon: <FileCheck size={16} /> },
    { id: 'drive', label: 'Google Drive', icon: <Cloud size={16} /> },
  ];

  return (
    <div className="flex flex-col h-full bg-palette-mediumLight dark:bg-[#111111]">
      {/* ── Sub-tabs Navigation ── */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-palette-mediumDark dark:border-gray-800 bg-palette-lightest dark:bg-gray-900 flex-shrink-0">
        <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-2 text-xs font-black rounded-lg uppercase tracking-tight transition-all border ${
                activeTab === tab.id
                  ? 'bg-palette-darkest dark:bg-white text-white dark:text-gray-900 shadow-md border-transparent'
                  : 'text-palette-darkest/60 dark:text-gray-400 hover:bg-palette-mediumLight dark:hover:bg-gray-800 border-palette-mediumDark dark:border-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-3">
            <div className="bg-blue-600/10 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-full text-[10px] font-black uppercase flex items-center gap-2 border border-blue-600/20">
                <Sparkles size={12} /> Módulo Documentos v3.0
            </div>
        </div>
      </div>

      {/* ── Content Area ── */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'files' && (
          <PersonalFileManager 
            files={personalFiles} 
            onChange={onFilesChange} 
            onSignFile={(f) => { setFileToSign(f); setActiveTab('signer'); }}
          />
        )}
        {activeTab === 'generator' && (
          <DocumentGenerator 
            onSaveFile={(f) => onFilesChange([ { ...f, id: generateUUID(), uploadedAt: new Date().toISOString() }, ...personalFiles])} 
          />
        )}
        {activeTab === 'signer' && (
          <SignatureManager 
            signatures={signatures} 
            onChange={onSignatureChange} 
            onAddEvent={onAddEvent}
            initialFile={fileToSign}
            onFileSigned={() => setFileToSign(null)}
          />
        )}
        {activeTab === 'drive' && (
          <SharedDocumentsModule 
            driveFiles={driveFiles} 
            onDriveFilesChange={onDriveFilesChange} 
            currentUser={currentUser} 
          />
        )}
      </div>

      {/* ── Footer Info ── */}
      <div className="h-8 px-6 bg-palette-lightest dark:bg-gray-900 border-t border-palette-mediumDark dark:border-gray-800 flex items-center justify-between text-[9px] font-bold text-gray-500 uppercase">
        <div className="flex gap-4">
            <span>Sessão Atual: {TABS.find(t => t.id === activeTab)?.label}</span>
            <span>|</span>
            <span>Armazenamento: {(personalFiles.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(2)} MB usados</span>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
            <span>Sync Ativo</span>
        </div>
      </div>
    </div>
  );
};
