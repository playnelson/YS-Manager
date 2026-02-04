
import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Loader2, Info } from 'lucide-react';
import { CalendarConfig, Holiday } from '../types';
import { Button } from './ui/Button';
import { GoogleGenAI, Type } from "@google/genai";

interface CalendarToolProps {
  config: CalendarConfig;
  onChange: (config: CalendarConfig) => void;
}

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export const CalendarTool: React.FC<CalendarToolProps> = ({ config, onChange }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoadingHolidays, setIsLoadingHolidays] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Load Cities from IBGE
  useEffect(() => {
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${config.uf}/municipios`)
      .then(res => res.json())
      .then(data => setCities(data.map((c: any) => c.nome).sort()));
  }, [config.uf]);

  // Fetch National & State/Municipal Holidays (Gemini + Search Grounding)
  const fetchHolidays = async () => {
    setIsLoadingHolidays(true);
    try {
      // 1. National Holidays (BrasilAPI)
      const nationalRes = await fetch(`https://brasilapi.com.br/api/feriados/v1/${year}`);
      const nationalData = await nationalRes.json();
      const mappedNational: Holiday[] = nationalData.map((h: any) => ({
        date: h.date,
        name: h.name,
        type: 'national'
      }));

      // 2. State & Municipal Holidays (Gemini API with Search Grounding)
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Liste os feriados estaduais de ${config.uf} e os feriados municipais da cidade de ${config.city} - ${config.uf} para o ano de ${year}. 
      Retorne APENAS um array JSON válido de objetos com as chaves: "date" (string no formato YYYY-MM-DD), "name" (string) e "type" (string, podendo ser "state" ou "municipal"). 
      Não inclua feriados nacionais que já são conhecidos (como Natal, Ano Novo, etc).`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING },
                name: { type: Type.STRING },
                type: { type: Type.STRING }
              },
              required: ["date", "name", "type"]
            }
          }
        },
      });

      let localHolidays: Holiday[] = [];
      try {
          localHolidays = JSON.parse(response.text || '[]');
      } catch (e) {
          console.error("Failed to parse Gemini response", e);
      }

      setHolidays([...mappedNational, ...localHolidays]);
    } catch (err) {
      console.error("Error fetching holidays:", err);
    } finally {
      setIsLoadingHolidays(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, [config.city, config.uf, year]);

  const daysInMonth = useMemo(() => {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    const days = [];
    
    // Padding start
    for (let i = 0; i < start.getDay(); i++) days.push(null);
    
    // Real days
    for (let i = 1; i <= end.getDate(); i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayHolidays = holidays.filter(h => h.date === dateStr);
      days.push({ day: i, date: dateStr, holidays: dayHolidays });
    }
    
    return days;
  }, [year, month, holidays]);

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(year, month + offset, 1));
  };

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Settings Bar */}
      <div className="win95-raised p-2 flex flex-wrap items-center gap-4 bg-win95-bg">
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-win95-blue" />
          <label className="text-xs font-bold text-black">Localização:</label>
          <select 
            className="win95-sunken px-1 py-0.5 text-xs outline-none bg-white text-black"
            value={config.uf}
            onChange={(e) => onChange({ ...config, uf: e.target.value })}
          >
            {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
          </select>
          <select 
            className="win95-sunken px-1 py-0.5 text-xs outline-none bg-white text-black min-w-[150px]"
            value={config.city}
            onChange={(e) => onChange({ ...config, city: e.target.value })}
          >
            {cities.map(city => <option key={city} value={city}>{city}</option>)}
          </select>
        </div>
        
        <div className="flex-1"></div>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => changeMonth(-1)}><ChevronLeft size={14} /></Button>
          <div className="win95-sunken px-4 py-1 bg-white min-w-[140px] text-center font-bold text-sm text-black">
            {monthNames[month]} {year}
          </div>
          <Button size="sm" onClick={() => changeMonth(1)}><ChevronRight size={14} /></Button>
        </div>

        {isLoadingHolidays && <Loader2 size={16} className="animate-spin text-win95-blue" />}
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Calendar Grid */}
        <div className="flex-1 win95-sunken bg-white p-2 flex flex-col">
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'].map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-win95-shadow py-1 bg-win95-bg border border-white border-b-win95-shadow border-r-win95-shadow">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 flex-1">
            {daysInMonth.map((dayObj, i) => {
              if (!dayObj) return <div key={`empty-${i}`} className="bg-[#f0f0f0] border border-transparent" />;
              
              const isToday = new Date().toDateString() === new Date(year, month, dayObj.day).toDateString();
              const hasHoliday = dayObj.holidays.length > 0;
              
              return (
                <div 
                  key={dayObj.date}
                  onClick={() => hasHoliday && setSelectedHoliday(dayObj.holidays[0])}
                  className={`
                    relative win95-raised p-1 text-xs cursor-default flex flex-col
                    ${isToday ? 'bg-yellow-50 outline outline-1 outline-win95-blueLight' : 'bg-white'}
                    ${hasHoliday ? 'cursor-pointer hover:bg-gray-100' : ''}
                  `}
                >
                  <span className={`font-bold ${isToday ? 'text-win95-blue underline' : 'text-black'}`}>{dayObj.day}</span>
                  
                  <div className="mt-1 flex flex-wrap gap-1">
                    {dayObj.holidays.map((h, idx) => (
                      <div 
                        key={idx}
                        title={h.name}
                        className={`
                          w-full h-1 rounded-full
                          ${h.type === 'national' ? 'bg-green-500' : h.type === 'state' ? 'bg-blue-500' : 'bg-yellow-500'}
                        `}
                      />
                    ))}
                  </div>
                  
                  {hasHoliday && dayObj.holidays.length === 1 && (
                    <span className="text-[8px] leading-tight text-win95-shadow truncate mt-auto">
                      {dayObj.holidays[0].name}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend and Info Sidebar */}
        <div className="w-64 flex flex-col gap-4">
          <div className="win95-raised p-3 bg-win95-bg">
            <h3 className="text-xs font-bold mb-3 border-b border-win95-shadow pb-1 flex items-center gap-2">
               <Info size={14} /> LEGENDA
            </h3>
            <div className="space-y-2 text-[11px]">
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 bg-green-500 border border-black/20" />
                 <span>Feriado Nacional</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 bg-blue-500 border border-black/20" />
                 <span>Feriado Estadual</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 bg-yellow-500 border border-black/20" />
                 <span>Feriado Municipal</span>
               </div>
            </div>
            <p className="mt-4 text-[9px] text-win95-shadow italic">
              * Feriados municipais e estaduais são consultados em tempo real via IA.
            </p>
          </div>

          {selectedHoliday && (
            <div className="win95-raised p-3 bg-white flex-1 animate-in fade-in slide-in-from-right-2">
              <div className="bg-win95-blue text-white px-2 py-0.5 text-[10px] font-bold mb-2 flex justify-between">
                <span>DETALHES</span>
                <button onClick={() => setSelectedHoliday(null)}>×</button>
              </div>
              <h4 className="text-sm font-bold text-black mb-1">{selectedHoliday.name}</h4>
              <p className="text-xs text-win95-shadow mb-4">
                {new Date(selectedHoliday.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <div className="win95-sunken p-2 bg-win95-bg text-[10px] text-black italic">
                {selectedHoliday.type === 'national' && "Este feriado é válido em todo o território brasileiro por lei federal."}
                {selectedHoliday.type === 'state' && `Celebração específica do estado de ${config.uf}.`}
                {selectedHoliday.type === 'municipal' && `Feriado local da cidade de ${config.city}.`}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
