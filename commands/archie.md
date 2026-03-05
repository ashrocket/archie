---
name: archie
description: Check the chat bridge inbox and respond as Archie, your architecture consultant. Persists learnings to archie.md.
allowed-tools: Bash(node:*, curl:*, kill:*, lsof:*), Read, Write, Edit, Grep, Glob
---

# /archie — Architecture Chat

## Usage
- `/archie` — Check inbox for new messages, respond
- `/archie start` — Start the bridge server and open browser
- `/archie stop` — Stop the bridge server

## Steps

### Parse arguments
Check if the user passed "start" or "stop" as an argument.

### If "start":
1. Check if bridge is already running: `curl -s http://localhost:${CHAT_BRIDGE_PORT:-3077}/health`
2. If not running, start it: `node ${CLAUDE_PLUGIN_ROOT}/skills/archie/bridge/server.js &`
3. Wait 1 second, verify it's up
4. Tell the user: "Bridge running on port ${port}. Add this to your HTML page:"
   ```html
   <script src="${CLAUDE_PLUGIN_ROOT}/skills/archie/bridge/widget.js"></script>
   ```
5. If there's an `archie.md` in the project, mention you have prior context

### If "stop":
1. Find the bridge process: `lsof -ti:${CHAT_BRIDGE_PORT:-3077}`
2. Kill it
3. Confirm stopped

### Default (no args) — Check and Respond:
1. Read `archie.md` from the project root if it exists — this is your accumulated knowledge
2. Read `.claude/chat/inbox.jsonl` if it exists
3. If no new messages, report "No new messages in the inbox"
4. For each message:
   a. Display it to the terminal: "From browser: {message}"
   b. Think about the answer using:
      - archie.md context
      - Project CLAUDE.md
      - Relevant source files (search as needed)
   c. Write your response to `.claude/chat/outbox.json` as `{"text": "your response"}`
   d. Clear the inbox (truncate the file)
5. If you learned something new about the architecture from this exchange, append it to `archie.md`
   - Create `archie.md` if it doesn't exist yet
   - Use the format from the archie skill
