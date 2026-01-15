import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import { Mail, ShieldCheck, Lock, ChevronLeft } from "lucide-react";

const ForgotPassword = ({ onClose }) => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { forgotPassword, verifyResetOTP, resetPassword } = useAuth();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await forgotPassword(email);
      if (result.success) {
        setStep(2);
        setSuccess("Verification code sent to your email!");
      } else {
        setError(result.error || "Failed to send code");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError("");
    if (otp.length < 6) {
        setError("Please enter the 6-digit code");
        return;
    }
    setIsLoading(true);

    try {
      const result = await verifyResetOTP(email, otp);
      if (result.success) {
        setStep(3);
        setSuccess("Code verified! Now set your new password.");
      } else {
        setError(result.error || "Invalid code");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
        setError("Password must be at least 6 characters");
        return;
    }

    setIsLoading(true);

    try {
      const result = await resetPassword(email, otp, newPassword);
      if (result.success) {
        setSuccess("Password changed successfully! You can now log in.");
        setTimeout(() => onClose(), 2000);
      } else {
        setError(result.error || "Failed to reset password");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <form onSubmit={handleSendOTP} className="space-y-5">
            <div className="text-center mb-6">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Forgot Password?</h3>
                <p className="text-gray-500 text-sm mt-1">No worries! Enter your email and we'll send you an OTP.</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center disabled:opacity-70"
            >
              {isLoading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Send Code"}
            </button>
          </form>
        );
      case 2:
        return (
          <form onSubmit={handleVerifyOTP} className="space-y-5">
            <button 
                type="button" 
                onClick={() => setStep(1)}
                className="flex items-center text-gray-500 hover:text-indigo-600 text-sm font-semibold transition-colors mb-2"
            >
                <ChevronLeft size={16} className="mr-1" /> Back
            </button>
            <div className="text-center mb-6">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Verify Code</h3>
                <p className="text-gray-500 text-sm mt-1">Enter the 6-digit code sent to <span className="text-gray-900 font-medium">{email}</span></p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 ml-1">Verification Code</label>
              <input
                type="text"
                maxLength="6"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="w-full text-center tracking-[1em] text-2xl font-bold py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                placeholder="000000"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || otp.length < 6}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center disabled:opacity-70"
            >
              {isLoading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Verify OTP"}
            </button>
            <div className="text-center">
                <button 
                  type="button"
                  onClick={handleSendOTP}
                  className="text-indigo-600 font-bold text-sm hover:underline"
                >
                  Resend Code
                </button>
            </div>
          </form>
        );
      case 3:
        return (
          <form onSubmit={handleResetPassword} className="space-y-5">
             <div className="text-center mb-6">
                <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">New Password</h3>
                <p className="text-gray-500 text-sm mt-1">Create a strong password to secure your account.</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 ml-1">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Min 6 characters"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 ml-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Repeat password"
                    required
                  />
                </div>
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center disabled:opacity-70"
            >
              {isLoading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Update Password"}
            </button>
          </form>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-white rounded-[32px] shadow-2xl p-8 w-full max-w-sm relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute right-6 top-6 text-gray-400 hover:text-gray-900 transition-colors p-2 hover:bg-gray-100 rounded-full"
        >
          <span className="sr-only">Close</span>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>

        {/* Global Notifications */}
        <div className="mt-4 space-y-2">
            <AnimatePresence>
                {success && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-emerald-50 text-emerald-700 text-xs font-medium p-3 rounded-xl border border-emerald-100"
                    >
                        {success}
                    </motion.div>
                )}
                {error && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-rose-50 text-rose-700 text-xs font-medium p-3 rounded-xl border border-rose-100"
                    >
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ForgotPassword;