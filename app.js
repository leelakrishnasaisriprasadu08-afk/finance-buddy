const state = { income: 5420, spent: 2580, essentials: 1350 };
const commitments = [];
const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const $ = (selector) => document.querySelector(selector);

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
}

function showLogin() {
  document.body.classList.remove('workspace-open');
  $('#launch-screen').style.display = 'none';
  $('#auth-screen').hidden = false;
  window.scrollTo(0, 0);
}

$('#open-login').addEventListener('click', showLogin);
$('#hero-start').addEventListener('click', showLogin);
$('#back-to-launch').addEventListener('click', (event) => {
  event.preventDefault();
  document.body.classList.remove('workspace-open');
  $('#auth-screen').hidden = true;
  $('#launch-screen').style.display = 'block';
});
$('#auth-back').addEventListener('click', () => {
  document.body.classList.remove('workspace-open');
  $('#auth-screen').hidden = true;
  $('#launch-screen').style.display = 'block';
});
$('#toggle-password').addEventListener('click', (event) => {
  const password = document.querySelector('input[name="password"]');
  const visible = password.type === 'text';
  password.type = visible ? 'password' : 'text';
  event.currentTarget.textContent = visible ? 'Show' : 'Hide';
});
$('#demo-login').addEventListener('click', showWorkspace);
$('#login-form').addEventListener('submit', (event) => {
  event.preventDefault();
  showWorkspace();
});

document.body.classList.remove('workspace-open');
$('.app-shell').style.display = 'none';

function toggleAccountPreview(force) {
  const panel = $('#account-preview');
  const open = force ?? !panel.classList.contains('open');
  panel.classList.toggle('open', open);
  panel.setAttribute('aria-hidden', String(!open));
  $('#account-preview-trigger').setAttribute('aria-expanded', String(open));
}

$('#account-preview-trigger').addEventListener('click', () => toggleAccountPreview());
$('#close-account-preview').addEventListener('click', () => toggleAccountPreview(false));
document.addEventListener('click', (event) => {
  if (!event.target.closest('.account-preview, #account-preview-trigger')) toggleAccountPreview(false);
});

document.querySelectorAll('[data-account-action]').forEach((button) => {
  button.addEventListener('click', () => {
    const action = button.dataset.accountAction;
    if (action === 'services') setDashboardPage('accounts');
    if (action === 'theme') document.querySelector('.account-theme')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const messages = { settings: 'Account settings are ready for your profile and work details', privacy: 'Your consent and privacy controls are ready to review' };
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

$('#sign-out').addEventListener('click', () => {
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
  $('#income-value').textContent = currency.format(state.income);
  $('#spent-value').textContent = currency.format(state.spent);
  $('#available-value').textContent = currency.format(available);
  $('#spent-percent').textContent = `${spendRate.toFixed(1)}%`;
  $('#savings-value').textContent = `${savingsRate.toFixed(1)}%`;
  $('#spent-meter').style.width = `${Math.min(spendRate, 100)}%`;
  document.querySelector('.mini-ring').style.background = `conic-gradient(#91caa6 0 ${savingsRate}%, #edf1ed ${savingsRate}% 100%)`;

  const safeBuffer = state.essentials ? available / state.essentials : 0;
  const message = $('#agent-message');
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
    title = 'Make the next dollar intentional';
    detail = `You have ${currency.format(available)} available after spending. Consider directing a portion toward your highest-priority goal.`;
  }
  message.querySelector(':scope > p')?.remove();
  const firstParagraph = document.createElement('p');
  firstParagraph.textContent = intro;
  message.prepend(firstParagraph);
  const firstRecommendation = message.querySelector('.recommendation strong');
  const firstDetail = message.querySelector('.recommendation p');
  firstRecommendation.textContent = title;
  firstDetail.textContent = detail;
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
    row.innerHTML = `<span class="common-expense-icon ${commitment.category.toLowerCase()}">${commitment.icon}</span><div class="commitment-detail"><strong>${commitment.name}</strong><span>${commitment.category} · monthly</span></div><strong class="commitment-amount">${formatInr(commitment.amount)}</strong><button type="button" class="remove-commitment" aria-label="Remove ${commitment.name}" data-commitment-index="${index}">×</button>`;
    list.append(row);
  });
  const total = commitments.reduce((sum, commitment) => sum + commitment.amount, 0);
  $('#commitment-total').textContent = formatInr(total);
  $('#commitment-count').textContent = `${commitments.length} added`;
  $('#commitment-remaining').textContent = formatInr(Math.max(0, state.income - total));
  list.querySelectorAll('.remove-commitment').forEach((button) => {
    button.addEventListener('click', () => {
      commitments.splice(Number(button.dataset.commitmentIndex), 1);
      renderCommitments();
    });
  });
}

function addCommitment(name, category, amount, icon = '◎') {
  const existing = commitments.find((commitment) => commitment.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    existing.amount = amount;
  } else {
    commitments.push({ name, category, amount, icon });
  }
  renderCommitments();
  $('#toast').textContent = `${name} added to monthly commitments`;
  $('#toast').classList.add('show');
  setTimeout(() => $('#toast').classList.remove('show'), 2600);
}

document.querySelectorAll('.common-expense-option').forEach((button) => {
  button.addEventListener('click', () => addCommitment(button.dataset.commitmentName, button.dataset.commitmentCategory, Number(button.dataset.commitmentAmount), button.querySelector('.common-expense-icon').textContent));
});

$('#commitment-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const name = String(form.get('name')).trim();
  const amount = Number(form.get('amount'));
  if (!name || !amount || amount < 0) return;
  addCommitment(name, 'Custom', amount);
  event.currentTarget.reset();
});

$('#open-update').addEventListener('click', () => $('#update-dialog').showModal());
$('#update-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  state.income = Number(form.get('income')) || 0;
  state.spent = Number(form.get('spent')) || 0;
  state.essentials = Number(form.get('essentials')) || 0;
  updateDashboard();
  $('#update-dialog').close();
  $('#toast').classList.add('show');
  setTimeout(() => $('#toast').classList.remove('show'), 2600);
  const note = form.get('note');
  if (note) {
    const row = document.createElement('div');
    row.className = 'activity-row';
    row.innerHTML = `<div class="activity-icon green">✣</div><div class="activity-detail"><strong>${note.replace(/[<>]/g, '')}</strong><span>Just now · Update</span></div><strong class="activity-amount">Snapshot</strong>`;
    $('#activity-list').prepend(row);
  }
});

$('#ask-agent').addEventListener('click', () => {
  $('#open-update').click();
});

const helperResponses = {
  cash: {
    user: 'How can I improve cash flow?',
    reply: `Start with a 30-day cash sprint: protect your ${currency.format(state.essentials)} essential baseline, review recurring costs, and invoice earlier where possible. Keep expansion spending variable until your available cash is consistently above one month of essentials.`
  },
  plan: {
    user: 'Create a 90-day growth plan',
    reply: 'Days 1-30: stabilize your operating buffer and measure your highest-margin offer. Days 31-60: test one acquisition channel with a fixed budget. Days 61-90: double down only if the test creates repeatable revenue.'
  },
  hire: {
    user: 'Can I afford to hire?',
    reply: `A hire should be funded by repeatable revenue, not your emergency buffer. At your current snapshot, first model the full monthly cost and confirm it fits inside the portion of available cash you can commit for six months.`
  }
};

function appendHelperMessage(question, response) {
  const stream = $('#chat-stream');
  const userMessage = document.createElement('div');
  userMessage.className = 'chat-message user helper-response';
  userMessage.innerHTML = `<span class="chat-avatar">AM</span><div><strong>You</strong><p>${question.replace(/[<>]/g, '')}</p></div>`;
  const assistantMessage = document.createElement('div');
  assistantMessage.className = 'chat-message assistant helper-response';
  assistantMessage.innerHTML = `<span class="chat-avatar">✦</span><div><strong>Finance Buddy</strong><p>${response}</p></div>`;
  stream.append(userMessage, assistantMessage);
  assistantMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function answerHelper(question) {
  const normalized = question.toLowerCase();
  if (normalized.includes('cash') || normalized.includes('cost')) return helperResponses.cash;
  if (normalized.includes('plan') || normalized.includes('growth') || normalized.includes('expand')) return helperResponses.plan;
  if (normalized.includes('hire') || normalized.includes('team') || normalized.includes('employee')) return helperResponses.hire;
  return { user: question, reply: 'I would break that decision into cash impact, expected return, and a small reversible test. Share the goal, expected cost, and timing, and I can help turn it into a measurable next step.' };
}

$('#helper-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const input = $('#helper-prompt');
  const question = input.value.trim();
  if (!question) return;
  const answer = answerHelper(question);
  appendHelperMessage(answer.user, answer.reply);
  input.value = '';
});

document.querySelectorAll('.prompt-chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    const answer = answerHelper(chip.dataset.prompt);
    appendHelperMessage(answer.user, answer.reply);
  });
});

function formatInr(value) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

function updateSimulator(simulator) {
  const inputs = [...simulator.querySelectorAll('input[data-scenario]')];
  const values = Object.fromEntries(inputs.map((input) => [input.dataset.scenario, Number(input.value)]));
  const surplus = values.revenue - values.cost - values.investment;
  const margin = values.revenue ? (surplus / values.revenue) * 100 : 0;
  const signal = surplus <= 0 ? 'Needs a reset' : margin < 15 ? 'Watch closely' : 'Healthy';
  const track = Math.max(8, Math.min(96, margin * 2.3));
  simulator.querySelectorAll('output')[0].textContent = formatInr(values.revenue);
  simulator.querySelectorAll('output')[1].textContent = formatInr(values.cost);
  simulator.querySelectorAll('output')[2].textContent = formatInr(values.investment);
  const resultValues = simulator.querySelectorAll('.sim-results strong');
  resultValues[0].textContent = formatInr(surplus);
  resultValues[1].textContent = `${Math.round(margin)}%`;
  simulator.querySelector('.sim-signal').textContent = signal;
  simulator.querySelector('.sim-signal').style.color = surplus <= 0 ? '#f4ae95' : margin < 15 ? '#f2d98c' : '#a0e0a8';
  simulator.querySelector('.sim-track span').style.width = `${track}%`;
}

document.querySelectorAll('.scenario-simulator').forEach((simulator) => {
  simulator.querySelectorAll('input[data-scenario]').forEach((input) => input.addEventListener('input', () => updateSimulator(simulator)));
  updateSimulator(simulator);
});

document.querySelectorAll('[data-scenario-reset]').forEach((button) => {
  button.addEventListener('click', () => {
    const simulator = button.closest('.scenario-lab').querySelector('.scenario-simulator');
    const defaults = { revenue: 120000, cost: 72000, investment: 12000 };
    simulator.querySelectorAll('input[data-scenario]').forEach((input) => { input.value = defaults[input.dataset.scenario]; });
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
    const neededBuffer = values.buffer * state.essentials;
    const safe = available - values.cost >= neededBuffer;
    return safe
      ? { title: 'This fits your current plan.', text: `After this ₹${values.cost.toLocaleString('en-IN')} monthly cost, you would still keep your ${values.buffer}-month essential buffer visible. Review it again after your next income update.` }
      : { title: 'Pause and protect your buffer.', text: `This change would take your available cash below the ${values.buffer}-month buffer you selected. Reduce the cost, delay it, or build more cash first.`, warning: true };
  },
  hiring: (values) => {
    const returnRatio = values.cost ? values.revenue / values.cost : 0;
    return returnRatio >= 1.4
      ? { title: 'Promising, with a proof point.', text: `The role needs about ₹${values.cost.toLocaleString('en-IN')} each month and supports ₹${values.revenue.toLocaleString('en-IN')} of revenue. Set a 90-day target before making it permanent.` }
      : { title: 'The return is not clear yet.', text: `The expected revenue does not create enough room above the ₹${values.cost.toLocaleString('en-IN')} monthly cost. Test the work with a smaller commitment first.`, warning: true };
  },
  debt: (values) => {
    const months = values.payment ? Math.ceil(values.balance / values.payment) : 0;
    return months <= 12
      ? { title: `A focused ${months}-month payoff is possible.`, text: `Keep ₹${values.payment.toLocaleString('en-IN')} available each month, but do not use money reserved for essentials or your emergency buffer.` }
      : { title: 'Choose breathing room over speed.', text: `This payment would take around ${months} months. Keep the plan sustainable and ask Finance Buddy to compare a second repayment amount.`, warning: true };
  },
  growth: (values) => {
    const returnRatio = values.budget ? values.return / values.budget : 0;
    return returnRatio >= 2
      ? { title: 'A measurable experiment.', text: `The target is ${Math.round(returnRatio)}x the test budget. Run it with a fixed ₹${values.budget.toLocaleString('en-IN')} cap and review the result after 30 days.` }
      : { title: 'Tighten the experiment first.', text: `The expected return is less than 2x the ₹${values.budget.toLocaleString('en-IN')} budget. Lower the test cost or define a stronger success metric before starting.`, warning: true };
  }
};

document.querySelectorAll('.simulation-form').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = Object.fromEntries([...new FormData(form)].map(([key, value]) => [key, Number(value)]));
    const result = simulationResults[form.dataset.form](values);
    const panel = document.querySelector(`#${form.dataset.form}-result`);
    panel.classList.toggle('warning', Boolean(result.warning));
    panel.querySelector('strong').textContent = result.title;
    panel.querySelector('p').textContent = result.text;
  });
});

function refreshStockFeed() {
  const rows = [...document.querySelectorAll('.stock-row')];
  if (!rows.length) return;
  rows.forEach((row) => {
    const price = Number(row.dataset.price) * (1 + (Math.random() - 0.47) / 500);
    const change = Number(row.dataset.change) + (Math.random() - 0.48) * 0.18;
    row.dataset.price = price.toFixed(2);
    row.dataset.change = change.toFixed(2);
    row.querySelector('.stock-price').textContent = formatInr(price).replace('₹', '₹');
    const changeNode = row.querySelector('.stock-change');
    changeNode.textContent = `${change >= 0 ? '+' : '−'}${Math.abs(change).toFixed(2)}%`;
    changeNode.classList.toggle('positive-change', change >= 0);
    changeNode.classList.toggle('negative-change', change < 0);
  });
  $('#market-updated').textContent = 'Updated just now';
  $('#stock-update-text').textContent = 'Your watchlist received a new demo price update.';
}

document.querySelectorAll('.save-opportunity').forEach((button) => {
  button.addEventListener('click', () => {
    const saved = button.classList.toggle('saved');
    button.textContent = saved ? '★' : '☆';
    $('#toast').textContent = saved ? `${button.dataset.opportunity} saved` : `${button.dataset.opportunity} removed`;
    $('#toast').classList.add('show');
    setTimeout(() => $('#toast').classList.remove('show'), 2600);
  });
});

$('#refresh-stocks').addEventListener('click', refreshStockFeed);
$('#refresh-opportunities').addEventListener('click', () => {
  $('#toast').textContent = 'Freelance opportunities refreshed';
  $('#toast').classList.add('show');
  setTimeout(() => $('#toast').classList.remove('show'), 2600);
});
setInterval(refreshStockFeed, 8000);

$('#save-plan').addEventListener('click', (event) => {
  event.currentTarget.innerHTML = 'Plan saved <span>✓</span>';
  event.currentTarget.classList.add('saved');
});

$('#guide-daily').addEventListener('click', () => $('#add-expense').click());
$('#guide-connect').addEventListener('click', () => $('.connections-panel').scrollIntoView({ behavior: 'smooth', block: 'center' }));
$('#guide-ask').addEventListener('click', () => $('.helper-workspace').scrollIntoView({ behavior: 'smooth', block: 'start' }));

function showSyncState(button, statusText) {
  button.classList.add('is-syncing');
  button.disabled = true;
  setTimeout(() => {
    button.classList.remove('is-syncing');
    button.disabled = false;
    $('#finvu-status').textContent = statusText;
    $('#toast').textContent = 'Transactions refreshed';
    $('#toast').classList.add('show');
    setTimeout(() => $('#toast').classList.remove('show'), 2600);
  }, 700);
}

$('#sync-transactions').addEventListener('click', (event) => {
  showSyncState(event.currentTarget, 'Last synced just now · demo data');
});

$('#sync-source').addEventListener('click', (event) => {
  showSyncState(event.currentTarget, 'Last synced just now · demo data');
});

$('#connect-source').addEventListener('click', () => {
  $('#finvu-status').textContent = 'Consent flow ready · provider setup required';
  $('#toast').textContent = 'Finvu consent flow is ready for backend setup';
  $('#toast').classList.add('show');
  setTimeout(() => $('#toast').classList.remove('show'), 3000);
});

$('#add-expense').addEventListener('click', () => {
  $('#expense-dialog').showModal();
});

$('#expense-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const expenseName = String(form.get('merchant')).trim();
  const expenseAmount = Number(form.get('amount'));
  const category = String(form.get('category'));
  if (!expenseName || !expenseAmount || expenseAmount < 0) return;
  const row = document.createElement('div');
  row.className = 'transaction-row';
  row.innerHTML = `<div class="transaction-icon business">✣</div><div class="transaction-detail"><strong>${expenseName.replace(/[<>]/g, '')}</strong><span>Just now · ${category}</span></div><strong class="transaction-amount">−₹${expenseAmount.toLocaleString('en-IN')}</strong>`;
  $('#transaction-list').prepend(row);
  const total = Number($('#today-total').textContent.replace(/[^0-9]/g, '')) + expenseAmount;
  $('#today-total').textContent = `₹${total.toLocaleString('en-IN')}`;
  $('#expense-dialog').close();
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

$('#activity-add').addEventListener('click', () => $('#expense-dialog').showModal());
$('#add-goal').addEventListener('click', () => {
  $('#toast').textContent = 'Goal builder is ready for your first goal';
  $('#toast').classList.add('show');
  setTimeout(() => $('#toast').classList.remove('show'), 2600);
});

setDashboardPage('overview');
updateDashboard();
