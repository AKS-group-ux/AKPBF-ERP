# 🛡️ BACKEND_SECURITY.md - Politique Globale de Sécurité de l'API

L'ERP AKPBF applique les normes de contrôle réglementaires OWASP, PCI-DSS et RGPD pour sécuriser les données de salubrité publique du district d'Abidjan.

---

## 🔒 1. Résumé des Mesures Appliquées

| Segment Sécurité | Middleware Responsable | Implémentation Fonctionnelle |
| :--- | :--- | :--- |
| **En-têtes HTTP** | `customHelmet` (Helmet) | CSP restrictive, protection HSTS 1 an, blocage d'iframe-ancestors, désactivation de reniflage de type MIME. |
| **Origines CORS** | `securedCors` (Cors) | Restriction d'en-tête, limitation de méthode aux seuls verbes autorisés, contrôle de sessions d'origine. |
| **DDoS & Force Brute** | `globalLimiter` (rate-limit) | Restreint chaque IP à 300 requêtes par créneau de 15 minutes. Bloque les surcharges robotiques. |
| **Ralentissement** | `speedDampener` (slow-down) | Introduit une pénalité de latence automatique de 500ms au-delà de 100 requêtes pour décourager l'extraction de données. |
| **SQL / Script Injection**| `sqlAndXssShield` | Analyse récursive et rejet des structures d'écriture contenant des signatures suspectes (`UNION`, `SELECT FROM`, `<script>`). |
| **Zod DTO Validation** | `ValidationMiddleware` | Vérification stricte des types de formulaires et assainissement des arguments de requêtes. |
| **Rotation JWT (onetime)** | `AuthMiddleware` | Révocation immédiate d'ancien jeton de rafraîchissement lors de l'obtention d'un nouveau jeton. |
| **Blacklist actif** | `TOKEN_BLACKLIST` | Invalidation des sessions de jeton dès validation de l'action de déconnexion. |

---

## 🛡️ 2. Configuration d'Armure Antivirus & Anti-Injection

Afin d'éliminer toute compromission, le bouclier contre les injections scanne à la fois le `body`, les `query params` et les `params` de tous les endpoints :

```typescript
// Extrait de backend/src/middleware/security.ts
const sqlPattern = /('|--|#|\/\*|\*\/|union|select|insert|delete|update|drop|alter|where|and|or|like)/i;
const xssPattern = /(<script|<iframe|<object|<embed|javascript:|onclick|onerror|onmouseover)/i;
```

Si un utilisateur ou robot d'Abidjan tente d'introduire des balises script ou des requêtes d'échappement, l'API retourne immédiatement une erreur `400 Bad Request` avec le code `SECURITY_SHIELD_TRIGGERED` et suspend l'action de base de données.

---

## ⏰ 3. Politique Strict de Session & Double Sécurité de Mot de Passe
1. **Hashing Bcrypt :** Les clés de mot de passe corporatif sont hashées avec un sel de complexité `10`. Le mot de passe original n'est jamais stocké sous forme claire.
2. **Police de Complexité :** Obligation stricte de comporter au moins 8 caractères, une majuscule, une minuscule et un chiffre numérique lors de l'action de réinitialisation.
3. **Session de rafraîchissement d'une seule utilisation (OTU) :** Tout jeton de rafraîchissement obsolète ou rejoué provoque l'invalidation complète de la session pour contrer le vol d'identité.
