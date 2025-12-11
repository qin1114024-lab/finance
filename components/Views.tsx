import React, { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend 
} from 'recharts';
import { 
  Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, 
  Plus, Trash2, Edit2, RefreshCw, DollarSign, Activity, Info 
} from 'lucide-react';
import { Account, StockHolding, Transaction } from '../types';

// --- Colors & Helpers ---
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
const formatCurrency = (val: number) => new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0 }).format(val);

// --- DASHBOARD VIEW ---
interface DashboardProps {
  accounts: Account[];
  stocks: StockHolding[];
  transactions: Transaction[];
  advice: string;
}

export const DashboardView: React.FC<DashboardProps> = ({ accounts, stocks, transactions, advice }) => {
  const totalCash = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const stockValue = stocks.reduce((sum, s) => sum + (s.currentPrice * s.quantity), 0);
  const netWorth = totalCash + stockValue;

  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthTx = transactions.filter(t => t.date.startsWith(currentMonth));
  const income = monthTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expense = monthTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  // Chart Data Preparation
  const expenseByCategory = monthTx
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const pieData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* AI Advice Banner */}
      <div className="bg-gradient-to-r from-brand-600 to-indigo-600 rounded-xl p-4 text-white shadow-lg flex items-start gap-3">
        <Activity className="w-6 h-6 mt-1 flex-shrink-0" />
        <div>
          <h3 className="font-bold text-lg">AI 財務顧問</h3>
          <p className="opacity-90">{advice || "正在分析您的財務狀況..."}</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm font-medium">總資產淨值</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(netWorth)}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm font-medium">持有股票市值</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{formatCurrency(stockValue)}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm font-medium">本月收入</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">+{formatCurrency(income)}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm font-medium">本月支出</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">-{formatCurrency(expense)}</p>
        </div>
      </div>

      {/* Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">本月支出分佈</h3>
          {pieData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: number) => formatCurrency(val)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400">
              尚無支出資料
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">近期交易紀錄</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {monthTx.slice(0, 5).map(tx => (
              <div key={tx.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg transition-colors border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    {tx.type === 'income' ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{tx.category}</p>
                    <p className="text-xs text-slate-400">{tx.date}</p>
                  </div>
                </div>
                <span className={`font-semibold text-sm ${tx.type === 'income' ? 'text-emerald-600' : 'text-slate-800'}`}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                </span>
              </div>
            ))}
            {monthTx.length === 0 && <p className="text-center text-slate-400 py-8">本月尚無交易</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- ACCOUNTS VIEW ---
interface AccountsProps {
  accounts: Account[];
  onAdd: (acc: Omit<Account, 'id'>) => void;
  onEdit: (acc: Account) => void;
  onDelete: (id: string) => void;
}

export const AccountsView: React.FC<AccountsProps> = ({ accounts, onAdd, onEdit, onDelete }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Account, 'id'>>({ name: '', bankName: '', balance: 0, type: 'checking', currency: 'TWD' });

  const startEdit = (acc: Account) => {
    setEditingId(acc.id);
    setFormData(acc);
    setShowForm(true);
  };

  const startAdd = () => {
    setEditingId(null);
    setFormData({ name: '', bankName: '', balance: 0, type: 'checking', currency: 'TWD' });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onEdit({ ...formData, id: editingId });
    } else {
      onAdd(formData);
    }
    setShowForm(false);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">銀行帳戶管理</h2>
        <button onClick={startAdd} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> 新增帳戶
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 animate-slide-down">
          <h3 className="font-bold text-slate-800 mb-4">{editingId ? '編輯帳戶' : '新增帳戶'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">帳戶名稱</label>
              <input required className="input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="例如：薪資轉帳戶" />
            </div>
            <div>
              <label className="label">銀行名稱</label>
              <input required className="input" value={formData.bankName} onChange={e => setFormData({ ...formData, bankName: e.target.value })} placeholder="例如：中國信託" />
            </div>
            <div>
              <label className="label">目前餘額</label>
              <input required type="number" className="input" value={formData.balance} onChange={e => setFormData({ ...formData, balance: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label">類型</label>
              <select className="input" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as any })}>
                <option value="checking">活存 (Checking)</option>
                <option value="saving">定存 (Saving)</option>
                <option value="investment">證券戶 (Investment)</option>
                <option value="cash">現金 (Cash)</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">取消</button>
            <button type="submit" className="btn-primary">{editingId ? '更新' : '儲存'}</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map(acc => (
          <div key={acc.id} className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative group">
             <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => startEdit(acc)} className="text-slate-300 hover:text-brand-500">
                  <Edit2 size={18} />
                </button>
                <button onClick={() => onDelete(acc.id)} className="text-slate-300 hover:text-rose-500">
                  <Trash2 size={18} />
                </button>
             </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <Wallet size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">{acc.name}</h3>
                <p className="text-sm text-slate-500">{acc.bankName}</p>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xs text-slate-400 uppercase tracking-wider">Balance</p>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(acc.balance)}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between text-sm">
               <span className="text-slate-500">Type</span>
               <span className="capitalize font-medium text-slate-700">{acc.type}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- STOCKS VIEW ---
interface StocksProps {
  stocks: StockHolding[];
  accounts: Account[];
  onTrade: (action: 'buy' | 'sell', stockData: { symbol: string; name: string; quantity: number; price: number }, accountId: string) => void;
  onUpdatePrices: () => void;
  isLoading: boolean;
}

export const StocksView: React.FC<StocksProps> = ({ stocks, accounts, onTrade, onUpdatePrices, isLoading }) => {
  const [showForm, setShowForm] = useState(false);
  // Mode: 'buy' (new or add to existing) or 'sell' (reduce existing)
  const [tradeMode, setTradeMode] = useState<'buy' | 'sell'>('buy');
  const [selectedStock, setSelectedStock] = useState<StockHolding | null>(null);

  const [formData, setFormData] = useState({ symbol: '', name: '', quantity: 0, price: 0, accountId: '' });

  // Init form data when opening modal
  useEffect(() => {
    if (showForm) {
      if (tradeMode === 'sell' && selectedStock) {
        setFormData({
          symbol: selectedStock.symbol,
          name: selectedStock.name,
          quantity: 0,
          price: selectedStock.currentPrice, // Suggest current price
          accountId: accounts[0]?.id || ''
        });
      } else {
        // Buy mode
        setFormData({
            symbol: '',
            name: '',
            quantity: 0,
            price: 0,
            accountId: accounts[0]?.id || ''
        });
      }
    }
  }, [showForm, tradeMode, selectedStock, accounts]);

  const totalCost = stocks.reduce((sum, s) => sum + (s.averageCost * s.quantity), 0);
  const marketValue = stocks.reduce((sum, s) => sum + (s.currentPrice * s.quantity), 0);
  const totalPL = marketValue - totalCost;
  const plPercent = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;

  const handleOpenBuy = () => {
    setTradeMode('buy');
    setSelectedStock(null);
    setShowForm(true);
  };

  const handleOpenSell = (stock: StockHolding) => {
    setTradeMode('sell');
    setSelectedStock(stock);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.accountId) {
      alert("請選擇銀行帳戶");
      return;
    }
    
    onTrade(tradeMode, {
      symbol: formData.symbol.toUpperCase(),
      name: formData.name,
      quantity: formData.quantity,
      price: formData.price
    }, formData.accountId);

    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">股市資產管理</h2>
        <div className="flex gap-2">
          <button 
            onClick={onUpdatePrices} 
            disabled={isLoading}
            className="btn-secondary flex items-center gap-2 text-indigo-600 border-indigo-100 hover:bg-indigo-50"
          >
            <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
            {isLoading ? "AI 更新中..." : "AI 更新股價"}
          </button>
          <button onClick={handleOpenBuy} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> 新增持股/買入
          </button>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 text-white p-5 rounded-xl">
          <p className="opacity-70 text-sm">總投入成本</p>
          <p className="text-xl font-bold mt-1">{formatCurrency(totalCost)}</p>
        </div>
        <div className="bg-slate-800 text-white p-5 rounded-xl">
          <p className="opacity-70 text-sm">目前市值</p>
          <p className="text-xl font-bold mt-1">{formatCurrency(marketValue)}</p>
        </div>
        <div className={`p-5 rounded-xl border ${totalPL >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
          <p className="text-slate-500 text-sm">未實現損益</p>
          <div className="flex items-end gap-2 mt-1">
            <p className={`text-xl font-bold ${totalPL >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {totalPL > 0 ? '+' : ''}{formatCurrency(totalPL)}
            </p>
            <span className={`text-sm font-medium ${totalPL >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              ({plPercent.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 animate-slide-down relative z-10">
          <h3 className="font-bold mb-4 text-lg border-b pb-2">
             {tradeMode === 'buy' ? '買入股票 (扣除銀行餘額)' : '賣出股票 (存入銀行餘額)'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">股票代號</label>
              <input 
                required 
                className="input uppercase" 
                placeholder="如 2330.TW" 
                value={formData.symbol} 
                onChange={e => setFormData({ ...formData, symbol: e.target.value })}
                disabled={tradeMode === 'sell'} // Cannot change symbol when selling specific stock
              />
            </div>
            <div>
              <label className="label">股票名稱</label>
              <input 
                required 
                className="input" 
                placeholder="如 台積電" 
                value={formData.name} 
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                disabled={tradeMode === 'sell'}
              />
            </div>
            <div>
              <label className="label">交易股數</label>
              <input required type="number" min="1" className="input" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })} />
              {tradeMode === 'sell' && selectedStock && (
                  <p className="text-xs text-slate-500 mt-1">目前持有: {selectedStock.quantity} 股</p>
              )}
            </div>
            <div>
              <label className="label">{tradeMode === 'buy' ? '買入單價' : '賣出單價'}</label> 
              <input required type="number" className="input" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} />
            </div>
            <div className="md:col-span-2">
                <label className="label">{tradeMode === 'buy' ? '扣款帳戶' : '入帳帳戶'}</label>
                <select required className="input" value={formData.accountId} onChange={e => setFormData({ ...formData, accountId: e.target.value })}>
                    <option value="" disabled>請選擇帳戶</option>
                    {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name} (餘額: {formatCurrency(acc.balance)})</option>
                    ))}
                </select>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">取消</button>
            <button type="submit" className={`btn-primary ${tradeMode === 'sell' ? 'bg-rose-600 hover:bg-rose-700' : ''}`}>
                {tradeMode === 'buy' ? '確認買入' : '確認賣出'}
            </button>
          </div>
        </form>
      )}

      {/* Stock Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {stocks.length === 0 ? (
          // st.info style alert
          <div className="p-4 m-6 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3 text-blue-800">
             <Info className="flex-shrink-0 w-5 h-5 mt-0.5" />
             <div>
                <p className="font-medium">目前無持股資料</p>
                <p className="text-sm opacity-80 mt-1">您可以點擊右上角的「新增持股/買入」按鈕來建立您的投資組合。</p>
             </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">代號 / 名稱</th>
                  <th className="p-4 font-semibold text-right">持有股數</th>
                  <th className="p-4 font-semibold text-right">平均成本</th>
                  <th className="p-4 font-semibold text-right">現價 (AI)</th>
                  <th className="p-4 font-semibold text-right">市值</th>
                  <th className="p-4 font-semibold text-right">損益</th>
                  <th className="p-4 font-semibold text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {stocks.map(stock => {
                  const val = stock.currentPrice * stock.quantity;
                  const pl = val - (stock.averageCost * stock.quantity);
                  const isUp = pl >= 0;
                  return (
                    <tr key={stock.symbol} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{stock.symbol}</div>
                        <div className="text-xs text-slate-500">{stock.name}</div>
                      </td>
                      <td className="p-4 text-right font-medium">{stock.quantity}</td>
                      <td className="p-4 text-right text-slate-600">{formatCurrency(stock.averageCost)}</td>
                      <td className="p-4 text-right font-bold text-indigo-600">{formatCurrency(stock.currentPrice)}</td>
                      <td className="p-4 text-right text-slate-800">{formatCurrency(val)}</td>
                      <td className={`p-4 text-right font-bold ${isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatCurrency(pl)}
                      </td>
                      <td className="p-4 text-right">
                          <button 
                            onClick={() => handleOpenSell(stock)}
                            className="text-xs bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 px-3 py-1 rounded transition-colors"
                          >
                            賣出
                          </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// --- TRANSACTIONS VIEW ---
interface TransactionsProps {
  transactions: Transaction[];
  accounts: Account[];
  onAdd: (t: Omit<Transaction, 'id'>) => void;
}

export const TransactionsView: React.FC<TransactionsProps> = ({ transactions, accounts, onAdd }) => {
  const [showForm, setShowForm] = useState(false);
  const [newTx, setNewTx] = useState<Partial<Transaction>>({
    type: 'expense',
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    category: '飲食',
    accountId: accounts[0]?.id || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTx.amount || !newTx.accountId) return;
    onAdd(newTx as Omit<Transaction, 'id'>);
    setShowForm(false);
    setNewTx({ ...newTx, amount: 0, note: '' });
  };

  const categories = ['飲食', '交通', '薪資', '娛樂', '居住', '投資', '其他'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">財務紀錄明細</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Edit2 size={18} /> 記帳
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 animate-slide-down">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
              <label className="label">收支類型</label>
              <div className="flex gap-2">
                <button type="button" 
                  onClick={() => setNewTx({...newTx, type: 'expense'})}
                  className={`flex-1 py-2 rounded-lg border font-medium transition-colors ${newTx.type === 'expense' ? 'bg-rose-50 border-rose-200 text-rose-600' : 'border-slate-200 text-slate-500'}`}>
                  支出
                </button>
                <button type="button" 
                  onClick={() => setNewTx({...newTx, type: 'income'})}
                  className={`flex-1 py-2 rounded-lg border font-medium transition-colors ${newTx.type === 'income' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'border-slate-200 text-slate-500'}`}>
                  收入
                </button>
              </div>
            </div>
            <div>
              <label className="label">帳戶</label>
              <select className="input" value={newTx.accountId} onChange={e => setNewTx({...newTx, accountId: e.target.value})}>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.balance)})</option>)}
              </select>
            </div>
            <div>
              <label className="label">金額</label>
              <input type="number" required className="input" value={newTx.amount || ''} onChange={e => setNewTx({...newTx, amount: Number(e.target.value)})} />
            </div>
            <div>
              <label className="label">日期</label>
              <input type="date" required className="input" value={newTx.date} onChange={e => setNewTx({...newTx, date: e.target.value})} />
            </div>
            <div>
              <label className="label">分類</label>
              <select className="input" value={newTx.category} onChange={e => setNewTx({...newTx, category: e.target.value})}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">備註</label>
              <input type="text" className="input" value={newTx.note || ''} onChange={e => setNewTx({...newTx, note: e.target.value})} />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">取消</button>
            <button type="submit" className="btn-primary">新增紀錄</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
              <th className="p-4">日期</th>
              <th className="p-4">分類</th>
              <th className="p-4">帳戶</th>
              <th className="p-4">備註</th>
              <th className="p-4 text-right">金額</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {transactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(tx => {
               const accName = accounts.find(a => a.id === tx.accountId)?.name || 'Unknown';
               return (
                <tr key={tx.id} className="hover:bg-slate-50">
                  <td className="p-4 text-slate-600">{tx.date}</td>
                  <td className="p-4">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${tx.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {tx.category}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600">{accName}</td>
                  <td className="p-4 text-slate-500">{tx.note || '-'}</td>
                  <td className={`p-4 text-right font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </td>
                </tr>
               );
            })}
          </tbody>
        </table>
        {transactions.length === 0 && <div className="p-8 text-center text-slate-400">尚無交易紀錄</div>}
      </div>
    </div>
  );
};