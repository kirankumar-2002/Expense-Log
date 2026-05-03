import { fetchOutstanding } from './src/api';
fetchOutstanding().then(data => console.log(data[data.length-1]));
