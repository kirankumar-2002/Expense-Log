import { fetchTransactions } from './src/api';
fetchTransactions().then(data => {
  const recent = data.filter(d => d.Category === 'TestingFields');
  console.log(recent[recent.length - 1]);
});
