import { fetchTransactions } from './src/api';
fetchTransactions().then(data => {
  console.log(data[data.length-1]);
});
