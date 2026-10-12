const App = (function () {
  let orders = [];
  let paymentMethods = [];
  let activeFilter = 'semua';
  let searchQuery = '';
  let editingId = null;
  let statusChangeId = null;

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

  // DOM helpers

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // Initialization

  async function init() {
    showView('loading');
    try {
      await ShugenDB.open();
      paymentMethods = await ShugenDB.payment.init();
      orders = await ShugenDB.orders.getAll();
      await loadTheme();
      render();
      bindEvents();
      registerSW();
      showView('ready');
    } catch (err) {
      console.error(err);
      showView('error');
    }
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
    $('#empty-state').hidden = true;
    $('#empty-filtered').hidden = true;
    $('#order-list').hidden = state !== 'ready';

    if (state === 'ready') {
      const filtered = getFilteredOrders();
      if (orders.length === 0) {
        $('#empty-state').hidden = false;
        $('#order-list').hidden = true;
      } else if (filtered.length === 0) {
        $('#empty-filtered').hidden = false;
        $('#order-list').hidden = true;
      }
    }
  }

  // Filtering and search

  function getFilteredOrders() {
    let list = orders;
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

  // Rendering

  function render() {
    renderTabs();
    renderOrders();
  }

  function renderTabs() {
    $$('.tab').forEach((tab) => {
      tab.classList.toggle('active', tab.dataset.status === activeFilter);
      tab.setAttribute('aria-selected', tab.dataset.status === activeFilter);
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
      card.setAttribute('aria-label',
        order.orderId + ', ' + order.customerName + ', ' + STATUS_LABELS[order.status]
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
        '<div class="order-bottom">' +
          '<span class="order-price">Rp ' + formatPrice(order.price) + '</span>' +
          '<span class="order-date">' + formatDate(new Date(order.createdAt)) + '</span>' +
        '</div>';

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
    $('#search-input').addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderOrders();
    });

    $$('.tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        activeFilter = tab.dataset.status;
        render();
      });
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

    $('#fab-add').addEventListener('click', () => openOrderForm(null));

    $('#order-form').addEventListener('submit', (e) => {
      e.preventDefault();
      saveOrder();
    });

    $('#btn-cancel-order').addEventListener('click', () => {
      $('#order-dialog').close();
    });

    $('#btn-delete-order').addEventListener('click', handleDelete);

    $('#order-dialog').addEventListener('close', () => { editingId = null; });

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

    $('#btn-add-payment').addEventListener('click', addPaymentMethod);
    $('#payment-add-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); addPaymentMethod(); }
    });

    $('#btn-load-demo').addEventListener('click', loadDemoData);

    // Theme
    $('#btn-theme').addEventListener('click', toggleTheme);

    // Close dialogs on Escape (native <dialog> handles this)
    // Close dialogs on backdrop click
    $$('dialog').forEach((d) => {
      d.addEventListener('click', (e) => {
        if (e.target === d) d.close();
      });
    });
  }

  // Order form dialog

  function openOrderForm(id) {
    editingId = id;
    const dialog = $('#order-dialog');
    const form = $('#order-form');
    form.reset();
    populatePaymentSelect();

    if (id !== null) {
      const order = orders.find((o) => o.id === id);
      if (!order) return;
      $('#form-title').textContent = 'Edit Pesanan';
      $('#field-customer').value = order.customerName;
      $('#field-type').value = order.type;
      $('#field-game').value = order.game;
      $('#field-detail').value = order.detail;
      $('#field-price').value = order.price || '';
      $('#field-payment').value = order.paymentMethod;
      $('#field-status').value = order.status;
      $('#field-status-group').hidden = false;
      $('#btn-delete-order').hidden = false;
    } else {
      $('#form-title').textContent = 'Tambah Pesanan';
      $('#field-status').value = 'menunggu_bayar';
      $('#field-status-group').hidden = true;
      $('#btn-delete-order').hidden = true;
    }

    dialog.showModal();
    $('#field-customer').focus();
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

    try {
      if (editingId !== null) {
        await ShugenDB.orders.update(editingId, data);
        toast('Pesanan diperbarui');
      } else {
        await ShugenDB.orders.add(data);
        toast('Pesanan ditambahkan');
      }
      orders = await ShugenDB.orders.getAll();
      render();
      $('#order-dialog').close();
    } catch (err) {
      console.error(err);
      toast('Gagal menyimpan pesanan');
    }
  }

  async function handleDelete() {
    if (editingId === null) return;
    if (!confirm('Hapus pesanan ini?')) return;

    try {
      await ShugenDB.orders.delete(editingId);
      orders = await ShugenDB.orders.getAll();
      render();
      $('#order-dialog').close();
      toast('Pesanan dihapus');
    } catch (err) {
      console.error(err);
      toast('Gagal menghapus pesanan');
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
    renderPaymentList();
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
    const input = $('#payment-add-input');
    const name = input.value.trim();
    if (!name) return;

    try {
      await ShugenDB.payment.add(name);
      paymentMethods = await ShugenDB.payment.getAll();
      input.value = '';
      renderPaymentList();
      toast('Metode ditambahkan');
    } catch (err) {
      console.error(err);
      toast('Gagal menambah metode');
    }
  }

  async function renamePayment(id, newName) {
    const trimmed = newName.trim();
    if (!trimmed) {
      renderPaymentList();
      return;
    }

    try {
      await ShugenDB.payment.update(id, trimmed);
      paymentMethods = await ShugenDB.payment.getAll();
      toast('Metode diperbarui');
    } catch (err) {
      console.error(err);
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

  // Demo data actions

  async function loadDemoData() {
    if (!confirm('Data pesanan yang ada akan dihapus dan diganti dengan data demo. Lanjutkan?')) return;

    try {
      await DummyData.load();
      orders = await ShugenDB.orders.getAll();
      paymentMethods = await ShugenDB.payment.getAll();
      render();
      renderPaymentList();
      toast('Data demo dimuat');
    } catch (err) {
      console.error(err);
      toast('Gagal memuat data demo');
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
