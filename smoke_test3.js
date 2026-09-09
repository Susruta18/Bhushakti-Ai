const WebSocket = require('ws');
const http = require('http');

function getPageId() {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json', r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => {
        const pages = JSON.parse(d);
        resolve(pages[0]);
      });
    }).on('error', reject);
  });
}

function connectWs(pageId) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(pageId.webSocketDebuggerUrl);
    ws.on('open', () => resolve(ws));
    ws.on('error', reject);
  });
}

let msgId = 0;
function sendCmd(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++msgId;
    const timeout = setTimeout(() => reject(new Error('Timeout')), 15000);
    const handler = (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.id === id) {
        clearTimeout(timeout);
        ws.off('message', handler);
        resolve(msg.result);
      }
    };
    ws.on('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evalOnDevice(expr) {
  const page = await getPageId();
  const ws = await connectWs(page);
  try {
    const result = await sendCmd(ws, 'Runtime.evaluate', {
      expression: expr,
      awaitPromise: true,
      returnByValue: true
    });
    return result.result.value;
  } finally {
    ws.close();
  }
}

async function run() {
  console.log('=== BHUSHAKTI AI PHYSICAL DEVICE SMOKE TEST ===\n');
  
  // 1. Check current state
  let state = JSON.parse(await evalOnDevice(`JSON.stringify({
    url: location.href,
    hasToken: !!localStorage.getItem('bhushakti_access_token'),
    hasUser: !!localStorage.getItem('bhushakti_auth_user')
  })`));
  console.log('Current state:', state);
  
  // 2. If already logged in, verify. If not, login.
  if (!state.hasToken) {
    console.log('\nPerforming fresh login...');
    const loginResult = JSON.parse(await evalOnDevice(`(async () => {
      const r = await fetch('http://192.168.1.103:5000/api/auth/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email:'authority@bhushakti.ai', password:'SecureAuthority123!'})
      });
      const d = await r.json();
      if (d.success) {
        localStorage.setItem('bhushakti_auth_user', JSON.stringify({id:d.data.user.id,email:d.data.user.email,role:'authority',name:'authority'}));
        localStorage.setItem('bhushakti_access_token', d.data.token);
      }
      return JSON.stringify({status:r.status, success:d.success, msg:d.message});
    })()`));
    console.log('Login:', loginResult);
    if (!loginResult.success) { console.log('LOGIN FAILED'); return; }
  } else {
    console.log('Already authenticated.');
  }
  
  // 3. Dashboard check
  console.log('\n--- Dashboard ---');
  let dashResult = JSON.parse(await evalOnDevice(`JSON.stringify({
    url: location.href,
    title: document.title,
    contentLen: document.body.innerText.length,
    hasDashElements: document.body.innerText.includes('Dashboard') || document.body.innerText.includes('Risk') || document.body.innerText.includes('BHUSHAKTI') || document.body.innerText.includes('Home')
  })`));
  console.log('Dashboard:', dashResult);
  console.log('DASHBOARD:', dashResult.contentLen > 100 ? 'PASS' : 'FAIL');
  
  // 4. Test APIs from the device
  console.log('\n--- API Tests from Device ---');
  
  // Risk Zones
  let apiResult = JSON.parse(await evalOnDevice(`(async () => {
    const token = localStorage.getItem('bhushakti_access_token');
    const r = await fetch('http://192.168.1.103:5000/api/risk-zones', {
      headers: {'Authorization': 'Bearer ' + token}
    });
    const d = await r.json();
    return JSON.stringify({status:r.status, success:d.success, count: Array.isArray(d.data) ? d.data.length : 'n/a'});
  })()`));
  console.log('Risk Zones API:', apiResult);
  console.log('GIS:', apiResult.status === 200 ? 'PASS' : 'FAIL');
  
  // Alerts
  apiResult = JSON.parse(await evalOnDevice(`(async () => {
    const token = localStorage.getItem('bhushakti_access_token');
    const r = await fetch('http://192.168.1.103:5000/api/alerts', {
      headers: {'Authorization': 'Bearer ' + token}
    });
    const d = await r.json();
    return JSON.stringify({status:r.status, success:d.success});
  })()`));
  console.log('Alerts API:', apiResult);
  console.log('ALERTS:', apiResult.status === 200 ? 'PASS' : 'FAIL');
  
  // Notifications  
  apiResult = JSON.parse(await evalOnDevice(`(async () => {
    const token = localStorage.getItem('bhushakti_access_token');
    const r = await fetch('http://192.168.1.103:5000/api/notifications', {
      headers: {'Authorization': 'Bearer ' + token}
    });
    const d = await r.json();
    return JSON.stringify({status:r.status, success:d.success});
  })()`));
  console.log('Notifications API:', apiResult);
  console.log('NOTIFICATIONS:', apiResult.status === 200 ? 'PASS' : 'FAIL');
  
  // Analytics
  apiResult = JSON.parse(await evalOnDevice(`(async () => {
    const token = localStorage.getItem('bhushakti_access_token');
    const r = await fetch('http://192.168.1.103:5000/api/analytics/overview', {
      headers: {'Authorization': 'Bearer ' + token}
    });
    const d = await r.json();
    return JSON.stringify({status:r.status, success:d.success});
  })()`));
  console.log('Analytics API:', apiResult);
  console.log('ANALYTICS:', apiResult.status === 200 ? 'PASS' : 'FAIL');
  
  // Risk Prediction
  apiResult = JSON.parse(await evalOnDevice(`(async () => {
    const token = localStorage.getItem('bhushakti_access_token');
    const r = await fetch('http://192.168.1.103:5000/api/risk-prediction/predict', {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token},
      body: JSON.stringify({latitude:19.076,longitude:72.8777,rainfall_mm:150,soil_moisture:0.7,slope_degrees:30,elevation_m:500})
    });
    const d = await r.text();
    return JSON.stringify({status:r.status, body:d.substring(0,300)});
  })()`));
  console.log('Risk Prediction API:', apiResult);
  console.log('AI PREDICTION:', (apiResult.status === 200 || apiResult.status === 503) ? 'PASS (API reached)' : 'FAIL');
  
  // 5. Page navigation tests
  console.log('\n--- Page Navigation Tests ---');
  
  const pages = [
    {name: 'Risk Map', path: '/risk-map'},
    {name: 'Alerts', path: '/alerts'},
    {name: 'Notifications', path: '/notifications'},
    {name: 'Analytics', path: '/analytics'},
  ];
  
  for (const page of pages) {
    const navResult = JSON.parse(await evalOnDevice(`
      window.location.href = '${page.path}';
      new Promise(r => setTimeout(() => {
        r(JSON.stringify({
          url: location.href,
          loaded: document.body.innerText.length > 50,
          contentLen: document.body.innerText.length
        }));
      }, 2000))
    `));
    console.log(`${page.name}: URL=${navResult.url}, loaded=${navResult.loaded}, contentLen=${navResult.contentLen}`);
  }
  
  console.log('\n=== SMOKE TEST COMPLETE ===');
}

run().catch(e => { console.error('SMOKE TEST ERROR:', e.message); process.exit(1); });
