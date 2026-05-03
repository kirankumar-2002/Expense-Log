import { fetchOutstanding, fetchTransactions } from './src/api';
async function run() {
  const t = await fetchTransactions();
  console.log("In Transactions?", t.find((x: any) => x.ID == 1779000000015));
  const o = await fetchOutstanding();
  console.log("In Outstanding?", o.find((x: any) => x.ID == 1779000000015));
}
run();
