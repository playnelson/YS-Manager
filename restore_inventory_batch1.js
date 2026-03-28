import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdpqikulmmogvkkqbnrg.supabase.co';
const supabaseKey = 'sb_publishable_znpp5qgfQVocl8yzDLqpGA_HVWbjnyA'; 
const supabase = createClient(supabaseUrl, supabaseKey);

const USER_ID = 'd54db98b-039f-43d2-b7f4-d5b6887e5e7a';

const batch1 = [
  { id: 'acd45687-c83e-40aa-bd12-8fc4c01096df', code: 'MAT-001', name: 'Bota de Segurança Nº 42', category: 'EPI', consumable: false, quantity: 15, min_stock: 5, unit: 'Par' },
  { id: '684967ba-7a24-420d-96e2-6b9044708bc3', code: 'MAT-002', name: 'Perneira Bidim com Fivela', category: 'EPI', consumable: false, quantity: 10, min_stock: 3, unit: 'Unid.' },
  { id: '3b216295-aa6e-46b7-a750-7a5e1299c302', code: 'MAT-003', name: 'Capacete Azul', category: 'EPI', consumable: false, quantity: 8, min_stock: 2, unit: 'Unid.' },
  { id: '8940f35a-8bcb-4d2c-9cfd-5d7c2f864d9d', code: 'MAT-007', name: 'Luva de Vaqueta Cano Longo', category: 'EPI', consumable: true, quantity: 50, min_stock: 10, unit: 'Par' },
  { id: '8ffac5c9-cc30-4ac1-9f94-eea553c5d210', code: 'MAT-008', name: 'LUVA ANTI IMPACTO Cut R2 Volk', category: 'EPI', consumable: true, quantity: 30, min_stock: 5, unit: 'Par' },
  { id: '6c7723b8-a0c9-497e-906f-921d2b36c494', code: 'MAT-009', name: 'LUVA ANTI VIBRAÇÃO Vibraflex', category: 'EPI', consumable: true, quantity: 12, min_stock: 3, unit: 'Par' },
  { id: '86fac9cb-f494-4c70-ab59-c93c04441e53', code: 'MAT-012', name: 'Máscara PFF2 (Valvulada)', category: 'EPI', consumable: true, quantity: 100, min_stock: 20, unit: 'Unid.' },
  { id: '0bd4a2bd-49b4-49d0-a51e-a497d7bac8e4', code: 'MAT-013', name: 'Protetor Auricular Tipo Concha (Capacete)', category: 'EPI', consumable: false, quantity: 15, min_stock: 5, unit: 'Unid.' },
  { id: 'f491162b-5153-4447-8795-16537a565fbb', code: 'MAT-014', name: 'Protetor Auricular Tipo Plug', category: 'EPI', consumable: true, quantity: 200, min_stock: 50, unit: 'Unid.' },
  { id: 'be71c6f1-3e73-4116-8299-0ab46db4117a', code: 'MAT-016', name: 'Protetor Solar 1L', category: 'EPI', consumable: true, quantity: 12, min_stock: 3, unit: 'Unid.' },
  { id: 'eca004a0-4bf5-4876-ac2b-38545b54b78e', code: 'MAT-025', name: 'Trena 5m', category: 'Ferramenta', consumable: false, quantity: 10, min_stock: 2, unit: 'Unid.' },
  { id: '568e83da-4a68-42d4-b9a1-6364b61cf4b2', code: 'MAT-026', name: 'Trena 30m', category: 'Ferramenta', consumable: false, quantity: 5, min_stock: 1, unit: 'Unid.' },
  { id: '706d7dda-753c-4f2b-8d53-8375efb17102', code: 'MAT-028', name: 'Torquês', category: 'Ferramenta', consumable: false, quantity: 5, min_stock: 1, unit: 'Unid.' },
  { id: '92dc6401-f922-4436-ad2d-2a21bdffa232', code: 'MAT-030', name: 'Chave Regulagem 10"', category: 'Ferramenta', consumable: false, quantity: 3, min_stock: 1, unit: 'Unid.' },
  { id: 'a14919b8-6f68-47e3-b905-b470859efd1b', code: 'MAT-031', name: 'Arco de Serra', category: 'Ferramenta', consumable: false, quantity: 10, min_stock: 2, unit: 'Unid.' },
  { id: '3efb0026-bd9a-4388-868f-9fdc86fbc6e9', code: 'MAT-032', name: 'Colher de Pedreiro', category: 'Ferramenta', consumable: false, quantity: 15, min_stock: 3, unit: 'Unid.' },
  { id: '113aa371-4c9b-492d-840e-a976e1bf8c3e', code: 'MAT-036', name: 'Esquadro Metálico 12"', category: 'Ferramenta', consumable: false, quantity: 5, min_stock: 1, unit: 'Unid.' },
  { id: 'f855fc0f-dfbd-4d7c-b628-d5c1b9ef024c', code: 'MAT-047', name: 'Tábua 6m', category: 'Material', consumable: false, quantity: 50, min_stock: 10, unit: 'Unid.' },
  { id: '1d0b17c3-650a-4368-86e9-b4b2473cf584', code: 'MAT-048', name: 'Martelo Bola', category: 'Ferramenta', consumable: false, quantity: 8, min_stock: 2, unit: 'Unid.' },
  { id: '5a935e89-1f6f-4497-9f6e-af002db28bcb', code: 'MAT-053', name: 'Marreta 2kg', category: 'Ferramenta', consumable: false, quantity: 5, min_stock: 1, unit: 'Unid.' },
  { id: '9ad58f76-4177-47e3-a2a9-8226f191fce8', code: 'MAT-056', name: 'Marcador Industrial', category: 'Ferramenta', consumable: true, quantity: 24, min_stock: 6, unit: 'Unid.' },
  { id: '6fdb1d3d-8de6-4246-88d4-d201d9359efa', code: 'MAT-064', name: 'Cerquite', category: 'Segurança', consumable: true, quantity: 20, min_stock: 5, unit: 'Unid.' },
  { id: 'b88629bc-0a13-407b-a33d-ad070cb5ae34', code: 'MAT-065', name: 'Lona Antichama', category: 'Segurança', consumable: false, quantity: 5, min_stock: 1, unit: 'Unid.' },
  { id: 'd11f3150-b5fd-4416-baeb-2d53539dbbf3', code: 'MAT-082', name: 'Esmerilhadeira 4" (PA1979)', category: 'Equipamento', consumable: false, quantity: 3, min_stock: 1, unit: 'Unid.' },
  { id: '8d644b29-1e71-434f-97ae-b148690b3b17', code: 'MAT-086', name: 'Lixadeira 7" (PA1983)', category: 'Equipamento', consumable: false, quantity: 2, min_stock: 1, unit: 'Unid.' },
  { id: '0bf8d902-ca9e-4c3b-88a7-568b6e7d0b32', code: 'MAT-109', name: 'Extintor ABC 6kg', category: 'Segurança', consumable: false, quantity: 10, min_stock: 2, unit: 'Unid.' }
];

async function restore() {
  console.log(`🚀 Iniciando restauração Lote 1 para ${USER_ID}...`);
  
  const toUpsert = batch1.map(item => ({
    ...item,
    user_id: USER_ID,
    last_updated: new Date().toISOString()
  }));

  const { data, error } = await supabase.from('warehouse_inventory').upsert(toUpsert);

  if (error) {
    console.error('❌ Erro na restauração:', error.message);
  } else {
    console.log(`✅ Lote 1 restaurado com sucesso (${batch1.length} itens)!`);
  }
}

restore();
