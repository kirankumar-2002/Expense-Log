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

export async function fetchTransactions() {
  const json = await safeFetch(`${API_URL}?action=get&sheet=Transactions`);
  if (json.status !== 'ok') throw new Error('Bad response');
  return json.data;
}

export async function fetchOutstanding() {
  const json = await safeFetch(`${API_URL}?action=get&sheet=Outstanding`);
  if (json.status !== 'ok') throw new Error('Bad response');
  return json.data;
}

export async function fetchAccounts() {
  const json = await safeFetch(`${API_URL}?action=get&sheet=Accounts`);
  if (json.status !== 'ok') throw new Error('Bad response');
  return json.data;
}

export async function saveTransaction(data: any) {
  return await safeFetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    redirect: 'follow',
    body: JSON.stringify(data)
  });
}
