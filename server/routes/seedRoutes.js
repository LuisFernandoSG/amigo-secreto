const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Family = require('../models/Family');
const { signToken } = require('../middleware/auth');
const { generateSecretSantaAssignments } = require('../utils/secretSantaDraw');

const router = express.Router();

const DEMO_USERNAMES = ['carlos', 'elena', 'lucia', 'mateo', 'carmen'];
const DEMO_FAMILY_CODES = ['GARCIA26', 'PRIMOS26'];

function isDemoEnabled() {
  const val = String(process.env.SEED_DEMO || 'false').trim().toLowerCase();
  return val === 'true' || val === '1' || val === 'yes';
}

async function cleanupDemoData() {
  try {
    await Family.deleteMany({ code: { $in: DEMO_FAMILY_CODES } });
    await User.deleteMany({ username: { $in: DEMO_USERNAMES } });
  } catch (err) {
    console.error('Error limpiando datos demo:', err.message);
  }
}

async function ensureDemoData() {
  if (!isDemoEnabled()) {
    await cleanupDemoData();
    return;
  }

  const count = await User.countDocuments();
  if (count > 0) return;

  console.log('Creando datos iniciales de demostración navideña en MongoDB...');
  const passwordHash = await bcrypt.hash('navidad', 10);

  const usersData = [
    {
      name: 'Carlos García (Creador)',
      username: 'carlos',
      passwordHash,
      avatar: 'santa',
      bio: 'Me encanta la tecnología, el buen café de grano y los juegos de mesa para jugar en Nochebuena.',
      sizes: {
        shirt: 'M / L',
        pants: '32',
        shoes: '42 EU / 27 MX',
        favoriteColor: 'Verde pino y negro',
        snacksAndDrinks: 'Chocolate amargo 70%, pistachos y café colombiano',
        avoidOrAllergies: 'Ninguna alergia',
      },
    },
    {
      name: 'Mamá Elena',
      username: 'elena',
      passwordHash,
      avatar: 'mrs_claus',
      bio: 'Amante de las plantas, las velas aromáticas de canela y las novelas históricas.',
      sizes: {
        shirt: 'M',
        pants: '38',
        shoes: '37 EU / 24 MX',
        favoriteColor: 'Rojo vino y dorado',
        snacksAndDrinks: 'Galletas danesas de mantequilla y té chai',
        avoidOrAllergies: 'Perfumes demasiado dulces',
      },
    },
    {
      name: 'Lucía García',
      username: 'lucia',
      passwordHash,
      avatar: 'reindeer',
      bio: 'Fotografía, viajes, skincare coreano y accesorios bonitos para el invierno.',
      sizes: {
        shirt: 'S',
        pants: '28',
        shoes: '38 EU / 24.5 MX',
        favoriteColor: 'Lavanda y beige',
        snacksAndDrinks: 'Matcha latte, chocolates Ferrero Rocher',
        avoidOrAllergies: 'Alérgica al maní / cacahuate',
      },
    },
    {
      name: 'Tío Mateo',
      username: 'mateo',
      passwordHash,
      avatar: 'elf',
      bio: 'Maestro parrillero de la familia, fan del fútbol y de las herramientas prácticas.',
      sizes: {
        shirt: 'XL',
        pants: '36',
        shoes: '43 EU / 28 MX',
        favoriteColor: 'Azul marino',
        snacksAndDrinks: 'Quesos maduros, frutos secos y vino tinto',
        avoidOrAllergies: 'Nada en especial',
      },
    },
    {
      name: 'Abuela Carmen',
      username: 'carmen',
      passwordHash,
      avatar: 'angel',
      bio: 'La reina de los buñuelos y el ponche navideño. Me gustan las bufandas suaves y los álbumes de fotos.',
      sizes: {
        shirt: 'M',
        pants: 'M',
        shoes: '36 EU / 23.5 MX',
        favoriteColor: 'Crema y azul cielo',
        snacksAndDrinks: 'Turrón de almendra y mazapanes',
        avoidOrAllergies: 'Cosas con mucha azúcar refinada',
      },
    },
  ];

  const createdUsers = await User.insertMany(usersData);
  const [carlos, elena, lucia, mateo, carmen] = createdUsers;

  const memberIds1 = [carlos._id, elena._id, lucia._id, mateo._id, carmen._id];
  const exclusions1 = [
    {
      fromUser: elena._id,
      toUser: carmen._id,
      bidirectional: false,
      reason: 'Ya le dio regalo el año pasado',
    },
  ];
  const assignments1 = generateSecretSantaAssignments(memberIds1, exclusions1);

  await Family.create({
    name: 'Navidad Familia García 2026',
    description: '¡Nuestro tradicional intercambio de Nochebuena! Recuerden envolver su regalo con una tarjeta y una pista.',
    code: 'GARCIA26',
    creator: carlos._id,
    settings: {
      budgetMin: 25,
      budgetMax: 60,
      recommendedAmount: 45,
      currency: 'USD ($)',
      exchangeDate: new Date(new Date().getFullYear(), 11, 24, 21, 30, 0),
      exchangeLocation: 'Casa de la Abuela Carmen · 9:30 PM',
      revealMode: 'immediate',
      revealDate: null,
      customRules:
        '1. El presupuesto sugerido es de $25 a $60.\n2. Revisa la lista de deseos y tallas de quien te toque.\n3. ¡Usa el chat anónimo si necesitas preguntarle algo sin delatarte!',
      themeBanner: 'classic_red',
    },
    members: [
      { user: carlos._id, role: 'admin', nickname: 'Carlos (Organizador)', hasRevealed: false, giftStatus: 'shopping' },
      { user: elena._id, role: 'member', nickname: 'Mamá Elena', hasRevealed: true, revealedAt: new Date(), giftStatus: 'wrapped' },
      { user: lucia._id, role: 'member', nickname: 'Prima Lucía', hasRevealed: true, revealedAt: new Date(), giftStatus: 'ready' },
      { user: mateo._id, role: 'member', nickname: 'Tío Mateo', hasRevealed: false, giftStatus: 'pending' },
      { user: carmen._id, role: 'member', nickname: 'Abuelita Carmen', hasRevealed: true, revealedAt: new Date(), giftStatus: 'wrapped' },
    ],
    exclusions: exclusions1,
    drawStatus: 'completed',
    drawnAt: new Date(),
    drawHistoryCount: 1,
    assignments: assignments1,
    wishlist: [
      {
        user: carlos._id,
        title: 'Audífonos Inalámbricos Sony WH-CH520',
        description: 'En color negro o azul marino para escuchar música trabajando.',
        url: 'https://www.amazon.com/s?k=Sony+WH-CH520',
        storeName: 'Amazon',
        priceEstimate: 48,
        priority: 'dream',
        category: 'tech',
      },
      {
        user: carlos._id,
        title: 'Juego de Mesa Catan o Carcassonne',
        description: 'Para estrenarlo todos juntos después de la cena de Navidad.',
        url: 'https://www.amazon.com/s?k=Catan+Board+Game',
        storeName: 'Amazon',
        priceEstimate: 38,
        priority: 'high',
        category: 'hobbies',
      },
      {
        user: elena._id,
        title: 'Set de Velas Aromáticas de Pino y Canela',
        description: 'Me encantan las velas con aroma a bosque navideño o vainilla.',
        url: 'https://www.amazon.com/s?k=Christmas+Scented+Candles+Gift+Set',
        storeName: 'Amazon',
        priceEstimate: 30,
        priority: 'dream',
        category: 'home',
      },
      {
        user: elena._id,
        title: 'Libro "El Viento Conoce Mi Nombre" - Isabel Allende',
        description: 'Edición de pasta blanda o dura.',
        url: 'https://www.amazon.com/s?k=El+viento+conoce+mi+nombre+Isabel+Allende',
        storeName: 'Amazon',
        priceEstimate: 22,
        priority: 'high',
        category: 'books',
      },
      {
        user: lucia._id,
        title: 'Cámara Instantánea Fujifilm Instax Mini 12 (Blanca o Lila)',
        description: '¡Para tomar fotos instantáneas de toda la familia en Nochebuena!',
        url: 'https://www.amazon.com/s?k=Fujifilm+Instax+Mini+12',
        storeName: 'Amazon',
        priceEstimate: 58,
        priority: 'dream',
        category: 'tech',
      },
      {
        user: lucia._id,
        title: 'Kit de Skincare Coreano Hidratante',
        description: 'Cualquier set hidratante suave.',
        url: 'https://www.amazon.com/s?k=Korean+Skincare+Gift+Set',
        storeName: 'Amazon',
        priceEstimate: 35,
        priority: 'high',
        category: 'beauty',
      },
      {
        user: mateo._id,
        title: 'Set Profesional de Utensilios para Parrilla / Asado en Estuche',
        description: 'Pinzas de acero inoxidable, espátula y termómetro digital de carne.',
        url: 'https://www.amazon.com/s?k=BBQ+Grill+Tool+Set',
        storeName: 'Amazon',
        priceEstimate: 42,
        priority: 'dream',
        category: 'home',
      },
      {
        user: carmen._id,
        title: 'Manta Térmica Suave de Franela Color Crema',
        description: 'Suavecita para leer en el sillón durante diciembre.',
        url: 'https://www.amazon.com/s?k=Cozy+Sherpa+Throw+Blanket',
        storeName: 'Amazon',
        priceEstimate: 32,
        priority: 'dream',
        category: 'home',
      },
    ],
    messages: [
      {
        type: 'family_wall',
        sender: carmen._id,
        text: '¡Qué emoción mis amores! Ya puse mis deseos en la lista, este año los buñuelos corren por mi cuenta.',
      },
      {
        type: 'family_wall',
        sender: mateo._id,
        text: '¡Listo sobrinos! Ya revisé el presupuesto, nadie se quede sin poner links en su lista de deseos.',
      },
    ],
    activityFeed: [
      { text: 'Se realizó el sorteo del Amigo Secreto de la Familia García', icon: '🎲' },
      { text: 'Abuelita Carmen agregó "Manta Térmica Suave" a sus deseos', icon: '⭐' },
    ],
  });

  await Family.create({
    name: 'Posada de Primos & Tíos 2026',
    description: 'Segundo intercambio navideño para la posada del 20 de diciembre.',
    code: 'PRIMOS26',
    creator: lucia._id,
    settings: {
      budgetMin: 15,
      budgetMax: 30,
      recommendedAmount: 20,
      currency: 'USD ($)',
      exchangeDate: new Date(new Date().getFullYear(), 11, 20, 20, 0, 0),
      exchangeLocation: 'Terraza del Tío Mateo · 8:00 PM',
      revealMode: 'immediate',
      revealDate: null,
      customRules: '¡Intercambio de la posada! Vale regalar chocolates artesanales, tazas navideñas, juegos o tarjetas de regalo.',
      themeBanner: 'emerald_forest',
    },
    members: [
      { user: lucia._id, role: 'admin', nickname: 'Lucía (Organizadora)', hasRevealed: false, giftStatus: 'pending' },
      { user: carlos._id, role: 'member', nickname: 'Primo Carlos', hasRevealed: false, giftStatus: 'pending' },
      { user: mateo._id, role: 'member', nickname: 'Tío Mateo', hasRevealed: false, giftStatus: 'pending' },
    ],
    drawStatus: 'pending',
    wishlist: [
      {
        user: carlos._id,
        title: 'Taza Térmica Stanley / Yeti para Café',
        description: 'Para llevar el café caliente por las mañanas.',
        url: 'https://www.amazon.com/s?k=Insulated+Coffee+Tumbler',
        storeName: 'Amazon',
        priceEstimate: 25,
        priority: 'high',
        category: 'home',
      },
      {
        user: lucia._id,
        title: 'Caja de Chocolates Lindt Lindor Surtidos',
        description: '¡Los de envoltura roja y dorada son mis favoritos!',
        url: 'https://www.amazon.com/s?k=Lindt+Lindor+Assorted',
        storeName: 'Amazon',
        priceEstimate: 18,
        priority: 'high',
        category: 'sweets',
      },
    ],
  });

  console.log('Familias de demostración ("GARCIA26" y "PRIMOS26") creadas con éxito.');
}

// Endpoint público para listar usuarios demo (SOLO si SEED_DEMO=true)
router.get('/demo-accounts', async (req, res) => {
  try {
    if (!isDemoEnabled()) {
      return res.json({ demoUsers: [] });
    }
    await ensureDemoData();
    const users = await User.find({ username: { $in: DEMO_USERNAMES } }).select('name username avatar bio');
    return res.json({ demoUsers: users });
  } catch (err) {
    return res.status(500).json({ message: 'Error obteniendo cuentas demo.' });
  }
});

// Login rápido con 1 clic para cuentas demo (SOLO si SEED_DEMO=true)
router.post('/quick-demo-login', async (req, res) => {
  try {
    if (!isDemoEnabled()) {
      return res.status(403).json({ message: 'El modo de demostración está desactivado.' });
    }
    await ensureDemoData();
    const { username = 'carlos' } = req.body;
    const user = await User.findOne({ username: String(username).toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'Cuenta demo no encontrada.' });
    }
    const token = signToken(user);
    return res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
        sizes: user.sizes || {},
      },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Error en acceso rápido demo.' });
  }
});

module.exports = { router, ensureDemoData };
