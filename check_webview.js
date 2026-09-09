const WebSocket = require('ws');
const ws = new WebSocket('ws://127.0.0.1:9222/devtools/page/6EC1AB0CFD7081083BBB0726142FB868');
ws.on('open', () => {
  const expr = 'JSON.stringify({url:location.href, user:localStorage.getItem("bhushakti_auth_user"), hasToken:!!localStorage.getItem("bhushakti_access_token")})';
  ws.send(JSON.stringify({id:1, method:'Runtime.evaluate', params:{expression: expr}}));
});
ws.on('message', data => {
  const msg = JSON.parse(data.toString());
  if (msg.id === 1) {
    const result = JSON.parse(msg.result.result.value);
    console.log('Current URL:', result.url);
    console.log('Has Token:', result.hasToken);
    if (result.user) {
      const u = JSON.parse(result.user);
      console.log('User email:', u.email);
      console.log('User role:', u.role);
    }
    ws.close();
  }
});
ws.on('error', e => { console.error(e.message); process.exit(1); });
