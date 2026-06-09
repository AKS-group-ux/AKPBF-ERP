import { getPrismaClient } from '../src/config/database';
import { BillingWorkflowController } from '../src/controllers/billingWorkflowController';
import { BillingController } from '../src/controllers/billingController';

async function runBillingTests() {
  const prisma = getPrismaClient();

  console.log("\n=======================================================");
  console.log("🧪 AKPBF ERP - PROTOCOLE DE VALIDATION DU MOTEUR DE FACTURATION");
  console.log("=======================================================\n");

  let testCustomerId = '';
  let testSubscriptionId = '';
  let testInvoiceId = '';
  let planId = '';

  try {
    // 0. Seed or lookup a plan
    console.log("👉 Configuration des entités pour le test...");
    let plan = await prisma.subscriptionPlan.findFirst();
    if (!plan) {
      plan = await prisma.subscriptionPlan.create({
        data: {
          name: "Test Plan Salubrité",
          price: 4000,
          frequency: "Mensuel",
          description: "Plan généré uniquement pour le déroulement des tests automatisés de facturation."
        }
      });
    }
    planId = plan.id;
    console.log(`✅ Plan actif identifié: ${plan.name} (${Number(plan.price)} FCFA)`);

    // 1. Create a mock customer & active subscription
    const customer = await prisma.customer.create({
      data: {
        name: "Abidjan Test Billing Client",
        email: `client.billing.test.${Date.now()}@akpbf.com`,
        phone: "+2250102030405",
        address: "Cocody, Boulevard de la République, Villa 45",
        status: "ACTIVE",
        balance: 0.0
      }
    });
    testCustomerId = customer.id;
    console.log(`✅ Client facturation créé: ${customer.name} (Solde Initial: 0 FCFA)`);

    const subscription = await prisma.subscription.create({
      data: {
        customerId: testCustomerId,
        planId: planId,
        status: "ACTIVE",
        startDate: new Date()
      }
    });
    testSubscriptionId = subscription.id;
    console.log(`✅ Abonnement Salubrité enregistré avec succès.`);

    // 2. Mocking Express Request and Response
    const mockRequest = (body = {}, params = {}, query = {}, ip = '127.0.0.1') => {
      const req: any = { body, params, query, ip, tokenUser: { id: 'usr-comptable-1', name: 'Doumbia Sylvain (Fisc)', role: 'COMPTABLE' } };
      return req;
    };

    const mockResponse = () => {
      const res: any = {};
      res.status = (code: number) => {
        res.statusCode = code;
        return res;
      };
      res.json = (data: any) => {
        res.data = data;
        return res;
      };
      return res;
    };

    // -----------------------------------------------------
    // TEST 1: INVOICE CREATION ( Brouillon Status & items generation )
    // -----------------------------------------------------
    console.log("\n👉 Test 1: Création d'une nouvelle facture en mode brouillon...");
    const reqCreate = mockRequest({
      customerId: testCustomerId,
      subscriptionId: testSubscriptionId,
      amount: 4000,
      items: [
        { description: 'Imposition standard salubrité Zone Cocody', quantity: 1, unitPrice: 4000 }
      ]
    });
    const resCreate = mockResponse();
    await BillingWorkflowController.createInvoice(reqCreate, resCreate);

    if (resCreate.statusCode === 201 || resCreate.data?.success) {
      testInvoiceId = resCreate.data.invoiceId;
      console.log(`✅ Succès: Facture brouillon créée avec l'ID: ${testInvoiceId}`);
      
      const checkCreated = await prisma.invoice.findUnique({
        where: { id: testInvoiceId },
        include: { items: true }
      });
      console.log(`   - Statut par défaut: ${checkCreated?.status} (Attendu: DRAFT)`);
      console.log(`   - Nombre de sous-lignes générées: ${checkCreated?.items.length} (Attendu: 1)`);
      if (checkCreated?.status !== 'DRAFT') throw new Error("Statut initial invalide");
    } else {
      throw new Error(`Échec de création facture: ${JSON.stringify(resCreate.data)}`);
    }

    // -----------------------------------------------------
    // TEST 2: ATTEMPT TO MODIFY INVOICE OR CHECK STATUS RESTRAINTS
    // -----------------------------------------------------
    console.log("\n👉 Test 2: Mise à jour autorisée d'un brouillon...");
    const reqUpdate = mockRequest({ amount: 4500 }, { id: testInvoiceId });
    const resUpdate = mockResponse();
    await BillingWorkflowController.updateInvoice(reqUpdate, resUpdate);
    if (resUpdate.data?.success) {
      console.log(`✅ Succès: Mise à jour acceptée pour le brouillon.`);
    } else {
      throw new Error("Mise à jour brouillon valide rejetée.");
    }

    // -----------------------------------------------------
    // TEST 3: VALIDATE INVOICE & ASSIGN DOUBLE ENTRIES
    // -----------------------------------------------------
    console.log("\n👉 Test 3: Validation du brouillon d'exploitation...");
    const reqValidate = mockRequest({}, { id: testInvoiceId });
    const resValidate = mockResponse();
    await BillingWorkflowController.validateInvoice(reqValidate, resValidate);

    if (resValidate.data?.success) {
      console.log(`✅ Succès: Facture validée avec passage au statut VALIDATED.`);
      
      // Check Customer Balance Incrementation
      const checkCustomer = await prisma.customer.findUnique({ where: { id: testCustomerId } });
      console.log(`   - Solde Compte Client après émission: ${Number(checkCustomer?.balance)} FCFA (Attendu: 4500)`);
      if (Number(checkCustomer?.balance) !== 4500) {
        throw new Error("Écart d’incrémentation du solde débiteur client.");
      }

      // Check Real Relational Accounting entries
      const entries = await prisma.accountingEntry.findMany({
        where: { invoiceId: testInvoiceId }
      });
      console.log(`   - Écritures SYSCOHADA générées dans l’index relationnel: ${entries.length}`);
      for (const ent of entries) {
        console.log(`     - Débit: ${ent.debitAccount} | Crédit: ${ent.creditAccount} | Montant: ${Number(ent.amount)}`);
      }
      if (entries.length === 0) throw new Error("Aucune écriture comptable générée.");
    } else {
      throw new Error(`Échec de la validation de la facture.`);
    }

    // -----------------------------------------------------
    // TEST 4: BLOCK ATTEMPTS TO UPDATE ONCE VALIDATED
    // -----------------------------------------------------
    console.log("\n👉 Test 4: Vérification du verrou d'immutabilité post-validation...");
    const reqBadUpdate = mockRequest({ amount: 5000 }, { id: testInvoiceId });
    const resBadUpdate = mockResponse();
    await BillingWorkflowController.updateInvoice(reqBadUpdate, resBadUpdate);
    if (resBadUpdate.statusCode === 400 || resBadUpdate.data?.error) {
      console.log(`✅ Succès: La mise à jour a été rejetée de façon sécurisée: "${resBadUpdate.data.error}"`);
    } else {
      throw new Error("Fail: Une facture validée a pu être éditée de force !");
    }

    // -----------------------------------------------------
    // TEST 5: PARTIAL AND TOTAL PAYMENTS LOOKUPS
    // -----------------------------------------------------
    console.log("\n👉 Test 5: Règlement partiel de la facture de 4500 FCFA...");
    // We pay 2000 FCFA (partial payment)
    const reqPayPartial = mockRequest({ amountPaid: 2000, method: 'WAVE', transactionId: 'TX-WAVE-999' }, { id: testInvoiceId });
    const resPayPartial = mockResponse();
    await BillingWorkflowController.recordInvoicePayment(reqPayPartial, resPayPartial);

    if (resPayPartial.data?.success) {
      const checkInvoice = await prisma.invoice.findUnique({ where: { id: testInvoiceId } });
      const checkCust = await prisma.customer.findUnique({ where: { id: testCustomerId } });
      console.log(`   - Nouveau statut facture: ${checkInvoice?.status} (Attendu: PARTIALLY_PAID)`);
      console.log(`   - Nouveau solde débiteur client: ${Number(checkCust?.balance)} FCFA (Attendu: 2500)`);
      
      if (checkInvoice?.status !== 'PARTIALLY_PAID' || Number(checkCust?.balance) !== 2500) {
        throw new Error("Incohérence du règlement partiel.");
      }
    } else {
      throw new Error(`Échec du paiement partiel: ${resPayPartial.data?.error}`);
    }

    console.log("\n👉 Test 6: Solde final et paiement total...");
    // Pay the remaining 2500 FCFA
    const reqPayComplete = mockRequest({ amountPaid: 2500, method: 'CASH', transactionId: 'TX-CASH-1000' }, { id: testInvoiceId });
    const resPayComplete = mockResponse();
    await BillingWorkflowController.recordInvoicePayment(reqPayComplete, resPayComplete);

    if (resPayComplete.data?.success) {
      const checkInvoice = await prisma.invoice.findUnique({ where: { id: testInvoiceId } });
      const checkCust = await prisma.customer.findUnique({ where: { id: testCustomerId } });
      console.log(`   - Statut facture: ${checkInvoice?.status} (Attendu: PAID)`);
      console.log(`   - Solde client épuré: ${Number(checkCust?.balance)} FCFA (Attendu: 0)`);
      
      if (checkInvoice?.status !== 'PAID' || Number(checkCust?.balance) !== 0) {
        throw new Error("L'apuration finale de la facture ou du solde est erronée.");
      }
    } else {
      throw new Error("Paiement complet refusé.");
    }

    // -----------------------------------------------------
    // TEST 6: SUBSCRIPTION RESILIATION WORKFLOW
    // -----------------------------------------------------
    console.log("\n👉 Test 7: Résiliation définitive de l’abonnement...");
    const reqResiliate = mockRequest({}, { id: testSubscriptionId });
    const resResiliate = mockResponse();
    await BillingWorkflowController.resiliateSubscription(reqResiliate, resResiliate);

    if (resResiliate.data?.success) {
      const checkSub = await prisma.subscription.findUnique({ where: { id: testSubscriptionId } });
      const checkCust = await prisma.customer.findUnique({ where: { id: testCustomerId } });
      console.log(`   - Statut de l'abonnement: ${checkSub?.status} (Attendu: RESILIATED)`);
      console.log(`   - Statut final dossier client: ${checkCust?.status} (Attendu: INACTIVE)`);
      
      if (checkSub?.status !== 'RESILIATED' || checkCust?.status !== 'INACTIVE') {
        throw new Error("Résiliation incohérente.");
      }
    } else {
      throw new Error("Échec de la résiliation d'exploitation.");
    }

    // -----------------------------------------------------
    // TEST 7: RUN BATCH BILLING CYCLE AUTOROOM JOBS
    // -----------------------------------------------------
    console.log("\n👉 Test 8: Remise en service de l'abonnement pour tester le cycle automatisé...");
    await prisma.subscription.update({
      where: { id: testSubscriptionId },
      data: { status: 'ACTIVE' }
    });
    await prisma.customer.update({
      where: { id: testCustomerId },
      data: { status: 'ACTIVE' }
    });

    console.log("👉 Déclenchement du cron batch de facturation de fin de mois...");
    const reqCycle = mockRequest({});
    const resCycle = mockResponse();
    await BillingController.runBillingCycle(reqCycle as any, resCycle as any);

    if (resCycle.data?.success) {
      console.log("✅ Succès: Exécution des jobs périodiques sans heurts.");
      console.log(`   - Rapport: Factures générées: ${resCycle.data.statistics?.invoicesGenerated}`);
      console.log(`   - Rapport: Pénalités imputées: ${resCycle.data.statistics?.penaltiesApplied}`);
    } else {
      throw new Error("Échec d'exécution du cron de facturation.");
    }

    // -----------------------------------------------------
    // CLEANUP TEST VALUES SECURELY
    // -----------------------------------------------------
    console.log("\n🧹 Purge et nettoyage des témoins d'évaluation d'audit dans PostgreSQL...");
    
    // Clean items
    await prisma.invoiceItem.deleteMany({
      where: { invoiceId: { in: [testInvoiceId] } }
    });
    // Clean compta
    await prisma.accountingEntry.deleteMany({
      where: { invoiceId: { in: [testInvoiceId] } }
    });
    // Clean payments
    await prisma.payment.deleteMany({
      where: { invoiceId: { in: [testInvoiceId] } }
    });
    // Clean invoices
    await prisma.invoice.deleteMany({
      where: { customerId: testCustomerId }
    });
    // Clean subscriptions
    await prisma.subscription.deleteMany({
      where: { customerId: testCustomerId }
    });
    // Clean customer
    await prisma.customer.delete({
      where: { id: testCustomerId }
    });

    console.log("✅ Données témoins entièrement purgées. Base de données intègre.");

    console.log("\n=======================================================");
    console.log("🏁 MOTEUR DE FACTURATION ENTIÈREMENT VALIDÉ (100% GREEN) !");
    console.log("=======================================================\n");

  } catch (err: any) {
    console.error("\n❌ PROTOCOLE DE TEST INTERROMPU PAR UNE ANOMALIE :", err);
    // Cleanup anyway
    try {
      if (testInvoiceId) {
        const prisma = getPrismaClient();
        await prisma.invoiceItem.deleteMany({ where: { invoiceId: testInvoiceId } });
        await prisma.accountingEntry.deleteMany({ where: { invoiceId: testInvoiceId } });
        await prisma.payment.deleteMany({ where: { invoiceId: testInvoiceId } });
      }
      if (testCustomerId) {
        const prisma = getPrismaClient();
        await prisma.invoice.deleteMany({ where: { customerId: testCustomerId } });
        await prisma.subscription.deleteMany({ where: { customerId: testCustomerId } });
        await prisma.customer.delete({ where: { id: testCustomerId } });
      }
    } catch {}
    process.exit(1);
  }
}

runBillingTests();
