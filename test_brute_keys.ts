import { saveTransaction } from './src/api';

async function run() {
  const commonKeys = [
    'account', 'accounts', 'Account', 'Accounts',
    'bank', 'Bank', 'bankAccount', 'BankAccount',
    'source', 'Source', 'method', 'Method',
    'type', 'Type', 'wallet', 'Wallet',
    'payment', 'Payment', 'paymentMethod', 'PaymentMethod',
    'fund', 'Fund', 'card', 'Card'
  ];
  
  for (let i = 0; i < commonKeys.length; i++) {
     const k = commonKeys[i];
     const payload: any = { 
       action: 'add', 
       sheet: 'Transactions', 
       id: '', 
       date: '2026-05-02', 
       amount: 1, 
       state: 'Payable', 
       category: 'TestingAccountsCol', 
       subCategory: k, 
       status: 'Processed' 
     };
     payload[k] = `V_${k}`; // Store the key name as the value
     await saveTransaction(payload);
  }
}
run();
