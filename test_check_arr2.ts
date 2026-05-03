import { fetchTransactions } from './src/api';
fetchTransactions().then(data => {
  console.log(data.slice(-2));
});
