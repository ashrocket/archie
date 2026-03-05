const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.CHAT_BRIDGE_PORT || '3077', 10);
const CHAT_DIR = path.join(process.cwd(), '.claude', 'chat');
const INBOX = path.join(CHAT_DIR, 'inbox.jsonl');
const OUTBOX = path.join(CHAT_DIR, 'outbox.json');

fs.mkdirSync(CHAT_DIR, { recursive: true });

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, port: PORT, inbox: INBOX, outbox: OUTBOX }));
    return;
  }

  if (req.method === 'POST' && req.url === '/send') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const msg = JSON.parse(body);
        if (!msg.text) { res.writeHead(400); res.end('{"error":"text required"}'); return; }
        const line = JSON.stringify({ text: msg.text, ts: new Date().toISOString() }) + '\n';
        fs.appendFileSync(INBOX, line);
        try { fs.unlinkSync(OUTBOX); } catch (e) { /* no outbox yet */ }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{"ok":true}');
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  if (req.method === 'GET' && req.url === '/poll') {
    try {
      if (fs.existsSync(OUTBOX)) {
        const data = fs.readFileSync(OUTBOX, 'utf8').trim();
        if (data) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(data);
          return;
        }
      }
    } catch (e) { /* no response yet */ }
    res.writeHead(204); res.end();
    return;
  }

  res.writeHead(404); res.end('not found');
});

server.listen(PORT, () => {
  console.log(`Chat bridge on http://localhost:${PORT}`);
  console.log(`Inbox:  ${INBOX}`);
  console.log(`Outbox: ${OUTBOX}`);
});
