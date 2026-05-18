// Supabase client for Expense-Log
// Uses the REST API directly (no SDK dependency needed)

const env = typeof process !== 'undefined' ? (process.env as any) : ((import.meta as any).env || {});
const SUPABASE_URL = env.VITE_SUPABASE_URL || 'https://udpbbkcrvebyghgaqqgo.supabase.co';
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_DUSdBZceaN1fyHYcKztjPg_Db5CYNPm';

const REST_URL = `${SUPABASE_URL}/rest/v1`;

let authToken: string | null = null;
let currentUserId: string | null = null;

export function setSupabaseToken(token: string | null) {
  authToken = token;
}

export function setSupabaseUser(uid: string | null) {
  currentUserId = uid;
}

const defaultHeaders = {
  'apikey': SUPABASE_ANON_KEY,
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
  
  const headers: Record<string, string> = {
    ...defaultHeaders,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    ...(options.headers as Record<string, string> || {})
  };

  if (currentUserId) headers['x-user-id'] = currentUserId;

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error(`❌ Supabase error [${res.status}] on ${table}:`, errorBody);
    throw new Error(`Supabase error: ${res.status} - ${errorBody}`);
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return [] as any;
  }

  return res.json();
}

// ---------- Transactions ----------

export async function sbFetchTransactions(userId: string) {
  if (!userId) return []; // Blank slate logic
  return supabaseFetch<any[]>('transactions', `select=id,date,amount,state,category,sub_category,status,accounts,desc,notes,created_at,last_updated_at&user_id=eq.${userId}&order=date.desc`);
}

export async function sbInsertTransaction(record: any) {
  return supabaseFetch<any[]>('transactions', '', {
    method: 'POST',
    body: JSON.stringify(mapRecordToRow(record, 'transactions')),
  });
}

export async function sbUpdateTransaction(id: string, record: any, userId?: string) {
  const uid = userId || currentUserId;
  return supabaseFetch<any[]>('transactions', `id=eq.${id}&user_id=eq.${uid}`, {
    method: 'PATCH',
    body: JSON.stringify(mapRecordToRow(record, 'transactions')),
  });
}

export async function sbDeleteTransaction(id: string, userId?: string) {
  const uid = userId || currentUserId;
  return supabaseFetch<any[]>('transactions', `id=eq.${id}&user_id=eq.${uid}`, {
    method: 'DELETE',
  });
}

// ---------- Outstanding ----------

export async function sbFetchOutstanding(userId: string) {
  if (!userId) return [];
  return supabaseFetch<any[]>('outstanding', `select=id,date,amount,state,category,sub_category,status,accounts,desc,notes,created_at,last_updated_at&user_id=eq.${userId}&order=date.desc`);
}

export async function sbInsertOutstanding(record: any) {
  return supabaseFetch<any[]>('outstanding', '', {
    method: 'POST',
    body: JSON.stringify(mapRecordToRow(record, 'outstanding')),
  });
}

export async function sbUpdateOutstanding(id: string, record: any, userId?: string) {
  const uid = userId || currentUserId;
  return supabaseFetch<any[]>('outstanding', `id=eq.${id}&user_id=eq.${uid}`, {
    method: 'PATCH',
    body: JSON.stringify(mapRecordToRow(record, 'outstanding')),
  });
}

export async function sbDeleteOutstanding(id: string, userId?: string) {
  const uid = userId || currentUserId;
  return supabaseFetch<any[]>('outstanding', `id=eq.${id}&user_id=eq.${uid}`, {
    method: 'DELETE',
  });
}

// ---------- Accounts ----------

export async function sbFetchAccounts(userId: string) {
  if (!userId) return [];
  return supabaseFetch<any[]>('bank_accounts', `select=id,name,bank,type,balance,standard_balance,month,last_updated_at,created_at&user_id=eq.${userId}&order=name.asc`);
}

export async function sbInsertAccount(record: any) {
  return supabaseFetch<any[]>('bank_accounts', '', {
    method: 'POST',
    body: JSON.stringify(mapAccountToRow(record)),
  });
}

export async function sbUpdateAccount(id: string, record: any, userId?: string) {
  const uid = userId || currentUserId;
  return supabaseFetch<any[]>('bank_accounts', `id=eq.${id}&user_id=eq.${uid}`, {
    method: 'PATCH',
    body: JSON.stringify(mapAccountToRow(record)),
  });
}

export async function sbDeleteAccount(id: string, userId?: string) {
  const uid = userId || currentUserId;
  return supabaseFetch<any[]>('bank_accounts', `id=eq.${id}&user_id=eq.${uid}`, {
    method: 'DELETE',
  });
}

// ---------- Wallets ----------

export async function sbFetchWallets(userId: string) {
  if (!userId) return [];
  return supabaseFetch<any[]>('wallets', `select=id,name,balance_cents,created_at&user_id=eq.${userId}&order=name.asc`);
}

// ---------- Credit Cards ----------

export async function sbFetchCreditCards(userId: string) {
  if (!userId) return [];
  return supabaseFetch<any[]>('credit_cards', `select=id,name,bank,balance,card_limit,created_at&user_id=eq.${userId}&order=name.asc`);
}

// ---------- Outstanding Entries ----------

export async function sbFetchOutstandingEntries(userId: string) {
  if (!userId) return [];
  return supabaseFetch<any[]>('outstanding_entries', `select=id,date,amount_cents,state,category,sub_category,status,accounts,description,notes,due_date,created_at&user_id=eq.${userId}&order=due_date.asc`);
}

// ---------- Payable / Receivable ----------

export async function sbFetchPayableReceivable(userId: string) {
  if (!userId) return [];
  return supabaseFetch<any[]>('payable_receivable', `select=id,date,amount_cents,state,category,sub_category,status,accounts,description,notes,due_date,created_at&user_id=eq.${userId}&order=due_date.asc`);
}

// ---------- Expenses ----------

export async function sbFetchExpenses(userId: string) {
  if (!userId) return [];
  return supabaseFetch<any[]>('expenses', `select=id,date,amount_cents,category,sub_category,status,accounts,description,notes,expense_date,created_at&user_id=eq.${userId}&order=expense_date.desc`);
}



// ---------- Data mapping (App format ↔ Supabase columns) ----------

/**
 * Maps a FinancialRecord (from the app) to a Supabase row.
 * Supabase columns use lowercase snake_case while the app uses PascalCase/mixed.
 */
function mapRecordToRow(record: any, _table: string) {
  // Never include `id` in the body — it's GENERATED ALWAYS in Postgres.
  const rawAmount = parseFloat(String(record.Amount || record.amount || record.balance || 0));
  const amountCents = Math.round(rawAmount * 100);

  const mapped: any = {
    date: record.Date || record.date || null,
    state: record.State || record.state || 'Payable',
    category: record.Category || record.category || '',
    sub_category: record['Sub-Category'] || record.subCategory || '',
    status: record.Status || record.status || 'Pending',
    accounts: record.Accounts || record.accounts || '',
    desc: record.Desc || record.desc || '',
    notes: record.Notes || record.notes || '',
    amount: rawAmount,
    user_id: currentUserId,
  };

  return mapped;
}


/**
 * Maps a Supabase row back to the app's FinancialRecord format.
 */
export function mapRowToRecord(row: any) {
  return {
    ID: String(row.id),
    Date: row.date || '',
    Amount: row.amount !== undefined ? Number(row.amount) : 0,
    State: row.state || 'Payable',
    Category: row.category || '',
    'Sub-Category': row.sub_category || '',
    Status: row.status || 'Pending',
    Accounts: row.accounts || '',
    Desc: row.desc || '',
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
    standard_balance: record.standard_balance ? parseFloat(String(record.standard_balance)) : 0,
    month: record.Month || record.month || '',
    last_updated_at: record.lastUpdated || record.last_updated || new Date().toISOString(),
    user_id: currentUserId,
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
    balance: row.balance !== undefined ? Number(row.balance) : 0,
    month: row.month || '',
    lastUpdated: row.last_updated_at || '',
    Month: row.month || '',
  };
}


