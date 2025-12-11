import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, CreditCard, TrendingUp, FileText, 
  LogOut, UserCircle, Menu, X, Cloud, CloudOff, Loader2
} from 'lucide-react';
import { Account, StockHolding, Transaction, User } from './types';
import { DashboardView, AccountsView, StocksView, TransactionsView } from './components/Views';
import { updateStockPrices, generateFinancialAdvice } from './services/geminiService';
import { loadUserData, saveUserData, isFirebaseReady } from './services/firebase';

// --- SEED DATA ---
const SEED_ACCOUNTS: Account[] = [
  { id: '1', name: '薪資帳戶', bankName: '台北富邦', balance: 150000, currency: 'TWD', type: 'checking' },
  { id: '2', name: '緊急備用金', bankName: '國泰世華', balance: 300000, currency: 'TWD', type: 'saving' },
];

const SEED_STOCKS: StockHolding[] = [
  { symbol: '2330.TW', name: '台積電', quantity: 1000, averageCost: 500, currentPrice: 580 },
  { symbol: 'AAPL', name: 'Apple Inc.', quantity: 50, averageCost: 150, currentPrice: 180 },
];

const SEED_TRANSACTIONS: Transaction[] = [
  { id: 't1', accountId: '1', date: '2023-10-01', amount: 50000, type: 'income', category: '薪資', note: '十月薪水' },
  { id: 't2', accountId: '1', date: '2023-10-05', amount: 3000, type: 'expense', category: '飲食', note: '聚餐' },
  { id: 't3', accountId: '2', date: '2023-10-10', amount: 1500, type: 'expense', category: '交通', note: '加油' },
];

const App: React.FC = () => {
  // --- STATE ---
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'accounts' | 'stocks' | 'transactions'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [stocks, setStocks] = useState<StockHolding[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string>('');
  
  // Data Sync State
  const [isSyncing, setIsSyncing] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // --- INIT & AUTH ---
  useEffect(() => {
    // Check if user is logged in locally
    const storedUser = localStorage.getItem('pfp_user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      // If logged in, fetch data for this user
      fetchData(parsedUser.username);
    }
  }, []);

  const fetchData = async (username: string) => {
    setIsSyncing(true);
    if (isFirebaseReady()) {
      const data = await loadUserData(username);
      if (data) {
        setAccounts(data.accounts);
        setStocks(data.stocks);
        setTransactions(data.transactions);
      } else {
        // New user or no data in Firebase -> Use Seed
        setAccounts(SEED_ACCOUNTS);
        setStocks(SEED_STOCKS);
        setTransactions(SEED_TRANSACTIONS);
      }
    } else {
      // Fallback to LocalStorage if Firebase not configured
      const storedAcc = localStorage.getItem('pfp_accounts');
      setAccounts(storedAcc ? JSON.parse(storedAcc) : SEED_ACCOUNTS);
      const storedStocks = localStorage.getItem('pfp_stocks');
      setStocks(storedStocks ? JSON.parse(storedStocks) : SEED_STOCKS);
      const storedTx = localStorage.getItem('pfp_transactions');
      setTransactions(storedTx ? JSON.parse(storedTx) : SEED_TRANSACTIONS);
    }
    setDataLoaded(true);
    setIsSyncing(false);
  };

  // Save changes to Firebase (Debounced or on effect)
  useEffect(() => {
    if (!user || !dataLoaded) return;

    const saveData = async () => {
      setIsSyncing(true);
      if (isFirebaseReady()) {
        await saveUserData(user.username, { accounts, stocks, transactions });
      } else {
        // Fallback to local storage
        localStorage.setItem('pfp_accounts', JSON.stringify(accounts));
        localStorage.setItem('pfp_stocks', JSON.stringify(stocks));
        localStorage.setItem('pfp_transactions', JSON.stringify(transactions));
      }
      setIsSyncing(false);
    };

    // Simple debounce to avoid too many writes
    const timeoutId = setTimeout(saveData, 1000);
    return () => clearTimeout(timeoutId);
  }, [accounts, stocks, transactions, user, dataLoaded]);

  // Generate Advice when dashboard loads or data changes
  useEffect(() => {
    if (user && activeTab === 'dashboard' && dataLoaded) {
      const netWorth = accounts.reduce((s, a) => s + a.balance, 0) + stocks.reduce((s, st) => s + (st.currentPrice * st.quantity), 0);
      const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      // Determine top category
      const cats: Record<string, number> = {};
      transactions.filter(t => t.type === 'expense').forEach(t => cats[t.category] = (cats[t.category] || 0) + t.amount);
      const topCat = Object.entries(cats).sort((a, b) => b[1] - a[1])[0]?.[0] || '無';

      generateFinancialAdvice(netWorth, expenses, topCat).then(setAiAdvice);
    }
  }, [user, activeTab, accounts, stocks, transactions, dataLoaded]);

  // --- HANDLERS ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const inputUser = (e.target as any).username.value;
    const newUser = { username: inputUser || 'User', isLoggedIn: true };
    setUser(newUser);
    localStorage.setItem('pfp_user', JSON.stringify(newUser));
    fetchData(newUser.username);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('pfp_user');
    setDataLoaded(false);
    setAccounts([]);
    setStocks([]);
    setTransactions([]);
  };

  // Account Management
  const addAccount = (acc: Omit<Account, 'id'>) => {
    const newAcc = { ...acc, id: Date.now().toString() };
    setAccounts([...accounts, newAcc]);
  };

  const editAccount = (updatedAcc: Account) => {
    setAccounts(prev => prev.map(a => a.id === updatedAcc.id ? updatedAcc : a));
  };

  const deleteAccount = (id: string) => {
    setAccounts(accounts.filter(a => a.id !== id));
  };

  // Transaction Management
  const addTransaction = (tx: Omit<Transaction, 'id'>) => {
    const newTx = { ...tx, id: Date.now().toString() };
    setTransactions([...transactions, newTx]);
    
    // Update account balance
    setAccounts(prev => prev.map(a => {
      if (a.id === tx.accountId) {
        return {
          ...a,
          balance: tx.type === 'income' ? a.balance + tx.amount : a.balance - tx.amount
        };
      }
      return a;
    }));
  };

  // Stock Management (Buy/Sell with account integration)
  const handleStockTrade = (
    action: 'buy' | 'sell',
    stockData: { symbol: string; name: string; quantity: number; price: number },
    accountId: string
  ) => {
    const totalAmount = stockData.quantity * stockData.price;
    const date = new Date().toISOString().split('T')[0];

    // 1. Update Stock Holdings
    let newStocks = [...stocks];
    const existingIndex = newStocks.findIndex(s => s.symbol === stockData.symbol);

    if (action === 'buy') {
      if (existingIndex >= 0) {
        const existing = newStocks[existingIndex];
        const newQuantity = existing.quantity + stockData.quantity;
        // Calculate new weighted average cost
        const totalCost = (existing.quantity * existing.averageCost) + totalAmount;
        const newAvgCost = totalCost / newQuantity;
        
        newStocks[existingIndex] = {
          ...existing,
          quantity: newQuantity,
          averageCost: newAvgCost,
          currentPrice: stockData.price // Update current price to latest transaction
        };
      } else {
        newStocks.push({
          symbol: stockData.symbol,
          name: stockData.name,
          quantity: stockData.quantity,
          averageCost: stockData.price,
          currentPrice: stockData.price
        });
      }
    } else {
      // Sell
      if (existingIndex >= 0) {
        const existing = newStocks[existingIndex];
        const newQuantity = existing.quantity - stockData.quantity;
        if (newQuantity <= 0) {
          // Remove if sold out
          newStocks = newStocks.filter(s => s.symbol !== stockData.symbol);
        } else {
          newStocks[existingIndex] = {
            ...existing,
            quantity: newQuantity,
            // Average cost doesn't change on sell, only on buy
            currentPrice: stockData.price
          };
        }
      } else {
        console.error("Cannot sell stock you don't own");
        return; 
      }
    }
    setStocks(newStocks);

    // 2. Update Account Balance
    setAccounts(prev => prev.map(a => {
      if (a.id === accountId) {
        return {
          ...a,
          balance: action === 'buy' ? a.balance - totalAmount : a.balance + totalAmount
        };
      }
      return a;
    }));

    // 3. Record Transaction
    const tx: Transaction = {
      id: Date.now().toString(),
      accountId,
      date,
      amount: totalAmount,
      type: action === 'buy' ? 'expense' : 'income',
      category: '投資',
      note: `${action === 'buy' ? '買入' : '賣出'} ${stockData.symbol} ${stockData.quantity}股 @ ${stockData.price}`
    };
    setTransactions([...transactions, tx]);
  };

  const updatePrices = async () => {
    setAiLoading(true);
    const updates = await updateStockPrices(stocks);
    if (updates.length > 0) {
      setStocks(prev => prev.map(s => {
        const update = updates.find(u => u.symbol === s.symbol);
        return update ? { ...s, ...update } : s;
      }));
    }
    setAiLoading(false);
  };

  // --- RENDER ---

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
          <div className="w-16 h-16 bg-brand-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white">
            <TrendingUp size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Personal Finance Pro</h1>
          <p className="text-slate-500 mb-8">您的智慧個人財務管家 (Firebase 雲端版)</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input name="username" type="text" placeholder="輸入您的名稱開始 (如: Alice)" className="input w-full" required />
            <button type="submit" className="btn-primary w-full py-3 text-lg">登入 / 註冊</button>
          </form>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
            {isFirebaseReady() ? 
              <><Cloud size={14} className="text-emerald-500"/> <span>雲端資料庫已連線</span></> : 
              <><CloudOff size={14} className="text-rose-400"/> <span>使用本地儲存模式 (未設定 API Key)</span></>
            }
          </div>
        </div>
      </div>
    );
  }

  const NavItem = ({ id, label, icon: Icon }: any) => (
    <button
      onClick={() => { setActiveTab(id); setIsMobileMenuOpen(false); }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        activeTab === id 
          ? 'bg-brand-50 text-brand-600 font-bold shadow-sm' 
          : 'text-slate-500 hover:bg-white hover:text-slate-700'
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* Sidebar (Desktop) */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-slate-200 fixed h-full z-10">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center text-white">
            <TrendingUp size={24} />
          </div>
          <h1 className="font-bold text-xl text-slate-800">Finance Pro</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <NavItem id="dashboard" label="總覽儀表板" icon={LayoutDashboard} />
          <NavItem id="accounts" label="銀行帳戶" icon={CreditCard} />
          <NavItem id="stocks" label="股市投資" icon={TrendingUp} />
          <NavItem id="transactions" label="收支紀錄" icon={FileText} />
        </nav>
        <div className="p-4 border-t border-slate-100">
           <div className="flex items-center gap-3 px-4 py-3 mb-2">
             <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
               <UserCircle size={20} />
             </div>
             <div className="flex-1 overflow-hidden">
               <p className="text-sm font-bold truncate">{user.username}</p>
               <div className="flex items-center gap-1 text-xs text-slate-400">
                 {isSyncing ? <Loader2 size={12} className="animate-spin" /> : <Cloud size={12} />}
                 {isSyncing ? "Syncing..." : "Cloud Sync"}
               </div>
             </div>
           </div>
           <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors text-sm font-medium">
             <LogOut size={18} /> 登出
           </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 w-full bg-white border-b border-slate-200 z-20 px-4 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white">
            <TrendingUp size={20} />
          </div>
          <span className="font-bold text-lg">Finance Pro</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="absolute right-0 top-0 h-full w-64 bg-white shadow-2xl p-4 flex flex-col" onClick={e => e.stopPropagation()}>
             <nav className="space-y-2 mt-12">
              <NavItem id="dashboard" label="總覽儀表板" icon={LayoutDashboard} />
              <NavItem id="accounts" label="銀行帳戶" icon={CreditCard} />
              <NavItem id="stocks" label="股市投資" icon={TrendingUp} />
              <NavItem id="transactions" label="收支紀錄" icon={FileText} />
             </nav>
             <div className="mt-auto pt-4 border-t border-slate-100">
               <button onClick={handleLogout} className="flex items-center gap-2 text-rose-500 w-full p-2">
                 <LogOut size={18} /> 登出
               </button>
             </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 p-4 lg:p-8 pt-20 lg:pt-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'dashboard' && <DashboardView accounts={accounts} stocks={stocks} transactions={transactions} advice={aiAdvice} />}
          {activeTab === 'accounts' && <AccountsView accounts={accounts} onAdd={addAccount} onEdit={editAccount} onDelete={deleteAccount} />}
          {activeTab === 'stocks' && <StocksView stocks={stocks} accounts={accounts} onTrade={handleStockTrade} onUpdatePrices={updatePrices} isLoading={aiLoading} />}
          {activeTab === 'transactions' && <TransactionsView transactions={transactions} accounts={accounts} onAdd={addTransaction} />}
        </div>
      </main>

      <style>{`
        .input {
          @apply w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all bg-slate-50 focus:bg-white;
        }
        .label {
          @apply block text-sm font-medium text-slate-700 mb-1;
        }
        .btn-primary {
          @apply px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg shadow-sm hover:shadow transition-all font-medium active:scale-95;
        }
        .btn-secondary {
          @apply px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg transition-all font-medium active:scale-95;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .animate-slide-down { animation: slide-down 0.2s ease-out; }
      `}</style>
    </div>
  );
};

export default App;