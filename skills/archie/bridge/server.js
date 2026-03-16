'use strict';

/**
 * Plugin bridge entry point.
 * Thin wrapper around the canonical bridge implementation in cli/lib/bridge.js.
 * Started by the /archie plugin command: node ${CLAUDE_PLUGIN_ROOT}/skills/archie/bridge/server.js
 */

const path = require('path');
const { createBridge } = require(path.join(__dirname, '..', '..', '..', 'cli', 'lib', 'bridge.js'));

const PORT = parseInt(process.env.CHAT_BRIDGE_PORT || '3077', 10);

const bridge = createBridge({ port: PORT, cwd: process.cwd() });

bridge.start().then(() => {
  process.on('SIGINT', () => { bridge.stop(); process.exit(0); });
  process.on('SIGTERM', () => { bridge.stop(); process.exit(0); });
});
