/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, ReactNode } from 'react';
import { auth, db, setAnalyticsUserPlan, logAnalyticsEvent } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import SignIn from './SignIn';
import SignUp from './SignUp';
import { Transaction, Outstanding, PageView, Account, FinancialRecord } from './types';
import { fetchTransactions, fetchOutstanding, saveTransaction, fetchAccounts } from './api';
import { sbSyncProfile } from './supabase';
import { 
  Plus, 
  Trash2, 
  Search, 
  Filter, 
  ArrowRightLeft, 
  LayoutDashboard, 
  Clock, 
  BarChart3, 
  Landmark, 
  Menu, 
  Sun, 
  Moon, 
  LogOut, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Crown,
  Zap,
  Gem,
  CheckCircle2,
  Lock,
  WalletCards,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCcw,
  History,
  Edit3,
  ArrowDownCircle,
  ArrowUpCircle,
  Receipt,
  CreditCard,
  X,
  AtSign,
  Settings,
  User,
  Bell
} from 'lucide-react';
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
import { motion } from 'motion/react';
import { twMerge } from 'tailwind-merge';

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

// Convert a UTC ISO date string (from the database) to local YYYY-MM-DD.
// The database stores dates as midnight UTC, which we need to convert
// to the local date string for the form inputs.

const toLocalDateStr = (d: string): string => {
  if (!d) return '';
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return d;
  }
};

const fmtDate = (d: string) => {
  try {
    if (!d) return '';
    // Parse as local Date to avoid timezone shift
    const dt = new Date(d);
    return !isNaN(dt.getTime()) ? format(dt, 'dd MMM yyyy') : d;
  } catch (e) {
    return d || '';
  }
};

type SortConfig = { key: string; direction: 'asc' | 'desc' };

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [prefilledEmail, setPrefilledEmail] = useState('');
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [userPlan, setUserPlan] = useState<'free' | 'premium'>('free');
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        // Only allow verified users
        if (!u.emailVerified) {
          setUser(null);
          setIsAuthLoading(false);
          return;
        }

        // Fetch/Initialize User from Firestore
        try {
          const userRef = doc(db, 'users', u.uid);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUser({ ...u, ...data });
            setUserPlan(data.plan || 'free');
            
            // Check if userId is missing (for Google users who haven't set it)
            if (!data.userId) {
              const generatedId = u.email ? u.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') : '';
              await setDoc(userRef, { userId: generatedId }, { merge: true });
              setUser({ ...u, ...data, userId: generatedId });
              
              // Sync to Supabase with new userId
              sbSyncProfile(u, { ...data, userId: generatedId }).catch(console.error);
            } else {
              // Sync to Supabase with existing data
              sbSyncProfile(u, data).catch(console.error);
            }
          } else {
            // First time login (likely Google) - initialize basic profile
            const generatedId = u.email ? u.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') : '';
            const newUser = { 
              email: u.email, 
              name: u.displayName || '',
              userId: generatedId,
              plan: 'free', 
              createdAt: new Date().toISOString() 
            };
            await setDoc(userRef, newUser);
            setUser({ ...u, ...newUser });
            setUserPlan('free');
            
            console.log('✅ New Google user created in Firestore, syncing to Supabase...');
            sbSyncProfile(u, newUser).catch(console.error);
          }
        } catch (err) {
          console.error("❌ Error fetching user data:", err);
          setUser(u);
          setUserPlan('free');
          
          console.log('⚠️ Fallback sync triggering...');
          sbSyncProfile(u).catch(console.error);
        }
      } else {
        setUser(null);
        setUserPlan('free');
      }
      setIsAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  // Force sync to Supabase when user state is first established (handles already-logged-in cases)
  useEffect(() => {
    if (user && !isAuthLoading) {
      sbSyncProfile(auth.currentUser, user).catch(console.error);
    }
  }, [user, isAuthLoading]);


  const [syncing, setSyncing] = useState(false);
  const [activePage, setActivePage] = useState<PageView>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [outstanding, setOutstanding] = useState<Outstanding[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [showModal, setShowModal] = useState<'transaction' | 'outstanding' | 'account' | 'account-history' | 'set-userid' | null>(null);
  const [newUserId, setNewUserId] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [historyMonth, setHistoryMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  
  // Sort state
  const [txSort, setTxSort] = useState<SortConfig>({ key: 'Date', direction: 'desc' });
  const [outSort, setOutSort] = useState<SortConfig>({ key: 'Date', direction: 'desc' });

  // Form state
  const [editId, setEditId] = useState<string | null>(null);

  // Sync plan state to Analytics
  useEffect(() => {
    if (user) {
      setAnalyticsUserPlan(userPlan);
    }
  }, [userPlan, user]);

  // Track Page Views
  useEffect(() => {
    logAnalyticsEvent('screen_view', { 
      firebase_screen: activePage, 
      plan: userPlan 
    });
  }, [activePage, userPlan]);

  // Theme Persistence
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    amount: '',
    category: 'Expenses',
    subCategory: '',
    desc: '',
    notes: '',
    Accounts: ACCOUNTS_LIST[0],
    state: 'Payable',
    status: 'Pending',
    // Account specific
    name: '',
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
  const [outFilterCat, setOutFilterCat] = useState('');
  const [outFilterSubCat, setOutFilterSubCat] = useState('');
  
  const [accFilterMonth, setAccFilterMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  
  const [filterState, setFilterState] = useState('Payable');

  // Handle category change to reset subcategory ONLY when it's invalid for the new category
  useEffect(() => {
    if (showModal === 'transaction') {
      const allowed = CATEGORY_MAP_T[formData.category] || [];
      
      // Only reset subcategory if current value is not in the allowed list
      if (formData.subCategory && !allowed.includes(formData.subCategory)) {
        setFormData(prev => ({ ...prev, subCategory: allowed[0] || '' }));
      } else if (!formData.subCategory && allowed.length > 0) {
        setFormData(prev => ({ ...prev, subCategory: allowed[0] }));
      }
      
      // Only set default account for NEW entries (not edits)
      if (formData.category === 'Income' && !editId) {
        setFormData(prev => ({ ...prev, Accounts: 'HDFC Bank' }));
      }
    } else if (showModal === 'outstanding') {
      const allowed = CATEGORY_MAP_O[formData.category] || [];
      if (formData.subCategory && !allowed.includes(formData.subCategory)) {
        if (formData.category === 'Expenses' && allowed.includes('Payment')) {
          setFormData(prev => ({ ...prev, subCategory: 'Payment' }));
        } else {
          setFormData(prev => ({ ...prev, subCategory: allowed[0] || '' }));
        }
      } else if (!formData.subCategory && allowed.length > 0) {
        setFormData(prev => ({ ...prev, subCategory: allowed[0] }));
      }
    }
  }, [formData.category, showModal]);

  useEffect(() => {
    if (formData.subCategory === 'HDFC Money Back Plus') {
      setFormData(prev => ({ ...prev, Accounts: 'HDFC Money Back Plus' }));
    }
  }, [formData.subCategory]);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async (showOverlay = true) => {
    if (showOverlay) setLoading(true);
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

        // Use toLocalDateStr to convert UTC ISO dates to correct local dates
        const rawDate = getVal('Date') || r.Date || '';

        return {
          ID: String(getVal('ID') || r.ID || ''),
          Date: toLocalDateStr(String(rawDate)),
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
      if (showOverlay) setLoading(false);
    }
  };

  const getAccountForCategory = (category: string) => {
    const catLower = (category || '').trim().toLowerCase();
    if (catLower.includes('income')) return 'HDFC Bank';
    if (catLower.includes('credit')) return 'HDFC Money Back Plus';
    if (catLower.includes('expense') || catLower.includes('bill')) return 'Bank of Baroda';
    return 'Bank of Baroda';
  };

  const moveRowBetweenTables = async (item: FinancialRecord, from: 'Transactions' | 'Outstanding', to: 'Transactions' | 'Outstanding', newStatus: 'Pending' | 'Processed') => {
    // Carry over Desc and Accounts exactly as-is from the source record.
    // Use only the exact column header names to avoid backend key conflicts.
    const addRes = await saveTransaction({
      action: 'add',
      sheet: to,
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
      Accounts: item.Accounts || '',
      Desc: item.Desc || '',
      Notes: item.Notes || ''
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
      if (filterAcc && r.Accounts !== filterAcc) return false;
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
      if (outFilterCat && r.Category !== outFilterCat) return false;
      if (outFilterSubCat && r['Sub-Category'] !== outFilterSubCat) return false;
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
          Accounts: formData.Accounts || ''
        };

        const currentSheet = entryType === 'transaction' ? 'Transactions' : 'Outstanding';
        let targetSheet = currentSheet;

        if (fullRecord.Status === 'Processed') targetSheet = 'Transactions';
        if (fullRecord.Status === 'Pending') targetSheet = 'Outstanding';

        if (editId && currentSheet !== targetSheet) {
          const res = await moveRowBetweenTables(fullRecord, currentSheet as any, targetSheet as any, fullRecord.Status as any);
          if (res.status === 'ok') {
            if (entryType === 'transaction') setLastEnteredTxDate(formData.date);
            showToast(`Moved to ${targetSheet}`);
            setShowModal(null);
            setEditId(null);
            loadAllData(false);
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
          Accounts: fullRecord.Accounts,
          Desc: fullRecord.Desc,
          Notes: fullRecord.Notes
        };
      }

      const res = await saveTransaction(payload);
      if (res.status === 'ok') {
        if (entryType === 'transaction') setLastEnteredTxDate(formData.date);
        showToast('Saved successfully');
        setShowModal(null);
        setEditId(null);
        loadAllData(false);
      } else throw new Error();
    } catch (e) {
      showToast('Save failed', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleSetUserId = async () => {
    if (!newUserId || !user) return;
    setSyncing(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { userId: newUserId.toLowerCase() }, { merge: true });
      const updatedUser = { ...user, userId: newUserId.toLowerCase() };
      setUser(updatedUser);
      
      // Sync change to Supabase
      sbSyncProfile(auth.currentUser, updatedUser).catch(console.error);

      setShowModal(null);
      showToast('User ID set successfully');
    } catch (e) {
      showToast('Failed to set User ID', 'error');
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
            await moveRowBetweenTables(item, type, targetSheet as any, newStatus);
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
      loadAllData(false);
    } catch (e) {
      console.error(e);
      showToast('Update failed', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleExport = () => {
    if (userPlan === 'free') {
      logAnalyticsEvent('feature_blocked', { feature: 'export', plan: 'free' });
      setIsUpgradeModalOpen(true);
      return;
    }
    try {
      logAnalyticsEvent('export_data', { type: 'csv' });
      const headers = ["Date", "Category", "Sub-Category", "Amount", "Notes"];
      const csvData = transactions.map(t => [
        t.Date, 
        t.Category, 
        t['Sub-Category'], 
        t.Amount, 
        t.Notes ? t.Notes.replace(/,/g, ' ') : ''
      ]);
      const csvContent = [headers, ...csvData].map(e => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `Expense_Log_Export_${format(new Date(), 'yyyy_MM_dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Export successful');
    } catch (err) {
      console.error(err);
      showToast('Export failed', 'error');
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
      loadAllData(false);
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

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return authMode === 'signin' ? (
      <SignIn 
        onToggle={() => {
          setAuthMode('signup');
          setSignupSuccess(false);
        }} 
        prefilledEmail={prefilledEmail}
        initialMessage={signupSuccess ? "Your account has been created. Please check your email and verify your address before logging in." : ""}
      />
    ) : (
      <SignUp 
        onToggle={() => {
          setAuthMode('signin');
          setSignupSuccess(false);
        }} 
        onSuccess={(email: string) => {
          setPrefilledEmail(email);
          setSignupSuccess(true);
          setAuthMode('signin');
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="loading-overlay">
        <img src="/logo.png" alt="Expense Log Pro" className="w-48 h-48 object-contain mb-4 animate-pulse mx-auto" />
        <div className="loading-bar-wrap"><div className="loading-bar"></div></div>
        <div className="loading-sub">Connecting to Database...</div>
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[var(--bg)]/90 backdrop-blur-lg z-[80] flex items-center px-4 justify-between border-b border-[var(--border)] shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            className="p-2 rounded-xl bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] mobile-header-btn"
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu size={16} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 mobile-header-logo">
              <Landmark size={16} />
            </div>
            <span className="font-bold text-sm text-[var(--text)] mobile-header-text">Expense Log Pro</span>
          </div>
        </div>
        <button 
          className="p-2 rounded-xl bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] mobile-header-btn"
          onClick={() => setIsDark(!isDark)}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </header>

      {/* Sidebar Overlay */}
      <div 
        className={cn("sidebar-overlay", mobileSidebarOpen && "open")} 
        onClick={() => setMobileSidebarOpen(false)}
      />

      {/* Custom Confirmation Modal */}
      <div className={cn("modal-overlay flex items-center justify-center p-4", isDeleting && "open")}>
        <div className="modal-content max-w-[400px] w-full p-5 animate-in fade-in zoom-in duration-200">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
              <Trash2 size={20} />
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

      {/* Upgrade Modal */}
      <div className={cn("modal-overlay flex items-center justify-center p-4", isUpgradeModalOpen && "open")}>
        <div className="modal-content max-w-[450px] w-full p-6 animate-in fade-in zoom-in duration-300 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500"></div>
          
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-amber-400/20 text-amber-400 rounded-2xl flex items-center justify-center mb-6 shadow-glow-amber">
              <Crown size={28} />
            </div>
            
            <h3 className="text-2xl font-bold mb-2 text-text">Upgrade to Premium</h3>
            <p className="text-muted text-sm mb-8 leading-relaxed">
              Unlock the full potential of your financial management with professional tools and deep insights.
            </p>

            <div className="w-full space-y-3 mb-8">
              {[
                { icon: <BarChart3 size={16} />, text: "Advanced Analytics & Forecasts" },
                { icon: <Download size={16} />, text: "Export Data (CSV, PDF, Excel)" },
                { icon: <RefreshCcw size={16} />, text: "Real-time Cloud Sync Priority" },
                { icon: <History size={16} />, text: "Unlimited Historical Data" }
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-white/5">
                  <div className="text-amber-400">{feature.icon}</div>
                  <span className="text-sm font-medium text-text">{feature.text}</span>
                  <CheckCircle2 size={16} className="ml-auto text-emerald-400" />
                </div>
              ))}
            </div>

            <div className="flex gap-4 w-full">
              <button 
                className="flex-1 btn btn-ghost h-12 font-semibold"
                onClick={() => setIsUpgradeModalOpen(false)}
              >
                May be later
              </button>
              <button 
                className="flex-[1.5] btn bg-amber-400 hover:bg-amber-500 text-slate-950 h-12 font-bold shadow-lg shadow-amber-400/20 rounded-xl flex items-center justify-center gap-2 group"
                onClick={async () => {
                  if (!user) return;
                  try {
                    logAnalyticsEvent('begin_checkout', { value: 10, currency: 'USD' });
                    const userRef = doc(db, 'users', user.uid);
                    await setDoc(userRef, { plan: 'premium' }, { merge: true });
                    setUserPlan('premium');
                    logAnalyticsEvent('purchase', { value: 10, currency: 'USD', transaction_id: `upg_${Date.now()}` });
                    setIsUpgradeModalOpen(false);
                  } catch (err) {
                    console.error("Upgrade failed:", err);
                    logAnalyticsEvent('upgrade_failed', { error: err.message });
                  }
                }}
              >
                Go Premium <ArrowRightLeft size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            
            <p className="mt-6 text-[10px] text-muted font-medium uppercase tracking-[0.2em]">
              Secure payment processed via Profit Studio
            </p>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={cn("sidebar", mobileSidebarOpen && "open")}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Landmark size={20} />
          </div>
          <span className="sidebar-brand">Expense Log Pro</span>
        </div>

        <div className={cn("plan-badge", userPlan === 'premium' && "premium")}>
          {userPlan === 'premium' ? <Crown size={12} /> : <Zap size={12} />}
          {userPlan} plan
        </div>

        <nav className="nav-container">
          <NavItem active={activePage === 'dashboard'} onClick={() => { setActivePage('dashboard'); setMobileSidebarOpen(false); }} icon={<LayoutDashboard size={18} />} label="Dashboard" collapsed={false} />
          <NavItem active={activePage === 'transactions'} onClick={() => { setActivePage('transactions'); setMobileSidebarOpen(false); }} icon={<ArrowRightLeft size={18} />} label="Transactions" collapsed={false} />
          <NavItem active={activePage === 'outstanding'} onClick={() => { setActivePage('outstanding'); setMobileSidebarOpen(false); }} icon={<Clock size={18} />} label="Outstanding" collapsed={false} />
          <NavItem active={activePage === 'monthly'} onClick={() => { setActivePage('monthly'); setMobileSidebarOpen(false); }} icon={<BarChart3 size={18} />} label="Monthly" collapsed={false} />
          <NavItem active={activePage === 'accounts'} onClick={() => { setActivePage('accounts'); setMobileSidebarOpen(false); }} icon={<Landmark size={18} />} label="Accounts" collapsed={false} />
          <NavItem active={activePage === 'settings'} onClick={() => { setActivePage('settings'); setMobileSidebarOpen(false); }} icon={<Settings size={18} />} label="Settings" collapsed={false} />
        </nav>
        
        <div className="sidebar-footer">
          <div className="footer-buttons">
            {userPlan === 'free' && (
              <button 
                onClick={() => setIsUpgradeModalOpen(true)}
                className="footer-btn upgrade"
              >
                <Crown size={16} />
                Upgrade to Pro
              </button>
            )}
          </div>
        </div>
      </aside>

      <main className="main-content">
        <div className="w-full max-w-6xl mx-auto">
        
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
                  amount: '',
                  category: 'Expenses',
                  subCategory: CATEGORY_MAP_T['Expenses'][0],
                  desc: '',
                  notes: '',
                  Accounts: ACCOUNTS_LIST[0],
                  state: 'Payable',
                  status: 'Pending',
                  name: '', type: 'Current', balance: '', standardBalance: '', month: format(new Date(), 'yyyy-MM')
                });
                setShowModal('transaction'); 
              }}
              title="Add Entry"
            >
              <Plus size={16} />
              <span className="hidden md:inline">Add Entry</span>
            </button>
          </div>

          <div className="stats-grid">
            <StatCard type="income" label="Income" value={dashboardStats.t.Income} count={dashboardStats.c.Income} trend="up" icon={<ArrowDownCircle size={18} />} />
            <StatCard type="expense" label="Expenses" value={dashboardStats.t.Expenses} count={dashboardStats.c.Expenses} trend="down" icon={<ArrowUpCircle size={18} />} />
            <StatCard type="credit" label="Credit" value={dashboardStats.t.Credit} count={dashboardStats.c.Credit} trend="up" icon={<CreditCard size={18} />} />
            <StatCard type="bills" label="Bills" value={dashboardStats.t.Bills} count={dashboardStats.c.Bills} trend="down" icon={<Receipt size={18} />} />
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
                  className="hidden md:flex btn btn-primary btn-sm items-center justify-center min-w-[36px] px-3" 
                  onClick={() => { 
                    setEditId(null); 
                    setFormData({
                      date: lastEnteredTxDate,
                      amount: '',
                      category: 'Expenses',
                      subCategory: CATEGORY_MAP_T['Expenses'][0],
                      desc: '',
                      notes: '',
                      Accounts: ACCOUNTS_LIST[0],
                      state: 'Payable',
                      status: 'Pending',
                      name: '', type: 'Current', balance: '', standardBalance: '', month: format(new Date(), 'yyyy-MM')
                    });
                    setShowModal('transaction'); 
                  }}
                  title="Add Entry"
                >
                  <Plus size={16} />
                  <span className="hidden md:inline ml-1">Add Entry</span>
                </button>

                {!isEditingTransactions && (
                  <button
                    className="flex btn btn-sm items-center justify-center min-w-[36px] w-9 md:w-auto p-0 md:px-4 rounded-xl shadow-sm transition-all focus:outline-none flex-shrink-0 bg-[#c84b2f] hover:brightness-110 text-white border-0"
                    onClick={() => {
                      setIsEditingTransactions(true);
                      setSelectedTransactions(new Set());
                    }}
                    title="Edit Transactions"
                  >
                    <Edit3 size={16} className="md:hidden flex-shrink-0" /><span className="hidden md:inline font-semibold">Edit</span>
                  </button>
                )}

                <button 
                  className={cn("btn btn-ghost btn-sm flex items-center justify-center min-w-[36px] px-2 md:px-3 h-9 relative", (showFilters || showSearch) && "bg-accent/10 text-accent")} 
                  onClick={() => {
                    setShowFilters(!showFilters);
                    setShowSearch(!showFilters);
                  }}
                  title="Filter & Search"
                >
                  <Filter size={16} />
                  <span className="hidden md:inline ml-1">Filter</span>
                </button>

                <button 
                  className="btn btn-ghost btn-sm flex items-center justify-center min-w-[36px] px-2 md:px-3 h-9 relative group"
                  onClick={handleExport}
                  title="Export Data (Premium)"
                >
                  <Download size={16} className={cn(userPlan === 'free' && "text-muted")} />
                  <span className={cn("hidden md:inline ml-1", userPlan === 'free' && "text-muted")}>Export</span>
                  {userPlan === 'free' && <Lock size={10} className="absolute -top-0.5 -right-0.5 text-amber-500 bg-slate-900 rounded-full p-0.5" />}
                </button>

              </div>
            </div>

            {isEditingTransactions && (
              <div className="edit-toolbar-container animate-in fade-in slide-in-from-top-2">
                <button 
                  className="flex-1 btn btn-sm bg-yellow-500 hover:bg-yellow-600 text-white h-9 font-bold rounded-xl border-0 shadow-sm"
                  onClick={() => handleBulkStatusUpdate('Transactions', 'Pending')}
                  disabled={selectedTransactions.size === 0 || syncing}
                >
                  Pending
                </button>
                <button 
                  className="flex-1 btn btn-sm bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl border-0 shadow-sm"
                  onClick={() => handleBulkDelete('Transactions')}
                  disabled={selectedTransactions.size === 0 || syncing}
                >
                  Delete
                </button>
                <button 
                  className="flex-1 btn btn-sm btn-ghost text-muted font-semibold rounded-xl hover:bg-surface/50"
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
               <div id="transaction-toolbar" className="table-toolbar flex flex-col gap-1.5 p-2 md:p-3 border-b border-border/40 bg-surface/30">
                {(showSearch || (showFilters && window.innerWidth < 768)) && (
                  <div className="relative w-full transition-all">
                    <input 
                      id="transaction-search-input"
                      className="search-box w-full px-4" 
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
                    <select id="filter-timeline" className="filter-select flex-1 min-w-[120px]" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
                      <option value="">Timeline</option>
                      {past10Months.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                    {(filterCat || filterSubCat || filterAcc || filterMonth) && (
                      <button 
                        id="clear-filters-btn"
                        className="btn btn-ghost btn-sm min-w-[36px] flex items-center justify-center text-accent bg-accent/5" 
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
                      key={`tx-row-${r.ID || i}`} 
                      className={cn(
                        "cursor-pointer border-b border-border/40 transition-colors", 
                        isEditingTransactions && "editing-mode",
                        selectedTransactions.has(String(r.ID)) ? "selected" : "hover:bg-surface/50"
                      )}
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
                            Accounts: r.Accounts || 'Bank of Baroda',
                            notes: r.Notes || '',
                            desc: r.Desc || '',
                            state: r.State || 'Payable',
                            status: r.Status || 'Processed',
                            name: '', bank: '', type: 'Current', balance: '', standardBalance: '', month: ''
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
                  className="hidden md:flex btn btn-primary btn-sm items-center justify-center min-w-[36px] px-3" 
                  onClick={() => {
                    setEditId(null);
                    setFormData({
                      date: lastEnteredTxDate,
                      amount: '',
                      category: 'Expenses',
                      subCategory: 'Payment',
                      desc: '',
                      notes: '',
                      Accounts: 'Bank of Baroda',
                      state: filterState as any,
                      status: 'Pending',
                      name: '', type: 'Current', balance: '', standardBalance: '', month: format(new Date(), 'yyyy-MM')
                    });
                    setShowModal('outstanding');
                  }}
                  title="Add Entry"
                >
                  <Plus size={16} />
                  <span className="hidden md:inline ml-1">Add Entry</span>
                </button>

                {!isEditingOutstanding && (
                  <button
                    className="flex btn btn-sm items-center justify-center min-w-[36px] w-9 md:w-auto p-0 md:px-4 rounded-xl shadow-sm transition-all focus:outline-none flex-shrink-0 bg-[#c84b2f] hover:brightness-110 text-white border-0"
                    onClick={() => {
                      setIsEditingOutstanding(true);
                      setSelectedOutstanding(new Set());
                    }}
                    title="Edit Outstanding"
                  >
                    <Edit3 size={16} className="md:hidden flex-shrink-0" /><span className="hidden md:inline font-semibold">Edit</span>
                  </button>
                )}

                <button 
                  className={cn("btn btn-ghost btn-sm flex items-center justify-center min-w-[36px] px-2 md:px-3", (showOutFilters || showOutSearch) && "bg-accent/10 text-accent")} 
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
              <div className="edit-toolbar-container animate-in fade-in slide-in-from-top-2">
                <button 
                  className="flex-1 btn btn-sm bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl border-0 shadow-sm"
                  onClick={() => handleBulkStatusUpdate('Outstanding', 'Processed')}
                  disabled={selectedOutstanding.size === 0 || syncing}
                >
                  Processed
                </button>
                <button 
                  className="flex-1 btn btn-sm bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl border-0 shadow-sm"
                  onClick={() => handleBulkDelete('Outstanding')}
                  disabled={selectedOutstanding.size === 0 || syncing}
                >
                  Delete
                </button>
                <button 
                  className="flex-1 btn btn-sm btn-ghost text-muted font-semibold rounded-xl hover:bg-surface/50"
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
               <div id="outstanding-toolbar" className="table-toolbar flex flex-col gap-1.5 p-2 md:p-3 border-b border-border/40 bg-surface/30">
                {(showOutSearch || (showOutFilters && window.innerWidth < 768)) && (
                  <div className="relative w-full transition-all">
                    <input 
                      id="outstanding-search-input"
                      className="search-box w-full px-4" 
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
                  <div id="outstanding-filters" className="flex flex-wrap gap-2 w-full animate-in fade-in slide-in-from-top-1">
                    <select className="filter-select flex-1 h-9 min-w-[120px]" value={outFilterState} onChange={e => setOutFilterState(e.target.value)}>
                      <option value="">All States</option>
                      <option>Payable</option><option>Receivable</option>
                    </select>
                    <select className="filter-select flex-1 h-9 min-w-[120px]" value={outFilterCat} onChange={e => { setOutFilterCat(e.target.value); setOutFilterSubCat(''); }}>
                      <option value="">All Categories</option>
                      {Object.keys(CATEGORY_MAP_O).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select className="filter-select flex-1 h-9 min-w-[120px]" value={outFilterSubCat} onChange={e => setOutFilterSubCat(e.target.value)}>
                      <option value="">All Sub-Categories</option>
                      {outFilterCat && CATEGORY_MAP_O[outFilterCat] ? CATEGORY_MAP_O[outFilterCat].map(sc => <option key={sc} value={sc}>{sc}</option>) : null}
                    </select>
                    <select id="out-filter-timeline" className="filter-select flex-1 h-9 min-w-[120px]" value={outFilterMonth} onChange={e => setOutFilterMonth(e.target.value)}>
                      <option value="">Timeline</option>
                      {past10Months.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                    {(outFilterState || outFilterMonth || outFilterCat || outFilterSubCat) && (
                      <button 
                        className="btn btn-ghost btn-sm min-w-[36px] flex items-center justify-center text-accent bg-accent/5" 
                        onClick={() => { setOutFilterState(''); setOutFilterMonth(''); setOutFilterCat(''); setOutFilterSubCat(''); }}
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
                      className={cn(
                        "cursor-pointer border-b border-border/40 transition-colors", 
                        isEditingOutstanding && "editing-mode",
                        (r as any).ID && selectedOutstanding.has(String((r as any).ID)) ? "selected" : "hover:bg-surface/50"
                      )}
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
                            Accounts: r.Accounts || 'Bank of Baroda',
                            name: '', type: 'Current', balance: '', standardBalance: '', month: ''
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
                          "outstanding-state",
                          (r as any).State === 'Payable' ? "payable" : "receivable"
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
        <section className={cn("page-container", activePage === 'monthly' && "active")}>
          <div className="page-header flex flex-col gap-4">
            <div className="flex flex-row items-center justify-between gap-4 w-full">
              <div>
                <div className="page-title">Monthly<span>.</span></div>
                <div className="page-sub">Historical flow overview</div>
              </div>
              <div className="flex gap-2">
                {userPlan === 'free' ? (
                  <button 
                    onClick={() => setIsUpgradeModalOpen(true)}
                    className="btn btn-sm bg-amber-400/10 text-amber-400 border border-amber-400/20 flex items-center gap-2 px-3 hover:bg-amber-400/20 transition-all"
                  >
                    <Crown size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Advanced Insights</span>
                    <Lock size={12} />
                  </button>
                ) : (
                  <button className="btn btn-sm bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 flex items-center gap-2 px-3">
                    <Gem size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">PRO Analytics Active</span>
                  </button>
                )}
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
              <div className="flex gap-2 items-center">
                <select className="filter-select min-w-[120px]" value={accFilterMonth} onChange={e => setAccFilterMonth(e.target.value)}>
                  {past10Months.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              <button 
                className="hidden md:flex btn btn-primary btn-sm items-center justify-center min-w-[36px] px-3" 
                onClick={() => { 
                  setEditId(null); 
                  setFormData({
                    ...formData,
                    date: new Date().toISOString().slice(0, 10),
                    amount: '',
                    name: '', type: 'Current', balance: '', standardBalance: ''
                  });
                  setShowModal('account'); 
                }}
                title="Add Account"
              >
                <Plus size={16} />
                <span className="hidden md:inline ml-1">Add Account</span>
              </button>
              {!isEditingAccounts && (
                <button
                  className="flex btn items-center justify-center w-9 md:w-auto p-0 md:px-4 rounded-xl shadow-sm transition-all focus:outline-none flex-shrink-0 bg-[#c84b2f] hover:brightness-110 text-white border-0"
                  onClick={() => setIsEditingAccounts(true)}
                  title="Edit Accounts"
                >
                  <Edit3 size={16} className="md:hidden flex-shrink-0" /><span className="hidden md:inline font-semibold">Edit</span>
                </button>
              )}
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
                          {(() => {
                            const accTx = transactions.filter(r => r.Accounts === name && r.Date.startsWith(accFilterMonth));
                            let currentMonthBalance = 0;
                            accTx.forEach(r => {
                              if (r.Category === 'Income') currentMonthBalance += r.Amount;
                              else currentMonthBalance -= r.Amount;
                            });
                            return fmt(currentMonthBalance);
                          })()}
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

        {/* Settings */}
        <section className={cn("page-container", activePage === 'settings' && "active")}>
          <div className="page-header">
            <div>
              <div className="page-title">Settings<span>.</span></div>
              <div className="page-sub">Manage your profile and preferences</div>
            </div>
          </div>
          <div className="settings-grid">
            {/* Profile Section */}
            <div className="settings-card">
              <div className="settings-section-title">
                <div className="settings-section-icon"><User size={16} /></div>
                Profile
              </div>
              <div className="profile-info-list">
                <div className="profile-info-item">
                  <span className="profile-info-label">Name</span>
                  <span className="profile-info-value">{user?.name || user?.displayName || 'N/A'}</span>
                </div>
                <div className="profile-info-item">
                  <span className="profile-info-label">Email</span>
                  <span className="profile-info-value">{user?.email}</span>
                </div>
                <div className="profile-info-item">
                  <span className="profile-info-label">User ID</span>
                  <div className="flex items-center gap-2">
                    <span className="profile-info-value font-mono text-[var(--accent)]">@{user?.userId || 'not_set'}</span>
                    <button 
                      onClick={() => {
                        setNewUserId(user?.userId || '');
                        setShowModal('set-userid');
                      }}
                      className="text-[10px] font-bold uppercase tracking-wider text-muted hover:text-[var(--accent)] transition-colors"
                    >
                      Change
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Preferences Section */}
            <div className="settings-card">
              <div className="settings-section-title">
                <div className="settings-section-icon"><Zap size={16} /></div>
                Preferences
              </div>
              <div className="space-y-1">
                <div className="settings-option">
                  <div className="settings-option-info">
                    <span className="settings-option-label">Dark Mode</span>
                    <span className="settings-option-sub">Switch to dark interface theme</span>
                  </div>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={isDark} 
                      onChange={() => setIsDark(!isDark)} 
                    />
                    <span className="slider"></span>
                  </label>
                </div>
                <div className="settings-option">
                  <div className="settings-option-info">
                    <span className="settings-option-label">Notifications</span>
                    <span className="settings-option-sub">Receive alerts for budget limits</span>
                  </div>
                  <label className="switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
            </div>

            {/* Account Section */}
            <div className="settings-card">
              <div className="settings-section-title">
                <div className="settings-section-icon"><LogOut size={16} /></div>
                Account
              </div>
              <div className="profile-info-list">
                <div className="profile-info-item">
                  <span className="profile-info-label">Plan Type</span>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md", userPlan === 'premium' ? "bg-amber-400/10 text-amber-500" : "bg-slate-200 text-slate-500")}>
                      {userPlan} Plan
                    </span>
                    {userPlan === 'free' && (
                      <button 
                        onClick={() => setIsUpgradeModalOpen(true)}
                        className="text-[10px] font-bold uppercase tracking-wider text-amber-500 hover:underline"
                      >
                        Upgrade Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="sign-out-btn-wrap">
                <button 
                  onClick={() => signOut(auth)}
                  className="btn-signout-full"
                >
                  <LogOut size={18} />
                  Sign Out
                </button>
              </div>
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
              <div className="modal-title m-0">
                {showModal === 'account-history' ? `${selectedAccount} History` : 
                  `${editId ? 'Edit' : 'Add'} ${showModal.charAt(0).toUpperCase() + showModal.slice(1)}`}
              </div>
                <button className="text-muted hover:text-text p-2 -mr-2" onClick={() => setShowModal(null)}><X size={18} /></button>
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
                    <input className="form-input" type="number" placeholder="" value={formData.balance} onChange={e => setFormData({ ...formData, balance: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Standard Balance (₹)</label>
                    <input className="form-input" type="number" placeholder="" value={formData.standardBalance} onChange={e => setFormData({ ...formData, standardBalance: e.target.value })} />
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
                {showModal === 'transaction' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="form-group">
                        <label className="form-label">Date</label>
                        <input className="form-input" type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Amount (₹)</label>
                        <input className="form-input" type="number" placeholder="" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Category</label>
                        <select className="form-input" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value as any })}>
                          {Object.keys(CATEGORY_MAP_T).map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="form-group">
                        <label className="form-label">Sub-Category</label>
                        <select className="form-input" value={formData.subCategory} onChange={e => setFormData({ ...formData, subCategory: e.target.value })}>
                          {CATEGORY_MAP_T[formData.category]?.map(sc => <option key={sc}>{sc}</option>) || <option value="">None</option>}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Desc</label>
                        <input className="form-input" type="text" placeholder="e.g. LIC Premium" value={formData.desc} onChange={e => setFormData({ ...formData, desc: e.target.value })} />
                      </div>
                    </div>
                  </>
                )}
                {showModal === 'outstanding' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="form-group">
                        <label className="form-label">Date</label>
                        <input className="form-input" type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Amount (₹)</label>
                        <input className="form-input" type="number" placeholder="" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">State</label>
                        <select className="form-input" value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value as any })}>
                          <option>Payable</option>
                          <option>Receivable</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="form-group">
                        <label className="form-label">Category</label>
                        <select className="form-input" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value as any })}>
                          {Object.keys(CATEGORY_MAP_O).map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Sub-Category</label>
                        <select className="form-input" value={formData.subCategory} onChange={e => setFormData({ ...formData, subCategory: e.target.value })}>
                          {CATEGORY_MAP_O[formData.category]?.map(sc => <option key={sc}>{sc}</option>) || <option value="">None</option>}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Desc</label>
                        <input className="form-input" type="text" placeholder="e.g. LIC Premium" value={formData.desc} onChange={e => setFormData({ ...formData, desc: e.target.value })} />
                      </div>
                    </div>
                  </>
                )}
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
        {['transactions', 'dashboard', 'monthly', 'accounts'].includes(activePage) && (
          <button 
            className="fab"
            onClick={() => {
              if (activePage === 'accounts') {
                setEditId(null); 
                setFormData({
                  ...formData,
                  date: new Date().toISOString().slice(0, 10),
                  amount: '',
                  name: '', bank: '', type: 'Current', balance: '', standardBalance: ''
                });
                setShowModal('account'); 
              } else {
                setEditId(null);
                setFormData({
                  date: lastEnteredTxDate,
                  amount: '',
                  category: 'Expenses',
                  subCategory: CATEGORY_MAP_T['Expenses'][0],
                  desc: '',
                  notes: '',
                  Accounts: ACCOUNTS_LIST[0],
                  state: 'Payable',
                  status: 'Pending',
                  name: '', bank: '', type: 'Current', balance: '', standardBalance: ''
                });
                setShowModal('transaction');
              }
            }}
          >
            <Plus size={24} strokeWidth={3} />
          </button>
        )}
        {activePage === 'outstanding' && (
          <button 
            className="fab"
            onClick={() => {
                setEditId(null);
                setFormData({
                  date: lastEnteredTxDate,
                  amount: '',
                  category: 'Expenses',
                  subCategory: 'Payment',
                  desc: '',
                  notes: '',
                  Accounts: 'Bank of Baroda',
                  state: filterState as any,
                  status: 'Pending',
                  name: '', bank: '', type: 'Current', balance: '', standardBalance: '', month: format(new Date(), 'yyyy-MM')
                });
                setShowModal('outstanding');
            }}
          >
            <Plus size={24} strokeWidth={3} />
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
    <motion.div 
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      className={cn("nav-item", active && "active")} 
      onClick={onClick} 
      title={collapsed ? label : undefined}
    >
      <span className="nav-icon transition-transform duration-300">{icon}</span>
      <span className="nav-label">{label}</span>
    </motion.div>
  );
}

function StatCard({ type, label, value, count, trend, icon }: { type: string; label: string; value: number; count: number; trend?: 'up' | 'down', icon: ReactNode }) {
  return (
    <div className={cn("stat-card", type)}>
      <div className="stat-header">
        <div className="stat-icon">{icon}</div>
        {trend && (
          <div className={cn("text-[10px] font-bold p-1 rounded-sm", trend === 'up' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>
            {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          </div>
        )}
      </div>
      <div className="stat-content">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{fmt(value)}</div>
        <div className="stat-count">{count} entries this month</div>
      </div>
    </div>
  );
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { 
      bodyFont: { family: 'Inter' },
      padding: 12,
      backgroundColor: '#0f172a',
      titleFont: { family: 'Inter', weight: 'bold' as const },
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1
    }
  },
  scales: {
    x: { 
      ticks: { color: '#64748b', font: { family: 'Inter', size: 10 } },
      grid: { display: false }
    },
    y: { 
      ticks: { color: '#64748b', font: { family: 'Inter', size: 10 }, callback: (v: any) => '₹' + v },
      grid: { color: 'rgba(100,116,139,0.1)' }
    }
  }
};

const donutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { 
      position: 'bottom' as const,
      labels: { color: '#64748b', font: { family: 'Inter', size: 10 }, padding: 16, usePointStyle: true } 
    }
  },
  cutout: '75%'
};
