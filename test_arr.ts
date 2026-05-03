import { saveTransaction, fetchTransactions } from './src/api';
async function run() {
  const payload: any = {
    action: 'add',
    sheet: 'Transactions',
    row: [
      '', 
      '2026-05-02',
      100,
      'Payable',
      'Expenses',
      'TestLower',
      'Processed',
      'ACC_VAL',
      'DESC_VAL',
      'NOTES_VAL'
    ]
  };
  await saveTransaction(payload);
  const tx = await fetchTransactions();
  console.log(tx[tx.length - 1]);
}
run();
