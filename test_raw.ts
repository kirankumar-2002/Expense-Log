const SCRIPT_ID = 'AKfycbx7WQ5WRW8TeBwGgcTbW-R0GUYyxo-koUSIP_LB1fjpTw9RS4FIJlKXnNxWfE-pVjZ_KA';
const API_URL = `https://script.google.com/macros/s/${SCRIPT_ID}/exec`;

async function run() {
  const res = await fetch(`${API_URL}?action=get&sheet=Transactions`);
  const json = await res.json();
  if (json.data && json.data.length > 0) {
    console.log(Object.keys(json.data[0]).map(k => `"${k}"`));
  }
}
run();
