import { fetchTransactions } from './src/api';
fetchTransactions().then(data => {
  const recent = data.filter(d => d.Category === 'Testing');
  console.log(recent.map(r => r.Accounts).join(', '));
});
