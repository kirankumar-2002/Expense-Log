import { saveTransaction, fetchTransactions } from './src/api';
async function run() {
  const item: any = {
    ID: '', Date: '2026-05-02', Amount: 100, State: 'Payable', Category: 'Expenses', 'Sub-Category': 'TestOrig', Desc: 'AAA', Notes: 'BBB'
  };
  const account = 'MyBank123';
  const newStatus = 'Processed';
  const payload = {
      action: 'add',
      sheet: 'Transactions',
      id: String(item.ID || ''),
      ID: String(item.ID || ''),
      date: item.Date,
      Date: item.Date,
      amount: item.Amount,
      Amount: item.Amount,
      state: item.State,
      State: item.State,
      category: item.Category,
      Category: item.Category,
      subCategory: item['Sub-Category'],
      'Sub-Category': item['Sub-Category'],
      status: newStatus,
      Status: newStatus,
      desc: item.Desc,
      Desc: item.Desc,
      notes: item.Notes,
      Notes: item.Notes,
      // Pass the account data
      account: account,
      accounts: account,
      Account: account,
      Accounts: account,
      'Accounts ': account,
      'Account ': account,
      'accounts ': account,
      'account ': account
  };
  await saveTransaction(payload);
  const tx = await fetchTransactions();
  console.log(tx[tx.length - 1]);
}
run();
