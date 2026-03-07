# Crawler Locomotion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the floating-ragdoll crawler with edge-specific locomotion (walk, climb, shuffle, descend) plus gravity-aware secondary motion and 3 signature personality moments.

**Architecture:** Single-file HTML prototype (`docs/plans/archie-animation-demo.html`). All CSS keyframes live in the `<style>` block (lines 8-1234). All JS lives in a single `<script>` block (lines 1331-2121). The character is built from CSS-styled divs. Animation states are toggled via CSS classes applied by JS. No external dependencies.

**Tech Stack:** Vanilla CSS keyframes, CSS custom properties, vanilla JS with requestAnimationFrame.

**Design doc:** `docs/plans/2026-03-07-crawler-locomotion-design.md`

---

## Task 1: Add Gravity Custom Property + Edge-Specific Locomotion Keyframes

**Files:**
- Modify: `docs/plans/archie-animation-demo.html:1112-1157` (CRAWLER MODE CSS section)

**Step 1: Add gravity custom property and edge mode classes**

Insert after the existing `.archie.crawler-mode` rules (after line 1137), replacing the existing peek/foot-tap keyframes at lines 1139-1157 with expanded versions. Keep the existing peek and footTap keyframes but add everything else.

```css
/* ═══════ GRAVITY SYSTEM ═══════ */
.archie.crawler-mode {
  --gravity-angle: 0deg;
}

/* ═══════ EDGE: BOTTOM (normal walk) ═══════ */
.archie.edge-bottom {
  --gravity-angle: 0deg;
}

/* Reuse existing walk cycle for bottom edge */
.archie.edge-bottom .a-leg--l {
  animation: walkL 0.5s ease-in-out infinite;
}
.archie.edge-bottom .a-leg--r {
  animation: walkR 0.5s ease-in-out infinite;
}
.archie.edge-bottom .a-arm--l {
  animation: armSwingL 0.5s ease-in-out infinite;
}
.archie.edge-bottom .a-arm--r {
  animation: armSwingR 0.5s ease-in-out infinite;
}
.archie.edge-bottom .a-body-wrap {
  animation: bodyBob 0.5s ease-in-out infinite;
}
.archie.edge-bottom .a-coat-flap {
  animation: coatFlap 0.5s ease-in-out infinite;
}

/* ═══════ EDGE: RIGHT (climbing up) ═══════ */
.archie.edge-right {
  --gravity-angle: 90deg;
}

.archie.edge-right .a-body-wrap {
  transform: rotate(-90deg);
}

.archie.edge-right .a-arm--r {
  animation: climbReachUp 0.8s ease-in-out infinite;
}
.archie.edge-right .a-arm--l {
  animation: climbReachUp 0.8s ease-in-out infinite 0.4s;
}
.archie.edge-right .a-leg--l {
  animation: climbPushL 0.8s ease-in-out infinite;
}
.archie.edge-right .a-leg--r {
  animation: climbPushR 0.8s ease-in-out infinite 0.4s;
}
.archie.edge-right .a-body-wrap {
  animation: climbBodyPull 0.8s ease-in-out infinite;
}
.archie.edge-right .a-coat-flap {
  transform: rotate(8deg);
  animation: climbCoatDangle 1.2s ease-in-out infinite;
}

@keyframes climbReachUp {
  0%   { transform: rotate(-15deg) translateY(0); }
  25%  { transform: rotate(-55deg) translateY(-6px); }
  50%  { transform: rotate(-40deg) translateY(-3px); }
  100% { transform: rotate(-15deg) translateY(0); }
}

@keyframes climbPushL {
  0%, 100% { transform: rotate(10deg); }
  50% { transform: rotate(-20deg) translateY(-4px); }
}

@keyframes climbPushR {
  0%, 100% { transform: rotate(-10deg); }
  50% { transform: rotate(18deg) translateY(-4px); }
}

@keyframes climbBodyPull {
  0%, 100% { transform: rotate(-90deg) translateY(0); }
  30% { transform: rotate(-90deg) translateY(-3px) scaleY(0.96); }
  60% { transform: rotate(-90deg) translateY(-1px) scaleY(1.02); }
}

@keyframes climbCoatDangle {
  0%, 100% { transform: rotate(8deg); }
  50% { transform: rotate(12deg); }
}

/* ═══════ EDGE: TOP (cautious shuffle) ═══════ */
.archie.edge-top {
  --gravity-angle: 180deg;
}

.archie.edge-top .a-body-wrap {
  transform: scaleY(0.94) translateY(3px);
}

.archie.edge-top .a-leg--l {
  animation: shuffleL 0.6s ease-in-out infinite;
}
.archie.edge-top .a-leg--r {
  animation: shuffleR 0.6s ease-in-out infinite;
}
.archie.edge-top .a-arm--l {
  transform: rotate(20deg);
  animation: balanceArmL 1.2s ease-in-out infinite;
}
.archie.edge-top .a-arm--r {
  transform: rotate(-20deg);
  animation: balanceArmR 1.2s ease-in-out infinite;
}
.archie.edge-top .a-coat-flap {
  animation: coatFlap 0.6s ease-in-out infinite;
}

@keyframes shuffleL {
  0%, 100% { transform: rotate(-6deg); }
  50% { transform: rotate(6deg); }
}

@keyframes shuffleR {
  0%, 100% { transform: rotate(6deg); }
  50% { transform: rotate(-6deg); }
}

@keyframes balanceArmL {
  0%, 100% { transform: rotate(20deg); }
  50% { transform: rotate(28deg) translateY(-2px); }
}

@keyframes balanceArmR {
  0%, 100% { transform: rotate(-20deg); }
  50% { transform: rotate(-28deg) translateY(-2px); }
}

/* ═══════ EDGE: LEFT (climbing down) ═══════ */
.archie.edge-left {
  --gravity-angle: 270deg;
}

.archie.edge-left .a-body-wrap {
  transform: rotate(90deg);
}

.archie.edge-left .a-arm--r {
  animation: descendArm 0.7s ease-in-out infinite;
}
.archie.edge-left .a-arm--l {
  animation: descendArm 0.7s ease-in-out infinite 0.35s;
}
.archie.edge-left .a-leg--l {
  animation: descendLeg 0.7s ease-in-out infinite;
}
.archie.edge-left .a-leg--r {
  animation: descendLeg 0.7s ease-in-out infinite 0.35s;
}
.archie.edge-left .a-body-wrap {
  animation: descendBody 0.7s ease-in-out infinite;
}
.archie.edge-left .a-coat-flap {
  transform: rotate(-8deg);
  animation: climbCoatDangle 1.2s ease-in-out infinite;
}

@keyframes descendArm {
  0%   { transform: rotate(-40deg) translateY(-4px); }
  50%  { transform: rotate(-15deg) translateY(0); }
  100% { transform: rotate(-40deg) translateY(-4px); }
}

@keyframes descendLeg {
  0%, 100% { transform: rotate(5deg); }
  50% { transform: rotate(-12deg) translateY(3px); }
}

@keyframes descendBody {
  0%, 100% { transform: rotate(90deg) translateY(0); }
  40% { transform: rotate(90deg) translateY(2px) scaleY(1.02); }
  70% { transform: rotate(90deg) translateY(0) scaleY(0.98); }
}
```

**Step 2: Add gravity-aware secondary motion for hair/glasses**

Insert after the edge locomotion keyframes:

```css
/* ═══════ GRAVITY-AWARE SECONDARY MOTION ═══════ */

/* Hair follows gravity — climbing: hangs sideways */
.archie.edge-right .a-hair::before {
  transform: rotate(-18deg) translateX(3px);
}
.archie.edge-right .a-hair::after {
  transform: rotate(14deg) translateX(3px);
}
.archie.edge-right .a-tuft {
  transform: translateX(-50%) rotate(-4deg) translateX(2px);
}

/* Hair — top edge: hangs "up" (away from panel) */
.archie.edge-top .a-hair::before {
  transform: rotate(-10deg) translateY(-3px);
}
.archie.edge-top .a-hair::after {
  transform: rotate(8deg) translateY(-3px);
}
.archie.edge-top .a-tuft {
  transform: translateX(-50%) rotate(-2deg) translateY(-2px);
}

/* Hair — descending: hangs opposite side */
.archie.edge-left .a-hair::before {
  transform: rotate(-18deg) translateX(-3px);
}
.archie.edge-left .a-hair::after {
  transform: rotate(14deg) translateX(-3px);
}
.archie.edge-left .a-tuft {
  transform: translateX(-50%) rotate(-4deg) translateX(-2px);
}

/* Glasses slip toward gravity */
.archie.edge-right .a-glasses {
  transform: translateX(-50%) translateY(2px) rotate(-2deg);
}
.archie.edge-top .a-glasses {
  transform: translateX(-50%) translateY(-1px) rotate(1deg);
}
.archie.edge-left .a-glasses {
  transform: translateX(-50%) translateY(2px) rotate(2deg);
}
```

**Step 3: Add corner transition keyframes**

```css
/* ═══════ CORNER TRANSITIONS ═══════ */
.archie.corner-transition .a-body-wrap {
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Bottom-right: reaching up to grab the right edge */
.archie.corner-br .a-arm--r {
  animation: cornerReachUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
@keyframes cornerReachUp {
  0% { transform: rotate(-4deg); }
  40% { transform: rotate(-65deg) translateY(-10px); }
  100% { transform: rotate(-40deg) translateY(-6px); }
}

/* Right-top: heaving over the top */
.archie.corner-rt .a-body-wrap {
  animation: cornerHeave 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
@keyframes cornerHeave {
  0% { transform: rotate(-90deg) translateY(0); }
  50% { transform: rotate(-45deg) translateY(-6px) scaleY(0.92); }
  100% { transform: rotate(0deg) translateY(0) scaleY(1); }
}

/* Top-left: peering over and lowering */
.archie.corner-tl .a-head {
  animation: cornerPeerDown 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes cornerPeerDown {
  0% { transform: translateX(-50%) rotate(0deg); }
  40% { transform: translateX(-50%) rotate(15deg) translateY(4px); }
  100% { transform: translateX(-50%) rotate(0deg); }
}

/* Left-bottom: drop and land */
.archie.corner-lb .a-body-wrap {
  animation: cornerDrop 0.4s cubic-bezier(0.4, 0, 1, 1) forwards;
}
@keyframes cornerDrop {
  0% { transform: rotate(90deg) translateY(0); }
  60% { transform: rotate(20deg) translateY(4px); }
  100% { transform: rotate(0deg) translateY(0); }
}
```

**Step 4: Add signature moment CSS**

```css
/* ═══════ SIGNATURE MOMENTS ═══════ */

/* Near-slip: body drops and scrambles */
.archie.near-slip .a-body-wrap {
  animation: slipDrop 0.6s cubic-bezier(0.4, 0, 1, 1);
}
@keyframes slipDrop {
  0% { transform: translateY(0); }
  25% { transform: translateY(10px) rotate(5deg); }
  50% { transform: translateY(8px) rotate(-3deg); }
  75% { transform: translateY(2px) rotate(1deg); }
  100% { transform: translateY(0) rotate(0deg); }
}

.archie.near-slip .a-arm--l {
  animation: slipGrab 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.archie.near-slip .a-arm--r {
  animation: slipGrab 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.08s;
}
@keyframes slipGrab {
  0% { transform: rotate(0deg); }
  30% { transform: rotate(-70deg) translateY(-12px); }
  60% { transform: rotate(-50deg) translateY(-8px); }
  100% { transform: rotate(-30deg) translateY(-4px); }
}

/* Breather: sitting on top edge */
.archie.breather .a-body-wrap {
  transform: translateY(4px);
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.archie.breather .a-leg--l {
  animation: dangle1 1.2s ease-in-out infinite;
}
.archie.breather .a-leg--r {
  animation: dangle2 1.2s ease-in-out infinite 0.3s;
}

/* Wipe brow */
.archie.wiping-brow .a-arm--r {
  animation: wipeBrow 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes wipeBrow {
  0% { transform: rotate(-4deg); }
  30% { transform: rotate(-55deg) translateY(-12px) translateX(4px); }
  70% { transform: rotate(-50deg) translateY(-10px) translateX(-2px); }
  100% { transform: rotate(-4deg); }
}
```

**Step 5: Verify CSS compiles**

Open `docs/plans/archie-animation-demo.html` in Chrome. Page should load without errors. Archie should appear at his default position next to the chat panel. No visual regressions on the other two scenarios (click "Paper Airplane" and "Idle Dreamer" to confirm).

**Step 6: Commit**

```bash
git add docs/plans/archie-animation-demo.html
git commit -m "feat(crawler): add edge locomotion keyframes, gravity system, corner transitions, moment CSS"
```

---

## Task 2: Rewrite Crawler JS — Edge-Aware Position + Locomotion Classes

**Files:**
- Modify: `docs/plans/archie-animation-demo.html:1780-1917` (SCENARIO 2 JS section)

**Step 1: Replace the entire `startCrawler()` function**

Replace lines 1783-1917 with the new edge-aware crawler system:

```javascript
// ═══════════════════════════════
// SCENARIO 2: THE IMPATIENT CRAWLER
// ═══════════════════════════════
async function startCrawler() {
  if (animating) return;
  animating = true;
  disableButtons();
  showLabel('The Impatient Crawler — type in the box to see Archie react');

  const panelRect = chatPanel.getBoundingClientRect();
  const stageRect = stage.getBoundingClientRect();

  const pLeft = panelRect.left - stageRect.left;
  const pTop = panelRect.top - stageRect.top;
  const pWidth = panelRect.width;
  const pHeight = panelRect.height;

  archie.classList.remove('at-chat');
  archie.classList.add('crawler-mode');
  archie.style.transition = 'none';

  let t = 0;
  let speed = 0.002;
  let targetSpeed = 0.002;
  let lastTyping = 0;
  let typeCount = 0;
  let loopCount = 0;
  let lastEdge = '';
  let inCornerTransition = false;
  let inMoment = false;

  // Moment cooldowns
  let lastSlipLoop = -3;
  let lastBreatherLoop = -2;
  let lastPeekT = -1;

  document.getElementById('chatInput').focus();

  function getEdge(pos) {
    if (pos < 1) return 'bottom';
    if (pos < 2) return 'right';
    if (pos < 3) return 'top';
    return 'left';
  }

  function setEdgeClass(edge) {
    ['edge-bottom', 'edge-right', 'edge-top', 'edge-left'].forEach(c =>
      archie.classList.remove(c)
    );
    archie.classList.add('edge-' + edge);
  }

  function clearCornerClasses() {
    ['corner-br', 'corner-rt', 'corner-tl', 'corner-lb', 'corner-transition'].forEach(c =>
      archie.classList.remove(c)
    );
  }

  function clearMomentClasses() {
    ['near-slip', 'breather', 'wiping-brow'].forEach(c =>
      archie.classList.remove(c)
    );
  }

  function updateCrawlerPos() {
    const pos = t % 4;
    let x, y;

    if (pos < 1) {
      // Bottom edge — walk left to right
      x = pLeft + pos * pWidth;
      y = pTop + pHeight - 10;
      archie.style.transform = '';
    } else if (pos < 2) {
      // Right edge — climb up
      const p = pos - 1;
      x = pLeft + pWidth + 5;
      y = pTop + pHeight - p * pHeight - 20;
      archie.style.transform = '';
    } else if (pos < 3) {
      // Top edge — shuffle right to left
      const p = pos - 2;
      x = pLeft + pWidth - p * pWidth - 20;
      y = pTop - 50;
      archie.style.transform = '';
    } else {
      // Left edge — climb down
      const p = pos - 3;
      x = pLeft - 45;
      y = pTop + p * pHeight - 10;
      archie.style.transform = '';
    }

    archie.style.left = x + 'px';
    archie.style.top = y + 'px';
    archie.style.right = 'auto';
    archie.style.bottom = 'auto';
  }

  // Corner transition (async, pauses crawl)
  async function doCornerTransition(cornerName) {
    inCornerTransition = true;
    archie.classList.add('corner-transition', 'corner-' + cornerName);
    glassesBounce();
    await sleep(450);
    clearCornerClasses();
    inCornerTransition = false;
  }

  // ─── SIGNATURE MOMENTS ───

  async function doNearSlip() {
    if (inMoment || speed > 0.006) return;
    inMoment = true;
    lastSlipLoop = loopCount;
    showLabel('Whoa—! Nearly slipped!');
    archie.classList.add('near-slip');
    setExpression('wide-eyed');
    setExpression('brows-raised');
    hairBounce();
    await sleep(600);
    archie.classList.remove('near-slip');
    // Relief
    setExpression('');
    adjustGlasses(400);
    flashGlint();
    await sleep(500);
    showLabel('The Impatient Crawler — type in the box to see Archie react');
    inMoment = false;
  }

  async function doPeek() {
    if (inMoment || speed > 0.006) return;
    inMoment = true;
    lastPeekT = t;
    showLabel('Peeking into the chat...');
    // Pause and lean head
    archie.classList.add('peeking');
    setExpression('brows-raised');
    await sleep(600);
    archie.classList.remove('peeking');
    // If user has typed, look curious
    if (document.getElementById('chatInput').value.length > 0) {
      archie.classList.add('looking-left');
      setExpression('excited');
      await sleep(500);
      archie.classList.remove('looking-left');
    }
    setExpression('');
    await sleep(200);
    showLabel('The Impatient Crawler — type in the box to see Archie react');
    inMoment = false;
  }

  async function doBreather() {
    if (inMoment || speed > 0.006) return;
    inMoment = true;
    lastBreatherLoop = loopCount;
    showLabel('Taking a breather...');
    archie.classList.add('breather');
    setExpression('sleepy-eyes');
    await sleep(800);
    // Wipe brow
    archie.classList.add('wiping-brow');
    await sleep(800);
    archie.classList.remove('wiping-brow');
    // Look down
    archie.classList.add('looking-left');
    setExpression('brows-worried');
    await sleep(600);
    archie.classList.remove('looking-left');
    // Stand back up
    archie.classList.remove('breather');
    setExpression('');
    squashStretch('settling', 300);
    await sleep(400);
    showLabel('The Impatient Crawler — type in the box to see Archie react');
    inMoment = false;
  }

  // ─── TYPING HANDLER ───

  const input = document.getElementById('chatInput');
  const typingHandler = () => {
    lastTyping = performance.now();
    typeCount++;
    targetSpeed = 0.008;
    setExpression('excited');

    if (typeCount > 15) {
      setExpression('wide-eyed');
      setExpression('brows-raised');
      targetSpeed = 0.012;
    }

    clearTimeout(archie._calmTimer);
    archie._calmTimer = setTimeout(() => {
      targetSpeed = 0.002;
      setExpression('');
      typeCount = 0;
      archie.classList.add('tapping');
      setTimeout(() => archie.classList.remove('tapping'), 800);
    }, 1800);
  };
  input.addEventListener('input', typingHandler);
  archie._typingHandler = typingHandler;

  // ─── MAIN CRAWL LOOP ───

  function crawlFrame(now) {
    if (inCornerTransition || inMoment) {
      crawlerRAF = requestAnimationFrame(crawlFrame);
      return;
    }

    // Smooth speed interpolation
    speed += (targetSpeed - speed) * 0.08;

    const prevEdge = getEdge(t % 4);
    t += speed;
    const pos = t % 4;
    const currentEdge = getEdge(pos);

    // Track loop completions
    if (prevEdge === 'left' && currentEdge === 'bottom') {
      loopCount++;
    }

    // Edge changed — handle transition
    if (currentEdge !== prevEdge) {
      lastEdge = prevEdge;

      // Determine corner name
      let cornerName = '';
      if (prevEdge === 'bottom' && currentEdge === 'right') cornerName = 'br';
      else if (prevEdge === 'right' && currentEdge === 'top') cornerName = 'rt';
      else if (prevEdge === 'top' && currentEdge === 'left') cornerName = 'tl';
      else if (prevEdge === 'left' && currentEdge === 'bottom') cornerName = 'lb';

      if (cornerName) {
        // Trigger near-slip randomly at corners (once per loop, with cooldown)
        const canSlip = (loopCount - lastSlipLoop) >= 2 && Math.random() < 0.3;
        if (canSlip) {
          doCornerTransition(cornerName).then(() => doNearSlip());
        } else {
          doCornerTransition(cornerName);
        }

        // Landing squash at bottom-left corner
        if (cornerName === 'lb') {
          setTimeout(() => {
            squashStretch('landing', 120);
            glassesBounce();
            hairBounce();
            setTimeout(() => squashStretch('settling', 300), 150);
          }, 450);
        }
      }

      setEdgeClass(currentEdge);
    }

    updateCrawlerPos();

    // ─── MOMENT TRIGGERS ───

    // Peek: right edge, around midpoint
    if (currentEdge === 'right' && pos > 1.4 && pos < 1.6 && (t - lastPeekT) > 2) {
      doPeek();
    }

    // Breather: top edge, around midpoint, with cooldown
    if (currentEdge === 'top' && pos > 2.3 && pos < 2.5 && (loopCount - lastBreatherLoop) >= 1) {
      doBreather();
    }

    // Occasional glasses adjust
    if (Math.random() < 0.002) {
      adjustGlasses(300);
    }

    crawlerRAF = requestAnimationFrame(crawlFrame);
  }

  // Initialize
  setEdgeClass('bottom');
  updateCrawlerPos();
  crawlerRAF = requestAnimationFrame(crawlFrame);
}
```

**Step 2: Update `resetAll()` to clean up new classes**

In the `resetAll()` function (around line 2084), after `archie.className = 'archie at-chat';` the class reset already handles everything since it replaces the entire className. But verify the typing handler cleanup still works. No code change needed — the existing reset already strips all classes.

**Step 3: Verify the crawler scenario**

Open in Chrome:
1. Click "Impatient Crawler"
2. **Bottom edge:** Archie should walk with arm swing, leg swing, coat flap, body bob
3. **Bottom-right corner:** Brief pause, reach-up animation, glasses bounce
4. **Right edge:** Arm-over-arm climbing, body pressed sideways, hair/coat dangling with gravity, legs pushing
5. **Right-top corner:** Heave-over animation
6. **Top edge:** Cautious shuffle, hunched posture, arms out for balance
7. **Top-left corner:** Peer-down animation
8. **Left edge:** Controlled descent, arms gripping above
9. **Left-bottom corner:** Drop + landing squash/settle + glasses bounce
10. Type in the input — speed should increase, expressions should change
11. Stop typing — should slow down, eventually foot tap
12. Watch for signature moments: near-slip at corners, peek on right edge, breather on top edge
13. Click "Reset" — everything resets cleanly
14. Click "Paper Airplane" and "Idle Dreamer" — no regressions

**Step 4: Commit**

```bash
git add docs/plans/archie-animation-demo.html
git commit -m "feat(crawler): rewrite crawler with edge-aware locomotion, corner transitions, signature moments"
```

---

## Task 3: Polish Pass — Tuning and Edge Cases

**Files:**
- Modify: `docs/plans/archie-animation-demo.html` (CSS + JS sections)

**Step 1: Tune animation timings in browser**

Open in Chrome with DevTools. For each edge:
- If climb looks too fast/slow, adjust keyframe duration in the CSS
- If corner transitions feel jarring, adjust the `sleep()` duration in `doCornerTransition()`
- If moments trigger too often/rarely, adjust the cooldown values and `Math.random()` thresholds
- If hair/glasses gravity offsets look wrong, tweak the `translateX`/`translateY` values

This is a visual tuning step — make adjustments based on what looks right.

**Step 2: Verify moment interruptibility**

1. Start crawler
2. Wait for a moment to trigger (near-slip, peek, or breather)
3. Click "Reset" mid-moment
4. Verify clean reset — no stuck classes, no lingering animations

**Step 3: Verify typing reactivity during moments**

1. Start crawler
2. Wait for a moment to begin
3. Start typing rapidly
4. Moments should NOT trigger while typing fast (speed > 0.006 guard)
5. After moment completes, typing reactivity should resume normally

**Step 4: Commit final tuning**

```bash
git add docs/plans/archie-animation-demo.html
git commit -m "polish(crawler): tune animation timings and moment triggers"
```

---

## Summary

| Task | What | ~Lines |
|------|------|--------|
| 1 | CSS keyframes: edge locomotion, gravity, corners, moments | ~300 |
| 2 | JS rewrite: edge-aware crawl loop + moment triggers | ~250 |
| 3 | Visual polish and timing tuning | ~20-50 tweaks |

**Total: ~3 tasks, modifying 1 file.**
