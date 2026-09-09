const WebSocket = require('ws');

const wsUrl = 'ws://127.0.0.1:9222/devtools/page/6EC1AB0CFD7081083BBB0726142FB868';
let msgId = 0;

function sendCmd(ws, method, params = {}) {
  return new Promise((resolve) => {
    const id = ++msgId;
    const handler = (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.id === id) {
        ws.off('message', handler);
        resolve(msg.result);
      }
    };
    ws.on('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function run() {
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve) => ws.on('open', resolve));

  // Step 1: Clear auth and reload to login page
  console.log('=== STEP 1: Clear auth, navigate to login ===');
  await sendCmd(ws, 'Runtime.evaluate', {
    expression: 'localStorage.removeItem("bhushakti_auth_user"); localStorage.removeItem("bhushakti_access_token"); window.location.href = "/";'
  });

  // Wait for page to reload
  await new Promise(r => setTimeout(r, 3000));

  // Re-check state
  const stateCheck = await sendCmd(ws, 'Runtime.evaluate', {
    expression: 'JSON.stringify({url: location.href, hasToken: !!localStorage.getItem("bhushakti_access_token")})'
  });
  console.log('After clear:', JSON.parse(stateCheck.result.value));

  // Step 2: Perform login via fetch API directly in the WebView
  console.log('\n=== STEP 2: Login via JavaScript fetch ===');
  const loginExpr = `
    (async () => {
      try {
        const API_BASE = document.querySelector('meta[name="api-base"]')?.content || 
          (() => { 
            const scripts = document.querySelectorAll('script[src]');
            return null;
          })();
        
        // Get the configured API base from the app
        const apiBase = (() => {
          try {
            // Look for the env variable baked into the bundle
            const allScripts = Array.from(document.querySelectorAll('script'));
            return null; // will use direct URL
          } catch(e) { return null; }
        })();
        
        const baseUrl = 'http://192.168.1.103:5000/api';
        
        const response = await fetch(baseUrl + '/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'authority@bhushakti.ai',
            password: 'SecureAuthority123!'
          })
        });
        
        const data = await response.json();
        
        if (data.success && data.data) {
          // Store auth just like the app would
          const user = {
            id: data.data.user.id,
            name: data.data.user.email.split('@')[0],
            email: data.data.user.email,
            role: data.data.user.role === 'AUTHORITY' ? 'authority' : data.data.user.role.toLowerCase(),
            phone: '+91 00000 00000',
            department: 'District Administration',
            district: 'Sample District',
            state: 'Maharashtra',
            avatar: ''
          };
          localStorage.setItem('bhushakti_auth_user', JSON.stringify(user));
          localStorage.setItem('bhushakti_access_token', data.data.token);
          
          return JSON.stringify({
            status: response.status,
            success: data.success,
            message: data.message,
            userEmail: data.data.user.email,
            userRole: data.data.user.role,
            tokenReceived: true
          });
        } else {
          return JSON.stringify({
            status: response.status,
            success: false,
            message: data.message || 'Unknown error'
          });
        }
      } catch(e) {
        return JSON.stringify({ error: e.message, stack: e.stack });
      }
    })()
  `;
  
  const loginResult = await sendCmd(ws, 'Runtime.evaluate', {
    expression: loginExpr,
    awaitPromise: true
  });
  
  const loginData = JSON.parse(loginResult.result.value);
  console.log('Login result:', JSON.stringify(loginData, null, 2));
  
  if (!loginData.success) {
    console.log('LOGIN FAILED - stopping');
    ws.close();
    return;
  }
  
  console.log('\n=== STEP 3: Navigate to Dashboard ===');
  await sendCmd(ws, 'Runtime.evaluate', {
    expression: 'window.location.href = "/home";'
  });
  await new Promise(r => setTimeout(r, 3000));
  
  const dashCheck = await sendCmd(ws, 'Runtime.evaluate', {
    expression: 'JSON.stringify({url: location.href, title: document.title, bodyLen: document.body.innerHTML.length})'
  });
  const dashData = JSON.parse(dashCheck.result.value);
  console.log('Dashboard:', dashData);
  
  // Step 4: Check all pages
  const pages = [
    { name: 'Risk Zones/GIS', path: '/risk-map' },
    { name: 'Alerts', path: '/alerts' },
    { name: 'Notifications', path: '/notifications' },
    { name: 'Analytics', path: '/analytics' },
  ];
  
  for (const page of pages) {
    console.log(`\n=== Checking: ${page.name} ===`);
    await sendCmd(ws, 'Runtime.evaluate', {
      expression: `window.location.href = "${page.path}";`
    });
    await new Promise(r => setTimeout(r, 3000));
    
    const check = await sendCmd(ws, 'Runtime.evaluate', {
      expression: 'JSON.stringify({url: location.href, bodyLen: document.body.innerHTML.length, hasError: document.body.innerHTML.includes("error") || document.body.innerHTML.includes("Error")})'
    });
    const data = JSON.parse(check.result.value);
    console.log(`${page.name}:`, data);
  }
  
  // Step 5: Test risk prediction API
  console.log('\n=== STEP 5: Test Risk Prediction API ===');
  const predExpr = `
    (async () => {
      try {
        const token = localStorage.getItem('bhushakti_access_token');
        const response = await fetch('http://192.168.1.103:5000/api/risk-prediction/predict', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({
            latitude: 19.076,
            longitude: 72.8777,
            rainfall_mm: 150,
            soil_moisture: 0.7,
            slope_degrees: 30,
            elevation_m: 500
          })
        });
        const data = await response.json();
        return JSON.stringify({status: response.status, success: data.success, hasData: !!data.data});
      } catch(e) {
        return JSON.stringify({error: e.message});
      }
    })()
  `;
  const predResult = await sendCmd(ws, 'Runtime.evaluate', {
    expression: predExpr,
    awaitPromise: true
  });
  console.log('Risk Prediction:', JSON.parse(predResult.result.value));
  
  ws.close();
}

run().catch(e => { console.error(e); process.exit(1); });
