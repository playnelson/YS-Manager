'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, X, Calculator, RefreshCw, Save, FolderOpen, Play, Undo, Redo, Square, Copy, Clipboard, Eraser, FilePlus, Monitor, Edit } from 'lucide-react';
import { FlowState, FlowNode, FlowNodeType, FlowOperation, FlowTemplate } from '@/types';
import { Button } from '@/components/ui/Button';

interface FlowBuilderProps {
  data: FlowState;
  onChange: (data: FlowState) => void;
}

export const FlowBuilder: React.FC<FlowBuilderProps> = ({ data, onChange }) => {
  // Estados de Controle UI
  const [viewMode, setViewMode] = useState(true); // false = Editor, true = Apresentação

  // Estados do Editor
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectSource, setConnectSource] = useState<string | null>(null);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [clipboardNode, setClipboardNode] = useState<Partial<FlowNode> | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [saveMode, setSaveMode] = useState(false);

  const [activeInputId, setActiveInputId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const [history, setHistory] = useState<FlowState[]>([]);
  const [future, setFuture] = useState<FlowState[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);

  const saveHistory = () => {
    setHistory(prev => {
      const newHistory = [...prev, JSON.parse(JSON.stringify(data))];
      return newHistory.length > 50 ? newHistory.slice(1) : newHistory;
    });
    setFuture([]);
  };

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    const newHistory = history.slice(0, -1);
    setFuture(prev => [data, ...prev]);
    setHistory(newHistory);
    onChange(previous);
  }, [history, data, onChange]);

  const handleRedo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);
    setHistory(prev => [...prev, data]);
    setFuture(newFuture);
    onChange(next);
  }, [future, data, onChange]);

  const copyNode = useCallback(() => {
    if (!selectedNodeId) return;
    const node = data.nodes.find(n => n.id === selectedNodeId);
    if (node) {
      setClipboardNode({ ...node });
    }
  }, [selectedNodeId, data.nodes]);

  const pasteNode = useCallback(() => {
    if (!clipboardNode) return;
    saveHistory();
    const newNode: FlowNode = {
      ...(clipboardNode as FlowNode),
      id: `node_${Math.random().toString(36).substr(2, 9)}`,
      x: (clipboardNode.x || 0) + 20,
      y: (clipboardNode.y || 0) + 20,
      calculatedValue: null
    };
    onChange({ ...data, nodes: [...data.nodes, newNode] });
    setSelectedNodeId(newNode.id);
  }, [clipboardNode, data, onChange]);

  const copyToSystemClipboard = (val: number | undefined | null) => {
    if (val === undefined || val === null) return;
    navigator.clipboard.writeText(val.toString());
  };

  const removeNode = (id: string) => {
    if (viewMode) return;
    saveHistory();
    const newNodes = data.nodes.filter(n => n.id !== id);
    const newConnections = data.connections.filter(c => c.from !== id && c.to !== id);
    onChange({ ...data, nodes: newNodes, connections: newConnections });
    if (selectedNodeId === id) setSelectedNodeId(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcut handling if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo(); else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        copyNode();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        pasteNode();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId) removeNode(selectedNodeId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, copyNode, pasteNode, selectedNodeId]);

  const formatNumber = (num: number | undefined | null) => {
    if (num === undefined || num === null || isNaN(num)) return '0,00';
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
  };

  // --- ACTIONS ---

  const handleNewFlow = () => {
    if (data.nodes.length > 0) {
        if (!confirm("Tem certeza que deseja criar um novo fluxo? O trabalho atual não salvo será perdido.")) return;
    }
    saveHistory();
    onChange({ ...data, nodes: [], connections: [] });
    setSelectedNodeId(null);
  };

  const addNode = (type: FlowNodeType) => {
    if (viewMode) return;
    saveHistory();
    const newNode: FlowNode = {
      id: `node_${Math.random().toString(36).substr(2, 9)}`,
      type,
      x: 50 + Math.random() * 100,
      y: 50 + Math.random() * 100,
      label: type === 'input' ? 'Valor' : type === 'op' ? 'Cálculo' : 'Total',
      value: type === 'input' ? 0 : undefined,
      operation: type === 'op' ? '+' : undefined,
      calculatedValue: null
    };
    onChange({ ...data, nodes: [...data.nodes, newNode] });
    setSelectedNodeId(newNode.id);
  };

  const updateNode = (id: string, updates: Partial<FlowNode>, saveToHistory = false) => {
    if (saveToHistory) saveHistory();
    const newNodes = data.nodes.map(n => n.id === id ? { ...n, ...updates } : n);
    onChange({ ...data, nodes: newNodes });
  };

  const saveTemplate = () => {
    if (!templateName.trim()) return alert("Digite um nome para o modelo.");
    const newTemplate: FlowTemplate = { id: `tpl_${Math.random().toString(36).substr(2, 9)}`, name: templateName, nodes: data.nodes, connections: data.connections };
    onChange({ ...data, templates: [...(data.templates || []), newTemplate] });
    setTemplateName('');
    setIsTemplatesOpen(false);
    alert('Modelo salvo!');
  };

  const loadTemplate = (template: FlowTemplate) => {
    if (confirm("Carregar este modelo substituirá o trabalho atual. Continuar?")) {
      saveHistory();
      onChange({ ...data, nodes: template.nodes, connections: template.connections });
      setIsTemplatesOpen(false);
    }
  };

  const deleteTemplate = (id: string) => {
    if (confirm("Excluir este modelo?")) {
      onChange({ ...data, templates: data.templates.filter(t => t.id !== id) });
    }
  };

  const calculateFlow = useCallback(() => {
    let nodes = data.nodes.map(n => ({ ...n, calculatedValue: null as number | null }));
    const connections = data.connections;
    nodes.forEach(n => { if (n.type === 'input') n.calculatedValue = n.value || 0; });
    let changed = true;
    let iterations = 0;
    while (changed && iterations < 50) {
      changed = false;
      iterations++;
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.type === 'input' || node.calculatedValue !== null) continue;
        const sourceNodes = connections.filter(c => c.to === node.id).map(c => nodes.find(n => n.id === c.from)).filter((n): n is (FlowNode & { calculatedValue: number | null }) => !!n).sort((a, b) => a.y - b.y);
        const inputs = sourceNodes.map(n => n.calculatedValue);
        if (inputs.length === 0 || inputs.some(v => v === null)) continue;
        const v = inputs as number[];
        let res = 0;
        if (node.type === 'op') {
          switch (node.operation) {
            case '+': res = v.reduce((a, b) => a + b, 0); break;
            case '-': res = v.length > 0 ? v.reduce((a, b) => a - b) : 0; break;
            case '*': res = v.reduce((a, b) => a * b, 1); break;
            case '/': res = v.length > 0 ? v.reduce((a, b) => b === 0 ? 0 : a / b) : 0; break;
            case 'AVG': res = v.reduce((a, b) => a + b, 0) / v.length; break;
            case 'MAX': res = Math.max(...v); break;
            case 'MIN': res = Math.min(...v); break;
            case 'PCT': res = v.length >= 2 ? v[0] * (v[1] / 100) : (v[0] || 0); break;
            case 'POW': res = v.length >= 2 ? Math.pow(v[0], v[1]) : (v[0] || 0); break;
            default: res = 0;
          }
        } else res = v.length > 0 ? v[v.length - 1] : 0;
        if (nodes[i].calculatedValue !== res) { nodes[i].calculatedValue = res; changed = true; }
      }
    }
    onChange({ ...data, nodes });
  }, [data, onChange]);

  // Recalcular automaticamente se estiver no modo View e mudar inputs
  useEffect(() => {
      if (viewMode) calculateFlow();
  }, [data.nodes.map(n => n.value).join(','), viewMode]);

  const clearValues = () => {
    saveHistory();
    const newNodes = data.nodes.map(n => ({
      ...n,
      value: n.type === 'input' ? 0 : n.value,
      calculatedValue: null
    }));
    onChange({ ...data, nodes: newNodes });
  };

  const getFormulaDisplay = (node: FlowNode) => {
    if (node.type !== 'op') return null;
    const incoming = data.connections.filter(c => c.to === node.id).map(c => data.nodes.find(n => n.id === c.from)).filter(n => n && n.calculatedValue !== null && n.calculatedValue !== undefined).sort((a, b) => (a?.y || 0) - (b?.y || 0));
    if (incoming.length === 0) return <span className="text-gray-400">Aguardando entrada...</span>;
    const op = node.operation || '+';
    const symbolMap: Record<string, string> = { '+': ' + ', '-': ' - ', '*': ' × ', '/': ' ÷ ', 'AVG': ' , ', 'MAX': ' , ', 'MIN': ' , ', 'PCT': ' % de ', 'POW': ' ^ ' };
    const symbol = symbolMap[op] || ' ? ';
    const vals = incoming.map(n => formatNumber(n?.calculatedValue));
    if (['AVG', 'MAX', 'MIN'].includes(op)) return `${op}(${vals.join(', ')})`;
    if (op === 'PCT' && vals.length >= 2) return `${vals[1]}% de ${vals[0]}`;
    return vals.join(symbol);
  };

  // --- EDITOR INTERACTION ---

  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if (viewMode) return;
    setSelectedNodeId(nodeId);
    if ((e.target as HTMLElement).closest('.node-control')) return;
    const node = data.nodes.find(n => n.id === nodeId);
    if (node) { saveHistory(); setDraggingNode(nodeId); setDragOffset({ x: e.clientX - node.x, y: e.clientY - node.y }); }
  };

  const startConnection = (e: React.MouseEvent, nodeId: string) => { 
      if (viewMode) return;
      e.stopPropagation(); setConnectSource(nodeId); setIsConnecting(true); 
  };
  
  const completeConnection = (e: React.MouseEvent, nodeId: string) => {
    if (viewMode) return;
    e.stopPropagation();
    if (connectSource && connectSource !== nodeId) {
       if (!data.connections.some(c => c.from === connectSource && c.to === nodeId)) {
         saveHistory();
         onChange({ ...data, connections: [...data.connections, { id: `c_${Math.random().toString(36).substr(2, 9)}`, from: connectSource, to: nodeId }] });
       }
       setConnectSource(null); setIsConnecting(false);
    }
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (viewMode) return;
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
      if (draggingNode) updateNode(draggingNode, { x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
    };
    const handleGlobalMouseUp = () => setDraggingNode(null);
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => { window.removeEventListener('mousemove', handleGlobalMouseMove); window.removeEventListener('mouseup', handleGlobalMouseUp); };
  }, [draggingNode, dragOffset, viewMode]);

  const renderConnection = (x1: number, y1: number, x2: number, y2: number, key: string, isDraft = false) => {
     const pathData = `M ${x1} ${y1} C ${x1 + 30} ${y1}, ${x2 - 30} ${y2}, ${x2} ${y2}`;
     const strokeColor = viewMode ? '#94a3b8' : (isDraft ? "#000080" : "#000000");
     const strokeWidth = viewMode ? "2" : (isDraft ? "1" : "1.5");
     
     return (
        <g key={key}>
          <path d={pathData} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} strokeDasharray={isDraft ? "2,2" : "none"} className="transition-all duration-300" />
          {!isDraft && !viewMode && <polygon points={`${x2},${y2} ${x2-6},${y2-3} ${x2-6},${y2+3}`} fill="#000000" />}
          {viewMode && <circle cx={x2} cy={y2} r="3" fill={strokeColor} />}
        </g>
     );
  };

  const PORT_OFFSET_Y = 40;
  const PORT_OFFSET_X = 160;

  return (
    <div className={`flex flex-col h-full ${viewMode ? 'bg-slate-50' : 'bg-win95-bg border-2 border-win95-shadow'} overflow-hidden relative transition-colors duration-300`}>
      {/* Toolbar */}
      <div className={`flex items-center gap-1 p-1 ${viewMode ? 'bg-white border-b border-gray-200 shadow-sm' : 'bg-win95-bg border-b-2 border-win95-shadow'} select-none overflow-x-auto shrink-0 z-50`}>
        {!viewMode && (
            <>
                <Button size="sm" onClick={handleNewFlow} title="Novo Fluxo (Limpar Tela)"><FilePlus size={12} className="mr-1"/> Novo</Button>
                <div className="w-0.5 h-5 bg-win95-shadow mx-1 border-r border-white"></div>
                <Button size="sm" onClick={() => addNode('input')}><Plus size={12} className="mr-1"/> Entrada</Button>
                <Button size="sm" onClick={() => addNode('op')}><Calculator size={12} className="mr-1"/> Processo</Button>
                <Button size="sm" onClick={() => addNode('result')}><Play size={12} className="mr-1"/> Saída</Button>
                <div className="w-0.5 h-5 bg-win95-shadow mx-1 border-r border-white"></div>
            </>
        )}
        
        <Button size="sm" onClick={calculateFlow} title="Recalcular"><RefreshCw size={12} className="mr-1"/> Calc</Button>
        <Button size="sm" onClick={clearValues} title="Limpar Valores"><Eraser size={12} className="mr-1"/> Limpar</Button>
        
        {!viewMode && (
            <>
                <div className="w-0.5 h-5 bg-win95-shadow mx-1 border-r border-white"></div>
                <Button size="sm" onClick={handleUndo} disabled={history.length === 0} title="Desfazer (Ctrl+Z)"><Undo size={12} className="mr-1"/></Button>
                <Button size="sm" onClick={handleRedo} disabled={future.length === 0} title="Refazer (Ctrl+Y)"><Redo size={12} className="mr-1"/></Button>
                <div className="w-0.5 h-5 bg-win95-shadow mx-1 border-r border-white"></div>
                <Button size="sm" onClick={copyNode} disabled={!selectedNodeId} title="Copiar Nó (Ctrl+C)"><Copy size={12} /></Button>
                <Button size="sm" onClick={pasteNode} disabled={!clipboardNode} title="Colar Nó (Ctrl+V)"><Clipboard size={12} /></Button>
                <div className="w-0.5 h-5 bg-win95-shadow mx-1 border-r border-white"></div>
                <Button size="sm" onClick={() => { setSaveMode(true); setIsTemplatesOpen(true); }} title="Salvar Modelo"><Save size={12} /></Button>
                <Button size="sm" onClick={() => { setSaveMode(false); setIsTemplatesOpen(true); }} title="Abrir Modelo"><FolderOpen size={12} /></Button>
            </>
        )}

        <div className="flex-1"></div>
        
        {/* Toggle View Mode */}
        <div className="flex items-center gap-2 px-2">
            <button 
                onClick={() => setViewMode(!viewMode)}
                className={`flex items-center gap-2 px-3 py-1 text-[10px] font-bold uppercase rounded-full transition-all border ${
                    viewMode 
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-md hover:bg-indigo-700' 
                    : 'bg-win95-bg text-black border-gray-400 win95-raised hover:bg-white'
                }`}
            >
                {viewMode ? <Edit size={12} /> : <Monitor size={12} />}
                {viewMode ? 'Voltar ao Editor' : 'Modo Visual'}
            </button>
        </div>
      </div>

      <div 
        ref={containerRef} 
        className={`flex-1 relative overflow-hidden m-1 ${viewMode ? 'bg-slate-50' : 'bg-white win95-sunken'}`}
        style={viewMode ? {
            backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
            backgroundSize: '30px 30px'
        } : { 
            backgroundImage: 'radial-gradient(#000000 1px, transparent 1px)', 
            backgroundSize: '20px 20px', 
            backgroundPosition: '10px 10px' 
        }}
        onMouseDown={() => setSelectedNodeId(null)}
      >
        {/* SVG Layer */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          {data.connections.map(conn => {
            const from = data.nodes.find(n => n.id === conn.from);
            const to = data.nodes.find(n => n.id === conn.to);
            if (!from || !to) return null;
            return renderConnection(from.x + PORT_OFFSET_X, from.y + PORT_OFFSET_Y, to.x, to.y + PORT_OFFSET_Y, conn.id);
          })}
          {isConnecting && connectSource && renderConnection(data.nodes.find(n => n.id === connectSource)!.x + PORT_OFFSET_X, data.nodes.find(n => n.id === connectSource)!.y + PORT_OFFSET_Y, mousePos.x, mousePos.y, 'draft', true)}
        </svg>

        {/* Nodes Layer */}
        {data.nodes.map(node => (
          <div 
            key={node.id} 
            onMouseDown={(e) => handleMouseDown(e, node.id)} 
            className={`absolute w-40 flex flex-col group transition-all duration-200
                ${viewMode 
                    ? 'bg-white rounded-xl shadow-lg border border-slate-200 hover:shadow-xl hover:scale-105 hover:border-blue-300' 
                    : `win95-raised shadow-lg ${selectedNodeId === node.id ? 'outline outline-2 outline-win95-blue' : ''}`
                }
            `} 
            style={{ left: node.x, top: node.y, zIndex: draggingNode === node.id ? 20 : 10 }}
          >
            {/* Node Header */}
            <div className={`px-2 py-1 flex justify-between items-center 
                ${viewMode 
                    ? 'border-b border-slate-100 rounded-t-xl bg-slate-50' 
                    : `cursor-move border-b border-[#808080] ${node.id === draggingNode || selectedNodeId === node.id ? 'bg-[#000080] text-white' : 'bg-[#808080] text-[#c0c0c0]'}`
                }`
            }>
              <div className="flex items-center gap-1 overflow-hidden w-full">
                  {!viewMode && <Square size={10} className="fill-white text-black" />}
                  {viewMode && (
                      <div className={`w-2 h-2 rounded-full ${
                          node.type === 'input' ? 'bg-green-500' : node.type === 'result' ? 'bg-blue-600' : 'bg-orange-500'
                      }`} />
                  )}
                  {viewMode ? (
                      <div className="font-bold text-xs text-slate-700 truncate w-full">{node.label}</div>
                  ) : (
                      <input className={`bg-transparent border-none outline-none w-full font-bold text-[10px] node-control truncate ${node.id === draggingNode || selectedNodeId === node.id ? 'text-white placeholder-white' : 'text-white'}`} value={node.label} onFocus={() => saveHistory()} onChange={(e) => updateNode(node.id, { label: e.target.value })} placeholder="Sem título" />
                  )}
              </div>
              {!viewMode && (
                <div className="flex gap-0.5">
                    <button onClick={(e) => { e.stopPropagation(); copyNode(); }} className="win95-raised w-3.5 h-3.5 flex items-center justify-center bg-[#c0c0c0] node-control hover:bg-[#0000d0] group/copy" title="Copiar"><Copy size={8} className="text-black group-hover/copy:text-white" /></button>
                    <button onClick={(e) => { e.stopPropagation(); removeNode(node.id); }} className="win95-raised w-3.5 h-3.5 flex items-center justify-center bg-[#c0c0c0] node-control hover:bg-[#ff0000] group/btn"><X size={8} className="text-black group-hover/btn:text-white" /></button>
                </div>
              )}
            </div>

            {/* Node Body */}
            <div className={`p-2 flex flex-col gap-2 min-h-[60px] ${viewMode ? 'rounded-b-xl' : 'bg-win95-bg'}`}>
              
              {/* Input Type */}
              {node.type === 'input' && (
                <div className="flex flex-col gap-1">
                    {!viewMode && <label className="text-[9px] text-black">Entrada:</label>}
                    <input type="text" 
                        className={`w-full px-2 py-1 text-sm outline-none node-control font-mono font-bold
                            ${viewMode 
                                ? 'bg-slate-100 rounded-md border border-slate-200 text-slate-800 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all text-center' 
                                : 'win95-sunken bg-white text-black'
                            }`} 
                        value={activeInputId === node.id ? editValue : formatNumber(node.value)} 
                        onFocus={(e) => { saveHistory(); setActiveInputId(node.id); setEditValue(node.value ? node.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''); setTimeout(() => e.target.select(), 10); }} 
                        onChange={(e) => setEditValue(e.target.value)} 
                        onBlur={() => { setActiveInputId(null); const raw = editValue.replace(/\./g, '').replace(',', '.'); const num = parseFloat(raw); updateNode(node.id, { value: isNaN(num) ? 0 : num }); }} 
                        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }} 
                    />
                </div>
              )}

              {/* Operation Type */}
              {node.type === 'op' && (
                <div className="flex flex-col gap-1">
                    {!viewMode && <label className="text-[9px] text-black">Função:</label>}
                    {!viewMode ? (
                        <select className="w-full win95-sunken px-1 py-0.5 text-[10px] outline-none node-control bg-white cursor-pointer text-black" value={node.operation} onFocus={() => saveHistory()} onChange={(e) => updateNode(node.id, { operation: e.target.value as FlowOperation })}>
                            <option value="+">Soma (+)</option><option value="-">Subtração (-)</option><option value="*">Mult. (*)</option><option value="/">Divisão (/)</option><option value="AVG">Média</option><option value="PCT">Porcentagem (%)</option><option value="POW">Potência (^)</option><option value="MAX">Maior Valor</option><option value="MIN">Menor Valor</option>
                        </select>
                    ) : (
                        <div className="text-center text-xs font-bold text-slate-500 bg-slate-100 rounded py-1">
                            {node.operation === 'AVG' ? 'Média' : node.operation === 'PCT' ? 'Porcentagem' : `Operação (${node.operation})`}
                        </div>
                    )}
                    
                    {!viewMode && <div className="win95-sunken bg-[#e0e0e0] px-1 py-0.5 text-[9px] font-mono text-[#555] truncate" title="Fórmula baseada na ordem visual">{getFormulaDisplay(node)}</div>}
                </div>
              )}

              {/* Result Area (All types except simple inputs if in view mode we might wanna show input value differently, but consistent is good) */}
              {node.type !== 'input' && (
                <div className={`mt-auto pt-1 flex justify-between items-center group/val ${viewMode ? '' : 'border-t border-white'}`}>
                  {!viewMode && <span className="text-[9px] font-bold text-black">Res:</span>}
                  <div className={`flex items-center gap-1 w-full ${viewMode ? 'justify-center' : 'justify-end'}`}>
                    {!viewMode && (
                        <button 
                        onClick={(e) => { e.stopPropagation(); copyToSystemClipboard(node.calculatedValue); }}
                        className="opacity-0 group-hover/val:opacity-100 p-0.5 hover:bg-white/50 rounded node-control"
                        title="Copiar valor"
                        >
                        <Copy size={8} className="text-[#555]" />
                        </button>
                    )}
                    <span className={`
                        ${viewMode 
                            ? 'text-lg font-black text-slate-800' 
                            : 'win95-sunken bg-white px-1 text-[10px] font-mono min-w-[50px] text-right block text-black font-bold'
                        }
                    `}>
                        {formatNumber(node.calculatedValue)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Connection Ports (Hidden in View Mode) */}
            {!viewMode && node.type !== 'input' && (
                <div className="absolute -left-1.5 top-10 w-3 h-3 win95-raised bg-[#c0c0c0] flex items-center justify-center cursor-crosshair node-control hover:bg-white" onMouseUp={(e) => completeConnection(e, node.id)} title="Entrada"><div className="w-1 h-1 bg-black rounded-full" /></div>
            )}
            {!viewMode && (
                <div className="absolute -right-1.5 top-10 w-3 h-3 win95-raised bg-[#c0c0c0] flex items-center justify-center cursor-crosshair node-control hover:bg-white" onMouseDown={(e) => startConnection(e, node.id)} title="Saída"><div className="w-1 h-1 bg-black rounded-full" /></div>
            )}
          </div>
        ))}
      </div>
      
      {isTemplatesOpen && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-50">
           <div className="w-80 win95-raised p-1 shadow-2xl">
              <div className="bg-[#000080] text-white px-2 py-1 text-sm font-bold flex justify-between items-center mb-2"><span>{saveMode ? 'Salvar Modelo' : 'Carregar Modelo'}</span><button onClick={() => setIsTemplatesOpen(false)} className="win95-raised w-5 h-5 flex items-center justify-center text-black text-xs font-bold leading-none bg-[#c0c0c0]">×</button></div>
              <div className="p-2">
                 {saveMode ? (
                   <div className="space-y-3"><p className="text-xs">Nome do Modelo:</p><input className="w-full win95-sunken p-1 text-sm outline-none" value={templateName} onChange={e => setTemplateName(e.target.value)} autoFocus /><div className="flex justify-end gap-2 pt-2"><Button onClick={saveTemplate}>Salvar</Button></div></div>
                 ) : (
                   <div className="space-y-2"><div className="win95-sunken bg-white h-48 overflow-y-auto p-1">{!data.templates || data.templates.length === 0 ? <div className="text-xs text-gray-400 p-2 text-center">Nenhum modelo salvo.</div> : data.templates.map(t => <div key={t.id} className="flex justify-between items-center p-1 hover:bg-[#000080] hover:text-white group cursor-pointer"><span onClick={() => loadTemplate(t)} className="flex-1 text-xs truncate">{t.name}</span><button onClick={() => deleteTemplate(t.id)} className="text-red-500 group-hover:text-white px-1 font-bold">×</button></div>)}</div></div>
                 )}
              </div>
           </div>
        </div>
      )}

      <div className={`border-t p-1 flex justify-between items-center text-[10px] shrink-0 ${viewMode ? 'bg-white border-gray-200 text-slate-500' : 'bg-win95-bg border-white'}`}>
          <span className={`${viewMode ? '' : 'win95-sunken px-2 bg-win95-bg w-32 border-none text-black'}`}>
              {viewMode ? 'Modo de Apresentação' : 'Pronto'}
          </span>
          <span className={`${viewMode ? '' : 'win95-sunken px-2 bg-white w-20 text-right text-black'}`}>
              {data.nodes.length} Objetos
          </span>
      </div>
    </div>
  );
};
