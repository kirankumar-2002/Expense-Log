import { saveTransaction } from './src/api';
async function run() {
  const tests = [
    'paymentMethod', 'payment_method', 'account_id', 'accountId', 
    'sourcePlatform', 'fundSource', 'accName', 'account_name', 
    'bankName', 'bank_name', 'BankName', 'AccountName'
  ];
  for (const k of tests) {
     const payload: any = { action: 'add', sheet: 'Transactions', id: '', date: '2026-05-02', amount: 1, state: 'Payable', category: 'Testing', subCategory: 'Test', status: 'Processed' };
     payload[k] = `V_${k}`;
     await saveTransaction(payload);
  }
}
run();
