import { fetchTransactions, saveTransaction } from './src/api';

async function run() {
  const trans = await fetchTransactions();
  const row = trans.find((t: any) => t.ID == 1778000000055);
  console.log(row);
  if (row && row.Desc === 'UPDATED_DESC') {
    console.log("Restoring Desc and Notes to empty...");
    await saveTransaction({
      action: 'update',
      sheet: 'Transactions',
      id: 1778000000055,
      desc: '',
      notes: ''
    });
  }
}
run();
