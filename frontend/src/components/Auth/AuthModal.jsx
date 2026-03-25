import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Mail, Lock, User, ShieldCheck, Zap, 
  ArrowRight, Chrome, Eye, EyeOff,
  ChevronLeft, KeyRound
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext.jsx";

const AuthModal = ({ isOpen, onClose }) => {
  const { login, signupWithVerification, googleLogin, forgotPassword, verifyResetOTP, resetPassword } = useAuth();
  const [mode, setMode] = useState('login'); // 'login', 'signup', 'forgot', 'verify', 'reset'
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
    otp: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFormData({ email: "", password: "", confirmPassword: "", username: "", otp: "" });
    setError("");
    setSuccess("");
    setShowPassword(false);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      let result;
      if (mode === 'login') {
        result = await login(formData.email, formData.password);
      } else if (mode === 'signup') {
        result = await signupWithVerification({
          name: formData.username,
          email: formData.email,
          password: formData.password,
          requireVerification: true
        });
      } else if (mode === 'forgot') {
        result = await forgotPassword(formData.email);
        if (result.success) {
          setMode('verify');
          setSuccess("Verification code sent to your email.");
          setIsLoading(false);
          return;
        }
      } else if (mode === 'verify') {
        result = await verifyResetOTP(formData.email, formData.otp);
        if (result.success) {
          setMode('reset');
          setSuccess("Account verified successfully.");
          setIsLoading(false);
          return;
        }
      } else if (mode === 'reset') {
        result = await resetPassword(formData.email, formData.otp, formData.password);
      }

      if (result.success) {
        if (mode === 'login' || mode === 'reset') {
          setSuccess(mode === 'login' ? "Access granted." : "Password reset successfully.");
          setTimeout(() => {
            onClose();
            handleReset();
            setMode('login');
          }, 1500);
        } else if (mode === 'signup') {
          setSuccess("Account created! Please check your email for the verification code.");
        }
      } else {
        setError(result.error || (mode === 'login' ? "Authentication failed" : "Registration failed"));
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const renderForm = () => {
    switch(mode) {
      case 'login':
      case 'signup':
        return (
          <>
            <div className="mb-6">
               <h3 className="text-2xl font-black text-slate-900 tracking-tighter font-jakarta uppercase">
                  {mode === 'login' ? "Welcome Back" : "Create Account"}
               </h3>
               <p className="text-slate-500 font-bold text-[10px] mt-1 font-jakarta uppercase tracking-wider">
                  {mode === 'login' ? "Sign in to access your dashboard" : "Join the PinQuest explorer community"}
               </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
               {mode === 'signup' && (
                 <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 font-jakarta ml-0.5">Full Name</label>
                    <div className="relative group">
                       <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-slate-900" size={16} />
                       <input 
                         type="text" name="username" value={formData.username} onChange={handleInputChange} required
                         className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 focus:outline-none focus:border-slate-900 font-bold text-slate-900 placeholder:text-slate-300 text-sm font-outfit"
                         placeholder="Ex: John Doe"
                       />
                    </div>
                 </div>
               )}

               <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 font-jakarta ml-0.5">Email Address</label>
                  <div className="relative group">
                     <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-slate-900" size={16} />
                     <input 
                       type="email" name="email" value={formData.email} onChange={handleInputChange} required
                       className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 focus:outline-none focus:border-slate-900 font-bold text-slate-900 placeholder:text-slate-300 text-sm font-outfit"
                       placeholder="name@example.com"
                     />
                  </div>
               </div>

               <div className="space-y-1">
                  <div className="flex justify-between items-center px-0.5">
                     <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 font-jakarta">Password</label>
                     {mode === 'login' && <button onClick={() => setMode('forgot')} type="button" className="text-[9px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600 font-jakarta outline-none">Forgot Password?</button>}
                  </div>
                  <div className="relative group">
                     <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-slate-900" size={16} />
                     <input 
                       type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleInputChange} required
                       className="w-full h-11 pl-10 pr-10 bg-white border border-slate-200 focus:outline-none focus:border-slate-900 font-bold text-slate-900 placeholder:text-slate-300 text-sm font-outfit"
                       placeholder="••••••••"
                     />
                     <button 
                        type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-900 transition-colors outline-none"
                     >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                     </button>
                  </div>
               </div>

               {error && <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest py-1 font-jakarta">{error}</p>}
               {success && <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest py-1 font-jakarta">{success}</p>}

               <button 
                 type="submit" disabled={isLoading}
                 className="w-full h-11 bg-slate-900 text-white font-black text-[11px] uppercase tracking-[0.25em] hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50 font-jakarta mt-2"
               >
                  {isLoading ? "Wait a moment..." : (mode === 'login' ? "Sign In" : "Sign Up")}
                  {!isLoading && <ArrowRight size={14} strokeWidth={3} />}
               </button>

               <div className="mt-6">
                  <div className="relative flex items-center py-2">
                      <div className="flex-grow border-t border-slate-100"></div>
                      <span className="flex-shrink mx-4 text-[8px] font-black uppercase tracking-[0.2em] text-slate-300 font-jakarta">Or Continue With</span>
                      <div className="flex-grow border-t border-slate-100"></div>
                  </div>
                  
                  <button 
                    type="button"
                    onClick={() => googleLogin()}
                    className="w-full h-10 bg-white border border-slate-200 flex items-center justify-center gap-2 font-black text-[9px] uppercase tracking-widest text-slate-900 hover:bg-slate-50 transition-all font-jakarta mt-3 shadow-sm"
                  >
                      <Chrome size={14} />
                      Google Account
                  </button>
               </div>
            </form>

            <div className="mt-8 text-center border-t border-slate-50 pt-6">
               <p className="text-slate-400 font-bold text-[9px] font-jakarta uppercase tracking-widest">
                  {mode === 'login' ? "New Explorer? " : "Already have an account? "}
                  <button 
                    onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); handleReset(); }}
                    className="text-indigo-500 hover:text-indigo-600 transition-colors font-black outline-none"
                  >
                     {mode === 'login' ? "Create an account" : "Sign in here"}
                  </button>
               </p>
            </div>
          </>
        );
      case 'forgot':
      case 'verify':
      case 'reset':
        return (
          <>
            <div className="mb-6">
               <h3 className="text-2xl font-black text-slate-900 tracking-tighter font-jakarta uppercase">
                  {mode === 'forgot' ? "Forgot Password" : mode === 'verify' ? "Verify Email" : "Reset Password"}
               </h3>
               <p className="text-slate-500 font-bold text-[10px] mt-1 font-jakarta uppercase tracking-wider">
                  {mode === 'forgot' ? "Input your account email" : mode === 'verify' ? "Enter the 6-digit code" : "Establish a new password"}
               </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
               {mode === 'forgot' && (
                 <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 font-jakarta ml-0.5">Email Address</label>
                    <div className="relative group">
                       <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-slate-900" size={16} />
                       <input 
                         type="email" name="email" value={formData.email} onChange={handleInputChange} required
                         className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 focus:outline-none focus:border-slate-900 font-bold text-slate-900 placeholder:text-slate-300 text-sm font-outfit"
                         placeholder="name@example.com"
                       />
                    </div>
                 </div>
               )}

               {mode === 'verify' && (
                 <div className="space-y-4">
                    <input 
                      type="text" maxLength="6" name="otp" value={formData.otp} onChange={handleInputChange} required
                      className="w-full h-16 text-center text-3xl font-black bg-slate-50 border border-slate-200 focus:outline-none focus:border-slate-900 transition-all text-slate-900 tracking-[0.2em] font-jakarta"
                      placeholder="000000"
                    />
                 </div>
               )}

               {mode === 'reset' && (
                 <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 font-jakarta ml-0.5">New Password</label>
                    <div className="relative group">
                       <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-slate-900" size={16} />
                       <input 
                         type="password" name="password" value={formData.password} onChange={handleInputChange} required
                         className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 focus:outline-none focus:border-slate-900 font-bold text-slate-900 placeholder:text-slate-300 text-sm font-outfit"
                         placeholder="Min 6 characters"
                       />
                    </div>
                 </div>
               )}

               {error && <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest py-1 font-jakarta">{error}</p>}
               {success && <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest py-1 font-jakarta">{success}</p>}

               <button 
                 type="submit" disabled={isLoading}
                 className="w-full h-11 bg-slate-900 text-white font-black text-[11px] uppercase tracking-[0.25em] hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50 font-jakarta mt-2"
               >
                  {isLoading ? "Please wait..." : mode === 'forgot' ? "Send Reset Link" : mode === 'verify' ? "Verify Email" : "Reset Password"}
                  {!isLoading && <ArrowRight size={14} strokeWidth={3} />}
               </button>

               <button 
                 type="button" 
                 onClick={() => { setMode('login'); handleReset(); }} 
                 className="w-full text-center text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors font-jakarta outline-none mt-2"
               >
                  Back to Login
               </button>
            </form>
          </>
        );
      default: return null;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
        {/* Simple Dismissible Backdrop */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 z-0"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-[420px] bg-white shadow-2xl overflow-hidden z-10"
          style={{ borderRadius: '4px' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Gradient Accent Line */}
          <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute right-4 top-4 text-slate-300 hover:text-slate-900 transition-colors outline-none"
          >
            <X size={18} />
          </button>

          {/* Compact Form Content */}
          <div className="px-10 py-10 md:px-12">
             <AnimatePresence mode="wait">
               <motion.div
                 key={mode}
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 transition={{ duration: 0.1 }}
               >
                 {renderForm()}
               </motion.div>
             </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AuthModal;
