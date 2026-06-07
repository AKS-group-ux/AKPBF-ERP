/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ErpEngine } from '../src/core/erpEngine';
import { getPrismaClient } from '../src/config/database';

async function runTests() {
  const prisma = getPrismaClient();
  console.log("\n=======================================================");
  console.log("🧪 AKPBF ERP - PROTOCOLE DE VALIDATION APPLICATIVE - TESTS");
  console.log("=======================================================\n");

  const emailTest_1 = `test.valid.${Date.now()}@test.bf`;
  const emailTest_2 = `test.duplicate.${Date.now()}@test.bf`;
  const phoneTest_1 = `+2260102030405`;
  const phoneTest_2 = `+2260203040506`;

  const meta = {
    operatorId: "00000000-0000-0000-0000-000000000000",
    operatorName: "Robot Orchestrateur de Tests",
    ipAddress: "127.0.0.1"
  };

  try {
    // ---- TEST 1: CRÉATION VALIDE ----
    console.log("👉 Test 1: Création d'un abonné valide...");
    const plan = await prisma.subscriptionPlan.findFirst();
    const planId = plan?.id || "plan_eco";

    const resValid = await ErpEngine.onboardClient({
      name: "Burkina Test User",
      email: emailTest_1,
      phone: phoneTest_1,
      address: "Secteur 17, Bobo-Dioulasso",
      planId: planId,
      binType: "Standard 240L"
    }, meta);

    if (resValid.success && resValid.subscriberId.startsWith("ABJ-") && resValid.subscriber) {
      console.log("✅ Succès: L'abonné a été créé avec un identifiant unique:", resValid.subscriberId);
      console.log("   - Model Mapper OK: subscriber ID rattaché:", resValid.subscriber.id);
    } else {
      throw new Error("❌ Échec de la création valide.");
    }

    // ---- TEST 2: EMAIL DÉJÀ UTILISÉ ----
    console.log("\n👉 Test 2: Tentative avec un email existant...");
    try {
      await ErpEngine.onboardClient({
        name: "Duplicate Email User",
        email: emailTest_1, // duplicate email
        phone: `+2262525${Math.floor(10 + Math.random() * 90)}03`,
        address: "Zone du fleuve",
        planId: planId,
        binType: "Standard 240L"
      }, meta);
      throw new Error("❌ Échec: Les règles d'intégrité de l'email ont été ignorées !");
    } catch (err: any) {
      if (err.message.includes("L'adresse email") || err.message.includes("déjà enregistrée")) {
        console.log("✅ Succès: Sécurité d'email doublon détectée (Bloqué correctement)");
      } else {
        throw err;
      }
    }

    // ---- TEST 3: TÉLÉPHONE DÉJÀ UTILISÉ ----
    console.log("\n👉 Test 3: Tentative avec un numéro de téléphone existant...");
    try {
      await ErpEngine.onboardClient({
        name: "Duplicate Phone User",
        email: `another.${Date.now()}@test.bf`,
        phone: phoneTest_1, // duplicate phone
        address: "Secteur 15 Ouaga",
        planId: planId,
        binType: "Standard 240L"
      }, meta);
      throw new Error("❌ Échec: Les règles d'intégrité du numéro de téléphone ont été ignorées !");
    } catch (err: any) {
      if (err.message.includes("numéro de téléphone") || err.message.includes("déjà utilisé")) {
        console.log("✅ Succès: Sécurité de téléphone doublon détectée (Bloqué correctement)");
      } else {
        throw err;
      }
    }

    // ---- TEST 4: ERREUR DE FORMAT TÉLÉPHONE BURKINA FASO ----
    console.log("\n👉 Test 4: Validation du format régional Burkina Faso (UEMOA)...");
    try {
      await ErpEngine.onboardClient({
        name: "Bad Phone Format User",
        email: `badphone.${Date.now()}@test.bf`,
        phone: "1234567", // Bad format
        address: "Secteur 22",
        planId: planId,
        binType: "Standard 240L"
      }, meta);
      throw new Error("❌ Échec: Le mauvais format de téléphone n'a pas été bloqué !");
    } catch (err: any) {
      if (err.message.includes("Burkina Faso")) {
        console.log("✅ Succès: Le format de téléphone a bloqué la requête farfelue.");
      } else {
        throw err;
      }
    }

    // ---- TEST 5: ERREUR DE PLAN D'ABONNEMENT INVALIDE ----
    console.log("\n👉 Test 5: Validation du plan d'abonnement sélectionné...");
    try {
      await ErpEngine.onboardClient({
        name: "Bad Plan User",
        email: `badplan.${Date.now()}@test.bf`,
        phone: phoneTest_2,
        address: "Secteur 23",
        planId: "plan_invisible_et_introuvable", // bad plan ID
        binType: "Standard 240L"
      }, meta);
      throw new Error("❌ Échec: Le plan invalide n'a pas été refusé !");
    } catch (err: any) {
      if (err.message.includes("n'existe pas dans le catalogue")) {
        console.log("✅ Succès: Le plan d'abonnement inexistant a été refusé de façon sécurisée.");
      } else {
        throw err;
      }
    }

    // ---- NETTOYAGE DES TÉMOINS DE TESTS ----
    console.log("\n🧹 Nettoyage des données témoins du test dans PostgreSQL...");
    
    // We clean up from our real tables to keep DB clean
    const cleanupAbonnes = await prisma.customer.findMany({
      where: {
        email: { in: [emailTest_1, emailTest_2] }
      }
    });

    for (const sub of cleanupAbonnes) {
      // Delete subs
      await prisma.subscription.deleteMany({ where: { customerId: sub.id } });
      // Delete bins
      await prisma.bin.deleteMany({ where: { customerId: sub.id } });
      // Delete invoices
      await prisma.invoice.deleteMany({ where: { customerId: sub.id } });
      // Delete audit log references
      await prisma.auditLog.deleteMany({ where: { details: { contains: sub.subscriberId } } });
      // Delete notifications
      await prisma.notification.deleteMany({ where: { customerId: sub.id } });
      // Delete customer
      await prisma.customer.delete({ where: { id: sub.id } });
    }
    console.log("✅ Nettoyage terminé avec succès. Base PostgreSQL intacte.");

    console.log("\n=======================================================");
    console.log("🏁 TOUS LES TESTS FONCTIONNELS DE L'AUDIT SONT VALIDES !");
    console.log("=======================================================\n");
  } catch (globalErr) {
    console.error("❌ ÉCHEC DU PROTOCOLE DE TEST :", globalErr);
    process.exit(1);
  }
}

runTests();
