'use client';

import { generateUUID } from '../uuid';
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
  IconCoffee,
  IconClock,
  IconBrandGoogle,
  IconArrowRight,
  IconSparkles,
  IconFileText,
  IconFileDownload,
  IconAlertTriangle,
  IconTrendingUp,
  IconTrendingDown
} from '@tabler/icons-react';
import { CalendarConfig, Holiday, UserEvent, ShiftConfig, MoonPhase, FinancialTransaction, OrderAnnotation } from '@/types';
import { Button } from '@/components/ui/Button';
import { Moon as LucideMoon, MoonStar as LucideMoonStar, FileText as LucideFileText } from 'lucide-react';

interface CalendarToolProps {
  config: CalendarConfig;
  events: UserEvent[];
  shiftConfig?: ShiftConfig;
  onConfigChange: (config: CalendarConfig) => void;
  onEventsChange: (events: UserEvent[]) => void;
  financialTransactions?: FinancialTransaction[];
  warehouseLogs?: any[];
  warehouseInventory?: any[];
  orderAnnotations?: OrderAnnotation[];
}

const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

const STATE_HOLIDAYS_DB: Record<string, { day: number, month: number, name: string }[]> = {
  'SP': [{ day: 9, month: 7, name: 'Rev. Constitucionalista' }, { day: 20, month: 11, name: 'Consciência Negra' }],
  'RJ': [{ day: 23, month: 4, name: 'Dia de São Jorge' }, { day: 20, month: 11, name: 'Consciência Negra' }],
  'MG': [{ day: 21, month: 4, name: 'Tiradentes (Data Magna)' }],
  'RS': [{ day: 20, month: 9, name: 'Revolução Farroupilha' }],
};

export const CalendarTool: React.FC<CalendarToolProps> = ({ 
  config, 
  events = [], 
  shiftConfig, 
  onConfigChange, 
  onEventsChange,
  financialTransactions = [],
  warehouseLogs = [],
  warehouseInventory = [],
  orderAnnotations = []
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDayStr, setSelectedDayStr] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<UserEvent>>({ title: '', type: 'reminder' });


  const [moonPhases, setMoonPhases] = useState<MoonPhase[]>([]);
  const [seasonalDates, setSeasonalDates] = useState<Holiday[]>([]);
  const [filters, setFilters] = useState({
    holidays: true,
    commemorative: true,
    moon: true,
    shifts: true
  });

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

  // --- Astronomical Logic ---
  const calculateMoonPhases = (y: number, m: number) => {
    const phases: MoonPhase[] = [];
    const firstDay = new Date(y, m, 1);
    const lastDay = new Date(y, m + 1, 0);

    // Known New Moon: 2024-01-11T11:57:00
    const refNewMoon = new Date('2024-01-11T11:57:00Z').getTime();
    const synodicMonth = 29.530588 * 24 * 60 * 60 * 1000;

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(y, m, d);
      const diff = date.getTime() - refNewMoon;
      const age = (diff % synodicMonth) / synodicMonth;

      const dateStr = date.toISOString().split('T')[0];

      // We look for the 4 main phases by checking if the exact point falls within this day
      // A more robust way is to check if it crossed 0, 0.25, 0.5, 0.75 relative to previous day
      const prevDate = new Date(y, m, d - 1);
      const prevAge = ((prevDate.getTime() - refNewMoon) % synodicMonth) / synodicMonth;

      const checkPhase = (target: number, phaseName: MoonPhase['phase'], label: string) => {
        if ((prevAge < target && age >= target) || (prevAge > age && (prevAge < target || age >= target))) {
          phases.push({ date: dateStr, phase: phaseName, name: label });
        }
      };

      checkPhase(0, 'new', 'Lua Nova');
      checkPhase(0.25, 'first-quarter', 'Quarto Crescente');
      checkPhase(0.5, 'full', 'Lua Cheia');
      checkPhase(0.75, 'last-quarter', 'Quarto Minguante');
    }
    setMoonPhases(phases);
  };

  const fetchHolidays = async () => {
    setIsLoading(true);
    try {
      // 1. Brasil API (Nacionais)
      const resBH = await fetch(`https://brasilapi.com.br/api/feriados/v1/${year}`);
      let apiHolidays: Holiday[] = [];
      if (resBH.ok) {
        const data = await resBH.json();
        apiHolidays = data.map((h: any) => ({ date: h.date, name: h.name, type: 'national' }));
      }

      // 2. Seasonal / Commemorative
      const seasonal: Holiday[] = [
        { date: `${year}-03-08`, name: 'Dia Internacional da Mulher', type: 'commemorative' },
        { date: `${year}-03-20`, name: 'Início do Outono', type: 'commemorative' },
        { date: `${year}-04-19`, name: 'Dia dos Povos Indígenas', type: 'commemorative' },
        { date: `${year}-05-10`, name: 'Dia das Mães', type: 'commemorative' },
        { date: `${year}-06-12`, name: 'Dia dos Namorados', type: 'commemorative' },
        { date: `${year}-06-21`, name: 'Início do Inverno', type: 'commemorative' },
        { date: `${year}-08-09`, name: 'Dia dos Pais', type: 'commemorative' },
        { date: `${year}-08-11`, name: 'Dia do Estudante', type: 'commemorative' },
        { date: `${year}-09-22`, name: 'Início da Primavera', type: 'commemorative' },
        { date: `${year}-10-15`, name: 'Dia do Professor', type: 'commemorative' },
        { date: `${year}-10-28`, name: 'Dia do Servidor Público', type: 'optional' },
        { date: `${year}-11-20`, name: 'Dia da Consciência Negra', type: 'national' },
        { date: `${year}-12-21`, name: 'Início do Verão', type: 'commemorative' },
        { date: `${year}-12-24`, name: 'Véspera de Natal', type: 'optional' },
        { date: `${year}-12-31`, name: 'Véspera de Ano Novo', type: 'optional' },
      ];

      // 3. Historical Events (Simulated)
      const historical: Holiday[] = [
        { date: `${year}-04-22`, name: 'Descobrimento do Brasil (1500)', type: 'commemorative' },
        { date: `${year}-05-13`, name: 'Abolição da Escravidão (1888)', type: 'commemorative' },
        { date: `${year}-07-09`, name: 'Rev. Constitucionalista (SP)', type: 'state' },
      ];

      // 3. State Holidays (Simulated/Local DB)
      const stateHolidaysRaw = STATE_HOLIDAYS_DB[config.uf] || [];
      const stateHolidays: Holiday[] = stateHolidaysRaw.map(sh => ({
        date: `${year}-${String(sh.month).padStart(2, '0')}-${String(sh.day).padStart(2, '0')}`,
        name: sh.name,
        type: 'state'
      }));

      const dynamicHolidays = calculateDynamicDates(year);

      const finalHolidays: Holiday[] = [...apiHolidays];

      // Merge unique
      const merge = (list: Holiday[]) => {
        list.forEach(item => {
          if (!finalHolidays.some(fh => fh.date === item.date && fh.name === item.name)) {
            finalHolidays.push(item);
          }
        });
      };

      merge(stateHolidays);
      merge(dynamicHolidays);
      merge(seasonal);
      merge(historical);

      setHolidays(finalHolidays);
    } catch (e) {
      setHolidays(calculateDynamicDates(year));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
    calculateMoonPhases(year, month);
  }, [year, month, config.uf]);

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
        shift: projectedShifts.get(dateStr),
        moon: moonPhases.find(m => m.date === dateStr)
      });
    }
    return days;
  }, [year, month, holidays, events, projectedShifts, moonPhases]);

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title) return;
    const event: UserEvent = {
      id: generateUUID(),
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
      moon: dayObj?.moon,
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
    <div className="h-full flex flex-col bg-palette-lightest dark:bg-[#111111] overflow-hidden">
      {/* Premium Header Bar */}
      <div className="bg-palette-lightest dark:bg-gray-900 border-b border-palette-mediumDark dark:border-gray-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-sm z-20">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <h1 className="text-2xl font-black italic tracking-tighter text-blue-900 dark:text-blue-400 uppercase">
              Calendário
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <IconMapPin size={14} className="text-win95-blue" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                {config.city} - {config.uf}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-palette-mediumLight dark:bg-gray-800 p-1 rounded-lg win95-sunken">
            <button
              onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              className="p-1.5 hover:bg-palette-lightest rounded-md transition-all text-gray-600 hover:text-blue-600 active:scale-95"
            >
              <IconChevronLeft size={18} />
            </button>
            <div className="px-4 font-black text-sm text-blue-900 dark:text-blue-400 min-w-[150px] text-center uppercase tracking-wide">
              {monthNames[month]} {year}
            </div>
            <button
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              className="p-1.5 hover:bg-palette-lightest rounded-md transition-all text-gray-600 hover:text-blue-600 active:scale-95"
            >
              <IconChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex gap-2 bg-palette-lightest/50 dark:bg-gray-800/50 backdrop-blur-sm p-1 rounded-xl win95-sunken mr-4">
            <button
              onClick={() => setFilters(f => ({ ...f, moon: !f.moon }))}
              className={`p-1.5 rounded-lg transition-all ${filters.moon ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400'}`}
              title="Fases da Lua"
            >
              <LucideMoon size={16} />
            </button>
            <button
              onClick={() => setFilters(f => ({ ...f, holidays: !f.holidays }))}
              className={`p-1.5 rounded-lg transition-all ${filters.holidays ? 'bg-red-500 text-white shadow-md' : 'text-gray-400'}`}
              title="Feriados"
            >
              <IconTarget size={16} />
            </button>
            <button
              onClick={() => setFilters(f => ({ ...f, shifts: !f.shifts }))}
              className={`p-1.5 rounded-lg transition-all ${filters.shifts ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400'}`}
              title="Escala de Trabalho"
            >
              <IconClock size={16} />
            </button>
          </div>

          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase">
              <select
                className="bg-transparent border-none outline-none cursor-pointer hover:text-blue-600 transition-colors"
                value={config.uf}
                onChange={(e) => onConfigChange({ ...config, uf: e.target.value })}
              >
                {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
              </select>
              <div className="w-1 h-1 rounded-full bg-palette-mediumDark"></div>
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
              onClick={() => setIsReportModalOpen(true)}
              className="mt-1 flex items-center gap-2 px-4 py-1.5 bg-indigo-600 text-white rounded-full text-xs font-black uppercase tracking-wider hover:bg-indigo-700 transition-all shadow-md active:scale-95 active:shadow-none mr-2"
            >
              <IconFileText size={14} /> Relatórios
            </button>
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
        <div className="flex-1 overflow-y-auto p-4 bg-palette-mediumLight dark:bg-black/30 custom-scrollbar">
          <div className="max-w-6xl mx-auto flex flex-col gap-4">

            {/* Weekdays indicator */}
            <div className="grid grid-cols-7 gap-4 mb-2">
              {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map(d => (
                <div key={d} className="text-[10px] font-black text-palette-darkest/40 uppercase tracking-[0.2em] text-center">
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
                      min-h-[120px] rounded-2xl p-3 flex flex-col transition-all cursor-pointer group shadow-sm relative
                      ${isSel
                        ? 'bg-palette-lightest dark:bg-gray-800 ring-2 ring-blue-500 -translate-y-1 shadow-xl z-10'
                        : 'bg-palette-lightest/80 dark:bg-gray-900/60 hover:bg-palette-lightest dark:hover:bg-gray-800 hover:-translate-y-0.5 hover:shadow-lg'}
                      ${isTodayDate ? 'border-2 border-dashed border-blue-400' : 'border border-palette-mediumLight dark:border-gray-800'}
                    `}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`
                          text-lg font-black italic tracking-tighter
                          ${isSel || isTodayDate ? 'text-blue-600 dark:text-blue-400' : (isWeekend ? 'text-red-300 dark:text-red-500/50' : 'text-palette-darkest dark:text-gray-100')}
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
                      {/* Lua */}
                      {dayObj.moon && filters.moon && (
                        <div className="absolute top-2 right-2 opacity-60">
                          {dayObj.moon.phase === 'full' ? <LucideMoonStar size={14} className="text-yellow-500 fill-yellow-500" /> : <LucideMoon size={12} className="text-slate-300 fill-slate-300" />}
                        </div>
                      )}

                      {/* Indicador de Turno mais visual */}
                      {shift && filters.shifts && (
                        <div className={`
                             px-2 py-1 rounded-lg flex items-center gap-1.5 text-[9px] font-black uppercase tracking-tighter
                             ${isWork
                            ? (isNight ? 'bg-indigo-50 text-indigo-700' : 'bg-blue-50 text-blue-700')
                            : 'bg-palette-mediumLight text-palette-darkest/40'}
                           `}>
                          {isWork ? (isNight ? <LucideMoon size={10} /> : <IconSun size={10} />) : <IconCoffee size={10} />}
                          <span className="truncate">{isWork ? `${shift.startTime} - ${shift.endTime}` : 'Folga'}</span>
                        </div>
                      )}

                      {/* Feriados e Datas Comemorativas */}
                      {dayObj.holidays.filter(h => filters.holidays || h.type === 'commemorative').map((h, idx) => (
                        <div
                          key={idx}
                          className={`
                            px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded flex items-center gap-1
                            ${h.type === 'commemorative' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-red-500 text-white'}
                          `}
                        >
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
                        <span className="text-[8px] font-bold text-palette-darkest/40 uppercase">+{dayObj.userEvents.length - 2} Eventos</span>
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
                <div className="w-2 h-2 rounded-full bg-palette-mediumDark"></div>
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
        <div className="w-96 bg-palette-lightest dark:bg-gray-900 border-l border-palette-mediumDark dark:border-gray-800 flex flex-col shadow-2xl z-10 transition-all duration-300 transform">
          <div className="p-6 border-b border-palette-mediumLight">
            <div className="flex flex-col">
              <span className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">
                Compromissos
              </span>
              <h2 className="text-2xl font-black text-palette-darkest dark:text-white leading-tight">
                {new Date(selectedDayStr + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
              </h2>
              <span className="text-xs font-bold text-palette-darkest/40 uppercase tracking-widest">
                {new Date(selectedDayStr + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long' })}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-palette-mediumLight/50 dark:bg-black/20">

            {/* Visual Shift Card */}
            {selectedData.shift && (
              <div className={`
                      rounded-3xl p-6 shadow-lg transform transition-transform hover:scale-105 active:scale-95
                      ${selectedData.shift.type === 'work'
                  ? (parseInt(selectedData.shift.startTime?.split(':')[0] || '0') >= 18
                    ? 'bg-gradient-to-br from-indigo-900 to-slate-900 text-white'
                    : 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white')
                  : 'bg-palette-lightest dark:bg-gray-900 border border-palette-mediumLight dark:border-gray-800 text-palette-darkest/40'}
                    `}>
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                    {selectedData.shift.type === 'work'
                      ? (parseInt(selectedData.shift.startTime?.split(':')[0] || '0') >= 18 ? <LucideMoon size={24} /> : <IconSun size={24} />)
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
                  <div className="text-lg font-black text-palette-darkest/80 italic uppercase">Dia de Folga</div>
                )}
              </div>
            )}

            {/* Lua no Sidebar */}
            {selectedData.moon && filters.moon && (
              <div className="bg-slate-900 rounded-3xl p-4 flex items-center gap-4 text-white border border-slate-800 shadow-xl overflow-hidden relative">
                <div className="absolute -right-4 -top-4 opacity-10">
                  <LucideMoon size={80} />
                </div>
                <div className={`p-3 rounded-2xl ${selectedData.moon.phase === 'full' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/10 text-slate-300'}`}>
                  {selectedData.moon.phase === 'full' ? <LucideMoonStar size={24} /> : <LucideMoon size={24} />}
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase opacity-60 block">Fase Lunar</span>
                  <span className="text-lg font-black italic tracking-tighter">{selectedData.moon.name}</span>
                </div>
              </div>
            )}

            {/* Empty State */}
            {selectedData.hols.length === 0 && selectedData.evs.length === 0 && !selectedData.shift && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="text-xs font-black text-palette-darkest/40 uppercase tracking-widest">Dia inteiramente livre</span>
              </div>
            )}

            {/* List of Other Events */}
            <div className="space-y-3">
              {selectedData.hols.map((h, i) => (
                <div
                  key={i}
                  className={`
                    rounded-2xl p-4 flex gap-4 items-start shadow-sm border-l-4
                    ${h.type === 'commemorative'
                      ? 'bg-amber-50 border-amber-100 border-l-amber-500'
                      : 'bg-red-50 border-red-100 border-l-red-500'}
                  `}
                >
                  <div className={`p-2 rounded-xl ${h.type === 'commemorative' ? 'bg-amber-500' : 'bg-red-500'} text-white`}>
                    <IconTarget size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${h.type === 'commemorative' ? 'text-amber-600' : 'text-red-600'}`}>
                      {h.type === 'national' ? 'Feriado Nacional' : h.type === 'state' ? 'Feriado Estadual' : 'Data Comemorativa'}
                    </span>
                    <span className="text-sm font-black text-palette-darkest dark:text-white uppercase italic tracking-tighter">{h.name}</span>
                  </div>
                </div>
              ))}

              {selectedData.evs.map((e) => (
                <div key={e.id} className="bg-palette-lightest dark:bg-gray-900 border border-palette-mediumLight dark:border-gray-800 rounded-2xl p-4 flex gap-4 items-start shadow-sm border-l-4 border-l-blue-600 group relative">
                  <div className={`p-2 rounded-xl ${e.id.startsWith('google_') ? 'bg-blue-50 text-blue-600' : 'bg-blue-600 text-white'}`}>
                    {e.id.startsWith('google_') ? <IconBrandGoogle size={18} /> : (eventIcons[e.type] || <IconSparkles size={18} />)}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-[9px] font-black text-palette-darkest/40 uppercase tracking-widest">{e.id.startsWith('google_') ? 'Sincronizado' : e.type}</span>
                    <span className="text-sm font-black text-palette-darkest dark:text-white uppercase italic tracking-tighter truncate">{e.title}</span>
                    {e.description && (
                      <p className="text-[10px] text-palette-darkest/50 mt-2 leading-relaxed bg-palette-mediumLight dark:bg-black/20 p-2 rounded-lg border border-dashed border-palette-mediumDark dark:border-gray-800">
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

          <div className="p-6 bg-palette-lightest dark:bg-gray-900 border-t border-palette-mediumLight dark:border-gray-800">
            <div className="flex items-center justify-between text-[10px] font-bold text-palette-darkest/40 uppercase tracking-widest">
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
          <div className="bg-palette-lightest dark:bg-gray-900 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
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
                  <label className="text-[10px] font-black uppercase text-palette-darkest/40 tracking-widest block mb-1">O que vai acontecer?</label>
                  <input
                    required
                    className="w-full px-4 py-3 bg-palette-mediumLight dark:bg-gray-800 border border-palette-mediumDark dark:border-gray-700 rounded-2xl text-sm font-black italic placeholder:text-gray-300 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-palette-lightest dark:focus:bg-gray-900 transition-all uppercase text-palette-darkest dark:text-white"
                    value={newEvent.title}
                    onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                    autoFocus
                    placeholder="Título do compromisso..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-palette-darkest/40 tracking-widest block mb-1">Categoria:</label>
                    <select
                      className="w-full px-4 py-3 bg-palette-mediumLight dark:bg-gray-800 border border-palette-mediumDark dark:border-gray-700 rounded-2xl text-xs font-bold outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500 text-palette-darkest dark:text-white"
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
                    <label className="text-[10px] font-black uppercase text-palette-darkest/40 tracking-widest block mb-1">Status:</label>
                    <div className="w-full px-4 py-3 bg-palette-mediumLight dark:bg-gray-800 border border-palette-mediumDark dark:border-gray-700 rounded-2xl text-[10px] font-black text-green-600 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Confirmado
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-palette-darkest/40 tracking-widest block mb-1">Notas (Opcional):</label>
                  <textarea
                    className="w-full px-4 py-3 bg-palette-mediumLight dark:bg-gray-800 border border-palette-mediumDark dark:border-gray-700 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24 text-palette-darkest dark:text-white"
                    value={newEvent.description}
                    onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Adicione detalhes aqui..."
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 px-4 py-3 bg-palette-mediumLight dark:bg-gray-800 text-palette-darkest/60 dark:text-gray-400 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-palette-mediumDark dark:hover:bg-gray-700 transition-colors">Cancelar</button>
                <button type="submit" className="flex-2 px-8 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2">
                  <IconPlus size={16} /> Gravar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal de Relatório Integrado */}
      {isReportModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-palette-lightest dark:bg-gray-900 w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-indigo-700 to-purple-800 text-white p-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-black uppercase tracking-[0.3em] opacity-60">Centro de Inteligência</span>
                <button onClick={() => setIsReportModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">×</button>
              </div>
              <h1 className="text-3xl font-black italic tracking-tighter">Relatório Estratégico</h1>
              <p className="text-indigo-100 text-sm mt-1">Análise de Performance: {monthNames[month]} {year}</p>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {/* Resumo Financeiro */}
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2 text-emerald-700 dark:text-emerald-400">
                    <IconTrendingUp size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Financeiro</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg font-black text-emerald-900 dark:text-emerald-200">
                      {financialTransactions.filter(t => new Date(t.date).getMonth() === month && new Date(t.date).getFullYear() === year).length}
                    </span>
                    <span className="text-[9px] font-bold text-emerald-600/60 uppercase">Transações no período</span>
                  </div>
                </div>

                {/* Resumo Operacional */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2 text-blue-700 dark:text-blue-400">
                    <IconFileText size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Operações</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg font-black text-blue-900 dark:text-blue-200">
                      {orderAnnotations.filter(o => new Date(o.date).getMonth() === month && new Date(o.date).getFullYear() === year).length}
                    </span>
                    <span className="text-[9px] font-bold text-blue-600/60 uppercase">Notas registradas</span>
                  </div>
                </div>

                {/* Resumo de Logística/Estoque */}
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2 text-amber-700 dark:text-amber-400">
                    <IconFileDownload size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Almoxarifado</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg font-black text-amber-900 dark:text-amber-200">
                      {warehouseLogs.filter(l => new Date(l.date).getMonth() === month && new Date(l.date).getFullYear() === year).length}
                    </span>
                    <span className="text-[9px] font-bold text-amber-600/60 uppercase">Movimentações</span>
                  </div>
                </div>

                {/* Resumo de Equipe */}
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2 text-purple-700 dark:text-purple-400">
                    <IconUsers size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Escala</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg font-black text-purple-900 dark:text-purple-200">
                      {Array.from(projectedShifts.values()).filter(s => s.type === 'work').length}
                    </span>
                    <span className="text-[9px] font-bold text-purple-600/60 uppercase">Dias de plantão</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-palette-mediumLight dark:border-gray-800">
                <button 
                  onClick={() => setIsReportModalOpen(false)} 
                  className="flex-1 px-4 py-4 bg-palette-mediumLight dark:bg-gray-800 text-palette-darkest/60 dark:text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-palette-mediumDark dark:hover:bg-gray-700 transition-colors"
                >
                  Fechar
                </button>
                <button 
                  onClick={() => {
                    generateIntegratedReport();
                    setIsReportModalOpen(false);
                  }} 
                  className="flex-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <IconFileDownload size={16} /> Gerar Relatório PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function generateIntegratedReport() {
    const monthTransactions = financialTransactions.filter(t => new Date(t.date).getMonth() === month && new Date(t.date).getFullYear() === year);
    const monthLogs = warehouseLogs.filter(l => new Date(l.date).getMonth() === month && new Date(l.date).getFullYear() === year);
    const monthEvents = events.filter(e => new Date(e.date).getMonth() === month && new Date(e.date).getFullYear() === year);
    const monthOrders = orderAnnotations.filter(o => new Date(o.date).getMonth() === month && new Date(o.date).getFullYear() === year);

    const income = monthTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = monthTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Relatório Integrado - ${monthNames[month]} ${year}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { font-family: 'Inter', sans-serif; color: #333; padding: 40px; line-height: 1.5; }
            .header { border-bottom: 4px solid #4f46e5; padding-bottom: 20px; margin-bottom: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
            .header h1 { margin: 0; font-size: 32px; font-weight: 900; font-style: italic; text-transform: uppercase; letter-spacing: -1px; color: #4f46e5; }
            .header p { margin: 0; font-weight: 700; color: #666; text-transform: uppercase; font-size: 12px; }
            .grid { display: grid; grid-cols: 2; gap: 40px; margin-bottom: 40px; }
            .card { border: 1px solid #e5e7eb; border-radius: 20px; padding: 24px; background: #f9fafb; }
            .card h2 { margin-top: 0; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #9ca3af; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 16px; }
            .metric { font-size: 24px; font-weight: 900; color: #111827; margin-bottom: 4px; }
            .label { font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
            th { text-align: left; padding: 8px; background: #f3f4f6; text-transform: uppercase; font-size: 9px; }
            td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
            .footer { margin-top: 80px; text-align: center; font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; }
            .income { color: #059669; }
            .expense { color: #dc2626; }
            .total-row { background: #f9fafb; font-weight: 700; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <p>Relatório de Operações Mensais</p>
              <h1>${monthNames[month]} ${year}</h1>
            </div>
            <div style="text-align: right">
              <p>Emitido em: ${new Date().toLocaleDateString('pt-BR')}</p>
              <p>Documento de Inteligência</p>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px;">
            <div class="card">
              <h2>Performance Financeira</h2>
              <div class="metric income">R$ ${income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <div class="label">Entradas Totais</div>
              <div style="margin-top: 12px;"></div>
              <div class="metric expense">R$ ${expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <div class="label">Saídas Totais</div>
              <div style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed #ccc;"></div>
              <div class="metric">R$ ${(income - expense).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <div class="label">Saldo do Período</div>
            </div>

            <div class="card">
              <h2>Atividade Operacional</h2>
              <div class="metric">${monthOrders.length}</div>
              <div class="label">Notas e Pedidos Registrados</div>
              <div style="margin-top: 12px;"></div>
              <div class="metric">${monthLogs.length}</div>
              <div class="label">Movimentações de Estoque</div>
              <div style="margin-top: 12px;"></div>
              <div class="metric">${monthEvents.length}</div>
              <div class="label">Eventos e Compromissos</div>
            </div>
          </div>

          <div class="card" style="margin-bottom: 20px;">
            <h2>Destaques Financeiros</h2>
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Categoria</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                ${monthTransactions.slice(0, 5).map(t => `
                  <tr>
                    <td>${new Date(t.date).toLocaleDateString('pt-BR')}</td>
                    <td>${t.description}</td>
                    <td>${t.category}</td>
                    <td class="${t.type === 'income' ? 'income' : 'expense'}">${t.type === 'income' ? '+' : '-'} R$ ${t.amount.toLocaleString('pt-BR')}</td>
                  </tr>
                `).join('')}
                ${monthTransactions.length > 5 ? `<tr><td colspan="4" style="text-align: center; color: #999;">... e mais ${monthTransactions.length - 5} transações</td></tr>` : ''}
              </tbody>
            </table>
          </div>

          <div class="card">
            <h2>Agenda e Notas Críticas</h2>
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Título / Descrição</th>
                </tr>
              </thead>
              <tbody>
                ${monthEvents.map(e => `
                  <tr>
                    <td>${new Date(e.date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                    <td>EVENTO</td>
                    <td>${e.title}</td>
                  </tr>
                `).join('')}
                ${monthOrders.map(o => `
                  <tr>
                    <td>${new Date(o.date).toLocaleDateString('pt-BR')}</td>
                    <td>PEDIDO</td>
                    <td>${o.supplier || o.requester} - ${o.items?.length || 0} itens</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="footer">
            YS-Manager Strategic Intelligence System - Relatório Privado e Confidencial
          </div>

          <script>
            window.onload = () => {
              window.print();
              // window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
};
