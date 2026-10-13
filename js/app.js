const App = (function () {
  let orders = [];
  let progressMap = {};
  let currentSteps = [];
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
      await refreshProgressMap();
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

    $('#btn-cancel-order').addEventListener('click', () => {
      $('#order-dialog').close();
    });

    $('#btn-delete-order').addEventListener('click', handleDelete);

    $('#order-dialog').addEventListener('close', () => {
      editingId = null;
      currentSteps = [];
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

  // Order form & detail dialog

  function openOrderForm(id) {
    editingId = id;
    const dialog = $('#order-dialog');
    const form = $('#order-form');
    form.reset();
    $('#step-add-input').value = '';
    populatePaymentSelect();

    if (id !== null) {
      const order = orders.find((o) => o.id === id);
      if (!order) return;
      $('#form-title').textContent = 'Detail Pesanan';
      $('#detail-order-id').textContent = order.orderId;
      $('#detail-order-id').hidden = false;
      $('#field-customer').value = order.customerName;
      $('#field-type').value = order.type;
      $('#field-game').value = order.game;
      $('#field-detail').value = order.detail;
      $('#field-price').value = order.price || '';
      $('#field-payment').value = order.paymentMethod;
      $('#field-status').value = order.status;
      $('#field-status-group').hidden = false;
      $('#btn-delete-order').hidden = false;

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
      $('#field-status').value = 'menunggu_bayar';
      $('#field-status-group').hidden = true;
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
    }
  }

  async function handleDelete() {
    if (editingId === null) return;
    if (!confirm('Hapus pesanan ini?')) return;

    try {
      await ShugenDB.orders.delete(editingId);
      orders = await ShugenDB.orders.getAll();
      await refreshProgressMap();
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
      await refreshProgressMap();
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
