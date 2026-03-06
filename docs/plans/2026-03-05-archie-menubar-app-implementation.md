# Archie Menu Bar App Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a native macOS menu bar app in Swift that hosts Archie — a document conversation platform with an animated desktop pet character. The app manages a Node.js bridge subprocess, provides a chat popover via WKWebView, and lets users open HTML documents with the chat widget injected.

**Architecture:** Swift executable using AppKit (NSStatusItem + NSPopover + WKWebView). v1 spawns the existing Node.js bridge (skills/archie/bridge/server.js) as a subprocess. The chat widget (widget.js) runs inside a WKWebView popover — same code the browser uses. The desktop pet is a floating transparent NSWindow with programmatically drawn sprites. Built with Swift Package Manager, packaged into .app bundle via build script.

**Tech Stack:** Swift 6.2 / AppKit / WebKit / Foundation. Swift Package Manager (no Xcode required — CLI tools only). Node.js for the bridge subprocess (v1). Build script for .app bundle assembly.

**Key files to understand before starting:**
- `skills/archie/bridge/server.js` — the HTTP bridge server (POST /send, GET /poll, GET /health). Uses `process.cwd()` for chat directory, `CHAT_BRIDGE_PORT` env var for port.
- `skills/archie/bridge/widget.js` — self-contained `<script>` that injects chat UI. Connects via HTTP polling to bridge. Configured by `data-port`, `data-position`, `data-title` attributes.
- `templates/arch-diagram.html` — example HTML page with widget script tag.
- `lib/config.js` / `lib/init.js` — CLI config module reading `~/.archie.json`.

---

### Task 1: Restructure repo — move CLI code to cli/

**Files:**
- Move: `bin/` -> `cli/bin/`
- Move: `lib/` -> `cli/lib/`
- Move: `package.json` -> `cli/package.json`
- Move: `package-lock.json` -> `cli/package-lock.json`
- Move: `node_modules/` -> `cli/node_modules/`

**Step 1: Move files**

```bash
mkdir -p cli
git mv bin cli/bin
git mv lib cli/lib
git mv package.json cli/package.json
git mv package-lock.json cli/package-lock.json
# node_modules is gitignored, just move it
mv node_modules cli/node_modules 2>/dev/null || true
```

**Step 2: Update cli/package.json bin path**

The `bin` field still points to `./bin/archie.js` — that's correct since it's relative to package.json's location. No change needed.

**Step 3: Update cli/bin/archie.js require paths**

The requires (`../lib/init`, `../lib/config`) are relative to bin/ — since both moved into cli/, relative paths are unchanged. No change needed.

**Step 4: Verify CLI still works**

Run: `cd cli && node bin/archie.js --version`
Expected: `1.0.0`

Run: `cd cli && node bin/archie.js --help`
Expected: Shows commands (init, chat, stop)

**Step 5: Commit**

```bash
git add -A
git commit -m "refactor: move CLI code to cli/ subdirectory"
```

---

### Task 2: Scaffold Swift package

**Files:**
- Create: `app/Package.swift`
- Create: `app/Sources/Archie/main.swift`
- Create: `app/Sources/Archie/Resources/widget.html`
- Create: `app/Sources/Archie/Resources/Info.plist`

**Step 1: Create Package.swift**

```swift
// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "Archie",
    platforms: [.macOS(.v13)],
    targets: [
        .executableTarget(
            name: "Archie",
            path: "Sources/Archie",
            resources: [
                .copy("Resources")
            ]
        ),
        .testTarget(
            name: "ArchieTests",
            dependencies: ["Archie"],
            path: "Tests/ArchieTests"
        )
    ]
)
```

**Step 2: Create minimal main.swift**

```swift
import AppKit

print("Archie menu bar app starting...")
let app = NSApplication.shared
app.setActivationPolicy(.accessory) // No dock icon
app.run()
```

**Step 3: Create widget.html**

This is the thin HTML wrapper that loads widget.js inside the WKWebView popover. It must load widget.js from the bridge server (since WKWebView has restrictions on local file access for scripts loaded via src).

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #FFF8F0; overflow: hidden; }
  /* Override widget positioning for popover — fill the frame instead of fixed position */
  .cb-toggle { display: none !important; }
  .cb-panel {
    position: static !important;
    width: 100% !important;
    max-height: 100vh !important;
    height: 100vh !important;
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    display: flex !important;
  }
  .cb-msgs { max-height: none !important; flex: 1 !important; }
</style>
</head>
<body>
<script id="archie-widget" data-port="ARCHIE_PORT" data-title="Archie"></script>
<script>
  // Widget.js content will be injected by PopoverChat via WKWebView evaluateJavaScript
  // The ARCHIE_PORT placeholder is replaced at runtime by Swift
</script>
</body>
</html>
```

**Step 4: Create Info.plist**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleName</key>
    <string>Archie</string>
    <key>CFBundleDisplayName</key>
    <string>Archie</string>
    <key>CFBundleIdentifier</key>
    <string>com.ashrocket.archie</string>
    <key>CFBundleVersion</key>
    <string>1.0.0</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundleExecutable</key>
    <string>Archie</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>LSUIElement</key>
    <true/>
    <key>LSMinimumSystemVersion</key>
    <string>13.0</string>
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsLocalNetworking</key>
        <true/>
    </dict>
</dict>
</plist>
```

Note: `LSUIElement = true` makes it a menu bar agent (no dock icon). `NSAllowsLocalNetworking` allows WKWebView to connect to localhost bridge.

**Step 5: Create empty test file**

Create `app/Tests/ArchieTests/ArchieTests.swift`:
```swift
import Testing

@Test func placeholder() {
    #expect(true)
}
```

**Step 6: Build and verify**

Run: `cd app && swift build 2>&1`
Expected: Compiles successfully. Warnings about concurrency are OK.

Run: `cd app && swift run &; sleep 2; kill %1`
Expected: Prints "Archie menu bar app starting..." and runs as a process (no dock icon).

**Step 7: Commit**

```bash
git add app/
git commit -m "feat: scaffold Swift package for menu bar app"
```

---

### Task 3: App shell — AppDelegate + StatusBarController

**Files:**
- Create: `app/Sources/Archie/AppDelegate.swift`
- Create: `app/Sources/Archie/StatusBarController.swift`
- Modify: `app/Sources/Archie/main.swift`

**Step 1: Create AppDelegate.swift**

```swift
import AppKit

class AppDelegate: NSObject, NSApplicationDelegate {
    private var statusBarController: StatusBarController?

    func applicationDidFinishLaunching(_ notification: Notification) {
        statusBarController = StatusBarController()
    }
}
```

**Step 2: Create StatusBarController.swift**

This creates the menu bar icon. Left-click will toggle the popover (wired in Task 6). Right-click shows the context menu (wired in Task 7). For now, just show the icon.

```swift
import AppKit

class StatusBarController {
    private let statusItem: NSStatusItem

    init() {
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.squareLength)

        if let button = statusItem.button {
            // Use SF Symbol for menu bar icon — "building.columns" for architecture
            if let image = NSImage(systemSymbolName: "building.columns", accessibilityDescription: "Archie") {
                image.isTemplate = true // Adapts to light/dark mode
                button.image = image
            } else {
                button.title = "A"
            }
            button.action = #selector(handleClick)
            button.target = self
            button.sendAction(on: [.leftMouseUp, .rightMouseUp])
        }
    }

    @objc private func handleClick() {
        guard let event = NSApp.currentEvent else { return }
        if event.type == .rightMouseUp {
            showContextMenu()
        } else {
            togglePopover()
        }
    }

    private func togglePopover() {
        // TODO: wire up in Task 6
        print("Left-click: toggle popover")
    }

    private func showContextMenu() {
        // TODO: wire up in Task 7
        print("Right-click: show context menu")
    }
}
```

**Step 3: Update main.swift**

```swift
import AppKit

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.accessory)
app.run()
```

**Step 4: Build and verify**

Run: `cd app && swift build 2>&1`
Expected: Compiles.

Run: `cd app && swift run &`
Expected: An icon appears in the menu bar. Clicking it prints to terminal. Kill with `kill %1`.

**Step 5: Commit**

```bash
git add app/Sources/
git commit -m "feat: add AppDelegate and StatusBarController with menu bar icon"
```

---

### Task 4: Config — reads ~/.archie.json

**Files:**
- Create: `app/Sources/Archie/Config.swift`
- Create: `app/Tests/ArchieTests/ConfigTests.swift`

**Step 1: Write the failing test**

```swift
import Testing
import Foundation
@testable import Archie

@Test func configLoadsDefaults() {
    let config = Config.load(from: "/tmp/archie-test-nonexistent.json")
    #expect(config.port == 3077)
    #expect(config.initialized == false)
}

@Test func configLoadsFromFile() throws {
    let tmp = "/tmp/archie-config-test.json"
    let json = #"{"port": 4000, "initialized": true}"#
    try json.write(toFile: tmp, atomically: true, encoding: .utf8)
    defer { try? FileManager.default.removeItem(atPath: tmp) }

    let config = Config.load(from: tmp)
    #expect(config.port == 4000)
    #expect(config.initialized == true)
}
```

**Step 2: Run test to verify it fails**

Run: `cd app && swift test 2>&1`
Expected: FAIL — `Config` type not found.

**Step 3: Implement Config.swift**

```swift
import Foundation

struct Config: Codable {
    var port: Int
    var initialized: Bool

    static let defaultPath = NSHomeDirectory() + "/.archie.json"
    static let defaults = Config(port: 3077, initialized: false)

    static func load(from path: String? = nil) -> Config {
        let filePath = path ?? defaultPath
        guard let data = FileManager.default.contents(atPath: filePath),
              let config = try? JSONDecoder().decode(Config.self, from: data) else {
            return defaults
        }
        return config
    }
}
```

**Step 4: Run test to verify it passes**

Run: `cd app && swift test 2>&1`
Expected: All tests PASS.

**Step 5: Commit**

```bash
git add app/Sources/Archie/Config.swift app/Tests/ArchieTests/ConfigTests.swift
git commit -m "feat: add Config module for ~/.archie.json"
```

---

### Task 5: BridgeManager — protocol + CLIBridgeManager

**Files:**
- Create: `app/Sources/Archie/BridgeManager.swift`
- Create: `app/Tests/ArchieTests/BridgeManagerTests.swift`

The BridgeManager spawns `node skills/archie/bridge/server.js` as a subprocess. It reads port from Config and sets `CHAT_BRIDGE_PORT` env var and cwd on the subprocess.

**Step 1: Write the failing tests**

```swift
import Testing
import Foundation
@testable import Archie

@Test func bridgeManagerStartsWithCorrectPort() async throws {
    let manager = CLIBridgeManager(port: 13077, bridgeScriptPath: "/nonexistent/server.js")
    #expect(manager.port == 13077)
    #expect(manager.isRunning == false)
}

@Test func bridgeManagerHealthCheckURL() {
    let manager = CLIBridgeManager(port: 4000, bridgeScriptPath: "/tmp/server.js")
    #expect(manager.healthURL.absoluteString == "http://localhost:4000/health")
}
```

**Step 2: Run test to verify it fails**

Run: `cd app && swift test 2>&1`
Expected: FAIL — types not found.

**Step 3: Implement BridgeManager.swift**

```swift
import Foundation

protocol BridgeManaging {
    var isRunning: Bool { get }
    var port: Int { get }
    func start(cwd: String) throws
    func stop()
    func onStatusChange(_ handler: @escaping (Bool) -> Void)
}

class CLIBridgeManager: BridgeManaging {
    let port: Int
    let healthURL: URL
    private let bridgeScriptPath: String
    private var process: Process?
    private var statusHandler: ((Bool) -> Void)?
    private var healthTimer: Timer?
    private var restartCount = 0
    private let maxRestarts = 3
    private(set) var isRunning = false

    init(port: Int, bridgeScriptPath: String) {
        self.port = port
        self.bridgeScriptPath = bridgeScriptPath
        self.healthURL = URL(string: "http://localhost:\(port)/health")!
    }

    func start(cwd: String) throws {
        guard !isRunning else { return }

        let proc = Process()
        proc.executableURL = URL(fileURLWithPath: "/usr/bin/env")
        proc.arguments = ["node", bridgeScriptPath]
        proc.currentDirectoryURL = URL(fileURLWithPath: cwd)
        proc.environment = ProcessInfo.processInfo.environment.merging(
            ["CHAT_BRIDGE_PORT": String(port)],
            uniquingKeysWith: { _, new in new }
        )

        // Capture stderr for debugging
        let errPipe = Pipe()
        proc.standardError = errPipe
        proc.standardOutput = FileHandle.nullDevice

        proc.terminationHandler = { [weak self] p in
            DispatchQueue.main.async {
                self?.handleTermination(exitCode: p.terminationStatus, cwd: cwd)
            }
        }

        try proc.run()
        self.process = proc
        self.isRunning = true
        self.restartCount = 0
        statusHandler?(true)
        startHealthCheck()
    }

    func stop() {
        healthTimer?.invalidate()
        healthTimer = nil
        guard let proc = process, proc.isRunning else {
            isRunning = false
            statusHandler?(false)
            return
        }
        proc.terminate()
        // Give it 2 seconds, then force kill
        DispatchQueue.global().asyncAfter(deadline: .now() + 2) { [weak self] in
            if proc.isRunning {
                proc.interrupt() // SIGINT
            }
            DispatchQueue.main.async {
                self?.isRunning = false
                self?.statusHandler?(false)
            }
        }
    }

    func onStatusChange(_ handler: @escaping (Bool) -> Void) {
        statusHandler = handler
    }

    private func handleTermination(exitCode: Int32, cwd: String) {
        isRunning = false
        statusHandler?(false)

        if restartCount < maxRestarts {
            restartCount += 1
            try? start(cwd: cwd)
        }
    }

    private func startHealthCheck() {
        healthTimer = Timer.scheduledTimer(withTimeInterval: 5.0, repeats: true) { [weak self] _ in
            self?.checkHealth()
        }
    }

    private func checkHealth() {
        let task = URLSession.shared.dataTask(with: healthURL) { [weak self] data, response, error in
            let ok = (response as? HTTPURLResponse)?.statusCode == 200
            DispatchQueue.main.async {
                let wasRunning = self?.isRunning ?? false
                self?.isRunning = ok
                if wasRunning != ok {
                    self?.statusHandler?(ok)
                }
            }
        }
        task.resume()
    }
}
```

**Step 4: Run tests to verify they pass**

Run: `cd app && swift test 2>&1`
Expected: All tests PASS.

**Step 5: Commit**

```bash
git add app/Sources/Archie/BridgeManager.swift app/Tests/ArchieTests/BridgeManagerTests.swift
git commit -m "feat: add BridgeManager protocol and CLIBridgeManager"
```

---

### Task 6: PopoverChat — WKWebView + widget.js in NSPopover

**Files:**
- Create: `app/Sources/Archie/PopoverChat.swift`
- Modify: `app/Sources/Archie/StatusBarController.swift` — wire popover to left-click
- Modify: `app/Sources/Archie/AppDelegate.swift` — pass bridge info

**Step 1: Create PopoverChat.swift**

The popover loads widget.html from bundled resources, then injects widget.js content into the WKWebView via JavaScript. This sidesteps WKWebView's local file loading restrictions.

```swift
import AppKit
import WebKit

class PopoverChat: NSObject {
    let popover = NSPopover()
    private var webView: WKWebView!
    private let port: Int

    init(port: Int) {
        self.port = port
        super.init()
        setupWebView()
        setupPopover()
    }

    private func setupWebView() {
        let config = WKWebViewConfiguration()
        config.preferences.setValue(true, forKey: "developerExtrasEnabled")

        webView = WKWebView(frame: NSRect(x: 0, y: 0, width: 320, height: 480), configuration: config)
        webView.navigationDelegate = self
    }

    private func setupPopover() {
        let vc = NSViewController()
        vc.view = webView
        vc.preferredContentSize = NSSize(width: 320, height: 480)
        popover.contentViewController = vc
        popover.behavior = .transient // Closes on click outside
        popover.animates = true
    }

    func loadChat() {
        // Load the widget HTML with the correct port
        guard let htmlURL = Bundle.module.url(forResource: "widget", withExtension: "html", subdirectory: "Resources") else {
            // Fallback: try Bundle.main
            if let mainURL = Bundle.main.url(forResource: "widget", withExtension: "html") {
                loadHTMLFromURL(mainURL)
                return
            }
            loadFallbackHTML()
            return
        }
        loadHTMLFromURL(htmlURL)
    }

    private func loadHTMLFromURL(_ url: URL) {
        do {
            var html = try String(contentsOf: url, encoding: .utf8)
            html = html.replacingOccurrences(of: "ARCHIE_PORT", with: String(port))
            webView.loadHTMLString(html, baseURL: URL(string: "http://localhost:\(port)"))
        } catch {
            loadFallbackHTML()
        }
    }

    private func loadFallbackHTML() {
        let html = """
        <!DOCTYPE html>
        <html><body style="background:#FFF8F0;font-family:Georgia,serif;padding:20px;color:#3D2B1F">
        <p>Bridge not available on port \(port).</p>
        <p>Start the bridge first, then reopen this popover.</p>
        </body></html>
        """
        webView.loadHTMLString(html, baseURL: nil)
    }

    func toggle(relativeTo button: NSView) {
        if popover.isShown {
            popover.close()
        } else {
            loadChat()
            popover.show(relativeTo: button.bounds, of: button, preferredEdge: .minY)
        }
    }
}

extension PopoverChat: WKNavigationDelegate {
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        // After HTML loads, inject widget.js content from the bridge server
        let injectScript = """
        (function() {
            if (document.getElementById('archie-widget-loaded')) return;
            var s = document.createElement('script');
            s.src = 'http://localhost:\(port)/widget.js';
            s.setAttribute('data-port', '\(port)');
            s.setAttribute('data-title', 'Archie');
            s.id = 'archie-widget-loaded';
            document.body.appendChild(s);

            // If bridge serves widget.js, great. If not, fetch from known path.
            s.onerror = function() {
                // Fallback: show error in chat area
                document.body.innerHTML = '<div style="padding:20px;font-family:Georgia;color:#3D2B1F">' +
                    '<p>Could not load Archie widget.</p>' +
                    '<p>Make sure the bridge is running on port \(port).</p></div>';
            };
        })();
        """
        webView.evaluateJavaScript(injectScript, completionHandler: nil)
    }
}
```

**Important note about widget.js loading:** The current bridge server.js does NOT serve static files (only /send, /poll, /health). The widget.js injection approach above won't work as-is because there's no endpoint serving widget.js. Two solutions:

**Option A (recommended for v1):** Inline the widget.js content directly into widget.html at build time, or have PopoverChat read the widget.js file from the bundled resources and inject it via `evaluateJavaScript`.

**Option B:** Add a static file serving endpoint to server.js.

Use **Option A** — replace the `didFinish` navigation delegate method:

```swift
func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
    // Read widget.js from bundled resources and inject it
    let widgetURL = Bundle.module.url(forResource: "widget", withExtension: "js", subdirectory: "Resources")
        ?? Bundle.main.url(forResource: "widget", withExtension: "js")

    guard let url = widgetURL, let widgetJS = try? String(contentsOf: url, encoding: .utf8) else {
        return
    }
    webView.evaluateJavaScript(widgetJS, completionHandler: nil)
}
```

This requires copying widget.js into app resources (Step 2 below).

**Step 2: Copy widget.js into app resources**

```bash
cp skills/archie/bridge/widget.js app/Sources/Archie/Resources/widget.js
```

**Step 3: Update StatusBarController to wire popover**

```swift
import AppKit

class StatusBarController {
    private let statusItem: NSStatusItem
    private let popoverChat: PopoverChat

    init(port: Int) {
        self.statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.squareLength)
        self.popoverChat = PopoverChat(port: port)

        if let button = statusItem.button {
            if let image = NSImage(systemSymbolName: "building.columns", accessibilityDescription: "Archie") {
                image.isTemplate = true
                button.image = image
            } else {
                button.title = "A"
            }
            button.action = #selector(handleClick)
            button.target = self
            button.sendAction(on: [.leftMouseUp, .rightMouseUp])
        }
    }

    @objc private func handleClick() {
        guard let event = NSApp.currentEvent, let button = statusItem.button else { return }
        if event.type == .rightMouseUp {
            showContextMenu()
        } else {
            popoverChat.toggle(relativeTo: button)
        }
    }

    private func showContextMenu() {
        // TODO: wire up in Task 7
        print("Right-click: show context menu")
    }
}
```

**Step 4: Update AppDelegate to pass port**

```swift
import AppKit

class AppDelegate: NSObject, NSApplicationDelegate {
    private var statusBarController: StatusBarController?

    func applicationDidFinishLaunching(_ notification: Notification) {
        let config = Config.load()
        statusBarController = StatusBarController(port: config.port)
    }
}
```

**Step 5: Build and verify**

Run: `cd app && swift build 2>&1`
Expected: Compiles.

Run: `cd app && swift run &`
Manual: Click the menu bar icon. A popover should appear (it will show fallback HTML since no bridge is running). Click outside to dismiss. Kill with `kill %1`.

**Step 6: Commit**

```bash
git add app/Sources/
git commit -m "feat: add PopoverChat with WKWebView and wire to status bar"
```

---

### Task 7: Context menu + DocumentPicker

**Files:**
- Create: `app/Sources/Archie/DocumentPicker.swift`
- Modify: `app/Sources/Archie/StatusBarController.swift` — add right-click context menu
- Modify: `app/Sources/Archie/AppDelegate.swift` — add BridgeManager wiring

**Step 1: Create DocumentPicker.swift**

Handles opening HTML files, injecting the widget script, and opening in the default browser.

```swift
import AppKit
import Foundation

class DocumentPicker {
    private let port: Int
    private let widgetScriptPath: String

    init(port: Int, widgetScriptPath: String) {
        self.port = port
        self.widgetScriptPath = widgetScriptPath
    }

    func pickAndOpen() {
        let panel = NSOpenPanel()
        panel.allowedContentTypes = [.html]
        panel.allowsMultipleSelection = false
        panel.canChooseDirectories = false
        panel.message = "Choose an HTML file to chat with Archie"

        guard panel.runModal() == .OK, let url = panel.url else { return }
        openDocument(at: url)
    }

    func openDocument(at url: URL) {
        injectWidget(into: url)
        NSWorkspace.shared.open(url)
    }

    private func injectWidget(into url: URL) {
        guard var html = try? String(contentsOf: url, encoding: .utf8) else { return }

        // Already has widget?
        if html.contains("widget.js") && html.contains("data-title") {
            return
        }

        let tag = "  <script src=\"\(widgetScriptPath)\" data-port=\"\(port)\" data-title=\"Archie\"></script>"

        if html.contains("</body>") {
            html = html.replacingOccurrences(of: "</body>", with: "\(tag)\n</body>")
        } else {
            html += "\n\(tag)\n"
        }

        try? html.write(to: url, atomically: true, encoding: .utf8)
    }

    /// Returns the directory containing the HTML file (used as project cwd for bridge)
    static func projectDirectory(for url: URL) -> String {
        // Walk up to find a directory containing .git, CLAUDE.md, or package.json
        var dir = url.deletingLastPathComponent()
        for _ in 0..<10 {
            let gitPath = dir.appendingPathComponent(".git").path
            let claudePath = dir.appendingPathComponent("CLAUDE.md").path
            if FileManager.default.fileExists(atPath: gitPath) ||
               FileManager.default.fileExists(atPath: claudePath) {
                return dir.path
            }
            let parent = dir.deletingLastPathComponent()
            if parent.path == dir.path { break }
            dir = parent
        }
        // Fallback to the file's directory
        return url.deletingLastPathComponent().path
    }
}
```

**Step 2: Update StatusBarController with context menu and bridge**

```swift
import AppKit

class StatusBarController {
    private let statusItem: NSStatusItem
    private let popoverChat: PopoverChat
    private let bridgeManager: CLIBridgeManager
    private let documentPicker: DocumentPicker
    private var bridgeStatusItem: NSMenuItem?

    init(port: Int, bridgeManager: CLIBridgeManager, widgetScriptPath: String) {
        self.statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.squareLength)
        self.popoverChat = PopoverChat(port: port)
        self.bridgeManager = bridgeManager
        self.documentPicker = DocumentPicker(port: port, widgetScriptPath: widgetScriptPath)

        if let button = statusItem.button {
            if let image = NSImage(systemSymbolName: "building.columns", accessibilityDescription: "Archie") {
                image.isTemplate = true
                button.image = image
            } else {
                button.title = "A"
            }
            button.action = #selector(handleClick)
            button.target = self
            button.sendAction(on: [.leftMouseUp, .rightMouseUp])
        }

        bridgeManager.onStatusChange { [weak self] running in
            self?.updateBridgeStatus(running)
        }
    }

    @objc private func handleClick() {
        guard let event = NSApp.currentEvent, let button = statusItem.button else { return }
        if event.type == .rightMouseUp {
            showContextMenu()
        } else {
            popoverChat.toggle(relativeTo: button)
        }
    }

    private func showContextMenu() {
        let menu = NSMenu()

        // Open Document
        let openItem = NSMenuItem(title: "Open Document...", action: #selector(openDocument), keyEquivalent: "o")
        openItem.target = self
        menu.addItem(openItem)

        // Recent Documents (placeholder for now)
        menu.addItem(NSMenuItem.separator())

        // Bridge status
        let bridgeTitle = bridgeManager.isRunning ? "Bridge: Running" : "Bridge: Stopped"
        let bridgeItem = NSMenuItem(title: bridgeTitle, action: #selector(toggleBridge), keyEquivalent: "")
        bridgeItem.target = self
        if bridgeManager.isRunning {
            bridgeItem.state = .on
        }
        bridgeStatusItem = bridgeItem
        menu.addItem(bridgeItem)

        menu.addItem(NSMenuItem.separator())

        // Launch at Login
        let loginItem = NSMenuItem(title: "Launch at Login", action: #selector(toggleLaunchAtLogin), keyEquivalent: "")
        loginItem.target = self
        menu.addItem(loginItem)

        menu.addItem(NSMenuItem.separator())

        // Quit
        let quitItem = NSMenuItem(title: "Quit Archie", action: #selector(quit), keyEquivalent: "q")
        quitItem.target = self
        menu.addItem(quitItem)

        statusItem.menu = menu
        statusItem.button?.performClick(nil)
        statusItem.menu = nil // Reset so left-click works again
    }

    @objc private func openDocument() {
        documentPicker.pickAndOpen()
    }

    @objc private func toggleBridge() {
        if bridgeManager.isRunning {
            bridgeManager.stop()
        } else {
            let cwd = NSHomeDirectory() // Default to home — updated when document opens
            try? bridgeManager.start(cwd: cwd)
        }
    }

    @objc private func toggleLaunchAtLogin() {
        // Uses SMAppService (macOS 13+)
        if #available(macOS 13.0, *) {
            import ServiceManagement
            let service = SMAppService.mainApp
            do {
                if service.status == .enabled {
                    try service.unregister()
                } else {
                    try service.register()
                }
            } catch {
                print("Launch at login error: \(error)")
            }
        }
    }

    @objc private func quit() {
        bridgeManager.stop()
        NSApp.terminate(nil)
    }

    private func updateBridgeStatus(_ running: Bool) {
        // Update icon appearance
        if let button = statusItem.button {
            // Could add a dot overlay here for running state
            button.appearsDisabled = !running
        }
    }
}
```

**Note:** The `import ServiceManagement` inside a method won't compile — it must be at the top of the file. Fix:

```swift
import AppKit
import ServiceManagement
```

And the `toggleLaunchAtLogin` becomes:
```swift
@objc private func toggleLaunchAtLogin() {
    let service = SMAppService.mainApp
    do {
        if service.status == .enabled {
            try service.unregister()
        } else {
            try service.register()
        }
    } catch {
        print("Launch at login error: \(error)")
    }
}
```

**Step 3: Update AppDelegate with full wiring**

```swift
import AppKit

class AppDelegate: NSObject, NSApplicationDelegate {
    private var statusBarController: StatusBarController?
    private var bridgeManager: CLIBridgeManager?

    func applicationDidFinishLaunching(_ notification: Notification) {
        let config = Config.load()

        // Find the bridge server.js — check bundled resources, then repo paths
        let bridgePath = findBridgeScript()
        let widgetPath = findWidgetScript()

        let bridge = CLIBridgeManager(port: config.port, bridgeScriptPath: bridgePath)
        self.bridgeManager = bridge

        statusBarController = StatusBarController(
            port: config.port,
            bridgeManager: bridge,
            widgetScriptPath: widgetPath
        )
    }

    func applicationWillTerminate(_ notification: Notification) {
        bridgeManager?.stop()
    }

    private func findBridgeScript() -> String {
        // 1. Bundled in .app
        if let url = Bundle.main.url(forResource: "server", withExtension: "js") {
            return url.path
        }
        // 2. Relative to executable (development)
        let devPath = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent() // Sources/Archie
            .deletingLastPathComponent() // Sources
            .deletingLastPathComponent() // app
            .appendingPathComponent("skills/archie/bridge/server.js")
            .path
        if FileManager.default.fileExists(atPath: devPath) {
            return devPath
        }
        // 3. Fallback — assume it's in the repo root relative to cwd
        return "skills/archie/bridge/server.js"
    }

    private func findWidgetScript() -> String {
        if let url = Bundle.main.url(forResource: "widget", withExtension: "js") {
            return url.path
        }
        let devPath = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .appendingPathComponent("skills/archie/bridge/widget.js")
            .path
        if FileManager.default.fileExists(atPath: devPath) {
            return devPath
        }
        return "skills/archie/bridge/widget.js"
    }
}
```

**Step 4: Build and verify**

Run: `cd app && swift build 2>&1`
Expected: Compiles.

Run: `cd app && swift run &`
Manual: Right-click menu bar icon → see context menu with Open Document, Bridge status, Launch at Login, Quit. Kill with `kill %1`.

**Step 5: Commit**

```bash
git add app/Sources/
git commit -m "feat: add context menu, DocumentPicker, and bridge wiring"
```

---

### Task 8: AnimationState enum

**Files:**
- Create: `app/Sources/Archie/Animator/AnimationState.swift`
- Create: `app/Tests/ArchieTests/AnimationStateTests.swift`

**Step 1: Write the failing tests**

```swift
import Testing
@testable import Archie

@Test func idleIsDefaultState() {
    let state = AnimationState.idle
    #expect(state.frameCount > 0)
    #expect(state.frameDuration > 0)
}

@Test func thinkingTriggeredByWaiting() {
    let next = AnimationState.idle.transition(on: .waitingForResponse)
    #expect(next == .thinking)
}

@Test func excitedTriggeredByResponse() {
    let next = AnimationState.thinking.transition(on: .responseReceived)
    #expect(next == .excited)
}

@Test func excitedReturnsToIdle() {
    let next = AnimationState.excited.transition(on: .animationComplete)
    #expect(next == .idle)
}
```

**Step 2: Run tests to verify failure**

Run: `cd app && swift test 2>&1`
Expected: FAIL — `AnimationState` not found.

**Step 3: Implement AnimationState.swift**

```swift
import Foundation

enum AnimationEvent {
    case waitingForResponse
    case responseReceived
    case documentOpened
    case bridgeStarted
    case bridgeStopped
    case animationComplete
    case startWalking
}

enum AnimationState: Equatable {
    case idle
    case walking
    case thinking
    case excited
    case examining
    case waving

    var frameCount: Int {
        switch self {
        case .idle: return 4
        case .walking: return 6
        case .thinking: return 4
        case .excited: return 3
        case .examining: return 4
        case .waving: return 4
        }
    }

    var frameDuration: TimeInterval {
        switch self {
        case .idle: return 0.8
        case .walking: return 0.15
        case .thinking: return 0.5
        case .excited: return 0.2
        case .examining: return 0.6
        case .waving: return 0.3
        }
    }

    /// Whether this state loops or plays once and transitions
    var loops: Bool {
        switch self {
        case .idle, .walking, .thinking: return true
        case .excited, .examining, .waving: return false
        }
    }

    func transition(on event: AnimationEvent) -> AnimationState {
        switch (self, event) {
        case (_, .waitingForResponse): return .thinking
        case (_, .responseReceived): return .excited
        case (_, .documentOpened): return .examining
        case (_, .bridgeStarted): return .waving
        case (_, .bridgeStopped): return .waving
        case (_, .startWalking): return .walking
        case (.excited, .animationComplete): return .idle
        case (.examining, .animationComplete): return .idle
        case (.waving, .animationComplete): return .idle
        case (.walking, .animationComplete): return .idle
        case (_, .animationComplete): return .idle
        }
    }
}
```

**Step 4: Run tests to verify they pass**

Run: `cd app && swift test 2>&1`
Expected: All tests PASS.

**Step 5: Commit**

```bash
git add app/Sources/Archie/Animator/AnimationState.swift app/Tests/ArchieTests/AnimationStateTests.swift
git commit -m "feat: add AnimationState enum with transitions"
```

---

### Task 9: ArchieSprite — floating transparent window with programmatic drawing

**Files:**
- Create: `app/Sources/Archie/Animator/ArchieSprite.swift`

The sprite is drawn programmatically using Core Graphics — no external image assets needed for v1. Archie is a simple character: circle head, rectangular body, glasses, tiny details. Each animation state changes colors and pose.

**Step 1: Create ArchieSprite.swift**

```swift
import AppKit

class ArchieSprite {
    let window: NSWindow
    private let spriteView: SpriteView
    private let spriteSize = NSSize(width: 32, height: 48)

    init() {
        spriteView = SpriteView(frame: NSRect(origin: .zero, size: spriteSize))

        window = NSWindow(
            contentRect: NSRect(origin: .zero, size: spriteSize),
            styleMask: .borderless,
            backing: .buffered,
            defer: false
        )
        window.isOpaque = false
        window.backgroundColor = .clear
        window.level = .floating
        window.ignoresMouseEvents = true
        window.collectionBehavior = [.canJoinAllSpaces, .transient]
        window.hasShadow = false
        window.contentView = spriteView
    }

    func show(at point: NSPoint) {
        window.setFrameOrigin(point)
        window.orderFront(nil)
    }

    func hide() {
        window.orderOut(nil)
    }

    func moveTo(_ point: NSPoint) {
        window.setFrameOrigin(point)
    }

    func setState(_ state: AnimationState, frame: Int) {
        spriteView.currentState = state
        spriteView.currentFrame = frame
        spriteView.needsDisplay = true
    }

    var position: NSPoint {
        return window.frame.origin
    }

    var size: NSSize {
        return spriteSize
    }
}

/// Draws Archie as a simple programmatic character
private class SpriteView: NSView {
    var currentState: AnimationState = .idle
    var currentFrame: Int = 0

    override func draw(_ dirtyRect: NSRect) {
        guard let ctx = NSGraphicsContext.current?.cgContext else { return }

        let w = bounds.width
        let h = bounds.height

        // Colors
        let skinColor = CGColor(red: 0.96, green: 0.87, blue: 0.73, alpha: 1) // warm beige
        let shirtColor: CGColor
        let pantsColor = CGColor(red: 0.25, green: 0.2, blue: 0.15, alpha: 1) // dark brown
        let hairColor = CGColor(red: 0.35, green: 0.22, blue: 0.1, alpha: 1) // brown hair
        let glassesColor = CGColor(red: 0.76, green: 0.5, blue: 0.23, alpha: 1) // amber #C17F3A

        switch currentState {
        case .idle:
            shirtColor = CGColor(red: 0.76, green: 0.5, blue: 0.23, alpha: 1) // amber shirt
        case .thinking:
            shirtColor = CGColor(red: 0.48, green: 0.56, blue: 0.69, alpha: 1) // muted blue
        case .excited:
            shirtColor = CGColor(red: 0.48, green: 0.71, blue: 0.29, alpha: 1) // green
        case .examining:
            shirtColor = CGColor(red: 0.58, green: 0.44, blue: 0.65, alpha: 1) // purple
        case .walking:
            shirtColor = CGColor(red: 0.76, green: 0.5, blue: 0.23, alpha: 1) // amber
        case .waving:
            shirtColor = CGColor(red: 0.76, green: 0.5, blue: 0.23, alpha: 1) // amber
        }

        // Wobble offset for animation
        let wobble: CGFloat = currentFrame % 2 == 0 ? 0 : 1

        // -- Body (pants) --
        ctx.setFillColor(pantsColor)
        ctx.fill(CGRect(x: w * 0.3, y: 0, width: w * 0.4, height: h * 0.25))

        // -- Torso (shirt) --
        ctx.setFillColor(shirtColor)
        ctx.fill(CGRect(x: w * 0.25, y: h * 0.25, width: w * 0.5, height: h * 0.3))

        // -- Head --
        ctx.setFillColor(skinColor)
        let headSize = w * 0.5
        let headX = (w - headSize) / 2 + wobble
        let headY = h * 0.55
        ctx.fillEllipse(in: CGRect(x: headX, y: headY, width: headSize, height: headSize * 1.1))

        // -- Hair --
        ctx.setFillColor(hairColor)
        ctx.fillEllipse(in: CGRect(x: headX - 1, y: headY + headSize * 0.6, width: headSize + 2, height: headSize * 0.5))

        // -- Glasses --
        ctx.setStrokeColor(glassesColor)
        ctx.setLineWidth(1.5)
        let glassY = headY + headSize * 0.35
        let glassW: CGFloat = 6
        // Left lens
        ctx.strokeEllipse(in: CGRect(x: headX + 2, y: glassY, width: glassW, height: glassW))
        // Right lens
        ctx.strokeEllipse(in: CGRect(x: headX + headSize - glassW - 2, y: glassY, width: glassW, height: glassW))
        // Bridge
        ctx.move(to: CGPoint(x: headX + 2 + glassW, y: glassY + glassW / 2))
        ctx.addLine(to: CGPoint(x: headX + headSize - glassW - 2, y: glassY + glassW / 2))
        ctx.strokePath()

        // -- State-specific details --
        switch currentState {
        case .thinking:
            // Chin-tap gesture — small dot near chin
            if currentFrame % 2 == 0 {
                ctx.setFillColor(skinColor)
                ctx.fillEllipse(in: CGRect(x: headX + headSize + 1, y: glassY - 4, width: 3, height: 3))
            }
        case .excited:
            // Exclamation lines
            ctx.setStrokeColor(glassesColor)
            ctx.setLineWidth(1)
            ctx.move(to: CGPoint(x: headX - 3, y: headY + headSize + 2))
            ctx.addLine(to: CGPoint(x: headX - 5, y: headY + headSize + 6))
            ctx.move(to: CGPoint(x: headX + headSize + 3, y: headY + headSize + 2))
            ctx.addLine(to: CGPoint(x: headX + headSize + 5, y: headY + headSize + 6))
            ctx.strokePath()
        case .examining:
            // Magnifying glass
            ctx.setStrokeColor(glassesColor)
            ctx.setLineWidth(1.5)
            ctx.strokeEllipse(in: CGRect(x: w * 0.7, y: h * 0.4, width: 8, height: 8))
            ctx.move(to: CGPoint(x: w * 0.7 + 7, y: h * 0.4))
            ctx.addLine(to: CGPoint(x: w * 0.7 + 11, y: h * 0.4 - 4))
            ctx.strokePath()
        case .waving:
            // Raised arm
            ctx.setFillColor(skinColor)
            let armX = currentFrame % 2 == 0 ? w * 0.75 : w * 0.78
            ctx.fillEllipse(in: CGRect(x: armX, y: h * 0.55, width: 4, height: 4))
            ctx.setStrokeColor(shirtColor)
            ctx.setLineWidth(2)
            ctx.move(to: CGPoint(x: w * 0.7, y: h * 0.4))
            ctx.addLine(to: CGPoint(x: armX + 2, y: h * 0.55))
            ctx.strokePath()
        default:
            break
        }
    }
}
```

**Step 2: Build and verify**

Run: `cd app && swift build 2>&1`
Expected: Compiles. (Visual verification comes in Task 11.)

**Step 3: Commit**

```bash
git add app/Sources/Archie/Animator/ArchieSprite.swift
git commit -m "feat: add ArchieSprite with programmatic character drawing"
```

---

### Task 10: ArchieAnimator — movement, state transitions, reactive behavior

**Files:**
- Create: `app/Sources/Archie/Animator/ArchieAnimator.swift`

Manages the desktop pet's position, movement paths, animation frame timing, and reactive state changes.

**Step 1: Create ArchieAnimator.swift**

```swift
import AppKit

class ArchieAnimator {
    private let sprite: ArchieSprite
    private var state: AnimationState = .idle
    private var currentFrame: Int = 0
    private var frameTimer: Timer?
    private var moveTimer: Timer?
    private var targetPosition: NSPoint?
    private let moveSpeed: CGFloat = 2.0 // points per frame
    private var anchorPoint: NSPoint // Menu bar icon position

    init(sprite: ArchieSprite, menuBarButton: NSView?) {
        self.sprite = sprite
        // Default anchor near right side of menu bar
        if let button = menuBarButton, let window = button.window {
            let buttonFrame = button.convert(button.bounds, to: nil)
            let screenFrame = window.convertToScreen(buttonFrame)
            self.anchorPoint = NSPoint(
                x: screenFrame.midX - sprite.size.width / 2,
                y: screenFrame.minY - sprite.size.height
            )
        } else {
            let screen = NSScreen.main?.frame ?? .zero
            self.anchorPoint = NSPoint(
                x: screen.maxX - 100,
                y: screen.maxY - 48
            )
        }
    }

    func start() {
        sprite.show(at: anchorPoint)
        setState(.idle)
        startIdleBehavior()
    }

    func stop() {
        frameTimer?.invalidate()
        moveTimer?.invalidate()
        sprite.hide()
    }

    func trigger(_ event: AnimationEvent) {
        let newState = state.transition(on: event)
        if newState != state {
            setState(newState)
        }
    }

    private func setState(_ newState: AnimationState) {
        state = newState
        currentFrame = 0
        sprite.setState(state, frame: 0)

        frameTimer?.invalidate()
        frameTimer = Timer.scheduledTimer(withTimeInterval: state.frameDuration, repeats: true) { [weak self] _ in
            self?.advanceFrame()
        }
    }

    private func advanceFrame() {
        currentFrame += 1
        if currentFrame >= state.frameCount {
            if state.loops {
                currentFrame = 0
            } else {
                // Non-looping animation complete — transition back
                trigger(.animationComplete)
                return
            }
        }
        sprite.setState(state, frame: currentFrame)
    }

    private func startIdleBehavior() {
        // Periodically trigger walking or small movements
        moveTimer = Timer.scheduledTimer(withTimeInterval: 8.0, repeats: true) { [weak self] _ in
            guard let self = self, self.state == .idle else { return }
            // Random chance to walk
            if Int.random(in: 0..<3) == 0 {
                self.walkToRandomNearby()
            }
        }
    }

    private func walkToRandomNearby() {
        let screen = NSScreen.main?.frame ?? .zero
        let menuBarY = screen.maxY - 48 // Approximate menu bar bottom

        // Stay near the menu bar area
        let randomX = CGFloat.random(in: max(screen.minX, sprite.position.x - 100)...min(screen.maxX - sprite.size.width, sprite.position.x + 100))
        let target = NSPoint(x: randomX, y: menuBarY)

        walkTo(target)
    }

    func walkTo(_ target: NSPoint) {
        targetPosition = target
        trigger(.startWalking)

        // Animate movement
        Timer.scheduledTimer(withTimeInterval: 0.03, repeats: true) { [weak self] timer in
            guard let self = self, let target = self.targetPosition else {
                timer.invalidate()
                return
            }

            var pos = self.sprite.position
            let dx = target.x - pos.x
            let dy = target.y - pos.y
            let distance = sqrt(dx * dx + dy * dy)

            if distance < self.moveSpeed {
                self.sprite.moveTo(target)
                self.targetPosition = nil
                timer.invalidate()
                self.trigger(.animationComplete)
            } else {
                pos.x += (dx / distance) * self.moveSpeed
                pos.y += (dy / distance) * self.moveSpeed
                self.sprite.moveTo(pos)
            }
        }
    }

    /// Update anchor point (e.g. when menu bar icon moves)
    func updateAnchor(from button: NSView) {
        if let window = button.window {
            let buttonFrame = button.convert(button.bounds, to: nil)
            let screenFrame = window.convertToScreen(buttonFrame)
            anchorPoint = NSPoint(
                x: screenFrame.midX - sprite.size.width / 2,
                y: screenFrame.minY - sprite.size.height
            )
        }
    }
}
```

**Step 2: Build and verify**

Run: `cd app && swift build 2>&1`
Expected: Compiles.

**Step 3: Commit**

```bash
git add app/Sources/Archie/Animator/ArchieAnimator.swift
git commit -m "feat: add ArchieAnimator with movement and reactive state"
```

---

### Task 11: Wire the animator into the app + bridge events

**Files:**
- Modify: `app/Sources/Archie/StatusBarController.swift` — create and start animator
- Modify: `app/Sources/Archie/AppDelegate.swift` — pass button reference for anchor

**Step 1: Update StatusBarController to create animator**

Add to StatusBarController:

```swift
private var animator: ArchieAnimator?

// In init(), after setting up the button:
let sprite = ArchieSprite()
animator = ArchieAnimator(sprite: sprite, menuBarButton: statusItem.button)
animator?.start()

// Update bridgeManager.onStatusChange:
bridgeManager.onStatusChange { [weak self] running in
    self?.updateBridgeStatus(running)
    self?.animator?.trigger(running ? .bridgeStarted : .bridgeStopped)
}

// In openDocument, after documentPicker.pickAndOpen():
animator?.trigger(.documentOpened)
```

The full updated StatusBarController init should be:

```swift
init(port: Int, bridgeManager: CLIBridgeManager, widgetScriptPath: String) {
    self.statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.squareLength)
    self.popoverChat = PopoverChat(port: port)
    self.bridgeManager = bridgeManager
    self.documentPicker = DocumentPicker(port: port, widgetScriptPath: widgetScriptPath)

    if let button = statusItem.button {
        if let image = NSImage(systemSymbolName: "building.columns", accessibilityDescription: "Archie") {
            image.isTemplate = true
            button.image = image
        } else {
            button.title = "A"
        }
        button.action = #selector(handleClick)
        button.target = self
        button.sendAction(on: [.leftMouseUp, .rightMouseUp])
    }

    // Desktop pet
    let sprite = ArchieSprite()
    animator = ArchieAnimator(sprite: sprite, menuBarButton: statusItem.button)
    animator?.start()

    // Bridge status → animator events
    bridgeManager.onStatusChange { [weak self] running in
        self?.updateBridgeStatus(running)
        self?.animator?.trigger(running ? .bridgeStarted : .bridgeStopped)
    }
}
```

**Step 2: Build and verify**

Run: `cd app && swift build 2>&1`
Expected: Compiles.

Run: `cd app && swift run &`
Manual: A small animated character should appear near the menu bar icon. It should wobble slightly (idle animation) and occasionally walk short distances. Kill with `kill %1`.

**Step 3: Commit**

```bash
git add app/Sources/
git commit -m "feat: wire ArchieAnimator into StatusBarController with bridge events"
```

---

### Task 12: Build script for .app bundle

**Files:**
- Create: `app/scripts/build-app.sh`

This script builds the Swift executable and packages it into a proper `.app` bundle with Info.plist and bundled resources (widget.js, server.js, widget.html).

**Step 1: Create build-app.sh**

```bash
#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$SCRIPT_DIR/.."
REPO_DIR="$APP_DIR/.."
BUILD_DIR="$APP_DIR/.build/release"
APP_BUNDLE="$APP_DIR/build/Archie.app"

echo "Building Archie.app..."

# Build release binary
cd "$APP_DIR"
swift build -c release 2>&1

# Create .app bundle structure
rm -rf "$APP_BUNDLE"
mkdir -p "$APP_BUNDLE/Contents/MacOS"
mkdir -p "$APP_BUNDLE/Contents/Resources"

# Copy binary
cp "$BUILD_DIR/Archie" "$APP_BUNDLE/Contents/MacOS/Archie"

# Copy Info.plist
cp "$APP_DIR/Sources/Archie/Resources/Info.plist" "$APP_BUNDLE/Contents/Info.plist"

# Bundle bridge server and widget
cp "$REPO_DIR/skills/archie/bridge/server.js" "$APP_BUNDLE/Contents/Resources/server.js"
cp "$REPO_DIR/skills/archie/bridge/widget.js" "$APP_BUNDLE/Contents/Resources/widget.js"

# Bundle widget.html
cp "$APP_DIR/Sources/Archie/Resources/widget.html" "$APP_BUNDLE/Contents/Resources/widget.html"

# Copy SPM resource bundle if it exists
BUNDLE_PATH=$(find "$BUILD_DIR" -name "Archie_Archie.bundle" -type d 2>/dev/null | head -1)
if [ -n "$BUNDLE_PATH" ]; then
    cp -R "$BUNDLE_PATH" "$APP_BUNDLE/Contents/Resources/"
fi

echo ""
echo "Built: $APP_BUNDLE"
echo "Run:   open $APP_BUNDLE"
ls -la "$APP_BUNDLE/Contents/MacOS/Archie"
```

**Step 2: Make executable and test**

Run: `chmod +x app/scripts/build-app.sh`
Run: `cd app && ./scripts/build-app.sh`
Expected: Builds binary, creates `app/build/Archie.app/` with correct structure.

Run: `open app/build/Archie.app`
Expected: Archie appears in the menu bar. The desktop pet character shows up. Click the icon for the popover. Right-click for the context menu.

**Step 3: Commit**

```bash
git add app/scripts/build-app.sh
git commit -m "feat: add build script for Archie.app bundle"
```

---

### Task 13: End-to-end smoke test

**Step 1: Start the bridge manually**

```bash
cd ~/ashcode/archie
node skills/archie/bridge/server.js &
curl -s http://localhost:3077/health
```
Expected: `{"ok":true,"port":3077,...}`

**Step 2: Launch the app**

```bash
cd app && swift run &
```

Manual checks:
- [ ] Menu bar icon appears (building columns or "A")
- [ ] Archie character appears near the icon, idle animation plays
- [ ] Left-click opens popover with chat UI (widget.js loaded)
- [ ] Type a message in popover → shows in chat (bridge receives it)
- [ ] Right-click shows context menu
- [ ] "Open Document..." opens file picker
- [ ] "Bridge: Running" shows correct status
- [ ] "Quit Archie" terminates the app
- [ ] Archie character disappears when app quits

**Step 3: Test document flow**

```bash
# With app running, right-click → Open Document → select templates/arch-diagram.html
# Browser should open with the page
# Chat widget should appear in the browser page
```

**Step 4: Kill bridge and verify status change**

```bash
kill %1  # Kill the bridge
# Wait 5 seconds for health check
# Bridge status in context menu should show "Bridge: Stopped"
```

**Step 5: Clean up and final commit**

```bash
kill %2  # Kill the app
git add -A
git commit -m "feat: complete Archie menu bar app v1"
```

---

### Summary

| Task | What | Key files |
|------|------|-----------|
| 1 | Restructure repo | Move CLI to `cli/` |
| 2 | Scaffold Swift package | `app/Package.swift`, `main.swift`, `widget.html`, `Info.plist` |
| 3 | App shell | `AppDelegate.swift`, `StatusBarController.swift` |
| 4 | Config | `Config.swift` + tests |
| 5 | BridgeManager | `BridgeManager.swift` + tests |
| 6 | PopoverChat | `PopoverChat.swift`, wire to StatusBarController |
| 7 | Context menu + DocumentPicker | `DocumentPicker.swift`, right-click menu |
| 8 | AnimationState | `AnimationState.swift` + tests |
| 9 | ArchieSprite | `ArchieSprite.swift` (programmatic drawing) |
| 10 | ArchieAnimator | `ArchieAnimator.swift` (movement + state) |
| 11 | Wire animator | Connect animator to bridge events |
| 12 | Build script | `build-app.sh` for .app bundle |
| 13 | Smoke test | End-to-end manual verification |
