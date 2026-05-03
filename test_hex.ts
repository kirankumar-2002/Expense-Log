import { fetchTransactions } from './src/api';
fetchTransactions().then(data => {
  if (data[0]) {
    const keys = Object.keys(data[0]);
    keys.forEach(k => {
      let hex = '';
      for (let i = 0; i < k.length; i++) {
        hex += k.charCodeAt(i).toString(16) + ' ';
      }
      console.log(`Key: "${k}" Hex: ${hex}`);
    });
  }
});
