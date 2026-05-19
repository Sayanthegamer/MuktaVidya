const http = require('http');

const testCases = [
  { name: 'No Origin (Dev)', headers: {} },
  { name: 'Localhost 3000', headers: { 'Origin': 'http://localhost:3000' } },
  { name: 'Vercel Preview', headers: { 'Origin': 'https://my-app-preview.vercel.app' } },
  { name: 'Unknown Origin', headers: { 'Origin': 'http://evil.com' } },
];

async function runTests() {
  for (const testCase of testCases) {
    await new Promise((resolve) => {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/solve',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...testCase.headers
        }
      };

      const req = http.request(options, (res) => {
        console.log(`[${testCase.name}] Status: ${res.statusCode}`);
        resolve();
      });

      req.on('error', (e) => {
        console.error(`[${testCase.name}] Error: ${e.message}`);
        resolve();
      });

      req.write(JSON.stringify({ imageBase64: 'test' }));
      req.end();
    });
  }
}

runTests();
