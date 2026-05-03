import { saveTransaction } from './src/api';
async function run() {
  const tests = [
    'acc', 'Acc', 'ACCOUNTS', 'ACCOUNT', 'bankAccountId', 'payment_method',
    'origin', 'target', 'destination', 'beneficiary', 'payer', 'payee',
    'institution', 'Institution', 'Bank_Name', 'Bank', 'BANK', 'mode'
  ];
  for (const k of tests) {
    const payload: any = { action: 'add', sheet: 'Transactions', id: '', date: '2026-05-02', amount: 1, state: 'Y', category: 'TestingAccounts2', subCategory: k, status: 'P' };
    payload[k] = `V_${k}`;
    try { await saveTransaction(payload); } catch(e){}
  }
}
run();
