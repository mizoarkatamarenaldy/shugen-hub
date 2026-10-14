const App = (function () {
  let orders = [];
  let games = [];
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
  let partners = [];
  let partnerSearchQuery = '';
  let partnerFilter = 'semua';
  let activePartnerId = null;
  let editingPartnerId = null;
  let partnerOrderFilter = 'semua';
  let catalogItems = [];
  let editingCatalogId = null;
  let pendingImportData = null;
  let activeRecapTab = 'daily';
  let recapDailyDate = '';
  let recapMonthlyMonth = '';
  let orderSortOption = 'terbaru';
  let activeDeadlineAttentionFilter = false;

  const DEFAULT_WA_TEMPLATES = {
    konfirmasi: 'Halo {nama_pelanggan}, pesanan game {game} ({id_pesanan}) sudah kami catat. Total tagihan: {total}. Silakan lakukan pembayaran agar pesanan dapat segera kami proses. Terima kasih!',
    progress: 'Halo {nama_pelanggan}, pesanan {game} ({id_pesanan}) sedang kami kerjakan. Progress saat ini: {progress}. Kami akan kabari lagi saat ada perkembangan selanjutnya.',
    selesai: 'Halo {nama_pelanggan}, pesanan {game} ({id_pesanan}) sudah selesai dikerjakan. Terima kasih banyak telah memesan di Shugen Store!'
  };

  let waTemplates = {
    konfirmasi: DEFAULT_WA_TEMPLATES.konfirmasi,
    progress: DEFAULT_WA_TEMPLATES.progress,
    selesai: DEFAULT_WA_TEMPLATES.selesai
  };
  let currentWaOrderId = null;
  let currentWaOrderSnapshot = null;
  let currentWaTemplateType = 'konfirmasi';
  let waCopyTimer = null;

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

  function currentYm() {
    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    return yyyy + '-' + mm;
  }

  function formatMonthYear(ym) {
    if (!ym) return '';
    const parts = String(ym).split('-');
    if (parts.length === 2) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
      if (!isNaN(d.getTime())) {
        return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(d);
      }
    }
    return ym;
  }

  function formatRecapCurrency(amount) {
    const val = Number(amount) || 0;
    if (val < 0) {
      return '-Rp ' + formatPrice(Math.abs(val));
    }
    return 'Rp ' + formatPrice(val);
  }

  // Deadline & Notification helpers (Fitur 10)

  const NOTIF_STORAGE_ENABLED = 'shugen_notifications_enabled';
  const NOTIF_STORAGE_REMINDED = 'shugen_notifications_reminded';

  function parseDeadline(deadline) {
    if (!deadline) return null;
    let dateStr = '';
    let timeStr = '';
    if (typeof deadline === 'string') {
      const trimmed = deadline.trim();
      if (!trimmed) return null;
      if (trimmed.includes('T')) {
        const parts = trimmed.split('T');
        dateStr = parts[0];
        timeStr = parts[1] || '';
      } else if (trimmed.includes(' ')) {
        const parts = trimmed.split(' ');
        dateStr = parts[0];
        timeStr = parts[1] || '';
      } else {
        dateStr = trimmed;
      }
    } else if (typeof deadline === 'object') {
      dateStr = deadline.date || '';
      timeStr = deadline.time || '';
    }
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
    if (timeStr) {
      timeStr = timeStr.slice(0, 5);
      if (!/^\d{2}:\d{2}$/.test(timeStr)) timeStr = '';
    }
    return { date: dateStr, time: timeStr };
  }

  function getDeadlineMoment(parsedDeadline) {
    if (!parsedDeadline) return null;
    const dateParts = parsedDeadline.date.split('-');
    const y = Number(dateParts[0]);
    const m = Number(dateParts[1]) - 1;
    const d = Number(dateParts[2]);
    if (parsedDeadline.time) {
      const timeParts = parsedDeadline.time.split(':');
      const hour = Number(timeParts[0]);
      const min = Number(timeParts[1]);
      return new Date(y, m, d, hour, min, 0, 0);
    }
    // Tanpa jam: lewat setelah hari itu berakhir (23:59:59.999 atau pergantian hari)
    return new Date(y, m, d + 1, 0, 0, 0, 0);
  }

  function getDeadlineUrgency(order, nowInput) {
    if (!order || !order.deadline) return null;
    const parsed = parseDeadline(order.deadline);
    if (!parsed) return null;

    // Hanya pesanan berstatus Menunggu Bayar dan Diproses yang dihitung. Selesai dan Dibatalkan tidak pernah ditandai.
    if (order.status !== 'menunggu_bayar' && order.status !== 'diproses') {
      return { level: 'lainnya', parsed: parsed };
    }

    const now = nowInput || new Date();
    const deadlineMoment = getDeadlineMoment(parsed);
    if (!deadlineMoment) return null;

    if (now.getTime() >= deadlineMoment.getTime()) {
      return { level: 'terlambat', parsed: parsed };
    }

    const nowYear = now.getFullYear();
    const nowMonth = now.getMonth();
    const nowDate = now.getDate();

    const dParts = parsed.date.split('-');
    const dYear = Number(dParts[0]);
    const dMonth = Number(dParts[1]) - 1;
    const dDay = Number(dParts[2]);

    // Hari ini
    if (dYear === nowYear && dMonth === nowMonth && dDay === nowDate) {
      return { level: 'hari_ini', parsed: parsed };
    }

    // Besok
    const tomorrow = new Date(nowYear, nowMonth, nowDate + 1);
    if (dYear === tomorrow.getFullYear() && dMonth === tomorrow.getMonth() && dDay === tomorrow.getDate()) {
      return { level: 'besok', parsed: parsed };
    }

    return { level: 'lainnya', parsed: parsed };
  }

  function formatDeadlineDisplay(order, nowInput) {
    if (!order || !order.deadline) return '';
    const urgency = getDeadlineUrgency(order, nowInput);
    if (!urgency) return '';
    const parsed = urgency.parsed;
    const timeFormatted = parsed.time ? parsed.time.replace(':', '.') : '';

    if (urgency.level === 'terlambat') {
      return 'Terlambat';
    }
    if (urgency.level === 'hari_ini') {
      return timeFormatted ? ('Hari ini ' + timeFormatted) : 'Hari ini';
    }
    if (urgency.level === 'besok') {
      return timeFormatted ? ('Besok ' + timeFormatted) : 'Besok';
    }
    // Lainnya: tampilkan tanggal deadline saja
    const dateFormatted = formatYmd(parsed.date);
    return timeFormatted ? (dateFormatted + ' ' + timeFormatted) : dateFormatted;
  }

  function updateDeadlineSummary() {
    const wrap = $('#order-deadline-summary-wrap');
    const textEl = $('#order-deadline-summary-text');
    const hintEl = $('#order-deadline-summary-hint');
    const btn = $('#btn-deadline-summary');
    if (!wrap || !textEl || !btn) return;

    const now = new Date();
    let overdueCount = 0;
    let todayCount = 0;

    orders.forEach((o) => {
      const urg = getDeadlineUrgency(o, now);
      if (urg) {
        if (urg.level === 'terlambat') overdueCount++;
        else if (urg.level === 'hari_ini') todayCount++;
      }
    });

    const totalAttention = overdueCount + todayCount;
    if (totalAttention === 0) {
      wrap.hidden = true;
      activeDeadlineAttentionFilter = false;
      btn.setAttribute('aria-pressed', 'false');
      btn.classList.remove('order-deadline-summary-btn--active');
      return;
    }

    const parts = [];
    if (overdueCount > 0) {
      parts.push(overdueCount + ' pesanan terlambat');
    }
    if (todayCount > 0) {
      if (overdueCount > 0) {
        parts.push(todayCount + ' deadline hari ini');
      } else {
        parts.push(todayCount + ' pesanan deadline hari ini');
      }
    }

    textEl.textContent = parts.join(', ');
    btn.setAttribute('aria-pressed', activeDeadlineAttentionFilter ? 'true' : 'false');
    if (activeDeadlineAttentionFilter) {
      btn.classList.add('order-deadline-summary-btn--active');
      if (hintEl) hintEl.textContent = '(Filter aktif - ketuk untuk batalkan)';
    } else {
      btn.classList.remove('order-deadline-summary-btn--active');
      if (hintEl) hintEl.textContent = '(Ketuk untuk filter)';
    }
    wrap.hidden = false;
  }

  function getRemindedRecords() {
    try {
      const raw = localStorage.getItem(NOTIF_STORAGE_REMINDED);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function markOrderReminded(orderId, level) {
    try {
      const records = getRemindedRecords();
      if (!records[orderId]) records[orderId] = {};
      records[orderId][level] = true;
      localStorage.setItem(NOTIF_STORAGE_REMINDED, JSON.stringify(records));
    } catch (e) {}
  }

  function isOrderReminded(orderId, level) {
    const records = getRemindedRecords();
    return Boolean(records[orderId] && records[orderId][level]);
  }

  function resetOrderNotificationReminders(orderId) {
    try {
      const records = getRemindedRecords();
      delete records[orderId];
      localStorage.setItem(NOTIF_STORAGE_REMINDED, JSON.stringify(records));
    } catch (e) {}
  }

  function sendBrowserNotification(title, body) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try {
      new Notification(title, {
        body: body,
        icon: 'icons/icon-192.png'
      });
    } catch (err) {
      console.error('Gagal menampilkan notifikasi:', err);
    }
  }

  function checkNotifications() {
    const isEnabled = localStorage.getItem(NOTIF_STORAGE_ENABLED) === 'true';
    if (!isEnabled) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const now = new Date();
    // Hanya pesanan berstatus Menunggu Bayar dan Diproses yang dihitung
    const activeOrders = orders.filter((o) =>
      (o.status === 'menunggu_bayar' || o.status === 'diproses') && o.deadline
    );

    activeOrders.forEach((order) => {
      const parsed = parseDeadline(order.deadline);
      if (!parsed) return;
      const deadlineMoment = getDeadlineMoment(parsed);
      if (!deadlineMoment) return;

      const diffMs = deadlineMoment.getTime() - now.getTime();

      // Tingkat 1: Terlambat (diffMs <= 0)
      if (diffMs <= 0) {
        if (!isOrderReminded(order.orderId, 'overdue')) {
          markOrderReminded(order.orderId, 'overdue');
          sendBrowserNotification(
            'Pesanan Terlambat: ' + order.orderId,
            order.customerName + ' - Batas waktu pengerjaan sudah lewat.'
          );
        }
      }
      // Tingkat 2: Tinggal 1 jam (0 < diffMs <= 60 menit)
      else if (diffMs <= 60 * 60 * 1000) {
        if (!isOrderReminded(order.orderId, 'one_hour')) {
          markOrderReminded(order.orderId, 'one_hour');
          sendBrowserNotification(
            'Deadline Tinggal 1 Jam: ' + order.orderId,
            order.customerName + ' - Deadline pesanan jatuh dalam kurun waktu 1 jam.'
          );
        }
      }
    });
  }

  function renderNotificationSettings() {
    const toggle = $('#setting-notification-toggle');
    const statusHint = $('#setting-notification-status');
    if (!toggle || !statusHint) return;

    if (!('Notification' in window)) {
      toggle.checked = false;
      toggle.disabled = true;
      statusHint.textContent = 'Browser ini tidak mendukung notifikasi. Pengingat tetap tersedia melalui ringkasan di atas daftar pesanan.';
      statusHint.hidden = false;
      return;
    }

    if (Notification.permission === 'denied') {
      toggle.checked = false;
      toggle.disabled = true;
      statusHint.textContent = 'Izin notifikasi diblokir di browser. Buka setelan browser untuk mengizinkan, atau gunakan ringkasan di daftar pesanan.';
      statusHint.hidden = false;
      return;
    }

    toggle.disabled = false;
    const isEnabled = localStorage.getItem(NOTIF_STORAGE_ENABLED) === 'true' && Notification.permission === 'granted';
    toggle.checked = isEnabled;
    if (isEnabled) {
      statusHint.textContent = 'Notifikasi browser aktif saat aplikasi terbuka di perangkat ini.';
      statusHint.hidden = false;
    } else {
      statusHint.hidden = true;
    }
  }

  async function handleNotificationToggleChange(e) {
    const toggle = e.target;
    const statusHint = $('#setting-notification-status');

    if (!('Notification' in window)) {
      toggle.checked = false;
      toggle.disabled = true;
      if (statusHint) {
        statusHint.textContent = 'Browser ini tidak mendukung notifikasi. Pengingat tetap tersedia melalui ringkasan di atas daftar pesanan.';
        statusHint.hidden = false;
      }
      toast('Browser tidak mendukung notifikasi');
      return;
    }

    if (toggle.checked) {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          localStorage.setItem(NOTIF_STORAGE_ENABLED, 'true');
          toggle.checked = true;
          if (statusHint) {
            statusHint.textContent = 'Notifikasi browser aktif saat aplikasi terbuka di perangkat ini.';
            statusHint.hidden = false;
          }
          toast('Notifikasi browser diaktifkan');
          checkNotifications();
        } else if (permission === 'denied') {
          localStorage.setItem(NOTIF_STORAGE_ENABLED, 'false');
          toggle.checked = false;
          toggle.disabled = true;
          if (statusHint) {
            statusHint.textContent = 'Izin notifikasi ditolak di browser. Pengingat tetap berjalan melalui ringkasan di daftar pesanan.';
            statusHint.hidden = false;
          }
          toast('Izin notifikasi ditolak oleh browser');
        } else {
          localStorage.setItem(NOTIF_STORAGE_ENABLED, 'false');
          toggle.checked = false;
          if (statusHint) {
            statusHint.textContent = 'Izin belum diberikan. Nyalakan saklar kembali untuk meminta izin.';
            statusHint.hidden = false;
          }
        }
      } catch (err) {
        console.error(err);
        localStorage.setItem(NOTIF_STORAGE_ENABLED, 'false');
        toggle.checked = false;
        toast('Gagal meminta izin notifikasi');
      }
    } else {
      localStorage.setItem(NOTIF_STORAGE_ENABLED, 'false');
      toggle.checked = false;
      if (statusHint) {
        statusHint.hidden = true;
      }
      toast('Notifikasi browser dimatikan');
    }
  }

  function checkDeadlinesAndSummary() {
    updateDeadlineSummary();
    if (activeView === 'orders') {
      renderOrders();
    }
    checkNotifications();
  }

  // DOM helpers

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  function getGameName(gameId) {
    if (!gameId) return '-';
    const found = games.find((g) => g.gameId === gameId);
    return found ? found.name : '-';
  }

  function getPartnerName(partnerId) {
    if (!partnerId) return '-';
    const found = partners.find((p) => p.partnerId === partnerId);
    return found ? found.name : partnerId;
  }

  function getPartner(partnerId) {
    if (!partnerId) return null;
    return partners.find((p) => p.partnerId === partnerId) || null;
  }

  function calculatePartnerShare(totalPrice, shareType, shareValue) {
    const total = Math.max(0, Number(totalPrice) || 0);
    const val = Number(shareValue) || 0;
    if (!shareType) {
      return { partnerAmount: 0, shopAmount: total };
    }
    if (shareType === 'percent') {
      const partnerAmount = Math.round((val / 100) * total);
      const shopAmount = total - partnerAmount;
      return { partnerAmount, shopAmount };
    }
    if (shareType === 'nominal') {
      const partnerAmount = Math.round(val);
      const shopAmount = total - partnerAmount;
      return { partnerAmount, shopAmount };
    }
    return { partnerAmount: 0, shopAmount: total };
  }

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
      games = await ShugenDB.games.getAll();
      orders = await ShugenDB.orders.getAll();
      customers = await ShugenDB.customers.getAll();
      partners = await ShugenDB.partners.getAll();
      catalogItems = await ShugenDB.catalog.getAll();
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
      recapDailyDate = todayYmd();
      recapMonthlyMonth = currentYm();
      await loadWaTemplates();
      render();
      bindEvents();
      checkNotifications();
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
    $('#view-partners').hidden = state !== 'ready' || activeView !== 'partners';
    $('#view-incomes').hidden = state !== 'ready' || activeView !== 'incomes';
    $('#view-expenses').hidden = state !== 'ready' || activeView !== 'expenses';
    $('#view-cash').hidden = state !== 'ready' || activeView !== 'cash';
    $('#view-invoices').hidden = state !== 'ready' || activeView !== 'invoices';
    $('#view-recap').hidden = state !== 'ready' || activeView !== 'recap';
    $('#fab-add').hidden = state !== 'ready' || activeView === 'cash' || activeView === 'invoices' || activeView === 'recap';

    $('#empty-state').hidden = true;
    $('#empty-filtered').hidden = true;
    $('#order-list').hidden = state !== 'ready';

    $('#customer-empty-state').hidden = true;
    $('#customer-empty-filtered').hidden = true;
    $('#customer-list').hidden = state !== 'ready';

    $('#partner-empty-state').hidden = true;
    $('#partner-empty-filtered').hidden = true;
    $('#partner-list').hidden = state !== 'ready';

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

    if (state !== 'ready') {
      $('#recap-empty-state').hidden = true;
      $('#recap-monthly-list').hidden = true;
    }

    if (state === 'ready') {
      const fabLabel = activeView === 'incomes'
        ? 'Tambah pemasukan baru'
        : activeView === 'expenses'
          ? 'Tambah pengeluaran baru'
          : activeView === 'customers'
            ? 'Tambah pelanggan baru'
            : activeView === 'partners'
              ? 'Tambah partner baru'
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

      const filteredPartners = getFilteredPartners();
      if (partners.length === 0) {
        $('#partner-empty-state').hidden = false;
        $('#partner-list').hidden = true;
      } else if (filteredPartners.length === 0) {
        $('#partner-empty-filtered').hidden = false;
        $('#partner-list').hidden = true;
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
        getGameName(o.gameId).toLowerCase().includes(q)
      );
    }
    if (activeDeadlineAttentionFilter) {
      list = list.filter((o) => {
        const urg = getDeadlineUrgency(o);
        return urg && (urg.level === 'terlambat' || urg.level === 'hari_ini');
      });
    }
    if (orderSortOption === 'deadline') {
      list.sort((a, b) => {
        const aParsed = parseDeadline(a.deadline);
        const bParsed = parseDeadline(b.deadline);
        const aHas = Boolean(aParsed);
        const bHas = Boolean(bParsed);

        if (aHas && !bHas) return -1;
        if (!aHas && bHas) return 1;
        if (!aHas && !bHas) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }

        const aMoment = getDeadlineMoment(aParsed);
        const bMoment = getDeadlineMoment(bParsed);
        const aTime = aMoment ? aMoment.getTime() : Infinity;
        const bTime = bMoment ? bMoment.getTime() : Infinity;

        if (aTime !== bTime) {
          return aTime - bTime;
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    } else {
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
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

  function getFilteredPartners() {
    let list = partners.slice();
    if (partnerFilter === 'aktif') {
      list = list.filter((p) => p.isActive !== false);
    } else if (partnerFilter === 'nonaktif') {
      list = list.filter((p) => p.isActive === false);
    }
    if (partnerSearchQuery) {
      const q = partnerSearchQuery.toLowerCase();
      list = list.filter((p) =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.phone || '').toLowerCase().includes(q) ||
        (p.note || '').toLowerCase().includes(q)
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
      const serviceName = order ? ((order.type === 'joki' ? 'Joki' : 'Topup') + ' · ' + getGameName(order.gameId)) : '-';
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
    renderPartnerTabs();
    updateDeadlineSummary();
    renderOrders();
    renderCustomers();
    renderPartners();
    renderIncomes();
    renderExpenses();
    renderCash();
    renderInvoices();
    renderRecap();
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

      let deadlineHtml = '';
      let deadlineAria = '';
      if (order.deadline) {
        const urg = getDeadlineUrgency(order);
        const deadlineLabel = formatDeadlineDisplay(order);
        if (deadlineLabel) {
          const urgClass = urg ? ('order-deadline--' + urg.level) : 'order-deadline--lainnya';
          deadlineHtml =
            '<div class="order-deadline ' + urgClass + '">' +
              '<span class="order-deadline-prefix">Deadline:</span>' +
              '<strong class="order-deadline-text">' + esc(deadlineLabel) + '</strong>' +
            '</div>';
          deadlineAria = ', Deadline: ' + deadlineLabel;
        }
      }

      let partnerTagHtml = '';
      let partnerAria = '';
      if (order.partnerId) {
        const pName = getPartnerName(order.partnerId);
        partnerTagHtml = '<span class="order-partner-tag">Partner: ' + esc(pName) + '</span>';
        partnerAria = ', Partner: ' + pName;
      }

      card.setAttribute('aria-label',
        order.orderId + ', ' + order.customerName + ', ' + STATUS_LABELS[order.status] + progressAria + deadlineAria + partnerAria
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
          '<span class="order-game">' + esc(getGameName(order.gameId)) + '</span>' +
          partnerTagHtml +
        '</div>' +
        progressHtml +
        deadlineHtml +
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

  function renderPartnerTabs() {
    $$('.partner-filter-tabs .tab').forEach((tab) => {
      const isSelected = tab.dataset.partnerFilter === partnerFilter;
      tab.classList.toggle('active', isSelected);
      tab.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    });
  }

  function renderPartners() {
    renderPartnerTabs();
    const list = getFilteredPartners();
    const container = $('#partner-list');
    container.innerHTML = '';

    list.forEach((part) => {
      const card = document.createElement('article');
      card.className = 'partner-card';
      card.tabIndex = 0;
      card.dataset.id = part.id;
      card.dataset.partnerId = part.partnerId;
      card.setAttribute('role', 'button');

      const isInactive = part.isActive === false;
      const inactiveBadgeHtml = isInactive
        ? '<span class="partner-inactive-badge">Nonaktif</span>'
        : '';

      const matchedOrders = orders.filter((o) => o.partnerId === part.partnerId && o.status !== 'dibatalkan');
      const orderCountLabel = matchedOrders.length + ' pesanan';

      const readyOrders = matchedOrders.filter((o) => o.status === 'selesai' && !o.partnerPaid);
      const readyUnpaidAmount = readyOrders.reduce((sum, o) => sum + (Number(o.partnerShareAmount) || 0), 0);

      const paidOrders = matchedOrders.filter((o) => o.partnerPaid);
      const paidAmount = paidOrders.reduce((sum, o) => sum + (Number(o.partnerShareAmount) || 0), 0);

      const phoneHtml = part.phone
        ? '<div class="partner-card-contact">' + esc(part.phone) + '</div>'
        : '';

      card.setAttribute(
        'aria-label',
        part.name + (isInactive ? ', Nonaktif' : '') + (part.phone ? (', ' + part.phone) : '') +
        ', ' + orderCountLabel + ', Siap dibayar Rp ' + formatPrice(readyUnpaidAmount) +
        ', Sudah dibayar Rp ' + formatPrice(paidAmount) + '. Tap untuk buka detail.'
      );

      card.innerHTML =
        '<div class="partner-card-header">' +
          '<div class="partner-card-name">' + esc(part.name) + '</div>' +
          inactiveBadgeHtml +
        '</div>' +
        phoneHtml +
        '<div class="partner-card-stats-row">' +
          '<div class="partner-stat-col">' +
            '<span class="partner-stat-col-label">Pesanan</span>' +
            '<span class="partner-stat-col-val">' + esc(orderCountLabel) + '</span>' +
          '</div>' +
          '<div class="partner-stat-col">' +
            '<span class="partner-stat-col-label">Siap Dibayar</span>' +
            '<span class="partner-stat-col-val">Rp ' + formatPrice(readyUnpaidAmount) + '</span>' +
          '</div>' +
          '<div class="partner-stat-col">' +
            '<span class="partner-stat-col-label">Sudah Dibayar</span>' +
            '<span class="partner-stat-col-val">Rp ' + formatPrice(paidAmount) + '</span>' +
          '</div>' +
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

  function renderRecap() {
    renderRecapTabs();

    const isDaily = activeRecapTab === 'daily';
    const dailyControls = $('#recap-daily-controls');
    const monthlyControls = $('#recap-monthly-controls');
    const dailyDateInput = $('#recap-date-input');
    const monthlyMonthInput = $('#recap-month-input');
    const emptyState = $('#recap-empty-state');
    const emptyMsg = $('#recap-empty-message');
    const emptyHint = $('#recap-empty-hint');
    const monthlyList = $('#recap-monthly-list');
    const omzetEl = $('#recap-omzet');
    const expensesEl = $('#recap-expenses');
    const profitEl = $('#recap-profit');

    if (!dailyControls || !monthlyControls) return;

    dailyControls.hidden = !isDaily;
    monthlyControls.hidden = isDaily;

    if (isDaily) {
      if (dailyDateInput && dailyDateInput.value !== recapDailyDate) {
        dailyDateInput.value = recapDailyDate;
      }
      monthlyList.hidden = true;
      monthlyList.innerHTML = '';

      if (!recapDailyDate) {
        omzetEl.textContent = 'Rp 0';
        expensesEl.textContent = 'Rp 0';
        profitEl.textContent = 'Rp 0';
        emptyState.hidden = false;
        emptyMsg.textContent = 'Pilih tanggal untuk melihat rekap';
        emptyHint.textContent = 'Silakan pilih tanggal transaksi pada kolom di atas.';
        return;
      }

      const dayIncomes = incomes.filter((inc) => inc.date === recapDailyDate);
      const dayExpenses = expenses.filter((exp) => exp.date === recapDailyDate);
      const totalOmzet = dayIncomes.reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);
      const totalExpenses = dayExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
      const netProfit = totalOmzet - totalExpenses;

      omzetEl.textContent = formatRecapCurrency(totalOmzet);
      expensesEl.textContent = formatRecapCurrency(totalExpenses);
      profitEl.textContent = formatRecapCurrency(netProfit);

      if (dayIncomes.length === 0 && dayExpenses.length === 0) {
        emptyState.hidden = false;
        emptyMsg.textContent = 'Tidak ada transaksi pada tanggal ini';
        emptyHint.textContent = 'Belum ada pemasukan atau pengeluaran yang tercatat pada ' + formatYmd(recapDailyDate) + '.';
      } else {
        emptyState.hidden = true;
      }
    } else {
      if (monthlyMonthInput && monthlyMonthInput.value !== recapMonthlyMonth) {
        monthlyMonthInput.value = recapMonthlyMonth;
      }

      if (!recapMonthlyMonth) {
        omzetEl.textContent = 'Rp 0';
        expensesEl.textContent = 'Rp 0';
        profitEl.textContent = 'Rp 0';
        emptyState.hidden = false;
        emptyMsg.textContent = 'Pilih bulan untuk melihat rekap';
        emptyHint.textContent = 'Silakan pilih bulan transaksi pada kolom di atas.';
        monthlyList.hidden = true;
        monthlyList.innerHTML = '';
        return;
      }

      const monthIncomes = incomes.filter(
        (inc) => inc.date && inc.date.slice(0, 7) === recapMonthlyMonth
      );
      const monthExpenses = expenses.filter(
        (exp) => exp.date && exp.date.slice(0, 7) === recapMonthlyMonth
      );
      const totalOmzet = monthIncomes.reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);
      const totalExpenses = monthExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
      const netProfit = totalOmzet - totalExpenses;

      omzetEl.textContent = formatRecapCurrency(totalOmzet);
      expensesEl.textContent = formatRecapCurrency(totalExpenses);
      profitEl.textContent = formatRecapCurrency(netProfit);

      if (monthIncomes.length === 0 && monthExpenses.length === 0) {
        emptyState.hidden = false;
        emptyMsg.textContent = 'Tidak ada transaksi pada bulan ini';
        emptyHint.textContent = 'Belum ada pemasukan atau pengeluaran yang tercatat pada bulan ' + formatMonthYear(recapMonthlyMonth) + '.';
        monthlyList.hidden = true;
        monthlyList.innerHTML = '';
      } else {
        emptyState.hidden = true;
        monthlyList.hidden = false;
        monthlyList.innerHTML = '';

        const dailyMap = {};
        monthIncomes.forEach((inc) => {
          const d = inc.date;
          if (!dailyMap[d]) dailyMap[d] = { date: d, omzet: 0, expenses: 0 };
          dailyMap[d].omzet += Number(inc.amount) || 0;
        });
        monthExpenses.forEach((exp) => {
          const d = exp.date;
          if (!dailyMap[d]) dailyMap[d] = { date: d, omzet: 0, expenses: 0 };
          dailyMap[d].expenses += Number(exp.amount) || 0;
        });

        const sortedDays = Object.values(dailyMap).sort((a, b) => b.date.localeCompare(a.date));

        sortedDays.forEach((day) => {
          const dayProfit = day.omzet - day.expenses;
          const card = document.createElement('article');
          card.className = 'recap-day-card';
          card.setAttribute(
            'aria-label',
            'Rekap ' + formatYmd(day.date) + ': Omzet ' + formatRecapCurrency(day.omzet) + ', Pengeluaran ' + formatRecapCurrency(day.expenses) + ', Untung Bersih ' + formatRecapCurrency(dayProfit)
          );

          card.innerHTML =
            '<div class="recap-day-header">' +
              '<span class="recap-day-date">' + esc(formatYmd(day.date)) + '</span>' +
            '</div>' +
            '<div class="recap-day-stats">' +
              '<div class="recap-day-stat">' +
                '<span class="recap-day-stat-label">Omzet</span>' +
                '<span class="recap-day-stat-val">' + esc(formatRecapCurrency(day.omzet)) + '</span>' +
              '</div>' +
              '<div class="recap-day-stat">' +
                '<span class="recap-day-stat-label">Pengeluaran</span>' +
                '<span class="recap-day-stat-val">' + esc(formatRecapCurrency(day.expenses)) + '</span>' +
              '</div>' +
              '<div class="recap-day-stat">' +
                '<span class="recap-day-stat-label">Untung Bersih</span>' +
                '<strong class="recap-day-stat-val">' + esc(formatRecapCurrency(dayProfit)) + '</strong>' +
              '</div>' +
            '</div>';

          monthlyList.appendChild(card);
        });
      }
    }
  }

  function renderRecapTabs() {
    $$('.recap-tabs .tab').forEach((tab) => {
      const isSelected = tab.dataset.recapMode === activeRecapTab;
      tab.classList.toggle('active', isSelected);
      tab.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    });
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

    $$('#view-orders .status-tabs .tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        activeFilter = tab.dataset.status;
        activeDeadlineAttentionFilter = false;
        render();
      });
    });

    const btnDeadlineSummary = $('#btn-deadline-summary');
    if (btnDeadlineSummary) {
      btnDeadlineSummary.addEventListener('click', () => {
        activeDeadlineAttentionFilter = !activeDeadlineAttentionFilter;
        renderOrders();
        updateDeadlineSummary();
      });
    }

    const orderSortSelect = $('#order-sort-select');
    if (orderSortSelect) {
      orderSortSelect.addEventListener('change', (e) => {
        orderSortOption = e.target.value;
        renderOrders();
      });
    }

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

    $('#partner-search-input').addEventListener('input', (e) => {
      partnerSearchQuery = e.target.value.trim();
      renderPartners();
    });

    $$('.partner-filter-tabs .tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        partnerFilter = tab.dataset.partnerFilter;
        renderPartnerTabs();
        renderPartners();
      });
    });

    $$('.recap-tabs .tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        activeRecapTab = tab.dataset.recapMode;
        renderRecap();
      });
    });

    const recapDateInput = $('#recap-date-input');
    if (recapDateInput) {
      const handleDateChange = (e) => {
        recapDailyDate = e.target.value;
        renderRecap();
      };
      recapDateInput.addEventListener('input', handleDateChange);
      recapDateInput.addEventListener('change', handleDateChange);
    }

    const recapMonthInput = $('#recap-month-input');
    if (recapMonthInput) {
      const handleMonthChange = (e) => {
        recapMonthlyMonth = e.target.value;
        renderRecap();
      };
      recapMonthInput.addEventListener('input', handleMonthChange);
      recapMonthInput.addEventListener('change', handleMonthChange);
    }

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

    $('#partner-list').addEventListener('click', (e) => {
      const card = e.target.closest('.partner-card');
      if (card && card.dataset.partnerId) openPartnerDetail(card.dataset.partnerId);
    });

    $('#partner-list').addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const card = e.target.closest('.partner-card');
      if (card && card.dataset.partnerId) {
        e.preventDefault();
        openPartnerDetail(card.dataset.partnerId);
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
      } else if (activeView === 'partners') {
        openPartnerForm(null);
      } else {
        openOrderForm(null);
      }
    });

    $('#field-type').addEventListener('change', toggleProgressSection);
    $('#field-game').addEventListener('change', () => {
      updateOrderCatalogSelect();
    });
    $('#field-order-catalog').addEventListener('change', handleOrderCatalogSelect);
    $('#field-status').addEventListener('change', () => {
      updateCompletePrompt();
      if (editingId !== null) {
        const currentOrder = orders.find((o) => o.id === editingId);
        if (currentOrder) {
          const tempOrder = Object.assign({}, currentOrder, { status: $('#field-status').value });
          updateOrderPartnerPayoutUI(tempOrder);
        }
      }
    });

    $('#field-partner').addEventListener('change', () => {
      const selectedId = $('#field-partner').value;
      if (selectedId) {
        const part = getPartner(selectedId);
        if (part && part.defaultShareType) {
          $('#field-share-type').value = part.defaultShareType;
          $('#field-share-value').value = part.defaultShareValue != null ? part.defaultShareValue : '';
        }
      }
      updateOrderShareInputs();
      if (editingId !== null) {
        const currentOrder = orders.find((o) => o.id === editingId);
        updateOrderPartnerPayoutUI(currentOrder);
      }
    });

    $('#field-share-type').addEventListener('change', updateOrderShareInputs);
    $('#field-share-value').addEventListener('input', updateOrderShareSummary);
    $('#field-price').addEventListener('input', () => {
      updateOrderShareSummary();
    });

    $('#btn-toggle-partner-paid').addEventListener('click', toggleOrderPartnerPaid);

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
      $('#field-partner').value = '';
      $('#order-share-config').hidden = true;
      $('#order-partner-payout-box').hidden = true;
      const orderAccBox = $('#order-partner-account-box');
      if (orderAccBox) orderAccBox.hidden = true;
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
      const clearBtn = $('#btn-open-clear-data');
      if (clearBtn) clearBtn.disabled = false;
      $('#btn-add-payment').disabled = false;
      $('#btn-add-game').disabled = false;
      $('#btn-add-category').disabled = false;
      $('#btn-export-backup').disabled = false;
      $('#btn-import-backup').disabled = false;
    });

    $('#btn-export-backup').addEventListener('click', exportBackup);
    $('#btn-import-backup').addEventListener('click', triggerImportBackup);
    $('#backup-file-input').addEventListener('change', handleBackupFileSelected);

    $('#btn-close-import-preview').addEventListener('click', closeImportPreview);
    $('#btn-cancel-import-preview').addEventListener('click', closeImportPreview);
    $('#btn-confirm-import-preview').addEventListener('click', confirmImportBackup);
    $('#import-confirm-dialog').addEventListener('close', closeImportPreview);

    // Hapus Semua Data (Fitur 16)
    $('#btn-open-clear-data').addEventListener('click', openClearConfirmDialog);
    $('#btn-close-clear-confirm').addEventListener('click', closeClearConfirmDialog);
    $('#btn-cancel-clear-confirm').addEventListener('click', closeClearConfirmDialog);
    $('#btn-confirm-clear-data').addEventListener('click', confirmClearAllData);
    $('#clear-confirm-dialog').addEventListener('close', closeClearConfirmDialog);
    $('#clear-data-confirm-input').addEventListener('input', (e) => {
      const isHapus = e.target.value.trim() === 'HAPUS';
      const confirmBtn = $('#btn-confirm-clear-data');
      if (confirmBtn) confirmBtn.disabled = !isHapus;
    });
    $('#clear-data-confirm-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const confirmBtn = $('#btn-confirm-clear-data');
        if (confirmBtn && !confirmBtn.disabled) {
          confirmClearAllData();
        }
      }
    });

    $('#btn-add-payment').addEventListener('click', addPaymentMethod);
    $('#payment-add-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); addPaymentMethod(); }
    });

    $('#btn-add-game').addEventListener('click', addGame);
    $('#game-add-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); addGame(); }
    });

    const btnGotoSettingsGame = $('#btn-goto-settings-game');
    if (btnGotoSettingsGame) {
      btnGotoSettingsGame.addEventListener('click', () => {
        $('#order-dialog').close();
        openSettings();
      });
    }

    const btnAddCatalog = $('#btn-add-catalog');
    if (btnAddCatalog) {
      btnAddCatalog.addEventListener('click', () => openCatalogDialog());
    }
    const btnCloseCatalog = $('#btn-close-catalog-dialog');
    if (btnCloseCatalog) {
      btnCloseCatalog.addEventListener('click', closeCatalogDialog);
    }
    const btnCancelCatalog = $('#btn-cancel-catalog');
    if (btnCancelCatalog) {
      btnCancelCatalog.addEventListener('click', closeCatalogDialog);
    }
    const catalogForm = $('#catalog-form');
    if (catalogForm) {
      catalogForm.addEventListener('submit', saveCatalogItem);
    }
    const btnDeleteCatalog = $('#btn-delete-catalog');
    if (btnDeleteCatalog) {
      btnDeleteCatalog.addEventListener('click', () => deleteCatalogItemAction());
    }

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

    // WhatsApp templates settings events
    $('#btn-save-template-konfirmasi').addEventListener('click', () => saveWaTemplate('konfirmasi'));
    $('#btn-reset-template-konfirmasi').addEventListener('click', () => resetWaTemplate('konfirmasi'));
    $('#btn-save-template-progress').addEventListener('click', () => saveWaTemplate('progress'));
    $('#btn-reset-template-progress').addEventListener('click', () => resetWaTemplate('progress'));
    $('#btn-save-template-selesai').addEventListener('click', () => saveWaTemplate('selesai'));
    $('#btn-reset-template-selesai').addEventListener('click', () => resetWaTemplate('selesai'));

    // WhatsApp dialog events
    $('#btn-close-wa-dialog').addEventListener('click', () => {
      $('#wa-dialog').close();
    });
    $('#btn-copy-wa-message').addEventListener('click', copyWaMessage);

    $$('.wa-template-tabs .wa-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        selectWaTemplateTab(tab.dataset.template);
      });
    });

    $('#wa-dialog').addEventListener('close', () => {
      resetWaCopyButton();
    });

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

    // Partner dialog events
    $('#partner-form').addEventListener('submit', (e) => {
      e.preventDefault();
      savePartner();
    });

    $('#btn-cancel-partner').addEventListener('click', () => {
      $('#partner-dialog').close();
    });

    $('#btn-delete-partner').addEventListener('click', handleDeletePartner);

    $('#partner-dialog').addEventListener('close', () => {
      editingPartnerId = null;
      $('#btn-save-partner').disabled = false;
      $('#btn-delete-partner').disabled = false;
    });

    $('#partner-field-share-type').addEventListener('change', updatePartnerFormShareInputs);

    $('#btn-close-partner-detail').addEventListener('click', () => {
      $('#partner-detail-dialog').close();
    });

    $('#partner-detail-dialog').addEventListener('close', () => {
      activePartnerId = null;
      partnerOrderFilter = 'semua';
      $('#btn-partner-detail-toggle-active').disabled = false;
      $('#btn-partner-detail-edit').disabled = false;
    });

    $('#btn-partner-detail-edit').addEventListener('click', () => {
      if (activePartnerId !== null) {
        openPartnerForm(activePartnerId);
      }
    });

    $('#btn-partner-detail-toggle-active').addEventListener('click', (e) => {
      if (activePartnerId !== null) {
        togglePartnerActive(activePartnerId, e.target);
      }
    });

    $('#btn-partner-mark-all-paid').addEventListener('click', () => {
      if (activePartnerId !== null) {
        batchMarkPartnerOrdersPaid(activePartnerId);
      }
    });

    $$('.partner-orders-tabs .tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        partnerOrderFilter = tab.dataset.partnerOrderFilter;
        renderPartnerOrdersTabs();
        const part = getPartner(activePartnerId);
        if (part) renderPartnerOrdersList(part);
      });
    });

    const btnCopyPartnerDetailAcc = $('#btn-copy-partner-detail-account');
    if (btnCopyPartnerDetailAcc) {
      btnCopyPartnerDetailAcc.addEventListener('click', (e) => {
        const btn = e.currentTarget;
        const num = btn.dataset.accountNumber;
        if (num) copyPartnerAccountNumber(num, btn);
      });
    }

    const btnCopyOrderPartnerAcc = $('#btn-copy-order-partner-account');
    if (btnCopyOrderPartnerAcc) {
      btnCopyOrderPartnerAcc.addEventListener('click', (e) => {
        const btn = e.currentTarget;
        const num = btn.dataset.accountNumber;
        if (num) copyPartnerAccountNumber(num, btn);
      });
    }

    const btnClearDeadline = $('#btn-clear-deadline');
    const fieldDeadlineDate = $('#field-deadline-date');
    const fieldDeadlineTime = $('#field-deadline-time');
    const detailDeadlineBadge = $('#detail-deadline-badge');

    if (btnClearDeadline) {
      btnClearDeadline.addEventListener('click', () => {
        if (fieldDeadlineDate) fieldDeadlineDate.value = '';
        if (fieldDeadlineTime) fieldDeadlineTime.value = '';
        if (detailDeadlineBadge) detailDeadlineBadge.hidden = true;
        btnClearDeadline.hidden = true;
      });
    }

    if (fieldDeadlineDate) {
      fieldDeadlineDate.addEventListener('input', () => {
        if (btnClearDeadline) {
          btnClearDeadline.hidden = !fieldDeadlineDate.value && (!fieldDeadlineTime || !fieldDeadlineTime.value);
        }
      });
    }

    if (fieldDeadlineTime) {
      fieldDeadlineTime.addEventListener('input', () => {
        if (btnClearDeadline) {
          btnClearDeadline.hidden = (!fieldDeadlineDate || !fieldDeadlineDate.value) && !fieldDeadlineTime.value;
        }
      });
    }

    const settingNotifToggle = $('#setting-notification-toggle');
    if (settingNotifToggle) {
      settingNotifToggle.addEventListener('change', handleNotificationToggleChange);
    }

    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        checkDeadlinesAndSummary();
      }
    });
    window.addEventListener('focus', checkDeadlinesAndSummary);
    setInterval(checkDeadlinesAndSummary, 60000);

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

  function populatePartnerSelect(selectedPartnerId) {
    const sel = $('#field-partner');
    if (!sel) return;
    sel.innerHTML = '<option value="">Tanpa partner (Dikerjakan sendiri)</option>';

    partners.forEach((p) => {
      if (p.isActive !== false) {
        const opt = document.createElement('option');
        opt.value = p.partnerId;
        opt.textContent = p.name;
        sel.appendChild(opt);
      }
    });

    if (selectedPartnerId) {
      const selectedPartner = partners.find((p) => p.partnerId === selectedPartnerId);
      if (selectedPartner && selectedPartner.isActive === false) {
        const opt = document.createElement('option');
        opt.value = selectedPartner.partnerId;
        opt.textContent = selectedPartner.name + ' (Nonaktif)';
        sel.appendChild(opt);
      }
    }

    sel.value = selectedPartnerId || '';
  }

  function updateOrderShareInputs() {
    const partnerId = $('#field-partner').value;
    const configBox = $('#order-share-config');
    if (!partnerId) {
      configBox.hidden = true;
      $('#order-partner-payout-box').hidden = true;
      const orderAccBox = $('#order-partner-account-box');
      if (orderAccBox) orderAccBox.hidden = true;
      return;
    }

    configBox.hidden = false;
    const type = $('#field-share-type').value;
    const label = $('#field-share-value-label');
    const prefix = $('#field-share-value-prefix');
    const input = $('#field-share-value');

    if (type === 'percent') {
      label.textContent = 'Nilai Persen (%)';
      prefix.hidden = true;
      input.setAttribute('max', '100');
      input.setAttribute('placeholder', 'Contoh: 70');
    } else {
      label.textContent = 'Nominal Tetap (Rp)';
      prefix.hidden = false;
      input.removeAttribute('max');
      input.setAttribute('placeholder', 'Contoh: 15000');
    }

    updateOrderShareSummary();
    updateOrderPartnerAccountUI();
  }

  async function copyPartnerAccountNumber(accountNumber, buttonEl) {
    const cleanNumber = String(accountNumber || '').trim();
    if (!cleanNumber) return;

    let copied = false;
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(cleanNumber);
        copied = true;
      } catch (clipErr) {
        copied = false;
      }
    }

    if (!copied) {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = cleanNumber;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        copied = document.execCommand('copy');
        document.body.removeChild(textArea);
      } catch (fallbackErr) {
        copied = false;
      }
    }

    if (copied) {
      toast('Nomor disalin');
      if (buttonEl) {
        buttonEl.classList.add('is-copied');
        const textSpan = buttonEl.querySelector('span');
        const origText = textSpan ? textSpan.textContent : buttonEl.textContent;
        if (textSpan) {
          textSpan.textContent = 'Nomor disalin';
        } else {
          buttonEl.textContent = 'Nomor disalin';
        }
        setTimeout(() => {
          buttonEl.classList.remove('is-copied');
          if (textSpan) {
            textSpan.textContent = origText;
          } else {
            buttonEl.textContent = origText;
          }
        }, 2000);
      }
    } else {
      toast('Gagal menyalin nomor rekening');
    }
  }

  function updateOrderPartnerAccountUI() {
    const partnerId = $('#field-partner') ? $('#field-partner').value : '';
    const accountBox = $('#order-partner-account-box');
    if (!accountBox) return;

    if (!partnerId) {
      accountBox.hidden = true;
      return;
    }

    const part = getPartner(partnerId);
    if (!part) {
      accountBox.hidden = true;
      return;
    }

    const hasBank = Boolean(part.bankName && part.bankName.trim());
    const hasAccountNum = Boolean(part.accountNumber && part.accountNumber.trim());
    const hasHolder = Boolean(part.accountHolder && part.accountHolder.trim());
    const hasAnyAccountInfo = hasBank || hasAccountNum || hasHolder;

    if (hasAnyAccountInfo) {
      accountBox.hidden = false;
      const bankEl = $('#order-partner-bank');
      if (bankEl) {
        bankEl.textContent = part.bankName ? part.bankName.trim() : '';
        bankEl.hidden = !hasBank;
      }

      const numEl = $('#order-partner-account-num');
      const copyBtn = $('#btn-copy-order-partner-account');
      if (numEl) {
        numEl.textContent = part.accountNumber ? part.accountNumber.trim() : '';
        numEl.hidden = !hasAccountNum;
      }
      if (copyBtn) {
        copyBtn.hidden = !hasAccountNum;
        copyBtn.dataset.accountNumber = hasAccountNum ? part.accountNumber.trim() : '';
        copyBtn.classList.remove('is-copied');
        const textSpan = copyBtn.querySelector('span');
        if (textSpan) textSpan.textContent = 'Salin Nomor Rekening';
      }

      const holderRow = $('#order-partner-holder-row');
      const holderEl = $('#order-partner-holder');
      if (holderEl) holderEl.textContent = part.accountHolder ? part.accountHolder.trim() : '';
      if (holderRow) holderRow.hidden = !hasHolder;
    } else {
      accountBox.hidden = true;
    }
  }

  function updateOrderShareSummary() {
    const partnerId = $('#field-partner').value;
    if (!partnerId) return;

    const totalPrice = Math.max(0, Number($('#field-price').value) || 0);
    const shareType = $('#field-share-type').value;
    const shareVal = Number($('#field-share-value').value) || 0;
    const { partnerAmount, shopAmount } = calculatePartnerShare(totalPrice, shareType, shareVal);

    $('#order-share-calc-total').textContent = 'Rp ' + formatPrice(totalPrice);
    $('#order-share-calc-partner').textContent = 'Rp ' + formatPrice(partnerAmount);
    $('#order-share-calc-shop').textContent = 'Rp ' + formatPrice(shopAmount);
  }

  function updateOrderPartnerPayoutUI(order) {
    const box = $('#order-partner-payout-box');
    const partnerId = $('#field-partner').value;
    if (!order || !order.id || !partnerId) {
      box.hidden = true;
      return;
    }

    box.hidden = false;
    const isPaid = Boolean(order.partnerPaid);
    const statusEl = $('#order-partner-paid-status');
    const btn = $('#btn-toggle-partner-paid');
    const hint = $('#order-partner-paid-hint');
    const currentStatus = ($('#field-status') && !$('#field-status-group').hidden)
      ? $('#field-status').value
      : order.status;
    const isSelesai = currentStatus === 'selesai';

    if (isPaid) {
      const paidDateStr = order.partnerPaidAt ? (' (' + formatYmd(order.partnerPaidAt.slice(0, 10)) + ')') : '';
      statusEl.textContent = 'Sudah dibayar' + paidDateStr;
      btn.textContent = 'Batalkan Sudah Dibayar';
      btn.disabled = false;
      hint.hidden = true;
    } else {
      statusEl.textContent = 'Belum dibayar';
      btn.textContent = 'Tandai Sudah Dibayar';
      if (!isSelesai) {
        btn.disabled = true;
        hint.hidden = false;
        hint.textContent = 'Bagian partner hanya bisa ditandai sudah dibayar jika status pesanan Selesai.';
      } else {
        btn.disabled = false;
        hint.hidden = true;
      }
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
      populateGameSelect(order.gameId);
      updateOrderCatalogSelect(order.gameId);
      $('#field-detail').value = order.detail;
      $('#field-price').value = order.price || '';
      $('#field-payment').value = order.paymentMethod;
      $('#field-status').value = order.status;
      $('#field-status-group').hidden = false;
      $('#btn-delete-order').hidden = false;

      populatePartnerSelect(order.partnerId || '');
      $('#field-share-type').value = order.partnerShareType || 'percent';
      $('#field-share-value').value = order.partnerShareValue != null ? order.partnerShareValue : '';
      updateOrderShareInputs();
      updateOrderPartnerPayoutUI(order);

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

      $('#order-wa-group').hidden = false;
      $('#btn-open-wa-dialog').onclick = () => {
        openWaDialog(order.orderId);
      };

      const deadlineDateInput = $('#field-deadline-date');
      const deadlineTimeInput = $('#field-deadline-time');
      const deadlineBadge = $('#detail-deadline-badge');
      const btnClearDeadline = $('#btn-clear-deadline');
      const parsedDeadline = parseDeadline(order.deadline);
      if (parsedDeadline) {
        if (deadlineDateInput) deadlineDateInput.value = parsedDeadline.date;
        if (deadlineTimeInput) deadlineTimeInput.value = parsedDeadline.time || '';
        const deadlineLabel = formatDeadlineDisplay(order);
        const urg = getDeadlineUrgency(order);
        if (deadlineBadge) {
          deadlineBadge.textContent = deadlineLabel;
          deadlineBadge.className = 'detail-deadline-badge' + (urg ? (' detail-deadline-badge--' + urg.level) : '');
          deadlineBadge.hidden = false;
        }
        if (btnClearDeadline) btnClearDeadline.hidden = false;
      } else {
        if (deadlineDateInput) deadlineDateInput.value = '';
        if (deadlineTimeInput) deadlineTimeInput.value = '';
        if (deadlineBadge) deadlineBadge.hidden = true;
        if (btnClearDeadline) btnClearDeadline.hidden = true;
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
      populateGameSelect('');
      updateOrderCatalogSelect('');
      const deadlineDateInput = $('#field-deadline-date');
      const deadlineTimeInput = $('#field-deadline-time');
      const deadlineBadge = $('#detail-deadline-badge');
      const btnClearDeadline = $('#btn-clear-deadline');
      if (deadlineDateInput) deadlineDateInput.value = '';
      if (deadlineTimeInput) deadlineTimeInput.value = '';
      if (deadlineBadge) deadlineBadge.hidden = true;
      if (btnClearDeadline) btnClearDeadline.hidden = true;
      $('#field-status').value = 'menunggu_bayar';
      $('#field-status-group').hidden = true;

      populatePartnerSelect('');
      $('#field-share-type').value = 'percent';
      $('#field-share-value').value = '';
      $('#order-share-config').hidden = true;
      $('#order-partner-payout-box').hidden = true;
      const orderAccBox = $('#order-partner-account-box');
      if (orderAccBox) orderAccBox.hidden = true;

      $('#order-paid-group').hidden = true;
      $('#order-paid-total').textContent = 'Rp 0';
      $('#order-paid-count').textContent = 'Belum ada pemasukan tercatat';
      $('#order-expense-group').hidden = true;
      $('#order-expense-total').textContent = 'Rp 0';
      $('#order-expense-count').textContent = 'Belum ada pengeluaran tercatat';
      $('#order-invoice-group').hidden = true;
      $('#order-wa-group').hidden = true;
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

  function populateGameSelect(selectedGameId) {
    const sel = $('#field-game');
    const warning = $('#game-empty-warning');
    const saveBtn = $('#btn-save-order');

    sel.innerHTML = '';

    if (games.length === 0) {
      sel.hidden = true;
      sel.required = false;
      if (warning) warning.hidden = false;
      if (saveBtn) saveBtn.disabled = true;
      return;
    }

    sel.hidden = false;
    sel.required = true;
    if (warning) warning.hidden = true;
    if (saveBtn) saveBtn.disabled = false;

    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = 'Pilih game';
    sel.appendChild(defaultOpt);

    games.forEach((g) => {
      const opt = document.createElement('option');
      opt.value = g.gameId;
      opt.textContent = g.name;
      sel.appendChild(opt);
    });

    if (selectedGameId) {
      sel.value = selectedGameId;
    }
  }

  function updateOrderCatalogSelect(preselectedGameId) {
    const gameId = preselectedGameId !== undefined ? preselectedGameId : ($('#field-game') ? $('#field-game').value : '');
    const sel = $('#field-order-catalog');
    const hint = $('#order-catalog-hint');
    if (!sel) return;

    sel.innerHTML = '';

    if (!gameId) {
      sel.disabled = true;
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = '-- Pilih game terlebih dahulu --';
      sel.appendChild(opt);
      if (hint) {
        hint.textContent = 'Pilih game terlebih dahulu untuk melihat item katalog.';
      }
      return;
    }

    const items = catalogItems.filter((c) => c.gameId === gameId);
    if (items.length === 0) {
      sel.disabled = true;
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = '-- Belum ada katalog untuk game ini --';
      sel.appendChild(opt);
      if (hint) {
        hint.textContent = 'Belum ada item katalog untuk game ini. Tambahkan di Pengaturan.';
      }
      return;
    }

    sel.disabled = false;
    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = '-- Ambil dari katalog (opsional) --';
    sel.appendChild(defaultOpt);

    items.forEach((item) => {
      const opt = document.createElement('option');
      opt.value = item.catalogId;
      const typeLabel = item.type === 'joki' ? 'Joki' : 'Topup';
      opt.textContent = item.name + ' (' + typeLabel + ') - Rp ' + formatPrice(item.price);
      sel.appendChild(opt);
    });

    if (hint) {
      hint.textContent = 'Pilih item untuk mengisi otomatis nama layanan dan harga.';
    }
  }

  function handleOrderCatalogSelect() {
    const sel = $('#field-order-catalog');
    if (!sel) return;
    const catalogId = sel.value;
    if (!catalogId) return;

    const item = catalogItems.find((c) => c.catalogId === catalogId);
    if (!item) return;

    $('#field-detail').value = item.name;
    $('#field-price').value = item.price;
    if (item.type) {
      $('#field-type').value = item.type;
      toggleProgressSection();
    }
    updateOrderShareSummary();
    toast('Layanan dan harga katalog diterapkan');
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

    if (games.length === 0) {
      toast('Daftar game masih kosong. Silakan tambah game di Pengaturan terlebih dahulu.');
      return;
    }

    const deadlineDateVal = ($('#field-deadline-date') ? $('#field-deadline-date').value.trim() : '');
    const deadlineTimeVal = ($('#field-deadline-time') ? $('#field-deadline-time').value.trim() : '');

    if (deadlineTimeVal && !deadlineDateVal) {
      toast('Tanggal deadline wajib diisi jika jam diisi');
      if ($('#field-deadline-date')) $('#field-deadline-date').focus();
      return;
    }

    let deadlineVal = null;
    if (deadlineDateVal) {
      deadlineVal = deadlineTimeVal ? (deadlineDateVal + 'T' + deadlineTimeVal) : deadlineDateVal;
    }

    const partnerId = $('#field-partner').value || null;
    let partnerShareType = null;
    let partnerShareValue = null;
    let partnerShareAmount = null;

    if (partnerId) {
      partnerShareType = $('#field-share-type').value || 'percent';
      const rawShareVal = $('#field-share-value').value.trim();
      const shareValNum = Number(rawShareVal);
      const totalPrice = Number($('#field-price').value) || 0;

      if (rawShareVal === '' || isNaN(shareValNum)) {
        toast('Nilai bagi hasil partner wajib diisi');
        $('#field-share-value').focus();
        return;
      }

      if (partnerShareType === 'percent') {
        if (shareValNum < 0 || shareValNum > 100) {
          toast('Persentase bagi hasil harus antara 0% sampai 100%');
          $('#field-share-value').focus();
          return;
        }
        partnerShareValue = shareValNum;
        partnerShareAmount = Math.round((shareValNum / 100) * totalPrice);
      } else if (partnerShareType === 'nominal') {
        if (shareValNum < 0) {
          toast('Nominal bagi hasil tidak boleh negatif');
          $('#field-share-value').focus();
          return;
        }
        if (shareValNum > totalPrice) {
          toast('Bagian partner (Rp ' + formatPrice(shareValNum) + ') tidak boleh melebihi total pesanan (Rp ' + formatPrice(totalPrice) + ')');
          $('#field-share-value').focus();
          return;
        }
        partnerShareValue = shareValNum;
        partnerShareAmount = Math.round(shareValNum);
      }
    }

    const data = {
      customerName: $('#field-customer').value.trim(),
      type: $('#field-type').value,
      gameId: $('#field-game').value,
      detail: $('#field-detail').value.trim(),
      deadline: deadlineVal,
      price: Number($('#field-price').value) || 0,
      paymentMethod: $('#field-payment').value,
      status: $('#field-status').value,
      partnerId: partnerId,
      partnerShareType: partnerShareType,
      partnerShareValue: partnerShareValue,
      partnerShareAmount: partnerShareAmount
    };

    if (editingId !== null) {
      const existing = orders.find((o) => o.id === editingId);
      if (existing) {
        data.partnerPaid = partnerId ? Boolean(existing.partnerPaid) : false;
        data.partnerPaidAt = partnerId ? (existing.partnerPaidAt || null) : null;
      }
    } else {
      data.partnerPaid = false;
      data.partnerPaidAt = null;
    }

    if (!data.customerName || !data.gameId) {
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
        resetOrderNotificationReminders(updated.orderId);
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
      checkNotifications();
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
      opt.textContent = o.customerName + ' - ' + getGameName(o.gameId) + ' (Rp ' + formatPrice(o.price) + ')';
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
      hint.textContent = 'Terhubung ke: ' + matched.customerName + ' - ' + getGameName(matched.gameId) + ' (Harga: Rp ' + formatPrice(matched.price) + ')';
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
      opt.textContent = o.customerName + ' - ' + getGameName(o.gameId) + ' (Rp ' + formatPrice(o.price) + ')';
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
      hint.textContent = 'Terhubung ke: ' + matched.customerName + ' - ' + getGameName(matched.gameId) + ' (Harga: Rp ' + formatPrice(matched.price) + ')';
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
    const clearBtn = $('#btn-open-clear-data');
    if (clearBtn) clearBtn.disabled = false;
    $('#btn-add-payment').disabled = false;
    $('#btn-add-game').disabled = false;
    $('#btn-add-category').disabled = false;
    $('#btn-save-shop-info').disabled = false;
    $('#btn-export-backup').disabled = false;
    $('#btn-import-backup').disabled = false;
    $('#setting-shop-name').value = shopName || 'Shugen Store';
    $('#setting-shop-contact').value = shopContact || '';
    renderPaymentList();
    renderGameList();
    renderCatalogList();
    renderCategoryList();
    renderTemplateSettings();
    renderNotificationSettings();
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

  function renderGameList() {
    const list = $('#game-list');
    if (!list) return;
    list.innerHTML = '';

    if (games.length === 0) {
      const emptyLi = document.createElement('li');
      emptyLi.className = 'payment-item-empty';
      emptyLi.style.cssText = 'padding:8px 0; font-size:13px; color:var(--text-secondary);';
      emptyLi.textContent = 'Belum ada game. Tambahkan game baru di bawah.';
      list.appendChild(emptyLi);
      return;
    }

    games.forEach((game) => {
      const li = document.createElement('li');
      li.className = 'payment-item';

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'payment-name';
      input.value = game.name;
      input.setAttribute('aria-label', 'Nama game: ' + game.name);
      input.addEventListener('change', () => renameGame(game.id, input.value));

      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'btn-delete-payment';
      del.setAttribute('aria-label', 'Hapus game ' + game.name);
      del.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
      del.addEventListener('click', () => removeGame(game.id));

      li.appendChild(input);
      li.appendChild(del);
      list.appendChild(li);
    });
  }

  async function addGame() {
    const addBtn = $('#btn-add-game');
    if (addBtn.disabled) return;

    const input = $('#game-add-input');
    const name = input.value.trim();
    if (!name) {
      toast('Nama game wajib diisi');
      input.focus();
      return;
    }

    const isDuplicate = games.some(
      (g) => g.name.trim().toLowerCase() === name.toLowerCase()
    );
    if (isDuplicate) {
      toast('Nama game tidak boleh kembar');
      input.focus();
      return;
    }

    addBtn.disabled = true;

    try {
      await ShugenDB.games.add({ name: name });
      games = await ShugenDB.games.getAll();
      input.value = '';
      renderGameList();
      renderCatalogList();
      updateOrderCatalogSelect();
      render();
      toast('Game ditambahkan');
    } catch (err) {
      console.error(err);
      if (err && err.message === 'DUPLICATE_GAME_NAME') {
        toast('Nama game tidak boleh kembar');
      } else {
        toast('Gagal menambah game');
      }
    } finally {
      addBtn.disabled = false;
    }
  }

  async function renameGame(id, newName) {
    const trimmed = String(newName || '').trim();
    if (!trimmed) {
      renderGameList();
      toast('Nama game wajib diisi');
      return;
    }

    const isDuplicate = games.some(
      (g) => g.id !== id && g.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      renderGameList();
      toast('Nama game tidak boleh kembar');
      return;
    }

    try {
      await ShugenDB.games.update(id, trimmed);
      games = await ShugenDB.games.getAll();
      renderGameList();
      renderCatalogList();
      updateOrderCatalogSelect();
      render();
      toast('Game diperbarui');
    } catch (err) {
      console.error(err);
      renderGameList();
      if (err && err.message === 'DUPLICATE_GAME_NAME') {
        toast('Nama game tidak boleh kembar');
      } else {
        toast('Gagal mengubah nama game');
      }
    }
  }

  async function removeGame(id) {
    const game = games.find((g) => g.id === id);
    if (!game) return;

    const usedCount = orders.filter((o) => o.gameId === game.gameId).length;
    if (usedCount > 0) {
      toast('Game sedang dipakai oleh pesanan dan tidak dapat dihapus');
      return;
    }

    const usedCatalogCount = catalogItems.filter((c) => c.gameId === game.gameId).length;
    if (usedCatalogCount > 0) {
      toast('Game sedang dipakai oleh katalog harga dan tidak dapat dihapus');
      return;
    }

    try {
      await ShugenDB.games.delete(id);
      games = await ShugenDB.games.getAll();
      renderGameList();
      renderCatalogList();
      updateOrderCatalogSelect();
      render();
      toast('Game dihapus');
    } catch (err) {
      console.error(err);
      if (err && err.message === 'GAME_IN_USE') {
        toast('Game sedang dipakai oleh pesanan dan tidak dapat dihapus');
      } else if (err && err.message === 'GAME_IN_USE_CATALOG') {
        toast('Game sedang dipakai oleh katalog harga dan tidak dapat dihapus');
      } else {
        toast('Gagal menghapus game');
      }
    }
  }

  // Catalog management (Katalog Harga)

  function renderCatalogList() {
    const container = $('#catalog-list');
    if (!container) return;
    container.innerHTML = '';

    if (games.length === 0) {
      const emptyBox = document.createElement('div');
      emptyBox.className = 'state-hint';
      emptyBox.style.cssText = 'padding: 8px 0; font-size: 13px; color: var(--text-secondary);';
      emptyBox.textContent = 'Daftar game masih kosong. Silakan tambah game di Kategori Game terlebih dahulu.';
      container.appendChild(emptyBox);
      return;
    }

    if (catalogItems.length === 0) {
      const emptyBox = document.createElement('div');
      emptyBox.className = 'state-hint';
      emptyBox.style.cssText = 'padding: 8px 0; font-size: 13px; color: var(--text-secondary);';
      emptyBox.textContent = 'Belum ada item katalog. Tap tombol "+ Tambah Layanan" di atas.';
      container.appendChild(emptyBox);
      return;
    }

    const gamesWithItems = games.filter((g) => catalogItems.some((c) => c.gameId === g.gameId));
    const orphanItems = catalogItems.filter((c) => !games.some((g) => g.gameId === c.gameId));

    if (gamesWithItems.length === 0 && orphanItems.length === 0) {
      const emptyBox = document.createElement('div');
      emptyBox.className = 'state-hint';
      emptyBox.style.cssText = 'padding: 8px 0; font-size: 13px; color: var(--text-secondary);';
      emptyBox.textContent = 'Belum ada item katalog. Tap tombol "+ Tambah Layanan" di atas.';
      container.appendChild(emptyBox);
      return;
    }

    gamesWithItems.forEach((game) => {
      const items = catalogItems.filter((c) => c.gameId === game.gameId);
      const groupEl = document.createElement('div');
      groupEl.className = 'catalog-group';

      const headerEl = document.createElement('div');
      headerEl.className = 'catalog-group-header';
      headerEl.innerHTML =
        '<span class="catalog-group-title">' + esc(game.name) + '</span>' +
        '<span class="catalog-group-count">' + items.length + ' item</span>';
      groupEl.appendChild(headerEl);

      const ulEl = document.createElement('ul');
      ulEl.className = 'catalog-group-items';

      items.forEach((item) => {
        const li = document.createElement('li');
        li.className = 'catalog-item-row';

        const mainDiv = document.createElement('div');
        mainDiv.className = 'catalog-item-main';

        const typeBadge = '<span class="order-type type-' + item.type + '">' +
          (item.type === 'joki' ? 'Joki' : 'Topup') + '</span>';

        mainDiv.innerHTML =
          '<div class="catalog-item-header">' +
            typeBadge +
            '<span class="catalog-item-name">' + esc(item.name) + '</span>' +
          '</div>' +
          '<div class="catalog-item-price">Rp ' + formatPrice(item.price) + '</div>';

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'catalog-item-actions';

        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'btn btn-secondary btn-small';
        editBtn.textContent = 'Ubah';
        editBtn.setAttribute('aria-label', 'Ubah layanan ' + item.name);
        editBtn.addEventListener('click', () => openCatalogDialog(item.id));

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'btn-delete-payment btn-del-catalog';
        delBtn.setAttribute('aria-label', 'Hapus layanan ' + item.name);
        delBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        delBtn.addEventListener('click', () => deleteCatalogItemAction(item.id));

        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(delBtn);

        li.appendChild(mainDiv);
        li.appendChild(actionsDiv);
        ulEl.appendChild(li);
      });

      groupEl.appendChild(ulEl);
      container.appendChild(groupEl);
    });

    if (orphanItems.length > 0) {
      const groupEl = document.createElement('div');
      groupEl.className = 'catalog-group';

      const headerEl = document.createElement('div');
      headerEl.className = 'catalog-group-header';
      headerEl.innerHTML =
        '<span class="catalog-group-title">Game Lainnya</span>' +
        '<span class="catalog-group-count">' + orphanItems.length + ' item</span>';
      groupEl.appendChild(headerEl);

      const ulEl = document.createElement('ul');
      ulEl.className = 'catalog-group-items';

      orphanItems.forEach((item) => {
        const li = document.createElement('li');
        li.className = 'catalog-item-row';

        const mainDiv = document.createElement('div');
        mainDiv.className = 'catalog-item-main';

        const typeBadge = '<span class="order-type type-' + item.type + '">' +
          (item.type === 'joki' ? 'Joki' : 'Topup') + '</span>';

        mainDiv.innerHTML =
          '<div class="catalog-item-header">' +
            typeBadge +
            '<span class="catalog-item-name">' + esc(item.name) + '</span>' +
          '</div>' +
          '<div class="catalog-item-price">Rp ' + formatPrice(item.price) + '</div>';

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'catalog-item-actions';

        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'btn btn-secondary btn-small';
        editBtn.textContent = 'Ubah';
        editBtn.setAttribute('aria-label', 'Ubah layanan ' + item.name);
        editBtn.addEventListener('click', () => openCatalogDialog(item.id));

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'btn-delete-payment btn-del-catalog';
        delBtn.setAttribute('aria-label', 'Hapus layanan ' + item.name);
        delBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        delBtn.addEventListener('click', () => deleteCatalogItemAction(item.id));

        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(delBtn);

        li.appendChild(mainDiv);
        li.appendChild(actionsDiv);
        ulEl.appendChild(li);
      });

      groupEl.appendChild(ulEl);
      container.appendChild(groupEl);
    }
  }

  function openCatalogDialog(id) {
    if (games.length === 0) {
      toast('Tambahkan kategori game terlebih dahulu di Pengaturan');
      return;
    }

    editingCatalogId = id !== undefined ? id : null;
    const dialog = $('#catalog-dialog');
    const form = $('#catalog-form');
    if (!dialog || !form) return;

    form.reset();

    const gameSelect = $('#field-catalog-game');
    gameSelect.innerHTML = '';
    const defaultGameOpt = document.createElement('option');
    defaultGameOpt.value = '';
    defaultGameOpt.textContent = 'Pilih game';
    gameSelect.appendChild(defaultGameOpt);
    games.forEach((g) => {
      const opt = document.createElement('option');
      opt.value = g.gameId;
      opt.textContent = g.name;
      gameSelect.appendChild(opt);
    });

    const titleEl = $('#catalog-dialog-title');
    const deleteBtn = $('#btn-delete-catalog');

    if (editingCatalogId !== null) {
      const item = catalogItems.find((c) => c.id === editingCatalogId);
      if (!item) return;
      if (titleEl) titleEl.textContent = 'Ubah Layanan Katalog';
      $('#field-catalog-id').value = item.id;
      gameSelect.value = item.gameId || '';
      $('#field-catalog-type').value = item.type || 'joki';
      $('#field-catalog-name').value = item.name || '';
      $('#field-catalog-price').value = item.price !== undefined ? item.price : '';
      if (deleteBtn) deleteBtn.hidden = false;
    } else {
      if (titleEl) titleEl.textContent = 'Tambah Layanan Katalog';
      $('#field-catalog-id').value = '';
      if (games.length > 0) {
        gameSelect.value = games[0].gameId;
      }
      $('#field-catalog-type').value = 'joki';
      $('#field-catalog-name').value = '';
      $('#field-catalog-price').value = '';
      if (deleteBtn) deleteBtn.hidden = true;
    }

    dialog.showModal();
  }

  function closeCatalogDialog() {
    editingCatalogId = null;
    const dialog = $('#catalog-dialog');
    if (dialog && dialog.open) {
      dialog.close();
    }
  }

  async function saveCatalogItem(e) {
    e.preventDefault();
    const saveBtn = $('#btn-save-catalog');
    if (saveBtn) saveBtn.disabled = true;

    const gameId = $('#field-catalog-game').value;
    const type = $('#field-catalog-type').value;
    const name = $('#field-catalog-name').value.trim();
    const priceVal = $('#field-catalog-price').value;
    const price = Math.max(0, Number(priceVal) || 0);

    if (!gameId) {
      toast('Game wajib dipilih');
      if (saveBtn) saveBtn.disabled = false;
      return;
    }
    if (!name) {
      toast('Nama layanan wajib diisi');
      if (saveBtn) saveBtn.disabled = false;
      return;
    }

    try {
      if (editingCatalogId !== null) {
        await ShugenDB.catalog.update(editingCatalogId, {
          gameId: gameId,
          type: type,
          name: name,
          price: price
        });
        toast('Layanan katalog diperbarui');
      } else {
        await ShugenDB.catalog.add({
          gameId: gameId,
          type: type,
          name: name,
          price: price
        });
        toast('Layanan katalog ditambahkan');
      }

      catalogItems = await ShugenDB.catalog.getAll();
      renderCatalogList();
      updateOrderCatalogSelect();
      closeCatalogDialog();
    } catch (err) {
      console.error(err);
      toast('Gagal menyimpan layanan katalog');
    } finally {
      if (saveBtn) saveBtn.disabled = false;
    }
  }

  async function deleteCatalogItemAction(id) {
    const targetId = id !== undefined ? id : editingCatalogId;
    if (targetId === null) return;
    const item = catalogItems.find((c) => c.id === targetId);
    if (!item) return;

    if (!confirm('Hapus layanan "' + item.name + '" dari katalog?')) return;

    try {
      await ShugenDB.catalog.delete(targetId);
      catalogItems = await ShugenDB.catalog.getAll();
      renderCatalogList();
      updateOrderCatalogSelect();
      closeCatalogDialog();
      toast('Layanan katalog dihapus');
    } catch (err) {
      console.error(err);
      toast('Gagal menghapus layanan katalog');
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
    const serviceGame = order ? getGameName(order.gameId) : '-';
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

  // WhatsApp Templates (Fitur 7)

  async function loadWaTemplates() {
    try {
      const tplKonfirmasi = await ShugenDB.templates.get('konfirmasi');
      const tplProgress = await ShugenDB.templates.get('progress');
      const tplSelesai = await ShugenDB.templates.get('selesai');

      waTemplates.konfirmasi = (tplKonfirmasi !== null && tplKonfirmasi !== undefined)
        ? tplKonfirmasi
        : DEFAULT_WA_TEMPLATES.konfirmasi;
      waTemplates.progress = (tplProgress !== null && tplProgress !== undefined)
        ? tplProgress
        : DEFAULT_WA_TEMPLATES.progress;
      waTemplates.selesai = (tplSelesai !== null && tplSelesai !== undefined)
        ? tplSelesai
        : DEFAULT_WA_TEMPLATES.selesai;
    } catch (err) {
      console.error(err);
    }
    renderTemplateSettings();
  }

  function renderTemplateSettings() {
    const inputKonfirmasi = $('#setting-template-konfirmasi');
    const inputProgress = $('#setting-template-progress');
    const inputSelesai = $('#setting-template-selesai');
    if (inputKonfirmasi) inputKonfirmasi.value = waTemplates.konfirmasi;
    if (inputProgress) inputProgress.value = waTemplates.progress;
    if (inputSelesai) inputSelesai.value = waTemplates.selesai;
  }

  function getTemplateLabel(type) {
    if (type === 'konfirmasi') return 'konfirmasi';
    if (type === 'progress') return 'update progress';
    if (type === 'selesai') return 'selesai';
    return type;
  }

  async function saveWaTemplate(type) {
    const textarea = $('#setting-template-' + type);
    if (!textarea) return;
    const val = textarea.value.trim();
    if (!val) {
      toast('Teks template tidak boleh kosong');
      textarea.focus();
      return;
    }
    try {
      await ShugenDB.templates.set(type, val);
      waTemplates[type] = val;
      toast('Template ' + getTemplateLabel(type) + ' disimpan');
    } catch (err) {
      console.error(err);
      toast('Gagal menyimpan template');
    }
  }

  async function resetWaTemplate(type) {
    const defaultText = DEFAULT_WA_TEMPLATES[type] || '';
    try {
      await ShugenDB.templates.set(type, defaultText);
      waTemplates[type] = defaultText;
      const textarea = $('#setting-template-' + type);
      if (textarea) textarea.value = defaultText;
      toast('Template ' + getTemplateLabel(type) + ' dikembalikan ke bawaan');
    } catch (err) {
      console.error(err);
      toast('Gagal mengembalikan template ke bawaan');
    }
  }

  function extractPhoneNumber(contactStr) {
    if (!contactStr || typeof contactStr !== 'string') return null;
    const digits = contactStr.replace(/\D/g, '');
    if (digits.length < 8) return null;
    if (digits.startsWith('0')) {
      return '62' + digits.slice(1);
    }
    if (digits.startsWith('62')) {
      return digits;
    }
    return digits;
  }

  function findCustomerForOrder(order) {
    if (!order) return null;
    if (order.customerId) {
      const byId = customers.find((c) => c.id === order.customerId || c.customerId === order.customerId);
      if (byId) return byId;
    }
    if (order.customerName) {
      return customers.find((c) => matchCustomerName(c.name, order.customerName)) || null;
    }
    return null;
  }

  function replacePlaceholders(templateText, order) {
    if (!templateText) return '';
    if (!order) return templateText;

    const customerName = order.customerName ? String(order.customerName).trim() : '';
    const orderId = order.orderId ? String(order.orderId).trim() : '';
    const rawGame = order.gameId ? getGameName(order.gameId) : '';
    const gameName = (rawGame && rawGame !== '-') ? rawGame : '';
    const priceVal = Number(order.price) || 0;
    const totalStr = priceVal > 0 ? ('Rp ' + formatPrice(priceVal)) : '';

    let progressStr = '';
    if (order.type === 'joki') {
      const prog = progressMap[order.orderId];
      const steps = prog && Array.isArray(prog.steps) ? prog.steps : [];
      if (steps.length > 0) {
        const pct = (prog && typeof prog.percentage === 'number')
          ? prog.percentage
          : ShugenDB.progress.calcPercentage(steps);
        progressStr = pct + '%';
      }
    }

    return templateText
      .replace(/\{nama_pelanggan\}/gi, customerName)
      .replace(/\{id_pesanan\}/gi, orderId)
      .replace(/\{game\}/gi, gameName)
      .replace(/\{total\}/gi, totalStr)
      .replace(/\{progress\}/gi, progressStr)
      .replace(/\{layanan\}/gi, '');
  }

  function openWaDialog(orderId) {
    const order = orders.find((o) => o.orderId === orderId);
    if (!order) {
      toast('Data pesanan tidak ditemukan');
      return;
    }

    const currentStatus = ($('#field-status') && !$('#field-status-group').hidden)
      ? $('#field-status').value
      : order.status;
    const currentPrice = ($('#field-price') && $('#field-price').value !== '')
      ? Number($('#field-price').value)
      : order.price;
    const currentCustomer = ($('#field-customer') && $('#field-customer').value.trim())
      ? $('#field-customer').value.trim()
      : order.customerName;
    const currentGameId = ($('#field-game') && $('#field-game').value)
      ? $('#field-game').value
      : order.gameId;

    const orderData = Object.assign({}, order, {
      status: currentStatus,
      price: currentPrice,
      customerName: currentCustomer,
      gameId: currentGameId
    });

    currentWaOrderId = order.orderId;
    currentWaOrderSnapshot = orderData;

    let suggested = 'konfirmasi';
    if (orderData.status === 'diproses') {
      suggested = 'progress';
    } else if (orderData.status === 'selesai') {
      suggested = 'selesai';
    } else {
      suggested = 'konfirmasi';
    }
    currentWaTemplateType = suggested;

    $('#wa-dialog-order-id').textContent = orderData.orderId;

    const customer = findCustomerForOrder(orderData);
    const recipientName = orderData.customerName || (customer ? customer.name : '-');
    const rawContact = customer && customer.contact ? customer.contact.trim() : '';
    const phone = extractPhoneNumber(rawContact);

    $('#wa-recipient-name').textContent = recipientName;
    if (phone) {
      $('#wa-recipient-phone').textContent = rawContact || ('+' + phone);
      $('#wa-no-phone-warning').hidden = true;
      $('#btn-open-wa-link').hidden = false;
    } else {
      $('#wa-recipient-phone').textContent = rawContact ? (rawContact + ' (bukan nomor HP)') : 'Tidak ada nomor HP';
      $('#wa-no-phone-warning').hidden = false;
      $('#btn-open-wa-link').hidden = true;
    }

    $('#wa-suggested-konfirmasi').hidden = (suggested !== 'konfirmasi');
    $('#wa-suggested-progress').hidden = (suggested !== 'progress');
    $('#wa-suggested-selesai').hidden = (suggested !== 'selesai');

    selectWaTemplateTab(currentWaTemplateType);
    resetWaCopyButton();
    $('#wa-dialog').showModal();
  }

  function selectWaTemplateTab(type) {
    currentWaTemplateType = type;
    $$('.wa-template-tabs .wa-tab').forEach((tab) => {
      const isSelected = tab.dataset.template === type;
      tab.classList.toggle('active', isSelected);
      tab.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    });
    updateWaPreview();
  }

  function updateWaPreview() {
    if (!currentWaOrderId) return;
    const order = currentWaOrderSnapshot || orders.find((o) => o.orderId === currentWaOrderId);
    if (!order) return;

    const rawTemplate = waTemplates[currentWaTemplateType] || DEFAULT_WA_TEMPLATES[currentWaTemplateType] || '';
    const message = replacePlaceholders(rawTemplate, order);

    $('#wa-preview-text').value = message;

    const customer = findCustomerForOrder(order);
    const phone = extractPhoneNumber(customer ? customer.contact : '');
    const linkBtn = $('#btn-open-wa-link');

    if (phone) {
      linkBtn.hidden = false;
      linkBtn.href = 'https://wa.me/' + phone + '?text=' + encodeURIComponent(message);
    } else {
      linkBtn.hidden = true;
      linkBtn.removeAttribute('href');
    }
  }

  function resetWaCopyButton() {
    clearTimeout(waCopyTimer);
    const btn = $('#btn-copy-wa-message');
    const label = $('#btn-copy-wa-label');
    if (btn) btn.classList.remove('is-copied');
    if (label) label.textContent = 'Salin pesan';
  }

  async function copyWaMessage() {
    const text = $('#wa-preview-text').value;
    if (!text) return;

    try {
      if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
        throw new Error('Clipboard tidak tersedia');
      }
      await navigator.clipboard.writeText(text);
      const btn = $('#btn-copy-wa-message');
      const label = $('#btn-copy-wa-label');
      btn.classList.add('is-copied');
      label.textContent = 'Tersalin!';
      clearTimeout(waCopyTimer);
      waCopyTimer = setTimeout(() => {
        btn.classList.remove('is-copied');
        label.textContent = 'Salin pesan';
      }, 2000);
      toast('Pesan berhasil disalin');
    } catch (err) {
      console.error(err);
      try {
        const textarea = $('#wa-preview-text');
        textarea.select();
        document.execCommand('copy');
        toast('Pesan berhasil disalin');
      } catch (fallbackErr) {
        toast('Gagal menyalin pesan');
      }
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
        const serviceLabel = serviceType + ' · ' + getGameName(order.gameId);
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

  // Partner actions

  function openPartnerDetail(partnerId) {
    activePartnerId = partnerId;
    const part = getPartner(partnerId);
    if (!part) return;

    $('#partner-detail-id').textContent = part.partnerId || '';
    $('#partner-detail-name').textContent = part.name;
    $('#partner-detail-phone').textContent = part.phone || '-';
    $('#partner-detail-note').textContent = part.note || '-';

    const isInactive = part.isActive === false;
    $('#partner-detail-inactive-badge').hidden = !isInactive;

    const toggleActiveBtn = $('#btn-partner-detail-toggle-active');
    toggleActiveBtn.textContent = isInactive ? 'Aktifkan' : 'Nonaktifkan';
    toggleActiveBtn.setAttribute(
      'aria-label',
      isInactive ? ('Aktifkan partner ' + part.name) : ('Nonaktifkan partner ' + part.name)
    );
    toggleActiveBtn.disabled = false;
    $('#btn-partner-detail-edit').disabled = false;

    let shareDefaultLabel = '-';
    if (part.defaultShareType === 'percent') {
      shareDefaultLabel = part.defaultShareValue + '%';
    } else if (part.defaultShareType === 'nominal') {
      shareDefaultLabel = 'Rp ' + formatPrice(part.defaultShareValue);
    }
    $('#partner-detail-share').textContent = shareDefaultLabel;

    const hasBank = Boolean(part.bankName && part.bankName.trim());
    const hasAccountNum = Boolean(part.accountNumber && part.accountNumber.trim());
    const hasHolder = Boolean(part.accountHolder && part.accountHolder.trim());
    const hasAnyAccountInfo = hasBank || hasAccountNum || hasHolder;

    const detailAccountBox = $('#partner-detail-account-box');
    if (detailAccountBox) {
      if (hasAnyAccountInfo) {
        detailAccountBox.hidden = false;
        const bankEl = $('#partner-detail-bank');
        if (bankEl) {
          bankEl.textContent = part.bankName ? part.bankName.trim() : '';
          bankEl.hidden = !hasBank;
        }

        const numEl = $('#partner-detail-account-num');
        const copyBtn = $('#btn-copy-partner-detail-account');
        if (numEl) {
          numEl.textContent = part.accountNumber ? part.accountNumber.trim() : '';
          numEl.hidden = !hasAccountNum;
        }
        if (copyBtn) {
          copyBtn.hidden = !hasAccountNum;
          copyBtn.dataset.accountNumber = hasAccountNum ? part.accountNumber.trim() : '';
          copyBtn.classList.remove('is-copied');
          const textSpan = copyBtn.querySelector('span');
          if (textSpan) textSpan.textContent = 'Salin Nomor Rekening';
        }

        const holderRow = $('#partner-detail-holder-row');
        const holderEl = $('#partner-detail-holder');
        if (holderEl) holderEl.textContent = part.accountHolder ? part.accountHolder.trim() : '';
        if (holderRow) holderRow.hidden = !hasHolder;
      } else {
        detailAccountBox.hidden = true;
      }
    }

    // Filter orders
    const matchedOrders = orders.filter((o) => o.partnerId === partnerId && o.status !== 'dibatalkan');
    const orderCount = matchedOrders.length;

    const readyOrders = matchedOrders.filter((o) => o.status === 'selesai' && !o.partnerPaid);
    const readyUnpaidAmount = readyOrders.reduce((sum, o) => sum + (Number(o.partnerShareAmount) || 0), 0);

    const paidOrders = matchedOrders.filter((o) => o.partnerPaid);
    const paidAmount = paidOrders.reduce((sum, o) => sum + (Number(o.partnerShareAmount) || 0), 0);

    $('#partner-detail-order-count').textContent = String(orderCount);
    $('#partner-detail-ready-unpaid').textContent = 'Rp ' + formatPrice(readyUnpaidAmount);
    $('#partner-detail-total-paid').textContent = 'Rp ' + formatPrice(paidAmount);

    const batchBtn = $('#btn-partner-mark-all-paid');
    if (readyOrders.length === 0) {
      batchBtn.disabled = true;
      batchBtn.textContent = 'Tidak ada pesanan siap bayar';
    } else {
      batchBtn.disabled = false;
      batchBtn.textContent = 'Tandai Semua Siap Bayar (' + readyOrders.length + ' pesanan · Rp ' + formatPrice(readyUnpaidAmount) + ')';
    }

    renderPartnerOrdersTabs();
    renderPartnerOrdersList(part);

    $('#partner-detail-dialog').showModal();
  }

  function renderPartnerOrdersTabs() {
    $$('.partner-orders-tabs .tab').forEach((tab) => {
      const isSelected = tab.dataset.partnerOrderFilter === partnerOrderFilter;
      tab.classList.toggle('active', isSelected);
      tab.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    });
  }

  function renderPartnerOrdersList(part) {
    let matchedOrders = orders.filter((o) => o.partnerId === part.partnerId);
    if (partnerOrderFilter === 'belum_dibayar') {
      matchedOrders = matchedOrders.filter((o) => !o.partnerPaid);
    } else if (partnerOrderFilter === 'sudah_dibayar') {
      matchedOrders = matchedOrders.filter((o) => o.partnerPaid);
    }

    const sortedOrders = matchedOrders.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const container = $('#partner-orders-list');
    container.innerHTML = '';

    if (sortedOrders.length === 0) {
      $('#partner-orders-empty').hidden = false;
      container.hidden = true;
    } else {
      $('#partner-orders-empty').hidden = true;
      container.hidden = false;

      sortedOrders.forEach((order) => {
        const item = document.createElement('article');
        item.className = 'customer-order-item';
        item.tabIndex = 0;
        item.dataset.orderId = order.id;
        item.setAttribute('role', 'button');

        const serviceType = order.type === 'joki' ? 'Joki' : 'Topup';
        const serviceLabel = serviceType + ' · ' + getGameName(order.gameId) + ' (' + order.customerName + ')';
        const statusLabel = STATUS_LABELS[order.status] || order.status;
        const priceLabel = 'Total: Rp ' + formatPrice(order.price);
        const shareAmountLabel = 'Bagian: Rp ' + formatPrice(order.partnerShareAmount || 0);

        const isPaid = Boolean(order.partnerPaid);
        const payoutText = isPaid
          ? ('Sudah dibayar' + (order.partnerPaidAt ? ' (' + formatYmd(order.partnerPaidAt.slice(0, 10)) + ')' : ''))
          : 'Belum dibayar';

        item.setAttribute(
          'aria-label',
          order.orderId + ', ' + serviceLabel + ', ' + statusLabel + ', ' + shareAmountLabel + ', ' + payoutText + '. Tap untuk buka pesanan.'
        );

        item.innerHTML =
          '<div class="customer-order-item-header">' +
            '<span class="order-id">' + esc(order.orderId) + '</span>' +
            '<span class="status-badge status-' + order.status + '">' + esc(statusLabel) + '</span>' +
          '</div>' +
          '<div class="customer-order-item-body">' +
            '<span class="customer-order-item-service">' + esc(serviceLabel) + '</span>' +
            '<strong class="customer-order-item-price">' + esc(shareAmountLabel) + '</strong>' +
          '</div>' +
          '<div class="partner-order-item-desc">' +
            '<span>' + esc(priceLabel) + '</span>' +
            '<span>' + esc(payoutText) + '</span>' +
          '</div>';

        item.addEventListener('click', () => {
          $('#partner-detail-dialog').close();
          openOrderForm(order.id);
        });

        item.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            $('#partner-detail-dialog').close();
            openOrderForm(order.id);
          }
        });

        container.appendChild(item);
      });
    }
  }

  function openPartnerForm(partnerId) {
    editingPartnerId = partnerId;
    const dialog = $('#partner-dialog');
    const form = $('#partner-form');
    form.reset();
    $('#btn-save-partner').disabled = false;
    $('#btn-delete-partner').disabled = false;

    if (partnerId !== null) {
      const part = getPartner(partnerId);
      if (!part) return;
      $('#partner-form-title').textContent = 'Edit Partner';
      $('#partner-id-val').textContent = part.partnerId || '';
      $('#partner-id-row').hidden = false;
      $('#partner-field-name').value = part.name;
      $('#partner-field-phone').value = part.phone || '';
      $('#partner-field-bank-name').value = part.bankName || '';
      $('#partner-field-account-number').value = part.accountNumber || '';
      $('#partner-field-account-holder').value = part.accountHolder || '';
      $('#partner-field-share-type').value = part.defaultShareType || '';
      $('#partner-field-share-val').value = part.defaultShareValue != null ? part.defaultShareValue : '';
      $('#partner-field-status').value = part.isActive === false ? 'nonaktif' : 'aktif';
      $('#partner-field-note').value = part.note || '';

      const hasOrders = orders.some((o) => o.partnerId === part.partnerId);
      $('#btn-delete-partner').hidden = hasOrders;
    } else {
      $('#partner-form-title').textContent = 'Tambah Partner';
      $('#partner-id-val').textContent = '';
      $('#partner-id-row').hidden = true;
      $('#partner-field-name').value = '';
      $('#partner-field-phone').value = '';
      $('#partner-field-bank-name').value = '';
      $('#partner-field-account-number').value = '';
      $('#partner-field-account-holder').value = '';
      $('#partner-field-share-type').value = '';
      $('#partner-field-share-val').value = '';
      $('#partner-field-status').value = 'aktif';
      $('#partner-field-note').value = '';
      $('#btn-delete-partner').hidden = true;
    }

    updatePartnerFormShareInputs();
    dialog.showModal();
    $('#partner-field-name').focus();
  }

  function updatePartnerFormShareInputs() {
    const type = $('#partner-field-share-type').value;
    const group = $('#partner-field-share-val-group');
    const label = $('#partner-field-share-val-label');
    const prefix = $('#partner-share-val-prefix');
    const input = $('#partner-field-share-val');

    if (!type) {
      group.hidden = true;
      input.value = '';
      return;
    }

    group.hidden = false;
    if (type === 'percent') {
      label.textContent = 'Nilai Persen (%)';
      prefix.hidden = true;
      input.setAttribute('max', '100');
      input.setAttribute('placeholder', 'Contoh: 70');
    } else {
      label.textContent = 'Nominal Tetap (Rp)';
      prefix.hidden = false;
      input.removeAttribute('max');
      input.setAttribute('placeholder', 'Contoh: 15000');
    }
  }

  async function savePartner() {
    const saveBtn = $('#btn-save-partner');
    if (saveBtn.disabled) return;

    const nameVal = $('#partner-field-name').value.trim();
    const phoneVal = $('#partner-field-phone').value.trim();
    const bankNameVal = $('#partner-field-bank-name').value.trim();
    const accountNumberVal = $('#partner-field-account-number').value.trim();
    const accountHolderVal = $('#partner-field-account-holder').value.trim();
    const shareTypeVal = $('#partner-field-share-type').value || null;
    const rawShareVal = $('#partner-field-share-val').value.trim();
    const isActiveVal = $('#partner-field-status').value === 'aktif';
    const noteVal = $('#partner-field-note').value.trim();

    if (!nameVal) {
      toast('Nama partner wajib diisi');
      $('#partner-field-name').focus();
      return;
    }

    const isDup = partners.some(
      (p) => p.partnerId !== editingPartnerId && p.name.trim().toLowerCase() === nameVal.toLowerCase()
    );
    if (isDup) {
      toast('Nama partner sudah digunakan');
      $('#partner-field-name').focus();
      return;
    }

    let shareVal = null;
    if (shareTypeVal) {
      const num = Number(rawShareVal);
      if (rawShareVal === '' || isNaN(num)) {
        toast('Nilai bagi hasil bawaan wajib diisi');
        $('#partner-field-share-val').focus();
        return;
      }
      if (shareTypeVal === 'percent') {
        if (num < 0 || num > 100) {
          toast('Persentase bagi hasil harus antara 0% sampai 100%');
          $('#partner-field-share-val').focus();
          return;
        }
        shareVal = num;
      } else if (shareTypeVal === 'nominal') {
        if (num < 0) {
          toast('Nominal bagi hasil tidak boleh negatif');
          $('#partner-field-share-val').focus();
          return;
        }
        shareVal = num;
      }
    }

    saveBtn.disabled = true;

    try {
      if (editingPartnerId !== null) {
        await ShugenDB.partners.update(editingPartnerId, {
          name: nameVal,
          phone: phoneVal,
          bankName: bankNameVal,
          accountNumber: accountNumberVal,
          accountHolder: accountHolderVal,
          defaultShareType: shareTypeVal,
          defaultShareValue: shareVal,
          isActive: isActiveVal,
          note: noteVal
        });
        partners = await ShugenDB.partners.getAll();
        render();
        $('#partner-dialog').close();
        if (activePartnerId === editingPartnerId) {
          openPartnerDetail(editingPartnerId);
        }
        toast('Data partner diperbarui');
      } else {
        await ShugenDB.partners.add({
          name: nameVal,
          phone: phoneVal,
          bankName: bankNameVal,
          accountNumber: accountNumberVal,
          accountHolder: accountHolderVal,
          defaultShareType: shareTypeVal,
          defaultShareValue: shareVal,
          isActive: isActiveVal,
          note: noteVal
        });
        partners = await ShugenDB.partners.getAll();
        render();
        $('#partner-dialog').close();
        toast('Partner ditambahkan');
      }
    } catch (err) {
      console.error(err);
      if (err && err.message === 'DUPLICATE_PARTNER_NAME') {
        toast('Nama partner sudah digunakan');
        $('#partner-field-name').focus();
      } else {
        toast('Gagal menyimpan partner');
      }
    } finally {
      saveBtn.disabled = false;
    }
  }

  async function handleDeletePartner() {
    const deleteBtn = $('#btn-delete-partner');
    if (deleteBtn.disabled) return;
    if (editingPartnerId === null) return;

    const hasOrders = orders.some((o) => o.partnerId === editingPartnerId);
    if (hasOrders) {
      toast('Partner yang sudah memiliki pesanan tidak dapat dihapus');
      return;
    }

    const part = getPartner(editingPartnerId);
    if (!confirm('Hapus partner "' + (part ? part.name : '') + '"? Data yang dihapus tidak dapat dikembalikan.')) return;

    deleteBtn.disabled = true;

    try {
      await ShugenDB.partners.delete(editingPartnerId);
      partners = await ShugenDB.partners.getAll();
      render();
      $('#partner-dialog').close();
      if (activePartnerId === editingPartnerId) {
        $('#partner-detail-dialog').close();
        activePartnerId = null;
      }
      toast('Partner dihapus');
    } catch (err) {
      console.error(err);
      if (err && err.message === 'PARTNER_IN_USE') {
        toast('Partner yang sudah memiliki pesanan tidak dapat dihapus');
      } else {
        toast('Gagal menghapus partner');
      }
    } finally {
      deleteBtn.disabled = false;
    }
  }

  async function togglePartnerActive(partnerId, btnElement) {
    if (btnElement && btnElement.disabled) return;
    const part = getPartner(partnerId);
    if (!part) return;

    if (btnElement) btnElement.disabled = true;

    const nextStatus = part.isActive === false;
    try {
      await ShugenDB.partners.update(partnerId, { isActive: nextStatus });
      partners = await ShugenDB.partners.getAll();
      render();
      if (activePartnerId === partnerId) {
        openPartnerDetail(partnerId);
      }
      toast(nextStatus ? 'Partner diaktifkan' : 'Partner dinonaktifkan');
    } catch (err) {
      console.error(err);
      toast('Gagal mengubah status partner');
    } finally {
      if (btnElement) btnElement.disabled = false;
    }
  }

  async function batchMarkPartnerOrdersPaid(partnerId) {
    const part = getPartner(partnerId);
    if (!part) return;

    const readyOrders = orders.filter((o) => o.partnerId === partnerId && o.status === 'selesai' && !o.partnerPaid);
    if (readyOrders.length === 0) {
      toast('Tidak ada pesanan siap bayar');
      return;
    }

    const totalNominal = readyOrders.reduce((sum, o) => sum + (Number(o.partnerShareAmount) || 0), 0);
    const confirmed = confirm(
      'Tandai ' + readyOrders.length + ' pesanan Selesai dengan total bagian Rp ' + formatPrice(totalNominal) + ' sebagai sudah dibayar?'
    );
    if (!confirmed) return;

    const btn = $('#btn-partner-mark-all-paid');
    btn.disabled = true;

    try {
      const nowIso = new Date().toISOString();
      for (const ord of readyOrders) {
        await ShugenDB.orders.update(ord.id, {
          partnerPaid: true,
          partnerPaidAt: nowIso
        });
      }
      orders = await ShugenDB.orders.getAll();
      render();
      openPartnerDetail(partnerId);
      toast(readyOrders.length + ' pesanan berhasil ditandai sudah dibayar');
    } catch (err) {
      console.error(err);
      toast('Gagal menandai pesanan sebagai sudah dibayar');
    } finally {
      btn.disabled = false;
    }
  }

  async function toggleOrderPartnerPaid() {
    if (editingId === null) return;
    const order = orders.find((o) => o.id === editingId);
    if (!order || !order.partnerId) return;

    const isPaid = Boolean(order.partnerPaid);
    if (isPaid) {
      try {
        await ShugenDB.orders.update(editingId, {
          partnerPaid: false,
          partnerPaidAt: null
        });
        orders = await ShugenDB.orders.getAll();
        const updated = orders.find((o) => o.id === editingId);
        updateOrderPartnerPayoutUI(updated);
        render();
        toast('Status bayar partner diubah menjadi Belum Dibayar');
      } catch (err) {
        console.error(err);
        toast('Gagal mengubah status bayar');
      }
    } else {
      const currentStatus = ($('#field-status') && !$('#field-status-group').hidden)
        ? $('#field-status').value
        : order.status;
      if (currentStatus !== 'selesai') {
        toast('Bagian partner hanya bisa ditandai sudah dibayar jika status pesanan Selesai');
        return;
      }
      try {
        await ShugenDB.orders.update(editingId, {
          partnerPaid: true,
          partnerPaidAt: new Date().toISOString()
        });
        orders = await ShugenDB.orders.getAll();
        const updated = orders.find((o) => o.id === editingId);
        updateOrderPartnerPayoutUI(updated);
        render();
        toast('Status bayar partner diubah menjadi Sudah Dibayar');
      } catch (err) {
        console.error(err);
        toast('Gagal mengubah status bayar');
      }
    }
  }

  // App data reload

  async function reloadAllAppData() {
    orders = await ShugenDB.orders.getAll();
    games = await ShugenDB.games.getAll();
    incomes = await ShugenDB.incomes.getAll();
    expenses = await ShugenDB.expenses.getAll();
    invoices = await ShugenDB.invoices.getAll();
    customers = await ShugenDB.customers.getAll();
    partners = await ShugenDB.partners.getAll();
    catalogItems = await ShugenDB.catalog.getAll();
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
    await loadWaTemplates();
    await loadTheme();
    render();
    renderPaymentList();
    renderGameList();
    renderCatalogList();
    updateOrderCatalogSelect();
    renderCategoryList();
    renderTemplateSettings();
    renderNotificationSettings();
    checkNotifications();
    showView('ready');
  }

  // Backup & Restore actions

  function formatBackupTimestamp(date) {
    const d = date || new Date();
    const yyyy = String(d.getFullYear());
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return yyyy + mm + dd + '-' + hh + min;
  }

  function formatBackupFileSize(bytes) {
    const kb = bytes / 1024;
    if (kb > 1024) {
      const mb = kb / 1024;
      const formatted = (Math.round(mb * 10) / 10).toLocaleString('id-ID');
      return formatted + ' MB';
    }
    const formatted = (Math.round(kb * 10) / 10).toLocaleString('id-ID');
    return formatted + ' KB';
  }

  function formatBackupDateTime(isoStr) {
    if (!isoStr) return '-';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return String(isoStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  }

  async function exportBackup(customOptions) {
    const isOptsObj = customOptions && typeof customOptions === 'object' && !(customOptions instanceof Event);
    const opts = isOptsObj ? customOptions : {};
    const isAutoBackup = !!opts.isAutoBackup;
    const filenamePrefix = (typeof opts.prefix === 'string' && opts.prefix) ? opts.prefix : 'shugen-backup-';
    const showToast = opts.showToast !== false;
    const throwOnError = opts.throwOnError === true;

    const exportBtn = $('#btn-export-backup');
    const importBtn = $('#btn-import-backup');

    if (!isAutoBackup) {
      if (exportBtn && exportBtn.disabled) return;
      if (exportBtn) exportBtn.disabled = true;
      if (importBtn) importBtn.disabled = true;
    }

    try {
      const data = await ShugenDB.backup.exportData();
      const filename = filenamePrefix + formatBackupTimestamp(new Date()) + '.json';
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (a.parentNode) a.parentNode.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      const sizeStr = formatBackupFileSize(blob.size);
      if (showToast) {
        toast('Backup data berhasil diunduh (' + sizeStr + ')');
      }
      return { success: true, sizeStr };
    } catch (err) {
      console.error(err);
      if (throwOnError) {
        throw err;
      }
      toast('Gagal mengekspor backup: ' + (err.message || 'terjadi kesalahan'));
      return { success: false, error: err };
    } finally {
      if (!isAutoBackup) {
        if (exportBtn) exportBtn.disabled = false;
        if (importBtn) importBtn.disabled = false;
      }
    }
  }

  function triggerImportBackup() {
    const importBtn = $('#btn-import-backup');
    if (importBtn.disabled) return;
    const fileInput = $('#backup-file-input');
    fileInput.value = '';
    fileInput.click();
  }

  function formatCountComparison(currentCount, backupCount) {
    const cur = Number(currentCount) || 0;
    const target = Number(backupCount) || 0;
    const base = formatPrice(cur) + ' -> ' + formatPrice(target);
    if (cur === target) {
      return base;
    }
    const diff = target - cur;
    const diffStr = diff > 0 ? '(+' + formatPrice(diff) + ')' : '(' + formatPrice(diff) + ')';
    return base + ' ' + diffStr;
  }

  function formatCashComparison(currentBalance, targetBalance) {
    const cur = Number(currentBalance) || 0;
    const target = Number(targetBalance) || 0;
    const base = 'Rp ' + formatPrice(cur) + ' -> Rp ' + formatPrice(target);
    if (cur === target) {
      return base;
    }
    const diff = target - cur;
    const diffStr = diff > 0 ? '(+' + formatPrice(diff) + ')' : '(-' + formatPrice(Math.abs(diff)) + ')';
    return base + ' ' + diffStr;
  }

  async function openImportPreview(backupData) {
    pendingImportData = backupData;
    const stores = (backupData && backupData.stores) || {};

    const [
      curOrders,
      curCustomers,
      curPartners,
      curIncomes,
      curExpenses,
      curInvoices,
      curGames,
      curProgress,
      curCategories,
      curPayments,
      curCatalog
    ] = await Promise.all([
      ShugenDB.orders.getAll().catch(() => []),
      ShugenDB.customers.getAll().catch(() => []),
      ShugenDB.partners.getAll().catch(() => []),
      ShugenDB.incomes.getAll().catch(() => []),
      ShugenDB.expenses.getAll().catch(() => []),
      ShugenDB.invoices.getAll().catch(() => []),
      ShugenDB.games.getAll().catch(() => []),
      ShugenDB.progress.getAll().catch(() => []),
      ShugenDB.categories.getAll().catch(() => []),
      ShugenDB.payment.getAll().catch(() => []),
      ShugenDB.catalog.getAll().catch(() => [])
    ]);

    const curOrderCount = Array.isArray(curOrders) ? curOrders.length : 0;
    const curCustCount = Array.isArray(curCustomers) ? curCustomers.length : 0;
    const curPartnerCount = Array.isArray(curPartners) ? curPartners.length : 0;
    const curIncCount = Array.isArray(curIncomes) ? curIncomes.length : 0;
    const curExpCount = Array.isArray(curExpenses) ? curExpenses.length : 0;
    const curInvCount = Array.isArray(curInvoices) ? curInvoices.length : 0;
    const curGameCount = Array.isArray(curGames) ? curGames.length : 0;
    const curCatalogCount = Array.isArray(curCatalog) ? curCatalog.length : 0;
    const curProgCount = Array.isArray(curProgress) ? curProgress.length : 0;
    const curCatCount = Array.isArray(curCategories) ? curCategories.length : 0;
    const curPayCount = Array.isArray(curPayments) ? curPayments.length : 0;

    $('#import-preview-date').textContent = formatBackupDateTime(backupData.exportedAt);

    const orderCount = Array.isArray(stores.orders) ? stores.orders.length : 0;
    const custCount = Array.isArray(stores.customers) ? stores.customers.length : 0;
    const partnerCount = Array.isArray(stores.partners) ? stores.partners.length : 0;
    const incCount = Array.isArray(stores.incomes) ? stores.incomes.length : 0;
    const expCount = Array.isArray(stores.expenses) ? stores.expenses.length : 0;
    const invCount = Array.isArray(stores.invoices) ? stores.invoices.length : 0;
    const gameCount = Array.isArray(stores.games) ? stores.games.length : 0;
    const catalogCount = Array.isArray(stores.catalog) ? stores.catalog.length : 0;
    const progCount = Array.isArray(stores.progress) ? stores.progress.length : 0;
    const catCount = Array.isArray(stores.expenseCategories) ? stores.expenseCategories.length : 0;
    const payCount = Array.isArray(stores.paymentMethods) ? stores.paymentMethods.length : 0;

    let cashBal = 0;
    if (Array.isArray(stores.cashSettings)) {
      const initialItem = stores.cashSettings.find((s) => s && s.key === 'initialBalance');
      if (initialItem && initialItem.value !== undefined && initialItem.value !== null) {
        cashBal = Number(initialItem.value) || 0;
      }
    }

    let shopNameVal = 'Shugen Store';
    if (Array.isArray(stores.settings)) {
      const shopItem = stores.settings.find((s) => s && s.key === 'shopName');
      if (shopItem && shopItem.value) {
        shopNameVal = String(shopItem.value);
      }
    }

    $('#import-preview-orders').textContent = formatCountComparison(curOrderCount, orderCount);
    $('#import-preview-customers').textContent = formatCountComparison(curCustCount, custCount);
    $('#import-preview-partners').textContent = formatCountComparison(curPartnerCount, partnerCount);
    $('#import-preview-incomes').textContent = formatCountComparison(curIncCount, incCount);
    $('#import-preview-expenses').textContent = formatCountComparison(curExpCount, expCount);
    $('#import-preview-invoices').textContent = formatCountComparison(curInvCount, invCount);
    $('#import-preview-games').textContent = formatCountComparison(curGameCount, gameCount);
    const catalogPreviewEl = $('#import-preview-catalog');
    if (catalogPreviewEl) {
      catalogPreviewEl.textContent = formatCountComparison(curCatalogCount, catalogCount);
    }
    $('#import-preview-progress').textContent = formatCountComparison(curProgCount, progCount);
    $('#import-preview-categories').textContent = formatCountComparison(curCatCount, catCount);
    $('#import-preview-payments').textContent = formatCountComparison(curPayCount, payCount);
    $('#import-preview-cash-balance').textContent = 'Rp ' + formatPrice(cashBal);
    $('#import-preview-shop-name').textContent = shopNameVal;

    const autoBackupCheckbox = $('#import-auto-backup-checkbox');
    if (autoBackupCheckbox) autoBackupCheckbox.checked = true;

    const confirmBtn = $('#btn-confirm-import-preview');
    if (confirmBtn) confirmBtn.disabled = false;
    const cancelBtn = $('#btn-cancel-import-preview');
    if (cancelBtn) cancelBtn.disabled = false;

    $('#import-confirm-dialog').showModal();
  }

  function closeImportPreview() {
    pendingImportData = null;
    const fileInput = $('#backup-file-input');
    if (fileInput) fileInput.value = '';
    const exportBtn = $('#btn-export-backup');
    const importBtn = $('#btn-import-backup');
    if (exportBtn) exportBtn.disabled = false;
    if (importBtn) importBtn.disabled = false;
    const confirmBtn = $('#btn-confirm-import-preview');
    if (confirmBtn) confirmBtn.disabled = false;
    const cancelBtn = $('#btn-cancel-import-preview');
    if (cancelBtn) cancelBtn.disabled = false;
    const autoBackupCheckbox = $('#import-auto-backup-checkbox');
    if (autoBackupCheckbox) autoBackupCheckbox.checked = true;
    const dialog = $('#import-confirm-dialog');
    if (dialog && dialog.open) {
      dialog.close();
    }
  }

  async function confirmImportBackup() {
    if (!pendingImportData) return;
    const confirmBtn = $('#btn-confirm-import-preview');
    const cancelBtn = $('#btn-cancel-import-preview');
    if (confirmBtn.disabled) return;

    confirmBtn.disabled = true;
    cancelBtn.disabled = true;

    const autoBackupCheckbox = $('#import-auto-backup-checkbox');
    const shouldAutoBackup = autoBackupCheckbox ? autoBackupCheckbox.checked : false;

    if (shouldAutoBackup) {
      try {
        await exportBackup({
          prefix: 'shugen-backup-sebelum-import-',
          isAutoBackup: true,
          throwOnError: true,
          showToast: false
        });
      } catch (backupErr) {
        console.error(backupErr);
        toast('Gagal mengunduh backup otomatis: ' + (backupErr.message || 'pengunduhan gagal') + '. Import dibatalkan.');
        confirmBtn.disabled = false;
        cancelBtn.disabled = false;
        return;
      }
    }

    try {
      await ShugenDB.backup.importData(pendingImportData);
      await reloadAllAppData();
      closeImportPreview();
      toast('Data backup berhasil dipulihkan');
    } catch (err) {
      console.error(err);
      toast('Gagal mengimpor backup: ' + (err.message || 'terjadi kesalahan'));
      confirmBtn.disabled = false;
      cancelBtn.disabled = false;
    }
  }

  async function handleBackupFileSelected(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const exportBtn = $('#btn-export-backup');
    const importBtn = $('#btn-import-backup');
    if (importBtn.disabled) return;

    exportBtn.disabled = true;
    importBtn.disabled = true;

    try {
      const fileText = await file.text();
      let parsed;
      try {
        parsed = JSON.parse(fileText);
      } catch (jsonErr) {
        toast('File backup tidak valid: format JSON rusak.');
        exportBtn.disabled = false;
        importBtn.disabled = false;
        e.target.value = '';
        return;
      }

      const validation = ShugenDB.backup.validate(parsed);
      if (!validation.valid) {
        toast(validation.error);
        exportBtn.disabled = false;
        importBtn.disabled = false;
        e.target.value = '';
        return;
      }

      await openImportPreview(parsed);
    } catch (err) {
      console.error(err);
      toast('Gagal membaca file backup: ' + (err.message || 'terjadi kesalahan'));
      exportBtn.disabled = false;
      importBtn.disabled = false;
      e.target.value = '';
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
      await reloadAllAppData();
      toast('Data demo dimuat');
    } catch (err) {
      console.error(err);
      toast('Gagal memuat data demo');
    } finally {
      demoBtn.disabled = false;
    }
  }

  // Clear all data actions (Fitur 16)

  async function openClearConfirmDialog() {
    const openBtn = $('#btn-open-clear-data');
    if (openBtn && openBtn.disabled) return;

    const [
      curOrders,
      curCustomers,
      curPartners,
      curIncomes,
      curExpenses,
      curInvoices,
      curGames,
      curProgress,
      curCategories,
      curPayments,
      curCatalog,
      curCash,
      allSettings
    ] = await Promise.all([
      ShugenDB.orders.getAll().catch(() => []),
      ShugenDB.customers.getAll().catch(() => []),
      ShugenDB.partners.getAll().catch(() => []),
      ShugenDB.incomes.getAll().catch(() => []),
      ShugenDB.expenses.getAll().catch(() => []),
      ShugenDB.invoices.getAll().catch(() => []),
      ShugenDB.games.getAll().catch(() => []),
      ShugenDB.progress.getAll().catch(() => []),
      ShugenDB.categories.getAll().catch(() => []),
      ShugenDB.payment.getAll().catch(() => []),
      ShugenDB.catalog.getAll().catch(() => []),
      ShugenDB.cash.get('initialBalance').catch(() => 0),
      ShugenDB.settings.getAll().catch(() => [])
    ]);

    const curOrderCount = Array.isArray(curOrders) ? curOrders.length : 0;
    const curCustCount = Array.isArray(curCustomers) ? curCustomers.length : 0;
    const curPartnerCount = Array.isArray(curPartners) ? curPartners.length : 0;
    const curIncCount = Array.isArray(curIncomes) ? curIncomes.length : 0;
    const curExpCount = Array.isArray(curExpenses) ? curExpenses.length : 0;
    const curInvCount = Array.isArray(curInvoices) ? curInvoices.length : 0;
    const curGameCount = Array.isArray(curGames) ? curGames.length : 0;
    const curCatalogCount = Array.isArray(curCatalog) ? curCatalog.length : 0;
    const curProgCount = Array.isArray(curProgress) ? curProgress.length : 0;
    const curCatCount = Array.isArray(curCategories) ? curCategories.length : 0;
    const curPayCount = Array.isArray(curPayments) ? curPayments.length : 0;
    const curTplCount = Array.isArray(allSettings)
      ? allSettings.filter((s) => s && s.key && String(s.key).startsWith('wa_template_')).length
      : 0;
    const curCashBal = Number(curCash) || 0;

    $('#clear-preview-orders').textContent = formatCountComparison(curOrderCount, 0);
    $('#clear-preview-customers').textContent = formatCountComparison(curCustCount, 0);
    $('#clear-preview-partners').textContent = formatCountComparison(curPartnerCount, 0);
    $('#clear-preview-incomes').textContent = formatCountComparison(curIncCount, 0);
    $('#clear-preview-expenses').textContent = formatCountComparison(curExpCount, 0);
    $('#clear-preview-invoices').textContent = formatCountComparison(curInvCount, 0);
    $('#clear-preview-games').textContent = formatCountComparison(curGameCount, 0);
    $('#clear-preview-catalog').textContent = formatCountComparison(curCatalogCount, 0);
    $('#clear-preview-progress').textContent = formatCountComparison(curProgCount, 0);
    $('#clear-preview-categories').textContent = formatCountComparison(curCatCount, 0);
    $('#clear-preview-payments').textContent = formatCountComparison(curPayCount, 0);
    $('#clear-preview-templates').textContent = formatCountComparison(curTplCount, 0);
    $('#clear-preview-cash-balance').textContent = formatCashComparison(curCashBal, 0);

    const confirmInput = $('#clear-data-confirm-input');
    const confirmBtn = $('#btn-confirm-clear-data');
    const cancelBtn = $('#btn-cancel-clear-confirm');
    const closeBtn = $('#btn-close-clear-confirm');

    if (confirmInput) {
      confirmInput.value = '';
      confirmInput.disabled = false;
    }
    if (confirmBtn) confirmBtn.disabled = true;
    if (cancelBtn) cancelBtn.disabled = false;
    if (closeBtn) closeBtn.disabled = false;

    $('#clear-confirm-dialog').showModal();
    setTimeout(() => {
      if (confirmInput) confirmInput.focus();
    }, 50);
  }

  function closeClearConfirmDialog() {
    const dialog = $('#clear-confirm-dialog');
    const confirmInput = $('#clear-data-confirm-input');
    const confirmBtn = $('#btn-confirm-clear-data');
    const cancelBtn = $('#btn-cancel-clear-confirm');
    const closeBtn = $('#btn-close-clear-confirm');

    if (confirmInput) {
      confirmInput.value = '';
      confirmInput.disabled = false;
    }
    if (confirmBtn) confirmBtn.disabled = true;
    if (cancelBtn) cancelBtn.disabled = false;
    if (closeBtn) closeBtn.disabled = false;

    if (dialog && dialog.open) {
      dialog.close();
    }
  }

  async function confirmClearAllData() {
    const confirmInput = $('#clear-data-confirm-input');
    if (!confirmInput || confirmInput.value.trim() !== 'HAPUS') return;

    const confirmBtn = $('#btn-confirm-clear-data');
    const cancelBtn = $('#btn-cancel-clear-confirm');
    const closeBtn = $('#btn-close-clear-confirm');

    if (confirmBtn) confirmBtn.disabled = true;
    if (cancelBtn) cancelBtn.disabled = true;
    if (closeBtn) closeBtn.disabled = true;
    if (confirmInput) confirmInput.disabled = true;

    // 1. Unduh backup otomatis terlebih dahulu (Fitur 12c)
    try {
      await exportBackup({
        prefix: 'shugen-backup-sebelum-hapus-',
        isAutoBackup: true,
        throwOnError: true,
        showToast: false
      });
    } catch (backupErr) {
      console.error(backupErr);
      toast('Gagal mengunduh backup otomatis: ' + (backupErr.message || 'pengunduhan gagal') + '. Penghapusan dibatalkan.');
      if (confirmBtn) confirmBtn.disabled = false;
      if (cancelBtn) cancelBtn.disabled = false;
      if (closeBtn) closeBtn.disabled = false;
      if (confirmInput) confirmInput.disabled = false;
      return;
    }

    // 2. Kosongkan semua data toko di IndexedDB
    try {
      await ShugenDB.clearAllData();
      try {
        localStorage.removeItem(NOTIF_STORAGE_REMINDED);
      } catch (e) {}

      // Reset filter dan state navigasi
      activeView = 'orders';
      activeFilter = 'semua';
      customerFilter = 'semua';
      partnerFilter = 'semua';
      searchQuery = '';
      customerSearchQuery = '';
      partnerSearchQuery = '';
      invoiceSearchQuery = '';
      selectedCustomerId = null;
      selectedPartnerId = null;
      editingOrderId = null;
      deadlineFilterActive = false;

      await reloadAllAppData();
      closeClearConfirmDialog();

      const settingsDialog = $('#settings-dialog');
      if (settingsDialog && settingsDialog.open) {
        settingsDialog.close();
      }

      toast('Semua data sudah dihapus');
    } catch (err) {
      console.error(err);
      toast('Gagal menghapus data: ' + (err.message || 'terjadi kesalahan'));
      if (confirmBtn) confirmBtn.disabled = false;
      if (cancelBtn) cancelBtn.disabled = false;
      if (closeBtn) closeBtn.disabled = false;
      if (confirmInput) confirmInput.disabled = false;
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
