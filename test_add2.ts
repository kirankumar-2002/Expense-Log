import { saveTransaction, fetchTransactions } from './src/api';
async function run() {
  const payload = {
    action: 'add',
    sheet: 'Transactions',
    id: '', // trigger auto-id
    Date: '2026-05-02',
    Amount: 100,
    State: 'Payable',
    Category: 'Expenses',
    'Sub-Category': 'Test',
    Status: 'Processed',
    Accounts: 'Bank of Baroda',
    Desc: 'TestDescExact',
    Notes: 'TestNotesExact'
  };
  await saveTransaction(payload);
  const tx = await fetchTransactions();
  console.log(tx.filter(d => d.Desc === 'TestDescExact' || d.Notes === 'TestNotesExact' || d.Desc === 'TestNotesExact'));
}
run();
