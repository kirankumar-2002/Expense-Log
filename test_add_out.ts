import { saveTransaction } from './src/api';
async function run() {
  const payload: any = {
    action: 'add',
    sheet: 'Outstanding',
    id: '', 
    date: '2026-05-02',
    amount: 100,
    state: 'Payable',
    category: 'Expenses',
    subCategory: 'Shopping',
    status: 'Pending',
    account: 'MyBank_Outstanding',
    desc: 'MyDesc',
    notes: 'MyNotes'
  };
  await saveTransaction(payload);
}
run();
