import { saveTransaction, fetchTransactions } from './src/api';
async function run() {
  const payload: any = {
    action: 'add',
    sheet: 'Transactions',
    id: '', 
    date: '2026-05-02',
    amount: 100,
    state: 'Payable',
    category: 'Expenses',
    subCategory: 'TestLower',
    status: 'Processed',
    account: 'ACC',
    desc: 'DESC',
    notes: 'NOTES'
  };
  await saveTransaction(payload);
  const tx = await fetchTransactions();
  console.log(tx[tx.length - 1]);
}
run();
