import React, { useState } from 'react';
import { auth } from './firebase';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { Mail, Lock, UserPlus, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const SignUp = ({ onToggle, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) return setError("Passwords don't match");
    setError('');
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      await auth.signOut(); 
      if (onSuccess) onSuccess(email);
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[400px] bg-[var(--card)] p-8 rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] border border-[var(--border)] relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-[var(--brand-gradient)]"></div>
        
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--brand-gradient)] flex items-center justify-center text-white shadow-[var(--shadow-glow)]">
              <UserPlus size={24} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Create Account</h1>
          <p className="text-[var(--muted)] text-sm mt-2">Start your financial journey today</p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">
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

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--muted)] ml-1 uppercase tracking-wider">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} />
              <input 
                type="password" 
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Sign Up'}
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-[var(--muted)]">
          Already have an account?{' '}
          <button onClick={onToggle} className="text-[var(--accent)] font-bold hover:underline">Sign In</button>
        </p>
      </motion.div>
    </div>
  );
};

export default SignUp;
