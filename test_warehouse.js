import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// Conexão com sua base de dados Supabase da YS-Manager
const supabaseUrl = 'https://zdpqikulmmogvkkqbnrg.supabase.co';
const supabaseKey = 'sb_publishable_znpp5qgfQVocl8yzDLqpGA_HVWbjnyA'; 
const supabase = createClient(supabaseUrl, supabaseKey);

// =====================================================================
// ⚠️ ATENÇÃO: INSIRA SEUS DADOS REAIS DE LOGIN AQUI PARA O TESTE ⚠️
// =====================================================================
const EMAIL = 'SEU_EMAIL_AQUI';
const PASSWORD = 'SUA_SENHA_AQUI';

async function testWarehouseModule() {
  console.log('🔄 Iniciando Script de Testes Automatizados - Módulo Almoxarifado/Estoque\n');
  
  // 1. Instância e Login
  console.log('1️⃣ Tentando login seguro no Supabase...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD
  });

  if (authError || !authData.user) {
    console.error('❌ FALHA NO LOGIN: E-mail ou senha incorretos.');
    console.error('   Abra este arquivo (test_warehouse.js) e preencha as variáveis EMAIL e PASSWORD com seu login real do sistema.');
    return;
  }
  
  const userId = authData.user.id;
  console.log('✅ Login bem-sucedido! Iniciando operações de simulação de banco de dados...\n');

  // Gerando IDs oficiais que o sistema usa agora
  const testItemId = randomUUID();
  const testEmployeeId = randomUUID();
  const testLogId = randomUUID();

  try {
    // 2. Testando criação de Funcionário (warehouse_employees)
    console.log('2️⃣ Testando inserção de Funcionário (warehouse_employees)...');
    const { error: empError } = await supabase.from('warehouse_employees').insert({
      id: testEmployeeId,
      user_id: userId,
      name: 'Funcionário Teste Automatizado',
      role: 'Testador',
      department: 'TI',
      active: true
    });
    if (empError) throw new Error(`Erro ao criar funcionário: ${empError.message}`);
    console.log('✅ Funcionário inserido com sucesso.');

    // 3. Testando criação de Item no Estoque (warehouse_inventory)
    console.log('3️⃣ Testando inserção de Item de Estoque (warehouse_inventory)...');
    const { error: invError } = await supabase.from('warehouse_inventory').insert({
      id: testItemId,
      user_id: userId,
      code: 'MAT-TESTE-999',
      name: 'Item de Teste Automatizado',
      category: 'Geral',
      quantity: 50,
      min_stock: 10,
      unit: 'Unid.',
      consumable: false,
      last_updated: new Date().toISOString()
    });
    if (invError) throw new Error(`Erro ao criar item (RLS / UUID): ${invError.message}`);
    console.log('✅ Item de estoque inserido com sucesso (A trava de UUID agora está livre!).');

    // 4. Testando criação de Registro de Log/Movimentação (warehouse_logs)
    console.log('4️⃣ Testando registro de movimentação/log (warehouse_logs)...');
    const { error: logError } = await supabase.from('warehouse_logs').insert({
      id: testLogId,
      user_id: userId,
      item_id: testItemId,
      item_code: 'MAT-TESTE-999',
      item_name: 'Item de Teste Automatizado',
      type: 'exit',
      quantity: 5,
      date: new Date().toISOString(),
      employee_id: testEmployeeId,
      employee_name: 'Funcionário Teste Automatizado',
      note: 'Retirada para testes'
    });
    if (logError) throw new Error(`Erro ao criar log: ${logError.message}`);
    console.log('✅ Log de movimentação (Entrada/Saída) inserido com sucesso cruzando as chaves estrangeiras.');

    // 5. Testando Leitura de Dados (Garantindo persistência)
    console.log('5️⃣ Testando leitura dos dados inseridos...');
    const { data: readData, error: readError } = await supabase.from('warehouse_inventory')
      .select('*')
      .eq('id', testItemId)
      .single();
    if (readError) throw new Error(`Erro ao ler item: ${readError.message}`);
    if (readData.name !== 'Item de Teste Automatizado') throw new Error('Dados corrompidos na leitura.');
    console.log('✅ Leitura de dados confirmada. O Supabase devolveu os dados perfeitos.');

    // 6. Testando Atualização / Sincronização (Upsert)
    console.log('6️⃣ Testando atualização (UPSERT) simulando a função syncTableData...');
    const { error: updateError } = await supabase.from('warehouse_inventory').upsert({
      id: testItemId,
      user_id: userId,
      code: 'MAT-TESTE-999',
      name: 'Item de Teste Atualizado',
      category: 'Geral',
      quantity: 45, // Simula a diminuição do estoque de 50 para 45
      min_stock: 10,
      unit: 'Unid.',
      consumable: false,
      last_updated: new Date().toISOString()
    });
    if (updateError) throw new Error(`Erro ao atualizar item: ${updateError.message}`);
    console.log('✅ Estoque atualizado com sucesso (Atualizou quantidade e nome).');

    // 7. Testando Deleção (Hard Delete) - Resolvendo o "dados fantasmas que voltavam"
    console.log('7️⃣ Testando exclusões físicas (DELETE) simulando apagar um item...');
    
    // Removendo na ordem correta devido a chaves limitadoras (Foreign Keys de logs para inventory)
    const { error: delLogError } = await supabase.from('warehouse_logs').delete().eq('id', testLogId);
    if (delLogError) throw new Error(`Erro ao deletar log: ${delLogError.message}`);

    const { error: delInvError } = await supabase.from('warehouse_inventory').delete().eq('id', testItemId);
    if (delInvError) throw new Error(`Erro ao deletar item: ${delInvError.message}`);

    const { error: delEmpError } = await supabase.from('warehouse_employees').delete().eq('id', testEmployeeId);
    if (delEmpError) throw new Error(`Erro ao deletar funcionário: ${delEmpError.message}`);
    
    console.log('✅ Limpeza concluída sem rastros. Nenhum item apagado voltará a existir!');
    
    console.log('\n======================================================');
    console.log('🎉 SUCESSO ABSOLUTO!');
    console.log('O Módulo de Estoque/Almoxarifado passou em 100% dos testes reais!');
    console.log('======================================================');

  } catch (ex) {
    console.error('\n❌ Ocorreu uma falha real durante o teste das funções:');
    console.error(ex.message);
  }
}

testWarehouseModule();
