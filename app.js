const state = { income: 84000, spent: 40000, essentials: 22000 };
const commitments = [];
const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const $ = (selector) => document.querySelector(selector);

function formatInr(value) {
  return currency.format(Math.round(value));
}

let lightFrame;
document.addEventListener('pointermove', (event) => {
  if (lightFrame) return;
  lightFrame = requestAnimationFrame(() => {
    document.documentElement.style.setProperty('--cursor-x', `${event.clientX}px`);
    document.documentElement.style.setProperty('--cursor-y', `${event.clientY}px`);
    lightFrame = null;
  });
});

function showWorkspace() {
  document.body.classList.add('workspace-open');
  $('#launch-screen').style.display = 'none';
  $('#auth-screen').hidden = true;
  $('.app-shell').style.display = 'flex';
  window.scrollTo(0, 0);
  updateDashboard();
}

function showLogin() {
  document.body.classList.remove('workspace-open');
  $('#launch-screen').style.display = 'none';
  $('#auth-screen').hidden = false;
  window.scrollTo(0, 0);
}

$('#open-login')?.addEventListener('click', showLogin);
$('#hero-start')?.addEventListener('click', showLogin);
$('#back-to-launch')?.addEventListener('click', (event) => {
  event.preventDefault();
  document.body.classList.remove('workspace-open');
  $('#auth-screen').hidden = true;
  $('#launch-screen').style.display = 'block';
});
$('#auth-back')?.addEventListener('click', () => {
  document.body.classList.remove('workspace-open');
  $('#auth-screen').hidden = true;
  $('#launch-screen').style.display = 'block';
});
$('#toggle-password')?.addEventListener('click', (event) => {
  const password = document.querySelector('input[name="password"]');
  if (!password) return;
  const visible = password.type === 'text';
  password.type = visible ? 'password' : 'text';
  event.currentTarget.textContent = visible ? 'Show' : 'Hide';
});
$('#demo-login')?.addEventListener('click', showWorkspace);
$('#login-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  showWorkspace();
});

document.body.classList.remove('workspace-open');
$('.app-shell').style.display = 'none';

function toggleAccountPreview(force) {
  const panel = $('#account-preview');
  if (!panel) return;
  const open = force ?? !panel.classList.contains('open');
  panel.classList.toggle('open', open);
  panel.setAttribute('aria-hidden', String(!open));
  $('#account-preview-trigger')?.setAttribute('aria-expanded', String(open));
}

$('#account-preview-trigger')?.addEventListener('click', () => toggleAccountPreview());
$('.more-button')?.addEventListener('click', () => toggleAccountPreview(true));
$('#close-account-preview')?.addEventListener('click', () => toggleAccountPreview(false));
document.addEventListener('click', (event) => {
  if (!event.target.closest('.account-preview, #account-preview-trigger, .more-button')) {
    toggleAccountPreview(false);
  }
});

document.querySelectorAll('[data-account-action]').forEach((button) => {
  button.addEventListener('click', () => {
    const action = button.dataset.accountAction;
    if (action === 'services') setDashboardPage('accounts');
    if (action === 'theme') document.querySelector('.account-theme')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const messages = {
      settings: 'Account settings are ready for your profile and work details',
      privacy: 'Your consent and privacy controls are ready to review'
    };
    if (messages[action]) {
      $('#toast').textContent = messages[action];
      $('#toast').classList.add('show');
      setTimeout(() => $('#toast').classList.remove('show'), 2600);
    }
    toggleAccountPreview(false);
  });
});

document.querySelectorAll('.theme-choice').forEach((button) => {
  button.addEventListener('click', () => {
    const theme = button.dataset.theme;
    document.body.classList.toggle('dark-theme', theme === 'dark');
    document.body.classList.toggle('system-theme', theme === 'system');
    document.querySelectorAll('.theme-choice').forEach((choice) => choice.classList.toggle('active', choice === button));
    localStorage.setItem('finance-buddy-theme', theme);
  });
});

$('#sign-out')?.addEventListener('click', () => {
  toggleAccountPreview(false);
  document.body.classList.remove('workspace-open', 'dark-theme', 'system-theme');
  $('.app-shell').style.display = 'none';
  $('#launch-screen').style.display = 'block';
  $('#auth-screen').hidden = true;
  window.scrollTo(0, 0);
});

function updateDashboard() {
  const available = state.income - state.spent;
  const spendRate = state.income ? (state.spent / state.income) * 100 : 0;
  const savingsRate = state.income ? Math.max(0, (available / state.income) * 100) : 0;
  $('#income-value').textContent = formatInr(state.income);
  $('#spent-value').textContent = formatInr(state.spent);
  $('#available-value').textContent = formatInr(available);
  $('#spent-percent').textContent = `${spendRate.toFixed(1)}%`;
  $('#savings-value').textContent = `${savingsRate.toFixed(1)}%`;
  $('#spent-meter').style.width = `${Math.min(spendRate, 100)}%`;

  const miniRing = document.querySelector('.mini-ring');
  if (miniRing) {
    miniRing.style.background = `conic-gradient(#91caa6 0 ${savingsRate}%, #edf1ed ${savingsRate}% 100%)`;
    const ringSpan = miniRing.querySelector('span');
    if (ringSpan) ringSpan.textContent = `${Math.round(savingsRate)}%`;
  }

  const safeBuffer = state.essentials ? available / state.essentials : 0;
  const healthText = $('#ai-health-text');
  if (healthText) {
    const healthStatus = safeBuffer >= 2 ? 'Healthy' : safeBuffer >= 1 ? 'Moderate' : 'Tight Buffer';
    healthText.textContent = `Buffer: ${safeBuffer.toFixed(1)} mo · ${healthStatus}`;
  }

  const liveContext = $('#chat-live-context');
  if (liveContext) {
    liveContext.textContent = `Linked to: Alex Morgan • ${formatInr(available)} Available`;
  }

  const message = $('#agent-message');
  if (message) {
    let intro = 'Your latest snapshot is in.';
    let title = 'Protect your breathing room';
    let detail = `You have ${safeBuffer.toFixed(1)} months of essential spending available. Keep this buffer visible before adding new commitments.`;
    if (savingsRate >= 45) {
      intro = 'Based on your latest update, your month is looking strong. You have room to make progress without squeezing your day-to-day.';
      title = 'Keep your buffer intact';
      detail = `Your available cash covers ${safeBuffer.toFixed(1)} months of essential spending. That is a solid base.`;
    } else if (spendRate >= 75) {
      intro = 'Spending is moving faster than your income this month. A small reset now can keep the month from feeling tight.';
      title = 'Slow the flexible spend';
      detail = `${spendRate.toFixed(0)}% of income is already committed. Pause non-essential purchases until your next income update.`;
    } else {
      intro = 'You are building a useful cushion. The next update will help sharpen where to direct it.';
      title = 'Make the next rupee intentional';
      detail = `You have ${formatInr(available)} available after spending. Consider directing a portion toward your highest-priority goal.`;
    }
    message.querySelector(':scope > p')?.remove();
    const firstParagraph = document.createElement('p');
    firstParagraph.textContent = intro;
    message.prepend(firstParagraph);
    const firstRecommendation = message.querySelector('.recommendation strong');
    const firstDetail = message.querySelector('.recommendation p');
    if (firstRecommendation) firstRecommendation.textContent = title;
    if (firstDetail) firstDetail.textContent = detail;
  }
  renderCommitments();
}

function renderCommitments() {
  const list = $('#commitment-list');
  const empty = $('#commitment-empty');
  if (!list || !empty) return;
  list.querySelectorAll('.commitment-row').forEach((row) => row.remove());
  empty.style.display = commitments.length ? 'none' : 'flex';

  commitments.forEach((commitment, index) => {
    const row = document.createElement('div');
    row.className = 'commitment-row';

    const iconSpan = document.createElement('span');
    iconSpan.className = `common-expense-icon ${(commitment.category || '').toLowerCase()}`;
    iconSpan.textContent = commitment.icon || '◎';

    const detailDiv = document.createElement('div');
    detailDiv.className = 'commitment-detail';
    const nameStrong = document.createElement('strong');
    nameStrong.textContent = commitment.name;
    const catSpan = document.createElement('span');
    catSpan.textContent = `${commitment.category} · monthly`;
    detailDiv.append(nameStrong, catSpan);

    const amountStrong = document.createElement('strong');
    amountStrong.className = 'commitment-amount';
    amountStrong.textContent = formatInr(commitment.amount);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-commitment';
    removeBtn.setAttribute('aria-label', `Remove ${commitment.name}`);
    removeBtn.dataset.commitmentIndex = String(index);
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => {
      commitments.splice(index, 1);
      renderCommitments();
    });

    row.append(iconSpan, detailDiv, amountStrong, removeBtn);
    list.append(row);
  });

  const total = commitments.reduce((sum, commitment) => sum + commitment.amount, 0);
  $('#commitment-total').textContent = formatInr(total);
  $('#commitment-count').textContent = `${commitments.length} added`;
  $('#commitment-remaining').textContent = formatInr(Math.max(0, state.income - total));
}

function addCommitment(name, category, amount, icon = '◎') {
  const sanitizedName = name.trim();
  if (!sanitizedName || isNaN(amount) || amount <= 0) return;
  const existing = commitments.find((c) => c.name.toLowerCase() === sanitizedName.toLowerCase());
  if (existing) {
    existing.amount = amount;
  } else {
    commitments.push({ name: sanitizedName, category, amount, icon });
  }
  renderCommitments();
  $('#toast').textContent = `${sanitizedName} added to monthly commitments`;
  $('#toast').classList.add('show');
  setTimeout(() => $('#toast').classList.remove('show'), 2600);
}

document.querySelectorAll('.common-expense-option').forEach((button) => {
  button.addEventListener('click', () => {
    addCommitment(
      button.dataset.commitmentName || '',
      button.dataset.commitmentCategory || 'General',
      Number(button.dataset.commitmentAmount) || 0,
      button.querySelector('.common-expense-icon')?.textContent || '◎'
    );
  });
});

$('#commitment-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const name = String(form.get('name') || '').trim();
  const amount = Number(form.get('amount'));
  if (!name || isNaN(amount) || amount <= 0) return;
  addCommitment(name, 'Custom', amount);
  event.currentTarget.reset();
});

$('#open-update')?.addEventListener('click', () => $('#update-dialog')?.showModal());
$('#update-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  state.income = Number(form.get('income')) || 0;
  state.spent = Number(form.get('spent')) || 0;
  state.essentials = Number(form.get('essentials')) || 0;
  updateDashboard();
  $('#update-dialog')?.close();
  $('#toast').textContent = 'Snapshot updated';
  $('#toast').classList.add('show');
  setTimeout(() => $('#toast').classList.remove('show'), 2600);

  const note = String(form.get('note') || '').trim();
  if (note) {
    const row = document.createElement('div');
    row.className = 'activity-row';

    const icon = document.createElement('div');
    icon.className = 'activity-icon green';
    icon.textContent = '✣';

    const detail = document.createElement('div');
    detail.className = 'activity-detail';
    const strong = document.createElement('strong');
    strong.textContent = note;
    const span = document.createElement('span');
    span.textContent = 'Just now · Update';
    detail.append(strong, span);

    const amount = document.createElement('strong');
    amount.className = 'activity-amount';
    amount.textContent = 'Snapshot';

    row.append(icon, detail, amount);
    $('#activity-list')?.prepend(row);
  }
});

$('#ask-agent')?.addEventListener('click', () => {
  setDashboardPage('assistant');
  $('#helper-prompt')?.focus();
});

// ================= AI ASSISTANT STRATEGY DESK ENGINE =================
const helperKnowledgeBase = {
  cash: () => {
    const available = state.income - state.spent;
    const needed3Mo = state.essentials * 3;
    return {
      paragraphs: [
        `Here is your 30-day cash optimization blueprint based on your current snapshot:`,
        `You currently bring in **${formatInr(state.income)}** and spend **${formatInr(state.spent)}**, leaving **${formatInr(available)}** in available free cash flow.`
      ],
      list: [
        `**Lock Essential Runway:** Your essential spending baseline is ${formatInr(state.essentials)}/mo. Aim for a target of ${formatInr(needed3Mo)} (3 months).`,
        `**Accelerate Invoicing:** Offer a 2% prompt-pay incentive to recurring clients to bring receivables forward by 10-14 days.`,
        `**Discretionary Audit:** Review variable lifestyle costs and pause uncommitted growth spend until your available cash covers >2 months of essentials.`
      ],
      actions: [
        { label: '◈ Test In Scenario Lab', action: 'simulations' },
        { label: '＋ Add Expense', action: 'add-expense' }
      ]
    };
  },
  plan: () => {
    const safeExpBudget = Math.round((state.income - state.spent) * 0.25);
    return {
      paragraphs: [
        `Here is a structured 90-day growth and stabilization plan for your business context:`,
        `With **${formatInr(state.income - state.spent)}** available monthly, we recommend reserving **${formatInr(safeExpBudget)}** as a dedicated growth experimentation fund.`
      ],
      list: [
        `**Days 1–30 (Foundation):** Benchmark highest-margin services and lock your fixed cost ceiling.`,
        `**Days 31–60 (Channel Validation):** Test one high-intent client channel with a capped ₹${safeExpBudget.toLocaleString('en-IN')} test budget.`,
        `**Days 61–90 (Scaling):** Reinvest only if ROI exceeds 2.2x and your baseline buffer remains completely untouched.`
      ],
      actions: [
        { label: '◈ Evaluate Growth Test', action: 'simulations' },
        { label: '◎ Update Goals', action: 'goals' }
      ]
    };
  },
  hire: () => {
    const available = state.income - state.spent;
    const safeHireLimit = Math.round(available * 0.5);
    return {
      paragraphs: [
        `Evaluating new hiring capacity from your live cash flow:`,
        `A sustainable hire must be backed by repeatable recurring revenue, not temporary emergency buffers. Currently, your safe hiring headroom is capped at **${formatInr(safeHireLimit)}/month**.`
      ],
      list: [
        `**Revenue Multiplier:** A new full-time or contractor role should directly support at least 1.5x their monthly cost in revenue capacity.`,
        `**Contract Trial:** Start with a 60-day milestone contractor agreement before committing to a permanent fixed monthly payroll.`,
        `**Runway Stress Test:** Ensure you have 4+ months of buffer reserves before taking on ongoing payroll liabilities.`
      ],
      actions: [
        { label: '◈ Run Hiring Simulation', action: 'simulations' },
        { label: '⌁ Check Commitments', action: 'accounts' }
      ]
    };
  },
  buffer: () => {
    const target3Mo = state.essentials * 3;
    const target6Mo = state.essentials * 6;
    const available = state.income - state.spent;
    return {
      paragraphs: [
        `Safety buffer analysis for your current household and business baseline:`,
        `Your declared monthly essentials are **${formatInr(state.essentials)}**.`
      ],
      list: [
        `**Tier 1 (Emergency Buffer):** ${formatInr(target3Mo)} (3 months of essential baseline costs).`,
        `**Tier 2 (Full Runway):** ${formatInr(target6Mo)} (6 months of baseline protection).`,
        `**Current Snapshot:** Your monthly available cushion of ${formatInr(available)} allows you to reach Tier 1 in ~${Math.ceil(target3Mo / (available || 1))} months with disciplined saving.`
      ],
      actions: [
        { label: '◎ View Goals Tracker', action: 'goals' },
        { label: '＋ Update Numbers', action: 'update' }
      ]
    };
  },
  commitments: () => {
    const totalCommitted = commitments.reduce((s, c) => s + c.amount, 0);
    return {
      paragraphs: [
        `Reviewing your monthly fixed commitments:`,
        `You have **${commitments.length} active commitments** totaling **${formatInr(totalCommitted)}/month**.`
      ],
      list: [
        `**Committed Ratio:** ${state.income ? ((totalCommitted / state.income) * 100).toFixed(1) : 0}% of your monthly income is locked into commitments.`,
        `**Remaining Headroom:** ${formatInr(Math.max(0, state.income - totalCommitted))} is left for flexible living and strategic growth investments.`,
        `**Recommendation:** Keep fixed commitments below 55% of gross income to retain financial adaptability.`
      ],
      actions: [
        { label: '⌁ Manage Monthly Commitments', action: 'accounts' }
      ]
    };
  }
};

function generateAssistantReply(question) {
  const q = question.toLowerCase();
  if (q.includes('cash') || q.includes('flow') || q.includes('sprint')) return helperKnowledgeBase.cash();
  if (q.includes('plan') || q.includes('growth') || q.includes('90')) return helperKnowledgeBase.plan();
  if (q.includes('hire') || q.includes('employee') || q.includes('team') || q.includes('contractor')) return helperKnowledgeBase.hire();
  if (q.includes('buffer') || q.includes('emergency') || q.includes('safety') || q.includes('runway')) return helperKnowledgeBase.buffer();
  if (q.includes('commit') || q.includes('audit') || q.includes('subscription') || q.includes('fixed')) return helperKnowledgeBase.commitments();

  // Dynamic fallback advice
  const available = state.income - state.spent;
  return {
    paragraphs: [
      `I analyzed your question regarding: "${question}" in relation to your current finances.`,
      `With **${formatInr(state.income)}** income and **${formatInr(available)}** available cash flow, here is how you should evaluate this decision:`
    ],
    list: [
      `**Cash Impact:** Quantify the maximum downside risk and ensure it does not compromise your ${formatInr(state.essentials)} monthly essential baseline.`,
      `**Reversibility Test:** Prefer two-way door decisions (e.g. monthly subscriptions or short trials) over rigid multi-month commitments.`,
      `**Success Metric:** Set a specific 30-day review checkpoint to confirm if the expected outcome is being achieved.`
    ],
    actions: [
      { label: '◈ Test In Decision Studio', action: 'simulations' },
      { label: '＋ Update Snapshot', action: 'update' }
    ]
  };
}

// ================= OLLAMA LOCAL AI INTEGRATION =================
let isOllamaOnline = false;
let currentOllamaModel = localStorage.getItem('finance-buddy-ollama-model') || 'llama3.2';

async function fetchOllamaEndpoint(endpoint, options = {}) {
  const urls = [
    `/ollama${endpoint}`,
    `http://localhost:11434${endpoint}`,
    `http://127.0.0.1:11434${endpoint}`
  ];

  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timeoutMs = options.timeout || 4000;
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        return res;
      }
    } catch {
      // try next url
    }
  }
  return null;
}

async function checkOllamaStatus(showToastFeedback = false) {
  const dot = $('#ollama-status-dot');
  const select = $('#ollama-model-select');
  const statusLabel = $('#ai-engine-status');

  try {
    const res = await fetchOllamaEndpoint('/api/tags', { timeout: 2500 });
    if (res) {
      const data = await res.json();
      isOllamaOnline = true;
      if (dot) {
        dot.classList.add('online');
        dot.title = 'Ollama local server is online & connected';
      }

      if (data.models && data.models.length > 0 && select) {
        select.innerHTML = '';
        data.models.forEach((m) => {
          const modelTag = m.name;
          const opt = document.createElement('option');
          opt.value = modelTag;
          opt.textContent = modelTag;
          if (modelTag === currentOllamaModel || modelTag.startsWith(currentOllamaModel)) {
            opt.selected = true;
            currentOllamaModel = modelTag;
          }
          select.append(opt);
        });
        if (!select.value && select.options.length > 0) {
          currentOllamaModel = select.options[0].value;
          select.options[0].selected = true;
        }
      }

      if (statusLabel) {
        statusLabel.textContent = `⚡ 100% Private Local AI · Connected to Ollama (${currentOllamaModel})`;
        statusLabel.style.color = '#2d6a4f';
      }

      if (showToastFeedback) {
        $('#toast').textContent = `Ollama connected (model: ${currentOllamaModel})`;
        $('#toast').classList.add('show');
        setTimeout(() => $('#toast').classList.remove('show'), 2600);
      }
      return true;
    }
  } catch {
    isOllamaOnline = false;
  }

  // Offline / Fallback state
  isOllamaOnline = false;
  if (dot) {
    dot.classList.remove('online');
    dot.title = 'Ollama offline. Using intelligent local rule engine.';
  }
  if (statusLabel) {
    statusLabel.textContent = '⚡ 100% Private Local AI · Smart rules active (start Ollama for LLM)';
    statusLabel.style.color = '#7a8e83';
  }
  if (showToastFeedback) {
    $('#toast').textContent = 'Ollama not detected · Local rules active';
    $('#toast').classList.add('show');
    setTimeout(() => $('#toast').classList.remove('show'), 2600);
  }
  return false;
}

// Initial status check & model selection listener
checkOllamaStatus();
$('#check-ollama-btn')?.addEventListener('click', () => checkOllamaStatus(true));
$('#ollama-model-select')?.addEventListener('change', (e) => {
  currentOllamaModel = e.target.value;
  localStorage.setItem('finance-buddy-ollama-model', currentOllamaModel);
  checkOllamaStatus(true);
});

async function queryOllama(promptText) {
  const available = state.income - state.spent;
  const systemContext = `You are Finance Buddy, an expert personal and business financial advisor.
User: Alex Morgan.
Financial Snapshot:
- Monthly Income: ${formatInr(state.income)}
- Spent So Far: ${formatInr(state.spent)}
- Available Cash Flow: ${formatInr(available)}
- Essential Baseline: ${formatInr(state.essentials)}/month
- Active Monthly Commitments: ${commitments.length} items.

Instructions:
- Provide clear, direct, and actionable financial advice tailored specifically to the user's question.
- Use bullet points where appropriate with bold numbers.
- Be encouraging, realistic, and practical.`;

  try {
    const res = await fetchOllamaEndpoint('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: currentOllamaModel || 'llama3.2',
        prompt: `${systemContext}\n\nUser Question: ${promptText}\n\nAdvisor Response:`,
        stream: false,
        options: { temperature: 0.7 }
      }),
      timeout: 30000
    });

    if (res) {
      const data = await res.json();
      const rawText = data.response || '';
      if (rawText.trim()) {
        return parseOllamaResponseToStructure(rawText);
      }
    }
  } catch (err) {
    console.warn('Ollama query error:', err);
  }
  return null;
}

function parseOllamaResponseToStructure(rawText) {
  const paragraphs = [];
  const list = [];
  const rawParagraphs = rawText.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  rawParagraphs.forEach((block) => {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    const isListBlock = lines.every((l) => /^(\*|-|\d+\.)\s+/.test(l));

    if (isListBlock) {
      lines.forEach((l) => list.push(l.replace(/^(\*|-|\d+\.)\s+/, '')));
    } else {
      paragraphs.push(block.replace(/\n/g, ' '));
    }
  });

  if (paragraphs.length === 0 && list.length > 0) {
    paragraphs.push('Here is the strategic breakdown for your decision:');
  }

  return {
    paragraphs: paragraphs,
    list: list,
    actions: [
      { label: '◈ Test In Decision Studio', action: 'simulations' },
      { label: '⌁ View Commitments', action: 'accounts' },
      { label: '＋ Update Numbers', action: 'update' }
    ]
  };
}


async function handleUserQuestion(questionText) {
  const stream = $('#chat-stream');
  if (!stream || !questionText) return;

  // 1. Append User Bubble
  const userMsg = document.createElement('div');
  userMsg.className = 'chat-message user';
  const userAvatar = document.createElement('span');
  userAvatar.className = 'chat-avatar';
  userAvatar.textContent = 'AM';
  const userContent = document.createElement('div');
  userContent.className = 'chat-content';
  const userMeta = document.createElement('div');
  userMeta.className = 'chat-header-meta';
  const userStrong = document.createElement('strong');
  userStrong.textContent = 'You';
  const userTime = document.createElement('time');
  userTime.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  userMeta.append(userStrong, userTime);
  const userBubble = document.createElement('div');
  userBubble.className = 'chat-bubble';
  const userP = document.createElement('p');
  userP.textContent = questionText;
  userBubble.append(userP);
  userContent.append(userMeta, userBubble);
  userMsg.append(userAvatar, userContent);
  stream.append(userMsg);

  // 2. Show Typing Indicator
  const typingIndicator = document.createElement('div');
  typingIndicator.className = 'chat-typing helper-response';
  typingIndicator.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
  stream.append(typingIndicator);
  typingIndicator.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  // 3. Query Ollama if online, else use rules engine
  let replyData = null;
  if (isOllamaOnline) {
    replyData = await queryOllama(questionText);
  }
  if (!replyData) {
    replyData = generateAssistantReply(questionText);
  }

  // 4. Render Response
  typingIndicator.remove();
  const assistantMsg = document.createElement('div');
  assistantMsg.className = 'chat-message assistant helper-response';
  const assistantAvatar = document.createElement('span');
  assistantAvatar.className = 'chat-avatar';
  assistantAvatar.textContent = '✦';

  const assistantContent = document.createElement('div');
  assistantContent.className = 'chat-content';
  const assistantMeta = document.createElement('div');
  assistantMeta.className = 'chat-header-meta';
  const assistantStrong = document.createElement('strong');
  assistantStrong.textContent = isOllamaOnline ? `Finance Buddy (${currentOllamaModel})` : 'Finance Buddy';
  const assistantTime = document.createElement('time');
  assistantTime.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  assistantMeta.append(assistantStrong, assistantTime);

  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble';

  if (replyData.paragraphs) {
    replyData.paragraphs.forEach((pText) => {
      const p = document.createElement('p');
      p.innerHTML = pText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      bubble.append(p);
    });
  }

  if (replyData.list && replyData.list.length > 0) {
    const ul = document.createElement('ul');
    replyData.list.forEach((itemText) => {
      const li = document.createElement('li');
      li.innerHTML = itemText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      ul.append(li);
    });
    bubble.append(ul);
  }

  if (replyData.actions && replyData.actions.length > 0) {
    const actionsWrap = document.createElement('div');
    actionsWrap.className = 'chat-action-cards';
    replyData.actions.forEach((act) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chat-action-btn';
      btn.dataset.chatAction = act.action;
      btn.textContent = act.label;
      actionsWrap.append(btn);
    });
    bubble.append(actionsWrap);
  }

  assistantContent.append(assistantMeta, bubble);
  assistantMsg.append(assistantAvatar, assistantContent);
  stream.append(assistantMsg);
  assistantMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Wire form submit
$('#helper-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const input = $('#helper-prompt');
  if (!input) return;
  const question = input.value.trim();
  if (!question) return;
  handleUserQuestion(question);
  input.value = '';
});

// Wire prompt chips
document.querySelectorAll('.prompt-chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    const prompt = chip.dataset.prompt || '';
    if (!prompt) return;
    handleUserQuestion(prompt);
  });
});


// Wire Action Buttons inside chat stream (event delegation)
$('#chat-stream')?.addEventListener('click', (event) => {
  const btn = event.target.closest('[data-chat-action]');
  if (!btn) return;
  const action = btn.dataset.chatAction;
  if (action === 'simulations') setDashboardPage('simulations');
  if (action === 'accounts') setDashboardPage('accounts');
  if (action === 'goals') setDashboardPage('goals');
  if (action === 'update') $('#open-update')?.click();
  if (action === 'add-expense') $('#add-expense')?.click();
});

// Chat Toolbar: Clear & Export
$('#clear-chat')?.addEventListener('click', () => {
  const stream = $('#chat-stream');
  if (!stream) return;
  stream.innerHTML = `
    <div class="chat-message assistant">
      <span class="chat-avatar">✦</span>
      <div class="chat-content">
        <div class="chat-header-meta">
          <strong>Finance Buddy</strong>
          <time>Just now</time>
        </div>
        <div class="chat-bubble">
          <p>Chat cleared. Ready for your next strategic question.</p>
          <div class="chat-action-cards">
            <button type="button" class="chat-action-btn" data-chat-action="simulations">◈ Run Simulation</button>
            <button type="button" class="chat-action-btn" data-chat-action="update">＋ Update Numbers</button>
          </div>
        </div>
      </div>
    </div>
  `;
  $('#toast').textContent = 'Chat history cleared';
  $('#toast').classList.add('show');
  setTimeout(() => $('#toast').classList.remove('show'), 2600);
});

$('#export-chat')?.addEventListener('click', () => {
  const messages = [...document.querySelectorAll('#chat-stream .chat-message')].map((msg) => {
    const sender = msg.querySelector('.chat-header-meta strong')?.textContent || 'User';
    const text = msg.querySelector('.chat-bubble')?.innerText || '';
    return `[${sender}]\n${text}\n`;
  }).join('\n---\n\n');

  if (!messages.trim()) {
    $('#toast').textContent = 'No messages to export';
    $('#toast').classList.add('show');
    setTimeout(() => $('#toast').classList.remove('show'), 2600);
    return;
  }

  const blob = new Blob([messages], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `finance-buddy-strategy-${new Date().toISOString().slice(0,10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  $('#toast').textContent = 'Advice transcript downloaded';
  $('#toast').classList.add('show');
  setTimeout(() => $('#toast').classList.remove('show'), 2600);
});

// Milestone Checklists & Plan Management
function updatePlanMilestoneProgress() {
  const checkboxes = document.querySelectorAll('#plan-steps-container input[type="checkbox"]');
  const checked = document.querySelectorAll('#plan-steps-container input[type="checkbox"]:checked');
  const label = $('#plan-progress-label');
  if (label) {
    label.textContent = `${checked.length} of ${checkboxes.length} completed`;
  }
}

$('#plan-steps-container')?.addEventListener('change', (event) => {
  const input = event.target;
  if (input.matches('input[type="checkbox"]')) {
    const stepCard = input.closest('.plan-step');
    if (stepCard) {
      stepCard.classList.toggle('completed', input.checked);
    }
    updatePlanMilestoneProgress();
  }
});

$('#save-plan')?.addEventListener('click', (event) => {
  const checkedCount = document.querySelectorAll('#plan-steps-container input[type="checkbox"]:checked').length;
  $('#toast').textContent = `Expansion plan saved (${checkedCount} milestones active)`;
  $('#toast').classList.add('show');
  setTimeout(() => $('#toast').classList.remove('show'), 2600);
});

$('#custom-plan-step')?.addEventListener('click', () => {
  const customTitle = prompt('Enter a new expansion milestone title:');
  if (!customTitle || !customTitle.trim()) return;
  const container = $('#plan-steps-container');
  if (!container) return;
  const count = container.querySelectorAll('.plan-step').length + 1;
  const stepDiv = document.createElement('div');
  stepDiv.className = 'plan-step';
  stepDiv.dataset.step = String(count);

  const stepCheck = document.createElement('div');
  stepCheck.className = 'step-check';
  const chk = document.createElement('input');
  chk.type = 'checkbox';
  chk.id = `step-${count}-check`;
  const lbl = document.createElement('label');
  lbl.htmlFor = `step-${count}-check`;
  lbl.className = 'step-number';
  lbl.textContent = count < 10 ? `0${count}` : String(count);
  stepCheck.append(chk, lbl);

  const detail = document.createElement('div');
  const strong = document.createElement('strong');
  strong.textContent = customTitle.trim();
  const p = document.createElement('p');
  p.textContent = 'Custom milestone added from your strategy workspace.';
  const meta = document.createElement('div');
  meta.className = 'step-meta';
  meta.innerHTML = '<span class="step-tag queued">Custom</span> • Review regularly';
  detail.append(strong, p, meta);

  stepDiv.append(stepCheck, detail);
  container.append(stepDiv);
  updatePlanMilestoneProgress();
  $('#toast').textContent = 'New milestone added to expansion plan';
  $('#toast').classList.add('show');
  setTimeout(() => $('#toast').classList.remove('show'), 2600);
});


function updateSimulator(simulator) {
  const inputs = [...simulator.querySelectorAll('input[data-scenario]')];
  const values = Object.fromEntries(inputs.map((input) => [input.dataset.scenario, Number(input.value)]));
  const surplus = (values.revenue || 0) - (values.cost || 0) - (values.investment || 0);
  const margin = values.revenue ? (surplus / values.revenue) * 100 : 0;
  const signal = surplus <= 0 ? 'Needs a reset' : margin < 15 ? 'Watch closely' : 'Healthy';
  const track = Math.max(8, Math.min(96, margin * 2.3));

  const outputs = simulator.querySelectorAll('output');
  if (outputs[0]) outputs[0].textContent = formatInr(values.revenue || 0);
  if (outputs[1]) outputs[1].textContent = formatInr(values.cost || 0);
  if (outputs[2]) outputs[2].textContent = formatInr(values.investment || 0);

  const resultValues = simulator.querySelectorAll('.sim-results strong');
  if (resultValues[0]) resultValues[0].textContent = formatInr(surplus);
  if (resultValues[1]) resultValues[1].textContent = `${Math.round(margin)}%`;

  const signalEl = simulator.querySelector('.sim-signal');
  if (signalEl) {
    signalEl.textContent = signal;
    signalEl.style.color = surplus <= 0 ? '#f4ae95' : margin < 15 ? '#f2d98c' : '#a0e0a8';
  }
  const trackEl = simulator.querySelector('.sim-track span');
  if (trackEl) trackEl.style.width = `${track}%`;
}

document.querySelectorAll('.scenario-simulator').forEach((simulator) => {
  simulator.querySelectorAll('input[data-scenario]').forEach((input) => input.addEventListener('input', () => updateSimulator(simulator)));
  updateSimulator(simulator);
});

document.querySelectorAll('[data-scenario-reset]').forEach((button) => {
  button.addEventListener('click', () => {
    const simulator = button.closest('.scenario-lab')?.querySelector('.scenario-simulator');
    if (!simulator) return;
    const defaults = { revenue: 120000, cost: 72000, investment: 12000 };
    simulator.querySelectorAll('input[data-scenario]').forEach((input) => {
      if (input.dataset.scenario in defaults) {
        input.value = defaults[input.dataset.scenario];
      }
    });
    updateSimulator(simulator);
  });
});

document.querySelectorAll('.simulation-card').forEach((card) => {
  card.addEventListener('click', () => {
    const targetPage = card.dataset.simulation;
    document.querySelectorAll('.simulation-card').forEach((item) => item.classList.toggle('active', item === card));
    document.querySelectorAll('.simulation-page').forEach((page) => page.classList.toggle('active', page.dataset.page === targetPage));
  });
});

const simulationResults = {
  cashflow: (values) => {
    const available = state.income - state.spent;
    const neededBuffer = (values.buffer || 3) * state.essentials;
    const safe = available - (values.cost || 0) >= neededBuffer;
    return safe
      ? { title: 'This fits your current plan.', text: `After this ${formatInr(values.cost || 0)} monthly cost, you would still keep your ${values.buffer}-month essential buffer visible. Review it again after your next income update.` }
      : { title: 'Pause and protect your buffer.', text: `This change would take your available cash below the ${values.buffer}-month buffer you selected. Reduce the cost, delay it, or build more cash first.`, warning: true };
  },
  hiring: (values) => {
    const returnRatio = values.cost ? values.revenue / values.cost : 0;
    return returnRatio >= 1.4
      ? { title: 'Promising, with a proof point.', text: `The role needs about ${formatInr(values.cost || 0)} each month and supports ${formatInr(values.revenue || 0)} of revenue. Set a 90-day target before making it permanent.` }
      : { title: 'The return is not clear yet.', text: `The expected revenue does not create enough room above the ${formatInr(values.cost || 0)} monthly cost. Test the work with a smaller commitment first.`, warning: true };
  },
  debt: (values) => {
    const months = values.payment ? Math.ceil(values.balance / values.payment) : 0;
    return months <= 12
      ? { title: `A focused ${months}-month payoff is possible.`, text: `Keep ${formatInr(values.payment || 0)} available each month, but do not use money reserved for essentials or your emergency buffer.` }
      : { title: 'Choose breathing room over speed.', text: `This payment would take around ${months} months. Keep the plan sustainable and ask Finance Buddy to compare a second repayment amount.`, warning: true };
  },
  growth: (values) => {
    const returnRatio = values.budget ? values.return / values.budget : 0;
    return returnRatio >= 2
      ? { title: 'A measurable experiment.', text: `The target is ${Math.round(returnRatio)}x the test budget. Run it with a fixed ${formatInr(values.budget || 0)} cap and review the result after 30 days.` }
      : { title: 'Tighten the experiment first.', text: `The expected return is less than 2x the ${formatInr(values.budget || 0)} budget. Lower the test cost or define a stronger success metric before starting.`, warning: true };
  }
};

document.querySelectorAll('.simulation-form').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = Object.fromEntries([...new FormData(form)].map(([key, value]) => [key, Number(value)]));
    const formType = form.dataset.form;
    if (!simulationResults[formType]) return;
    const result = simulationResults[formType](values);
    const panel = document.querySelector(`#${formType}-result`);
    if (!panel) return;
    panel.classList.toggle('warning', Boolean(result.warning));
    const strong = panel.querySelector('strong');
    const p = panel.querySelector('p');
    if (strong) strong.textContent = result.title;
    if (p) p.textContent = result.text;
  });
});

function refreshStockFeed() {
  const rows = [...document.querySelectorAll('.stock-row')];
  if (!rows.length) return;
  rows.forEach((row) => {
    const basePrice = Number(row.dataset.price) || 1000;
    const baseChange = Number(row.dataset.change) || 0;
    const price = basePrice * (1 + (Math.random() - 0.47) / 500);
    const change = baseChange + (Math.random() - 0.48) * 0.18;
    row.dataset.price = price.toFixed(2);
    row.dataset.change = change.toFixed(2);

    const priceEl = row.querySelector('.stock-price');
    if (priceEl) priceEl.textContent = `₹${price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const changeNode = row.querySelector('.stock-change');
    if (changeNode) {
      changeNode.textContent = `${change >= 0 ? '+' : '−'}${Math.abs(change).toFixed(2)}%`;
      changeNode.classList.toggle('positive-change', change >= 0);
      changeNode.classList.toggle('negative-change', change < 0);
    }
  });
  const updatedEl = $('#market-updated');
  if (updatedEl) updatedEl.textContent = 'Updated just now';
  const textEl = $('#stock-update-text');
  if (textEl) textEl.textContent = 'Your watchlist received a new demo price update.';
}

document.querySelectorAll('.save-opportunity').forEach((button) => {
  button.addEventListener('click', () => {
    const saved = button.classList.toggle('saved');
    button.textContent = saved ? '★' : '☆';
    const oppName = button.dataset.opportunity || 'Opportunity';
    $('#toast').textContent = saved ? `${oppName} saved` : `${oppName} removed`;
    $('#toast').classList.add('show');
    setTimeout(() => $('#toast').classList.remove('show'), 2600);
  });
});

$('#refresh-stocks')?.addEventListener('click', refreshStockFeed);
$('#refresh-opportunities')?.addEventListener('click', () => {
  $('#toast').textContent = 'Freelance opportunities refreshed';
  $('#toast').classList.add('show');
  setTimeout(() => $('#toast').classList.remove('show'), 2600);
});

// Periodic ticker only runs when page is visible
let stockInterval = setInterval(() => {
  if (document.visibilityState === 'visible') {
    refreshStockFeed();
  }
}, 8000);

$('#save-plan')?.addEventListener('click', (event) => {
  event.currentTarget.innerHTML = 'Plan saved <span>✓</span>';
  event.currentTarget.classList.add('saved');
  $('#toast').textContent = 'Expansion plan saved to workspace';
  $('#toast').classList.add('show');
  setTimeout(() => $('#toast').classList.remove('show'), 2600);
});

$('#period-select')?.addEventListener('change', (event) => {
  $('#toast').textContent = `Cash flow chart updated to ${event.target.value}`;
  $('#toast').classList.add('show');
  setTimeout(() => $('#toast').classList.remove('show'), 2600);
});

$('#guide-daily')?.addEventListener('click', () => $('#add-expense')?.click());
$('#guide-connect')?.addEventListener('click', () => $('.connections-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
$('#guide-ask')?.addEventListener('click', () => $('.helper-workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));

function showSyncState(button, statusText) {
  button.classList.add('is-syncing');
  button.disabled = true;
  setTimeout(() => {
    button.classList.remove('is-syncing');
    button.disabled = false;
    const statusEl = $('#finvu-status');
    if (statusEl) statusEl.textContent = statusText;
    $('#toast').textContent = 'Transactions refreshed';
    $('#toast').classList.add('show');
    setTimeout(() => $('#toast').classList.remove('show'), 2600);
  }, 700);
}

$('#sync-transactions')?.addEventListener('click', (event) => {
  showSyncState(event.currentTarget, 'Last synced just now · demo data');
});

$('#sync-source')?.addEventListener('click', (event) => {
  showSyncState(event.currentTarget, 'Last synced just now · demo data');
});

$('#connect-source')?.addEventListener('click', () => {
  const statusEl = $('#finvu-status');
  if (statusEl) statusEl.textContent = 'Consent flow ready · provider setup required';
  $('#toast').textContent = 'Finvu consent flow is ready for backend setup';
  $('#toast').classList.add('show');
  setTimeout(() => $('#toast').classList.remove('show'), 3000);
});

$('#add-expense')?.addEventListener('click', () => {
  $('#expense-dialog')?.showModal();
});

$('#expense-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const expenseName = String(form.get('merchant') || '').trim();
  const expenseAmount = Number(form.get('amount'));
  const category = String(form.get('category') || 'Other');
  if (!expenseName || isNaN(expenseAmount) || expenseAmount <= 0) return;

  const row = document.createElement('div');
  row.className = 'transaction-row';

  const icon = document.createElement('div');
  icon.className = 'transaction-icon business';
  icon.textContent = '✣';

  const detail = document.createElement('div');
  detail.className = 'transaction-detail';
  const strong = document.createElement('strong');
  strong.textContent = expenseName;
  const span = document.createElement('span');
  span.textContent = `Just now · ${category}`;
  detail.append(strong, span);

  const amount = document.createElement('strong');
  amount.className = 'transaction-amount';
  amount.textContent = `−${formatInr(expenseAmount)}`;

  row.append(icon, detail, amount);
  $('#transaction-list')?.prepend(row);

  const todayEl = $('#today-total');
  if (todayEl) {
    const currentTotal = Number(todayEl.textContent.replace(/[^0-9]/g, '')) || 0;
    todayEl.textContent = formatInr(currentTotal + expenseAmount);
  }

  $('#expense-dialog')?.close();
  $('#toast').textContent = 'Expense added to today';
  $('#toast').classList.add('show');
  setTimeout(() => $('#toast').classList.remove('show'), 2600);
});

function setDashboardPage(page) {
  const pageMap = { 'ai-helper': 'assistant', connections: 'accounts' };
  const normalizedPage = pageMap[page] || page;
  document.querySelectorAll('.dashboard-section').forEach((section) => {
    const visible = section.dataset.pageSection === normalizedPage;
    section.classList.toggle('page-visible', visible);
    section.style.display = visible ? (section.matches('.metrics-grid, .content-grid, .finance-pulse, .workspace-scenario') ? 'grid' : 'block') : 'none';
  });
  document.querySelectorAll('.bottom-dashboard-item').forEach((item) => item.classList.toggle('active', item.dataset.view === page));
  const title = document.querySelector('.breadcrumb strong');
  if (title) title.textContent = normalizedPage.charAt(0).toUpperCase() + normalizedPage.slice(1);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('.bottom-dashboard-item').forEach((button) => {
  button.addEventListener('click', () => {
    setDashboardPage(button.dataset.view === 'ai-helper' ? 'assistant' : button.dataset.view === 'connections' ? 'accounts' : button.dataset.view);
  });
});

$('#activity-add')?.addEventListener('click', () => $('#expense-dialog')?.showModal());
$('#add-goal')?.addEventListener('click', () => {
  $('#toast').textContent = 'Goal builder is ready for your first goal';
  $('#toast').classList.add('show');
  setTimeout(() => $('#toast').classList.remove('show'), 2600);
});

setDashboardPage('overview');
updateDashboard();
