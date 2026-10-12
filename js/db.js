const ShugenDB = (function () {
  const DB_NAME = 'shugen-hub';
  const DB_VERSION = 1;
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
      };

      req.onsuccess = () => {
        _db = req.result;
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

  async function addOrder(order) {
    await open();
    const id = order.orderId || await generateOrderId();
    const now = new Date();
    const record = {
      orderId: id,
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
    const key = await req2p(tx('orders', 'readwrite').add(record));
    record.id = key;
    return record;
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
    return req2p(tx('orders', 'readwrite').delete(id));
  }

  async function generateOrderId() {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const prefix = 'SGN-' + yy + mm + dd;

    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    const all = await getAllOrders();
    const existing = new Set(all.map((o) => o.orderId));

    let candidate = '';
    do {
      let code = '';
      for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      candidate = prefix + '-' + code;
    } while (existing.has(candidate));

    return candidate;
  }

  async function clearOrders() {
    await open();
    return req2p(tx('orders', 'readwrite').clear());
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
