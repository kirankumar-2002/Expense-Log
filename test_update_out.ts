import { saveTransaction, fetchOutstanding } from './src/api';
async function run() {
  const o = await fetchOutstanding();
  const idToMove = 1779000000015; // The one we used earlier
  
  const payload = {
      action: 'update',
      sheet: 'Outstanding',
      id: idToMove, 
      accounts: 'A NEW ACCOUNT'
  };
  await saveTransaction(payload);
  
  const o2 = await fetchOutstanding();
  console.log(o2.find((t: any) => t.ID == idToMove));
}
run();
