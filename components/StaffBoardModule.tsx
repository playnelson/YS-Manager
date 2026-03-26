
import React, { useState, useMemo } from 'react';
import { 
  Users, Search, UserCircle2, ArrowRight, Printer, 
  Package, LayoutGrid, List, ChevronRight, UserPlus,
  ArrowUpRight, ArrowDownLeft, ShieldCheck, HardHat, Info, Check, X, Edit, Trash2, Clock
} from 'lucide-react';

function genId() { 
  try { return crypto.randomUUID(); } 
  catch (e) { return Math.random().toString(36).substring(2, 15); }
}

const applyCPFMask = (value: string) => {
  const nums = value.replace(/\D/g, '').slice(0, 11);
  return nums
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

interface StaffBoardModuleProps {
  employees: any[];
  onEmployeesChange: (data: any[]) => void;
  inventory: any[];
  logs: any[];
  companySettings?: { name: string; logoUrl: string };
}

export const StaffBoardModule: React.FC<StaffBoardModuleProps> = ({
  employees,
  onEmployeesChange,
  inventory,
  logs,
  companySettings
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmp, setSelectedEmp] = useState<any | null>(null);
  // View mode is now fixed to list/table as per user request

  const [showAddEmp, setShowAddEmp] = useState(false);
  const [editingEmp, setEditingEmp] = useState<any | null>(null);
  const [newEmp, setNewEmp] = useState({ name: '', role: '', cpf: '', department: '' });

  const handleAddEmployee = () => {
    if (!newEmp.name?.trim()) return;
    const employee = {
      id: editingEmp?.id || genId(),
      name: newEmp.name,
      role: newEmp.role || '',
      department: newEmp.department || '',
      cpf: newEmp.cpf || '',
      active: true
    };

    if (editingEmp) {
      onEmployeesChange(employees.map(e => e.id === editingEmp.id ? { ...e, ...employee } : e));
      setSelectedEmp(employee);
    } else {
      onEmployeesChange([...employees, employee]);
    }
    
    setShowAddEmp(false); 
    setEditingEmp(null);
    setNewEmp({ name: '', role: '', cpf: '', department: '' });
  };

  const handleDeleteEmployee = (id: string) => {
    if (confirm('Deseja realmente remover este funcionário?')) {
      onEmployeesChange(employees.filter(e => e.id !== id));
      if (selectedEmp?.id === id) setSelectedEmp(null);
    }
  };

  const possessionData = useMemo(() => {
    const map: Record<string, { items: any[], epiCount: number, matCount: number, lastUpdate: string | null }> = {};
    employees.forEach(e => map[e.id] = { items: [], epiCount: 0, matCount: 0, lastUpdate: null });

    const tempMap: Record<string, Record<string, { qty: number, lastDate: string | null, type: string }>> = {};
    
    // Sort logs chronologically to correctly track the latest movement date
    const sortedLogs = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sortedLogs.forEach(log => {
      if (!log.employeeId || log.employeeId === 'system') return;
      if (!tempMap[log.employeeId]) tempMap[log.employeeId] = {};
      
      const current = tempMap[log.employeeId][log.itemId] || { qty: 0, lastDate: null, type: '' };
      if (log.type === 'exit') {
        tempMap[log.employeeId][log.itemId] = { qty: current.qty + log.quantity, lastDate: log.date, type: 'exit' };
      } else {
        tempMap[log.employeeId][log.itemId] = { qty: Math.max(0, current.qty - log.quantity), lastDate: log.date, type: 'entry' };
      }
    });

    Object.keys(tempMap).forEach(empId => {
      const items = tempMap[empId];
      let maxDate: number = 0;
      let lastDateStr: string | null = null;

      Object.keys(items).forEach(itemId => {
        const data = items[itemId];
        
        // Track overall latest update for this employee
        if (data.lastDate) {
          const d = new Date(data.lastDate).getTime();
          if (d > maxDate) {
            maxDate = d;
            lastDateStr = data.lastDate;
          }
        }

        if (data.qty > 0) {
          const invItem = inventory.find(i => i.id === itemId);
          if (invItem && !invItem.consumable) {
            map[empId].items.push({
              ...invItem,
              possessedQty: data.qty,
              dateTaken: data.lastDate
            });
            if (invItem.category?.toUpperCase() === 'EPI') {
              map[empId].epiCount += data.qty;
            } else {
              map[empId].matCount += data.qty;
            }
          }
        }
      });
      map[empId].lastUpdate = lastDateStr;
    });

    return map;
  }, [employees, inventory, logs]);

  const filteredEmployees = employees.filter(e => {
    const term = searchTerm.toLowerCase();
    return (
      e.name.toLowerCase().includes(term) ||
      e.role.toLowerCase().includes(term) ||
      e.cpf.includes(term) ||
      e.department?.toLowerCase().includes(term)
    );
  });

const stats = useMemo(() => {
    let totalItems = 0;
    let employeesWithItems = 0;
    
    Object.values(possessionData).forEach(data => {
      if (data.items.length > 0) {
        employeesWithItems++;
        data.items.forEach(i => totalItems += i.possessedQty);
      }
    });

    return { totalItems, employeesWithItems };
  }, [possessionData]);

  const printSheet = (employee: any, items: any[], title: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const companyName = companySettings?.name || 'Empresa';
    const logoUrl = companySettings?.logoUrl || '';
    const logoHtml = logoUrl
      ? `<img src="${logoUrl}" alt="Logo" style="max-height: 70px; max-width: 200px; object-fit: contain;"/>`
      : `<div style="width:70px; height:70px; background:#e2e8f0; border-radius:8px; display:flex; align-items:center; justify-content:center; color:#94a3b8; font-size:11px; font-weight:bold;">LOGO</div>`;

    const itemsHtml = items.map(item => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 12px; font-family: monospace;">${item.code}</td>
        <td style="border: 1px solid #ddd; padding: 12px;">${item.name}</td>
        <td style="border: 1px solid #ddd; padding: 12px; text-align: center; font-weight: bold;">${item.possessedQty} ${item.unit}</td>
        <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${item.dateTaken ? new Date(item.dateTaken).toLocaleDateString('pt-BR') : '___/___/_____'}</td>
        <td style="border: 1px solid #ddd; padding: 12px;"></td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>${title} - ${employee.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 50px; color: #1a1a1a; line-height: 1.6; }
            .header { display: flex; align-items: center; gap: 24px; border-bottom: 3px solid #1a1a1a; padding-bottom: 20px; margin-bottom: 36px; }
            .header-text h1 { margin: 0 0 4px; font-size: 20px; text-transform: uppercase; letter-spacing: 1px; }
            .header-text p { margin: 0; font-size: 12px; color: #555; font-weight: 600; }
            .info { margin-bottom: 32px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px; background: #f8f9fa; padding: 16px; border-radius: 6px; border: 1px solid #e2e8f0; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            th { background: #1a1a1a; color: white; border: 1px solid #1a1a1a; padding: 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
            .signature-area { margin-top: 80px; display: flex; flex-direction: column; align-items: center; }
            .line { width: 350px; border-top: 2px solid #1a1a1a; margin-bottom: 8px; }
            .footer { margin-top: 60px; font-size: 10px; color: #aaa; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
            .legal { font-size: 11px; text-align: justify; margin-top: 30px; font-style: italic; color: #444; }
          </style>
        </head>
        <body>
          <div class="header">
            ${logoHtml}
            <div class="header-text">
              <h1>${companyName}</h1>
              <p>${title}</p>
            </div>
          </div>
          
          <div class="info">
            <div><strong>Colaborador:</strong> ${employee.name}</div>
            <div><strong>Cargo:</strong> ${employee.role}</div>
            <div><strong>CPF:</strong> ${employee.cpf || '---'}</div>
            <div><strong>Data de Emissão:</strong> ${new Date().toLocaleDateString('pt-BR')}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 100px;">Código</th>
                <th>Descrição do Equipamento</th>
                <th style="width: 80px; text-align: center;">Qtd</th>
                <th style="width: 100px; text-align: center;">Data Entrega</th>
                <th style="width: 250px; text-align: center;">Assinatura do Colaborador</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="legal">
            Declaro ter recebido os equipamentos acima discriminados em perfeitas condições de uso e funcionamento. 
            Estou ciente de minha responsabilidade pela guarda, conservação e uso adequado, e comprometo-me a devolvê-los 
            ao término do vínculo empregatício ou quando solicitado.
          </div>

          <div class="signature-area">
            <div class="line" style="margin-top: 50px;"></div>
            <div style="font-weight: bold; font-size: 14px;">${employee.name.toUpperCase()}</div>
            <div style="font-size: 10px; margin-top: 4px; color: #666;">Assinatura Geral do Colaborador</div>
            
            <div class="line" style="margin-top: 70px;"></div>
            <div style="font-size: 10px; margin-top: 4px; color: #666;">Visto do Setor Responsável (Almoxarifado / Segurança)</div>
          </div>

          <div class="footer">
            ${companyName} | Gerado em ${new Date().toLocaleString('pt-BR')}
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
  };

  const categorizedItems = (items: any[]) => {
    return {
      epi: items.filter(i => i.category?.toUpperCase() === 'EPI'),
      materiais: items.filter(i => i.category?.toUpperCase() !== 'EPI')
    };
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-black/10 overflow-hidden">
      {/* Top Banner Stats */}
      <div className="px-8 py-6 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
              <Users className="text-blue-600" size={28} />
              Quadro de Funcionários
            </h2>
            <p className="text-sm font-medium text-gray-500 mt-1">Monitoramento de ativos e equipamentos em posse</p>
          </div>
          
          <div className="flex gap-4">
            <div className="px-5 py-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl">
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Ativos em Uso</p>
              <p className="text-2xl font-black text-blue-900 dark:text-blue-400">{stats.totalItems}</p>
            </div>
            <div className="px-5 py-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl">
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Colaboradores Alocados</p>
              <p className="text-2xl font-black text-emerald-900 dark:text-emerald-400">{stats.employeesWithItems}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-8 py-4 flex items-center gap-4 bg-white/50 dark:bg-black/20 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 shrink-0">
        <div className="flex-1 relative max-w-md">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Filtrar por nome ou cargo..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/30 font-medium"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => { setEditingEmp(null); setNewEmp({ name: '', role: '', cpf: '', department: '' }); setShowAddEmp(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-sm font-semibold hover:bg-gray-700 dark:hover:bg-gray-100 transition-all shadow-sm"
          >
            <UserPlus size={16} /> Novo Trabalhador
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl md:rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-black/20 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Nome / CPF</th>
                  <th className="px-5 py-3.5">Função / Setor</th>
                  <th className="px-5 py-3.5 text-center">EPIs</th>
                  <th className="px-5 py-3.5 text-center">Ferramentas</th>
                  <th className="px-5 py-3.5">Última Movimentação</th>
                  <th className="px-5 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {filteredEmployees.map(emp => {
                  const data = possessionData[emp.id];
                  const hasEpi = data.epiCount > 0;
                  const hasMat = data.matCount > 0;
                  
                  return (
                    <tr 
                      key={emp.id} 
                      className="hover:bg-blue-50/30 dark:hover:bg-blue-900/5 transition-colors group cursor-pointer"
                      onClick={() => setSelectedEmp(emp)}
                    >
                      <td className="px-5 py-3 text-sm">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-black uppercase ${emp.active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${emp.active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {emp.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div>
                          <p className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors uppercase tracking-tight">{emp.name}</p>
                          <p className="text-[10px] font-mono font-medium text-gray-400 mt-0.5">{applyCPFMask(emp.cpf || '')}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{emp.role}</p>
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{emp.department || 'Geral'}</p>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`inline-block min-w-[28px] px-2 py-1 rounded-md text-xs font-black ${hasEpi ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'}`}>
                          {data.epiCount}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                         <span className={`inline-block min-w-[28px] px-2 py-1 rounded-md text-xs font-black ${hasMat ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'}`}>
                          {data.matCount}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {data.lastUpdate ? (
                          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                            <Clock size={12} className="opacity-50" />
                            <div>
                              <p className="text-[10px] font-bold">{new Date(data.lastUpdate).toLocaleDateString('pt-BR')}</p>
                              <p className="text-[9px] opacity-70">{new Date(data.lastUpdate).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-300 dark:text-gray-700 font-bold italic">Sem registros</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button className="p-2 text-gray-300 group-hover:text-blue-500 transition-all transform group-hover:scale-110">
                          <ChevronRight size={20} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Employee Detail Slide-over */}
      {selectedEmp && (
        <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={() => setSelectedEmp(null)}></div>
          <div className="absolute inset-y-0 right-0 w-full max-w-xl bg-white dark:bg-gray-900 shadow-2xl pointer-events-auto flex flex-col animate-in slide-in-from-right duration-300">
            {/* Slide Header */}
            <div className="px-8 py-8 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                    <UserCircle2 size={42} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{selectedEmp.name}</h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">{selectedEmp.role} {selectedEmp.department ? `— ${selectedEmp.department}` : ''}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <button onClick={() => { setEditingEmp(selectedEmp); setNewEmp({ name: selectedEmp.name, role: selectedEmp.role || '', department: selectedEmp.department || '', cpf: selectedEmp.cpf || '' }); setShowAddEmp(true); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-[10px] font-bold uppercase transition-colors hover:bg-gray-200 dark:hover:bg-gray-700">
                        <Edit size={12} /> Editar
                      </button>
                      <button onClick={() => handleDeleteEmployee(selectedEmp.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase transition-colors hover:bg-red-100 dark:hover:bg-red-900/40">
                        <Trash2 size={12} /> Remover
                      </button>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedEmp(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-400"
                ><ArrowRight size={24} /></button>
              </div>
              
              <div className="mt-8 flex gap-6">
                 <div>
                   <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">CPF Identificação</p>
                   <p className="text-xs font-bold font-mono text-gray-900 dark:text-gray-200">{selectedEmp.cpf || 'Não Informado'}</p>
                 </div>
                 <div>
                   <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Status Contratual</p>
                   <span className={`px-2 py-0.5 text-[9px] font-black rounded uppercase ${selectedEmp.active ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                     {selectedEmp.active ? 'Ativo' : 'Inativo'}
                   </span>
                 </div>
              </div>
            </div>

            {/* Slide Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Items Section */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/10 flex items-center justify-center text-blue-600">
                       <HardHat size={18} />
                    </div>
                    <h4 className="text-sm font-black uppercase text-gray-900 dark:text-white">Ativos em uso (Não Consumíveis)</h4>
                  </div>
                </div>

                {(() => {
                  const empData = possessionData[selectedEmp.id];
                  const empItems = empData ? empData.items : [];
                  const { epi, materiais } = categorizedItems(empItems);
                  
                  if (empItems.length === 0) {
                    return (
                      <div className="bg-gray-50 dark:bg-gray-800/40 rounded-3xl p-12 text-center border-2 border-dashed border-gray-100 dark:border-gray-800">
                        <Package className="mx-auto mb-4 text-gray-200" size={48} />
                        <p className="text-sm font-bold text-gray-400 italic">Nenhum equipamento de longa duração <br/>vinculado a este colaborador.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-6">
                      {epi.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Equipamentos de Proteção (EPI)</h5>
                            <button 
                              onClick={() => printSheet(selectedEmp, epi, 'Ficha de Entrega de EPI')}
                              className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-[10px] font-black uppercase hover:scale-105 active:scale-95 transition-all shadow-sm"
                            >
                              <Printer size={12} /> Imprimir EPIs
                            </button>
                          </div>
                          {epi.map(item => (
                            <div key={item.id} className="p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl flex items-center justify-between shadow-sm group">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-500 group-hover:bg-orange-100 transition-colors">
                                    <ShieldCheck size={20} />
                                 </div>
                                 <div>
                                   <p className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-tight">{item.name}</p>
                                   <p className="text-[10pt] font-mono text-gray-400">{item.code} {item.dateTaken && `• Em: ${new Date(item.dateTaken).toLocaleDateString('pt-BR')}`}</p>
                                 </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-black text-blue-600">{item.possessedQty} <span className="text-[10px] uppercase font-bold text-gray-400">{item.unit}</span></p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {materiais.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between mt-4">
                            <h5 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Materiais e Ferramentas</h5>
                            <button 
                              onClick={() => printSheet(selectedEmp, materiais, 'Ficha de Materiais em Posse')}
                              className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-[10px] font-black uppercase hover:scale-105 active:scale-95 transition-all shadow-sm"
                            >
                              <Printer size={12} /> Imprimir Materiais
                            </button>
                          </div>
                          {materiais.map(item => (
                            <div key={item.id} className="p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl flex items-center justify-between shadow-sm group">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center text-gray-500 group-hover:text-blue-500 transition-colors">
                                    <Package size={20} />
                                 </div>
                                 <div>
                                   <p className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-tight">{item.name}</p>
                                   <p className="text-[10pt] font-mono text-gray-400">{item.code} {item.dateTaken && `• Em: ${new Date(item.dateTaken).toLocaleDateString('pt-BR')}`}</p>
                                 </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-black text-blue-600">{item.possessedQty} <span className="text-[10px] uppercase font-bold text-gray-400">{item.unit}</span></p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </section>

              {/* Enhanced timeline for this specific user */}
              <section>
                <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-500">
                       <Info size={18} />
                    </div>
                    <h4 className="text-sm font-black uppercase text-gray-900 dark:text-white">Linha do Tempo de Movimentações</h4>
                </div>
                
                <div className="space-y-4">
                   {(() => {
                     const userLogs = logs
                       .filter(l => l.employeeId === selectedEmp.id)
                       .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                       
                     if (userLogs.length === 0) {
                       return <p className="p-6 border border-gray-100 dark:border-gray-800 rounded-2xl text-center text-xs text-gray-400 font-medium bg-white dark:bg-gray-900">Nenhum registro de movimentação encontrado.</p>;
                     }

                     return (
                       <div className="relative border-l-2 border-gray-100 dark:border-gray-800 ml-3 pl-5 space-y-6">
                         {userLogs.map((log) => {
                           const isExit = log.type === 'exit'; // Exit from warehouse = Taken by employee
                           return (
                             <div key={log.id} className="relative">
                               <div className={`absolute -left-[29px] w-6 h-6 rounded-full border-4 border-white dark:border-gray-900 flex items-center justify-center ${isExit ? 'bg-rose-500' : 'bg-emerald-500'}`}>
                                 {isExit ? <ArrowUpRight size={10} className="text-white"/> : <ArrowDownLeft size={10} className="text-white"/>}
                               </div>
                               <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                 <div className="flex justify-between items-start mb-2">
                                   <div className="flex items-center gap-2">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${isExit ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'}`}>
                                        {isExit ? 'Retirou' : 'Devolveu / Recebeu'}
                                      </span>
                                      <span className="text-xs text-gray-400 font-medium font-mono border-l border-gray-200 dark:border-gray-700 pl-2">{log.itemCode}</span>
                                   </div>
                                   <div className="text-right">
                                     <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(log.date).toLocaleDateString('pt-BR')} às {new Date(log.date).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })}</p>
                                   </div>
                                 </div>
                                 <div className="flex justify-between items-end">
                                    <div>
                                      <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">{log.itemName}</p>
                                      {log.note && <p className="text-xs text-gray-500 mt-1 italic">Obs: {log.note}</p>}
                                    </div>
                                    <p className={`text-lg font-black ${isExit ? 'text-rose-600' : 'text-emerald-600'}`}>
                                      {isExit ? '-' : '+'}{log.quantity}
                                    </p>
                                 </div>
                               </div>
                             </div>
                           );
                         })}
                       </div>
                     );
                   })()}
                </div>
              </section>
            </div>
            
            <div className="p-8 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-black/20">
              <p className="text-[9px] font-black text-gray-400 text-center uppercase tracking-widest">Acesso Restrito ao Gestor de Ativos • YS-Manager Cloud</p>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Employee Modal */}
      {showAddEmp && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <span className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-wider">{editingEmp ? 'Editar Trabalhador' : 'Cadastrar Trabalhador'}</span>
              <button 
                onClick={() => { setShowAddEmp(false); setEditingEmp(null); setNewEmp({ name: '', role: '', cpf: '', department: '' }); }} 
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X size={18} className="text-gray-500"/>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1.5">Nome Completo *</label>
                <input type="text" placeholder="Ex: João da Silva" value={newEmp.name} onChange={e => setNewEmp({...newEmp, name: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-shadow"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1.5">Cargo</label>
                  <input type="text" placeholder="Ex: Almoxarife" value={newEmp.role} onChange={e => setNewEmp({...newEmp, role: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-shadow"/>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1.5">Departamento</label>
                  <input type="text" placeholder="Ex: Operações" value={newEmp.department} onChange={e => setNewEmp({...newEmp, department: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-shadow"/>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1.5">CPF</label>
                <input type="text" placeholder="000.000.000-00" maxLength={14} value={newEmp.cpf} onChange={e => setNewEmp({...newEmp, cpf: applyCPFMask(e.target.value)})}
                  className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-shadow"/>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-black/10 flex justify-end gap-3">
              <button 
                onClick={() => { setShowAddEmp(false); setEditingEmp(null); setNewEmp({ name: '', role: '', cpf: '', department: '' }); }} 
                className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleAddEmployee} 
                className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:-translate-y-0.5 transition-all"
              >
                {editingEmp ? 'Atualizar' : 'Cadastrar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
