import { getPrismaClient } from '../../../config/database';
import { Account, Journal, JournalEntry, JournalEntryLine, Expense, ExpenseCategory, Supplier, SupplierInvoice } from '../models/types';

export class AccountingRepository {
  private static instance: AccountingRepository;

  private constructor() {}

  public static getInstance(): AccountingRepository {
    if (!AccountingRepository.instance) {
      AccountingRepository.instance = new AccountingRepository();
    }
    return AccountingRepository.instance;
  }

  /**
   * Helper to fetch data serialized in settings table in PostgreSQL
   */
  private async getSettingData<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const prisma = getPrismaClient();
      const setting = await prisma.setting.findUnique({
        where: { key }
      });
      if (setting && setting.value) {
        return JSON.parse(setting.value) as T;
      }
    } catch (e) {
      console.warn(`[AccountingRepository] Failed to read ${key} from PostgreSQL. Falling back to default.`, e);
    }
    return defaultValue;
  }

  /**
   * Helper to write records to settings table in PostgreSQL
   */
  private async saveSettingData<T>(key: string, data: T, desc: string): Promise<void> {
    try {
      const prisma = getPrismaClient();
      await prisma.setting.upsert({
        where: { key },
        update: { value: JSON.stringify(data) },
        create: {
          key,
          value: JSON.stringify(data),
          desc
        }
      });
    } catch (e) {
      console.error(`[AccountingRepository] Critical: Failed to persist accounting data for ${key} to PostgreSQL`, e);
    }
  }

  // ==========================================
  // SUPPLIERS
  // ==========================================
  public async getSuppliers(): Promise<Supplier[]> {
    const list = await this.getSettingData<Supplier[]>('AKPBF_ERP_SUPPLIERS', []);
    if (list.length === 0) {
      const seeded: Supplier[] = [
        {
          id: 'FOUR-001',
          name: 'Sodirep S.A.',
          contactName: 'Kaboré Souleymane',
          email: 'contact@sodirep.bf',
          phone: '+226 25 30 31 32',
          address: 'Avenue de la Nation, Ouagadougou',
          category: 'Fuel',
          outstandingDebt: 0
        },
        {
          id: 'FOUR-002',
          name: 'PlastIsur Sarl',
          contactName: 'Sawadogo Aminata',
          email: 'b2b@plastisur.com',
          phone: '+226 25 40 41 42',
          address: 'Zone Industrielle de Kossodo, Ouagadougou',
          category: 'Equipment',
          outstandingDebt: 0
        }
      ];
      await this.saveSuppliers(seeded);
      return seeded;
    }
    return list;
  }

  public async saveSuppliers(suppliers: Supplier[]): Promise<void> {
    await this.saveSettingData('AKPBF_ERP_SUPPLIERS', suppliers, 'Annuaire des fournisseurs homologues AKPBF');
  }

  // ==========================================
  // SUPPLIER INVOICES
  // ==========================================
  public async getSupplierInvoices(): Promise<SupplierInvoice[]> {
    const list = await this.getSettingData<SupplierInvoice[]>('AKPBF_ERP_SUPPLIER_INVOICES', []);
    if (list.length === 0) {
      const seeded: SupplierInvoice[] = [
        {
          id: 'FAC-FOUR-01',
          supplierId: 'FOUR-001',
          supplierName: 'Sodirep S.A.',
          invoiceNumber: 'SOD-2026-004',
          amount: 120000,
          dueDate: '2026-08-30',
          category: 'Carburant',
          status: 'paid',
          validationFlow: 'Terminé',
          justificatifUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=400&auto=format&fit=crop&q=60'
        }
      ];
      await this.saveSupplierInvoices(seeded);
      return seeded;
    }
    return list;
  }

  public async saveSupplierInvoices(invoices: SupplierInvoice[]): Promise<void> {
    await this.saveSettingData('AKPBF_ERP_SUPPLIER_INVOICES', invoices, 'Registre des factures fournisseurs d’achats et dettes');
  }

  // ==========================================
  // ACCOUNTS (PLAN COMPTABLE)
  // ==========================================
  public async getAccounts(): Promise<Account[]> {
    const list = await this.getSettingData<Account[]>('AKPBF_ERP_ACCOUNTS', []);
    if (list.length === 0) {
      // Seed default SYSCOHADA plan comptable immediately on first request
      const seeded = this.getDefaultAccounts();
      await this.saveAccounts(seeded);
      return seeded;
    }
    return list;
  }

  public async saveAccounts(accounts: Account[]): Promise<void> {
    await this.saveSettingData('AKPBF_ERP_ACCOUNTS', accounts, 'Plan Comptable SYSCOHADA révisé pour AKPBF ERP');
  }

  // ==========================================
  // JOURNALS
  // ==========================================
  public async getJournals(): Promise<Journal[]> {
    const list = await this.getSettingData<Journal[]>('AKPBF_ERP_JOURNALS', []);
    if (list.length === 0) {
      const seeded = this.getDefaultJournals();
      await this.saveJournals(seeded);
      return seeded;
    }
    return list;
  }

  public async saveJournals(journals: Journal[]): Promise<void> {
    await this.saveSettingData('AKPBF_ERP_JOURNALS', journals, 'Liste des journaux comptables autorisés');
  }

  // ==========================================
  // JOURNAL ENTRIES
  // ==========================================
  public async getJournalEntries(): Promise<{ entry: JournalEntry; lines: JournalEntryLine[] }[]> {
    const entriesWithLines = await this.getSettingData<{ entry: JournalEntry; lines: JournalEntryLine[] }[]>('AKPBF_ERP_JOURNAL_ENTRIES_DETAILED', []);
    
    if (entriesWithLines.length === 0) {
      // Attempt legacy fallback from setting AKPBF_ERP_JOURNAL or seed new ones
      const legacyJournal = await this.getSettingData<any[]>('AKPBF_ERP_JOURNAL', []);
      if (legacyJournal.length > 0) {
        // Map old linear format to proper relational double entries
        const mappedList: { entry: JournalEntry; lines: JournalEntryLine[] }[] = [];
        legacyJournal.forEach((legacy, idx) => {
          const entryId = legacy.id || `ECR-LEG-${1000 + idx}`;
          
          const entry: JournalEntry = {
            id: entryId,
            date: legacy.date || new Date().toISOString().split('T')[0],
            reference: legacy.reference || 'SOLDE-INIT',
            description: legacy.description || 'Saisie historique d’exploitation',
            journalCode: legacy.debitAccount?.includes('Caisse') ? 'CSH' : 'BQ',
            status: 'POSTED',
            operator: legacy.operator || 'Système',
            createdAt: new Date().toISOString()
          };

          const debitAcc = legacy.debitAccount ? legacy.debitAccount.split(' - ')[0] : '571100';
          const creditAcc = legacy.creditAccount ? legacy.creditAccount.split(' - ')[0] : '411100';

          const lines: JournalEntryLine[] = [
            { id: `${entryId}-L1`, entryId, accountCode: debitAcc, debit: legacy.amount, credit: 0 },
            { id: `${entryId}-L2`, entryId, accountCode: creditAcc, debit: 0, credit: legacy.amount }
          ];

          mappedList.push({ entry, lines });
        });
        await this.saveJournalEntries(mappedList);
        return mappedList;
      }

      // If no legacy data exists, seed rich default double occurrences
      const seeded = this.getDefaultJournalEntries();
      await this.saveJournalEntries(seeded);
      return seeded;
    }

    return entriesWithLines;
  }

  public async saveJournalEntries(entries: { entry: JournalEntry; lines: JournalEntryLine[] }[]): Promise<void> {
    // Sort reverse chronological
    entries.sort((a, b) => b.entry.date.localeCompare(a.entry.date));
    await this.saveSettingData('AKPBF_ERP_JOURNAL_ENTRIES_DETAILED', entries, 'Grand livre général détaillé d’écritures compta');
    
    // Maintain sync with legacy key so other parts of ERP can read simplified linear list
    const legacyList = entries.map(e => {
      const debitLine = e.lines.find(l => l.debit > 0);
      const creditLine = e.lines.find(l => l.credit > 0);
      return {
        id: e.entry.id,
        date: e.entry.date,
        reference: e.entry.reference,
        description: e.entry.description,
        amount: debitLine ? debitLine.debit : (creditLine ? creditLine.credit : 0),
        debitAccount: debitLine ? `${debitLine.accountCode} - Débit` : '571100 - Caisse',
        creditAccount: creditLine ? `${creditLine.accountCode} - Crédit` : '411100 - Créance',
        operator: e.entry.operator,
        status: e.entry.status === 'POSTED' ? 'CONFIRMÉ' : 'BROUILLON'
      };
    });
    await this.saveSettingData('AKPBF_ERP_JOURNAL', legacyList, 'Simplified Journal List fallback');
  }

  // ==========================================
  // EXPENSES
  // ==========================================
  public async getExpenses(): Promise<Expense[]> {
    const list = await this.getSettingData<Expense[]>('AKPBF_ERP_EXPENSES', []);
    if (list.length === 0) {
      const seeded = this.getDefaultExpenses();
      await this.saveExpenses(seeded);
      return seeded;
    }
    return list;
  }

  public async saveExpenses(expenses: Expense[]): Promise<void> {
    await this.saveSettingData('AKPBF_ERP_EXPENSES', expenses, 'Registre de dépenses industrielles de salubrité');
  }

  // ==========================================
  // INITIAL DATA SEEDS
  // ==========================================
  private getDefaultAccounts(): Account[] {
    return [
      { id: 'acc-1', code: '101100', name: 'Capital Municipal d’Investissement', type: 'EQUITY', isActive: true, createdAt: new Date() },
      { id: 'acc-2', code: '244100', name: 'Matériels de Transport & Compacteurs', type: 'ASSET', isActive: true, createdAt: new Date() },
      { id: 'acc-3', code: '401100', name: 'Dettes Fournisseurs d’Exploitation d’Abidjan', type: 'LIABILITY', isActive: true, createdAt: new Date() },
      { id: 'acc-4', code: '411100', name: 'Clients Ordinaires - Créances Salubrité', type: 'ASSET', isActive: true, createdAt: new Date() },
      { id: 'acc-5', code: '512100', name: 'Compte Banque BOA Côte d’Ivoire', type: 'ASSET', isActive: true, createdAt: new Date() },
      { id: 'acc-6', code: '512200', name: 'Compte Trésorerie Mobile Money Wave', type: 'ASSET', isActive: true, createdAt: new Date() },
      { id: 'acc-7', code: '521200', name: 'Portefeuille Trésor Orange Money', type: 'ASSET', isActive: true, createdAt: new Date() },
      { id: 'acc-8', code: '521250', name: 'Portefeuille Trésor Moov Money', type: 'ASSET', isActive: true, createdAt: new Date() },
      { id: 'acc-9', code: '571100', name: 'Caisse Principale Commune d’Abidjan', type: 'ASSET', isActive: true, createdAt: new Date() },
      { id: 'acc-10', code: '602100', name: 'Fournitures Sacs Poubelles Biodégradables', type: 'EXPENSE', isActive: true, createdAt: new Date() },
      { id: 'acc-11', code: '606100', name: 'Fournitures de Carburant & Lubrifiant Camions', type: 'EXPENSE', isActive: true, createdAt: new Date() },
      { id: 'acc-12', code: '615100', name: 'Entretien & Réparations du Parc de Camions', type: 'EXPENSE', isActive: true, createdAt: new Date() },
      { id: 'acc-13', code: '616100', name: 'Primes d’Assurances de Responsabilité Civile Flotte', type: 'EXPENSE', isActive: true, createdAt: new Date() },
      { id: 'acc-14', code: '626100', name: 'Dépenses Télécoms d’Exploitation (Fibre/SMS Portal)', type: 'EXPENSE', isActive: true, createdAt: new Date() },
      { id: 'acc-15', code: '641100', name: 'Rémunérations Salariales des Chauffeurs & Éboueurs', type: 'EXPENSE', isActive: true, createdAt: new Date() },
      { id: 'acc-16', code: '706100', name: 'Prestations de Services de Collecte d’Ordures', type: 'REVENUE', isActive: true, createdAt: new Date() }
    ];
  }

  private getDefaultJournals(): Journal[] {
    return [
      { id: 'j-1', code: 'VT', name: 'Ventes (Facturation Salubrité)', type: 'SALES', isActive: true },
      { id: 'j-2', code: 'AC', name: 'Achats (Dépenses & Fournisseurs)', type: 'PURCHASES', isActive: true },
      { id: 'j-3', code: 'CSH', name: 'Caisse (Espèces Commune)', type: 'CASH', isActive: true },
      { id: 'j-4', code: 'BQ', name: 'Banque BOA (SGBI/BOA Transactions)', type: 'BANK', isActive: true },
      { id: 'j-5', code: 'OM', name: 'Orange Money (Paiements Mobiles)', type: 'BANK', isActive: true },
      { id: 'j-6', code: 'MM', name: 'Moov Money (Paiements Mobiles)', type: 'BANK', isActive: true },
      { id: 'j-7', code: 'OD', name: 'Opérations Diverses (Vouchers Généraux)', type: 'GENERAL', isActive: true }
    ];
  }

  private getDefaultJournalEntries(): { entry: JournalEntry; lines: JournalEntryLine[] }[] {
    // 3 complete default entries representing realistic opening transactions
    return [
      {
        entry: {
          id: 'ECR-2401',
          date: '2026-05-01',
          reference: 'DOT-INIT',
          description: 'Dotation en capital d’investissement municipal de salubrité publique',
          journalCode: 'OD',
          status: 'POSTED',
          operator: 'Alkaïda Benjamin',
          createdAt: new Date().toISOString()
        },
        lines: [
          { id: 'L-2401-1', entryId: 'ECR-2401', accountCode: '244100', debit: 45000000, credit: 0 },
          { id: 'L-2401-2', entryId: 'ECR-2401', accountCode: '101100', debit: 0, credit: 45000000 }
        ]
      },
      {
        entry: {
          id: 'ECR-2402',
          date: '2026-05-10',
          reference: 'ACH-2026-901',
          description: 'Fourniture de Carburant Camions Salubrité - Facture Sodirep',
          journalCode: 'AC',
          status: 'POSTED',
          operator: 'Système ERP',
          createdAt: new Date().toISOString()
        },
        lines: [
          { id: 'L-2402-1', entryId: 'ECR-2402', accountCode: '606100', debit: 120000, credit: 0 },
          { id: 'L-2402-2', entryId: 'ECR-2402', accountCode: '401100', debit: 0, credit: 120000 }
        ]
      },
      {
        entry: {
          id: 'ECR-2403',
          date: '2026-05-11',
          reference: 'REG-2026-901',
          description: 'Chèque de règlement Sodirep - SGBI Banque #4510',
          journalCode: 'BQ',
          status: 'POSTED',
          operator: 'Comptable AKPBF',
          createdAt: new Date().toISOString()
        },
        lines: [
          { id: 'L-2403-1', entryId: 'ECR-2403', accountCode: '401100', debit: 120000, credit: 0 },
          { id: 'L-2403-2', entryId: 'ECR-2403', accountCode: '512100', debit: 0, credit: 120000 }
        ]
      }
    ];
  }

  private getDefaultExpenses(): Expense[] {
    return [
      { id: 'dep-1', description: 'Carburant Camion #COL-402 - Station Sodirep', amount: 120000, date: '2026-05-01', categoryCode: '606100', paymentMethod: 'Banque BOA', supplierName: 'Sodirep S.A.', isPaid: true, createdAt: new Date() },
      { id: 'dep-2', description: 'Achat de 500 sacs poubelles biodégradables', amount: 75000, date: '2026-05-10', categoryCode: '602100', paymentMethod: 'Espèces', supplierName: 'PlastIsur Sarl', isPaid: true, createdAt: new Date() },
      { id: 'dep-3', description: 'Acompte salaires éboueurs d’exploitation Mai', amount: 450000, date: '2026-05-12', categoryCode: '641100', paymentMethod: 'Espèces', supplierName: 'Paie Collective Éboueurs', isPaid: true, createdAt: new Date() },
      { id: 'dep-4', description: 'Maintenance Vidange Camion #COL-403', amount: 185000, date: '2026-05-15', categoryCode: '615100', paymentMethod: 'Banque BOA', supplierName: 'Garage central municipal', isPaid: true, createdAt: new Date() }
    ];
  }
}
