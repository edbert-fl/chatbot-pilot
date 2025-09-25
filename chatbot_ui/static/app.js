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
    
    // Special handling for specific components
    if (tag === 'send_message') {
      generateMessageFromSelections(container);
    } else if (tag === 'contact_form') {
      // Pre-fill the contact form message
      const noteField = container.querySelector('#cf_note');
      if (noteField && typeof window.generateContactMessage === 'function') {
        window.generateContactMessage().then(message => {
          console.log('Generated contact message:', message);
          console.log('Current selections:', window.sessionSelections);
          console.log('Current flow:', CURRENT_FLOW_ID);
          noteField.value = message;
        });
      }
    }
    
    bindComponentInteractions(container);
  } catch (_) {
    // ignore
  }
}

function generateMessageFromSelections(container) {
  // Get the message template from the current flow step
  const currentFlow = CURRENT_FLOW_ID ? FLOWS.flows[CURRENT_FLOW_ID] : null;
  if (!currentFlow || !currentFlow.sequence) return;
  
  const currentStep = currentFlow.sequence[CURRENT_FLOW_STEP - 1];
  if (!currentStep || !currentStep.message_template) return;
  
  // Get user selections from session
  const selections = getSessionSelections();
  
  // Generate the message by replacing placeholders
  let message = currentStep.message_template;
  message = message.replace('{channels}', selections.channels || 'Not specified');
  message = message.replace('{audience}', selections.audience || 'Not specified');
  message = message.replace('{contact}', formatContactInfo(selections.contact));
  
  // Display the generated message
  const messageEl = container.querySelector('#generated-message');
  if (messageEl) {
    messageEl.textContent = message;
  }
}

function getSessionSelections() {
  // This would typically come from session storage or a global state
  // For now, we'll return a placeholder that gets updated by the flow
  return window.sessionSelections || {};
}

function formatContactInfo(contact) {
  if (!contact) return 'Not provided';
  const parts = [];
  if (contact.contact_name) parts.push(`Name: ${contact.contact_name}`);
  if (contact.contact_email) parts.push(`Email: ${contact.contact_email}`);
  if (contact.contact_company) parts.push(`Company: ${contact.contact_company}`);
  if (contact.contact_note) parts.push(`Note: ${contact.contact_note}`);
  return parts.join(', ');
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


async function generateContactMessage() {
  const selections = window.sessionSelections || {};
  const currentFlow = CURRENT_FLOW_ID ? FLOWS.flows[CURRENT_FLOW_ID] : null;

  console.log('=== DEBUGGING CONTACT MESSAGE ===');
  console.log('Current selections:', selections);
  console.log('Current flow ID:', CURRENT_FLOW_ID);
  console.log('Current flow:', currentFlow);

  if (!currentFlow) return "I am looking to build a chatbot for my business. I look forward to further discussing this with you.";

  // Get chatbot type from selections or flow ID
  let chatbotType = "chatbot";
  if (selections.what_chatbot) {
    switch(selections.what_chatbot) {
      case "support": chatbotType = "customer support chatbot"; break;
      case "sales": chatbotType = "sales assistant chatbot"; break;
      case "helpdesk": chatbotType = "internal helpdesk chatbot"; break;
      case "automation": chatbotType = "workflow automation chatbot"; break;
      default: chatbotType = "chatbot";
    }
  } else if (currentFlow === FLOWS.flows.flow_customer_support) {
    chatbotType = "customer support chatbot";
  } else if (currentFlow === FLOWS.flows.flow_sales_assistant) {
    chatbotType = "sales assistant chatbot";
  } else if (currentFlow === FLOWS.flows.flow_internal_helpdesk) {
    chatbotType = "internal helpdesk chatbot";
  } else if (currentFlow === FLOWS.flows.flow_workflow_automation) {
    chatbotType = "workflow automation chatbot";
  }

  // Get channels and format them clearly
  const channels = selections.channels || [];
  let channelDetails = "";
  if (Array.isArray(channels) && channels.length > 0) {
    const channelNames = channels.map(channel => {
      switch(channel) {
        case "web": return "website";
        case "mobile": return "mobile app";
        case "whatsapp_sms": return "WhatsApp/SMS";
        case "slack": return "Slack";
        case "teams": return "Microsoft Teams";
        case "voice": return "voice calls";
        default: return channel;
      }
    });
    channelDetails = channelNames.join(", ");
  } else if (typeof channels === 'string') {
    switch(channels) {
      case "web": channelDetails = "website"; break;
      case "mobile": channelDetails = "mobile app"; break;
      case "whatsapp_sms": channelDetails = "WhatsApp/SMS"; break;
      case "slack": channelDetails = "Slack"; break;
      case "teams": channelDetails = "Microsoft Teams"; break;
      case "voice": channelDetails = "voice calls"; break;
      default: channelDetails = channels;
    }
  } else {
    channelDetails = "various channels";
  }

  // Get audience and format them clearly
  const audience = selections.audience || [];
  let audienceDetails = "";
  if (Array.isArray(audience) && audience.length > 0) {
    const audienceNames = audience.map(aud => {
      switch(aud) {
        case "customers": return "customers";
        case "prospects": return "potential customers";
        case "partners": return "partners";
        case "employees": return "employees";
        case "agents": return "support agents";
        default: return aud;
      }
    });
    audienceDetails = audienceNames.join(", ");
  } else if (typeof audience === 'string') {
    switch(audience) {
      case "customers": audienceDetails = "customers"; break;
      case "prospects": audienceDetails = "potential customers"; break;
      case "partners": audienceDetails = "partners"; break;
      case "employees": audienceDetails = "employees"; break;
      case "agents": audienceDetails = "support agents"; break;
      default: audienceDetails = audience;
    }
  } else {
    audienceDetails = "our users";
  }

  // Generate a simple message locally without API calls
  const messages = [
    `Hi! I'm interested in building a ${chatbotType} for ${channelDetails} that will be used by ${audienceDetails}. I'd love to discuss this project with you.`,
    `Hello! I want to create a ${chatbotType} for ${channelDetails} to serve ${audienceDetails}. Let's schedule a call to discuss this further.`,
    `Hi there! I'm looking to build a ${chatbotType} for ${channelDetails} that will help ${audienceDetails}. I'd appreciate the opportunity to discuss this with your team.`,
    `Hello! I'm interested in developing a ${chatbotType} for ${channelDetails} to support ${audienceDetails}. I'd love to learn more about your services.`
  ];
  
  // Pick a random message or use the first one
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex];
}

async function sendFollowupSelection(selections) {
  console.log('=== SEND FOLLOWUP SELECTION CALLED ===');
  console.log('Incoming selections:', selections);
  
  // Create a user-friendly message based on the selection
  const userMessage = createUserSelectionMessage(selections);
  addMessage('User', userMessage);
  
  // Store selections globally for message generation
  if (!window.sessionSelections) window.sessionSelections = {};
  Object.assign(window.sessionSelections, selections);
  
  console.log('=== STORING SELECTIONS ===');
  console.log('New selections:', selections);
  console.log('Updated sessionSelections:', window.sessionSelections);
  
  // Use hardcoded responses instead of OpenAI API
  const hardcodedResponse = getHardcodedResponse(selections);
  addMessage('Assistant', hardcodedResponse);
  
  // Advance the flow to the next step after making a selection
  if (CURRENT_FLOW_ID) {
    advanceFlow();
  }
}

function getHardcodedResponse(selections) {
  // Hardcoded responses based on selection type
  if (selections.what_chatbot) {
    return "Great choice! Now let's determine which channels you'd like to use for your chatbot.";
  }
  
  if (selections.channels) {
    return "Perfect! Now tell me who will be using this chatbot.";
  }
  
  if (selections.audience) {
    return "Excellent! I have all the information I need. Let me prepare a message for you to send to our team.";
  }
  
  if (selections.contact) {
    return "Thank you for providing your contact information! Your message is ready to send.";
  }
  
  return "Thanks for your selection! Let's continue.";
}

function createUserSelectionMessage(selections) {
  const messages = [];

  if (selections.what_chatbot) {
    const chatbotNames = {
      'support': 'customer support chatbot',
      'sales': 'sales assistant chatbot',
      'helpdesk': 'internal helpdesk chatbot',
      'automation': 'workflow automation chatbot'
    };
    messages.push(`I want a ${chatbotNames[selections.what_chatbot] || selections.what_chatbot}.`);
  }

  if (selections.channels) {
    const channelNames = {
      'web': 'Web',
      'mobile': 'Mobile',
      'whatsapp_sms': 'WhatsApp/SMS',
      'slack': 'Slack',
      'teams': 'Teams',
      'voice': 'Voice'
    };
    messages.push(`I want this on ${channelNames[selections.channels] || selections.channels}.`);
  }

  if (selections.audience) {
    const audienceNames = {
      'customers': 'customers',
      'prospects': 'potential customers',
      'partners': 'partners',
      'employees': 'employees',
      'agents': 'support agents'
    };
    messages.push(`I want this for ${audienceNames[selections.audience] || selections.audience}.`);
  }

  if (selections.contact) {
    messages.push('I\'ve filled out my contact information.');
  }

  return messages.join(' ');
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
window.generateContactMessage = generateContactMessage;

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
    
    // Prioritize data-selection over data-prompt for flow buttons
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
    
    const prompt = target.getAttribute('data-prompt');
    if (prompt) {
      if (typeof window.setPromptAndSend === 'function') {
        window.setPromptAndSend(prompt);
      }
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
    if (target.id === 'send-message-btn') {
      const messageEl = container.querySelector('#generated-message');
      const messageText = messageEl ? messageEl.textContent : '';
      if (messageText && typeof window.setPromptAndSend === 'function') {
        window.setPromptAndSend(messageText);
        return;
      }
    }
    if (target.id === 'edit-message-btn') {
      const messageEl = container.querySelector('#generated-message');
      if (messageEl) {
        messageEl.contentEditable = true;
        messageEl.focus();
        target.textContent = '💾 Save';
        target.id = 'save-message-btn';
      }
    }
    if (target.id === 'save-message-btn') {
      const messageEl = container.querySelector('#generated-message');
      if (messageEl) {
        messageEl.contentEditable = false;
        target.textContent = '✏️ Edit Message';
        target.id = 'edit-message-btn';
      }
    }
  });
}
