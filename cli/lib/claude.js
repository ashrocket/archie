'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROMPT_FILE = path.join(__dirname, '..', '..', 'skills', 'archie', 'archie-prompt.txt');

function loadSystemPrompt() {
  try {
    return fs.readFileSync(PROMPT_FILE, 'utf8').trim();
  } catch (e) {
    throw new Error(`archie-prompt.txt not found at ${PROMPT_FILE}: ${e.message}`);
  }
}

function createClaude({ cwd }) {
  let busy = false;
  const queue = [];

  function getContext() {
    const archieFile = path.join(cwd, 'archie.md');
    try {
      return fs.readFileSync(archieFile, 'utf8');
    } catch {
      return '';
    }
  }

  async function ask(text) {
    if (busy) {
      return new Promise((resolve) => queue.push({ text, resolve }));
    }
    busy = true;

    try {
      return await runClaude(text);
    } finally {
      busy = false;
      if (queue.length > 0) {
        const next = queue.shift();
        next.resolve(ask(next.text));
      }
    }
  }

  function runClaude(text) {
    return new Promise((resolve, reject) => {
      const context = getContext();
      const args = [
        '--print',
        '--system-prompt', loadSystemPrompt(),
      ];
      if (context) {
        args.push('--append-system-prompt', `\n\nHere are your accumulated architecture notes:\n\n${context}`);
      }
      args.push(text);

      const env = { ...process.env };
      delete env.CLAUDECODE;

      const proc = spawn('claude', args, {
        cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
        env,
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (d) => stdout += d);
      proc.stderr.on('data', (d) => stderr += d);

      proc.on('close', (code) => {
        if (code === 0) {
          resolve(stdout.trim());
        } else {
          reject(new Error(`claude exited ${code}: ${stderr}`));
        }
      });

      proc.on('error', reject);
    });
  }

  return { ask };
}

module.exports = { createClaude };
