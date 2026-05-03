import { saveTransaction } from './src/api';
async function run() {
  const payload: any = {
    action: 'add',
    sheet: 'Transactions',
    id: '', 
    date: '2026-05-02',
    amount: 1,
    state: 'Payable',
    category: 'TestingFields',
    subCategory: 'Test1',
    status: 'Processed',
    account: 'VAL_ACCOUNT_LOWER',
    Account: 'VAL_ACCOUNT_UPPER',
    accounts: 'VAL_ACCOUNTS_LOWER',
    Accounts: 'VAL_ACCOUNTS_UPPER',
    bank: 'VAL_BANK',
    desc: 'VAL_DESC_LOWER',
    notes: 'VAL_NOTES_LOWER'
  };
  await saveTransaction(payload);
}
run();
