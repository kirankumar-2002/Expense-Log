// @ts-ignore
if (typeof (import.meta as any).env === 'undefined') {
  (import.meta as any).env = process.env || {};
}

import { fetchTransactions, fetchOutstanding, fetchAccounts } from './api';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

async function migrateData() {
  console.log('Fetching existing data...');
  try {
    const transactions = await fetchTransactions();
    const outstanding = await fetchOutstanding();
    const accounts = await fetchAccounts();

    console.log(`Found ${transactions?.length || 0} transactions.`);
    console.log(`Found ${outstanding?.length || 0} outstanding entries.`);
    console.log(`Found ${accounts?.length || 0} accounts.`);

    let count = 0;

    for (const t of (transactions || [])) {
      const id = t.ID || t.id;
      if (!id) continue;
      await setDoc(doc(db, 'Transactions', String(id)), t, { merge: true });
      count++;
    }

    for (const o of (outstanding || [])) {
      const id = o.ID || o.id;
      if (!id) continue;
      await setDoc(doc(db, 'Outstanding', String(id)), o, { merge: true });
      count++;
    }

    for (const a of (accounts || [])) {
      const id = a.ID || a.id;
      if (!id) continue;
      await setDoc(doc(db, 'Accounts', String(id)), a, { merge: true });
      count++;
    }

    console.log(`Successfully migrated ${count} entries to Firebase!`);
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

migrateData().then(() => process.exit(0));
