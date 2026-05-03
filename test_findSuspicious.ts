import { fetchTransactions, fetchOutstanding } from './src/api';

async function run() {
  const trans = await fetchTransactions();
  const out = await fetchOutstanding();
  
  const suspicious = (t: any) => {
    return String(t.ID) === '1779000000015' || 
           String(t.ID) === '9999999999999' || 
           String(t.ID) === '1777465030754' || 
           String(t.Desc).includes('VAL_DESC_LOWER') ||
           String(t.Notes).includes('VAL_NOTES_LOWER') ||
           String(t.Desc).includes('BBB') ||
           String(t['Sub-Category']).includes('Test');
  };

  const suspTrans = trans.filter(suspicious);
  const suspOut = out.filter(suspicious);

  console.log("Suspicious in transactions:", suspTrans.length);
  for (const t of suspTrans) {
    console.log("Trans:", t.ID, t.Category, t['Sub-Category'], t.Desc);
  }

  console.log("Suspicious in outstanding:", suspOut.length);
  for (const t of suspOut) {
    console.log("Out:", t.ID, t.Category, t['Sub-Category'], t.Desc);
  }
}
run();
