#!/usr/bin/env node
'use strict';

const { program } = require('commander');
const pkg = require('../package.json');

program
  .name('archie')
  .description('Archie — your architecture consultant')
  .version(pkg.version);

program
  .command('init')
  .description('Set up Archie (auto-runs on first use)')
  .action(async () => {
    const { init } = require('../lib/init');
    await init();
  });

program
  .command('chat [target]')
  .description('Start Archie — chat <file.html> or chat <topic>')
  .action(async (target) => {
    const { ensureInit } = require('../lib/init');
    const { createBridge } = require('../lib/bridge');
    const { createClaude } = require('../lib/claude');
    const { inject } = require('../lib/inject');
    const fs = require('fs');
    const path = require('path');

    const cfg = await ensureInit();
    const cwd = process.cwd();

    // Start bridge
    const bridge = createBridge({ port: cfg.port, cwd });
    await bridge.start();

    // Start claude
    const claude = createClaude({ cwd });
    console.log('  Claude: ready (Archie personality loaded)');

    // Poll inbox for messages
    const pollInterval = setInterval(async () => {
      try {
        if (!fs.existsSync(bridge.inbox)) return;
        const raw = fs.readFileSync(bridge.inbox, 'utf8').trim();
        if (!raw) return;
        const lines = raw.split('\n').filter(Boolean);
        if (lines.length === 0) return;

        // Clear inbox
        fs.writeFileSync(bridge.inbox, '');

        for (const line of lines) {
          const msg = JSON.parse(line);
          console.log(`  From browser: ${msg.text}`);

          try {
            const response = await claude.ask(msg.text);
            console.log(`  Archie: ${response.slice(0, 80)}${response.length > 80 ? '...' : ''}`);
            bridge.broadcast(response);
          } catch (e) {
            const errMsg = `Sorry, I hit an error: ${e.message}`;
            console.error(`  Error: ${e.message}`);
            bridge.broadcast(errMsg);
          }
        }
      } catch (err) {
        process.stderr.write(`Poll error: ${err.message}\n`);
      }
    }, 1000);

    // Handle target argument
    if (target) {
      const isHtml = /\.html?$/i.test(target) && fs.existsSync(target);

      if (isHtml) {
        const result = inject(target, cfg.port);
        if (result.injected) {
          console.log(`  Widget injected into ${target}`);
        } else {
          console.log(`  Widget already present in ${target}`);
        }

        const { exec } = require('child_process');
        const url = `http://localhost:${cfg.port}/${path.relative(cwd, path.resolve(target))}`;
        exec(`open "${url}"`);
        console.log(`  Browser opened`);
      } else {
        // Topic mode
        console.log(`  Researching topic: ${target}`);
        try {
          const response = await claude.ask(
            `Research the topic "${target}" in this codebase. Look at relevant files, understand the architecture around it, and write your findings to archie.md. Then summarize what you found.`
          );
          console.log(`  Archie: ${response.slice(0, 120)}...`);
          bridge.broadcast(response);
        } catch (e) {
          console.error(`  Research failed: ${e.message}`);
        }
      }
    }

    console.log(`\n  Archie is listening. Open an HTML page with the widget to chat.`);
    console.log(`  Press Ctrl+C to stop.\n`);

    function cleanup() {
      clearInterval(pollInterval);
      bridge.stop();
      console.log('\n  Archie stopped.');
      process.exit(0);
    }

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
  });

program
  .command('stop')
  .description('Stop any running Archie bridge')
  .action(() => {
    const { execSync } = require('child_process');
    const config = require('../lib/config');
    const cfg = config.load();
    try {
      const pid = execSync(`lsof -ti:${cfg.port}`, { encoding: 'utf8' }).trim();
      if (pid) {
        process.kill(parseInt(pid, 10));
        console.log(`  Stopped bridge on port ${cfg.port} (pid ${pid})`);
      }
    } catch {
      console.log(`  No bridge running on port ${cfg.port}`);
    }
  });

program.parse();
