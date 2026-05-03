import { fetchTransactions } from './src/api';

async function run() {
  const trans = await fetchTransactions();
  const testTransExp = trans.filter((t: any) => {
    const c = String(t.Category || '');
    const sc = String(t['Sub-Category'] || '');
    return c === 'Expenses' && sc.startsWith('Test');
  });
  
  console.log(testTransExp.map((t:any) => t['Sub-Category'] + ' - ' + t.Desc));
}
run();
