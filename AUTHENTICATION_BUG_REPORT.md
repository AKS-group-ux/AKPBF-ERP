# Rapport de Bugs — Authentification & Création de Clients AKPBF ERP

**Date :** 26 mai 2026  
**Projet :** AKPBF ERP — Gestion de la Salubrité d'Abidjan  
**Sévérité :** CRITIQUE (blocage total de création de clients et d'authentification)

---

## BUG 1 — CRITIQUE : Bouclier SQL/XSS bloquant les apostrophes françaises

### Fichier concerné
`backend/src/middleware/security.ts` — fonction `sqlAndXssShield`

### Description du problème
Le middleware de sécurité utilisait un regex trop agressif :

```
/('|--|#|\/\*|\*\/|union|select|insert|delete|update|drop|alter|where|and|or|like)/i
```

Ce regex correspond à l'apostrophe `'` comme **premier alternative**. Cela signifie que n'importe quelle chaîne contenant une apostrophe française déclenche `sqlPattern.test(str) === true`. La vérification de second niveau :

```js
if (str.includes("'") || str.includes("--") || ...)
```

Étant donné que `str.includes("'")` est toujours `true` pour toute apostrophe, le bouclier bloquait systématiquement **toute requête contenant un texte français avec apostrophe**, notamment :

- Noms ivoiriens : `N'Goran`, `D'Oro`, `N'Faly`, `N'Gbesso`
- Adresses françaises : `Route de l'Aéroport`, `Avenue de l'Indépendance`, `Quartier de l'Amitié`
- Tout texte courant contenant `l'`, `d'`, `j'`, `c'`, etc.

### Impact opérationnel
- **Création de clients bloquée** : tout formulaire avec un nom ou une adresse contenant `'` retournait `HTTP 400` avec le code `SECURITY_SHIELD_TRIGGERED`
- **Authentification bloquée** : si un abonné avec apostrophe dans son nom était inclus dans `filteredSubscribers` lors du POST `/api/auth/login`, la connexion était bloquée
- **Message d'erreur opaque** : le frontend reçoit `{ error: 'Requête suspecte...', code: 'SECURITY_SHIELD_TRIGGERED' }`, et la console loggait `["Authentication attempt failed:", {}]` (les objets `Error` sérialisent en `{}` car `message` et `stack` sont non-énumérables)

### Correctif appliqué
Remplacement du regex unique par une liste de **patterns d'injection SQL réels**, sans déclencher sur une apostrophe isolée :

```js
const sqlInjectionPatterns: RegExp[] = [
  /'\s*(or|and)\s+['"\d]/i,     // ' OR '1 / ' AND "1
  /'\s*--/,                      // ' -- (commentaire SQL après injection)
  /'\s*;/,                       // '; (séparateur d'instructions)
  /\bunion\s+(all\s+)?select\b/i, // UNION SELECT
  /\bselect\b.{0,100}\bfrom\b/i, // SELECT ... FROM
  /\binsert\s+into\b/i,          // INSERT INTO
  /\bdelete\s+from\b/i,          // DELETE FROM
  /\bupdate\b.{0,60}\bset\b/i,  // UPDATE table SET
  /\b(drop|truncate)\s+table\b/i, // DROP TABLE
  /\/\*[\s\S]*?\*\//,            // /* commentaire bloc */
];
```

Les apostrophes françaises (`l'adresse`, `N'Goran`) passent désormais sans problème. Les vraies injections SQL sont toujours bloquées.

---

## BUG 2 — IMPORTANT : Envoi de l'objet Subscriber entier au lieu des champs requis

### Fichiers concernés
- `src/App.tsx` — fonction `handleAddSubscriber` (ligne ~696)
- `src/components/LandingPage.tsx` — fonction `handleRegisterSubmit` (ligne ~157)

### Description du problème
Les deux appels `POST /api/erp/subscribers` envoyaient **l'objet `Subscriber` complet** :

```js
body: JSON.stringify(newSub)  // Objet entier avec id, lat, lng, status, etc.
```

L'objet frontend contient de nombreux champs hors-spec inutiles :
`id` (format `SUB-XXXX`), `lat`, `lng`, `neighborhood`, `status`, `lastCollectionDate`, `currentBinLevel`, `paymentStatus`, etc.

Le backend (`ErpController.addSubscriber`) ne destructure que `{ name, email, phone, address, planId, binType }` — les champs supplémentaires étaient ignorés mais augmentaient inutilement la surface d'attaque inspectée par le bouclier.

### Correctif appliqué
Envoi uniquement des champs attendus par le backend :

```js
body: JSON.stringify({
  name: newSub.name,
  email: newSub.email,
  phone: newSub.phone,
  address: newSub.address,
  planId: newSub.planId,
  binType: newSub.binType
})
```

---

## BUG 3 — MINEUR : Erreur d'authentification masquée — `{}` dans les logs

### Fichier concerné
`src/context/AuthContext.tsx` — bloc `catch` de la fonction `login`

### Description du problème
```js
console.error('Authentication attempt failed:', err);
```

Les instances `Error` JavaScript ont leurs propriétés `message` et `stack` **non-énumérables**. La sérialisation par certains loggers (dont celui de Replit) transforme un `Error` en `{}`. Le message réel était donc invisible dans les logs.

En conséquence, `displayError = err.message` était parfois une chaîne vide, et l'utilisateur voyait un message générique sans indication de la cause réelle.

### Correctif appliqué
Extraction explicite du message avant le logging :

```js
const rawMessage: string = (err instanceof Error ? err.message : String(err)) || '';
console.error('Authentication attempt failed:', rawMessage, err);
```

---

## Résumé des fichiers modifiés

| Fichier | Nature du correctif |
|---|---|
| `backend/src/middleware/security.ts` | Refonte du bouclier SQL/XSS — patterns d'injection réels uniquement |
| `src/App.tsx` | `handleAddSubscriber` — envoi des seuls champs backend requis |
| `src/components/LandingPage.tsx` | `handleRegisterSubmit` — idem |
| `src/context/AuthContext.tsx` | Extraction et logging explicite du message d'erreur |

---

## Test de régression recommandé

1. **Créer un abonné** avec un nom ivoirien contenant une apostrophe (ex. `N'Goran Kouadio`) et une adresse française (ex. `Route de l'Aéroport, Cocody`) → doit réussir
2. **Créer un abonné** via la landing page publique avec les mêmes données → doit réussir
3. **Se connecter** avec l'email `admin@akpbf.com` / `Admin@2026` → doit réussir
4. **Tenter une vraie injection** : adresse = `' OR '1'='1` → doit être bloquée avec `SECURITY_SHIELD_TRIGGERED`
5. **Tenter une vraie XSS** : nom = `<script>alert(1)</script>` → doit être bloquée

---

*Rapport généré le 26 mai 2026 — AKPBF ERP v2.0.0*
