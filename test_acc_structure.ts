import { fetchAccounts } from './src/api';
fetchAccounts().then(data => {
  if (data.length > 0) {
    console.log("Accounts first row keys:", Object.keys(data[0]));
    console.log("Accounts row example:", data[0]);
  } else {
    console.log("Accounts is empty");
  }
});
