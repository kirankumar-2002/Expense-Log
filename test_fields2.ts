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
    subCategory: 'Test2',
    status: 'Processed',
    desc: 'VAL_DESC_LOWER'
  };
  await saveTransaction(payload);
}
run();
