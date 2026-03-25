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
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            setIsLoading(false);
            return;
        }
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
          setSuccess("Verification code dispatched.");
          setIsLoading(false);
          return;
        }
      } else if (mode === 'verify') {
        result = await verifyResetOTP(formData.email, formData.otp);
        if (result.success) {
          setMode('reset');
          setSuccess("Code authenticated. Secure your node.");
          setIsLoading(false);
          return;
        }
      } else if (mode === 'reset') {
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match");
          setIsLoading(false);
          return;
        }
        result = await resetPassword(formData.email, formData.otp, formData.password);
      }

      if (result.success) {
        if (mode === 'login' || mode === 'reset') {
          setSuccess("Synchronization complete. Access granted.");
          setTimeout(() => {
            onClose();
            handleReset();
            setMode('login');
          }, 1500);
        } else if (mode === 'signup') {
          setSuccess("Deployment protocol active. Check your email.");
        }
      } else {
        setError(result.error || "Operation failed");
      }
    } catch (err) {
      setError(err.message || "Nexus error detected");
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
            <div className="mb-8 text-center">
               <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center shadow-2xl mx-auto mb-6">
                  <Zap size={28} className="text-teal-400 fill-teal-400" />
               </div>
               <div className="flex items-center gap-2 mb-1 text-teal-600 justify-center">
                  <ShieldCheck size={14} strokeWidth={3} />
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] font-jakarta">Security Access</span>
               </div>
               <h3 className="text-3xl font-black text-slate-900 tracking-tighter font-jakarta">
                  {mode === 'login' ? "Welcome Back" : "Initiate Account"}
               </h3>
               <p className="text-slate-400 font-bold text-[11px] mt-2 uppercase tracking-widest font-jakarta">
                  Map your next adventure.
               </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
               {mode === 'signup' && (
                 <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-teal-500" size={18} />
                    <input 
                      type="text" name="username" value={formData.username} onChange={handleInputChange} required
                      className="w-full h-14 pl-12 pr-6 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-slate-900 focus:bg-white transition-all font-bold text-slate-900 placeholder:text-slate-300 font-outfit"
                      placeholder="Username"
                    />
                 </div>
               )}

               <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-teal-500" size={18} />
                  <input 
                    type="email" name="email" value={formData.email} onChange={handleInputChange} required
                    className="w-full h-14 pl-12 pr-6 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-slate-900 focus:bg-white transition-all font-bold text-slate-900 placeholder:text-slate-300 font-outfit"
                    placeholder="Email Address"
                  />
               </div>

               <div className="space-y-1 group">
                  <div className="relative">
                     <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-teal-500" size={18} />
                     <input 
                       type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleInputChange} required
                       className="w-full h-14 pl-12 pr-12 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-slate-900 focus:bg-white transition-all font-bold text-slate-900 placeholder:text-slate-300 font-outfit"
                       placeholder="Credential"
                     />
                     <button 
                        type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-900 transition-colors outline-none"
                     >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                     </button>
                  </div>
                  {mode === 'login' && (
                    <div className="flex justify-end px-1">
                      <button onClick={() => setMode('forgot')} type="button" className="text-[10px] font-black uppercase tracking-widest text-teal-600 hover:text-teal-700 font-jakarta outline-none">Lost Key?</button>
                    </div>
                  )}
               </div>

               {mode === 'signup' && (
                  <div className="relative group">
                     <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-teal-500" size={18} />
                     <input 
                       type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} required
                       className="w-full h-14 pl-12 pr-6 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-slate-900 focus:bg-white transition-all font-bold text-slate-900 placeholder:text-slate-300 font-outfit"
                       placeholder="Confirm Credential"
                     />
                  </div>
               )}

               {error && <p className="text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-50 p-4 rounded-2xl border border-red-100 font-jakarta leading-relaxed">{error}</p>}
               {success && <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest bg-teal-50 p-4 rounded-2xl border border-teal-100 font-jakarta leading-relaxed">{success}</p>}

               <button 
                 type="submit" disabled={isLoading}
                 className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.25em] shadow-2xl shadow-slate-200 hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 font-jakarta mt-4"
               >
                  {isLoading ? "Synchronizing..." : (mode === 'login' ? "Authenticate" : "Create Node")}
                  {!isLoading && <ArrowRight size={16} strokeWidth={3} />}
               </button>

               <div className="mt-8">
                  <div className="relative flex items-center py-2">
                      <div className="flex-grow border-t border-slate-100"></div>
                      <span className="flex-shrink mx-4 text-[9px] font-black uppercase tracking-widest text-slate-300 font-jakarta">Or Continue With</span>
                      <div className="flex-grow border-t border-slate-100"></div>
                  </div>
                  
                  <button 
                    type="button"
                    onClick={() => googleLogin()}
                    className="w-full h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest text-slate-900 hover:bg-slate-50 transition-all shadow-sm font-jakarta mt-4"
                  >
                      <Chrome size={18} />
                      Google Integration
                  </button>
               </div>
            </form>

            <div className="mt-10 text-center">
               <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest font-jakarta">
                  {mode === 'login' ? "New Explorer?" : "Established Node?"}
                  <button 
                    onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); handleReset(); }}
                    className="ml-3 text-teal-600 hover:text-teal-700 transition-colors font-black outline-none"
                  >
                     {mode === 'login' ? "Initiate" : "Access"}
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
            <div className="mb-8 text-center pt-2">
               <div className="flex items-center gap-2 mb-2 text-teal-600 justify-center">
                  <KeyRound size={20} strokeWidth={3} />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] font-jakarta">Node Recovery</span>
               </div>
               <h3 className="text-3xl font-black text-slate-900 tracking-tighter font-jakarta">
                  {mode === 'forgot' ? "Lost Key" : mode === 'verify' ? "Verify Signal" : "Secure Node"}
               </h3>
               <p className="text-slate-400 font-bold text-[11px] mt-2 uppercase tracking-widest font-jakarta leading-relaxed max-w-[240px] mx-auto">
                  {mode === 'forgot' ? "Input your terminal email." : mode === 'verify' ? `Enter the verification code.` : "Establish new credential."}
               </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
               {mode === 'forgot' && (
                 <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal-500 transition-colors" size={18} />
                    <input 
                      type="email" name="email" value={formData.email} onChange={handleInputChange} required
                      className="w-full h-14 pl-12 pr-6 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-slate-900 focus:bg-white transition-all font-bold text-slate-900 placeholder:text-slate-300 font-outfit"
                      placeholder="Email Address"
                    />
                 </div>
               )}

               {mode === 'verify' && (
                 <div className="space-y-4">
                    <input 
                      type="text" maxLength="6" name="otp" value={formData.otp} onChange={handleInputChange} required
                      className="w-full h-20 text-center text-4xl font-black bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-slate-900 focus:bg-white transition-all text-slate-900 tracking-[0.2em] font-jakarta"
                      placeholder="000000"
                    />
                 </div>
               )}

               {mode === 'reset' && (
                 <div className="space-y-4">
                    <div className="relative group">
                       <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal-500 transition-colors" size={18} />
                       <input 
                         type="password" name="password" value={formData.password} onChange={handleInputChange} required
                         className="w-full h-14 pl-12 pr-6 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-slate-900 focus:bg-white transition-all font-bold text-slate-900 placeholder:text-slate-300 font-outfit"
                         placeholder="New Credential"
                       />
                    </div>
                    <div className="relative group">
                       <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal-500 transition-colors" size={18} />
                       <input 
                         type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} required
                         className="w-full h-14 pl-12 pr-6 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-slate-900 focus:bg-white transition-all font-bold text-slate-900 placeholder:text-slate-300 font-outfit"
                         placeholder="Confirm credential"
                       />
                    </div>
                 </div>
               )}

               {error && <p className="text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-50 p-4 rounded-2xl border border-red-100 font-jakarta leading-relaxed">{error}</p>}
               {success && <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest bg-teal-50 p-4 rounded-2xl border border-teal-100 font-jakarta leading-relaxed">{success}</p>}

               <button 
                 type="submit" disabled={isLoading}
                 className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.25em] shadow-2xl shadow-slate-200 hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 font-jakarta mt-4"
               >
                  {isLoading ? "Synchronizing..." : mode === 'forgot' ? "Emit Signal" : mode === 'verify' ? "Link Node" : "Update Secure Key"}
                  {!isLoading && <ArrowRight size={16} strokeWidth={3} />}
               </button>

               <button 
                 type="button" 
                 onClick={() => { setMode('login'); handleReset(); }} 
                 className="w-full text-center text-slate-400 hover:text-slate-900 transition-colors mt-6 text-[10px] font-black uppercase tracking-widest font-jakarta outline-none"
               >
                  Cancel Recovery
               </button>
            </form>
          </>
        );
      default: return null;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 sm:p-6">
        {/* Pro Backdrop - Deep Blur */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-[440px] bg-white rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute right-6 top-6 z-20 w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm outline-none"
          >
            <X size={20} strokeWidth={2.5} />
          </button>

          {/* Simple Form Container */}
          <div className="p-8 sm:p-12 flex flex-col justify-center bg-white overflow-y-auto max-h-[90vh] scrollbar-hide">
             <AnimatePresence mode="wait">
               <motion.div
                 key={mode}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -10 }}
                 transition={{ duration: 0.2 }}
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
