const SCRIPT_ID = 'AKfycbx7WQ5WRW8TeBwGgcTbW-R0GUYyxo-koUSIP_LB1fjpTw9RS4FIJlKXnNxWfE-pVjZ_KA';
fetch(`https://script.google.com/macros/s/${SCRIPT_ID}/exec?action=get&sheet=Outstanding`)
  .then(r => r.json())
  .then(d => {
     console.log("Outstanding length:", d.data.length);
     console.log("First:", d.data[0]);
  })
  .catch(console.error);
