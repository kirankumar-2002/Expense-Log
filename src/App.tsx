/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, ReactNode } from 'react';
import { Transaction, Outstanding, PageView, Account } from './types';
import { fetchTransactions, fetchOutstanding, saveTransaction, fetchAccounts } from './api';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement 
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, isValid } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  LayoutDashboard, 
  ArrowRightLeft, 
  Clock, 
  BarChart3, 
  WalletCards, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Landmark,
  CreditCard,
  Search,
  Filter,
  X,
  RefreshCcw,
  Menu,
  History,
  Edit3,
  Trash2
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CATEGORY_MAP_T: Record<string, string[]> = {
  'Income': ['Salary', 'Interest #1 - Murali', 'WIFI Allowance'],
  'Credit': ['HDFC Money Back Plus'],
  'Bills': ['Sim Recharge', 'House Rent', 'Washing Machine', 'Wi-Fi', 'Gas', 'Water', 'Electricity'],
  'Expenses': ['Room Expenditure', 'My Expenditure', 'Group Expenditure', 'Shopping', 'Travel', 'Entertainment', 'Medical', 'Utilities', 'Payment']
};

const ACCOUNTS_LIST = [
  'Canara Bank',
  'Bank of Baroda',
  'KOTAK Mahindra Bank',
  'HDFC Bank',
  'State Bank of India',
  'Cash',
  'HDFC Money Back Plus'
];

const CATEGORY_MAP_O: Record<string, string[]> = {
  'Expenses': CATEGORY_MAP_T['Expenses'],
  'Credit': ['HDFC Money Back Plus'],
  'Bills': ['Sim Recharge', 'House Rent', 'Washing Machine', 'Wi-Fi', 'Gas', 'Water', 'Electricity'],
  'Income': ['Salary', 'Interest #1 - Murali', 'WIFI Allowance']
};

const fmt = (n: number) => '₹' + Math.round(n || 0).toLocaleString('en-IN');
const fmtDate = (d: string) => {
  try {
    if (!d) return '';
    const dt = parseISO(d);
    return isValid(dt) ? format(dt, 'dd MMM yyyy') : d;
  } catch (e) {
    return d || '';
  }
};

type SortConfig = { key: string; direction: 'asc' | 'desc' };

export default function App() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activePage, setActivePage] = useState<PageView>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [outstanding, setOutstanding] = useState<Outstanding[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [showModal, setShowModal] = useState<'transaction' | 'outstanding' | 'account' | 'account-history' | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [historyMonth, setHistoryMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  
  // Sort state
  const [txSort, setTxSort] = useState<SortConfig>({ key: 'Date', direction: 'desc' });
  const [outSort, setOutSort] = useState<SortConfig>({ key: 'Date', direction: 'desc' });

  // Form state
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    amount: '0',
    category: 'Expenses',
    subCategory: '',
    desc: '',
    notes: '',
    account: ACCOUNTS_LIST[0],
    state: 'Payable',
    status: 'Pending',
    // Account specific
    name: '',
    bank: '',
    type: 'Current' as 'Current' | 'Savings' | 'Credit',
    balance: '',
    standardBalance: '',
    month: format(new Date(), 'yyyy-MM')
  });

  const [showSearch, setShowSearch] = useState(false);
  const [lastEnteredTxDate, setLastEnteredTxDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [showFilters, setShowFilters] = useState(false);
  const [showOutSearch, setShowOutSearch] = useState(false);
  const [showOutFilters, setShowOutFilters] = useState(false);
  const [isEditingAccounts, setIsEditingAccounts] = useState(false);
  const [isEditingTransactions, setIsEditingTransactions] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [isEditingOutstanding, setIsEditingOutstanding] = useState(false);
  const [selectedOutstanding, setSelectedOutstanding] = useState<Set<string>>(new Set());
  
  // Filter state
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterSubCat, setFilterSubCat] = useState('');
  const [filterAcc, setFilterAcc] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());

  const [outSearch, setOutSearch] = useState('');
  const [outFilterState, setOutFilterState] = useState('');
  const [outFilterMonth, setOutFilterMonth] = useState('');
  
  const [filterState, setFilterState] = useState('Payable');

  // Handle category change to reset subcategory and set defaults
  useEffect(() => {
    if (showModal === 'transaction') {
      const allowed = CATEGORY_MAP_T[formData.category] || [];
      const updates: any = {};
      
      if (!allowed.includes(formData.subCategory)) {
        updates.subCategory = allowed[0] || '';
      }
      
      if (formData.category === 'Income' && !editId) {
        updates.account = 'HDFC Bank';
      }
      
      if (Object.keys(updates).length > 0) {
        setFormData(prev => ({ ...prev, ...updates }));
      }
    } else if (showModal === 'outstanding') {
      const allowed = CATEGORY_MAP_O[formData.category] || [];
      if (!allowed.includes(formData.subCategory)) {
        if (formData.category === 'Expenses' && allowed.includes('Payment')) {
          setFormData(prev => ({ ...prev, subCategory: 'Payment' }));
        } else {
          setFormData(prev => ({ ...prev, subCategory: allowed[0] || '' }));
        }
      }
    }
  }, [formData.category, showModal]);

  useEffect(() => {
    if (formData.subCategory === 'HDFC Money Back Plus') {
      setFormData(prev => ({ ...prev, account: 'HDFC Money Back Plus' }));
    }
  }, [formData.subCategory]);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setSyncing(true);
    try {
      const [txData, outData, accData] = await Promise.all([
        fetchTransactions(),
        fetchOutstanding(),
        fetchAccounts().catch(() => []) // Handle missing sheet gracefully
      ]);
      
      const mapFinancialRecord = (r: any) => {
        const getVal = (match: string) => {
          const key = Object.keys(r).find(k => k.toLowerCase().trim() === match.toLowerCase());
          return key ? r[key] : undefined;
        };
        const rawState = String(getVal('State') || '').trim();
        const rawStatus = String(getVal('Status') || '').trim();

        return {
          ID: String(getVal('ID') || r.ID || ''),
          Date: getVal('Date') ? String(getVal('Date')).slice(0, 10) : (r.Date ? String(r.Date).slice(0, 10) : ''),
          Amount: typeof r.Amount === 'number' ? r.Amount : parseFloat(String(getVal('Amount') || r.Amount || '0').replace(/[^\d.-]/g, '')) || 0,
          State: rawState || 'Payable',
          Category: getVal('Category') || r.Category || '',
          'Sub-Category': getVal('Sub-Category') || r['Sub-Category'] || '',
          Status: rawStatus || 'Pending',
          Desc: getVal('Desc') || r.Desc || '',
          Notes: getVal('Notes') || r.Notes || '',
          Accounts: getVal('Accounts') || getVal('Account') || r.Account || r.Accounts || ''
        };
      };

      const cleanTx = (txData || []).map(mapFinancialRecord).filter((r: any) => r.ID || r.Date);
      const cleanOut = (outData || []).map(mapFinancialRecord).filter((r: any) => r.ID || r.Date);

      setTransactions(cleanTx);
      setOutstanding(cleanOut);
      setAccounts(accData || []);
      setSyncing(false);
    } catch (e) {
      console.error(e);
      showToast('Connection failed.', 'error');
      setSyncing(false);
    } finally {
      setLoading(false);
    }
  };

  const getAccountForCategory = (category: string) => {
    const catLower = (category || '').trim().toLowerCase();
    if (catLower.includes('income')) return 'HDFC Bank';
    if (catLower.includes('credit')) return 'HDFC Money Back Plus';
    if (catLower.includes('expense') || catLower.includes('bill')) return 'Bank of Baroda';
    return 'Bank of Baroda';
  };

  const moveRowBetweenSheets = async (item: FinancialRecord, from: 'Transactions' | 'Outstanding', to: 'Transactions' | 'Outstanding', newStatus: 'Pending' | 'Processed') => {
    const account = item.Accounts || getAccountForCategory(item.Category);

    const addRes = await saveTransaction({
      action: 'add',
      sheet: to,
      // Provide an empty ID for new inserts to trigger clean generation 
      // and avoid update conflicts.
      id: '',
      ID: '',
      date: item.Date,
      Date: item.Date,
      amount: item.Amount,
      Amount: item.Amount,
      state: item.State,
      State: item.State,
      category: item.Category,
      Category: item.Category,
      subCategory: item['Sub-Category'],
      'Sub-Category': item['Sub-Category'],
      status: newStatus,
      Status: newStatus,
      desc: item.Desc,
      Desc: item.Desc,
      notes: item.Notes,
      Notes: item.Notes,
      account: account,
      accounts: account,
      Account: account,
      Accounts: account
    });

    if (addRes.status === 'ok') {
      await saveTransaction({
        action: 'delete',
        id: String(item.ID),
        sheet: from
      });
    }
    return addRes;
  };

  const [isDeleting, setIsDeleting] = useState<{ type: 'Transactions' | 'Outstanding' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSort = (type: 'tx' | 'out', key: string) => {
    const current = type === 'tx' ? txSort : outSort;
    const setter = type === 'tx' ? setTxSort : setOutSort;
    const direction = current.key === key && current.direction === 'desc' ? 'asc' : 'desc';
    setter({ key, direction });
  };

  const sortData = (data: any[], config: SortConfig) => {
    return [...data].sort((a, b) => {
      const v1 = a[config.key];
      const v2 = b[config.key];
      const factor = config.direction === 'asc' ? 1 : -1;
      if (typeof v1 === 'number' && typeof v2 === 'number') return (v1 - v2) * factor;
      return String(v1).localeCompare(String(v2)) * factor;
    });
  };

  // DASHBOARD CALCULATIONS (CURRENT MONTH)
  const dashboardStats = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);

    const t = { Income: 0, Expenses: 0, Credit: 0, Bills: 0 };
    const c = { Income: 0, Expenses: 0, Credit: 0, Bills: 0 };

    transactions.forEach(r => {
      if (r.Date) {
        const rDate = parseISO(r.Date);
        if (isValid(rDate) && isWithinInterval(rDate, { start, end })) {
          if (t[r.Category] !== undefined) {
            t[r.Category] += r.Amount;
            c[r.Category]++;
          }
        }
      }
    });

    return { t, c, monthLabel: format(now, 'MMMM yyyy') };
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    const filtered = transactions.filter(r => {
      if (filterCat && r.Category !== filterCat) return false;
      if (filterSubCat && r['Sub-Category'] !== filterSubCat) return false;
      if (filterAcc && r.Account !== filterAcc) return false;
      if (filterMonth && !r.Date.startsWith(filterMonth)) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          (r.Notes || '').toLowerCase().includes(s) ||
          (r['Sub-Category'] || '').toLowerCase().includes(s) ||
          (r.Category || '').toLowerCase().includes(s)
        );
      }
      return true;
    });
    return sortData(filtered, txSort);
  }, [transactions, search, filterCat, filterMonth, txSort]);

  const filteredOutstanding = useMemo(() => {
    const filtered = outstanding.filter(r => {
      if (outFilterState && r.State !== outFilterState) return false;
      if (outFilterMonth && !r.Date.startsWith(outFilterMonth)) return false;
      if (outSearch) {
        const s = outSearch.toLowerCase();
        const anyR = r as any;
        return (
          (anyR.Desc || '').toLowerCase().includes(s) ||
          (anyR['Sub-Category'] || '').toLowerCase().includes(s) ||
          (r.Category || '').toLowerCase().includes(s)
        );
      }
      return true;
    });
    return sortData(filtered, outSort);
  }, [outstanding, outSearch, outFilterState, outFilterMonth, outSort]);

  const months = useMemo(() => {
    const set = new Set(transactions.map(r => r.Date.slice(0, 7)).filter(Boolean));
    return Array.from(set).sort().reverse();
  }, [transactions]);

  const past10Months = useMemo(() => {
    const list = [];
    const now = new Date();
    for (let i = 0; i < 10; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = format(d, 'yyyy-MM');
      const label = format(d, 'MMM yyyy');
      list.push({ value: val, label });
    }
    return list;
  }, []);

  const handleSave = async (entryType: 'transaction' | 'outstanding' | 'account') => {
    setSyncing(true);
    try {
      let payload: any = { action: editId ? 'update' : 'add', id: editId };
      
      if (entryType === 'account') {
        payload = { ...payload, sheet: 'Accounts', name: formData.name, bank: formData.bank, type: formData.type, balance: parseFloat(formData.balance) || 0, standardBalance: parseFloat(formData.standardBalance) || 0, Month: formData.month };
      } else {
        const fullRecord: FinancialRecord = {
          ID: editId || '',
          Date: formData.date,
          Amount: parseFloat(formData.amount) || 0,
          State: formData.state || 'Payable',
          Category: formData.category,
          'Sub-Category': formData.subCategory,
          Status: formData.status || (entryType === 'transaction' ? 'Processed' : 'Pending'),
          Desc: formData.desc || '',
          Notes: formData.notes || '',
          Accounts: formData.account || 'Bank of Baroda'
        };

        const currentSheet = entryType === 'transaction' ? 'Transactions' : 'Outstanding';
        let targetSheet = currentSheet;

        if (fullRecord.Status === 'Processed') targetSheet = 'Transactions';
        if (fullRecord.Status === 'Pending') targetSheet = 'Outstanding';

        if (editId && currentSheet !== targetSheet) {
          const res = await moveRowBetweenSheets(fullRecord, currentSheet as any, targetSheet as any, fullRecord.Status as any);
          if (res.status === 'ok') {
            if (entryType === 'transaction') setLastEnteredTxDate(formData.date);
            showToast(`Moved to ${targetSheet}`);
            setShowModal(null);
            setEditId(null);
            loadAllData();
          } else throw new Error();
          setSyncing(false);
          return;
        }

        payload = { 
          action: editId ? 'update' : 'add', 
          id: editId,
          ID: editId,
          sheet: targetSheet,
          date: fullRecord.Date, 
          Date: fullRecord.Date,
          amount: fullRecord.Amount, 
          Amount: fullRecord.Amount,
          state: fullRecord.State,
          State: fullRecord.State,
          category: fullRecord.Category, 
          Category: fullRecord.Category,
          subCategory: fullRecord['Sub-Category'],
          'Sub-Category': fullRecord['Sub-Category'],
          status: fullRecord.Status,
          Status: fullRecord.Status,
          desc: fullRecord.Desc,
          Desc: fullRecord.Desc,
          notes: fullRecord.Notes,
          Notes: fullRecord.Notes,
          account: fullRecord.Accounts,
          accounts: fullRecord.Accounts,
          Account: fullRecord.Accounts,
          Accounts: fullRecord.Accounts
        };
      }

      const res = await saveTransaction(payload);
      if (res.status === 'ok') {
        if (entryType === 'transaction') setLastEnteredTxDate(formData.date);
        showToast('Saved successfully');
        setShowModal(null);
        setEditId(null);
        loadAllData();
      } else throw new Error();
    } catch (e) {
      showToast('Save failed', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleBulkStatusUpdate = async (type: 'Transactions' | 'Outstanding', newStatus: 'Pending' | 'Processed') => {
    const selected = type === 'Transactions' ? selectedTransactions : selectedOutstanding;
    if (selected.size === 0) return;
    
    setSyncing(true);
    try {
      for (const id of Array.from(selected)) {
        if (!id) continue;
        
        const sourceData = type === 'Transactions' ? transactions : outstanding;
        const item = sourceData.find(o => String(o.ID) === String(id));
        
        if (item) {
          const targetSheet = newStatus === 'Processed' ? 'Transactions' : 'Outstanding';
          if (type !== targetSheet) {
            await moveRowBetweenSheets(item, type, targetSheet as any, newStatus);
          } else {
            const res = await saveTransaction({ 
              action: 'update', 
              id: String(id), 
              sheet: type,
              status: newStatus 
            });
            if (res.status !== 'ok') throw new Error(`Failed to update ${id}`);
          }
        }
      }
      showToast(newStatus === 'Processed' && type === 'Outstanding' ? `Moved ${selected.size} entries to Transactions` :
                newStatus === 'Pending' && type === 'Transactions' ? `Moved ${selected.size} entries to Outstanding` :
                `Updated ${selected.size} entries to ${newStatus}`);
      if (type === 'Transactions') {
        setIsEditingTransactions(false);
        setSelectedTransactions(new Set());
      } else {
        setIsEditingOutstanding(false);
        setSelectedOutstanding(new Set());
      }
      loadAllData();
    } catch (e) {
      console.error(e);
      showToast('Update failed', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleBulkDelete = async (type: 'Transactions' | 'Outstanding') => {
    const selected = type === 'Transactions' ? selectedTransactions : selectedOutstanding;
    if (selected.size === 0) return;
    setIsDeleting({ type });
  };

  const performBulkDelete = async () => {
    if (!isDeleting) return;
    const type = isDeleting.type;
    const selected = type === 'Transactions' ? selectedTransactions : selectedOutstanding;
    
    setSyncing(true);
    setIsDeleting(null);
    try {
      for (const id of Array.from(selected)) {
        if (!id) continue;
        const res = await saveTransaction({ action: 'delete', id: String(id), sheet: type });
        if (res.status !== 'ok') throw new Error(`Failed to delete ${id}`);
      }
      showToast(`Deleted ${selected.size} entries`);
      if (type === 'Transactions') {
        setIsEditingTransactions(false);
        setSelectedTransactions(new Set());
      } else {
        setIsEditingOutstanding(false);
        setSelectedOutstanding(new Set());
      }
      loadAllData();
    } catch (e) {
      console.error(e);
      showToast('Delete failed', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const trendData = useMemo(() => {
    const chartMonths = months.slice(0, 6).reverse();
    const data = chartMonths.map(m => {
      return transactions
        .filter(r => r.Date.startsWith(m) && r.Category === 'Expenses')
        .reduce((sum, r) => sum + r.Amount, 0);
    });
    return {
      labels: chartMonths.map(m => {
        const dt = parseISO(m + '-01');
        return isValid(dt) ? format(dt, 'MMM yy') : m;
      }),
      datasets: [{
        label: 'Expenses',
        data,
        borderColor: '#c84b2f',
        backgroundColor: 'rgba(200,75,47,0.07)',
        fill: true,
        tension: 0.4
      }]
    };
  }, [transactions, months]);

  const donutData = useMemo(() => {
    return {
      labels: ['Income', 'Expenses', 'Credit', 'Bills'],
      datasets: [{
        data: [dashboardStats.t.Income, dashboardStats.t.Expenses, dashboardStats.t.Credit, dashboardStats.t.Bills],
        backgroundColor: ['#2d5a3d', '#c84b2f', '#2563eb', '#b8952a'],
        borderWidth: 0
      }]
    };
  }, [dashboardStats]);

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-title">Expense<span>Log</span></div>
        <div className="loading-bar-wrap"><div className="loading-bar"></div></div>
        <div className="loading-sub">Connecting to Google Sheets...</div>
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#000000] z-[80] flex items-center px-4 justify-between border-b border-white/10 shadow-lg">
        <div className="flex items-center gap-2">
          <button 
            className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          <h1 className="text-[#ffffff] font-extrabold text-lg tracking-tight">Expense<span className="text-[#c84b2f]">Log</span></h1>
        </div>
        <div className="flex items-center">
          {/* Live status moved to sidebar */}
        </div>
      </header>

      {/* Sidebar Overlay */}
      <div 
        className={cn("sidebar-overlay", mobileSidebarOpen && "open")} 
        onClick={() => setMobileSidebarOpen(false)}
      />

      {/* Custom Confirmation Modal */}
      <div className={cn("modal-overlay flex items-center justify-center p-4", isDeleting && "open")}>
        <div className="modal-content max-w-[400px] w-full p-6 animate-in fade-in zoom-in duration-200">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-bold mb-2 text-text">Confirm Delete</h3>
            <p className="text-muted text-sm mb-6">
              Are you sure you want to delete these {isDeleting?.type === 'Transactions' ? selectedTransactions.size : selectedOutstanding.size} entries? 
              This action cannot be undone.
            </p>
            <div className="flex gap-3 w-full">
              <button 
                className="flex-1 btn btn-ghost h-11 font-semibold"
                onClick={() => setIsDeleting(null)}
              >
                Cancel
              </button>
              <button 
                className="flex-1 btn flex items-center justify-center bg-red-600 hover:bg-red-700 text-white h-11 font-bold shadow-sm rounded-xl"
                onClick={performBulkDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={cn("sidebar", sidebarCollapsed && "collapsed", mobileSidebarOpen && "open")}>
        <div className="md:flex hidden px-6 py-8 items-center justify-center border-b border-white/5">
          <h1 className={cn("font-extrabold transition-all duration-300", sidebarCollapsed ? "text-sm" : "text-xl")}>
            <span className="text-[#ffffff]">{sidebarCollapsed ? "E" : "Expense"}</span>
            <span className="text-[#c84b2f]">{sidebarCollapsed ? "L" : "Log"}</span>
          </h1>
        </div>
        <nav className="nav-container">
          <NavItem 
            active={activePage === 'dashboard'} 
            onClick={() => { setActivePage('dashboard'); setMobileSidebarOpen(false); }} 
            icon={<LayoutDashboard size={18} />}
            label="Dashboard" 
            collapsed={sidebarCollapsed && !mobileSidebarOpen}
          />
          <NavItem 
            active={activePage === 'transactions'} 
            onClick={() => { setActivePage('transactions'); setMobileSidebarOpen(false); }} 
            icon={<ArrowRightLeft size={18} />}
            label="Transactions" 
            collapsed={sidebarCollapsed && !mobileSidebarOpen}
          />
          <NavItem 
            active={activePage === 'outstanding'} 
            onClick={() => { setActivePage('outstanding'); setMobileSidebarOpen(false); }} 
            icon={<Clock size={18} />}
            label="Outstanding" 
            collapsed={sidebarCollapsed && !mobileSidebarOpen}
          />
          <NavItem 
            active={activePage === 'timeline'} 
            onClick={() => { setActivePage('timeline'); setMobileSidebarOpen(false); }} 
            icon={<BarChart3 size={18} />}
            label="Monthly" 
            collapsed={sidebarCollapsed && !mobileSidebarOpen}
          />
          <NavItem 
            active={activePage === 'accounts'} 
            onClick={() => { setActivePage('accounts'); setMobileSidebarOpen(false); }} 
            icon={<Landmark size={18} />}
            label="Accounts" 
            collapsed={sidebarCollapsed && !mobileSidebarOpen}
          />
        </nav>
        
        <button className="sidebar-toggle" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
          {sidebarCollapsed ? <ChevronRight size={18} /> : <div className="flex items-center gap-3"><ChevronLeft size={18} /><span className="nav-label">Collapse Sidebar</span></div>}
        </button>

        <div className="sidebar-footer">
          {/* Live status hidden */}
        </div>
      </aside>

      <main className="main-content flex flex-col items-center">
        <div className="w-full max-w-5xl px-4 md:px-8">
        
        {/* Dashboard */}
        <section className={cn("page-container", activePage === 'dashboard' && "active")}>
          <div className="page-header flex-row items-center justify-between gap-4">
            <div className="flex-1">
              <div className="page-title">Current Month<span>.</span></div>
              <div className="page-sub">{dashboardStats.monthLabel} activity summary</div>
            </div>
            <button 
              className="hidden md:flex btn btn-primary btn-sm md:btn-md items-center justify-center min-w-[36px] px-2 md:px-4 gap-2" 
              onClick={() => { 
                setEditId(null); 
                setFormData({
                  date: lastEnteredTxDate,
                  amount: '0',
                  category: 'Expenses',
                  subCategory: CATEGORY_MAP_T['Expenses'][0],
                  desc: '',
                  notes: '',
                  account: ACCOUNTS_LIST[0],
                  state: 'Payable',
                  status: 'Pending',
                  name: '', bank: '', type: 'Bank', balance: ''
                });
                setShowModal('transaction'); 
              }}
              title="Add Entry"
            >
              <Plus size={18} />
              <span className="hidden md:inline">Add Entry</span>
            </button>
          </div>

          <div className="stats-grid">
            <StatCard type="income" label="Income" value={dashboardStats.t.Income} count={dashboardStats.c.Income} trend="up" />
            <StatCard type="expense" label="Expenses" value={dashboardStats.t.Expenses} count={dashboardStats.c.Expenses} trend="down" />
            <StatCard type="credit" label="Credit" value={dashboardStats.t.Credit} count={dashboardStats.c.Credit} trend="up" />
            <StatCard type="bills" label="Bills" value={dashboardStats.t.Bills} count={dashboardStats.c.Bills} trend="down" />
          </div>

          <div className="charts-row">
            <div className="chart-card">
              <div className="chart-header-title">Last 6 Months Trend</div>
              <div className="chart-container-wrap">
                <Line data={trendData} options={chartOptions} />
              </div>
            </div>
            <div className="chart-card">
              <div className="chart-header-title">{dashboardStats.monthLabel} Breakdown</div>
              <div className="chart-container-wrap">
                <Doughnut data={donutData} options={donutOptions} />
              </div>
            </div>
          </div>
        </section>

        {/* Transactions */}
        <section className={cn("page-container", activePage === 'transactions' && "active")}>
          <div className="page-header !flex !flex-col gap-4">
            <div className="flex flex-row items-center justify-between gap-4 w-full">
              <div className="flex-1">
                <div className="page-title">Transactions<span>.</span></div>
                <div className="page-sub">{filteredTransactions.length} entries found</div>
              </div>
              
              <div className="flex gap-1 items-center">
                {/* Desktop Only Add Entry */}
                <button 
                  className="hidden md:flex btn btn-primary btn-sm items-center justify-center min-w-[36px] px-3 h-9" 
                  onClick={() => { 
                    setEditId(null); 
                    setFormData({
                      date: lastEnteredTxDate,
                      amount: '0',
                      category: 'Expenses',
                      subCategory: CATEGORY_MAP_T['Expenses'][0],
                      desc: '',
                      notes: '',
                      account: ACCOUNTS_LIST[0],
                      state: 'Payable',
                      status: 'Pending',
                      name: '', bank: '', type: 'Bank', balance: ''
                    });
                    setShowModal('transaction'); 
                  }}
                  title="Add Entry"
                >
                  <Plus size={16} />
                  <span className="hidden md:inline ml-1">Add Entry</span>
                </button>

                <button
                  className={cn("flex btn btn-sm items-center justify-center min-w-[36px] w-9 md:w-auto p-0 md:px-4 h-9 rounded-xl shadow-sm transition-all focus:outline-none flex-shrink-0", isEditingTransactions ? "bg-accent/10 text-accent border border-accent/20" : "bg-[#c84b2f] hover:brightness-110 text-white border-0")}
                  onClick={() => {
                    setIsEditingTransactions(!isEditingTransactions);
                    if (!isEditingTransactions) setSelectedTransactions(new Set());
                  }}
                  title={isEditingTransactions ? "Done Editing" : "Edit Transactions"}
                >
                  {isEditingTransactions ? <><span className="hidden md:inline font-semibold">Done</span><span className="md:hidden"><X size={16} /></span></> : <><Edit3 size={16} className="md:hidden flex-shrink-0" /><span className="hidden md:inline font-semibold">Edit</span></>}
                </button>

                <button 
                  className={cn("btn btn-ghost btn-sm flex items-center justify-center min-w-[36px] px-2 md:px-3 h-9", (showFilters || showSearch) && "bg-accent/10 text-accent")} 
                  onClick={() => {
                    setShowFilters(!showFilters);
                    setShowSearch(!showFilters);
                  }}
                  title="Filter & Search"
                >
                  <Filter size={16} />
                  <span className="hidden md:inline ml-1">Filter</span>
                </button>
              </div>
            </div>

            {isEditingTransactions && (
              <div className="w-full flex items-center justify-center gap-2 p-2 bg-surface/50 rounded-xl md:bg-transparent md:p-0 animate-in fade-in slide-in-from-top-2">
                <button 
                  className="flex-1 btn btn-sm bg-yellow-500 hover:bg-yellow-600 text-white h-9 font-bold rounded-xl border-0 shadow-sm"
                  onClick={() => handleBulkStatusUpdate('Transactions', 'Pending')}
                  disabled={selectedTransactions.size === 0 || syncing}
                >
                  Pending
                </button>
                <button 
                  className="flex-1 btn btn-sm bg-red-600 hover:bg-red-700 text-white h-9 font-bold rounded-xl border-0 shadow-sm"
                  onClick={() => handleBulkDelete('Transactions')}
                  disabled={selectedTransactions.size === 0 || syncing}
                >
                  Delete
                </button>
                <button 
                  className="flex-1 btn btn-sm btn-ghost text-muted h-9 font-semibold rounded-xl hover:bg-surface/50"
                  onClick={() => {
                    setIsEditingTransactions(false);
                    setSelectedTransactions(new Set());
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
          <div className="table-card overflow-hidden">
             {(showSearch || showFilters) && (
               <div id="transaction-toolbar" className="table-toolbar flex flex-col gap-2 p-3 md:p-4 border-b border-border/40 bg-surface/30">
                {(showSearch || (showFilters && window.innerWidth < 768)) && (
                  <div className="relative w-full transition-all">
                    <input 
                      id="transaction-search-input"
                      className="search-box w-full px-4 h-9" 
                      type="text" 
                      placeholder="Search transactions..." 
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      autoFocus
                    />
                    {search && (
                      <button 
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text p-1"
                        onClick={() => setSearch('')}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                )}
                {showFilters && (
                  <div id="transaction-filters" className="flex flex-wrap gap-2 w-full animate-in fade-in slide-in-from-top-1">
                    <select id="filter-category" className="filter-select flex-1 h-9 min-w-[120px]" value={filterCat} onChange={e => { setFilterCat(e.target.value); setFilterSubCat(''); }}>
                      <option value="">Categories</option>
                      <option>Income</option><option>Expenses</option><option>Credit</option><option>Bills</option>
                    </select>
                    <select id="filter-subcategory" className="filter-select flex-1 h-9 min-w-[120px]" value={filterSubCat} onChange={e => setFilterSubCat(e.target.value)}>
                      <option value="">Sub-categories</option>
                      {filterCat && CATEGORY_MAP_T[filterCat] ? CATEGORY_MAP_T[filterCat].map(sc => <option key={sc}>{sc}</option>) : Object.values(CATEGORY_MAP_T).flat().sort().map(sc => <option key={sc}>{sc}</option>)}
                    </select>
                    <select id="filter-account" className="filter-select flex-1 h-9 min-w-[120px]" value={filterAcc} onChange={e => setFilterAcc(e.target.value)}>
                      <option value="">Accounts</option>
                      {ACCOUNTS_LIST.map(a => <option key={a}>{a}</option>)}
                    </select>
                    <select id="filter-timeline" className="filter-select flex-1 h-9 min-w-[120px]" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
                      <option value="">Timeline</option>
                      {past10Months.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                    {(filterCat || filterSubCat || filterAcc || filterMonth) && (
                      <button 
                        id="clear-filters-btn"
                        className="btn btn-ghost btn-sm min-w-[36px] h-9 flex items-center justify-center text-accent bg-accent/5" 
                        onClick={() => { setFilterCat(''); setFilterSubCat(''); setFilterAcc(''); setFilterMonth(''); }}
                        title="Clear Filters"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
             )}
            <div className="table-scroll">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-border">
                    {isEditingTransactions && <th className="py-3 px-4 w-10"></th>}
                    <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('tx', 'Date')}>Details</th>
                    <th className="py-3 px-4 text-center cursor-pointer" onClick={() => handleSort('tx', 'Amount')}>Amount</th>
                    <th className="py-3 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((r, i) => (
                    <tr 
                      key={`tx-row-${r.ID || i}-${i}`} 
                      className={cn("cursor-pointer border-b border-border/40 transition-colors", r.ID && selectedTransactions.has(String(r.ID)) ? "bg-accent/5" : "hover:bg-surface/50")}
                      onClick={() => {
                        const rowId = String(r.ID || '');
                        if (isEditingTransactions && rowId) {
                          const newSelected = new Set(selectedTransactions);
                          if (newSelected.has(rowId)) newSelected.delete(rowId);
                          else newSelected.add(rowId);
                          setSelectedTransactions(newSelected);
                        } else {
                          setEditId(rowId || null);
                          setFormData({
                            date: r.Date,
                            amount: String(r.Amount),
                            category: r.Category,
                            subCategory: r['Sub-Category'],
                            account: r.Accounts || 'Bank of Baroda',
                            notes: r.Notes || '',
                            desc: r.Desc || '',
                            state: r.State || 'Payable',
                            status: r.Status || 'Processed',
                            name: '', bank: '', type: 'Bank', balance: '', standardBalance: '', month: ''
                          });
                          setShowModal('transaction');
                        }
                      }}
                    >
                      {isEditingTransactions && (
                        <td className="py-3 px-4">
                          <input 
                            type="checkbox" 
                            checked={!!r.ID && selectedTransactions.has(String(r.ID))} 
                            readOnly 
                            className="accent-accent w-4 h-4"
                          />
                        </td>
                      )}
                      <td className="py-3 px-4 text-left">
                        <div className="font-bold text-sm text-text">{r['Sub-Category']}</div>
                        <div className="text-[10px] text-muted font-medium uppercase tracking-tight mt-0.5 whitespace-nowrap">
                          {fmtDate(r.Date)}
                        </div>
                      </td>
                      <td className={cn("py-3 px-4 text-center font-mono font-bold text-sm", r.Category === 'Income' ? 'text-accent2' : r.Category === 'Credit' ? 'text-blue' : 'text-text')}>
                        {fmt(r.Amount)}
                      </td>
                      <td className="py-3 px-4 text-xs text-muted">
                        <div className="max-w-[200px] break-words line-clamp-2" title={r.Notes}>{r.Notes}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Outstanding */}
        <section className={cn("page-container", activePage === 'outstanding' && "active")}>
          <div className="page-header !flex !flex-col gap-4">
            <div className="flex flex-row items-center justify-between gap-4 w-full">
              <div className="flex-1">
                <div className="page-title">Outstanding<span>.</span></div>
                <div className="page-sub">{filteredOutstanding.length} entries found</div>
              </div>
              
              <div className="flex gap-1 items-center">
                {/* Desktop Only Add Entry */}
                <button 
                  className="hidden md:flex btn btn-primary btn-sm items-center justify-center min-w-[36px] px-3 h-9" 
                  onClick={() => {
                    setEditId(null);
                    setFormData({
                      date: lastEnteredTxDate,
                      amount: '0',
                      category: 'Expenses',
                      subCategory: 'Payment',
                      desc: '',
                      notes: '',
                      account: 'Bank of Baroda',
                      state: filterState as any,
                      status: 'Pending',
                      name: '', bank: '', type: 'Bank', balance: ''
                    });
                    setShowModal('outstanding');
                  }}
                  title="Add Entry"
                >
                  <Plus size={16} />
                  <span className="hidden md:inline ml-1">Add Entry</span>
                </button>

                <button
                  className={cn("flex btn btn-sm items-center justify-center min-w-[36px] w-9 md:w-auto p-0 md:px-4 h-9 rounded-xl shadow-sm transition-all focus:outline-none flex-shrink-0", isEditingOutstanding ? "bg-accent/10 text-accent border border-accent/20" : "bg-[#c84b2f] hover:brightness-110 text-white border-0")}
                  onClick={() => {
                    setIsEditingOutstanding(!isEditingOutstanding);
                    if (!isEditingOutstanding) setSelectedOutstanding(new Set());
                  }}
                  title={isEditingOutstanding ? "Done Editing" : "Edit Outstanding"}
                >
                  {isEditingOutstanding ? <><span className="hidden md:inline font-semibold">Done</span><span className="md:hidden"><X size={16} /></span></> : <><Edit3 size={16} className="md:hidden flex-shrink-0" /><span className="hidden md:inline font-semibold">Edit</span></>}
                </button>

                <button 
                  className={cn("btn btn-ghost btn-sm flex items-center justify-center min-w-[36px] px-2 md:px-3 h-9", (showOutFilters || showOutSearch) && "bg-accent/10 text-accent")} 
                  onClick={() => {
                    setShowOutFilters(!showOutFilters);
                    setShowOutSearch(!showOutFilters);
                  }}
                  title="Filter & Search"
                >
                  <Filter size={16} />
                  <span className="hidden md:inline ml-1">Filter</span>
                </button>
              </div>
            </div>

            {isEditingOutstanding && (
              <div className="w-full flex items-center justify-center gap-2 p-2 bg-surface/50 rounded-xl md:bg-transparent md:p-0 animate-in fade-in slide-in-from-top-2">
                <button 
                  className="flex-1 btn btn-sm bg-emerald-600 hover:bg-emerald-700 text-white h-9 font-bold rounded-xl border-0 shadow-sm"
                  onClick={() => handleBulkStatusUpdate('Outstanding', 'Processed')}
                  disabled={selectedOutstanding.size === 0 || syncing}
                >
                  Processed
                </button>
                <button 
                  className="flex-1 btn btn-sm bg-red-600 hover:bg-red-700 text-white h-9 font-bold rounded-xl border-0 shadow-sm"
                  onClick={() => handleBulkDelete('Outstanding')}
                  disabled={selectedOutstanding.size === 0 || syncing}
                >
                  Delete
                </button>
                <button 
                  className="flex-1 btn btn-sm btn-ghost text-muted h-9 font-semibold rounded-xl hover:bg-surface/50"
                  onClick={() => {
                    setIsEditingOutstanding(false);
                    setSelectedOutstanding(new Set());
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="table-card overflow-hidden mt-6">
             {(showOutSearch || showOutFilters) && (
               <div id="outstanding-toolbar" className="table-toolbar flex flex-col gap-2 p-3 md:p-4 border-b border-border/40 bg-surface/30">
                {(showOutSearch || (showOutFilters && window.innerWidth < 768)) && (
                  <div className="relative w-full transition-all">
                    <input 
                      id="outstanding-search-input"
                      className="search-box w-full px-4 h-9" 
                      type="text" 
                      placeholder="Search outstanding..." 
                      value={outSearch}
                      onChange={e => setOutSearch(e.target.value)}
                      autoFocus
                    />
                    {outSearch && (
                      <button 
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text p-1"
                        onClick={() => setOutSearch('')}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                )}
                {showOutFilters && (
                  <div id="outstanding-filters" className="flex gap-2 w-full animate-in fade-in slide-in-from-top-1">
                    <select className="filter-select flex-1 h-9" value={outFilterState} onChange={e => setOutFilterState(e.target.value)}>
                      <option value="">All States</option>
                      <option>Payable</option><option>Receivable</option>
                    </select>
                    <select id="out-filter-timeline" className="filter-select flex-1 h-9 min-w-[120px]" value={outFilterMonth} onChange={e => setOutFilterMonth(e.target.value)}>
                      <option value="">Timeline</option>
                      {past10Months.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                    {(outFilterState || outFilterMonth) && (
                      <button 
                        className="btn btn-ghost btn-sm min-w-[36px] h-9 flex items-center justify-center text-accent bg-accent/5" 
                        onClick={() => { setOutFilterState(''); setOutFilterMonth(''); }}
                        title="Clear Filters"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
             )}
            <div className="table-scroll">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-border">
                    {isEditingOutstanding && <th className="py-3 px-4 w-10"></th>}
                    <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('out', 'Date')}>Desc</th>
                    <th className="py-3 px-4 text-center">State</th>
                    <th className="py-3 px-4 text-center cursor-pointer" onClick={() => handleSort('out', 'Amount')}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOutstanding.map((r, i) => (
                    <tr 
                      key={`out-row-${(r as any).ID || i}-${i}`}
                      className={cn("cursor-pointer border-b border-border/40 transition-colors", (r as any).ID && selectedOutstanding.has(String((r as any).ID)) ? "bg-accent/5" : "hover:bg-surface/50")}
                      onClick={() => {
                        const anyR = r as any;
                        const rowId = String(anyR.ID || '');
                        if (isEditingOutstanding && rowId) {
                          const newSelected = new Set(selectedOutstanding);
                          if (newSelected.has(rowId)) newSelected.delete(rowId);
                          else newSelected.add(rowId);
                          setSelectedOutstanding(newSelected);
                        } else {
                          setEditId(rowId || null);
                          setFormData({
                            date: r.Date,
                            amount: String(r.Amount),
                            category: r.Category,
                            subCategory: r['Sub-Category'] || '',
                            desc: r.Desc || '',
                            notes: r.Notes || '',
                            state: r.State || 'Payable',
                            status: r.Status || 'Pending',
                            account: r.Accounts || 'Bank of Baroda',
                            name: '', bank: '', type: 'Current', balance: '', standardBalance: '', month: ''
                          });
                          setShowModal('outstanding');
                        }
                      }}
                    >
                      {isEditingOutstanding && (
                        <td className="py-4 px-4">
                          <input 
                            type="checkbox" 
                            checked={!!(r as any).ID && selectedOutstanding.has(String((r as any).ID))} 
                            readOnly 
                            className="accent-accent w-4 h-4"
                          />
                        </td>
                      )}
                      <td className="py-4 px-4 text-left">
                        <div className="font-bold text-sm text-text">{(r as any).Desc || (r as any)['Sub-Category'] || 'No description'}</div>
                        <div className="text-[10px] text-muted font-medium uppercase tracking-tight mt-0.5 whitespace-nowrap">
                          {fmtDate(r.Date)}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={cn(
                          "text-[9px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider",
                          (r as any).State === 'Payable' ? "text-green-600 bg-green-100" : "text-red-600 bg-red-100"
                        )}>
                          {(r as any).State || 'Payable'}
                        </span>
                      </td>
                      <td className={cn("py-4 px-4 text-center font-mono font-bold text-base whitespace-nowrap", (r as any).State === 'Payable' ? 'text-accent2' : 'text-accent')}>
                        {fmt(r.Amount)}
                      </td>
                    </tr>
                  ))}
                      {filteredOutstanding.length === 0 && (
                        <tr>
                          <td colSpan={3} className="py-12 text-center text-muted italic text-sm">
                            No outstanding entries found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

        {/* Monthly (Timeline) */}
        <section className={cn("page-container", activePage === 'timeline' && "active")}>
          <div className="page-header flex flex-col gap-4">
            <div className="flex flex-row items-center justify-between gap-4 w-full">
              <div>
                <div className="page-title">Monthly<span>.</span></div>
                <div className="page-sub">Historical flow overview</div>
              </div>
              <div>
                <select className="filter-select w-24 h-9" value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
                  {Array.from(new Set([...months.map(m => m.split('-')[0]), new Date().getFullYear().toString()])).sort((a,b) => b.localeCompare(a)).map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="month-grid">
            {months.filter(m => m.startsWith(filterYear)).map((m, idx) => {
              const recs = transactions.filter(r => r.Date.startsWith(m));
              const exp = recs.filter(r => r.Category === 'Expenses').reduce((s, r) => s + r.Amount, 0);
              const inc = recs.filter(r => r.Category === 'Income').reduce((s, r) => s + r.Amount, 0);
              return (
                <div key={`${m}-${idx}`} className="month-card cursor-pointer hover:border-accent/40 hover:bg-surface/50 transition-colors" onClick={() => { setFilterMonth(m); setActivePage('transactions'); }}>
                  <div className="month-name">
                    {(() => {
                      const dt = parseISO(m + '-01');
                      return isValid(dt) ? format(dt, 'MMM yyyy') : m;
                    })()}
                  </div>
                  <div className="month-bar-wrap">
                    <div className="month-bar" style={{ width: `${Math.min(100, (exp / (inc || 1) * 100))}%` }} />
                  </div>
                  <div className="month-stats">
                    <div className="month-stat"><div className="val text-accent">{fmt(exp)}</div><div className="lbl">Exp</div></div>
                    <div className="month-stat"><div className="val text-accent2">{fmt(inc)}</div><div className="lbl">Inc</div></div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Accounts */}
        <section className={cn("page-container", activePage === 'accounts' && "active")}>
          <div className="page-header flex flex-col gap-4">
            <div className="flex flex-row items-center justify-between gap-4 w-full">
              <div className="flex-1">
                <div className="page-title">Accounts<span>.</span></div>
                <div className="page-sub">Bank accounts & credit cards</div>
              </div>
              <div className="flex gap-2">
              <button 
                className="hidden md:flex btn btn-primary btn-sm items-center justify-center min-w-[36px] px-3 h-9" 
                onClick={() => { 
                  setEditId(null); 
                  setFormData({
                    ...formData,
                    date: new Date().toISOString().slice(0, 10),
                    amount: '0',
                    name: '', bank: '', type: 'Current', balance: '', standardBalance: ''
                  });
                  setShowModal('account'); 
                }}
                title="Add Account"
              >
                <Plus size={16} />
                <span className="hidden md:inline ml-1">Add Account</span>
              </button>
              <button
                className={cn("flex btn items-center justify-center w-9 h-9 md:w-auto p-0 md:px-4 rounded-xl shadow-sm transition-all focus:outline-none flex-shrink-0", isEditingAccounts ? "bg-accent/10 text-accent border border-accent/20" : "bg-[#c84b2f] hover:brightness-110 text-white border-0")}
                onClick={() => setIsEditingAccounts(!isEditingAccounts)}
                title={isEditingAccounts ? "Done Editing" : "Edit Accounts"}
              >
                {isEditingAccounts ? <><span className="hidden md:inline font-semibold">Done</span><span className="md:hidden"><X size={16} /></span></> : <><Edit3 size={16} className="md:hidden flex-shrink-0" /><span className="hidden md:inline font-semibold">Edit</span></>}
              </button>
            </div>
          </div>
        </div>
          <div className="table-card overflow-hidden">
            <div className="table-scroll">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-border">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4 text-right">Current</th>
                    <th className="py-3 px-4 text-right">Standard</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    'Canara Bank',
                    'Bank of Baroda',
                    'KOTAK Mahindra Bank',
                    'HDFC Bank',
                    'State Bank of India',
                    'HDFC Money Back Plus'
                  ].map((name, i) => {
                    const acc = accounts.find(a => a.name === name);
                    return (
                      <tr 
                        key={`acc-row-${i}`} 
                        className="border-b border-border/40 hover:bg-surface/50 transition-colors cursor-pointer"
                        onClick={() => {
                          if (isEditingAccounts) {
                            const accToEdit = accounts.find(a => a.name === name) || { id: null, balance: 0, standardBalance: 0 };
                            setEditId(accToEdit.id || null);
                            setFormData({
                              ...formData,
                              name, 
                              bank: '', 
                              type: name.includes('Money Back') ? 'Credit' : name === 'Canara Bank' || name === 'Bank of Baroda' ? 'Current' : 'Savings', 
                              balance: String(accToEdit.balance || '0'), 
                              standardBalance: String(accToEdit.standardBalance || '0'), 
                              month: format(new Date(), 'yyyy-MM')
                            });
                            setShowModal('account');
                          } else {
                            setSelectedAccount(name);
                            setHistoryMonth(format(new Date(), 'yyyy-MM'));
                            setShowModal('account-history');
                          }
                        }}
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            {isEditingAccounts && <Edit3 size={16} className="text-accent" />}
                            <div>
                              <div className="font-bold text-sm text-text">{name}</div>
                              <div className="text-[10px] text-muted uppercase font-medium">{name.includes('Money Back') ? 'Credit Card' : name === 'Canara Bank' || name === 'Bank of Baroda' ? 'Current' : 'Savings'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right font-mono font-bold text-sm text-accent2">
                          {acc ? fmt(acc.balance) : '₹0'}
                        </td>
                        <td className="py-4 px-4 text-right font-mono font-bold text-sm text-text">
                          {acc && acc.standardBalance ? fmt(acc.standardBalance) : '₹0'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay open">
          <div className="modal-content">
            <div className="flex justify-between items-center mb-6">
              <div className="modal-title m-0">{showModal === 'account-history' ? `${selectedAccount} History` : `${editId ? 'Edit' : 'Add'} ${showModal.charAt(0).toUpperCase() + showModal.slice(1)}`}</div>
              <button className="text-muted hover:text-text p-2 -mr-2" onClick={() => setShowModal(null)}><X size={20} /></button>
            </div>
            
            {showModal === 'account' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <input className="form-input" placeholder="e.g. Primary Savings" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select className="form-input" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as any })}>
                      <option>Current</option><option>Savings</option><option>Credit</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group">
                    <label className="form-label">Current Balance (₹)</label>
                    <input className="form-input" type="number" placeholder="0" value={formData.balance} onChange={e => setFormData({ ...formData, balance: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Standard Balance (₹)</label>
                    <input className="form-input" type="number" placeholder="0" value={formData.standardBalance} onChange={e => setFormData({ ...formData, standardBalance: e.target.value })} />
                  </div>
                </div>
              </div>
            ) : showModal === 'account-history' ? (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar">
                 <div className="table-card overflow-hidden">
                   <table className="w-full">
                      <thead>
                        <tr className="text-left border-b border-border">
                          <th className="py-2 px-3">Month</th>
                          <th className="py-2 px-3 text-right">Current Balance</th>
                          <th className="py-2 px-3 text-right">Standard Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {accounts.filter(a => a.name === selectedAccount).sort((a,b) => (b.Month || '').localeCompare(a.Month || '')).map((acc, idx) => (
                           <tr key={`acc-history-${selectedAccount}-${acc.Month || idx}-${idx}`} className="border-b border-border/40 text-sm hover:bg-surface/50">
                              <td className="py-3 px-3">
                                <div className="font-bold text-text">
                                  {acc.Month ? (() => {
                                      const dt = parseISO(acc.Month + '-01');
                                      return isValid(dt) ? format(dt, 'MMM yyyy') : acc.Month;
                                  })() : 'Current'}
                                </div>
                              </td>
                              <td className="py-3 px-3 text-right font-mono font-bold text-accent2">{fmt(acc.balance)}</td>
                              <td className="py-3 px-3 text-right font-mono font-bold text-text">{acc.standardBalance ? fmt(acc.standardBalance) : '₹0'}</td>
                           </tr>
                        ))}
                        {accounts.filter(a => a.name === selectedAccount).length === 0 && (
                           <tr><td colSpan={3} className="py-8 text-center text-muted italic text-sm">No history found.</td></tr>
                        )}
                      </tbody>
                   </table>
                 </div>
              </div>
            ) : showModal === 'outstanding' || showModal === 'transaction' ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 lg:grid-cols-4 md:grid-cols-3 gap-3">
                  <div className="form-group">
                    <label className="form-label">Date</label>
                    <input className="form-input" type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Amount (₹)</label>
                    <input className="form-input" type="number" placeholder="0" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
                  </div>
                  {showModal === 'outstanding' && (
                   <div className="form-group">
                    <label className="form-label">State</label>
                    <select className="form-input" value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value as any })}>
                      <option>Payable</option>
                      <option>Receivable</option>
                    </select>
                  </div>
                  )}
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select 
                      className="form-input" 
                      value={formData.category} 
                      onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                    >
                      {Object.keys(showModal === 'transaction' ? CATEGORY_MAP_T : CATEGORY_MAP_O).map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sub-Category</label>
                    <select 
                      className="form-input" 
                      value={formData.subCategory} 
                      onChange={e => setFormData({ ...formData, subCategory: e.target.value })}
                    >
                      {(showModal === 'transaction' ? CATEGORY_MAP_T : CATEGORY_MAP_O)[formData.category]?.map(sc => (
                        <option key={sc}>{sc}</option>
                      )) || <option value="">None</option>}
                    </select>
                  </div>
                  <div className="form-group md:col-span-2 lg:col-span-2">
                    <label className="form-label">Desc</label>
                    <input className="form-input" type="text" placeholder="e.g. LIC Premium" value={formData.desc} onChange={e => setFormData({ ...formData, desc: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea 
                    className="form-input py-2 text-sm" 
                    rows={2}
                    placeholder="Additional details..." 
                    value={formData.notes} 
                    onChange={e => setFormData({ ...formData, notes: e.target.value })} 
                  />
                </div>
              </div>
            ) : null}
            
            {showModal !== 'account-history' && (
              <div className="flex gap-2 justify-end mt-6">
                <button className="btn btn-ghost" onClick={() => setShowModal(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={() => handleSave(showModal as any)} disabled={syncing}>
                  {syncing ? 'Saving...' : 'Save Entry'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Action Button for Mobile */}
      <div className="md:hidden">
        {['transactions', 'dashboard', 'timeline', 'accounts'].includes(activePage) && (
          <button 
            className="fixed bottom-8 right-8 w-16 h-16 bg-[#c84b2f] text-white rounded-2xl flex items-center justify-center shadow-2xl z-[999] active:scale-95 transition-all hover:scale-105 border-4 border-white/20"
            onClick={() => {
              if (activePage === 'accounts') {
                setEditId(null); 
                setFormData({
                  ...formData,
                  date: new Date().toISOString().slice(0, 10),
                  amount: '0',
                  name: '', bank: '', type: 'Current', balance: '', standardBalance: ''
                });
                setShowModal('account'); 
              } else {
                setEditId(null);
                setFormData({
                  date: lastEnteredTxDate,
                  amount: '0',
                  category: 'Expenses',
                  subCategory: CATEGORY_MAP_T['Expenses'][0],
                  desc: '',
                  notes: '',
                  account: ACCOUNTS_LIST[0],
                  state: 'Payable',
                  status: 'Pending',
                  name: '', bank: '', type: 'Current', balance: '', standardBalance: ''
                });
                setShowModal('transaction');
              }
            }}
          >
            <Plus size={32} strokeWidth={3} />
          </button>
        )}
        {activePage === 'outstanding' && (
          <button 
            className="fixed bottom-8 right-8 w-16 h-16 bg-[#c84b2f] text-white rounded-2xl flex items-center justify-center shadow-2xl z-[999] active:scale-95 transition-all hover:scale-105 border-4 border-white/20"
            onClick={() => {
                setEditId(null);
                setFormData({
                  date: lastEnteredTxDate,
                  amount: '0',
                  category: 'Expenses',
                  subCategory: 'Payment',
                  desc: '',
                  notes: '',
                  account: 'Bank of Baroda',
                  state: filterState as any,
                  status: 'Pending',
                  name: '', bank: '', type: 'Bank', balance: ''
                });
                setShowModal('outstanding');
            }}
          >
            <Plus size={32} strokeWidth={3} />
          </button>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className={cn("toast-message show", toast.type)}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function NavItem({ active, onClick, icon, label, collapsed }: { active: boolean; onClick: () => void; icon: ReactNode; label: string; collapsed: boolean }) {
  return (
    <div className={cn("nav-item", active && "active")} onClick={onClick} title={collapsed ? label : undefined}>
      <span className="nav-icon">{icon}</span>
      <span className="nav-label">{label}</span>
    </div>
  );
}

function StatCard({ type, label, value, count, trend }: { type: string; label: string; value: number; count: number; trend?: 'up' | 'down' }) {
  return (
    <div className={cn("stat-card", type)}>
      <div className="stat-stripe" />
      <div className="flex justify-between items-start">
        <div className="stat-label">{label}</div>
        {trend && (
          <div className={cn("text-[10px] font-bold p-1 rounded-sm", trend === 'up' ? "bg-accent2/10 text-accent2" : "bg-accent/10 text-accent")}>
            {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          </div>
        )}
      </div>
      <div className="stat-value">{fmt(value)}</div>
      <div className="stat-count">{count} entries this month</div>
    </div>
  );
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { 
      bodyFont: { family: 'Syne' },
      padding: 10,
      backgroundColor: '#1a1814',
      titleFont: { family: 'Syne', weight: 'bold' as const }
    }
  },
  scales: {
    x: { 
      ticks: { color: '#7a7570', font: { family: 'JetBrains Mono', size: 10 } },
      grid: { display: false }
    },
    y: { 
      ticks: { color: '#7a7570', font: { family: 'JetBrains Mono', size: 10 }, callback: (v: any) => '₹' + v },
      grid: { color: 'rgba(212,207,196,0.15)' }
    }
  }
};

const donutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { 
      position: 'bottom' as const,
      labels: { color: '#7a7570', font: { family: 'Syne', size: 10 }, padding: 16, usePointStyle: true } 
    }
  },
  cutout: '70%'
};
