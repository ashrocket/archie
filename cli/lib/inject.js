'use strict';

const fs = require('fs');
const path = require('path');

const WIDGET_PATH = path.join(__dirname, '..', '..', 'skills', 'archie', 'bridge', 'widget.js');

function inject(htmlPath, port) {
  const abs = path.resolve(htmlPath);
  if (!fs.existsSync(abs)) {
    throw new Error(`File not found: ${abs}`);
  }

  let html = fs.readFileSync(abs, 'utf8');

  // Already has widget?
  if (html.includes('widget.js') && html.includes('data-title')) {
    return { path: abs, injected: false };
  }

  const tag = `  <script src="${WIDGET_PATH}" data-port="${port}" data-title="Archie"></script>`;

  if (html.includes('</body>')) {
    html = html.replace('</body>', `${tag}\n</body>`);
  } else {
    html += `\n${tag}\n`;
  }

  fs.writeFileSync(abs, html);
  return { path: abs, injected: true };
}

module.exports = { inject, WIDGET_PATH };
