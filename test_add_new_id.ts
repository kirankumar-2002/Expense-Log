import { saveTransaction } from './src/api';
async function run() {
  const newId = new Date().getTime() + 100000;
  const payload: any = {
    action: 'add',
    sheet: 'Transactions',
    id: newId, 
    date: '2026-05-02',
    amount: 100,
    state: 'Payable',
    category: 'Expenses',
    subCategory: 'Shopping',
    status: 'Processed'
  };
  await saveTransaction(payload);
  console.log("Success with ID:", newId);
}
run();
