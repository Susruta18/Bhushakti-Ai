const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const login = JSON.parse(data);
    const token = login.data.token;
    
    // Get Env features
    http.get('http://localhost:5000/api/environmental-data/features/6a95aa3ed00e111b9f4d41e2?windowHours=24', { headers: { 'Authorization': 'Bearer ' + token } }, res3 => {
      let data3 = '';
      res3.on('data', chunk => data3 += chunk);
      res3.on('end', () => {
        console.log("ENV FEATURES FOR Feature Test Zone:", data3);
      });
    });
  });
});
req.write(JSON.stringify({email:'authority@bhushakti.ai', password:'SecureAuthority123!'}));
req.end();
