import { saveTransaction, fetchOutstanding, fetchTransactions } from './src/api';
async function run() {
  const o = await fetchOutstanding();
  const idToMove = o[0].ID;
  console.log("Moving ID:", idToMove);
  console.log("Original Outstanding:", o[0]);
  
  const payload = {
      action: 'add',
      sheet: 'Transactions',
      id: idToMove, 
      date: '2026-05-02',
      amount: 100,
      state: 'Payable',
      category: 'Expenses',
      subCategory: 'Shopping',
      status: 'Processed',
      desc: 'MyDesc',
      notes: 'MyNotes'
  };
  await saveTransaction(payload);
  
  const tx = await fetchTransactions();
  console.log("Result in TX:", tx.find((t: any) => t.ID == idToMove));
}
run();
