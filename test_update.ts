import { saveTransaction, fetchTransactions } from './src/api';
async function run() {
  const payload: any = {
    action: 'update',
    id: '1777462587467',
    sheet: 'Transactions',
    date: '2026-05-02',
    amount: 100,
    state: 'Payable',
    category: 'Expenses',
    subCategory: 'TestLower',
    status: 'Processed',
    account: 'UPD_ACC',
    desc: 'UPD_DESC',
    notes: 'UPD_NOTES'
  };
  await saveTransaction(payload);
  const tx = await fetchTransactions();
  console.log(tx.find((t: any) => t.ID == 1777462587467));
}
run();
