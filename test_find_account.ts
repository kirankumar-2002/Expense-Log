import { saveTransaction } from './src/api';
async function run() {
  const testValues = [
    'account', 'accounts', 'bank', 'bankName', 'payment', 'method', 
    'wallet', 'source', 'type', 'card', 'Accounts', 'Account'
  ];
  const results: any = {};
  
  for (const k of testValues) {
    const payload: any = {
      action: 'add',
      sheet: 'Transactions',
      id: '', date: '2026-05-02', amount: 1, state: 'Payable', category: 'Testing', subCategory: 'Test', status: 'Processed'
    };
    payload[k] = `VAL_${k}`;
    try {
      await saveTransaction(payload);
    } catch(e) {}
  }
}
run();
