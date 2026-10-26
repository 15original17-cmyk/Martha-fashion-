import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '50mb' })); // Support multiple photos uploaded from mobile gallery
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Enable CORS for all clients (Web, PWA, Android APK file:/// origin)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-code');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const port = Number(process.env.PORT) || 3000;

// Data directory & db.json path
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');
const UPLOADS_DIR = path.resolve(DATA_DIR, 'uploads');

// Ensure data and uploads directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve uploaded media statically
app.use('/uploads', express.static(UPLOADS_DIR));

// Initial seed data for Martha Fashion
const INITIAL_DB = {
  settings: {
    nom_boutique: "MARTHA FASHION",
    slogan: "L'élégance qui vous ressemble",
    logo: "",
    whatsapp: "+228 91 77 88 43",
    telephone: "+228 91 77 88 43",
    localisation: "Djagblé — Lomé, Togo",
    reseaux_sociaux: {
      instagram: "@marthafashion.officiel",
      facebook: "Martha Fashion Djagblé",
      tiktok: "@marthafashion"
    },
    code_admin: "70661398"
  },
  categories: [
    {
      id: "cat-femme",
      nom: "Femme",
      slug: "femme",
      image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "cat-homme",
      nom: "Homme",
      slug: "homme",
      image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "cat-enfant",
      nom: "Enfant",
      slug: "enfant",
      image: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "cat-sur-mesure",
      nom: "Sur mesure",
      slug: "sur-mesure",
      image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: "cat-accessoires",
      nom: "Accessoires",
      slug: "accessoires",
      image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80"
    }
  ],
  products: [
    {
      id: "prod-robe-wax",
      nom: "Robe wax",
      description: "Robe d'exception en pagne wax de premier choix, coupe élégante et finitions haute couture à l'atelier de Djagblé.",
      prix: 15000,
      categorie: "Femme",
      photos: [
        "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80"
      ],
      tailles: ["S", "M", "L", "XL", "Sur-mesure"],
      couleurs: ["Motif Wax Doré", "Bleu Roi", "Terracotta"],
      disponible: true,
      populaire: true,
      nouveau: true,
      promo: false,
      date_creation: "2026-03-01T10:00:00.000Z"
    },
    {
      id: "prod-costume-homme",
      nom: "Costume homme",
      description: "Costume contemporain deux pièces pour homme en tissu noble et finitions soignées, idéal cérémonies et réceptions.",
      prix: 25000,
      categorie: "Homme",
      photos: [
        "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=800&q=80"
      ],
      tailles: ["M", "L", "XL", "XXL", "Sur-mesure"],
      couleurs: ["Noir Profond", "Bazin Doré", "Bleu Nuit"],
      disponible: true,
      populaire: true,
      nouveau: true,
      promo: false,
      date_creation: "2026-03-05T14:30:00.000Z"
    },
    {
      id: "prod-tenue-enfant",
      nom: "Tenue enfant",
      description: "Ensemble festif et confortable pour enfant confectionné en tissu traditionnel doux avec finitions brodées.",
      prix: 8000,
      categorie: "Enfant",
      photos: [
        "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&w=800&q=80"
      ],
      tailles: ["2-4 ans", "5-7 ans", "8-10 ans", "11-14 ans"],
      couleurs: ["Jaune & Doré", "Bleu Ciel", "Wax Panaché"],
      disponible: true,
      populaire: false,
      nouveau: true,
      promo: false,
      date_creation: "2026-03-10T12:00:00.000Z"
    },
    {
      id: "prod-3",
      nom: "Tailleur Pantalon Impératrice",
      description: "Veste croisée structurée et pantalon palazzo taille haute. Tissu crêpe de luxe avec détails boutons dorés signature Martha Fashion.",
      prix: 28000,
      categorie: "Femme",
      photos: [
        "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80"
      ],
      tailles: ["S", "M", "L", "XL"],
      couleurs: ["Noir & Or", "Blanc Pur", "Émeraude"],
      disponible: true,
      populaire: false,
      nouveau: true,
      promo: true,
      date_creation: "2026-03-10T09:15:00.000Z"
    },
    {
      id: "prod-4",
      nom: "Confection Robe de Mariée / Gala Sur-Mesure",
      description: "Service de haute couture privée avec Martha. Prise de mensurations à Djagblé ou en ligne, choix des étoffes d'exception (dentelle française, wax exclusif, perlage).",
      prix: 85000,
      categorie: "Sur mesure",
      photos: [
        "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=800&q=80"
      ],
      tailles: ["Sur-mesure absolu"],
      couleurs: ["Personnalisée au choix"],
      disponible: true,
      populaire: true,
      nouveau: false,
      promo: false,
      date_creation: "2026-02-15T11:00:00.000Z"
    },
    {
      id: "prod-5",
      nom: "Chemise Homme Sahélienne en Lin Pur",
      description: "Chemise manches courtes chic avec bande pectorale en tissage artisanal kente/bogolan noir et doré. Idéale pour les réceptions et sorties élégantes.",
      prix: 18000,
      categorie: "Homme",
      photos: [
        "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80"
      ],
      tailles: ["M", "L", "XL", "XXL"],
      couleurs: ["Blanc & Or", "Noir & Bronze"],
      disponible: true,
      populaire: false,
      nouveau: false,
      promo: true,
      date_creation: "2026-03-08T16:00:00.000Z"
    },
    {
      id: "prod-6",
      nom: "Ensemble Cérémonie Petite Reine",
      description: "Adorable robe fillette avec jupon évasé en tulle doublé et bustier en wax festif. Confortable et féerique pour mariages et fêtes de famille.",
      prix: 15000,
      categorie: "Enfant",
      photos: [
        "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&w=800&q=80"
      ],
      tailles: ["4 ans", "6 ans", "8 ans", "10 ans", "12 ans"],
      couleurs: ["Rose Poudré & Or", "Jaune Solaire"],
      disponible: true,
      populaire: false,
      nouveau: true,
      promo: false,
      date_creation: "2026-03-12T08:00:00.000Z"
    },
    {
      id: "prod-7",
      nom: "Sac Pochette Haute Joaillerie Perlé",
      description: "Pochette de soirée entièrement brodée à la main de perles dorées et onyx. Fermoir magnétique précieux et chaînette dorée amovible.",
      prix: 16000,
      categorie: "Accessoires",
      photos: [
        "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80"
      ],
      tailles: ["Taille unique"],
      couleurs: ["Or Miroir", "Noir Scintillant"],
      disponible: true,
      populaire: true,
      nouveau: false,
      promo: false,
      date_creation: "2026-02-28T17:20:00.000Z"
    },
    {
      id: "prod-8",
      nom: "Foulard Soie & Mousseline Martha Élite",
      description: "Grand foulard carré en soie satinée. Parfait comme coiffe africaine de gala ou drapé sur les épaules pour illuminer une tenue sobre.",
      prix: 7500,
      categorie: "Accessoires",
      photos: [
        "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=800&q=80"
      ],
      tailles: ["90x90 cm"],
      couleurs: ["Motifs Noirs & Or"],
      disponible: true,
      populaire: false,
      nouveau: false,
      promo: true,
      date_creation: "2026-03-02T12:00:00.000Z"
    }
  ],
  orders: [
    {
      id: "ord-1",
      numero_commande: "MF-2026-001",
      nom_client: "Koffi Akouvi",
      telephone: "+228 91 22 33 44",
      produit: "Robe Sirène Royale en Wax & Soie",
      taille: "M",
      couleur: "Doré & Noir",
      quantite: 1,
      prix: 35000,
      lieu: "Djagblé (près de la pharmacie)",
      message: "Besoin de la robe pour la cérémonie de samedi prochain.",
      statut: "Confirmée",
      date_commande: "2026-03-12T14:20:00.000Z"
    },
    {
      id: "ord-2",
      numero_commande: "MF-2026-002",
      nom_client: "Mensah Komlan",
      telephone: "+228 90 88 77 66",
      produit: "Ensemble Boubou Moderne Prince Noir",
      taille: "L",
      couleur: "Noir Profond",
      quantite: 1,
      prix: 45000,
      lieu: "Lomé Agoè / Retrait Djagblé",
      message: "Je passerai directement essayer à l'atelier.",
      statut: "Nouvelle",
      date_commande: "2026-03-13T09:45:00.000Z"
    }
  ]
};

// Database helper
function loadDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DB, null, 2), 'utf-8');
      return INITIAL_DB;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      settings: { ...INITIAL_DB.settings, ...(parsed.settings || {}) },
      categories: parsed.categories || INITIAL_DB.categories,
      products: parsed.products || INITIAL_DB.products,
      orders: parsed.orders || INITIAL_DB.orders
    };
  } catch (err) {
    console.error('Error reading db.json:', err);
    return INITIAL_DB;
  }
}

function saveDB(dbData: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing to db.json:', err);
    return false;
  }
}

// ----------------- API ENDPOINTS -----------------

const sanitizeCode = (val: any): string => {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/[\u200B-\u200D\uFEFF\u00A0\r\n\t]/g, '')
    .trim();
};

// Admin authentication middleware for protected mutations
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const db = loadDB();
  const configuredCode = sanitizeCode(db.settings?.code_admin || '70661398');
  const rawProvided = req.headers['x-admin-code'] ||
    (req.headers['authorization'] ? String(req.headers['authorization']).replace(/^Bearer\s+/i, '') : '') ||
    req.body?.admin_code;
  const provided = sanitizeCode(rawProvided);

  const isMatch = (a: string, b: string) => a === b || a.toLowerCase() === b.toLowerCase();

  if (provided && (isMatch(provided, configuredCode) || isMatch(provided, '70661398') || isMatch(provided, 'martha2024'))) {
    return next();
  }
  return res.status(403).json({ error: "Accès refusé : Action réservée à l'administrateur Martha Fashion." });
}

// Active Server-Sent Events (SSE) connections for instant real-time synchronization
let sseClients: express.Response[] = [];

app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders?.();

  sseClients.push(res);

  // Send initial connected payload
  const db = loadDB();
  const { code_admin, ...safeSettings } = db.settings || {};
  res.write(`data: ${JSON.stringify({
    type: 'connected',
    products: db.products || [],
    categories: db.categories || [],
    settings: safeSettings,
    timestamp: Date.now()
  })}\n\n`);

  req.on('close', () => {
    sseClients = sseClients.filter((client) => client !== res);
  });
});

function broadcastSync(event: string, meta?: any) {
  const db = loadDB();
  const { code_admin, ...safeSettings } = db.settings || {};
  const payload = JSON.stringify({
    type: event,
    products: db.products || [],
    categories: db.categories || [],
    settings: safeSettings,
    timestamp: Date.now(),
    meta
  });

  sseClients.forEach((client) => {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch (err) {
      // client disconnected
    }
  });
}

// Global Sync endpoint (atomic sync of products, categories, and settings)
app.get('/api/sync', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  const db = loadDB();
  const { code_admin, ...safeSettings } = db.settings || {};
  res.json({
    products: db.products || [],
    categories: db.categories || [],
    settings: safeSettings,
    timestamp: Date.now()
  });
});

// Photo Upload to central server storage
app.post('/api/upload', requireAdmin, (req, res) => {
  try {
    const { image, filename } = req.body;
    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: 'Données image manquantes' });
    }

    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Format base64 invalide' });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    let ext = 'jpg';
    if (mimeType.includes('png')) ext = 'png';
    else if (mimeType.includes('webp')) ext = 'webp';
    else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = 'jpg';

    const cleanName = filename ? path.basename(filename, path.extname(filename)).replace(/[^a-zA-Z0-9_-]/g, '') : 'martha';
    const finalFilename = `${cleanName}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.${ext}`;
    const filePath = path.resolve(UPLOADS_DIR, finalFilename);

    fs.writeFileSync(filePath, buffer);

    res.json({
      success: true,
      url: `/uploads/${finalFilename}`,
      filename: finalFilename
    });
  } catch (err: any) {
    console.error('Upload error:', err);
    res.status(500).json({ error: "Erreur lors de l'enregistrement de la photo" });
  }
});

// Settings (Public settings without secret credentials)
app.get('/api/settings', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  const db = loadDB();
  const { code_admin, ...safeSettings } = db.settings || {};
  res.json(safeSettings);
});

app.put('/api/settings', requireAdmin, (req, res) => {
  const db = loadDB();
  const currentCode = sanitizeCode(db.settings?.code_admin || '70661398');
  const newCode = req.body.code_admin ? sanitizeCode(req.body.code_admin) : currentCode;
  
  db.settings = {
    ...db.settings,
    ...req.body,
    code_admin: newCode || currentCode || '70661398'
  };
  saveDB(db);
  const { code_admin, ...safeSettings } = db.settings;
  broadcastSync('settings_updated', { updated: true });
  res.json({ success: true, settings: safeSettings });
});

// Admin verify (No credentials exposed)
app.post('/api/admin/login', (req, res) => {
  const { code } = req.body;
  const db = loadDB();
  const configuredCode = sanitizeCode(db.settings?.code_admin || '70661398');
  const cleanInput = sanitizeCode(code);

  const isMatch = (a: string, b: string) => a === b || a.toLowerCase() === b.toLowerCase();

  // Validate against configured code, official code 70661398, and legacy martha2024
  if (
    cleanInput &&
    (isMatch(cleanInput, configuredCode) ||
      isMatch(cleanInput, '70661398') ||
      isMatch(cleanInput, 'martha2024'))
  ) {
    res.json({ success: true, authenticated: true, code: configuredCode || '70661398' });
  } else {
    res.status(401).json({ success: false, message: 'Code administrateur incorrect' });
  }
});

// Products
app.get('/api/products', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  const db = loadDB();
  res.json(db.products);
});

app.post('/api/products', requireAdmin, (req, res) => {
  const db = loadDB();
  const newProduct = {
    id: 'prod-' + Date.now(),
    nom: req.body.nom || 'Nouvelle création',
    description: req.body.description || '',
    prix: Number(req.body.prix) || 0,
    categorie: req.body.categorie || 'Femme',
    // Never substitute another product's photo: only keep valid user photos or empty array for elegant placeholder
    photos: Array.isArray(req.body.photos) && req.body.photos.length > 0
      ? req.body.photos.filter((p: any) => typeof p === 'string' && p.trim())
      : [],
    tailles: Array.isArray(req.body.tailles) ? req.body.tailles : ['S', 'M', 'L'],
    couleurs: Array.isArray(req.body.couleurs) ? req.body.couleurs : ['Noir', 'Or'],
    disponible: req.body.disponible !== false,
    populaire: !!req.body.populaire,
    nouveau: req.body.nouveau !== false,
    promo: !!req.body.promo,
    date_creation: new Date().toISOString()
  };

  db.products.unshift(newProduct);
  saveDB(db);
  broadcastSync('product_created', { product: newProduct });
  res.status(201).json(newProduct);
});

app.put('/api/products/:id', requireAdmin, (req, res) => {
  const db = loadDB();
  const index = db.products.findIndex((p: any) => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Produit non trouvé' });
  }

  db.products[index] = {
    ...db.products[index],
    ...req.body,
    id: req.params.id // prevent id override
  };
  saveDB(db);
  broadcastSync('product_updated', { product: db.products[index] });
  res.json(db.products[index]);
});

app.delete('/api/products/:id', requireAdmin, (req, res) => {
  const db = loadDB();
  db.products = db.products.filter((p: any) => p.id !== req.params.id);
  saveDB(db);
  broadcastSync('product_deleted', { id: req.params.id });
  res.json({ success: true });
});

// Categories
app.get('/api/categories', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  const db = loadDB();
  res.json(db.categories);
});

app.post('/api/categories', requireAdmin, (req, res) => {
  const db = loadDB();
  const newCat = {
    id: 'cat-' + Date.now(),
    nom: req.body.nom || 'Nouvelle catégorie',
    slug: (req.body.nom || 'categorie').toLowerCase().replace(/\s+/g, '-'),
    image: req.body.image || 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80'
  };
  db.categories.push(newCat);
  saveDB(db);
  broadcastSync('category_created', { category: newCat });
  res.status(201).json(newCat);
});

app.put('/api/categories/:id', requireAdmin, (req, res) => {
  const db = loadDB();
  const index = db.categories.findIndex((c: any) => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Catégorie non trouvée' });
  }
  db.categories[index] = {
    ...db.categories[index],
    ...req.body,
    id: req.params.id
  };
  saveDB(db);
  broadcastSync('category_updated', { category: db.categories[index] });
  res.json(db.categories[index]);
});

app.delete('/api/categories/:id', requireAdmin, (req, res) => {
  const db = loadDB();
  db.categories = db.categories.filter((c: any) => c.id !== req.params.id);
  saveDB(db);
  broadcastSync('category_deleted', { id: req.params.id });
  res.json({ success: true });
});

// Orders
app.get('/api/orders', (req, res) => {
  const db = loadDB();
  res.json(db.orders);
});

app.post('/api/orders', (req, res) => {
  const db = loadDB();
  const count = db.orders.length + 1;
  const numPad = String(count).padStart(3, '0');
  const numero_commande = `MF-${new Date().getFullYear()}-${numPad}`;

  const newOrder = {
    id: 'ord-' + Date.now(),
    numero_commande,
    nom_client: req.body.nom_client || 'Client anonyme',
    telephone: req.body.telephone || '',
    produit: req.body.produit || 'Produit Martha Fashion',
    taille: req.body.taille || 'Standard',
    couleur: req.body.couleur || 'Standard',
    quantite: Number(req.body.quantite) || 1,
    prix: Number(req.body.prix) || 0,
    lieu: req.body.lieu || 'Djagblé',
    message: req.body.message || '',
    statut: 'Nouvelle', // Nouvelle -> Confirmée -> Terminée -> Annulée
    date_commande: new Date().toISOString()
  };

  db.orders.unshift(newOrder);
  saveDB(db);
  res.status(201).json(newOrder);
});

app.patch('/api/orders/:id/status', (req, res) => {
  const { statut } = req.body;
  const db = loadDB();
  const index = db.orders.findIndex((o: any) => o.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Commande non trouvée' });
  }
  db.orders[index].statut = statut;
  saveDB(db);
  res.json(db.orders[index]);
});

app.delete('/api/orders/:id', (req, res) => {
  const db = loadDB();
  db.orders = db.orders.filter((o: any) => o.id !== req.params.id);
  saveDB(db);
  res.json({ success: true });
});

// Reset initial data endpoint (useful in admin)
app.post('/api/admin/reset-demo', (req, res) => {
  saveDB(INITIAL_DB);
  res.json({ success: true, message: 'Base réinitialisée' });
});

// Download compiled installable Android APK (release)
app.get(['/martha-fashion.apk', '/download/apk', '/api/download-apk'], (req, res) => {
  const apkPath = path.resolve(__dirname, 'public', 'martha-fashion.apk');
  if (fs.existsSync(apkPath)) {
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', 'attachment; filename="martha-fashion.apk"');
    res.setHeader('Cache-Control', 'no-cache');
    return res.sendFile(apkPath);
  }
  return res.status(404).json({ error: 'Fichier APK non trouvé' });
});

// Download Android Kotlin Jetpack Compose project zip
app.get(['/martha-fashion-android.zip', '/api/download-android-zip'], (req, res) => {
  const zipPath = path.resolve(__dirname, 'public', 'martha-fashion-android.zip');
  if (fs.existsSync(zipPath)) {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="martha-fashion-android.zip"');
    return res.sendFile(zipPath);
  }
  return res.status(404).json({ error: 'Fichier zip non trouvé' });
});
// Digital Asset Links for TWA / PWABuilder / Google verification
app.get(['/.well-known/assetlinks.json', '/assetlinks.json'], (req, res) => {
  const assetPath = path.resolve(__dirname, 'public', '.well-known', 'assetlinks.json');
  if (fs.existsSync(assetPath)) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.sendFile(assetPath);
  }
  return res.status(404).json({ error: 'assetlinks.json non trouvé' });
});

// PWA Manifest endpoint
app.get(['/manifest.json', '/manifest.webmanifest'], (req, res) => {
  const manifestPath = path.resolve(__dirname, 'public', 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    res.setHeader('Content-Type', 'application/manifest+json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.sendFile(manifestPath);
  }
  return res.status(404).json({ error: 'manifest.json non trouvé' });
});

// PWA Service Worker endpoint
app.get(['/sw.js', '/service-worker.js'], (req, res) => {
  const swPath = path.resolve(__dirname, 'public', 'sw.js');
  if (fs.existsSync(swPath)) {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Service-Worker-Allowed', '/');
    res.setHeader('Cache-Control', 'no-cache');
    return res.sendFile(swPath);
  }
  return res.status(404).send('Service worker not found');
});

// Server startup
async function startServer() {
  // Serve public folder for static assets (icons, apk, zips, manifest)
  app.use(express.static(path.resolve(__dirname, 'public')));

  const distDir = path.resolve(__dirname, 'dist');
  const distIndex = path.resolve(distDir, 'index.html');
  const rootIndex = path.resolve(__dirname, 'index.html');

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(distDir));
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    // Development SPA fallback
    app.get('*', async (req, res, next) => {
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'Endpoint API non trouvé', path: req.path });
      }
      if (path.extname(req.path)) {
        return res.status(404).send('Fichier statique non trouvé');
      }
      try {
        let template = fs.readFileSync(rootIndex, 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  } else {
    app.use(express.static(distDir));

    // Production SPA fallback
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'Endpoint API non trouvé', path: req.path });
      }
      if (path.extname(req.path)) {
        return res.status(404).send('Fichier statique non trouvé');
      }
      if (fs.existsSync(distIndex)) {
        return res.sendFile(distIndex);
      }
      return next();
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`MARTHA FASHION server running on http://0.0.0.0:${port}`);
  });
}

startServer();
