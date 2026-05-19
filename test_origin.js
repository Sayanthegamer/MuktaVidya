const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/solve',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Origin': 'http://localhost:3000'
  }
};

const req = http.request(options, (res) => {
  console.log('Status code with Origin:', res.statusCode);
});

req.write(JSON.stringify({ imageBase64: 'test' }));
req.end();

const options2 = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/solve',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
};

const req2 = http.request(options2, (res) => {
  console.log('Status code without Origin:', res.statusCode);
});

req2.write(JSON.stringify({ imageBase64: 'test' }));
req2.end();
