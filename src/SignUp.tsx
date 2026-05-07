import React, { useState } from 'react';
import { auth, db } from './firebase';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Mail, Lock, User, AlertCircle, Command } from 'lucide-react';
import { motion } from 'motion/react';

const SignUp = ({ onToggle, onSuccess, isModal = false }) => {
  const [name, setName] = useState('');
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
    <div className={isModal ? "" : "auth-page"}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="auth-card"
        style={isModal ? { background: 'transparent', backdropFilter: 'none', border: 'none', boxShadow: 'none' } : {}}
      >
        <div className="auth-logo-wrap">
          <img src="/logo.png" alt="Expense Log Pro" className="auth-logo" />
        </div>

        <h1 className="auth-title">Join Us</h1>
        <p className="auth-subtitle">
          Start your financial journey with a <br />
          modern workspace.
        </p>

        <form onSubmit={handleSignUp}>
          <div className="auth-input-group">
            <div className="auth-input-wrapper">
              <User className="auth-input-icon" size={20} />
              <input 
                type="text" 
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="auth-input"
                required
              />
            </div>
          </div>

          <div className="auth-input-group">
            <div className="auth-input-wrapper">
              <Mail className="auth-input-icon" size={20} />
              <input 
                type="email" 
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                required
              />
            </div>
          </div>

          <div className="auth-input-group">
            <div className="auth-input-wrapper">
              <Lock className="auth-input-icon" size={20} />
              <input 
                type="password" 
                placeholder="Create password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                required
              />
            </div>
          </div>

          <div className="auth-input-group">
            <div className="auth-input-wrapper">
              <Lock className="auth-input-icon" size={20} />
              <input 
                type="password" 
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="auth-input"
                required
              />
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 text-rose-500 text-xs bg-rose-50 p-4 mb-6 rounded-2xl border border-rose-100 font-semibold"
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </motion.div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="auth-submit-btn"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <button onClick={onToggle} className="auth-link">Sign in</button>
        </p>
      </motion.div>
    </div>
  );
};

export default SignUp;
