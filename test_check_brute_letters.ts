import { fetchTransactions } from './src/api';
fetchTransactions().then(data => {
  const recent = data.filter(d => d.Category === 'TestingAccounts');
  console.log(recent.map(r => `Letter: ${r['Sub-Category']} => Accounts: ${r.Accounts}`).join('\n'));
});
