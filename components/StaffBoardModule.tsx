
import React, { useState, useMemo } from 'react';
import { 
  Users, Search, UserCircle2, ArrowRight, Printer, 
  Package, LayoutGrid, List, ChevronRight, UserPlus,
  ArrowUpRight, ArrowDownLeft, ShieldCheck, HardHat, Info
} from 'lucide-react';

interface StaffBoardModuleProps {
  employees: any[];
  inventory: any[];
  logs: any[];
}

export const StaffBoardModule: React.FC<StaffBoardModuleProps> = ({
  employees,
  inventory,
  logs
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmp, setSelectedEmp] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const possessionData = useMemo(() => {
    const map: Record<string, any[]> = {};
    
    // Initialize for all employees
    employees.forEach(e => map[e.id] = []);

    // Calculate possession from logs
    // Groups by employeeId and then by itemId
    const tempMap: Record<string, Record<string, number>> = {};
    
    logs.forEach(log => {
      if (!log.employeeId || log.employeeId === 'system') return;
      if (!tempMap[log.employeeId]) tempMap[log.employeeId] = {};
      
      const current = tempMap[log.employeeId][log.itemId] || 0;
      if (log.type === 'exit') {
        tempMap[log.employeeId][log.itemId] = current + log.quantity;
      } else {
        tempMap[log.employeeId][log.itemId] = Math.max(0, current - log.quantity);
      }
    });

    // Convert tempMap to list of items with details
    Object.keys(tempMap).forEach(empId => {
      const items = tempMap[empId];
      Object.keys(items).forEach(itemId => {
        const qty = items[itemId];
        if (qty > 0) {
          const invItem = inventory.find(i => i.id === itemId);
          if (invItem && !invItem.consumable) { // Only non-consumables
            if (!map[empId]) map[empId] = [];
            map[empId].push({
              ...invItem,
              possessedQty: qty
            });
          }
        }
      });
    });

    return map;
  }, [employees, inventory, logs]);

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = useMemo(() => {
    let totalItems = 0;
    let employeesWithItems = 0;
    
    Object.values(possessionData).forEach(items => {
      if (items.length > 0) {
        employeesWithItems++;
        items.forEach(i => totalItems += i.possessedQty);
      }
    });

    return { totalItems, employeesWithItems };
  }, [possessionData]);

  const printPPEForm = (employee: any, items: any[]) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const date = new Date().toLocaleDateString('pt-BR');
    const itemsHtml = items.map(item => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 12px; font-family: monospace;">${item.code}</td>
        <td style="border: 1px solid #ddd; padding: 12px;">${item.name}</td>
        <td style="border: 1px solid #ddd; padding: 12px; text-align: center; font-weight: bold;">${item.possessedQty} ${item.unit}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Ficha de EPI - ${employee.name}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 50px; color: #1a1a1a; line-height: 1.6; }
            .header { text-align: center; border-bottom: 3px solid #1a1a1a; padding-bottom: 25px; margin-bottom: 40px; }
            .header h1 { margin: 0; font-size: 28px; text-transform: uppercase; letter-spacing: 2px; }
            .info { margin-bottom: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 14px; background: #f8f9fa; padding: 20px; border-radius: 8px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            th { background: #1a1a1a; color: white; border: 1px solid #1a1a1a; padding: 14px; text-align: left; font-size: 11px; text-transform: uppercase; }
            .signature-area { margin-top: 80px; display: flex; flex-direction: column; align-items: center; }
            .line { width: 350px; border-top: 2px solid #1a1a1a; margin-bottom: 8px; }
            .footer { margin-top: 60px; font-size: 10px; color: #888; text-align: center; border-top: 1px solid #eee; pt: 20px; }
            .legal { font-size: 11px; text-align: justify; margin-top: 30px; font-style: italic; color: #444; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Ficha de Entrega de Equipamentos (EPI & Ferramental)</h1>
            <p style="margin:8px 0 0; font-weight: 600; color: #666;">Documento de Controle de Ativos - YS Manager</p>
          </div>
          
          <div class="info">
            <div><strong>Colaborador:</strong> ${employee.name}</div>
            <div><strong>Cargo:</strong> ${employee.role}</div>
            <div><strong>CPF:</strong> ${employee.cpf || '---'}</div>
            <div><strong>Data de Emissão:</strong> ${date}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 120px;">Código</th>
                <th>Descrição do Equipamento</th>
                <th style="width: 100px; text-align: center;">Quantidade</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="legal">
            Declaro ter recebido os equipamentos acima discriminados em perfeitas condições de uso e funcionamento, 
            comprometendo-me a utilizá-los estritamente no exercício de minhas funções profissionais. Estou ciente de minha 
            responsabilidade pela guarda e conservação dos mesmos, bem como do dever de devolvê-los ao término do vínculo 
            empregatício ou quando solicitado. O uso negligente ou extravio poderá acarretar nas sanções previstas em lei e 
            regulamento interno.
          </div>

          <div class="signature-area">
            <div class="line" style="margin-top: 50px;"></div>
            <div style="font-weight: bold; font-size: 14px;">${employee.name.toUpperCase()}</div>
            <div style="font-size: 10px; margin-top: 4px; color: #666;">Assinatura do Colaborador</div>
            
            <div class="line" style="margin-top: 70px;"></div>
            <div style="font-size: 10px; margin-top: 4px; color: #666;">Visto do Almoxarifado / Responsável</div>
          </div>

          <div class="footer">
            Sistema de Gestão YS-Manager | Gerado em ${new Date().toLocaleString('pt-BR')}
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
        
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          ><LayoutGrid size={18} /></button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          ><List size={18} /></button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredEmployees.map(emp => {
              const items = possessionData[emp.id] || [];
              return (
                <div 
                  key={emp.id} 
                  onClick={() => setSelectedEmp(emp)}
                  className="group bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden"
                >
                  <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full blur-2xl opacity-10 transition-colors ${items.length > 0 ? 'bg-blue-600' : 'bg-gray-400'}`}></div>
                  
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <UserCircle2 size={28} />
                    </div>
                    {items.length > 0 && (
                      <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black px-2 py-1 rounded-lg">
                        {items.length} ITENS
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors uppercase tracking-tight">{emp.name}</h3>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{emp.role}</p>

                  <div className="mt-6 pt-4 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between text-[10px] font-black uppercase text-gray-400">
                    <span>Posse de Ativos</span>
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-gray-50 dark:bg-black/20 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">
                   <th className="px-6 py-4">Funcionário</th>
                   <th className="px-6 py-4">Cargo / Departamento</th>
                   <th className="px-6 py-4">Ativos em Posse</th>
                   <th className="px-6 py-4 text-right">Ações</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                 {filteredEmployees.map(emp => {
                   const items = possessionData[emp.id] || [];
                   return (
                     <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => setSelectedEmp(emp)}>
                       <td className="px-6 py-4">
                         <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold text-xs">
                             {emp.name.charAt(0)}
                           </div>
                           <span className="font-bold text-sm">{emp.name}</span>
                         </div>
                       </td>
                       <td className="px-6 py-4">
                         <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">{emp.role}</p>
                         <p className="text-[10px] text-gray-400 uppercase">{emp.department || '---'}</p>
                       </td>
                       <td className="px-6 py-4">
                         <div className="flex items-center gap-1.5">
                           <span className={`w-2 h-2 rounded-full ${items.length > 0 ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`}></span>
                           <span className="text-xs font-bold">{items.length} {items.length === 1 ? 'item' : 'itens'}</span>
                         </div>
                       </td>
                       <td className="px-6 py-4 text-right">
                         <button className="text-gray-300 group-hover:text-blue-600 transition-colors"><ChevronRight size={18} /></button>
                       </td>
                     </tr>
                   );
                 })}
               </tbody>
             </table>
          </div>
        )}
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
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">{selectedEmp.role} — {selectedEmp.department}</p>
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
                   <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[9px] font-black rounded uppercase">Ativo</span>
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
                  <button 
                    disabled={(possessionData[selectedEmp.id] || []).length === 0}
                    onClick={() => printPPEForm(selectedEmp, possessionData[selectedEmp.id] || [])}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-[10px] font-black uppercase hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-30 disabled:scale-100"
                  >
                    <Printer size={14} /> Gerar Ficha de EPI
                  </button>
                </div>

                {(possessionData[selectedEmp.id] || []).length === 0 ? (
                  <div className="bg-gray-50 dark:bg-gray-800/40 rounded-3xl p-12 text-center border-2 border-dashed border-gray-100 dark:border-gray-800">
                    <Package className="mx-auto mb-4 text-gray-200" size={48} />
                    <p className="text-sm font-bold text-gray-400 italic">Nenhum equipamento de longa duração <br/>vinculado a este colaborador.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {possessionData[selectedEmp.id].map(item => (
                      <div key={item.id} className="p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl flex items-center justify-between shadow-sm group">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center text-gray-400 group-hover:text-blue-500 transition-colors">
                              <ShieldCheck size={20} />
                           </div>
                           <div>
                             <p className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-tight">{item.name}</p>
                             <p className="text-[10pt] font-mono text-gray-400">{item.code}</p>
                           </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-blue-600">{item.possessedQty} <span className="text-[10px] uppercase font-bold text-gray-400">{item.unit}</span></p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Recent activity for this specific user */}
              <section>
                <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-500">
                       <Info size={18} />
                    </div>
                    <h4 className="text-sm font-black uppercase text-gray-900 dark:text-white">Últimas Movimentações</h4>
                </div>
                <div className="space-y-0.5 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
                   {logs
                    .filter(l => l.employeeId === selectedEmp.id)
                    .slice(0, 5)
                    .map((log, idx) => (
                      <div key={log.id} className={`flex items-center justify-between px-6 py-4 text-xs font-semibold ${idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-black/10'}`}>
                        <div className="flex items-center gap-3">
                          {log.type === 'entry' ? (
                            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg"><ArrowDownLeft size={16}/></div>
                          ) : (
                            <div className="p-1.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-lg"><ArrowUpRight size={16}/></div>
                          )}
                          <div>
                            <p className="text-gray-900 dark:text-white line-clamp-1">{log.itemName}</p>
                            <p className="text-[9px] text-gray-400 uppercase tracking-widest">{new Date(log.date).toLocaleDateString('pt-BR')} às {new Date(log.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                        <p className={`font-black ${log.type === 'entry' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {log.type === 'entry' ? '+' : '-'}{log.quantity}
                        </p>
                      </div>
                    ))
                   }
                   {logs.filter(l => l.employeeId === selectedEmp.id).length === 0 && (
                     <p className="p-6 text-center text-xs text-gray-400 font-medium bg-white dark:bg-gray-900">Nenhum registro de movimentação encontrado.</p>
                   )}
                </div>
              </section>
            </div>
            
            <div className="p-8 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-black/20">
              <p className="text-[9px] font-black text-gray-400 text-center uppercase tracking-widest">Acesso Restrito ao Gestor de Ativos • YS-Manager Cloud</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
