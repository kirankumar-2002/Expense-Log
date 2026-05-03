import { saveTransaction } from './src/api';
async function run() {
  const payload: any = {
    action: 'update',
    sheet: 'Transactions',
    id: '1778000000055', 
    accounts: 'BANK_UDPATED',
    account: 'BANK_UDPATED',
    Accounts: 'BANK_UDPATED',
    bank: 'BANK_UDPATED'
  };
  await saveTransaction(payload);
}
run();
