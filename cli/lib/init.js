'use strict';

const { execSync } = require('child_process');
const readline = require('readline');
const config = require('./config');

async function ask(rl, question, fallback) {
  return new Promise(resolve => {
    rl.question(question, answer => resolve(answer.trim() || fallback));
  });
}

async function init() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log('\n  Archie — Architecture Consultant Setup\n');

  // Check claude
  try {
    const ver = execSync('claude --version', { encoding: 'utf8' }).trim();
    console.log(`  Found claude: ${ver}`);
  } catch {
    console.error('  Error: claude CLI not found on PATH.');
    console.error('  Install: npm install -g @anthropic-ai/claude-code');
    rl.close();
    process.exit(1);
  }

  const port = await ask(rl, `  Bridge port [3077]: `, '3077');

  const cfg = { port: parseInt(port, 10), initialized: true };
  config.save(cfg);
  console.log(`\n  Config saved to ${config.CONFIG_PATH}`);
  console.log('  Run: archie chat <file.html> to start\n');

  rl.close();
  return cfg;
}

async function ensureInit() {
  const cfg = config.load();
  if (!cfg.initialized) {
    console.log('  First run detected — running setup...');
    return init();
  }
  return cfg;
}

module.exports = { init, ensureInit };
