# Archie CLI Design

Date: 2026-03-05

## What It Is

A Node.js CLI (`@ashrocket/archie`) that lets anyone chat with an architecture consultant through their browser — no terminal interaction required. Install via npm or brew, run `archie chat`, and a browser opens with the chat widget. Claude runs headlessly in the background.

## Architecture

```
User runs: archie chat myfile.html
  -> archie init (first run only): checks for claude, picks port, saves ~/.archie.json
  -> Starts WebSocket bridge server
  -> Spawns claude as long-running subprocess with /archie skill loaded
  -> Injects widget into HTML file if needed
  -> Opens browser
  -> Bridge broadcasts responses to all connected tabs
  -> Ctrl+C kills everything cleanly
```

## Components

| Component | Role |
|-----------|------|
| bin/archie | CLI entry point, arg parsing |
| lib/bridge.js | WebSocket bridge server |
| lib/claude.js | Spawns and manages claude subprocess |
| lib/init.js | Interactive first-run setup |
| lib/inject.js | Widget injection into HTML files |
| lib/config.js | Reads/writes ~/.archie.json |

## CLI Commands

```
archie init                  # Interactive setup (auto-runs on first use)
archie chat <file.html>      # Inject widget, start bridge + claude, open browser
archie chat <topic>          # Research topic, generate archie.md, start bridge + claude
archie stop                  # Kill any running bridge
archie --version / --help
```

## Setup Flow (archie init)

1. Check claude is on PATH — error with install instructions if not
2. Pick bridge port (default 3077)
3. Save to ~/.archie.json: { "port": 3077, "initialized": true }

## Bridge

WebSocket for browser connections, file-based bridge to claude subprocess.

- Bridge listens on WebSocket for browser connections
- Multiple tabs connect simultaneously
- Messages from any tab write to inbox, claude reads
- Claude writes to outbox, bridge broadcasts to all connected tabs
- HTTP /health endpoint stays for diagnostics
- Single inbox, broadcast outbox (no session routing)

## Claude Subprocess

- Spawn claude as long-running subprocess with Archie skill prompt
- Bridge watches outbox file for changes, broadcasts when response arrives
- Process cleanup on SIGINT/SIGTERM

## Distribution

- npm primary: npm install -g @ashrocket/archie
- brew secondary: ashrocket/homebrew-archie tap, formula wraps npm install
- Binary name: archie

## Package Structure

```
@ashrocket/archie/
+-- package.json
+-- bin/archie              # CLI entry
+-- lib/
|   +-- bridge.js           # WebSocket bridge
|   +-- claude.js           # Claude subprocess manager
|   +-- init.js             # First-run setup
|   +-- inject.js           # HTML widget injection
|   +-- config.js           # ~/.archie.json management
|   +-- widget.js           # Embedded widget (copied from plugin)
+-- Formula/archie.rb       # Homebrew formula
+-- README.md
```

## YAGNI

- No auth/login system — it's local
- No session routing — single conversation, broadcast to all tabs
- No custom Claude models — uses whatever claude defaults to
- No daemon mode — runs in foreground, Ctrl+C to stop
