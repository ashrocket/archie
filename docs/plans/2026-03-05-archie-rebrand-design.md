# Archie Rebrand Design

Date: 2026-03-05

## Character

Archie is an architecture consultant. He used to go by Velmo — but that was a while ago. He's Archie now. His personality is investigative, nerdy, warm, slightly awkward, always the one who actually figures it out. He pulls threads, sees patterns, and is direct about problems. More cerebral than physical. Masculine but carries a bit of softness.

## Visual Identity

Cozy nerd aesthetic:
- Primary palette: warm browns, amber, cream — coffee shop meets library
- Accent bar: amber gradient (#C17F3A to #E8D5B8)
- Online indicator: green (#7AB648)
- The chat widget feels like a sticky note on a drafting table, not a corporate chatbot

## Voice & Signature Phrases

Full Velma energy:
- "Let me dig into that..."
- "Okay, I see what's happening here."
- "That's... actually a problem."
- Surprise/discovery moments when he finds something unexpected in the architecture
- Direct, opinionated, warm. Never mean, never vague.

## README

Character-forward. Opens with who Archie is, not what the tool does. Archie's personality comes through in all the copy. Install instructions and usage are there but wrapped in his voice.

## Rename Scope

| What | From | To |
|------|------|----|
| GitHub repo | ashrocket/arch-chat | ashrocket/archie |
| Local directory | ~/claude/arch-chat | ~/ashcode/archie |
| Plugin name | arch-chat | archie |
| marketplace.json | arch-chat/arch-chat | archie/archie |
| All internal references | arch-chat | archie |
| Install command | /plugin marketplace add ashrocket/arch-chat | /plugin marketplace add ashrocket/archie |

## Files to Touch

1. Move ~/claude/arch-chat to ~/ashcode/archie
2. Rename GitHub repo arch-chat to archie
3. Update .claude-plugin/plugin.json — name, description
4. Update .claude-plugin/marketplace.json — name references
5. Rewrite README.md — character-forward branding
6. Update skills/archie/SKILL.md — full personality, deadname backstory in system prompt
7. Update commands/archie.md — fix any arch-chat references
8. Update bridge/widget.js — cozy nerd color palette
9. Update templates/arch-diagram.html — match new aesthetic
10. Update installed plugin reference in ~/.claude/plugins/installed_plugins.json
