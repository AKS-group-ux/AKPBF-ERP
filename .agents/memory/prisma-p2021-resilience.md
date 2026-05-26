---
name: Prisma P2021 — tables manquantes non gérées par le proxy de résilience
description: Le proxy in-memory fallback ne capturait pas l'erreur P2021 (table inexistante), seules P1x/P5x étaient couvertes
---

L'erreur `P2021` ("The table 'public.customers' does not exist") est une erreur de schéma, pas de connexion.
Le proxy dans `database.ts` ne fallback-ait que sur `P1*` et `P5*` — les erreurs `P2*` (schéma manquant) remontaient non gérées.

**Why:** La base de données était connectée mais les migrations n'avaient pas été appliquées. Sans tables, tous les appels Prisma échouaient avec P2021.

**How to apply:**
1. Exécuter `npx prisma db push` (ou `prisma migrate deploy`) quand les tables n'existent pas encore.
2. Dans le proxy, ajouter `error.code?.startsWith('P2')` et `errMsg.includes('does not exist')` à la liste des conditions de fallback.
3. La commande de migration pour ce projet : `npx prisma db push --skip-generate` depuis la racine.
