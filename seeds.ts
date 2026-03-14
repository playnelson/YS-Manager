import { generateUUID } from './uuid';

export const SEED_DATA = {
  kanban: {
    columns: [
      { id: generateUUID(), title: '📋 Backlog', color: 'gray', cards: [
        { id: generateUUID(), title: 'Revisão de estoque mensal', description: 'Verificar divergências no setor A', priority: 'medium', labels: ['Estoque'], createdAt: new Date().toISOString() },
        { id: generateUUID(), title: 'Atualizar planilhas de frete', description: 'Novas taxas da transportadora X', priority: 'low', labels: ['Logística'], createdAt: new Date().toISOString() }
      ]},
      { id: generateUUID(), title: '🚀 A Fazer', color: 'blue', cards: [
        { id: generateUUID(), title: 'Contratação novo almoxarife', description: 'Entrevista com candidatos agendada', priority: 'high', labels: ['RH'], createdAt: new Date().toISOString() }
      ]},
      { id: generateUUID(), title: '⚡ Em Andamento', color: 'orange', cards: [
        { id: generateUUID(), title: 'Implementação YS-Manager', description: 'Fase final de migração de dados', priority: 'high', labels: ['TI'], createdAt: new Date().toISOString() }
      ]},
      { id: generateUUID(), title: '✅ Concluído', color: 'green', cards: [
        { id: generateUUID(), title: 'Treinamento de segurança', description: 'Todos os colaboradores certificados', priority: 'medium', labels: ['Segurança'], createdAt: new Date().toISOString() }
      ]}
    ]
  },
  warehouse: {
    inventory: [
      { id: generateUUID(), code: 'MAT-001', name: 'Bota de Segurança Nº 42', category: 'EPI', consumable: false, quantity: 15, minStock: 5, unit: 'Par', lastUpdated: new Date().toISOString() },
      { id: generateUUID(), code: 'MAT-002', name: 'Capacete de Proteção Azul', category: 'EPI', consumable: false, quantity: 10, minStock: 3, unit: 'Unid.', lastUpdated: new Date().toISOString() },
      { id: generateUUID(), code: 'MAT-007', name: 'Luva de Vaqueta', category: 'EPI', consumable: true, quantity: 50, minStock: 10, unit: 'Par', lastUpdated: new Date().toISOString() },
      { id: generateUUID(), code: 'MAT-017', name: 'Mala de Ferramentas Pro', category: 'Ferramenta', consumable: false, quantity: 5, minStock: 2, unit: 'Unid.', lastUpdated: new Date().toISOString() }
    ],
    employees: [
      { id: generateUUID(), name: 'João Silva', role: 'Almoxarife', department: 'Logística', active: true },
      { id: generateUUID(), name: 'Maria Santos', role: 'Técnica de Segurança', department: 'SESMT', active: true }
    ]
  },
  logistics: {
    freightTables: [
      { id: generateUUID(), name: 'Transportadora Padrão', fuelPrice: 5.89, avgConsumption: 3.5, driverPerDieum: 150, insuranceRate: 0.5, updatedAt: new Date().toISOString() },
      { id: generateUUID(), name: 'Frota Própria - Urbano', fuelPrice: 5.89, avgConsumption: 8, driverPerDieum: 80, insuranceRate: 0.2, updatedAt: new Date().toISOString() }
    ],
    checklists: [
      { 
        id: generateUUID(), 
        title: 'Checklist de Saída - Veículo', 
        items: [
          { id: generateUUID(), label: 'Nível de óleo', completed: false },
          { id: generateUUID(), label: 'Pressão pneus', completed: false },
          { id: generateUUID(), label: 'Luzes', completed: false },
          { id: generateUUID(), label: 'Documentação', completed: false }
        ],
        updatedAt: new Date().toISOString() 
      }
    ]
  },
  financial: [
    { id: generateUUID(), description: 'Venda de Serviços - Projeto Alfa', amount: 5000, type: 'income', category: 'Serviços', date: new Date().toISOString().split('T')[0] },
    { id: generateUUID(), description: 'Aluguel Escritório', amount: 1200, type: 'expense', category: 'Infraestrutura', date: new Date().toISOString().split('T')[0] }
  ],
  notes: [
    { id: generateUUID(), title: 'Ramais Importantes', content: 'TI: 101, RH: 102, Financeiro: 103', category: 'Geral', priority: 'normal', updatedAt: new Date().toISOString() }
  ],
  links: [
    { id: generateUUID(), title: 'Supabase Dashboard', url: 'https://supabase.com/dashboard', category: 'Ferramentas' },
    { id: generateUUID(), title: 'WhatsApp Web', url: 'https://web.whatsapp.com', category: 'Comunicação' }
  ],
  whatsapp: {
    templates: [
      { id: generateUUID(), title: 'Saudação Inicial', content: 'Olá! Sou da YS Management. Como posso ajudar?' },
      { id: generateUUID(), title: 'Aviso de Entrega', content: 'Seu pedido saiu para entrega e deve chegar em breve!' }
    ]
  }
};
