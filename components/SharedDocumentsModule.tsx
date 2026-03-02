import React, { useState, useEffect, useCallback } from 'react';
import { Cloud, Download, RefreshCw, File, LogIn, ExternalLink, Trash2, Search, Filter } from 'lucide-react';
import { Button } from './ui/Button';
import { User } from '../types';

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
                pageSize: 50,
                fields: 'files(id, name, mimeType, size, modifiedTime, webViewLink)',
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

    // 3. Autenticar (Solicita vínculo no App.tsx)
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

    const filteredDriveFiles = driveFiles.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
            <div className="win95-raised p-2 bg-[#d0d0d0] flex items-center justify-between shrink-0 gap-4">
                <div className="flex items-center gap-2 flex-1">
                    {!isAuthenticated ? (
                        <Button size="sm" onClick={handleAuth} icon={<LogIn size={14} />} className="bg-win95-blue text-white">
                            CONECTAR AO DRIVE
                        </Button>
                    ) : (
                        <Button size="sm" onClick={listDriveFiles} disabled={isLoading} icon={<RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />}>
                            {isLoading ? 'SINCRONIZANDO...' : 'ATUALIZAR LISTA'}
                        </Button>
                    )}

                    <div className="h-6 w-px bg-gray-400 mx-1"></div>

                    <div className="flex items-center gap-2 flex-1 max-w-md">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="PROCURAR NO DRIVE..."
                                className="w-full text-xs p-1.5 win95-sunken bg-white outline-none pl-7"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex overflow-hidden p-1 gap-1">
                <div className="flex-1 win95-sunken bg-white overflow-y-auto custom-scrollbar flex flex-col">
                    {!isAuthenticated ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-[#808080] p-8 text-center">
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
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <RefreshCw size={32} className="animate-spin text-win95-blue mb-2" />
                            <span className="text-[10px] font-bold uppercase text-gray-400">Carregando arquivos...</span>
                        </div>
                    ) : (
                        <table className="w-full text-left text-xs border-collapse">
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
                                                <File size={14} className={`${file.mimeType.includes('pdf') ? 'text-red-600' : 'text-blue-600'} mx-auto`} />
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
                                                    {/* Botão de download (exemplo) */}
                                                    <button className="p-1 win95-raised bg-win95-bg text-gray-500" title="Informações">
                                                        <Filter size={12} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Footer / Status */}
            <div className="bg-[#c0c0c0] border-t border-gray-400 px-2 py-0.5 text-[9px] text-[#222] flex justify-between uppercase font-bold">
                <span>Google Drive API: {isGapiLoaded ? 'OK' : '...'}</span>
                <span>{isAuthenticated ? 'Sessão Ativa' : 'Desconectado'}</span>
            </div>
        </div>
    );
};
