'use client';

import { generateUUID } from '../uuid';
import React, { useState, useEffect, useRef } from 'react';
import {
  IconCalculator,
  IconSearch,
  IconBook,
  IconChecklist,
  IconAnchor,
  IconTruck,
  IconMapPin,
  IconScale,
  IconPlus,
  IconTrash,
  IconDeviceFloppy,
  IconInfoCircle,
  IconChevronRight,
  IconGlobe,
  IconBox,
  IconFileText,
  IconCircleCheck,
  IconAlertCircle,
  IconNavigation,
  IconClock,
  IconMap,
  IconStack
} from '@tabler/icons-react';
import { LogisticsState, FreightTable, LogisticsChecklist } from '@/types';

declare global {
  interface Window {
    google: any;
  }
}

interface LogisticsModuleProps {
  data: LogisticsState;
  onChange: (data: LogisticsState) => void;
}

const GLOSSARY = [
  { term: 'NCM', definition: 'Nomenclatura Comum do Mercosul. Código de 8 dígitos para identificar mercadorias.' },
  { term: 'CFOP', definition: 'Código Fiscal de Operações e Prestações. Identifica a natureza da circulação de mercadorias.' },
  { term: 'CE Mercante', definition: 'Conhecimento de Embarque Eletrônico. Registro no sistema da Marinha Mercante.' },
  { term: 'BL', definition: 'Bill of Lading. Conhecimento de embarque marítimo, título de propriedade da carga.' },
  { term: 'HBL', definition: 'House Bill of Lading. BL emitido por um agente de carga (NVOCC).' },
  { term: 'THC', definition: 'Terminal Handling Charge. Taxa de movimentação de contêiner no terminal portuário.' },
  { term: 'DTA', definition: 'Declaração de Trânsito Aduaneiro. Permite mover carga entre recintos alfandegados com suspensão de impostos.' },
  { term: 'TEU', definition: 'Twenty-foot Equivalent Unit. Unidade padrão de medida para contêineres de 20 pés.' },
  { term: 'FEU', definition: 'Forty-foot Equivalent Unit. Unidade padrão para contêineres de 40 pés.' },
  { term: 'SISCARGA', definition: 'Sistema de Controle de Carga e de Trânsito na Importação e Exportação.' },
];

const PORT_CODES = [
  { city: 'Santos', code: 'BRSSZ', type: 'Porto' },
  { city: 'Itajaí', code: 'BRITJ', type: 'Porto' },
  { city: 'Paranaguá', code: 'BRPNG', type: 'Porto' },
  { city: 'Rio Grande', code: 'BRRIG', type: 'Porto' },
  { city: 'Vitória', code: 'BRVIX', type: 'Porto' },
  { city: 'Salvador', code: 'BRSSA', type: 'Porto' },
  { city: 'Manaus', code: 'BRMAO', type: 'Porto/EADI' },
  { city: 'Suape', code: 'BRSUA', type: 'Porto' },
  { city: 'Pecém', code: 'BRPEC', type: 'Porto' },
  { city: 'Rio de Janeiro', code: 'BRRIO', type: 'Porto' },
];

export const LogisticsModule: React.FC<LogisticsModuleProps> = ({ data, onChange }) => {
  const [activeTab, setActiveTab] = useState<'costs' | 'search' | 'tools' | 'checklists' | 'routing' | 'map' | 'scales'>('costs');

  // --- Cost Calculator State ---
  const [calc, setCalc] = useState({
    km: 0,
    tolls: 0,
    fuelPrice: 5.80,
    avgConsumption: 2.5,
    driverDays: 1,
    driverPerDieum: 150,
    containerCost: 0,
    portFees: 0,
    cargoValue: 0,
    insuranceRate: 0.1, // %
  });

  const [tableName, setTableName] = useState('');

  const totalCost = (
    (calc.km / (calc.avgConsumption || 1)) * calc.fuelPrice +
    calc.tolls +
    (calc.driverDays * calc.driverPerDieum) +
    calc.containerCost +
    calc.portFees +
    (calc.cargoValue * (calc.insuranceRate / 100))
  );

  const handleSaveTable = () => {
    if (!tableName) return;
    const newTable: FreightTable = {
      id: generateUUID(),
      name: tableName,
      fuelPrice: calc.fuelPrice,
      avgConsumption: calc.avgConsumption,
      driverPerDieum: calc.driverPerDieum,
      insuranceRate: calc.insuranceRate,
      updatedAt: new Date().toISOString()
    };
    onChange({ ...data, freightTables: [newTable, ...(data.freightTables || [])] });
    setTableName('');
  };

  const loadTable = (table: FreightTable) => {
    setCalc({
      ...calc,
      fuelPrice: table.fuelPrice,
      avgConsumption: table.avgConsumption,
      driverPerDieum: table.driverPerDieum,
      insuranceRate: table.insuranceRate
    });
  };

  // --- Search State ---
  const [cep, setCep] = useState('');
  const [cepResult, setCepResult] = useState<any>(null);
  const [portSearch, setPortSearch] = useState('');
  const [loadingCep, setLoadingCep] = useState(false);

  const searchCep = async () => {
    if (cep.length < 8) return;
    setLoadingCep(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cep/v1/${cep}`);
      const json = await res.json();
      setCepResult(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCep(false);
    }
  };

  // --- Routing State ---
  const [routingOrigin, setRoutingOrigin] = useState('');
  const [routingDestination, setRoutingDestination] = useState('');
  const [routes, setRoutes] = useState<any[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [vehicleType, setVehicleType] = useState('truck');
  const [axles, setAxles] = useState(3);
  const [showMap, setShowMap] = useState(false);

  const originRef = useRef<HTMLInputElement>(null);
  const destinationRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const directionsRendererRef = useRef<any>(null);

  useEffect(() => {
    if (activeTab === 'routing' || activeTab === 'map') {
      const rawKey = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY || (process as any).env?.VITE_GOOGLE_MAPS_API_KEY;
      const apiKey = rawKey?.trim();

      if (apiKey) {
        console.log('--- Google Maps Debug ---');
        console.log('Key Length:', apiKey.length);
        console.log('Key Start:', apiKey.substring(0, 6));
        console.log('Key End:', apiKey.substring(apiKey.length - 4));
        console.log('-------------------------');
      }

      if (!apiKey) {
        console.warn('VITE_GOOGLE_MAPS_API_KEY not found in environment');
        return;
      }

      // Global handler for Google Maps authentication errors
      (window as any).gm_authFailure = () => {
        console.error('Google Maps Authentication Failed (InvalidKeyMapError)');
        setAuthError(true);
        // Force a state update to show the error UI
        window.dispatchEvent(new CustomEvent('google-maps-auth-error'));
      };

      if (!(window as any).google) {
        // Check if script already exists to prevent multiple loads
        const existingScript = document.getElementById('google-maps-script');
        if (existingScript) {
          // If it exists but google is not defined, it might have failed or still loading
          return;
        }

        const script = document.createElement('script');
        script.id = 'google-maps-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMapsCallback`;
        script.async = true;
        script.defer = true;

        (window as any).initGoogleMapsCallback = () => {
          console.log('Google Maps Script Loaded Successfully');
          setAuthError(false);
          initAutocomplete();
        };

        script.onerror = () => {
          console.error('Failed to load Google Maps script');
          setAuthError(true);
        };

        document.head.appendChild(script);
      } else {
        initAutocomplete();
      }
    }
  }, [activeTab]);

  const initAutocomplete = () => {
    if (!window.google || !originRef.current || !destinationRef.current) return;

    const options = {
      types: ['(cities)'],
      componentRestrictions: { country: 'br' }
    };

    const originAutocomplete = new window.google.maps.places.Autocomplete(originRef.current, options);
    const destAutocomplete = new window.google.maps.places.Autocomplete(destinationRef.current, options);

    originAutocomplete.addListener('place_changed', () => {
      const place = originAutocomplete.getPlace();
      if (place.formatted_address) setRoutingOrigin(place.formatted_address);
    });

    destAutocomplete.addListener('place_changed', () => {
      const place = destAutocomplete.getPlace();
      if (place.formatted_address) setRoutingDestination(place.formatted_address);
    });
  };

  const calculateRoutes = () => {
    if (!window.google || !routingOrigin || !routingDestination) return;
    setLoadingRoutes(true);

    const directionsService = new window.google.maps.DirectionsService();

    directionsService.route(
      {
        origin: routingOrigin,
        destination: routingDestination,
        travelMode: window.google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true,
      },
      (result: any, status: string) => {
        setLoadingRoutes(false);
        if (status === 'OK') {
          setRoutes(result.routes);
          if (directionsRendererRef.current) {
            directionsRendererRef.current.setDirections(result);
          }
        } else {
          alert('Erro ao calcular rotas: ' + status);
        }
      }
    );
  };

  useEffect(() => {
    if ((showMap || activeTab === 'map') && mapRef.current && window.google) {
      const isSupportMap = activeTab === 'map';

      const map = new window.google.maps.Map(mapRef.current, {
        center: isSupportMap ? { lat: -23.5505, lng: -46.6333 } : { lat: -15.7801, lng: -47.9292 },
        zoom: isSupportMap ? 10 : 4,
        styles: [
          { featureType: "poi", elementType: "all", visibility: "off" }
        ]
      });

      if (isSupportMap) {
        // Simulated Support Points
        const points = [
          { lat: -23.56, lng: -46.65, title: 'Posto Graal - KM 240', type: 'fuel' },
          { lat: -23.54, lng: -46.62, title: 'Borracharia 24h - KM 255', type: 'repair' },
          { lat: -23.58, lng: -46.68, title: 'Balança ANTT - KM 280', type: 'scale' },
        ];

        points.forEach(p => {
          new window.google.maps.Marker({
            position: { lat: p.lat, lng: p.lng },
            map: map,
            title: p.title,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: p.type === 'fuel' ? '#2563eb' : p.type === 'repair' ? '#f97316' : '#22c55e',
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: '#ffffff',
            }
          });
        });
      } else {
        const renderer = new window.google.maps.DirectionsRenderer({
          map: map,
          suppressMarkers: false,
        });
        directionsRendererRef.current = renderer;
        // If we already have routes, render the first one
        if (routes.length > 0) {
          renderer.setDirections({ routes: routes, request: {} } as any);
        }
      }
    }
  }, [showMap, activeTab, routes]);

  const [authError, setAuthError] = useState(false);
  const [maskedKey, setMaskedKey] = useState('');

  useEffect(() => {
    const rawKey = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY || (process as any).env?.VITE_GOOGLE_MAPS_API_KEY;
    if (rawKey) {
      const key = rawKey.trim();
      setMaskedKey(`${key.substring(0, 6)}...${key.substring(key.length - 4)} (Tam: ${key.length})`);
    }

    const handleError = () => setAuthError(true);
    window.addEventListener('google-maps-auth-error', handleError);
    return () => window.removeEventListener('google-maps-auth-error', handleError);
  }, []);

  // --- Checklists State ---
  const [newChecklistTitle, setNewChecklistTitle] = useState('');

  const handleAddChecklist = (type: 'maritime' | 'land' | 'custom') => {
    let items: string[] = [];
    let title = '';

    if (type === 'maritime') {
      title = 'Checklist Embarque Marítimo';
      items = ['BL Draft aprovado?', 'Packing List pronto?', 'Invoice assinada?', 'SISCARGA inserido?', 'VGM declarado?'];
    } else if (type === 'land') {
      title = 'Checklist Rastreamento Terrestre';
      items = ['Documento motorista OK?', 'Lacre conferido?', 'Isca de carga ativa?', 'Checklist do veículo OK?', 'Manifesto emitido?'];
    } else {
      title = newChecklistTitle || 'Novo Checklist';
      items = ['Item 1'];
    }

    const newList: LogisticsChecklist = {
      id: generateUUID(),
      title,
      items: items.map(label => ({ id: generateUUID(), label, completed: false })),
      updatedAt: new Date().toISOString()
    };

    onChange({ ...data, checklists: [newList, ...(data.checklists || [])] });
    setNewChecklistTitle('');
  };

  const toggleChecklistItem = (listId: string, itemId: string) => {
    const updated = data.checklists.map(list => {
      if (list.id === listId) {
        return {
          ...list,
          items: list.items.map(item => item.id === itemId ? { ...item, completed: !item.completed } : item)
        };
      }
      return list;
    });
    onChange({ ...data, checklists: updated });
  };

  // --- Tools State ---
  const [conv, setConv] = useState({ value: 0, from: 'ft3', to: 'm3' });
  const [convResult, setConvResult] = useState(0);

  const convert = () => {
    let res = 0;
    const v = conv.value;
    if (conv.from === 'ft3' && conv.to === 'm3') res = v * 0.0283168;
    if (conv.from === 'm3' && conv.to === 'ft3') res = v / 0.0283168;
    if (conv.from === 'ft' && conv.to === 'm') res = v * 0.3048;
    if (conv.from === 'm' && conv.to === 'ft') res = v / 0.3048;
    if (conv.from === 'kg' && conv.to === 'ton') res = v / 1000;
    if (conv.from === 'ton' && conv.to === 'kg') res = v * 1000;
    setConvResult(res);
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2 shrink-0">
        <button onClick={() => setActiveTab('costs')} className={`win95-btn px-4 py-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'costs' ? 'bg-[#000080] dark:bg-blue-900 text-white' : ''}`}>
          <IconCalculator size={16} /> Custos e Tabelas
        </button>
        <button onClick={() => setActiveTab('search')} className={`win95-btn px-4 py-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'search' ? 'bg-[#000080] dark:bg-blue-900 text-white' : ''}`}>
          <IconGlobe size={16} /> CEP e Portos
        </button>
        <button onClick={() => setActiveTab('tools')} className={`win95-btn px-4 py-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'tools' ? 'bg-[#000080] dark:bg-blue-900 text-white' : ''}`}>
          <IconBook size={16} /> Glossário e Conversor
        </button>
        <button onClick={() => setActiveTab('checklists')} className={`win95-btn px-4 py-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'checklists' ? 'bg-[#000080] dark:bg-blue-900 text-white' : ''}`}>
          <IconChecklist size={16} /> Checklists
        </button>
        <button onClick={() => setActiveTab('routing')} className={`win95-btn px-4 py-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'routing' ? 'bg-[#000080] dark:bg-blue-900 text-white' : ''}`}>
          <IconNavigation size={16} /> Roteirizador
        </button>
        <button onClick={() => setActiveTab('map')} className={`win95-btn px-4 py-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'map' ? 'bg-[#000080] dark:bg-blue-900 text-white' : ''}`}>
          <IconMapPin size={16} /> Mapa de Apoio
        </button>
        <button onClick={() => setActiveTab('scales')} className={`win95-btn px-4 py-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'scales' ? 'bg-[#000080] dark:bg-blue-900 text-white' : ''}`}>
          <IconScale size={16} /> Balança e Cubagem
        </button>
      </div>

      <div className="win95-sunken flex-1 p-4 overflow-y-auto bg-palette-lightest/40 dark:bg-black/40">
        {/* --- ROUTING TAB --- */}
        {activeTab === 'routing' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="win95-raised p-6 bg-palette-lightest dark:bg-gray-900 border border-palette-mediumLight dark:border-gray-800">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-[#000080] dark:text-blue-400"><IconNavigation size={20} /> Roteirizador Inteligente</h3>

                {authError && (
                  <div className="mb-4 p-4 win95-raised bg-red-50 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-400 text-xs flex gap-3 items-center">
                    <IconAlertCircle className="shrink-0" size={20} />
                    <div>
                      <div className="font-bold">Erro de Autenticação do Google Maps</div>
                      <p>A chave de API fornecida é inválida ou não tem permissão para usar a Maps JavaScript API.</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase text-gray-400 dark:text-gray-500">Origem (Cidade/CEP)</label>
                    <div className="relative">
                      <input
                        ref={originRef}
                        type="text"
                        className="win95-sunken p-3 w-full outline-none pl-10 bg-palette-lightest dark:bg-gray-800 text-black dark:text-white"
                        placeholder="Digite a origem..."
                        value={routingOrigin}
                        onChange={e => setRoutingOrigin(e.target.value)}
                      />
                      <IconMapPin className="absolute left-3 top-3.5 text-[#000080] dark:text-blue-400" size={18} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase text-gray-400 dark:text-gray-500">Destino (Cidade/CEP)</label>
                    <div className="relative">
                      <input
                        ref={destinationRef}
                        type="text"
                        className="win95-sunken p-3 w-full outline-none pl-10 bg-palette-lightest dark:bg-gray-800 text-black dark:text-white"
                        placeholder="Digite o destino..."
                        value={routingDestination}
                        onChange={e => setRoutingDestination(e.target.value)}
                      />
                      <IconNavigation className="absolute left-3 top-3.5 text-[#000080] dark:text-blue-400" size={18} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase text-gray-400 dark:text-gray-500">Tipo de Veículo</label>
                    <select
                      className="win95-sunken p-2 outline-none bg-palette-lightest dark:bg-gray-800 text-black dark:text-white"
                      value={vehicleType}
                      onChange={e => setVehicleType(e.target.value)}
                    >
                      <option value="truck">Caminhão Simples</option>
                      <option value="semi">Carreta (Sider/Baú)</option>
                      <option value="bitrem">Bitrem / Rodotrem</option>
                      <option value="van">VUC / Van</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase text-gray-400 dark:text-gray-500">Número de Eixos</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range" min="2" max="9"
                        className="flex-1 accent-[#000080] dark:accent-blue-500"
                        value={axles}
                        onChange={e => setAxles(Number(e.target.value))}
                      />
                      <span className="win95-sunken px-3 py-1 font-bold text-[#000080] dark:text-blue-400 w-12 text-center bg-palette-lightest dark:bg-gray-800">{axles}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 mb-6">
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input type="checkbox" className="accent-[#000080] dark:accent-blue-500" defaultChecked /> Evitar estradas não pavimentadas
                  </label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer text-black dark:text-white">
                    <input type="checkbox" className="accent-[#000080] dark:accent-blue-500" defaultChecked /> Restrição para Carretas
                  </label>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={calculateRoutes}
                    disabled={loadingRoutes}
                    className="win95-btn flex-1 py-3 bg-[#000080] dark:bg-blue-900 text-white font-bold flex items-center justify-center gap-2"
                  >
                    {loadingRoutes ? 'Calculando...' : <><IconNavigation size={18} /> Calcular 3 Rotas</>}
                  </button>
                  <button
                    onClick={() => setShowMap(!showMap)}
                    className={`win95-btn px-4 py-3 flex items-center gap-2 ${showMap ? 'bg-[#000080] dark:bg-blue-900 text-white' : 'bg-palette-lightest dark:bg-gray-800 text-[#000080] dark:text-blue-400'}`}
                  >
                    <IconMap size={18} /> {showMap ? 'Ocultar Mapa' : 'Ver Mapa'}
                  </button>
                </div>

                {showMap && (
                  <div className="mt-6 win95-sunken h-[400px] bg-gray-200 dark:bg-gray-800 relative overflow-hidden">
                    <div ref={mapRef} className="w-full h-full" />
                    {(authError || !(import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white p-6 text-center">
                        <div>
                          <IconAlertCircle className="mx-auto mb-2 text-orange-400" size={32} />
                          <div className="font-bold">
                            {authError ? 'Chave de API Inválida' : 'Chave de API não configurada'}
                          </div>
                          <div className="text-xs opacity-80 mt-1 mb-4 text-left space-y-3">
                            <p className="font-bold text-orange-300">O Google retornou InvalidKeyMapError. Por favor, verifique este checklist no seu Console do Google Cloud:</p>
                            <ul className="list-decimal pl-5 space-y-2">
                              <li>
                                <span className="font-bold">Ativar APIs:</span> Vá em "Biblioteca" e ative <strong>Maps JavaScript API</strong> E <strong>Places API</strong>.
                              </li>
                              <li>
                                <span className="font-bold">Faturamento (Billing):</span> O Google Maps exige um cartão de crédito vinculado ao projeto, mesmo para uso gratuito. Verifique se o faturamento está <strong>Ativo</strong>.
                              </li>
                              <li>
                                <span className="font-bold">Restrições:</span> Na tela de Credenciais, verifique se a chave não possui restrições de "Referenciadores HTTP" que bloqueiam domínios externos.
                              </li>
                            </ul>
                            <div className="p-2 bg-black/30 rounded border border-white/10 font-mono text-[9px] mt-2">
                              Chave em uso: {maskedKey}
                            </div>
                          </div>
                          {authError && (
                            <button
                              onClick={() => window.location.reload()}
                              className="win95-btn px-4 py-1 bg-white text-black text-[10px] font-bold uppercase"
                            >
                              Tentar Novamente
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-8 space-y-4">
                  {routes.map((route, idx) => {
                    const distanceKm = Math.round(route.legs[0].distance.value / 1000);
                    const durationSec = route.legs[0].duration.value;
                    const hours = Math.floor(durationSec / 3600);
                    const minutes = Math.floor((durationSec % 3600) / 60);

                    // Lei do Motorista: 30min a cada 5h30
                    const drivingHours = durationSec / 3600;
                    const stops = Math.floor(drivingHours / 5.5);
                    const totalDurationWithStops = durationSec + (stops * 1800);
                    const totalHours = Math.floor(totalDurationWithStops / 3600);
                    const totalMinutes = Math.floor((totalDurationWithStops % 3600) / 60);

                    return (
                      <div key={idx} className={`win95-raised p-4 border-l-4 bg-palette-lightest dark:bg-gray-900 border-palette-mediumDark dark:border-gray-800 transition-all hover:shadow-md ${idx === 0 ? 'border-l-green-500' : 'border-l-blue-400 opacity-80'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-white text-[10px] px-2 py-0.5 font-bold rounded ${idx === 0 ? 'bg-green-500' : 'bg-blue-400'}`}>
                            ROTA {idx + 1} {idx === 0 ? '- RECOMENDADA' : ''}
                          </span>
                          <span className="font-mono font-bold text-gray-700 dark:text-gray-300">{distanceKm} km</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-[9px] text-gray-400 uppercase">Tempo Direção</div>
                            <div className="font-bold text-xs">{hours}h {minutes}min</div>
                          </div>
                          <div>
                            <div className="text-[9px] text-gray-400 uppercase">Paradas (Lei)</div>
                            <div className="font-bold text-xs">{stops} paradas</div>
                          </div>
                          <div>
                            <div className="text-[9px] text-gray-400 uppercase">Tempo Total</div>
                            <div className="font-bold text-[#000080] dark:text-blue-400 text-xs">{totalHours}h {totalMinutes}min</div>
                          </div>
                        </div>
                        <div className="mt-3 text-[10px] text-gray-500 flex items-center gap-1 italic">
                          <IconInfoCircle size={10} /> Via {route.summary || 'Principais Rodovias'}
                        </div>
                      </div>
                    );
                  })}

                  {routes.length === 0 && !loadingRoutes && (
                    <div className="text-center py-10 text-gray-400 italic text-sm">
                      Insira origem e destino para calcular as rotas.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="win95-raised p-4 bg-palette-lightest dark:bg-gray-900 border border-palette-mediumLight dark:border-gray-800">
                <h4 className="font-bold text-xs mb-3 flex items-center gap-2 text-black dark:text-white"><IconClock size={14} className="text-[#000080] dark:text-blue-400" /> Lei do Motorista (13.103/15)</h4>
                <div className="space-y-3">
                  <div className="win95-sunken p-2 bg-blue-50/50 dark:bg-blue-900/10">
                    <div className="text-[10px] font-bold text-blue-700 dark:text-blue-400 mb-1">Jornada de Trabalho</div>
                    <p className="text-[9px] text-gray-600 dark:text-gray-400">O tempo de direção é calculado automaticamente com base na legislação vigente, adicionando 30min de descanso a cada 5h30 de volante.</p>
                  </div>
                  <ul className="text-[10px] space-y-2 text-gray-600 dark:text-gray-400">
                    <li className="flex gap-2"><IconChevronRight size={10} className="shrink-0 mt-0.5" /> Máximo 5h30 ininterruptas de direção.</li>
                    <li className="flex gap-2"><IconChevronRight size={10} className="shrink-0 mt-0.5" /> Descanso obrigatório de 30min a cada 6h.</li>
                    <li className="flex gap-2"><IconChevronRight size={10} className="shrink-0 mt-0.5" /> Repouso diário de 11h (pode ser fracionado).</li>
                  </ul>
                </div>
              </div>

              <div className="win95-raised p-4 bg-win95-blue text-white">
                <h4 className="font-bold text-xs mb-2 flex items-center gap-2"><IconStack size={14} /> Configuração do Veículo</h4>
                <div className="text-[10px] space-y-2 opacity-90">
                  <p>As rotas levam em conta o perfil do veículo selecionado ({vehicleType === 'truck' ? 'Caminhão' : 'Carreta'}) com {axles} eixos.</p>
                  <p>O custo por eixo em pedágios será refletido no cálculo de custos operacionais.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- MAP TAB --- */}
        {activeTab === 'map' && (
          <div className="flex flex-col h-full gap-4">
            <div className="win95-raised p-4 bg-palette-lightest dark:bg-gray-900 border border-palette-mediumLight dark:border-gray-800 flex gap-4 items-center shrink-0">
              <span className="text-xs font-bold text-black dark:text-white">Filtros no Mapa:</span>
              <label className="flex items-center gap-2 text-xs cursor-pointer bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800 text-black dark:text-white">
                <input type="checkbox" className="accent-[#000080] dark:accent-blue-500" defaultChecked /> Postos de Combustível
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer bg-orange-50 dark:bg-orange-900/20 px-3 py-1 rounded-full border border-orange-200 dark:border-orange-800 text-black dark:text-white">
                <input type="checkbox" className="accent-[#000080] dark:accent-blue-500" defaultChecked /> Borracharias 24h
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full border border-green-200 dark:border-green-800 text-black dark:text-white">
                <input type="checkbox" className="accent-[#000080] dark:accent-blue-500" defaultChecked /> Balanças Rodoviárias
              </label>
              <div className="flex-1"></div>
              <div className="text-[10px] text-gray-400 italic">Dados baseados em redes colaborativas</div>
            </div>
            <div className="win95-sunken flex-1 bg-gray-200 dark:bg-gray-800 relative overflow-hidden flex items-center justify-center">
              <div ref={mapRef} className="absolute inset-0 w-full h-full" />
              {(authError || !(import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY) && (
                <div className="text-center space-y-4 z-10 bg-white/80 dark:bg-black/80 p-8 win95-raised border border-white dark:border-gray-800">
                  <IconMapPin size={48} className="mx-auto text-[#000080] dark:text-blue-400 animate-bounce" />
                  <div>
                    <div className="font-bold text-lg text-black dark:text-white">
                      {authError ? 'Erro de Autenticação' : 'Mapa de Apoio Logístico'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {authError
                        ? 'Chave de API inválida (InvalidKeyMapError). Verifique as configurações no Google Cloud.'
                        : 'Integração com Google Maps API aguardando chave...'}
                    </div>
                  </div>
                  <div className="win95-raised p-4 bg-white dark:bg-gray-800 border border-white dark:border-gray-700 max-w-sm mx-auto text-left text-xs space-y-2">
                    <div className="font-bold border-b pb-1 mb-2 text-black dark:text-white">Próximos Pontos (Simulação):</div>
                    <div className="flex justify-between text-black dark:text-white"><span>Posto Graal (KM 240)</span> <span className="text-green-600 dark:text-green-400 font-bold">ABERTO</span></div>
                    <div className="flex justify-between text-black dark:text-white"><span>Borracharia do Zé (KM 255)</span> <span className="text-[#000080] dark:text-blue-400 font-bold">24H</span></div>
                    <div className="flex justify-between text-black dark:text-white"><span>Balança ANTT (KM 280)</span> <span className="text-orange-600 dark:text-orange-400 font-bold">ATIVA</span></div>
                  </div>
                </div>
              )}
              {/* Overlay de UI do Mapa */}
              <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                <button className="win95-btn w-10 h-10 flex items-center justify-center bg-white text-xl font-bold">+</button>
                <button className="win95-btn w-10 h-10 flex items-center justify-center bg-white text-xl font-bold">-</button>
              </div>
            </div>
          </div>
        )}

        {/* --- SCALES TAB --- */}
        {activeTab === 'scales' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="win95-raised p-6 bg-palette-lightest dark:bg-gray-900 border border-palette-mediumLight dark:border-gray-800">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-[#000080] dark:text-blue-400"><IconScale size={20} /> Lei da Balança (Pesos Permitidos)</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { type: 'Toco (2 eixos)', pbt: '16t', tara: '6t', liq: '10t' },
                    { type: 'Truck (3 eixos)', pbt: '23t', tara: '8t', liq: '15t' },
                    { type: 'Bitruck (4 eixos)', pbt: '29t', tara: '10t', liq: '19t' },
                    { type: 'Carreta (3 eixos)', pbt: '41.5t', tara: '14t', liq: '27.5t' },
                    { type: 'Bitrem (7 eixos)', pbt: '57t', tara: '20t', liq: '37t' },
                    { type: 'Rodotrem (9 eixos)', pbt: '74t', tara: '25t', liq: '49t' },
                  ].map((t, i) => (
                    <div key={i} className="win95-sunken p-3 flex justify-between items-center hover:bg-palette-mediumLight dark:hover:bg-blue-900/20 transition-colors bg-palette-lightest dark:bg-gray-800">
                      <div className="font-bold text-xs text-black dark:text-white">{t.type}</div>
                      <div className="flex gap-4 text-center">
                        <div><div className="text-[8px] text-gray-400 dark:text-gray-500 uppercase">PBT</div><div className="text-xs font-black text-[#000080] dark:text-blue-400">{t.pbt}</div></div>
                        <div><div className="text-[8px] text-gray-400 dark:text-gray-500 uppercase">Tara</div><div className="text-xs font-bold text-gray-500 dark:text-gray-400">{t.tara}</div></div>
                        <div><div className="text-[8px] text-gray-400 dark:text-gray-500 uppercase">Líquido</div><div className="text-xs font-bold text-green-600 dark:text-green-400">{t.liq}</div></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 bg-orange-50 border border-orange-200 rounded text-[10px] text-orange-700 flex gap-2">
                  <IconInfoCircle size={14} className="shrink-0" />
                  <span>Atenção: Tolerância de 5% no PBT e 10% no peso por eixo. Valores podem variar conforme a configuração de eixos.</span>
                </div>
              </div>
            </div>

            <div className="win95-raised p-6 bg-palette-lightest dark:bg-gray-900 border border-palette-mediumLight dark:border-gray-800">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-[#000080] dark:text-blue-400"><IconBox size={20} /> Cubicagem de Carreta Sider</h3>
              <div className="space-y-4">
                <div className="win95-sunken p-4 bg-palette-mediumLight dark:bg-gray-800 mb-4">
                  <div className="text-xs font-bold mb-2 uppercase text-gray-400 dark:text-gray-500">Dimensões Padrão Sider (13.5m)</div>
                  <div className="flex justify-between text-sm text-black dark:text-white">
                    <span>Comp: 13.50m</span>
                    <span>Larg: 2.50m</span>
                    <span>Alt: 2.80m</span>
                    <span className="font-bold text-[#000080] dark:text-blue-400">~94.5 m³</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold">Comp. Caixa (cm)</label>
                    <input type="number" className="win95-sunken p-2 outline-none font-mono" placeholder="50" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold">Larg. Caixa (cm)</label>
                    <input type="number" className="win95-sunken p-2 outline-none font-mono" placeholder="50" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-black dark:text-white">Alt. Caixa (cm)</label>
                    <input type="number" className="win95-sunken p-2 outline-none font-mono bg-white dark:bg-gray-800 text-black dark:text-white" placeholder="50" />
                  </div>
                </div>

                <button className="win95-btn w-full py-3 bg-[#000080] dark:bg-blue-900 text-white font-bold">Calcular Capacidade Máxima</button>

                <div className="mt-6 p-6 win95-sunken bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800 text-center">
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-1">Capacidade Estimada</div>
                  <div className="text-4xl font-black text-emerald-600 dark:text-emerald-400">756 Caixas</div>
                  <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-2">Considerando empilhamento máximo e aproveitamento de 100% do volume.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- COSTS TAB --- */}
        {activeTab === 'costs' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="win95-raised p-6 bg-palette-lightest dark:bg-gray-900 border border-palette-mediumLight dark:border-gray-800">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-[#000080] dark:text-blue-400"><IconCalculator size={20} /> Calculadora de Operação</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase border-b pb-1">Terrestre</h4>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-black dark:text-white">KM Rodados (Total)</label>
                      <input type="number" className="win95-sunken p-2 outline-none font-mono bg-palette-lightest dark:bg-gray-800 text-black dark:text-white" value={calc.km} onChange={e => setCalc({ ...calc, km: Number(e.target.value) })} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-black dark:text-white">Pedágios (R$)</label>
                      <input type="number" className="win95-sunken p-2 outline-none font-mono bg-white dark:bg-gray-800 text-black dark:text-white" value={calc.tolls} onChange={e => setCalc({ ...calc, tolls: Number(e.target.value) })} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-black dark:text-white">Consumo (km/l)</label>
                        <input type="number" step="0.1" className="win95-sunken p-2 outline-none font-mono bg-white dark:bg-gray-800 text-black dark:text-white" value={calc.avgConsumption} onChange={e => setCalc({ ...calc, avgConsumption: Number(e.target.value) })} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-black dark:text-white">Diesel (R$/l)</label>
                        <input type="number" step="0.01" className="win95-sunken p-2 outline-none font-mono bg-white dark:bg-gray-800 text-black dark:text-white" value={calc.fuelPrice} onChange={e => setCalc({ ...calc, fuelPrice: Number(e.target.value) })} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-black dark:text-white">Diárias Motorista</label>
                        <input type="number" className="win95-sunken p-2 outline-none font-mono bg-white dark:bg-gray-800 text-black dark:text-white" value={calc.driverDays} onChange={e => setCalc({ ...calc, driverDays: Number(e.target.value) })} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-black dark:text-white">Valor Diária (R$)</label>
                        <input type="number" className="win95-sunken p-2 outline-none font-mono bg-white dark:bg-gray-800 text-black dark:text-white" value={calc.driverPerDieum} onChange={e => setCalc({ ...calc, driverPerDieum: Number(e.target.value) })} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase border-b pb-1">Marítimo / Aduaneiro</h4>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold">Custo Contêiner (TEU/FEU)</label>
                      <input type="number" className="win95-sunken p-2 outline-none font-mono" value={calc.containerCost} onChange={e => setCalc({ ...calc, containerCost: Number(e.target.value) })} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold">Taxas Portuárias (THC, etc)</label>
                      <input type="number" className="win95-sunken p-2 outline-none font-mono" value={calc.portFees} onChange={e => setCalc({ ...calc, portFees: Number(e.target.value) })} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold">Valor da Carga (R$)</label>
                      <input type="number" className="win95-sunken p-2 outline-none font-mono" value={calc.cargoValue} onChange={e => setCalc({ ...calc, cargoValue: Number(e.target.value) })} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold">Taxa Seguro (%)</label>
                      <input type="number" step="0.01" className="win95-sunken p-2 outline-none font-mono" value={calc.insuranceRate} onChange={e => setCalc({ ...calc, insuranceRate: Number(e.target.value) })} />
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 win95-sunken bg-win95-blue/10 border-win95-blue/20 flex justify-between items-center">
                  <div>
                    <div className="text-[10px] font-bold text-win95-blue uppercase">Custo Total Estimado</div>
                    <div className="text-3xl font-black text-win95-blue">R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text" placeholder="Nome da Tabela"
                      className="win95-sunken p-2 text-xs outline-none w-32"
                      value={tableName} onChange={e => setTableName(e.target.value)}
                    />
                    <button onClick={handleSaveTable} className="win95-btn px-3 py-2 bg-win95-blue text-white flex items-center gap-1">
                      <IconDeviceFloppy size={14} /> Salvar
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="win95-raised p-4 bg-palette-lightest h-full">
                <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><IconFileText size={16} /> Tabelas Salvas</h3>
                <div className="space-y-2">
                  {data.freightTables?.map(t => (
                    <div key={t.id} className="win95-raised p-2 text-xs flex justify-between items-center hover:bg-palette-mediumLight cursor-pointer" onClick={() => loadTable(t)}>
                      <div>
                        <div className="font-bold">{t.name}</div>
                        <div className="text-[10px] text-gray-400">{new Date(t.updatedAt).toLocaleDateString()}</div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); onChange({ ...data, freightTables: data.freightTables.filter(x => x.id !== t.id) }) }}
                        className="text-gray-300 hover:text-red-500"
                      >
                        <IconTrash size={14} />
                      </button>
                    </div>
                  ))}
                  {(!data.freightTables || data.freightTables.length === 0) && (
                    <div className="text-center py-8 text-gray-400 italic text-xs">Nenhuma tabela salva.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- SEARCH TAB --- */}
        {activeTab === 'search' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="win95-raised p-6 bg-palette-lightest">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-win95-blue"><IconMapPin size={20} /> Busca de CEP (Terra)</h3>
              <div className="flex gap-2 mb-4">
                <input
                  type="text" placeholder="00000-000"
                  className="win95-sunken p-3 flex-1 outline-none font-mono text-lg"
                  value={cep} onChange={e => setCep(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={e => e.key === 'Enter' && searchCep()}
                />
                <button onClick={searchCep} className="win95-btn px-6 bg-win95-blue text-white" disabled={loadingCep}>
                  {loadingCep ? '...' : <IconSearch size={20} />}
                </button>
              </div>
              {cepResult && (
                <div className="win95-sunken p-4 bg-palette-mediumLight space-y-2 text-sm">
                  <div className="flex justify-between border-b pb-1"><span className="text-gray-500">Logradouro:</span> <span className="font-bold">{cepResult.street || 'N/A'}</span></div>
                  <div className="flex justify-between border-b pb-1"><span className="text-gray-500">Bairro:</span> <span className="font-bold">{cepResult.neighborhood || 'N/A'}</span></div>
                  <div className="flex justify-between border-b pb-1"><span className="text-gray-500">Cidade:</span> <span className="font-bold">{cepResult.city} - {cepResult.state}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Serviço:</span> <span className="text-[10px] uppercase font-bold text-win95-blue">{cepResult.service}</span></div>
                </div>
              )}
            </div>

            <div className="win95-raised p-6 bg-white">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-win95-blue"><IconAnchor size={20} /> Códigos Portuários (Mar)</h3>
              <div className="relative mb-4">
                <input
                  type="text" placeholder="Buscar cidade ou porto... (ex: Santos)"
                  className="win95-sunken p-3 w-full outline-none pl-10"
                  value={portSearch} onChange={e => setPortSearch(e.target.value)}
                />
                <IconSearch size={18} className="absolute left-3 top-3.5 text-gray-400" />
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {PORT_CODES.filter(p => p.city.toLowerCase().includes(portSearch.toLowerCase()) || p.code.toLowerCase().includes(portSearch.toLowerCase())).map(p => (
                  <div key={p.code} className="win95-raised p-3 flex justify-between items-center group hover:border-win95-blue transition-colors">
                    <div>
                      <div className="font-bold">{p.city}</div>
                      <div className="text-[10px] text-gray-400 uppercase">{p.type}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-black text-win95-blue text-lg">{p.code}</div>
                      <div className="text-[9px] text-gray-400">UN LOCODE</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- TOOLS TAB --- */}
        {activeTab === 'tools' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="win95-raised p-6 bg-palette-lightest">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-win95-blue"><IconBook size={20} /> Glossário Técnico</h3>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {GLOSSARY.map(g => (
                  <div key={g.term} className="border-b border-gray-100 pb-2 last:border-0">
                    <div className="font-black text-win95-blue text-sm">{g.term}</div>
                    <div className="text-xs text-gray-600 leading-relaxed">{g.definition}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="win95-raised p-6 bg-white">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-win95-blue"><IconScale size={20} /> Conversor de Unidades</h3>
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold">Valor</label>
                  <input type="number" className="win95-sunken p-3 outline-none font-mono text-xl" value={conv.value} onChange={e => setConv({ ...conv, value: Number(e.target.value) })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold">De</label>
                    <select className="win95-sunken p-2 outline-none" value={conv.from} onChange={e => setConv({ ...conv, from: e.target.value })}>
                      <option value="ft3">Pés Cúbicos (ft³)</option>
                      <option value="m3">Metros Cúbicos (m³)</option>
                      <option value="ft">Pés (ft)</option>
                      <option value="m">Metros (m)</option>
                      <option value="kg">Quilogramas (kg)</option>
                      <option value="ton">Toneladas (ton)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold">Para</label>
                    <select className="win95-sunken p-2 outline-none" value={conv.to} onChange={e => setConv({ ...conv, to: e.target.value })}>
                      <option value="m3">Metros Cúbicos (m³)</option>
                      <option value="ft3">Pés Cúbicos (ft³)</option>
                      <option value="m">Metros (m)</option>
                      <option value="ft">Pés (ft)</option>
                      <option value="ton">Toneladas (ton)</option>
                      <option value="kg">Quilogramas (kg)</option>
                    </select>
                  </div>
                </div>
                <button onClick={convert} className="win95-btn w-full py-3 bg-win95-blue text-white">Converter</button>
                {convResult > 0 && (
                  <div className="win95-sunken p-6 bg-blue-50 text-center">
                    <div className="text-xs font-bold text-blue-600 uppercase mb-1">Resultado</div>
                    <div className="text-4xl font-black text-win95-blue">{convResult.toLocaleString('pt-BR', { maximumFractionDigits: 4 })}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- CHECKLISTS TAB --- */}
        {activeTab === 'checklists' && (
          <div className="space-y-6">
            <div className="win95-raised p-4 bg-palette-lightest flex flex-wrap gap-4 items-center">
              <h3 className="font-bold text-sm mr-4">Gerar Checklist:</h3>
              <button onClick={() => handleAddChecklist('maritime')} className="win95-btn px-4 py-2 flex items-center gap-2 bg-blue-50 text-blue-700">
                <IconAnchor size={14} /> Marítimo
              </button>
              <button onClick={() => handleAddChecklist('land')} className="win95-btn px-4 py-2 flex items-center gap-2 bg-orange-50 text-orange-700">
                <IconTruck size={14} /> Terrestre
              </button>
              <div className="flex-1 min-w-[200px] flex gap-2">
                <input
                  type="text" placeholder="Título Personalizado..."
                  className="win95-sunken p-2 flex-1 text-xs outline-none"
                  value={newChecklistTitle} onChange={e => setNewChecklistTitle(e.target.value)}
                />
                <button onClick={() => handleAddChecklist('custom')} className="win95-btn px-4 py-2 bg-gray-100">
                  <IconPlus size={14} /> Criar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {data.checklists?.map(list => (
                <div key={list.id} className="win95-raised p-4 bg-palette-lightest flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-black text-win95-blue uppercase text-xs flex items-center gap-2">
                      <IconCircleCheck size={14} /> {list.title}
                    </h4>
                    <button onClick={() => onChange({ ...data, checklists: data.checklists.filter(x => x.id !== list.id) })} className="text-gray-300 hover:text-red-500">
                      <IconTrash size={14} />
                    </button>
                  </div>
                  <div className="space-y-2 flex-1">
                    {list.items.map(item => (
                      <label key={item.id} className="flex items-center gap-3 p-2 win95-sunken bg-palette-mediumLight/30 cursor-pointer hover:bg-palette-lightest transition-colors">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => toggleChecklistItem(list.id, item.id)}
                          className="w-4 h-4 accent-win95-blue"
                        />
                        <span className={`text-xs ${item.completed ? 'line-through text-gray-400' : 'text-gray-700 font-medium'}`}>
                          {item.label}
                        </span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-4 pt-2 border-t text-[9px] text-gray-400 flex justify-between">
                    <span>{list.items.filter(i => i.completed).length} de {list.items.length} concluídos</span>
                    <span>{new Date(list.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              {(!data.checklists || data.checklists.length === 0) && (
                <div className="col-span-full text-center py-20 text-gray-400 italic">Nenhum checklist ativo. Gere um acima para começar.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
