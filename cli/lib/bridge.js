'use strict';

const http = require('http');
const { WebSocketServer } = require('ws');
const fs = require('fs');
const path = require('path');

function createBridge({ port, cwd }) {
  const chatDir = path.join(cwd, '.claude', 'chat');
  const inbox = path.join(chatDir, 'inbox.jsonl');
  const outbox = path.join(chatDir, 'outbox.json');
  fs.mkdirSync(chatDir, { recursive: true });

  const clients = new Set();

  const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, port, clients: clients.size, inbox, outbox }));
      return;
    }

    if (req.method === 'POST' && req.url === '/send') {
      let body = '';
      req.on('data', c => body += c);
      req.on('end', () => {
        try {
          const msg = JSON.parse(body);
          if (!msg.text) { res.writeHead(400); res.end('{"error":"text required"}'); return; }
          writeInbox(msg.text);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end('{"ok":true}');
        } catch (e) {
          res.writeHead(400); res.end(JSON.stringify({ error: e.message }));
        }
      });
      return;
    }

    if (req.method === 'GET' && req.url === '/poll') {
      try {
        if (fs.existsSync(outbox)) {
          const data = fs.readFileSync(outbox, 'utf8').trim();
          if (data) { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(data); return; }
        }
      } catch {}
      res.writeHead(204); res.end();
      return;
    }

    // Serve static files from project directory
    const filePath = path.join(cwd, req.url);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
        '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
        '.webp': 'image/webp', '.woff2': 'font/woff2' };
      res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    res.writeHead(404); res.end('not found');
  });

  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    clients.add(ws);
    ws.on('close', () => clients.delete(ws));
    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data);
        if (msg.text) writeInbox(msg.text);
      } catch {}
    });
  });

  function writeInbox(text) {
    const line = JSON.stringify({ text, ts: new Date().toISOString() }) + '\n';
    fs.appendFileSync(inbox, line);
    try { fs.unlinkSync(outbox); } catch {}
  }

  function broadcast(text) {
    const payload = JSON.stringify({ text });
    fs.writeFileSync(outbox, payload);
    for (const ws of clients) {
      if (ws.readyState === 1) ws.send(payload);
    }
  }

  function start() {
    return new Promise((resolve) => {
      server.listen(port, () => {
        console.log(`  Bridge: http://localhost:${port} (ws + http)`);
        resolve({ server, wss, broadcast });
      });
    });
  }

  function stop() {
    wss.close();
    server.close();
  }

  return { start, stop, broadcast, clients, inbox, outbox };
}

module.exports = { createBridge };
