'use strict';

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(require('os').homedir(), '.archie.json');
const DEFAULTS = { port: 3077, initialized: false };

function load() {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

function save(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n');
}

module.exports = { load, save, CONFIG_PATH };
