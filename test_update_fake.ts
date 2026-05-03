import { saveTransaction } from './src/api';
async function run() {
  const payload: any = {
    action: 'update',
    sheet: 'Transactions',
    id: 9999999999999, // Random ID
    date: '2026-05-02',
    amount: 100,
    state: 'Payable',
    category: 'Expenses',
    status: 'Processed'
  };
  await saveTransaction(payload);
}
run();
