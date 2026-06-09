import { AccountingRepository } from '../repositories/accountingRepository';
import { Account, Journal, JournalEntry, JournalEntryLine, Expense, AccountType, Supplier, SupplierInvoice } from '../models/types';
import crypto from 'crypto';

export class AccountingService {
  private static instance: AccountingService;
  private repo = AccountingRepository.getInstance();

  private constructor() {}

  public static getInstance(): AccountingService {
    if (!AccountingService.instance) {
      AccountingService.instance = new AccountingService();
    }
    return AccountingService.instance;
  }

  /**
   * Compiles and returns all charts of accounts, journals, entries, and financial statements
   */
  public async getAccountingState() {
    const accounts = await this.repo.getAccounts();
    const journals = await this.repo.getJournals();
    const entriesWithLines = await this.repo.getJournalEntries();
    const expenses = await this.repo.getExpenses();
    const suppliers = await this.repo.getSuppliers();
    const supplierInvoices = await this.repo.getSupplierInvoices();

    // Compile actual balances for trial balance and reporting
    const trialBalance = this.compileTrialBalance(accounts, entriesWithLines);
    const incomeStatement = this.compileIncomeStatement(trialBalance);
    const balanceSheet = this.compileBalanceSheet(trialBalance);

    return {
      accounts,
      journals,
      entries: entriesWithLines,
      expenses,
      suppliers,
      supplierInvoices,
      statements: {
        trialBalance,
        incomeStatement,
        balanceSheet
      }
    };
  }

  // ==========================================
  // REGISTER & UPDATE SUPPLIERS
  // ==========================================
  public async getSuppliers(): Promise<Supplier[]> {
    return await this.repo.getSuppliers();
  }

  public async getSupplierInvoices(): Promise<SupplierInvoice[]> {
    return await this.repo.getSupplierInvoices();
  }

  public async createSupplier(supplierData: any): Promise<Supplier> {
    const list = await this.repo.getSuppliers();
    const newId = `FOUR-00${list.length + 1}`;
    const newSupplier: Supplier = {
      id: newId,
      name: supplierData.name,
      contactName: supplierData.contactName || '',
      email: supplierData.email || '',
      phone: supplierData.phone,
      address: supplierData.address || '',
      category: supplierData.category || 'Others',
      outstandingDebt: 0,
      createdAt: new Date().toISOString()
    };
    list.push(newSupplier);
    await this.repo.saveSuppliers(list);
    return newSupplier;
  }

  public async createSupplierInvoice(invoiceData: any): Promise<SupplierInvoice> {
    const invoices = await this.repo.getSupplierInvoices();
    const suppliers = await this.repo.getSuppliers();

    const selectedSup = suppliers.find(s => s.id === invoiceData.supplierId);
    if (!selectedSup) {
      throw new Error(`Fournisseur avec l'identifiant ${invoiceData.supplierId} introuvable.`);
    }

    const newId = `FAC-FOUR-0${invoices.length + 1}`;
    const amount = Number(invoiceData.amount);

    const newInvoice: SupplierInvoice = {
      id: newId,
      supplierId: invoiceData.supplierId,
      supplierName: selectedSup.name,
      invoiceNumber: invoiceData.invoiceNumber,
      amount,
      dueDate: invoiceData.dueDate || new Date().toISOString().split('T')[0],
      category: invoiceData.category || 'Divers d\'exploitation',
      status: 'draft',
      validationFlow: 'Comptable',
      justificatifUrl: invoiceData.justificatifUrl || 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=400&auto=format&fit=crop&q=60',
      createdAt: new Date().toISOString()
    };

    invoices.push(newInvoice);
    await this.repo.saveSupplierInvoices(invoices);

    // Increment outstanding debt on suppliers list
    selectedSup.outstandingDebt += amount;
    await this.repo.saveSuppliers(suppliers);

    // Standard SYSCOHADA double-entry logic: Establish Debt liability
    // Debit Class 6 (purchased service charges, standard 606100) / Credit Class 401100 (Supplier Debt)
    try {
      let debitAccount = '606100'; // Fuel
      const categoryLower = (invoiceData.category || '').toLowerCase();
      if (categoryLower.includes('repar') || categoryLower.includes('maintenan')) {
        debitAccount = '615100'; // Repair
      } else if (categoryLower.includes('equip') || categoryLower.includes('bac')) {
        debitAccount = '602100'; // Sacs/Bacs supplies
      } else if (categoryLower.includes('telecom') || categoryLower.includes('phone')) {
        debitAccount = '626100'; // Telecom
      } else if (categoryLower.includes('insur') || categoryLower.includes('assur')) {
        debitAccount = '616100'; // Insurance
      }

      await this.createManualEntry({
        date: new Date().toISOString().split('T')[0],
        reference: newInvoice.id,
        description: `Facture d'achat d'exploitation rattachée - No. ${newInvoice.invoiceNumber} (Fr: ${selectedSup.name})`,
        journalCode: 'AC',
        operator: 'Système ERP (Auto)'
      }, [
        { accountCode: debitAccount, debit: amount, credit: 0 },
        { accountCode: '401100', debit: 0, credit: amount }
      ]);
    } catch (e: any) {
      console.error('[AccountingService] Automatic purchase entry generation error:', e);
    }

    return newInvoice;
  }

  public async advanceSupplierInvoiceValidation(invoiceId: string): Promise<SupplierInvoice> {
    const invoices = await this.repo.getSupplierInvoices();
    const targetIdx = invoices.findIndex(i => i.id === invoiceId);

    if (targetIdx === -1) {
      throw new Error(`Facture d'achat ${invoiceId} introuvable.`);
    }

    const inv = invoices[targetIdx];

    if (inv.status === 'draft') {
      inv.status = 'pending_approval';
      inv.validationFlow = 'Comptable';
    } else if (inv.status === 'pending_approval') {
      inv.status = 'approved';
      inv.validationFlow = 'Directeur';
    } else if (inv.status === 'approved') {
      inv.status = 'paid';
      inv.validationFlow = 'Terminé';

      // Settle Outstanding Debts on Supplier profile
      const suppliers = await this.repo.getSuppliers();
      const sIndex = suppliers.findIndex(s => s.id === inv.supplierId);
      if (sIndex !== -1) {
        suppliers[sIndex].outstandingDebt = Math.max(0, suppliers[sIndex].outstandingDebt - inv.amount);
        await this.repo.saveSuppliers(suppliers);
      }

      // Standard SYSCOHADA double-entry logic: Clear Supplier debt liability (401100) via cash/bank
      // Debit 401100 / Credit 571100 or 512100
      try {
        await this.createManualEntry({
          date: new Date().toISOString().split('T')[0],
          reference: `SETTLE-${inv.id}`,
          description: `Règlement facture d'achat ${inv.id} (No. ${inv.invoiceNumber} Fr: ${inv.supplierName})`,
          journalCode: 'CSH',
          operator: 'Comptable ERP (Validation)'
        }, [
          { accountCode: '401100', debit: inv.amount, credit: 0 },
          { accountCode: '571100', debit: 0, credit: inv.amount }
        ]);
      } catch (e: any) {
        console.error('[AccountingService] Automatic supplier settlement journal entry error:', e);
      }
    }

    await this.repo.saveSupplierInvoices(invoices);
    return inv;
  }

  /**
   * Creates a manual journal entry with relational lines. Enforces Debit = Credit!
   */
  public async createManualEntry(
    payload: Omit<JournalEntry, 'id' | 'createdAt' | 'status'>,
    lines: Omit<JournalEntryLine, 'id' | 'entryId'>[]
  ): Promise<{ entry: JournalEntry; lines: JournalEntryLine[] }> {
    const totalDebit = lines.reduce((sum, l) => sum + Number(l.debit), 0);
    const totalCredit = lines.reduce((sum, l) => sum + Number(l.credit), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(`Règle comptable violée: Le débit doit être égal au crédit. Total Débit: ${totalDebit} FCFA, Total Crédit: ${totalCredit} FCFA.`);
    }

    if (totalDebit <= 0) {
      throw new Error("Le montant total d'une écriture comptable doit être supérieur à zéro.");
    }

    // Check if accounts exist and are active
    const accounts = await this.repo.getAccounts();
    const activeCodes = new Set(accounts.filter(a => a.isActive).map(a => a.code));

    for (const l of lines) {
      if (!activeCodes.has(l.accountCode)) {
        throw new Error(`Le compte "${l.accountCode}" n'existe pas ou est inactif dans le Plan Comptable.`);
      }
    }

    const entryId = `ECR-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const newEntry: JournalEntry = {
      ...payload,
      id: entryId,
      status: 'POSTED',
      createdAt: new Date().toISOString()
    };

    const newLines: JournalEntryLine[] = lines.map((l, index) => ({
      ...l,
      id: `${entryId}-L${index + 1}`,
      entryId
    }));

    const currentEntries = await this.repo.getJournalEntries();
    currentEntries.unshift({ entry: newEntry, lines: newLines });

    await this.repo.saveJournalEntries(currentEntries);
    return { entry: newEntry, lines: newLines };
  }

  /**
   * Automates invoice journal entry generation (Class 4 debit / Class 7 credit)
   */
  public async createInvoiceEntry(invoice: {
    id: string;
    customerName: string;
    amount: number;
    issueDate: string;
    period: string;
  }): Promise<void> {
    try {
      const payload = {
        date: invoice.issueDate,
        reference: invoice.id,
        description: `Facturation Salubrité [${invoice.customerName}] - Période ${invoice.period}`,
        journalCode: 'VT',
        operator: 'Système ERP'
      };

      const lines = [
        { accountCode: '411100', debit: invoice.amount, credit: 0 }, // Class 4 Debit (Clients)
        { accountCode: '706100', debit: 0, credit: invoice.amount }  // Class 7 Credit (Revenues)
      ];

      // Avoid duplication by looking for matching reference
      const entries = await this.repo.getJournalEntries();
      const exists = entries.some(e => e.entry.reference === invoice.id && e.entry.journalCode === 'VT');
      if (!exists) {
        await this.createManualEntry(payload, lines);
      }
    } catch (e) {
      console.error('[AccountingService] Failed to generate automatic invoice journal entry:', e);
    }
  }

  /**
   * Automates payment journal entry generation (Class 5 debit / Class 4 credit)
   */
  public async createPaymentEntry(payment: {
    id: string;
    invoiceId: string;
    customerName: string;
    amount: number;
    method: string;
    paymentDate: string;
  }): Promise<void> {
    try {
      let debitAccount = '571100'; // Default Caisse Principale
      let journalCode = 'CSH';

      const methodLower = payment.method.toLowerCase();
      if (methodLower.includes('bancaire') || methodLower.includes('virement') || methodLower.includes('carte') || methodLower.includes('cheque')) {
        debitAccount = '512100'; // BOA Banque
        journalCode = 'BQ';
      } else if (methodLower.includes('wave')) {
        debitAccount = '512200'; // Wave
        journalCode = 'BQ';
      } else if (methodLower.includes('orange')) {
        debitAccount = '521200'; // Orange Money
        journalCode = 'OM';
      } else if (methodLower.includes('moov')) {
        debitAccount = '521250'; // Moov Money
        journalCode = 'MM';
      }

      const payload = {
        date: payment.paymentDate,
        reference: payment.id,
        description: `Encaissement redevance [${payment.customerName}] via ${payment.method} - Invoice Ref: ${payment.invoiceId}`,
        journalCode,
        operator: 'Système ERP'
      };

      const lines = [
        { accountCode: debitAccount, debit: payment.amount, credit: 0 }, // Class 5 Debit (Cash/Bank)
        { accountCode: '411100', debit: 0, credit: payment.amount }      // Class 4 Credit (Clients)
      ];

      const entries = await this.repo.getJournalEntries();
      const exists = entries.some(e => e.entry.reference === payment.id);
      if (!exists) {
        await this.createManualEntry(payload, lines);
      }
    } catch (e) {
      console.error('[AccountingService] Failed to generate automatic payment journal entry:', e);
    }
  }

  /**
   * Creates a corporate expense and registers its double entry (Class 6 debit / Class 5 or Class 4 credit)
   */
  public async registerExpense(expenseData: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
    const id = `EXP-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const newExpense: Expense = {
      ...expenseData,
      id,
      createdAt: new Date().toISOString()
    };

    const currentExpenses = await this.repo.getExpenses();
    currentExpenses.unshift(newExpense);
    await this.repo.saveExpenses(currentExpenses);

    // Dynamic double entry compta recording
    let creditAccount = '401100'; // Default: Dettes Fournisseurs (if not paid instantly)
    let journalCode = 'AC';

    if (newExpense.isPaid) {
      journalCode = 'CSH';
      creditAccount = '571100'; // Cash

      const methodLower = newExpense.paymentMethod.toLowerCase();
      if (methodLower.includes('bancaire') || methodLower.includes('virement') || methodLower.includes('carte') || methodLower.includes('cheque') || methodLower.includes('boa')) {
        creditAccount = '512100'; // BOA Banque
        journalCode = 'BQ';
      } else if (methodLower.includes('wave')) {
        creditAccount = '512200'; // Wave
        journalCode = 'BQ';
      } else if (methodLower.includes('orange')) {
        creditAccount = '521200'; // Orange Money
        journalCode = 'OM';
      } else if (methodLower.includes('moov')) {
        creditAccount = '521250'; // Moov Money
        journalCode = 'MM';
      }
    }

    try {
      await this.createManualEntry({
        date: newExpense.date,
        reference: id,
        description: `Dépense: ${newExpense.description} (Fournisseur: ${newExpense.supplierName || 'Divers'})`,
        journalCode,
        operator: 'Comptable ERP'
      }, [
        { accountCode: newExpense.categoryCode, debit: newExpense.amount, credit: 0 }, // Class 6 Debit
        { accountCode: creditAccount, debit: 0, credit: newExpense.amount }          // Class 5/4 Credit
      ]);
    } catch (e) {
      console.error('[AccountingService] Failed to register double entry for expense:', e);
    }

    return newExpense;
  }

  // ==========================================
  // SYSCOHADA ANALYTIC REPORT GENERATION
  // ==========================================
  private compileTrialBalance(accounts: Account[], entries: { entry: JournalEntry; lines: JournalEntryLine[] }[]) {
    const balances: { [code: string]: { debit: number; credit: number } } = {};

    accounts.forEach(a => {
      balances[a.code] = { debit: 0, credit: 0 };
    });

    entries.forEach(e => {
      e.lines.forEach(l => {
        if (!balances[l.accountCode]) {
          balances[l.accountCode] = { debit: 0, credit: 0 };
        }
        balances[l.accountCode].debit += Number(l.debit);
        balances[l.accountCode].credit += Number(l.credit);
      });
    });

    return Object.entries(balances).map(([code, b]) => {
      const account = accounts.find(a => a.code === code);
      const val = b.debit - b.credit;
      return {
        code,
        name: account ? account.name : 'Compte Divers d’exploitation',
        type: (account ? account.type : 'EXPENSE') as AccountType,
        debit: b.debit,
        credit: b.credit,
        soldeDebiteur: val > 0 ? val : 0,
        soldeCrediteur: val < 0 ? Math.abs(val) : 0
      };
    });
  }

  private compileIncomeStatement(trialBalance: any[]) {
    const products = trialBalance.filter(b => b.code.startsWith('7'));
    const charges = trialBalance.filter(b => b.code.startsWith('6'));

    const totalProducts = products.reduce((sum, p) => sum + p.soldeCrediteur - p.soldeDebiteur, 0);
    const totalCharges = charges.reduce((sum, c) => sum + c.soldeDebiteur - c.soldeCrediteur, 0);
    const netResult = totalProducts - totalCharges;

    return {
      products: products.map(p => ({
        code: p.code,
        name: p.name,
        amount: p.soldeCrediteur - p.soldeDebiteur
      })).filter(x => x.amount > 0),
      charges: charges.map(c => ({
        code: c.code,
        name: c.name,
        amount: c.soldeDebiteur - c.soldeCrediteur
      })).filter(x => x.amount > 0),
      totalProducts,
      totalCharges,
      netResult
    };
  }

  private compileBalanceSheet(trialBalance: any[]) {
    // Assets: Classes 2, 5, Class 4 client (411)
    const assets = trialBalance.filter(b => b.code.startsWith('2') || b.code.startsWith('5') || b.code === '411100');
    // Liabilities/Equity: Class 1, Class 4 supplier (401)
    const equitiesAndLiabilities = trialBalance.filter(b => b.code.startsWith('1') || b.code === '401100');

    const totalAssets = assets.reduce((sum, a) => sum + (a.soldeDebiteur - a.soldeCrediteur), 0);
    const totalEquitiesAndLiabilities = equitiesAndLiabilities.reduce((sum, e) => sum + (e.soldeCrediteur - e.soldeDebiteur), 0);

    return {
      assets: assets.map(a => ({
        code: a.code,
        name: a.name,
        amount: a.soldeDebiteur - a.soldeCrediteur
      })).filter(x => x.amount > 0),
      liabilities: equitiesAndLiabilities.map(l => ({
        code: l.code,
        name: l.name,
        amount: l.soldeCrediteur - l.soldeDebiteur
      })).filter(x => x.amount > 0),
      totalAssets,
      totalEquitiesAndLiabilities
    };
  }
}
