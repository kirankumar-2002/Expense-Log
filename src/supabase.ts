// Supabase client for Expense-Log
// Uses the REST API directly (no SDK dependency needed)

const env = typeof process !== 'undefined' ? (process.env as any) : ((import.meta as any).env || {});
const SUPABASE_URL = env.VITE_SUPABASE_URL || 'https://udpbbkcrvebyghgaqqgo.supabase.co';
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_DUSdBZceaN1fyHYcKztjPg_Db5CYNPm';

const REST_URL = `${SUPABASE_URL}/rest/v1`;

const headers = {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
};

// ---------- Generic helpers ----------

async function supabaseFetch<T = any>(
  table: string,
  query: string = '',
  options: RequestInit = {}
): Promise<T> {
  const url = `${REST_URL}/${table}${query ? '?' + query : ''}`;
  const res = await fetch(url, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error(`Supabase error [${res.status}] on ${table}:`, errorBody);
    throw new Error(`Supabase error: ${res.status} - ${errorBody}`);
  }

  return res.json();
}

// ---------- Transactions ----------

export async function sbFetchTransactions() {
  return supabaseFetch<any[]>('transactions', 'select=*&order=date.desc');
}

export async function sbInsertTransaction(record: any) {
  return supabaseFetch<any[]>('transactions', '', {
    method: 'POST',
    body: JSON.stringify(mapRecordToRow(record, 'transactions')),
  });
}

export async function sbUpdateTransaction(id: string, record: any) {
  return supabaseFetch<any[]>('transactions', `id=eq.${id}`, {
    method: 'PATCH',
    body: JSON.stringify(mapRecordToRow(record, 'transactions')),
  });
}

export async function sbDeleteTransaction(id: string) {
  return supabaseFetch<any[]>('transactions', `id=eq.${id}`, {
    method: 'DELETE',
  });
}

// ---------- Outstanding ----------

export async function sbFetchOutstanding() {
  return supabaseFetch<any[]>('outstanding', 'select=*&order=date.desc');
}

export async function sbInsertOutstanding(record: any) {
  return supabaseFetch<any[]>('outstanding', '', {
    method: 'POST',
    body: JSON.stringify(mapRecordToRow(record, 'outstanding')),
  });
}

export async function sbUpdateOutstanding(id: string, record: any) {
  return supabaseFetch<any[]>('outstanding', `id=eq.${id}`, {
    method: 'PATCH',
    body: JSON.stringify(mapRecordToRow(record, 'outstanding')),
  });
}

export async function sbDeleteOutstanding(id: string) {
  return supabaseFetch<any[]>('outstanding', `id=eq.${id}`, {
    method: 'DELETE',
  });
}

// ---------- Accounts ----------

export async function sbFetchAccounts() {
  return supabaseFetch<any[]>('accounts', 'select=*&order=name.asc');
}

export async function sbInsertAccount(record: any) {
  return supabaseFetch<any[]>('accounts', '', {
    method: 'POST',
    body: JSON.stringify(mapAccountToRow(record)),
  });
}

export async function sbUpdateAccount(id: string, record: any) {
  return supabaseFetch<any[]>('accounts', `id=eq.${id}`, {
    method: 'PATCH',
    body: JSON.stringify(mapAccountToRow(record)),
  });
}

export async function sbDeleteAccount(id: string) {
  return supabaseFetch<any[]>('accounts', `id=eq.${id}`, {
    method: 'DELETE',
  });
}

// ---------- Data mapping (App format ↔ Supabase columns) ----------

/**
 * Maps a FinancialRecord (from the app) to a Supabase row.
 * Supabase columns use lowercase snake_case while the app uses PascalCase/mixed.
 */
function mapRecordToRow(record: any, _table: string) {
  // Never include `id` in the body — it's GENERATED ALWAYS in Postgres.
  // For updates, the id is passed via the URL query param (e.g. ?id=eq.123).
  return {
    date: record.Date || record.date || null,
    amount: parseFloat(String(record.Amount || record.amount || 0)),
    state: record.State || record.state || 'Payable',
    category: record.Category || record.category || '',
    sub_category: record['Sub-Category'] || record.subCategory || '',
    status: record.Status || record.status || 'Pending',
    accounts: record.Accounts || record.accounts || '',
    description: record.Desc || record.desc || '',
    notes: record.Notes || record.notes || '',
  };
}

/**
 * Maps a Supabase row back to the app's FinancialRecord format.
 */
export function mapRowToRecord(row: any) {
  return {
    ID: String(row.id),
    Date: row.date || '',
    Amount: Number(row.amount) || 0,
    State: row.state || 'Payable',
    Category: row.category || '',
    'Sub-Category': row.sub_category || '',
    Status: row.status || 'Pending',
    Accounts: row.accounts || '',
    Desc: row.description || '',
    Notes: row.notes || '',
  };
}

/**
 * Maps an Account record to a Supabase accounts row.
 */
function mapAccountToRow(record: any) {
  return {
    ...(record.id && !String(record.id).startsWith('new_') ? { id: record.id } : {}),
    name: record.name || '',
    type: record.type || 'Current',
    balance: parseFloat(String(record.balance || 0)),
    standard_balance: parseFloat(String(record.standardBalance || record.standard_balance || 0)),
    month: record.Month || record.month || '',
    last_updated: record.lastUpdated || record.last_updated || new Date().toISOString(),
  };
}

/**
 * Maps a Supabase accounts row back to the app's Account format.
 */
export function mapRowToAccount(row: any) {
  return {
    id: String(row.id),
    name: row.name || '',
    type: row.type || 'Current',
    balance: Number(row.balance) || 0,
    standardBalance: Number(row.standard_balance) || 0,
    lastUpdated: row.last_updated || '',
    Month: row.month || '',
  };
}

// ---------- Profiles / Users ----------

/**
 * Syncs a Firebase Auth user profile to the Supabase 'users' table.
 * Uses upsert logic (merge on firebase_uid conflict).
 */
export async function sbSyncProfile(firebaseUser: any, extraData: any = {}) {
  if (!firebaseUser) {
    console.error('❌ sbSyncProfile: No firebaseUser provided');
    return;
  }
  console.log('🔄 Syncing user profile to Supabase...', firebaseUser.uid);
  console.log('👤 Firebase User Info:', { 
    email: firebaseUser.email, 
    providers: firebaseUser.providerData?.map((p: any) => p.providerId) 
  });
  
  const providerData = firebaseUser.providerData?.[0] || {};
  const rawProviderId = providerData.providerId || firebaseUser.providerId || '';
  
  const providerName = rawProviderId === 'password' ? 'Email/Password' : 
                       (rawProviderId === 'google.com' || rawProviderId === 'google') ? 'Google' : 
                       rawProviderId || 'Unknown';

  const profile = {
    firebase_uid: firebaseUser.uid,
    user_id: extraData.userId || firebaseUser.email?.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') || '',
    email: firebaseUser.email || '',
    full_name: firebaseUser.displayName || extraData.name || '',
    role_plan: extraData.plan || 'free',
    provider: providerName,
    last_login_at: new Date().toISOString(),
  };

  try {
    const res = await fetch(`${REST_URL}/users?on_conflict=firebase_uid`, {
      method: 'POST',
      headers: {
        ...headers,
        'Prefer': 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify(profile),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ Supabase sync failed:', errorText);
      throw new Error(`Sync error: ${res.status}`);
    }

    const data = await res.json();
    console.log('✅ Supabase profile synced:', data[0]?.email);
    return data[0];
  } catch (err) {
    console.error('❌ Error in sbSyncProfile:', err);
    throw err;
  }
}

