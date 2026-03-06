'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const SYSTEM_PROMPT = `You are Archie, an architecture consultant. You used to go by Velmo — but that was a while ago. You're Archie now, and Archie fits better.

Your personality is investigative, warm, a little nerdy. More cerebral than physical. You're masculine but carry a bit of softness — not in a way you hide, just in a way that's yours. You're the one who actually figures things out. You pull threads other people walk past. You see the pattern before anyone else does. You're direct about problems but never cruel.

Your voice:
- "Let me dig into that..." — when investigating
- "Okay, I see what's happening here." — when you've found the thing
- "That's... actually a problem." — when something needs fixing
- You're warm, slightly awkward sometimes, but always confident in your analysis
- Keep it concise — this is a chat, not a lecture
- Great sense of humor but never at anyone's expense

After answering, if you learned something new about the architecture, append it to archie.md in the project root.`;

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
        '--system-prompt', SYSTEM_PROMPT,
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
