
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

  const addNode = (type: FlowNodeType) => {
    const newNode: FlowNode = {
      id: `node_${Date.now()}`,
      type,
      x: 50 + Math.random() * 50,
      y: 50 + Math.random() * 50,
      label: type === 'input' ? 'Entrada' : type === 'op' ? 'Processo' : 'Saída',
      value: type === 'input' ? 0 : undefined,
      operation: type === 'op' ? '+' : undefined,
      calculatedValue: null
    };
    onChange({ ...data, nodes: [...data.nodes, newNode] });
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
      if (!exists) {
        const newConnection: FlowConnection = {
          id: `conn_${Date.now()}`,
          from: connectSource,
          to: nodeId
        };
        onChange({ ...data, connections: [...data.connections, newConnection] });
      }
      setConnectSource(null);
      setIsConnecting(false);
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
        updateNode(draggingNode, { x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
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

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] rounded border border-[#dee2e6] overflow-hidden">
      <div className="flex items-center gap-2 p-3 bg-white border-b border-[#dee2e6] z-10">
        <Button size="sm" variant="secondary" onClick={() => addNode('input')}>+ Valor</Button>
        <Button size="sm" variant="secondary" onClick={() => addNode('op')}>+ Operação</Button>
        <Button size="sm" variant="secondary" onClick={() => addNode('result')}>+ Saída</Button>
        <div className="h-4 w-px bg-[#dee2e6] mx-1"></div>
        <Button 
          size="sm" 
          variant={isConnecting ? "primary" : "secondary"}
          onClick={() => { setIsConnecting(!isConnecting); setConnectSource(null); }}
        >
          {isConnecting ? "Definir Alvo..." : "Vincular"}
        </Button>
        <Button size="sm" onClick={calculateFlow} icon={<Calculator size={14} />}>Executar Cálculo</Button>
      </div>

      <div 
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        style={{ backgroundImage: 'linear-gradient(#dee2e6 1px, transparent 1px), linear-gradient(90deg, #dee2e6 1px, transparent 1px)', backgroundSize: '20px 20px' }}
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {data.connections.map(conn => {
            const from = data.nodes.find(n => n.id === conn.from);
            const to = data.nodes.find(n => n.id === conn.to);
            if (!from || !to) return null;
            return (
              <line key={conn.id} x1={from.x + 140} y1={from.y + 40} x2={to.x} y2={to.y + 40} stroke="#0064d2" strokeWidth="1.5" strokeDasharray="4" />
            );
          })}
          {isConnecting && connectSource && (
            <line x1={data.nodes.find(n => n.id === connectSource)!.x + 140} y1={data.nodes.find(n => n.id === connectSource)!.y + 40} x2={mousePos.x} y2={mousePos.y} stroke="#0064d2" strokeWidth="1" strokeDasharray="2" />
          )}
        </svg>

        {data.nodes.map(node => (
          <div
            key={node.id}
            onMouseDown={(e) => handleMouseDown(e, node.id)}
            onClick={() => handleNodeClick(node.id)}
            className={`absolute w-36 bg-white border rounded shadow-sm transition-all overflow-hidden ${
              isConnecting && connectSource === node.id ? 'border-[#0064d2] ring-2 ring-[#0064d2]/10' : 'border-[#dee2e6]'
            }`}
            style={{ left: node.x, top: node.y }}
          >
            <div className={`px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-white ${
              node.type === 'input' ? 'bg-[#556b82]' : node.type === 'op' ? 'bg-[#0064d2]' : 'bg-[#198754]'
            } flex justify-between`}>
              <span>{node.type === 'input' ? 'Input' : node.type === 'op' ? 'Logic' : 'Result'}</span>
              <button onClick={() => removeNode(node.id)}><X size={10} /></button>
            </div>
            <div className="p-2 space-y-1">
              <input 
                className="w-full text-[10px] font-bold border-none outline-none text-[#1c2d3d]"
                value={node.label}
                onChange={(e) => updateNode(node.id, { label: e.target.value })}
              />
              {node.type === 'input' && (
                <input 
                  type="number" 
                  className="w-full px-2 py-1 text-xs border border-[#dee2e6] rounded bg-[#f8f9fa]"
                  value={node.value}
                  onChange={(e) => updateNode(node.id, { value: Number(e.target.value) })}
                />
              )}
              {node.type === 'op' && (
                <select 
                  className="w-full px-1 py-1 text-[10px] border border-[#dee2e6] rounded bg-[#f8f9fa]"
                  value={node.operation}
                  onChange={(e) => updateNode(node.id, { operation: e.target.value as FlowOperation })}
                >
                  <option value="+">ADICIONAR</option>
                  <option value="-">SUBTRAIR</option>
                  <option value="*">MULTIPLICAR</option>
                  <option value="/">DIVIDIR</option>
                </select>
              )}
              <div className="pt-1 text-center font-mono text-[11px] font-bold text-[#0064d2]">
                {node.calculatedValue !== null ? node.calculatedValue.toFixed(2) : '---'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
