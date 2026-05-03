import { saveTransaction, fetchTransactions } from './src/api';
async function run() {
  const payload: any = {
    action: 'update',
    sheet: 'Transactions',
    id: '1778000000055', 
    desc: 'UPDATED_DESC'
  };
  
  await saveTransaction(payload);
  const tx = await fetchTransactions();
  console.log(tx.find((t: any) => t.ID == 1778000000055));
}
run();
