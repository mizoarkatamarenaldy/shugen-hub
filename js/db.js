const ShugenDB = (function () {
  const DB_NAME = 'shugen-hub';
  const DB_VERSION = 2;
  let _db = null;

  const DEFAULT_PAYMENT_METHODS = [
    'Transfer Bank', 'DANA', 'GoPay', 'OVO', 'Cash'
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

  function buildCandidateOrderId(date) {
    const now = date || new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += ID_CHARS.charAt(Math.floor(Math.random() * ID_CHARS.length));
    }
    return 'SGN-' + yy + mm + dd + '-' + code;
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
              game: order.game,
              detail: order.detail || '',
              price: Number(order.price) || 0,
              status: order.status || 'menunggu_bayar',
              paymentMethod: order.paymentMethod || '',
              createdAt: order.createdAt || now,
              updatedAt: now,
              customerId: null
            };
            const addReq = store.add(record);
            addReq.onsuccess = () => {
              record.id = addReq.result;
              savedRecord = record;
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

  // Payment methods

  async function getAllPaymentMethods() {
    await open();
    return req2p(tx('paymentMethods', 'readonly').getAll());
  }

  async function addPaymentMethod(name) {
    await open();
    const trimmed = name.trim();
    if (!trimmed) return null;
    const key = await req2p(tx('paymentMethods', 'readwrite').add({ name: trimmed }));
    return { id: key, name: trimmed };
  }

  async function updatePaymentMethod(id, name) {
    await open();
    const trimmed = name.trim();
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
      set: setSetting
    }
  };
})();
