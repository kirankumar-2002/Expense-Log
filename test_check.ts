import { fetchTransactions } from './src/api';
fetchTransactions().then(data => {
  console.log(data.filter(d => d.Amount === 100 && d.Category === 'Expenses'));
});
