import React, { useState } from 'react';
import { auth, googleProvider } from './firebase';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { Mail, Lock, AlertCircle, Command, Chrome, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';

const SignIn = ({ onToggle, prefilledEmail = '', initialMessage = '', isModal = false }) => {
  const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState(initialMessage);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    <div className={isModal ? "" : "auth-page"}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="auth-card"
        style={isModal ? { background: 'transparent', backdropFilter: 'none', border: 'none', boxShadow: 'none' } : {}}
      >
        <img src="/logo.png" alt="Expense Log Pro" className="auth-logo" />

        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">
          Enter your credentials
        </p>

        <form onSubmit={handleSignIn}>
          <div className="auth-input-group">
            <div className="auth-input-wrapper">
              <Mail className="auth-input-icon" size={18} />
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
              <Lock className="auth-input-icon" size={18} />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                required
              />
              <button 
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
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
              className="p-3 mb-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-600 text-xs text-center font-semibold"
            >
              {infoMessage}
            </motion.div>
          )}

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 text-rose-500 text-xs bg-rose-50 p-3 mb-4 rounded-2xl border border-rose-100 font-semibold"
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

        <div className="auth-divider">
          <span className="auth-divider-text">OR</span>
        </div>

        <button 
          onClick={handleGoogleSignIn}
          className="auth-social-btn"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M23.766 12.2764C23.766 11.4607 23.6999 10.6406 23.5588 9.83807H12.24V14.4591H18.7217C18.4528 15.9105 17.5885 17.1582 16.3414 17.9721V20.9573H20.1779C22.4314 18.8815 23.766 15.8544 23.766 12.2764Z" fill="#4285F4"/>
            <path d="M12.2401 24.0008C15.4766 24.0008 18.2059 22.9382 20.1845 21.1039L16.348 18.1188C15.2827 18.843 13.884 19.2631 12.2467 19.2631C9.10731 19.2631 6.44853 17.1582 5.4954 14.3148H1.54V17.3812C3.51866 21.2915 7.59301 24.0008 12.2401 24.0008Z" fill="#34A853"/>
            <path d="M5.4954 14.3148C5.24432 13.5721 5.11219 12.7818 5.11219 11.9701C5.11219 11.1584 5.24432 10.3681 5.4954 9.62531V6.55884H1.54C0.697412 8.22591 0.222168 10.0435 0.222168 11.9701C0.222168 13.8967 0.697412 15.7143 1.54 17.3813L5.4954 14.3148Z" fill="#FBBC05"/>
            <path d="M12.2401 4.70701C14.0074 4.70701 15.5864 5.31161 16.8335 6.49121L20.2638 3.06091C18.1993 1.13281 15.47 0 12.2401 0C7.59301 0 3.51866 2.70931 1.54 6.61961L5.4954 9.68608C6.44853 6.84271 9.10731 4.73781 12.2401 4.70701Z" fill="#EA4335"/>
          </svg>
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
