
import React, { useState } from 'react';
import { Search, Building2, MapPin, Users, AlertTriangle, Briefcase, Copy, Loader2, History } from 'lucide-react';
import { Button } from './ui/Button';
import { CnpjData } from '../types';

export const CnpjQuery: React.FC = () => {
  const [cnpjInput, setCnpjInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CnpjData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<CnpjData[]>([]);

  const formatCnpj = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCnpjInput(formatCnpj(e.target.value));
  };

  const handleSearch = async () => {
    const cleanCnpj = cnpjInput.replace(/\D/g, '');
    if (cleanCnpj.length !== 14) {
      setError('CNPJ inválido. Digite 14 números.');
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
      
      if (!response.ok) {
        if (response.status === 404) throw new Error('CNPJ não encontrado na base de dados.');
        throw new Error('Erro ao consultar a API.');
      }

      const result: CnpjData = await response.json();
      setData(result);
      
      // Adiciona ao histórico se não existir
      setHistory(prev => {
        const exists = prev.find(item => item.cnpj === result.cnpj);
        if (exists) return prev;
        return [result, ...prev].slice(0, 10); // Mantém os últimos 10
      });

    } catch (err: any) {
      setError(err.message || 'Erro desconhecido.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Feedback visual poderia ser adicionado aqui
  };

  return (
    <div className="h-full flex gap-4 bg-win95-bg p-2 overflow-hidden">
      {/* Sidebar: Busca e Histórico */}
      <div className="w-80 flex flex-col gap-4">
        {/* Painel de Busca */}
        <div className="win95-raised p-2 flex flex-col gap-3">
          <div className="bg-win95-blue text-white px-2 py-1 text-xs font-bold uppercase flex items-center gap-2">
            <Search size={12} /> Consultar Base
          </div>
          
          <div>
            <label className="text-[10px] font-bold uppercase block mb-1">Número do CNPJ:</label>
            <div className="flex gap-1">
              <input 
                className="w-full win95-sunken px-2 py-1 text-sm font-mono outline-none bg-white text-black"
                placeholder="00.000.000/0001-00"
                value={cnpjInput}
                onChange={handleInputChange}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={loading} className="w-10 flex items-center justify-center">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              </Button>
            </div>
          </div>

          {error && (
            <div className="win95-sunken bg-red-100 p-2 border-red-500 text-red-700 text-[10px] flex items-center gap-2 font-bold">
              <AlertTriangle size={12} /> {error}
            </div>
          )}
        </div>

        {/* Histórico Recente */}
        <div className="flex-1 win95-raised p-2 flex flex-col overflow-hidden">
          <div className="bg-[#808080] text-white px-2 py-1 text-[10px] font-bold uppercase mb-2 flex items-center gap-2">
            <History size={10} /> Consultas Recentes
          </div>
          <div className="flex-1 win95-sunken bg-white overflow-y-auto p-1 custom-scrollbar">
            {history.length === 0 ? (
              <div className="text-center p-4 text-[#808080] text-[10px] italic">
                Nenhuma consulta recente.
              </div>
            ) : (
              <div className="space-y-1">
                {history.map(item => (
                  <div 
                    key={item.cnpj}
                    onClick={() => { setData(item); setCnpjInput(formatCnpj(item.cnpj)); }}
                    className={`p-2 border border-dotted border-[#808080] hover:bg-blue-50 cursor-pointer group ${data?.cnpj === item.cnpj ? 'bg-win95-blue text-white' : 'bg-win95-bg text-black'}`}
                  >
                    <div className="text-[10px] font-bold truncate group-hover:underline">{item.razao_social}</div>
                    <div className="text-[9px] font-mono opacity-80">{formatCnpj(item.cnpj)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Display: Ficha da Empresa */}
      <div className="flex-1 win95-raised p-2 flex flex-col overflow-hidden bg-[#d0d0d0]">
        <div className="bg-win95-blue text-white px-2 py-1 text-xs font-bold uppercase flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <Building2 size={12} /> Ficha Cadastral de Pessoa Jurídica
          </div>
          {data && (
            <div className="text-[10px] font-mono bg-blue-800 px-1">
              Última atualização: {new Date().toLocaleDateString()}
            </div>
          )}
        </div>

        {data ? (
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            <div className="space-y-4">
              
              {/* Header Info */}
              <div className="win95-raised bg-win95-bg p-3 relative">
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 border font-bold text-[10px] uppercase shadow-sm ${
                    data.situacao_cadastral === 2 || data.situacao_cadastral.toString() === 'ATIV' || data.situacao_cadastral.toString() === '2' // API retorna number 2 para Ativa as vezes
                      ? 'bg-green-600 text-white border-green-800' 
                      : 'bg-red-600 text-white border-red-800'
                  }`}>
                    {data.situacao_cadastral === 2 ? 'ATIVA' : 'INATIVA/BAIXADA'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-bold text-[#555] uppercase block mb-0.5">Razão Social</label>
                    <div className="win95-sunken bg-white p-1.5 text-xs font-bold text-black select-text">{data.razao_social}</div>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-[#555] uppercase block mb-0.5">Nome Fantasia</label>
                    <div className="win95-sunken bg-white p-1.5 text-xs font-bold text-black select-text">{data.nome_fantasia || '---'}</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-3">
                   <div>
                    <label className="text-[9px] font-bold text-[#555] uppercase block mb-0.5">CNPJ</label>
                    <div className="win95-sunken bg-white p-1.5 text-xs font-mono font-bold text-black flex justify-between items-center group">
                      {formatCnpj(data.cnpj)}
                      <button onClick={() => copyToClipboard(data.cnpj)} className="opacity-0 group-hover:opacity-100"><Copy size={10} /></button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-[#555] uppercase block mb-0.5">Abertura</label>
                    <div className="win95-sunken bg-white p-1.5 text-xs text-black">{data.data_inicio_atividade ? new Date(data.data_inicio_atividade).toLocaleDateString('pt-BR') : '-'}</div>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-[#555] uppercase block mb-0.5">Telefone</label>
                    <div className="win95-sunken bg-white p-1.5 text-xs text-black">{data.ddd_telefone_1 || '---'}</div>
                  </div>
                </div>
              </div>

              {/* Atividade Econômica */}
              <div className="win95-raised bg-win95-bg p-3">
                 <div className="flex items-center gap-2 mb-2 text-win95-blue border-b border-white pb-1">
                    <Briefcase size={14} />
                    <h3 className="text-[10px] font-bold uppercase">Atividade Econômica (CNAE)</h3>
                 </div>
                 <div className="win95-sunken bg-white p-2 text-xs text-black">
                   {data.cnae_fiscal_descricao}
                 </div>
              </div>

              {/* Endereço */}
              <div className="win95-raised bg-win95-bg p-3">
                 <div className="flex items-center gap-2 mb-2 text-win95-blue border-b border-white pb-1">
                    <MapPin size={14} />
                    <h3 className="text-[10px] font-bold uppercase">Localização</h3>
                 </div>
                 <div className="grid grid-cols-12 gap-2">
                   <div className="col-span-8">
                      <label className="text-[9px] font-bold text-[#555] uppercase block mb-0.5">Logradouro</label>
                      <div className="win95-sunken bg-white p-1.5 text-xs text-black truncate">{data.logradouro}</div>
                   </div>
                   <div className="col-span-2">
                      <label className="text-[9px] font-bold text-[#555] uppercase block mb-0.5">Número</label>
                      <div className="win95-sunken bg-white p-1.5 text-xs text-black">{data.numero}</div>
                   </div>
                   <div className="col-span-2">
                      <label className="text-[9px] font-bold text-[#555] uppercase block mb-0.5">CEP</label>
                      <div className="win95-sunken bg-white p-1.5 text-xs text-black">{data.cep}</div>
                   </div>
                   <div className="col-span-5">
                      <label className="text-[9px] font-bold text-[#555] uppercase block mb-0.5">Bairro</label>
                      <div className="win95-sunken bg-white p-1.5 text-xs text-black truncate">{data.bairro}</div>
                   </div>
                   <div className="col-span-5">
                      <label className="text-[9px] font-bold text-[#555] uppercase block mb-0.5">Município</label>
                      <div className="win95-sunken bg-white p-1.5 text-xs text-black truncate">{data.municipio}</div>
                   </div>
                   <div className="col-span-2">
                      <label className="text-[9px] font-bold text-[#555] uppercase block mb-0.5">UF</label>
                      <div className="win95-sunken bg-white p-1.5 text-xs text-black">{data.uf}</div>
                   </div>
                 </div>
              </div>

              {/* Sócios (QSA) */}
              <div className="win95-raised bg-win95-bg p-3">
                 <div className="flex items-center gap-2 mb-2 text-win95-blue border-b border-white pb-1">
                    <Users size={14} />
                    <h3 className="text-[10px] font-bold uppercase">Quadro Societário</h3>
                 </div>
                 {(!data.qsa || data.qsa.length === 0) ? (
                   <div className="win95-sunken bg-gray-100 p-2 text-xs italic text-gray-500 text-center">Informação não disponível ou inexistente.</div>
                 ) : (
                   <div className="win95-sunken bg-white">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#e0e0e0] font-bold text-[9px] uppercase">
                          <tr>
                            <th className="p-1 border-b border-r border-white">Nome do Sócio</th>
                            <th className="p-1 border-b border-white">Qualificação</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.qsa.map((socio, idx) => (
                            <tr key={idx} className="border-b border-dotted border-gray-200 hover:bg-yellow-50">
                              <td className="p-1 border-r border-gray-100 font-bold text-black">{socio.nome_socio}</td>
                              <td className="p-1 text-[#555]">{socio.qualificacao_socio}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                   </div>
                 )}
              </div>

            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[#808080] opacity-40">
            <Building2 size={64} strokeWidth={1} />
            <p className="mt-4 text-xs font-bold uppercase tracking-widest">Aguardando Consulta</p>
            <p className="text-[10px]">Utilize o painel lateral para buscar.</p>
          </div>
        )}
      </div>
    </div>
  );
};
