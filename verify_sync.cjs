const assert = require('assert');

let mockDatabase = [
    { id: '1', user_id: 'user1', name: 'Item 1' },
    { id: '2', user_id: 'user1', name: 'Item 2' }
];

let queriesExecuted = [];

const supabase = {
    from: (tableName) => ({
        select: (cols) => ({
            eq: (col, val) => {
                queriesExecuted.push(`SELECT ${cols} FROM ${tableName} WHERE ${col} = '${val}'`);
                return Promise.resolve({ data: mockDatabase.filter(r => r[col] === val) });
            }
        }),
        delete: () => ({
            in: (col, vals) => {
                queriesExecuted.push(`DELETE FROM ${tableName} WHERE ${col} IN (${vals.join(', ')})`);
                mockDatabase = mockDatabase.filter(r => !vals.includes(r[col]));
                return Promise.resolve({ data: null, error: null });
            },
            eq: (col, val) => {
                queriesExecuted.push(`DELETE FROM ${tableName} WHERE ${col} = '${val}'`);
                mockDatabase = mockDatabase.filter(r => r[col] !== val);
                return Promise.resolve({ data: null, error: null });
            }
        }),
        upsert: (data) => {
            queriesExecuted.push(`UPSERT INTO ${tableName} VALUES (${data.map(d => d.id).join(', ')})`);
            data.forEach(newItem => {
                const idx = mockDatabase.findIndex(r => r.id === newItem.id);
                if (idx >= 0) mockDatabase[idx] = newItem;
                else mockDatabase.push(newItem);
            });
            return Promise.resolve({ data: null, error: null });
        }
    })
};

const user = { id: 'user1' };
const initializedTables = { current: new Set(['test_table']) };

const safeSave = async (query, tableName) => {
    return await query;
};

const syncTableData = async (tableName, currentData, initKey = tableName) => {
  if (!initializedTables.current.has(initKey)) return;
  try {
    const currentIds = currentData.map(item => item.id).filter(Boolean);
    if (currentIds.length > 0) {
      const { data: existing } = await supabase.from(tableName).select('id').eq('user_id', user.id);
      if (existing) {
        const idsToDelete = existing.map(r => r.id).filter(id => !currentIds.includes(id));
        if (idsToDelete.length > 0) {
          await supabase.from(tableName).delete().in('id', idsToDelete);
        }
      }
      await safeSave(supabase.from(tableName).upsert(currentData), tableName);
    } else {
      await supabase.from(tableName).delete().eq('user_id', user.id);
    }
  } catch (e) {
    console.error(`Erro na sincronização de ${tableName}:`, e);
  }
};

async function runTests() {
    console.log("--- TEST 1: Add a new item (Item 3) Without Deleting ---");
    queriesExecuted = [];
    let frontendState = [
        { id: '1', user_id: 'user1', name: 'Item 1' },
        { id: '2', user_id: 'user1', name: 'Item 2' },
        { id: '3', user_id: 'user1', name: 'Item 3' }
    ];
    await syncTableData('test_table', frontendState);
    console.log("Queries:", queriesExecuted);
    console.log("DB Context:", mockDatabase.map(d => d.id).join(', '));
    assert.strictEqual(mockDatabase.length, 3);
    assert.ok(mockDatabase.find(d => d.id === '3'));
    
    console.log("\n--- TEST 2: Delete an item (Item 2) And Update Item 1 ---");
    queriesExecuted = [];
    frontendState = [
        { id: '1', user_id: 'user1', name: 'Item 1 Updated' },
        { id: '3', user_id: 'user1', name: 'Item 3' }
    ];
    await syncTableData('test_table', frontendState);
    console.log("Queries:", queriesExecuted);
    console.log("DB Context:", mockDatabase.map(d => d.id).join(', '));
    assert.strictEqual(mockDatabase.length, 2);
    assert.ok(!mockDatabase.find(d => d.id === '2'));
    assert.strictEqual(mockDatabase.find(d => d.id === '1').name, 'Item 1 Updated');

    console.log("\n--- TEST 3: Delete ALL items (Empty Array) ---");
    queriesExecuted = [];
    frontendState = [];
    await syncTableData('test_table', frontendState);
    console.log("Queries:", queriesExecuted);
    console.log("DB Context:", mockDatabase.map(d => d.id).join(', '));
    assert.strictEqual(mockDatabase.length, 0);

    console.log("\nALL TESTS PASSED SUCCESSFULLY! ✅");
}

runTests().catch(console.error);
