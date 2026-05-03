import { saveTransaction, fetchTransactions } from './src/api';
async function run() {
  const payload = {
    action: 'add',
    sheet: 'Transactions',
    id: '', 
    date: '2026-05-02',
    amount: 100,
    state: 'Payable',
    category: 'Expenses',
    subCategory: 'TestLower',
    status: 'Processed',
    account: 'acc',
    desc: 'dsc',
    notes: 'nts'
  };
  await saveTransaction(payload);
  const tx = await fetchTransactions();
  console.log(tx[tx.length - 1]);
}
run();
