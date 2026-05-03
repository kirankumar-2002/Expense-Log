import { fetchTransactions } from './src/api';
fetchTransactions().then(data => {
  if (data.length) {
    const rawKeys = Object.keys(data[0]);
    console.log(rawKeys.map(k => `"${k}" [${k.length}]`).join(', '));
  }
});
