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
  
  const testKeys = ['Account', 'account', 'Accounts', 'accounts', 'account_name', 'accountName', 'bank', 'Bank', 'payment', 'method', 'source', 'wallet', 'card', 'Accounts ', 'Account ', 'account ', 'accounts '];
  
  for(let i=0; i<testKeys.length; i++) {
    payload[testKeys[i]] = testKeys[i];
  }
  
  await saveTransaction(payload);
  const tx = await fetchTransactions();
  console.log(tx[tx.length - 1]);
}
run();
