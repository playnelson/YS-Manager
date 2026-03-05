
import React, { useState, useEffect, useMemo } from 'react';
import {
  IconChevronLeft,
  IconChevronRight,
  IconMapPin,
  IconLoader2,
  IconInfoCircle,
  IconPlus,
  IconTrash,
  IconCalendar,
  IconBell,
  IconUsers,
  IconCake,
  IconTarget,
  IconSun,
  IconMoon,
  IconCoffee,
  IconClock,
  IconBrandGoogle,
  IconArrowRight,
  IconSparkles
} from '@tabler/icons-react';
import { CalendarConfig, Holiday, UserEvent, ShiftConfig } from '../types';
import { Button } from './ui/Button';

interface CalendarToolProps {
  config: CalendarConfig;
  events: UserEvent[];
  shiftConfig?: ShiftConfig;
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

export const CalendarTool: React.FC<CalendarToolProps> = ({ config, events = [], shiftConfig, onConfigChange, onEventsChange }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDayStr, setSelectedDayStr] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<UserEvent>>({ title: '', type: 'reminder' });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // --- Holidays Logic ---
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
      const response = await fetch(`https://brasilapi.com.br/api/feriados/v1/${year}`);
      let apiHolidays: Holiday[] = [];
      if (response.ok) {
        const apiData = await response.json();
        apiHolidays = Array.isArray(apiData) ? apiData.map((h: any) => ({ date: h.date, name: h.name, type: 'national' })) : [];
      }
      const stateHolidaysRaw = STATE_HOLIDAYS_DB[config.uf] || [];
      const stateHolidays: Holiday[] = stateHolidaysRaw.map(sh => ({
        date: `${year}-${String(sh.month).padStart(2, '0')}-${String(sh.day).padStart(2, '0')}`,
        name: sh.name,
        type: 'state'
      }));
      const dynamicHolidays = calculateDynamicDates(year);
      const finalHolidays: Holiday[] = [...apiHolidays];
      stateHolidays.forEach(sh => { if (!finalHolidays.some(fh => fh.date === sh.date)) finalHolidays.push(sh); });
      dynamicHolidays.forEach(dh => { if (!finalHolidays.some(fh => fh.date === dh.date || fh.name.toLowerCase().includes(dh.name.toLowerCase()))) finalHolidays.push(dh); });
      setHolidays(finalHolidays);
    } catch (e) {
      setHolidays(calculateDynamicDates(year));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchHolidays(); }, [year, config.uf]);

  // --- Projected Shift Projection Logic ---
  const projectedShifts = useMemo(() => {
    if (!shiftConfig || !shiftConfig.segments.length) return new Map();

    const startDate = new Date(shiftConfig.startDate + 'T00:00:00');
    const segments = shiftConfig.segments;
    const cycleDuration = segments.reduce((acc, s) => acc + s.days, 0);
    if (cycleDuration === 0) return new Map();

    const calendarStart = new Date(year, month, 1);
    const calendarEnd = new Date(year, month + 1, 0);
    const result = new Map();

    const diffTime = calendarStart.getTime() - startDate.getTime();

    const projectionDate = new Date(calendarStart);

    for (let i = 1; i <= calendarEnd.getDate(); i++) {
      const dateStr = projectionDate.toISOString().split('T')[0];

      if (projectionDate >= startDate) {
        const timeFromStart = projectionDate.getTime() - startDate.getTime();
        const daysFromStart = Math.floor(timeFromStart / (1000 * 60 * 60 * 24));
        const dayInCycle = daysFromStart % cycleDuration;

        let tempDays = 0;
        let targetSegment = segments[0];
        for (const seg of segments) {
          tempDays += seg.days;
          if (dayInCycle < tempDays) {
            targetSegment = seg;
            break;
          }
        }
        result.set(dateStr, targetSegment);
      }
      projectionDate.setDate(projectionDate.getDate() + 1);
    }
    return result;
  }, [shiftConfig, year, month]);

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
        userEvents: events.filter(e => e.date === dateStr),
        shift: projectedShifts.get(dateStr)
      });
    }
    return days;
  }, [year, month, holidays, events, projectedShifts]);

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
    if (confirm('Deseja realmente excluir este evento?')) {
      onEventsChange(events.filter(e => e.id !== id));
    }
  };

  const selectedData = useMemo(() => {
    const dayObj = daysInMonth.find(d => d && d.date === selectedDayStr);
    return {
      hols: dayObj?.holidays || [],
      evs: dayObj?.userEvents || [],
      shift: dayObj?.shift,
      day: dayObj?.day
    };
  }, [selectedDayStr, daysInMonth]);

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  const eventIcons = {
    holiday: <IconTarget size={12} className="text-red-500" />,
    meeting: <IconUsers size={12} className="text-blue-500" />,
    reminder: <IconBell size={12} className="text-yellow-500" />,
    birthday: <IconCake size={12} className="text-pink-500" />
  };

  const isToday = (dateStr: string) => new Date().toISOString().split('T')[0] === dateStr;

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
      {/* Premium Header Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-sm z-20">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <h1 className="text-2xl font-black italic tracking-tighter text-blue-900 uppercase">
              Calendário
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <IconMapPin size={14} className="text-win95-blue" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                {config.city} - {config.uf}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg win95-sunken">
            <button
              onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              className="p-1.5 hover:bg-white rounded-md transition-all text-gray-600 hover:text-blue-600 active:scale-95"
            >
              <IconChevronLeft size={18} />
            </button>
            <div className="px-4 font-black text-sm text-blue-900 min-w-[150px] text-center uppercase tracking-wide">
              {monthNames[month]} {year}
            </div>
            <button
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              className="p-1.5 hover:bg-white rounded-md transition-all text-gray-600 hover:text-blue-600 active:scale-95"
            >
              <IconChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase">
              <select
                className="bg-transparent border-none outline-none cursor-pointer hover:text-blue-600 transition-colors"
                value={config.uf}
                onChange={(e) => onConfigChange({ ...config, uf: e.target.value })}
              >
                {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
              </select>
              <div className="w-1 h-1 rounded-full bg-gray-300"></div>
              {isLoading ? (
                <div className="flex items-center gap-1 text-blue-600">
                  <IconLoader2 size={12} className="animate-spin" /> Sincronizando
                </div>
              ) : (
                <div className="flex items-center gap-1 text-green-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Online
                </div>
              )}
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-1 flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-full text-xs font-black uppercase tracking-wider hover:bg-blue-700 transition-all shadow-md active:scale-95 active:shadow-none"
            >
              <IconPlus size={14} /> Novo Evento
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Grid Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#f4f7f9] custom-scrollbar">
          <div className="max-w-6xl mx-auto flex flex-col gap-4">

            {/* Weekdays indicator */}
            <div className="grid grid-cols-7 gap-4 mb-2">
              {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map(d => (
                <div key={d} className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">
                  {d.substring(0, 3)}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-3">
              {daysInMonth.map((dayObj, i) => {
                if (!dayObj) return <div key={`empty-${i}`} className="min-h-[120px]" />;

                const isSel = selectedDayStr === dayObj.date;
                const isTodayDate = isToday(dayObj.date);
                const isWeekend = [0, 6].includes(i % 7);
                const shift = dayObj.shift;
                const isWork = shift?.type === 'work';
                const isNight = isWork && parseInt(shift?.startTime?.split(':')[0] || '0') >= 18;

                return (
                  <div
                    key={dayObj.date}
                    onClick={() => setSelectedDayStr(dayObj.date)}
                    className={`
                      min-h-[120px] rounded-2xl p-3 flex flex-col transition-all cursor-pointer group shadow-sm
                      ${isSel
                        ? 'bg-white ring-2 ring-blue-500 -translate-y-1 shadow-xl z-10'
                        : 'bg-white/80 hover:bg-white hover:-translate-y-0.5 hover:shadow-lg'}
                      ${isTodayDate ? 'border-2 border-dashed border-blue-400' : 'border border-gray-100'}
                    `}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`
                          text-lg font-black italic tracking-tighter
                          ${isSel || isTodayDate ? 'text-blue-600' : (isWeekend ? 'text-red-300' : 'text-gray-900')}
                        `}>
                        {dayObj.day}
                      </span>

                      {isTodayDate && (
                        <div className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[8px] font-black uppercase rounded">
                          Hoje
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-1.5 overflow-hidden">
                      {/* Indicador de Turno mais visual */}
                      {shift && (
                        <div className={`
                             px-2 py-1 rounded-lg flex items-center gap-1.5 text-[9px] font-black uppercase tracking-tighter
                             ${isWork
                            ? (isNight ? 'bg-indigo-50 text-indigo-700' : 'bg-blue-50 text-blue-700')
                            : 'bg-gray-50 text-gray-400'}
                           `}>
                          {isWork ? (isNight ? <IconMoon size={10} /> : <IconSun size={10} />) : <IconCoffee size={10} />}
                          <span className="truncate">{isWork ? `${shift.startTime} - ${shift.endTime}` : 'Folga'}</span>
                        </div>
                      )}

                      {/* Feriados */}
                      {dayObj.holidays.map((h, idx) => (
                        <div key={idx} className="px-2 py-0.5 bg-red-500 text-white text-[8px] font-black uppercase tracking-wider rounded group-hover:bg-red-600 flex items-center gap-1">
                          <IconTarget size={8} />
                          <span className="truncate">{h.name}</span>
                        </div>
                      ))}

                      {/* Eventos do Usuário */}
                      {dayObj.userEvents.slice(0, 2).map((e, idx) => (
                        <div key={idx} className={`
                              px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded flex items-center gap-1
                              ${e.id.startsWith('google_') ? 'bg-blue-100 text-blue-800' : 'bg-blue-600 text-white'}
                            `}>
                          {e.id.startsWith('google_') ? <IconBrandGoogle size={8} /> : (eventIcons[e.type] || <IconSparkles size={8} />)}
                          <span className="truncate font-bold">{e.title}</span>
                        </div>
                      ))}
                    </div>

                    {dayObj.userEvents.length > 2 && (
                      <div className="mt-1 text-right">
                        <span className="text-[8px] font-bold text-gray-400 uppercase">+{dayObj.userEvents.length - 2} Eventos</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Disclaimer inferior */}
            <div className="mt-8 flex items-center justify-center gap-8 opacity-40">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-[10px] font-black uppercase tracking-widest">Trabalho</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                <span className="text-[10px] font-black uppercase tracking-widest">Folga</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-[10px] font-black uppercase tracking-widest">Feriado</span>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Detail Sidebar */}
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col shadow-2xl z-10 transition-all duration-300 transform">
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col">
              <span className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">
                Compromissos
              </span>
              <h2 className="text-2xl font-black text-gray-900 leading-tight">
                {new Date(selectedDayStr + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
              </h2>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                {new Date(selectedDayStr + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long' })}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-gray-50/50">

            {/* Visual Shift Card */}
            {selectedData.shift && (
              <div className={`
                      rounded-3xl p-6 shadow-lg transform transition-transform hover:scale-105 active:scale-95
                      ${selectedData.shift.type === 'work'
                  ? (parseInt(selectedData.shift.startTime?.split(':')[0] || '0') >= 18
                    ? 'bg-gradient-to-br from-indigo-900 to-slate-900 text-white'
                    : 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white')
                  : 'bg-white border border-gray-100 text-gray-400'}
                    `}>
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                    {selectedData.shift.type === 'work'
                      ? (parseInt(selectedData.shift.startTime?.split(':')[0] || '0') >= 18 ? <IconMoon size={24} /> : <IconSun size={24} />)
                      : <IconCoffee size={24} />}
                  </div>
                  <span className="text-[10px] font-black uppercase px-3 py-1 bg-white/10 rounded-full tracking-widest">
                    {selectedData.shift.type === 'work' ? (parseInt(selectedData.shift.startTime?.split(':')[0] || '0') >= 18 ? 'Noturno' : 'Diurno') : 'Descanso'}
                  </span>
                </div>

                {selectedData.shift.type === 'work' ? (
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-black opacity-60">Horário da Escala</span>
                    <div className="flex items-center gap-4 text-2xl font-black italic tracking-tighter">
                      <span>{selectedData.shift.startTime}</span>
                      <IconArrowRight size={20} className="opacity-40" />
                      <span>{selectedData.shift.endTime}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-lg font-black text-gray-800 italic uppercase">Dia de Folga</div>
                )}
              </div>
            )}

            {/* Empty State */}
            {selectedData.hols.length === 0 && selectedData.evs.length === 0 && !selectedData.shift && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <IconSparkles size={32} className="text-gray-300" />
                </div>
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Dia inteiramente livre</span>
              </div>
            )}

            {/* List of Other Events */}
            <div className="space-y-3">
              {selectedData.hols.map((h, i) => (
                <div key={i} className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-4 items-start shadow-sm border-l-4 border-l-red-500">
                  <div className="p-2 bg-red-500 text-white rounded-xl">
                    <IconTarget size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-red-600 uppercase tracking-widest">Feriado {h.type === 'national' ? 'Nacional' : 'Estadual'}</span>
                    <span className="text-sm font-black text-gray-900 uppercase italic tracking-tighter">{h.name}</span>
                  </div>
                </div>
              ))}

              {selectedData.evs.map((e) => (
                <div key={e.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex gap-4 items-start shadow-sm border-l-4 border-l-blue-600 group relative">
                  <div className={`p-2 rounded-xl ${e.id.startsWith('google_') ? 'bg-blue-50 text-blue-600' : 'bg-blue-600 text-white'}`}>
                    {e.id.startsWith('google_') ? <IconBrandGoogle size={18} /> : (eventIcons[e.type] || <IconSparkles size={18} />)}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{e.id.startsWith('google_') ? 'Sincronizado' : e.type}</span>
                    <span className="text-sm font-black text-gray-900 uppercase italic tracking-tighter truncate">{e.title}</span>
                    {e.description && (
                      <p className="text-[10px] text-gray-500 mt-2 leading-relaxed bg-gray-50 p-2 rounded-lg border border-dashed border-gray-200">
                        {e.description}
                      </p>
                    )}
                  </div>
                  {!e.id.startsWith('google_') && (
                    <button
                      onClick={() => deleteEvent(e.id)}
                      className="p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 text-red-500 rounded-md"
                    >
                      <IconTrash size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 bg-white border-t border-gray-100">
            <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <span>Próximo Passo</span>
              <div className="flex items-center gap-2">
                <span className="text-blue-600">{events.length}</span> Eventos Criados
              </div>
            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-4">
              <IconClock size={20} className="text-blue-600 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-blue-900 tracking-wider">Lembrete</span>
                <span className="text-[10px] font-bold text-blue-700">Mantenha sua agenda atualizada para melhor performance.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Dialog Style Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-black uppercase tracking-[0.3em] opacity-60">Agendador</span>
                <button onClick={() => setIsAddModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">×</button>
              </div>
              <h1 className="text-3xl font-black italic tracking-tighter">Novo Evento</h1>
              <p className="text-blue-100 text-sm mt-1">{new Date(selectedDayStr + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>

            <form onSubmit={handleAddEvent} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-1">O que vai acontecer?</label>
                  <input
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-black italic placeholder:text-gray-300 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all uppercase"
                    value={newEvent.title}
                    onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                    autoFocus
                    placeholder="Título do compromisso..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-1">Categoria:</label>
                    <select
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500"
                      value={newEvent.type}
                      onChange={e => setNewEvent({ ...newEvent, type: e.target.value as any })}
                    >
                      <option value="reminder">Lembrete</option>
                      <option value="meeting">Trabalho</option>
                      <option value="holiday">Feriado</option>
                      <option value="birthday">Aniversário</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-1">Status:</label>
                    <div className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[10px] font-black text-green-600 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Confirmado
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-1">Notas (Opcional):</label>
                  <textarea
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24"
                    value={newEvent.description}
                    onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Adicione detalhes aqui..."
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-colors">Cancelar</button>
                <button type="submit" className="flex-2 px-8 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2">
                  <IconPlus size={16} /> Gravar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
