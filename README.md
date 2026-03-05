# Archie Chat Bridge - Usage Notes

## How to Start
```
/archie start
```
- Starts the bridge server on port 3077
- Injects the chat widget into the current HTML page
- The widget appears as a chat bubble in the bottom-right corner

## Key Learnings

### file:// Protocol Limitations
- When opening HTML docs via `file://`, CDN scripts (like Chart.js) will fail to load due to CORS/mixed content restrictions
- **Fix:** Download libraries locally and reference them with relative paths (e.g. `<script src="chart.min.js">`)
- The bridge widget itself loads from an absolute local path so it works fine with `file://`

### Bridge Server Scoping
- The bridge server remembers which project's `.claude/chat/` directory it points to
- If switching between projects, you need to restart the bridge (`/archie stop` then `/archie start`)
- Check with `curl -s http://localhost:3077/health` to see which inbox/outbox it's using

### Widget Injection
- Add this before `</body>` in any HTML doc you want Archie chat on:
  ```html
  <script src="/Users/ashleyraiteri/.claude/plugins/cache/archie/archie/2.0.0/skills/archie/bridge/widget.js"></script>
  ```
- The `/archie start document <path>` argument is meant to auto-inject the widget into the specified HTML file

### JS Ordering Gotcha
- When adding dynamic KPI population code to an existing script, ensure format helper functions (`fmt`, `fmtD`, `pct`) are defined **before** any code that calls them
- `const` arrow functions are NOT hoisted like `function` declarations — order matters

### archie.md
- Archie accumulates project knowledge in `archie.md` at the project root
- Created on first `/archie` interaction if it doesn't exist
- Subsequent sessions pick up where prior architecture discussions left off
