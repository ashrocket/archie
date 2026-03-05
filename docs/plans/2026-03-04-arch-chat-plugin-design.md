# arch-chat Plugin Design

## Overview

Two-layer Claude Code plugin:
1. **chat-bridge** — Generic file-based HTTP bridge between any browser page and a Claude session
2. **archie** — Architect consultation skill + slash command that uses the bridge

## Repo Structure

```
arch-chat/
├── .claude-plugin/
│   └── plugin.json
├── skills/
│   └── archie/
│       └── SKILL.md
├── commands/
│   └── archie.md
├── lib/
│   └── chat-bridge/
│       ├── server.js
│       └── widget.js
├── templates/
│   └── arch-diagram.html
├── README.md
└── LICENSE
```

## Layer 1: Chat Bridge

### server.js
- Node.js HTTP server, zero dependencies (stdlib only)
- Configurable port (default 3077, env `CHAT_BRIDGE_PORT`)
- CORS enabled for local dev
- Endpoints:
  - `POST /send` — accepts `{ text }`, appends `{ text, ts }` to inbox JSONL
  - `GET /poll` — returns outbox JSON if present, 204 if empty
  - `GET /health` — returns `{ ok: true, port, inbox, outbox }`
- File paths:
  - Inbox: `.claude/chat/inbox.jsonl` (relative to CWD)
  - Outbox: `.claude/chat/outbox.json` (relative to CWD)
- On POST /send, deletes outbox so poll knows when new response arrives

### widget.js
- Self-contained `<script>` that injects a floating chat bubble
- Configurable: `data-port`, `data-position`, `data-title`
- Polls outbox every 2s when waiting for response
- Shows connection status (bridge online/offline)
- Minimal CSS, no external dependencies

## Layer 2: Archie

### Skill (skills/archie/SKILL.md)
- `user-invocable: false` (auto-triggered by description match)
- Description triggers on: architecture review, system design, codebase structure
- Provides system prompt context for architecture expert mode
- Reads project CLAUDE.md and key files for context

### Command (commands/archie.md)
- `/archie` — main interaction loop:
  1. Check if bridge server is running (curl health endpoint)
  2. If not running, start it with `node ${CLAUDE_PLUGIN_ROOT}/lib/chat-bridge/server.js &`
  3. Read inbox.jsonl for unprocessed messages
  4. Respond as architecture expert
  5. Write response to outbox.json
  6. Clear processed messages from inbox
- `/archie start` — just start the bridge, open template in browser
- `/archie stop` — kill the bridge server

## Data Flow

```
Browser widget → POST /send → .claude/chat/inbox.jsonl
User runs /archie → reads inbox → thinks → writes .claude/chat/outbox.json
Browser widget ← GET /poll ← outbox.json
```

## Origin

Extracted from ~/2code/trendlines/ work on KP-4524 (AR Aging Trendlines):
- `docs/chat-server.js` — original bridge server
- `docs/architecture-diagram.html` — original HTML with embedded chat widget
- `.claude/chat/` — original file protocol
