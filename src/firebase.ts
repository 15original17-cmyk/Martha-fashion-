/**
 * Configuration et initialisation officielle Firebase (Firestore, Auth, Storage)
 * pour Martha Fashion Mode
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, uploadString, getDownloadURL } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

// Initialisation unique de Firebase
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// CRITICAL: Utiliser explicitement le firestoreDatabaseId provisionné
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Authentification & Google Provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Cloud Storage
export const storage = getStorage(app);

// Types d'opérations et gestionnaire d'erreur standardisé pour Firestore
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Vérification de connexion au démarrage selon les spécifications Firebase
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firebase] Connexion Firestore vérifiée avec succès.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firebase] Attention: client hors-ligne ou configuration inaccessible.');
    }
    return false;
  }
}

// Téléversement d'image dans Cloud Storage avec URL téléchargeable
export async function uploadImageToStorage(fileOrDataUrl: File | string, folder = 'products'): Promise<string> {
  try {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);

    if (typeof fileOrDataUrl === 'string') {
      // Base64 Data URL
      const path = `${folder}/${timestamp}_${randomSuffix}.jpg`;
      const storageReference = ref(storage, path);
      await uploadString(storageReference, fileOrDataUrl, 'data_url');
      return await getDownloadURL(storageReference);
    } else {
      // Objet File
      const extension = fileOrDataUrl.name.split('.').pop() || 'jpg';
      const path = `${folder}/${timestamp}_${randomSuffix}.${extension}`;
      const storageReference = ref(storage, path);
      await uploadBytes(storageReference, fileOrDataUrl, {
        contentType: fileOrDataUrl.type || 'image/jpeg',
      });
      return await getDownloadURL(storageReference);
    }
  } catch (err) {
    console.error('[Firebase Storage] Erreur téléversement:', err);
    throw err;
  }
}

// Connexion Administrateur via Google Popup
export async function signInAdminWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('[Firebase Auth] Erreur connexion Google:', error);
    throw error;
  }
}

// Déconnexion
export async function signOutAdmin() {
  return await signOut(auth);
}
