# Archie Rebrand Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rename arch-chat to archie with full creative branding — character identity, cozy nerd visual palette, Velma personality.

**Architecture:** Rename repo + directory, update all references, rewrite README and skill prompt with Archie's character, restyle widget with cozy nerd palette + trans pride accents.

**Tech Stack:** Claude Code plugin (JS bridge, markdown skills/commands, HTML template)

---

### Task 1: Rename GitHub repo and move local directory

**Step 1:** Rename repo on GitHub
```bash
cd ~/claude/arch-chat && gh repo rename archie --yes
```

**Step 2:** Update git remote
```bash
git remote set-url origin git@github.com:ashrocket/archie.git
```

**Step 3:** Move local directory
```bash
mv ~/claude/arch-chat ~/ashcode/archie
```

**Step 4:** Commit from new location (after all file changes below)

---

### Task 2: Update plugin.json and marketplace.json

**Files:**
- Modify: `.claude-plugin/plugin.json`
- Modify: `.claude-plugin/marketplace.json`

---

### Task 3: Rewrite README.md — character-forward

---

### Task 4: Update SKILL.md — full Archie personality with backstory

---

### Task 5: Update widget.js — cozy nerd palette with trans pride accents

**Palette:**
- Toggle: #C17F3A (warm honey amber)
- Panel bg: #FFF8F0 (warm cream)
- User messages: #C17F3A honey amber, white text
- Assistant messages: #F5E6C8 (light amber)
- Header/input borders: #E8D5B8
- Online dot: #5BCEFA (trans light blue)
- Send button: #C17F3A
- Focus ring: #C17F3A
- Panel border accent: #F5A9B8 (trans pink) — subtle top border
- Text: #3D2B1F (dark brown)

---

### Task 6: Update arch-diagram.html template

---

### Task 7: Update installed_plugins.json reference

---

### Task 8: Commit and push
