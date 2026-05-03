import { saveTransaction, fetchTransactions } from './src/api';
async function run() {
  const payload: any = {
    action: 'update',
    sheet: 'Transactions',
    id: '1778000000055', 
    date: '2026-04-27T18:30:00.000Z',
    amount: 100,
    state: 'Payable',
    category: 'Expenses',
    subCategory: 'Shopping',
    status: 'Processed'
    // I am deliberately NOT passing account, desc, notes
  };
  
  await saveTransaction(payload);
  const tx = await fetchTransactions();
  console.log(tx.find((t: any) => t.ID == 1778000000055));
}
run();
