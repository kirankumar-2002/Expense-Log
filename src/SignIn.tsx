import React, { useState } from 'react';
import { auth, googleProvider } from './firebase';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { Mail, Lock, AlertCircle, Command, Chrome } from 'lucide-react';
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
    <div className="auth-page">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="auth-card"
      >
        <div className="auth-icon-wrap">
          <Command size={32} />
        </div>

        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">
          Enter your credentials to access your <br />
          AI workspace.
        </p>

        <form onSubmit={handleSignIn}>
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
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                required
              />
            </div>
          </div>

          <div className="auth-options">
            <label className="auth-checkbox">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>
            <button type="button" className="auth-link">Forgot password?</button>
          </div>

          {infoMessage && !error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 mb-6 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-600 text-xs text-center font-semibold"
            >
              {infoMessage}
            </motion.div>
          )}

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
              'Sign In'
            )}
          </button>
        </form>

        <div className="auth-divider">OR</div>

        <button 
          onClick={handleGoogleSignIn}
          className="auth-social-btn"
        >
          <Chrome size={20} className="text-[#4285F4]" />
          <span>Continue with Google</span>
        </button>

        <p className="auth-footer">
          Don't have an account?{' '}
          <button onClick={onToggle} className="auth-link">Sign up</button>
        </p>
      </motion.div>
    </div>
  );
};

export default SignIn;
