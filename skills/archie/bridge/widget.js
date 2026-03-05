/**
 * Chat Bridge Widget — drop-in <script> for any HTML page.
 *
 * Usage:
 *   <script src="widget.js" data-port="3077" data-title="Chat"></script>
 *
 * Or inline:
 *   <script src="widget.js"></script>
 *
 * Attributes:
 *   data-port     — bridge server port (default: 3077)
 *   data-position — "bottom-right" (default) or "bottom-left"
 *   data-title    — chat panel header (default: "Chat")
 */
(function () {
  const script = document.currentScript;
  const PORT = script?.getAttribute('data-port') || '3077';
  const POSITION = script?.getAttribute('data-position') || 'bottom-right';
  const TITLE = script?.getAttribute('data-title') || 'Chat';
  const BRIDGE = `http://localhost:${PORT}`;

  const CSS = `
    .cb-toggle{position:fixed;${POSITION === 'bottom-left' ? 'left' : 'right'}:24px;bottom:24px;
      width:52px;height:52px;border-radius:50%;background:#4f6df5;border:none;cursor:pointer;
      box-shadow:0 4px 12px rgba(0,0,0,.15);z-index:10000;display:flex;align-items:center;
      justify-content:center;transition:transform .15s}
    .cb-toggle:hover{transform:scale(1.08)}
    .cb-toggle svg{width:24px;height:24px;fill:#fff}
    .cb-panel{position:fixed;${POSITION === 'bottom-left' ? 'left' : 'right'}:24px;bottom:88px;
      width:360px;max-height:480px;background:#fff;border:1px solid #d8dce6;border-radius:12px;
      box-shadow:0 8px 32px rgba(0,0,0,.12);z-index:10000;display:none;flex-direction:column;
      font-family:-apple-system,sans-serif;font-size:14px;color:#1a1d27}
    .cb-panel.open{display:flex}
    .cb-header{padding:12px 16px;border-bottom:1px solid #e8ecf2;display:flex;align-items:center;gap:8px}
    .cb-dot{width:8px;height:8px;border-radius:50%;background:#d4d4d4}
    .cb-dot.online{background:#10b981}
    .cb-title{font-size:13px;font-weight:600}
    .cb-status{font-size:11px;color:#6b7280;margin-left:auto}
    .cb-msgs{flex:1;overflow-y:auto;padding:12px 16px;min-height:200px;max-height:340px}
    .cb-msg{margin-bottom:10px;padding:8px 12px;border-radius:8px;max-width:85%;font-size:13px;
      line-height:1.5;word-wrap:break-word}
    .cb-msg.user{background:#4f6df5;color:#fff;margin-left:auto}
    .cb-msg.assistant{background:#f1f3f7;color:#1a1d27}
    .cb-dots{display:none;padding:4px 12px;font-size:12px;color:#6b7280}
    .cb-dots.show{display:block}
    .cb-input{display:flex;gap:8px;padding:12px 16px;border-top:1px solid #e8ecf2}
    .cb-input textarea{flex:1;resize:none;border:1px solid #d8dce6;border-radius:8px;padding:8px 12px;
      font-size:13px;font-family:inherit;outline:none}
    .cb-input textarea:focus{border-color:#4f6df5}
    .cb-input button{background:#4f6df5;border:none;border-radius:8px;padding:8px 12px;cursor:pointer}
    .cb-input button svg{width:16px;height:16px;fill:#fff}
  `;

  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const container = document.createElement('div');
  container.innerHTML = `
    <button class="cb-toggle" title="Chat with Claude">
      <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
    </button>
    <div class="cb-panel" id="cbPanel">
      <div class="cb-header">
        <span class="cb-dot" id="cbDot"></span>
        <span class="cb-title">${TITLE}</span>
        <span class="cb-status" id="cbStatus">checking...</span>
      </div>
      <div class="cb-msgs" id="cbMsgs">
        <div class="cb-msg assistant">This chat connects to the Claude session in your terminal via a local bridge server.</div>
      </div>
      <div class="cb-dots" id="cbDots">thinking...</div>
      <div class="cb-input">
        <textarea id="cbInput" rows="1" placeholder="Type a message..."
          onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();window._cbSend()}"></textarea>
        <button onclick="window._cbSend()">
          <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>
    </div>`;
  document.body.appendChild(container);

  const panel = document.getElementById('cbPanel');
  const msgs = document.getElementById('cbMsgs');
  const input = document.getElementById('cbInput');
  const dot = document.getElementById('cbDot');
  const status = document.getElementById('cbStatus');
  const dots = document.getElementById('cbDots');
  let polling = false;

  container.querySelector('.cb-toggle').addEventListener('click', () => panel.classList.toggle('open'));

  fetch(BRIDGE + '/health').then(r => {
    if (r.ok) { dot.classList.add('online'); status.textContent = 'connected'; }
    else { status.textContent = 'bridge offline'; }
  }).catch(() => { status.textContent = `offline — run bridge on port ${PORT}`; });

  function addMsg(text, role) {
    const div = document.createElement('div');
    div.className = `cb-msg ${role}`;
    div.textContent = text;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  window._cbSend = async function () {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    addMsg(text, 'user');
    try {
      await fetch(BRIDGE + '/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      pollForResponse();
    } catch (e) {
      addMsg(`Bridge not reachable. Run: node <plugin>/lib/chat-bridge/server.js`, 'assistant');
    }
  };

  function pollForResponse() {
    if (polling) return;
    polling = true;
    dots.classList.add('show');
    const iv = setInterval(async () => {
      try {
        const r = await fetch(BRIDGE + '/poll');
        if (r.status === 200) {
          const data = await r.json();
          if (data.text) {
            addMsg(data.text, 'assistant');
            polling = false;
            dots.classList.remove('show');
            clearInterval(iv);
          }
        }
      } catch (e) { /* keep polling */ }
    }, 2000);
    setTimeout(() => {
      if (polling) { clearInterval(iv); dots.classList.remove('show'); polling = false; }
    }, 120000);
  }
})();
