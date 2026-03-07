# Crawler Locomotion Redesign

**Date:** 2026-03-07
**Scope:** Impatient Crawler scenario in `docs/plans/archie-animation-demo.html`
**Character Reference:** Hogarth from The Iron Giant — earnest, slightly clumsy, not athletic

---

## Problem

The current crawler has no locomotion animation. Archie's entire div is rotated 0/90/180/-90 degrees and slid along 4 line segments around the chat panel. No legs, no physics, no weight — just a floating ragdoll on collision detection boundaries.

---

## Design: Walking + Climbing Hybrid

Each panel edge gets its own locomotion style. Movement feels physical and character-driven.

### Edge Locomotion

| Edge | Mode | Animation | Feel |
|------|------|-----------|------|
| **Bottom** | Walk | Existing walk cycle (leg swing, arm swing, coat flap, body bob). Feet on ground. | Confident, home turf |
| **Right** | Climb up | Arm-over-arm. Right arm reaches up and grips, pulls body upward. Left arm follows. Legs push off below. Body pressed against panel edge. | Effortful, determined. Slight body sway between arm pulls |
| **Top** | Cautious shuffle | Hunched posture, shorter step keyframes, arms slightly out for balance. Occasional glance downward. | Nervous but committed |
| **Left** | Climb down | Arms grip above, body lowers, feet search for footholds. Faster than climbing up (gravity helps). | Relieved, almost done |

### Corner Transitions

Each corner gets a 0.3-0.5s transition animation:
- **Bottom-Right:** Archie reaches around the corner, pulls himself up onto the right edge
- **Right-Top:** Heaves himself over the top, brief effort
- **Top-Left:** Peers over the edge, starts lowering himself down
- **Left-Bottom:** Drops the last bit, lands with squash/settle, glasses bounce

Speed drops to near-zero during transitions, then resumes.

### Gravity-Aware Secondary Motion

A CSS custom property `--gravity-angle` is set per edge segment:
- Bottom: `0deg` (gravity pulls down, normal)
- Right (climbing): `90deg` (gravity pulls toward the wall / away from panel)
- Top: `180deg` (gravity pulls "up" relative to Archie's orientation)
- Left (descending): `270deg` (gravity pulls away from panel)

Affected elements:
- **Hair tufts** — always hang toward gravity. Uses `rotate(calc(var(--gravity-angle) + offset))` on `.a-hair::before`, `::after`, and `.a-tuft`
- **Coat flap** — follows gravity direction
- **Glasses** — slip downward relative to actual gravity (slide toward chin when climbing, ride up nose when inverted)
- **Body lean** — subtle lean toward gravity center (leaning into the wall when climbing)

---

## Signature Moments

2-3 moments trigger during the crawl loop for personality.

### 1. The Near-Slip
- **When:** Once per loop, at a random corner transition
- **Animation:** Foot slips, body drops ~8px, arms scramble to grip, pulls back up. Wide eyes + hair bounce, then relieved exhale + glasses adjust + glint
- **Cooldown:** Won't repeat for at least 2 full loops
- **Skipped when:** Typing speed is high (Archie too excited to slip)

### 2. The Peek
- **When:** Passing the chat message area (right edge, mid-climb)
- **Animation:** Pauses climbing, leans head away from wall to peek into chat panel. Eyebrows raise if user has typed. Head tilts curiously. Then resumes climbing.
- **Feel:** Hogarth peeking around a doorframe

### 3. The Breather
- **When:** Once per loop, on the top edge
- **Animation:** Stops shuffling, sits down with legs dangling over the front edge. Arm goes up to wipe brow. Looks down. After 1-2s, takes a breath, stands back up, continues shuffling.
- **Skipped when:** Typing speed is high

### Moment Rules
- Maximum one moment per edge traversal
- Skip all moments when typing speed is high (Archie too busy/excited)
- Cooldowns prevent repetition
- All moments interruptible by reset

---

## Implementation Approach

### Architecture: Stay within current system
- CSS keyframes + class toggling + per-frame JS for position
- No canvas, no external libs
- Character DOM structure unchanged
- Expression system and typing reactivity unchanged
- Other two scenarios (Journey, Dreamer) untouched

### New CSS Keyframes
- `climbUp` — arm-over-arm with body pull (right edge)
- `shuffleTop` — short cautious steps, hunched (top edge)
- `climbDown` — controlled lowering (left edge)
- `cornerBR`, `cornerRT`, `cornerTL`, `cornerLB` — corner transitions
- Gravity-responsive variants for hair, coat, glasses
- Existing `walkL`/`walkR` reused for bottom edge

### JS Changes
- Rewrite `updateCrawlerPos()` to be edge-mode-aware (apply different classes per segment)
- New `crawlFrame()` logic for corner pauses and moment triggers
- Moment system: loop counter + edge position tracking + cooldown timers
- `--gravity-angle` custom property updates per edge
- Moment sequences as async functions (pattern matches existing `startJourney()`)

### Estimated Scope
- ~300-400 lines new CSS keyframes
- ~200 lines JS rewrite of crawler system
- ~100 lines JS for signature moments
