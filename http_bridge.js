const http = require('http');
const net = require('net');

const LAN_PORT = 8889;
const TARGET_PORT = 49212;

const server = http.createServer((req, res) => {
  const headers = { ...req.headers, host: `127.0.0.1:${TARGET_PORT}` };
  const options = {
    hostname: '127.0.0.1',
    port: TARGET_PORT,
    path: req.url,
    method: req.method,
    headers: headers
  };
  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  proxyReq.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Bad Gateway: ' + err.message);
  });
  req.pipe(proxyReq);
});

server.on('upgrade', (req, socket, head) => {
  const proxySocket = net.connect(TARGET_PORT, '127.0.0.1', () => {
    proxySocket.write(`${req.method} ${req.url} HTTP/1.1\r\n`);
    for (const [k, v] of Object.entries(req.headers)) {
      if (k.toLowerCase() === 'host') {
        proxySocket.write(`host: 127.0.0.1:${TARGET_PORT}\r\n`);
      } else {
        proxySocket.write(`${k}: ${v}\r\n`);
      }
    }
    proxySocket.write('\r\n');
    if (head && head.length > 0) proxySocket.write(head);
    socket.pipe(proxySocket);
    proxySocket.pipe(socket);
  });
  proxySocket.on('error', () => socket.destroy());
  socket.on('error', () => proxySocket.destroy());
});

server.listen(LAN_PORT, '0.0.0.0', () => {
  console.log(`HTTP LAN Bridge active on 0.0.0.0:${LAN_PORT} -> 127.0.0.1:${TARGET_PORT}`);
});
