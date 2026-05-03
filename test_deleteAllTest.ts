import { fetchTransactions, fetchOutstanding, saveTransaction } from './src/api';

async function run() {
  const trans = await fetchTransactions();
  const out = await fetchOutstanding();
  
  const isTest = (t: any) => {
    const c = String(t.Category || '');
    const sc = String(t['Sub-Category'] || '');
    const d = String(t.Date || '');
    const a = String(t.Amount || '');
    
    return c.startsWith('Testing') || 
           sc.startsWith('Test') || 
           c === 'ExpenseTest' || 
           c === 'TestCategory' ||
           d === '{an=object}' || 
           a === 'Not a number';
  };

  const testTrans = trans.filter(isTest);
  const testOut = out.filter(isTest);

  console.log("Deleting from transactions:", testTrans.length);
  for (const t of testTrans) {
    if (t.ID) {
      console.log("Deleting Trans:", t.ID, t.Category, t['Sub-Category']);
      await saveTransaction({ action: 'delete', sheet: 'Transactions', id: t.ID });
    }
  }

  console.log("Deleting from outstanding:", testOut.length);
  for (const t of testOut) {
    if (t.ID) {
      console.log("Deleting Out:", t.ID, t.Category, t['Sub-Category']);
      await saveTransaction({ action: 'delete', sheet: 'Outstanding', id: t.ID });
    }
  }
  console.log("Done");
}
run();
