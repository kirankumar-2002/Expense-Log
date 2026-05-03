import { saveTransaction } from './src/api';
async function run() {
  const payload: any = {
    action: 'move',
    sheet: 'Transactions',
    id: 1779000000015,
  };
  const res = await saveTransaction(payload);
  console.log(res);
}
run();
