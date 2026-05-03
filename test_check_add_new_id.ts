import { fetchTransactions } from './src/api';
fetchTransactions().then(data => {
  console.log(data.find((t:any) => t.ID == 1777465030754));
});
