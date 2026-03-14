
import React, { useState } from 'react';
import { ClipboardList, Plus, AlertTriangle, CheckCircle2, Siren, Search, Clock, User, CalendarDays, History } from 'lucide-react';
import { ShiftHandoff, HandoffStatus, User as AppUser } from '../types';
import { Button } from './ui/Button';

interface ShiftHandoffProps {
  handoffs: ShiftHandoff[];
  onChange: (handoffs: ShiftHandoff[]) => void;
  currentUser: AppUser | null;
}

export const ShiftHandoffModule: React.FC<ShiftHandoffProps> = ({ handoffs = [], onChange, currentUser }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [formData, setFormData] = useState<Partial<ShiftHandoff>>({
    shiftPeriod: 'Manhã',
    status: 'ok',
    occurrences: '',
    pendingItems: ''
  });

  const filteredHandoffs = handoffs
    .filter(h =>
      h.userNick.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.occurrences.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const selectedHandoff = handoffs.find(h => h.id === selectedId);

  const handleSave = () => {
    if (!formData.occurrences && !formData.pendingItems) {
      alert("Preencha ao menos as ocorrências ou pendências.");
      return;
    }

    const newHandoff: ShiftHandoff = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      userNick: currentUser?.nick || 'Desconhecido',
      shiftPeriod: formData.shiftPeriod || 'Geral',
      status: formData.status as HandoffStatus || 'ok',
      occurrences: formData.occurrences || 'Sem ocorrências registradas.',
      pendingItems: formData.pendingItems || 'Nada pendente.'
    };

    onChange([newHandoff, ...handoffs]);
    setIsCreating(false);
    setSelectedId(newHandoff.id);
    setFormData({ shiftPeriod: 'Manhã', status: 'ok', occurrences: '', pendingItems: '' });
  };

  const getStatusColor = (status: HandoffStatus) => {
    switch (status) {
      case 'ok': return 'bg-palette-mediumLight/30 text-green-800 border-palette-mediumDark';
      case 'warning': return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'critical': return 'bg-red-50 text-red-800 border-red-200';
      default: return 'bg-palette-lightest text-palette-darkest';
    }
  };

  const getStatusIcon = (status: HandoffStatus) => {
    switch (status) {
      case 'ok': return <CheckCircle2 size={16} className="text-green-600" />;
      case 'warning': return <AlertTriangle size={16} className="text-yellow-600" />;
      case 'critical': return <Siren size={16} className="text-red-600" />;
    }
  };

  return (
    <div className="h-full flex gap-2">
      {/* Sidebar - Lista Histórica */}
      <div className="w-80 flex flex-col bg-win95-bg win95-raised p-1 shrink-0">
        <div className="bg-palette-darkest text-palette-lightest px-2 py-1 text-xs font-bold uppercase flex justify-between items-center mb-2 shadow-sm">
          <span className="flex items-center gap-2"><History size={12} /> Histórico de Plantão</span>
          <button
            onClick={() => { setIsCreating(true); setSelectedId(null); }}
            className="win95-raised bg-win95-bg text-black p-0.5 hover:bg-white active:shadow-none"
            title="Novo Registro"
          >
            <Plus size={12} />
          </button>
        </div>

        <div className="px-1 mb-2">
          <div className="relative">
            <Search className="absolute left-2 top-1.5 text-win95-shadow" size={12} />
            <input
              className="w-full pl-6 pr-2 py-1 win95-sunken text-[11px] bg-white outline-none"
              placeholder="Filtrar registros..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto win95-sunken bg-white p-1 space-y-1 custom-scrollbar">
          {filteredHandoffs.length === 0 ? (
            <div className="text-center p-4 text-xs text-gray-400 italic">Nenhum registro encontrado.</div>
          ) : (
            filteredHandoffs.map(h => (
              <div
                key={h.id}
                onClick={() => { setSelectedId(h.id); setIsCreating(false); }}
                className={`p-2 border border-transparent cursor-pointer hover:bg-palette-mediumLight/50 transition-colors ${selectedId === h.id ? 'bg-palette-mediumLight border-palette-mediumDark' : ''}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-bold text-gray-500">{new Date(h.timestamp).toLocaleDateString()}</span>
                  {getStatusIcon(h.status)}
                </div>
                <div className="font-bold text-xs text-black mb-0.5">{h.shiftPeriod} - {h.userNick}</div>
                <div className="text-[10px] text-gray-600 truncate">{h.occurrences}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Área Principal - Detalhes ou Formulário */}
      <div className="flex-1 win95-raised bg-win95-bg p-2 overflow-hidden flex flex-col">
        {isCreating ? (
          <div className="flex flex-col h-full animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-palette-mediumDark">
              <ClipboardList size={20} className="text-palette-darkest" />
              <h2 className="text-sm font-black uppercase text-palette-darkest">Novo Registro de Passagem</h2>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase block mb-1">Período / Plantão</label>
                  <select
                    className="w-full win95-sunken px-2 py-1 text-sm outline-none bg-white font-bold"
                    value={formData.shiftPeriod}
                    onChange={e => setFormData({ ...formData, shiftPeriod: e.target.value })}
                  >
                    <option value="Manhã">Manhã</option>
                    <option value="Tarde">Tarde</option>
                    <option value="Noite">Noite</option>
                    <option value="Plantão 12h">Plantão 12h</option>
                    <option value="Plantão 24h">Plantão 24h</option>
                    <option value="Geral">Administrativo</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase block mb-1">Status Geral</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFormData({ ...formData, status: 'ok' })}
                      className={`flex-1 py-1 text-xs font-bold border-2 ${formData.status === 'ok' ? 'win95-sunken bg-green-100 border-green-500 text-green-800' : 'win95-raised bg-gray-100 border-white text-gray-500'}`}
                    >
                      SEM ALTERAÇÕES
                    </button>
                    <button
                      onClick={() => setFormData({ ...formData, status: 'warning' })}
                      className={`flex-1 py-1 text-xs font-bold border-2 ${formData.status === 'warning' ? 'win95-sunken bg-yellow-100 border-yellow-500 text-yellow-800' : 'win95-raised bg-gray-100 border-white text-gray-500'}`}
                    >
                      ATENÇÃO
                    </button>
                    <button
                      onClick={() => setFormData({ ...formData, status: 'critical' })}
                      className={`flex-1 py-1 text-xs font-bold border-2 ${formData.status === 'critical' ? 'win95-sunken bg-red-100 border-red-500 text-red-800' : 'win95-raised bg-gray-100 border-white text-gray-500'}`}
                    >
                      CRÍTICO
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col min-h-[150px]">
                <label className="text-[10px] font-bold uppercase block mb-1 text-blue-800">1. Relatório de Ocorrências (O que aconteceu?)</label>
                <textarea
                  className="flex-1 w-full win95-sunken p-3 outline-none text-sm resize-none bg-white font-sans"
                  placeholder="Descreva os eventos importantes do plantão..."
                  value={formData.occurrences}
                  onChange={e => setFormData({ ...formData, occurrences: e.target.value })}
                />
              </div>

              <div className="flex-1 flex flex-col min-h-[100px]">
                <label className="text-[10px] font-bold uppercase block mb-1 text-red-800">2. Pendências (O que o próximo precisa fazer?)</label>
                <textarea
                  className="flex-1 w-full win95-sunken p-3 outline-none text-sm resize-none bg-white font-sans"
                  placeholder="Tarefas a concluir, avisos importantes..."
                  value={formData.pendingItems}
                  onChange={e => setFormData({ ...formData, pendingItems: e.target.value })}
                />
              </div>
            </div>

            <div className="pt-2 mt-2 border-t border-white flex justify-end gap-2">
              <Button onClick={() => setIsCreating(false)} variant="secondary">CANCELAR</Button>
              <Button onClick={handleSave} className="bg-win95-blue text-white w-32">REGISTRAR</Button>
            </div>
          </div>
        ) : selectedHandoff ? (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header do Detalhe */}
            <div className={`p-4 border-2 mb-4 shrink-0 flex justify-between items-start ${getStatusColor(selectedHandoff.status)}`}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {getStatusIcon(selectedHandoff.status)}
                  <h2 className="text-lg font-black uppercase">
                    {selectedHandoff.status === 'ok' ? 'Plantão Tranquilo' : selectedHandoff.status === 'warning' ? 'Plantão com Atenção' : 'Plantão Crítico'}
                  </h2>
                </div>
                <div className="text-xs font-bold opacity-80 flex items-center gap-4">
                  <span className="flex items-center gap-1"><CalendarDays size={12} /> {new Date(selectedHandoff.timestamp).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> {new Date(selectedHandoff.timestamp).toLocaleTimeString()}</span>
                  <span className="flex items-center gap-1"><User size={12} /> {selectedHandoff.userNick}</span>
                </div>
              </div>
              <div className="text-2xl font-black opacity-20 uppercase tracking-widest">{selectedHandoff.shiftPeriod}</div>
            </div>

            {/* Conteúdo do Relatório */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
              <div>
                <h3 className="text-xs font-black uppercase text-win95-blue border-b border-win95-shadow mb-2 pb-1">Relatório de Ocorrências</h3>
                <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium p-2 bg-white win95-sunken min-h-[100px]">
                  {selectedHandoff.occurrences}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-black uppercase text-red-700 border-b border-red-200 mb-2 pb-1">Pendências para o Próximo Turno</h3>
                <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium p-2 bg-white win95-sunken min-h-[80px]">
                  {selectedHandoff.pendingItems}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-2 border-t border-white text-right">
              <Button size="sm" onClick={() => window.print()}>IMPRIMIR RELATÓRIO</Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 opacity-50">
            <ClipboardList size={64} strokeWidth={1} className="mb-4" />
            <p className="text-sm font-black uppercase tracking-widest">Selecione um relatório</p>
            <p className="text-xs">ou inicie um novo registro</p>
          </div>
        )}
      </div>
    </div>
  );
};
