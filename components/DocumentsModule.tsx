
import React, { useState, useRef } from 'react';
import { FolderOpen, FileText, PenTool, Upload, Download, Trash2, File, AlertCircle, HardDrive } from 'lucide-react';
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

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Limite de 500KB para não travar o LocalStorage/Supabase JSON
    if (selectedFile.size > 500 * 1024) {
      alert("Arquivo muito grande! O limite é de 500KB para garantir o desempenho.");
      return;
    }

    setIsUploading(true);
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      const newFile: StoredFile = {
        id: `file_${Date.now()}`,
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size,
        data: base64,
        uploadedAt: new Date().toISOString()
      };
      
      onChange([newFile, ...files]);
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este arquivo permanentemente?")) {
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

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    return (bytes / 1024).toFixed(1) + ' KB';
  };

  return (
    <div className="h-full flex flex-col p-2">
      <div className="flex justify-between items-center mb-2 bg-[#000080] text-white p-2">
         <div className="flex items-center gap-2 text-xs font-bold uppercase">
            <FolderOpen size={16} /> Arquivo Digital Pessoal
         </div>
         <div className="text-[10px] opacity-70">
            {files.length} Itens Armazenados
         </div>
      </div>

      <div className="win95-raised p-2 bg-[#d0d0d0] mb-2 flex items-center justify-between">
         <div className="text-[10px] font-bold text-[#555] flex items-center gap-1">
            <AlertCircle size={12} className="text-blue-600"/> 
            Limite de 500KB por arquivo. Armazenamento local seguro.
         </div>
         <div>
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleUpload}
            />
            <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading} icon={<Upload size={14}/>}>
               {isUploading ? 'SALVANDO...' : 'UPLOAD ARQUIVO'}
            </Button>
         </div>
      </div>

      <div className="flex-1 win95-sunken bg-white overflow-y-auto p-1 custom-scrollbar">
         {files.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-30 text-[#808080]">
               <File size={48} strokeWidth={1} />
               <p className="mt-2 text-xs font-bold uppercase">Nenhum arquivo guardado</p>
            </div>
         ) : (
            <table className="w-full text-left text-xs border-collapse">
               <thead className="bg-gray-100 sticky top-0 font-bold uppercase border-b border-gray-300">
                  <tr>
                     <th className="p-2 border-r">Nome do Arquivo</th>
                     <th className="p-2 border-r w-24">Data</th>
                     <th className="p-2 border-r w-20">Tamanho</th>
                     <th className="p-2 text-right w-24">Ações</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {files.map(file => (
                     <tr key={file.id} className="hover:bg-blue-50 group">
                        <td className="p-2 font-bold flex items-center gap-2">
                           <File size={12} className="text-blue-600" />
                           <span className="truncate max-w-[200px]" title={file.name}>{file.name}</span>
                        </td>
                        <td className="p-2 text-[#555]">{new Date(file.uploadedAt).toLocaleDateString()}</td>
                        <td className="p-2 font-mono text-[#555]">{formatSize(file.size)}</td>
                        <td className="p-2 text-right flex justify-end gap-1">
                           <button onClick={() => handleDownload(file)} className="p-1 win95-raised hover:bg-white text-blue-700" title="Baixar">
                              <Download size={12} />
                           </button>
                           <button onClick={() => handleDelete(file.id)} className="p-1 win95-raised hover:bg-white text-red-600" title="Excluir">
                              <Trash2 size={12} />
                           </button>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         )}
      </div>
    </div>
  );
};
