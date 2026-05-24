# 🗄️ DATABASE.md - Intégrité et Dictionnaire des Tables Relationnelles

Ce document complète la modélisation `/prisma/schema.prisma` de l'ERP AKPBF pour assurer la traçabilité comptable et logistique.

---

## 🔗 1. Schéma Global des Relations et Intégrité Référencielle

Pour éliminer toute corruption d'enregistrements en production, l'ERP s'appuie sur des règles strictes sur les suppressions :

```
    [Customer]
        |
        +-- (Cascade delete) --> [Subscription]
        |                            |
        |                  (Cascade delete)
        |                            v
        +-- (Cascade delete) --> [Invoice]
        |                            |
        |                  (Cascade delete)
        |                            v
        +-- (Cascade delete) --> [Payment]
                                     |
                           (Cascade delete)
                                     v
                                 [Transaction]
```

* **Cascade Delete (`onDelete: Cascade`) :** Appliqué sur la relation `Customer -> Subscription`, `Customer -> Invoice`, `Invoice -> Payment` et `Payment -> Transaction`. Si un dossier d'abonné citoyen est purgé pour des raisons réglementaires, toutes les sous-catégories associées sont désintégrées proprement.
* **SetNull (`onDelete: SetNull`) :** Appliqué sur les champs optionnels comme les liaisons d'équipement `Bin -> Customer` ou les logs techniques. Si un abonné déménage, le bac connecté physique est découplé de sa fiche rattachée (conservant le bac opérationnel et libre de ré-attribution pour une autre Riviera résidentielle).

---

## 🔍 2. Stratégie d'Indexation (Performance Accélérée)

Afin de garantir des temps d'accès aux requêtes ultra-bas, la modélisation déclare formellement des index composites sur les requêtes fréquentes :

1. **`users.email` :** Indexation automatique d'unicité pour accélérer de 300% les phases d'authentification par identifiant e-mail.
2. **`customers.subscriberId` :** Index non-composite. Accélère la synchronisation bidirectionnelle avec le Portail Citoyen lorsque les clients saisissent leur référence structurée.
3. **`invoices.customerId` & `invoices.status` :** Cet index composite optimise le calcul mensuel des reliquats de facturations non réglées.
4. **`route_assignments.driverId` & `route_assignments.vehicleId` :** Utilisé par la console SIG pour cartographier en temps réel les assignations quotidiennes de camions.

---

## 🛡️ 3. Transactivité Financière (Intégrité de Caisse)

Chaque encaissement ou traitement complexe d'écriture comptable utilise les primitives de transaction sécurisées de Prisma pour contrer les anomalies d'états d'écriture (Dirty Reads) :

```typescript
// Exemple de cinématique robuste d'encaissement de redevance
const result = await prisma.$transaction(async (tx) => {
  // 1. Décrémenter le solde de l'abonné
  const customer = await tx.customer.update({
    where: { id: customerId },
    data: { balance: { decrement: paymentAmount } }
  });

  // 2. Muter l'état de la facture en PAID (Réglé)
  const invoice = await tx.invoice.update({
    where: { id: invoiceId },
    data: { status: 'PAID' }
  });

  // 3. Insérer la ligne d'audit d'action comptable de caisse
  await tx.auditLog.create({
    data: {
      userId: comptableId,
      action: 'RECORD_PAYMENT_SUCCESS',
      details: `Facture ${invoiceId} payée par Mobile Money pour l'abonné ${customer.name}`
    }
  });

  return { customer, invoice };
});
```
*Si une seule de ces étapes trébuche (par exemple : absence de l'utilisateur ou numéro de facture altéré), l'intégralité du traitement financier recule par action de Rollback et la base d'Abidjan reste intègre.*
