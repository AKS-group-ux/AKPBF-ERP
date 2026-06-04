export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  isActive: boolean;
  createdAt: Date | string;
}

export type JournalType = 'SALES' | 'PURCHASES' | 'CASH' | 'BANK' | 'GENERAL';

export interface Journal {
  id: string;
  code: string;
  name: string;
  type: JournalType;
  isActive: boolean;
}

export interface JournalEntry {
  id: string;
  date: string;
  reference: string;
  description: string;
  journalCode: string;
  status: 'DRAFT' | 'POSTED';
  operator: string;
  createdAt: Date | string;
}

export interface JournalEntryLine {
  id: string;
  entryId: string;
  accountCode: string;
  debit: number;
  credit: number;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  categoryCode: string; // e.g., '6061'
  paymentMethod: string; // e.g., 'Espèces', 'Banque BOA', 'Orange Money'
  supplierName?: string;
  isPaid: boolean;
  createdAt: Date | string;
}

export interface ExpenseCategory {
  code: string;
  name: string;
  accountCode: string;
}

export interface FinancialReport {
  id: string;
  name: string;
  type: 'BALANCE_SHEET' | 'INCOME_STATEMENT' | 'TRIAL_BALANCE' | 'GENERAL_LEDGER';
  period: string;
  generatedAt: Date | string;
  content: string; // Serialized JSON or narrative
}
