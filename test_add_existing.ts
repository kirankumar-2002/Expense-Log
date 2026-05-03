import { saveTransaction, fetchTransactions } from './src/api';
async function run() {
  const payload = {
      action: 'add',
      sheet: 'Transactions',
      id: '1778000000055', // An EXISTING ID!
      date: '2026-05-02',
      amount: 100,
      state: 'Payable',
      category: 'Expenses',
      subCategory: 'Shopping',
      status: 'Processed',
      desc: 'AAA',
      notes: 'BBB'
  };
  await saveTransaction(payload);
  const tx = await fetchTransactions();
  console.log(tx.filter((t: any) => t.ID == 1778000000055));
}
run();
