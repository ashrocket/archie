# Archie CLI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Node.js CLI (`@ashrocket/archie`) that runs Claude headlessly via subprocess, serves a WebSocket bridge, and opens a browser chat widget — all from one command.

**Architecture:** CLI spawns a `claude --print --input-format stream-json --output-format stream-json` subprocess with Archie's system prompt. A WebSocket bridge connects browser tabs to that subprocess. Multiple tabs broadcast from one Claude session. Config stored in `~/.archie.json`.

**Tech Stack:** Node.js (no build step), `ws` package for WebSocket, `commander` for CLI args, `open` for browser launch. Claude CLI as subprocess via `child_process.spawn`.

---

### Task 1: Scaffold package.json and bin entry

**Files:**
- Create: `package.json`
- Create: `bin/archie.js`

**Step 1: Create package.json**

```json
{
  "name": "@ashrocket/archie",
  "version": "1.0.0",
  "description": "Archie — your architecture consultant. Chat with him through your browser.",
  "license": "MIT",
  "author": "ashrocket",
  "bin": {
    "archie": "./bin/archie.js"
  },
  "files": [
    "bin/",
    "lib/",
    "widget/"
  ],
  "dependencies": {
    "commander": "^12.0.0",
    "open": "^10.0.0",
    "ws": "^8.16.0"
  },
  "engines": {
    "node": ">=18"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/ashrocket/archie.git"
  }
}
```

**Step 2: Create bin/archie.js stub**

```js
#!/usr/bin/env node
'use strict';

const { program } = require('commander');
const pkg = require('../package.json');

program
  .name('archie')
  .description('Archie — your architecture consultant')
  .version(pkg.version);

program
  .command('init')
  .description('Set up Archie (auto-runs on first use)')
  .action(() => console.log('TODO: init'));

program
  .command('chat [target]')
  .description('Start Archie — opens browser chat widget')
  .action((target) => console.log('TODO: chat', target));

program
  .command('stop')
  .description('Stop any running Archie bridge')
  .action(() => console.log('TODO: stop'));

program.parse();
```

**Step 3: Install deps and verify**

Run: `cd ~/ashcode/archie && npm install`
Run: `node bin/archie.js --version`
Expected: `1.0.0`
Run: `node bin/archie.js --help`
Expected: Shows commands (init, chat, stop)

**Step 4: Commit**

```bash
git add package.json package-lock.json bin/archie.js
git commit -m "feat: scaffold CLI with package.json and bin entry"
```

---

### Task 2: Config module

**Files:**
- Create: `lib/config.js`

**Step 1: Create lib/config.js**

```js
'use strict';

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(require('os').homedir(), '.archie.json');
const DEFAULTS = { port: 3077, initialized: false };

function load() {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

function save(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n');
}

module.exports = { load, save, CONFIG_PATH };
```

**Step 2: Quick smoke test**

Run: `node -e "const c = require('./lib/config'); console.log(c.load())"`
Expected: `{ port: 3077, initialized: false }`

**Step 3: Commit**

```bash
git add lib/config.js
git commit -m "feat: add config module for ~/.archie.json"
```

---

### Task 3: Init module

**Files:**
- Create: `lib/init.js`
- Modify: `bin/archie.js` — wire up init command

**Step 1: Create lib/init.js**

```js
'use strict';

const { execSync } = require('child_process');
const readline = require('readline');
const config = require('./config');

async function ask(rl, question, fallback) {
  return new Promise(resolve => {
    rl.question(question, answer => resolve(answer.trim() || fallback));
  });
}

async function init() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log('\n  Archie — Architecture Consultant Setup\n');

  // Check claude
  try {
    const ver = execSync('claude --version', { encoding: 'utf8' }).trim();
    console.log(`  Found claude: ${ver}`);
  } catch {
    console.error('  Error: claude CLI not found on PATH.');
    console.error('  Install: npm install -g @anthropic-ai/claude-code');
    rl.close();
    process.exit(1);
  }

  const port = await ask(rl, `  Bridge port [3077]: `, '3077');

  const cfg = { port: parseInt(port, 10), initialized: true };
  config.save(cfg);
  console.log(`\n  Config saved to ${config.CONFIG_PATH}`);
  console.log('  Run: archie chat <file.html> to start\n');

  rl.close();
  return cfg;
}

async function ensureInit() {
  const cfg = config.load();
  if (!cfg.initialized) {
    console.log('  First run detected — running setup...');
    return init();
  }
  return cfg;
}

module.exports = { init, ensureInit };
```

**Step 2: Wire into bin/archie.js**

Replace the init action:
```js
program
  .command('init')
  .description('Set up Archie (auto-runs on first use)')
  .action(async () => {
    const { init } = require('../lib/init');
    await init();
  });
```

**Step 3: Test**

Run: `node bin/archie.js init`
Expected: Prompts for port, saves config, confirms

**Step 4: Commit**

```bash
git add lib/init.js bin/archie.js
git commit -m "feat: add interactive init with claude check"
```

---

### Task 4: WebSocket bridge

**Files:**
- Create: `lib/bridge.js`

This replaces the plugin's HTTP-polling `server.js` with a WebSocket server for the CLI.

**Step 1: Create lib/bridge.js**

```js
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

  // HTTP server for /health endpoint
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

    // Legacy HTTP POST /send for backward compat with plugin widget
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

    // Legacy HTTP GET /poll for backward compat with plugin widget
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

    res.writeHead(404); res.end('not found');
  });

  // WebSocket server
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
    // Write outbox for legacy HTTP polling
    fs.writeFileSync(outbox, payload);
    // Broadcast to WebSocket clients
    for (const ws of clients) {
      if (ws.readyState === 1) ws.send(payload);
    }
  }

  // Watch outbox for responses from claude subprocess
  let watching = false;
  function watchOutbox() {
    if (watching) return;
    watching = true;
    const dir = chatDir;
    fs.watch(dir, (event, filename) => {
      if (filename === 'outbox.json') {
        try {
          const data = JSON.parse(fs.readFileSync(outbox, 'utf8'));
          if (data.text) {
            for (const ws of clients) {
              if (ws.readyState === 1) ws.send(JSON.stringify(data));
            }
          }
        } catch {}
      }
    });
  }

  function start() {
    return new Promise((resolve) => {
      server.listen(port, () => {
        console.log(`  Bridge: http://localhost:${port} (${clients.size} clients)`);
        watchOutbox();
        resolve({ server, wss, broadcast });
      });
    });
  }

  function stop() {
    wss.close();
    server.close();
  }

  return { start, stop, broadcast, clients };
}

module.exports = { createBridge };
```

**Step 2: Quick test**

Run: `node -e "const b = require('./lib/bridge'); b.createBridge({port:3077,cwd:process.cwd()}).start().then(()=>console.log('ok')).then(()=>process.exit())"`
Expected: Prints bridge URL then exits

**Step 3: Commit**

```bash
git add lib/bridge.js
git commit -m "feat: add WebSocket bridge with HTTP fallback"
```

---

### Task 5: Claude subprocess manager

**Files:**
- Create: `lib/claude.js`

**Step 1: Create lib/claude.js**

The key insight: we use `claude --print` per message (not persistent subprocess) with `--system-prompt` and `--append-system-prompt` to inject Archie's personality and archie.md context. Context persists via archie.md, which Archie writes to after each interaction.

One claude process at a time. Each browser message spawns one `claude --print` call, waits for completion, broadcasts the result.

```js
'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const SYSTEM_PROMPT = `You are Archie, an architecture consultant. You used to go by Velmo — but that was a while ago. You're Archie now, and Archie fits better.

Your personality is investigative, warm, a little nerdy. More cerebral than physical. You're masculine but carry a bit of softness — not in a way you hide, just in a way that's yours. You're the one who actually figures things out. You pull threads other people walk past. You see the pattern before anyone else does. You're direct about problems but never cruel.

Your voice:
- "Let me dig into that..." — when investigating
- "Okay, I see what's happening here." — when you've found the thing
- "That's... actually a problem." — when something needs fixing
- You're warm, slightly awkward sometimes, but always confident in your analysis
- Keep it concise — this is a chat, not a lecture

After answering, if you learned something new about the architecture, append it to archie.md in the project root.`;

function createClaude({ cwd }) {
  let busy = false;
  const queue = [];

  function getContext() {
    const archieFile = path.join(cwd, 'archie.md');
    try {
      return fs.readFileSync(archieFile, 'utf8');
    } catch {
      return '';
    }
  }

  async function ask(text) {
    if (busy) {
      return new Promise((resolve) => queue.push({ text, resolve }));
    }
    busy = true;

    try {
      const result = await runClaude(text);
      return result;
    } finally {
      busy = false;
      if (queue.length > 0) {
        const next = queue.shift();
        next.resolve(ask(next.text));
      }
    }
  }

  function runClaude(text) {
    return new Promise((resolve, reject) => {
      const context = getContext();
      const args = [
        '--print',
        '--system-prompt', SYSTEM_PROMPT,
      ];
      if (context) {
        args.push('--append-system-prompt', `\n\nHere are your accumulated architecture notes:\n\n${context}`);
      }
      args.push(text);

      const proc = spawn('claude', args, {
        cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env },
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (d) => stdout += d);
      proc.stderr.on('data', (d) => stderr += d);

      proc.on('close', (code) => {
        if (code === 0) {
          resolve(stdout.trim());
        } else {
          reject(new Error(`claude exited ${code}: ${stderr}`));
        }
      });

      proc.on('error', reject);
    });
  }

  return { ask };
}

module.exports = { createClaude };
```

**Step 2: Quick test**

Run: `node -e "const c = require('./lib/claude'); const cl = c.createClaude({cwd:process.cwd()}); cl.ask('What is 2+2? Reply in one word.').then(console.log)"`
Expected: Archie-voiced response with "four" or similar

**Step 3: Commit**

```bash
git add lib/claude.js
git commit -m "feat: add claude subprocess manager with queuing"
```

---

### Task 6: Widget injection and embedded widget

**Files:**
- Create: `lib/inject.js`
- Create: `widget/widget.js` (copy from `skills/archie/bridge/widget.js`)

**Step 1: Copy widget**

```bash
mkdir -p widget
cp skills/archie/bridge/widget.js widget/widget.js
```

**Step 2: Create lib/inject.js**

```js
'use strict';

const fs = require('fs');
const path = require('path');

const WIDGET_PATH = path.join(__dirname, '..', 'widget', 'widget.js');
const SCRIPT_TAG = '<script src="WIDGET_PATH" data-title="Archie"></script>';

function inject(htmlPath, port) {
  const abs = path.resolve(htmlPath);
  if (!fs.existsSync(abs)) {
    throw new Error(`File not found: ${abs}`);
  }

  let html = fs.readFileSync(abs, 'utf8');

  // Already has widget?
  if (html.includes('widget.js') && html.includes('data-title')) {
    return { path: abs, injected: false };
  }

  const tag = `  <script src="${WIDGET_PATH}" data-port="${port}" data-title="Archie"></script>`;

  if (html.includes('</body>')) {
    html = html.replace('</body>', `${tag}\n</body>`);
  } else {
    html += `\n${tag}\n`;
  }

  fs.writeFileSync(abs, html);
  return { path: abs, injected: true };
}

module.exports = { inject, WIDGET_PATH };
```

**Step 3: Commit**

```bash
git add lib/inject.js widget/widget.js
git commit -m "feat: add widget injection and embedded widget"
```

---

### Task 7: Wire everything together in bin/archie.js

**Files:**
- Modify: `bin/archie.js`

**Step 1: Rewrite bin/archie.js with full wiring**

```js
#!/usr/bin/env node
'use strict';

const { program } = require('commander');
const pkg = require('../package.json');

program
  .name('archie')
  .description('Archie — your architecture consultant')
  .version(pkg.version);

program
  .command('init')
  .description('Set up Archie (auto-runs on first use)')
  .action(async () => {
    const { init } = require('../lib/init');
    await init();
  });

program
  .command('chat [target]')
  .description('Start Archie — chat <file.html> or chat <topic>')
  .action(async (target) => {
    const { ensureInit } = require('../lib/init');
    const { createBridge } = require('../lib/bridge');
    const { createClaude } = require('../lib/claude');
    const { inject } = require('../lib/inject');
    const fs = require('fs');
    const path = require('path');

    const cfg = await ensureInit();
    const cwd = process.cwd();

    // Start bridge
    const bridge = createBridge({ port: cfg.port, cwd });
    await bridge.start();

    // Start claude
    const claude = createClaude({ cwd });
    console.log('  Claude: ready (Archie personality loaded)');

    // Handle incoming messages from bridge
    const chatDir = path.join(cwd, '.claude', 'chat');
    const inbox = path.join(chatDir, 'inbox.jsonl');

    // Poll inbox for messages (works with both WebSocket and HTTP clients)
    const pollInterval = setInterval(async () => {
      try {
        if (!fs.existsSync(inbox)) return;
        const lines = fs.readFileSync(inbox, 'utf8').trim().split('\n').filter(Boolean);
        if (lines.length === 0) return;

        // Clear inbox
        fs.writeFileSync(inbox, '');

        for (const line of lines) {
          const msg = JSON.parse(line);
          console.log(`  From browser: ${msg.text}`);

          try {
            const response = await claude.ask(msg.text);
            console.log(`  Archie: ${response.slice(0, 80)}${response.length > 80 ? '...' : ''}`);
            bridge.broadcast(response);
          } catch (e) {
            const errMsg = `Sorry, I hit an error: ${e.message}`;
            bridge.broadcast(errMsg);
          }
        }
      } catch {}
    }, 1000);

    // Handle target argument
    if (target) {
      const isHtml = /\.html?$/i.test(target) && fs.existsSync(target);

      if (isHtml) {
        const result = inject(target, cfg.port);
        if (result.injected) {
          console.log(`  Widget injected into ${target}`);
        } else {
          console.log(`  Widget already present in ${target}`);
        }

        const open = require('open');
        await open(path.resolve(target));
        console.log(`  Browser opened`);
      } else {
        // Topic mode — tell claude to research it
        console.log(`  Researching topic: ${target}`);
        try {
          const response = await claude.ask(
            `Research the topic "${target}" in this codebase. Look at relevant files, understand the architecture around it, and write your findings to archie.md. Then summarize what you found.`
          );
          console.log(`  Archie: ${response.slice(0, 120)}...`);
          bridge.broadcast(response);
        } catch (e) {
          console.error(`  Research failed: ${e.message}`);
        }
      }
    }

    console.log(`\n  Archie is listening. Open an HTML page with the widget to chat.`);
    console.log(`  Press Ctrl+C to stop.\n`);

    // Cleanup on exit
    function cleanup() {
      clearInterval(pollInterval);
      bridge.stop();
      console.log('\n  Archie stopped.');
      process.exit(0);
    }

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
  });

program
  .command('stop')
  .description('Stop any running Archie bridge')
  .action(() => {
    const { execSync } = require('child_process');
    const config = require('../lib/config');
    const cfg = config.load();
    try {
      const pid = execSync(`lsof -ti:${cfg.port}`, { encoding: 'utf8' }).trim();
      if (pid) {
        process.kill(parseInt(pid, 10));
        console.log(`  Stopped bridge on port ${cfg.port} (pid ${pid})`);
      }
    } catch {
      console.log(`  No bridge running on port ${cfg.port}`);
    }
  });

program.parse();
```

**Step 2: Test the full flow**

Run: `node bin/archie.js chat`
Expected: Bridge starts, shows "Archie is listening", waits for Ctrl+C

**Step 3: Commit**

```bash
git add bin/archie.js
git commit -m "feat: wire CLI commands — chat, init, stop"
```

---

### Task 8: Homebrew formula

**Files:**
- Create: `Formula/archie.rb`

**Step 1: Create Formula/archie.rb**

```ruby
class Archie < Formula
  desc "Archie — your architecture consultant. Chat through your browser."
  homepage "https://github.com/ashrocket/archie"
  url "https://registry.npmjs.org/@ashrocket/archie/-/archie-1.0.0.tgz"
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", *std_npm_args
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    assert_match "1.0.0", shell_output("#{bin}/archie --version")
  end
end
```

**Step 2: Commit**

```bash
git add Formula/archie.rb
git commit -m "feat: add Homebrew formula"
```

---

### Task 9: Update README for CLI usage

**Files:**
- Modify: `README.md` — add CLI installation and usage section

Add a new section after the plugin install section covering:
- `npm install -g @ashrocket/archie`
- `brew tap ashrocket/archie && brew install archie`
- `archie init` / `archie chat` / `archie stop` commands
- Note that CLI runs Claude headlessly (no terminal needed)

**Step 1: Add CLI section to README**

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add CLI installation and usage to README"
```

---

### Task 10: End-to-end test

**Step 1: Full smoke test**

```bash
cd ~/ashcode/archie
node bin/archie.js init
node bin/archie.js chat templates/arch-diagram.html
# Browser should open with arch-diagram.html
# Chat widget should appear
# Type a message in the widget
# Check terminal for "From browser:" and "Archie:" output
# Ctrl+C to stop
```

**Step 2: Verify stop command**

```bash
node bin/archie.js stop
```
Expected: "No bridge running" (since we just stopped)

**Step 3: Final commit and push**

```bash
git push origin main
```
