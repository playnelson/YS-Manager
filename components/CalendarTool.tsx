
import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Loader2, Info, ExternalLink, Calendar as CalendarIcon } from 'lucide-react';
import { CalendarConfig, Holiday } from '../types';
import { Button } from './ui/Button';
import { GoogleGenAI, Type, GroundingChunk } from "@google/genai";

interface CalendarToolProps {
  config: CalendarConfig;
  onChange: (config: CalendarConfig) => void;
}

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

// Banco de dados estático de feriados estaduais brasileiros (Leis Fixas)
const STATE_HOLIDAYS_DB: Record<string, { day: number, month: number, name: string }[]> = {
  'AC': [{ day: 23, month: 1, name: 'Dia do Evangélico' }, { day: 8, month: 3, name: 'Dia da Mulher (Estadual)' }, { day: 15, month: 6, name: 'Aniversário do Acre' }, { day: 5, month: 9, name: 'Dia da Amazônia' }, { day: 17, month: 11, name: 'Tratado de Petrópolis' }],
  'AL': [{ day: 24, month: 6, name: 'Dia de São João' }, { day: 29, month: 6, name: 'Dia de São Pedro' }, { day: 16, month: 9, name: 'Emancipação de Alagoas' }, { day: 20, month: 11, name: 'Dia de Zumbi' }],
  'AP': [{ day: 19, month: 3, name: 'Dia de São José' }, { day: 13, month: 9, name: 'Criação do Território Federal' }],
  'AM': [{ day: 5, month: 9, name: 'Elevação do Amazonas à Categoria de Província' }, { day: 20, month: 11, name: 'Dia da Consciência Negra' }],
  'BA': [{ day: 2, month: 7, name: 'Independência da Bahia' }],
  'CE': [{ day: 25, month: 3, name: 'Data Magna do Ceará' }],
  'DF': [{ day: 21, month: 4, name: 'Fundação de Brasília' }, { day: 30, month: 11, name: 'Dia do Evangélico' }],
  'ES': [{ day: 8, month: 4, name: 'Nossa Senhora da Penha' }],
  'MA': [{ day: 28, month: 7, name: 'Adesão do Maranhão à Independência' }],
  'MT': [{ day: 20, month: 11, name: 'Dia da Consciência Negra' }],
  'MS': [{ day: 11, month: 10, name: 'Criação do Estado' }],
  'MG': [{ day: 21, month: 4, name: 'Data Magna de Minas Gerais' }],
  'PA': [{ day: 15, month: 8, name: 'Adesão do Pará à Independência' }],
  'PB': [{ day: 5, month: 8, name: 'Fundação da Paraíba' }],
  'PR': [{ day: 19, month: 12, name: 'Emancipação Política do Paraná' }],
  'PE': [{ day: 6, month: 3, name: 'Data Magna de Pernambuco' }],
  'PI': [{ day: 13, month: 3, name: 'Dia da Batalha do Jenipapo' }, { day: 19, month: 10, name: 'Dia do Piauí' }],
  'RJ': [{ day: 23, month: 4, name: 'Dia de São Jorge' }, { day: 20, month: 11, name: 'Dia da Consciência Negra' }],
  'RN': [{ day: 3, month: 10, name: 'Mártires de Cunhaú e Uruaçu' }],
  'RS': [{ day: 20, month: 9, name: 'Revolução Farroupilha' }],
  'RO': [{ day: 4, month: 1, name: 'Criação do Estado de Rondônia' }, { day: 18, month: 6, name: 'Dia do Evangélico' }],
  'RR': [{ day: 5, month: 10, name: 'Aniversário de Roraima' }],
  'SC': [{ day: 11, month: 8, name: 'Criação da Capitania' }],
  'SP': [{ day: 9, month: 7, name: 'Revolução Constitucionalista' }, { day: 20, month: 11, name: 'Consciência Negra' }],
  'SE': [{ day: 8, month: 7, name: 'Autonomia Política de Sergipe' }],
  'TO': [{ day: 8, month: 9, name: 'Nossa Senhora da Natividade' }, { day: 5, month: 10, name: 'Criação do Estado' }],
};

export const CalendarTool: React.FC<CalendarToolProps> = ({ config, onChange }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [sources, setSources] = useState<GroundingChunk[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Busca cidades do IBGE
  useEffect(() => {
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${config.uf}/municipios`)
      .then(res => res.json())
      .then(data => setCities(data.map((c: any) => c.nome).sort()));
  }, [config.uf]);

  // Função para calcular datas móveis (Páscoa, etc) e datas comemorativas
  const calculateDynamicDates = (y: number): Holiday[] => {
    const dates: Holiday[] = [];
    
    // Algoritmo de Meeus/Jones/Butcher para calcular a Páscoa
    const a = y % 19;
    const b = Math.floor(y / 100);
    const c = y % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const pascoaMonth = Math.floor((h + l - 7 * m + 114) / 31);
    const pascoaDay = ((h + l - 7 * m + 114) % 31) + 1;
    
    const pascoa = new Date(y, pascoaMonth - 1, pascoaDay);
    
    // Auxiliar para adicionar dias
    const addDays = (date: Date, days: number) => {
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result.toISOString().split('T')[0];
    };

    // Feriados Móveis
    dates.push({ date: addDays(pascoa, -47), name: 'Carnaval', type: 'optional' });
    dates.push({ date: addDays(pascoa, -2), name: 'Sexta-feira Santa', type: 'national' });
    dates.push({ date: addDays(pascoa, 0), name: 'Páscoa', type: 'national' });
    dates.push({ date: addDays(pascoa, 60), name: 'Corpus Christi', type: 'optional' });

    // Datas Comemorativas Fixas
    dates.push({ date: `${y}-06-12`, name: 'Dia dos Namorados', type: 'optional' });
    dates.push({ date: `${y}-10-12`, name: 'Dia das Crianças', type: 'national' }); // Também Nsa Sra Aparecida

    // Datas Comemorativas Móveis
    // Dia das Mães: 2º Domingo de Maio
    let mae = new Date(y, 4, 1);
    while (mae.getDay() !== 0) mae.setDate(mae.getDate() + 1);
    mae.setDate(mae.getDate() + 7);
    dates.push({ date: mae.toISOString().split('T')[0], name: 'Dia das Mães', type: 'optional' });

    // Dia dos Pais: 2º Domingo de Agosto
    let pai = new Date(y, 7, 1);
    while (pai.getDay() !== 0) pai.setDate(pai.getDate() + 1);
    pai.setDate(pai.getDate() + 7);
    dates.push({ date: pai.toISOString().split('T')[0], name: 'Dia dos Pais', type: 'optional' });

    return dates;
  };

  const fetchAllHolidays = async () => {
    setIsLoading(true);
    try {
      // 1. Nacionais via API
      const nationalRes = await fetch(`https://brasilapi.com.br/api/feriados/v1/${year}`);
      const nationalData = await nationalRes.json();
      let combined: Holiday[] = Array.isArray(nationalData) ? nationalData.map((h: any) => ({
        date: h.date,
        name: h.name,
        type: 'national'
      })) : [];

      // 2. Estaduais via Banco de Dados Interno
      const stateHolidays = STATE_HOLIDAYS_DB[config.uf] || [];
      stateHolidays.forEach(sh => {
        combined.push({
          date: `${year}-${String(sh.month).padStart(2, '0')}-${String(sh.day).padStart(2, '0')}`,
          name: sh.name,
          type: 'state'
        });
      });

      // 3. Datas Dinâmicas (Móveis/Comemorativas)
      combined = [...combined, ...calculateDynamicDates(year)];

      // 4. Municipais via Gemini (Otimizado)
      // Somente para encontrar feriados locais que não são óbvios
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Liste apenas os feriados MUNICIPAIS específicos da cidade de ${config.city} - ${config.uf} para o ano de ${year} (ex: aniversário da cidade ou padroeiro local). 
      Não repita feriados nacionais ou estaduais. Retorne apenas JSON: [{"date": "YYYY-MM-DD", "name": "string", "type": "municipal"}]`;

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

      if (response.text) {
        try {
          const municipal = JSON.parse(response.text);
          combined = [...combined, ...municipal];
        } catch (e) {}
      }

      // Remover duplicatas por data e nome
      const unique = combined.reduce((acc: Holiday[], current) => {
        const x = acc.find(item => item.date === current.date && item.name === current.name);
        if (!x) return acc.concat([current]);
        return acc;
      }, []);

      setHolidays(unique);
    } catch (err) {
      console.error("Erro ao carregar calendário:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllHolidays();
  }, [config.city, config.uf, year]);

  const daysInMonth = useMemo(() => {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    const days = [];
    for (let i = 0; i < start.getDay(); i++) days.push(null);
    for (let i = 1; i <= end.getDate(); i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayHolidays = holidays.filter(h => h.date === dateStr);
      days.push({ day: i, date: dateStr, holidays: dayHolidays });
    }
    return days;
  }, [year, month, holidays]);

  const changeMonth = (offset: number) => setCurrentDate(new Date(year, month + offset, 1));
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="win95-raised p-2 flex flex-wrap items-center gap-4 bg-win95-bg">
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-win95-blue" />
          <label className="text-[10px] font-bold text-black uppercase">Localidade:</label>
          <select className="win95-sunken px-1 py-0.5 text-xs outline-none bg-white text-black font-bold" value={config.uf} onChange={(e) => onChange({ ...config, uf: e.target.value })}>
            {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
          </select>
          <select className="win95-sunken px-1 py-0.5 text-xs outline-none bg-white text-black min-w-[150px]" value={config.city} onChange={(e) => onChange({ ...config, city: e.target.value })}>
            {cities.map(city => <option key={city} value={city}>{city}</option>)}
          </select>
        </div>
        <div className="flex-1"></div>
        <div className="flex items-center gap-1">
          <Button size="sm" onClick={() => changeMonth(-1)}><ChevronLeft size={14} /></Button>
          <div className="win95-sunken px-4 py-1 bg-white min-w-[150px] text-center font-bold text-sm text-black uppercase tracking-wider">
            {monthNames[month]} {year}
          </div>
          <Button size="sm" onClick={() => changeMonth(1)}><ChevronRight size={14} /></Button>
        </div>
        {isLoading && <Loader2 size={16} className="animate-spin text-win95-blue" />}
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        <div className="flex-1 win95-sunken bg-white p-2 flex flex-col shadow-inner">
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'].map(d => (
              <div key={d} className="text-center text-[9px] font-bold text-win95-shadow py-1 bg-win95-bg border border-white border-b-win95-shadow border-r-win95-shadow uppercase">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 flex-1">
            {daysInMonth.map((dayObj, i) => {
              if (!dayObj) return <div key={`empty-${i}`} className="bg-[#f8f8f8] border border-transparent opacity-50" />;
              const isToday = new Date().toDateString() === new Date(year, month, dayObj.day).toDateString();
              const hasHoliday = dayObj.holidays.length > 0;
              
              return (
                <div 
                  key={dayObj.date} 
                  onClick={() => hasHoliday && setSelectedHoliday(dayObj.holidays[0])} 
                  className={`relative win95-raised p-1 text-xs transition-colors flex flex-col group ${isToday ? 'bg-yellow-50 outline outline-2 outline-win95-blueLight z-10' : 'bg-white'} ${hasHoliday ? 'cursor-pointer hover:bg-blue-50' : ''}`}
                >
                  <span className={`font-bold text-[11px] ${isToday ? 'text-win95-blue' : 'text-black'} ${[0,6].includes(i % 7) ? 'text-red-600' : ''}`}>
                    {dayObj.day}
                  </span>
                  <div className="mt-auto flex flex-col gap-0.5">
                    {dayObj.holidays.slice(0, 2).map((h, idx) => (
                      <div 
                        key={idx} 
                        className={`text-[8px] px-1 truncate leading-tight border border-black/10 rounded-sm font-bold uppercase
                          ${h.type === 'national' ? 'bg-red-100 text-red-800' : 
                            h.type === 'state' ? 'bg-blue-100 text-blue-800' : 
                            h.type === 'municipal' ? 'bg-green-100 text-green-800' : 
                            'bg-gray-100 text-gray-800'}`}
                      >
                        {h.name}
                      </div>
                    ))}
                    {dayObj.holidays.length > 2 && <span className="text-[7px] text-center font-bold text-gray-400">+{dayObj.holidays.length - 2}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-72 flex flex-col gap-4 overflow-y-auto pr-1">
          <div className="win95-raised p-3 bg-win95-bg">
            <h3 className="text-xs font-bold mb-3 border-b border-win95-shadow pb-1 flex items-center gap-2 text-black uppercase">
              <Info size={14} /> Legenda e Infos
            </h3>
            <div className="space-y-2 text-[10px] font-bold">
               <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 border border-black/20" /><span>Feriado Nacional</span></div>
               <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 border border-black/20" /><span>Feriado Estadual</span></div>
               <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 border border-black/20" /><span>Feriado Municipal</span></div>
               <div className="flex items-center gap-2"><div className="w-3 h-3 bg-gray-400 border border-black/20" /><span>Data Comemorativa</span></div>
            </div>
            
            <div className="mt-4 pt-2 border-t border-win95-shadow">
              <p className="text-[9px] text-[#555] leading-relaxed italic">
                Os feriados nacionais e datas móveis (Páscoa/Carnaval) são calculados automaticamente. Feriados estaduais seguem a legislação de {config.uf}.
              </p>
            </div>
          </div>

          {selectedHoliday ? (
            <div className="win95-raised p-3 bg-white border-2 border-win95-blue animate-in zoom-in duration-75">
              <div className="bg-win95-blue text-white px-2 py-0.5 text-[10px] font-bold mb-2 flex justify-between uppercase tracking-tighter">
                <span>Detalhes do Evento</span>
                <button onClick={() => setSelectedHoliday(null)} className="hover:bg-red-500 px-1">×</button>
              </div>
              <h4 className="text-sm font-bold text-black mb-1">{selectedHoliday.name}</h4>
              <p className="text-xs text-win95-shadow mb-3 font-mono">
                {new Date(selectedHoliday.date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <div className="win95-sunken p-2 bg-win95-bg text-[10px] text-black leading-tight border-none">
                {selectedHoliday.type === 'national' && "Feriado oficial em todo o Brasil (Lei Federal)."}
                {selectedHoliday.type === 'state' && `Feriado oficial no Estado de ${config.uf}.`}
                {selectedHoliday.type === 'municipal' && `Feriado local da cidade de ${config.city}.`}
                {selectedHoliday.type === 'optional' && "Data comemorativa ou ponto facultativo."}
              </div>
            </div>
          ) : (
            <div className="win95-sunken p-4 bg-gray-50 flex-1 flex flex-col items-center justify-center text-center opacity-40">
               <CalendarIcon size={32} className="mb-2" />
               <p className="text-[9px] font-bold uppercase">Selecione um dia com marcação para ver detalhes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
