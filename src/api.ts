import {
  sbFetchTransactions, sbFetchOutstanding, sbFetchAccounts,
  sbInsertTransaction, sbUpdateTransaction, sbDeleteTransaction,
  sbInsertOutstanding, sbUpdateOutstanding, sbDeleteOutstanding,
  sbInsertAccount, sbUpdateAccount, sbDeleteAccount,
  mapRowToRecord, mapRowToAccount,
} from './supabase';

// ============================================================
// Google Apps Script (Primary backend)
// ============================================================

const SCRIPT_ID = (import.meta as any).env.VITE_APPS_SCRIPT_ID || 'AKfycbx7WQ5WRW8TeBwGgcTbW-R0GUYyxo-koUSIP_LB1fjpTw9RS4FIJlKXnNxWfE-pVjZ_KA';
const API_URL = `https://script.google.com/macros/s/${SCRIPT_ID}/exec`;

async function safeFetch(url: string, options?: RequestInit) {
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    if (text.trim().startsWith("<!DOCTYPE html>") || text.trim().startsWith("<html")) {
      console.error('Google Apps Script returned HTML instead of JSON. This usually indicates a permissions issue (Script not set to "Access: Anyone") or an invalid Script ID.');
      throw new Error('Google Script Connection Error: Received HTML response. Please ensure your script is deployed with "Access: Anyone".');
    }
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse JSON from response:", text.slice(0, 200));
      throw new Error("Server returned non-JSON response. The script might be misconfigured or returning an error.");
    }
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new Error("Network error or interrupted connection.");
  }
}

// ============================================================
// Fetch (Read) — Google Sheets primary, Supabase fallback
// ============================================================

export async function fetchTransactions() {
  try {
    const json = await safeFetch(`${API_URL}?action=get&sheet=Transactions`);
    if (json.status !== 'ok') throw new Error('Bad response');
    return json.data;
  } catch (gsError) {
    console.warn('Google Sheets fetch failed, falling back to Supabase:', gsError);
    const rows = await sbFetchTransactions();
    return rows.map(mapRowToRecord);
  }
}

export async function fetchOutstanding() {
  try {
    const json = await safeFetch(`${API_URL}?action=get&sheet=Outstanding`);
    if (json.status !== 'ok') throw new Error('Bad response');
    return json.data;
  } catch (gsError) {
    console.warn('Google Sheets fetch failed, falling back to Supabase:', gsError);
    const rows = await sbFetchOutstanding();
    return rows.map(mapRowToRecord);
  }
}

export async function fetchAccounts() {
  try {
    const json = await safeFetch(`${API_URL}?action=get&sheet=Accounts`);
    if (json.status !== 'ok') throw new Error('Bad response');
    return json.data;
  } catch (gsError) {
    console.warn('Google Sheets fetch failed, falling back to Supabase:', gsError);
    const rows = await sbFetchAccounts();
    return rows.map(mapRowToAccount);
  }
}

// ============================================================
// Write — Dual-write to both Google Sheets AND Supabase
// ============================================================

export async function saveTransaction(data: any) {
  // Always write to Google Sheets (primary)
  const gsResult = await safeFetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    redirect: 'follow',
    body: JSON.stringify(data)
  });

  // Also write to Supabase (secondary) — fire-and-forget
  try {
    const sheet = data.sheet || 'Transactions';
    const action = data.action;

    if (action === 'delete') {
      if (sheet === 'Transactions') await sbDeleteTransaction(data.id);
      else if (sheet === 'Outstanding') await sbDeleteOutstanding(data.id);
      else if (sheet === 'Accounts') await sbDeleteAccount(data.id);
    } else if (action === 'edit' && data.id) {
      if (sheet === 'Transactions') await sbUpdateTransaction(data.id, data);
      else if (sheet === 'Outstanding') await sbUpdateOutstanding(data.id, data);
      else if (sheet === 'Accounts') await sbUpdateAccount(data.id, data);
    } else {
      // New entry (add)
      if (sheet === 'Transactions') await sbInsertTransaction(data);
      else if (sheet === 'Outstanding') await sbInsertOutstanding(data);
      else if (sheet === 'Accounts') await sbInsertAccount(data);
    }
  } catch (sbError) {
    // Don't fail the main operation if Supabase sync fails
    console.warn('Supabase sync failed (non-critical):', sbError);
  }

  return gsResult;
}

// ============================================================
// Direct Supabase access (for future use or standalone mode)
// ============================================================

export {
  sbFetchTransactions, sbFetchOutstanding, sbFetchAccounts,
  sbInsertTransaction, sbUpdateTransaction, sbDeleteTransaction,
  sbInsertOutstanding, sbUpdateOutstanding, sbDeleteOutstanding,
  sbInsertAccount, sbUpdateAccount, sbDeleteAccount,
  mapRowToRecord, mapRowToAccount,
} from './supabase';
