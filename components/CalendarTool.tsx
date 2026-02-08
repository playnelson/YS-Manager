
import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Loader2, Info, Plus, Trash2, Calendar as CalendarIcon, Bell, Users, Cake, Target } from 'lucide-react';
import { CalendarConfig, Holiday, UserEvent } from '../types';
import { Button } from './ui/Button';

interface CalendarToolProps {
  config: CalendarConfig;
  events: UserEvent[];
  onConfigChange: (config: CalendarConfig) => void;
  onEventsChange: (events: UserEvent[]) => void;
}

const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

const STATE_HOLIDAYS_DB: Record<string, { day: number, month: number, name: string }[]> = {
  'SP': [{ day: 9, month: 7, name: 'Rev. Constitucionalista' }, { day: 20, month: 11, name: 'Consciência Negra' }],
  'RJ': [{ day: 23, month: 4, name: 'Dia de São Jorge' }, { day: 20, month: 11, name: 'Consciência Negra' }],
  'MG': [{ day: 21, month: 4, name: 'Tiradentes (Data Magna)' }],
  'RS': [{ day: 20, month: 9, name: 'Revolução Farroupilha' }],
};

export const CalendarTool: React.FC<CalendarToolProps> = ({ config, events = [], onConfigChange, onEventsChange }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDayStr, setSelectedDayStr] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<UserEvent>>({ title: '', type: 'reminder' });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calculateDynamicDates = (y: number): Holiday[] => {
    const dates: Holiday[] = [];
    const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), pascoaMonth = Math.floor((h + l - 7 * m + 114) / 31), pascoaDay = ((h + l - 7 * m + 114) % 31) + 1;
    const pascoa = new Date(y, pascoaMonth - 1, pascoaDay);
    const addDays = (date: Date, days: number) => {
      const res = new Date(date); res.setDate(res.getDate() + days); return res.toISOString().split('T')[0];
    };
    dates.push({ date: addDays(pascoa, -47), name: 'Carnaval', type: 'optional' });
    dates.push({ date: addDays(pascoa, -2), name: 'Sexta-feira Santa', type: 'national' });
    dates.push({ date: addDays(pascoa, 0), name: 'Páscoa', type: 'national' });
    dates.push({ date: addDays(pascoa, 60), name: 'Corpus Christi', type: 'optional' });
    return dates;
  };

  const fetchHolidays = async () => {
    setIsLoading(true);
    try {
      // Busca Feriados Nacionais via BrasilAPI
      const response = await fetch(`https://brasilapi.com.br/api/feriados/v1/${year}`);
      let apiHolidays: Holiday[] = [];
      
      if (response.ok) {
        const apiData = await response.json();
        apiHolidays = Array.isArray(apiData) 
          ? apiData.map((h: any) => ({ date: h.date, name: h.name, type: 'national' })) 
          : [];
      }

      // Feriados Estaduais (Base Local)
      const stateHolidaysRaw = STATE_HOLIDAYS_DB[config.uf] || [];
      const stateHolidays: Holiday[] = stateHolidaysRaw.map(sh => ({
        date: `${year}-${String(sh.month).padStart(2, '0')}-${String(sh.day).padStart(2, '0')}`,
        name: sh.name,
        type: 'state'
      }));

      // Feriados Dinâmicos (Cálculo Matemático)
      const dynamicHolidays = calculateDynamicDates(year);

      // Lista final mesclada
      const finalHolidays: Holiday[] = [...apiHolidays];

      // Adiciona estaduais se não houver colisão de data com nacionais
      stateHolidays.forEach(sh => {
        if (!finalHolidays.some(fh => fh.date === sh.date)) {
          finalHolidays.push(sh);
        }
      });

      // Adiciona dinâmicos (Páscoa, etc) se não estiverem na API (evita duplicação)
      dynamicHolidays.forEach(dh => {
        // Verifica colisão por data OU por nome similar (ex: "Carnaval" vs "Carnaval")
        const exists = finalHolidays.some(fh => 
          fh.date === dh.date || 
          fh.name.toLowerCase().includes(dh.name.toLowerCase())
        );
        if (!exists) {
          finalHolidays.push(dh);
        }
      });

      setHolidays(finalHolidays);

    } catch (e) {
      console.error("Erro ao carregar feriados:", e);
      // Fallback em caso de erro na API
      setHolidays(calculateDynamicDates(year));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchHolidays(); }, [year, config.uf]);

  const daysInMonth = useMemo(() => {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    const days = [];
    for (let i = 0; i < start.getDay(); i++) days.push(null);
    for (let i = 1; i <= end.getDate(); i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        day: i,
        date: dateStr,
        holidays: holidays.filter(h => h.date === dateStr),
        userEvents: events.filter(e => e.date === dateStr)
      });
    }
    return days;
  }, [year, month, holidays, events]);

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title) return;
    const event: UserEvent = {
      id: `ev_${Date.now()}`,
      date: selectedDayStr,
      title: newEvent.title,
      type: newEvent.type as any || 'reminder',
      description: newEvent.description
    };
    onEventsChange([...events, event]);
    setNewEvent({ title: '', type: 'reminder' });
    setIsAddModalOpen(false);
  };

  const deleteEvent = (id: string) => {
    onEventsChange(events.filter(e => e.id !== id));
  };

  const selectedData = useMemo(() => {
    const hols = holidays.filter(h => h.date === selectedDayStr);
    const evs = events.filter(e => e.date === selectedDayStr);
    return { hols, evs };
  }, [selectedDayStr, holidays, events]);

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  const eventIcons = {
    holiday: <Target size={12} className="text-red-600" />,
    meeting: <Users size={12} className="text-blue-600" />,
    reminder: <Bell size={12} className="text-yellow-600" />,
    birthday: <Cake size={12} className="text-pink-600" />
  };

  return (
    <div className="h-full flex flex-col gap-2 bg-win95-bg">
      {/* Barra de Ferramentas Estilo Toolbar Clássica */}
      <div className="win95-raised p-1.5 flex flex-wrap items-center gap-3 bg-win95-bg border-b-2 border-win95-shadow">
        <div className="flex items-center gap-2 px-2 border-r border-win95-shadow">
          <MapPin size={14} className="text-win95-blue" />
          <select 
            className="win95-sunken px-1 py-0.5 text-[11px] outline-none bg-white text-black font-bold h-6" 
            value={config.uf} 
            onChange={(e) => onConfigChange({ ...config, uf: e.target.value })}
          >
            {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
          </select>
          <input 
            className="win95-sunken px-2 py-0.5 text-[11px] outline-none bg-white text-black w-32 h-6" 
            value={config.city} 
            onChange={(e) => onConfigChange({ ...config, city: e.target.value })} 
            placeholder="Sua Cidade..."
          />
        </div>

        <div className="flex items-center gap-1">
          <Button size="sm" className="w-8 h-7" onClick={() => setCurrentDate(new Date(year, month - 1, 1))}><ChevronLeft size={16} /></Button>
          <div className="win95-sunken px-6 py-1 bg-white min-w-[140px] text-center font-black text-xs text-black uppercase tracking-tight h-7 flex items-center justify-center">
            {monthNames[month]} {year}
          </div>
          <Button size="sm" className="w-8 h-7" onClick={() => setCurrentDate(new Date(year, month + 1, 1))}><ChevronRight size={16} /></Button>
        </div>

        <div className="flex-1"></div>
        
        <div className="flex items-center gap-2 px-2">
           {isLoading ? (
             <div className="flex items-center gap-1">
               <Loader2 size={14} className="animate-spin text-win95-blue" />
               <span className="text-[9px] font-bold text-win95-blue">Buscando Feriados...</span>
             </div>
           ) : (
             <span className="text-[10px] font-bold text-green-700 uppercase tracking-widest flex items-center gap-1">
               <div className="w-1.5 h-1.5 rounded-full bg-green-600"></div> Online
             </span>
           )}
        </div>
      </div>

      <div className="flex-1 flex gap-2 overflow-hidden p-1">
        {/* Grade do Calendário */}
        <div className="flex-1 win95-sunken bg-[#808080] p-[2px] flex flex-col shadow-inner">
          <div className="grid grid-cols-7 gap-[2px] flex-1 bg-[#808080]">
            {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'].map(d => (
              <div key={d} className="bg-win95-bg text-center text-[10px] font-black py-1 border-b-2 border-win95-shadow uppercase text-black shadow-sm">{d}</div>
            ))}
            {daysInMonth.map((dayObj, i) => {
              if (!dayObj) return <div key={`empty-${i}`} className="bg-win95-bg/50" />;
              const isToday = new Date().toDateString() === new Date(year, month, dayObj.day).toDateString();
              const isSelected = selectedDayStr === dayObj.date;
              const hasItems = dayObj.holidays.length > 0 || dayObj.userEvents.length > 0;
              const isWeekend = [0, 6].includes(i % 7);
              
              return (
                <div 
                  key={dayObj.date} 
                  onClick={() => setSelectedDayStr(dayObj.date)}
                  className={`relative flex flex-col p-1 cursor-pointer transition-all select-none
                    ${isSelected ? 'win95-sunken bg-white ring-1 ring-inset ring-win95-blue' : 'win95-raised bg-win95-bg hover:bg-[#e0e0e0]'}
                    ${isToday ? 'bg-yellow-50 font-bold' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <span className={`text-[11px] font-black leading-none ${isWeekend ? 'text-red-700' : 'text-black'} ${isToday ? 'bg-win95-blue text-white px-1' : ''}`}>
                      {dayObj.day}
                    </span>
                    {hasItems && <div className="w-1.5 h-1.5 rounded-full bg-win95-blue shadow-sm animate-pulse" />}
                  </div>

                  <div className="mt-1 space-y-[1px] overflow-hidden">
                    {dayObj.holidays.slice(0, 1).map((h, idx) => (
                      <div key={idx} className="bg-red-700 text-white text-[7px] px-1 truncate uppercase font-black tracking-tighter shadow-sm border border-red-900">
                        {h.name}
                      </div>
                    ))}
                    {dayObj.userEvents.slice(0, 1).map((e, idx) => (
                      <div key={idx} className="bg-win95-blue text-white text-[7px] px-1 truncate font-black uppercase tracking-tighter shadow-sm border border-blue-900">
                        {e.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar de Agenda Estilo Fichário */}
        <div className="w-72 flex flex-col gap-2">
          <div className="win95-raised p-0 bg-win95-bg flex-1 flex flex-col overflow-hidden">
            <div className="bg-win95-blue text-white px-2 py-1 text-[11px] font-black uppercase flex justify-between items-center shadow-md">
              <div className="flex items-center gap-2">
                <CalendarIcon size={12} />
                <span>Agenda do Dia</span>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="win95-raised bg-win95-bg text-black p-0.5 hover:bg-white active:shadow-none"
              >
                <Plus size={12} />
              </button>
            </div>
            
            <div className="p-3 bg-white flex-1 win95-sunken m-1 overflow-y-auto custom-scrollbar">
              <div className="mb-4 pb-2 border-b-2 border-dotted border-win95-shadow">
                <div className="text-[10px] font-bold text-win95-shadow uppercase tracking-widest mb-1">Data Selecionada</div>
                <div className="text-sm font-black text-black">
                  {new Date(selectedDayStr + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                </div>
              </div>

              <div className="space-y-3">
                {selectedData.hols.length === 0 && selectedData.evs.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 opacity-30 grayscale">
                    <Info size={32} />
                    <span className="text-[9px] font-bold uppercase mt-2">Sem compromissos</span>
                  </div>
                )}
                
                {selectedData.hols.map((h, i) => (
                  <div key={i} className="win95-raised bg-[#fff5f5] p-2 border-l-[6px] border-l-red-700 shadow-sm">
                    <div className="flex items-center gap-1 mb-1">
                      <Target size={10} className="text-red-700" />
                      <span className="text-[9px] font-black text-red-800 uppercase">Feriado {h.type === 'national' ? 'Nacional' : 'Estadual'}</span>
                    </div>
                    <div className="text-[11px] font-black text-black leading-tight uppercase">{h.name}</div>
                  </div>
                ))}

                {selectedData.evs.map((e) => (
                  <div key={e.id} className="win95-raised bg-white p-2 border-l-[6px] border-l-win95-blue group relative hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-1">
                        {eventIcons[e.type]}
                        <span className="text-[9px] font-black uppercase text-win95-shadow">{e.type}</span>
                      </div>
                      <button 
                        onClick={() => deleteEvent(e.id)} 
                        className="win95-raised bg-win95-bg p-0.5 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                    <div className="text-[11px] font-black text-black leading-tight uppercase mb-1">{e.title}</div>
                    {e.description && <div className="text-[9px] text-[#444] leading-relaxed border-t border-win95-bg pt-1">{e.description}</div>}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-2 bg-win95-bg border-t border-white text-[10px] font-bold text-win95-shadow flex justify-between uppercase italic">
              <span>YS-Agendador v2.0</span>
              <span>{events.length} Totais</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Estilo Caixa de Diálogo Clássica */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 backdrop-blur-[1px]">
          <div className="bg-win95-bg w-full max-w-xs win95-raised p-1 shadow-2xl">
            <div className="bg-win95-blue text-white px-2 py-1 text-xs font-bold flex justify-between items-center mb-4 shadow-sm">
              <span className="flex items-center gap-2"><Plus size={12} /> Novo Compromisso</span>
              <button onClick={() => setIsAddModalOpen(false)} className="win95-raised bg-win95-bg text-black w-5 h-5 flex items-center justify-center text-xs font-black">×</button>
            </div>
            <form onSubmit={handleAddEvent} className="px-3 pb-4 space-y-4">
              <div className="win95-sunken bg-white/50 p-3 space-y-3 border-none">
                <div>
                  <label className="text-[10px] font-black uppercase block mb-1 text-win95-blue">Título do Evento:</label>
                  <input 
                    required 
                    className="w-full px-2 py-1 win95-sunken text-xs outline-none bg-white text-black font-bold uppercase" 
                    value={newEvent.title} 
                    onChange={e => setNewEvent({...newEvent, title: e.target.value})} 
                    autoFocus 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase block mb-1 text-win95-blue">Classificação:</label>
                  <select 
                    className="w-full px-2 py-1 win95-sunken text-xs outline-none bg-white text-black font-bold" 
                    value={newEvent.type} 
                    onChange={e => setNewEvent({...newEvent, type: e.target.value as any})}
                  >
                    <option value="reminder">Lembrete</option>
                    <option value="meeting">Reunião / Trabalho</option>
                    <option value="holiday">Feriado Especial</option>
                    <option value="birthday">Aniversário</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase block mb-1 text-win95-blue">Observações:</label>
                  <textarea 
                    className="w-full px-2 py-1 win95-sunken text-[11px] outline-none bg-white text-black resize-none" 
                    rows={2} 
                    value={newEvent.description} 
                    onChange={e => setNewEvent({...newEvent, description: e.target.value})} 
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" onClick={() => setIsAddModalOpen(false)} className="min-w-[80px]">CANCELAR</Button>
                <Button type="submit" className="min-w-[80px] bg-win95-blue text-white">GRAVAR</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
