import { saveTransaction, fetchTransactions } from './src/api';

async function run() {
  const trans = await fetchTransactions();
  const testItems = trans.filter((t: any) => 
    (t.Category && String(t.Category).startsWith('Testing')) ||
    (t['Sub-Category'] && String(t['Sub-Category']).startsWith('Test'))
  );
  
  if (testItems.length > 0) {
    const item = testItems[0];
    console.log("Attempting to delete item:", item);
    const res = await saveTransaction({
      action: 'delete',
      sheet: 'Transactions',
      id: item.ID
    });
    console.log("Delete response:", res);
  } else {
    console.log("No test items found.");
  }
}
run();
