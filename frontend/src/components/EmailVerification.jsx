import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { directAuthApi } from '../services/authApi';
import { toast } from 'react-toastify';

const EmailVerification = () => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Get email from location state or localStorage
    const emailFromState = location.state?.email;
    const emailFromStorage = localStorage.getItem('verificationEmail');
    
    if (emailFromState) {
      setEmail(emailFromState);
    } else if (emailFromStorage) {
      setEmail(emailFromStorage);
    } else {
      // Redirect to signup if no email is found
      toast.error('Email not found. Please sign up again.');
      navigate('/signup');
    }
  }, [location.state, navigate]);

  useEffect(() => {
    // Start a 60-second countdown for resending the code
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleCodeChange = (index, value) => {
    if (/^\d$/.test(value) || value === '') {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      // Move to next input field if a digit is entered
      if (value !== '' && index < 5) {
        const nextInput = document.getElementById(`code-input-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-input-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (code.some(digit => !digit)) {
      toast.error('Please enter the complete verification code');
      return;
    }

    const verificationCode = code.join('');
    
    setLoading(true);
    try {
      const result = await directAuthApi.verifyEmail(email, verificationCode);
      
      if (result.success) {
        // Store token in localStorage
        localStorage.setItem('token', result.token);
        localStorage.removeItem('verificationEmail'); // Clean up
        
        toast.success('Email verified successfully! Redirecting...');
        
        // Redirect to home page or profile
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        toast.error(result.error || 'Invalid verification code');
      }
    } catch (error) {
      toast.error(error.message || 'An error occurred during verification');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return; // Prevent multiple requests during cooldown

    setResending(true);
    try {
      const result = await directAuthApi.resendVerification(email);
      
      if (result.success) {
        toast.success('Verification code sent successfully!');
        setCountdown(60); // Start 60-second cooldown
      } else {
        toast.error(result.error || 'Failed to resend verification code');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to resend verification code');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4 transition-colors duration-500">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl dark:shadow-none border dark:border-slate-800 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2 font-space">Verify Your Email</h1>
          <p className="text-gray-600 dark:text-gray-400">
            We've sent a 6-digit code to <span className="font-semibold text-indigo-600 dark:text-indigo-400">{email}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-3 text-center uppercase tracking-widest text-[10px]">
              Enter the 6-digit verification code
            </label>
            <div className="flex justify-center space-x-3">
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`code-input-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl font-black border-2 border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:border-indigo-500 dark:focus:border-indigo-500 focus:outline-none transition-all text-slate-900 dark:text-white"
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || code.some(digit => !digit)}
            className={`w-full py-4 px-4 rounded-xl text-white font-black uppercase tracking-widest text-[11px] transition-all shadow-lg ${
              loading || code.some(digit => !digit)
                ? 'bg-slate-400 dark:bg-slate-800 cursor-not-allowed opacity-50'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
            }`}
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-[11px] font-bold uppercase tracking-tight">
            Didn't receive the code?{' '}
            <button
              onClick={handleResendCode}
              disabled={resending || countdown > 0}
              className={`text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-black transition-colors ${
                resending || countdown > 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {resending 
                ? 'Sending...' 
                : countdown > 0 
                  ? `Resend in ${countdown}s` 
                  : 'Resend Code'}
            </button>
          </p>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/signup')}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors"
          >
            Back to Sign Up
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;