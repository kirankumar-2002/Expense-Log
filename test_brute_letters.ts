import { saveTransaction } from './src/api';
async function run() {
  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
  for (const L of letters) {
    const payload: any = { action: 'add', sheet: 'Transactions', id: '', date: 'Z', amount: 1, state: 'Y', category: 'TestingAccounts', subCategory: L, status: 'P' };
    payload[L] = `V_${L}`;
    try { await saveTransaction(payload); } catch(e){}
  }
}
run();
