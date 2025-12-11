export type TransactionType = 'income' | 'expense';

export interface Account {
  id: string;
  name: string;
  bankName: string;
  balance: number;
  currency: string;
  type: 'saving' | 'checking' | 'investment' | 'cash';
}

export interface StockHolding {
  symbol: string;
  name: string;
  quantity: number;
  averageCost: number;
  currentPrice: number; // Updated via Gemini
  lastUpdated?: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  date: string;
  amount: number;
  type: TransactionType;
  category: string;
  note?: string;
}

export interface User {
  username: string;
  isLoggedIn: boolean;
}

export interface DashboardStats {
  netWorth: number;
  totalAssets: number;
  monthlyIncome: number;
  monthlyExpense: number;
}
