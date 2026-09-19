/**
 * Medical Trip Hub — Lightweight Local HTTP Server for ES6 Modules
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const BASE_DIR = __dirname;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.ts': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
    let reqUrl = req.url.split('?')[0].split('#')[0];
    let filePath = path.join(BASE_DIR, reqUrl === '/' ? 'index.html' : reqUrl);

    // Seguridad: Prevenir directory traversal
    if (!filePath.startsWith(BASE_DIR)) {
        res.writeHead(403);
        return res.end('403 Forbidden');
    }

    fs.stat(filePath, (err, stats) => {
        if (!err && stats.isDirectory()) {
            filePath = path.join(filePath, 'index.html');
            try {
                stats = fs.statSync(filePath);
            } catch (e) {
                err = e;
            }
        }

        if (err || !stats || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            return res.end('404 Not Found');
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, {
            'Content-Type': contentType,
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache'
        });

        fs.createReadStream(filePath).pipe(res);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Medical Trip Hub Server activo en: http://localhost:${PORT}`);
});
