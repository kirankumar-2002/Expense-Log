import React, { useState } from 'react';
import { auth, googleProvider } from './firebase';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { Mail, Lock, LogIn, Github, Chrome, AlertCircle, Landmark } from 'lucide-react';
import { motion } from 'motion/react';

const SignIn = ({ onToggle, prefilledEmail = '', initialMessage = '' }) => {
  const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState(initialMessage);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (!userCredential.user.emailVerified) {
        setError("Please verify your email before signing in. Check your inbox.");
        await auth.signOut();
      }
      // Redirect handled by onAuthStateChanged in App.tsx if verified
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      if (!userCredential.user.emailVerified) {
        setError("Your Google email is not verified. Please verify it in your Google settings.");
        await auth.signOut();
      }
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[420px] bg-[var(--card)] p-10 rounded-[40px] shadow-[var(--shadow-lg)] border border-[var(--border)] relative overflow-hidden"
      >
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-3xl bg-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40 transform -rotate-3">
              <Landmark size={32} />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-[var(--text)] tracking-tight">Welcome Back</h1>
          <p className="text-[var(--muted)] text-sm mt-3 font-medium">Manage your expenses with precision</p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[var(--muted)] ml-1 uppercase tracking-wider">Email Address</label>
            <div className="relative group">
              <div className="absolute left-4 top-0 bottom-0 flex items-center justify-center pointer-events-none">
                <Mail className="text-[var(--muted)] group-focus-within:text-indigo-600 transition-colors" size={20} />
              </div>
              <input 
                type="email" 
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-14 pl-14 pr-4 bg-[var(--surface)] border-2 border-[var(--border)] rounded-2xl text-base focus:border-indigo-500 focus:bg-[var(--card)] transition-all outline-none font-medium shadow-sm"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[var(--muted)] ml-1 uppercase tracking-wider">Password</label>
            <div className="relative group">
              <div className="absolute left-4 top-0 bottom-0 flex items-center justify-center pointer-events-none">
                <Lock className="text-[var(--muted)] group-focus-within:text-indigo-600 transition-colors" size={20} />
              </div>
              <input 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-14 pl-14 pr-4 bg-[var(--surface)] border-2 border-[var(--border)] rounded-2xl text-base focus:border-indigo-500 focus:bg-[var(--card)] transition-all outline-none font-medium shadow-sm"
                required
              />
            </div>
          </div>

          {infoMessage && !error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-[var(--income-light)] border border-[var(--income)]/20 rounded-2xl text-[var(--income)] text-xs text-center font-semibold"
            >
              {infoMessage}
            </motion.div>
          )}

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 text-[var(--expense)] text-xs bg-[var(--expense-light)] p-4 rounded-2xl border border-[var(--expense)]/20 font-semibold"
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </motion.div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full h-12 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-6"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Sign In'}
          </button>
        </form>

        <div className="relative my-10 text-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--border)]"></div></div>
          <span className="relative px-4 bg-[var(--card)] text-[var(--muted)] text-[10px] uppercase tracking-widest font-bold">Or continue with</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={handleGoogleSignIn}
            className="h-12 border border-[var(--border)] rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-[var(--text)] hover:bg-[var(--surface)] transition-all active:scale-[0.98] shadow-sm"
          >
            <Chrome size={18} className="text-red-500" />
            Google
          </button>
          <button className="h-12 border border-[var(--border)] rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-[var(--text)] hover:bg-[var(--surface)] transition-all active:scale-[0.98] shadow-sm">
            <Github size={18} />
            GitHub
          </button>
        </div>

        <p className="text-center mt-10 text-sm text-[var(--muted)] font-medium">
          Don't have an account?{' '}
          <button onClick={onToggle} className="text-indigo-600 font-bold hover:underline">Sign Up</button>
        </p>
      </motion.div>
    </div>
  );
};

export default SignIn;
