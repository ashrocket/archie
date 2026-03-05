# arch-chat

Claude Code plugin with **Archie** — an architecture consultant that chats from your browser and remembers what it learns.

## What it does

Open an HTML page in your browser. Click the chat bubble. Ask architecture questions. Archie responds from your Claude Code terminal session and saves what it learns to `archie.md` in your project.

## Install

```
/install-plugin ashrocket/arch-chat
```

## Usage

```
/archie start   # Start the bridge, get the widget script tag
/archie          # Check for messages, respond
/archie stop     # Stop the bridge
```

### Quick start

1. Run `/archie start` in your Claude Code session
2. Add the widget script to any HTML page (or use `templates/arch-diagram.html`)
3. Open the page in your browser, click the chat bubble
4. Run `/archie` to read and respond to messages

### archie.md

Archie persists architectural knowledge to `archie.md` in your project root. Each time it answers a question that reveals something new about the architecture, it appends notes. This accumulates across sessions.

## Structure

```
arch-chat/
├── .claude-plugin/plugin.json
├── skills/archie/
│   ├── SKILL.md              # Skill definition
│   └── bridge/               # (implementation detail)
│       ├── server.js          # HTTP bridge server
│       └── widget.js          # Browser chat widget
├── commands/archie.md         # /archie slash command
└── templates/arch-diagram.html
```
