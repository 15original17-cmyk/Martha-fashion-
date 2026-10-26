# Martha Fashion - Spécification de Sécurité Firestore

## 1. Invariants de Données
- **Produits (`/products/{productId}`)** :
  - Lecture publique pour toutes les clientes (catalogues accessibles sans authentification).
  - Écriture (création, modification, suppression) strictement réservée aux administrateurs reconnus dans la collection `/admins/{uid}` ou par vérification de rôle.
  - Tout produit doit contenir un nom (<= 200 car.), un prix positif, une catégorie (<= 100 car.) et un indicateur `disponible` booléen.
  - Les photos sont des URLs sécurisées vers Cloud Storage ou sources autorisées.

- **Catégories (`/categories/{categoryId}`) & Paramètres (`/settings/{settingId}`)** :
  - Lecture publique.
  - Modification et suppression réservées exclusivement aux administrateurs.

- **Commandes (`/orders/{orderId}`)** :
  - Création : autorisée pour les clientes (invitées ou authentifiées) avec validation stricte du schéma (quantité > 0, prix > 0, numéro de commande non vide, téléphone et nom client renseignés).
  - Lecture : Réservée à l'administrateur OU au client propriétaire de la commande (`customerUid == request.auth.uid`). Une cliente ne peut jamais lire les commandes des autres clientes.
  - Modification : Seul l'administrateur peut modifier le statut et les détails des commandes (`isAdmin()`). Les clientes ne peuvent pas altérer ou falsifier des commandes existantes.
  - Suppression : Réservée aux administrateurs.

- **Administrateurs (`/admins/{adminUid}`)** :
  - Lecture : Réservée à l'utilisateur authentifié pour vérifier son propre statut (`request.auth.uid == adminUid`) ou à un administrateur déjà authentifié.
  - Écriture : Interdite depuis le client standard pour empêcher l'élévation de privilèges non autorisée.

---

## 2. The Dirty Dozen Payloads (Tentatives d'attaques à bloquer)

1. **Payload 1 - Shadow Admin Escalation**:
   Tentative d'un utilisateur anonyme ou normal d'écrire dans `/admins/{uid}` pour se déclarer `admin`.
   `{ email: "hacker@evil.com", role: "admin" }` -> Doit retourner PERMISSION_DENIED.

2. **Payload 2 - Unauthenticated Product Creation**:
   Tentative d'un client anonyme de créer un produit dans `/products/fake-prod`.
   `{ nom: "Hack", prix: 0, categorie: "Femme", disponible: true }` -> PERMISSION_DENIED.

3. **Payload 3 - Price Tampering on Product Update**:
   Tentative d'un client non-administrateur de mettre à jour le prix d'une robe de 35000 à 10 FCFA.
   `{ prix: 10 }` -> PERMISSION_DENIED.

4. **Payload 4 - Product Deletion by Client**:
   Tentative de supprimer `/products/prod-robe-wax` sans droit administrateur. -> PERMISSION_DENIED.

5. **Payload 5 - Cross-Customer Order Snoop (Read Others' Orders)**:
   La cliente B (UID: client-2) tente de lire `/orders/ord-1` appartenant à la cliente A (UID: client-1). -> PERMISSION_DENIED.

6. **Payload 6 - Order Status Tampering by Customer**:
   La cliente tente de passer sa propre commande de `"Nouvelle"` à `"Terminée"` ou `"Payée"`. -> PERMISSION_DENIED.

7. **Payload 7 - Order Deletion by Customer**:
   Une cliente tente de supprimer sa commande ou celle d'une autre cliente dans Firestore. -> PERMISSION_DENIED.

8. **Payload 8 - Negative or Zero Quantity Order**:
   Tentative de créer une commande avec `quantite: -5` ou `prix: -1000`. -> PERMISSION_DENIED.

9. **Payload 9 - Giant Buffer Injection (Denial of Wallet)**:
   Tentative d'injecter une chaîne de 2 Mo dans le nom de produit ou le message de commande. -> PERMISSION_DENIED (borné par `maxLength` et `.size()`).

10. **Payload 10 - Client Modifying Store Settings**:
    Tentative de modifier `/settings/store` pour changer le numéro WhatsApp ou les comptes de paiement. -> PERMISSION_DENIED.

11. **Payload 11 - Category Sabotage**:
    Tentative de suppression de `/categories/cat-femme` par un utilisateur non-admin. -> PERMISSION_DENIED.

12. **Payload 12 - ID Poisoning (Malicious Path Injection)**:
    Tentative de créer un document avec un ID contenant des caractères d'échappement ou supérieur à 128 caractères. -> PERMISSION_DENIED (garde `isValidId`).
