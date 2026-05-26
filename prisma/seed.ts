import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Prisma Database Seeding for AKPBF ERP...');

  // 1. Clean existing records (Safeguard)
  await prisma.setting.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.complaint.deleteMany({});
  await prisma.collection.deleteMany({});
  await prisma.bin.deleteMany({});
  await prisma.vehicleLocation.deleteMany({});
  await prisma.routeAssignment.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.collectionRoute.deleteMany({});
  await prisma.webhookLog.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.subscriptionPlan.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.userRole.deleteMany({});
  await prisma.rolePermission.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🧹 Purged all existing records successfully.');

  // 2. Create Permissions
  const permissionsData = [
    { name: 'VIEW_DASHBOARD', description: 'Accéder au tableau de bord général' },
    { name: 'MANAGE_SUBSCRIBERS', description: 'Créer, modifier et supprimer des abonnés' },
    { name: 'MANAGE_PLANS', description: 'Gérer les forfaits et tarifs d\'abonnement' },
    { name: 'MANAGE_INVOICES', description: 'Émettre et modifier des factures' },
    { name: 'RECORD_PAYMENTS', description: 'Enregistrer des règlements de factures' },
    { name: 'MANAGE_FLEET', description: 'Gérer les véhicules et routes d\'affectation' },
    { name: 'TRACK_GPS', description: 'Tracer les coordonnées GPS en temps réel' },
    { name: 'VIEW_REPORTS', description: 'Accéder aux statistiques financières et opérationnelles' },
    { name: 'MANAGE_SETTINGS', description: 'Gérer la configuration de l\'ERP' },
  ];

  const permissions: Record<string, any> = {};
  for (const perm of permissionsData) {
    permissions[perm.name] = await prisma.permission.create({ data: perm });
  }
  console.log('✅ Created permissions.');

  // 3. Create Roles
  const rolesData = [
    { name: 'ADMINISTRATEUR', description: 'Super-administrateur avec plein accès système' },
    { name: 'COMPTABLE', description: 'Gestion financière, factures, encaissements et bilans' },
    { name: 'SUPERVISEUR', description: 'Superviseur logistique, planification de tournées et flotte' },
    { name: 'CHAUFFEUR', description: 'Chauffeur de camion-benne d\'assainissement' },
    { name: 'AGENT', description: 'Agent de terrain et ramassage' },
    { name: 'CLIENT', description: 'Abonné / Citoyen résidant' },
  ];

  const roles: Record<string, any> = {};
  for (const r of rolesData) {
    roles[r.name] = await prisma.role.create({ data: r });
  }
  console.log('✅ Created system roles.');

  // 4. Map Role Permissions
  // Admin gets all
  for (const permKey of Object.keys(permissions)) {
    await prisma.rolePermission.create({
      data: {
        roleId: roles['ADMINISTRATEUR'].id,
        permissionId: permissions[permKey].id,
      },
    });
  }

  // Comptable permissions
  const comptablePerms = ['VIEW_DASHBOARD', 'MANAGE_SUBSCRIBERS', 'MANAGE_INVOICES', 'RECORD_PAYMENTS', 'VIEW_REPORTS'];
  for (const name of comptablePerms) {
    await prisma.rolePermission.create({
      data: {
        roleId: roles['COMPTABLE'].id,
        permissionId: permissions[name].id,
      },
    });
  }

  // Superviseur permissions
  const superviseurPerms = ['VIEW_DASHBOARD', 'MANAGE_SUBSCRIBERS', 'MANAGE_FLEET', 'TRACK_GPS', 'VIEW_REPORTS'];
  for (const name of superviseurPerms) {
    await prisma.rolePermission.create({
      data: {
        roleId: roles['SUPERVISEUR'].id,
        permissionId: permissions[name].id,
      },
    });
  }

  console.log('✅ Synchronized role mappings with permissions.');

  // 5. Create Core Users (Enterprise Operational Staff)
  const passwordHash = await bcrypt.hash('AkpbfPass2026!', 10);
  const staff = [
    { email: 'admin@akpbf.com', name: 'Alkaïda Benjamin', role: 'ADMINISTRATEUR', phone: '+225 05 01 02 03 04' },
    { email: 'comptable@akpbf.com', name: 'Doumbia Sylvain (Fisc)', role: 'COMPTABLE', phone: '+225 05 02 03 04 05' },
    { email: 'superviseur@akpbf.com', name: 'Gérard Gnakoury (Logistique)', role: 'SUPERVISEUR', phone: '+225 05 03 04 05 06' },
    { email: 'chauffeur@akpbf.com', name: 'Kaboré Moussa', role: 'CHAUFFEUR', phone: '+225 05 04 05 06 07' },
    { email: 'agent@akpbf.com', name: 'Coulibaly Issa', role: 'AGENT', phone: '+225 05 05 06 07 08' },
  ];

  const createdUsers: Record<string, any> = {};
  for (const member of staff) {
    const usr = await prisma.user.create({
      data: {
        email: member.email,
        name: member.name,
        passwordHash,
        phone: member.phone,
        isActive: true,
      },
    });
    createdUsers[member.role] = usr;

    // Link user role
    await prisma.userRole.create({
      data: {
        userId: usr.id,
        roleId: roles[member.role].id,
      },
    });
  }
  console.log('✅ Seeded 5 official operational enterprise users with roles.');

  // 6. Create Subscription Plans
  const plansData = [
    { name: 'Formule Sociale Éco', price: 3000, frequency: 'Mensuel', description: '1 levée de poubelle par semaine, idéal petite cour commune.' },
    { name: 'Formule Classique Plus', price: 5000, frequency: 'Mensuel', description: '2 levées par semaine de poubelles standards 240L, le choix standard.' },
    { name: 'Premium Grand Confort', price: 10000, frequency: 'Mensuel', description: '3 levées par semaine de bacs 360L, nettoyage de désinfection mensuel de bac.' },
    { name: 'Contrat Syndic Pro', price: 35000, frequency: 'Mensuel', description: 'Pour immeubles résidentiels et copropriétés d\'Abidjan, levées quotidiennes de bac 1100L.' },
  ];

  const createdPlans: any[] = [];
  for (const pl of plansData) {
    const plan = await prisma.subscriptionPlan.create({ data: pl });
    createdPlans.push(plan);
  }
  console.log('✅ Created subscription plans.');

  // 7. Seed Customers (Abonnés)
  const customersData = [
    { name: 'Kouassi Kouadio Jean', email: 'jean.kouassi@gmail.com', phone: '+225 07 48 29 10 33', address: 'Riviera 3 Copraci, Lot 14', subscriberId: 'ABJ-COS-0012', latitude: 5.3489, longitude: -3.9995 },
    { name: 'Syndic Résidence Soleil', email: 'soleil.syndic@hotmail.fr', phone: '+225 01 02 44 91 22', address: 'Palmeraie Triangle, Rue L82', subscriberId: 'ABJ-COS-0941', latitude: 5.3612, longitude: -3.9875 },
    { name: 'Madame Touré Fatoumata', email: 'fatou.toure@yahoo.fr', phone: '+225 05 52 81 92 00', address: 'Marcory Zone 4, Av. 18 de Décembre', subscriberId: 'ABJ-MAR-0120', latitude: 5.2985, longitude: -3.9782 },
    { name: 'Yao Amenan Chantal', email: 'chantal.yao@gmail.com', phone: '+225 07 11 22 33 44', address: 'Yopougon Selmer, Carrefour Sogefiha', subscriberId: 'ABJ-YOP-0349', latitude: 5.3125, longitude: -4.0152 },
  ];

  const createdCustomers: any[] = [];
  for (let i = 0; i < customersData.length; i++) {
    const custData = customersData[i];
    const cust = await prisma.customer.create({ data: custData });
    createdCustomers.push(cust);

    // Create Subscription
    const planSelected = createdPlans[i % createdPlans.length];
    const sub = await prisma.subscription.create({
      data: {
        customerId: cust.id,
        planId: planSelected.id,
        startDate: new Date(),
        status: 'ACTIVE',
      },
    });

    // Create Invoice (Unpaid)
    await prisma.invoice.create({
      data: {
        customerId: cust.id,
        subscriptionId: sub.id,
        amount: planSelected.price,
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // in 15 days
        status: 'UNPAID',
        billingPeriodStart: new Date(),
        billingPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // Create Invoice (Paid helper)
    if (i % 2 === 0) {
      const paidInvoice = await prisma.invoice.create({
        data: {
          customerId: cust.id,
          subscriptionId: sub.id,
          amount: planSelected.price,
          dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          status: 'PAID',
          billingPeriodStart: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
          billingPeriodEnd: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        },
      });

      // Bind payment
      await prisma.payment.create({
        data: {
          invoiceId: paidInvoice.id,
          amount: planSelected.price,
          method: 'MOBILE_MONEY',
          status: 'SUCCESS',
          transactionId: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
        },
      });
    }
  }
  console.log('✅ Seeded abonnés, active subscriptions, payments, and invoice ledger items.');

  // 8. Seed Vehicles & Collection Routes
  const route = await prisma.collectionRoute.create({
    data: {
      name: 'Zone A - Cocody Riviera 3-4',
      description: 'Collecte journalière résidences et commerces Riviera.',
      startPoint: 'Dépôt Central Boulevard M’Badon',
      endPoint: 'Décharge Technique de Kossihouen',
    },
  });

  const vehicle = await prisma.vehicle.create({
    data: {
      plateNumber: 'BG-402-CI',
      model: 'Renault D Wide 26T Benne Tasseuse',
      capacity: 18.5,
      status: 'ACTIVE',
    },
  });

  // Gps Coordinates logs
  await prisma.vehicleLocation.create({
    data: {
      vehicleId: vehicle.id,
      latitude: 5.3489,
      longitude: -3.9995,
    },
  });

  // Route assignment
  await prisma.routeAssignment.create({
    data: {
      routeId: route.id,
      driverId: createdUsers['CHAUFFEUR'].id,
      vehicleId: vehicle.id,
      date: new Date(),
      status: 'IN_PROGRESS',
    },
  });

  console.log('✅ Seeded logistical routes, vehicle trackers and team assignments.');

  // 9. Bins (Poubelles) RFID/Connected
  for (let i = 0; i < createdCustomers.length; i++) {
    const customer = createdCustomers[i];
    await prisma.bin.create({
      data: {
        qrCode: `RFID-${customer.subscriberId}`,
        customerId: customer.id,
        routeId: route.id,
        capacity: i % 2 === 0 ? 240.0 : 360.0,
        fillLevel: Math.floor(Math.random() * 85),
        latitude: customer.latitude,
        longitude: customer.longitude,
        status: 'OK',
      },
    });
  }
  console.log('✅ Synchronized IoT connected bin RFID/QR logs with abonnés.');

  // 10. System settings seeds
  await prisma.setting.createMany({
    data: [
      { key: 'MUNICIPALITY_NAME', value: 'District Autonome d\'Abidjan', desc: 'Région administrative de compétence' },
      { key: 'SMS_API_PROVIDER', value: 'VAS_ORANGE_CI_ENTERPRISE', desc: 'Passerelle sortante de messagerie SMS d\'alertes' },
      { key: 'LATE_FEES_PERCENTAGE', value: '5.0', desc: 'Indemnité forfaitaire de retard de mensualité d\'assainissement' },
    ],
  });
  console.log('✅ Default settings loaded.');

  // erpclaw logic: Initialize Chart of Accounts
  console.log('🌱 Initializing erpclaw Chart of Accounts...');
  const accounts = [
    { code: '1000', name: 'Trésorerie', type: 'Asset' },
    { code: '1100', name: 'Comptes Clients', type: 'Asset' },
    { code: '2000', name: 'Comptes Fournisseurs', type: 'Liability' },
    { code: '3000', name: 'Capitaux Propres', type: 'Equity' },
    { code: '4000', name: 'Revenus de Salubrité', type: 'Income' },
    { code: '5000', name: 'Charges Opérationnelles', type: 'Expense' }
  ];

  for (const acc of accounts) {
    await prisma.account.upsert({
      where: { code: acc.code },
      update: {},
      create: {
        code: acc.code,
        name: acc.name,
        type: acc.type
      }
    });
  }
  console.log('✅ Chart of Accounts initialized.');

  console.log('🎉 Database seeding compiled successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during Prisma database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
