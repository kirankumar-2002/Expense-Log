import { saveTransaction } from './src/api';
async function run() {
  const payload: any = {
    action: 'add',
    sheet: 'Transactions',
    id: 'throw_error_please', 
    date: { "an": "object" },
    amount: "Not a number",
    state: ["array"],
  };
  try {
     const res = await saveTransaction(payload);
     console.log("No error:", res);
  } catch(e) {
     console.log("Error:", e);
  }
}
run();
