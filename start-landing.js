const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    const filePath = path.join(__dirname, 'index.html');
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading page');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`\n✅ Landing page running at http://localhost:${PORT}\n`);
  console.log('🌐 Opening in browser...\n');
  
  // Open browser
  const { exec } = require('child_process');
  const platform = process.platform;
  let command;
  
  if (platform === 'win32') {
    command = `start http://localhost:${PORT}`;
  } else if (platform === 'darwin') {
    command = `open http://localhost:${PORT}`;
  } else {
    command = `xdg-open http://localhost:${PORT}`;
  }
  
  exec(command);
});

