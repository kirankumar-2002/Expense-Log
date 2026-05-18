import React, { useState } from 'react';
import { auth, googleProvider } from './firebase';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
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
    <div className={isModal ? "w-full max-w-[400px] mx-auto" : "min-h-screen flex items-center justify-center bg-[#F8F9FE] p-4"}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`w-full max-w-[400px] bg-white rounded-[32px] p-8 ${!isModal ? 'shadow-[0_8px_30px_rgb(0,0,0,0.04)]' : ''}`}
      >
        <div className="flex justify-center mb-6 drop-shadow-sm">
          <img src="/logo.png" alt="Logo" className="w-[84px] h-auto object-contain" />
        </div>

        <h1 className="text-[26px] font-bold text-center text-gray-900 tracking-tight">Welcome Back</h1>
        <p className="text-[13px] font-medium text-gray-400 text-center mt-1.5 mb-8">
          Enter your credentials
        </p>

        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="relative flex items-center">
            <Mail className="absolute left-4 text-gray-400" size={18} strokeWidth={2} />
            <input 
              type="email" 
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-[52px] pl-11 pr-4 bg-white border border-gray-200/80 rounded-2xl text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
              required
            />
          </div>

          <div className="relative flex items-center">
            <Lock className="absolute left-4 text-gray-400" size={18} strokeWidth={2} />
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-[52px] pl-11 pr-12 bg-white border border-gray-200/80 rounded-2xl text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
              required
            />
            <button 
              type="button"
              className="absolute right-4 text-gray-400 hover:text-gray-600 transition-colors"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
            </button>
          </div>

          <div className="flex items-center justify-between pt-1 pb-3">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="flex items-center justify-center w-[18px] h-[18px] border-[1.5px] border-gray-300 rounded-[5px] group-hover:border-violet-400 transition-colors has-[:checked]:bg-violet-500 has-[:checked]:border-violet-500">
                <input type="checkbox" className="sr-only" />
                <svg className="w-2.5 h-2.5 text-white pointer-events-none opacity-0 group-has-[:checked]:opacity-100" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 5L4.5 8.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-[13px] font-medium text-gray-500 select-none">Remember me</span>
            </label>
            <button type="button" className="text-[13px] font-semibold text-[#8B5CF6] hover:text-violet-600 transition-colors">
              Forgot password?
            </button>
          </div>

          {infoMessage && !error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-600 text-[13px] text-center font-semibold"
            >
              {infoMessage}
            </motion.div>
          )}

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2.5 text-rose-500 text-[13px] bg-rose-50 p-3 rounded-2xl border border-rose-100 font-semibold"
            >
              <AlertCircle size={16} strokeWidth={2.5} />
              <span>{error}</span>
            </motion.div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full h-[52px] bg-[#8B5CF6] hover:bg-violet-600 active:bg-violet-700 text-white rounded-2xl text-[15px] font-semibold transition-colors disabled:opacity-70 flex items-center justify-center shadow-sm shadow-violet-500/20"
          >
            {loading ? (
              <div className="w-5 h-5 border-[2.5px] border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="relative flex items-center justify-center mt-7 mb-6">
          <div className="absolute w-full h-[1px] bg-gray-100"></div>
          <span className="relative bg-white px-3 text-[11px] font-bold tracking-wider text-gray-300 uppercase">OR</span>
        </div>

        <button 
          onClick={handleGoogleSignIn}
          className="w-full h-[52px] bg-white border border-gray-200/80 hover:bg-gray-50 rounded-2xl text-[14px] font-semibold text-gray-700 transition-colors flex items-center justify-center gap-3"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M23.766 12.2764C23.766 11.4607 23.6999 10.6406 23.5588 9.83807H12.24V14.4591H18.7217C18.4528 15.9105 17.5885 17.1582 16.3414 17.9721V20.9573H20.1779C22.4314 18.8815 23.766 15.8544 23.766 12.2764Z" fill="#4285F4"/>
            <path d="M12.2401 24.0008C15.4766 24.0008 18.2059 22.9382 20.1845 21.1039L16.348 18.1188C15.2827 18.843 13.884 19.2631 12.2467 19.2631C9.10731 19.2631 6.44853 17.1582 5.4954 14.3148H1.54V17.3812C3.51866 21.2915 7.59301 24.0008 12.2401 24.0008Z" fill="#34A853"/>
            <path d="M5.4954 14.3148C5.24432 13.5721 5.11219 12.7818 5.11219 11.9701C5.11219 11.1584 5.24432 10.3681 5.4954 9.62531V6.55884H1.54C0.697412 8.22591 0.222168 10.0435 0.222168 11.9701C0.222168 13.8967 0.697412 15.7143 1.54 17.3813L5.4954 14.3148Z" fill="#FBBC05"/>
            <path d="M12.2401 4.70701C14.0074 4.70701 15.5864 5.31161 16.8335 6.49121L20.2638 3.06091C18.1993 1.13281 15.47 0 12.2401 0C7.59301 0 3.51866 2.70931 1.54 6.61961L5.4954 9.68608C6.44853 6.84271 9.10731 4.73781 12.2401 4.70701Z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <p className="text-center text-[13px] font-medium text-gray-500 mt-8">
          Don't have an account?{' '}
          <button onClick={onToggle} className="text-[#8B5CF6] hover:text-violet-600 font-semibold transition-colors">
            Sign up
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default SignIn;

