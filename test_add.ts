import { saveTransaction } from './src/api';
async function run() {
  const payload = {
    action: 'add',
    sheet: 'Transactions',
    id: '',
    ID: '',
    date: '2026-05-01',
    Date: '2026-05-01',
    amount: 100,
    Amount: 100,
    state: 'Payable',
    State: 'Payable',
    category: 'Expenses',
    Category: 'Expenses',
    subCategory: 'Test',
    'Sub-Category': 'Test',
    status: 'Processed',
    Status: 'Processed',
    desc: 'TestDesc',
    Desc: 'TestDesc',
    notes: 'TestNotes',
    Notes: 'TestNotes',
    account: 'Bank of Baroda',
    accounts: 'Bank of Baroda',
    Account: 'Bank of Baroda',
    Accounts: 'Bank of Baroda'
  };
  console.log(await saveTransaction(payload));
}
run();
