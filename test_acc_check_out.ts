import { fetchOutstanding } from './src/api';
fetchOutstanding().then(data => {
  const recent = data.filter(d => d.Category === 'Testing');
  console.log(recent.map(r => r.Accounts).join(', '));
});
