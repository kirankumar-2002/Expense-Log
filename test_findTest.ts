import { fetchTransactions, fetchOutstanding } from './src/api';

async function run() {
  const trans = await fetchTransactions();
  const out = await fetchOutstanding();
  
  const testTrans = trans.filter((t: any) => {
    const c = String(t.Category || '');
    const sc = String(t['Sub-Category'] || '');
    return c.startsWith('Testing') || sc.startsWith('Test') || c === 'ExpenseTest' || c === 'TestCategory';
  });
  
  const testOut = out.filter((t: any) => {
    const c = String(t.Category || '');
    const sc = String(t['Sub-Category'] || '');
    return c.startsWith('Testing') || sc.startsWith('Test') || c === 'ExpenseTest' || c === 'TestCategory';
  });

  console.log("Trans test items:", testTrans.length);
  const transCats = new Set(testTrans.map((t:any) => t.Category));
  console.log("Trans Categories:", Array.from(transCats));

  console.log("Out test items:", testOut.length);
  const outCats = new Set(testOut.map((t:any) => t.Category));
  console.log("Out Categories:", Array.from(outCats));
}
run();
