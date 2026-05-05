import {
  sbFetchTransactions, sbFetchOutstanding, sbFetchAccounts,
  sbInsertTransaction, sbUpdateTransaction, sbDeleteTransaction,
  sbInsertOutstanding, sbUpdateOutstanding, sbDeleteOutstanding,
  sbInsertAccount, sbUpdateAccount, sbDeleteAccount,
  mapRowToRecord, mapRowToAccount,
} from './supabase';

// ============================================================
// Fetch (Read) — Supabase Primary
// ============================================================

export async function fetchTransactions() {
  const rows = await sbFetchTransactions();
  return rows.map(mapRowToRecord);
}

export async function fetchOutstanding() {
  const rows = await sbFetchOutstanding();
  return rows.map(mapRowToRecord);
}

export async function fetchAccounts() {
  const rows = await sbFetchAccounts();
  return rows.map(mapRowToAccount);
}

// ============================================================
// Write — Supabase Primary
// ============================================================

export async function saveTransaction(data: any) {
  const sheet = data.sheet || 'Transactions';
  const action = data.action;
  const id = data.id || data.ID;

  try {
    let result;
    if (action === 'delete') {
      if (sheet === 'Transactions') result = await sbDeleteTransaction(id);
      else if (sheet === 'Outstanding') result = await sbDeleteOutstanding(id);
      else if (sheet === 'Accounts') result = await sbDeleteAccount(id);
    } else if ((action === 'edit' || action === 'update') && id) {
      if (sheet === 'Transactions') result = await sbUpdateTransaction(id, data);
      else if (sheet === 'Outstanding') result = await sbUpdateOutstanding(id, data);
      else if (sheet === 'Accounts') result = await sbUpdateAccount(id, data);
    } else {
      // New entry (add)
      if (sheet === 'Transactions') result = await sbInsertTransaction(data);
      else if (sheet === 'Outstanding') result = await sbInsertOutstanding(data);
      else if (sheet === 'Accounts') result = await sbInsertAccount(data);
    }

    return { status: 'ok', data: result };
  } catch (error) {
    console.error('Supabase operation failed:', error);
    return { status: 'error', error };
  }
}

// ============================================================
// Exports
// ============================================================

export {
  sbFetchTransactions, sbFetchOutstanding, sbFetchAccounts,
  sbInsertTransaction, sbUpdateTransaction, sbDeleteTransaction,
  sbInsertOutstanding, sbUpdateOutstanding, sbDeleteOutstanding,
  sbInsertAccount, sbUpdateAccount, sbDeleteAccount,
  mapRowToRecord, mapRowToAccount,
} from './supabase';
