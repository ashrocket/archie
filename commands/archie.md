---
name: archie
description: Check the chat bridge inbox and respond as Archie, your architecture consultant. Persists learnings to archie.md.
allowed-tools: Bash(node:*, curl:*, kill:*, lsof:*, open:*), Read, Write, Edit, Grep, Glob
---

# /archie — Architecture Chat

## Usage
- `/archie` — Check inbox for new messages, respond
- `/archie start` — Start the bridge server
- `/archie stop` — Stop the bridge server
- `/archie chat <file.html>` — Inject widget into the HTML file, start bridge, open in browser
- `/archie chat <topic>` — Research topic locally, generate archie.md with findings, start bridge

## Steps

### Parse arguments
Check if the user passed "start", "stop", or "chat" as the first argument.

### If "chat":
The second argument is either a file path or a topic string.

**Detect which:**
- If the argument ends in `.html` or `.htm` and the file exists → it's a file
- Otherwise → it's a topic

**If file:**
1. Read the HTML file
2. Check if it already has the widget script. If not, inject before `</body>`:
   ```html
   <script src="${CLAUDE_PLUGIN_ROOT}/skills/archie/bridge/widget.js" data-title="Archie"></script>
   ```
3. Write the modified file back
4. Start the bridge (same as "start" steps below)
5. Open the file in the browser: `open <file-path>`
6. Tell the user: "Widget injected and bridge running. Chat bubble is in the bottom-right."

**If topic:**
1. Search the local codebase for the topic using Grep and Glob:
   - Search file names matching the topic
   - Search file contents for the topic keyword
   - Read CLAUDE.md and any existing archie.md for context
2. Synthesize findings into an `archie.md` at the project root using the archie skill format:
   ```markdown
   # Project Architecture — Archie's Notes

   ## Topic: <topic>
   - [findings from codebase search]

   ## Components
   - [relevant files and their roles]

   ## Data Flow
   - [any flows related to the topic]
   ```
3. Start the bridge (same as "start" steps below)
4. Tell the user: "I've researched '<topic>' and written initial findings to archie.md. Bridge is running — open any HTML page with the widget to chat about it."

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
