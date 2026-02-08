
import React, { useState } from 'react';
import { Search, Building2, MapPin, Users, AlertTriangle, Briefcase, Copy, Loader2, History, Info, Printer, DollarSign, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { CnpjData } from '../types';

export const CnpjQuery: React.FC = () => {
  const [cnpjInput, setCnpjInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CnpjData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<CnpjData[]>([]);
  const [activeTab, setActiveTab] = useState<'resumo' | 'detalhes' | 'socios' | 'cnaes'>('resumo');

  const formatCnpj = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
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
      setActiveTab('resumo');
      
      setHistory(prev => {
        const exists = prev.find(item => item.cnpj === result.cnpj);
        if (exists) return prev;
        return [result, ...prev].slice(0, 10);
      });

    } catch (err: any) {
      setError(err.message || 'Erro desconhecido.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const isAtiva = (status: number) => status === 2;

  const getPorteLabel = (porte: number) => {
    switch(porte) {
      case 1: return "NÃO INFORMADO";
      case 2: return "MICRO EMPRESA (ME)";
      case 3: return "EMPRESA DE PEQUENO PORTE (EPP)";
      case 5: return "DEMAIS";
      default: return `CÓDIGO ${porte}`;
    }
  };

  return (
    <div className="h-full flex gap-4 bg-win95-bg p-2 overflow-hidden">
      {/* Sidebar: Busca e Histórico */}
      <div className="w-72 flex flex-col gap-4">
        <div className="win95-raised p-2 flex flex-col gap-3">
          <div className="bg-win95-blue text-white px-2 py-1 text-xs font-bold uppercase flex items-center gap-2">
            <Search size={12} /> Consultar Base
          </div>
          
          <div>
            <label className="text-[10px] font-bold uppercase block mb-1">Número do CNPJ:</label>
            <div className="flex gap-1">
              <input 
                className="w-full win95-sunken px-2 py-1 text-sm font-mono outline-none bg-white text-black font-bold"
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
            <div className="win95-sunken bg-red-100 p-2 border-red-500 text-red-700 text-[10px] flex items-center gap-2 font-bold leading-tight">
              <AlertTriangle size={12} className="shrink-0" /> {error}
            </div>
          )}
        </div>

        <div className="flex-1 win95-raised p-2 flex flex-col overflow-hidden">
          <div className="bg-[#808080] text-white px-2 py-1 text-[10px] font-bold uppercase mb-2 flex items-center gap-2">
            <History size={10} /> Recentes
          </div>
          <div className="flex-1 win95-sunken bg-white overflow-y-auto p-1 custom-scrollbar">
            {history.length === 0 ? (
              <div className="text-center p-4 text-[#808080] text-[10px] italic">
                Nenhum registro.
              </div>
            ) : (
              <div className="space-y-1">
                {history.map(item => (
                  <div 
                    key={item.cnpj}
                    onClick={() => { setData(item); setCnpjInput(formatCnpj(item.cnpj)); setActiveTab('resumo'); }}
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

      {/* Main Display: Ficha Completa */}
      <div className="flex-1 win95-raised p-1 flex flex-col overflow-hidden bg-[#c0c0c0]">
        {data ? (
          <div className="flex flex-col h-full">
            {/* Header Fixo */}
            <div className="bg-win95-blue p-3 text-white flex justify-between items-start mb-2 shadow-md shrink-0">
               <div>
                 <div className="text-[10px] font-mono opacity-80 mb-0.5">Ficha Cadastral # {formatCnpj(data.cnpj)}</div>
                 <div className="text-lg font-black uppercase leading-none">{data.razao_social}</div>
                 <div className="text-xs font-bold opacity-80 mt-1">{data.nome_fantasia || '---'}</div>
               </div>
               <div className={`px-3 py-1 text-xs font-black uppercase border-2 ${isAtiva(data.situacao_cadastral) ? 'bg-green-600 border-green-400 text-white' : 'bg-red-600 border-red-400 text-white'}`}>
                 {data.descricao_situacao_cadastral}
               </div>
            </div>

            {/* Abas */}
            <div className="flex gap-1 px-1 border-b border-white shrink-0">
               {[
                 { id: 'resumo', label: 'Resumo Geral', icon: <FileText size={12}/> },
                 { id: 'detalhes', label: 'Endereço & Contato', icon: <MapPin size={12}/> },
                 { id: 'socios', label: `Sócios (${data.qsa?.length || 0})`, icon: <Users size={12}/> },
                 { id: 'cnaes', label: `Atividades (${(data.cnaes_secundarios?.length || 0) + 1})`, icon: <Briefcase size={12}/> }
               ].map(tab => (
                 <button 
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id as any)}
                   className={`px-3 py-1.5 text-xs font-bold uppercase flex items-center gap-2 rounded-t-sm border-t-2 border-l-2 border-r-2 ${
                     activeTab === tab.id 
                       ? 'bg-[#c0c0c0] border-white border-r-[#808080] pb-2 -mb-[1px] relative z-10' 
                       : 'bg-[#a0a0a0] border-white text-[#404040] hover:bg-[#b0b0b0]'
                   }`}
                 >
                   {tab.icon} {tab.label}
                 </button>
               ))}
            </div>

            {/* Conteúdo das Abas */}
            <div className="flex-1 win95-sunken bg-white p-4 overflow-y-auto custom-scrollbar relative z-0">
              
              {/* ABA RESUMO */}
              {activeTab === 'resumo' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-1">
                       <label className="text-[9px] font-bold text-[#666] uppercase block">CNPJ</label>
                       <div className="text-sm font-mono font-bold flex items-center gap-2">
                         {formatCnpj(data.cnpj)}
                         <button onClick={() => copyToClipboard(data.cnpj)} title="Copiar"><Copy size={12} className="text-blue-600"/></button>
                       </div>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-bold text-[#666] uppercase block">Matriz / Filial</label>
                       <div className="text-sm font-bold">{data.descricao_matriz_filial}</div>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-bold text-[#666] uppercase block">Data de Abertura</label>
                       <div className="text-sm font-bold">{formatDate(data.data_inicio_atividade)}</div>
                    </div>
                    
                    <div className="space-y-1 col-span-2">
                       <label className="text-[9px] font-bold text-[#666] uppercase block">Natureza Jurídica</label>
                       <div className="text-sm font-bold">{data.codigo_natureza_juridica}</div>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-bold text-[#666] uppercase block">Porte da Empresa</label>
                       <div className="text-sm font-bold">{getPorteLabel(data.porte)}</div>
                    </div>

                    <div className="space-y-1 col-span-2 bg-yellow-50 p-2 border border-yellow-200">
                       <label className="text-[9px] font-bold text-[#666] uppercase block flex items-center gap-1"><DollarSign size={10}/> Capital Social</label>
                       <div className="text-lg font-black text-green-700">{formatCurrency(data.capital_social)}</div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                     <h3 className="text-xs font-black uppercase text-win95-blue mb-3">Regime Tributário</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className={`p-2 border ${data.opcao_pelo_simples ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                           <div className="flex items-center gap-2 mb-1">
                              {data.opcao_pelo_simples ? <CheckCircle2 size={16} className="text-green-600"/> : <XCircle size={16} className="text-gray-400"/>}
                              <span className="font-bold text-xs uppercase">Simples Nacional</span>
                           </div>
                           <div className="text-[10px] pl-6">
                              {data.opcao_pelo_simples 
                                ? `Optante desde ${formatDate(data.data_opcao_pelo_simples)}` 
                                : 'Não optante'}
                           </div>
                        </div>

                        <div className={`p-2 border ${data.opcao_pelo_mei ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                           <div className="flex items-center gap-2 mb-1">
                              {data.opcao_pelo_mei ? <CheckCircle2 size={16} className="text-green-600"/> : <XCircle size={16} className="text-gray-400"/>}
                              <span className="font-bold text-xs uppercase">Microempreendedor Individual (MEI)</span>
                           </div>
                           <div className="text-[10px] pl-6">
                              {data.opcao_pelo_mei ? 'Enquadrado como MEI' : 'Não enquadrado'}
                           </div>
                        </div>
                     </div>
                  </div>
                </div>
              )}

              {/* ABA DETALHES */}
              {activeTab === 'detalhes' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-black uppercase text-win95-blue mb-3 flex items-center gap-2"><MapPin size={14}/> Endereço Cadastral</h3>
                    <div className="grid grid-cols-12 gap-y-4 gap-x-2 bg-gray-50 p-3 border border-gray-200">
                      <div className="col-span-10">
                         <label className="text-[9px] font-bold text-[#666] uppercase block">Logradouro</label>
                         <div className="text-sm font-bold border-b border-gray-300">{data.descricao_tipo_de_logradouro} {data.logradouro}</div>
                      </div>
                      <div className="col-span-2">
                         <label className="text-[9px] font-bold text-[#666] uppercase block">Número</label>
                         <div className="text-sm font-bold border-b border-gray-300">{data.numero}</div>
                      </div>
                      <div className="col-span-6">
                         <label className="text-[9px] font-bold text-[#666] uppercase block">Bairro</label>
                         <div className="text-sm font-bold border-b border-gray-300">{data.bairro}</div>
                      </div>
                      <div className="col-span-6">
                         <label className="text-[9px] font-bold text-[#666] uppercase block">Complemento</label>
                         <div className="text-sm font-bold border-b border-gray-300 min-h-[20px]">{data.complemento}</div>
                      </div>
                      <div className="col-span-5">
                         <label className="text-[9px] font-bold text-[#666] uppercase block">Município</label>
                         <div className="text-sm font-bold border-b border-gray-300">{data.municipio}</div>
                      </div>
                      <div className="col-span-2">
                         <label className="text-[9px] font-bold text-[#666] uppercase block">UF</label>
                         <div className="text-sm font-bold border-b border-gray-300">{data.uf}</div>
                      </div>
                      <div className="col-span-5">
                         <label className="text-[9px] font-bold text-[#666] uppercase block">CEP</label>
                         <div className="text-sm font-bold border-b border-gray-300">{data.cep}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-black uppercase text-win95-blue mb-3 flex items-center gap-2"><Info size={14}/> Dados de Contato</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="p-2 border border-dotted border-gray-400">
                         <label className="text-[9px] font-bold text-[#666] uppercase block">Telefone Primário</label>
                         <div className="text-sm font-bold">{data.ddd_telefone_1 || '---'}</div>
                       </div>
                       <div className="p-2 border border-dotted border-gray-400">
                         <label className="text-[9px] font-bold text-[#666] uppercase block">Telefone Secundário</label>
                         <div className="text-sm font-bold">{data.ddd_telefone_2 || '---'}</div>
                       </div>
                       <div className="p-2 border border-dotted border-gray-400 md:col-span-2">
                         <label className="text-[9px] font-bold text-[#666] uppercase block">E-mail</label>
                         <div className="text-sm font-bold lowercase text-blue-700 underline">{data.email || '---'}</div>
                       </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA SÓCIOS */}
              {activeTab === 'socios' && (
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase text-win95-blue mb-2">Quadro Societário (QSA)</h3>
                  {data.qsa && data.qsa.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2">
                      {data.qsa.map((socio, idx) => (
                        <div key={idx} className="win95-raised p-2 bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-2">
                           <div className="flex-1">
                              <div className="text-[9px] font-bold text-[#666] uppercase">Nome / Razão Social</div>
                              <div className="text-sm font-bold text-black">{socio.nome_socio}</div>
                           </div>
                           <div className="flex-1">
                              <div className="text-[9px] font-bold text-[#666] uppercase">Qualificação</div>
                              <div className="text-xs font-bold text-[#444]">{socio.qualificacao_socio}</div>
                           </div>
                           <div className="flex-1">
                              <div className="text-[9px] font-bold text-[#666] uppercase">Entrada</div>
                              <div className="text-xs font-mono">{formatDate(socio.data_entrada_sociedade)}</div>
                           </div>
                           <div className="flex-1">
                              <div className="text-[9px] font-bold text-[#666] uppercase">CPF/CNPJ Oculto</div>
                              <div className="text-xs font-mono">{socio.cnpj_cpf_do_socio}</div>
                           </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500 italic border border-dashed border-gray-300">
                      Informação não disponível ou sociedade anônima de capital aberto.
                    </div>
                  )}
                </div>
              )}

              {/* ABA CNAES */}
              {activeTab === 'cnaes' && (
                 <div className="space-y-6">
                   <div>
                     <div className="bg-win95-blue text-white px-2 py-1 text-[10px] font-bold uppercase mb-2">Atividade Principal</div>
                     <div className="p-3 border-2 border-win95-blue bg-blue-50">
                        <div className="text-lg font-mono font-black text-win95-blue mb-1">{data.cnae_fiscal}</div>
                        <div className="text-sm font-bold leading-tight">{data.cnae_fiscal_descricao}</div>
                     </div>
                   </div>

                   <div>
                     <div className="bg-[#808080] text-white px-2 py-1 text-[10px] font-bold uppercase mb-2">Atividades Secundárias ({data.cnaes_secundarios?.length || 0})</div>
                     {data.cnaes_secundarios && data.cnaes_secundarios.length > 0 ? (
                       <div className="max-h-[300px] overflow-y-auto border border-gray-300 bg-gray-50 divide-y divide-gray-200">
                         {data.cnaes_secundarios.map((cnae) => (
                           <div key={cnae.codigo} className="p-2 hover:bg-white transition-colors">
                              <div className="flex items-start gap-3">
                                <span className="font-mono font-bold text-xs text-[#666] whitespace-nowrap">{cnae.codigo}</span>
                                <span className="text-xs font-medium leading-tight">{cnae.descricao}</span>
                              </div>
                           </div>
                         ))}
                       </div>
                     ) : (
                       <div className="p-4 text-sm text-gray-500 italic">Nenhuma atividade secundária registrada.</div>
                     )}
                   </div>
                 </div>
              )}

            </div>
            
            {/* Footer de Ações */}
            <div className="p-2 bg-win95-bg border-t border-white flex justify-between items-center shrink-0">
               <div className="text-[9px] text-[#666] font-bold">Fonte: Receita Federal do Brasil / BrasilAPI</div>
               <Button size="sm" onClick={() => window.print()} icon={<Printer size={12}/>}>IMPRIMIR FICHA</Button>
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

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .win95-sunken, .win95-sunken * {
            visibility: visible;
          }
          .win95-sunken {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            overflow: visible;
          }
        }
      `}</style>
    </div>
  );
};
