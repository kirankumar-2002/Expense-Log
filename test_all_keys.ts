import { saveTransaction } from './src/api';
async function run() {
  const payload: any = {
    action: 'add',
    sheet: 'Transactions',
    id: '', 
    date: '2026-05-02',
    amount: 100,
    state: 'Payable',
    category: 'Expenses',
    subCategory: 'TestLower',
    status: 'Processed'
  };
  
  const testDict: { [key: string]: string } = {
     'Accounts': 'A1', 'Account': 'A2', 'account': 'A3', 'accounts': 'A4', 
     'bank': 'B1', 'Bank': 'B2', 'wallet': 'W1', 'acc': 'C1',
     'Desc': 'D1', 'desc': 'D2', 'description': 'D3', 'Description': 'D4',
     'Notes': 'N1', 'notes': 'N2', 'note': 'N3', 'Note': 'N4'
  };
  for (const k in testDict) {
    payload[k] = testDict[k];
  }
  
  const res = await saveTransaction(payload);
  console.log(res);
}
run();
