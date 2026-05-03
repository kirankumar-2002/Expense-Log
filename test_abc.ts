import { saveTransaction, fetchTransactions } from './src/api';
async function run() {
  const payload = {
    action: 'add',
    sheet: 'Transactions',
    id: '', 
    date: '2026-05-02',
    amount: 100,
    state: 'Payable',
    category: 'Expenses',
    subCategory: 'TestLower',
    status: 'Processed',
    a: 'aA', b: 'bB', c: 'cC', d: 'dD', e: 'eE',
    f: 'fF', g: 'gG', h: 'hH', i: 'iI', j: 'jJ',
    k: 'kK', l: 'lL', m: 'mM', n: 'nN', o: 'oO',
    p: 'pP', q: 'qQ', r: 'rR', s: 'sS', t: 'tT',
    u: 'uU', v: 'vV', w: 'wW', x: 'xX', y: 'yY', z: 'zZ'
  };
  await saveTransaction(payload);
  const tx = await fetchTransactions();
  console.log(tx[tx.length - 1]);
}
run();
