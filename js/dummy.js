const DummyData = (function () {

  const PAYMENT_METHODS = [
    'Transfer BCA', 'Transfer BRI', 'DANA', 'GoPay', 'Cash'
  ];

  const EXPENSE_CATEGORIES = [
    'Modal Topup', 'Gaji Worker', 'Kas', 'Operasional', 'Lainnya'
  ];

  const GAMES = [
    {
      gameId: 'GAM-261011-M7K2',
      name: 'Mobile Legends',
      createdAt: new Date('2026-10-11T08:00:00')
    },
    {
      gameId: 'GAM-261011-G4P9',
      name: 'Genshin Impact',
      createdAt: new Date('2026-10-11T08:05:00')
    },
    {
      gameId: 'GAM-261011-V8T3',
      name: 'Valorant',
      createdAt: new Date('2026-10-11T08:10:00')
    },
    {
      gameId: 'GAM-261011-F2W6',
      name: 'Free Fire',
      createdAt: new Date('2026-10-11T08:15:00')
    },
    {
      gameId: 'GAM-261011-H9N4',
      name: 'Honkai: Star Rail',
      createdAt: new Date('2026-10-11T08:20:00')
    }
  ];

  const PARTNERS = [
    {
      partnerId: 'PRT-261011-R7K3',
      name: 'Reza Fauzi',
      phone: '0812-9988-7711',
      bankName: 'BCA',
      accountNumber: '0001234567',
      accountHolder: 'Reza Fauzi',
      defaultShareType: 'percent',
      defaultShareValue: 70,
      isActive: true,
      note: 'Spesialis joki MLBB rank Epic sampai Mythic Glory',
      createdAt: new Date('2026-10-11T07:30:00')
    },
    {
      partnerId: 'PRT-261011-D4M8',
      name: 'Dimas Setiawan',
      phone: '0857-4433-2211',
      bankName: 'DANA',
      accountNumber: '085744332211',
      accountHolder: 'Dimas Setiawan',
      defaultShareType: 'nominal',
      defaultShareValue: 15000,
      isActive: true,
      note: 'Partner supplier topup game cepat',
      createdAt: new Date('2026-10-11T07:45:00')
    },
    {
      partnerId: 'PRT-261012-B9P2',
      name: 'Bima Santika',
      phone: '0821-6677-8899',
      bankName: 'Bank Mandiri',
      accountNumber: '000987654321',
      accountHolder: 'Bima Santika',
      defaultShareType: 'percent',
      defaultShareValue: 60,
      isActive: true,
      note: 'Spesialis joki Genshin Abyss dan eksplorasi map',
      createdAt: new Date('2026-10-12T08:00:00')
    },
    {
      partnerId: 'PRT-261012-A3T6',
      name: 'Arif Wibowo',
      phone: '0813-1122-3344',
      bankName: 'GoPay',
      accountNumber: '081311223344',
      accountHolder: 'Arif Wibowo',
      defaultShareType: 'percent',
      defaultShareValue: 70,
      isActive: false,
      note: 'Sedang cuti kuliah semester akhir',
      createdAt: new Date('2026-10-12T08:15:00')
    },
    {
      partnerId: 'PRT-261013-G1K5',
      name: 'Gilang Ramadhan',
      phone: '0856-2233-4455',
      bankName: '',
      accountNumber: '',
      accountHolder: '',
      defaultShareType: '',
      defaultShareValue: null,
      isActive: true,
      note: 'Partner baru untuk joki Valorant',
      createdAt: new Date('2026-10-13T09:00:00')
    }
  ];

  const CATALOG = [
    {
      catalogId: 'CTL-261011-M1K1',
      name: 'Weekly Diamond Pass',
      type: 'topup',
      gameId: 'GAM-261011-M7K2',
      price: 28000,
      createdAt: new Date('2026-10-11T08:30:00')
    },
    {
      catalogId: 'CTL-261011-M1K2',
      name: '86 Diamonds',
      type: 'topup',
      gameId: 'GAM-261011-M7K2',
      price: 20000,
      createdAt: new Date('2026-10-11T08:35:00')
    },
    {
      catalogId: 'CTL-261011-M1K3',
      name: 'Push rank Epic ke Legend',
      type: 'joki',
      gameId: 'GAM-261011-M7K2',
      price: 150000,
      createdAt: new Date('2026-10-11T08:40:00')
    },
    {
      catalogId: 'CTL-261011-M1K4',
      name: 'Push rank Legend ke Mythic',
      type: 'joki',
      gameId: 'GAM-261011-M7K2',
      price: 220000,
      createdAt: new Date('2026-10-11T08:45:00')
    },
    {
      catalogId: 'CTL-261011-G2P1',
      name: 'Blessing of the Welkin Moon',
      type: 'topup',
      gameId: 'GAM-261011-G4P9',
      price: 65000,
      createdAt: new Date('2026-10-11T08:50:00')
    },
    {
      catalogId: 'CTL-261011-G2P2',
      name: 'Spiral Abyss Floor 9-12 Full Star',
      type: 'joki',
      gameId: 'GAM-261011-G4P9',
      price: 75000,
      createdAt: new Date('2026-10-11T08:55:00')
    },
    {
      catalogId: 'CTL-261011-V3T1',
      name: '1000 Valorant Points',
      type: 'topup',
      gameId: 'GAM-261011-V8T3',
      price: 115000,
      createdAt: new Date('2026-10-11T09:00:00')
    },
    {
      catalogId: 'CTL-261011-V3T2',
      name: 'Push rank Silver ke Gold',
      type: 'joki',
      gameId: 'GAM-261011-V8T3',
      price: 200000,
      createdAt: new Date('2026-10-11T09:05:00')
    },
    {
      catalogId: 'CTL-261011-F4W1',
      name: 'Membership Mingguan',
      type: 'topup',
      gameId: 'GAM-261011-F2W6',
      price: 30000,
      createdAt: new Date('2026-10-11T09:10:00')
    },
    {
      catalogId: 'CTL-261011-H5N1',
      name: 'Express Supply Pass',
      type: 'topup',
      gameId: 'GAM-261011-H9N4',
      price: 65000,
      createdAt: new Date('2026-10-11T09:15:00')
    },
    {
      catalogId: 'CTL-261011-H5N2',
      name: 'Memory of Chaos Full Star',
      type: 'joki',
      gameId: 'GAM-261011-H9N4',
      price: 80000,
      createdAt: new Date('2026-10-11T09:20:00')
    }
  ];

  const INITIAL_CASH_BALANCE = 500000;

  const ORDERS = [
    {
      orderId: 'SGN-261011-K7M4',
      customerName: 'Budi Santoso',
      type: 'joki',
      gameId: 'GAM-261011-M7K2',
      detail: 'Push rank Epic ke Legend, hero Lancelot/Ling',
      price: 150000,
      status: 'selesai',
      paymentMethod: 'Transfer BCA',
      deadline: null,
      createdAt: new Date('2026-10-11T09:30:00'),
      updatedAt: new Date('2026-10-12T14:00:00'),
      partnerId: 'PRT-261011-R7K3',
      partnerShareType: 'percent',
      partnerShareValue: 70,
      partnerShareAmount: 105000,
      partnerPaid: true,
      partnerPaidAt: '2026-10-12'
    },
    {
      orderId: 'SGN-261011-R9W2',
      customerName: 'Siti Rahayu',
      type: 'topup',
      gameId: 'GAM-261011-G4P9',
      detail: 'Welkin Moon + 300 Genesis Crystal',
      price: 95000,
      status: 'selesai',
      paymentMethod: 'DANA',
      deadline: null,
      createdAt: new Date('2026-10-11T11:15:00'),
      updatedAt: new Date('2026-10-11T11:30:00'),
      partnerId: 'PRT-261011-D4M8',
      partnerShareType: 'nominal',
      partnerShareValue: 15000,
      partnerShareAmount: 15000,
      partnerPaid: true,
      partnerPaidAt: '2026-10-11'
    },
    {
      orderId: 'SGN-261012-4H8P',
      customerName: 'Andi Pratama',
      type: 'joki',
      gameId: 'GAM-261011-V8T3',
      detail: 'Push rank Silver ke Gold',
      price: 200000,
      status: 'diproses',
      paymentMethod: 'Transfer BRI',
      deadline: '2026-10-13T14:00',
      createdAt: new Date('2026-10-12T08:00:00'),
      updatedAt: new Date('2026-10-12T08:30:00'),
      partnerId: 'PRT-261011-R7K3',
      partnerShareType: 'percent',
      partnerShareValue: 70,
      partnerShareAmount: 140000,
      partnerPaid: false,
      partnerPaidAt: null
    },
    {
      orderId: 'SGN-261012-C8Y2',
      customerName: 'Budi Santoso',
      type: 'joki',
      gameId: 'GAM-261011-M7K2',
      detail: 'Push rank Legend IV ke Mythic',
      price: 180000,
      status: 'selesai',
      paymentMethod: 'Transfer BCA',
      deadline: null,
      createdAt: new Date('2026-10-12T16:00:00'),
      updatedAt: new Date('2026-10-13T12:00:00'),
      partnerId: 'PRT-261011-R7K3',
      partnerShareType: 'percent',
      partnerShareValue: 70,
      partnerShareAmount: 126000,
      partnerPaid: false,
      partnerPaidAt: null
    },
    {
      orderId: 'SGN-261012-X3N6',
      customerName: 'Dewi Lestari',
      type: 'topup',
      gameId: 'GAM-261011-F2W6',
      detail: '2180 Diamond',
      price: 300000,
      status: 'menunggu_bayar',
      paymentMethod: 'GoPay',
      deadline: null,
      createdAt: new Date('2026-10-12T10:45:00'),
      updatedAt: new Date('2026-10-12T10:45:00'),
      partnerId: null,
      partnerShareType: null,
      partnerShareValue: 0,
      partnerShareAmount: 0,
      partnerPaid: false,
      partnerPaidAt: null
    },
    {
      orderId: 'SGN-261012-T5V9',
      customerName: 'Rizky Hidayat',
      type: 'joki',
      gameId: 'GAM-261011-M7K2',
      detail: 'Push rank Grandmaster ke Epic',
      price: 100000,
      status: 'dibatalkan',
      paymentMethod: 'Cash',
      deadline: null,
      createdAt: new Date('2026-10-12T13:00:00'),
      updatedAt: new Date('2026-10-12T15:00:00'),
      partnerId: 'PRT-261012-A3T6',
      partnerShareType: 'percent',
      partnerShareValue: 70,
      partnerShareAmount: 70000,
      partnerPaid: false,
      partnerPaidAt: null
    },
    {
      orderId: 'SGN-261013-B6Q8',
      customerName: 'Fajar Nugroho',
      type: 'topup',
      gameId: 'GAM-261011-M7K2',
      detail: '571 Diamond',
      price: 140000,
      status: 'menunggu_bayar',
      paymentMethod: 'Transfer BCA',
      deadline: '2026-10-15',
      createdAt: new Date('2026-10-13T07:20:00'),
      updatedAt: new Date('2026-10-13T07:20:00'),
      partnerId: null,
      partnerShareType: null,
      partnerShareValue: 0,
      partnerShareAmount: 0,
      partnerPaid: false,
      partnerPaidAt: null
    },
    {
      orderId: 'SGN-261013-L2C7',
      customerName: 'Maya Putri',
      type: 'joki',
      gameId: 'GAM-261011-G4P9',
      detail: 'Clear Spiral Abyss Floor 12',
      price: 250000,
      status: 'diproses',
      paymentMethod: 'DANA',
      deadline: '2026-10-14T15:00',
      createdAt: new Date('2026-10-13T08:10:00'),
      updatedAt: new Date('2026-10-13T08:30:00'),
      partnerId: 'PRT-261012-B9P2',
      partnerShareType: 'percent',
      partnerShareValue: 60,
      partnerShareAmount: 150000,
      partnerPaid: false,
      partnerPaidAt: null
    },
    {
      orderId: 'SGN-261013-J4Z3',
      customerName: 'Hendra Wijaya',
      type: 'topup',
      gameId: 'GAM-261011-H9N4',
      detail: 'Oneiric Shard 3280',
      price: 800000,
      status: 'menunggu_bayar',
      paymentMethod: 'Transfer BRI',
      deadline: '2026-10-19',
      createdAt: new Date('2026-10-13T09:00:00'),
      updatedAt: new Date('2026-10-13T09:00:00'),
      partnerId: null,
      partnerShareType: null,
      partnerShareValue: 0,
      partnerShareAmount: 0,
      partnerPaid: false,
      partnerPaidAt: null
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
    ],
    'SGN-261012-C8Y2': [
      { id: 'demo-5-1', name: 'Push Legend IV ke II', done: true },
      { id: 'demo-5-2', name: 'Push Legend II ke Mythic', done: true }
    ]
  };

  const INCOMES = [
    {
      incomeId: 'MSK-261012-K8M1',
      date: '2026-10-12',
      amount: 180000,
      paymentMethod: 'Transfer BCA',
      orderId: 'SGN-261012-C8Y2',
      note: 'Pelunasan joki Legend ke Mythic',
      createdAt: new Date('2026-10-12T16:05:00')
    },
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

  const INVOICES = [
    {
      invoiceNumber: 'INV-261011-K7M4',
      orderId: 'SGN-261011-K7M4',
      issueDate: '2026-10-11',
      note: 'Terima kasih atas pesanannya. Garansi rank bintang bertahan 7 hari.'
    },
    {
      invoiceNumber: 'INV-261011-R9W2',
      orderId: 'SGN-261011-R9W2',
      issueDate: '2026-10-11',
      note: 'Topup via UID resmi server Asia, 100% legal dan anti-minus.'
    },
    {
      invoiceNumber: 'INV-261012-4H8P',
      orderId: 'SGN-261012-4H8P',
      issueDate: '2026-10-12',
      note: 'DP 50% diterima (Rp 100.000). Sisa pelunasan saat rank Gold 1 tercapai.'
    },
    {
      invoiceNumber: 'INV-261012-T5V9',
      orderId: 'SGN-261012-T5V9',
      issueDate: '2026-10-12',
      note: 'Pesanan dibatalkan oleh pelanggan. Dokumen arsip internal toko.'
    }
  ];

  const CUSTOMERS = [
    {
      customerId: 'PLG-261011-K4T2',
      name: 'Budi Santoso',
      contact: 'WhatsApp: 0812-3456-7891',
      note: 'Pelanggan setia joki Mobile Legends',
      isSubscriber: true,
      createdAt: new Date('2026-10-11T09:00:00')
    },
    {
      customerId: 'PLG-261011-R8N5',
      name: 'Siti Rahayu',
      contact: 'WhatsApp: 0857-1122-3344',
      note: 'Rutin topup bulanan Genshin Impact',
      isSubscriber: true,
      createdAt: new Date('2026-10-11T11:00:00')
    },
    {
      customerId: 'PLG-261012-P3M7',
      name: 'Andi Pratama',
      contact: 'Discord: @andipratama',
      note: 'Sering main Valorant kompetitif',
      isSubscriber: false,
      createdAt: new Date('2026-10-12T07:45:00')
    },
    {
      customerId: 'PLG-261012-L9X4',
      name: 'Dewi Lestari',
      contact: 'WhatsApp: 0878-9988-7766',
      note: 'Topup Free Fire event kolaborasi',
      isSubscriber: false,
      createdAt: new Date('2026-10-12T10:30:00')
    },
    {
      customerId: 'PLG-261012-H6W2',
      name: 'Rizky Hidayat',
      contact: 'WhatsApp: 0813-5544-3322',
      note: 'Pernah batalkan pesanan joki MLBB',
      isSubscriber: false,
      createdAt: new Date('2026-10-12T12:50:00')
    },
    {
      customerId: 'PLG-261013-N2B8',
      name: 'Fajar Nugroho',
      contact: 'Telegram: @fajarnug',
      note: 'Topup diamond MLBB cepat',
      isSubscriber: false,
      createdAt: new Date('2026-10-13T07:15:00')
    },
    {
      customerId: 'PLG-261013-C5Y1',
      name: 'Maya Putri',
      contact: 'WhatsApp: 0821-4455-6677',
      note: 'Langganan joki Abyss Floor 12 tiap reset',
      isSubscriber: true,
      createdAt: new Date('2026-10-13T08:00:00')
    },
    {
      customerId: 'PLG-261013-W7D9',
      name: 'Hendra Wijaya',
      contact: 'WhatsApp: 0856-7788-9900',
      note: 'Topup pack Oneiric Shard HSR',
      isSubscriber: false,
      createdAt: new Date('2026-10-13T08:50:00')
    }
  ];

  async function load() {
    await ShugenDB.orders.clear();
    await ShugenDB.progress.clear();
    await ShugenDB.incomes.clear();
    await ShugenDB.expenses.clear();
    await ShugenDB.invoices.clear();
    await ShugenDB.customers.clear();
    await ShugenDB.partners.clear();
    await ShugenDB.catalog.clear();
    await ShugenDB.games.clear();
    await ShugenDB.categories.clear();
    await ShugenDB.payment.clear();

    await ShugenDB.settings.set('shopName', 'Shugen Store');
    await ShugenDB.settings.set('shopContact', 'WhatsApp: 0812-3456-7890');

    for (const name of PAYMENT_METHODS) {
      await ShugenDB.payment.add(name);
    }

    for (const p of PARTNERS) {
      await ShugenDB.partners.add(p);
    }

    const categoryIdByName = {};
    for (const name of EXPENSE_CATEGORIES) {
      const cat = await ShugenDB.categories.add(name);
      if (cat) {
        categoryIdByName[cat.name] = cat.id;
      }
    }

    for (const g of GAMES) {
      await ShugenDB.games.add(g);
    }

    for (const item of CATALOG) {
      await ShugenDB.catalog.add(item);
    }

    for (const cust of CUSTOMERS) {
      await ShugenDB.customers.add(cust);
    }

    function formatRelativeYmd(daysOffset) {
      const d = new Date();
      d.setDate(d.getDate() + daysOffset);
      const yyyy = String(d.getFullYear());
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return yyyy + '-' + mm + '-' + dd;
    }

    const now = new Date();
    const todayHour = now.getHours() < 15 ? '15:00' : (now.getHours() < 23 ? '23:00' : '23:59');
    const dynamicDeadlines = {
      'SGN-261012-4H8P': formatRelativeYmd(-1) + 'T14:00', // Terlambat
      'SGN-261013-L2C7': formatRelativeYmd(0) + 'T' + todayHour, // Hari ini
      'SGN-261013-B6Q8': formatRelativeYmd(1), // Besok
      'SGN-261013-J4Z3': formatRelativeYmd(5), // Jauh
      'SGN-261012-X3N6': null // Tanpa deadline
    };

    for (const order of ORDERS) {
      const orderCopy = Object.assign({}, order);
      if (Object.prototype.hasOwnProperty.call(dynamicDeadlines, order.orderId)) {
        orderCopy.deadline = dynamicDeadlines[order.orderId];
      }
      await ShugenDB.orders.add(orderCopy);
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

    for (const inv of INVOICES) {
      await ShugenDB.invoices.add(inv);
    }

    await ShugenDB.cash.set('initialBalance', INITIAL_CASH_BALANCE);
  }

  return { load: load };
})();
