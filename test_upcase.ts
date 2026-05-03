import { saveTransaction } from './src/api';
async function run() {
  const payload = {
      action: 'add',
      sheet: 'Transactions',
      id: '',
      Date: '2026-05-02',
      Amount: 100,
      State: 'Payable',
      Category: 'Expenses',
      'Sub-Category': 'TestUpcase',
      Status: 'Processed',
      Desc: 'UPPER_DESC',
      Notes: 'UPPER_NOTES'
  };
  await saveTransaction(payload);
}
run();
