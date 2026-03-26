import { generateUUID } from '../uuid';
import React, { useState, useRef } from 'react';
import {
  Package, Plus, Search, AlertTriangle, History, ArrowUpRight, ArrowDownLeft,
  Trash2, Archive, Box, Download, Upload, Users, X, Check, FileSpreadsheet,
  UserPlus, ShoppingCart, Minus, Printer, Edit, PackagePlus, ChevronDown
} from 'lucide-react';
import * as XLSX from 'xlsx';

// ── Types ────────────────────────────────────────────────────────────────────

export interface WarehouseCategory {
  id: string;
  name: string;
  color: string;
}


interface InventoryItem {
  id: string;
  code: string;         // MAT-001
  name: string;         // Descrição
  category: string;     // Categoria
  consumable: boolean;  // Consumível?
  quantity: number;     // Qtd. Atual
  minStock: number;     // Qtd. Mínima
  unit: string;         // Unidade
  itemsPerContainer?: number; // Qtd. por Caixa/Embalagem
  lastUpdated: string;
}

interface Employee {
  id: string;
  name: string;
  role: string;
  cpf: string;
  active: boolean;
}

interface StockLog {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  type: 'entry' | 'exit';
  quantity: number;
  date: string;
  employeeId: string;
  employeeName: string;
  note?: string;
}

interface CartItem {
  id: string;
  itemId: string;
  code: string;
  name: string;
  quantity: number;
  unit: string;
}

// ── Default data (from spreadsheet image) ───────────────────────────────────

const DEFAULT_INVENTORY: InventoryItem[] = [
  { id:'00000000-0000-0000-0000-000000000001', code:'MAT-001', name:'Bota de Segurança Nº 42',                  category:'EPI',       consumable:false, quantity:10, minStock:0, unit:'Par',   lastUpdated:new Date().toISOString() },
  { id:'00000000-0000-0000-0000-000000000002', code:'MAT-002', name:'Perneira Bidim com Fivela',                 category:'EPI',       consumable:false, quantity:30, minStock:0, unit:'Par',   lastUpdated:new Date().toISOString() },
  { id:'00000000-0000-0000-0000-000000000003', code:'MAT-003', name:'Capacete Azul',                             category:'EPI',       consumable:false, quantity:33, minStock:0, unit:'Unid.', lastUpdated:new Date().toISOString() },
  { id:'00000000-0000-0000-0000-000000000004', code:'MAT-004', name:'Óculos de Segurança Lente Escura',          category:'EPI',       consumable:false, quantity:48, minStock:0, unit:'Unid.', lastUpdated:new Date().toISOString() },
  { id:'00000000-0000-0000-0000-000000000005', code:'MAT-005', name:'Óculos de Segurança Lente Incolor',         category:'EPI',       consumable:false, quantity:36, minStock:0, unit:'Unid.', lastUpdated:new Date().toISOString() },
  { id:'00000000-0000-0000-0000-000000000006', code:'MAT-006', name:'Óculos de Segurança Incolor (Sobrepor)',    category:'EPI',       consumable:false, quantity:12, minStock:0, unit:'Unid.', lastUpdated:new Date().toISOString() },
  { id:'00000000-0000-0000-0000-000000000007', code:'MAT-007', name:'Luva de Vaqueta Cano Longo',                category:'EPI',       consumable:true,  quantity:40, minStock:0, unit:'Par',   lastUpdated:new Date().toISOString() },
  { id:'00000000-0000-0000-0000-000000000008', code:'MAT-008', name:'Luva de Impacto',                           category:'EPI',       consumable:true,  quantity:29, minStock:0, unit:'Par',   lastUpdated:new Date().toISOString() },
  { id:'00000000-0000-0000-0000-000000000009', code:'MAT-009', name:'Luva Vibraflex',                            category:'EPI',       consumable:true,  quantity:14, minStock:0, unit:'Par',   lastUpdated:new Date().toISOString() },
  { id:'00000000-0000-0000-0000-000000000010', code:'MAT-010', name:'Manga de Raspa para Soldador',              category:'EPI',       consumable:true,  quantity:24, minStock:0, unit:'Unid.', lastUpdated:new Date().toISOString() },
  { id:'00000000-0000-0000-0000-000000000011', code:'MAT-011', name:'Máscara de Solda com Carneira',             category:'EPI',       consumable:false, quantity:15, minStock:0, unit:'Unid.', lastUpdated:new Date().toISOString() },
  { id:'00000000-0000-0000-0000-000000000012', code:'MAT-012', name:'Máscara PFF2 (Valvulada)',                  category:'EPI',       consumable:true,  quantity:45, minStock:0, unit:'Unid.', lastUpdated:new Date().toISOString() },
  { id:'00000000-0000-0000-0000-000000000013', code:'MAT-013', name:'Protetor Auricular Tipo Concha (Capacete)', category:'EPI',       consumable:false, quantity:20, minStock:0, unit:'Unid.', lastUpdated:new Date().toISOString() },
  { id:'00000000-0000-0000-0000-000000000014', code:'MAT-014', name:'Protetor Auricular Tipo Plug',              category:'EPI',       consumable:true,  quantity:50, minStock:0, unit:'Unid.', lastUpdated:new Date().toISOString() },
  { id:'00000000-0000-0000-0000-000000000015', code:'MAT-015', name:'Spray Repelente de Insetos',                category:'EPI',       consumable:true,  quantity:6,  minStock:0, unit:'Unid.', lastUpdated:new Date().toISOString() },
  { id:'00000000-0000-0000-0000-000000000016', code:'MAT-016', name:'Protetor Solar 1L',                         category:'EPI',       consumable:true,  quantity:4,  minStock:0, unit:'Unid.', lastUpdated:new Date().toISOString() },
  { id:'00000000-0000-0000-0000-000000000017', code:'MAT-017', name:'Mala de Ferramentas',                       category:'Ferramenta',consumable:false, quantity:3,  minStock:0, unit:'Unid.', lastUpdated:new Date().toISOString() },
  { id:'00000000-0000-0000-0000-000000000018', code:'MAT-018', name:'Caixa de Ferramenta',                       category:'Ferramenta',consumable:false, quantity:3,  minStock:0, unit:'Unid.', lastUpdated:new Date().toISOString() },
  { id:'00000000-0000-0000-0000-000000000019', code:'MAT-019', name:'Espátula 12"',                              category:'Ferramenta',consumable:false, quantity:13, minStock:0, unit:'Unid.', lastUpdated:new Date().toISOString() },
  { id:'00000000-0000-0000-0000-000000000020', code:'MAT-020', name:'Manilha 3/4',                               category:'Ferramenta',consumable:false, quantity:8,  minStock:0, unit:'Unid.', lastUpdated:new Date().toISOString() },
  { id:'00000000-0000-0000-0000-000000000021', code:'MAT-021', name:'Trincha 1"',                                category:'Ferramenta',consumable:true,  quantity:12, minStock:0, unit:'Unid.', lastUpdated:new Date().toISOString() },
  { id:'00000000-0000-0000-0000-000000000022', code:'MAT-022', name:'Trincha 1 1/2"',                            category:'Ferramenta',consumable:true,  quantity:12, minStock:0, unit:'Unid.', lastUpdated:new Date().toISOString() },
  { id:'00000000-0000-0000-0000-000000000023', code:'MAT-023', name:'Trincha 2"',                                category:'Ferramenta',consumable:true,  quantity:12, minStock:0, unit:'Unid.', lastUpdated:new Date().toISOString() },
  { id:'00000000-0000-0000-0000-000000000024', code:'MAT-024', name:'Lâmina de Serra',                           category:'Ferramenta',consumable:true,  quantity:50, minStock:0, unit:'Unid.', lastUpdated:new Date().toISOString() },
  { id:'00000000-0000-0000-0000-000000000025', code:'MAT-025', name:'Trena 5m',                                  category:'Ferramenta',consumable:false, quantity:5,  minStock:0, unit:'Unid.', lastUpdated:new Date().toISOString() },
];

// ── CSV Helpers ──────────────────────────────────────────────────────────────

function downloadTemplate() {
  const link = document.createElement('a');
  link.href = '/planilha_estoque.xlsx';
  link.download = 'controle_estoque.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportInventory(inventory: InventoryItem[], logs: StockLog[]) {
  const possessionMap: Record<string, number> = {};
  logs.forEach(l => {
    if (!l.employeeId || l.employeeId === 'system') return;
    if (!possessionMap[l.itemId]) possessionMap[l.itemId] = 0;
    if (l.type === 'exit') possessionMap[l.itemId] += l.quantity;
    else if (l.type === 'entry') possessionMap[l.itemId] -= l.quantity;
  });

  const data = inventory.map(item => {
    const inPossession = item.consumable ? 0 : (possessionMap[item.id] || 0);
    return {
      'Código': item.code,
      'Descrição': item.name,
      'Categoria': item.category,
      'Consumível?': item.consumable ? 'Sim' : 'Não',
      'Qtd. em Estoque': item.quantity,
      'Qtd. em Posse': inPossession,
      'Qtd. Total': item.quantity + inPossession,
      'Qtd. Mínima': item.minStock,
      'Unidade': item.unit
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Almoxarifado Atual');
  
  // Apply some basic column widths
  const wscols = [
    { wch: 15 }, // Código
    { wch: 40 }, // Descrição
    { wch: 15 }, // Categoria
    { wch: 12 }, // Consumível
    { wch: 15 }, // Qtd em Estoque
    { wch: 15 }, // Qtd em Posse
    { wch: 15 }, // Qtd Total
    { wch: 10 }, // Qtd Minima
    { wch: 10 }  // Unidade
  ];
  worksheet['!cols'] = wscols;

  XLSX.writeFile(workbook, `almoxarifado_atual_${new Date().toISOString().split('T')[0]}.xlsx`);
}

function generateDailyReport(logs: StockLog[]) {
  const today = new Date().toISOString().split('T')[0];
  const dailyLogs = logs.filter(l => l.date && l.date.split('T')[0] === today);
  
  if (dailyLogs.length === 0) {
    alert('Nenhuma movimentação registrada hoje.');
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const logsHtml = dailyLogs.map(log => `
    <tr>
      <td style="border: 1px solid #eee; padding: 10px; font-weight: bold; color: ${log.type === 'entry' ? '#10b981' : '#ef4444'}">${log.type === 'entry' ? 'ENTRADA' : 'SAÍDA'}</td>
      <td style="border: 1px solid #eee; padding: 10px; font-family: monospace;">${log.itemCode}</td>
      <td style="border: 1px solid #eee; padding: 10px;">${log.itemName}</td>
      <td style="border: 1px solid #eee; padding: 10px; text-align: center;">${log.quantity}</td>
      <td style="border: 1px solid #eee; padding: 10px;">${log.employeeName}</td>
      <td style="border: 1px solid #eee; padding: 10px; font-size: 10px;">${new Date(log.date).toLocaleTimeString('pt-BR')}</td>
    </tr>
  `).join('');

  printWindow.document.write(`
    <html>
      <head>
        <title>Relatório Diário - ${today}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; line-height: 1.4; }
          .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
          h1 { margin: 0; font-size: 24px; text-transform: uppercase; }
          .date { font-weight: bold; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #f8f9fa; border: 1px solid #eee; padding: 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #666; }
          .summary { margin-top: 40px; padding: 20px; background: #f8f9fa; border-radius: 8px; display: flex; gap: 40px; }
          .stat-box { display: flex; flex-direction: column; }
          .stat-label { font-size: 10px; font-weight: bold; color: #999; text-transform: uppercase; }
          .stat-value { font-size: 18px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>Relatório Diário de Movimentação</h1>
            <p style="margin: 5px 0 0; color: #888;">Controle de Almoxarifado - YS Manager</p>
          </div>
          <div class="date">${new Date().toLocaleDateString('pt-BR')}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Código</th>
              <th>Item</th>
              <th>Qtd</th>
              <th>Colaborador</th>
              <th>Hora</th>
            </tr>
          </thead>
          <tbody>
            ${logsHtml}
          </tbody>
        </table>

        <div class="summary">
          <div class="stat-box">
            <span class="stat-label">Total Movimentações</span>
            <span class="stat-value">${dailyLogs.length}</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">Entradas</span>
            <span class="stat-value">${dailyLogs.filter(l => l.type === 'entry').length}</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">Saídas</span>
            <span class="stat-value">${dailyLogs.filter(l => l.type === 'exit').length}</span>
          </div>
        </div>

        <div style="margin-top: 80px; text-align: center; border-top: 1px solid #eee; pt: 20px; font-size: 10px; color: #aaa;">
          Documento gerado automaticamente pelo Sistema YS-Manager em ${new Date().toLocaleString('pt-BR')}
        </div>

        <script>
          window.onload = function() { 
            setTimeout(() => {
              window.print(); 
              window.close();
            }, 500);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

function parseCSV(text: string): Partial<InventoryItem>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z_]/g, ''));
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim());
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = vals[i] ?? ''; });
    const consumivel = (obj['consumivel'] || '').toLowerCase();
    return {
      id:         generateUUID(),
      code:       obj['codigo']    || obj['code']     || '',
      name:       obj['descricao'] || obj['name']     || obj['nome'] || '',
      category:   obj['categoria'] || obj['category'] || 'Geral',
      consumable: consumivel === 'sim' || consumivel === 'yes' || consumivel === 'true',
      quantity:   Number(obj['qtd_atual']  || obj['quantidade'] || 0),
      minStock:   Number(obj['qtd_minima'] || obj['estoque_minimo'] || 0),
      unit:       obj['unidade'] || obj['unit'] || 'Unid.',
    };
  }).filter(i => i.name);
}

function parseXLSX(data: ArrayBuffer): Partial<InventoryItem>[] {
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const firstSheet = workbook.Sheets[firstSheetName];
  const jsonData = XLSX.utils.sheet_to_json<any>(firstSheet);

  return jsonData.map(row => {
    const consumableStr = String(row['Consumível?'] || row['consumivel'] || row['Consumivel'] || '').toLowerCase();
    return {
      id:         generateUUID(),
      code:       String(row['Código']    || row['codigo']    || row['code'] || ''),
      name:       String(row['Descrição'] || row['descricao'] || row['name'] || row['nome'] || ''),
      category:   String(row['Categoria'] || row['categoria'] || row['category'] || 'Geral'),
      consumable: consumableStr === 'sim' || consumableStr === 'yes' || consumableStr === 'true',
      quantity:   Number(row['Qtd. Atual'] || row['qtd_atual'] || row['quantity'] || 0),
      minStock:   Number(row['Qtd. Mínima']|| row['qtd_minima']|| row['min_stock'] || 0),
      unit:       String(row['Unidade']   || row['unidade']   || row['unit'] || 'Unid.'),
    };
  }).filter(i => i.name && i.name !== 'undefined');
}

const applyCPFMask = (value: string) => {
  const nums = value.replace(/\D/g, '').slice(0, 11);
  return nums
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

function nextCode(inventory: InventoryItem[]): string {
  const nums = inventory.map(i => {
    const m = i.code.match(/MAT-(\d+)/);
    return m ? parseInt(m[1]) : 0;
  });
  const next = (Math.max(0, ...nums) + 1);
  return `MAT-${String(next).padStart(3, '0')}`;
}

function printMaterialForm(employee: Employee, items: { code: string; name: string; qty: number; unit: string }[]) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const date = new Date().toLocaleDateString('pt-BR');
  const itemsHtml = items.map(item => `
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px; font-family: monospace;">${item.code}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${item.name}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.qty} ${item.unit}</td>
    </tr>
  `).join('');

  printWindow.document.write(`
    <html>
      <head>
        <title>Ficha de Cautela - ${employee.name}</title>
        <style>
          body { font-family: sans-serif; padding: 40px; color: #333; line-height: 1.6; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .info { margin-bottom: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 50px; }
          th { background: #f4f4f4; border: 1px solid #ddd; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; }
          .signature-area { margin-top: 100px; display: flex; flex-direction: column; align-items: center; }
          .line { width: 300px; border-top: 1px solid #333; margin-bottom: 5px; }
          .footer { margin-top: 50px; font-size: 10px; color: #666; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin:0; font-size: 24px;">FICHA DE CAUTELA E ENTREGA DE MATERIAIS</h1>
          <p style="margin:5px 0 0; opacity: 0.7;">YS-Manager - Sistema de Gestão Interna</p>
        </div>
        
        <div class="info">
          <div><strong>Colaborador:</strong> ${employee.name}</div>
          <div><strong>Cargo:</strong> ${employee.role}</div>
          <div><strong>CPF:</strong> ${employee.cpf}</div>
          <div><strong>Data de Emissão:</strong> ${date}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Descrição do Material / EPI</th>
              <th>Quantidade</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <p style="font-size: 11px; text-align: justify;">
          Declaro para os devidos fins que recebi os materiais/EPIs acima listados em perfeitas condições de uso, 
          comprometendo-me a utilizá-los apenas para as finalidades a que se destinam e a zelar pela sua guarda e conservação. 
          Estou ciente de que o extravio ou dano por uso inadequado poderá acarretar em reposição conforme normas internas da empresa.
        </p>

        <div class="signature-area">
          <div class="line" style="margin-top: 40px;"></div>
          <div><strong>${employee.name}</strong></div>
          <div style="font-size: 10px; margin-top: 5px;">Assinatura do Colaborador</div>
          
          <div class="line" style="margin-top: 60px;"></div>
          <div style="font-size: 10px; margin-top: 5px;">Responsável pelo Almoxarifado</div>
        </div>

        <div class="footer">
          Gerado em ${new Date().toLocaleString('pt-BR')}
        </div>
        
        <script>
          window.onload = function() { 
            setTimeout(() => {
              window.print(); 
              window.close();
            }, 500);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

// ── Movement Modal ────────────────────────────────────────────────────────────

interface MovementModalProps {
  item: InventoryItem;
  type: 'entry' | 'exit';
  employees: Employee[];
  onConfirm: (qty: number, employeeId: string, note: string) => void;
  onClose: () => void;
}

const EmployeeDetailModal: React.FC<{
  employee: Employee;
  logs: StockLog[];
  inventory: InventoryItem[];
  onReturn: (itemId: string, qty: number) => void;
  onClose: () => void;
}> = ({ employee, logs, inventory, onReturn, onClose }) => {
  const [returnTarget, setReturnTarget] = useState<{ itemId: string; name: string; maxQty: number; unit: string } | null>(null);
  const empLogs = logs.filter(l => l.employeeId === employee.id);
  const possession: Record<string, { itemId: string; code: string; name: string; qty: number; unit: string }> = {};

  // Calculate possession: Exits - Entries
  empLogs.forEach(l => {
    if (!possession[l.itemId]) {
      possession[l.itemId] = { itemId: l.itemId, code: l.itemCode, name: l.itemName, qty: 0, unit: '' };
    }
    if (l.type === 'exit') {
      possession[l.itemId].qty += l.quantity;
    } else {
      possession[l.itemId].qty -= l.quantity;
    }
  });

  const activePossession = Object.values(possession).filter(p => p.qty > 0);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 bg-gray-900 dark:bg-black text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center font-bold">
              {employee.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-sm">{employee.name}</p>
              <p className="text-[10px] opacity-70 uppercase tracking-wider">{employee.role} • CPF: {applyCPFMask(employee.cpf || '')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors"><X size={20}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Possession Section */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Package size={16} className="text-blue-500"/>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Itens em Posse</h3>
            </div>
            {activePossession.length === 0 ? (
              <p className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl text-center">Nenhum item em posse no momento.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activePossession.map(p => (
                  <div key={p.code} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl">
                    <div className="min-w-0 pr-2">
                      <p className="text-[10px] font-mono text-blue-600 dark:text-blue-400">{p.code}</p>
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{p.name}</p>
                      <p className="text-[10px] text-gray-500">Em posse: <span className="font-bold text-blue-600 dark:text-blue-400">{p.qty}</span></p>
                    </div>
                    <button 
                      onClick={() => setReturnTarget({ itemId: p.itemId, name: p.name, maxQty: p.qty, unit: p.unit })}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 text-[10px] font-bold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors shadow-sm"
                    >
                      <ArrowDownLeft size={12}/> Devolver
                    </button>
                  </div>
                ))}
              </div>
            )}

            {returnTarget && (
              <ReturnModal 
                itemName={returnTarget.name}
                maxQty={returnTarget.maxQty}
                unit={returnTarget.unit}
                onConfirm={(qty) => { onReturn(returnTarget.itemId, qty); setReturnTarget(null); }}
                onClose={() => setReturnTarget(null)}
              />
            )}
          </section>

          {/* History Section */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <History size={16} className="text-gray-500"/>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Histórico de Movimentações</h3>
            </div>
            {empLogs.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">Nenhuma movimentação registrada para este funcionário.</p>
            ) : (
              <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
                {empLogs.map((log, idx) => (
                  <div key={log.id} className={`flex items-center gap-3 px-4 py-3 text-xs ${idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/50'} border-b border-gray-100 dark:border-gray-800 last:border-0`}>
                    <div className={log.type === 'entry' ? 'text-emerald-500' : 'text-rose-500'}>
                      {log.type === 'entry' ? <ArrowDownLeft size={14}/> : <ArrowUpRight size={14}/>}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 dark:text-gray-200">{log.itemName}</p>
                      <p className="text-[10px] text-gray-400">{new Date(log.date).toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${log.type === 'entry' ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {log.type === 'entry' ? '+' : '-'}{log.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

// ── Return Modal ─────────────────────────────────────────────────────────────

const ReturnModal: React.FC<{
  itemName: string;
  maxQty: number;
  unit: string;
  onConfirm: (qty: number) => void;
  onClose: () => void;
}> = ({ itemName, maxQty, unit, onConfirm, onClose }) => {
  const [qty, setQty] = useState(maxQty);
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-xs border border-gray-200 dark:border-gray-700 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-5 py-4 bg-blue-600 text-white flex items-center justify-between">
          <span className="font-bold text-sm">Devolução de Material</span>
          <button onClick={onClose}><X size={18}/></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Item</p>
            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{itemName}</p>
          </div>
          
          <div>
            <label className="text-[10px] font-bold uppercase text-gray-400 block mb-2">Quantidade a Devolver</label>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <Minus size={16}/>
              </button>
              <input 
                type="number" 
                value={qty} 
                min={1} 
                max={maxQty}
                onChange={e => setQty(Math.min(maxQty, Math.max(1, Number(e.target.value))))}
                className="flex-1 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-blue-500 rounded-xl py-2 text-center font-black text-lg outline-none transition-all"
              />
              <button 
                onClick={() => setQty(Math.min(maxQty, qty + 1))}
                className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <Plus size={16}/>
              </button>
            </div>
            <p className="text-[10px] text-center text-gray-400 mt-2 font-medium">Máximo disponível: <span className="font-bold text-blue-600">{maxQty} {unit}</span></p>
          </div>

          <button 
            onClick={() => onConfirm(qty)}
            className="w-full py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Check size={18}/> Confirmar Devolução
          </button>
        </div>
      </div>
    </div>
  );
};

const CartModal: React.FC<{
  cart: CartItem[];
  employees: Employee[];
  onConfirm: (employeeId: string, note: string) => void;
  onUpdateQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}> = ({ cart, employees, onConfirm, onUpdateQty, onRemove, onClose }) => {
  const [empId, setEmpId] = useState('');
  const [note, setNote] = useState('');
  const activeEmps = employees.filter(e => e.active);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 bg-gray-900 dark:bg-black text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18}/>
            <span className="font-bold text-sm">Carrinho de Saída ({cart.length})</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors"><X size={20}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <ShoppingCart size={32} className="mx-auto mb-2 opacity-20"/>
              <p className="text-sm">Seu carrinho está vazio</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-mono text-blue-600 dark:text-blue-400">{item.code}</p>
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{item.name}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1">
                    <button onClick={() => onUpdateQty(item.id, item.quantity - 1)} className="p-1 text-gray-400 hover:text-rose-500"><Minus size={14}/></button>
                    <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                    <button onClick={() => onUpdateQty(item.id, item.quantity + 1)} className="p-1 text-gray-400 hover:text-emerald-500"><Plus size={14}/></button>
                  </div>
                  <button onClick={() => onRemove(item.id)} className="p-2 text-gray-400 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
                </div>
              ))}
            </div>
          )}

          {cart.length > 0 && (
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-4">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 block mb-1.5 flex items-center gap-1"><Users size={11}/> Funcionário Responsável</label>
                <select value={empId} onChange={e => setEmpId(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                  <option value="">Selecionar funcionário para retirada...</option>
                  {activeEmps.map(e => <option key={e.id} value={e.id}>{e.name} — {e.role}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">Observação Global (opcional)</label>
                <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Ex: Kit de ferramentas para obra X..."
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"/>
              </div>
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="px-6 pb-6 pt-2">
            <button 
              disabled={!empId}
              onClick={() => onConfirm(empId, note)}
              className="w-full py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Check size={16}/> Confirmar Saída em Massa
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const QuantityModal: React.FC<{
  item: InventoryItem;
  onConfirm: (qty: number) => void;
  onClose: () => void;
}> = ({ item, onConfirm, onClose }) => {
  const [qty, setQty] = useState(1);
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-xs border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 bg-amber-500 text-white flex items-center justify-between">
          <span className="font-bold text-sm">Quantidade p/ Carrinho</span>
          <button onClick={onClose}><X size={18}/></button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">{item.name}</p>
          <div className="flex items-center gap-3">
            <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg"><Minus size={16}/></button>
            <input type="number" value={qty} onChange={e => setQty(Math.max(1, Number(e.target.value)))}
              className="flex-1 bg-gray-50 dark:bg-gray-800 border-none text-center font-bold text-lg rounded-lg py-2 focus:ring-0" />
            <button onClick={() => setQty(qty + 1)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg"><Plus size={16}/></button>
          </div>
          <button onClick={() => onConfirm(qty)} className="w-full py-2.5 bg-amber-500 text-white rounded-xl font-bold shadow-lg hover:bg-amber-600 transition-colors">
            Adicionar {qty} {item.unit}
          </button>
        </div>
      </div>
    </div>
  );
};

const MovementModal: React.FC<MovementModalProps> = ({ item, type, employees, onConfirm, onClose }) => {
  const [qty, setQty] = useState(1);
  const [empId, setEmpId] = useState('');
  const [note, setNote] = useState('');
  const activeEmps = employees.filter(e => e.active);
  const isEntry = type === 'entry';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className={`px-5 py-4 flex items-center justify-between ${isEntry ? 'bg-emerald-500' : 'bg-rose-500'}`}>
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            {isEntry ? <ArrowDownLeft size={18}/> : <ArrowUpRight size={18}/>}
            {isEntry ? 'Entrada' : 'Saída'} — {item.code} · {item.name}
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X size={18}/></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">Quantidade</label>
            <input type="number" step="any" min={0} value={qty} onChange={e => setQty(Math.max(0, Number(e.target.value)))}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"/>
            <p className="text-[10px] text-gray-400 mt-1">Quantidade atual: <b>{item.quantity}</b> {item.unit}</p>
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 block mb-1.5 flex items-center gap-1"><Users size={11}/> Funcionário Responsável</label>
            {activeEmps.length === 0 ? (
              <p className="text-xs text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">Nenhum funcionário ativo. Cadastre na aba Funcionários.</p>
            ) : (
              <select value={empId} onChange={e => setEmpId(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                <option value="">Selecionar funcionário...</option>
                {activeEmps.map(e => <option key={e.id} value={e.id}>{e.name} — {e.role}</option>)}
              </select>
            )}
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">Observação (opcional)</label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Ex: Entregue ao colaborador João..."
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"/>
          </div>
        </div>
        <div className="px-5 pb-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Cancelar</button>
          <button onClick={() => onConfirm(qty, empId, note)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold text-white shadow-sm transition-all ${isEntry ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'}`}>
            <Check size={14} className="inline mr-1.5"/>Confirmar {isEntry ? 'Entrada' : 'Saída'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Module ───────────────────────────────────────────────────────────────

type ActiveTab = 'inventory' | 'history';
function genId() { 
  try {
    return generateUUID();
  } catch (e) {
    return generateUUID();
  }
}

const CATEGORIES = ['Geral','EPI','Ferramenta','Escritório','Limpeza','Equipamento','Manutenção','TI','Elétrico','Hidráulico'];
const UNITS = ['Unid.','Par','Resma','Kg','L','m','m²','cx','pct','rolo'];

interface WarehouseModuleProps {
  inventory: InventoryItem[];
  onInventoryChange: (data: InventoryItem[]) => void;
  employees: Employee[];
  onEmployeesChange: (data: Employee[]) => void;
  logs: StockLog[];
  onLogsChange: (data: StockLog[]) => void;
  categories: WarehouseCategory[];
  onCategoriesChange: (data: WarehouseCategory[]) => void;
}


export const WarehouseModule: React.FC<WarehouseModuleProps> = ({
  inventory,
  onInventoryChange,
  employees,
  onEmployeesChange,
  logs,
  onLogsChange,
  categories,
  onCategoriesChange
}) => {

  const [activeTab, setActiveTab] = useState<ActiveTab>('inventory');

  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);

  const saveInventory = (data: InventoryItem[]) => { onInventoryChange(data); };
  const saveEmployees = (data: Employee[]) => { onEmployeesChange(data); };
  const saveLogs     = (data: StockLog[])   => { onLogsChange(data); };

  const [searchTerm, setSearchTerm] = useState('');
  const [searchTermEmployees, setSearchTermEmployees] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  const [movementTarget, setMovementTarget] = useState<{ item: InventoryItem; type: 'entry' | 'exit' } | null>(null);
  const [quantityTarget, setQuantityTarget] = useState<InventoryItem | null>(null);
  const [importPreview, setImportPreview] = useState<Partial<InventoryItem>[] | null>(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const emptyItem: Partial<InventoryItem> = { 
    code: '', 
    name: '', 
    category: categories.length > 0 ? categories[0].name : 'Geral', 
    consumable: false, 
    quantity: 0, 
    minStock: 0, 
    unit: 'Unid.', 
    itemsPerContainer: 1 
  };

  const [newItem, setNewItem] = useState<Partial<InventoryItem>>(emptyItem);

  const [showAddEmp, setShowAddEmp] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [newEmp, setNewEmp] = useState<Partial<Employee>>({ name: '', role: '', cpf: '', active: true });

  const handleAddItem = () => {
    if (!newItem.name?.trim()) return;
    const item: InventoryItem = {
      id: editingItem?.id || genId(),
      code: newItem.code?.trim() || nextCode(inventory),
      name: newItem.name,
      category: newItem.category || 'Geral',
      consumable: !!newItem.consumable,
      quantity: Number(newItem.quantity) || 0,
      minStock: Number(newItem.minStock) || 0,
      unit: newItem.unit || 'Unid.',
      itemsPerContainer: Number(newItem.itemsPerContainer) || 1,
      lastUpdated: new Date().toISOString(),
    };
    
    if (editingItem) {
      saveInventory(inventory.map(i => i.id === editingItem.id ? item : i));
      setEditingItem(null);
    } else {
      saveInventory([...inventory, item]);
      // Auto-log: registro de entrada para novo item aparecer no histórico
      if (item.quantity > 0) {
        const entryLog: StockLog = {
          id: genId(),
          itemId: item.id,
          itemCode: item.code,
          itemName: item.name,
          type: 'entry',
          quantity: item.quantity,
          date: new Date().toISOString(),
          employeeId: 'system',
          employeeName: 'Sistema',
          note: 'Cadastro inicial do item'
        };
        saveLogs([entryLog, ...logs].slice(0, 500));
      }
    }
    
    setShowAddModal(false);
    setNewItem(emptyItem);
  };

  const handleMovement = (qty: number, employeeId: string, note: string) => {
    if (!movementTarget) return;
    const { item, type } = movementTarget;
    const emp = employees.find(e => e.id === employeeId);
    const delta = type === 'entry' ? qty : -qty;
    saveInventory(inventory.map(i => i.id === item.id ? { ...i, quantity: Math.max(0, i.quantity + delta), lastUpdated: new Date().toISOString() } : i));
    const log: StockLog = { id: genId(), itemId: item.id, itemCode: item.code, itemName: item.name, type, quantity: qty, date: new Date().toISOString(), employeeId, employeeName: emp?.name || 'Não informado', note };
    saveLogs([log, ...logs].slice(0, 200));
    setMovementTarget(null);
  };

  const handleReturnItem = (itemId: string, qty: number) => {
    if (!selectedEmp) return;
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;

    // Direct return logic: creates an entry log
    const delta = qty; // Returning everything in possession for now, or we could add a partial return modal
    saveInventory(inventory.map(i => i.id === itemId ? { ...i, quantity: i.quantity + delta, lastUpdated: new Date().toISOString() } : i));
    
    const log: StockLog = { 
      id: genId(), 
      itemId: item.id, 
      itemCode: item.code, 
      itemName: item.name, 
      type: 'entry', 
      quantity: delta, 
      date: new Date().toISOString(), 
      employeeId: selectedEmp.id, 
      employeeName: selectedEmp.name, 
      note: 'Devolução de material' 
    };
    saveLogs([log, ...logs].slice(0, 200));
  };

  const handleUnpack = (item: InventoryItem) => {
    if (!item.itemsPerContainer || item.itemsPerContainer <= 1) return;
    if (item.quantity < 1) return;

    const updated = inventory.map(i => {
      if (i.id === item.id) {
        return {
          ...i,
          quantity: i.quantity - 1 + (item.itemsPerContainer || 0),
          lastUpdated: new Date().toISOString()
        };
      }
      return i;
    });
    saveInventory(updated);
    
    const log: StockLog = { 
      id: genId(), 
      itemId: item.id, 
      itemCode: item.code, 
      itemName: item.name, 
      type: 'entry', 
      quantity: item.itemsPerContainer - 1, 
      date: new Date().toISOString(), 
      employeeId: 'system', 
      employeeName: 'Sistema', 
      note: 'Desmembramento de caixa/container' 
    };
    saveLogs([log, ...logs].slice(0, 200));
  };

  const handleAddToCart = (item: InventoryItem, qty: number = 1) => {
    const existing = cart.find(c => c.itemId === item.id);
    if (existing) {
      setCart(cart.map(c => c.itemId === item.id ? { ...c, quantity: c.quantity + qty } : c));
    } else {
      setCart([...cart, {
        id: genId(),
        itemId: item.id,
        code: item.code,
        name: item.name,
        quantity: qty,
        unit: item.unit
      }]);
    }
  };

  const handleCheckout = (employeeId: string, note: string) => {
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return;

    let updatedInventory = [...inventory];
    const newLogs: StockLog[] = [];

    cart.forEach(cartItem => {
      const invIdx = updatedInventory.findIndex(i => i.id === cartItem.itemId);
      if (invIdx === -1) return;

      updatedInventory[invIdx] = {
        ...updatedInventory[invIdx],
        quantity: Math.max(0, updatedInventory[invIdx].quantity - cartItem.quantity),
        lastUpdated: new Date().toISOString()
      };

      newLogs.push({
        id: genId(),
        itemId: cartItem.itemId,
        itemCode: cartItem.code,
        itemName: cartItem.name,
        type: 'exit',
        quantity: cartItem.quantity,
        date: new Date().toISOString(),
        employeeId: emp.id,
        employeeName: emp.name,
        note: note || 'Saída via carrinho'
      });
    });

    saveInventory(updatedInventory);
    saveLogs([...newLogs, ...logs].slice(0, 200));
    setCart([]);
    setShowCart(false);
  };

  const handleAddEmployee = () => {
    if (!newEmp.name?.trim()) return;
    const employee: Employee = {
      id: editingEmp?.id || genId(),
      name: newEmp.name,
      role: newEmp.role || '',
      cpf: newEmp.cpf || '',
      active: true
    };

    if (editingEmp) {
      saveEmployees(employees.map(e => e.id === editingEmp.id ? employee : e));
      setEditingEmp(null);
    } else {
      saveEmployees([...employees, employee]);
    }
    
    setShowAddEmp(false); 
    setNewEmp({ name: '', role: '', cpf: '', active: true });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const isXlsx = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    const reader = new FileReader();
    reader.onload = ev => {
      if (isXlsx) {
        setImportPreview(parseXLSX(ev.target?.result as ArrayBuffer));
      } else {
        setImportPreview(parseCSV(ev.target?.result as string));
      }
    };

    if (isXlsx) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file, 'UTF-8');
    }
    e.target.value = '';
  };

  const handleImportConfirm = () => {
    if (!importPreview) return;
    
    // Get the base number for new MAT-XXX codes once
    const getBaseCodeNum = () => {
      const nums = inventory.map(i => {
        const m = i.code.match(/MAT-(\d+)/);
        return m ? parseInt(m[1]) : 0;
      });
      return Math.max(0, ...nums);
    };
    
    const baseNum = getBaseCodeNum();
    
    const newItems: InventoryItem[] = importPreview.map((p, idx) => ({
      id: p.id || generateUUID(), 
      code: p.code || `MAT-${String(baseNum + idx + 1).padStart(3, '0')}`, 
      name: p.name!, 
      category: p.category || 'Geral',
      consumable: !!p.consumable, 
      quantity: Number(p.quantity) || 0, 
      minStock: Number(p.minStock) || 0,
      unit: p.unit || 'Unid.', 
      lastUpdated: new Date().toISOString(),
    }));
    saveInventory([...inventory, ...newItems]);
    setImportPreview(null);
  };

  const availableItemCategories = Array.from(new Set(inventory.map(i => i.category))).sort();

  const itemPossession = React.useMemo(() => {
    const map: Record<string, { employeeName: string; employeeId: string; qty: number }[]> = {};
    const empPossession: Record<string, Record<string, number>> = {}; 

    logs.forEach(l => {
      if (!l.employeeId || l.employeeId === 'system') return;
      if (!empPossession[l.itemId]) empPossession[l.itemId] = {};
      
      const current = empPossession[l.itemId][l.employeeId] || 0;
      if (l.type === 'exit') {
        empPossession[l.itemId][l.employeeId] = current + l.quantity;
      } else if (l.type === 'entry') {
        empPossession[l.itemId][l.employeeId] = current - l.quantity;
      }
    });

    Object.keys(empPossession).forEach(itemId => {
      const emps = empPossession[itemId];
      map[itemId] = [];
      Object.keys(emps).forEach(empId => {
        if (emps[empId] > 0) {
          const emp = employees.find(e => e.id === empId);
          map[itemId].push({
            employeeId: empId,
            employeeName: emp ? emp.name : 'Desconhecido',
            qty: emps[empId]
          });
        }
      });
      map[itemId].sort((a, b) => a.employeeName.localeCompare(b.employeeName));
    });
    return map;
  }, [logs, employees]);

  const uniqueItemNames = React.useMemo(() => {
    return Array.from(new Set(inventory.map(i => i.name))).sort((a,b) => a.localeCompare(b));
  }, [inventory]);

  const filteredEmployees = React.useMemo(() => {
    return employees
      .filter(e => !searchTermEmployees || e.name.toLowerCase().includes(searchTermEmployees.toLowerCase()) || e.cpf.includes(searchTermEmployees) || e.role.toLowerCase().includes(searchTermEmployees.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [employees, searchTermEmployees]);

  const filtered = inventory.filter(item =>
    (!filterCategory || item.category === filterCategory) &&
    (!searchTerm || item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.code.toLowerCase().includes(searchTerm.toLowerCase()) || item.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const lowStock = inventory.filter(i => i.minStock > 0 && i.quantity <= i.minStock);

  const TABS: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'inventory', label: 'Almoxarifado', icon: <Package size={14}/> },
    { id: 'history',   label: 'Histórico',    icon: <History size={14}/> },
  ];

  return (
    <div className="h-full flex flex-col bg-palette-mediumLight dark:bg-[#111111] overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-3 bg-white/80 dark:bg-gray-900/50 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 flex-shrink-0 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center flex-shrink-0">
            <Archive size={14} className="text-white dark:text-gray-900"/>
          </div>
          <span className="font-bold text-sm text-gray-800 dark:text-white hidden sm:block">Almoxarifado</span>
          <span className="text-xs text-gray-400">{inventory.length} itens</span>
          {lowStock.length > 0 && <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[10px] font-bold rounded-full">{lowStock.length} alerta{lowStock.length > 1 ? 's' : ''}</span>}
        </div>

        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === t.id ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {activeTab === 'inventory' && <>
            <button onClick={() => exportInventory(inventory, logs)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg transition-colors border border-emerald-200 dark:border-emerald-800">
              <Download size={13}/><span className="hidden sm:inline">Exportar Planilha</span>
            </button>
            <button onClick={downloadTemplate} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-200 dark:border-gray-700">
              <FileSpreadsheet size={13}/><span className="hidden sm:inline">Modelo</span>
            </button>
            <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors border border-blue-200 dark:border-blue-800">
              <Upload size={13}/><span className="hidden sm:inline">Importar</span>
            </button>
            <input ref={fileRef} type="file" accept=".csv,.txt,.xlsx,.xls" onChange={handleFileUpload} className="hidden"/>
            <button onClick={() => setShowCategoryManager(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors border border-blue-200 dark:border-blue-800">
              <ChevronDown size={13}/> <span className="hidden sm:inline">Categorias</span>
            </button>
            <button onClick={() => { setNewItem({ ...emptyItem, code: nextCode(inventory) }); setShowAddModal(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-all shadow-sm">
              <Plus size={13}/> Novo Item
            </button>

            <button onClick={() => setShowCart(true)} className="relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg transition-colors border border-amber-200 dark:border-amber-800">
              <ShoppingCart size={13}/>
              {cart.length > 0 && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">{cart.length}</span>}
              <span className="hidden sm:inline">Carrinho</span>
            </button>
          </>}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-hidden">

        {/* === INVENTORY TAB === */}
        {activeTab === 'inventory' && (
          <div className="h-full flex flex-col overflow-hidden">
            {/* Search + filter bar */}
            <div className="px-5 py-2.5 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3 flex-shrink-0 flex-wrap">
              <div className="flex items-center gap-2 flex-1 min-w-[160px]">
                <Search size={14} className="text-gray-400 shrink-0"/>
                <input type="text" placeholder="Buscar código ou descrição..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400"/>
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                <button onClick={() => setFilterCategory('')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${!filterCategory ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                  Todos
                </button>
                {categories.map(cat => (
                  <button key={cat.id} onClick={() => setFilterCategory(cat.name === filterCategory ? '' : cat.name)}
                    style={{ 
                      backgroundColor: filterCategory === cat.name ? cat.color : 'transparent',
                      color: filterCategory === cat.name ? '#fff' : undefined,
                      borderColor: filterCategory === cat.name ? cat.color : undefined
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all border ${filterCategory === cat.name ? '' : 'text-gray-400 border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                    {cat.name}
                  </button>
                ))}

              </div>
              <span className="text-xs text-gray-400 shrink-0">{filtered.length} de {inventory.length}</span>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm border-collapse min-w-[700px]">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-[#3a5f8a] text-white text-xs font-bold uppercase tracking-wide">
                    <th className="px-4 py-2.5 text-left w-24">Código</th>
                    <th className="px-4 py-2.5 text-left">Descrição</th>
                    <th className="px-4 py-2.5 text-left w-32">Categoria</th>
                    <th className="px-4 py-2.5 text-center w-28">Consumível?</th>
                    <th className="px-4 py-2.5 text-center w-24">Qtd. Atual</th>
                    <th className="px-4 py-2.5 text-left w-32">Posse</th>
                    <th className="px-4 py-2.5 text-center w-24">Qtd. Mínima</th>
                    <th className="px-4 py-2.5 text-center w-20">Unidade</th>
                    <th className="px-4 py-2.5 text-right w-24">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-16 text-gray-400">
                      <Box size={36} className="mx-auto mb-2 opacity-30"/>
                      <p className="text-sm">Nenhum item encontrado</p>
                    </td></tr>
                  ) : filtered.map((item, idx) => {
                    const low = item.minStock > 0 && item.quantity <= item.minStock;
                    const rowBg = low
                      ? 'bg-rose-50 dark:bg-rose-900/10'
                      : idx % 2 === 0
                        ? 'bg-white dark:bg-gray-900'
                        : 'bg-[#eef2f7] dark:bg-gray-800/50';
                    return (
                      <tr key={item.id} className={`${rowBg} border-b border-gray-200 dark:border-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors group`}>
                        <td className="px-4 py-2.5 font-mono text-xs font-semibold text-[#3a5f8a] dark:text-blue-400">{item.code}</td>
                        <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-gray-100">{item.name}</td>
                        <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400 text-xs">{item.category}</td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold ${item.consumable ? 'bg-[#f4c97e] text-[#7a4f00]' : 'bg-[#b7e3b7] text-[#1a5c1a]'}`}>
                            {item.consumable ? 'Sim' : 'Não'}
                          </span>
                        </td>
                        <td className={`px-4 py-2.5 text-center font-bold font-mono ${low ? 'text-rose-600 dark:text-rose-400' : 'text-gray-800 dark:text-white'}`}>{item.quantity}</td>
                        <td className="px-4 py-2.5">
                          {!item.consumable && itemPossession[item.id]?.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {itemPossession[item.id].map(p => (
                                <span key={p.employeeId} className="inline-flex items-center gap-1 text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-800 whitespace-nowrap">
                                  <Users size={10}/>
                                  <span className="truncate max-w-[80px]" title={p.employeeName}>{p.employeeName}</span>
                                  <span className="font-bold opacity-70">({p.qty})</span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-400 text-center block">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-center text-gray-500 dark:text-gray-400">{item.minStock || '—'}</td>
                        <td className="px-4 py-2.5 text-center text-gray-500 dark:text-gray-400 text-xs">{item.unit}</td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setQuantityTarget(item)} title="Adicionar ao Carrinho"
                              className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors">
                              <ShoppingCart size={14}/>
                            </button>
                            <button onClick={() => { setNewItem(item); setEditingItem(item); setShowAddModal(true); }} title="Editar"
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors">
                              <Edit size={14}/>
                            </button>
                            
                            {/* Movement Menu */}
                            <div className="relative group/menu">
                              <button className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-0.5" title="Movimentação">
                                <Plus size={14}/>
                                <ChevronDown size={10}/>
                              </button>
                              
                              <div className="absolute right-0 top-full pt-1 w-48 z-20 hidden group-hover/menu:block">
                                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl py-2">
                                  <button onClick={() => setMovementTarget({ item, type: 'entry' })} 
                                    className="w-full px-3 py-1.5 text-left text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 flex items-center gap-2">
                                    <ArrowDownLeft size={14}/> Entrada Manual
                                  </button>
                                  <button onClick={() => handleMovement(item.itemsPerContainer || 1, 'system', 'Recebimento de Caixa')} 
                                    className="w-full px-3 py-1.5 text-left text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 flex items-center gap-2">
                                    <PackagePlus size={14}/> Adicionar Caixa (+{item.itemsPerContainer || 1})
                                  </button>
                                  <div className="h-px bg-gray-100 dark:bg-gray-700 my-1"></div>
                                  <button onClick={() => setMovementTarget({ item, type: 'exit' })} 
                                    className="w-full px-3 py-1.5 text-left text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-2">
                                    <ArrowUpRight size={14}/> Saída Manual
                                  </button>
                                  <button onClick={() => handleMovement(1, 'system', 'Remoção de 1 Unidade')} 
                                    className="w-full px-3 py-1.5 text-left text-xs text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 flex items-center gap-2">
                                    <Minus size={14}/> Remover 1 Unidade
                                  </button>
                                  {item.itemsPerContainer && item.itemsPerContainer > 1 && item.quantity >= 1 && (
                                    <button onClick={() => handleUnpack(item)} 
                                      className="w-full px-3 py-1.5 text-left text-xs text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-2">
                                      <Box size={14}/> Desmembrar Caixa
                                    </button>
                                  )}
                                  <div className="h-px bg-gray-100 dark:bg-gray-700 my-1"></div>
                                  <button onClick={() => { if (confirm('Remover item?')) saveInventory(inventory.filter(i => i.id !== item.id)); }} 
                                    className="w-full px-3 py-1.5 text-left text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                                    <Trash2 size={13}/> Excluir Item
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}



        {/* === HISTORY TAB === */}
        {activeTab === 'history' && (
          <div className="h-full flex flex-col">
            <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900">
               <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Histórico de Fluxo</span>
                 <button 
                   onClick={() => generateDailyReport(logs)}
                   className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-[10px] font-bold uppercase hover:bg-gray-800 transition-colors"
                 >
                 <Printer size={14}/> Relatório Diário
               </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-3">
                <History size={40} className="opacity-30"/>
                <p className="text-sm">Nenhuma movimentação registrada ainda</p>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-6 text-[10px] font-bold uppercase tracking-wider text-gray-400 px-5 py-2.5 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800 sticky top-0">
                  <div>Tipo</div><div>Código</div><div className="col-span-2">Produto</div><div>Funcionário</div><div>Data/Hora</div>
                </div>
                {logs.map(log => {
                  const isEntry = log.type === 'entry';
                  return (
                    <div key={log.id} className="grid grid-cols-6 items-center px-5 py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-sm transition-colors">
                      <div>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold ${isEntry ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'}`}>
                          {isEntry ? <ArrowDownLeft size={10}/> : <ArrowUpRight size={10}/>}
                          {isEntry ? `+${log.quantity}` : `-${log.quantity}`}
                        </span>
                      </div>
                      <div className="font-mono text-xs text-[#3a5f8a] dark:text-blue-400">{log.itemCode}</div>
                      <div className="col-span-2">
                        <p className="font-medium text-gray-800 dark:text-gray-100 truncate">{log.itemName}</p>
                        {log.note && <p className="text-[10px] text-gray-400 truncate">{log.note}</p>}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><Users size={10}/>{log.employeeName}</div>
                      <div className="text-[10px] text-gray-400">
                        <p>{new Date(log.date).toLocaleDateString('pt-BR')}</p>
                        <p>{new Date(log.date).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            </div>
          </div>
        )}

      {/* ── Add Item Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <span className="font-bold text-sm text-gray-800 dark:text-white">{editingItem ? 'Editar Item' : 'Novo Item de Almoxarifado'}</span>
              <button onClick={() => { setShowAddModal(false); setEditingItem(null); setNewItem(emptyItem); }} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X size={15}/></button>
            </div>
            <div className="p-5 grid grid-cols-2 gap-3">
              {/* Código */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block mb-1">Código</label>
                <input type="text" value={newItem.code||''} onChange={e => setNewItem({...newItem,code:e.target.value})} placeholder="MAT-001"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"/>
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block mb-1">Categoria</label>
                <select value={newItem.category||'Geral'} onChange={e => setNewItem({...newItem,category:e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>

              {/* Descrição */}
              <div className="col-span-2">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block mb-1">Descrição *</label>
                <input type="text" list="inventory-item-names" value={newItem.name||''} onChange={e => setNewItem({...newItem,name:e.target.value})} placeholder="Ex: Capacete de Segurança Azul"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"/>
                <datalist id="inventory-item-names">
                  {uniqueItemNames.map(name => <option key={name} value={name} />)}
                </datalist>
              </div>
              {/* Consumível */}
              <div className="col-span-2">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">Consumível?</label>
                <div className="flex gap-2">
                  {[false, true].map(v => (
                    <button key={String(v)} onClick={() => setNewItem({...newItem,consumable:v})}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all ${newItem.consumable===v ? v ? 'bg-[#f4c97e] border-[#d4a030] text-[#7a4f00]' : 'bg-[#b7e3b7] border-[#4a9a4a] text-[#1a5c1a]' : 'border-gray-200 dark:border-gray-700 text-gray-400'}`}>
                      {v ? 'Sim' : 'Não'}
                    </button>
                  ))}
                </div>
              </div>
              {/* Qtd Atual */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block mb-1">Qtd. Atual</label>
                <input type="number" step="any" min={0} value={newItem.quantity||0} onChange={e => setNewItem({...newItem,quantity:Number(e.target.value)})}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"/>
              </div>
              {/* Qtd Mínima */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block mb-1">Qtd. Mínima</label>
                <input type="number" step="any" min={0} value={newItem.minStock||0} onChange={e => setNewItem({...newItem,minStock:Number(e.target.value)})}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"/>
              </div>
              {/* Unidade */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block mb-1">Unidade</label>
                <select value={newItem.unit||'Unid.'} onChange={e => setNewItem({...newItem,unit:e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                  {UNITS.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
              {/* Qtd. por Container */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block mb-1">Qtd. p/ Container</label>
                <input type="number" min={1} value={newItem.itemsPerContainer||1} onChange={e => setNewItem({...newItem,itemsPerContainer:Number(e.target.value)})} placeholder="Ex: 50 para uma caixa"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"/>
              </div>
            </div>
            <div className="px-5 pb-5 flex justify-end gap-2">
              <button onClick={() => { setShowAddModal(false); setEditingItem(null); setNewItem(emptyItem); }} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Cancelar</button>
              <button onClick={handleAddItem} className="px-5 py-2 rounded-xl text-sm font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm hover:bg-gray-700 transition-all">
                <Check size={13} className="inline mr-1.5"/>{editingItem ? 'Atualizar' : 'Salvar Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Employee Modal ── */}
      {showAddEmp && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <span className="font-bold text-sm text-gray-800 dark:text-white">{editingEmp ? 'Editar Funcionário' : 'Cadastrar Funcionário'}</span>
              <button onClick={() => { setShowAddEmp(false); setEditingEmp(null); setNewEmp({ name: '', role: '', cpf: '', active: true }); }} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X size={15}/></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block mb-1">Nome Completo *</label>
                <input type="text" placeholder="Ex: João da Silva" value={newEmp.name||''} onChange={e => setNewEmp({...newEmp, name: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"/>
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block mb-1">Cargo</label>
                <input type="text" placeholder="Ex: Almoxarife" value={newEmp.role||''} onChange={e => setNewEmp({...newEmp, role: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"/>
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block mb-1">CPF</label>
                <input type="text" placeholder="000.000.000-00" maxLength={14} value={newEmp.cpf||''} onChange={e => setNewEmp({...newEmp, cpf: applyCPFMask(e.target.value)})}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"/>
              </div>
            </div>
            <div className="px-5 pb-5 flex justify-end gap-2">
              <button onClick={() => { setShowAddEmp(false); setEditingEmp(null); setNewEmp({ name: '', role: '', cpf: '', active: true }); }} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Cancelar</button>
              <button onClick={handleAddEmployee} className="px-5 py-2 rounded-xl text-sm font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm hover:bg-gray-700 transition-all">
                <Check size={13} className="inline mr-1.5"/>{editingEmp ? 'Atualizar' : 'Cadastrar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Quantity Selector ── */}
      {quantityTarget && (
        <QuantityModal 
          item={quantityTarget} 
          onConfirm={(q) => { handleAddToCart(quantityTarget, q); setQuantityTarget(null); }} 
          onClose={() => setQuantityTarget(null)} 
        />
      )}

      {/* ── Movement Modal ── */}
      {movementTarget && <MovementModal item={movementTarget.item} type={movementTarget.type} employees={employees} onConfirm={handleMovement} onClose={() => setMovementTarget(null)}/>}

      {/* ── Employee Detail Modal ── */}
      {selectedEmp && <EmployeeDetailModal employee={selectedEmp} logs={logs} inventory={inventory} onReturn={handleReturnItem} onClose={() => setSelectedEmp(null)} />}

      {/* ── Cart Modal ── */}
      {showCart && (
        <CartModal 
          cart={cart} 
          employees={employees} 
          onConfirm={handleCheckout}
          onUpdateQty={(id, q) => setCart(cart.map(c => c.id === id ? { ...c, quantity: Math.max(1, q) } : c))}
          onRemove={(id) => setCart(cart.filter(c => c.id !== id))}
          onClose={() => setShowCart(false)} 
        />
      )}

      {/* ── CSV Import Preview ── */}
      {importPreview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={16} className="text-emerald-500"/>
                <span className="font-bold text-sm text-gray-800 dark:text-white">Prévia da Importação — {importPreview.length} itens</span>
              </div>
              <button onClick={() => setImportPreview(null)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X size={15}/></button>
            </div>
            <div className="overflow-auto max-h-80">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#3a5f8a] text-white">
                    {['Código','Descrição','Categoria','Consumível?','Qtd. Atual','Qtd. Mínima','Unidade'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left font-bold uppercase tracking-wider text-[10px] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {importPreview.map((item, i) => (
                    <tr key={i} className={`border-b border-gray-100 dark:border-gray-800 ${i%2===0?'bg-white dark:bg-gray-900':'bg-[#eef2f7] dark:bg-gray-800/50'}`}>
                      <td className="px-4 py-2 font-mono text-[#3a5f8a] dark:text-blue-400">{item.code||'—'}</td>
                      <td className="px-4 py-2 font-medium text-gray-800 dark:text-gray-100">{item.name}</td>
                      <td className="px-4 py-2 text-gray-500">{item.category}</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${item.consumable?'bg-[#f4c97e] text-[#7a4f00]':'bg-[#b7e3b7] text-[#1a5c1a]'}`}>{item.consumable?'Sim':'Não'}</span>
                      </td>
                      <td className="px-4 py-2 text-center font-mono">{item.quantity}</td>
                      <td className="px-4 py-2 text-center">{item.minStock||'—'}</td>
                      <td className="px-4 py-2 text-center">{item.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <p className="text-xs text-gray-400">Itens serão adicionados ao estoque atual</p>
              <div className="flex gap-2">
                <button onClick={() => setImportPreview(null)} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Cancelar</button>
                <button onClick={handleImportConfirm} className="px-5 py-2 rounded-xl text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm transition-all">
                  <Check size={13} className="inline mr-1.5"/>Importar {importPreview.length} itens
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Category Manager Modal ── */}
      {showCategoryManager && (
        <CategoryManagerModal 
          categories={categories} 
          onCategoriesChange={onCategoriesChange} 
          onClose={() => setShowCategoryManager(false)}
        />
      )}
      </div>
    </div>
  );
};

// ── Category Manager Modal ────────────────────────────────────────────────────

interface CategoryManagerModalProps {
  categories: WarehouseCategory[];
  onCategoriesChange: (data: WarehouseCategory[]) => void;
  onClose: () => void;
}

const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({ categories, onCategoriesChange, onClose }) => {
  const [newCat, setNewCat] = useState({ name: '', color: '#3b82f6' });
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAdd = () => {
    if (!newCat.name.trim()) return;
    if (editingId) {
      onCategoriesChange(categories.map(c => c.id === editingId ? { ...c, ...newCat } : c));
      setEditingId(null);
    } else {
      onCategoriesChange([...categories, { id: generateUUID(), ...newCat }]);
    }
    setNewCat({ name: '', color: '#3b82f6' });
  };

  const handleDelete = (id: string) => {
    if (confirm('Excluir esta categoria? Itens nesta categoria não serão excluídos.')) {
      onCategoriesChange(categories.filter(c => c.id !== id));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <span className="font-bold text-sm text-gray-800 dark:text-white">Gerenciar Categorias</span>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X size={15}/></button>
        </div>
        
        <div className="p-5 space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 min-w-0">
              <label className="text-[10px] font-semibold uppercase text-gray-400 block mb-1">Nome da Categoria</label>
              <input 
                type="text" 
                value={newCat.name} 
                onChange={e => setNewCat({ ...newCat, name: e.target.value })}
                placeholder="Ex: Elétrica"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/30 outline-none"
              />
            </div>
            <div className="w-12">
              <label className="text-[10px] font-semibold uppercase text-gray-400 block mb-1">Cor</label>
              <input 
                type="color" 
                value={newCat.color} 
                onChange={e => setNewCat({ ...newCat, color: e.target.value })}
                className="w-full h-9 p-0 border-0 bg-transparent cursor-pointer rounded-xl"
              />
            </div>
            <button 
              onClick={handleAdd}
              className="mt-5 w-9 h-9 flex items-center justify-center bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
            >
              {editingId ? <Check size={16}/> : <Plus size={16}/>}
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-xs font-medium dark:text-gray-200 truncate">{cat.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => { setEditingId(cat.id); setNewCat({ name: cat.name, color: cat.color }); }}
                    className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <Edit size={12}/>
                  </button>
                  <button 
                    onClick={() => handleDelete(cat.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <Trash2 size={12}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
