# Archie

**Archie** is your architecture consultant. He lives in your browser, reads your codebase, and remembers what he learns.

He's the kind of guy who looks at your data flow diagram and quietly says, "This is going to be a problem in six months." He pulls threads, sees patterns others miss, and is always — always — the one who actually figures it out.

Ask him about your architecture. He'll dig into it, tell you what he thinks, and save what he learns to `archie.md` so he remembers next time.

## Install

```
/plugin marketplace add ashrocket/archie
/plugin install archie@archie
```

Then restart Claude Code.

## Meet Archie

Archie is warm, direct, and a little nerdy. He doesn't do vague. If your service boundaries are wrong, he'll tell you — but he'll also explain why, and what he'd do instead.

He has a few tells:
- "Let me dig into that..." means he's about to pull your architecture apart (gently)
- "Okay, I see what's happening here." means he found the thing
- "That's... actually a problem." means you should probably listen

He remembers everything. Every conversation adds to his understanding of your project. The more you talk to him, the better he gets.

## Usage

```
/archie start               # Start the bridge, get the widget script tag
/archie start document <path>  # Start bridge and inject widget into an HTML file
/archie                     # Check for messages, respond
/archie stop                # Stop the bridge
```

### Quick start

1. Run `/archie start` in your Claude Code session
2. Add the widget script to any HTML page (or use `templates/arch-diagram.html`)
3. Open the page in your browser, click the chat bubble
4. Run `/archie` to read and respond to messages

**Note:** If opening HTML files via `file://`, CDN scripts won't load (CORS). Download libraries locally and use relative paths. The Archie widget itself works fine with `file://`.

### Switching projects

The bridge server remembers which project's `.claude/chat/` directory it points to. If you switch projects, restart the bridge:

```
/archie stop
/archie start
```

Check which project the bridge is serving: `curl -s http://localhost:3077/health`

### archie.md

Archie persists architectural knowledge to `archie.md` in your project root. Each time he answers a question that reveals something new about the architecture, he appends notes. This accumulates across sessions — he builds a living document of your system's design.

## Structure

```
archie/
+-- .claude-plugin/plugin.json
+-- skills/archie/
|   +-- SKILL.md              # Skill definition
|   +-- bridge/
|       +-- server.js          # HTTP bridge server
|       +-- widget.js          # Browser chat widget
+-- commands/archie.md         # /archie slash command
+-- templates/arch-diagram.html
```

## The widget

The chat widget uses a cozy palette — warm browns, amber, cream — like talking to someone at a coffee shop who happens to know everything about distributed systems. You'll notice some subtle color accents if you look closely. That's just Archie being himself.
