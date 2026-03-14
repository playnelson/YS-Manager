
export const SEED_DATA = {
  kanban: {
    columns: [
      { id: crypto.randomUUID(), title: '📋 Backlog', color: 'gray', cards: [
        { id: crypto.randomUUID(), title: 'Revisão de estoque mensal', description: 'Verificar divergências no setor A', priority: 'medium', labels: ['Estoque'], createdAt: new Date().toISOString() },
        { id: crypto.randomUUID(), title: 'Atualizar planilhas de frete', description: 'Novas taxas da transportadora X', priority: 'low', labels: ['Logística'], createdAt: new Date().toISOString() }
      ]},
      { id: crypto.randomUUID(), title: '🚀 A Fazer', color: 'blue', cards: [
        { id: crypto.randomUUID(), title: 'Contratação novo almoxarife', description: 'Entrevista com candidatos agendada', priority: 'high', labels: ['RH'], createdAt: new Date().toISOString() }
      ]},
      { id: crypto.randomUUID(), title: '⚡ Em Andamento', color: 'orange', cards: [
        { id: crypto.randomUUID(), title: 'Implementação YS-Manager', description: 'Fase final de migração de dados', priority: 'high', labels: ['TI'], createdAt: new Date().toISOString() }
      ]},
      { id: crypto.randomUUID(), title: '✅ Concluído', color: 'green', cards: [
        { id: crypto.randomUUID(), title: 'Treinamento de segurança', description: 'Todos os colaboradores certificados', priority: 'medium', labels: ['Segurança'], createdAt: new Date().toISOString() }
      ]}
    ]
  },
  warehouse: {
    inventory: [
      { id: crypto.randomUUID(), code: 'MAT-001', name: 'Bota de Segurança Nº 42', category: 'EPI', consumable: false, quantity: 15, minStock: 5, unit: 'Par', lastUpdated: new Date().toISOString() },
      { id: crypto.randomUUID(), code: 'MAT-002', name: 'Capacete de Proteção Azul', category: 'EPI', consumable: false, quantity: 10, minStock: 3, unit: 'Unid.', lastUpdated: new Date().toISOString() },
      { id: crypto.randomUUID(), code: 'MAT-007', name: 'Luva de Vaqueta', category: 'EPI', consumable: true, quantity: 50, minStock: 10, unit: 'Par', lastUpdated: new Date().toISOString() },
      { id: crypto.randomUUID(), code: 'MAT-017', name: 'Mala de Ferramentas Pro', category: 'Ferramenta', consumable: false, quantity: 5, minStock: 2, unit: 'Unid.', lastUpdated: new Date().toISOString() }
    ],
    employees: [
      { id: crypto.randomUUID(), name: 'João Silva', role: 'Almoxarife', department: 'Logística', active: true },
      { id: crypto.randomUUID(), name: 'Maria Santos', role: 'Técnica de Segurança', department: 'SESMT', active: true }
    ]
  },
  logistics: {
    freightTables: [
      { id: crypto.randomUUID(), name: 'Transportadora Padrão', fuelPrice: 5.89, avgConsumption: 3.5, driverPerDieum: 150, insuranceRate: 0.5, updatedAt: new Date().toISOString() },
      { id: crypto.randomUUID(), name: 'Frota Própria - Urbano', fuelPrice: 5.89, avgConsumption: 8, driverPerDieum: 80, insuranceRate: 0.2, updatedAt: new Date().toISOString() }
    ],
    checklists: [
      { 
        id: crypto.randomUUID(), 
        title: 'Checklist de Saída - Veículo', 
        items: [
          { id: crypto.randomUUID(), label: 'Nível de óleo', completed: false },
          { id: crypto.randomUUID(), label: 'Pressão pneus', completed: false },
          { id: crypto.randomUUID(), label: 'Luzes', completed: false },
          { id: crypto.randomUUID(), label: 'Documentação', completed: false }
        ],
        updatedAt: new Date().toISOString() 
      }
    ]
  },
  financial: [
    { id: crypto.randomUUID(), description: 'Venda de Serviços - Projeto Alfa', amount: 5000, type: 'income', category: 'Serviços', date: new Date().toISOString().split('T')[0] },
    { id: crypto.randomUUID(), description: 'Aluguel Escritório', amount: 1200, type: 'expense', category: 'Infraestrutura', date: new Date().toISOString().split('T')[0] }
  ],
  notes: [
    { id: crypto.randomUUID(), title: 'Ramais Importantes', content: 'TI: 101, RH: 102, Financeiro: 103', category: 'Geral', priority: 'normal', updatedAt: new Date().toISOString() }
  ],
  links: [
    { id: crypto.randomUUID(), title: 'Supabase Dashboard', url: 'https://supabase.com/dashboard', category: 'Ferramentas' },
    { id: crypto.randomUUID(), title: 'WhatsApp Web', url: 'https://web.whatsapp.com', category: 'Comunicação' }
  ],
  whatsapp: {
    templates: [
      { id: crypto.randomUUID(), title: 'Saudação Inicial', content: 'Olá! Sou da YS Management. Como posso ajudar?' },
      { id: crypto.randomUUID(), title: 'Aviso de Entrega', content: 'Seu pedido saiu para entrega e deve chegar em breve!' }
    ]
  }
};
