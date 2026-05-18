/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef, useCallback, ReactNode } from 'react';
import { auth, db, storage, setAnalyticsUserPlan, logAnalyticsEvent } from './firebase';
import { onAuthStateChanged, signOut, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import SignIn from './SignIn';
import SignUp from './SignUp';
import { Transaction, Outstanding, PageView, Account, FinancialRecord } from './types';
import { fetchTransactions, fetchOutstanding, saveTransaction, fetchAccounts } from './api';
import { setSupabaseToken, setSupabaseUser } from './supabase';
import { 
  ArrowUp,
  ArrowDown,
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
  AlertCircle,
  Lock,
  ArrowUpRight,
  ArrowDownRight,
  ArrowDownLeft,
  Key,
  ShieldCheck,
  Monitor,
  RefreshCcw,
  History,
  Edit3,
  ArrowDownCircle,
  ArrowUpCircle,
  Receipt,
  CreditCard,
  X,
  AtSign,
  User,
  Bell,
  Shield,
  HelpCircle,
  Info,
  Wallet,
  Smartphone,
  Globe,
  PieChart,
  Languages,
  ArrowRight,
  UserPlus,
  Camera,
  Construction,
  FileText,
  TrendingUp
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
import { motion, useAnimation, useMotionValue, useTransform } from 'motion/react';
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

function ProfileInternalNavItem({ active, onClick, icon, label, badge }: { active: boolean, onClick: () => void, icon: ReactNode, label: string, badge?: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn("profile-nav-item-internal", active && "active")}
    >
      <div className="nav-icon-wrap">
        <span className="nav-icon">{icon}</span>
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {badge && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600 uppercase tracking-wider">{badge}</span>}
        <ChevronRight size={14} className="chevron" />
      </div>
    </button>
  );
}

function ProfileItemLink({ icon, label, value }: { icon: ReactNode, label: string, value: string }) {
  return (
    <div className="profile-option py-6 group cursor-pointer">
      <div className="profile-nav-item-internal border-none p-0 w-full hover:bg-transparent">
        <div className="nav-icon-wrap">
          <span className="nav-icon opacity-60 group-hover:opacity-100 transition-opacity">{icon}</span>
          <div className="flex flex-col">
            <span className="profile-option-label text-base">{label}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-indigo-600">{value}</span>
          <ChevronRight size={16} className="chevron" />
        </div>
      </div>
    </div>
  );
}

function AboutLink({ icon, label }: { icon: ReactNode, label: string }) {
  return (
    <div className="about-link-item">
      <div className="about-link-info">
        <span className="about-link-icon">{icon}</span>
        <span>{label}</span>
      </div>
      <ChevronRight size={16} className="chevron" />
    </div>
  );
}

export const AppLogo = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Rupee Coin (Silver) */}
    <circle cx="50" cy="35" r="22" fill="url(#coin-grad)" stroke="#CBD5E1" strokeWidth="1.5" />
    <circle cx="50" cy="35" r="18" fill="transparent" stroke="#F1F5F9" strokeWidth="1.5" />
    <text x="50.5" y="44" fontSize="26" fontFamily="Inter, sans-serif" fontWeight="800" fill="#64748B" textAnchor="middle">₹</text>
    
    {/* Wallet Back */}
    <rect x="15" y="45" width="70" height="45" rx="8" fill="#1e3a8a" />
    
    {/* Wallet Front Flap */}
    <path d="M15 55 C15 50 18 45 25 45 H75 C82 45 85 50 85 55 V82 C85 86.418 81.418 90 77 90 H23 C18.582 90 15 86.418 15 82 V55 Z" fill="url(#wallet-grad)" />
    
    {/* Wallet Clip */}
    <rect x="75" y="60" width="12" height="16" rx="4" fill="#3B82F6" stroke="#2563EB" strokeWidth="1"/>
    <circle cx="81" cy="68" r="2.5" fill="#E2E8F0" />
    
    {/* Chart Bars */}
    <rect x="28" y="72" width="6" height="10" rx="1.5" fill="#E2E8F0" />
    <rect x="38" y="66" width="6" height="16" rx="1.5" fill="#E2E8F0" />
    <rect x="48" y="58" width="6" height="24" rx="1.5" fill="#E2E8F0" />
    <rect x="58" y="64" width="6" height="18" rx="1.5" fill="#E2E8F0" />
    
    {/* Chart Arrow */}
    <path d="M 28 68 L 38 58 L 48 64 L 62 48" stroke="#F8FAFC" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M 54 48 L 62 48 L 62 56" stroke="#F8FAFC" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    
    <defs>
      <linearGradient id="wallet-grad" x1="15" y1="45" x2="85" y2="90" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3B82F6" />
        <stop offset="1" stopColor="#1E3A8A" />
      </linearGradient>
      <linearGradient id="coin-grad" x1="28" y1="13" x2="72" y2="57" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F8FAFC" />
        <stop offset="0.5" stopColor="#E2E8F0" />
        <stop offset="1" stopColor="#94A3B8" />
      </linearGradient>
    </defs>
  </svg>
);

const MobileTransactionRow = ({ r, onSwipe, onClick }: { key?: string | number, r: any, onSwipe: (action: 'pending'|'delete') => void, onClick: () => void }) => {
   const controls = useAnimation();
   const x = useMotionValue(0);
   const leftOpacity = useTransform(x, [0, 20], [0, 1]);
   const rightOpacity = useTransform(x, [0, -20], [0, 1]);
   const startTouch = useRef({ x: 0, y: 0 });
   
   const handleDragEnd = async (event: any, info: any) => {
      const offset = info.offset.x;
      const velocity = info.velocity.x;
      if (offset > 100 || velocity > 500) {
         // Pending (yellow)
         await controls.start({ x: window.innerWidth, transition: { duration: 0.2 }, opacity: 0 });
         onSwipe('pending');
      } else if (offset < -100 || velocity < -500) {
         // Delete (red)
         await controls.start({ x: -window.innerWidth, transition: { duration: 0.2 }, opacity: 0 });
         onSwipe('delete');
      } else {
         controls.start({ x: 0, opacity: 1, transition: { type: 'spring', bounce: 0.5 } });
      }
   };

   return (
      <div className="relative w-full rounded-3xl overflow-hidden mb-4 shadow-md bg-white dark:bg-slate-900 border border-outline h-[92px]">
         {/* Underlying layer */}
         <div className="absolute inset-0 flex bg-transparent">
            {/* Left part (Pending) yellow */}
            <motion.div style={{ opacity: leftOpacity }} className="flex-1 bg-[#f69300] flex items-center justify-start px-6 text-white font-bold h-full border-r border-[#f69300]">
               <AlertCircle size={24} className="mr-2" /> Pending
            </motion.div>
            {/* Right part (Delete) red */}
            <motion.div style={{ opacity: rightOpacity }} className="flex-1 bg-[#eb0038] flex items-center justify-end px-6 text-white font-bold h-full border-l border-[#eb0038]">
               Delete <Trash2 size={24} className="ml-2" />
            </motion.div>
         </div>
         
         <motion.div
            style={{ x }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.8}
            onDragEnd={handleDragEnd}
            animate={controls}
            whileTap={{ scale: 0.98 }}
            className="absolute inset-0 glass-card p-5 flex items-center justify-between border-transparent w-full h-[92px] z-10 m-0 rounded-3xl"
            onPointerDown={(e) => {
               startTouch.current = { x: e.clientX, y: e.clientY };
            }}
            onClickCapture={(e) => {
               const deltaX = Math.abs(e.clientX - startTouch.current.x);
               // We only care about horizontal swipe threshold blocking click
               if (deltaX > 10) {
                  e.stopPropagation();
                  e.preventDefault();
                  return;
               }
               onClick();
            }}
         >
            <div className="flex items-center gap-4">
               <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110", r.Category === 'Income' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500')}>
                  <Receipt size={22} />
               </div>
               <div>
                  <div className="text-sm font-bold text-on-surface">{r['Sub-Category'] || r.Category}</div>
                  <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{fmtDate(r.Date)}</div>
               </div>
            </div>
            <div className="text-right">
               <div className={cn("text-base font-black", r.Category === 'Income' ? 'text-emerald-600' : 'text-on-surface')}>
                  {r.Category === 'Income' ? '+' : '-'}{fmt(r.Amount)}
               </div>
               <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-0.5">{r.Category}</div>
            </div>
         </motion.div>
      </div>
   );
};

const MobileOutstandingRow = ({ r, onSwipe, onClick }: { key?: string | number, r: any, onSwipe: (action: 'process'|'delete') => void, onClick: () => void }) => {
   const controls = useAnimation();
   const x = useMotionValue(0);
   const leftOpacity = useTransform(x, [0, 20], [0, 1]);
   const rightOpacity = useTransform(x, [0, -20], [0, 1]);
   const startTouch = useRef({ x: 0, y: 0 });
   
   const handleDragEnd = async (event: any, info: any) => {
      const offset = info.offset.x;
      const velocity = info.velocity.x;
      if (offset > 100 || velocity > 500) {
         // Processed (green)
         await controls.start({ x: window.innerWidth, transition: { duration: 0.2 }, opacity: 0 });
         onSwipe('process');
      } else if (offset < -100 || velocity < -500) {
         // Delete (red)
         await controls.start({ x: -window.innerWidth, transition: { duration: 0.2 }, opacity: 0 });
         onSwipe('delete');
      } else {
         controls.start({ x: 0, opacity: 1, transition: { type: 'spring', bounce: 0.5 } });
      }
   };

   return (
      <div className="relative w-full rounded-3xl overflow-hidden mb-4 shadow-md bg-white dark:bg-slate-900 border border-outline h-[92px]">
         {/* Underlying layer */}
         <div className="absolute inset-0 flex bg-transparent">
            {/* Left part (Process) green */}
            <motion.div style={{ opacity: leftOpacity }} className="flex-1 bg-[#00a76e] flex items-center justify-start px-6 text-white font-bold h-full border-r border-[#00a76e]">
               <CheckCircle2 size={24} className="mr-2" /> Processed
            </motion.div>
            {/* Right part (Delete) red */}
            <motion.div style={{ opacity: rightOpacity }} className="flex-1 bg-[#eb0038] flex items-center justify-end px-6 text-white font-bold h-full border-l border-[#eb0038]">
               Delete <Trash2 size={24} className="ml-2" />
            </motion.div>
         </div>
         
         <motion.div
            style={{ x }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.8}
            onDragEnd={handleDragEnd}
            animate={controls}
            whileTap={{ scale: 0.98 }}
            className="absolute inset-0 glass-card p-5 flex items-center justify-between border-transparent w-full h-[92px] z-10 m-0 rounded-3xl"
            onPointerDown={(e) => {
               startTouch.current = { x: e.clientX, y: e.clientY };
            }}
            onClickCapture={(e) => {
               const deltaX = Math.abs(e.clientX - startTouch.current.x);
               // We only care about horizontal swipe threshold blocking click
               if (deltaX > 10) {
                  e.stopPropagation();
                  e.preventDefault();
                  return;
               }
               onClick();
            }}
         >
            <div className="flex items-center gap-4">
               <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border border-outline-variant", r.State === 'Receivable' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600')}>
                  {r.State === 'Receivable' ? <ArrowDownCircle size={22} /> : <ArrowUpCircle size={22} />}
               </div>
               <div>
                  <div className="text-sm font-bold text-on-surface">{r['Sub-Category'] || r.Desc || 'Unspecified'}</div>
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{fmtDate(r.Date)}</span>
                  </div>
               </div>
            </div>
            <div className="text-right">
               <div className="text-base font-black text-on-surface">{fmt(r.Amount)}</div>
            </div>
         </motion.div>
      </div>
   );
};

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
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
        // Set Supabase Token
        try {
          const token = await u.getIdToken();
          setSupabaseToken(token);
          setSupabaseUser(u.uid);
        } catch (e) {
          console.error("Failed to get Firebase token", e);
        }

        // Fetch/Initialize User from Firestore
        try {
          const userRef = doc(db, 'users', u.uid);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUser({ ...u, ...data });
            setUserPlan(data.plan || 'free');
          } else {
            // First time login (likely Google) - initialize basic profile
            const newUser = { 
              email: u.email, 
              name: u.displayName || '',
              plan: 'free', 
              createdAt: new Date().toISOString() 
            };
            await setDoc(userRef, newUser);
            setUser({ ...u, ...newUser });
            setUserPlan('free');
          }
        } catch (err) {
          console.error("❌ Error fetching user data:", err);
          setUser(u);
          setUserPlan('free');
        }
      } else {
        setSupabaseToken(null);
        setSupabaseUser(null);
        setUser(null);
        setUserPlan('free');
        setIsPreviewMode(true);
        // Clear data immediately for preview mode
        setTransactions([]);
        setOutstanding([]);
        setAccounts([]);
      }
      setIsAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleSignOut = async () => {
    try {
      if (isPreviewMode) {
        setIsPreviewMode(false);
        setUser(null);
        setActivePage('dashboard');
        return;
      }
      await signOut(auth);
      // Clean up state
      setUser(null);
      setUserPlan('free');
      setActivePage('dashboard');
      setProfileTab('overview');
      localStorage.removeItem('supabase.auth.token');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  // Force session establishment when user state is first established (handles already-logged-in cases)
  useEffect(() => {
    if (user && !isAuthLoading) {
      setIsPreviewMode(false);
      setShowAuthModal(false);
    }
  }, [user, isAuthLoading]);

  // Preview Mode Timer (10 seconds)
  useEffect(() => {
    if (isPreviewMode && !showAuthModal) {
      const timer = setTimeout(() => {
        setShowAuthModal(true);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [isPreviewMode, showAuthModal]);

  useEffect(() => {
    if (!isPreviewMode) return;

    const handleGlobalClick = (e: MouseEvent) => {
      // If modal is already open, don't intercept further (let user interact with modal)
      if (showAuthModal) return;

      const target = e.target as HTMLElement;
      // Don't intercept clicks inside the modal content
      if (target.closest('.modal-content')) return;
      

      // We don't necessarily want to preventDefault on everything (like scrolling),
      // but the user said "Show the Sign In interface". 
      // If we show it, it will cover the screen anyway.
      setShowAuthModal(true);
    };

    window.addEventListener('click', handleGlobalClick, true);
    return () => window.removeEventListener('click', handleGlobalClick, true);
  }, [isPreviewMode, showAuthModal]);


  const [syncing, setSyncing] = useState(false);
  const [activePage, setActivePageRaw] = useState<PageView>('dashboard');
  const previousPageRef = useRef<PageView>('dashboard');
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);

  // Track previous page for back navigation
  const setActivePage = useCallback((page: PageView) => {
    setActivePageRaw(prev => {
      previousPageRef.current = prev;
      return page;
    });
  }, []);

  const [outTab, setOutTab] = useState<'Payable' | 'Receivable'>('Payable');
  const [profileTab, setProfileTab] = useState<'overview' | 'account' | 'subscription' | 'wallet' | 'monthly' | 'notifications' | 'security' | 'preferences' | 'help' | 'about'>('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [outstanding, setOutstanding] = useState<Outstanding[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [showModal, setShowModal] = useState<'transaction' | 'outstanding' | 'account' | 'account-history' | null>(null);
  
  const [mobileUndoToast, setMobileUndoToast] = useState<{id: string, action: 'process'|'pending'|'delete', rowData: any, visible: boolean, sourceTable: 'Transactions'|'Outstanding'} | null>(null);
  const [hiddenMobileRows, setHiddenMobileRows] = useState<Set<string>>(new Set());
  const [pendingMobileActions, setPendingMobileActions] = useState<{[id: string]: NodeJS.Timeout}>({});

  const handleMobileSwipe = (item: any, action: 'process'|'pending'|'delete', sourceTable: 'Transactions'|'Outstanding' = 'Outstanding') => {
     const id = String(item.ID);
     setHiddenMobileRows(prev => new Set(prev).add(id));
     setMobileUndoToast({id, action, rowData: item, visible: true, sourceTable});

     const timeoutId = setTimeout(async () => {
        setMobileUndoToast(prev => prev && prev.id === id ? { ...prev, visible: false } : prev);
        try {
           if (action === 'process') {
              await moveRowBetweenTables(item, 'Outstanding', 'Transactions', 'Processed');
           } else if (action === 'pending') {
              await moveRowBetweenTables(item, 'Transactions', 'Outstanding', 'Pending');
           } else {
              const res = await saveTransaction({ action: 'delete', id, sheet: sourceTable });
              if (res.status !== 'ok') throw new Error(`Failed to delete ${id}`);
           }
           loadAllData(false);
        } catch (e) {
           console.error(e);
        }
        setPendingMobileActions(prev => { const n = {...prev}; delete n[id]; return n; });
     }, 4000);

     setPendingMobileActions(prev => ({ ...prev, [id]: timeoutId }));
  };

  const handleMobileUndo = () => {
     if (!mobileUndoToast || !mobileUndoToast.visible) return;
     const { id } = mobileUndoToast;
     if (pendingMobileActions[id]) {
        clearTimeout(pendingMobileActions[id]);
        setPendingMobileActions(prev => { const n = {...prev}; delete n[id]; return n; });
     }
     setHiddenMobileRows(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
     });
     setMobileUndoToast(prev => prev ? { ...prev, visible: false } : prev);
  };

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
    month: format(new Date(), 'yyyy-MM')
  });

  const [showSearch, setShowSearch] = useState(false);
  const [lastEnteredTxDate, setLastEnteredTxDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [showFilters, setShowFilters] = useState(false);
  const [showPremiumPrompt, setShowPremiumPrompt] = useState(false);
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
    if (user) {
      loadAllData();
    } else if (isPreviewMode) {
      // Data is already cleared in auth listener, but safety check
      if (transactions.length > 0) setTransactions([]);
      if (outstanding.length > 0) setOutstanding([]);
      if (accounts.length > 0) setAccounts([]);
      setLoading(false);
    }
  }, [user, isPreviewMode]);

  const loadAllData = async (showOverlay = true) => {
    if (!user) {
      setTransactions([]);
      setOutstanding([]);
      setAccounts([]);
      setLoading(false);
      setSyncing(false);
      return;
    }
    if (showOverlay) setLoading(true);
    setSyncing(true);
    try {
      const userId = user.uid;
      const [txData, outData, accData] = await Promise.all([
        fetchTransactions(userId).catch((err) => { console.warn('Failed to fetch transactions:', err); return []; }),
        fetchOutstanding(userId).catch((err) => { console.warn('Failed to fetch outstanding:', err); return []; }),
        fetchAccounts(userId).catch((err) => { console.warn('Failed to fetch accounts:', err); return []; }) // Handle missing sheet gracefully
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
      // Primary filter by active tab
      if (r.State !== filterState) return false;
      
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
  }, [outstanding, outSearch, filterState, outFilterMonth, outFilterCat, outFilterSubCat, outSort]);

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
        payload = { ...payload, sheet: 'Accounts', name: formData.name, bank: formData.bank, type: formData.type, balance: parseFloat(formData.balance) || 0, Month: formData.month };
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
    
    if (!window.confirm(`Are you sure you want to delete ${selected.size} entries?`)) return;

    setSyncing(true);
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
    return {
      labels: chartMonths.map(m => {
        const dt = parseISO(m + '-01');
        return isValid(dt) ? format(dt, 'MMM yy') : m;
      }),
      datasets: [
        {
          label: 'Expenses',
          data: chartMonths.map(m => transactions.filter(r => r.Date.startsWith(m) && r.Category === 'Expenses').reduce((sum, r) => sum + r.Amount, 0)),
          borderColor: '#f43f5e',
          backgroundColor: 'rgba(244, 63, 94, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointRadius: 4,
          pointBackgroundColor: '#f43f5e',
        },
        {
          label: 'Income',
          data: chartMonths.map(m => transactions.filter(r => r.Date.startsWith(m) && r.Category === 'Income').reduce((sum, r) => sum + r.Amount, 0)),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointRadius: 4,
          pointBackgroundColor: '#10b981',
        }
      ]
    };
  }, [transactions, months]);

  const donutData = useMemo(() => {
    return {
      labels: ['Rent', 'Food', 'Transport', 'Utilities', 'Fun'],
      datasets: [{
        data: [2100, 850, 520, 180, 120],
        backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#f43f5e'],
        borderWidth: 0,
        hoverOffset: 15
      }]
    };
  }, []);

  const LoadingScreen = ({ message = "Loading..." }: { message?: string }) => (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white dark:bg-[#0f172a] z-[9999]">
      <style>{`
        @keyframes indeterminate {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
      <div className="w-[124px] mb-6 relative">
        <AppLogo className="w-full h-auto drop-shadow-2xl" />
      </div>
      <div className="w-[200px] h-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden mb-4 relative drop-shadow-sm">
        <div 
          className="absolute top-0 left-0 h-full w-1/2 bg-primary rounded-full" 
          style={{ animation: 'indeterminate 1.5s ease-in-out infinite' }}
        ></div>
      </div>
      <div className="text-slate-700 dark:text-slate-300 font-medium text-[15px] tracking-wide mt-1">
        {message}
      </div>
    </div>
  );

  if (isAuthLoading) {
    return <LoadingScreen />;
  }

  if (!user && !isPreviewMode) {
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
    return <LoadingScreen message="Loading..." />;
  }

  return (
    <div className={cn(
      "w-full min-h-screen lg:h-screen lg:overflow-hidden flex font-sans text-on-surface bg-white dark:bg-slate-950 transition-colors duration-500",
      isDark ? "dark" : "",
      isPreviewMode && "isPreviewMode",
      showAuthModal && "modal-open"
    )}>
      
      {/* Desktop Sidebar (Original styling) */}
      <aside className={cn(
        "hidden lg:flex flex-col bg-white dark:bg-slate-950 border-r border-outline transition-all duration-500 z-50 h-screen shrink-0 relative",
        isSidebarCollapsed ? "w-20" : "w-[210px]"
      )}>
        <div className="p-8 flex items-center gap-3 mb-4 overflow-hidden">
           <div className="w-[48px] h-[48px] flex items-center justify-center shrink-0 drop-shadow-sm">
              <AppLogo className="w-full h-full" />
           </div>
           {!isSidebarCollapsed && (
             <div className="flex flex-col text-on-surface">
                <span className="font-extrabold text-[19px] tracking-tight leading-none">Expense</span>
                <span className="font-extrabold text-[19px] tracking-tight leading-tight">Log Pro</span>
             </div>
           )}
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
           <NavItem active={activePage === 'dashboard'} onClick={() => setActivePage('dashboard')} icon={<LayoutDashboard size={20} />} label="Dashboard" collapsed={isSidebarCollapsed} />
           <NavItem active={activePage === 'transactions'} onClick={() => setActivePage('transactions')} icon={<History size={20} />} label="Transactions" collapsed={isSidebarCollapsed} />
           <NavItem active={activePage === 'outstanding'} onClick={() => setActivePage('outstanding')} icon={<Clock size={20} />} label="Outstanding" collapsed={isSidebarCollapsed} />
           <NavItem active={activePage === 'profile'} onClick={() => setActivePage('profile')} icon={<User size={20} />} label="Profile" collapsed={isSidebarCollapsed} />
        </nav>

        <div className="p-6 mt-auto">
        </div>
      </aside>

      {/* Main UI */}
      <div className="flex-1 flex flex-col relative h-screen overflow-hidden">
        
        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between px-10 h-28 shrink-0 relative z-[100] bg-white dark:bg-slate-950 border-b border-outline">
           <div>
             <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">
                {activePage === 'dashboard' ? 'Current Month.' : 
                 activePage.charAt(0).toUpperCase() + activePage.slice(1) + '.'}
             </h1>
             <p className="text-on-surface-variant font-medium mt-1">
               {activePage === 'transactions' ? `${filteredTransactions.length} entries found` :
                activePage === 'outstanding' ? `${filteredOutstanding.length} payable entries found` :
                `${format(new Date(), 'MMMM yyyy')} activity summary`}
             </p>
           </div>
           
           <div className="flex items-center gap-4">
              {activePage === 'dashboard' ? (
                <>
                  <button className="flex items-center gap-2 font-bold px-6 py-3 rounded-xl bg-primary text-white shadow-lg shadow-primary/30 transition-transform active:scale-95" onClick={() => setShowModal('transaction')}>
                     <Plus size={18} />
                     Add Entry
                  </button>
                </>
              ) : activePage === 'transactions' || activePage === 'outstanding' ? (
                <>
                  {activePage === 'transactions' && selectedTransactions.size > 0 && (
                    <>
                      <button className="flex items-center gap-2 font-bold px-4 py-3 rounded-xl bg-[#f69300] text-white shadow-lg shadow-[#f69300]/30 transition-transform active:scale-95 disabled:opacity-50" onClick={() => handleBulkStatusUpdate('Transactions', 'Pending')} disabled={syncing}>
                        <AlertCircle size={18} />
                        Pending
                      </button>
                      <button className="flex items-center gap-2 font-bold px-4 py-3 rounded-xl bg-[#f20036] text-white shadow-lg shadow-[#f20036]/30 transition-transform active:scale-95 disabled:opacity-50" onClick={() => handleBulkDelete('Transactions')} disabled={syncing}>
                        <Trash2 size={18} />
                        Delete
                      </button>
                    </>
                  )}
                  {activePage === 'outstanding' && selectedOutstanding.size > 0 && (
                    <>
                      <button className="flex items-center gap-2 font-bold px-4 py-3 rounded-xl bg-[#00a76e] text-white shadow-lg shadow-[#00a76e]/30 transition-transform active:scale-95 disabled:opacity-50" onClick={() => handleBulkStatusUpdate('Outstanding', 'Processed')} disabled={syncing}>
                        <CheckCircle2 size={18} />
                        Processed
                      </button>
                      <button className="flex items-center gap-2 font-bold px-4 py-3 rounded-xl bg-[#eb0038] text-white shadow-lg shadow-[#eb0038]/30 transition-transform active:scale-95 disabled:opacity-50" onClick={() => handleBulkDelete('Outstanding')} disabled={syncing}>
                        <Trash2 size={18} />
                        Delete
                      </button>
                    </>
                  )}
                  <button className="flex items-center gap-2 font-bold px-6 py-3 rounded-xl bg-primary text-white shadow-lg shadow-primary/30 transition-transform active:scale-95" onClick={() => setShowModal(activePage === 'transactions' ? 'transaction' : 'outstanding')}>
                     <Plus size={18} />
                     Add Entry
                  </button>
                  <button className="flex items-center gap-2 font-bold px-4 py-3 rounded-xl hover:bg-surface-variant transition-colors text-on-surface" onClick={() => setShowFilters(!showFilters)}>
                     <Filter size={18} />
                     Filter
                  </button>
                </>
              ) : null}
           </div>
        </header>

        {/* Content Container */}
        <div className="flex-1 overflow-hidden relative flex items-center justify-center lg:items-stretch lg:justify-start">
           
           {/* Mobile layout wrapping (No artificial clipping to fill devices naturally) */}
           <main className={cn(
             "relative overflow-hidden flex flex-col w-full h-full lg:bg-transparent",
             "lg:static lg:overflow-y-auto lg:p-0",
             "max-lg:w-full max-lg:h-full max-lg:bg-background max-lg:mb-[0]"
           )}>
             
             {/* Animated Background Blobs (Mobile only) */}
             <div className="lg:hidden absolute top-[-10%] left-[-10%] w-[60%] h-[40%] bg-primary/10 rounded-full blur-[80px] animate-pulse pointer-events-none"></div>
             <div className="lg:hidden absolute bottom-[10%] right-[-10%] w-[50%] h-[30%] bg-accent2/10 rounded-full blur-[80px] animate-pulse pointer-events-none" style={{ animationDelay: '2s' }}></div>
             
             {/* Mobile Header (Hidden on Desktop) */}
             <header className="lg:hidden sticky top-0 w-full z-[100] bg-white pt-[max(0px,env(safe-area-inset-top,0px))] dark:bg-slate-950 border-b border-outline flex items-center justify-between px-6 shrink-0" style={{ height: 'calc(5rem + env(safe-area-inset-top, 0px))' }}>
               <div className="flex items-center gap-3">
                 <h1 className="font-sans text-[28px] font-extrabold text-on-surface leading-tight tracking-tight">
                   {activePage === 'dashboard' ? 'Dashboard' : 
                    activePage === 'transactions' ? 'Transactions' :
                    activePage === 'outstanding' ? 'Outstanding' : 'Profile Settings'}
                 </h1>
               </div>
               <div className="flex items-center gap-4">
                 {syncing && <div className="w-5 h-5 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>}
                 <button className="text-on-surface-variant hover:text-on-surface transition-colors" onClick={() => setShowSearch(!showSearch)}>
                   <Search size={24} strokeWidth={2.5} />
                 </button>
                 <button className="text-on-surface-variant hover:text-on-surface transition-colors" onClick={() => setShowFilters(!showFilters)}>
                   <Filter size={24} strokeWidth={2.5} />
                 </button>
               </div>
             </header>

             {/* Content Scrollable Area */}
             <div className="flex-1 overflow-y-auto no-scrollbar w-full max-lg:pt-4 lg:px-10 lg:pb-12" style={{ paddingBottom: 'calc(8rem + env(safe-area-inset-bottom, 0px))' }}>
               <div className="w-full">
        
        {/* Dashboard */}
        <section className={cn("page-container", activePage === 'dashboard' && "active")}>


          {/* Stats Grid */}
          <div className="px-6 grid grid-cols-2 lg:grid-cols-4 lg:gap-6 gap-5 mb-8">
            <StatCard 
              type="income" 
              label="Income" 
              value={dashboardStats.t.Income} 
              icon={<ArrowUp size={22} />} 
              iconColor="text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40"
              subtext={`${dashboardStats.c.Income} entries this month`}
            />
            <StatCard 
              type="expense" 
              label="Expenses" 
              value={dashboardStats.t.Expenses} 
              icon={<ArrowDown size={22} />} 
              iconColor="text-rose-600 bg-rose-100 dark:bg-rose-900/40"
              subtext={`${dashboardStats.c.Expenses} entries this month`}
            />
            <StatCard 
              type="credit" 
              label="Credit" 
              value={dashboardStats.t.Credit} 
              icon={<CreditCard size={22} />} 
              iconColor="text-blue-600 bg-blue-100 dark:bg-blue-900/40"
              subtext={`${dashboardStats.c.Credit} entries this month`}
            />
            <StatCard 
              type="outstanding" 
              label="Pending Balance" 
              value={transactions.filter(t => t.Status === 'Pending').reduce((s,t)=>s+t.Amount, 0) + outstanding.reduce((s,o)=>s+o.Amount, 0)} 
              icon={<FileText size={22} />} 
              iconColor="text-amber-600 bg-amber-100 dark:bg-amber-900/40"
              subtext={`${transactions.filter(t => t.Status === 'Pending').length + outstanding.length} pending entries`}
            />
          </div>

          {/* Desktop Only: Charts Row */}
          <div className="hidden lg:grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] px-6 gap-6 mb-8">
             <div className="glass-card bg-white dark:bg-slate-900 border-none rounded-3xl p-8 flex flex-col h-[400px]">
                <h4 className="font-sans text-sm font-bold text-on-surface tracking-widest uppercase mb-8">Last 6 Months Trend</h4>
                <div className="flex-1 w-full mx-auto relative overflow-hidden">
                   <Line data={trendData} options={{...chartOptions, maintainAspectRatio: false}} />
                </div>
             </div>
             
             <div className="glass-card bg-white dark:bg-slate-900 border-none rounded-3xl p-8 flex flex-col h-[400px]">
                <h4 className="font-sans text-sm font-bold text-on-surface tracking-widest uppercase mb-6">May 2026 Breakdown</h4>
                <div className="flex-1 w-full max-w-[200px] max-h-[200px] mx-auto relative mt-4">
                   <Doughnut data={donutData} options={{...donutOptions, plugins: { ...donutOptions.plugins, legend: { display: false }}}} />
                </div>
                <div className="flex flex-wrap justify-center gap-4 mt-8">
                   {donutData.labels.map((lbl: string, idx: number) => (
                      <div key={lbl} className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant">
                         <div className="w-3 h-3 rounded-full" style={{ backgroundColor: donutData.datasets[0].backgroundColor[idx] }} />
                         {lbl}
                      </div>
                   ))}
                </div>
             </div>
          </div>

          {/* Recent Activities (Mobile Only) */}
          <div className="px-6 lg:hidden">
            <div className="flex items-center justify-between mb-5">
              <h4 className="font-sans text-xl font-bold text-on-surface">Recent Activities</h4>
            </div>
            <div className="space-y-4">
              {transactions.slice(0, 5).map((r, i) => (
                <div key={`recent-tx-${r.ID || i}`} className="glass-card p-4 flex items-center justify-between group active:scale-[0.98] transition-all">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", 
                      r.Category === 'Income' ? 'bg-emerald-100 text-emerald-600' : 
                      r.Category === 'Credit' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                    )}>
                      {r.Category === 'Income' ? <ArrowDownLeft size={20} /> : <Receipt size={20} />}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-on-surface">{r['Sub-Category'] || r.Category}</div>
                      <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                        {r.Date === lastEnteredTxDate ? 'TODAY' : r.Date}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-on-surface">{fmt(r.Amount)}</div>
                    <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{r.Category}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* Transactions */}
        <section className={cn("page-container", activePage === 'transactions' && "active")}>
           <div className="px-6 pb-24">


              {showSearch && (
                 <div className="mb-4 animate-in fade-in slide-in-from-top-2">
                    <input className="form-input !h-14 !rounded-2xl" placeholder="Search entries..." value={search} onChange={e => setSearch(e.target.value)} />
                 </div>
              )}

              {showFilters && (
                 <div className="mb-4 grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
                    <select className="form-input text-xs !h-12" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                       <option value="">Categories</option>
                       {Object.keys(CATEGORY_MAP_T).map(c => <option key={c}>{c}</option>)}
                    </select>
                    <select className="form-input text-xs !h-12" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
                       <option value="">Timeline</option>
                       {past10Months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                 </div>
              )}

              <div className="space-y-4 lg:hidden">
                 {filteredTransactions.filter((r: any) => !hiddenMobileRows.has(String(r.ID))).map((r: any, i) => (
                    <MobileTransactionRow 
                       key={`tx-row-${r.ID || i}`} 
                       r={r} 
                       onSwipe={(action) => handleMobileSwipe(r, action, 'Transactions')} 
                       onClick={() => { setEditId(String(r.ID || '')); setFormData({ date: r.Date, amount: String(r.Amount), category: r.Category, subCategory: r['Sub-Category'], Accounts: r.Accounts || 'Bank of Baroda', notes: r.Notes || '', desc: r.Desc || '', state: r.State || 'Payable', status: r.Status || 'Processed', name: '', bank: '', type: 'Current', balance: '', month: '' }); setShowModal('transaction'); }} 
                    />
                 ))}
                 {filteredTransactions.filter((r: any) => !hiddenMobileRows.has(String(r.ID))).length === 0 && <div className="glass-card p-12 text-center text-on-surface-variant italic text-sm">No entries found</div>}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block glass-card overflow-hidden bg-white dark:bg-slate-900 border-none rounded-3xl">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-outline text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                       <th className="py-6 px-4 w-12 text-center">
                          <input 
                             type="checkbox" 
                             className="rounded-md border-outline text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                             checked={filteredTransactions.length > 0 && selectedTransactions.size === filteredTransactions.length}
                             ref={(input) => {
                               if (input) {
                                 input.indeterminate = selectedTransactions.size > 0 && selectedTransactions.size < filteredTransactions.length;
                               }
                             }}
                             onChange={(e) => {
                               if (e.target.checked) setSelectedTransactions(new Set(filteredTransactions.map(t => String(t.ID))));
                               else setSelectedTransactions(new Set());
                             }}
                          />
                       </th>
                       <th className="py-6 px-8">Details</th>
                       <th className="py-6 px-8">Amount</th>
                       <th className="py-6 px-8">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline">
                     {filteredTransactions.map((r, i) => (
                        <tr key={`desk-tx-${r.ID || i}`} className={cn("hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors", selectedTransactions.has(String(r.ID)) && "bg-primary/5 dark:bg-primary/10")}>
                           <td className="py-5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                              <input 
                                 type="checkbox" 
                                 className="rounded-md border-outline text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                                 checked={selectedTransactions.has(String(r.ID))}
                                 onChange={(e) => {
                                   const newSet = new Set(selectedTransactions);
                                   if (e.target.checked) newSet.add(String(r.ID));
                                   else newSet.delete(String(r.ID));
                                   setSelectedTransactions(newSet);
                                 }}
                              />
                           </td>
                           <td className="py-5 px-8" onClick={() => { setEditId(String(r.ID || '')); setFormData({ date: r.Date, amount: String(r.Amount), category: r.Category, subCategory: r['Sub-Category'], Accounts: r.Accounts || 'Bank of Baroda', notes: r.Notes || '', desc: r.Desc || '', state: r.State || 'Payable', status: r.Status || 'Processed', name: '', bank: '', type: 'Current', balance: '', month: '' }); setShowModal('transaction'); }}>
                              <div className="font-bold text-base text-on-surface">{r['Sub-Category'] || r.Category}</div>
                              <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-0.5">{fmtDate(r.Date)}</div>
                           </td>
                           <td className="py-5 px-8" onClick={() => { setEditId(String(r.ID || '')); setFormData({ date: r.Date, amount: String(r.Amount), category: r.Category, subCategory: r['Sub-Category'], Accounts: r.Accounts || 'Bank of Baroda', notes: r.Notes || '', desc: r.Desc || '', state: r.State || 'Payable', status: r.Status || 'Processed', name: '', bank: '', type: 'Current', balance: '', month: '' }); setShowModal('transaction'); }}>
                              <div className={cn("text-base font-black font-mono", r.Category === 'Income' ? 'text-emerald-600' : 'text-on-surface')}>
                                 {r.Category === 'Income' ? '+' : ''}{fmt(r.Amount)}
                              </div>
                           </td>
                           <td className="py-5 px-8 text-sm text-on-surface-variant" onClick={() => { setEditId(String(r.ID || '')); setFormData({ date: r.Date, amount: String(r.Amount), category: r.Category, subCategory: r['Sub-Category'], Accounts: r.Accounts || 'Bank of Baroda', notes: r.Notes || '', desc: r.Desc || '', state: r.State || 'Payable', status: r.Status || 'Processed', name: '', bank: '', type: 'Current', balance: '', month: '' }); setShowModal('transaction'); }}>
                              {r.Notes || r.Desc || (r.Category === 'Income' ? 'Income credit' : 'Deducted from bank account')}
                           </td>
                        </tr>
                     ))}
                     {filteredTransactions.length === 0 && (
                        <tr><td colSpan={4} className="py-12 text-center text-on-surface-variant italic">No entries found</td></tr>
                     )}
                  </tbody>
                </table>
              </div>
           </div>
        </section>

        {/* Outstanding */}
        <section className={cn("page-container", activePage === 'outstanding' && "active")}>
           <div className="px-6 space-y-6 pb-24">
              {/* Top Violet Block (Mobile & Desktop) */}
              <div className="glass-card p-4 lg:p-8 bg-violet-600 text-white border-none shadow-xl shadow-violet-200 relative overflow-hidden z-[1] flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3 lg:gap-6">
                 <div className="relative z-10 flex flex-row lg:flex-col justify-between items-center lg:items-start w-full lg:w-auto">
                    <div className="flex flex-col">
                       <div className="text-[10px] lg:text-[11px] font-black uppercase tracking-[0.2em] mb-0.5 lg:mb-2 opacity-80">Total Pending Balance</div>
                       <div className="text-2xl lg:text-4xl font-black">
                          {fmt(transactions.filter(t => t.Status === 'Pending').reduce((s,t)=>s+t.Amount, 0) + outstanding.reduce((s,o)=>s+o.Amount, 0))}
                       </div>
                    </div>
                 </div>
                 
                 <div className="relative z-10 w-full lg:w-[400px] flex bg-white/20 p-1 lg:p-1.5 rounded-[14px] lg:rounded-3xl border border-white/10 backdrop-blur-md">
                    <button onClick={() => setFilterState('Payable')} className={cn("flex-1 py-1.5 lg:py-3.5 rounded-xl lg:rounded-[24px] text-[10px] lg:text-sm font-black uppercase tracking-widest transition-all", filterState === 'Payable' ? "bg-white text-violet-600 shadow-md" : "text-white hover:bg-white/10")}>Payables</button>
                    <button onClick={() => setFilterState('Receivable')} className={cn("flex-1 py-1.5 lg:py-3.5 rounded-xl lg:rounded-[24px] text-[10px] lg:text-sm font-black uppercase tracking-widest transition-all", filterState === 'Receivable' ? "bg-white text-violet-600 shadow-md" : "text-white hover:bg-white/10")}>Receivables</button>
                 </div>
              </div>

              {showSearch && (
                 <div className="mb-4 animate-in fade-in slide-in-from-top-2">
                    <input className="form-input !h-14 !rounded-2xl" placeholder="Search entries..." value={outSearch} onChange={e => setOutSearch(e.target.value)} />
                 </div>
              )}

              {showFilters && (
                 <div className="mb-4 grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
                    <select className="form-input text-xs !h-12" value={outFilterCat} onChange={e => setOutFilterCat(e.target.value)}>
                       <option value="">Categories</option>
                       {Object.keys(CATEGORY_MAP_O).map(c => <option key={c}>{c}</option>)}
                    </select>
                    <select className="form-input text-xs !h-12" value={outFilterMonth} onChange={e => setOutFilterMonth(e.target.value)}>
                       <option value="">Timeline</option>
                       {past10Months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                 </div>
              )}

              <div className="space-y-4 lg:hidden">
                 {filteredOutstanding.filter((r: any) => !hiddenMobileRows.has(String(r.ID))).map((r: any, i) => (
                    <MobileOutstandingRow 
                       key={`out-row-${r.ID || i}`} 
                       r={r} 
                       onSwipe={(action) => handleMobileSwipe(r, action)} 
                       onClick={() => { setEditId(String(r.ID || '')); setFormData({ date: r.Date, amount: String(r.Amount), category: r.Category, subCategory: r['Sub-Category'] || '', desc: r.Desc || '', notes: r.Notes || '', status: r.Status || 'Pending', state: r.State || 'Payable', Accounts: r.Accounts || 'Bank of Baroda', name: '', type: 'Current', balance: '', month: '' }); setShowModal('outstanding'); }} 
                    />
                 ))}
                 {filteredOutstanding.filter((r: any) => !hiddenMobileRows.has(String(r.ID))).length === 0 && <div className="glass-card p-12 text-center text-on-surface-variant italic text-sm">You're all settled!</div>}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block glass-card overflow-hidden bg-white dark:bg-slate-900 border-none rounded-3xl">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-outline text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                       <th className="py-6 px-4 w-12 text-center">
                          <input 
                             type="checkbox" 
                             className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer align-middle"
                             checked={selectedOutstanding.size === filteredOutstanding.length && filteredOutstanding.length > 0}
                             ref={(input) => {
                               if (input) {
                                 input.indeterminate = selectedOutstanding.size > 0 && selectedOutstanding.size < filteredOutstanding.length;
                               }
                             }}
                             onChange={(e) => {
                                if (e.target.checked) {
                                   const allIds = filteredOutstanding.map((r: any) => String(r.ID)).filter(Boolean);
                                   setSelectedOutstanding(new Set(allIds));
                                } else {
                                   setSelectedOutstanding(new Set());
                                }
                             }}
                          />
                       </th>
                       <th className="py-6 px-4">Details</th>
                       <th className="py-6 px-8">Amount</th>
                       <th className="py-6 px-8">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline">
                     {filteredOutstanding.map((r: any, i) => (
                        <tr key={`desk-out-${r.ID || i}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors" onClick={() => { setEditId(String(r.ID || '')); setFormData({ date: r.Date, amount: String(r.Amount), category: r.Category, subCategory: r['Sub-Category'] || '', desc: r.Desc || '', notes: r.Notes || '', status: r.Status || 'Pending', state: r.State || 'Payable', Accounts: r.Accounts || 'Bank of Baroda', name: '', type: 'Current', balance: '', month: '' }); setShowModal('outstanding'); }}>
                           <td className="py-5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                              <input 
                                 type="checkbox" 
                                 className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer align-middle"
                                 checked={selectedOutstanding.has(String(r.ID))}
                                 onChange={(e) => {
                                    const newSet = new Set(selectedOutstanding);
                                    if (e.target.checked) newSet.add(String(r.ID));
                                    else newSet.delete(String(r.ID));
                                    setSelectedOutstanding(newSet);
                                 }}
                              />
                           </td>
                           <td className="py-5 px-4">
                              <div className="font-bold text-base text-on-surface">{r['Sub-Category'] || r.Desc || 'Unspecified'}</div>
                              <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-0.5">{fmtDate(r.Date)}</div>
                           </td>
                           <td className="py-5 px-8">
                              <div className="text-base font-black font-mono text-on-surface">
                                 {fmt(r.Amount)}
                              </div>
                           </td>
                           <td className="py-5 px-8 text-sm text-on-surface-variant">
                              {r.Notes || (r.State === 'Receivable' ? 'Expected inward transfer' : 'Split with roommates')}
                           </td>
                        </tr>
                     ))}
                     {filteredOutstanding.length === 0 && (
                        <tr><td colSpan={4} className="py-12 text-center text-on-surface-variant italic">You're all settled!</td></tr>
                     )}
                  </tbody>
                </table>
              </div>
           </div>
        </section>



        {/* Profile Section Dashboard */}
        <section className={cn("page-container", activePage === 'profile' && "active")}>
          <div className="animate-in fade-in duration-500 pb-24">
            {profileTab === 'overview' ? (
              <>
                <div className="px-6 mt-8">
                  {/* Profile Hero Card */}
                  <div className="glass-card p-8 mb-8 flex flex-col items-center text-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-primary/10 transition-colors"></div>
                    
                    <div className="relative mb-6">
                      <div className="w-24 h-24 rounded-[2rem] border-4 border-white dark:border-slate-800 shadow-2xl overflow-hidden glass-card">
                        {user?.photoURL ? (
                          <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-3xl font-bold">
                            {user?.name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                        )}
                      </div>
                      <button 
                        className="absolute -bottom-1 -right-1 w-9 h-9 bg-primary text-white rounded-xl shadow-lg flex items-center justify-center border-4 border-white dark:border-slate-900 active:scale-90 transition-transform"
                        onClick={() => profilePhotoInputRef.current?.click()}
                      >
                        <Camera size={14} />
                      </button>
                    </div>

                    <h2 className="headline-small mb-1">
                      {user?.name || user?.displayName || 'App Member'}
                    </h2>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-6">
                      {user?.email || 'member@expenselog.pro'}
                    </p>
                  </div>

                  {/* Account Settings Group */}
                  <div className="mb-8">
                    <div className="px-2 mb-4">
                      <span className="label-medium text-on-surface-variant">Personalization</span>
                    </div>
                    <div className="glass-card p-2">
                      <SettingsRow 
                        icon={<User size={18} />}
                        label="Account Details"
                        sub="Identity & Contact"
                        onClick={() => setProfileTab('account')}
                      />
                      <SettingsRow 
                        icon={<BarChart3 size={18} />}
                        label="Analytics"
                        sub="Spending Reports"
                        onClick={() => setProfileTab('monthly')}
                      />
                      <SettingsRow 
                        icon={<Wallet size={18} />}
                        label="Wallets"
                        sub="Payment Methods"
                        onClick={() => setProfileTab('wallet')}
                      />
                    </div>
                  </div>

                  {/* Security & Support */}
                  <div className="mb-8">
                    <div className="px-2 mb-4">
                      <span className="label-medium text-on-surface-variant">Safety & Support</span>
                    </div>
                    <div className="glass-card p-2">
                      <SettingsRow 
                        icon={<Shield size={18} />}
                        label="Security"
                        sub="Protection & Privacy"
                        onClick={() => setProfileTab('security')}
                      />
                      <SettingsRow 
                        icon={<Zap size={18} />}
                        label="Preferences"
                        sub="Themes & Display"
                        onClick={() => setProfileTab('preferences')}
                      />
                    </div>
                  </div>

                  <button 
                    className="w-full h-14 rounded-2xl bg-accent/10 text-accent font-bold flex items-center justify-center gap-2 hover:bg-accent hover:text-white transition-all active:scale-95 mb-8"
                    onClick={() => signOut(auth)}
                  >
                    <LogOut size={18} />
                    <span>Sign Out</span>
                  </button>

                  <div className="text-center pb-12 opacity-30">
                    <div className="text-[10px] font-bold uppercase tracking-widest">v2.4.8 Platinum</div>
                    <div className="text-[8px] uppercase tracking-widest mt-1">© 2024 Expense Log Pro</div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Sub-page Header */}
                <div className="px-6 mt-4 mb-8 flex items-center gap-4">
                  <button 
                    className="w-10 h-10 rounded-xl bg-surface-variant flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-all active:scale-95" 
                    onClick={() => setProfileTab('overview')}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <h3 className="headline-small capitalize">{profileTab}</h3>
                </div>

                <div className="px-6"> 
                  {profileTab === 'wallet' ? (
                    <div className="space-y-6">
                       {/* Net Worth Summary */}
                       <div className="glass-card p-8 text-center bg-gradient-to-br from-white to-indigo-50 dark:from-slate-900 dark:to-indigo-950/20">
                          <div className="text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-3">Total Net Worth</div>
                          <div className="flex items-baseline justify-center gap-1 mb-4">
                            <span className="text-4xl font-black text-on-surface">{fmt(accounts.reduce((sum, a) => sum + (a.balance || 0), 0))}</span>
                            <span className="text-xl font-bold text-on-surface-variant">.00</span>
                          </div>
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-100">
                             <ArrowUp size={12} strokeWidth={3} />
                             <span>+2.4% this month</span>
                          </div>
                       </div>

                       {/* Bank Accounts Section */}
                       <div>
                          <div className="flex justify-between items-center px-1 mb-4">
                             <h4 className="font-sans text-xl font-bold text-on-surface">Bank Accounts</h4>
                             <div className="px-2.5 py-1 bg-surface-variant rounded-full text-[10px] font-bold text-on-surface-variant uppercase tracking-wider border border-outline-variant">2 Linked</div>
                          </div>
                          <div className="glass-card divide-y divide-outline-variant/30">
                             {accounts.filter(a => a.type !== 'Credit').map((acc, i) => (
                                <div key={`bank-${acc.id || i}`} className="p-5 flex items-center justify-between group cursor-pointer hover:bg-surface-variant/30 transition-colors">
                                   <div className="flex items-center gap-4">
                                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                        <Landmark size={24} />
                                      </div>
                                      <div>
                                         <div className="text-sm font-bold text-on-surface">{acc.name}</div>
                                         <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Checking •••• {1234 + i}</div>
                                      </div>
                                   </div>
                                   <div className="text-right">
                                      <div className="text-base font-bold text-on-surface">{fmt(acc.balance)}</div>
                                   </div>
                                </div>
                             ))}
                          </div>
                       </div>

                       {/* Credit Cards Section */}
                       <div>
                          <div className="px-1 mb-4">
                             <h4 className="font-sans text-xl font-bold text-on-surface">Credit Cards</h4>
                          </div>
                          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-6 px-6">
                            {accounts.filter(a => a.type === 'Credit').map((acc, i) => (
                              <div key={`credit-${acc.id || i}`} className="min-w-[200px] glass-card p-5 bg-gradient-to-tr from-white to-indigo-50/50">
                                <div className="flex justify-between items-start mb-6">
                                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                    <CreditCard size={20} />
                                  </div>
                                  <div className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-[8px] font-black uppercase tracking-widest">Active</div>
                                </div>
                                <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Available Credit</div>
                                <div className="flex items-baseline gap-0.5 mb-2">
                                  <span className="text-xl font-black text-on-surface">{fmt(15800)}</span>
                                  <span className="text-xs font-bold text-on-surface-variant">.00</span>
                                </div>
                                <div className="text-[10px] font-medium text-on-surface-variant tracking-[0.3em]">•••• •••• •••• {9901 + i}</div>
                              </div>
                            ))}
                          </div>
                       </div>

                       <button 
                        className="w-full h-15 rounded-3xl bg-primary text-white font-bold flex items-center justify-center gap-2 shadow-2xl shadow-primary/30 active:scale-95 transition-all"
                        onClick={() => { setEditId(null); setFormData({ ...formData, name: '', type: 'Current', balance: '0' }); setShowModal('account'); }}
                       >
                          <Plus size={20} />
                          <span>Add New Account</span>
                       </button>
                    </div>
                  ) : profileTab === 'monthly' ? (
                    <div className="space-y-6 pb-12">
                       {/* Budget Pacing */}
                       <div className="glass-card p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] mb-1">Budget Pacing</div>
                            <h3 className="text-2xl font-black text-on-surface">75% Consumed</h3>
                          </div>
                          <div className="px-3 py-1.5 bg-indigo-50 text-primary rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                             <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                             On Track
                          </div>
                        </div>
                        
                        <div className="relative w-56 h-56 mx-auto mb-6">
                          <Doughnut 
                            data={donutData} 
                            options={{
                              ...donutOptions,
                              plugins: { ...donutOptions.plugins, legend: { display: false } }
                            }} 
                          />
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                             <div className="text-3xl font-black text-on-surface leading-tight">
                               {fmt(dashboardStats.t.Expenses)}
                             </div>
                             <div className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest mt-1">
                               of {fmt(6000)}
                             </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 divide-x divide-outline-variant/30 text-center border-t border-outline-variant/30 pt-6">
                          <div>
                            <div className="text-[9px] font-black text-on-surface-variant uppercase tracking-[0.2em] mb-1">Monthly Limit</div>
                            <div className="text-base font-black text-primary">$150.00</div>
                          </div>
                          <div>
                            <div className="text-[9px] font-black text-on-surface-variant uppercase tracking-[0.2em] mb-1">Remaining</div>
                            <div className="text-base font-black text-indigo-900">$1,750.00</div>
                          </div>
                        </div>
                      </div>

                      {/* Top 5 Categories */}
                      <div className="glass-card p-6">
                         <div className="flex items-center justify-between mb-6">
                            <h4 className="font-sans text-lg font-bold text-on-surface tracking-tight">Top 5 Spend Categories</h4>
                         </div>
                         <div className="space-y-5">
                            {[
                              { label: 'Rent & Utilities', value: 2100, color: 'bg-primary' },
                              { label: 'Dining Out', value: 850, color: 'bg-emerald-500' },
                              { label: 'Groceries', value: 520, color: 'bg-amber-500' },
                              { label: 'Subscriptions', value: 180, color: 'bg-blue-400' },
                              { label: 'Transit', value: 120, color: 'bg-teal-300' }
                            ].map((cat, i) => (
                              <div key={i} className="space-y-1.5">
                                 <div className="flex justify-between items-center px-1">
                                    <span className="text-[12px] font-bold text-on-surface">{cat.label}</span>
                                    <span className="text-[12px] font-black text-on-surface">{fmt(cat.value)}</span>
                                 </div>
                                 <div className="h-2 w-full bg-surface-variant rounded-full overflow-hidden">
                                    <div className={cn("h-full rounded-full transition-all duration-1000", cat.color)} style={{ width: `${(cat.value / 2100) * 100}%` }}></div>
                                 </div>
                              </div>
                            ))}
                         </div>
                      </div>

                      {/* Payment Trends */}
                      <div className="glass-card p-6">
                         <div className="flex items-center justify-between mb-6">
                            <h4 className="font-sans text-lg font-bold text-on-surface tracking-tight">Payment Trends (6mo)</h4>
                         </div>
                         <div className="h-48 mb-6">
                            <Line data={trendData} options={chartOptions} />
                         </div>
                         <div className="flex items-center gap-3 text-primary text-[11px] font-black uppercase tracking-wider">
                            <ArrowUpRight size={16} strokeWidth={3} />
                            <span>Spending increased 12% since April</span>
                         </div>
                      </div>
                    </div>
                  ) : profileTab === 'account' ? (
                    <div className="space-y-6">
                       <div className="glass-card shadow-none border-outline/50 divide-y divide-outline-variant/30">
                          <div className="p-5 flex items-center justify-between group cursor-pointer" onClick={() => setShowModal('profile')}>
                             <div className="flex items-center gap-4">
                                <div className="w-11 h-11 rounded-2xl bg-violet-50 text-violet-500 flex items-center justify-center"><User size={20} /></div>
                                <div>
                                   <div className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-0.5">Full Name</div>
                                   <div className="text-sm font-bold text-on-surface">{user?.displayName || 'Alex Mercer'}</div>
                                </div>
                             </div>
                             <ChevronRight size={18} className="text-outline-variant group-hover:text-primary transition-colors" />
                          </div>
                          <div className="p-5 flex items-center justify-between group cursor-pointer">
                             <div className="flex items-center gap-4">
                                <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center"><AtSign size={20} /></div>
                                <div>
                                   <div className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-0.5">Email Address</div>
                                   <div className="text-sm font-bold text-on-surface">{user?.email}</div>
                                </div>
                             </div>
                             <ChevronRight size={18} className="text-outline-variant group-hover:text-primary transition-colors" />
                          </div>
                          <div className="p-5 flex items-center justify-between group cursor-pointer">
                             <div className="flex items-center gap-4">
                                <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center"><Smartphone size={20} /></div>
                                <div>
                                   <div className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-0.5">Phone Number</div>
                                   <div className="text-sm font-bold text-on-surface">+91 98765 43210</div>
                                </div>
                             </div>
                             <ChevronRight size={18} className="text-outline-variant group-hover:text-primary transition-colors" />
                          </div>
                       </div>

                       <div className="glass-card shadow-none border-outline/50 divide-y divide-outline-variant/30">
                          <div className="p-5 flex items-center justify-between">
                             <div className="flex items-center gap-4">
                                <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center"><Wallet size={20} /></div>
                                <div>
                                   <div className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-0.5">Base Currency</div>
                                   <div className="text-sm font-bold text-on-surface">INR (₹)</div>
                                </div>
                             </div>
                             <ChevronRight size={18} className="text-outline-variant" />
                          </div>
                          <div className="p-5 flex items-center justify-between">
                             <div className="flex items-center gap-4">
                                <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><Globe size={20} /></div>
                                <div>
                                   <div className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-0.5">App Language</div>
                                   <div className="text-sm font-bold text-on-surface">English (US)</div>
                                </div>
                             </div>
                             <ChevronRight size={18} className="text-outline-variant" />
                          </div>
                          <div className="p-5 flex items-center justify-between">
                             <div className="flex items-center gap-4">
                                <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center"><Moon size={20} /></div>
                                <div>
                                   <div className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-0.5">Night Mode</div>
                                   <div className="text-sm font-bold text-on-surface">{isDark ? 'Active' : 'Disabled'}</div>
                                </div>
                             </div>
                             <label className="switch">
                                <input type="checkbox" checked={isDark} onChange={() => setIsDark(!isDark)} />
                                <span className="slider"></span>
                             </label>
                          </div>
                       </div>
                    </div>
                  ) : profileTab === 'security' ? (
                    <div className="space-y-6">
                       <div className="glass-card p-6 flex flex-col gap-5">
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-primary flex items-center justify-center"><Key size={20} /></div>
                            <div className="flex-1">
                               <div className="text-sm font-bold text-on-surface">Password Management</div>
                               <div className="text-[11px] font-bold text-on-surface-variant">Last changed 45 days ago</div>
                            </div>
                          </div>
                          <button className="btn btn-primary rounded-2xl h-13 font-bold gap-2">
                             Change Password
                             <ChevronRight size={16} />
                          </button>
                       </div>

                       <div className="glass-card p-5 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center"><ShieldCheck size={20} /></div>
                            <div>
                               <div className="text-sm font-bold text-on-surface">Two-Factor Auth</div>
                               <div className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Not enabled</div>
                            </div>
                          </div>
                          <label className="switch"><input type="checkbox" /><span className="slider"></span></label>
                       </div>

                       <div>
                          <div className="flex justify-between items-center px-1 mb-4">
                             <h4 className="font-sans text-base font-bold text-on-surface">Active Devices</h4>
                             <button className="text-[10px] font-black text-primary uppercase tracking-widest">Log out all</button>
                          </div>
                          <div className="glass-card divide-y divide-outline-variant/30">
                            <div className="p-5 flex items-center justify-between">
                               <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-primary flex items-center justify-center"><Smartphone size={24} /></div>
                                  <div>
                                     <div className="text-sm font-bold text-on-surface">iPhone 14 Pro</div>
                                     <div className="text-[10px] font-bold text-on-surface-variant">Zurich, CH • Current session</div>
                                  </div>
                               </div>
                               <div className="w-2 h-2 rounded-full bg-primary"></div>
                            </div>
                            <div className="p-5 flex items-center justify-between group cursor-pointer hover:bg-surface-variant/30 transition-colors">
                               <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center"><Monitor size={24} /></div>
                                  <div>
                                     <div className="text-sm font-bold text-on-surface">MacBook Air</div>
                                     <div className="text-[10px] font-bold text-on-surface-variant">Geneva, CH • Active 2h ago</div>
                                  </div>
                               </div>
                               <LogOut size={18} className="text-rose-500" />
                            </div>
                          </div>
                       </div>
                    </div>
                  ) : (
                    <div className="glass-card p-12 text-center flex flex-col items-center">
                       <Construction size={48} className="text-primary/20 mb-4" />
                       <h4 className="text-sm font-bold text-on-surface mb-1">Coming Soon</h4>
                       <p className="text-xs text-on-surface-variant">We're tailoring this experience for your mobile device.</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </section>
        </div>
        </div>
        {/* Mobile Bottom Navigation */}
        <div className="lg:hidden">
          <BottomNav activePage={activePage} setActivePage={setActivePage} />
        </div>
      </main>
      </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay open">
          <div className="modal-content">
            <div className="flex justify-between items-center mb-6">
              <div className="text-xl font-bold text-on-surface">
                {showModal === 'account-history' ? `${selectedAccount} History` : 
                  showModal === 'account' ? `${editId ? 'Edit' : 'Add'} Wallet` :
                  `${editId ? 'Edit' : 'Add'} ${showModal.charAt(0).toUpperCase() + showModal.slice(1)}`}
              </div>
                <button className="text-muted hover:text-text p-2 -mr-2" onClick={() => setShowModal(null)}><X size={18} /></button>
            </div>
            
            {showModal === 'account' ? (
              <div className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Bank Name</label>
                  <input className="form-input" placeholder="e.g. Primary Savings" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Account Type</label>
                  <select className="form-input" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as any })}>
                    <option>Current</option>
                    <option>Savings</option>
                    <option>Credit</option>
                  </select>
                </div>
                <div className="p-4 bg-muted/10 rounded-2xl border border-border/40">
                  <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Note</div>
                  <div className="text-xs text-muted leading-relaxed">Balance is automatically calculated based on your transactions and outstanding entries.</div>
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
        {(['transactions', 'dashboard'].includes(activePage) || (activePage === 'profile' && ['wallet', 'monthly'].includes(profileTab))) && (
          <button 
            className="fab"
            onClick={() => {
              if (activePage === 'profile' && profileTab === 'wallet') {
                setEditId(null); 
                setFormData({
                  ...formData,
                  date: new Date().toISOString().slice(0, 10),
                  name: '', type: 'Current', balance: '0'
                });
                setShowModal('account'); 
              } else if (activePage === 'profile' && profileTab === 'monthly') {
                setEditId(null);
                setFormData({
                  ...formData,
                  date: lastEnteredTxDate,
                  amount: '',
                  category: 'Expenses',
                  subCategory: CATEGORY_MAP_T['Expenses'][0],
                  desc: '',
                  notes: '',
                  Accounts: ACCOUNTS_LIST[0],
                  state: 'Payable',
                  status: 'Pending',
                  name: '', bank: '', type: 'Current', balance: ''
                });
                setShowModal('transaction');
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
                  name: '', bank: '', type: 'Current', balance: ''
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
                  name: '', type: 'Current', balance: '',
                  month: format(new Date(), 'yyyy-MM')
                });
                setShowModal('outstanding');
            }}
          >
            <Plus size={24} strokeWidth={3} />
          </button>
        )}
      </div>

      {/* Auth Modal (Preview Mode) */}
      <div className={cn("modal-overlay auth-modal-overlay flex items-center justify-center p-4", showAuthModal && "open")}>
        <div className="auth-modal-content max-w-[380px] w-full animate-in fade-in zoom-in duration-300 relative">
          {authMode === 'signin' ? (
            <SignIn 
              onToggle={() => {
                setAuthMode('signup');
                setSignupSuccess(false);
              }} 
              prefilledEmail={prefilledEmail}
              initialMessage={signupSuccess ? "Your account has been created. Please check your email and verify your address before logging in." : ""}
              isModal={true}
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
              isModal={true}
            />
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation (Duplicated in structure but hidden by z-index logic if needed, actually standard bottom-nav behavior) */}
      {/* Handled above inside content area for clarity but BottomNav component usually fixed */}

      {/* Toast */}
      {toast && (
        <div className={cn("toast-message show", toast.type)}>
          {toast.msg}
        </div>
      )}

      {/* Mobile Undo Toast */}
      {mobileUndoToast && mobileUndoToast.visible && (
         <div className="fixed left-1/2 -translate-x-1/2 z-[100] lg:hidden w-[90%] max-w-[400px]" style={{ bottom: 'calc(6rem + env(safe-area-inset-bottom, 0px))' }}>
            <motion.div 
               initial={{ opacity: 0, y: 50 }} 
               animate={{ opacity: 1, y: 0 }} 
               exit={{ opacity: 0, y: 50 }} 
               className="bg-slate-900 dark:bg-slate-800 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between"
            >
               <span className="text-sm font-medium">
                  {mobileUndoToast.action === 'process' ? 'Marked as Processed' : 
                   mobileUndoToast.action === 'pending' ? 'Marked as Pending' : 'Entry deleted'}
               </span>
               <button 
                  onClick={handleMobileUndo} 
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-colors"
               >
                  Undo
               </button>
            </motion.div>
         </div>
      )}

      {/* Floating Info Overlay for Onboarding/Premium */}
      {showPremiumPrompt && (
        <div className="fixed inset-0 z-[2000] flex items-end p-6 pointer-events-none">
           <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full bg-slate-900 text-white rounded-[32px] p-8 pointer-events-auto shadow-2xl relative overflow-hidden"
           >
              <div className="absolute top-0 right-0 p-8 opacity-10"><Crown size={120} /></div>
              <div className="relative z-10">
                 <div className="w-12 h-12 rounded-2xl bg-amber-400 flex items-center justify-center mb-6"><Zap size={24} className="text-slate-900" /></div>
                 <h3 className="text-2xl font-black mb-2">Upgrade to Pro</h3>
                 <p className="text-slate-400 text-sm mb-8 leading-relaxed">Get unlimited accounts, detailed export, and multi-device cloud synchronization.</p>
                 <div className="flex gap-3">
                    <button className="flex-1 h-14 bg-white text-slate-900 rounded-2xl font-bold active:scale-95 transition-all">Try Free for 7 Days</button>
                    <button className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center" onClick={() => setShowPremiumPrompt(false)}><X size={20} /></button>
                 </div>
              </div>
           </motion.div>
        </div>
      )}
    </div>
  );
}

function NavItemRow({ icon, label, sub }: { icon: ReactNode; label: string; sub?: string }) {
  return (
    <div className="p-5 flex items-center justify-between group cursor-pointer hover:bg-surface-variant/30 transition-colors">
       <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-surface-variant flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500">
             {icon}
          </div>
          <div>
            <div className="text-sm font-bold text-on-surface">{label}</div>
            {sub && <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{sub}</div>}
          </div>
       </div>
       <ChevronRight size={18} className="text-outline-variant group-hover:text-primary transition-colors" />
    </div>
  );
}

function NavItem({ active, onClick, icon, label, collapsed }: { active: boolean; onClick: () => void; icon: ReactNode; label: string; collapsed: boolean }) {
  return (
    <motion.div 
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      className={cn("flex items-center gap-4 px-4 py-3.5 rounded-2xl cursor-pointer transition-all font-bold", 
        active ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/50"
      )} 
      onClick={onClick} 
      title={collapsed ? label : undefined}
    >
      <span className="shrink-0">{icon}</span>
      {!collapsed && <span className="text-[15px]">{label}</span>}
    </motion.div>
  );
}

function StatCard({ type, label, value, icon, iconColor, subtext }: { type: string; label: string; value: number; icon: ReactNode; iconColor: string; subtext?: string }) {
  return (
    <div className="glass-card p-5 lg:p-6 flex flex-col items-start gap-4 lg:gap-6 min-h-[160px] lg:min-h-0 lg:h-[180px] group bg-white dark:bg-slate-900 border-none rounded-3xl relative">
      <div className="w-full flex justify-between items-start">
         <div className={cn("w-12 h-12 rounded-full flex items-center justify-center border transition-transform group-hover:scale-110 shrink-0", 
            iconColor.replace('bg-', 'border-').replace('/40', ''), // Use the bg color text for border too roughly, or just make it an outline style
            iconColor.split(' ')[0], // text-emerald-600
            "bg-transparent"
         )}>
           {React.cloneElement(icon as React.ReactElement, { size: 18, strokeWidth: 2.5 })}
         </div>
         <div className="hidden lg:flex w-6 h-6 items-center justify-center text-emerald-500">
           {type === 'expense' || type === 'outstanding' || type === 'bills' ? <ArrowDownRight size={14} className="text-rose-500" /> : <ArrowUpRight size={14} className="text-emerald-500" />}
         </div>
      </div>
      <div className="flex flex-col mt-auto w-full">
        <span className="text-[12px] font-bold text-on-surface-variant uppercase tracking-[0.1em] mb-1">{label}</span>
        <h2 className="font-sans text-[26px] font-black text-on-surface tracking-tight mb-0.5">{fmt(value)}</h2>
        {subtext && <span className="hidden lg:block text-[11px] text-on-surface-variant font-medium">{subtext}</span>}
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
function SettingsRow({ icon, label, sub, onClick }: { icon: ReactNode; label: string; sub: string; onClick: () => void }) {
  return (
    <button className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-surface-variant transition-all group border border-outline-variant/50 hover:border-outline mb-2" onClick={onClick}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-surface-variant flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500 group-hover:bg-primary/10">
          {icon}
        </div>
        <div className="text-left">
          <div className="text-sm font-bold text-on-surface">{label}</div>
          <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{sub}</div>
        </div>
      </div>
      <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
        <ChevronRight size={16} />
      </div>
    </button>
  );
}

function BottomNav({ activePage, setActivePage }: { activePage: PageView; setActivePage: (p: PageView) => void }) {
  return (
    <nav className="glass-nav">
      <BottomNavItem 
        active={activePage === 'dashboard'} 
        onClick={() => setActivePage('dashboard')} 
        icon={<LayoutDashboard size={22} />} 
        label="Home" 
      />
      <BottomNavItem 
        active={activePage === 'transactions'} 
        onClick={() => setActivePage('transactions')} 
        icon={<ArrowRightLeft size={22} />} 
        label="Transactions" 
      />
      <BottomNavItem 
        active={activePage === 'outstanding'} 
        onClick={() => setActivePage('outstanding')} 
        icon={<Clock size={22} />} 
        label="Pending" 
      />
      <BottomNavItem 
        active={activePage === 'profile'} 
        onClick={() => setActivePage('profile')} 
        icon={<User size={22} />} 
        label="Profile" 
      />
    </nav>
  );
}

function BottomNavItem({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: ReactNode; label: string }) {
  return (
    <button 
      className={cn(
        "flex flex-col items-center justify-center transition-all active:scale-90 duration-300 relative px-4 h-full",
        active ? "text-primary" : "text-on-surface-variant hover:text-on-surface"
      )} 
      onClick={onClick}
    >
      <span className={cn("transition-transform duration-500", active && "scale-110 -translate-y-2.5")}>{icon}</span>
      <span className={cn("label-medium text-[10px] font-bold uppercase tracking-widest opacity-0 transition-all duration-300 absolute bottom-3", active && "opacity-100")}>{label}</span>
    </button>
  );
}
