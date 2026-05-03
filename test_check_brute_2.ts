import { fetchTransactions } from './src/api';
fetchTransactions().then(data => {
  const recent = data.filter(d => d.Category === 'TestingAccounts2');
  console.log(recent.map(r => `SubCat: ${r['Sub-Category']} => Accounts: ${r.Accounts}`).join('\n'));
});
