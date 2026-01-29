import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Trash2, X, Calculator, Zap, MousePointer2 } from 'lucide-react';
import { FlowState, FlowNode, FlowConnection, FlowNodeType, FlowOperation } from '../types';
import { Button } from './ui/Button';

interface FlowBuilderProps {
  data: FlowState;
  onChange: (data: FlowState) => void;
}

export const FlowBuilder: React.FC<FlowBuilderProps> = ({ data, onChange }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectSource, setConnectSource] = useState<string | null>(null);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // --- Ações ---

  const addNode = (type: FlowNodeType) => {
    const newNode: FlowNode = {
      id: `node_${Date.now()}`,
      type,
      x: 100 + Math.random() * 100,
      y: 100 + Math.random() * 100,
      label: type === 'input' ? 'Entrada' : type === 'op' ? 'Operação' : 'Resultado',
      value: type === 'input' ? 0 : undefined,
      operation: type === 'op' ? '+' : undefined,
      calculatedValue: null
    };
    onChange({
      ...data,
      nodes: [...data.nodes, newNode]
    });
  };

  const updateNode = (id: string, updates: Partial<FlowNode>) => {
    const newNodes = data.nodes.map(n => n.id === id ? { ...n, ...updates } : n);
    onChange({ ...data, nodes: newNodes });
  };

  const removeNode = (id: string) => {
    const newNodes = data.nodes.filter(n => n.id !== id);
    const newConnections = data.connections.filter(c => c.from !== id && c.to !== id);
    onChange({ nodes: newNodes, connections: newConnections });
  };

  const handleNodeClick = (nodeId: string) => {
    if (!isConnecting) return;

    if (!connectSource) {
      setConnectSource(nodeId);
    } else {
      if (connectSource === nodeId) {
        setConnectSource(null);
        return;
      }
      
      const exists = data.connections.some(c => c.from === connectSource && c.to === nodeId);
      if (exists) {
        setConnectSource(null);
        setIsConnecting(false);
        return;
      }

      const newConnection: FlowConnection = {
        id: `conn_${Date.now()}`,
        from: connectSource,
        to: nodeId
      };
      
      onChange({
        ...data,
        connections: [...data.connections, newConnection]
      });
      setConnectSource(null);
      setIsConnecting(false);
    }
  };

  const toggleConnectMode = () => {
    setIsConnecting(!isConnecting);
    setConnectSource(null);
  };

  const calculateFlow = useCallback(() => {
    let nodes = data.nodes.map(n => ({ ...n, calculatedValue: null as number | null }));
    const connections = data.connections;

    nodes.forEach(n => {
      if (n.type === 'input') n.calculatedValue = n.value || 0;
    });

    let changed = true;
    let iterations = 0;
    while (changed && iterations < 100) {
      changed = false;
      iterations++;
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.type === 'input' || node.calculatedValue !== null) continue;

        const inputs = connections
          .filter(c => c.to === node.id)
          .map(c => nodes.find(n => n.id === c.from)?.calculatedValue);

        if (inputs.length === 0 || inputs.some(v => v === null)) continue;
        
        const validInputs = inputs as number[];
        let result = 0;
        if (node.type === 'op') {
          if (node.operation === '+') result = validInputs.reduce((a, b) => a + b, 0);
          else if (node.operation === '-') result = validInputs.reduce((a, b) => a - b);
          else if (node.operation === '*') result = validInputs.reduce((a, b) => a * b, 1);
          else if (node.operation === '/') result = validInputs.reduce((a, b) => b === 0 ? 0 : a / b);
        } else {
          result = validInputs.reduce((a, b) => a + b, 0);
        }
        nodes[i].calculatedValue = result;
        changed = true;
      }
    }
    onChange({ ...data, nodes });
  }, [data, onChange]);

  // --- Mouse Handling ---

  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if (isConnecting) return;
    if ((e.target as HTMLElement).tagName.match(/INPUT|SELECT|BUTTON/)) return;

    const node = data.nodes.find(n => n.id === nodeId);
    if (node) {
      setDraggingNode(nodeId);
      setDragOffset({ x: e.clientX - node.x, y: e.clientY - node.y });
    }
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }

      if (draggingNode) {
        const x = e.clientX - dragOffset.x;
        const y = e.clientY - dragOffset.y;
        updateNode(draggingNode, { x, y });
      }
    };

    const handleGlobalMouseUp = () => setDraggingNode(null);

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [draggingNode, dragOffset]);

  const removeConnection = (connId: string) => {
    onChange({ ...data, connections: data.connections.filter(c => c.id !== connId) });
  };

  return (
    <div className="flex flex-col h-full select-none">
      <div className="flex flex-wrap items-center gap-2 p-4 bg-white border-b border-slate-200 shadow-sm z-10">
        <Button size="sm" variant="secondary" onClick={() => addNode('input')} icon={<Plus size={14} />}>Novo Valor</Button>
        <Button size="sm" variant="secondary" onClick={() => addNode('op')} icon={<Plus size={14} />}>Nova Op.</Button>
        <Button size="sm" variant="secondary" onClick={() => addNode('result')} icon={<Plus size={14} />}>Resultado</Button>
        <div className="h-6 w-px bg-slate-300 mx-2"></div>
        <Button 
          size="sm" 
          variant={isConnecting ? "primary" : "secondary"}
          onClick={toggleConnectMode} 
          icon={<Zap size={14} className={isConnecting ? "animate-pulse" : ""} />}
        >
          {isConnecting ? (connectSource ? "Clique no destino..." : "Clique na origem...") : "Modo Conexão"}
        </Button>
        <Button size="sm" variant="primary" onClick={calculateFlow} icon={<Calculator size={14} />}>Calcular Fluxo</Button>
        <div className="flex-1"></div>
        <Button size="sm" variant="ghost" className="text-red-500" onClick={() => confirm("Limpar tudo?") && onChange({ nodes: [], connections: [] })} icon={<Trash2 size={14} />}>Limpar</Button>
      </div>

      <div 
        ref={containerRef}
        className={`flex-1 relative bg-slate-50 overflow-hidden ${isConnecting ? 'cursor-crosshair' : 'cursor-default'}`}
        style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '30px 30px' }}
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#4f46e5" />
            </marker>
          </defs>
          
          {/* Conexões Existentes */}
          {data.connections.map(conn => {
            const from = data.nodes.find(n => n.id === conn.from);
            const to = data.nodes.find(n => n.id === conn.to);
            if (!from || !to) return null;
            const x1 = from.x + 160; const y1 = from.y + 45;
            const x2 = to.x; const y2 = to.y + 45;
            return (
              <g key={conn.id} className="pointer-events-auto cursor-pointer group" onClick={() => removeConnection(conn.id)}>
                <path d={`M ${x1} ${y1} C ${(x1+x2)/2} ${y1}, ${(x1+x2)/2} ${y2}, ${x2} ${y2}`} stroke="#4f46e5" strokeWidth="3" fill="none" markerEnd="url(#arrowhead)" className="transition-all opacity-60 group-hover:opacity-100 group-hover:stroke-red-400" />
                <title>Clique para remover conexão</title>
              </g>
            );
          })}

          {/* Linha Elástica (Modo Conexão) */}
          {isConnecting && connectSource && (
            <line 
              x1={data.nodes.find(n => n.id === connectSource)!.x + 160} 
              y1={data.nodes.find(n => n.id === connectSource)!.y + 45} 
              x2={mousePos.x} 
              y2={mousePos.y} 
              stroke="#4f46e5" 
              strokeWidth="2" 
              strokeDasharray="5,5"
            />
          )}
        </svg>

        {data.nodes.map(node => (
          <div
            key={node.id}
            onMouseDown={(e) => handleMouseDown(e, node.id)}
            onClick={() => handleNodeClick(node.id)}
            className={`absolute w-40 bg-white rounded-xl border-2 transition-all shadow-md overflow-hidden ${
              isConnecting 
                ? (connectSource === node.id ? 'border-indigo-600 ring-4 ring-indigo-100 scale-105' : 'border-slate-300 hover:border-indigo-400')
                : 'border-slate-200 hover:shadow-xl'
            }`}
            style={{ left: node.x, top: node.y }}
          >
            <div className={`px-3 py-2 text-[10px] font-black uppercase tracking-widest flex justify-between items-center ${
              node.type === 'input' ? 'bg-blue-600 text-white' : 
              node.type === 'op' ? 'bg-amber-500 text-white' : 'bg-green-600 text-white'
            }`}>
              <span>{node.type === 'input' ? 'Entrada' : node.type === 'op' ? 'Operação' : 'Resultado'}</span>
              <button onClick={(e) => { e.stopPropagation(); removeNode(node.id); }} className="hover:scale-125 transition-transform"><X size={14} /></button>
            </div>
            
            <div className="p-3 space-y-2">
              <input 
                className="w-full text-xs font-bold border-none outline-none focus:text-indigo-600 truncate"
                value={node.label}
                onChange={(e) => updateNode(node.id, { label: e.target.value })}
              />
              {node.type === 'input' && (
                <input 
                  type="number" 
                  className="w-full p-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-400"
                  value={node.value === 0 ? '' : node.value}
                  placeholder="0"
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : Number(e.target.value);
                    updateNode(node.id, { value: val });
                  }}
                />
              )}
              {node.type === 'op' && (
                <select 
                  className="w-full p-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none cursor-pointer"
                  value={node.operation}
                  onChange={(e) => updateNode(node.id, { operation: e.target.value as FlowOperation })}
                >
                  <option value="+">Soma (+)</option>
                  <option value="-">Subtrair (-)</option>
                  <option value="*">Multiplicar (×)</option>
                  <option value="/">Dividir (÷)</option>
                </select>
              )}
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Valor</span>
                <span className="text-sm font-mono font-black text-slate-700">
                  {node.calculatedValue !== null ? node.calculatedValue.toLocaleString('pt-BR') : '---'}
                </span>
              </div>
            </div>
          </div>
        ))}

        <div className="absolute bottom-6 right-6 bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white max-w-xs text-[11px] text-slate-500 pointer-events-none">
          <p className="font-black text-slate-800 mb-2 uppercase tracking-wider flex items-center gap-2">
            <MousePointer2 size={12} /> Guia de Uso
          </p>
          <ul className="space-y-1">
            <li className="flex gap-2"><b>1.</b> Arraste os blocos para organizar seu fluxo.</li>
            <li className="flex gap-2"><b>2.</b> Ative <b>Modo Conexão</b>, clique no bloco de saída e depois no de entrada.</li>
            <li className="flex gap-2"><b>3.</b> Clique em <b>Calcular Fluxo</b> para processar os valores.</li>
            <li className="flex gap-2 text-indigo-600 font-bold">Dica: Clique em uma linha para removê-la.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};