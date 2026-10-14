const ShugenDB = (function () {
  const DB_NAME = 'shugen-hub';
  const DB_VERSION = 10;
  let _db = null;

  const DEFAULT_PAYMENT_METHODS = [
    'Transfer Bank', 'DANA', 'GoPay', 'OVO', 'Cash'
  ];

  const DEFAULT_EXPENSE_CATEGORIES = [
    'Modal Topup', 'Gaji Worker', 'Kas', 'Operasional', 'Lainnya'
  ];

  function open() {
    if (_db) return Promise.resolve(_db);
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('orders')) {
          const store = db.createObjectStore('orders', {
            keyPath: 'id',
            autoIncrement: true
          });
          store.createIndex('orderId', 'orderId', { unique: true });
          store.createIndex('status', 'status');
          store.createIndex('createdAt', 'createdAt');
        }
        if (!db.objectStoreNames.contains('paymentMethods')) {
          db.createObjectStore('paymentMethods', {
            keyPath: 'id',
            autoIncrement: true
          });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('progress')) {
          db.createObjectStore('progress', { keyPath: 'orderId' });
        }
        if (!db.objectStoreNames.contains('incomes')) {
          const incomeStore = db.createObjectStore('incomes', {
            keyPath: 'id',
            autoIncrement: true
          });
          incomeStore.createIndex('incomeId', 'incomeId', { unique: true });
          incomeStore.createIndex('orderId', 'orderId');
          incomeStore.createIndex('date', 'date');
          incomeStore.createIndex('createdAt', 'createdAt');
        }
        if (!db.objectStoreNames.contains('expenseCategories')) {
          db.createObjectStore('expenseCategories', {
            keyPath: 'id',
            autoIncrement: true
          });
        }
        if (!db.objectStoreNames.contains('expenses')) {
          const expenseStore = db.createObjectStore('expenses', {
            keyPath: 'id',
            autoIncrement: true
          });
          expenseStore.createIndex('expenseId', 'expenseId', { unique: true });
          expenseStore.createIndex('orderId', 'orderId');
          expenseStore.createIndex('categoryId', 'categoryId');
          expenseStore.createIndex('date', 'date');
          expenseStore.createIndex('createdAt', 'createdAt');
        }
        if (!db.objectStoreNames.contains('cashSettings')) {
          db.createObjectStore('cashSettings', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('invoices')) {
          const invoiceStore = db.createObjectStore('invoices', {
            keyPath: 'id',
            autoIncrement: true
          });
          invoiceStore.createIndex('invoiceNumber', 'invoiceNumber', { unique: true });
          invoiceStore.createIndex('orderId', 'orderId', { unique: true });
          invoiceStore.createIndex('issueDate', 'issueDate');
          invoiceStore.createIndex('createdAt', 'createdAt');
        }
        if (!db.objectStoreNames.contains('customers')) {
          const customerStore = db.createObjectStore('customers', {
            keyPath: 'id',
            autoIncrement: true
          });
          customerStore.createIndex('customerId', 'customerId', { unique: true });
          customerStore.createIndex('name', 'name');
          customerStore.createIndex('createdAt', 'createdAt');
        }
        if (!db.objectStoreNames.contains('games')) {
          const gameStore = db.createObjectStore('games', {
            keyPath: 'id',
            autoIncrement: true
          });
          gameStore.createIndex('gameId', 'gameId', { unique: true });
          gameStore.createIndex('name', 'name');
          gameStore.createIndex('createdAt', 'createdAt');
        }
        if (!db.objectStoreNames.contains('partners')) {
          const partnerStore = db.createObjectStore('partners', {
            keyPath: 'id',
            autoIncrement: true
          });
          partnerStore.createIndex('partnerId', 'partnerId', { unique: true });
          partnerStore.createIndex('name', 'name');
          partnerStore.createIndex('createdAt', 'createdAt');
        }
        if (!db.objectStoreNames.contains('catalog')) {
          const catalogStore = db.createObjectStore('catalog', {
            keyPath: 'id',
            autoIncrement: true
          });
          catalogStore.createIndex('catalogId', 'catalogId', { unique: true });
          catalogStore.createIndex('gameId', 'gameId', { unique: false });
          catalogStore.createIndex('type', 'type', { unique: false });
          catalogStore.createIndex('name', 'name', { unique: false });
          catalogStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
        if (e.target.transaction && e.target.transaction.objectStoreNames.contains('orders')) {
          const orderStore = e.target.transaction.objectStore('orders');
          if (!orderStore.indexNames.contains('gameId')) {
            orderStore.createIndex('gameId', 'gameId', { unique: false });
          }
          if (!orderStore.indexNames.contains('partnerId')) {
            orderStore.createIndex('partnerId', 'partnerId', { unique: false });
          }
        }
      };

      req.onsuccess = () => {
        _db = req.result;
        _db.onversionchange = () => {
          _db.close();
          _db = null;
        };
        resolve(_db);
      };
      req.onerror = () => reject(req.error);
    });
  }

  function tx(storeName, mode) {
    return _db.transaction(storeName, mode).objectStore(storeName);
  }

  function req2p(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Orders

  async function getAllOrders() {
    await open();
    return req2p(tx('orders', 'readonly').getAll());
  }

  async function getOrder(id) {
    await open();
    return req2p(tx('orders', 'readonly').get(id));
  }

  const ID_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let _addOrderQueue = Promise.resolve();

  function randomIdCode(length) {
    const charCount = ID_CHARS.length;
    const maxValid = 256 - (256 % charCount);
    const buf = new Uint8Array(length);
    let code = '';
    while (code.length < length) {
      crypto.getRandomValues(buf);
      for (let i = 0; i < buf.length && code.length < length; i++) {
        if (buf[i] < maxValid) {
          code += ID_CHARS.charAt(buf[i] % charCount);
        }
      }
    }
    return code;
  }

  function buildCandidateOrderId(date) {
    const now = date || new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return 'SGN-' + yy + mm + dd + '-' + randomIdCode(4);
  }

  function addOrder(order) {
    const run = _addOrderQueue.then(async () => {
      await open();
      return new Promise((resolve, reject) => {
        const transaction = _db.transaction('orders', 'readwrite');
        const store = transaction.objectStore('orders');
        const idx = store.index('orderId');
        const now = new Date();
        let savedRecord = null;

        transaction.oncomplete = () => resolve(savedRecord);
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error || new Error('Transaksi dibatalkan'));

        function tryInsert(preferredId) {
          const candidate = preferredId || buildCandidateOrderId(now);
          const checkReq = idx.getKey(candidate);
          checkReq.onsuccess = () => {
            if (checkReq.result !== undefined) {
              tryInsert(null);
              return;
            }
            const record = {
              orderId: candidate,
              customerName: order.customerName,
              type: order.type,
              gameId: order.gameId || null,
              detail: order.detail || '',
              price: Number(order.price) || 0,
              status: order.status || 'menunggu_bayar',
              paymentMethod: order.paymentMethod || '',
              deadline: order.deadline || null,
              createdAt: order.createdAt || now,
              updatedAt: now,
              customerId: null,
              partnerId: order.partnerId || null,
              partnerShareType: order.partnerShareType || null,
              partnerShareValue: order.partnerShareValue !== undefined ? order.partnerShareValue : null,
              partnerShareAmount: order.partnerShareAmount !== undefined ? order.partnerShareAmount : null,
              partnerPaid: Boolean(order.partnerPaid),
              partnerPaidAt: order.partnerPaidAt || null
            };
            const addReq = store.add(record);
            addReq.onsuccess = () => {
              record.id = addReq.result;
              savedRecord = record;
            };
            addReq.onerror = (e) => {
              if (addReq.error && addReq.error.name === 'ConstraintError') {
                e.preventDefault();
                e.stopPropagation();
                tryInsert(null);
              }
            };
          };
        }

        tryInsert(order.orderId || null);
      });
    });
    _addOrderQueue = run.catch(() => {});
    return run;
  }

  async function updateOrder(id, changes) {
    await open();
    const store = tx('orders', 'readwrite');
    const existing = await req2p(store.get(id));
    if (!existing) throw new Error('Pesanan tidak ditemukan');
    const updated = Object.assign({}, existing, changes, { updatedAt: new Date() });
    await req2p(store.put(updated));
    return updated;
  }

  async function deleteOrder(id) {
    await open();
    const existing = await getOrder(id);
    if (existing && existing.orderId) {
      await deleteProgress(existing.orderId);
      await deleteInvoiceByOrderId(existing.orderId);
    }
    return req2p(tx('orders', 'readwrite').delete(id));
  }

  async function generateOrderId() {
    await open();
    return new Promise((resolve, reject) => {
      const transaction = _db.transaction('orders', 'readonly');
      const idx = transaction.objectStore('orders').index('orderId');
      const now = new Date();

      function tryGenerate() {
        const candidate = buildCandidateOrderId(now);
        const checkReq = idx.getKey(candidate);
        checkReq.onsuccess = () => {
          if (checkReq.result !== undefined) {
            tryGenerate();
            return;
          }
          resolve(candidate);
        };
        checkReq.onerror = () => reject(checkReq.error);
      }

      tryGenerate();
    });
  }

  async function clearOrders() {
    await open();
    return req2p(tx('orders', 'readwrite').clear());
  }

  function calcPercentage(steps) {
    if (!Array.isArray(steps) || steps.length === 0) return 0;
    const doneCount = steps.filter((s) => Boolean(s.done)).length;
    return Math.round((doneCount / steps.length) * 100);
  }

  function normalizeSteps(steps) {
    if (!Array.isArray(steps)) return [];
    return steps
      .map((s) => ({
        id: s.id || ('step-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6)),
        name: String(s.name || '').trim(),
        done: Boolean(s.done)
      }))
      .filter((s) => s.name.length > 0)
      .map((s, idx) => ({
        id: s.id,
        name: s.name,
        done: s.done,
        order: idx
      }));
  }

  async function getAllProgress() {
    await open();
    return req2p(tx('progress', 'readonly').getAll());
  }

  async function getProgress(orderId) {
    await open();
    const rec = await req2p(tx('progress', 'readonly').get(orderId));
    if (rec) return rec;
    return {
      orderId: orderId,
      steps: [],
      percentage: 0,
      updatedAt: null
    };
  }

  async function saveProgress(orderId, steps) {
    await open();
    const cleanSteps = normalizeSteps(steps);
    const record = {
      orderId: orderId,
      steps: cleanSteps,
      percentage: calcPercentage(cleanSteps),
      updatedAt: new Date()
    };
    await req2p(tx('progress', 'readwrite').put(record));
    return record;
  }

  async function deleteProgress(orderId) {
    await open();
    return req2p(tx('progress', 'readwrite').delete(orderId));
  }

  async function clearProgress() {
    await open();
    return req2p(tx('progress', 'readwrite').clear());
  }

  let _addIncomeQueue = Promise.resolve();

  function normalizeDateStr(dateInput) {
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())) {
      return dateInput.trim();
    }
    const d = dateInput ? new Date(dateInput) : new Date();
    const valid = isNaN(d.getTime()) ? new Date() : d;
    const yyyy = String(valid.getFullYear());
    const mm = String(valid.getMonth() + 1).padStart(2, '0');
    const dd = String(valid.getDate()).padStart(2, '0');
    return yyyy + '-' + mm + '-' + dd;
  }

  function buildCandidateIncomeId(dateStr) {
    const cleanDate = normalizeDateStr(dateStr);
    const yy = cleanDate.slice(2, 4);
    const mm = cleanDate.slice(5, 7);
    const dd = cleanDate.slice(8, 10);
    return 'MSK-' + yy + mm + dd + '-' + randomIdCode(4);
  }

  async function getAllIncomes() {
    await open();
    return req2p(tx('incomes', 'readonly').getAll());
  }

  async function getIncome(id) {
    await open();
    return req2p(tx('incomes', 'readonly').get(id));
  }

  async function getIncomesByOrderId(orderId) {
    await open();
    if (!orderId) return [];
    const idx = tx('incomes', 'readonly').index('orderId');
    return req2p(idx.getAll(orderId));
  }

  function addIncome(income) {
    const run = _addIncomeQueue.then(async () => {
      await open();
      return new Promise((resolve, reject) => {
        const transaction = _db.transaction('incomes', 'readwrite');
        const store = transaction.objectStore('incomes');
        const idx = store.index('incomeId');
        const now = new Date();
        const dateStr = normalizeDateStr(income.date);
        let savedRecord = null;

        transaction.oncomplete = () => resolve(savedRecord);
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error || new Error('Transaksi dibatalkan'));

        function tryInsert(preferredId) {
          const candidate = preferredId || buildCandidateIncomeId(dateStr);
          const checkReq = idx.getKey(candidate);
          checkReq.onsuccess = () => {
            if (checkReq.result !== undefined) {
              tryInsert(null);
              return;
            }
            const cleanOrderId = income.orderId ? String(income.orderId).trim() : '';
            const record = {
              incomeId: candidate,
              date: dateStr,
              amount: Number(income.amount) || 0,
              paymentMethod: String(income.paymentMethod || '').trim(),
              orderId: cleanOrderId || null,
              note: String(income.note || '').trim(),
              createdAt: income.createdAt || now,
              updatedAt: now
            };
            const addReq = store.add(record);
            addReq.onsuccess = () => {
              record.id = addReq.result;
              savedRecord = record;
            };
            addReq.onerror = (e) => {
              if (addReq.error && addReq.error.name === 'ConstraintError') {
                e.preventDefault();
                e.stopPropagation();
                tryInsert(null);
              }
            };
          };
        }

        tryInsert(income.incomeId || null);
      });
    });
    _addIncomeQueue = run.catch(() => {});
    return run;
  }

  async function updateIncome(id, changes) {
    await open();
    const store = tx('incomes', 'readwrite');
    const existing = await req2p(store.get(id));
    if (!existing) throw new Error('Pemasukan tidak ditemukan');
    const nextOrderId = changes.orderId !== undefined
      ? (String(changes.orderId || '').trim() || null)
      : existing.orderId;
    const updated = Object.assign({}, existing, {
      date: changes.date !== undefined ? normalizeDateStr(changes.date) : existing.date,
      amount: changes.amount !== undefined ? (Number(changes.amount) || 0) : existing.amount,
      paymentMethod: changes.paymentMethod !== undefined ? String(changes.paymentMethod || '').trim() : existing.paymentMethod,
      orderId: nextOrderId,
      note: changes.note !== undefined ? String(changes.note || '').trim() : existing.note,
      updatedAt: new Date()
    });
    await req2p(store.put(updated));
    return updated;
  }

  async function deleteIncome(id) {
    await open();
    return req2p(tx('incomes', 'readwrite').delete(id));
  }

  async function clearIncomes() {
    await open();
    return req2p(tx('incomes', 'readwrite').clear());
  }

  let _addExpenseQueue = Promise.resolve();

  function buildCandidateExpenseId(dateStr) {
    const cleanDate = normalizeDateStr(dateStr);
    const yy = cleanDate.slice(2, 4);
    const mm = cleanDate.slice(5, 7);
    const dd = cleanDate.slice(8, 10);
    return 'MKL-' + yy + mm + dd + '-' + randomIdCode(4);
  }

  async function getAllExpenses() {
    await open();
    return req2p(tx('expenses', 'readonly').getAll());
  }

  async function getExpense(id) {
    await open();
    return req2p(tx('expenses', 'readonly').get(id));
  }

  async function getExpensesByOrderId(orderId) {
    await open();
    if (!orderId) return [];
    const idx = tx('expenses', 'readonly').index('orderId');
    return req2p(idx.getAll(orderId));
  }

  async function getExpensesByCategoryId(categoryId) {
    await open();
    if (categoryId === undefined || categoryId === null) return [];
    const idx = tx('expenses', 'readonly').index('categoryId');
    return req2p(idx.getAll(Number(categoryId)));
  }

  function addExpense(expense) {
    const run = _addExpenseQueue.then(async () => {
      await open();
      return new Promise((resolve, reject) => {
        const transaction = _db.transaction('expenses', 'readwrite');
        const store = transaction.objectStore('expenses');
        const idx = store.index('expenseId');
        const now = new Date();
        const dateStr = normalizeDateStr(expense.date);
        let savedRecord = null;

        transaction.oncomplete = () => resolve(savedRecord);
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error || new Error('Transaksi dibatalkan'));

        function tryInsert(preferredId) {
          const candidate = preferredId || buildCandidateExpenseId(dateStr);
          const checkReq = idx.getKey(candidate);
          checkReq.onsuccess = () => {
            if (checkReq.result !== undefined) {
              tryInsert(null);
              return;
            }
            const cleanOrderId = expense.orderId ? String(expense.orderId).trim() : '';
            const record = {
              expenseId: candidate,
              date: dateStr,
              amount: Number(expense.amount) || 0,
              categoryId: Number(expense.categoryId),
              paymentMethod: String(expense.paymentMethod || '').trim(),
              orderId: cleanOrderId || null,
              note: String(expense.note || '').trim(),
              createdAt: expense.createdAt || now,
              updatedAt: now
            };
            const addReq = store.add(record);
            addReq.onsuccess = () => {
              record.id = addReq.result;
              savedRecord = record;
            };
            addReq.onerror = (e) => {
              if (addReq.error && addReq.error.name === 'ConstraintError') {
                e.preventDefault();
                e.stopPropagation();
                tryInsert(null);
              }
            };
          };
        }

        tryInsert(expense.expenseId || null);
      });
    });
    _addExpenseQueue = run.catch(() => {});
    return run;
  }

  async function updateExpense(id, changes) {
    await open();
    const store = tx('expenses', 'readwrite');
    const existing = await req2p(store.get(id));
    if (!existing) throw new Error('Pengeluaran tidak ditemukan');
    const nextOrderId = changes.orderId !== undefined
      ? (String(changes.orderId || '').trim() || null)
      : existing.orderId;
    const updated = Object.assign({}, existing, {
      date: changes.date !== undefined ? normalizeDateStr(changes.date) : existing.date,
      amount: changes.amount !== undefined ? (Number(changes.amount) || 0) : existing.amount,
      categoryId: changes.categoryId !== undefined ? Number(changes.categoryId) : existing.categoryId,
      paymentMethod: changes.paymentMethod !== undefined ? String(changes.paymentMethod || '').trim() : existing.paymentMethod,
      orderId: nextOrderId,
      note: changes.note !== undefined ? String(changes.note || '').trim() : existing.note,
      updatedAt: new Date()
    });
    await req2p(store.put(updated));
    return updated;
  }

  async function deleteExpense(id) {
    await open();
    return req2p(tx('expenses', 'readwrite').delete(id));
  }

  async function clearExpenses() {
    await open();
    return req2p(tx('expenses', 'readwrite').clear());
  }

  // Expense categories

  async function getAllExpenseCategories() {
    await open();
    return req2p(tx('expenseCategories', 'readonly').getAll());
  }

  async function addExpenseCategory(name) {
    await open();
    const trimmed = String(name || '').trim();
    if (!trimmed) return null;
    const existing = await getAllExpenseCategories();
    const isDuplicate = existing.some(
      (c) => String(c.name || '').toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      throw new Error('DUPLICATE_CATEGORY');
    }
    const key = await req2p(tx('expenseCategories', 'readwrite').add({ name: trimmed }));
    return { id: key, name: trimmed };
  }

  async function updateExpenseCategory(id, name) {
    await open();
    const trimmed = String(name || '').trim();
    if (!trimmed) return null;
    const existing = await getAllExpenseCategories();
    const isDuplicate = existing.some(
      (c) => c.id !== id && String(c.name || '').toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      throw new Error('DUPLICATE_CATEGORY');
    }
    await req2p(tx('expenseCategories', 'readwrite').put({ id: id, name: trimmed }));
    return { id: id, name: trimmed };
  }

  async function deleteExpenseCategory(id) {
    await open();
    const used = await getExpensesByCategoryId(Number(id));
    if (used.length > 0) {
      throw new Error('CATEGORY_IN_USE');
    }
    return req2p(tx('expenseCategories', 'readwrite').delete(id));
  }

  async function clearExpenseCategories() {
    await open();
    return req2p(tx('expenseCategories', 'readwrite').clear());
  }

  async function initExpenseCategories() {
    const existing = await getAllExpenseCategories();
    if (existing.length > 0) return existing;
    for (const name of DEFAULT_EXPENSE_CATEGORIES) {
      await addExpenseCategory(name);
    }
    return getAllExpenseCategories();
  }

  // Payment methods

  async function getAllPaymentMethods() {
    await open();
    return req2p(tx('paymentMethods', 'readonly').getAll());
  }

  async function addPaymentMethod(name) {
    await open();
    const trimmed = String(name || '').trim();
    if (!trimmed) return null;
    const existing = await getAllPaymentMethods();
    const isDuplicate = existing.some(
      (p) => String(p.name || '').toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      throw new Error('DUPLICATE_PAYMENT');
    }
    const key = await req2p(tx('paymentMethods', 'readwrite').add({ name: trimmed }));
    return { id: key, name: trimmed };
  }

  async function updatePaymentMethod(id, name) {
    await open();
    const trimmed = String(name || '').trim();
    if (!trimmed) return null;
    await req2p(tx('paymentMethods', 'readwrite').put({ id: id, name: trimmed }));
    return { id: id, name: trimmed };
  }

  async function deletePaymentMethod(id) {
    await open();
    return req2p(tx('paymentMethods', 'readwrite').delete(id));
  }

  async function clearPaymentMethods() {
    await open();
    return req2p(tx('paymentMethods', 'readwrite').clear());
  }

  async function initPaymentMethods() {
    const existing = await getAllPaymentMethods();
    if (existing.length > 0) return existing;
    for (const name of DEFAULT_PAYMENT_METHODS) {
      await addPaymentMethod(name);
    }
    return getAllPaymentMethods();
  }

  // Settings

  async function getSetting(key) {
    await open();
    const rec = await req2p(tx('settings', 'readonly').get(key));
    return rec ? rec.value : null;
  }

  async function setSetting(key, value) {
    await open();
    return req2p(tx('settings', 'readwrite').put({ key: key, value: value }));
  }

  async function getAllSettings() {
    await open();
    return req2p(tx('settings', 'readonly').getAll());
  }

  // Cash settings

  async function getCashSetting(key) {
    await open();
    const rec = await req2p(tx('cashSettings', 'readonly').get(key));
    return rec ? rec.value : null;
  }

  async function setCashSetting(key, value) {
    await open();
    return req2p(tx('cashSettings', 'readwrite').put({ key: key, value: value }));
  }

  async function clearCashSettings() {
    await open();
    return req2p(tx('cashSettings', 'readwrite').clear());
  }

  // Invoices

  let _addInvoiceQueue = Promise.resolve();

  function buildCandidateInvoiceId(dateStr) {
    const cleanDate = normalizeDateStr(dateStr);
    const yy = cleanDate.slice(2, 4);
    const mm = cleanDate.slice(5, 7);
    const dd = cleanDate.slice(8, 10);
    return 'INV-' + yy + mm + dd + '-' + randomIdCode(4);
  }

  async function getAllInvoices() {
    await open();
    return req2p(tx('invoices', 'readonly').getAll());
  }

  async function getInvoice(id) {
    await open();
    return req2p(tx('invoices', 'readonly').get(id));
  }

  async function getInvoiceByOrderId(orderId) {
    await open();
    if (!orderId) return null;
    const idx = tx('invoices', 'readonly').index('orderId');
    const list = await req2p(idx.getAll(orderId));
    return list.length > 0 ? list[0] : null;
  }

  async function getInvoiceByNumber(invoiceNumber) {
    await open();
    if (!invoiceNumber) return null;
    const idx = tx('invoices', 'readonly').index('invoiceNumber');
    return req2p(idx.get(invoiceNumber));
  }

  function addInvoice(inv) {
    const run = _addInvoiceQueue.then(async () => {
      await open();
      return new Promise((resolve, reject) => {
        const transaction = _db.transaction('invoices', 'readwrite');
        const store = transaction.objectStore('invoices');
        const numIdx = store.index('invoiceNumber');
        const orderIdx = store.index('orderId');
        const now = new Date();
        const dateStr = normalizeDateStr(inv.issueDate || inv.date);
        let savedRecord = null;

        transaction.oncomplete = () => resolve(savedRecord);
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error || new Error('Transaksi dibatalkan'));

        const cleanOrderId = String(inv.orderId || '').trim();
        if (!cleanOrderId) {
          reject(new Error('ID pesanan wajib diisi'));
          return;
        }

        const orderCheck = orderIdx.getKey(cleanOrderId);
        orderCheck.onsuccess = () => {
          if (orderCheck.result !== undefined) {
            reject(new Error('Pesanan sudah memiliki invoice'));
            return;
          }

          function tryInsert(preferredNumber) {
            const candidate = preferredNumber || buildCandidateInvoiceId(dateStr);
            const checkReq = numIdx.getKey(candidate);
            checkReq.onsuccess = () => {
              if (checkReq.result !== undefined) {
                tryInsert(null);
                return;
              }
              const record = {
                invoiceNumber: candidate,
                orderId: cleanOrderId,
                issueDate: dateStr,
                note: String(inv.note || inv.notes || '').trim(),
                createdAt: inv.createdAt || now,
                updatedAt: now
              };
              const addReq = store.add(record);
              addReq.onsuccess = () => {
                record.id = addReq.result;
                savedRecord = record;
              };
              addReq.onerror = (e) => {
                if (addReq.error && addReq.error.name === 'ConstraintError') {
                  e.preventDefault();
                  e.stopPropagation();
                  tryInsert(null);
                }
              };
            };
          }

          tryInsert(inv.invoiceNumber || null);
        };
      });
    });
    _addInvoiceQueue = run.catch(() => {});
    return run;
  }

  async function updateInvoiceNote(id, note) {
    await open();
    const store = tx('invoices', 'readwrite');
    const existing = await req2p(store.get(id));
    if (!existing) throw new Error('Invoice tidak ditemukan');
    const updated = Object.assign({}, existing, {
      note: String(note || '').trim(),
      updatedAt: new Date()
    });
    await req2p(store.put(updated));
    return updated;
  }

  async function deleteInvoice(id) {
    await open();
    return req2p(tx('invoices', 'readwrite').delete(id));
  }

  async function deleteInvoiceByOrderId(orderId) {
    await open();
    if (!orderId) return;
    const existing = await getInvoiceByOrderId(orderId);
    if (existing && existing.id) {
      return req2p(tx('invoices', 'readwrite').delete(existing.id));
    }
  }

  async function clearInvoices() {
    await open();
    return req2p(tx('invoices', 'readwrite').clear());
  }

  // Customers

  let _addCustomerQueue = Promise.resolve();

  function buildCandidateCustomerId(date) {
    const now = date || new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return 'PLG-' + yy + mm + dd + '-' + randomIdCode(4);
  }

  async function getAllCustomers() {
    await open();
    return req2p(tx('customers', 'readonly').getAll());
  }

  async function getCustomer(id) {
    await open();
    return req2p(tx('customers', 'readonly').get(id));
  }

  function addCustomer(customer) {
    const run = _addCustomerQueue.then(async () => {
      await open();
      return new Promise((resolve, reject) => {
        const transaction = _db.transaction('customers', 'readwrite');
        const store = transaction.objectStore('customers');
        const custIdx = store.index('customerId');
        const now = new Date();
        let savedRecord = null;

        transaction.oncomplete = () => resolve(savedRecord);
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error || new Error('Transaksi dibatalkan'));

        const cleanName = String((customer && customer.name) || '').trim();
        if (!cleanName) {
          transaction.abort();
          reject(new Error('Nama pelanggan wajib diisi'));
          return;
        }

        const checkNameReq = store.getAll();
        checkNameReq.onsuccess = () => {
          const all = checkNameReq.result || [];
          const isDup = all.some(
            (c) => c.name && c.name.trim().toLowerCase() === cleanName.toLowerCase()
          );
          if (isDup) {
            transaction.abort();
            reject(new Error('DUPLICATE_CUSTOMER_NAME'));
            return;
          }

          function tryInsert(preferredId) {
            const candidate = preferredId || buildCandidateCustomerId(now);
            const checkReq = custIdx.getKey(candidate);
            checkReq.onsuccess = () => {
              if (checkReq.result !== undefined) {
                tryInsert(null);
                return;
              }
              const record = {
                customerId: candidate,
                name: cleanName,
                contact: String((customer && customer.contact) || '').trim(),
                note: String((customer && customer.note) || '').trim(),
                isSubscriber: Boolean(customer && customer.isSubscriber),
                createdAt: (customer && customer.createdAt) || now,
                updatedAt: now
              };
              const addReq = store.add(record);
              addReq.onsuccess = () => {
                record.id = addReq.result;
                savedRecord = record;
              };
              addReq.onerror = (e) => {
                if (addReq.error && addReq.error.name === 'ConstraintError') {
                  e.preventDefault();
                  e.stopPropagation();
                  tryInsert(null);
                }
              };
            };
          }

          tryInsert((customer && customer.customerId) || null);
        };
      });
    });
    _addCustomerQueue = run.catch(() => {});
    return run;
  }

  async function updateCustomer(id, changes) {
    await open();
    return new Promise((resolve, reject) => {
      const transaction = _db.transaction(['customers', 'orders'], 'readwrite');
      const custStore = transaction.objectStore('customers');
      const orderStore = transaction.objectStore('orders');
      let updatedRecord = null;

      transaction.oncomplete = () => resolve(updatedRecord);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error || new Error('Transaksi dibatalkan'));

      const getReq = custStore.get(id);
      getReq.onsuccess = () => {
        const existing = getReq.result;
        if (!existing) {
          transaction.abort();
          reject(new Error('Pelanggan tidak ditemukan'));
          return;
        }

        const oldName = existing.name;
        const newName = changes.name !== undefined ? String(changes.name).trim() : oldName;
        if (!newName) {
          transaction.abort();
          reject(new Error('Nama pelanggan wajib diisi'));
          return;
        }

        const getAllCustReq = custStore.getAll();
        getAllCustReq.onsuccess = () => {
          const allCusts = getAllCustReq.result || [];
          const isDup = allCusts.some(
            (c) => c.id !== id && c.name && c.name.trim().toLowerCase() === newName.toLowerCase()
          );
          if (isDup) {
            transaction.abort();
            reject(new Error('DUPLICATE_CUSTOMER_NAME'));
            return;
          }

          const updated = Object.assign({}, existing, {
            name: newName,
            contact: changes.contact !== undefined ? String(changes.contact).trim() : existing.contact,
            note: changes.note !== undefined ? String(changes.note).trim() : existing.note,
            isSubscriber: changes.isSubscriber !== undefined ? Boolean(changes.isSubscriber) : existing.isSubscriber,
            updatedAt: new Date()
          });

          custStore.put(updated);
          updatedRecord = updated;

          if (oldName.trim().toLowerCase() !== newName.toLowerCase()) {
            const getAllOrdersReq = orderStore.getAll();
            getAllOrdersReq.onsuccess = () => {
              const ordersList = getAllOrdersReq.result || [];
              const now = new Date();
              ordersList.forEach((order) => {
                if (
                  order.customerName &&
                  order.customerName.trim().toLowerCase() === oldName.trim().toLowerCase()
                ) {
                  order.customerName = newName;
                  order.updatedAt = now;
                  orderStore.put(order);
                }
              });
            };
          }
        };
      };
    });
  }

  async function deleteCustomer(id) {
    await open();
    return req2p(tx('customers', 'readwrite').delete(id));
  }

  async function clearCustomers() {
    await open();
    return req2p(tx('customers', 'readwrite').clear());
  }

  // Games

  let _addGameQueue = Promise.resolve();

  function buildCandidateGameId(date) {
    const now = date || new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return 'GAM-' + yy + mm + dd + '-' + randomIdCode(4);
  }

  async function getAllGames() {
    await open();
    return req2p(tx('games', 'readonly').getAll());
  }

  async function getGame(id) {
    await open();
    return req2p(tx('games', 'readonly').get(id));
  }

  async function getGameByGameId(gameId) {
    await open();
    if (!gameId) return null;
    const idx = tx('games', 'readonly').index('gameId');
    return req2p(idx.get(gameId));
  }

  function addGame(game) {
    const nameStr = typeof game === 'string' ? game : (game && game.name);
    const cleanName = String(nameStr || '').trim();
    const run = _addGameQueue.then(async () => {
      await open();
      return new Promise((resolve, reject) => {
        const transaction = _db.transaction('games', 'readwrite');
        const store = transaction.objectStore('games');
        const gameIdx = store.index('gameId');
        const now = new Date();
        let savedRecord = null;

        transaction.oncomplete = () => resolve(savedRecord);
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error || new Error('Transaksi dibatalkan'));

        if (!cleanName) {
          transaction.abort();
          reject(new Error('Nama game wajib diisi'));
          return;
        }

        const checkNameReq = store.getAll();
        checkNameReq.onsuccess = () => {
          const all = checkNameReq.result || [];
          const isDup = all.some(
            (g) => g.name && g.name.trim().toLowerCase() === cleanName.toLowerCase()
          );
          if (isDup) {
            transaction.abort();
            reject(new Error('DUPLICATE_GAME_NAME'));
            return;
          }

          function tryInsert(preferredId) {
            const candidate = preferredId || buildCandidateGameId(now);
            const checkReq = gameIdx.getKey(candidate);
            checkReq.onsuccess = () => {
              if (checkReq.result !== undefined) {
                tryInsert(null);
                return;
              }
              const record = {
                gameId: candidate,
                name: cleanName,
                createdAt: (game && game.createdAt) || now,
                updatedAt: now
              };
              const addReq = store.add(record);
              addReq.onsuccess = () => {
                record.id = addReq.result;
                savedRecord = record;
              };
              addReq.onerror = (e) => {
                if (addReq.error && addReq.error.name === 'ConstraintError') {
                  e.preventDefault();
                  e.stopPropagation();
                  tryInsert(null);
                }
              };
            };
          }

          tryInsert((game && game.gameId) || null);
        };
      });
    });
    _addGameQueue = run.catch(() => {});
    return run;
  }

  async function updateGame(id, newName) {
    await open();
    const cleanName = String(newName || '').trim();
    if (!cleanName) {
      throw new Error('Nama game wajib diisi');
    }
    const all = await getAllGames();
    const existing = all.find((g) => g.id === id);
    if (!existing) throw new Error('Game tidak ditemukan');
    const isDup = all.some(
      (g) => g.id !== id && g.name && g.name.trim().toLowerCase() === cleanName.toLowerCase()
    );
    if (isDup) {
      throw new Error('DUPLICATE_GAME_NAME');
    }
    const updated = Object.assign({}, existing, {
      name: cleanName,
      updatedAt: new Date()
    });
    await req2p(tx('games', 'readwrite').put(updated));
    return updated;
  }

  async function deleteGame(id) {
    await open();
    const existing = await getGame(id);
    if (!existing) return;
    const allOrders = await getAllOrders();
    const isUsed = allOrders.some((o) => o.gameId === existing.gameId);
    if (isUsed) {
      throw new Error('GAME_IN_USE');
    }
    const allCatalog = await getAllCatalog();
    const isUsedInCatalog = allCatalog.some((c) => c.gameId === existing.gameId);
    if (isUsedInCatalog) {
      throw new Error('GAME_IN_USE_CATALOG');
    }
    return req2p(tx('games', 'readwrite').delete(id));
  }

  async function clearGames() {
    await open();
    return req2p(tx('games', 'readwrite').clear());
  }

  // Partners

  let _addPartnerQueue = Promise.resolve();

  function buildCandidatePartnerId(date) {
    const now = date || new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return 'PRT-' + yy + mm + dd + '-' + randomIdCode(4);
  }

  async function getAllPartners() {
    await open();
    return req2p(tx('partners', 'readonly').getAll());
  }

  async function getPartner(id) {
    await open();
    if (!id) return null;
    if (typeof id === 'string' && id.startsWith('PRT-')) {
      return getPartnerByPartnerId(id);
    }
    return req2p(tx('partners', 'readonly').get(id));
  }

  async function getPartnerByPartnerId(partnerId) {
    await open();
    if (!partnerId) return null;
    return req2p(tx('partners', 'readonly').index('partnerId').get(partnerId));
  }

  function addPartner(partner) {
    const run = _addPartnerQueue.then(async () => {
      await open();
      return new Promise((resolve, reject) => {
        const transaction = _db.transaction('partners', 'readwrite');
        const store = transaction.objectStore('partners');
        const partIdx = store.index('partnerId');
        const now = new Date();
        let savedRecord = null;

        transaction.oncomplete = () => resolve(savedRecord);
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error || new Error('Transaksi dibatalkan'));

        const cleanName = String((partner && partner.name) || '').trim();
        if (!cleanName) {
          transaction.abort();
          reject(new Error('Nama partner wajib diisi'));
          return;
        }

        const checkNameReq = store.getAll();
        checkNameReq.onsuccess = () => {
          const all = checkNameReq.result || [];
          const isDup = all.some(
            (p) => p.name && p.name.trim().toLowerCase() === cleanName.toLowerCase()
          );
          if (isDup) {
            transaction.abort();
            reject(new Error('DUPLICATE_PARTNER_NAME'));
            return;
          }

          function tryInsert(preferredId) {
            const candidate = preferredId || buildCandidatePartnerId(now);
            const checkReq = partIdx.getKey(candidate);
            checkReq.onsuccess = () => {
              if (checkReq.result !== undefined) {
                tryInsert(null);
                return;
              }
              const record = {
                partnerId: candidate,
                name: cleanName,
                phone: String((partner && partner.phone) || '').trim(),
                bankName: String((partner && partner.bankName) || '').trim(),
                accountNumber: String((partner && partner.accountNumber) || '').trim(),
                accountHolder: String((partner && partner.accountHolder) || '').trim(),
                note: String((partner && partner.note) || '').trim(),
                defaultShareType: partner && partner.defaultShareType ? String(partner.defaultShareType) : '',
                defaultShareValue: partner && partner.defaultShareValue !== undefined && partner.defaultShareValue !== null && partner.defaultShareValue !== ''
                  ? Number(partner.defaultShareValue)
                  : null,
                isActive: partner && partner.isActive !== undefined ? Boolean(partner.isActive) : true,
                createdAt: (partner && partner.createdAt) || now,
                updatedAt: now
              };
              const addReq = store.add(record);
              addReq.onsuccess = () => {
                record.id = addReq.result;
                savedRecord = record;
              };
              addReq.onerror = (e) => {
                if (addReq.error && addReq.error.name === 'ConstraintError') {
                  e.preventDefault();
                  e.stopPropagation();
                  tryInsert(null);
                }
              };
            };
          }

          tryInsert((partner && partner.partnerId) || null);
        };
      });
    });
    _addPartnerQueue = run.catch(() => {});
    return run;
  }

  async function updatePartner(id, partnerData) {
    await open();
    let existing = await getPartner(id);
    if (!existing && typeof id === 'string') {
      existing = await getPartnerByPartnerId(id);
    }
    if (!existing) throw new Error('Partner tidak ditemukan');

    const cleanName = partnerData.name !== undefined ? String(partnerData.name).trim() : existing.name;
    if (!cleanName) throw new Error('Nama partner wajib diisi');

    const all = await getAllPartners();
    const isDup = all.some(
      (p) => p.id !== existing.id && p.name && p.name.trim().toLowerCase() === cleanName.toLowerCase()
    );
    if (isDup) {
      throw new Error('DUPLICATE_PARTNER_NAME');
    }

    const updated = Object.assign({}, existing, {
      name: cleanName,
      phone: partnerData.phone !== undefined ? String(partnerData.phone).trim() : existing.phone,
      bankName: partnerData.bankName !== undefined ? String(partnerData.bankName).trim() : (existing.bankName || ''),
      accountNumber: partnerData.accountNumber !== undefined ? String(partnerData.accountNumber).trim() : (existing.accountNumber || ''),
      accountHolder: partnerData.accountHolder !== undefined ? String(partnerData.accountHolder).trim() : (existing.accountHolder || ''),
      note: partnerData.note !== undefined ? String(partnerData.note).trim() : existing.note,
      defaultShareType: partnerData.defaultShareType !== undefined ? String(partnerData.defaultShareType) : existing.defaultShareType,
      defaultShareValue: partnerData.defaultShareValue !== undefined && partnerData.defaultShareValue !== null && partnerData.defaultShareValue !== ''
        ? Number(partnerData.defaultShareValue)
        : (partnerData.defaultShareValue === null ? null : existing.defaultShareValue),
      isActive: partnerData.isActive !== undefined ? Boolean(partnerData.isActive) : existing.isActive,
      updatedAt: new Date()
    });

    await req2p(tx('partners', 'readwrite').put(updated));
    return updated;
  }

  async function deletePartner(id) {
    await open();
    let existing = await getPartner(id);
    if (!existing && typeof id === 'string') {
      existing = await getPartnerByPartnerId(id);
    }
    if (!existing) return;
    const allOrders = await getAllOrders();
    const isUsed = allOrders.some((o) => o.partnerId === existing.partnerId);
    if (isUsed) {
      throw new Error('PARTNER_IN_USE');
    }
    return req2p(tx('partners', 'readwrite').delete(existing.id));
  }

  async function clearPartners() {
    await open();
    return req2p(tx('partners', 'readwrite').clear());
  }

  // Catalog (Price Catalog / Katalog Harga)

  let _addCatalogQueue = Promise.resolve();

  function buildCandidateCatalogId(date) {
    const now = date || new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return 'CTL-' + yy + mm + dd + '-' + randomIdCode(4);
  }

  async function getAllCatalog() {
    await open();
    return req2p(tx('catalog', 'readonly').getAll());
  }

  async function getCatalogItem(id) {
    await open();
    return req2p(tx('catalog', 'readonly').get(id));
  }

  async function getCatalogItemByCatalogId(catalogId) {
    await open();
    if (!catalogId) return null;
    return req2p(tx('catalog', 'readonly').index('catalogId').get(catalogId));
  }

  async function getCatalogItemsByGameId(gameId) {
    await open();
    if (!gameId) return [];
    return req2p(tx('catalog', 'readonly').index('gameId').getAll(gameId));
  }

  function addCatalogItem(item) {
    const run = _addCatalogQueue.then(async () => {
      await open();
      return new Promise((resolve, reject) => {
        const transaction = _db.transaction('catalog', 'readwrite');
        const store = transaction.objectStore('catalog');
        const catIdx = store.index('catalogId');
        const now = new Date();
        let savedRecord = null;

        transaction.oncomplete = () => resolve(savedRecord);
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error || new Error('Transaksi dibatalkan'));

        const cleanName = String((item && item.name) || '').trim();
        if (!cleanName) {
          transaction.abort();
          reject(new Error('Nama layanan wajib diisi'));
          return;
        }

        const cleanGameId = String((item && item.gameId) || '').trim();
        if (!cleanGameId) {
          transaction.abort();
          reject(new Error('Game wajib dipilih'));
          return;
        }

        const cleanType = (item && item.type === 'topup') ? 'topup' : 'joki';
        const cleanPrice = Math.max(0, Number(item && item.price) || 0);

        function tryInsert(preferredId) {
          const candidate = preferredId || buildCandidateCatalogId(now);
          const checkReq = catIdx.getKey(candidate);
          checkReq.onsuccess = () => {
            if (checkReq.result !== undefined) {
              tryInsert(null);
              return;
            }
            const record = {
              catalogId: candidate,
              name: cleanName,
              type: cleanType,
              gameId: cleanGameId,
              price: cleanPrice,
              createdAt: (item && item.createdAt) || now,
              updatedAt: now
            };
            const addReq = store.add(record);
            addReq.onsuccess = () => {
              record.id = addReq.result;
              savedRecord = record;
            };
            addReq.onerror = (e) => {
              if (addReq.error && addReq.error.name === 'ConstraintError') {
                e.preventDefault();
                e.stopPropagation();
                tryInsert(null);
              }
            };
          };
        }

        tryInsert((item && item.catalogId) || null);
      });
    });
    _addCatalogQueue = run.catch(() => {});
    return run;
  }

  async function updateCatalogItem(id, itemData) {
    await open();
    const existing = await getCatalogItem(id);
    if (!existing) throw new Error('Item katalog tidak ditemukan');

    const cleanName = itemData.name !== undefined ? String(itemData.name).trim() : existing.name;
    if (!cleanName) throw new Error('Nama layanan wajib diisi');

    const cleanGameId = itemData.gameId !== undefined ? String(itemData.gameId).trim() : existing.gameId;
    if (!cleanGameId) throw new Error('Game wajib dipilih');

    const cleanType = itemData.type !== undefined ? (itemData.type === 'topup' ? 'topup' : 'joki') : existing.type;
    const cleanPrice = itemData.price !== undefined ? Math.max(0, Number(itemData.price) || 0) : existing.price;

    const updated = Object.assign({}, existing, {
      name: cleanName,
      gameId: cleanGameId,
      type: cleanType,
      price: cleanPrice,
      updatedAt: new Date()
    });

    await req2p(tx('catalog', 'readwrite').put(updated));
    return updated;
  }

  async function deleteCatalogItem(id) {
    await open();
    return req2p(tx('catalog', 'readwrite').delete(id));
  }

  async function clearCatalog() {
    await open();
    return req2p(tx('catalog', 'readwrite').clear());
  }

  // Backup & Restore

  function reviveDates(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
      return obj.map(reviveDates);
    }
    const copy = {};
    for (const k of Object.keys(obj)) {
      const val = obj[k];
      if ((k === 'createdAt' || k === 'updatedAt') && typeof val === 'string') {
        const d = new Date(val);
        copy[k] = isNaN(d.getTime()) ? val : d;
      } else if (val && typeof val === 'object') {
        copy[k] = reviveDates(val);
      } else {
        copy[k] = val;
      }
    }
    return copy;
  }

  function validateBackupData(data) {
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'Format file backup tidak valid.' };
    }
    if (data.app !== 'shugen-hub') {
      return { valid: false, error: 'Penanda aplikasi tidak cocok. File ini bukan backup Shugen Hub.' };
    }
    const fileVersion = data.version !== undefined ? data.version : data.schemaVersion;
    if (fileVersion !== DB_VERSION && fileVersion !== 9 && fileVersion !== 8) {
      return {
        valid: false,
        error: 'Versi skema backup (' + fileVersion + ') tidak cocok dengan versi aplikasi saat ini (' + DB_VERSION + ').'
      };
    }
    if (!data.stores || typeof data.stores !== 'object') {
      return { valid: false, error: 'Data store tidak ditemukan di dalam file backup.' };
    }
    return { valid: true, error: null };
  }

  async function exportAllData() {
    await open();
    const storeNames = Array.from(_db.objectStoreNames);
    return new Promise((resolve, reject) => {
      const transaction = _db.transaction(storeNames, 'readonly');
      const storesData = {};

      transaction.onabort = () => reject(transaction.error || new Error('Transaksi export dibatalkan'));
      transaction.onerror = () => reject(transaction.error || new Error('Gagal membaca data dari database'));

      storeNames.forEach((name) => {
        const store = transaction.objectStore(name);
        const req = store.getAll();
        req.onsuccess = () => {
          storesData[name] = req.result || [];
        };
      });

      transaction.oncomplete = () => {
        resolve({
          app: 'shugen-hub',
          version: DB_VERSION,
          schemaVersion: DB_VERSION,
          exportedAt: new Date().toISOString(),
          stores: storesData
        });
      };
    });
  }

  async function importAllData(backupData) {
    await open();
    const validation = validateBackupData(backupData);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const storeNames = Array.from(_db.objectStoreNames);

    return new Promise((resolve, reject) => {
      let finished = false;
      const transaction = _db.transaction(storeNames, 'readwrite');

      transaction.oncomplete = () => {
        finished = true;
        resolve(true);
      };

      transaction.onerror = () => {
        if (!finished) {
          finished = true;
          reject(transaction.error || new Error('Gagal menulis data ke database. Data lama tetap utuh.'));
        }
      };

      transaction.onabort = () => {
        if (!finished) {
          finished = true;
          reject(transaction.error || new Error('Transaksi import dibatalkan. Data lama tetap utuh.'));
        }
      };

      try {
        for (const name of storeNames) {
          const store = transaction.objectStore(name);
          store.clear();
        }

        for (const name of storeNames) {
          const records = backupData.stores[name];
          if (Array.isArray(records)) {
            const store = transaction.objectStore(name);
            for (const item of records) {
              const restored = reviveDates(item);
              store.put(restored);
            }
          }
        }
      } catch (err) {
        try {
          transaction.abort();
        } catch (abortErr) {}
        if (!finished) {
          finished = true;
          reject(err);
        }
      }
    });
  }

  async function clearAllData() {
    await open();
    let currentTheme = await getSetting('theme');
    if (!currentTheme && typeof document !== 'undefined' && document.documentElement && document.documentElement.getAttribute('data-theme') === 'light') {
      currentTheme = 'light';
    }
    const storeNames = Array.from(_db.objectStoreNames);

    return new Promise((resolve, reject) => {
      let finished = false;
      const transaction = _db.transaction(storeNames, 'readwrite');

      transaction.oncomplete = () => {
        finished = true;
        resolve(true);
      };

      transaction.onerror = () => {
        if (!finished) {
          finished = true;
          reject(transaction.error || new Error('Gagal mengosongkan database. Data lama tetap utuh.'));
        }
      };

      transaction.onabort = () => {
        if (!finished) {
          finished = true;
          reject(transaction.error || new Error('Transaksi pengosongan data dibatalkan. Data lama tetap utuh.'));
        }
      };

      try {
        for (const name of storeNames) {
          const store = transaction.objectStore(name);
          store.clear();
        }

        if (currentTheme !== null && currentTheme !== undefined) {
          const settingsStore = transaction.objectStore('settings');
          settingsStore.put({ key: 'theme', value: currentTheme });
        }
      } catch (err) {
        try {
          transaction.abort();
        } catch (abortErr) {}
        if (!finished) {
          finished = true;
          reject(err);
        }
      }
    });
  }

  return {
    open: open,
    orders: {
      getAll: getAllOrders,
      get: getOrder,
      add: addOrder,
      update: updateOrder,
      delete: deleteOrder,
      generateId: generateOrderId,
      clear: clearOrders
    },
    progress: {
      getAll: getAllProgress,
      get: getProgress,
      save: saveProgress,
      delete: deleteProgress,
      clear: clearProgress,
      calcPercentage: calcPercentage
    },
    incomes: {
      getAll: getAllIncomes,
      get: getIncome,
      getByOrderId: getIncomesByOrderId,
      add: addIncome,
      update: updateIncome,
      delete: deleteIncome,
      clear: clearIncomes
    },
    expenses: {
      getAll: getAllExpenses,
      get: getExpense,
      getByOrderId: getExpensesByOrderId,
      getByCategoryId: getExpensesByCategoryId,
      add: addExpense,
      update: updateExpense,
      delete: deleteExpense,
      clear: clearExpenses
    },
    invoices: {
      getAll: getAllInvoices,
      get: getInvoice,
      getByOrderId: getInvoiceByOrderId,
      getByNumber: getInvoiceByNumber,
      add: addInvoice,
      updateNote: updateInvoiceNote,
      delete: deleteInvoice,
      deleteByOrderId: deleteInvoiceByOrderId,
      clear: clearInvoices
    },
    customers: {
      getAll: getAllCustomers,
      get: getCustomer,
      add: addCustomer,
      update: updateCustomer,
      delete: deleteCustomer,
      clear: clearCustomers
    },
    games: {
      getAll: getAllGames,
      get: getGame,
      getByGameId: getGameByGameId,
      add: addGame,
      update: updateGame,
      delete: deleteGame,
      clear: clearGames
    },
    partners: {
      getAll: getAllPartners,
      get: getPartner,
      getByPartnerId: getPartnerByPartnerId,
      add: addPartner,
      update: updatePartner,
      delete: deletePartner,
      clear: clearPartners
    },
    catalog: {
      getAll: getAllCatalog,
      get: getCatalogItem,
      getByCatalogId: getCatalogItemByCatalogId,
      getByGameId: getCatalogItemsByGameId,
      add: addCatalogItem,
      update: updateCatalogItem,
      delete: deleteCatalogItem,
      clear: clearCatalog
    },
    categories: {
      getAll: getAllExpenseCategories,
      add: addExpenseCategory,
      update: updateExpenseCategory,
      delete: deleteExpenseCategory,
      clear: clearExpenseCategories,
      init: initExpenseCategories
    },
    payment: {
      getAll: getAllPaymentMethods,
      add: addPaymentMethod,
      update: updatePaymentMethod,
      delete: deletePaymentMethod,
      clear: clearPaymentMethods,
      init: initPaymentMethods
    },
    settings: {
      get: getSetting,
      set: setSetting,
      getAll: getAllSettings
    },
    templates: {
      get: (key) => getSetting('wa_template_' + key),
      set: (key, val) => setSetting('wa_template_' + key, val)
    },
    cash: {
      get: getCashSetting,
      set: setCashSetting,
      clear: clearCashSettings
    },
    backup: {
      exportData: exportAllData,
      importData: importAllData,
      validate: validateBackupData
    },
    clearAllData: clearAllData,
    version: DB_VERSION
  };
})();

