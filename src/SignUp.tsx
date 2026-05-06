import React, { useState } from 'react';
import { auth, db } from './firebase';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Mail, Lock, UserPlus, AlertCircle, User, AtSign, Landmark } from 'lucide-react';
import { motion } from 'motion/react';

const SignUp = ({ onToggle, onSuccess }) => {
  const [name, setName] = useState('');
  const [userId, setUserId] = useState('');
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
      
      const generatedId = email ? email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') : '';
      
      // Store user details in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name,
        userId: generatedId.toLowerCase(),
        email,
        plan: 'free',
        createdAt: new Date().toISOString()
      });

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
        className="w-full max-w-[440px] bg-[var(--card)] p-10 rounded-[40px] shadow-[var(--shadow-lg)] border border-[var(--border)] relative overflow-hidden"
      >
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-3xl bg-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40 transform -rotate-3">
              <Landmark size={32} />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-[var(--text)] tracking-tight">Sign Up</h1>
          <p className="text-[var(--muted)] text-sm mt-3 font-medium">Start your financial journey today</p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[var(--muted)] ml-1 uppercase tracking-wider">Full Name</label>
            <div className="relative group">
              <div className="absolute left-4 top-0 bottom-0 flex items-center justify-center pointer-events-none">
                <User className="text-[var(--muted)] group-focus-within:text-indigo-600 transition-colors" size={20} />
              </div>
              <input 
                type="text" 
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-14 pl-12 pr-4 bg-[var(--surface)] border-2 border-[var(--border)] rounded-2xl text-base focus:border-indigo-500 focus:bg-[var(--card)] transition-all outline-none font-medium shadow-sm"
                required
              />
            </div>
          </div>

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

          <div className="grid grid-cols-2 gap-4">
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
                  className="w-full h-14 pl-12 pr-4 bg-[var(--surface)] border-2 border-[var(--border)] rounded-2xl text-base focus:border-indigo-500 focus:bg-[var(--card)] transition-all outline-none font-medium shadow-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[var(--muted)] ml-1 uppercase tracking-wider">Confirm</label>
              <div className="relative group">
                <div className="absolute left-4 top-0 bottom-0 flex items-center justify-center pointer-events-none">
                  <Lock className="text-[var(--muted)] group-focus-within:text-indigo-600 transition-colors" size={20} />
                </div>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 bg-[var(--surface)] border-2 border-[var(--border)] rounded-2xl text-base focus:border-indigo-500 focus:bg-[var(--card)] transition-all outline-none font-medium shadow-sm"
                  required
                />
              </div>
            </div>
          </div>

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
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Sign Up'}
          </button>
        </form>

        <p className="text-center mt-10 text-sm text-[var(--muted)] font-medium">
          Already have an account?{' '}
          <button onClick={onToggle} className="text-indigo-600 font-bold hover:underline">Sign In</button>
        </p>
      </motion.div>
    </div>
  );
};

export default SignUp;
