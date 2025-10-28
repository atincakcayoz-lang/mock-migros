// mock-migros.js
// === Migros ChatGPT PoC Backend ===
// Özellikler:
// - Ürün kataloğu (1000 ürün mock)
// - Sepet oluşturma, sepete ekleme, sepet görüntüleme
// - Adresler, teslimat slotları
// - Checkout (sipariş oluşturma + order_id)
// - Sipariş durumu
// - OpenAPI şemasını statik olarak sunma (migros-openapi.json)
// - Localhost'u external dünyaya açabilmen için localtunnel uyumlu

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

// ------------------------------------------------------
// ÜRÜN KATALOĞU OLUŞTURUCU
// ------------------------------------------------------

const CATEGORY_TEMPLATES = [
  {
    category: "Meyve & Sebze",
    baseItems: [
      { name: "Domates", desc: "Taze salkım domates", min: 24, max: 48 },
      { name: "Salatalık", desc: "Kıvırcık salatalık", min: 18, max: 35 },
      { name: "Soğan Kuru", desc: "Yemeklik kuru soğan", min: 10, max: 20 },
      { name: "Patates", desc: "Yemeklik patates", min: 12, max: 28 },
      { name: "Elma Starking", desc: "Kırmızı elma", min: 20, max: 40 },
      { name: "Elma Granny Smith", desc: "Yeşil ekşi elma", min: 22, max: 45 },
      { name: "Muz", desc: "İthal muz", min: 28, max: 55 },
      { name: "Limon", desc: "Taze limon", min: 15, max: 30 },
      { name: "Biber Çarliston", desc: "Yeşil çarliston biber", min: 30, max: 60 },
      { name: "Maydanoz Demet", desc: "Taze maydanoz demet", min: 5, max: 12 }
    ],
    variants: ["Kg", "500g", "Seçme", "Paket"]
  },
  {
    category: "Süt & Kahvaltı",
    baseItems: [
      { name: "Süt Tam Yağlı 1L", desc: "Pastörize tam yağlı süt", min: 15, max: 30 },
      { name: "Süt Yarım Yağlı 1L", desc: "Pastörize yarım yağlı süt", min: 15, max: 30 },
      { name: "Süt Laktozsuz 1L", desc: "Laktozsuz süt", min: 20, max: 38 },
      { name: "Yoğurt 1KG", desc: "Tam yağlı yoğurt", min: 35, max: 70 },
      { name: "Beyaz Peynir", desc: "Tam yağlı beyaz peynir", min: 60, max: 140 },
      { name: "Tereyağı", desc: "Tuzlu tereyağı", min: 80, max: 180 },
      { name: "Yumurta 10'lu", desc: "Serbest gezen", min: 40, max: 80 }
    ],
    variants: ["Organik", "Light", "Trakya", "İthal", "Ekonomik Paket", "Aile Boy"]
  },
  {
    category: "Et / Tavuk / Balık",
    baseItems: [
      { name: "Tavuk Göğüs", desc: "Dilimlenmiş tavuk göğüs", min: 80, max: 140 },
      { name: "Tavuk But", desc: "Kemikli tavuk but", min: 60, max: 110 },
      { name: "Kıyma Dana %20 Yağlı", desc: "Günlük çekim dana kıyma", min: 220, max: 340 },
      { name: "Kuzu Pirzola", desc: "Taze kuzu pirzola", min: 420, max: 650 },
      { name: "Somon Dilim", desc: "Norveç somon fileto", min: 300, max: 480 }
    ],
    variants: ["Kg", "Marine", "Izgaralık", "Aile Paketi", "Ekstra Yağsız"]
  },
  {
    category: "Fırın & Temel Gıda",
    baseItems: [
      { name: "Ekmek Beyaz 250g", desc: "Günlük taze ekmek", min: 8, max: 15 },
      { name: "Tam Buğday Ekmeği", desc: "Yüksek lifli", min: 15, max: 30 },
      { name: "Makarna Spagetti 500g", desc: "Durum buğdayı makarna", min: 20, max: 40 },
      { name: "Pirinç Baldo 1KG", desc: "Pilavlık baldo pirinç", min: 60, max: 110 },
      { name: "Un 2KG", desc: "Çok amaçlı un", min: 45, max: 80 },
      { name: "Ayçiçek Yağı 1L", desc: "Rafine ayçiçek yağı", min: 70, max: 130 },
      { name: "Zeytinyağı Sızma 1L", desc: "Naturel sızma", min: 200, max: 380 }
    ],
    variants: ["Ekonomik Paket", "Aile Boy", "Glutensiz", "Tam Tahıl", "Taş Değirmen"]
  },
  {
    category: "İçecek",
    baseItems: [
      { name: "Kola 1L", desc: "Gazlı içecek", min: 20, max: 45 },
      { name: "Kola 2.5L", desc: "Aile boy gazlı içecek", min: 35, max: 70 },
      { name: "Ayran 300ml", desc: "Hazır ayran", min: 8, max: 18 },
      { name: "Maden Suyu 6'lı", desc: "Doğal mineralli su", min: 25, max: 50 },
      { name: "Su 5L", desc: "İçme suyu", min: 25, max: 40 },
      { name: "Portakal Suyu %100 1L", desc: "Katkısız meyve suyu", min: 35, max: 60 },
      { name: "Enerji İçeceği 250ml", desc: "Kafeinli içecek", min: 25, max: 50 }
    ],
    variants: ["Şekersiz", "Light", "Limonlu", "Kan Portakalı", "Sade", "Vitamin Destekli"]
  },
  {
    category: "Atıştırmalık & Çikolata",
    baseItems: [
      { name: "Sütlü Çikolata 80g", desc: "Kakao oranı yüksek sütlü çikolata", min: 20, max: 45 },
      { name: "Bitter Çikolata 80g", desc: "70% kakao bitter çikolata", min: 25, max: 55 },
      { name: "Cips Klasik 150g", desc: "Tuzlu patates cipsi", min: 30, max: 60 },
      { name: "Cips Acı Biber 150g", desc: "Baharatlı patates cipsi", min: 30, max: 60 },
      { name: "Karışık Kuruyemiş 200g", desc: "Kavrulmuş karışık kuruyemiş", min: 70, max: 140 },
      { name: "Fındık İçi 150g", desc: "Kavrulmuş fındık içi", min: 90, max: 180 }
    ],
    variants: ["Aile Paketi", "Mini Boy", "Fırında", "Tuzsuz", "Acılı", "Fıstıklı", "Fındıklı"]
  },
  {
    category: "Temizlik",
    baseItems: [
      { name: "Bulaşık Deterjanı 750ml", desc: "Elde yıkama için bulaşık deterjanı", min: 40, max: 90 },
      { name: "Çamaşır Deterjanı 4KG", desc: "Toz deterjan renkli çamaşırlar için", min: 160, max: 320 },
      { name: "Yumuşatıcı 1.5L", desc: "Çamaşır yumuşatıcı", min: 80, max: 160 },
      { name: "Yüzey Temizleyici 1L", desc: "Genel yüzey temizleyici", min: 50, max: 110 },
      { name: "Tuvalet Kağıdı 24'lü", desc: "Çift katlı tuvalet kağıdı", min: 150, max: 260 },
      { name: "Kağıt Havlu 6'lı", desc: "Dayanıklı kağıt havlu", min: 70, max: 140 }
    ],
    variants: ["Lavantalı", "Hassas Cilt", "Parfümsüz", "Ultra Emici", "Ekonomik Paket"]
  },
  {
    category: "Kişisel Bakım",
    baseItems: [
      { name: "Şampuan 400ml", desc: "Kepeğe karşı şampuan", min: 70, max: 140 },
      { name: "Duş Jeli 500ml", desc: "Nemlendirici duş jeli", min: 60, max: 120 },
      { name: "Diş Macunu 75ml", desc: "Beyazlatıcı diş macunu", min: 45, max: 90 },
      { name: "Tıraş Bıçağı 4'lü", desc: "Çoklu bıçaklı tıraş seti", min: 90, max: 200 },
      { name: "Deodorant Sprey", desc: "Ter kokusuna karşı koruma", min: 80, max: 160 },
      { name: "Islak Mendil 90'lı", desc: "Alkol içermeyen ıslak mendil", min: 25, max: 55 }
    ],
    variants: ["Extra Fresh", "Sensitive", "Aloe Vera", "Sport", "Kids", "Parfümsüz"]
  },
  {
    category: "Bebek",
    baseItems: [
      { name: "Bebek Bezi No:2 Mini", desc: "3-6 kg", min: 260, max: 380 },
      { name: "Bebek Bezi No:3 Midi", desc: "4-9 kg", min: 260, max: 400 },
      { name: "Bebek Islak Mendil 72'li", desc: "Hassas cilt için", min: 40, max: 80 },
      { name: "Bebek Maması 250g", desc: "Sütlü tahıl karışımı", min: 90, max: 160 },
      { name: "Devam Sütü 800g", desc: "9+ ay bebekler için", min: 300, max: 480 }
    ],
    variants: ["Jumbo Paket", "Sensitive", "Hipoalerjenik", "Gece", "Ekonomik", "Aloe Vera"]
  }
];

function randomPrice(min, max) {
  const val = min + Math.random() * (max - min);
  return Math.round(val * 10) / 10;
}

function randomStock() {
  return Math.floor(10 + Math.random() * 200);
}

function buildProductCatalog(targetSize = 1000) {
  const products = [];
  let globalIdCounter = 1000;

  while (products.length < targetSize) {
    for (const cat of CATEGORY_TEMPLATES) {
      for (const base of cat.baseItems) {
        for (const variant of cat.variants) {
          const id = "P" + globalIdCounter++;
          products.push({
            id,
            category: cat.category,
            name: `${base.name} - ${variant}`,
            description: `${base.desc} (${variant})`,
            price: randomPrice(base.min, base.max),
            currency: "TRY",
            stock: randomStock(),
            image: `https://placehold.co/300x200?text=${encodeURIComponent(base.name)}`
          });
          if (products.length >= targetSize) break;
        }
        if (products.length >= targetSize) break;
      }
      if (products.length >= targetSize) break;
    }
  }

  return products;
}

const PRODUCTS = buildProductCatalog(1000);

// ------------------------------------------------------
// EXPRESS APP
// ------------------------------------------------------

const app = express();
app.use(bodyParser.json());

// Statik servis: aynı klasördeki dosyaları direkt yayınla.
// Bu sayede migros-openapi.json dosyasına dışarıdan GET atılabilecek.
app.use(express.static(path.join(__dirname)));

const PORT = process.env.PORT || 4000;
const HOST = '0.0.0.0';

// ------------------------------------------------------
// HEALTH
// ------------------------------------------------------
app.get('/', (req, res) => {
  res.json({ message: 'Mock Migros API çalışıyor 🚀' });
});

// ------------------------------------------------------
// PRODUCTS
// ------------------------------------------------------
app.get('/products', (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  const limit = parseInt(req.query.limit || '20', 10);

  let items = PRODUCTS;

  if (q) {
    items = items.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    );
  }

  res.json({
    count: items.length,
    results: items.slice(0, limit)
  });
});

// ------------------------------------------------------
// CARTS & ORDERS (in-memory store)
// ------------------------------------------------------
const CARTS = {};
const ORDERS = {};

// Yeni sepet oluştur
app.post('/cart', (req, res) => {
  const cartId = 'C' + Date.now();
  CARTS[cartId] = { id: cartId, items: [], total: 0, currency: 'TRY' };
  res.status(201).json(CARTS[cartId]);
});

// Sepete ürün ekle
app.post('/cart/:cartId/items', (req, res) => {
  const { cartId } = req.params;
  const { productId, quantity } = req.body;

  if (!CARTS[cartId]) {
    return res.status(404).json({ error: 'Cart not found' });
  }

  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const qty = Number(quantity) || 1;
  const lineTotal = product.price * qty;

  CARTS[cartId].items.push({
    productId: product.id,
    name: product.name,
    price: product.price,
    qty,
    lineTotal
  });

  CARTS[cartId].total = CARTS[cartId].items.reduce(
    (acc, i) => acc + i.lineTotal,
    0
  );

  res.status(200).json(CARTS[cartId]);
});

// Sepeti görüntüle
app.get('/cart/:cartId', (req, res) => {
  const { cartId } = req.params;
  const cart = CARTS[cartId];
  if (!cart) {
    return res.status(404).json({ error: 'Cart not found' });
  }
  res.json(cart);
});

// ------------------------------------------------------
// ADDRESSES
// ------------------------------------------------------
app.get('/addresses', (req, res) => {
  res.json([
    {
      id: 'addr_home',
      nickname: 'Ev',
      line1: 'Çamlıca Mah. 42/5',
      city: 'İstanbul',
      postcode: '34000'
    },
    {
      id: 'addr_office',
      nickname: 'Ofis',
      line1: 'Levent Plaza D:15',
      city: 'İstanbul',
      postcode: '34330'
    }
  ]);
});

// ------------------------------------------------------
// DELIVERY SLOTS
// ------------------------------------------------------
app.get('/delivery_slots', (req, res) => {
  const { address_id } = req.query;
  if (!address_id) {
    return res.status(400).json({ error: 'address_id gerekli' });
  }

  const slots = [
    { id: 'slot-18', label: '18:00 - 19:00', fee: 0 },
    { id: 'slot-20', label: '20:00 - 21:00', fee: 9.9 },
    { id: 'slot-22', label: '22:00 - 23:00', fee: 0 }
  ];

  res.json({
    address_id,
    slots
  });
});

// ------------------------------------------------------
// CHECKOUT
// ------------------------------------------------------
//
// Beklenen body:
// {
//   "cart_id": "C1761631966981",
//   "address_id": "addr_home",
//   "slot_id": "slot-20",
//   "payment_token": "tok_demo_123"
// }
app.post('/checkout', (req, res) => {
  const { cart_id, address_id, slot_id, payment_token } = req.body;

  // Sepet kontrol
  const cart = CARTS[cart_id];
  if (!cart) {
    return res.status(400).json({ error: 'invalid_cart' });
  }

  // Mock ödeme kontrol (sadece string var mı bakıyoruz)
  if (!payment_token || typeof payment_token !== 'string') {
    return res.status(400).json({ error: 'invalid_payment' });
  }

  // Siparişi oluştur
  const orderId = 'ORD-' + Date.now();
  const eta = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 saat sonrası tahmini teslim

  ORDERS[orderId] = {
    id: orderId,
    cart,
    address_id,
    slot_id,
    status: 'CONFIRMED',
    created_at: new Date().toISOString(),
    eta: eta.toISOString()
  };

  // Sepeti kapat
  delete CARTS[cart_id];

  // Cevap
  res.json({
    order_id: orderId,
    status: 'CONFIRMED',
    eta: eta.toISOString(),
    message: `Sipariş alındı. Tahmini teslimat: ${eta.toLocaleString('tr-TR')}`
  });
});

// ------------------------------------------------------
// ORDER STATUS
// ------------------------------------------------------
app.get('/order/:orderId', (req, res) => {
  const { orderId } = req.params;
  const order = ORDERS[orderId];
  if (!order) {
    return res.status(404).json({ error: 'order_not_found' });
  }
  res.json(order);
});

// ------------------------------------------------------
// LISTEN
// ------------------------------------------------------
app.listen(PORT, HOST, () => {
  console.log(`Mock Migros API http://${HOST}:${PORT} adresinde çalışıyor`);
  console.log(`OpenAPI şeman: http://localhost:${PORT}/migros-openapi.json`);
  console.log(`(localtunnel ile yayına açıp bu URL'yi ChatGPT Actions'a verebilirsin)`);
});
