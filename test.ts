import { fetchOutstanding, fetchTransactions } from './src/api';
fetchOutstanding().then(data => {
  const o = data.find(d => d.ID == '1666342000002') || data[0];
  console.log("OUT", JSON.stringify(o, null, 2));
}).catch(e => console.error(e));
