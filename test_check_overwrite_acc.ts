import { fetchTransactions } from './src/api';
fetchTransactions().then(data => {
  console.log(data.find(d => d.ID == 1778000000055));
});
