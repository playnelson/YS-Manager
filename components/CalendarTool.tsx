
import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Loader2, Info, Plus, Trash2, Calendar as CalendarIcon, Bell, Users, Cake } from 'lucide-react';
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
  'SP': [{ day: 9, month: 7, name: 'Revolução Constitucionalista' }, { day: 20, month: 11, name: 'Dia da Consciência Negra' }],
  'RJ': [{ day: 23, month: 4, name: 'Dia de São Jorge' }, { day: 20, month: 11, name: 'Dia da Consciência Negra' }],
  'MG': [{ day: 21, month: 4, name: 'Data Magna de MG' }],
  // ... outros estados conforme necessário
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
      const nationalRes = await fetch(`https://brasilapi.com.br/api/feriados/v1/${year}`);
      const nationalData = await nationalRes.json();
      let combined: Holiday[] = Array.isArray(nationalData) ? nationalData.map((h: any) => ({
        date: h.date, name: h.name, type: 'national'
      })) : [];
      (STATE_HOLIDAYS_DB[config.uf] || []).forEach(sh => {
        combined.push({ date: `${year}-${String(sh.month).padStart(2, '0')}-${String(sh.day).padStart(2, '0')}`, name: sh.name, type: 'state' });
      });
      setHolidays([...combined, ...calculateDynamicDates(year)]);
    } catch (e) {
      console.error(e);
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

  const getDayEvents = (dateStr: string) => {
    const hols = holidays.filter(h => h.date === dateStr);
    const evs = events.filter(e => e.date === dateStr);
    return { hols, evs };
  };

  const selectedData = getDayEvents(selectedDayStr);
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  const eventIcons = {
    holiday: <CalendarIcon size={12} className="text-red-500" />,
    meeting: <Users size={12} className="text-blue-500" />,
    reminder: <Bell size={12} className="text-yellow-600" />,
    birthday: <Cake size={12} className="text-pink-500" />
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Top Bar */}
      <div className="win95-raised p-2 flex flex-wrap items-center gap-4 bg-win95-bg">
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-win95-blue" />
          <select className="win95-sunken px-1 py-0.5 text-xs outline-none bg-white text-black font-bold" value={config.uf} onChange={(e) => onConfigChange({ ...config, uf: e.target.value })}>
            {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
          </select>
          <input 
            className="win95-sunken px-2 py-0.5 text-xs outline-none bg-white text-black min-w-[120px]" 
            value={config.city} 
            onChange={(e) => onConfigChange({ ...config, city: e.target.value })} 
            placeholder="Cidade..."
          />
        </div>
        <div className="flex-1"></div>
        <div className="flex items-center gap-1">
          <Button size="sm" onClick={() => setCurrentDate(new Date(year, month - 1, 1))}><ChevronLeft size={14} /></Button>
          <div className="win95-sunken px-4 py-1 bg-white min-w-[150px] text-center font-bold text-xs text-black uppercase">
            {monthNames[month]} {year}
          </div>
          <Button size="sm" onClick={() => setCurrentDate(new Date(year, month + 1, 1))}><ChevronRight size={14} /></Button>
        </div>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Calendar Grid */}
        <div className="flex-1 win95-sunken bg-white p-1 flex flex-col">
          <div className="grid grid-cols-7 gap-px bg-win95-shadow border border-win95-shadow">
            {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'].map(d => (
              <div key={d} className="bg-win95-bg text-center text-[9px] font-bold py-1 border-b border-win95-shadow uppercase text-black">{d}</div>
            ))}
            {daysInMonth.map((dayObj, i) => {
              if (!dayObj) return <div key={`empty-${i}`} className="bg-[#e0e0e0]" />;
              const isToday = new Date().toDateString() === new Date(year, month, dayObj.day).toDateString();
              const isSelected = selectedDayStr === dayObj.date;
              const hasItems = dayObj.holidays.length > 0 || dayObj.userEvents.length > 0;
              
              return (
                <div 
                  key={dayObj.date} 
                  onClick={() => setSelectedDayStr(dayObj.date)}
                  className={`relative min-h-[60px] p-1 text-xs cursor-pointer group transition-colors 
                    ${isSelected ? 'bg-blue-50 ring-2 ring-inset ring-win95-blue z-10' : 'bg-white hover:bg-gray-50'}
                    ${isToday ? 'bg-yellow-50' : ''}`}
                >
                  <span className={`font-bold text-[10px] ${[0, 6].includes(i % 7) ? 'text-red-600' : 'text-black'} ${isToday ? 'underline' : ''}`}>
                    {dayObj.day}
                  </span>
                  <div className="mt-1 flex flex-col gap-0.5">
                    {dayObj.holidays.slice(0, 1).map((h, idx) => (
                      <div key={idx} className="bg-red-600 text-white text-[7px] px-1 truncate uppercase font-bold">{h.name}</div>
                    ))}
                    {dayObj.userEvents.slice(0, 2).map((e, idx) => (
                      <div key={idx} className="bg-win95-blue text-white text-[7px] px-1 truncate font-bold uppercase">{e.title}</div>
                    ))}
                    {(dayObj.userEvents.length + dayObj.holidays.length) > 3 && (
                      <div className="text-[7px] text-center font-bold text-win95-shadow">...</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar Agenda */}
        <div className="w-80 flex flex-col gap-2">
          <div className="win95-raised p-3 bg-win95-bg flex-1 flex flex-col">
            <div className="flex justify-between items-center border-b border-win95-shadow pb-2 mb-3">
              <h3 className="text-xs font-bold text-black uppercase flex items-center gap-2">
                <CalendarIcon size={14} /> Agenda: {new Date(selectedDayStr + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              </h3>
              <Button size="sm" onClick={() => setIsAddModalOpen(true)} className="px-2"><Plus size={12} /></Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {selectedData.hols.length === 0 && selectedData.evs.length === 0 && (
                <div className="text-center py-8 text-[10px] text-win95-shadow italic opacity-60">Nenhum evento para este dia.</div>
              )}
              
              {selectedData.hols.map((h, i) => (
                <div key={i} className="win95-sunken bg-white p-2 border-l-4 border-l-red-600">
                  <div className="text-[10px] font-bold text-red-700 uppercase">Feriado {h.type === 'national' ? 'Nacional' : 'Estadual'}</div>
                  <div className="text-xs font-bold text-black">{h.name}</div>
                </div>
              ))}

              {selectedData.evs.map((e) => (
                <div key={e.id} className="win95-raised bg-white p-2 group relative">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-1">
                      {eventIcons[e.type]}
                      <span className="text-[9px] font-bold uppercase text-win95-shadow">{e.type}</span>
                    </div>
                    <button onClick={() => deleteEvent(e.id)} className="opacity-0 group-hover:opacity-100 text-red-600 hover:scale-110 transition-all"><Trash2 size={12} /></button>
                  </div>
                  <div className="text-xs font-bold text-black">{e.title}</div>
                  {e.description && <div className="text-[10px] text-[#555] mt-1 italic">{e.description}</div>}
                </div>
              ))}
            </div>
          </div>
          
          <div className="win95-raised p-2 bg-win95-bg text-[9px] font-bold text-win95-shadow uppercase">
            Total do Mês: {events.filter(e => e.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)).length} Compromissos
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4">
          <div className="bg-win95-bg w-full max-w-xs win95-raised p-1">
            <div className="bg-win95-blue text-white px-2 py-1 text-sm font-bold flex justify-between items-center mb-2">
              <span>Novo Evento</span>
              <button onClick={() => setIsAddModalOpen(false)} className="win95-raised bg-win95-bg text-black w-5 h-5 flex items-center justify-center text-xs">×</button>
            </div>
            <form onSubmit={handleAddEvent} className="p-4 space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase block mb-1">Título do Evento</label>
                <input required className="w-full px-2 py-1 win95-sunken text-sm outline-none bg-white text-black font-bold" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} autoFocus />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase block mb-1">Tipo</label>
                <select className="w-full px-2 py-1 win95-sunken text-sm outline-none bg-white text-black" value={newEvent.type} onChange={e => setNewEvent({...newEvent, type: e.target.value as any})}>
                  <option value="reminder">Lembrete</option>
                  <option value="meeting">Reunião / Trabalho</option>
                  <option value="holiday">Feriado Local</option>
                  <option value="birthday">Aniversário</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase block mb-1">Notas (Opcional)</label>
                <textarea className="w-full px-2 py-1 win95-sunken text-xs outline-none bg-white text-black resize-none" rows={2} value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1">CANCELAR</Button>
                <Button type="submit" className="flex-1 bg-win95-blue text-white">ADICIONAR</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
