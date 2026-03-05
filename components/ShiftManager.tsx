
import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Trash2,
  ArrowRight,
  Info,
  Save,
  Settings,
  Moon,
  Sun,
  Coffee,
  ChevronLeft,
  ChevronRight,
  Zap
} from 'lucide-react';
import { ShiftConfig, ShiftSegment } from '../types';
import { Button } from './ui/Button';

interface ShiftManagerProps {
  config?: ShiftConfig;
  onChange: (config: ShiftConfig) => void;
}

const PRESETS: Record<string, ShiftSegment[]> = {
  '12x36': [
    { id: 's1', days: 1, type: 'work', startTime: '07:00', endTime: '19:00' },
    { id: 's2', days: 1, type: 'off' }
  ],
  '5x2': [
    { id: 's1', days: 5, type: 'work', startTime: '08:00', endTime: '17:00' },
    { id: 's2', days: 2, type: 'off' }
  ],
  '7x7_Rotativo': [
    { id: 's1', days: 7, type: 'work', startTime: '07:00', endTime: '19:00' },
    { id: 's2', days: 7, type: 'off' },
    { id: 's3', days: 7, type: 'work', startTime: '19:00', endTime: '07:00' },
    { id: 's4', days: 7, type: 'off' }
  ]
};

export const ShiftManager: React.FC<ShiftManagerProps> = ({ config, onChange }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const defaultConfig: ShiftConfig = config || {
    startDate: new Date().toISOString().split('T')[0],
    segments: PRESETS['5x2']
  };

  const updateConfig = (updates: Partial<ShiftConfig>) => {
    onChange({ ...defaultConfig, ...updates });
  };

  const addSegment = () => {
    const newSegment: ShiftSegment = {
      id: `seg_${Date.now()}`,
      days: 1,
      type: 'work',
      startTime: '08:00',
      endTime: '17:00'
    };
    updateConfig({ segments: [...defaultConfig.segments, newSegment] });
  };

  const removeSegment = (id: string) => {
    updateConfig({ segments: defaultConfig.segments.filter(s => s.id !== id) });
  };

  const updateSegment = (id: string, updates: Partial<ShiftSegment>) => {
    updateConfig({
      segments: defaultConfig.segments.map(s => s.id === id ? { ...s, ...updates } : s)
    });
  };

  // Projected Shift Calculation
  const projectedDays = useMemo(() => {
    const startDate = new Date(defaultConfig.startDate + 'T00:00:00');
    const segments = defaultConfig.segments;
    const cycleDuration = segments.reduce((acc, s) => acc + s.days, 0);

    if (cycleDuration === 0) return new Map();

    const calendarStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const result = new Map();

    const diffTime = calendarStart.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    let currentDayInCycle = 0;
    if (diffDays > 0) {
      currentDayInCycle = diffDays % cycleDuration;
    }

    const projectionDate = diffDays > 0 ? new Date(calendarStart) : new Date(startDate);

    for (let i = 0; i < 42; i++) {
      const dateStr = projectionDate.toISOString().split('T')[0];

      let tempDays = 0;
      let targetSegment = segments[0];
      for (const seg of segments) {
        tempDays += seg.days;
        if (currentDayInCycle < tempDays) {
          targetSegment = seg;
          break;
        }
      }

      result.set(dateStr, targetSegment);

      projectionDate.setDate(projectionDate.getDate() + 1);
      currentDayInCycle = (currentDayInCycle + 1) % cycleDuration;
    }

    return result;
  }, [defaultConfig, currentMonth]);

  const monthDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    const days = [];

    for (let i = 0; i < start.getDay(); i++) days.push(null);
    for (let i = 1; i <= end.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, [currentMonth]);

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  return (
    <div className="flex h-full bg-[#f4f7f9] overflow-hidden">
      {/* Configuration Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-xl z-10 transition-all duration-300">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-br from-blue-700 to-indigo-800 text-white">
          <div className="flex items-center gap-2 mb-1">
            <Settings size={14} className="opacity-60" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Escalador Premium</span>
          </div>
          <h2 className="text-xl font-black italic tracking-tighter uppercase leading-tight">Editor de Escalas</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Start Date */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-2">Início do Ciclo</label>
            <input
              type="date"
              className="w-full bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={defaultConfig.startDate}
              onChange={e => updateConfig({ startDate: e.target.value })}
            />
            <p className="text-[9px] text-gray-400 mt-2 italic leading-relaxed">Sua escala começará a contar desta data em diante.</p>
          </div>

          {/* Segments List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Etapas do Ciclo</label>
              <button
                onClick={addSegment}
                className="p-1 hover:bg-blue-50 text-blue-600 rounded-full transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="space-y-3">
              {defaultConfig.segments.map((seg, idx) => (
                <div key={seg.id} className="relative bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow group overflow-hidden">
                  <div className={`absolute top-0 left-0 w-1 h-full ${seg.type === 'work' ? (parseInt(seg.startTime?.split(':')[0] || '0') >= 18 ? 'bg-indigo-900' : 'bg-blue-500') : 'bg-gray-300'}`}></div>

                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black italic text-blue-900">ETAPA #{idx + 1}</span>
                    <button
                      onClick={() => removeSegment(seg.id)}
                      className="p-1.5 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[8px] font-black uppercase text-gray-400 block mb-1 tracking-widest">Tipo</label>
                      <select
                        className="w-full bg-gray-50 border border-transparent px-2 py-1 rounded-lg text-xs font-bold outline-none focus:bg-white focus:border-blue-500 transition-all appearance-none cursor-pointer"
                        value={seg.type}
                        onChange={e => updateSegment(seg.id, { type: e.target.value as 'work' | 'off' })}
                      >
                        <option value="work">Trabalho</option>
                        <option value="off">Folga</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[8px] font-black uppercase text-gray-400 block mb-1 tracking-widest">Duração</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="1"
                          className="w-full bg-gray-50 border border-transparent px-2 py-1 rounded-lg text-xs font-bold outline-none focus:bg-white focus:border-blue-500 transition-all"
                          value={seg.days}
                          onChange={e => updateSegment(seg.id, { days: parseInt(e.target.value) || 1 })}
                        />
                        <span className="text-[8px] font-bold text-gray-400 uppercase">Dias</span>
                      </div>
                    </div>
                  </div>

                  {seg.type === 'work' && (
                    <div className="grid grid-cols-2 gap-3 mt-3 animate-in slide-in-from-top-2 duration-200">
                      <div>
                        <label className="text-[8px] font-black uppercase text-gray-400 block mb-1 tracking-widest">Início</label>
                        <input
                          type="time"
                          className="w-full bg-gray-50 border border-transparent px-2 py-1 rounded-lg text-xs font-bold outline-none focus:bg-white focus:border-blue-500 transition-all font-mono"
                          value={seg.startTime}
                          onChange={e => updateSegment(seg.id, { startTime: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-[8px] font-black uppercase text-gray-400 block mb-1 tracking-widest">Término</label>
                        <input
                          type="time"
                          className="w-full bg-gray-50 border border-transparent px-2 py-1 rounded-lg text-xs font-bold outline-none focus:bg-white focus:border-blue-500 transition-all font-mono"
                          value={seg.endTime}
                          onChange={e => updateSegment(seg.id, { endTime: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <button
                onClick={addSegment}
                className="w-full py-3 bg-blue-50 text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 border-2 border-dashed border-blue-200"
              >
                <Plus size={14} /> Adicionar Etapa
              </button>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="pt-4 border-t border-gray-100">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-3 flex items-center gap-2">
              <Zap size={10} className="text-yellow-500" /> Modelos Prontos
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(PRESETS).map(key => (
                <button
                  key={key}
                  onClick={() => updateConfig({ segments: PRESETS[key] })}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-blue-600 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                >
                  {key.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Sub Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <h3 className="text-xl font-black italic tracking-tighter text-blue-900 uppercase">Projeção da Escala</h3>
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Visualização Mensal Integrada</span>
            </div>

            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                className="p-1.5 hover:bg-white rounded-lg transition-all text-gray-600 hover:text-blue-600"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="px-4 font-black text-xs text-blue-900 min-w-[140px] text-center uppercase tracking-wide">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </div>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                className="p-1.5 hover:bg-white rounded-lg transition-all text-gray-600 hover:text-blue-600"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-gray-400">Diurno</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-900"></div>
              <span className="text-gray-400">Noturno</span>
            </div>
          </div>
        </div>

        {/* Scrollable Grid Container */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-7 gap-6 mb-4">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map(d => (
                <div key={d} className="text-[10px] font-black text-gray-300 uppercase tracking-widest text-center">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-3">
              {monthDays.map((day, i) => {
                if (!day) return <div key={`empty-${i}`} className="min-h-[100px]" />;

                const dateStr = day.toISOString().split('T')[0];
                const shift = projectedDays.get(dateStr);
                const isWork = shift?.type === 'work';
                const isNight = isWork && parseInt(shift?.startTime?.split(':')[0] || '0') >= 18;

                return (
                  <div
                    key={dateStr}
                    className={`
                      min-h-[100px] rounded-3xl p-4 flex flex-col transition-all group shadow-sm relative overflow-hidden
                      ${isWork
                        ? (isNight
                          ? 'bg-gradient-to-br from-indigo-900 to-slate-900 text-white'
                          : 'bg-white border-2 border-blue-500 text-gray-900 ring-4 ring-blue-50 shadow-lg')
                        : 'bg-white border border-gray-100 text-gray-300'}
                    `}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className={`text-lg font-black italic tracking-tighter ${isWork && !isNight ? 'text-blue-600' : ''}`}>
                        {day.getDate()}
                      </span>
                      {isWork && (isNight ? <Moon size={14} className="text-indigo-400" /> : <Sun size={14} className="text-blue-500" />)}
                    </div>

                    {isWork ? (
                      <div className="mt-auto space-y-1">
                        <div className={`text-[8px] font-black uppercase tracking-wider inline-block px-2 py-0.5 rounded-full ${isNight ? 'bg-indigo-800' : 'bg-blue-100 text-blue-700'}`}>
                          Trabalho
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black italic tracking-tighter opacity-80">
                          <span>{shift.startTime}</span>
                          <ArrowRight size={10} className="shrink-0" />
                          <span>{shift.endTime}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-auto">
                        <div className="flex items-center gap-1 text-[8px] font-black uppercase text-gray-300 italic tracking-[0.2em]">
                          <Coffee size={10} /> Folga
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer Explanation */}
            <div className="mt-12 p-8 bg-blue-50 rounded-[3rem] border border-blue-100 flex items-start gap-6">
              <div className="w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center text-blue-600 shrink-0">
                <Info size={24} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-black text-blue-900 uppercase tracking-widest mb-1">Inteligência de Escala</h4>
                <p className="text-xs text-blue-700 italic leading-relaxed font-bold">
                  A escala é calculada automaticamente baseada no seu padrão de repetição (ciclo).
                  Qualquer alteração nas etapas à esquerda refletirá instantaneamente no calendário acima.
                  Este agendamento é integrado ao seu calendário principal da aba "Visão Geral".
                </p>
              </div>
              <button className="self-center px-6 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all flex items-center gap-2">
                <Save size={16} /> Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
