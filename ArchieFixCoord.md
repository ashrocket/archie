# Archie Fix Coordination

## Scope
Fix four issues identified by code review. Two agents working in parallel with divided responsibilities.

## Agent 1: code-architect — Consolidation (Issues 3 + 4)

### Issue 3: Duplicate bridge servers
- `skills/archie/bridge/server.js` (67 lines) — plugin bridge
- `cli/lib/bridge.js` (116 lines) — CLI bridge with WebSocket + static serving
- Core HTTP logic (routes, CORS, inbox/outbox file ops) is copy-pasted
- **Goal:** Single bridge implementation that both plugin and CLI can use

### Issue 4: System prompt in 3 places
- `skills/archie/SKILL.md` lines 9-25 (authoritative)
- `cli/lib/claude.js` lines 7-18
- `cli/lib/archie-responder.sh` lines 7-19
- **Goal:** Single source of truth for Archie's personality. CLI code should read from SKILL.md or a shared constant.

### Architect Changes Made
- Created `skills/archie/archie-prompt.txt` — canonical Archie personality text, single source of truth
- `skills/archie/SKILL.md` lines 9-25 replaced with reference to archie-prompt.txt + summary
- `skills/archie/bridge/server.js` rewritten as 20-line thin wrapper calling `createBridge()` from `cli/lib/bridge.js`
- `cli/lib/claude.js`: removed hardcoded SYSTEM_PROMPT; added `loadSystemPrompt()` that reads archie-prompt.txt at runtime; "Velmo" → "Velma" fixed by adopting canonical text
- `cli/lib/archie-responder.sh`: removed hardcoded SYSTEM_PROMPT + absolute paths; reads archie-prompt.txt via `cat`; uses `SCRIPT_DIR` for relative paths; appends design-exploration context suffix; "Velmo" → "Velma" fixed

---

## Agent 2: code-simplifier — Targeted Fixes (Issues 5 + 6)

### Issue 5: "Velmo" vs "Velma" typo
- SKILL.md says "Velma" (CORRECT per project memory)
- `cli/lib/claude.js` line 7: says "Velmo" (WRONG)
- `cli/lib/archie-responder.sh` line 7: says "Velmo" (WRONG)
- `templates/design-exploration.html` lines 142/148/319: says "Velmo" (WRONG)
- **Goal:** Fix all instances to "Velma"

### Issue 6: WIDGET_PATH bug
- `cli/lib/inject.js` line 6: `path.join(__dirname, '..', 'skills', 'archie', 'bridge', 'widget.js')`
- This resolves to `cli/skills/archie/bridge/widget.js` — WRONG
- Widget actually lives at `skills/archie/bridge/widget.js` (project root)
- Needs `path.join(__dirname, '..', '..', 'skills', 'archie', 'bridge', 'widget.js')`
- **Goal:** Fix the path resolution

### Simplifier Changes Made
- `templates/design-exploration.html`: Fixed "Velmo" to "Velma" on lines 142, 148, 319 (3 occurrences, replace_all)
- `cli/lib/inject.js`: Fixed WIDGET_PATH on line 6 — added second `'..'` so path resolves from `cli/lib/` up to project root (`../../skills/archie/bridge/widget.js` instead of `../skills/...`)

---

## Coordination Rules
- Agent 1 owns: `skills/archie/bridge/server.js`, `cli/lib/bridge.js`, `cli/lib/claude.js`, `cli/lib/archie-responder.sh`
- Agent 2 owns: `cli/lib/inject.js`, `templates/design-exploration.html`
- If Agent 1 touches `cli/lib/claude.js` or `archie-responder.sh` for the prompt consolidation, it should also fix the Velmo→Velma typo in those files (since it's editing them anyway)
- Agent 2 only needs to fix Velmo→Velma in `templates/design-exploration.html` (the non-overlapping file)
