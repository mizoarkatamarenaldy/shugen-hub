const DummyData = (function () {

  const PAYMENT_METHODS = [
    'Transfer BCA', 'Transfer BRI', 'DANA', 'GoPay', 'Cash'
  ];

  const EXPENSE_CATEGORIES = [
    'Modal Topup', 'Gaji Worker', 'Kas', 'Operasional', 'Lainnya'
  ];

  const INITIAL_CASH_BALANCE = 500000;

  const ORDERS = [
    {
      orderId: 'SGN-261011-K7M4',
      customerName: 'Budi Santoso',
      type: 'joki',
      game: 'Mobile Legends',
      detail: 'Push rank Epic ke Legend, hero Lancelot/Ling',
      price: 150000,
      status: 'selesai',
      paymentMethod: 'Transfer BCA',
      createdAt: new Date('2026-10-11T09:30:00'),
      updatedAt: new Date('2026-10-12T14:00:00')
    },
    {
      orderId: 'SGN-261011-R9W2',
      customerName: 'Siti Rahayu',
      type: 'topup',
      game: 'Genshin Impact',
      detail: 'Welkin Moon + 300 Genesis Crystal',
      price: 95000,
      status: 'selesai',
      paymentMethod: 'DANA',
      createdAt: new Date('2026-10-11T11:15:00'),
      updatedAt: new Date('2026-10-11T11:30:00')
    },
    {
      orderId: 'SGN-261012-4H8P',
      customerName: 'Andi Pratama',
      type: 'joki',
      game: 'Valorant',
      detail: 'Push rank Silver ke Gold',
      price: 200000,
      status: 'diproses',
      paymentMethod: 'Transfer BRI',
      createdAt: new Date('2026-10-12T08:00:00'),
      updatedAt: new Date('2026-10-12T08:30:00')
    },
    {
      orderId: 'SGN-261012-X3N6',
      customerName: 'Dewi Lestari',
      type: 'topup',
      game: 'Free Fire',
      detail: '2180 Diamond',
      price: 300000,
      status: 'menunggu_bayar',
      paymentMethod: 'GoPay',
      createdAt: new Date('2026-10-12T10:45:00'),
      updatedAt: new Date('2026-10-12T10:45:00')
    },
    {
      orderId: 'SGN-261012-T5V9',
      customerName: 'Rizky Hidayat',
      type: 'joki',
      game: 'Mobile Legends',
      detail: 'Push rank Grandmaster ke Epic',
      price: 100000,
      status: 'dibatalkan',
      paymentMethod: 'Cash',
      createdAt: new Date('2026-10-12T13:00:00'),
      updatedAt: new Date('2026-10-12T15:00:00')
    },
    {
      orderId: 'SGN-261013-B6Q8',
      customerName: 'Fajar Nugroho',
      type: 'topup',
      game: 'Mobile Legends',
      detail: '571 Diamond',
      price: 140000,
      status: 'menunggu_bayar',
      paymentMethod: 'Transfer BCA',
      createdAt: new Date('2026-10-13T07:20:00'),
      updatedAt: new Date('2026-10-13T07:20:00')
    },
    {
      orderId: 'SGN-261013-L2C7',
      customerName: 'Maya Putri',
      type: 'joki',
      game: 'Genshin Impact',
      detail: 'Clear Spiral Abyss Floor 12',
      price: 250000,
      status: 'diproses',
      paymentMethod: 'DANA',
      createdAt: new Date('2026-10-13T08:10:00'),
      updatedAt: new Date('2026-10-13T08:30:00')
    },
    {
      orderId: 'SGN-261013-J4Z3',
      customerName: 'Hendra Wijaya',
      type: 'topup',
      game: 'Honkai: Star Rail',
      detail: 'Oneiric Shard 3280',
      price: 800000,
      status: 'menunggu_bayar',
      paymentMethod: 'Transfer BRI',
      createdAt: new Date('2026-10-13T09:00:00'),
      updatedAt: new Date('2026-10-13T09:00:00')
    }
  ];

  const PROGRESS = {
    'SGN-261011-K7M4': [
      { id: 'demo-1-1', name: 'Login dan verifikasi akun', done: true },
      { id: 'demo-1-2', name: 'Push Epic V ke Epic III', done: true },
      { id: 'demo-1-3', name: 'Push Epic III ke Epic I', done: true },
      { id: 'demo-1-4', name: 'Promosi ke Legend V', done: true }
    ],
    'SGN-261012-4H8P': [
      { id: 'demo-2-1', name: 'Cek setting akun dan crosshair', done: true },
      { id: 'demo-2-2', name: 'Naik ke Silver 2', done: true },
      { id: 'demo-2-3', name: 'Naik ke Silver 3', done: false },
      { id: 'demo-2-4', name: 'Promosi ke Gold 1', done: false }
    ],
    'SGN-261012-T5V9': [
      { id: 'demo-3-1', name: 'Push Grandmaster V ke III', done: true },
      { id: 'demo-3-2', name: 'Push Grandmaster III ke I', done: false },
      { id: 'demo-3-3', name: 'Promosi ke Epic V', done: false }
    ],
    'SGN-261013-L2C7': [
      { id: 'demo-4-1', name: 'Floor 12 Chamber 1 (3 bintang)', done: true },
      { id: 'demo-4-2', name: 'Floor 12 Chamber 2 (3 bintang)', done: true },
      { id: 'demo-4-3', name: 'Floor 12 Chamber 3 (3 bintang)', done: false }
    ]
  };

  const INCOMES = [
    {
      incomeId: 'MSK-261011-A8D3',
      date: '2026-10-11',
      amount: 150000,
      paymentMethod: 'Transfer BCA',
      orderId: 'SGN-261011-K7M4',
      note: 'Pelunasan langsung joki Epic ke Legend',
      createdAt: new Date('2026-10-11T09:35:00')
    },
    {
      incomeId: 'MSK-261011-F4P6',
      date: '2026-10-11',
      amount: 95000,
      paymentMethod: 'DANA',
      orderId: 'SGN-261011-R9W2',
      note: 'Pembayaran penuh Welkin Moon + 300 GC',
      createdAt: new Date('2026-10-11T11:20:00')
    },
    {
      incomeId: 'MSK-261012-M2Y9',
      date: '2026-10-12',
      amount: 100000,
      paymentMethod: 'Transfer BRI',
      orderId: 'SGN-261012-4H8P',
      note: 'DP 50% joki Valorant Silver ke Gold',
      createdAt: new Date('2026-10-12T08:05:00')
    },
    {
      incomeId: 'MSK-261012-N7W3',
      date: '2026-10-12',
      amount: 100000,
      paymentMethod: 'Transfer BRI',
      orderId: 'SGN-261012-4H8P',
      note: 'Pelunasan joki Valorant Silver ke Gold',
      createdAt: new Date('2026-10-12T16:15:00')
    },
    {
      incomeId: 'MSK-261012-Q5R8',
      date: '2026-10-12',
      amount: 50000,
      paymentMethod: 'Cash',
      orderId: 'SGN-261012-T5V9',
      note: 'DP awal sebelum pesanan dibatalkan',
      createdAt: new Date('2026-10-12T13:10:00')
    },
    {
      incomeId: 'MSK-261013-C9K2',
      date: '2026-10-13',
      amount: 125000,
      paymentMethod: 'DANA',
      orderId: 'SGN-261013-L2C7',
      note: 'DP 50% Spiral Abyss Floor 12',
      createdAt: new Date('2026-10-13T08:15:00')
    },
    {
      incomeId: 'MSK-261013-V6H4',
      date: '2026-10-13',
      amount: 45000,
      paymentMethod: 'Cash',
      orderId: null,
      note: 'Jasa cek dan bind akun langsung di toko',
      createdAt: new Date('2026-10-13T10:30:00')
    }
  ];

  const EXPENSES = [
    {
      expenseId: 'MKL-261011-B3N7',
      date: '2026-10-11',
      amount: 76000,
      categoryName: 'Modal Topup',
      paymentMethod: 'DANA',
      orderId: 'SGN-261011-R9W2',
      note: 'Modal beli Welkin Moon + 300 GC di supplier',
      createdAt: new Date('2026-10-11T11:25:00')
    },
    {
      expenseId: 'MKL-261011-L9R2',
      date: '2026-10-11',
      amount: 50000,
      categoryName: 'Kas',
      paymentMethod: 'Cash',
      orderId: null,
      note: 'Isi kas kecil operasional harian toko',
      createdAt: new Date('2026-10-11T13:00:00')
    },
    {
      expenseId: 'MKL-261012-H5K9',
      date: '2026-10-12',
      amount: 105000,
      categoryName: 'Gaji Worker',
      paymentMethod: 'Transfer BCA',
      orderId: 'SGN-261011-K7M4',
      note: 'Fee worker joki Epic ke Legend',
      createdAt: new Date('2026-10-12T14:15:00')
    },
    {
      expenseId: 'MKL-261012-P8T4',
      date: '2026-10-12',
      amount: 30000,
      categoryName: 'Gaji Worker',
      paymentMethod: 'Cash',
      orderId: 'SGN-261012-T5V9',
      note: 'Kompensasi worker 1 langkah sebelum pesanan dibatalkan',
      createdAt: new Date('2026-10-12T15:20:00')
    },
    {
      expenseId: 'MKL-261012-W4M8',
      date: '2026-10-12',
      amount: 85000,
      categoryName: 'Operasional',
      paymentMethod: 'GoPay',
      orderId: null,
      note: 'Beli kuota internet cadangan untuk tim joki',
      createdAt: new Date('2026-10-12T18:00:00')
    },
    {
      expenseId: 'MKL-261013-D2W6',
      date: '2026-10-13',
      amount: 118000,
      categoryName: 'Modal Topup',
      paymentMethod: 'Transfer BCA',
      orderId: 'SGN-261013-B6Q8',
      note: 'Modal stok 571 Diamond Mobile Legends',
      createdAt: new Date('2026-10-13T07:35:00')
    },
    {
      expenseId: 'MKL-261013-K6J3',
      date: '2026-10-13',
      amount: 150000,
      categoryName: 'Gaji Worker',
      paymentMethod: 'Transfer BRI',
      orderId: null,
      note: 'Gaji shift admin jaga chat mingguan',
      createdAt: new Date('2026-10-13T11:00:00')
    }
  ];

  async function load() {
    await ShugenDB.orders.clear();
    await ShugenDB.progress.clear();
    await ShugenDB.incomes.clear();
    await ShugenDB.expenses.clear();
    await ShugenDB.categories.clear();
    await ShugenDB.payment.clear();

    for (const name of PAYMENT_METHODS) {
      await ShugenDB.payment.add(name);
    }

    const categoryIdByName = {};
    for (const name of EXPENSE_CATEGORIES) {
      const cat = await ShugenDB.categories.add(name);
      if (cat) {
        categoryIdByName[cat.name] = cat.id;
      }
    }

    for (const order of ORDERS) {
      await ShugenDB.orders.add(order);
      if (order.type === 'joki' && PROGRESS[order.orderId]) {
        await ShugenDB.progress.save(order.orderId, PROGRESS[order.orderId]);
      }
    }

    for (const income of INCOMES) {
      await ShugenDB.incomes.add(income);
    }

    for (const expense of EXPENSES) {
      await ShugenDB.expenses.add({
        expenseId: expense.expenseId,
        date: expense.date,
        amount: expense.amount,
        categoryId: categoryIdByName[expense.categoryName],
        paymentMethod: expense.paymentMethod,
        orderId: expense.orderId,
        note: expense.note,
        createdAt: expense.createdAt
      });
    }

    await ShugenDB.cash.set('initialBalance', INITIAL_CASH_BALANCE);
  }

  return { load: load };
})();
