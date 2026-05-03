import { saveTransaction } from './src/api';

async function run() {
  console.log("Deleting Trans: 1777464168283");
  await saveTransaction({ action: 'delete', sheet: 'Transactions', id: 1777464168283 });
  console.log("Done");
}
run();
