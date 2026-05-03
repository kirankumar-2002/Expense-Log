import { saveTransaction, fetchOutstanding, fetchTransactions } from './src/api';
async function run() {
  const o = await fetchOutstanding();
  const target = o.find((t:any) => t.Status === 'Pending' && t.Accounts);
  if (!target) return console.log("No pending target");
  
  console.log("Before update on Outstanding:", target);
  await saveTransaction({
    action: 'update',
    sheet: 'Outstanding',
    id: target.ID,
    status: 'Processed'
  });
  
  // Now let's see if it disappeared from Outstanding and appeared in Transactions!
  const o2 = await fetchOutstanding();
  console.log("Still in Outstanding?", !!o2.find((t:any) => t.ID === target.ID));
  
  const t2 = await fetchTransactions();
  console.log("Found in Transactions?", !!t2.find((t:any) => t.ID === target.ID));
}
run();
