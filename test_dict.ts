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
    status: 'Processed'
  };
  
  const testKeys = ['account', 'Account', 'accounts', 'Accounts', 'acc', 'Acc', 'bank', 'Bank', 'desc', 'Desc', 'description', 'Description', 'notes', 'Notes', 'note', 'Note', 'comments'];
  
  for(let i=0; i<testKeys.length; i++) {
    payload[testKeys[i]] = `VAL_${testKeys[i]}`;
  }
  
  await saveTransaction(payload);
  const tx = await fetchTransactions();
  console.log(tx[tx.length - 1]);
}
run();
