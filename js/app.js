const App = (function () {
  let orders = [];
  let progressMap = {};
  let incomes = [];
  let expenses = [];
  let expenseCategories = [];
  let currentSteps = [];
  let paymentMethods = [];
  let activeView = 'orders';
  let activeFilter = 'semua';
  let searchQuery = '';
  let incomeStartDate = '';
  let incomeEndDate = '';
  let expenseStartDate = '';
  let expenseEndDate = '';
  let expenseCategoryFilter = 'semua';
  let cashStartDate = '';
  let cashEndDate = '';
  let cashInitialBalance = 0;
  let editingId = null;
  let editingIncomeId = null;
  let editingExpenseId = null;
  let statusChangeId = null;
  let invoices = [];
  let invoiceSearchQuery = '';
  let activeInvoiceId = null;
  let shopName = 'Shugen Store';
  let shopContact = '';
  let customers = [];
  let customerSearchQuery = '';
  let customerFilter = 'semua';
  let activeCustomerId = null;
  let editingCustomerId = null;

  const STATUS_LABELS = {
    menunggu_bayar: 'Menunggu Bayar',
    diproses: 'Diproses',
    selesai: 'Selesai',
    dibatalkan: 'Dibatalkan'
  };

  const formatPrice = new Intl.NumberFormat('id-ID').format;
  const formatDate = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric'
  }).format;

  function formatYmd(ymd) {
    if (!ymd) return '';
    const parts = String(ymd).split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      if (!isNaN(d.getTime())) return formatDate(d);
    }
    const fallback = new Date(ymd);
    return isNaN(fallback.getTime()) ? String(ymd) : formatDate(fallback);
  }

  function todayYmd() {
    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return yyyy + '-' + mm + '-' + dd;
  }

  // DOM helpers

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  function matchCustomerName(name1, name2) {
    return String(name1 || '').trim().toLowerCase() === String(name2 || '').trim().toLowerCase();
  }

  function populateCustomerDatalist() {
    const dl = $('#customer-datalist');
    if (!dl) return;
    dl.innerHTML = '';
    const sorted = customers.slice().sort((a, b) =>
      (a.name || '').localeCompare(b.name || '', 'id', { sensitivity: 'base' })
    );
    sorted.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c.name;
      dl.appendChild(opt);
    });
  }

  // Initialization

  async function init() {
    showView('loading');
    try {
      await ShugenDB.open();
      paymentMethods = await ShugenDB.payment.init();
      expenseCategories = await ShugenDB.categories.init();
      orders = await ShugenDB.orders.getAll();
      customers = await ShugenDB.customers.getAll();
      incomes = await ShugenDB.incomes.getAll();
      expenses = await ShugenDB.expenses.getAll();
      invoices = await ShugenDB.invoices.getAll();
      const savedBalance = await ShugenDB.cash.get('initialBalance');
      cashInitialBalance = (savedBalance !== null && savedBalance !== undefined) ? Number(savedBalance) : 0;
      const savedShopName = await ShugenDB.settings.get('shopName');
      shopName = savedShopName || 'Shugen Store';
      const savedShopContact = await ShugenDB.settings.get('shopContact');
      shopContact = savedShopContact || '';
      await refreshProgressMap();
      await loadTheme();
      populateCustomerDatalist();
      render();
      bindEvents();
      registerSW();
      showView('ready');
    } catch (err) {
      console.error(err);
      showView('error');
    }
  }

  async function refreshProgressMap() {
    const allProg = await ShugenDB.progress.getAll();
    progressMap = {};
    allProg.forEach((p) => {
      progressMap[p.orderId] = p;
    });
  }

  function registerSW() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  }

  // View states

  function showView(state) {
    $('#loading-state').hidden = state !== 'loading';
    $('#error-state').hidden = state !== 'error';
    $('#view-orders').hidden = state !== 'ready' || activeView !== 'orders';
    $('#view-customers').hidden = state !== 'ready' || activeView !== 'customers';
    $('#view-incomes').hidden = state !== 'ready' || activeView !== 'incomes';
    $('#view-expenses').hidden = state !== 'ready' || activeView !== 'expenses';
    $('#view-cash').hidden = state !== 'ready' || activeView !== 'cash';
    $('#view-invoices').hidden = state !== 'ready' || activeView !== 'invoices';
    $('#fab-add').hidden = state !== 'ready' || activeView === 'cash' || activeView === 'invoices';

    $('#empty-state').hidden = true;
    $('#empty-filtered').hidden = true;
    $('#order-list').hidden = state !== 'ready';

    $('#customer-empty-state').hidden = true;
    $('#customer-empty-filtered').hidden = true;
    $('#customer-list').hidden = state !== 'ready';

    $('#income-empty-state').hidden = true;
    $('#income-empty-filtered').hidden = true;
    $('#income-list').hidden = state !== 'ready';

    $('#expense-empty-state').hidden = true;
    $('#expense-empty-filtered').hidden = true;
    $('#expense-list').hidden = state !== 'ready';

    $('#cash-empty-state').hidden = true;
    $('#cash-empty-filtered').hidden = true;
    $('#cash-mutation-list').hidden = state !== 'ready';

    $('#invoice-empty-state').hidden = true;
    $('#invoice-empty-filtered').hidden = true;
    $('#invoice-list').hidden = state !== 'ready';

    if (state === 'ready') {
      const fabLabel = activeView === 'incomes'
        ? 'Tambah pemasukan baru'
        : activeView === 'expenses'
          ? 'Tambah pengeluaran baru'
          : activeView === 'customers'
            ? 'Tambah pelanggan baru'
            : 'Tambah pesanan baru';
      $('#fab-add').setAttribute('aria-label', fabLabel);

      const filteredOrders = getFilteredOrders();
      if (orders.length === 0) {
        $('#empty-state').hidden = false;
        $('#order-list').hidden = true;
      } else if (filteredOrders.length === 0) {
        $('#empty-filtered').hidden = false;
        $('#order-list').hidden = true;
      }

      const filteredCustomers = getFilteredCustomers();
      if (customers.length === 0) {
        $('#customer-empty-state').hidden = false;
        $('#customer-list').hidden = true;
      } else if (filteredCustomers.length === 0) {
        $('#customer-empty-filtered').hidden = false;
        $('#customer-list').hidden = true;
      }

      const filteredIncomes = getFilteredIncomes();
      if (incomes.length === 0) {
        $('#income-empty-state').hidden = false;
        $('#income-list').hidden = true;
      } else if (filteredIncomes.length === 0) {
        $('#income-empty-filtered').hidden = false;
        $('#income-list').hidden = true;
      }

      const filteredExpenses = getFilteredExpenses();
      if (expenses.length === 0) {
        $('#expense-empty-state').hidden = false;
        $('#expense-list').hidden = true;
      } else if (filteredExpenses.length === 0) {
        $('#expense-empty-filtered').hidden = false;
        $('#expense-list').hidden = true;
      }

      const allMutations = incomes.length + expenses.length;
      const filteredMutations = getFilteredMutations();
      if (allMutations === 0) {
        $('#cash-empty-state').hidden = false;
        $('#cash-mutation-list').hidden = true;
      } else if (filteredMutations.length === 0) {
        $('#cash-empty-filtered').hidden = false;
        $('#cash-mutation-list').hidden = true;
      }

      const filteredInvoices = getFilteredInvoices();
      if (invoices.length === 0) {
        $('#invoice-empty-state').hidden = false;
        $('#invoice-list').hidden = true;
      } else if (filteredInvoices.length === 0) {
        $('#invoice-empty-filtered').hidden = false;
        $('#invoice-list').hidden = true;
      }
    }
  }

  // Filtering and search

  function getFilteredOrders() {
    let list = orders.slice();
    if (activeFilter !== 'semua') {
      list = list.filter((o) => o.status === activeFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((o) =>
        o.customerName.toLowerCase().includes(q) ||
        o.orderId.toLowerCase().includes(q) ||
        o.game.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return list;
  }

  function getFilteredCustomers() {
    let list = customers.slice();
    if (customerFilter === 'langganan') {
      list = list.filter((c) => Boolean(c.isSubscriber));
    }
    if (customerSearchQuery) {
      const q = customerSearchQuery.toLowerCase();
      list = list.filter((c) =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.contact || '').toLowerCase().includes(q)
      );
    }
    list.sort((a, b) =>
      (a.name || '').localeCompare(b.name || '', 'id', { sensitivity: 'base' })
    );
    return list;
  }

  function getFilteredIncomes() {
    let list = incomes.slice();
    if (incomeStartDate) {
      list = list.filter((inc) => inc.date >= incomeStartDate);
    }
    if (incomeEndDate) {
      list = list.filter((inc) => inc.date <= incomeEndDate);
    }
    list.sort((a, b) => {
      const cmp = String(b.date || '').localeCompare(String(a.date || ''));
      if (cmp !== 0) return cmp;
      const timeDiff = new Date(b.createdAt) - new Date(a.createdAt);
      if (timeDiff !== 0) return timeDiff;
      return (b.id || 0) - (a.id || 0);
    });
    return list;
  }

  function getCategoryName(categoryId) {
    const cat = expenseCategories.find((c) => Number(c.id) === Number(categoryId));
    return cat ? cat.name : 'Tanpa kategori';
  }

  function getFilteredExpenses() {
    let list = expenses.slice();
    if (expenseStartDate) {
      list = list.filter((exp) => exp.date >= expenseStartDate);
    }
    if (expenseEndDate) {
      list = list.filter((exp) => exp.date <= expenseEndDate);
    }
    if (expenseCategoryFilter && expenseCategoryFilter !== 'semua') {
      list = list.filter((exp) => String(exp.categoryId) === String(expenseCategoryFilter));
    }
    list.sort((a, b) => {
      const cmp = String(b.date || '').localeCompare(String(a.date || ''));
      if (cmp !== 0) return cmp;
      const timeDiff = new Date(b.createdAt) - new Date(a.createdAt);
      if (timeDiff !== 0) return timeDiff;
      return (b.id || 0) - (a.id || 0);
    });
    return list;
  }

  function getFilteredMutations() {
    const combined = [];
    incomes.forEach((inc) => {
      combined.push({ type: 'masuk', date: inc.date, amount: inc.amount, ref: inc });
    });
    expenses.forEach((exp) => {
      combined.push({ type: 'keluar', date: exp.date, amount: exp.amount, ref: exp });
    });
    let list = combined;
    if (cashStartDate) {
      list = list.filter((m) => m.date >= cashStartDate);
    }
    if (cashEndDate) {
      list = list.filter((m) => m.date <= cashEndDate);
    }
    list.sort((a, b) => {
      const cmp = String(b.date || '').localeCompare(String(a.date || ''));
      if (cmp !== 0) return cmp;
      const timeDiff = new Date(b.ref.createdAt) - new Date(a.ref.createdAt);
      if (timeDiff !== 0) return timeDiff;
      return (b.ref.id || 0) - (a.ref.id || 0);
    });
    return list;
  }

  function getFilteredInvoices() {
    let list = invoices.slice();
    if (invoiceSearchQuery) {
      const q = invoiceSearchQuery.toLowerCase();
      list = list.filter((inv) => {
        const order = orders.find((o) => o.orderId === inv.orderId);
        const customer = order ? order.customerName.toLowerCase() : '';
        const num = (inv.invoiceNumber || '').toLowerCase();
        return num.includes(q) || customer.includes(q);
      });
    }
    list.sort((a, b) => {
      const cmp = String(b.issueDate || '').localeCompare(String(a.issueDate || ''));
      if (cmp !== 0) return cmp;
      const timeDiff = new Date(b.createdAt) - new Date(a.createdAt);
      if (timeDiff !== 0) return timeDiff;
      return (b.id || 0) - (a.id || 0);
    });
    return list;
  }

  function renderCash() {
    const totalIncome = incomes.reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);
    const totalExpense = expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
    const balance = cashInitialBalance + totalIncome - totalExpense;

    $('#cash-balance-value').textContent = 'Rp ' + formatPrice(balance);
    $('#cash-balance-breakdown').textContent =
      'Rp ' + formatPrice(cashInitialBalance) + ' + Rp ' + formatPrice(totalIncome) + ' - Rp ' + formatPrice(totalExpense);
    $('#cash-initial-input').value = String(cashInitialBalance);

    $('#btn-reset-cash-filter').hidden = !(cashStartDate || cashEndDate);

    const list = getFilteredMutations();
    $('#cash-mutation-count').textContent = list.length + ' mutasi';

    const container = $('#cash-mutation-list');
    container.innerHTML = '';

    list.forEach((mutation) => {
      const ref = mutation.ref;
      const card = document.createElement('article');
      card.className = 'income-card cash-mutation-card';
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      card.dataset.type = mutation.type;
      card.dataset.id = ref.id;

      const dateLabel = formatYmd(mutation.date);
      const dirLabel = mutation.type === 'masuk' ? 'Masuk' : 'Keluar';
      const signPrefix = mutation.type === 'masuk' ? '+' : '-';
      const methodLabel = ref.paymentMethod || 'Tanpa metode';

      let secondaryLabel = '';
      if (mutation.type === 'masuk') {
        const inc = ref;
        if (inc.orderId) {
          const matched = orders.find((o) => o.orderId === inc.orderId);
          secondaryLabel = matched
            ? ('Pesanan: ' + inc.orderId + ' (' + matched.customerName + ')')
            : ('Pesanan: ' + inc.orderId);
        } else {
          secondaryLabel = 'Tanpa pesanan';
        }
      } else {
        secondaryLabel = getCategoryName(ref.categoryId);
      }

      const noteHtml = ref.note
        ? '<div class="income-note">' + esc(ref.note) + '</div>'
        : '';

      card.setAttribute(
        'aria-label',
        dirLabel + ', Rp ' + formatPrice(ref.amount) + ', ' + dateLabel + ', ' + methodLabel
      );

      card.innerHTML =
        '<div class="income-header">' +
          '<span class="income-id cash-mutation-dir cash-mutation-dir--' + mutation.type + '">' + esc(dirLabel) + '</span>' +
          '<span class="income-date">' + esc(dateLabel) + '</span>' +
        '</div>' +
        '<div class="income-amount cash-mutation-amount">' +
          '<span class="cash-mutation-sign">' + signPrefix + '</span>Rp ' + formatPrice(ref.amount) +
        '</div>' +
        '<div class="income-meta">' +
          '<span class="income-method-tag">' + esc(methodLabel) + '</span>' +
          '<span class="income-order-tag">' + esc(secondaryLabel) + '</span>' +
        '</div>' +
        noteHtml;

      container.appendChild(card);
    });

    showView('ready');
  }

  function renderInvoices() {
    const list = getFilteredInvoices();
    const container = $('#invoice-list');
    container.innerHTML = '';

    list.forEach((inv) => {
      const order = orders.find((o) => o.orderId === inv.orderId);
      const orderIncomes = incomes.filter((inc) => inc.orderId === inv.orderId);
      const totalPaid = orderIncomes.reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);
      const price = order ? Number(order.price) || 0 : 0;
      const isPaidOff = totalPaid >= price && price > 0;

      const card = document.createElement('article');
      card.className = 'invoice-card';
      card.tabIndex = 0;
      card.dataset.id = inv.id;
      card.setAttribute('role', 'button');

      const dateLabel = formatYmd(inv.issueDate);
      const customerName = order ? order.customerName : '(Pesanan tidak ditemukan)';
      const serviceName = order ? ((order.type === 'joki' ? 'Joki' : 'Topup') + ' · ' + order.game) : '-';
      const badgeText = isPaidOff ? 'LUNAS' : 'BELUM LUNAS';
      const badgeClass = isPaidOff ? 'inv-badge--lunas' : 'inv-badge--belum-lunas';

      card.setAttribute(
        'aria-label',
        inv.invoiceNumber + ', ' + customerName + ', Rp ' + formatPrice(price) + ', ' + badgeText + ', ' + dateLabel
      );

      card.innerHTML =
        '<div class="invoice-card-header">' +
          '<span class="invoice-card-number">' + esc(inv.invoiceNumber) + '</span>' +
          '<span class="invoice-card-date">' + esc(dateLabel) + '</span>' +
        '</div>' +
        '<div class="invoice-card-body">' +
          '<div>' +
            '<div class="invoice-card-customer">' + esc(customerName) + '</div>' +
            '<div class="invoice-card-service">' + esc(serviceName) + '</div>' +
          '</div>' +
          '<span class="inv-status-badge ' + badgeClass + '">' + badgeText + '</span>' +
        '</div>' +
        '<div class="invoice-card-footer">' +
          '<span class="invoice-card-date">ID: ' + esc(inv.orderId) + '</span>' +
          '<strong class="invoice-card-price">Rp ' + formatPrice(price) + '</strong>' +
        '</div>';

      container.appendChild(card);
    });

    showView('ready');
  }

  // Rendering

  function render() {
    renderNav();
    renderTabs();
    renderCustomerTabs();
    renderOrders();
    renderCustomers();
    renderIncomes();
    renderExpenses();
    renderCash();
    renderInvoices();
  }

  function renderNav() {
    $$('.nav-tab').forEach((tab) => {
      const isCurrent = tab.dataset.view === activeView;
      tab.classList.toggle('active', isCurrent);
      if (isCurrent) {
        tab.setAttribute('aria-current', 'page');
      } else {
        tab.removeAttribute('aria-current');
      }
    });
  }

  function renderTabs() {
    $$('.tab').forEach((tab) => {
      if (!tab.dataset.status) return;
      tab.classList.toggle('active', tab.dataset.status === activeFilter);
      tab.setAttribute('aria-selected', tab.dataset.status === activeFilter);
    });
  }

  function renderCustomerTabs() {
    $$('.customer-filter-tabs .tab').forEach((tab) => {
      const isSelected = tab.dataset.customerFilter === customerFilter;
      tab.classList.toggle('active', isSelected);
      tab.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    });
  }

  function renderOrders() {
    const list = getFilteredOrders();
    const container = $('#order-list');
    container.innerHTML = '';

    list.forEach((order) => {
      const card = document.createElement('article');
      card.className = 'order-card';
      card.tabIndex = 0;
      card.dataset.id = order.id;
      card.setAttribute('role', 'button');

      let progressHtml = '';
      let progressAria = '';
      if (order.type === 'joki') {
        const prog = progressMap[order.orderId];
        const steps = prog && Array.isArray(prog.steps) ? prog.steps : [];
        const doneCount = steps.filter((s) => s.done).length;
        const pct = prog && typeof prog.percentage === 'number'
          ? prog.percentage
          : ShugenDB.progress.calcPercentage(steps);
        const stepLabel = steps.length === 0
          ? '0 langkah'
          : (doneCount + '/' + steps.length + ' langkah');

        progressAria = ', Progress ' + pct + '%';
        progressHtml =
          '<div class="order-progress">' +
            '<div class="order-progress-info">' +
              '<span class="order-progress-label">Progress: <strong class="order-progress-pct">' + pct + '%</strong></span>' +
              '<span class="order-progress-steps">' + stepLabel + '</span>' +
            '</div>' +
            '<div class="order-progress-track" aria-hidden="true">' +
              '<div class="order-progress-fill" style="width:' + pct + '%"></div>' +
            '</div>' +
          '</div>';
      }

      card.setAttribute('aria-label',
        order.orderId + ', ' + order.customerName + ', ' + STATUS_LABELS[order.status] + progressAria
      );

      card.innerHTML =
        '<div class="order-header">' +
          '<span class="order-id">' + esc(order.orderId) + '</span>' +
          '<button class="status-badge status-' + order.status + '"' +
            ' data-id="' + order.id + '"' +
            ' aria-label="Status: ' + STATUS_LABELS[order.status] + '. Tap untuk mengubah.">' +
            STATUS_LABELS[order.status] +
          '</button>' +
        '</div>' +
        '<div class="order-customer">' + esc(order.customerName) + '</div>' +
        '<div class="order-meta">' +
          '<span class="order-type type-' + order.type + '">' +
            (order.type === 'joki' ? 'Joki' : 'Topup') +
          '</span>' +
          '<span class="order-game">' + esc(order.game) + '</span>' +
        '</div>' +
        progressHtml +
        '<div class="order-bottom">' +
          '<span class="order-price">Rp ' + formatPrice(order.price) + '</span>' +
          '<span class="order-date">' + formatDate(new Date(order.createdAt)) + '</span>' +
        '</div>';

      container.appendChild(card);
    });

    showView('ready');
  }

  function renderCustomers() {
    renderCustomerTabs();
    const list = getFilteredCustomers();
    const container = $('#customer-list');
    container.innerHTML = '';

    list.forEach((cust) => {
      const card = document.createElement('article');
      card.className = 'customer-card';
      card.tabIndex = 0;
      card.dataset.id = cust.id;
      card.setAttribute('role', 'button');

      const isSub = Boolean(cust.isSubscriber);
      const subBadgeHtml = isSub
        ? '<span class="customer-sub-badge">Langganan</span>'
        : '';

      const matchedOrders = orders.filter((o) => matchCustomerName(o.customerName, cust.name));
      const nonCancelledOrders = matchedOrders.filter((o) => o.status !== 'dibatalkan');
      const orderCountLabel = nonCancelledOrders.length + ' pesanan';

      const contactHtml = cust.contact
        ? '<div class="customer-card-contact">' + esc(cust.contact) + '</div>'
        : '';

      const toggleLabel = isSub ? 'Cabut Langganan' : 'Tandai Langganan';
      const toggleClass = isSub ? 'btn-sub-toggle is-sub' : 'btn-sub-toggle';
      const toggleAria = isSub
        ? ('Cabut status langganan ' + cust.name)
        : ('Tandai ' + cust.name + ' sebagai langganan');

      card.setAttribute(
        'aria-label',
        cust.name + (isSub ? ', Langganan' : '') + (cust.contact ? (', ' + cust.contact) : '') + ', ' + orderCountLabel + '. Tap untuk buka detail.'
      );

      card.innerHTML =
        '<div class="customer-card-header">' +
          '<div class="customer-card-name">' + esc(cust.name) + '</div>' +
          subBadgeHtml +
        '</div>' +
        contactHtml +
        '<div class="customer-card-footer">' +
          '<span class="customer-card-stats">' + esc(orderCountLabel) + '</span>' +
          '<button type="button" class="' + toggleClass + '" data-id="' + cust.id + '" aria-label="' + esc(toggleAria) + '">' +
            esc(toggleLabel) +
          '</button>' +
        '</div>';

      container.appendChild(card);
    });

    showView('ready');
  }

  function renderIncomes() {
    const list = getFilteredIncomes();
    const totalAmount = list.reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);

    $('#income-summary-total').textContent = 'Rp ' + formatPrice(totalAmount);
    $('#income-summary-count').textContent = list.length + ' pemasukan';
    $('#btn-reset-income-filter').hidden = !(incomeStartDate || incomeEndDate);

    const container = $('#income-list');
    container.innerHTML = '';

    list.forEach((inc) => {
      const card = document.createElement('article');
      card.className = 'income-card';
      card.tabIndex = 0;
      card.dataset.id = inc.id;
      card.setAttribute('role', 'button');

      const dateLabel = formatYmd(inc.date);
      const methodLabel = inc.paymentMethod || 'Tanpa metode';
      let orderLabel = 'Tanpa pesanan';
      if (inc.orderId) {
        const matchedOrder = orders.find((o) => o.orderId === inc.orderId);
        orderLabel = matchedOrder
          ? ('Pesanan: ' + inc.orderId + ' (' + matchedOrder.customerName + ')')
          : ('Pesanan: ' + inc.orderId);
      }

      card.setAttribute(
        'aria-label',
        inc.incomeId + ', Rp ' + formatPrice(inc.amount) + ', ' + dateLabel + ', ' + methodLabel + ', ' + orderLabel
      );

      const noteHtml = inc.note
        ? '<div class="income-note">' + esc(inc.note) + '</div>'
        : '';

      card.innerHTML =
        '<div class="income-header">' +
          '<span class="income-id">' + esc(inc.incomeId) + '</span>' +
          '<span class="income-date">' + esc(dateLabel) + '</span>' +
        '</div>' +
        '<div class="income-amount">Rp ' + formatPrice(inc.amount) + '</div>' +
        '<div class="income-meta">' +
          '<span class="income-method-tag">' + esc(methodLabel) + '</span>' +
          '<span class="income-order-tag">' + esc(orderLabel) + '</span>' +
        '</div>' +
        noteHtml;

      container.appendChild(card);
    });

    showView('ready');
  }

  function populateExpenseFilterCategorySelect() {
    const sel = $('#expense-filter-category');
    if (!sel) return;
    sel.innerHTML = '<option value="semua">Semua Kategori</option>';
    let hasActiveCategory = expenseCategoryFilter === 'semua';
    expenseCategories.forEach((cat) => {
      const opt = document.createElement('option');
      opt.value = String(cat.id);
      opt.textContent = cat.name;
      if (String(cat.id) === String(expenseCategoryFilter)) {
        hasActiveCategory = true;
      }
      sel.appendChild(opt);
    });
    if (!hasActiveCategory) {
      expenseCategoryFilter = 'semua';
    }
    sel.value = expenseCategoryFilter;
  }

  function renderExpenses() {
    populateExpenseFilterCategorySelect();
    const list = getFilteredExpenses();
    const totalAmount = list.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);

    $('#expense-summary-total').textContent = 'Rp ' + formatPrice(totalAmount);
    $('#expense-summary-count').textContent = list.length + ' pengeluaran';
    $('#btn-reset-expense-filter').hidden = !(
      expenseStartDate ||
      expenseEndDate ||
      (expenseCategoryFilter && expenseCategoryFilter !== 'semua')
    );

    const container = $('#expense-list');
    container.innerHTML = '';

    list.forEach((exp) => {
      const card = document.createElement('article');
      card.className = 'income-card expense-card';
      card.tabIndex = 0;
      card.dataset.id = exp.id;
      card.setAttribute('role', 'button');

      const dateLabel = formatYmd(exp.date);
      const categoryLabel = getCategoryName(exp.categoryId);
      const methodLabel = exp.paymentMethod || 'Tanpa metode';
      let orderLabel = 'Tanpa pesanan';
      if (exp.orderId) {
        const matchedOrder = orders.find((o) => o.orderId === exp.orderId);
        orderLabel = matchedOrder
          ? ('Pesanan: ' + exp.orderId + ' (' + matchedOrder.customerName + ')')
          : ('Pesanan: ' + exp.orderId);
      }

      card.setAttribute(
        'aria-label',
        exp.expenseId + ', Rp ' + formatPrice(exp.amount) + ', ' + categoryLabel + ', ' + dateLabel + ', ' + methodLabel + ', ' + orderLabel
      );

      const noteHtml = exp.note
        ? '<div class="income-note">' + esc(exp.note) + '</div>'
        : '';

      card.innerHTML =
        '<div class="income-header">' +
          '<span class="income-id">' + esc(exp.expenseId) + '</span>' +
          '<span class="income-date">' + esc(dateLabel) + '</span>' +
        '</div>' +
        '<div class="income-amount">Rp ' + formatPrice(exp.amount) + '</div>' +
        '<div class="income-meta">' +
          '<span class="expense-category-tag">' + esc(categoryLabel) + '</span>' +
          '<span class="income-method-tag">' + esc(methodLabel) + '</span>' +
          '<span class="income-order-tag">' + esc(orderLabel) + '</span>' +
        '</div>' +
        noteHtml;

      container.appendChild(card);
    });

    showView('ready');
  }

  function esc(str) {
    const el = document.createElement('span');
    el.textContent = str;
    return el.innerHTML;
  }

  // Event handlers

  function bindEvents() {
    $$('.nav-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        activeView = tab.dataset.view;
        render();
      });
    });

    $('#search-input').addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderOrders();
    });

    $$('.status-tabs:not(.customer-filter-tabs) .tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        activeFilter = tab.dataset.status;
        render();
      });
    });

    $('#customer-search-input').addEventListener('input', (e) => {
      customerSearchQuery = e.target.value;
      renderCustomers();
    });

    $$('.customer-filter-tabs .tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        customerFilter = tab.dataset.customerFilter;
        render();
      });
    });

    $('#customer-list').addEventListener('click', (e) => {
      const subBtn = e.target.closest('.btn-sub-toggle');
      if (subBtn) {
        e.stopPropagation();
        toggleCustomerSubscription(Number(subBtn.dataset.id), subBtn);
        return;
      }
      const card = e.target.closest('.customer-card');
      if (card) openCustomerDetail(Number(card.dataset.id));
    });

    $('#customer-list').addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const subBtn = e.target.closest('.btn-sub-toggle');
      if (subBtn) {
        e.preventDefault();
        e.stopPropagation();
        toggleCustomerSubscription(Number(subBtn.dataset.id), subBtn);
        return;
      }
      const card = e.target.closest('.customer-card');
      if (card) {
        e.preventDefault();
        openCustomerDetail(Number(card.dataset.id));
      }
    });

    $('#order-list').addEventListener('click', (e) => {
      const badge = e.target.closest('.status-badge');
      if (badge) {
        e.stopPropagation();
        openStatusPicker(Number(badge.dataset.id));
        return;
      }
      const card = e.target.closest('.order-card');
      if (card) openOrderForm(Number(card.dataset.id));
    });

    $('#order-list').addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const card = e.target.closest('.order-card');
      if (!card) return;
      e.preventDefault();
      if (e.target.classList.contains('status-badge')) {
        openStatusPicker(Number(e.target.dataset.id));
      } else {
        openOrderForm(Number(card.dataset.id));
      }
    });

    $('#income-filter-start').addEventListener('change', (e) => {
      incomeStartDate = e.target.value;
      renderIncomes();
    });

    $('#income-filter-end').addEventListener('change', (e) => {
      incomeEndDate = e.target.value;
      renderIncomes();
    });

    $('#btn-reset-income-filter').addEventListener('click', () => {
      incomeStartDate = '';
      incomeEndDate = '';
      $('#income-filter-start').value = '';
      $('#income-filter-end').value = '';
      renderIncomes();
    });

    $('#income-list').addEventListener('click', (e) => {
      const card = e.target.closest('.income-card');
      if (card) openIncomeForm(Number(card.dataset.id));
    });

    $('#income-list').addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const card = e.target.closest('.income-card');
      if (!card) return;
      e.preventDefault();
      openIncomeForm(Number(card.dataset.id));
    });

    $('#expense-filter-start').addEventListener('change', (e) => {
      expenseStartDate = e.target.value;
      renderExpenses();
    });

    $('#expense-filter-end').addEventListener('change', (e) => {
      expenseEndDate = e.target.value;
      renderExpenses();
    });

    $('#expense-filter-category').addEventListener('change', (e) => {
      expenseCategoryFilter = e.target.value;
      renderExpenses();
    });

    $('#btn-reset-expense-filter').addEventListener('click', () => {
      expenseStartDate = '';
      expenseEndDate = '';
      expenseCategoryFilter = 'semua';
      $('#expense-filter-start').value = '';
      $('#expense-filter-end').value = '';
      $('#expense-filter-category').value = 'semua';
      renderExpenses();
    });

    $('#expense-list').addEventListener('click', (e) => {
      const card = e.target.closest('.expense-card');
      if (card) openExpenseForm(Number(card.dataset.id));
    });

    $('#expense-list').addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const card = e.target.closest('.expense-card');
      if (!card) return;
      e.preventDefault();
      openExpenseForm(Number(card.dataset.id));
    });

    $('#cash-filter-start').addEventListener('change', (e) => {
      cashStartDate = e.target.value;
      renderCash();
    });

    $('#cash-filter-end').addEventListener('change', (e) => {
      cashEndDate = e.target.value;
      renderCash();
    });

    $('#btn-reset-cash-filter').addEventListener('click', () => {
      cashStartDate = '';
      cashEndDate = '';
      $('#cash-filter-start').value = '';
      $('#cash-filter-end').value = '';
      renderCash();
    });

    $('#cash-mutation-list').addEventListener('click', (e) => {
      const card = e.target.closest('.cash-mutation-card');
      if (!card) return;
      const type = card.dataset.type;
      const id = Number(card.dataset.id);
      if (type === 'masuk') {
        openIncomeForm(id);
      } else {
        openExpenseForm(id);
      }
    });

    $('#cash-mutation-list').addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const card = e.target.closest('.cash-mutation-card');
      if (!card) return;
      e.preventDefault();
      const type = card.dataset.type;
      const id = Number(card.dataset.id);
      if (type === 'masuk') {
        openIncomeForm(id);
      } else {
        openExpenseForm(id);
      }
    });

    $('#btn-save-cash-initial').addEventListener('click', saveCashInitialBalance);
    $('#cash-initial-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveCashInitialBalance();
      }
    });

    $('#fab-add').addEventListener('click', () => {
      if (activeView === 'incomes') {
        openIncomeForm(null);
      } else if (activeView === 'expenses') {
        openExpenseForm(null);
      } else if (activeView === 'customers') {
        openCustomerForm(null);
      } else {
        openOrderForm(null);
      }
    });

    $('#field-type').addEventListener('change', toggleProgressSection);
    $('#field-status').addEventListener('change', updateCompletePrompt);

    $('#btn-add-step').addEventListener('click', addStep);
    $('#step-add-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addStep();
      }
    });

    $('#btn-mark-done').addEventListener('click', markOrderDoneFromPrompt);

    $('#order-form').addEventListener('submit', (e) => {
      e.preventDefault();
      saveOrder();
    });

    $('#btn-copy-order-id').addEventListener('click', copyOrderId);

    $('#btn-cancel-order').addEventListener('click', () => {
      $('#order-dialog').close();
    });

    $('#btn-delete-order').addEventListener('click', handleDelete);

    $('#order-dialog').addEventListener('close', () => {
      editingId = null;
      currentSteps = [];
      $('#btn-save-order').disabled = false;
      $('#btn-delete-order').disabled = false;
      resetCopyButton();
    });

    $('#income-field-order').addEventListener('input', updateIncomeOrderHint);

    $('#income-form').addEventListener('submit', (e) => {
      e.preventDefault();
      saveIncome();
    });

    $('#btn-cancel-income').addEventListener('click', () => {
      $('#income-dialog').close();
    });

    $('#btn-delete-income').addEventListener('click', handleDeleteIncome);

    $('#income-dialog').addEventListener('close', () => {
      editingIncomeId = null;
      $('#btn-save-income').disabled = false;
      $('#btn-delete-income').disabled = false;
    });

    $('#expense-field-order').addEventListener('input', updateExpenseOrderHint);

    $('#expense-form').addEventListener('submit', (e) => {
      e.preventDefault();
      saveExpense();
    });

    $('#btn-cancel-expense').addEventListener('click', () => {
      $('#expense-dialog').close();
    });

    $('#btn-delete-expense').addEventListener('click', handleDeleteExpense);

    $('#expense-dialog').addEventListener('close', () => {
      editingExpenseId = null;
      $('#btn-save-expense').disabled = false;
      $('#btn-delete-expense').disabled = false;
    });

    // Status picker
    $$('.status-option').forEach((btn) => {
      btn.addEventListener('click', () => {
        changeStatus(statusChangeId, btn.dataset.status);
      });
    });

    const btnCloseStatus = $('#btn-close-status');
    if (btnCloseStatus) {
      btnCloseStatus.addEventListener('click', () => {
        $('#status-dialog').close();
      });
    }

    $('#status-dialog').addEventListener('close', () => { statusChangeId = null; });

    // Settings
    $('#btn-settings').addEventListener('click', openSettings);
    $('#btn-close-settings').addEventListener('click', () => {
      $('#settings-dialog').close();
    });
    $('#settings-dialog').addEventListener('close', () => {
      $('#btn-load-demo').disabled = false;
      $('#btn-add-payment').disabled = false;
      $('#btn-add-category').disabled = false;
    });

    $('#btn-add-payment').addEventListener('click', addPaymentMethod);
    $('#payment-add-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); addPaymentMethod(); }
    });

    $('#btn-add-category').addEventListener('click', addExpenseCategory);
    $('#category-add-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); addExpenseCategory(); }
    });

    $('#btn-load-demo').addEventListener('click', loadDemoData);

    // Theme
    $('#btn-theme').addEventListener('click', toggleTheme);

    // Invoices
    $('#invoice-search-input').addEventListener('input', (e) => {
      invoiceSearchQuery = e.target.value;
      renderInvoices();
    });

    $('#invoice-list').addEventListener('click', (e) => {
      const card = e.target.closest('.invoice-card');
      if (card) openInvoiceView(Number(card.dataset.id));
    });

    $('#invoice-list').addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const card = e.target.closest('.invoice-card');
      if (!card) return;
      e.preventDefault();
      openInvoiceView(Number(card.dataset.id));
    });

    $('#btn-print-invoice').addEventListener('click', () => {
      window.print();
    });

    $('#btn-close-invoice').addEventListener('click', () => {
      $('#invoice-detail-dialog').close();
    });

    $('#btn-delete-invoice').addEventListener('click', handleDeleteInvoice);

    $('#invoice-note-form').addEventListener('submit', handleSaveInvoiceNote);

    $('#invoice-detail-dialog').addEventListener('close', () => {
      activeInvoiceId = null;
      $('#btn-delete-invoice').disabled = false;
      $('#btn-save-invoice-note').disabled = false;
    });

    $('#settings-shop-form').addEventListener('submit', handleSaveShopInfo);

    // Customer events
    $('#customer-form').addEventListener('submit', (e) => {
      e.preventDefault();
      saveCustomer();
    });

    $('#btn-cancel-customer').addEventListener('click', () => {
      $('#customer-dialog').close();
    });

    $('#btn-delete-customer').addEventListener('click', handleDeleteCustomer);

    $('#customer-dialog').addEventListener('close', () => {
      editingCustomerId = null;
      $('#btn-save-customer').disabled = false;
      $('#btn-delete-customer').disabled = false;
    });

    $('#btn-close-customer-detail').addEventListener('click', () => {
      $('#customer-detail-dialog').close();
    });

    $('#customer-detail-dialog').addEventListener('close', () => {
      activeCustomerId = null;
      $('#btn-cust-detail-toggle-sub').disabled = false;
      $('#btn-cust-detail-edit').disabled = false;
    });

    $('#btn-cust-detail-edit').addEventListener('click', () => {
      if (activeCustomerId !== null) {
        openCustomerForm(activeCustomerId);
      }
    });

    $('#btn-cust-detail-toggle-sub').addEventListener('click', (e) => {
      if (activeCustomerId !== null) {
        toggleCustomerSubscription(activeCustomerId, e.target);
      }
    });

    // Close dialogs on Escape (native <dialog> handles this)
    // Close dialogs on backdrop click
    $$('dialog').forEach((d) => {
      d.addEventListener('click', (e) => {
        if (e.target === d) d.close();
      });
    });
  }

  // Order form & detail dialog

  let copyTimer = null;

  function resetCopyButton() {
    clearTimeout(copyTimer);
    const btn = $('#btn-copy-order-id');
    const label = $('#copy-order-id-label');
    if (btn) btn.classList.remove('is-copied');
    if (label) label.textContent = 'Salin';
  }

  async function copyOrderId() {
    const orderId = $('#detail-order-id').textContent.trim();
    if (!orderId) return;

    try {
      if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
        throw new Error('Clipboard tidak tersedia');
      }
      await navigator.clipboard.writeText(orderId);
      const btn = $('#btn-copy-order-id');
      const label = $('#copy-order-id-label');
      btn.classList.add('is-copied');
      label.textContent = 'Tersalin';
      clearTimeout(copyTimer);
      copyTimer = setTimeout(() => {
        btn.classList.remove('is-copied');
        label.textContent = 'Salin';
      }, 2000);
      toast('Tersalin');
    } catch (err) {
      console.error(err);
      resetCopyButton();
      toast('Gagal menyalin ID pesanan');
    }
  }

  function openOrderForm(id) {
    editingId = id;
    const dialog = $('#order-dialog');
    const form = $('#order-form');
    form.reset();
    $('#btn-save-order').disabled = false;
    $('#btn-delete-order').disabled = false;
    resetCopyButton();
    $('#step-add-input').value = '';
    populatePaymentSelect();
    populateCustomerDatalist();

    if (id !== null) {
      const order = orders.find((o) => o.id === id);
      if (!order) return;
      $('#form-title').textContent = 'Detail Pesanan';
      $('#detail-order-id').textContent = order.orderId;
      $('#detail-order-id').hidden = false;
      $('#detail-order-id-row').hidden = false;
      $('#field-customer').value = order.customerName;
      $('#field-type').value = order.type;
      $('#field-game').value = order.game;
      $('#field-detail').value = order.detail;
      $('#field-price').value = order.price || '';
      $('#field-payment').value = order.paymentMethod;
      $('#field-status').value = order.status;
      $('#field-status-group').hidden = false;
      $('#btn-delete-order').hidden = false;

      const orderIncomes = incomes.filter((inc) => inc.orderId === order.orderId);
      const totalPaid = orderIncomes.reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);
      $('#order-paid-total').textContent = 'Rp ' + formatPrice(totalPaid);
      $('#order-paid-count').textContent = orderIncomes.length === 0
        ? 'Belum ada pemasukan tercatat'
        : (orderIncomes.length + ' catatan pemasukan');
      $('#order-paid-group').hidden = false;

      const orderExpenses = expenses.filter((exp) => exp.orderId === order.orderId);
      const totalExpense = orderExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
      $('#order-expense-total').textContent = 'Rp ' + formatPrice(totalExpense);
      $('#order-expense-count').textContent = orderExpenses.length === 0
        ? 'Belum ada pengeluaran tercatat'
        : (orderExpenses.length + ' catatan pengeluaran');
      $('#order-expense-group').hidden = false;

      const orderInvoice = invoices.find((inv) => inv.orderId === order.orderId);
      $('#order-invoice-group').hidden = false;
      if (orderInvoice) {
        $('#order-invoice-count').textContent = 'Nomor: ' + orderInvoice.invoiceNumber;
        $('#btn-create-invoice').hidden = true;
        $('#btn-view-invoice').hidden = false;
        $('#btn-view-invoice').textContent = 'Lihat Invoice';
        $('#btn-view-invoice').onclick = () => {
          $('#order-dialog').close();
          openInvoiceView(orderInvoice.id);
        };
      } else {
        $('#order-invoice-count').textContent = 'Belum ada invoice untuk pesanan ini';
        $('#btn-create-invoice').hidden = false;
        $('#btn-create-invoice').textContent = 'Buat Invoice';
        $('#btn-view-invoice').hidden = true;
        $('#btn-create-invoice').onclick = () => handleCreateInvoiceForOrder(order);
      }

      const prog = progressMap[order.orderId];
      currentSteps = prog && Array.isArray(prog.steps)
        ? prog.steps.map((s) => ({
            id: s.id,
            name: s.name,
            done: Boolean(s.done),
            order: s.order
          }))
        : [];
    } else {
      $('#form-title').textContent = 'Tambah Pesanan';
      $('#detail-order-id').textContent = '';
      $('#detail-order-id').hidden = true;
      $('#detail-order-id-row').hidden = true;
      $('#field-status').value = 'menunggu_bayar';
      $('#field-status-group').hidden = true;
      $('#order-paid-group').hidden = true;
      $('#order-paid-total').textContent = 'Rp 0';
      $('#order-paid-count').textContent = 'Belum ada pemasukan tercatat';
      $('#order-expense-group').hidden = true;
      $('#order-expense-total').textContent = 'Rp 0';
      $('#order-expense-count').textContent = 'Belum ada pengeluaran tercatat';
      $('#order-invoice-group').hidden = true;
      $('#btn-delete-order').hidden = true;
      currentSteps = [];
    }

    toggleProgressSection();
    renderChecklist();
    dialog.showModal();
    if (id === null) {
      $('#field-customer').focus();
    }
  }

  function toggleProgressSection() {
    const isJoki = $('#field-type').value === 'joki';
    $('#joki-progress-section').hidden = !isJoki;
    updateCompletePrompt();
  }

  function updateProgressUI() {
    const total = currentSteps.length;
    const done = currentSteps.filter((s) => s.done).length;
    const pct = ShugenDB.progress.calcPercentage(currentSteps);

    $('#progress-summary').textContent = pct + '% (' + done + '/' + total + ' langkah)';
    $('#progress-fill').style.width = pct + '%';
    $('#detail-progressbar').setAttribute('aria-valuenow', String(pct));
    updateCompletePrompt();
  }

  function updateCompletePrompt() {
    const isJoki = $('#field-type').value === 'joki';
    const isAllDone = currentSteps.length > 0 && currentSteps.every((s) => s.done);
    const isNotSelesai = $('#field-status').value !== 'selesai';
    $('#progress-complete-prompt').hidden = !(isJoki && isAllDone && isNotSelesai);
  }

  async function syncCurrentProgress() {
    updateProgressUI();
    if (editingId === null) return;
    const order = orders.find((o) => o.id === editingId);
    if (!order || order.type !== 'joki') return;

    try {
      const saved = await ShugenDB.progress.save(order.orderId, currentSteps);
      progressMap[order.orderId] = saved;
      renderOrders();
    } catch (err) {
      console.error(err);
      toast('Gagal menyimpan progress');
    }
  }

  function renderChecklist() {
    const list = $('#step-list');
    list.innerHTML = '';

    const hasSteps = currentSteps.length > 0;
    $('#step-empty').hidden = hasSteps;
    list.hidden = !hasSteps;

    currentSteps.forEach((step, idx) => {
      const li = document.createElement('li');
      li.className = 'step-item' + (step.done ? ' is-done' : '');

      const main = document.createElement('div');
      main.className = 'step-main';

      const checkBtn = document.createElement('button');
      checkBtn.type = 'button';
      checkBtn.className = 'btn-step-check';
      checkBtn.setAttribute('role', 'checkbox');
      checkBtn.setAttribute('aria-checked', step.done ? 'true' : 'false');
      checkBtn.setAttribute('aria-label', 'Langkah ' + (idx + 1) + ': ' + step.name);
      checkBtn.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
          '<polyline points="20 6 9 17 4 12"/>' +
        '</svg>';
      checkBtn.addEventListener('click', () => toggleStep(idx));

      const nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.className = 'step-name-input';
      nameInput.value = step.name;
      nameInput.setAttribute('aria-label', 'Nama langkah ' + (idx + 1));
      nameInput.addEventListener('change', () => renameStep(idx, nameInput.value));
      nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          nameInput.blur();
        }
      });

      main.appendChild(checkBtn);
      main.appendChild(nameInput);

      const actions = document.createElement('div');
      actions.className = 'step-actions';

      const idxLabel = document.createElement('span');
      idxLabel.className = 'step-index-label';
      idxLabel.textContent = 'Langkah ' + (idx + 1);

      const actionGroup = document.createElement('div');
      actionGroup.className = 'step-action-group';

      const upBtn = document.createElement('button');
      upBtn.type = 'button';
      upBtn.className = 'btn-step-action btn-step-up';
      upBtn.disabled = idx === 0;
      upBtn.setAttribute('aria-label', 'Pindah langkah ' + step.name + ' ke atas');
      upBtn.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
          '<polyline points="18 15 12 9 6 15"/>' +
        '</svg>';
      upBtn.addEventListener('click', () => moveStep(idx, -1));

      const downBtn = document.createElement('button');
      downBtn.type = 'button';
      downBtn.className = 'btn-step-action btn-step-down';
      downBtn.disabled = idx === currentSteps.length - 1;
      downBtn.setAttribute('aria-label', 'Pindah langkah ' + step.name + ' ke bawah');
      downBtn.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
          '<polyline points="6 9 12 15 18 9"/>' +
        '</svg>';
      downBtn.addEventListener('click', () => moveStep(idx, 1));

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'btn-step-action btn-step-delete';
      delBtn.setAttribute('aria-label', 'Hapus langkah ' + step.name);
      delBtn.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
          '<line x1="18" y1="6" x2="6" y2="18"/>' +
          '<line x1="6" y1="6" x2="18" y2="18"/>' +
        '</svg>';
      delBtn.addEventListener('click', () => removeStep(idx));

      actionGroup.appendChild(upBtn);
      actionGroup.appendChild(downBtn);
      actionGroup.appendChild(delBtn);

      actions.appendChild(idxLabel);
      actions.appendChild(actionGroup);

      li.appendChild(main);
      li.appendChild(actions);
      list.appendChild(li);
    });

    updateProgressUI();
  }

  async function addStep() {
    const input = $('#step-add-input');
    const name = input.value.trim();
    if (!name) {
      input.focus();
      return;
    }

    currentSteps.push({
      id: 'step-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      name: name,
      done: false,
      order: currentSteps.length
    });
    input.value = '';
    renderChecklist();
    await syncCurrentProgress();
    input.focus();
  }

  async function toggleStep(idx) {
    if (!currentSteps[idx]) return;
    currentSteps[idx].done = !currentSteps[idx].done;
    renderChecklist();
    await syncCurrentProgress();
    const checks = $$('#step-list .btn-step-check');
    if (checks[idx]) checks[idx].focus();
  }

  async function renameStep(idx, newName) {
    if (!currentSteps[idx]) return;
    const trimmed = newName.trim();
    if (!trimmed) {
      renderChecklist();
      return;
    }
    currentSteps[idx].name = trimmed;
    renderChecklist();
    await syncCurrentProgress();
  }

  async function moveStep(idx, dir) {
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= currentSteps.length) return;
    const temp = currentSteps[idx];
    currentSteps[idx] = currentSteps[targetIdx];
    currentSteps[targetIdx] = temp;
    renderChecklist();
    await syncCurrentProgress();

    const items = $$('#step-list .step-item');
    const targetItem = items[targetIdx];
    if (targetItem) {
      const btn = targetItem.querySelector(dir < 0 ? '.btn-step-up' : '.btn-step-down');
      if (btn && !btn.disabled) {
        btn.focus();
      } else {
        const check = targetItem.querySelector('.btn-step-check');
        if (check) check.focus();
      }
    }
  }

  async function removeStep(idx) {
    if (!currentSteps[idx]) return;
    currentSteps.splice(idx, 1);
    renderChecklist();
    await syncCurrentProgress();
  }

  async function markOrderDoneFromPrompt() {
    $('#field-status').value = 'selesai';
    updateCompletePrompt();

    if (editingId !== null) {
      try {
        await ShugenDB.orders.update(editingId, { status: 'selesai' });
        orders = await ShugenDB.orders.getAll();
        render();
        toast('Status diubah: Selesai');
      } catch (err) {
        console.error(err);
        toast('Gagal mengubah status');
      }
    }
  }

  function populatePaymentSelect() {
    const sel = $('#field-payment');
    sel.innerHTML = '<option value="">Pilih metode</option>';
    paymentMethods.forEach((pm) => {
      const opt = document.createElement('option');
      opt.value = pm.name;
      opt.textContent = pm.name;
      sel.appendChild(opt);
    });
  }

  async function saveOrder() {
    const saveBtn = $('#btn-save-order');
    if (saveBtn.disabled) return;

    const data = {
      customerName: $('#field-customer').value.trim(),
      type: $('#field-type').value,
      game: $('#field-game').value.trim(),
      detail: $('#field-detail').value.trim(),
      price: Number($('#field-price').value) || 0,
      paymentMethod: $('#field-payment').value,
      status: $('#field-status').value
    };

    if (!data.customerName || !data.game) {
      toast('Nama pelanggan dan game wajib diisi');
      return;
    }

    saveBtn.disabled = true;

    const pendingStepName = $('#step-add-input').value.trim();
    if (data.type === 'joki' && pendingStepName) {
      currentSteps.push({
        id: 'step-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        name: pendingStepName,
        done: false,
        order: currentSteps.length
      });
      $('#step-add-input').value = '';
    }

    try {
      if (editingId !== null) {
        const updated = await ShugenDB.orders.update(editingId, data);
        if (data.type === 'joki') {
          await ShugenDB.progress.save(updated.orderId, currentSteps);
        } else {
          await ShugenDB.progress.delete(updated.orderId);
        }
        toast('Pesanan diperbarui');
      } else {
        const created = await ShugenDB.orders.add(data);
        if (data.type === 'joki') {
          await ShugenDB.progress.save(created.orderId, currentSteps);
        }
        toast('Pesanan ditambahkan');
      }
      orders = await ShugenDB.orders.getAll();
      await refreshProgressMap();
      render();
      $('#order-dialog').close();
    } catch (err) {
      console.error(err);
      toast('Gagal menyimpan pesanan');
    } finally {
      saveBtn.disabled = false;
    }
  }

  async function handleDelete() {
    const deleteBtn = $('#btn-delete-order');
    if (deleteBtn.disabled) return;
    if (editingId === null) return;
    if (!confirm('Hapus pesanan ini? Invoice dan progress yang terhubung juga akan ikut terhapus.')) return;

    deleteBtn.disabled = true;

    try {
      await ShugenDB.orders.delete(editingId);
      orders = await ShugenDB.orders.getAll();
      invoices = await ShugenDB.invoices.getAll();
      await refreshProgressMap();
      render();
      $('#order-dialog').close();
      toast('Pesanan dihapus');
    } catch (err) {
      console.error(err);
      toast('Gagal menghapus pesanan');
    } finally {
      deleteBtn.disabled = false;
    }
  }

  function populateIncomePaymentSelect(selectedMethod) {
    const sel = $('#income-field-payment');
    sel.innerHTML = '<option value="">Pilih metode</option>';
    const names = [];
    paymentMethods.forEach((pm) => {
      names.push(pm.name);
      const opt = document.createElement('option');
      opt.value = pm.name;
      opt.textContent = pm.name;
      sel.appendChild(opt);
    });
    if (selectedMethod && !names.includes(selectedMethod)) {
      const extra = document.createElement('option');
      extra.value = selectedMethod;
      extra.textContent = selectedMethod;
      sel.appendChild(extra);
    }
  }

  function populateIncomeOrderDatalist() {
    const dl = $('#income-order-datalist');
    dl.innerHTML = '';
    const sorted = orders.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    sorted.forEach((o) => {
      const opt = document.createElement('option');
      opt.value = o.orderId;
      opt.textContent = o.customerName + ' - ' + o.game + ' (Rp ' + formatPrice(o.price) + ')';
      dl.appendChild(opt);
    });
  }

  function updateIncomeOrderHint() {
    const raw = $('#income-field-order').value.trim();
    const hint = $('#income-order-hint');
    if (!raw) {
      hint.textContent = 'Kosongkan jika berdiri sendiri tanpa pesanan.';
      return;
    }
    const matched = orders.find((o) => o.orderId.toLowerCase() === raw.toLowerCase());
    if (matched) {
      hint.textContent = 'Terhubung ke: ' + matched.customerName + ' - ' + matched.game + ' (Harga: Rp ' + formatPrice(matched.price) + ')';
    } else {
      hint.textContent = 'ID pesanan tidak ditemukan di daftar pesanan.';
    }
  }

  function openIncomeForm(id) {
    editingIncomeId = id;
    const dialog = $('#income-dialog');
    const form = $('#income-form');
    form.reset();
    $('#btn-save-income').disabled = false;
    $('#btn-delete-income').disabled = false;
    populateIncomeOrderDatalist();

    if (id !== null) {
      const inc = incomes.find((x) => x.id === id);
      if (!inc) return;
      $('#income-form-title').textContent = 'Detail Pemasukan';
      $('#detail-income-id').textContent = inc.incomeId;
      $('#detail-income-id-row').hidden = false;
      populateIncomePaymentSelect(inc.paymentMethod);
      $('#income-field-date').value = inc.date;
      $('#income-field-amount').value = inc.amount || '';
      $('#income-field-payment').value = inc.paymentMethod || '';
      $('#income-field-order').value = inc.orderId || '';
      $('#income-field-note').value = inc.note || '';
      $('#btn-delete-income').hidden = false;
    } else {
      $('#income-form-title').textContent = 'Tambah Pemasukan';
      $('#detail-income-id').textContent = '';
      $('#detail-income-id-row').hidden = true;
      populateIncomePaymentSelect('');
      $('#income-field-date').value = todayYmd();
      $('#income-field-amount').value = '';
      $('#income-field-payment').value = '';
      $('#income-field-order').value = '';
      $('#income-field-note').value = '';
      $('#btn-delete-income').hidden = true;
    }

    updateIncomeOrderHint();
    dialog.showModal();
    if (id === null) {
      $('#income-field-amount').focus();
    }
  }

  async function saveIncome() {
    const saveBtn = $('#btn-save-income');
    if (saveBtn.disabled) return;

    const dateVal = $('#income-field-date').value.trim();
    const amountVal = Number($('#income-field-amount').value) || 0;
    const paymentVal = $('#income-field-payment').value.trim();
    const rawOrderId = $('#income-field-order').value.trim();
    const noteVal = $('#income-field-note').value.trim();

    if (!dateVal) {
      toast('Tanggal pemasukan wajib diisi');
      $('#income-field-date').focus();
      return;
    }

    if (amountVal <= 0) {
      toast('Jumlah pemasukan harus lebih dari Rp 0');
      $('#income-field-amount').focus();
      return;
    }

    if (!paymentVal) {
      toast('Metode pembayaran wajib dipilih');
      $('#income-field-payment').focus();
      return;
    }

    let linkedOrderId = null;
    if (rawOrderId) {
      const matchedOrder = orders.find(
        (o) => o.orderId.toLowerCase() === rawOrderId.toLowerCase()
      );
      const existingIncome = editingIncomeId !== null
        ? incomes.find((inc) => inc.id === editingIncomeId)
        : null;
      if (matchedOrder) {
        linkedOrderId = matchedOrder.orderId;
      } else if (
        existingIncome &&
        existingIncome.orderId &&
        existingIncome.orderId.toLowerCase() === rawOrderId.toLowerCase()
      ) {
        linkedOrderId = existingIncome.orderId;
      } else {
        toast('ID pesanan tidak ditemukan');
        $('#income-field-order').focus();
        return;
      }
    }

    const data = {
      date: dateVal,
      amount: amountVal,
      paymentMethod: paymentVal,
      orderId: linkedOrderId,
      note: noteVal
    };

    saveBtn.disabled = true;

    try {
      if (editingIncomeId !== null) {
        await ShugenDB.incomes.update(editingIncomeId, data);
        toast('Pemasukan diperbarui');
      } else {
        await ShugenDB.incomes.add(data);
        toast('Pemasukan ditambahkan');
      }
      incomes = await ShugenDB.incomes.getAll();
      render();
      $('#income-dialog').close();
    } catch (err) {
      console.error(err);
      toast('Gagal menyimpan pemasukan');
    } finally {
      saveBtn.disabled = false;
    }
  }

  async function handleDeleteIncome() {
    const deleteBtn = $('#btn-delete-income');
    if (deleteBtn.disabled) return;
    if (editingIncomeId === null) return;
    if (!confirm('Hapus pemasukan ini?')) return;

    deleteBtn.disabled = true;

    try {
      await ShugenDB.incomes.delete(editingIncomeId);
      incomes = await ShugenDB.incomes.getAll();
      render();
      $('#income-dialog').close();
      toast('Pemasukan dihapus');
    } catch (err) {
      console.error(err);
      toast('Gagal menghapus pemasukan');
    } finally {
      deleteBtn.disabled = false;
    }
  }

  function populateExpenseCategorySelect(selectedCategoryId) {
    const sel = $('#expense-field-category');
    sel.innerHTML = '<option value="">Pilih kategori</option>';
    const ids = [];
    expenseCategories.forEach((cat) => {
      ids.push(String(cat.id));
      const opt = document.createElement('option');
      opt.value = String(cat.id);
      opt.textContent = cat.name;
      sel.appendChild(opt);
    });
    if (
      selectedCategoryId !== undefined &&
      selectedCategoryId !== null &&
      selectedCategoryId !== '' &&
      !ids.includes(String(selectedCategoryId))
    ) {
      const extra = document.createElement('option');
      extra.value = String(selectedCategoryId);
      extra.textContent = getCategoryName(selectedCategoryId);
      sel.appendChild(extra);
    }
  }

  function populateExpensePaymentSelect(selectedMethod) {
    const sel = $('#expense-field-payment');
    sel.innerHTML = '<option value="">Pilih metode</option>';
    const names = [];
    paymentMethods.forEach((pm) => {
      names.push(pm.name);
      const opt = document.createElement('option');
      opt.value = pm.name;
      opt.textContent = pm.name;
      sel.appendChild(opt);
    });
    if (selectedMethod && !names.includes(selectedMethod)) {
      const extra = document.createElement('option');
      extra.value = selectedMethod;
      extra.textContent = selectedMethod;
      sel.appendChild(extra);
    }
  }

  function populateExpenseOrderDatalist() {
    const dl = $('#expense-order-datalist');
    dl.innerHTML = '';
    const sorted = orders.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    sorted.forEach((o) => {
      const opt = document.createElement('option');
      opt.value = o.orderId;
      opt.textContent = o.customerName + ' - ' + o.game + ' (Rp ' + formatPrice(o.price) + ')';
      dl.appendChild(opt);
    });
  }

  function updateExpenseOrderHint() {
    const raw = $('#expense-field-order').value.trim();
    const hint = $('#expense-order-hint');
    if (!raw) {
      hint.textContent = 'Kosongkan jika berdiri sendiri tanpa pesanan.';
      return;
    }
    const matched = orders.find((o) => o.orderId.toLowerCase() === raw.toLowerCase());
    if (matched) {
      hint.textContent = 'Terhubung ke: ' + matched.customerName + ' - ' + matched.game + ' (Harga: Rp ' + formatPrice(matched.price) + ')';
    } else {
      hint.textContent = 'ID pesanan tidak ditemukan di daftar pesanan.';
    }
  }

  function openExpenseForm(id) {
    editingExpenseId = id;
    const dialog = $('#expense-dialog');
    const form = $('#expense-form');
    form.reset();
    $('#btn-save-expense').disabled = false;
    $('#btn-delete-expense').disabled = false;
    populateExpenseOrderDatalist();

    if (id !== null) {
      const exp = expenses.find((x) => x.id === id);
      if (!exp) return;
      $('#expense-form-title').textContent = 'Detail Pengeluaran';
      $('#detail-expense-id').textContent = exp.expenseId;
      $('#detail-expense-id-row').hidden = false;
      populateExpenseCategorySelect(exp.categoryId);
      populateExpensePaymentSelect(exp.paymentMethod);
      $('#expense-field-date').value = exp.date;
      $('#expense-field-category').value = exp.categoryId !== undefined && exp.categoryId !== null ? String(exp.categoryId) : '';
      $('#expense-field-amount').value = exp.amount || '';
      $('#expense-field-payment').value = exp.paymentMethod || '';
      $('#expense-field-order').value = exp.orderId || '';
      $('#expense-field-note').value = exp.note || '';
      $('#btn-delete-expense').hidden = false;
    } else {
      $('#expense-form-title').textContent = 'Tambah Pengeluaran';
      $('#detail-expense-id').textContent = '';
      $('#detail-expense-id-row').hidden = true;
      populateExpenseCategorySelect('');
      populateExpensePaymentSelect('');
      $('#expense-field-date').value = todayYmd();
      $('#expense-field-category').value = '';
      $('#expense-field-amount').value = '';
      $('#expense-field-payment').value = '';
      $('#expense-field-order').value = '';
      $('#expense-field-note').value = '';
      $('#btn-delete-expense').hidden = true;
    }

    updateExpenseOrderHint();
    dialog.showModal();
    if (id === null) {
      $('#expense-field-amount').focus();
    }
  }

  async function saveExpense() {
    const saveBtn = $('#btn-save-expense');
    if (saveBtn.disabled) return;

    const dateVal = $('#expense-field-date').value.trim();
    const categoryVal = $('#expense-field-category').value.trim();
    const amountVal = Number($('#expense-field-amount').value) || 0;
    const paymentVal = $('#expense-field-payment').value.trim();
    const rawOrderId = $('#expense-field-order').value.trim();
    const noteVal = $('#expense-field-note').value.trim();

    if (!dateVal) {
      toast('Tanggal pengeluaran wajib diisi');
      $('#expense-field-date').focus();
      return;
    }

    if (!categoryVal) {
      toast('Kategori pengeluaran wajib dipilih');
      $('#expense-field-category').focus();
      return;
    }

    if (amountVal <= 0) {
      toast('Jumlah pengeluaran harus lebih dari Rp 0');
      $('#expense-field-amount').focus();
      return;
    }

    if (!paymentVal) {
      toast('Metode pembayaran wajib dipilih');
      $('#expense-field-payment').focus();
      return;
    }

    let linkedOrderId = null;
    if (rawOrderId) {
      const matchedOrder = orders.find(
        (o) => o.orderId.toLowerCase() === rawOrderId.toLowerCase()
      );
      const existingExpense = editingExpenseId !== null
        ? expenses.find((exp) => exp.id === editingExpenseId)
        : null;
      if (matchedOrder) {
        linkedOrderId = matchedOrder.orderId;
      } else if (
        existingExpense &&
        existingExpense.orderId &&
        existingExpense.orderId.toLowerCase() === rawOrderId.toLowerCase()
      ) {
        linkedOrderId = existingExpense.orderId;
      } else {
        toast('ID pesanan tidak ditemukan');
        $('#expense-field-order').focus();
        return;
      }
    }

    const data = {
      date: dateVal,
      categoryId: Number(categoryVal),
      amount: amountVal,
      paymentMethod: paymentVal,
      orderId: linkedOrderId,
      note: noteVal
    };

    saveBtn.disabled = true;

    try {
      if (editingExpenseId !== null) {
        await ShugenDB.expenses.update(editingExpenseId, data);
        toast('Pengeluaran diperbarui');
      } else {
        await ShugenDB.expenses.add(data);
        toast('Pengeluaran ditambahkan');
      }
      expenses = await ShugenDB.expenses.getAll();
      render();
      $('#expense-dialog').close();
    } catch (err) {
      console.error(err);
      toast('Gagal menyimpan pengeluaran');
    } finally {
      saveBtn.disabled = false;
    }
  }

  async function handleDeleteExpense() {
    const deleteBtn = $('#btn-delete-expense');
    if (deleteBtn.disabled) return;
    if (editingExpenseId === null) return;
    if (!confirm('Hapus pengeluaran ini?')) return;

    deleteBtn.disabled = true;

    try {
      await ShugenDB.expenses.delete(editingExpenseId);
      expenses = await ShugenDB.expenses.getAll();
      render();
      $('#expense-dialog').close();
      toast('Pengeluaran dihapus');
    } catch (err) {
      console.error(err);
      toast('Gagal menghapus pengeluaran');
    } finally {
      deleteBtn.disabled = false;
    }
  }

  // Cash

  async function saveCashInitialBalance() {
    const saveBtn = $('#btn-save-cash-initial');
    if (saveBtn.disabled) return;

    const rawVal = $('#cash-initial-input').value.trim();
    const newBalance = rawVal === '' ? 0 : Number(rawVal);

    if (isNaN(newBalance) || newBalance < 0) {
      toast('Saldo awal harus berupa angka positif');
      $('#cash-initial-input').focus();
      return;
    }

    saveBtn.disabled = true;

    try {
      await ShugenDB.cash.set('initialBalance', newBalance);
      cashInitialBalance = newBalance;
      renderCash();
      toast('Saldo awal disimpan');
    } catch (err) {
      console.error(err);
      toast('Gagal menyimpan saldo awal');
    } finally {
      saveBtn.disabled = false;
    }
  }

  // Quick status picker

  function openStatusPicker(id) {
    statusChangeId = id;
    const order = orders.find((o) => o.id === id);
    if (!order) return;

    $$('.status-option').forEach((btn) => {
      btn.classList.toggle('current', btn.dataset.status === order.status);
    });

    $('#status-dialog').showModal();
  }

  async function changeStatus(id, newStatus) {
    try {
      await ShugenDB.orders.update(id, { status: newStatus });
      orders = await ShugenDB.orders.getAll();
      render();
      $('#status-dialog').close();
      toast('Status diubah: ' + STATUS_LABELS[newStatus]);
    } catch (err) {
      console.error(err);
      toast('Gagal mengubah status');
    }
  }

  // Settings dialog

  function openSettings() {
    $('#btn-load-demo').disabled = false;
    $('#btn-add-payment').disabled = false;
    $('#btn-add-category').disabled = false;
    $('#btn-save-shop-info').disabled = false;
    $('#setting-shop-name').value = shopName || 'Shugen Store';
    $('#setting-shop-contact').value = shopContact || '';
    renderPaymentList();
    renderCategoryList();
    $('#settings-dialog').showModal();
  }

  function renderPaymentList() {
    const list = $('#payment-list');
    list.innerHTML = '';

    paymentMethods.forEach((pm) => {
      const li = document.createElement('li');
      li.className = 'payment-item';

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'payment-name';
      input.value = pm.name;
      input.setAttribute('aria-label', 'Nama metode: ' + pm.name);
      input.addEventListener('change', () => renamePayment(pm.id, input.value));

      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'btn-delete-payment';
      del.setAttribute('aria-label', 'Hapus ' + pm.name);
      del.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
      del.addEventListener('click', () => removePayment(pm.id));

      li.appendChild(input);
      li.appendChild(del);
      list.appendChild(li);
    });
  }

  async function addPaymentMethod() {
    const addBtn = $('#btn-add-payment');
    if (addBtn.disabled) return;

    const input = $('#payment-add-input');
    const name = input.value.trim();
    if (!name) {
      input.focus();
      return;
    }

    const isDuplicate = paymentMethods.some(
      (pm) => pm.name.toLowerCase() === name.toLowerCase()
    );
    if (isDuplicate) {
      toast('Metode pembayaran sudah ada');
      input.focus();
      return;
    }

    addBtn.disabled = true;

    try {
      await ShugenDB.payment.add(name);
      paymentMethods = await ShugenDB.payment.getAll();
      input.value = '';
      renderPaymentList();
      toast('Metode ditambahkan');
    } catch (err) {
      console.error(err);
      if (err && err.message === 'DUPLICATE_PAYMENT') {
        toast('Metode pembayaran sudah ada');
      } else {
        toast('Gagal menambah metode');
      }
    } finally {
      addBtn.disabled = false;
    }
  }

  async function renamePayment(id, newName) {
    const trimmed = newName.trim();
    if (!trimmed) {
      renderPaymentList();
      return;
    }

    const isDuplicate = paymentMethods.some(
      (pm) => pm.id !== id && pm.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      renderPaymentList();
      toast('Metode pembayaran sudah ada');
      return;
    }

    try {
      await ShugenDB.payment.update(id, trimmed);
      paymentMethods = await ShugenDB.payment.getAll();
      renderPaymentList();
      toast('Metode diperbarui');
    } catch (err) {
      console.error(err);
      renderPaymentList();
      toast('Gagal mengubah nama');
    }
  }

  async function removePayment(id) {
    try {
      await ShugenDB.payment.delete(id);
      paymentMethods = await ShugenDB.payment.getAll();
      renderPaymentList();
      toast('Metode dihapus');
    } catch (err) {
      console.error(err);
      toast('Gagal menghapus metode');
    }
  }

  function renderCategoryList() {
    const list = $('#category-list');
    list.innerHTML = '';

    expenseCategories.forEach((cat) => {
      const li = document.createElement('li');
      li.className = 'payment-item';

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'payment-name';
      input.value = cat.name;
      input.setAttribute('aria-label', 'Nama kategori: ' + cat.name);
      input.addEventListener('change', () => renameExpenseCategory(cat.id, input.value));

      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'btn-delete-payment';
      del.setAttribute('aria-label', 'Hapus kategori ' + cat.name);
      del.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
      del.addEventListener('click', () => removeExpenseCategory(cat.id));

      li.appendChild(input);
      li.appendChild(del);
      list.appendChild(li);
    });
  }

  async function addExpenseCategory() {
    const addBtn = $('#btn-add-category');
    if (addBtn.disabled) return;

    const input = $('#category-add-input');
    const name = input.value.trim();
    if (!name) {
      input.focus();
      return;
    }

    const isDuplicate = expenseCategories.some(
      (cat) => cat.name.toLowerCase() === name.toLowerCase()
    );
    if (isDuplicate) {
      toast('Nama kategori tidak boleh kembar');
      input.focus();
      return;
    }

    addBtn.disabled = true;

    try {
      await ShugenDB.categories.add(name);
      expenseCategories = await ShugenDB.categories.getAll();
      input.value = '';
      renderCategoryList();
      render();
      toast('Kategori ditambahkan');
    } catch (err) {
      console.error(err);
      if (err && err.message === 'DUPLICATE_CATEGORY') {
        toast('Nama kategori tidak boleh kembar');
      } else {
        toast('Gagal menambah kategori');
      }
    } finally {
      addBtn.disabled = false;
    }
  }

  async function renameExpenseCategory(id, newName) {
    const trimmed = newName.trim();
    if (!trimmed) {
      renderCategoryList();
      return;
    }

    const isDuplicate = expenseCategories.some(
      (cat) => cat.id !== id && cat.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      renderCategoryList();
      toast('Nama kategori tidak boleh kembar');
      return;
    }

    try {
      await ShugenDB.categories.update(id, trimmed);
      expenseCategories = await ShugenDB.categories.getAll();
      renderCategoryList();
      render();
      toast('Kategori diperbarui');
    } catch (err) {
      console.error(err);
      renderCategoryList();
      if (err && err.message === 'DUPLICATE_CATEGORY') {
        toast('Nama kategori tidak boleh kembar');
      } else {
        toast('Gagal mengubah nama kategori');
      }
    }
  }

  async function removeExpenseCategory(id) {
    const usedCount = expenses.filter((exp) => Number(exp.categoryId) === Number(id)).length;
    if (usedCount > 0) {
      toast('Kategori sedang dipakai oleh pengeluaran dan tidak dapat dihapus');
      return;
    }

    try {
      await ShugenDB.categories.delete(id);
      expenseCategories = await ShugenDB.categories.getAll();
      if (String(expenseCategoryFilter) === String(id)) {
        expenseCategoryFilter = 'semua';
      }
      renderCategoryList();
      render();
      toast('Kategori dihapus');
    } catch (err) {
      console.error(err);
      if (err && err.message === 'CATEGORY_IN_USE') {
        toast('Kategori sedang dipakai oleh pengeluaran dan tidak dapat dihapus');
      } else {
        toast('Gagal menghapus kategori');
      }
    }
  }

  // Invoice actions

  async function handleCreateInvoiceForOrder(order) {
    if (!order || !order.orderId) return;
    const btn = $('#btn-create-invoice');
    if (btn.disabled) return;
    btn.disabled = true;

    try {
      const created = await ShugenDB.invoices.add({
        orderId: order.orderId,
        issueDate: todayYmd(),
        note: ''
      });
      invoices = await ShugenDB.invoices.getAll();
      render();
      $('#order-dialog').close();
      toast('Invoice berhasil dibuat');
      openInvoiceView(created.id);
    } catch (err) {
      console.error(err);
      toast('Gagal membuat invoice');
    } finally {
      btn.disabled = false;
    }
  }

  function openInvoiceView(invoiceId) {
    activeInvoiceId = invoiceId;
    const inv = invoices.find((x) => x.id === invoiceId);
    if (!inv) return;

    const order = orders.find((o) => o.orderId === inv.orderId);
    const orderIncomes = incomes.filter((inc) => inc.orderId === inv.orderId);
    const totalPaid = orderIncomes.reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);
    const price = order ? Number(order.price) || 0 : 0;
    const remainingBalance = Math.max(0, price - totalPaid);
    const isPaidOff = totalPaid >= price && price > 0;

    $('#invoice-header-num').textContent = inv.invoiceNumber;
    $('#inv-store-name').textContent = shopName || 'Shugen Store';
    $('#inv-store-contact').textContent = shopContact || '-';

    const badge = $('#inv-status-badge');
    if (isPaidOff) {
      badge.textContent = 'LUNAS';
      badge.className = 'inv-status-badge inv-badge--lunas';
    } else {
      badge.textContent = 'BELUM LUNAS';
      badge.className = 'inv-status-badge inv-badge--belum-lunas';
    }

    $('#inv-number').textContent = inv.invoiceNumber;
    $('#inv-date').textContent = formatYmd(inv.issueDate);
    $('#inv-order-id').textContent = inv.orderId;
    $('#inv-customer-name').textContent = order ? order.customerName : '(Pesanan tidak ditemukan)';

    const serviceType = order ? (order.type === 'joki' ? 'Joki' : 'Topup') : '-';
    const serviceGame = order ? order.game : '-';
    $('#inv-order-service').textContent = serviceType + ' - ' + serviceGame;
    $('#inv-order-desc').textContent = order && order.detail ? order.detail : '-';
    $('#inv-order-price-val').textContent = 'Rp ' + formatPrice(price);

    $('#inv-total-price').textContent = 'Rp ' + formatPrice(price);
    $('#inv-total-paid').textContent = 'Rp ' + formatPrice(totalPaid);
    $('#inv-remaining-balance').textContent = 'Rp ' + formatPrice(remainingBalance);

    $('#inv-note-text').textContent = inv.note ? inv.note : '-';
    $('#inv-note-edit-input').value = inv.note || '';

    $('#btn-print-invoice').disabled = false;
    $('#btn-delete-invoice').disabled = false;
    $('#btn-save-invoice-note').disabled = false;

    $('#invoice-detail-dialog').showModal();
  }

  async function handleDeleteInvoice() {
    if (!activeInvoiceId) return;
    const btn = $('#btn-delete-invoice');
    if (btn.disabled) return;
    if (!confirm('Hapus invoice ini? Pesanan tidak akan terhapus.')) return;

    btn.disabled = true;

    try {
      await ShugenDB.invoices.delete(activeInvoiceId);
      invoices = await ShugenDB.invoices.getAll();
      render();
      $('#invoice-detail-dialog').close();
      toast('Invoice dihapus');
    } catch (err) {
      console.error(err);
      toast('Gagal menghapus invoice');
    } finally {
      btn.disabled = false;
    }
  }

  async function handleSaveInvoiceNote(e) {
    e.preventDefault();
    if (!activeInvoiceId) return;
    const btn = $('#btn-save-invoice-note');
    if (btn.disabled) return;

    const newNote = $('#inv-note-edit-input').value.trim();
    btn.disabled = true;

    try {
      await ShugenDB.invoices.updateNote(activeInvoiceId, newNote);
      invoices = await ShugenDB.invoices.getAll();
      const updatedInv = invoices.find((x) => x.id === activeInvoiceId);
      $('#inv-note-text').textContent = updatedInv && updatedInv.note ? updatedInv.note : '-';
      render();
      toast('Catatan invoice diperbarui');
    } catch (err) {
      console.error(err);
      toast('Gagal menyimpan catatan invoice');
    } finally {
      btn.disabled = false;
    }
  }

  async function handleSaveShopInfo(e) {
    e.preventDefault();
    const btn = $('#btn-save-shop-info');
    if (btn.disabled) return;

    const nameVal = $('#setting-shop-name').value.trim() || 'Shugen Store';
    const contactVal = $('#setting-shop-contact').value.trim();
    btn.disabled = true;

    try {
      await ShugenDB.settings.set('shopName', nameVal);
      await ShugenDB.settings.set('shopContact', contactVal);
      shopName = nameVal;
      shopContact = contactVal;
      render();
      toast('Informasi toko disimpan');
    } catch (err) {
      console.error(err);
      toast('Gagal menyimpan informasi toko');
    } finally {
      btn.disabled = false;
    }
  }

  // Customer actions

  function openCustomerDetail(customerId) {
    activeCustomerId = customerId;
    const cust = customers.find((c) => c.id === customerId);
    if (!cust) return;

    $('#cust-detail-id').textContent = cust.customerId || '';
    $('#cust-detail-name').textContent = cust.name;
    $('#cust-detail-contact').textContent = cust.contact || '-';
    $('#cust-detail-note').textContent = cust.note || '-';

    const isSub = Boolean(cust.isSubscriber);
    $('#cust-detail-sub-badge').hidden = !isSub;

    const toggleSubBtn = $('#btn-cust-detail-toggle-sub');
    toggleSubBtn.textContent = isSub ? 'Cabut Langganan' : 'Tandai Langganan';
    toggleSubBtn.setAttribute(
      'aria-label',
      isSub ? ('Cabut status langganan ' + cust.name) : ('Tandai ' + cust.name + ' sebagai langganan')
    );
    toggleSubBtn.disabled = false;
    $('#btn-cust-detail-edit').disabled = false;

    // Calculate order stats
    const matchedOrders = orders.filter((o) => matchCustomerName(o.customerName, cust.name));
    const nonCancelledOrders = matchedOrders.filter((o) => o.status !== 'dibatalkan');

    const orderCount = nonCancelledOrders.length;
    const totalPrice = nonCancelledOrders.reduce((sum, o) => sum + (Number(o.price) || 0), 0);

    const matchedOrderIds = new Set(matchedOrders.map((o) => o.orderId));
    const customerIncomes = incomes.filter((inc) => inc.orderId && matchedOrderIds.has(inc.orderId));
    const totalPaid = customerIncomes.reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);

    $('#cust-detail-order-count').textContent = String(orderCount);
    $('#cust-detail-total-price').textContent = 'Rp ' + formatPrice(totalPrice);
    $('#cust-detail-total-paid').textContent = 'Rp ' + formatPrice(totalPaid);

    // Riwayat pesanan
    const sortedOrders = matchedOrders.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const ordersContainer = $('#cust-orders-list');
    ordersContainer.innerHTML = '';

    if (sortedOrders.length === 0) {
      $('#cust-orders-empty').hidden = false;
      ordersContainer.hidden = true;
    } else {
      $('#cust-orders-empty').hidden = true;
      ordersContainer.hidden = false;

      sortedOrders.forEach((order) => {
        const item = document.createElement('article');
        item.className = 'customer-order-item';
        item.tabIndex = 0;
        item.dataset.orderId = order.id;
        item.setAttribute('role', 'button');

        const serviceType = order.type === 'joki' ? 'Joki' : 'Topup';
        const serviceLabel = serviceType + ' · ' + order.game;
        const statusLabel = STATUS_LABELS[order.status] || order.status;
        const priceLabel = 'Rp ' + formatPrice(order.price);

        item.setAttribute(
          'aria-label',
          order.orderId + ', ' + serviceLabel + ', ' + statusLabel + ', ' + priceLabel + '. Tap untuk buka pesanan.'
        );

        item.innerHTML =
          '<div class="customer-order-item-header">' +
            '<span class="order-id">' + esc(order.orderId) + '</span>' +
            '<span class="status-badge status-' + order.status + '">' + esc(statusLabel) + '</span>' +
          '</div>' +
          '<div class="customer-order-item-body">' +
            '<span class="customer-order-item-service">' + esc(serviceLabel) + '</span>' +
            '<strong class="customer-order-item-price">' + esc(priceLabel) + '</strong>' +
          '</div>';

        item.addEventListener('click', () => {
          $('#customer-detail-dialog').close();
          openOrderForm(order.id);
        });

        item.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            $('#customer-detail-dialog').close();
            openOrderForm(order.id);
          }
        });

        ordersContainer.appendChild(item);
      });
    }

    $('#customer-detail-dialog').showModal();
  }

  function openCustomerForm(customerId) {
    editingCustomerId = customerId;
    const dialog = $('#customer-dialog');
    const form = $('#customer-form');
    form.reset();
    $('#btn-save-customer').disabled = false;
    $('#btn-delete-customer').disabled = false;

    if (customerId !== null) {
      const cust = customers.find((c) => c.id === customerId);
      if (!cust) return;
      $('#customer-form-title').textContent = 'Edit Pelanggan';
      $('#customer-id-val').textContent = cust.customerId || '';
      $('#customer-id-row').hidden = false;
      $('#customer-field-name').value = cust.name;
      $('#customer-field-contact').value = cust.contact || '';
      $('#customer-field-sub').value = cust.isSubscriber ? 'ya' : 'tidak';
      $('#customer-field-note').value = cust.note || '';
      $('#btn-delete-customer').hidden = false;
    } else {
      $('#customer-form-title').textContent = 'Tambah Pelanggan';
      $('#customer-id-val').textContent = '';
      $('#customer-id-row').hidden = true;
      $('#customer-field-name').value = '';
      $('#customer-field-contact').value = '';
      $('#customer-field-sub').value = 'tidak';
      $('#customer-field-note').value = '';
      $('#btn-delete-customer').hidden = true;
    }

    dialog.showModal();
    $('#customer-field-name').focus();
  }

  async function saveCustomer() {
    const saveBtn = $('#btn-save-customer');
    if (saveBtn.disabled) return;

    const nameVal = $('#customer-field-name').value.trim();
    const contactVal = $('#customer-field-contact').value.trim();
    const isSubVal = $('#customer-field-sub').value === 'ya';
    const noteVal = $('#customer-field-note').value.trim();

    if (!nameVal) {
      toast('Nama pelanggan wajib diisi');
      $('#customer-field-name').focus();
      return;
    }

    const isDup = customers.some(
      (c) => c.id !== editingCustomerId && matchCustomerName(c.name, nameVal)
    );
    if (isDup) {
      toast('Nama pelanggan sudah digunakan');
      $('#customer-field-name').focus();
      return;
    }

    saveBtn.disabled = true;

    try {
      if (editingCustomerId !== null) {
        await ShugenDB.customers.update(editingCustomerId, {
          name: nameVal,
          contact: contactVal,
          isSubscriber: isSubVal,
          note: noteVal
        });
        orders = await ShugenDB.orders.getAll();
        customers = await ShugenDB.customers.getAll();
        populateCustomerDatalist();
        render();
        $('#customer-dialog').close();
        if (activeCustomerId === editingCustomerId) {
          openCustomerDetail(editingCustomerId);
        }
        toast('Data pelanggan diperbarui');
      } else {
        await ShugenDB.customers.add({
          name: nameVal,
          contact: contactVal,
          isSubscriber: isSubVal,
          note: noteVal
        });
        customers = await ShugenDB.customers.getAll();
        populateCustomerDatalist();
        render();
        $('#customer-dialog').close();
        toast('Pelanggan ditambahkan');
      }
    } catch (err) {
      console.error(err);
      if (err && err.message === 'DUPLICATE_CUSTOMER_NAME') {
        toast('Nama pelanggan sudah digunakan');
        $('#customer-field-name').focus();
      } else {
        toast('Gagal menyimpan pelanggan');
      }
    } finally {
      saveBtn.disabled = false;
    }
  }

  async function handleDeleteCustomer() {
    const deleteBtn = $('#btn-delete-customer');
    if (deleteBtn.disabled) return;
    if (editingCustomerId === null) return;

    if (!confirm('Hapus pelanggan ini? Pesanan milik pelanggan ini tidak akan terhapus.')) return;

    deleteBtn.disabled = true;

    try {
      await ShugenDB.customers.delete(editingCustomerId);
      customers = await ShugenDB.customers.getAll();
      populateCustomerDatalist();
      render();
      $('#customer-dialog').close();
      if (activeCustomerId === editingCustomerId) {
        $('#customer-detail-dialog').close();
        activeCustomerId = null;
      }
      toast('Pelanggan dihapus');
    } catch (err) {
      console.error(err);
      toast('Gagal menghapus pelanggan');
    } finally {
      deleteBtn.disabled = false;
    }
  }

  async function toggleCustomerSubscription(customerId, btnElement) {
    if (btnElement && btnElement.disabled) return;
    const cust = customers.find((c) => c.id === customerId);
    if (!cust) return;

    if (btnElement) btnElement.disabled = true;

    const nextStatus = !cust.isSubscriber;
    try {
      await ShugenDB.customers.update(customerId, { isSubscriber: nextStatus });
      customers = await ShugenDB.customers.getAll();
      render();
      if (activeCustomerId === customerId) {
        openCustomerDetail(customerId);
      }
      toast(nextStatus ? 'Ditandai sebagai langganan' : 'Status langganan dicabut');
    } catch (err) {
      console.error(err);
      toast('Gagal mengubah status langganan');
    } finally {
      if (btnElement) btnElement.disabled = false;
    }
  }

  // Demo data actions

  async function loadDemoData() {
    const demoBtn = $('#btn-load-demo');
    if (demoBtn.disabled) return;
    if (!confirm('Data pesanan yang ada akan dihapus dan diganti dengan data demo. Lanjutkan?')) return;

    demoBtn.disabled = true;

    try {
      await DummyData.load();
      orders = await ShugenDB.orders.getAll();
      incomes = await ShugenDB.incomes.getAll();
      expenses = await ShugenDB.expenses.getAll();
      invoices = await ShugenDB.invoices.getAll();
      customers = await ShugenDB.customers.getAll();
      populateCustomerDatalist();
      expenseCategories = await ShugenDB.categories.getAll();
      await refreshProgressMap();
      paymentMethods = await ShugenDB.payment.getAll();
      const savedBalance = await ShugenDB.cash.get('initialBalance');
      cashInitialBalance = (savedBalance !== null && savedBalance !== undefined) ? Number(savedBalance) : 0;
      const savedShopName = await ShugenDB.settings.get('shopName');
      shopName = savedShopName || 'Shugen Store';
      const savedShopContact = await ShugenDB.settings.get('shopContact');
      shopContact = savedShopContact || '';
      $('#setting-shop-name').value = shopName;
      $('#setting-shop-contact').value = shopContact;
      render();
      renderPaymentList();
      renderCategoryList();
      toast('Data demo dimuat');
    } catch (err) {
      console.error(err);
      toast('Gagal memuat data demo');
    } finally {
      demoBtn.disabled = false;
    }
  }

  // Theme switching

  async function loadTheme() {
    const saved = await ShugenDB.settings.get('theme');
    if (saved === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      updateMetaTheme('#F5F5F7');
    }
  }

  async function toggleTheme() {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    if (isLight) {
      document.documentElement.removeAttribute('data-theme');
      await ShugenDB.settings.set('theme', 'dark');
      updateMetaTheme('#0F1117');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      await ShugenDB.settings.set('theme', 'light');
      updateMetaTheme('#F5F5F7');
    }
  }

  function updateMetaTheme(color) {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', color);
  }

  // Toast notifications

  let toastTimer = null;

  function toast(message) {
    const el = $('#toast');
    el.textContent = message;
    el.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('visible'), 2500);
  }

  return { init: init };
})();

document.addEventListener('DOMContentLoaded', App.init);
