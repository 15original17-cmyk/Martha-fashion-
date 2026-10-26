/**
 * Service Firebase unifié pour Martha Fashion
 * - Firestore (Produits, Catégories, Paramètres, Commandes, Rôles Admins)
 * - Cloud Storage (Photos de vêtements haute résolution)
 * - Firebase Authentication (Connexion sécurisée gérante / administrateur)
 * - Synchronisation en temps réel avec écouteurs onSnapshot
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  Unsubscribe,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth, storage, OperationType, handleFirestoreError, uploadImageToStorage } from '../firebase';
import type { Product, Order, Category, StoreSettings } from '../App';

const PRODUCTS_COL = 'products';
const ORDERS_COL = 'orders';
const CATEGORIES_COL = 'categories';
const SETTINGS_COL = 'settings';
const ADMINS_COL = 'admins';

/**
 * Initialisation et sauvegarde des données existantes :
 * Si Firestore est vide, injecte proprement les données par défaut sans écraser l'existant.
 */
export async function seedInitialDataIfEmpty(initialProducts: Product[], initialCategories: Category[], initialSettings: StoreSettings) {
  try {
    const productsSnap = await getDocs(collection(db, PRODUCTS_COL));
    if (productsSnap.empty) {
      console.log('[Firebase] Migration initiale : Enregistrement du catalogue dans Firestore...');
      for (const prod of initialProducts) {
        await setDoc(doc(db, PRODUCTS_COL, prod.id), {
          ...prod,
          date_modification: new Date().toISOString()
        });
      }
    }

    const catSnap = await getDocs(collection(db, CATEGORIES_COL));
    if (catSnap.empty) {
      for (const cat of initialCategories) {
        await setDoc(doc(db, CATEGORIES_COL, cat.id), cat);
      }
    }

    const settingsDoc = await getDoc(doc(db, SETTINGS_COL, 'store'));
    if (!settingsDoc.exists()) {
      await setDoc(doc(db, SETTINGS_COL, 'store'), initialSettings);
    }
  } catch (error) {
    console.warn('[Firebase] Note lors de la vérification initiale :', error);
  }
}

/**
 * Écouteur en temps réel pour le catalogue de produits (avec désabonnement propre)
 */
export function subscribeToProducts(
  onUpdate: (products: Product[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const colRef = collection(db, PRODUCTS_COL);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Product[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Product;
        items.push({
          ...data,
          id: docSnap.id
        });
      });
      // Tri du plus récent au plus ancien si date présente
      items.sort((a, b) => {
        const dateA = a.date_creation ? new Date(a.date_creation).getTime() : 0;
        const dateB = b.date_creation ? new Date(b.date_creation).getTime() : 0;
        return dateB - dateA;
      });
      onUpdate(items);
    },
    (error) => {
      console.error('[Firebase] Erreur écouteur produits:', error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, PRODUCTS_COL);
    }
  );
}

/**
 * Écouteur en temps réel pour les catégories (avec désabonnement propre)
 */
export function subscribeToCategories(
  onUpdate: (categories: Category[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const colRef = collection(db, CATEGORIES_COL);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Category[] = [];
      snapshot.forEach((docSnap) => {
        items.push({
          ...(docSnap.data() as Category),
          id: docSnap.id
        });
      });
      onUpdate(items);
    },
    (error) => {
      console.error('[Firebase] Erreur écouteur catégories:', error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, CATEGORIES_COL);
    }
  );
}

/**
 * Écouteur en temps réel pour les paramètres de la boutique
 */
export function subscribeToSettings(
  onUpdate: (settings: StoreSettings) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const docRef = doc(db, SETTINGS_COL, 'store');
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data() as StoreSettings);
      }
    },
    (error) => {
      console.error('[Firebase] Erreur écouteur paramètres:', error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, `${SETTINGS_COL}/store`);
    }
  );
}

/**
 * Écouteur en temps réel pour les commandes :
 * - Si administrateur : toutes les commandes
 * - Si cliente identifiée : seulement ses propres commandes (protection stricte des données)
 */
export function subscribeToOrders(
  isAdmin: boolean,
  customerUid: string | null,
  onUpdate: (orders: Order[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const colRef = collection(db, ORDERS_COL);
  let q = query(colRef);

  if (!isAdmin && customerUid) {
    q = query(colRef, where('customerUid', '==', customerUid));
  } else if (!isAdmin && !customerUid) {
    // Une cliente non connectée ne peut pas lister les commandes des autres
    onUpdate([]);
    return () => {};
  }

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Order[] = [];
      snapshot.forEach((docSnap) => {
        items.push({
          ...(docSnap.data() as Order),
          id: docSnap.id
        });
      });
      // Trier par date décroissante
      items.sort((a, b) => {
        const dateA = a.date_commande ? new Date(a.date_commande).getTime() : 0;
        const dateB = b.date_commande ? new Date(b.date_commande).getTime() : 0;
        return dateB - dateA;
      });
      onUpdate(items);
    },
    (error) => {
      console.error('[Firebase] Erreur écouteur commandes:', error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, ORDERS_COL);
    }
  );
}

/**
 * Enregistrement / mise à jour d'un produit dans Firestore
 */
export async function saveProductToFirestore(product: Product): Promise<void> {
  const path = `${PRODUCTS_COL}/${product.id}`;
  try {
    const dataToSave = {
      ...product,
      date_modification: new Date().toISOString()
    };
    await setDoc(doc(db, PRODUCTS_COL, product.id), dataToSave, { merge: true });
    console.log(`[Firebase] Produit ${product.id} enregistré avec succès.`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Suppression d'un produit dans Firestore
 */
export async function deleteProductFromFirestore(productId: string): Promise<void> {
  const path = `${PRODUCTS_COL}/${productId}`;
  try {
    await deleteDoc(doc(db, PRODUCTS_COL, productId));
    console.log(`[Firebase] Produit ${productId} supprimé.`);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Enregistrement / mise à jour des paramètres de la boutique
 */
export async function saveSettingsToFirestore(settings: StoreSettings): Promise<void> {
  const path = `${SETTINGS_COL}/store`;
  try {
    await setDoc(doc(db, SETTINGS_COL, 'store'), settings, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Enregistrement d'une commande dans Firestore avec vérification stricte
 */
export async function createOrderInFirestore(order: Omit<Order, 'id'> & { id?: string; customerUid?: string }): Promise<string> {
  // 1. Validation stricte avant enregistrement
  if (!order.nom_client || order.nom_client.trim().length === 0) {
    throw new Error('Le nom de la cliente est obligatoire.');
  }
  if (!order.telephone || order.telephone.trim().length === 0) {
    throw new Error('Le numéro de téléphone est obligatoire.');
  }
  if (!order.produit || order.produit.trim().length === 0) {
    throw new Error('La désignation du vêtement est obligatoire.');
  }
  if (!order.quantite || order.quantite <= 0) {
    throw new Error('La quantité doit être supérieure à zéro.');
  }
  if (typeof order.prix !== 'number' || order.prix < 0) {
    throw new Error('Le prix doit être un nombre positif en FCFA.');
  }

  const orderId = order.id || `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const path = `${ORDERS_COL}/${orderId}`;

  const payload: Order & { customerUid?: string } = {
    id: orderId,
    numero_commande: order.numero_commande || `MF-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    nom_client: order.nom_client.trim(),
    telephone: order.telephone.trim(),
    produit: order.produit.trim(),
    taille: order.taille || 'Standard',
    couleur: order.couleur || 'Standard',
    quantite: Number(order.quantite),
    prix: Number(order.prix),
    lieu: order.lieu?.trim() || 'À convenir',
    message: order.message?.trim() || '',
    statut: order.statut || 'Nouvelle',
    date_commande: order.date_commande || new Date().toISOString(),
    ...(order.customerUid ? { customerUid: order.customerUid } : {})
  };

  try {
    await setDoc(doc(db, ORDERS_COL, orderId), payload);
    console.log(`[Firebase] Commande ${orderId} créée avec succès.`);
    return orderId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

/**
 * Mise à jour du statut d'une commande par l'administrateur
 */
export async function updateOrderStatusInFirestore(orderId: string, newStatus: Order['statut']): Promise<void> {
  const path = `${ORDERS_COL}/${orderId}`;
  try {
    await updateDoc(doc(db, ORDERS_COL, orderId), {
      statut: newStatus
    });
    console.log(`[Firebase] Statut de la commande ${orderId} mis à jour : ${newStatus}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Suppression d'une commande par l'administrateur
 */
export async function deleteOrderFromFirestore(orderId: string): Promise<void> {
  const path = `${ORDERS_COL}/${orderId}`;
  try {
    await deleteDoc(doc(db, ORDERS_COL, orderId));
    console.log(`[Firebase] Commande ${orderId} supprimée.`);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Vérification du rôle Administrateur :
 * Vérifie si l'utilisateur connecté est listé dans la collection /admins/{uid}
 * ou possède une autorisation légitime (gérante de Martha Fashion).
 */
export async function verifyAdminRole(uid: string): Promise<boolean> {
  try {
    const adminDoc = await getDoc(doc(db, ADMINS_COL, uid));
    if (adminDoc.exists()) {
      return true;
    }
    // Si l'utilisateur est le propriétaire sodoga59@gmail.com ou a un email gérante
    const currentUser = auth.currentUser;
    if (currentUser?.email && (
      currentUser.email.toLowerCase() === 'sodoga59@gmail.com' ||
      currentUser.email.includes('martha') ||
      currentUser.email.endsWith('@marthafashion.com')
    )) {
      return true;
    }
    return false;
  } catch (err) {
    console.warn('[Firebase] Vérification statut admin :', err);
    return false;
  }
}

/**
 * Autorise un administrateur connecté dans la collection /admins
 */
export async function grantAdminAccess(uid: string, email: string): Promise<void> {
  try {
    await setDoc(doc(db, ADMINS_COL, uid), {
      email,
      role: 'admin',
      nom: 'Gérante Martha Fashion',
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('[Firebase] Erreur enregistrement admin :', err);
  }
}

export { uploadImageToStorage };
