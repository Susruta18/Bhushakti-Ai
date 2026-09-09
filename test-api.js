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
    
    // Get Zones
    http.get('http://localhost:5000/api/risk-zones?isActive=true&limit=1', { headers: { 'Authorization': 'Bearer ' + token } }, res2 => {
      let data2 = '';
      res2.on('data', chunk => data2 += chunk);
      res2.on('end', () => {
        const zones = JSON.parse(data2);
        const zone = zones.data[0];
        const zoneId = zone._id || zone.id;
        console.log("ZONE ID:", zoneId);
        
        // Get Env features
        http.get(`http://localhost:5000/api/environmental-data/features/${zoneId}?windowHours=24`, { headers: { 'Authorization': 'Bearer ' + token } }, res3 => {
          let data3 = '';
          res3.on('data', chunk => data3 += chunk);
          res3.on('end', () => {
            console.log("ENV FEATURES:", data3);
          });
        });
        
        // Get alerts count
        http.get('http://localhost:5000/api/alerts?status=ACTIVE', { headers: { 'Authorization': 'Bearer ' + token } }, res4 => {
          let data4 = '';
          res4.on('data', chunk => data4 += chunk);
          res4.on('end', () => {
            console.log("ALERTS:", data4);
          });
        });
      });
    });
  });
});
req.write(JSON.stringify({email:'authority@bhushakti.ai', password:'SecureAuthority123!'}));
req.end();
