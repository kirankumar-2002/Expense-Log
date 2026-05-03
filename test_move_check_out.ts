import { fetchOutstanding } from './src/api';
async function run() {
  const o = await fetchOutstanding();
  console.log(o.find((t: any) => t.ID == 1779000000015));
}
run();
