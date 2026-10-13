const DummyData = (function () {

  const PAYMENT_METHODS = [
    'Transfer BCA', 'Transfer BRI', 'DANA', 'GoPay', 'Cash'
  ];

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

  async function load() {
    await ShugenDB.orders.clear();
    await ShugenDB.progress.clear();
    await ShugenDB.payment.clear();

    for (const name of PAYMENT_METHODS) {
      await ShugenDB.payment.add(name);
    }

    for (const order of ORDERS) {
      await ShugenDB.orders.add(order);
      if (order.type === 'joki' && PROGRESS[order.orderId]) {
        await ShugenDB.progress.save(order.orderId, PROGRESS[order.orderId]);
      }
    }
  }

  return { load: load };
})();
