import { fetchOutstanding } from './src/api';
fetchOutstanding().then(data => {
  if(data.length) console.log(Object.keys(data[0]).map(k => `"${k}"`));
}).catch(e => console.error(e));
