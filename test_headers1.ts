import { saveTransaction, fetchTransactions } from './src/api';
async function run() {
  const payload: any = {
    action: 'add',
    sheet: 'Transactions',
    id: '', 
    Date: '2026-05-02',
    Amount: 100,
    State: 'Payable',
    Category: 'Expenses',
    'Sub-Category': 'TestLower',
    Status: 'Processed',
    Accounts: 'MyAccountVal',
    Desc: 'MyDescVal',
    Notes: 'MyNotesVal'
  };
  await saveTransaction(payload);
  const tx = await fetchTransactions();
  console.log(tx[tx.length - 1]);
}
run();
