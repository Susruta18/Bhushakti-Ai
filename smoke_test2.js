const WebSocket = require('ws');
const wsUrl = 'ws://127.0.0.1:9222/devtools/page/6EC1AB0CFD7081083BBB0726142FB868';
let msgId = 0;

function sendCmd(ws, method, params = {}) {
  return new Promise((resolve) => {
    const id = ++msgId;
    const handler = (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.id === id) { ws.off('message', handler); resolve(msg.result); }
    };
    ws.on('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function run() {
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve) => ws.on('open', resolve));

  // Check risk-map page for actual error messages
  console.log('=== Checking Risk Map page errors ===');
  await sendCmd(ws, 'Runtime.evaluate', { expression: 'window.location.href = "/risk-map";' });
  await new Promise(r => setTimeout(r, 3000));
  
  let result = await sendCmd(ws, 'Runtime.evaluate', {
    expression: `JSON.stringify({
      url: location.href,
      errorElements: document.querySelectorAll('[class*="error"], [class*="Error"]').length,
      visibleErrors: Array.from(document.querySelectorAll('p, div, span')).filter(el => el.textContent.toLowerCase().includes('error') && el.offsetHeight > 0).map(el => el.textContent.trim().substring(0, 100)),
      hasMapContainer: !!document.querySelector('[class*="map"], [class*="Map"], .leaflet-container'),
      bodyText: document.body.innerText.substring(0, 500)
    })`
  });
  console.log('Risk Map:', JSON.parse(result.result.value));
  
  // Check Analytics
  console.log('\n=== Checking Analytics page ===');
  await sendCmd(ws, 'Runtime.evaluate', { expression: 'window.location.href = "/analytics";' });
  await new Promise(r => setTimeout(r, 3000));
  
  result = await sendCmd(ws, 'Runtime.evaluate', {
    expression: `JSON.stringify({
      url: location.href,
      visibleErrors: Array.from(document.querySelectorAll('p, div, span')).filter(el => el.textContent.toLowerCase().includes('error') && el.offsetHeight > 0).map(el => el.textContent.trim().substring(0, 100)),
      bodyText: document.body.innerText.substring(0, 500)
    })`
  });
  console.log('Analytics:', JSON.parse(result.result.value));

  // Test risk prediction with correct fields
  console.log('\n=== Testing Risk Prediction API ===');
  const predResult = await sendCmd(ws, 'Runtime.evaluate', {
    expression: `(async () => {
      try {
        const token = localStorage.getItem('bhushakti_access_token');
        const response = await fetch('http://192.168.1.103:5000/api/risk-prediction/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify({
            latitude: 19.076, longitude: 72.8777,
            rainfall_mm: 150, soil_moisture: 0.7,
            slope_degrees: 30, elevation_m: 500
          })
        });
        const text = await response.text();
        return JSON.stringify({status: response.status, body: text.substring(0, 500)});
      } catch(e) { return JSON.stringify({error: e.message}); }
    })()`,
    awaitPromise: true
  });
  console.log('Risk Prediction:', JSON.parse(predResult.result.value));

  // Also test the risk-zones API directly
  console.log('\n=== Testing Risk Zones API ===');
  const rzResult = await sendCmd(ws, 'Runtime.evaluate', {
    expression: `(async () => {
      try {
        const token = localStorage.getItem('bhushakti_access_token');
        const response = await fetch('http://192.168.1.103:5000/api/risk-zones', {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await response.json();
        return JSON.stringify({status: response.status, success: data.success, count: data.data?.length || 0});
      } catch(e) { return JSON.stringify({error: e.message}); }
    })()`,
    awaitPromise: true
  });
  console.log('Risk Zones:', JSON.parse(rzResult.result.value));

  ws.close();
}

run().catch(e => { console.error(e); process.exit(1); });
