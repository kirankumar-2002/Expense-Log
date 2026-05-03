export interface FinancialRecord {
  ID: string;
  Date: string;
  Amount: number;
  State: 'Receivable' | 'Payable' | string;
  Category: string;
  'Sub-Category': string;
  Status: 'Pending' | 'Processed' | string;
  Desc: string;
  Notes: string;
  Accounts: string;
}

export type Transaction = FinancialRecord;
export type Outstanding = FinancialRecord;

export interface Account {
  id: string;
  name: string;
  bank: string;
  type: 'Current' | 'Savings' | 'Credit';
  balance: number;
  standardBalance?: number;
  lastUpdated: string;
  Month?: string;
}

export type PageView = 'dashboard' | 'transactions' | 'outstanding' | 'timeline' | 'accounts';
