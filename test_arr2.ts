import { saveTransaction } from './src/api';
async function run() {
  const payload: any = {
    action: 'add',
    sheet: 'Transactions',
    data: ['', '2026-05-02', 100, 'Payable', 'Expenses', 'TestLower', 'Processed', 'ACC_VAL', 'DESC_VAL', 'NOTES_VAL']
  };
  await saveTransaction(payload);
  
  const payload2: any = {
    action: 'add',
    sheet: 'Transactions',
    values: ['', '2026-05-02', 100, 'Payable', 'Expenses', 'TestLower', 'Processed', 'ACC_VAL', 'DESC_VAL', 'NOTES_VAL']
  };
  await saveTransaction(payload2);
}
run();
