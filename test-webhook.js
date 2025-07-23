const https = require('https');

// Test webhook endpoint
const options = {
  hostname: 'soft.nexonsolutions.be',
  port: 443,
  path: '/webhook',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Hub-Signature-256': 'sha256=test-signature'
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
  });
});

req.on('error', (err) => {
  console.error('Error:', err.message);
});

// Send test payload
const testPayload = JSON.stringify({
  ref: 'refs/heads/main',
  repository: {
    full_name: 'test/repo'
  }
});

req.write(testPayload);
req.end(); 