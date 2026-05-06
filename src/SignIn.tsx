import React, { useState } from 'react';
import { auth, googleProvider } from './firebase';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { Mail, Lock, LogIn, Github, Chrome, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const SignIn = ({ onToggle }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Redirect handled by onAuthStateChanged in App.tsx
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-max-w-[400px] bg-[var(--card)] p-8 rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] border border-[var(--border)] relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-[var(--brand-gradient)]"></div>
        
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--brand-gradient)] flex items-center justify-center text-white shadow-[var(--shadow-glow)]">
              <LogIn size={24} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Welcome Back</h1>
          <p className="text-[var(--muted)] text-sm mt-2">Manage your expenses with precision</p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--muted)] ml-1 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} />
              <input 
                type="email" 
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-[var(--surface)] border-0 rounded-[var(--radius-full)] text-sm focus:ring-2 focus:ring-[var(--accent)] transition-all outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--muted)] ml-1 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} />
              <input 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-[var(--surface)] border-0 rounded-[var(--radius-full)] text-sm focus:ring-2 focus:ring-[var(--accent)] transition-all outline-none"
                required
              />
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-[var(--expense)] text-xs bg-[var(--expense-light)] p-3 rounded-[var(--radius-sm)]"
            >
              <AlertCircle size={14} />
              <span>{error}</span>
            </motion.div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full h-12 bg-[var(--brand-gradient)] text-white font-bold rounded-[var(--radius-full)] shadow-[var(--shadow-glow)] hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Sign In'}
          </button>
        </form>

        <div className="relative my-8 text-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--border)]"></div></div>
          <span className="relative px-4 bg-[var(--card)] text-[var(--muted)] text-xs uppercase tracking-widest font-semibold">Or continue with</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={handleGoogleSignIn}
            className="h-12 border border-[var(--border)] rounded-[var(--radius-full)] flex items-center justify-center gap-2 text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface)] transition-all active:scale-[0.98]"
          >
            <Chrome size={18} />
            Google
          </button>
          <button className="h-12 border border-[var(--border)] rounded-[var(--radius-full)] flex items-center justify-center gap-2 text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface)] transition-all active:scale-[0.98]">
            <Github size={18} />
            GitHub
          </button>
        </div>

        <p className="text-center mt-8 text-sm text-[var(--muted)]">
          Don't have an account?{' '}
          <button onClick={onToggle} className="text-[var(--accent)] font-bold hover:underline">Sign Up</button>
        </p>
      </motion.div>
    </div>
  );
};

export default SignIn;
