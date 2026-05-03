import { fetchTransactions, fetchOutstanding } from './src/api';

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

  console.log("Remaining in transactions:", testTrans.length);
  console.log("Remaining in outstanding:", testOut.length);
}
run();
