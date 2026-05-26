---
name: SQL Shield — apostrophes françaises bloquées
description: Le regex du bouclier SQL/XSS bloquait tout texte avec apostrophe française (N'Goran, l'adresse, etc.)
---

Le regex original `/('|--|...|or|...)/i` inclut `'` comme première alternative.
La vérification secondaire `str.includes("'")` était TOUJOURS vraie pour toute apostrophe → tout texte français avec `'` était bloqué.

**Why:** Les noms ivoiriens (N'Goran, N'Faly) et adresses françaises (Route de l'Aéroport) sont courants dans les données AKPBF. Bloquer les apostrophes seules est inutile — seul le contexte SQL d'injection est dangereux.

**How to apply:** Remplacer le regex unique par une liste de patterns d'injection réels (UNION SELECT, ' OR '1, ' --, etc.). Ne jamais bloquer sur `'` seul. Voir `backend/src/middleware/security.ts`.
