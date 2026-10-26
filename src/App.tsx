/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Sparkles,
  ShoppingBag,
  Send,
  Phone,
  MapPin,
  Clock,
  Search,
  Filter,
  Check,
  CheckCircle2,
  ChevronRight,
  Plus,
  Minus,
  Trash2,
  Edit,
  Shield,
  Layers,
  Settings,
  Image as ImageIcon,
  Upload,
  X,
  ExternalLink,
  MessageCircle,
  TrendingUp,
  Tag,
  ArrowRight,
  Menu,
  Lock,
  LogOut,
  RefreshCw,
  Eye,
  EyeOff,
  AlertCircle,
  Copy,
  Share2,
  Download,
  Smartphone,
  FileCode,
  Wifi,
  WifiOff,
  Maximize2
} from 'lucide-react';
import { auth, signInAdminWithGoogle, signOutAdmin, testConnection, uploadImageToStorage } from './firebase';
import {
  seedInitialDataIfEmpty,
  subscribeToProducts,
  subscribeToCategories,
  subscribeToSettings,
  subscribeToOrders,
  saveProductToFirestore,
  deleteProductFromFirestore,
  createOrderInFirestore,
  updateOrderStatusInFirestore,
  deleteOrderFromFirestore,
  saveSettingsToFirestore,
  verifyAdminRole,
  grantAdminAccess
} from './services/firebaseService';

// Types
export interface Product {
  id: string;
  nom: string;
  description: string;
  prix: number;
  categorie: string;
  photos: string[];
  tailles: string[];
  couleurs: string[];
  disponible: boolean;
  populaire?: boolean;
  nouveau?: boolean;
  promo?: boolean;
  date_creation: string;
}

export interface CartItem {
  id: string;
  product: Product;
  taille: string;
  couleur: string;
  quantite: number;
}

export interface Order {
  id: string;
  numero_commande: string;
  nom_client: string;
  telephone: string;
  produit: string;
  taille: string;
  couleur: string;
  quantite: number;
  prix: number;
  lieu: string;
  message?: string;
  statut: 'Nouvelle' | 'Confirmée' | 'Terminée' | 'Annulée' | 'En attente d\'envoi (Hors-ligne)' | 'Transmise via WhatsApp';
  date_commande: string;
}

export interface Category {
  id: string;
  nom: string;
  slug: string;
  image: string;
}

export interface StoreSettings {
  nom_boutique: string;
  slogan: string;
  logo: string;
  whatsapp: string;
  telephone: string;
  localisation: string;
  reseaux_sociaux: {
    instagram: string;
    facebook: string;
    tiktok: string;
  };
  code_admin: string;
}

// Helpers
const fmtFCFA = (val: number) => {
  return Number(val || 0).toLocaleString('fr-FR') + ' FCFA';
};

const cleanWhatsAppNumber = (numStr: string) => {
  return numStr.replace(/\D/g, '');
};

// API URL resolver (handles both Web/PWA relative paths and Android APK file:/// remote backend)
export const getApiUrl = (endpoint: string): string => {
  const clean = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
    return clean;
  }
  return `https://ais-dev-w4zmunnt4yz2wwv7weeuom-497052180324.europe-west2.run.app${clean}`;
};

// Image URL resolver (converts local uploaded paths to full URLs if on Android APK file:///)
export const resolveImageUrl = (url?: string): string => {
  if (!url) return '';
  if (url.startsWith('/uploads/') || url.startsWith('uploads/')) {
    const clean = url.startsWith('/') ? url : `/${url}`;
    if (typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
      return clean;
    }
    return `https://ais-dev-w4zmunnt4yz2wwv7weeuom-497052180324.europe-west2.run.app${clean}`;
  }
  return url;
};

// Retrieve authenticated admin code for secure central mutations
export const getStoredAdminCode = (): string => {
  if (typeof window === 'undefined') return '70661398';
  return (
    sessionStorage.getItem('martha_admin_code') ||
    localStorage.getItem('martha_admin_code') ||
    '70661398'
  );
};

// Produits initiaux en local (miroir de la base centrale pour démarrage immédiat hors-ligne)
export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "prod-robe-wax",
    nom: "Robe wax",
    description: "Robe d'exception en pagne wax de premier choix, coupe élégante et finitions haute couture à l'atelier de Djagblé.",
    prix: 15000,
    categorie: "Femme",
    photos: [
      "/femme.jpg",
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
];

export const DEFAULT_CATEGORIES: Category[] = [
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
];

export const DEFAULT_SETTINGS: StoreSettings = {
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
};

// Sanitization & comparison helper for admin authentication
export const sanitizeAdminCode = (val: unknown): string => {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/[\u200B-\u200D\uFEFF\u00A0\r\n\t]/g, '')
    .trim();
};

export const checkAdminCodeMatch = (inputCode: string, configuredCode?: string): boolean => {
  const cleanInput = sanitizeAdminCode(inputCode);
  if (!cleanInput) return false;
  
  const targetConfigured = sanitizeAdminCode(configuredCode || '70661398');
  
  // Exact match with configured code (case-insensitive if letters present)
  if (cleanInput === targetConfigured || cleanInput.toLowerCase() === targetConfigured.toLowerCase()) {
    return true;
  }
  
  // Always accept official configured code 70661398
  if (cleanInput === '70661398') {
    return true;
  }
  
  // Backward compatibility fallback for legacy martha2024
  if (cleanInput.toLowerCase() === 'martha2024') {
    return true;
  }
  
  return false;
};

const STORAGE_KEYS = {
  PRODUCTS: 'martha_products_local_v5',
  CATEGORIES: 'martha_categories_local_v5',
  SETTINGS: 'martha_settings_local_v5',
  ORDERS: 'martha_orders_local_v5',
  CART: 'martha_cart_local_v5',
  LAST_SYNC: 'martha_last_sync_v5'
};

const loadLocalProducts = (): Product[] => {
  if (typeof window === 'undefined') return DEFAULT_PRODUCTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
  } catch (e) {}
  return DEFAULT_PRODUCTS;
};

const loadLocalCategories = (): Category[] => {
  if (typeof window === 'undefined') return DEFAULT_CATEGORIES;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
  } catch (e) {}
  return DEFAULT_CATEGORIES;
};

const loadLocalSettings = (): StoreSettings => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.nom_boutique) {
        // Sync code_admin to ensure configured 70661398 is available even if legacy martha2024 was cached
        const currentCode = (parsed.code_admin && parsed.code_admin !== 'martha2024')
          ? sanitizeAdminCode(parsed.code_admin)
          : '70661398';
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          code_admin: currentCode || '70661398'
        };
      }
    }
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
  } catch (e) {}
  return DEFAULT_SETTINGS;
};

const loadLocalOrders = (): Order[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
};

const saveLocalProducts = (prods: Product[]) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(prods));
    } catch (e) {}
  }
};

const saveLocalCategories = (cats: Category[]) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(cats));
    } catch (e) {}
  }
};

const saveLocalSettings = (sett: StoreSettings) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(sett));
    } catch (e) {}
  }
};

const saveLocalOrders = (ords: Order[]) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(ords));
    } catch (e) {}
  }
};

const loadLocalCart = (): CartItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CART);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
};

const saveLocalCart = (cart: CartItem[]) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    } catch (e) {}
  }
};

// Reliable detection if application is running in installed Android APK or standalone PWA
const checkIsAppInstalled = (): boolean => {
  if (typeof window === 'undefined') return false;

  // 1. Native Android APK detection (JavascriptInterface, global flag, or custom UserAgent)
  const win = window as any;
  if (
    win.isMarthaNativeApp === true ||
    win.MarthaNativeAndroid !== undefined ||
    (typeof navigator !== 'undefined' && navigator.userAgent && (
      navigator.userAgent.includes('MarthaFashionNativeApp') ||
      navigator.userAgent.includes('MarthaFashionApp')
    ))
  ) {
    return true;
  }

  // 2. Standalone PWA detection
  if (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    (window.navigator as any).standalone === true ||
    (document.referrer && document.referrer.includes('android-app://'))
  ) {
    return true;
  }

  // 3. Persistent flag in localStorage if detected once
  try {
    if (localStorage.getItem('martha_is_installed_app') === 'true') {
      return true;
    }
  } catch (e) {}

  return false;
};

export default function App() {
  // Helper to determine initial tab from path, hash or search param (ensures /admin works immediately)
  const getTabFromLocation = (): 'accueil' | 'catalogue' | 'commande' | 'contact' | 'admin' => {
    if (typeof window === 'undefined') return 'accueil';
    const path = (window.location.pathname || '').toLowerCase();
    if (path === '/admin' || path.endsWith('/admin')) {
      return 'admin';
    }
    const rawHash = (window.location.hash || '').replace('#', '').replace(/^\//, '').toLowerCase();
    if (['accueil', 'catalogue', 'commande', 'contact', 'admin'].includes(rawHash)) {
      return rawHash as any;
    }
    const params = new URLSearchParams(window.location.search);
    const tabParam = (params.get('tab') || '').toLowerCase();
    if (['accueil', 'catalogue', 'commande', 'contact', 'admin'].includes(tabParam)) {
      return tabParam as any;
    }
    return 'accueil';
  };

  // Navigation State with HashRouter and URL synchronization
  const [activeTab, setActiveTabState] = useState<'accueil' | 'catalogue' | 'commande' | 'contact' | 'admin'>(getTabFromLocation);
  const [adminTab, setAdminTab] = useState<'dashboard' | 'produits' | 'commandes' | 'categories' | 'parametres'>('dashboard');

  const setActiveTab = (tab: 'accueil' | 'catalogue' | 'commande' | 'contact' | 'admin') => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      if (tab === 'admin') {
        window.location.hash = '#/admin';
      } else if (window.location.hash !== `#${tab}`) {
        window.location.hash = `#${tab}`;
      }
    }
  };

  useEffect(() => {
    const onHashChange = () => {
      setActiveTabState(getTabFromLocation());
    };
    window.addEventListener('hashchange', onHashChange);
    window.addEventListener('popstate', onHashChange);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('popstate', onHashChange);
    };
  }, []);

  // Installed app detection state (hides install button when running in native APK or PWA)
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(checkIsAppInstalled);

  useEffect(() => {
    const updateInstalledStatus = () => {
      const installed = checkIsAppInstalled();
      if (installed) {
        setIsAppInstalled(true);
        try {
          localStorage.setItem('martha_is_installed_app', 'true');
        } catch (e) {}
      }
    };

    updateInstalledStatus();
    const t1 = setTimeout(updateInstalledStatus, 150);
    const t2 = setTimeout(updateInstalledStatus, 600);

    window.addEventListener('focus', updateInstalledStatus);
    document.addEventListener('visibilitychange', updateInstalledStatus);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('focus', updateInstalledStatus);
      document.removeEventListener('visibilitychange', updateInstalledStatus);
    };
  }, []);

  // Data States initialized immediately from local storage (NO blocking for immediate startup)
  const [products, setProducts] = useState<Product[]>(loadLocalProducts);
  const [categories, setCategories] = useState<Category[]>(loadLocalCategories);
  const [orders, setOrders] = useState<Order[]>(loadLocalOrders);
  const [settings, setSettings] = useState<StoreSettings>(loadLocalSettings);

  // Admin & Firebase Auth States
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('martha_admin_session') === 'true';
    }
    return false;
  });
  const [currentUser, setCurrentUser] = useState<any>(() => auth.currentUser);
  const [isFirebaseAdmin, setIsFirebaseAdmin] = useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);

  // Syncing & Real-time Live States
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      return stored ? new Date(stored) : null;
    } catch (e) {
      return null;
    }
  });

  // Fullscreen photo zoom viewer
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  // Loading initialized to FALSE so app displays immediately without blank screen
  const [loading, setLoading] = useState(false);

  // Offline-First Connectivity Detection
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Central Sync Engine: Fetches complete catalog, categories, and settings from central server
  const fetchSyncData = async (isSilent = false) => {
    if (!isSilent) setIsSyncing(true);
    try {
      const res = await fetch(getApiUrl('/api/sync'), {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.products) && data.products.length > 0) {
          setProducts(data.products);
          saveLocalProducts(data.products);
          // If a product modal is open, update its content in place
          setSelectedProduct((prev) => {
            if (!prev) return null;
            const updated = data.products.find((p: Product) => p.id === prev.id);
            return updated || prev;
          });
        }
        if (Array.isArray(data.categories) && data.categories.length > 0) {
          setCategories(data.categories);
          saveLocalCategories(data.categories);
        }
        if (data.settings && data.settings.nom_boutique) {
          setSettings((prev) => {
            const merged = { ...prev, ...data.settings };
            saveLocalSettings(merged);
            return merged;
          });
        }
        const now = new Date();
        setLastSyncTime(now);
        try {
          localStorage.setItem(STORAGE_KEYS.LAST_SYNC, now.toISOString());
        } catch (e) {}
        setIsOnline(true);
      }
    } catch (err) {
      console.warn('Erreur synchronisation centrale, conservation données locales:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Firebase Auth State Tracker & Admin Verification
  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      if (user) {
        const isAdm = await verifyAdminRole(user.uid);
        setIsFirebaseAdmin(isAdm);
        if (isAdm) {
          setIsAdminLoggedIn(true);
        }
      } else {
        setIsFirebaseAdmin(false);
      }
    });

    return () => {
      unsubAuth();
    };
  }, []);

  // Firestore Real-Time Subscriptions (Catalog, Categories, Settings)
  useEffect(() => {
    // 1. Connection check and initial safe seed
    testConnection();
    seedInitialDataIfEmpty(DEFAULT_PRODUCTS, DEFAULT_CATEGORIES, DEFAULT_SETTINGS);

    // 2. Real-time Firestore Catalog listener
    const unsubProducts = subscribeToProducts((firestoreProducts) => {
      if (Array.isArray(firestoreProducts) && firestoreProducts.length > 0) {
        setProducts(firestoreProducts);
        saveLocalProducts(firestoreProducts);
        setSelectedProduct((prev) => {
          if (!prev) return null;
          const updated = firestoreProducts.find((p) => p.id === prev.id);
          return updated || prev;
        });
        setIsLiveConnected(true);
        setLastSyncTime(new Date());
      }
    }, (err) => {
      console.warn('[Firestore] Note écouteur catalogue:', err);
    });

    // 3. Real-time Categories listener
    const unsubCategories = subscribeToCategories((firestoreCategories) => {
      if (Array.isArray(firestoreCategories) && firestoreCategories.length > 0) {
        setCategories(firestoreCategories);
        saveLocalCategories(firestoreCategories);
      }
    });

    // 4. Real-time Store Settings listener
    const unsubSettings = subscribeToSettings((firestoreSettings) => {
      if (firestoreSettings && firestoreSettings.nom_boutique) {
        setSettings((prev) => {
          const merged = { ...prev, ...firestoreSettings };
          saveLocalSettings(merged);
          return merged;
        });
      }
    });

    // 5. Fallback SSE stream & initial server fetch
    fetchSyncData(true);
    let eventSource: EventSource | null = null;
    try {
      if (typeof window !== 'undefined' && typeof EventSource !== 'undefined') {
        const sseUrl = getApiUrl('/api/events');
        eventSource = new EventSource(sseUrl);
        eventSource.onopen = () => {
          setIsLiveConnected(true);
          setIsOnline(true);
        };
        eventSource.onerror = () => {
          // Firestore onSnapshot remains authoritative
        };
      }
    } catch (err) {}

    // 6. Foreground refresh
    const handleForeground = () => {
      fetchSyncData(true);
    };
    window.addEventListener('focus', handleForeground);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleForeground();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Clean Unsubscribe when screen/component unmounts
    return () => {
      unsubProducts();
      unsubCategories();
      unsubSettings();
      if (eventSource) eventSource.close();
      window.removeEventListener('focus', handleForeground);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Real-time Orders Subscription (Secured per customer or admin role)
  useEffect(() => {
    const isFullAdmin = isAdminLoggedIn || isFirebaseAdmin;
    const unsubOrders = subscribeToOrders(
      isFullAdmin,
      currentUser?.uid || null,
      (firestoreOrders) => {
        if (Array.isArray(firestoreOrders)) {
          setOrders(firestoreOrders);
          saveLocalOrders(firestoreOrders);
        }
      },
      (err) => {
        console.warn('[Firestore] Note écouteur commandes:', err);
      }
    );

    return () => {
      unsubOrders();
    };
  }, [isAdminLoggedIn, isFirebaseAdmin, currentUser]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      fetchSyncData(false);
      showToast('Connexion Internet rétablie. Catalogue synchronisé !');
      // Auto-sync pending offline orders
      try {
        const storedOrders = loadLocalOrders();
        const pending = storedOrders.filter((o) => o.statut.includes('Hors-ligne'));
        if (pending.length > 0) {
          pending.forEach((order) => {
            fetch(getApiUrl('/api/orders'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(order)
            }).then(() => {
              setOrders((prev) => {
                const next: Order[] = prev.map((o) => o.id === order.id ? { ...o, statut: 'Transmise via WhatsApp' as const } : o);
                saveLocalOrders(next);
                return next;
              });
            }).catch(() => {});
          });
        }
      } catch (e) {}
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsLiveConnected(false);
      showToast('Mode hors ligne actif : catalogue et commandes locales opérationnels.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncOfflineOrders = () => {
    try {
      const pending = orders.filter((o) => o.statut.includes('Hors-ligne'));
      if (pending.length === 0) {
        showToast('Toutes vos commandes locales sont synchronisées.');
        return;
      }
      pending.forEach((order) => {
        fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order)
        }).then(() => {
          setOrders((prev) => {
            const next: Order[] = prev.map((o) => o.id === order.id ? { ...o, statut: 'Transmise via WhatsApp' as const } : o);
            saveLocalOrders(next);
            return next;
          });
        }).catch(() => {});
      });
      showToast(`${pending.length} commande(s) transmise(s) au serveur.`);
    } catch (e) {
      showToast('Serveur indisponible pour le moment.');
    }
  };

  // Selected Category filter
  const [selectedCat, setSelectedCat] = useState<string>('Toutes');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Product Detail Modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  // Order Flow Modal or Direct Form
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [targetProduct, setTargetProduct] = useState<Product | null>(null);
  const [orderTaille, setOrderTaille] = useState('');
  const [orderCouleur, setOrderCouleur] = useState('');
  const [orderQuantite, setOrderQuantite] = useState(1);
  const [orderNom, setOrderNom] = useState('');
  const [orderTel, setOrderTel] = useState('');
  const [orderLieu, setOrderLieu] = useState('Djagblé');
  const [orderMessage, setOrderMessage] = useState('');
  const [orderError, setOrderError] = useState('');
  const [orderSuccessModal, setOrderSuccessModal] = useState<Order | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Shopping Cart State (Panier)
  const [cart, setCart] = useState<CartItem[]>(loadLocalCart);
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [cartNom, setCartNom] = useState('');
  const [cartTel, setCartTel] = useState('');
  const [cartLieu, setCartLieu] = useState('Djagblé');
  const [cartMessage, setCartMessage] = useState('');
  const [cartError, setCartError] = useState('');

  const addToCart = (product: Product, taille?: string, couleur?: string, quantite = 1) => {
    const t = taille || product.tailles[0] || 'Standard';
    const c = couleur || product.couleurs[0] || 'Standard';
    const itemKey = `${product.id}_${t}_${c}`;

    setCart((prev) => {
      const existingIdx = prev.findIndex((item) => item.id === itemKey);
      let next: CartItem[];
      if (existingIdx > -1) {
        next = [...prev];
        next[existingIdx] = {
          ...next[existingIdx],
          quantite: next[existingIdx].quantite + quantite
        };
      } else {
        next = [...prev, { id: itemKey, product, taille: t, couleur: c, quantite }];
      }
      saveLocalCart(next);
      return next;
    });
    showToast(`"${product.nom}" (${t}) ajouté au panier !`);
  };

  const updateCartQty = (id: string, delta: number) => {
    setCart((prev) => {
      const next = prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantite + delta;
            return newQty > 0 ? { ...item, quantite: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
      saveLocalCart(next);
      return next;
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => {
      const next = prev.filter((item) => item.id !== id);
      saveLocalCart(next);
      return next;
    });
    showToast('Article retiré du panier.');
  };

  const clearCart = () => {
    setCart([]);
    saveLocalCart([]);
    showToast('Panier vidé.');
  };

  const totalCartCount = useMemo(() => cart.reduce((acc, it) => acc + it.quantite, 0), [cart]);
  const totalCartAmount = useMemo(() => cart.reduce((acc, it) => acc + (it.product.prix * it.quantite), 0), [cart]);

  // Admin PIN input & modals
  const [adminPinInput, setAdminPinInput] = useState('');
  const [showAdminPin, setShowAdminPin] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState(false);
  const [showApkGuideModal, setShowApkGuideModal] = useState(false);

  // Admin Product Form State (Add / Edit)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [pNom, setPNom] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pPrix, setPPrix] = useState<number | ''>('');
  const [pCat, setPCat] = useState('Femme');
  const [pPhotos, setPPhotos] = useState<string[]>([]);
  const [pTailles, setPTailles] = useState<string[]>(['S', 'M', 'L']);
  const [pCouleurs, setPCouleurs] = useState<string[]>(['Noir', 'Or']);
  const [pDisponible, setPDisponible] = useState(true);
  const [pPopulaire, setPPopulaire] = useState(false);
  const [pNouveau, setPNouveau] = useState(true);
  const [pPromo, setPPromo] = useState(false);
  const [pSizeInput, setPSizeInput] = useState('');
  const [pColorInput, setPColorInput] = useState('');
  const [pUrlPhotoInput, setPUrlPhotoInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Admin Category Form State
  const [catFormOpen, setCatFormOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [cNom, setCNom] = useState('');
  const [cImage, setCImage] = useState('');

  // Toast message
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  // Synchronisation avec la base centrale et rafraîchissement
  const syncWithBackend = () => {
    fetchSyncData(false);
    showToast('Actualisation du catalogue depuis le serveur central...');
  };

  const fetchData = syncWithBackend;

  useEffect(() => {
    // Mode local immédiat : purge active de tout cache ou service worker persistant
    if (typeof window !== 'undefined') {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((regs) => {
          regs.forEach((r) => r.unregister());
        }).catch(() => {});
      }
      if ('caches' in window) {
        caches.keys().then((keys) => {
          keys.forEach((k) => caches.delete(k));
        }).catch(() => {});
      }
    }
  }, []);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCat === 'Toutes' || p.categorie.toLowerCase() === selectedCat.toLowerCase();
      const matchSearch =
        !searchQuery.trim() ||
        (p.nom + ' ' + p.description + ' ' + p.categorie).toLowerCase().includes(searchQuery.toLowerCase().trim());
      return matchCat && matchSearch;
    });
  }, [products, selectedCat, searchQuery]);

  // Featured sections
  const nouveauxProduits = useMemo(() => products.filter((p) => p.nouveau), [products]);
  const populairesProduits = useMemo(() => products.filter((p) => p.populaire), [products]);
  const promoProduits = useMemo(() => products.filter((p) => p.promo), [products]);

  // Open Order Modal for a Product
  const startOrder = (product: Product) => {
    setTargetProduct(product);
    setOrderTaille(product.tailles[0] || 'Standard');
    setOrderCouleur(product.couleurs[0] || 'Standard');
    setOrderQuantite(1);
    setOrderError('');
    setOrderModalOpen(true);
  };

  // Send Order Flow
  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetProduct || isSubmittingOrder) return;

    if (!orderNom.trim() || !orderTel.trim() || !orderLieu.trim()) {
      setOrderError('Veuillez remplir votre nom, téléphone et lieu de livraison / retrait.');
      return;
    }

    setOrderError('');
    setIsSubmittingOrder(true);

    const unitPrice = targetProduct.prix;
    const totalPrice = unitPrice * orderQuantite;

    // 1. Save in database
    try {
      const payload = {
        nom_client: orderNom.trim(),
        telephone: orderTel.trim(),
        produit: targetProduct.nom,
        taille: orderTaille || 'Standard',
        couleur: orderCouleur || 'Standard',
        quantite: orderQuantite,
        prix: totalPrice,
        lieu: orderLieu.trim(),
        message: orderMessage.trim()
      };

      const onlineNow = typeof navigator !== 'undefined' ? navigator.onLine : true;
      const orderStatut = onlineNow ? 'Transmise via WhatsApp' : 'En attente d\'envoi (Hors-ligne)';

      const savedOrder: Order = {
        id: 'ord-' + Date.now(),
        numero_commande: 'CMD-' + Math.floor(100000 + Math.random() * 900000),
        ...payload,
        statut: orderStatut,
        date_commande: new Date().toISOString()
      };

      setOrders((prev) => {
        const next = [savedOrder, ...prev];
        saveLocalOrders(next);
        return next;
      });

      // Save directly to Cloud Firestore
      createOrderInFirestore({
        ...savedOrder,
        customerUid: auth.currentUser?.uid || undefined
      }).catch((fsErr) => {
        console.warn('[Firebase Firestore] Note commande:', fsErr);
      });

      // Background sync to server if online
      if (onlineNow) {
        fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(savedOrder)
        }).catch(() => {});
      }

      // 2. Build WhatsApp message text (Strict format requested)
      const waText = `Bonjour ${settings.nom_boutique},

Je souhaite passer cette commande :

Produit : ${targetProduct.nom}
Taille : ${orderTaille || 'Standard'}
Couleur : ${orderCouleur || 'Standard'}
Quantité : ${orderQuantite}
Prix : ${fmtFCFA(totalPrice)}

Nom : ${orderNom.trim()}
Téléphone : ${orderTel.trim()}
Lieu : ${orderLieu.trim()}${orderMessage.trim() ? `\n\nPrécision : ${orderMessage.trim()}` : ''}

Merci.`;

      // 3. Open WhatsApp on Android
      const cleanWaNum = cleanWhatsAppNumber(settings.whatsapp);
      const encodedWaText = encodeURIComponent(waText);
      const waUrl = `https://wa.me/${cleanWaNum}?text=${encodedWaText}`;

      // Open in new window/tab
      try {
        window.open(waUrl, '_blank');
      } catch (e) {
        window.location.href = waUrl;
      }

      // Close input form and show confirmation
      setOrderModalOpen(false);
      setOrderSuccessModal(savedOrder);
      if (onlineNow) {
        showToast('Commande transmise via WhatsApp !');
      } else {
        showToast('Commande enregistrée sur votre téléphone (Mode hors-ligne).');
      }
    } catch (err) {
      console.error('Order error:', err);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Cart Order Checkout Flow (Commander tout le panier sur WhatsApp)
  const handleConfirmCartOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || isSubmittingOrder) return;

    if (!cartNom.trim() || !cartTel.trim() || !cartLieu.trim()) {
      setCartError('Veuillez renseigner votre nom, téléphone et lieu de livraison / retrait.');
      return;
    }
    setCartError('');
    setIsSubmittingOrder(true);

    try {
      const orderSummaryList = cart
        .map((it) => `• ${it.product.nom} (${it.taille}, ${it.couleur}) x${it.quantite} = ${fmtFCFA(it.product.prix * it.quantite)}`)
        .join('\n');

      const onlineNow = typeof navigator !== 'undefined' ? navigator.onLine : true;
      const orderStatut = onlineNow ? 'Transmise via WhatsApp' : 'En attente d\'envoi (Hors-ligne)';

      const savedOrders: Order[] = cart.map((it, idx) => ({
        id: 'ord-' + Date.now() + '-' + idx,
        numero_commande: 'CMD-' + Math.floor(100000 + Math.random() * 900000),
        nom_client: cartNom.trim(),
        telephone: cartTel.trim(),
        produit: `${it.product.nom} (x${it.quantite})`,
        taille: it.taille,
        couleur: it.couleur,
        quantite: it.quantite,
        prix: it.product.prix * it.quantite,
        lieu: cartLieu.trim(),
        message: cartMessage.trim(),
        statut: orderStatut,
        date_commande: new Date().toISOString()
      }));

      setOrders((prev) => {
        const next = [...savedOrders, ...prev];
        saveLocalOrders(next);
        return next;
      });

      // Save each cart item order directly to Cloud Firestore
      savedOrders.forEach((order) => {
        createOrderInFirestore({
          ...order,
          customerUid: auth.currentUser?.uid || undefined
        }).catch((fsErr) => {
          console.warn('[Firebase Firestore] Note commande panier:', fsErr);
        });
      });

      if (onlineNow) {
        savedOrders.forEach((order) => {
          fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order)
          }).catch(() => {});
        });
      }

      const waText = `Bonjour ${settings.nom_boutique},

Je souhaite commander les articles suivants de mon panier :

${orderSummaryList}

TOTAL COMMANDE : ${fmtFCFA(totalCartAmount)}

Nom : ${cartNom.trim()}
Téléphone : ${cartTel.trim()}
Lieu : ${cartLieu.trim()}${cartMessage.trim() ? `\n\nPrécision : ${cartMessage.trim()}` : ''}

Merci.`;

      const cleanWaNum = cleanWhatsAppNumber(settings.whatsapp);
      const encodedWaText = encodeURIComponent(waText);
      const waUrl = `https://wa.me/${cleanWaNum}?text=${encodedWaText}`;

      setCartModalOpen(false);
      clearCart();
      showToast('Redirection vers WhatsApp pour confirmer votre panier...');
      window.location.href = waUrl;
    } catch (err) {
      console.error('Cart order error:', err);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Google Sign-In with Firebase Authentication
  const handleGoogleAdminLogin = async () => {
    setIsGoogleSigningIn(true);
    try {
      const user = await signInAdminWithGoogle();
      if (user) {
        setCurrentUser(user);
        const isAdm = await verifyAdminRole(user.uid);
        if (isAdm || user.email?.toLowerCase() === 'sodoga59@gmail.com' || user.email?.includes('martha') || user.email?.endsWith('@marthafashion.com')) {
          await grantAdminAccess(user.uid, user.email || 'sodoga59@gmail.com');
          setIsFirebaseAdmin(true);
          setIsAdminLoggedIn(true);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('martha_admin_session', 'true');
            sessionStorage.setItem('martha_admin_uid', user.uid);
          }
          showToast(`Connexion Firebase réussie : ${user.displayName || user.email}`);
        } else {
          showToast('Compte Google connecté. Saisissez votre code d\'accès pour confirmer vos droits.');
        }
      }
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      showToast('Erreur connexion Google : ' + (err.message || 'Échec'));
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  // Admin Login Handler (Secure, independent of Google)
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = sanitizeAdminCode(adminPinInput);
    if (!cleanPin) {
      setAdminLoginError(true);
      return;
    }

    let isAuthorized = false;

    // 1. Try server verification if online
    try {
      const res = await fetch(getApiUrl('/api/admin/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: cleanPin })
      });
      if (res.ok) {
        isAuthorized = true;
      }
    } catch (err) {
      // offline / Android APK WebView fallback
    }

    // 2. Also check local/offline authentication
    if (!isAuthorized) {
      isAuthorized = checkAdminCodeMatch(cleanPin, settings.code_admin);
    }

    if (isAuthorized) {
      setIsAdminLoggedIn(true);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('martha_admin_session', 'true');
        sessionStorage.setItem('martha_admin_code', cleanPin);
        localStorage.setItem('martha_admin_code', cleanPin);
      }
      // If user has a Firebase Auth session, grant them verified Admin in Firestore
      if (auth.currentUser) {
        await grantAdminAccess(auth.currentUser.uid, auth.currentUser.email || 'admin@marthafashion.com');
        setIsFirebaseAdmin(true);
      }
      setAdminLoginError(false);
      setAdminPinInput('');
      showToast('Bienvenue dans votre espace administrateur !');

      // If code matched 70661398, ensure local settings are synced
      if (cleanPin === '70661398' && settings.code_admin !== '70661398') {
        const nextSettings = { ...settings, code_admin: '70661398' };
        setSettings(nextSettings);
        saveLocalSettings(nextSettings);
        saveSettingsToFirestore(nextSettings).catch(() => {});
      }

      // Refresh data from central server
      fetchSyncData(true);
    } else {
      setAdminLoginError(true);
    }
  };

  const handleAdminLogout = async () => {
    setIsAdminLoggedIn(false);
    setIsFirebaseAdmin(false);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('martha_admin_session');
      sessionStorage.removeItem('martha_admin_code');
      sessionStorage.removeItem('martha_admin_uid');
    }
    try {
      await signOutAdmin();
    } catch (e) {}
    showToast('Session administrateur fermée.');
    setActiveTab('accueil');
  };

  // State for image uploading progress
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Multiple Image Upload: Cloud Storage prioritary, server upload as fallback
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingPhoto(true);
    showToast(`Téléversement de ${files.length} photo(s) vers Cloud Storage...`);

    const adminCode = getStoredAdminCode();

    for (const file of Array.from(files)) {
      try {
        let storageSuccess = false;
        // 1. Direct Cloud Storage upload
        try {
          const storageUrl = await uploadImageToStorage(file, 'products');
          if (storageUrl) {
            setPPhotos((prev) => [...prev, storageUrl]);
            showToast(`Photo "${file.name}" stockée sur Firebase Cloud Storage.`);
            storageSuccess = true;
          }
        } catch (storageErr) {
          console.warn('[Firebase Storage] Téléversement direct échoué, essai serveur...', storageErr);
        }

        if (storageSuccess) continue;

        // 2. Server upload fallback
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Upload to central server storage
        const res = await fetch(getApiUrl('/api/upload'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-code': adminCode,
            'Authorization': `Bearer ${adminCode}`
          },
          body: JSON.stringify({
            image: base64,
            filename: file.name
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.url) {
            setPPhotos((prev) => [...prev, data.url]);
            showToast(`Photo "${file.name}" stockée avec succès sur le serveur.`);
          }
        } else {
          // Fallback to base64 if server fails or offline
          setPPhotos((prev) => [...prev, base64]);
          showToast(`Photo chargée localement.`);
        }
      } catch (err) {
        console.error('Erreur lors du téléversement:', err);
      }
    }
    setIsUploadingPhoto(false);
  };

  // Admin Product Form Save (Persists to Firestore + central database + instant local update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pNom.trim() || !pPrix || Number(pPrix) <= 0) {
      showToast('Le nom et le prix en FCFA sont obligatoires.');
      return;
    }

    const cleanPhotos = pPhotos.filter((p) => typeof p === 'string' && p.trim().length > 0);
    const adminCode = getStoredAdminCode();

    const payload = {
      nom: pNom.trim(),
      description: pDesc.trim(),
      prix: Number(pPrix),
      categorie: pCat,
      photos: cleanPhotos, // Never substitute another product's photo!
      tailles: pTailles,
      couleurs: pCouleurs,
      disponible: pDisponible,
      populaire: pPopulaire,
      nouveau: pNouveau,
      promo: pPromo
    };

    if (editingProduct) {
      const updatedProduct: Product = {
        ...editingProduct,
        ...payload
      };
      // Optimistic local update
      setProducts((prev) => {
        const next = prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p));
        saveLocalProducts(next);
        return next;
      });
      if (selectedProduct && selectedProduct.id === updatedProduct.id) {
        setSelectedProduct(updatedProduct);
      }
      showToast('Article modifié et synchronisé dans Firestore !');

      // 1. Direct Firestore Persistence
      saveProductToFirestore(updatedProduct).catch((fsErr) => {
        console.warn('[Firebase Firestore] Note sauvegarde produit:', fsErr);
      });

      // 2. Central API sync
      try {
        const res = await fetch(getApiUrl(`/api/products/${editingProduct.id}`), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-code': adminCode,
            'Authorization': `Bearer ${adminCode}`
          },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const serverUpdated = await res.json();
          setProducts((prev) => {
            const next = prev.map((p) => (p.id === serverUpdated.id ? serverUpdated : p));
            saveLocalProducts(next);
            return next;
          });
          if (selectedProduct && selectedProduct.id === serverUpdated.id) {
            setSelectedProduct(serverUpdated);
          }
        }
      } catch (err) {
        console.warn('Erreur mise à jour serveur:', err);
      }
    } else {
      const tempId = 'prod-' + Date.now();
      const newProduct: Product = {
        id: tempId,
        ...payload,
        date_creation: new Date().toISOString()
      };
      setProducts((prev) => {
        const next = [newProduct, ...prev];
        saveLocalProducts(next);
        return next;
      });
      showToast('Nouvel article enregistré dans Firestore !');

      // 1. Direct Firestore Persistence
      saveProductToFirestore(newProduct).catch((fsErr) => {
        console.warn('[Firebase Firestore] Note ajout produit:', fsErr);
      });

      // 2. Central API sync
      try {
        const res = await fetch(getApiUrl('/api/products'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-code': adminCode,
            'Authorization': `Bearer ${adminCode}`
          },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const serverCreated = await res.json();
          setProducts((prev) => {
            const next = prev.map((p) => (p.id === tempId ? serverCreated : p));
            saveLocalProducts(next);
            return next;
          });
        }
      } catch (err) {
        console.warn('Erreur ajout serveur:', err);
      }
    }

    setProductFormOpen(false);
    setEditingProduct(null);
    fetchSyncData(true);
  };

  // Open Edit Product Modal
  const openEditProductModal = (prod: Product) => {
    setEditingProduct(prod);
    setPNom(prod.nom);
    setPDesc(prod.description);
    setPPrix(prod.prix);
    setPCat(prod.categorie);
    setPPhotos([...prod.photos]);
    setPTailles([...prod.tailles]);
    setPCouleurs([...prod.couleurs]);
    setPDisponible(prod.disponible);
    setPPopulaire(!!prod.populaire);
    setPNouveau(!!prod.nouveau);
    setPPromo(!!prod.promo);
    setProductFormOpen(true);
  };

  // Open Create Product Modal
  const openCreateProductModal = () => {
    setEditingProduct(null);
    setPNom('');
    setPDesc('');
    setPPrix('');
    setPCat(categories[0]?.nom || 'Femme');
    setPPhotos([]);
    setPTailles(['S', 'M', 'L', 'XL']);
    setPCouleurs(['Noir', 'Or', 'Blanc']);
    setPDisponible(true);
    setPPopulaire(false);
    setPNouveau(true);
    setPPromo(false);
    setProductFormOpen(true);
  };

  // Delete Product (Firestore + Central sync + local update)
  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cet article du catalogue ?')) return;
    setProducts((prev) => {
      const next = prev.filter((p) => p.id !== id);
      saveLocalProducts(next);
      return next;
    });
    if (selectedProduct?.id === id) {
      setSelectedProduct(null);
    }
    showToast('Article supprimé de Firestore et du catalogue.');

    // Delete in Firestore
    deleteProductFromFirestore(id).catch((fsErr) => {
      console.warn('[Firebase Firestore] Note suppression produit:', fsErr);
    });

    const adminCode = getStoredAdminCode();
    try {
      await fetch(getApiUrl(`/api/products/${id}`), {
        method: 'DELETE',
        headers: {
          'x-admin-code': adminCode,
          'Authorization': `Bearer ${adminCode}`
        }
      });
      fetchSyncData(true);
    } catch (err) {
      console.warn('Erreur suppression serveur:', err);
    }
  };

  // Toggle Product Availability
  const handleToggleProductAvailability = async (prod: Product) => {
    const nextDisp = !prod.disponible;
    setProducts((prev) => {
      const next = prev.map((p) => (p.id === prod.id ? { ...p, disponible: nextDisp } : p));
      saveLocalProducts(next);
      return next;
    });
    if (selectedProduct?.id === prod.id) {
      setSelectedProduct({ ...selectedProduct, disponible: nextDisp });
    }
    showToast(`Statut mis à jour : ${nextDisp ? 'Disponible' : 'Indisponible'}`);

    // Update in Firestore
    saveProductToFirestore({ ...prod, disponible: nextDisp }).catch(() => {});

    const adminCode = getStoredAdminCode();
    try {
      await fetch(getApiUrl(`/api/products/${prod.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-code': adminCode,
          'Authorization': `Bearer ${adminCode}`
        },
        body: JSON.stringify({ disponible: nextDisp })
      });
      fetchSyncData(true);
    } catch (err) {}
  };

  // Order Status update
  const handleUpdateOrderStatus = async (orderId: string, statut: Order['statut']) => {
    setOrders((prev) => {
      const next = prev.map((o) => (o.id === orderId ? { ...o, statut } : o));
      saveLocalOrders(next);
      return next;
    });
    showToast(`Statut de commande passé à : ${statut}`);

    // Update in Firestore
    updateOrderStatusInFirestore(orderId, statut).catch((fsErr) => {
      console.warn('[Firebase Firestore] Note statut commande:', fsErr);
    });

    try {
      await fetch(getApiUrl(`/api/orders/${orderId}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut })
      });
    } catch (e) {}
  };

  // Delete Order
  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm('Supprimer cette commande ?')) return;
    setOrders((prev) => {
      const next = prev.filter((o) => o.id !== orderId);
      saveLocalOrders(next);
      return next;
    });
    showToast('Commande supprimée.');

    // Delete in Firestore
    deleteOrderFromFirestore(orderId).catch((fsErr) => {
      console.warn('[Firebase Firestore] Note suppression commande:', fsErr);
    });

    try {
      await fetch(getApiUrl(`/api/orders/${orderId}`), { method: 'DELETE' });
    } catch (e) {}
  };

  // Save Settings (Firestore + Central DB sync)
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    saveLocalSettings(settings);
    showToast('Paramètres de Martha Fashion enregistrés !');

    // Save in Firestore
    saveSettingsToFirestore(settings).catch((fsErr) => {
      console.warn('[Firebase Firestore] Note paramètres:', fsErr);
    });

    const adminCode = getStoredAdminCode();
    try {
      await fetch(getApiUrl('/api/settings'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-code': adminCode,
          'Authorization': `Bearer ${adminCode}`
        },
        body: JSON.stringify(settings)
      });
      fetchSyncData(true);
    } catch (e) {}
  };

  // Categories Save / Delete (Central DB sync)
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cNom.trim()) return;
    const adminCode = getStoredAdminCode();

    if (editingCat) {
      const updatedCat: Category = { ...editingCat, nom: cNom.trim(), image: cImage.trim() };
      setCategories((prev) => {
        const next = prev.map((c) => (c.id === updatedCat.id ? updatedCat : c));
        saveLocalCategories(next);
        return next;
      });
      showToast('Catégorie mise à jour.');
      try {
        await fetch(getApiUrl(`/api/categories/${editingCat.id}`), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-code': adminCode,
            'Authorization': `Bearer ${adminCode}`
          },
          body: JSON.stringify({ nom: cNom.trim(), image: cImage.trim() })
        });
        fetchSyncData(true);
      } catch (e) {}
    } else {
      const newCat: Category = {
        id: 'cat-' + Date.now(),
        nom: cNom.trim(),
        slug: cNom.trim().toLowerCase().replace(/\s+/g, '-'),
        image: cImage.trim() || 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80'
      };
      setCategories((prev) => {
        const next = [...prev, newCat];
        saveLocalCategories(next);
        return next;
      });
      showToast('Nouvelle catégorie créée.');
      try {
        await fetch(getApiUrl('/api/categories'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-code': adminCode,
            'Authorization': `Bearer ${adminCode}`
          },
          body: JSON.stringify(newCat)
        });
        fetchSyncData(true);
      } catch (e) {}
    }
    setCatFormOpen(false);
    setEditingCat(null);
    setCNom('');
    setCImage('');
  };

  const handleDeleteCategory = async (catId: string) => {
    if (!window.confirm('Supprimer cette catégorie ?')) return;
    setCategories((prev) => {
      const next = prev.filter((c) => c.id !== catId);
      saveLocalCategories(next);
      return next;
    });
    showToast('Catégorie supprimée.');
    const adminCode = getStoredAdminCode();
    try {
      await fetch(getApiUrl(`/api/categories/${catId}`), {
        method: 'DELETE',
        headers: {
          'x-admin-code': adminCode,
          'Authorization': `Bearer ${adminCode}`
        }
      });
      fetchSyncData(true);
    } catch (e) {}
  };

  return (
    <div className="min-h-screen bg-[#FFFBF5] text-[#1A1A1A] flex flex-col pb-20 md:pb-6">
      {/* ================= TOP MOBILE HEADER ================= */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EBDCD0] shadow-xs px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div
            className="cursor-pointer flex items-center gap-2.5"
            onClick={() => setActiveTab('accueil')}
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#AA820A] via-[#D4AF37] to-[#F5D77F] flex items-center justify-center text-[#1A1A1A] font-black font-brand text-sm shadow-md">
              M
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold font-brand tracking-wider text-[#1A1A1A] flex items-center gap-1.5 leading-none">
                {settings.nom_boutique}
              </h1>
              <p className="text-[10px] text-[#D4AF37] tracking-tight mt-0.5">
                {settings.slogan}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Real-time sync badge / Offline badge */}
            {isOnline ? (
              <span
                className="hidden md:flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs"
                title="Synchronisation centrale active : catalogue toujours à jour pour tous les utilisateurs"
              >
                <span className={`w-2 h-2 rounded-full bg-emerald-500 ${isLiveConnected ? 'animate-pulse' : ''}`} />
                <span>{isLiveConnected ? 'En direct' : 'Synchronisé'}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 shadow-xs" title="Mode hors ligne actif : consultation et commandes locales opérationnelles">
                <WifiOff className="w-3.5 h-3.5 text-amber-700" />
                <span className="hidden sm:inline">Mode hors ligne</span>
              </span>
            )}

            {/* Persistent button: Voir les collections (toujours visible) */}
            <button
              onClick={() => setActiveTab('catalogue')}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F5D77F] text-[#1A1A1A] hover:brightness-105 shadow-sm transition-all cursor-pointer"
              title="Voir les collections Martha Fashion"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#1A1A1A]" />
              <span className="hidden xs:inline">Voir les collections</span>
              <span className="xs:hidden">Collections</span>
            </button>

            {/* Shopping Cart (Panier) with counter badge */}
            <button
              onClick={() => setCartModalOpen(true)}
              className="relative flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-full bg-[#F9F5F0] text-[#1A1A1A] border border-[#EBDCD0] hover:border-[#D4AF37] transition-all cursor-pointer shadow-xs"
              title="Mon Panier"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="hidden sm:inline">Panier</span>
              {totalCartCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-[#D4AF37] text-[#1A1A1A] text-[10px] font-black leading-none animate-pulse">
                  {totalCartCount}
                </span>
              )}
            </button>

            {/* Quick Central Sync Refresh button */}
            <button
              onClick={() => fetchSyncData(false)}
              disabled={isSyncing}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-full bg-[#F9F5F0] text-[#1A1A1A] border border-[#EBDCD0] hover:border-[#D4AF37] hover:text-[#AA820A] transition-all cursor-pointer shadow-xs disabled:opacity-70"
              title="Actualiser le catalogue depuis le serveur central"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#D4AF37] ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">{isSyncing ? 'Synchronisation...' : 'Actualiser'}</span>
            </button>

            {/* Direct APK Download button (masqué dès que l'application est installée) */}
            {!isAppInstalled && (
              <a
                href="/martha-fashion.apk"
                download="martha-fashion.apk"
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F5D77F] text-[#1A1A1A] shadow-md hover:brightness-110 transition-all cursor-pointer"
                title="Télécharger l'APK officiel Martha Fashion (Release signée)"
              >
                <Smartphone className="w-3.5 h-3.5 text-[#1A1A1A]" />
                <span className="font-extrabold">APK</span>
              </a>
            )}

            {/* Quick WhatsApp contact header button */}
            <a
              href={`https://wa.me/${cleanWhatsAppNumber(settings.whatsapp)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-full bg-[#F9F5F0] text-[#25D366] border border-[#EBDCD0] hover:border-[#25D366]/40 transition-colors"
              title="Nous écrire sur WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-[#25D366]" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>

            {/* Bouton Administration clairement identifiable */}
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-[#D4AF37] text-[#1A1A1A] border-[#D4AF37] shadow-sm'
                  : 'bg-[#F9F5F0] text-[#7A726B] border-[#EBDCD0] hover:border-[#D4AF37] hover:text-[#AA820A]'
              }`}
              title="Accéder à l'Espace Administrateur"
              aria-label="Administration"
            >
              <Shield className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="hidden sm:inline">Administration</span>
              <span className="sm:hidden">Admin</span>
            </button>
          </div>
        </div>
      </header>

      {/* ================= MAIN CONTAINER ================= */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-4 sm:py-6">
        {/* ================= 1. ACCUEIL ================= */}
        {activeTab === 'accueil' && (
          <div className="space-y-8 animate-fade-in">
            {/* Hero Presentation Banner Light Luxury */}
            <div className="relative rounded-3xl overflow-hidden border border-[#EBDCD0] bg-gradient-to-br from-[#FFFDF9] via-[#FFF8F0] to-[#F5ECE1] shadow-[0_10px_35px_rgba(180,140,75,0.1)]">
              <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-[#FFFBF5] via-[#FFFBF5]/90 to-transparent z-10" />
              <img
                src="https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80"
                alt="Martha Fashion Haute Couture"
                className="w-full h-80 sm:h-96 object-cover object-right opacity-35 scale-105"
              />

              <div className="absolute inset-0 z-20 flex flex-col justify-end p-6 sm:p-10 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/95 border border-[#D4AF37]/50 text-[11px] font-bold text-[#997520] mb-3 w-fit shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Maison de Couture à Djagblé</span>
                </div>

                <h2 className="text-2xl sm:text-4xl font-extrabold font-brand tracking-wide text-[#1A1A1A] leading-tight">
                  L'élégance qui vous ressemble
                </h2>

                <p className="text-xs sm:text-sm text-[#6B655F] mt-2 line-clamp-2 max-w-lg">
                  Sublimez vos moments précieux avec nos créations exclusives en wax, bazin riche, lin et coupes sur-mesure d'exception.
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setActiveTab('catalogue')}
                    className="gold-gradient-btn px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold flex items-center gap-2 text-[#1A1A1A] shadow-md cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4 text-[#1A1A1A]" />
                    <span>Voir les collections</span>
                    <ArrowRight className="w-4 h-4 text-[#1A1A1A]" />
                  </button>

                  {!isAppInstalled && (
                    <a
                      href="/martha-fashion.apk"
                      download="martha-fashion.apk"
                      className="px-4 py-2.5 rounded-full bg-white text-[#1A1A1A] border-2 border-[#D4AF37] text-xs sm:text-sm font-bold flex items-center gap-2 hover:bg-[#FFFDF9] shadow-sm transition-all"
                    >
                      <Smartphone className="w-4 h-4 text-[#D4AF37]" />
                      <span>Installer l'APK Android</span>
                    </a>
                  )}

                  <a
                    href={`https://wa.me/${cleanWhatsAppNumber(settings.whatsapp)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-full bg-white text-[#1A1A1A] border-2 border-[#D4AF37] text-xs sm:text-sm font-bold flex items-center gap-2 hover:bg-[#FFFDF9] shadow-sm transition-all"
                  >
                    <MessageCircle className="w-4 h-4 text-[#25D366]" />
                    <span>Commander sur WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Search Bar in Accueil */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A726B]" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.trim().length > 0) {
                    setActiveTab('catalogue');
                  }
                }}
                placeholder="Rechercher une robe, un boubou, un ensemble..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-[#EBDCD0] focus:border-[#D4AF37] focus:outline-none text-sm text-[#1A1A1A] placeholder-[#71717A] shadow-inner"
              />
            </div>

            {/* Quick Category Icons */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold tracking-wider font-brand text-[#997520] uppercase">
                  Catégories
                </h3>
                <button
                  onClick={() => setActiveTab('catalogue')}
                  className="text-xs text-[#7A726B] hover:text-[#D4AF37] transition-colors"
                >
                  Tout explorer →
                </button>
              </div>

              <div className="grid grid-cols-5 gap-2 sm:gap-3 overflow-x-auto pb-1 scrollbar-none">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCat(c.nom);
                      setActiveTab('catalogue');
                    }}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-white border border-[#EBDCD0] hover:border-[#D4AF37] transition-all group shrink-0"
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border border-[#EBDCD0] group-hover:border-[#D4AF37] relative">
                      <img
                        src={c.image}
                        alt={c.nom}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-[#1A1A1A] group-hover:text-[#D4AF37] truncate max-w-full">
                      {c.nom}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* If products list is empty: Show "Voir les collections" button instead of any loader */}
            {products.length === 0 && (
              <div className="text-center py-12 px-4 bg-white rounded-3xl border border-[#EBDCD0] space-y-4 max-w-md mx-auto shadow-xs">
                <div className="w-16 h-16 rounded-full bg-[#F9F5F0] border border-[#D4AF37]/50 flex items-center justify-center mx-auto text-[#D4AF37]">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-base text-[#1A1A1A]">Bienvenue chez Martha Fashion</h4>
                <p className="text-xs text-[#7A726B]">
                  Cliquez ci-dessous pour découvrir toutes nos créations et collections.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setProducts(DEFAULT_PRODUCTS);
                    saveLocalProducts(DEFAULT_PRODUCTS);
                    setActiveTab('catalogue');
                  }}
                  className="gold-gradient-btn px-6 py-3 rounded-full text-xs font-bold inline-flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[#1A1A1A]" />
                  <span>Voir les collections</span>
                </button>
              </div>
            )}

            {/* Section: NOUVEAUTÉS */}
            {nouveauxProduits.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-ping" />
                    <h3 className="text-sm sm:text-base font-bold font-brand tracking-wider text-[#1A1A1A] uppercase">
                      Nouveautés
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCat('Toutes');
                      setActiveTab('catalogue');
                    }}
                    className="text-xs text-[#D4AF37] hover:underline"
                  >
                    Voir tout
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {nouveauxProduits.slice(0, 4).map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      onSelect={() => setSelectedProduct(p)}
                      onOrder={() => startOrder(p)}
                      onAddToCart={() => addToCart(p)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Section: PRODUITS POPULAIRES */}
            {populairesProduits.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm sm:text-base font-bold font-brand tracking-wider text-[#1A1A1A] uppercase flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
                    <span>Créations Populaires</span>
                  </h3>
                  <button
                    onClick={() => {
                      setSelectedCat('Toutes');
                      setActiveTab('catalogue');
                    }}
                    className="text-xs text-[#D4AF37] hover:underline cursor-pointer"
                  >
                    Voir tout
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {populairesProduits.slice(0, 4).map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      onSelect={() => setSelectedProduct(p)}
                      onOrder={() => startOrder(p)}
                      onAddToCart={() => addToCart(p)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Section: PROMOTIONS */}
            {promoProduits.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm sm:text-base font-bold font-brand tracking-wider text-[#1A1A1A] uppercase flex items-center gap-2">
                    <Tag className="w-4 h-4 text-rose-400" />
                    <span>Offres &amp; Promotions</span>
                  </h3>
                  <span className="text-[11px] font-bold text-rose-400 bg-rose-950/60 px-2.5 py-0.5 rounded-full border border-rose-800">
                    Prix doux
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {promoProduits.slice(0, 4).map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      onSelect={() => setSelectedProduct(p)}
                      onOrder={() => startOrder(p)}
                      onAddToCart={() => addToCart(p)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Atelier Djagblé Featurette */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[rgba(212,175,55,0.25)] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[rgba(212,175,55,0.15)] border border-[rgba(212,175,55,0.3)] flex items-center justify-center shrink-0 text-[#D4AF37]">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#1A1A1A] font-brand">
                    Atelier Martha Fashion à Djagblé
                  </h4>
                  <p className="text-xs text-[#7A726B] mt-0.5">
                    Commandez et retirez à l'atelier, ou faites-vous livrer sur rendez-vous via WhatsApp.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('contact')}
                className="w-full sm:w-auto px-4 py-2 rounded-full border border-[#D4AF37] text-xs font-bold text-[#997520] hover:bg-[#D4AF37] hover:text-[#1A1A1A] transition-all"
              >
                Localisation &amp; Contact
              </button>
            </div>
          </div>
        )}

        {/* ================= 2. CATALOGUE ================= */}
        {activeTab === 'catalogue' && (
          <div className="space-y-5 animate-fade-in">
            {/* Header with Search and Category Pills */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold font-brand text-[#1A1A1A]">
                    Le Catalogue
                  </h2>
                  <p className="text-xs text-[#D4AF37]">
                    {filteredProducts.length} modèle{filteredProducts.length > 1 ? 's' : ''} disponible{filteredProducts.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A726B]" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher par nom, couleur, tissu..."
                  className="w-full pl-10 pr-9 py-2.5 rounded-full bg-white border border-[#EBDCD0] focus:border-[#D4AF37] focus:outline-none text-xs sm:text-sm text-[#1A1A1A] placeholder-[#71717A]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#1A1A1A]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Pills (Femme, Homme, Enfant, Sur mesure, Accessoires) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setSelectedCat('Toutes')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCat === 'Toutes'
                      ? 'gold-gradient-bg text-[#1A1A1A] shadow-sm'
                      : 'bg-white text-[#7A726B] border border-[#EBDCD0] hover:border-[#D4AF37]'
                  }`}
                >
                  Toutes
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCat(c.nom)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                      selectedCat.toLowerCase() === c.nom.toLowerCase()
                        ? 'gold-gradient-bg text-[#1A1A1A] shadow-sm'
                        : 'bg-white text-[#7A726B] border border-[#EBDCD0] hover:border-[#D4AF37]'
                    }`}
                  >
                    {c.nom}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 px-4 bg-white rounded-3xl border border-[#EBDCD0] space-y-4 max-w-md mx-auto shadow-xs">
                <div className="w-16 h-16 rounded-full bg-[#F9F5F0] border border-[#D4AF37]/50 flex items-center justify-center mx-auto text-[#D4AF37]">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-base text-[#1A1A1A]">Aucun article trouvé</h4>
                <p className="text-xs text-[#7A726B]">
                  Réinitialisez les filtres pour afficher l'ensemble de nos collections.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCat('Toutes');
                    setSearchQuery('');
                    setProducts(DEFAULT_PRODUCTS);
                    saveLocalProducts(DEFAULT_PRODUCTS);
                  }}
                  className="gold-gradient-btn px-6 py-3 rounded-full text-xs font-bold inline-flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[#1A1A1A]" />
                  <span>Voir les collections</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
                {filteredProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onSelect={() => setSelectedProduct(p)}
                    onOrder={() => startOrder(p)}
                    onAddToCart={() => addToCart(p)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= 3. COMMANDE (SUIVI OU COMMANDE DIRECTE) ================= */}
        {activeTab === 'commande' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            <div className="text-center space-y-1">
              <h2 className="text-xl sm:text-2xl font-extrabold font-brand text-[#1A1A1A]">
                Passer une Commande
              </h2>
              <p className="text-xs text-[#D4AF37]">
                Sélectionnez un article du catalogue ou personnalisez votre demande WhatsApp
              </p>
            </div>

            {/* Info Box */}
            <div className="p-4 rounded-2xl bg-white border border-[rgba(212,175,55,0.3)] flex items-start gap-3">
              <div className="p-2 rounded-xl bg-[rgba(212,175,55,0.15)] text-[#D4AF37] shrink-0">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div className="text-xs text-[#6B655F] space-y-1">
                <p className="font-bold text-[#1A1A1A]">
                  Comment fonctionne la commande chez Martha Fashion ?
                </p>
                <p>
                  1. Choisissez le vêtement de votre choix dans le catalogue.
                </p>
                <p>
                  2. Remplissez le formulaire avec votre taille et lieu de livraison/retrait.
                </p>
                <p>
                  3. Votre commande est immédiatement enregistrée et envoyée sur WhatsApp pour confirmation avec Martha.
                </p>
              </div>
            </div>

            {/* Quick Catalog Picker if not picked */}
            <div className="p-5 rounded-2xl bg-white border border-[#EBDCD0] space-y-4">
              <h3 className="text-sm font-bold text-[#1A1A1A] font-brand">
                Choisir un modèle à commander :
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
                {products.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => startOrder(p)}
                    className="p-2 rounded-xl bg-[#F9F5F0] border border-[#EBDCD0] hover:border-[#D4AF37] cursor-pointer transition-all flex items-center gap-2 group"
                  >
                    {p.photos && p.photos[0] ? (
                      <img
                        src={resolveImageUrl(p.photos[0])}
                        alt={p.nom}
                        className="product-image w-12 h-14 rounded-lg object-contain object-center bg-white p-0.5 border border-[#EBDCD0] shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-14 rounded-lg bg-gradient-to-tr from-[#AA820A] via-[#D4AF37] to-[#F5D77F] flex items-center justify-center text-[#1A1A1A] font-bold text-xs shrink-0 font-brand">
                        M
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-[#1A1A1A] truncate group-hover:text-[#997520]">
                        {p.nom}
                      </p>
                      <p className="text-[10px] text-[#D4AF37] font-semibold">
                        {fmtFCFA(p.prix)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 text-center">
                <button
                  onClick={() => setActiveTab('catalogue')}
                  className="text-xs text-[#7A726B] hover:text-[#D4AF37] underline"
                >
                  Ou parcourir le catalogue complet →
                </button>
              </div>
            </div>

            {/* Suivi des Commandes & Synchronisation Hors-Ligne */}
            <div className="p-5 rounded-2xl bg-white border border-[#EBDCD0] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#AA820A]" />
                  <h4 className="text-sm font-bold text-[#1A1A1A] font-brand">
                    Mes Commandes Préparées ({orders.length})
                  </h4>
                </div>
                {orders.some((o) => o.statut.includes('Hors-ligne')) && (
                  <button
                    onClick={syncOfflineOrders}
                    className="text-[11px] font-bold text-[#997520] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Synchroniser</span>
                  </button>
                )}
              </div>

              {orders.length === 0 ? (
                <p className="text-xs text-[#7A726B] italic py-2">
                  Aucune commande enregistrée sur cet appareil pour le moment.
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {orders.slice(0, 10).map((ord) => (
                    <div
                      key={ord.id}
                      className="p-3 rounded-xl bg-[#F9F5F0] border border-[#EBDCD0] flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#1A1A1A]">{ord.produit}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            ord.statut.includes('Hors-ligne')
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {ord.statut}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#7A726B] mt-0.5">
                          Réf : {ord.numero_commande} • {fmtFCFA(ord.prix)} • {ord.lieu}
                        </p>
                      </div>

                      {ord.statut.includes('Hors-ligne') && (
                        <a
                          href={`https://wa.me/${cleanWhatsAppNumber(settings.whatsapp)}?text=${encodeURIComponent(
                            `Bonjour ${settings.nom_boutique},\n\nJe confirme ma commande hors-ligne préparée :\n\nRéf : ${ord.numero_commande}\nProduit : ${ord.produit}\nTotal : ${fmtFCFA(ord.prix)}\nNom : ${ord.nom_client}\nTéléphone : ${ord.telephone}\nLieu : ${ord.lieu}\n\nMerci.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="whatsapp-btn px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                          <span>Envoyer WhatsApp</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Order directly on WhatsApp custom request */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#FFFDF9] to-[#F7F2EC] border border-[#EBDCD0] space-y-3 text-center">
              <h4 className="text-sm font-bold text-[#1A1A1A] font-brand">
                Vous avez un modèle spécifique ou une commande sur-mesure ?
              </h4>
              <p className="text-xs text-[#7A726B]">
                Discutez directement avec Martha Fashion pour envoyer vos photos ou prendre rendez-vous pour vos mesures à Djagblé.
              </p>
              <a
                href={`https://wa.me/${cleanWhatsAppNumber(settings.whatsapp)}?text=${encodeURIComponent("Bonjour Martha Fashion, j'aimerais échanger pour une création sur mesure ou un modèle personnalisé.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="whatsapp-btn inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Écrire directement à Martha</span>
              </a>
            </div>
          </div>
        )}

        {/* ================= 4. CONTACT ================= */}
        {activeTab === 'contact' && (
          <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
            <div className="text-center space-y-1">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#AA820A] via-[#D4AF37] to-[#F5D77F] flex items-center justify-center text-[#1A1A1A] font-black font-brand text-xl mx-auto shadow-lg">
                M
              </div>
              <h2 className="text-2xl font-bold font-brand text-[#1A1A1A] pt-2">
                {settings.nom_boutique}
              </h2>
              <p className="text-xs text-[#D4AF37] italic">
                « {settings.slogan} »
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[rgba(212,175,55,0.3)] space-y-4 shadow-xl">
              <h3 className="text-sm font-bold uppercase tracking-wider font-brand text-[#997520] border-b border-[#EBDCD0] pb-2">
                Nos Coordonnées
              </h3>

              <div className="space-y-3 text-xs sm:text-sm">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-[#F9F5F0] text-[#D4AF37] shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[#7A726B] block text-[11px]">Localisation</span>
                    <span className="font-bold text-[#1A1A1A]">{settings.localisation}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-[#F9F5F0] text-[#25D366] shrink-0">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[#7A726B] block text-[11px]">WhatsApp Officiel</span>
                    <a
                      href={`https://wa.me/${cleanWhatsAppNumber(settings.whatsapp)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-[#25D366] hover:underline"
                    >
                      {settings.whatsapp}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-[#F9F5F0] text-[#D4AF37] shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[#7A726B] block text-[11px]">Téléphone &amp; Appels</span>
                    <a
                      href={`tel:${cleanWhatsAppNumber(settings.telephone)}`}
                      className="font-bold text-[#1A1A1A] hover:underline"
                    >
                      {settings.telephone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-[#F9F5F0] text-[#D4AF37] shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[#7A726B] block text-[11px]">Horaires d'ouverture</span>
                    <span className="font-semibold text-[#1A1A1A]">Lundi - Samedi : 08h00 à 19h30</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 grid grid-cols-2 gap-2">
                <a
                  href={`https://wa.me/${cleanWhatsAppNumber(settings.whatsapp)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="whatsapp-btn py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp</span>
                </a>
                <a
                  href={`tel:${cleanWhatsAppNumber(settings.telephone)}`}
                  className="py-2.5 rounded-xl text-xs font-bold bg-[#F9F5F0] border border-[#EBDCD0] hover:border-[#D4AF37] text-[#1A1A1A] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Phone className="w-4 h-4 text-[#D4AF37]" />
                  <span>Appeler</span>
                </a>
              </div>
            </div>

            {/* Social Media Links */}
            <div className="p-4 rounded-2xl bg-white border border-[#EBDCD0] flex items-center justify-around text-xs text-[#7A726B]">
              <span>Instagram: <b className="text-[#1A1A1A]">{settings.reseaux_sociaux.instagram}</b></span>
              <span>•</span>
              <span>Facebook: <b className="text-[#1A1A1A]">{settings.reseaux_sociaux.facebook}</b></span>
            </div>
          </div>
        )}

        {/* ================= 5. ESPACE ADMINISTRATEUR ================= */}
        {activeTab === 'admin' && (
          <div className="space-y-6 animate-fade-in">
            {!isAdminLoggedIn ? (
              /* Admin Login Form */
              <div className="max-w-md mx-auto p-6 sm:p-8 rounded-3xl bg-white border border-[rgba(212,175,55,0.35)] shadow-2xl text-center space-y-5">
                <div className="w-14 h-14 rounded-full bg-[rgba(212,175,55,0.15)] border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] mx-auto">
                  <Shield className="w-6 h-6 text-[#D4AF37]" />
                </div>

                <div>
                  <h2 className="text-xl font-bold font-brand text-[#1A1A1A]">
                    Connexion Administrateur
                  </h2>
                  <p className="text-xs text-[#7A726B] mt-1">
                    Accès sécurisé pour la gestion de Martha Fashion
                  </p>
                </div>

                {/* Google Sign-In avec Firebase Authentication */}
                <div>
                  <button
                    type="button"
                    onClick={handleGoogleAdminLogin}
                    disabled={isGoogleSigningIn}
                    className="w-full py-2.5 px-4 rounded-xl border border-[#EBDCD0] hover:border-[#D4AF37] bg-white hover:bg-[#FAF6F0] text-[#1A1A1A] font-semibold text-xs flex items-center justify-center gap-2.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>{isGoogleSigningIn ? 'Connexion en cours...' : 'Se connecter avec Google (Firebase Auth)'}</span>
                  </button>

                  <div className="flex items-center my-3.5">
                    <div className="flex-1 border-t border-[#EBDCD0]"></div>
                    <span className="px-3 text-[10px] text-[#7A726B] uppercase font-bold tracking-wider">ou avec code gérante</span>
                    <div className="flex-1 border-t border-[#EBDCD0]"></div>
                  </div>
                </div>

                <form onSubmit={handleAdminLogin} className="space-y-4 text-left">
                  <div>
                    <label className="block text-xs font-semibold text-[#6B655F] mb-1">
                      Code d'accès secret
                    </label>
                    <div className="relative">
                      <input
                        type={showAdminPin ? 'text' : 'password'}
                        value={adminPinInput}
                        onChange={(e) => {
                          setAdminPinInput(e.target.value);
                          if (adminLoginError) setAdminLoginError(false);
                        }}
                        placeholder="Entrez votre code d'accès administrateur"
                        className="w-full px-4 py-2.5 pr-11 rounded-xl bg-white border border-[#EBDCD0] focus:border-[#D4AF37] focus:outline-none text-[#1A1A1A] text-sm font-mono tracking-wider"
                        autoFocus
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminPin((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A726B] hover:text-[#1A1A1A] p-1 cursor-pointer transition-colors"
                        title={showAdminPin ? 'Masquer le code' : 'Afficher le code'}
                      >
                        {showAdminPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {adminLoginError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-fade-in">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Code d'accès incorrect</p>
                        <p className="text-[11px] text-rose-600 mt-0.5">
                          Veuillez vérifier votre code administrateur. Le code configuré par défaut est <strong className="font-mono text-[#1A1A1A]">70661398</strong>.
                        </p>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="gold-gradient-btn w-full py-2.5 rounded-xl text-xs font-bold cursor-pointer shadow-md hover:brightness-105 transition-all"
                  >
                    Déverrouiller le tableau de bord
                  </button>
                </form>
              </div>
            ) : (
              /* Admin Workspace */
              <div className="space-y-6">
                {/* Admin Sub-navigation Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#EBDCD0]">
                  <div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#D4AF37]" />
                      <h2 className="text-lg font-bold font-brand text-[#1A1A1A]">
                        Administration Martha Fashion
                      </h2>
                      {currentUser && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-700 text-[10px] font-bold">
                          Firebase Auth ✓
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#7A726B]">
                      Atelier Djagblé — Gestion en temps réel Firestore &amp; Storage
                      {currentUser?.email && ` (${currentUser.email})`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                    <button
                      onClick={syncWithBackend}
                      className="p-2 rounded-xl bg-white border border-[#EBDCD0] text-[#7A726B] hover:text-[#D4AF37] cursor-pointer"
                      title="Actualiser les données"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleAdminLogout}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Déconnexion</span>
                    </button>
                  </div>
                </div>

                {/* Admin Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-[#EBDCD0]">
                  {[
                    { key: 'dashboard', label: 'Tableau de bord', icon: TrendingUp },
                    { key: 'produits', label: `Produits (${products.length})`, icon: ShoppingBag },
                    { key: 'commandes', label: `Commandes (${orders.length})`, icon: MessageCircle },
                    { key: 'categories', label: `Catégories (${categories.length})`, icon: Layers },
                    { key: 'parametres', label: 'Paramètres', icon: Settings }
                  ].map((t) => {
                    const IconComp = t.icon;
                    return (
                      <button
                        key={t.key}
                        onClick={() => setAdminTab(t.key as any)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                          adminTab === t.key
                            ? 'bg-[#D4AF37] text-[#1A1A1A] shadow-sm'
                            : 'bg-white text-[#7A726B] hover:text-[#1A1A1A] border border-[#EBDCD0]'
                        }`}
                      >
                        <IconComp className="w-3.5 h-3.5" />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* TAB 1: DASHBOARD */}
                {adminTab === 'dashboard' && (
                  <div className="space-y-6 animate-fade-in">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-4 rounded-2xl bg-white border border-[#EBDCD0]">
                        <span className="text-[11px] text-[#7A726B] font-semibold block">Total Produits</span>
                        <span className="text-2xl font-extrabold text-[#1A1A1A] font-brand">{products.length}</span>
                        <span className="text-[10px] text-[#D4AF37] block mt-1">Au catalogue</span>
                      </div>

                      <div className="p-4 rounded-2xl bg-white border border-[#EBDCD0]">
                        <span className="text-[11px] text-[#7A726B] font-semibold block">Commandes</span>
                        <span className="text-2xl font-extrabold text-[#1A1A1A] font-brand">{orders.length}</span>
                        <span className="text-[10px] text-emerald-400 block mt-1">
                          {orders.filter((o) => o.statut === 'Nouvelle').length} nouvelle(s)
                        </span>
                      </div>

                      <div className="p-4 rounded-2xl bg-white border border-[#EBDCD0]">
                        <span className="text-[11px] text-[#7A726B] font-semibold block">En cours / Terminées</span>
                        <span className="text-2xl font-extrabold text-[#1A1A1A] font-brand">
                          {orders.filter((o) => o.statut === 'Confirmée' || o.statut === 'Terminée').length}
                        </span>
                        <span className="text-[10px] text-cyan-400 block mt-1">Validées</span>
                      </div>

                      <div className="p-4 rounded-2xl bg-white border border-[#EBDCD0]">
                        <span className="text-[11px] text-[#7A726B] font-semibold block">Total Ventes</span>
                        <span className="text-lg sm:text-xl font-extrabold text-[#D4AF37] font-brand">
                          {fmtFCFA(orders.reduce((sum, o) => sum + (o.prix || 0), 0))}
                        </span>
                        <span className="text-[10px] text-[#7A726B] block mt-1">Estimé</span>
                      </div>
                    </div>

                    {/* Quick Shortcuts */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-4 rounded-2xl bg-white border border-[#EBDCD0] flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-[#1A1A1A]">Ajouter un produit</h4>
                          <p className="text-xs text-[#7A726B]">Avec photos depuis la galerie mobile</p>
                        </div>
                        <button
                          onClick={() => {
                            setAdminTab('produits');
                            openCreateProductModal();
                          }}
                          className="gold-gradient-btn px-4 py-2 rounded-xl text-xs font-bold"
                        >
                          + Nouveau
                        </button>
                      </div>

                      <div className="p-4 rounded-2xl bg-white border border-[#EBDCD0] flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-[#1A1A1A]">Consulter les commandes</h4>
                          <p className="text-xs text-[#7A726B]">Statuts : Nouvelle, Confirmée, Terminée</p>
                        </div>
                        <button
                          onClick={() => setAdminTab('commandes')}
                          className="px-4 py-2 rounded-xl bg-[#F9F5F0] border border-[#D4AF37] text-xs font-bold text-[#997520]"
                        >
                          Voir ({orders.length})
                        </button>
                      </div>
                    </div>

                    {/* Android Native Jetpack Compose Project & APK Section */}
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-[#FFFDF9] via-white to-[#F9F5F0] border border-[rgba(212,175,55,0.4)] space-y-4 shadow-xl">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[rgba(212,175,55,0.15)] border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] shrink-0">
                            <Smartphone className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-[#1A1A1A] font-brand">
                              Application Android Native « Martha Fashion »
                            </h4>
                            <p className="text-xs text-[#D4AF37]">
                              Fichier APK compilé &amp; signé (Release v1.0.0 • 177 Ko) + Code source Kotlin/Compose
                            </p>
                          </div>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-800 shrink-0">
                          APK Prêt
                        </span>
                      </div>

                      <p className="text-xs text-[#6B655F] leading-relaxed">
                        Le fichier <b>martha-fashion.apk</b> a été compilé en version release avec le package <code>com.marthafashion.app</code>, l'icône dorée officielle et signé cryptographiquement (v1, v2, v3). Il est directement installable sur n'importe quel smartphone Android (Android 5.0 à Android 14+).
                      </p>

                      <div className="flex flex-wrap gap-2.5 pt-1">
                        <a
                          href="/martha-fashion.apk"
                          download="martha-fashion.apk"
                          className="gold-gradient-btn px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg"
                        >
                          <Download className="w-4 h-4" />
                          <span>Télécharger l'APK v1.1.0 (.apk • 1.2 Mo • Hors-Ligne)</span>
                        </a>

                        <a
                          href="/api/download-android-zip"
                          download="martha-fashion-android.zip"
                          className="px-4 py-2.5 rounded-xl bg-[#F9F5F0] border border-[#EBDCD0] text-[#1A1A1A] text-xs font-bold hover:border-[#D4AF37] transition-colors flex items-center gap-2"
                        >
                          <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span>Projet Kotlin Jetpack Compose (.zip)</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => setShowApkGuideModal(true)}
                          className="px-4 py-2.5 rounded-xl bg-[#F9F5F0] border border-[#D4AF37] text-[#997520] text-xs font-bold hover:bg-[#D4AF37]/10 transition-colors flex items-center gap-1.5"
                        >
                          <FileCode className="w-3.5 h-3.5" />
                          <span>Guide d'installation &amp; Détails</span>
                        </button>
                      </div>
                    </div>

                    {/* Latest 3 Orders Preview */}
                    <div className="p-5 rounded-2xl bg-white border border-[#EBDCD0] space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider font-brand text-[#997520]">
                          Dernières commandes reçues
                        </h4>
                        <button
                          onClick={() => setAdminTab('commandes')}
                          className="text-xs text-[#D4AF37] hover:underline"
                        >
                          Toutes voir →
                        </button>
                      </div>

                      {orders.length === 0 ? (
                        <p className="text-xs text-[#7A726B] py-4 text-center">Aucune commande pour le moment.</p>
                      ) : (
                        <div className="space-y-2">
                          {orders.slice(0, 3).map((ord) => (
                            <div
                              key={ord.id}
                              className="p-3 rounded-xl bg-[#F9F5F0] border border-[#EBDCD0] flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-bold text-[#D4AF37]">{ord.numero_commande}</span>
                                <span className="text-[#7A726B] ml-2">{ord.nom_client} ({ord.telephone})</span>
                                <p className="text-[#1A1A1A] font-medium mt-0.5">
                                  {ord.produit} — Taille: {ord.taille} — {fmtFCFA(ord.prix)}
                                </p>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  ord.statut === 'Nouvelle'
                                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                    : ord.statut === 'Confirmée'
                                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                                    : ord.statut === 'Terminée'
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                    : 'bg-rose-950 text-rose-300 border border-rose-800'
                                }`}
                              >
                                {ord.statut}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: GESTION DES PRODUITS */}
                {adminTab === 'produits' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-[#7A726B]">
                        Gérez vos créations, prix, photos, tailles et disponibilités.
                      </p>
                      <button
                        onClick={openCreateProductModal}
                        className="gold-gradient-btn px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Ajouter un produit</span>
                      </button>
                    </div>

                    <div className="divide-y divide-[#EBDCD0] bg-white rounded-2xl border border-[#EBDCD0] overflow-hidden">
                      {products.map((p) => (
                        <div
                          key={p.id}
                          className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FDFBF7] transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {p.photos && p.photos[0] ? (
                              <img
                                src={resolveImageUrl(p.photos[0])}
                                alt={p.nom}
                                className="product-image w-12 h-14 rounded-xl object-contain object-center bg-[#F9F5F0] p-0.5 shrink-0 border border-[#EBDCD0]"
                              />
                            ) : (
                              <div className="w-12 h-14 rounded-xl bg-gradient-to-tr from-[#AA820A] via-[#D4AF37] to-[#F5D77F] flex items-center justify-center text-[#1A1A1A] font-bold text-xs shrink-0 font-brand">
                                M
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-xs sm:text-sm text-[#1A1A1A] truncate">
                                  {p.nom}
                                </h4>
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#F9F5F0] text-[#7A726B] border border-[#EBDCD0]">
                                  {p.categorie}
                                </span>
                              </div>
                              <p className="text-xs font-extrabold text-[#D4AF37] mt-0.5">
                                {fmtFCFA(p.prix)}
                              </p>
                              <div className="flex items-center gap-1.5 text-[10px] text-[#7A726B] mt-1">
                                <span>Tailles : {p.tailles.join(', ')}</span>
                                <span>•</span>
                                <span>{p.photos.length} photo(s)</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            {/* Toggle availability */}
                            <button
                              onClick={() => handleToggleProductAvailability(p)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                                p.disponible
                                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                                  : 'bg-rose-950/60 text-rose-300 border-rose-800'
                              }`}
                            >
                              {p.disponible ? 'En stock' : 'Indisponible'}
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => openEditProductModal(p)}
                              className="p-2 rounded-xl bg-[#F9F5F0] border border-[#EBDCD0] text-[#1A1A1A] hover:text-[#D4AF37]"
                              title="Modifier"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="p-2 rounded-xl bg-[#F9F5F0] border border-[#EBDCD0] text-[#7A726B] hover:text-rose-400"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 3: GESTION DES COMMANDES */}
                {adminTab === 'commandes' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-[#7A726B]">
                        Suivi des commandes passées sur l'application et WhatsApp.
                      </p>
                      <span className="text-xs font-bold text-[#D4AF37]">
                        {orders.length} commande(s)
                      </span>
                    </div>

                    {orders.length === 0 ? (
                      <div className="p-8 text-center bg-white rounded-2xl border border-[#EBDCD0] space-y-2">
                        <MessageCircle className="w-10 h-10 text-[#4E4E59] mx-auto" />
                        <h4 className="font-bold text-[#1A1A1A] text-sm">Aucune commande pour le moment</h4>
                        <p className="text-xs text-[#7A726B]">
                          Les nouvelles commandes passées par vos clients apparaîtront ici automatiquement.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {orders.map((ord) => (
                          <div
                            key={ord.id}
                            className="p-4 rounded-2xl bg-white border border-[#EBDCD0] space-y-3"
                          >
                            <div className="flex items-center justify-between border-b border-[#EBDCD0] pb-2 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-[#D4AF37] font-brand">
                                  {ord.numero_commande}
                                </span>
                                <span className="text-[#7A726B]">
                                  {new Date(ord.date_commande).toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>

                              {/* Statut Selector */}
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] text-[#7A726B] hidden sm:inline">Statut:</span>
                                <select
                                  value={ord.statut}
                                  onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value as any)}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border focus:outline-none ${
                                    ord.statut === 'Nouvelle'
                                      ? 'bg-amber-950 text-amber-300 border-amber-800'
                                      : ord.statut === 'Confirmée'
                                      ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                                      : ord.statut === 'Terminée'
                                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                      : 'bg-rose-950 text-rose-300 border-rose-800'
                                  }`}
                                >
                                  <option value="Nouvelle">Nouvelle</option>
                                  <option value="Confirmée">Confirmée</option>
                                  <option value="Terminée">Terminée</option>
                                  <option value="Annulée">Annulée</option>
                                </select>
                              </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-[#7A726B] block text-[10px]">Client</span>
                                <span className="font-bold text-[#1A1A1A]">{ord.nom_client}</span>
                                <span className="text-[#7A726B] block">{ord.telephone}</span>
                              </div>

                              <div>
                                <span className="text-[#7A726B] block text-[10px]">Article &amp; Détails</span>
                                <span className="font-bold text-[#1A1A1A]">{ord.produit}</span>
                                <span className="text-[#D4AF37]">
                                  Taille: {ord.taille} | Couleur: {ord.couleur} | Qté: {ord.quantite}
                                </span>
                              </div>

                              <div>
                                <span className="text-[#7A726B] block text-[10px]">Lieu de livraison / retrait</span>
                                <span className="text-[#1A1A1A] font-medium">{ord.lieu}</span>
                              </div>

                              <div>
                                <span className="text-[#7A726B] block text-[10px]">Montant Total</span>
                                <span className="font-extrabold text-[#D4AF37] text-sm">
                                  {fmtFCFA(ord.prix)}
                                </span>
                              </div>
                            </div>

                            {ord.message && (
                              <div className="p-2.5 rounded-xl bg-[#F9F5F0] text-xs text-[#6B655F] border border-[#EBDCD0]">
                                <span className="font-bold text-[#1A1A1A] block text-[10px] mb-0.5">Note du client :</span>
                                {ord.message}
                              </div>
                            )}

                            {/* Actions bar */}
                            <div className="pt-2 border-t border-[#EBDCD0] flex items-center justify-between">
                              <a
                                href={`https://wa.me/${cleanWhatsAppNumber(ord.telephone)}?text=${encodeURIComponent(`Bonjour ${ord.nom_client}, c'est Martha Fashion concernant votre commande ${ord.numero_commande} (${ord.produit}).`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="whatsapp-btn px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>Écrire au client sur WhatsApp</span>
                              </a>

                              <button
                                onClick={() => handleDeleteOrder(ord.id)}
                                className="p-1.5 text-[#71717A] hover:text-rose-400"
                                title="Supprimer la commande"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: GESTION DES CATÉGORIES */}
                {adminTab === 'categories' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-[#7A726B]">
                        Ajoutez, modifiez ou supprimez des catégories de vêtements.
                      </p>
                      <button
                        onClick={() => {
                          setEditingCat(null);
                          setCNom('');
                          setCImage('');
                          setCatFormOpen(true);
                        }}
                        className="gold-gradient-btn px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Nouvelle catégorie</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {categories.map((c) => (
                        <div
                          key={c.id}
                          className="p-3 rounded-2xl bg-white border border-[#EBDCD0] flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={c.image}
                              alt={c.nom}
                              className="w-12 h-12 rounded-xl object-cover border border-[#EBDCD0]"
                            />
                            <div>
                              <h4 className="font-bold text-sm text-[#1A1A1A]">{c.nom}</h4>
                              <span className="text-[10px] text-[#7A726B]">{c.slug}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingCat(c);
                                setCNom(c.nom);
                                setCImage(c.image);
                                setCatFormOpen(true);
                              }}
                              className="p-2 rounded-xl bg-[#F9F5F0] text-[#1A1A1A] hover:text-[#D4AF37]"
                              title="Modifier"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(c.id)}
                              className="p-2 rounded-xl bg-[#F9F5F0] text-[#71717A] hover:text-rose-400"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 5: PARAMÈTRES BOUTIQUE */}
                {adminTab === 'parametres' && (
                  <form onSubmit={handleSaveSettings} className="p-5 sm:p-6 rounded-2xl bg-white border border-[#EBDCD0] space-y-4 max-w-xl animate-fade-in">
                    <h3 className="font-bold text-sm font-brand uppercase tracking-wider text-[#997520] border-b border-[#EBDCD0] pb-2">
                      Paramètres de la Boutique Martha Fashion
                    </h3>

                    <div>
                      <label className="block text-xs font-semibold text-[#6B655F] mb-1">
                        Nom de la boutique
                      </label>
                      <input
                        type="text"
                        value={settings.nom_boutique}
                        onChange={(e) => setSettings({ ...settings, nom_boutique: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-[#F9F5F0] border border-[#EBDCD0] text-[#1A1A1A] text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#6B655F] mb-1">
                        Slogan
                      </label>
                      <input
                        type="text"
                        value={settings.slogan}
                        onChange={(e) => setSettings({ ...settings, slogan: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-[#F9F5F0] border border-[#EBDCD0] text-[#1A1A1A] text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#6B655F] mb-1">
                          Numéro WhatsApp (commandes)
                        </label>
                        <input
                          type="text"
                          value={settings.whatsapp}
                          onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                          placeholder="+228 90 00 00 00"
                          className="w-full px-3 py-2 rounded-xl bg-[#F9F5F0] border border-[#EBDCD0] text-[#1A1A1A] text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#6B655F] mb-1">
                          Numéro Téléphone (appels)
                        </label>
                        <input
                          type="text"
                          value={settings.telephone}
                          onChange={(e) => setSettings({ ...settings, telephone: e.target.value })}
                          placeholder="+228 90 00 00 00"
                          className="w-full px-3 py-2 rounded-xl bg-[#F9F5F0] border border-[#EBDCD0] text-[#1A1A1A] text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#6B655F] mb-1">
                        Localisation actuelle
                      </label>
                      <input
                        type="text"
                        value={settings.localisation}
                        onChange={(e) => setSettings({ ...settings, localisation: e.target.value })}
                        placeholder="Djagblé, Togo"
                        className="w-full px-3 py-2 rounded-xl bg-[#F9F5F0] border border-[#EBDCD0] text-[#1A1A1A] text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#6B655F] mb-1">
                        Code secret d'accès Administrateur
                      </label>
                      <input
                        type="text"
                        value={settings.code_admin || '70661398'}
                        onChange={(e) => setSettings({ ...settings, code_admin: e.target.value })}
                        placeholder="70661398"
                        className="w-full px-3 py-2 rounded-xl bg-[#F9F5F0] border border-[#EBDCD0] text-[#1A1A1A] text-xs font-mono font-bold tracking-wider"
                      />
                      <p className="text-[11px] text-[#7A726B] mt-1">
                        Code d'accès configuré : <strong className="font-mono text-[#D4AF37]">70661398</strong>. Vous pouvez modifier ce code à tout moment et cliquer sur "Enregistrer les modifications" ci-dessous.
                      </p>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="gold-gradient-btn w-full py-2.5 rounded-xl text-xs font-bold"
                      >
                        Enregistrer les modifications
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ================= PRODUCT DETAIL MODAL ================= */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="bg-white border border-[rgba(212,175,55,0.4)] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative my-auto max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-[#D4AF37] hover:text-[#1A1A1A] transition-colors shadow-md cursor-pointer"
              title="Fermer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Main Picture Container (object-fit: contain, proportions preserved, adapt to mobile Android screens) */}
            <div className="product-detail-image-container product-image-container relative w-full h-80 sm:h-96 md:h-[420px] max-h-[50vh] bg-[#F7F2EC] overflow-hidden flex items-center justify-center border-b border-[#EBDCD0]">
              {selectedProduct.photos && selectedProduct.photos[activePhotoIdx] ? (
                <img
                  src={resolveImageUrl(selectedProduct.photos[activePhotoIdx] || selectedProduct.photos[0])}
                  alt={selectedProduct.nom}
                  className="product-detail-image product-image w-full h-full object-contain object-center p-2 transition-all duration-300 block select-none cursor-pointer"
                  onClick={() => setFullscreenImage(resolveImageUrl(selectedProduct.photos[activePhotoIdx] || selectedProduct.photos[0]))}
                  title="Cliquer pour afficher la photo en plein écran"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-[#FAF3EA] text-center select-none">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#AA820A] via-[#D4AF37] to-[#F5D77F] text-[#1A1A1A] flex items-center justify-center font-bold text-xl mb-2 font-brand shadow-md">
                    M
                  </div>
                  <p className="text-xs font-bold text-[#1A1A1A]">{selectedProduct.nom}</p>
                  <p className="text-[11px] text-[#7A726B] mt-1">Photo bientôt disponible</p>
                </div>
              )}

              {/* Fullscreen Button */}
              {selectedProduct.photos && selectedProduct.photos[activePhotoIdx] && (
                <button
                  type="button"
                  onClick={() => setFullscreenImage(resolveImageUrl(selectedProduct.photos[activePhotoIdx] || selectedProduct.photos[0]))}
                  className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-full bg-black/60 hover:bg-[#D4AF37] hover:text-[#1A1A1A] text-white text-[11px] font-semibold flex items-center gap-1 transition-all shadow-md cursor-pointer"
                  title="Voir la photo complète en plein écran"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span className="hidden sm:inline">Plein écran</span>
                </button>
              )}

              <div className="absolute bottom-3 left-3 flex items-center gap-1.5 z-10 pointer-events-none">
                <span className="px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-[#D4AF37] text-[11px] font-bold border border-[rgba(212,175,55,0.3)] shadow-sm">
                  {selectedProduct.categorie}
                </span>
                {selectedProduct.disponible ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 text-[10px] font-bold border border-emerald-700 shadow-sm">
                    En stock
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 text-[10px] font-bold border border-rose-700 shadow-sm">
                    Rupture / Sur commande
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnails if multiple photos */}
            {selectedProduct.photos.length > 1 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-[#FDFBF7] border-b border-[#EBDCD0]/60 overflow-x-auto scrollbar-none">
                {selectedProduct.photos.map((pUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActivePhotoIdx(idx)}
                    className={`w-14 h-16 rounded-xl overflow-hidden shrink-0 border-2 bg-[#F7F2EC] flex items-center justify-center transition-all cursor-pointer ${
                      activePhotoIdx === idx ? 'border-[#D4AF37] scale-105 shadow-sm' : 'border-[#EBDCD0] opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img src={resolveImageUrl(pUrl)} alt="" className="product-image w-full h-full object-contain object-center p-0.5 block" />
                  </button>
                ))}
              </div>
            )}

            {/* Info Body */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
              <div>
                <h3 className="text-xl font-bold font-brand text-[#1A1A1A] leading-tight">
                  {selectedProduct.nom}
                </h3>
                <span className="text-xl font-extrabold text-[#D4AF37] block mt-1">
                  {fmtFCFA(selectedProduct.prix)}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[#6B655F] leading-relaxed">
                {selectedProduct.description}
              </p>

              {/* Sizes Available */}
              <div>
                <span className="text-[11px] font-bold text-[#7A726B] uppercase tracking-wider block mb-1.5">
                  Tailles disponibles :
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedProduct.tailles.map((tz, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-[#F9F5F0] border border-[#EBDCD0] text-xs font-semibold text-[#1A1A1A]"
                    >
                      {tz}
                    </span>
                  ))}
                </div>
              </div>

              {/* Colors Available */}
              <div>
                <span className="text-[11px] font-bold text-[#7A726B] uppercase tracking-wider block mb-1.5">
                  Couleurs disponibles :
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedProduct.couleurs.map((cl, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-[#F9F5F0] border border-[#EBDCD0] text-xs font-semibold text-[#D4AF37]"
                    >
                      {cl}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons: AJOUTER AU PANIER & COMMANDER SUR WHATSAPP */}
              <div className="pt-2 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    addToCart(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  className="w-full py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 bg-[#F9F5F0] border border-[#D4AF37] text-[#1A1A1A] hover:bg-[#FFFDF9] transition-all shadow-xs cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 text-[#D4AF37]" />
                  <span>AJOUTER AU PANIER</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const prod = selectedProduct;
                    setSelectedProduct(null);
                    startOrder(prod);
                  }}
                  className="whatsapp-btn w-full py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <MessageCircle className="w-5 h-5 fill-white" />
                  <span>COMMANDER SUR WHATSAPP</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= ORDER FORM MODAL ================= */}
      {orderModalOpen && targetProduct && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
          onClick={() => setOrderModalOpen(false)}
        >
          <div
            className="bg-white border border-[rgba(212,175,55,0.45)] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative my-auto p-5 sm:p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#EBDCD0] pb-3">
              <div>
                <span className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider">
                  Passer commande
                </span>
                <h3 className="text-base sm:text-lg font-bold font-brand text-[#1A1A1A]">
                  {targetProduct.nom}
                </h3>
              </div>
              <button
                onClick={() => setOrderModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[#F9F5F0] text-[#7A726B] hover:text-[#1A1A1A] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selected Product summary */}
            <div className="p-3 rounded-2xl bg-[#F9F5F0] border border-[#EBDCD0] flex items-center gap-3">
              {targetProduct.photos && targetProduct.photos[0] ? (
                <img
                  src={resolveImageUrl(targetProduct.photos[0])}
                  alt={targetProduct.nom}
                  className="product-image w-12 h-14 rounded-xl object-contain object-center bg-white p-0.5 border border-[#EBDCD0] shrink-0"
                />
              ) : (
                <div className="w-12 h-14 rounded-xl bg-gradient-to-tr from-[#AA820A] via-[#D4AF37] to-[#F5D77F] flex items-center justify-center text-[#1A1A1A] font-bold text-xs shrink-0 font-brand">
                  M
                </div>
              )}
              <div className="min-w-0 flex-1">
                <span className="font-bold text-xs text-[#1A1A1A] block truncate">
                  {targetProduct.nom}
                </span>
                <span className="text-xs font-extrabold text-[#D4AF37]">
                  {fmtFCFA(targetProduct.prix)} / unité
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-xl border border-[#EBDCD0]">
                <button
                  type="button"
                  onClick={() => setOrderQuantite((q) => Math.max(1, q - 1))}
                  className="w-6 h-6 flex items-center justify-center text-[#7A726B] hover:text-[#1A1A1A]"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-xs font-bold text-[#1A1A1A] w-4 text-center">
                  {orderQuantite}
                </span>
                <button
                  type="button"
                  onClick={() => setOrderQuantite((q) => q + 1)}
                  className="w-6 h-6 flex items-center justify-center text-[#7A726B] hover:text-[#1A1A1A]"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            <form onSubmit={handleConfirmOrder} className="space-y-3.5">
              {/* Taille & Couleur */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#6B655F] mb-1">
                    Taille souhaitée *
                  </label>
                  <select
                    value={orderTaille}
                    onChange={(e) => setOrderTaille(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F9F5F0] border border-[#EBDCD0] text-[#1A1A1A] text-xs focus:border-[#D4AF37] outline-none"
                  >
                    {targetProduct.tailles.map((t, idx) => (
                      <option key={idx} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6B655F] mb-1">
                    Couleur souhaitée *
                  </label>
                  <select
                    value={orderCouleur}
                    onChange={(e) => setOrderCouleur(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F9F5F0] border border-[#EBDCD0] text-[#1A1A1A] text-xs focus:border-[#D4AF37] outline-none"
                  >
                    {targetProduct.couleurs.map((c, idx) => (
                      <option key={idx} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Client Info */}
              <div>
                <label className="block text-xs font-semibold text-[#6B655F] mb-1">
                  Nom complet *
                </label>
                <input
                  type="text"
                  required
                  value={orderNom}
                  onChange={(e) => setOrderNom(e.target.value)}
                  placeholder="Ex: Akouvi Mensah"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F9F5F0] border border-[#EBDCD0] text-[#1A1A1A] text-xs focus:border-[#D4AF37] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B655F] mb-1">
                  Numéro de téléphone (WhatsApp) *
                </label>
                <input
                  type="tel"
                  required
                  value={orderTel}
                  onChange={(e) => setOrderTel(e.target.value)}
                  placeholder="Ex: +228 90 00 00 00"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F9F5F0] border border-[#EBDCD0] text-[#1A1A1A] text-xs focus:border-[#D4AF37] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B655F] mb-1">
                  Lieu de livraison / retrait *
                </label>
                <input
                  type="text"
                  required
                  value={orderLieu}
                  onChange={(e) => setOrderLieu(e.target.value)}
                  placeholder="Ex: Djagblé atelier, Agoè, Tokoin, Baguida..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F9F5F0] border border-[#EBDCD0] text-[#1A1A1A] text-xs focus:border-[#D4AF37] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B655F] mb-1">
                  Message facultatif (détails, mesures...)
                </label>
                <textarea
                  rows={2}
                  value={orderMessage}
                  onChange={(e) => setOrderMessage(e.target.value)}
                  placeholder="Ex: Je souhaite faire un essayage ce samedi..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F9F5F0] border border-[#EBDCD0] text-[#1A1A1A] text-xs focus:border-[#D4AF37] outline-none"
                />
              </div>

              {/* Récapitulatif Total */}
              <div className="p-3 rounded-2xl bg-[#FDFBF7] border border-[rgba(212,175,55,0.25)] flex items-center justify-between text-xs">
                <div>
                  <span className="text-[#7A726B] block">Total de la commande :</span>
                  <span className="font-extrabold text-[#D4AF37] text-base">
                    {fmtFCFA(targetProduct.prix * orderQuantite)}
                  </span>
                </div>
                <span className="text-[10px] text-[#7A726B] text-right">
                  {orderQuantite} pièce(s) • Envoi WhatsApp
                </span>
              </div>

              {orderError && (
                <p className="text-xs text-rose-400 bg-rose-950/60 p-2.5 rounded-xl border border-rose-800">
                  {orderError}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmittingOrder}
                className={`whatsapp-btn w-full py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 ${
                  isSubmittingOrder ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {isSubmittingOrder ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>ENREGISTREMENT EN COURS...</span>
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>ENVOYER LA COMMANDE SUR WHATSAPP</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= ORDER CONFIRMATION MODAL ================= */}
      {orderSuccessModal && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setOrderSuccessModal(null)}
        >
          <div
            className="bg-white border border-[rgba(212,175,55,0.4)] rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${
              orderSuccessModal.statut.includes('Hors-ligne')
                ? 'bg-amber-100 text-amber-700 border border-amber-300'
                : 'bg-emerald-950 text-emerald-400 border border-emerald-700'
            }`}>
              {orderSuccessModal.statut.includes('Hors-ligne') ? (
                <Clock className="w-7 h-7" />
              ) : (
                <Check className="w-7 h-7" />
              )}
            </div>

            <div>
              <h3 className="text-xl font-bold font-brand text-[#1A1A1A]">
                {orderSuccessModal.statut.includes('Hors-ligne')
                  ? 'Commande Enregistrée en Local'
                  : 'Commande Transmise !'}
              </h3>
              <p className="text-xs text-[#D4AF37] mt-0.5">
                Réf : <b>{orderSuccessModal.numero_commande}</b>
              </p>
            </div>

            {orderSuccessModal.statut.includes('Hors-ligne') ? (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs text-left space-y-1.5">
                <p className="font-bold flex items-center gap-1.5 text-amber-800">
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Mode hors-ligne : commande non encore transmise</span>
                </p>
                <p className="text-[11px] leading-relaxed">
                  Votre commande est bien sauvegardée sur votre smartphone. Dès que votre connexion revient, vous pourrez l'envoyer sur WhatsApp ou la synchroniser d'un simple clic depuis l'onglet Commande.
                </p>
              </div>
            ) : (
              <p className="text-xs text-[#6B655F] leading-relaxed">
                Votre commande a été transmise via WhatsApp à l'Atelier Martha Fashion. Notre styliste va vérifier vos mesures et confirmer votre commande avec vous.
              </p>
            )}

            <div className="p-3 rounded-2xl bg-[#F9F5F0] text-xs text-left font-mono text-[#1A1A1A] space-y-1 border border-[#EBDCD0]">
              <p>Produit : <b>{orderSuccessModal.produit}</b></p>
              <p>Statut : <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                orderSuccessModal.statut.includes('Hors-ligne')
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>{orderSuccessModal.statut}</span></p>
              <p>Taille : {orderSuccessModal.taille} | Couleur : {orderSuccessModal.couleur}</p>
              <p>Total : <b>{fmtFCFA(orderSuccessModal.prix)}</b></p>
              <p>Lieu : {orderSuccessModal.lieu}</p>
            </div>

            <button
              onClick={() => setOrderSuccessModal(null)}
              className="gold-gradient-btn w-full py-2.5 rounded-xl text-xs font-bold"
            >
              Fermer et continuer
            </button>
          </div>
        </div>
      )}

      {/* ================= SHOPPING CART (PANIER) MODAL ================= */}
      {cartModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
          onClick={() => setCartModalOpen(false)}
        >
          <div
            className="bg-white border border-[rgba(212,175,55,0.45)] rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 my-auto shadow-2xl relative max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#EBDCD0] pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#AA820A] via-[#D4AF37] to-[#F5D77F] flex items-center justify-center text-[#1A1A1A] font-bold shadow-xs">
                  <ShoppingBag className="w-4 h-4 text-[#1A1A1A]" />
                </div>
                <div>
                  <h3 className="font-bold font-brand text-[#1A1A1A] text-base sm:text-lg">
                    Mon Panier Martha Fashion
                  </h3>
                  <span className="text-[10px] text-[#AA820A] font-semibold">
                    {totalCartCount} article{totalCartCount > 1 ? 's' : ''} sélectionné{totalCartCount > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setCartModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[#F9F5F0] text-[#7A726B] hover:text-[#1A1A1A] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            {cart.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-[#F9F5F0] border border-[#EBDCD0] flex items-center justify-center mx-auto text-[#7A726B]">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-base text-[#1A1A1A]">Votre panier est vide</h4>
                <p className="text-xs text-[#7A726B] max-w-xs mx-auto">
                  Découvrez nos confections de haute couture et ajoutez vos créations coup de cœur.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCartModalOpen(false);
                    setActiveTab('catalogue');
                  }}
                  className="gold-gradient-btn px-5 py-2.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#1A1A1A]" />
                  <span>Voir les collections</span>
                </button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {/* List of Cart Items */}
                <div className="space-y-2.5">
                  {cart.map((it) => (
                    <div
                      key={it.id}
                      className="p-3 rounded-2xl bg-[#FFFDF9] border border-[#EBDCD0] flex items-center justify-between gap-3"
                    >
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#F7F2EC] shrink-0 border border-[#EBDCD0] flex items-center justify-center">
                        {it.product.photos && it.product.photos[0] ? (
                          <img
                            src={resolveImageUrl(it.product.photos[0])}
                            alt={it.product.nom}
                            className="product-image w-full h-full object-contain object-center p-0.5 block"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-[#D4AF37] flex items-center justify-center font-brand font-bold text-xs text-[#1A1A1A]">
                            M
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs sm:text-sm text-[#1A1A1A] truncate">
                          {it.product.nom}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-[#7A726B] mt-0.5">
                          <span>Taille: <b className="text-[#1A1A1A]">{it.taille}</b></span>
                          <span>•</span>
                          <span>Couleur: <b className="text-[#1A1A1A]">{it.couleur}</b></span>
                        </div>
                        <span className="font-extrabold text-xs text-[#AA820A] block mt-1">
                          {fmtFCFA(it.product.prix * it.quantite)}
                        </span>
                      </div>

                      {/* Quantity Controls & Delete */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center border border-[#EBDCD0] rounded-lg bg-white overflow-hidden">
                          <button
                            type="button"
                            onClick={() => updateCartQty(it.id, -1)}
                            className="w-6 h-6 flex items-center justify-center text-[#7A726B] hover:text-[#1A1A1A] cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-5 text-center text-xs font-bold text-[#1A1A1A]">
                            {it.quantite}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartQty(it.id, 1)}
                            className="w-6 h-6 flex items-center justify-center text-[#7A726B] hover:text-[#1A1A1A] cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(it.id)}
                          className="w-6 h-6 flex items-center justify-center text-[#7A726B] hover:text-rose-600 transition-colors cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subtotal & Total */}
                <div className="p-3.5 rounded-2xl bg-[#F9F5F0] border border-[#D4AF37]/40 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[#7A726B]">
                    <span>Nombre d'articles :</span>
                    <span className="font-bold text-[#1A1A1A]">{totalCartCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#7A726B]">
                    <span>Livraison / Retrait :</span>
                    <span className="text-[#AA820A] font-semibold">Atelier Djagblé ou Livraison Lomé</span>
                  </div>
                  <div className="pt-2 border-t border-[#EBDCD0] flex items-center justify-between font-bold">
                    <span className="text-sm text-[#1A1A1A]">Montant Total :</span>
                    <span className="text-base text-[#D4AF37] font-extrabold">{fmtFCFA(totalCartAmount)}</span>
                  </div>
                </div>

                {/* Checkout Form */}
                <form onSubmit={handleConfirmCartOrder} className="space-y-3 pt-2">
                  <h4 className="font-bold text-xs text-[#1A1A1A] font-brand uppercase tracking-wider">
                    Vos Coordonnées pour la validation WhatsApp :
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#6B655F] mb-1">
                        Nom complet *
                      </label>
                      <input
                        type="text"
                        required
                        value={cartNom}
                        onChange={(e) => setCartNom(e.target.value)}
                        placeholder="Ex: Akouvi Mensah"
                        className="w-full px-3 py-2 rounded-xl bg-[#F9F5F0] border border-[#EBDCD0] text-[#1A1A1A] text-xs focus:border-[#D4AF37] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#6B655F] mb-1">
                        Numéro WhatsApp *
                      </label>
                      <input
                        type="tel"
                        required
                        value={cartTel}
                        onChange={(e) => setCartTel(e.target.value)}
                        placeholder="Ex: +228 90 12 34 56"
                        className="w-full px-3 py-2 rounded-xl bg-[#F9F5F0] border border-[#EBDCD0] text-[#1A1A1A] text-xs focus:border-[#D4AF37] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#6B655F] mb-1">
                      Lieu de livraison / retrait *
                    </label>
                    <input
                      type="text"
                      required
                      value={cartLieu}
                      onChange={(e) => setCartLieu(e.target.value)}
                      placeholder="Ex: Atelier Djagblé, Lomé Agoè, Adidogomé..."
                      className="w-full px-3 py-2 rounded-xl bg-[#F9F5F0] border border-[#EBDCD0] text-[#1A1A1A] text-xs focus:border-[#D4AF37] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#6B655F] mb-1">
                      Notes ou mensurations personnalisées (optionnel)
                    </label>
                    <textarea
                      rows={2}
                      value={cartMessage}
                      onChange={(e) => setCartMessage(e.target.value)}
                      placeholder="Précisez un détail de confection, un délai particulier..."
                      className="w-full px-3 py-2 rounded-xl bg-[#F9F5F0] border border-[#EBDCD0] text-[#1A1A1A] text-xs focus:border-[#D4AF37] outline-none"
                    />
                  </div>

                  {cartError && (
                    <p className="text-xs text-rose-500 bg-rose-50 p-2 rounded-xl border border-rose-200">
                      {cartError}
                    </p>
                  )}

                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                    <button
                      type="submit"
                      disabled={isSubmittingOrder}
                      className={`whatsapp-btn flex-1 w-full py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                        isSubmittingOrder ? 'opacity-75 cursor-not-allowed' : ''
                      }`}
                    >
                      {isSubmittingOrder ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>ENREGISTREMENT EN COURS...</span>
                        </>
                      ) : (
                        <>
                          <MessageCircle className="w-4 h-4 fill-white" />
                          <span>COMMANDER LE PANIER SUR WHATSAPP</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={isSubmittingOrder}
                      onClick={clearCart}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-[#F9F5F0] text-[#7A726B] hover:text-[#1A1A1A] text-xs font-semibold border border-[#EBDCD0] cursor-pointer"
                    >
                      Vider
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= ADMIN CREATE / EDIT PRODUCT MODAL ================= */}
      {productFormOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
          onClick={() => setProductFormOpen(false)}
        >
          <div
            className="bg-white border border-[rgba(212,175,55,0.4)] rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 my-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#EBDCD0] pb-3">
              <h3 className="font-bold font-brand text-[#1A1A1A] text-base">
                {editingProduct ? 'Modifier le produit' : 'Ajouter un nouveau produit'}
              </h3>
              <button
                onClick={() => setProductFormOpen(false)}
                className="w-7 h-7 rounded-full bg-[#F9F5F0] text-[#7A726B] hover:text-[#1A1A1A] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5 max-h-[75vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-semibold text-[#6B655F] mb-1">
                  Nom du vêtement *
                </label>
                <input
                  type="text"
                  required
                  value={pNom}
                  onChange={(e) => setPNom(e.target.value)}
                  placeholder="Ex: Robe Wax Prestige"
                  className="w-full px-3 py-2 rounded-xl bg-[#F9F5F0] border border-[#EBDCD0] text-[#1A1A1A] text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#6B655F] mb-1">
                    Prix en FCFA *
                  </label>
                  <input
                    type="number"
                    required
                    min="100"
                    step="100"
                    value={pPrix}
                    onChange={(e) => setPPrix(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Ex: 35000"
                    className="w-full px-3 py-2 rounded-xl bg-[#F9F5F0] border border-[#EBDCD0] text-[#1A1A1A] text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6B655F] mb-1">
                    Catégorie *
                  </label>
                  <select
                    value={pCat}
                    onChange={(e) => setPCat(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F9F5F0] border border-[#EBDCD0] text-[#1A1A1A] text-xs outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.nom}>
                        {c.nom}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B655F] mb-1">
                  Description &amp; Matières
                </label>
                <textarea
                  rows={2}
                  value={pDesc}
                  onChange={(e) => setPDesc(e.target.value)}
                  placeholder="Détails du tissu (wax, lin, bazin), coupe, occasion..."
                  className="w-full px-3 py-2 rounded-xl bg-[#F9F5F0] border border-[#EBDCD0] text-[#1A1A1A] text-xs outline-none"
                />
              </div>

              {/* Photos Management & Gallery Picker */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[#6B655F]">
                    Photos du vêtement ({pPhotos.length})
                  </label>
                  {/* Gallery upload trigger button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1 rounded-lg bg-[rgba(212,175,55,0.15)] text-[#D4AF37] border border-[rgba(212,175,55,0.3)] text-[11px] font-bold flex items-center gap-1 hover:bg-[rgba(212,175,55,0.25)] transition-colors"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Depuis la galerie</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleGalleryUpload}
                    className="hidden"
                  />
                </div>

                {/* Direct URL input fallback */}
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={pUrlPhotoInput}
                    onChange={(e) => setPUrlPhotoInput(e.target.value)}
                    placeholder="Ou coller une URL d'image..."
                    className="flex-1 px-3 py-1.5 rounded-xl bg-[#F9F5F0] border border-[#EBDCD0] text-[#1A1A1A] text-xs outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (pUrlPhotoInput.trim()) {
                        setPPhotos((prev) => [...prev, pUrlPhotoInput.trim()]);
                        setPUrlPhotoInput('');
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#F9F5F0] border border-[#EBDCD0] text-xs font-bold text-[#1A1A1A]"
                  >
                    Ajouter
                  </button>
                </div>

                {/* Upload in progress indicator */}
                {isUploadingPhoto && (
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#D4AF37]" />
                    <span>Téléversement de la photo vers le stockage central en cours...</span>
                  </div>
                )}

                {/* Photos previews list */}
                {pPhotos.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
                    {pPhotos.map((url, idx) => (
                      <div key={idx} className="relative w-14 h-16 rounded-lg overflow-hidden shrink-0 border border-[#EBDCD0] bg-[#F7F2EC] flex items-center justify-center">
                        <img src={resolveImageUrl(url)} alt="" className="product-image w-full h-full object-contain object-center p-0.5 block" />
                        <button
                          type="button"
                          onClick={() => setPPhotos((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/80 text-rose-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tailles */}
              <div>
                <label className="block text-xs font-semibold text-[#6B655F] mb-1">
                  Tailles disponibles ({pTailles.join(', ')})
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={pSizeInput}
                    onChange={(e) => setPSizeInput(e.target.value)}
                    placeholder="Ajouter une taille (ex: XL, Sur-mesure)..."
                    className="flex-1 px-3 py-1.5 rounded-xl bg-[#F9F5F0] border border-[#EBDCD0] text-[#1A1A1A] text-xs outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (pSizeInput.trim() && !pTailles.includes(pSizeInput.trim())) {
                        setPTailles([...pTailles, pSizeInput.trim()]);
                        setPSizeInput('');
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#F9F5F0] border border-[#EBDCD0] text-xs font-bold text-[#1A1A1A]"
                  >
                    +
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {pTailles.map((tz, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F9F5F0] text-[10px] text-[#1A1A1A] border border-[#EBDCD0]"
                    >
                      {tz}
                      <button
                        type="button"
                        onClick={() => setPTailles(pTailles.filter((_, idx) => idx !== i))}
                        className="hover:text-rose-400"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Couleurs */}
              <div>
                <label className="block text-xs font-semibold text-[#6B655F] mb-1">
                  Couleurs disponibles ({pCouleurs.join(', ')})
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={pColorInput}
                    onChange={(e) => setPColorInput(e.target.value)}
                    placeholder="Ajouter une couleur (ex: Or, Noir, Bleu)..."
                    className="flex-1 px-3 py-1.5 rounded-xl bg-[#F9F5F0] border border-[#EBDCD0] text-[#1A1A1A] text-xs outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (pColorInput.trim() && !pCouleurs.includes(pColorInput.trim())) {
                        setPCouleurs([...pCouleurs, pColorInput.trim()]);
                        setPColorInput('');
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#F9F5F0] border border-[#EBDCD0] text-xs font-bold text-[#1A1A1A]"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Toggles (Disponible, Populaire, Nouveau, Promo) */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pDisponible}
                    onChange={(e) => setPDisponible(e.target.checked)}
                    className="accent-[#D4AF37]"
                  />
                  <span>En stock / Disponible</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pNouveau}
                    onChange={(e) => setPNouveau(e.target.checked)}
                    className="accent-[#D4AF37]"
                  />
                  <span>Nouveauté</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pPopulaire}
                    onChange={(e) => setPPopulaire(e.target.checked)}
                    className="accent-[#D4AF37]"
                  />
                  <span>Populaire</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pPromo}
                    onChange={(e) => setPPromo(e.target.checked)}
                    className="accent-[#D4AF37]"
                  />
                  <span>En promotion</span>
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="gold-gradient-btn w-full py-2.5 rounded-xl text-xs font-bold"
                >
                  {editingProduct ? 'Enregistrer les modifications' : 'Ajouter au catalogue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ADMIN CREATE / EDIT CATEGORY MODAL ================= */}
      {catFormOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setCatFormOpen(false)}
        >
          <div
            className="bg-white border border-[rgba(212,175,55,0.4)] rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#EBDCD0] pb-2">
              <h3 className="font-bold text-[#1A1A1A] text-sm">
                {editingCat ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
              </h3>
              <button
                onClick={() => setCatFormOpen(false)}
                className="w-6 h-6 rounded-full bg-[#F9F5F0] text-[#7A726B] hover:text-[#1A1A1A] flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#6B655F] mb-1">
                  Nom de la catégorie *
                </label>
                <input
                  type="text"
                  required
                  value={cNom}
                  onChange={(e) => setCNom(e.target.value)}
                  placeholder="Ex: Robes de soirée"
                  className="w-full px-3 py-2 rounded-xl bg-[#F9F5F0] border border-[#EBDCD0] text-[#1A1A1A] text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B655F] mb-1">
                  URL Image d'illustration
                </label>
                <input
                  type="url"
                  value={cImage}
                  onChange={(e) => setCImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 rounded-xl bg-[#F9F5F0] border border-[#EBDCD0] text-[#1A1A1A] text-xs outline-none"
                />
              </div>

              <button
                type="submit"
                className="gold-gradient-btn w-full py-2 rounded-xl text-xs font-bold"
              >
                Enregistrer
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: GUIDE & TÉLÉCHARGEMENT APK ANDROID ================= */}
      {showApkGuideModal && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
          onClick={() => setShowApkGuideModal(false)}
        >
          <div
            className="bg-white border border-[rgba(212,175,55,0.45)] rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#EBDCD0] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[rgba(212,175,55,0.15)] border border-[#D4AF37] flex items-center justify-center text-[#D4AF37]">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold font-brand text-[#1A1A1A] text-base">
                    Application Android « Martha Fashion »
                  </h3>
                  <span className="text-[10px] text-emerald-400 font-bold">
                    ✓ APK Compilé &amp; Signé (Release v1.0.0)
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowApkGuideModal(false)}
                className="w-7 h-7 rounded-full bg-[#F9F5F0] text-[#7A726B] hover:text-[#1A1A1A] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Direct Download Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FFFDF9] via-white to-[#F9F5F0] border border-[#D4AF37] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#997520] block">
                    Fichier Prêt au Téléchargement
                  </span>
                  <span className="text-[#1A1A1A] font-mono text-xs font-bold">
                    martha-fashion.apk (1.2 Mo • Release v1.1.0 Autonome)
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                  Release v1.1.0
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <a
                  href="/martha-fashion.apk"
                  download="martha-fashion.apk"
                  className="gold-gradient-btn py-3 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Télécharger l'APK v1.1.0 (.apk)</span>
                </a>

                <a
                  href="https://ais-dev-w4zmunnt4yz2wwv7weeuom-497052180324.europe-west2.run.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white border-2 border-[#D4AF37] py-3 px-3 rounded-xl text-xs font-bold text-[#1A1A1A] hover:bg-[#FFFDF9] flex items-center justify-center gap-2 transition-all shadow-xs"
                >
                  <ExternalLink className="w-4 h-4 text-[#D4AF37]" />
                  <span>Ouvrir la Boutique Web</span>
                </a>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                <b>💡 Conseil d'installation :</b> Si vous aviez déjà installé une version précédente de Martha Fashion, <b>désinstallez-la d'abord</b> de votre téléphone (appui long sur l'icône &gt; Désinstaller), puis installez cet APK v1.1.0 tout neuf pour éviter tout conflit de signature Android.
              </div>
            </div>

            {/* Anti Black-screen guarantee card */}
            <div className="p-3 rounded-2xl bg-[#FFFDF9] border border-[#EBDCD0] text-xs space-y-1">
              <span className="font-bold text-[#997520] block">✓ Correction écran noir appliquée :</span>
              <p className="text-[#6B655F] text-[11px] leading-relaxed">
                Le fond natif est configuré sur <b>#FFFBF5</b> avec barre de statut lumineuse et un <b>loader doré</b> centré avec le logo royal Martha Fashion, supprimant tout écran noir au démarrage.
              </p>
            </div>

            {/* Technical specs */}
            <div className="p-3 rounded-2xl bg-[#FDFBF7] border border-[#EBDCD0] space-y-1.5 text-[11px]">
              <div className="flex justify-between py-0.5 border-b border-[#EBDCD0]/60 text-[#1A1A1A]">
                <span className="text-[#7A726B]">Nom :</span>
                <span className="font-bold text-[#997520]">Martha Fashion</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-[#EBDCD0]/60 text-[#1A1A1A]">
                <span className="text-[#7A726B]">Package ID :</span>
                <span className="font-mono text-[#6B655F]">com.marthafashion.app</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-[#EBDCD0]/60 text-[#1A1A1A]">
                <span className="text-[#7A726B]">Compatibilité :</span>
                <span className="text-[#1A1A1A]">Android 5.0 à 14+ (API 21 - 34)</span>
              </div>
              <div className="flex justify-between py-0.5 text-[#1A1A1A]">
                <span className="text-[#7A726B]">Signature APK :</span>
                <span className="text-emerald-600 font-bold">Certifiée v1 + v2 + v3</span>
              </div>
            </div>

            {/* Installation Instructions */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold font-brand text-[#997520] text-xs uppercase tracking-wider">
                Comment installer en 3 étapes :
              </h4>

              <div className="p-2.5 rounded-xl bg-[#FDFBF7] border border-[#EBDCD0] flex gap-2.5 items-start">
                <span className="w-5 h-5 rounded-full bg-[#D4AF37] text-[#1A1A1A] font-bold text-[11px] flex items-center justify-center shrink-0">1</span>
                <div>
                  <b className="text-[#1A1A1A] block">Télécharger le fichier APK</b>
                  <p className="text-[#7A726B] text-[11px]">Appuyez sur le bouton doré ci-dessus. Le téléchargement démarre immédiatement.</p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#FDFBF7] border border-[#EBDCD0] flex gap-2.5 items-start">
                <span className="w-5 h-5 rounded-full bg-[#D4AF37] text-[#1A1A1A] font-bold text-[11px] flex items-center justify-center shrink-0">2</span>
                <div>
                  <b className="text-[#1A1A1A] block">Ouvrir le fichier</b>
                  <p className="text-[#7A726B] text-[11px]">Appuyez sur la notification Android ou ouvrez le dossier <i>Téléchargements</i> de votre téléphone.</p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#FDFBF7] border border-[#EBDCD0] flex gap-2.5 items-start">
                <span className="w-5 h-5 rounded-full bg-[#D4AF37] text-[#1A1A1A] font-bold text-[11px] flex items-center justify-center shrink-0">3</span>
                <div>
                  <b className="text-[#1A1A1A] block">Autoriser &amp; Installer</b>
                  <p className="text-[#7A726B] text-[11px]">Si Android demande une autorisation ("Sources inconnues"), appuyez sur <i>Paramètres &gt; Autoriser</i> puis validez <i>Installer</i>.</p>
                </div>
              </div>
            </div>

            {/* Developer project zip link */}
            <div className="pt-1 flex flex-col sm:flex-row gap-2">
              <a
                href="/api/download-android-zip"
                download="martha-fashion-android.zip"
                className="flex-1 py-2 rounded-xl bg-[#F9F5F0] border border-[#EBDCD0] text-[11px] font-bold text-[#7A726B] hover:text-[#D4AF37] hover:border-[#D4AF37] flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Code Source Kotlin Compose (.zip)</span>
              </a>

              <button
                type="button"
                onClick={() => setShowApkGuideModal(false)}
                className="py-2 px-4 rounded-xl bg-[#F9F5F0] border border-[#EBDCD0] text-xs font-bold text-[#1A1A1A] hover:border-[#D4AF37]"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= TOAST NOTIFICATION ================= */}
      {toast && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#F9F5F0] border border-[#D4AF37] text-[#1A1A1A] text-xs font-semibold shadow-2xl animate-fade-in pointer-events-none flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>{toast}</span>
        </div>
      )}

      {/* ================= BOTTOM ANDROID NAVIGATION BAR ================= */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-[#EBDCD0] shadow-[0_-4px_20px_rgba(60,40,20,0.06)] md:hidden px-2 py-1.5 pb-safe">
        <div className="grid grid-cols-5 items-center">
          <button
            onClick={() => setActiveTab('accueil')}
            className={`flex flex-col items-center gap-1 py-1 transition-colors ${
              activeTab === 'accueil' ? 'text-[#D4AF37]' : 'text-[#7A726B]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-[10px] font-bold">Accueil</span>
          </button>

          <button
            onClick={() => setActiveTab('catalogue')}
            className={`flex flex-col items-center gap-1 py-1 transition-colors ${
              activeTab === 'catalogue' ? 'text-[#D4AF37]' : 'text-[#7A726B]'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="text-[10px] font-bold">Collections</span>
          </button>

          <button
            onClick={() => setCartModalOpen(true)}
            className="relative flex flex-col items-center gap-1 py-1 transition-colors text-[#7A726B] hover:text-[#D4AF37]"
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4 text-[#D4AF37]" />
              {totalCartCount > 0 && (
                <span className="absolute -top-1.5 -right-2 px-1 rounded-full bg-[#D4AF37] text-[#1A1A1A] text-[9px] font-black leading-none">
                  {totalCartCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold">Panier</span>
          </button>

          <button
            onClick={() => setActiveTab('commande')}
            className={`flex flex-col items-center gap-1 py-1 transition-colors ${
              activeTab === 'commande' ? 'text-[#D4AF37]' : 'text-[#7A726B]'
            }`}
          >
            <Send className="w-4 h-4" />
            <span className="text-[10px] font-bold">Commande</span>
          </button>

          <button
            onClick={() => setActiveTab('contact')}
            className={`flex flex-col items-center gap-1 py-1 transition-colors ${
              activeTab === 'contact' ? 'text-[#D4AF37]' : 'text-[#7A726B]'
            }`}
          >
            <Phone className="w-4 h-4" />
            <span className="text-[10px] font-bold">Contact</span>
          </button>
        </div>
      </nav>

      {/* ================= PIED DE PAGE (FOOTER) ================= */}
      <footer className="mt-12 border-t border-[#EBDCD0] bg-white/90 backdrop-blur-md pt-8 pb-24 md:pb-14 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 text-xs text-[#6B655F]">
          {/* Col 1: Marque & Présentation */}
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#AA820A] via-[#D4AF37] to-[#F5D77F] flex items-center justify-center text-[#1A1A1A] font-black font-brand text-xs shadow-md">
                M
              </div>
              <div>
                <span className="font-bold font-brand tracking-wider text-sm text-[#1A1A1A] block">
                  {settings.nom_boutique}
                </span>
                <span className="text-[10px] text-[#D4AF37] italic">
                  {settings.slogan}
                </span>
              </div>
            </div>
            <p className="text-[11px] leading-relaxed max-w-sm text-[#7A726B]">
              Maison de haute couture et confections d'exception à Djagblé. Collections Femme, Homme, Enfant et créations sur-mesure pour cérémonies et événements.
            </p>
            <div className="flex items-center gap-2 pt-1 text-[11px] text-[#997520]">
              <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{settings.localisation}</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[#1A1A1A]">
              <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
              <span>WhatsApp : <b>{settings.whatsapp}</b></span>
            </div>
          </div>

          {/* Col 2: Navigation Rapide */}
          <div className="space-y-2">
            <span className="font-bold font-brand uppercase tracking-wider text-[#1A1A1A] block text-[11px]">
              Navigation
            </span>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <button onClick={() => setActiveTab('accueil')} className="hover:text-[#D4AF37] transition-colors cursor-pointer">
                  Accueil
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('catalogue')} className="hover:text-[#D4AF37] transition-colors cursor-pointer">
                  Collections &amp; Catalogue
                </button>
              </li>
              <li>
                <button onClick={() => setCartModalOpen(true)} className="hover:text-[#D4AF37] transition-colors cursor-pointer">
                  Mon Panier ({totalCartCount})
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('commande')} className="hover:text-[#D4AF37] transition-colors cursor-pointer">
                  Passer une Commande
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('contact')} className="hover:text-[#D4AF37] transition-colors cursor-pointer">
                  Contact &amp; Atelier
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Espace Administration */}
          <div className="space-y-2.5">
            <span className="font-bold font-brand uppercase tracking-wider text-[#1A1A1A] block text-[11px]">
              Espace Administrateur
            </span>
            <p className="text-[11px] text-[#7A726B]">
              Accès réservé pour la gestion des créations, stocks, collections et commandes clients.
            </p>
            <button
              onClick={() => setActiveTab('admin')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F5D77F] text-[#1A1A1A] font-bold text-xs shadow-md hover:brightness-105 transition-all cursor-pointer"
            >
              <Shield className="w-4 h-4 text-[#1A1A1A]" />
              <span>Espace Administration</span>
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto border-t border-[#EBDCD0]/60 mt-6 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-[#7A726B]">
          <span>© {new Date().getFullYear()} {settings.nom_boutique} — Djagblé, Togo. Tous droits réservés.</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('admin')}
              className="hover:text-[#D4AF37] flex items-center gap-1 font-semibold cursor-pointer"
            >
              <Lock className="w-3 h-3 text-[#D4AF37]" />
              <span>Accès /admin</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Desktop Navigation Links */}
      <div className="hidden md:flex fixed bottom-6 left-1/2 -translate-x-1/2 z-40 px-5 py-2 rounded-full bg-white/95 backdrop-blur-md border border-[#EBDCD0] shadow-xl items-center gap-5 text-xs font-bold">
        {[
          { key: 'accueil', label: 'Accueil' },
          { key: 'catalogue', label: 'Collections' },
          { key: 'commande', label: 'Commande' },
          { key: 'contact', label: 'Contact' },
          { key: 'admin', label: 'Administration' }
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setActiveTab(item.key as any)}
            className={`transition-colors cursor-pointer ${
              activeTab === item.key ? 'text-[#D4AF37] font-extrabold' : 'text-[#7A726B] hover:text-[#1A1A1A]'
            }`}
          >
            {item.label}
          </button>
        ))}

        <span className="w-px h-4 bg-[#EBDCD0]" />

        <button
          onClick={() => setCartModalOpen(true)}
          className="flex items-center gap-1.5 text-[#7A726B] hover:text-[#D4AF37] transition-colors cursor-pointer"
        >
          <ShoppingBag className="w-4 h-4 text-[#D4AF37]" />
          <span>Panier ({totalCartCount})</span>
        </button>
      </div>

      {/* Fullscreen Photo Lightbox Modal (Vue intégrale haute définition sans aucune coupure) */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-3 select-none"
          onClick={() => setFullscreenImage(null)}
        >
          <button
            onClick={() => setFullscreenImage(null)}
            className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-white/10 hover:bg-[#D4AF37] text-white hover:text-[#1A1A1A] transition-colors cursor-pointer shadow-lg"
            title="Fermer le plein écran"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="relative w-full h-full max-w-4xl max-h-[92vh] flex items-center justify-center overflow-hidden">
            <img
              src={fullscreenImage}
              alt="Photo intégrale vêtement Martha Fashion"
              className="w-full h-full object-contain object-center max-w-full max-h-full block drop-shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <p className="text-white/70 text-xs mt-2 font-medium">Touchez n'importe où pour fermer</p>
        </div>
      )}
    </div>
  );
}

// Sub-component: Product Card (Light Luxury with Voir le produit & Commander)
function ProductCard({
  product,
  onSelect,
  onOrder,
  onAddToCart
}: {
  product: Product;
  onSelect: () => void;
  onOrder: () => void;
  onAddToCart?: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const hasPhoto = !imgError && product.photos && product.photos.length > 0 && Boolean(product.photos[0]);

  return (
    <article
      onClick={onSelect}
      className="group bg-white border border-[#EBDCD0] hover:border-[#D4AF37] rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 cursor-pointer shadow-[0_4px_16px_rgba(60,40,20,0.05)] hover:shadow-[0_10px_28px_rgba(180,140,75,0.14)]"
    >
      <div className="product-card-image-container product-image-container relative aspect-3/4 overflow-hidden bg-[#F7F2EC] flex items-center justify-center">
        {hasPhoto ? (
          <img
            src={resolveImageUrl(product.photos[0])}
            alt={product.nom}
            loading="lazy"
            onError={() => setImgError(true)}
            className="product-card-image product-image w-full h-full object-contain object-center p-1.5 group-hover:scale-102 transition-transform duration-300 block select-none"
          />
        ) : (
          /* Visuel de remplacement élégant avec monogramme doré M */
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#FFFDF9] via-[#FAF3EA] to-[#F3E7D5] text-center select-none">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#AA820A] via-[#D4AF37] to-[#F5D77F] flex items-center justify-center text-[#1A1A1A] font-black font-brand text-xl shadow-md mb-2">
              M
            </div>
            <span className="font-brand font-bold text-xs text-[#1A1A1A] tracking-wider uppercase px-2 line-clamp-2">
              {product.nom}
            </span>
            <span className="text-[10px] text-[#AA820A] font-semibold mt-1 bg-white/80 px-2 py-0.5 rounded-full border border-[#D4AF37]/30">
              {product.categorie}
            </span>
            <span className="text-[9px] text-[#7A726B] italic mt-1">Photo bientôt disponible</span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
          {product.nouveau && (
            <span className="px-2 py-0.5 rounded-full bg-white/95 backdrop-blur-xs text-[#997520] border border-[#D4AF37]/50 text-[9px] font-bold shadow-xs">
              Nouveau
            </span>
          )}
          {product.promo && (
            <span className="px-2 py-0.5 rounded-full bg-rose-50 backdrop-blur-xs text-rose-700 border border-rose-300 text-[9px] font-bold shadow-xs">
              Promo
            </span>
          )}
        </div>

        <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-white/90 text-[#6B655F] text-[9px] font-semibold border border-[#EBDCD0] shadow-xs">
          {product.categorie}
        </span>
      </div>

      <div className="p-3.5 flex-1 flex flex-col justify-between bg-white">
        <div>
          <h4 className="font-bold text-xs sm:text-sm text-[#1A1A1A] line-clamp-1 group-hover:text-[#B58A2A] transition-colors">
            {product.nom}
          </h4>
          <p className="text-[11px] text-[#6B655F] line-clamp-1 mt-0.5">
            {product.description}
          </p>
        </div>

        <div className="mt-3 pt-2.5 border-t border-[#F3EAE1] space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-xs sm:text-sm text-[#B58A2A]">
              {fmtFCFA(product.prix)}
            </span>
            {onAddToCart && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCart();
                }}
                className="p-1.5 rounded-full bg-[#F9F5F0] hover:bg-[#FFFDF9] border border-[#EBDCD0] hover:border-[#D4AF37] text-[#D4AF37] transition-all cursor-pointer"
                title="Ajouter au panier"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              className="py-1.5 px-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 bg-[#F9F5F0] text-[#1A1A1A] border border-[#EBDCD0] hover:border-[#D4AF37] hover:bg-[#FFFDF9] transition-all cursor-pointer shadow-xs"
              title="Voir le produit"
            >
              <Eye className="w-3 h-3 text-[#D4AF37]" />
              <span>Voir le produit</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOrder();
              }}
              className="py-1.5 px-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 bg-white text-[#1A1A1A] border border-[#D4AF37] hover:bg-[#FFFDF9] hover:border-[#B58A2A] transition-all shadow-xs cursor-pointer"
              title="Commander sur WhatsApp"
            >
              <MessageCircle className="w-3 h-3 text-[#25D366]" />
              <span>Commander</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
