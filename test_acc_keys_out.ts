import { saveTransaction } from './src/api';
async function run() {
  const account_keys = ['account', 'Accounts', 'accounts', 'Bank', 'Account'];
  for (const k of account_keys) {
    const payload: any = {
      action: 'add',
      sheet: 'Outstanding', 
      id: '', date: '2026-05-02', amount: 100, state: 'Payable', category: 'Testing', subCategory: 'Test', status: 'Pending'
    };
    payload[k] = `V_${k}`;
    await saveTransaction(payload);
  }
}
run();
