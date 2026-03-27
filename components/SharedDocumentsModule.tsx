'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Cloud, Download, RefreshCw, File, LogIn, ExternalLink, Search, Filter, LayoutGrid, List as ListIcon, FileText, Image as ImageIcon, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { User } from '@/types';

declare global {
    interface Window {
        gapi: any;
    }
}

// Configurações do Google Drive API
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
    size?: string;
    modifiedTime?: string;
    webViewLink?: string;
    webContentLink?: string;
    iconLink?: string;
}

interface SharedDocumentsModuleProps {
    driveFiles: DriveFile[];
    onDriveFilesChange: (files: DriveFile[]) => void;
    currentUser: User | null;
}

export const SharedDocumentsModule: React.FC<SharedDocumentsModuleProps> = ({ driveFiles, onDriveFilesChange, currentUser }) => {
    const [isGapiLoaded, setIsGapiLoaded] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
    const [category, setCategory] = useState<string>('all');

    // 1. Inicializar GAPI e capturar token do Supabase
    useEffect(() => {
        const initGapi = async () => {
            try {
                await new Promise((resolve) => window.gapi.load('client', resolve));
                await window.gapi.client.init({
                    discoveryDocs: [DISCOVERY_DOC],
                });
                setIsGapiLoaded(true);

                // Se já temos um token vindo do login do site (Supabase/Google)
                if (currentUser?.googleAccessToken) {
                    window.gapi.client.setToken({ access_token: currentUser.googleAccessToken });
                    setIsAuthenticated(true);
                } else {
                    setIsAuthenticated(false);
                }
            } catch (err) {
                console.error('Erro ao inicializar GAPI:', err);
            }
        };

        if (window.gapi) initGapi();
    }, [currentUser]);

    // 2. Chamar listagem quando autenticado
    useEffect(() => {
        if (isAuthenticated && isGapiLoaded) {
            listDriveFiles();
        }
    }, [isAuthenticated, isGapiLoaded]);

    // 3. Listar Arquivos
    const listDriveFiles = useCallback(async () => {
        if (!isAuthenticated || !isGapiLoaded) return;
        setIsLoading(true);
        try {
            const response = await window.gapi.client.drive.files.list({
                pageSize: 100,
                fields: 'files(id, name, mimeType, size, modifiedTime, webViewLink, webContentLink, iconLink)',
                orderBy: 'modifiedTime desc'
            });
            onDriveFilesChange(response.result.files || []);
        } catch (err) {
            console.error('Erro ao listar arquivos do Drive:', err);
            // Se o token expirou, desloga localmente para forçar novo vínculo
            if ((err as any).status === 401) {
                setIsAuthenticated(false);
            }
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, isGapiLoaded, onDriveFilesChange]);

    // 4. Autenticar (Solicita vínculo no App.tsx)
    const handleAuth = () => {
        window.dispatchEvent(new CustomEvent('link-google'));
    };

    const formatSize = (bytes?: string) => {
        if (!bytes) return '--';
        const b = parseInt(bytes);
        if (b < 1024) return b + ' B';
        if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
        return (b / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '--';
        return new Date(dateStr).toLocaleDateString('pt-BR');
    };

    const filteredDriveFiles = driveFiles.filter(f => {
        const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
        let matchesCategory = true;
        if (category === 'pdf') matchesCategory = f.mimeType === 'application/pdf';
        else if (category === 'image') matchesCategory = f.mimeType.startsWith('image/');
        else if (category === 'document') matchesCategory = f.mimeType.includes('document') || f.mimeType.includes('wordprocessingml') || f.mimeType === 'text/plain';
        else if (category === 'spreadsheet') matchesCategory = f.mimeType.includes('spreadsheet') || f.mimeType === 'text/csv';
        else if (category === 'folder') matchesCategory = f.mimeType === 'application/vnd.google-apps.folder';

        return matchesSearch && matchesCategory;
    });

    return (
        <div className="h-full flex flex-col bg-win95-bg">
            {/* Header */}
            <div className="flex justify-between items-center bg-[#008080] text-white p-2 shrink-0 shadow-[inset_-1px_-1px_#0a0a0a,inset_1px_1px_#dfdfdf]">
                <div className="flex items-center gap-2 text-xs font-bold uppercase">
                    <Cloud size={16} /> Documentos Compartilhados (Google Drive)
                </div>
                <div className="text-[10px] opacity-80">
                    Integração Cloud Storage
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col gap-1 shrink-0 p-1 bg-[#d0d0d0]">
                <div className="win95-raised p-2 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 flex-1">
                        {!isAuthenticated ? (
                            <Button size="sm" onClick={handleAuth} icon={<LogIn size={14} />} className="bg-win95-blue text-white">
                                CONECTAR
                            </Button>
                        ) : (
                            <Button size="sm" onClick={listDriveFiles} disabled={isLoading} icon={<RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />}>
                                {isLoading ? 'SINCRONIZANDO...' : 'ATUALIZAR'}
                            </Button>
                        )}

                        <div className="h-4 w-px bg-gray-400 mx-1"></div>

                        <div className="flex items-center gap-2 flex-1 max-w-md">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    placeholder="PROCURAR..."
                                    className="w-full text-xs p-1.5 win95-sunken bg-white outline-none pl-7"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                                <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>

                        <div className="h-4 w-px bg-gray-400 mx-1"></div>

                        {/* View Controls */}
                        <div className="flex gap-1 bg-win95-bg p-0.5 rounded shadow-[inset_1px_1px_2px_#888,inset_-1px_-1px_2px_#fff]">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                                title="Visualização em Lista"
                            >
                                <ListIcon size={14} className={viewMode === 'list' ? 'text-win95-blue' : 'text-gray-600'} />
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                                title="Visualização em Grade"
                            >
                                <LayoutGrid size={14} className={viewMode === 'grid' ? 'text-win95-blue' : 'text-gray-600'} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Category Filters */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar px-1">
                    {[
                        { id: 'all', label: 'Todos', icon: '*' },
                        { id: 'pdf', label: 'PDFs', icon: <File size={10} className="text-red-600" /> },
                        { id: 'image', label: 'Imagens', icon: <ImageIcon size={10} className="text-purple-600" /> },
                        { id: 'document', label: 'Documentos', icon: <FileText size={10} className="text-blue-600" /> },
                        { id: 'spreadsheet', label: 'Planilhas', icon: <FileSpreadsheet size={10} className="text-green-600" /> },
                        { id: 'folder', label: 'Pastas', icon: <Filter size={10} className="text-yellow-600" /> },
                    ].map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setCategory(cat.id)}
                            className={`flex items-center gap-1.5 px-2 py-1 text-[10px] uppercase font-bold whitespace-nowrap win95-btn ${category === cat.id ? 'bg-win95-blue text-white shadow-retro-inset' : ''}`}
                        >
                            {typeof cat.icon === 'string' ? null : cat.icon}
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex overflow-hidden p-1 gap-1">
                <div className="flex-1 win95-sunken bg-[#e0e5ec] overflow-y-auto custom-scrollbar flex flex-col relative">
                    {!isAuthenticated ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-[#808080] p-8 text-center bg-white h-full">
                            <Cloud size={64} className="opacity-20 mb-4" />
                            {currentUser?.id !== 'demo_user_id' && !currentUser?.googleAccessToken ? (
                                <>
                                    <h3 className="text-sm font-bold uppercase mb-2 text-win95-blue">Vincule sua conta Google</h3>
                                    <p className="text-[10px] max-w-xs leading-relaxed italic mb-4">
                                        Para acessar seus documentos, você precisa "acoplar" sua conta atual ao seu perfil do Google.
                                        Isso é feito de forma segura e unificada.
                                    </p>
                                    <Button onClick={() => window.dispatchEvent(new CustomEvent('link-google'))} className="bg-win95-blue text-white uppercase text-[10px] font-bold">
                                        VINCULAR AGORA
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <h3 className="text-sm font-bold uppercase mb-2">Conecte-se para começar</h3>
                                    <p className="text-[10px] max-w-xs leading-relaxed italic">
                                        Acesse seus documentos diretamente do Google Drive de forma segura.
                                        Os arquivos não são armazenados localmente.
                                    </p>
                                </>
                            )}
                        </div>
                    ) : isLoading && driveFiles.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center h-full bg-white">
                            <RefreshCw size={32} className="animate-spin text-win95-blue mb-2" />
                            <span className="text-[10px] font-bold uppercase text-gray-400">Carregando arquivos...</span>
                        </div>
                    ) : viewMode === 'list' ? (
                        <table className="w-full text-left text-xs border-collapse min-w-[600px] bg-white">
                            <thead className="bg-[#c0c0c0] sticky top-0 font-bold uppercase border-b border-gray-400 z-10 text-[9px]">
                                <tr>
                                    <th className="p-2 border-r w-8 shadow-[inset_-1px_-1px_#808080,inset_1px_1px_#ffffff]"></th>
                                    <th className="p-2 border-r shadow-[inset_-1px_-1px_#808080,inset_1px_1px_#ffffff]">Nome do Documento</th>
                                    <th className="p-2 border-r w-24 text-center shadow-[inset_-1px_-1px_#808080,inset_1px_1px_#ffffff]">Tamanho</th>
                                    <th className="p-2 border-r w-32 text-center shadow-[inset_-1px_-1px_#808080,inset_1px_1px_#ffffff]">Modificado</th>
                                    <th className="p-2 text-right w-24 shadow-[inset_-1px_-1px_#808080,inset_1px_1px_#ffffff]">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredDriveFiles.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-gray-400 italic">
                                            Nenhum arquivo encontrado.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredDriveFiles.map(file => (
                                        <tr key={file.id} className="hover:bg-blue-50 group border-b border-gray-100">
                                            <td className="p-2 text-center">
                                                {file.iconLink ? (
                                                    <img src={file.iconLink} alt="icon" className="w-4 h-4 mx-auto" />
                                                ) : (
                                                    <File size={14} className={`${file.mimeType.includes('pdf') ? 'text-red-600' : 'text-blue-600'} mx-auto`} />
                                                )}
                                            </td>
                                            <td className="p-2 min-w-0">
                                                <div className="flex flex-col">
                                                    <span className="truncate max-w-md font-bold text-[#222]" title={file.name}>{file.name}</span>
                                                    <span className="text-[9px] text-gray-400 font-normal uppercase italic">{file.mimeType.split('.').pop()?.split('/').pop()}</span>
                                                </div>
                                            </td>
                                            <td className="p-2 font-mono text-center text-[#555] text-[10px]">{formatSize(file.size)}</td>
                                            <td className="p-2 text-center text-[#555] text-[10px] whitespace-nowrap">{formatDate(file.modifiedTime)}</td>
                                            <td className="p-2 text-right">
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {file.webContentLink && (
                                                        <a
                                                            href={file.webContentLink}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-1 win95-raised bg-win95-bg text-green-700 block"
                                                            title="Download Direto"
                                                        >
                                                            <Download size={12} />
                                                        </a>
                                                    )}
                                                    {file.webViewLink && (
                                                        <a
                                                            href={file.webViewLink}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-1 win95-raised bg-win95-bg text-blue-700 block"
                                                            title="Abrir no Google Drive"
                                                        >
                                                            <ExternalLink size={12} />
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 p-2 auto-rows-max">
                            {filteredDriveFiles.length === 0 ? (
                                <div className="col-span-full p-8 text-center text-gray-400 italic">
                                    Nenhum arquivo encontrado.
                                </div>
                            ) : (
                                filteredDriveFiles.map(file => (
                                    <div key={file.id} className="win95-raised bg-white p-2 flex flex-col gap-2 hover:bg-blue-50 transition-colors group relative overflow-hidden h-28 cursor-default">
                                        <div className="flex justify-between items-start z-10">
                                            {file.iconLink ? (
                                                <img src={file.iconLink} alt="icon" className="w-5 h-5" />
                                            ) : (
                                                <File size={20} className={`${file.mimeType.includes('pdf') ? 'text-red-600' : 'text-blue-600'}`} />
                                            )}
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {file.webContentLink && (
                                                    <a href={file.webContentLink} target="_blank" rel="noopener noreferrer" className="p-1 win95-raised bg-[#d0d0d0] text-green-700 hover:text-green-800" title="Download">
                                                        <Download size={12} />
                                                    </a>
                                                )}
                                                {file.webViewLink && (
                                                    <a href={file.webViewLink} target="_blank" rel="noopener noreferrer" className="p-1 win95-raised bg-[#d0d0d0] text-blue-700 hover:text-blue-800" title="Abrir">
                                                        <ExternalLink size={12} />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex-1 flex flex-col min-h-0 mt-1 z-10">
                                            <span className="font-bold text-xs truncate" title={file.name}>{file.name}</span>
                                            <span className="text-[9px] text-gray-500 uppercase truncate mt-0.5">{file.mimeType.split('.').pop()?.split('/').pop()}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[9px] text-gray-400 z-10 mt-auto pt-1 border-t border-gray-100">
                                            <span className="font-mono">{formatSize(file.size)}</span>
                                            <span>{formatDate(file.modifiedTime)}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer / Status */}
            <div className="bg-[#c0c0c0] border-t border-gray-400 px-2 py-0.5 text-[9px] text-[#222] flex justify-between uppercase font-bold">
                <span>Google Drive API: {isGapiLoaded ? 'OK' : '...'}</span>
                <span>{isAuthenticated ? 'Sessão Ativa' : 'Desconectado'} - {filteredDriveFiles.length} ARQUIVOS</span>
            </div>
        </div>
    );
};
