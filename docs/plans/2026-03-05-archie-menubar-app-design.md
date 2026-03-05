# Archie Menu Bar App Design

Date: 2026-03-05

## What It Is

A native macOS menu bar app that is the primary way people interact with Archie. It sits in the status bar, provides a chat popover via WKWebView, manages the bridge server, and lets you open HTML documents with the Archie widget injected. Archie is an animated character that roams your screen — a desktop pet that happens to be an architecture consultant.

The CLI (`@ashrocket/archie`) remains as a power-user/scripting tool. The menu bar app is the product.

## Architecture

```
User clicks menu bar icon
  -> Popover opens with chat (WKWebView rendering widget.js)
  -> BridgeManager spawns Node.js bridge subprocess (v1)
  -> Bridge spawns claude subprocess
  -> WebSocket connects popover to bridge
  -> User chats with Archie through the popover or via browser document
  -> ArchieAnimator drives the desktop pet in a floating NSWindow
```

### Evolution Path

| Version | Bridge | Claude | Dependencies |
|---------|--------|--------|-------------|
| v1 (A) | Node.js subprocess | Via CLI bridge | Node.js + claude CLI |
| v2 (B) | Swift native (NIO/Network.framework) | Shell out to `claude --print` | claude CLI only |
| v3 (C) | Swift native, bundled | Bundled or API-direct | Zero external deps |

### Key Abstraction

```swift
protocol BridgeManaging {
    var isRunning: Bool { get }
    var port: Int { get }
    func start(cwd: String) async throws
    func stop()
    func onStatusChange(_ handler: @escaping (Bool) -> Void)
}
```

v1 implements `CLIBridgeManager` (spawns Node). v2 swaps in `NativeBridgeManager`. The rest of the app doesn't change.

## Components

| Component | Role |
|-----------|------|
| `ArchieApp.swift` | @main, NSApplication delegate, LSUIElement (no dock icon) |
| `StatusBarController.swift` | NSStatusItem with Archie icon, left-click/right-click handling |
| `PopoverChat.swift` | NSPopover containing WKWebView that loads widget.js |
| `BridgeManager.swift` | Protocol + CLIBridgeManager — spawns/monitors bridge subprocess |
| `DocumentPicker.swift` | NSOpenPanel for HTML files, widget injection, opens in browser |
| `ArchieAnimator.swift` | Manages position, animation state, movement paths |
| `ArchieSprite.swift` | Renders sprite frames in a floating transparent NSWindow |
| `AnimationState.swift` | Enum of animation states with sprite sheet references |

## Menu Bar Interaction

**Left-click:** Opens chat popover (~320x480pt). WKWebView loads widget.html which bootstraps widget.js. Widget connects to bridge via WebSocket.

**Right-click:** Context menu:
- Open Document... (NSOpenPanel, .html/.htm filter)
- Recent Documents (submenu)
- Bridge: Running / Bridge: Stopped (click toggles)
- ---
- Launch at Login (toggle, via SMAppService)
- Quit Archie

## Animated Character (Desktop Pet)

Archie is a small animated character rendered in a borderless, transparent, click-through NSWindow that floats above everything.

### Animation States

| State | Trigger | Behavior |
|-------|---------|----------|
| `.idle` | Default | Sits on menu bar, scribbles in notebook, adjusts glasses |
| `.walking` | Periodic / transitions | Walks along menu bar or screen edge |
| `.thinking` | Waiting for Claude response | Paces, taps chin, flips through papers |
| `.excited` | Response arrives | Snaps fingers, points at popover |
| `.examining` | User opens document | Pulls out magnifying glass, peers at screen |
| `.waving` | Bridge start/stop | Waves hello or goodbye, walks on/off screen |

### Technical Approach

- Sprite-sheet animation (lightweight PNGs or Lottie vector)
- CALayer-based sprite renderer stepping through frames on a timer
- Separate floating NSWindow (`level: .floating`, `ignoresMouseEvents: true`)
- Movement paths are Bezier curves between anchor points (menu bar icon, popover edge, screen corners)
- Position tracked independently of popover state

## Popover Chat

- WKWebView loads a thin `widget.html` that includes widget.js with `data-port` and `data-title="Archie"` attributes
- Widget connects to bridge via WebSocket (same protocol as browser)
- Chat state persists while popover is hidden — reopening shows history
- Clicking outside dismisses the popover (standard NSPopover)

## Document Flow

1. User clicks "Open Document..." in context menu
2. NSOpenPanel opens, filtered to .html/.htm
3. Selected file gets widget script tag injected (if not already present)
4. File opens in default browser
5. Bridge restarts pointing at the document's project directory
6. Archie walks along menu bar toward browser, hops off-screen

## Bridge Subprocess (v1)

- Spawns `node <bundled-cli-path>/lib/bridge.js --port 3077 --cwd <project-dir>`
- Monitors subprocess — restarts on crash (max 3 retries, then surface error)
- Reads stdout/stderr for logging
- `stop()` sends SIGTERM, waits 2s, SIGKILL if needed
- Health check: pings `http://localhost:{port}/health` every 5 seconds
- Port and config from shared `~/.archie.json`

## Project Structure

```
archie/
+-- cli/                        # Existing Node.js CLI (moved from root)
|   +-- package.json
|   +-- bin/archie.js
|   +-- lib/
+-- app/                        # macOS menu bar app
|   +-- Archie.xcodeproj
|   +-- Archie/
|   |   +-- ArchieApp.swift
|   |   +-- StatusBarController.swift
|   |   +-- PopoverChat.swift
|   |   +-- BridgeManager.swift
|   |   +-- DocumentPicker.swift
|   |   +-- Animator/
|   |   |   +-- ArchieAnimator.swift
|   |   |   +-- ArchieSprite.swift
|   |   |   +-- AnimationState.swift
|   |   +-- Resources/
|   |       +-- widget.html
|   |       +-- sprites/
|   |       +-- Assets.xcassets
|   +-- Archie.entitlements
+-- skills/                     # Plugin skills (existing)
+-- commands/                   # Plugin commands (existing)
+-- docs/plans/
+-- README.md
```

## Distribution

- **Direct download:** Notarized .app in a .dmg
- **Homebrew cask:** `brew install --cask archie`
- **CLI (separate):** `npm install -g @ashrocket/archie`

## Config

Shared `~/.archie.json` between app and CLI:
```json
{
  "port": 3077,
  "initialized": true
}
```

## v1 Scope

- Menu bar icon with animated states
- Chat popover (WKWebView + widget.js)
- Open document flow (inject widget, open in browser)
- Start/stop bridge from menu
- Desktop pet (Archie roams, basic sprite animations)
- Archie skill only (plugin system designed for, not built)
- Launch at login

## YAGNI (v1)

- No plugin/skill picker UI
- No preferences window (port config via CLI or direct JSON edit)
- No multi-project switching UI (restart bridge by opening a new document)
- No custom themes or character skins
- No App Store distribution (direct + Homebrew only)
