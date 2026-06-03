const https = require('https');

const data = JSON.stringify({
  email: 'admin@ipnu-malang.org',
  password: 'adipnuorg!ws'
});

const options = {
  hostname: 'lmediaback-production.up.railway.app',
  path: '/api/v1/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
  },
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('RESPONSE:', JSON.stringify(JSON.parse(body), null, 2));
  });
});

req.on('error', (e) => console.error('ERROR:', e.message));
req.write(data);
req.end();
