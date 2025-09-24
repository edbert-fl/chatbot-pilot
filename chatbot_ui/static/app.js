let SESSION_ID = (() => Math.random().toString(36).slice(2))();
let FLOWS = { greeting: null, thank_you: null, flows: {} };
let CURRENT_FLOW_ID = null;
let CURRENT_FLOW_STEP = 0;

async function checkHealth() {
  const status = document.getElementById('status');
  try {
    const resp = await fetch('/health');
    const data = await resp.json();
    status.textContent = `Backend: ${data.status || 'unknown'} | Model: ${data.model || 'n/a'}`;
  } catch (e) {
    status.textContent = 'Backend: error';
  }
}

function addMessage(role, content, details) {
  const chat = document.getElementById('chat');
  const tpl = document.getElementById('message-template');
  const node = tpl.content.cloneNode(true);
  node.querySelector('.role').textContent = role;
  const contentEl = node.querySelector('.content');
  const tag = extractTag(content);
  const displayText = stripSelectedTag(content, tag);
  contentEl.textContent = displayText;
  const compEl = node.querySelector('.components');
  if (role === 'Assistant' && tag) {
    renderComponentHTML(compEl, tag);
  }
  const detailsEl = node.querySelector('.details');
  if (role === 'User' || !details) {
    detailsEl.remove();
  } else {
    detailsEl.querySelector('.json').textContent = JSON.stringify(details, null, 2);
  }
  chat.appendChild(node);
  chat.scrollTop = chat.scrollHeight;
}

function extractTag(text) {
  const t = (text || '');
  const matches = [...t.matchAll(/\[([a-z0-9_]+)\]/gi)];
  for (let i = matches.length - 1; i >= 0; i--) {
    const candidate = (matches[i][1] || '').toLowerCase();
    if (/^\d+$/.test(candidate)) continue; // skip numeric citations like [1]
    return candidate;
  }
  return null;
}

function stripSelectedTag(text, tag) {
  const input = (text || '');
  if (!tag) return input;
  const needle = `[${tag}]`;
  const idx = input.toLowerCase().lastIndexOf(needle.toLowerCase());
  if (idx === -1) return input;
  return (input.slice(0, idx) + input.slice(idx + needle.length)).trimEnd();
}

async function renderComponentHTML(container, tag) {
  if (!tag) return;
  try {
    const resp = await fetch(`/static/components/${encodeURIComponent(tag)}.html`);
    if (!resp.ok) return;
    const html = await resp.text();
    container.innerHTML = html;
    bindComponentInteractions(container);
  } catch (_) {
    // ignore
  }
}

function renderButtonGroup(container, title, options, selectionKey) {
  const label = document.createElement('div');
  label.className = 'badge';
  label.textContent = title;
  container.appendChild(label);
  const row = document.createElement('div');
  row.className = 'row';
  options.forEach(opt => {
    const b = document.createElement('button');
    b.className = 'btn';
    b.textContent = opt.label;
    b.onclick = async () => {
      await sendFollowupSelection({ [selectionKey]: opt.value });
    };
    row.appendChild(b);
  });
  container.appendChild(row);
}

function renderContactForm(container) {
  const form = document.createElement('div');
  form.className = 'row';
  form.innerHTML = `
    <div class="field"><label>Name</label><input id="cf_name"/></div>
    <div class="field"><label>Email</label><input id="cf_email"/></div>
    <div class="field" style="flex:1"><label>Company</label><input id="cf_company"/></div>
    <div class="field" style="flex-basis:100%"><label>Note</label><textarea id="cf_note" rows="3"></textarea></div>
    <div><button class="btn btn-primary" id="cf_submit">Submit</button></div>
  `;
  container.appendChild(form);
  form.querySelector('#cf_submit').onclick = async () => {
    const payload = {
      contact_name: form.querySelector('#cf_name').value,
      contact_email: form.querySelector('#cf_email').value,
      contact_company: form.querySelector('#cf_company').value,
      contact_note: form.querySelector('#cf_note').value,
    };
    await sendFollowupSelection({ contact: payload });
  };
}

async function sendFollowupSelection(selections) {
  addMessage('User', `(selected) ${JSON.stringify(selections)}`);
  const resp = await fetch('/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'Selection submitted', session_id: SESSION_ID, selections }),
  });
  const result = await resp.json();
  addMessage('Assistant', result.answer || 'No answer', result);
}

function setPromptAndSend(prompt) {
  const form = document.getElementById('chat-form');
  const input = document.getElementById('query');
  if (!form || !input) return;
  input.value = prompt || '';
  const text = (prompt || '').trim();
  if (text) {
    if (CURRENT_FLOW_ID) {
      addMessage('User', text);
      input.value = '';
      advanceFlow();
      return;
    }
    if (typeof form.requestSubmit === 'function') {
      form.requestSubmit();
    } else {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }
  }
}

window.setPromptAndSend = setPromptAndSend;
window.sendFollowupSelection = sendFollowupSelection;
window.enterFlow = enterFlow;
window.exitFlow = exitFlow;

async function loadFlows() {
  try {
    const resp = await fetch('/static/flows.json');
    if (!resp.ok) return;
    const data = await resp.json();
    FLOWS.greeting = data.greeting || data.welcome || null;
    FLOWS.thank_you = data.thank_you || data.end_message || 'Thanks! Anything else I can help with?';
    FLOWS.flows = data.flows || {};
  } catch (_) {}
}

function enterFlow(flowId) {
  if (!flowId || !FLOWS.flows[flowId]) return;
  CURRENT_FLOW_ID = flowId;
  CURRENT_FLOW_STEP = 0;
}

function exitFlow() {
  CURRENT_FLOW_ID = null;
  CURRENT_FLOW_STEP = 0;
}

function greet() {
  const msg = FLOWS.greeting || 'Hi! What would you like to build?';
  addMessage('Assistant', msg);
}

function resetToStart() {
  exitFlow();
  greet();
}

function findFlowByStart(text) {
  const q = (text || '').toLowerCase();
  for (const [flowId, cfg] of Object.entries(FLOWS.flows || {})) {
    const triggers = Array.isArray(cfg.start_triggers) ? cfg.start_triggers : [];
    for (const t of triggers) {
      if (q.startsWith(String(t).toLowerCase())) return flowId;
    }
  }
  return null;
}

function advanceFlow() {
  const flow = CURRENT_FLOW_ID ? FLOWS.flows[CURRENT_FLOW_ID] : null;
  if (!flow) { exitFlow(); return; }
  const step = flow.sequence && flow.sequence[CURRENT_FLOW_STEP];
  if (!step) {
    // end of flow
    addMessage('Assistant', FLOWS.thank_you);
    resetToStart();
    return;
  }
  const text = step.assistant || '';
  const tag = step.tag || null;
  const content = tag ? `${text} [${tag}]` : text;
  addMessage('Assistant', content, { flow: CURRENT_FLOW_ID, step: CURRENT_FLOW_STEP });
  CURRENT_FLOW_STEP += 1;
  if (!flow.sequence[CURRENT_FLOW_STEP]) {
    // Show thank you on next user confirmation or immediately? Show immediately.
    addMessage('Assistant', FLOWS.thank_you);
    resetToStart();
  }
}

async function sendQuery(query) {
  const resp = await fetch('/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, session_id: SESSION_ID }),
  });
  return await resp.json();
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadFlows();
  checkHealth();
  const form = document.getElementById('chat-form');
  const input = document.getElementById('query');
  greet();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    addMessage('User', q);
    input.value = '';
    const flow = CURRENT_FLOW_ID ? FLOWS.flows[CURRENT_FLOW_ID] : null;
    if (flow && typeof flow.continue_prefix === 'string') {
      const expect = flow.continue_prefix.toLowerCase();
      const ql = q.toLowerCase();
      if (ql.startsWith(expect)) {
        advanceFlow();
        return;
      }
      // Not matching expected prefix -> exit flow and fall through to backend
      exitFlow();
    }
    if (!flow) {
      const startFlowId = findFlowByStart(q);
      if (startFlowId) {
        enterFlow(startFlowId);
        advanceFlow();
        return;
      }
    }
    try {
      const result = await sendQuery(q);
      addMessage('Assistant', result.answer || 'No answer', result);
    } catch (e) {
      addMessage('Assistant', 'Error contacting server', { error: String(e) });
    }
  });
});


function bindComponentInteractions(container) {
  if (!container || container.__boundInteractions) return;
  container.__boundInteractions = true;
  container.addEventListener('click', async (e) => {
    const target = e.target.closest('button');
    if (!target || !container.contains(target)) return;
    const flowId = target.getAttribute('data-flow');
    if (flowId) enterFlow(flowId);
    const prompt = target.getAttribute('data-prompt');
    if (prompt) {
      if (typeof window.setPromptAndSend === 'function') {
        window.setPromptAndSend(prompt);
      }
      return;
    }
    const selection = target.getAttribute('data-selection');
    if (selection) {
      try {
        const selections = JSON.parse(selection);
        if (typeof window.sendFollowupSelection === 'function') {
          await window.sendFollowupSelection(selections);
        }
      } catch (_) {}
      return;
    }
    if (target.id === 'cf_submit') {
      const nameEl = container.querySelector('#cf_name');
      const emailEl = container.querySelector('#cf_email');
      const companyEl = container.querySelector('#cf_company');
      const noteEl = container.querySelector('#cf_note');
      const payload = {
        contact_name: nameEl ? nameEl.value : '',
        contact_email: emailEl ? emailEl.value : '',
        contact_company: companyEl ? companyEl.value : '',
        contact_note: noteEl ? noteEl.value : '',
      };
      const tpl = container.getAttribute('data-prompt-template');
      if (tpl && typeof window.setPromptAndSend === 'function') {
        const promptText = tpl
          .replaceAll('{name}', payload.contact_name || '')
          .replaceAll('{email}', payload.contact_email || '')
          .replaceAll('{company}', payload.contact_company || '')
          .replaceAll('{note}', payload.contact_note || '');
        window.setPromptAndSend(promptText);
        return;
      }
      if (typeof window.sendFollowupSelection === 'function') {
        await window.sendFollowupSelection({ contact: payload });
      }
    }
  });
}
