
import React, { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, Clock, Plus, Trash2, ArrowRight, Info, Save, Settings, Moon, Sun, Coffee } from 'lucide-react';
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

  // Cálculo da Escala Projetada
  const projectedDays = useMemo(() => {
    const startDate = new Date(defaultConfig.startDate + 'T00:00:00');
    const segments = defaultConfig.segments;
    const cycleDuration = segments.reduce((acc, s) => acc + s.days, 0);
    
    if (cycleDuration === 0) return new Map();

    const calendarStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const calendarEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const result = new Map();

    // Projetamos do início do ciclo até o fim do mês visualizado
    const cursor = new Date(startDate);
    const limit = new Date(calendarEnd);
    limit.setDate(limit.getDate() + 1);

    let dayOffset = 0;
    
    // Se a data de início for após o mês atual, não mostramos nada anterior
    // Se for antes, precisamos calcular onde o ciclo está no dia 1 do mês atual
    const diffTime = calendarStart.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Ajuste do cursor para o início do mês visualizado ou início da escala
    const startCursor = diffDays > 0 ? diffDays : 0;
    const endCursor = startCursor + 45; // Projeta 45 dias a partir do início do mês

    let currentDayInCycle = 0;
    if (diffDays > 0) {
      currentDayInCycle = diffDays % cycleDuration;
    }

    const projectionDate = diffDays > 0 ? new Date(calendarStart) : new Date(startDate);

    for (let i = 0; i < 42; i++) {
      const dateStr = projectionDate.toISOString().split('T')[0];
      
      // Encontrar qual segmento este dia pertence
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
    
    // Dias vazios no início
    for (let i = 0; i < start.getDay(); i++) days.push(null);
    
    // Dias do mês
    for (let i = 1; i <= end.getDate(); i++) {
      const date = new Date(year, month, i);
      days.push(date);
    }
    return days;
  }, [currentMonth]);

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  return (
    <div className="flex h-full gap-2 bg-win95-bg p-1 overflow-hidden">
      {/* Painel de Configuração */}
      <div className="w-80 flex flex-col win95-raised p-2 h-full bg-win95-bg">
        <div className="bg-win95-blue text-white px-2 py-1 text-[11px] font-black uppercase flex items-center gap-2 mb-2">
          <Settings size={12} />
          <span>Configuração de Escala</span>
        </div>

        <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
          <div>
            <label className="text-[10px] font-black uppercase block mb-1">Data Início do Ciclo:</label>
            <input 
              type="date"
              className="w-full win95-sunken p-1 text-xs outline-none font-bold text-black"
              value={defaultConfig.startDate}
              onChange={e => updateConfig({ startDate: e.target.value })}
            />
          </div>

          <div className="border-t border-win95-shadow pt-2">
            <label className="text-[10px] font-black uppercase block mb-2">Ciclo de Repetição:</label>
            <div className="space-y-2">
              {defaultConfig.segments.map((seg, idx) => (
                <div key={seg.id} className="win95-raised p-2 bg-[#d0d0d0] relative group">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] font-black text-win95-blue">ETAPA {idx + 1}</span>
                    <button onClick={() => removeSegment(seg.id)} className="text-red-600 hover:bg-red-50 p-0.5"><Trash2 size={10} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[8px] font-bold block">TIPO:</label>
                      <select 
                        className="w-full win95-sunken text-[10px] outline-none h-5 px-1 font-bold"
                        value={seg.type}
                        onChange={e => updateSegment(seg.id, { type: e.target.value as 'work' | 'off' })}
                      >
                        <option value="work">TRABALHO</option>
                        <option value="off">FOLGA</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[8px] font-bold block">DIAS:</label>
                      <input 
                        type="number" 
                        min="1"
                        className="w-full win95-sunken text-[10px] outline-none h-5 px-1 font-bold"
                        value={seg.days}
                        onChange={e => updateSegment(seg.id, { days: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                  </div>
                  {seg.type === 'work' && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <label className="text-[8px] font-bold block">INÍCIO:</label>
                        <input 
                          type="time" 
                          className="w-full win95-sunken text-[10px] outline-none h-5 px-1 font-bold"
                          value={seg.startTime}
                          onChange={e => updateSegment(seg.id, { startTime: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-[8px] font-bold block">FIM:</label>
                        <input 
                          type="time" 
                          className="w-full win95-sunken text-[10px] outline-none h-5 px-1 font-bold"
                          value={seg.endTime}
                          onChange={e => updateSegment(seg.id, { endTime: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <Button onClick={addSegment} className="w-full py-1 text-[10px]" icon={<Plus size={12} />}>ADICIONAR ETAPA</Button>
            </div>
          </div>

          <div className="border-t border-win95-shadow pt-2">
            <label className="text-[10px] font-black uppercase block mb-1">Presets Rápidos:</label>
            <div className="grid grid-cols-1 gap-1">
              {Object.keys(PRESETS).map(key => (
                <button 
                  key={key}
                  onClick={() => updateConfig({ segments: PRESETS[key] })}
                  className="win95-raised px-2 py-1 text-[9px] font-bold hover:bg-white text-left uppercase"
                >
                  {key.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Visualização do Calendário de Turnos */}
      <div className="flex-1 flex flex-col win95-raised p-2 bg-[#d0d0d0] h-full overflow-hidden">
        <div className="flex justify-between items-center mb-2 bg-[#808080] p-1 text-white px-3">
          <div className="flex items-center gap-4">
             <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="win95-raised bg-win95-bg text-black px-2 py-0.5 text-xs font-bold active:shadow-none">&lt;</button>
             <span className="text-xs font-black uppercase tracking-widest">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
             <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="win95-raised bg-win95-bg text-black px-2 py-0.5 text-xs font-bold active:shadow-none">&gt;</button>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-bold uppercase italic opacity-70">
            <span className="flex items-center gap-1"><Sun size={10} /> Turno Diurno</span>
            <span className="flex items-center gap-1"><Moon size={10} /> Turno Noturno</span>
          </div>
        </div>

        <div className="flex-1 win95-sunken bg-white p-1 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-7 gap-px bg-[#808080] border border-[#808080]">
            {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'].map(d => (
              <div key={d} className="bg-win95-bg text-center py-1 text-[9px] font-black text-black">{d}</div>
            ))}
            {monthDays.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} className="bg-[#f0f0f0] min-h-[80px]" />;
              
              const dateStr = day.toISOString().split('T')[0];
              const shift = projectedDays.get(dateStr);
              const isWork = shift?.type === 'work';
              const isNight = isWork && parseInt(shift?.startTime?.split(':')[0] || '0') >= 18;

              return (
                <div 
                  key={dateStr}
                  className={`min-h-[80px] p-1 flex flex-col border border-white/20 transition-colors
                    ${isWork ? (isNight ? 'bg-[#2a2a4a] text-white' : 'bg-blue-50 text-black') : 'bg-white text-gray-400 opacity-60'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-black">{day.getDate()}</span>
                    {isWork && (isNight ? <Moon size={10} /> : <Sun size={10} />)}
                  </div>
                  
                  {isWork ? (
                    <div className="mt-1">
                      <div className={`text-[8px] font-black uppercase px-1 mb-1 inline-block ${isNight ? 'bg-indigo-500' : 'bg-blue-600'} text-white`}>
                        TRABALHO
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <div className="text-[9px] font-mono font-bold flex items-center gap-1">
                          <Clock size={8} /> {shift.startTime}
                        </div>
                        <div className="text-[9px] font-mono font-bold flex items-center gap-1">
                          <ArrowRight size={8} /> {shift.endTime}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-auto">
                      <div className="text-[8px] font-black uppercase text-win95-shadow italic flex items-center gap-1">
                        <Coffee size={10} /> FOLGA
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-2 win95-sunken bg-win95-bg p-2 flex justify-between items-center text-[10px] font-bold text-win95-shadow italic uppercase">
           <div className="flex items-center gap-4">
             <span className="flex items-center gap-1 text-blue-800"><Info size={12} /> A escala repete automaticamente a cada ciclo completo.</span>
           </div>
           <div className="flex items-center gap-4">
             <span>Horas/Mês: ~160h (Estimado)</span>
             <button className="win95-raised bg-win95-bg text-black px-3 py-0.5 flex items-center gap-1 active:shadow-none"><Save size={12} /> Salvar Escala</button>
           </div>
        </div>
      </div>
    </div>
  );
};
