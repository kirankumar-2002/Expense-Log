import { saveTransaction } from './src/api';
async function run() {
  const payload: any = {
    action: 'add',
    sheet: 'Transactions',
    id: '', 
    date: '2026-05-02',
    amount: 100,
    state: 'Payable',
    category: 'Expenses',
    subCategory: 'Shopping',
    status: 'Processed',
    account: 'Bank of Baroda',
    accounts: 'Bank of Baroda',
    Accounts: 'Bank of Baroda'
  };
  await saveTransaction(payload);
}
run();
