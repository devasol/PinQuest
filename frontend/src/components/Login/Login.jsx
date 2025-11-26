import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

const Login = () => {
  const { login, signup, signupWithVerification, googleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
    rememberMe: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      let result;
      if (isLogin) {
        result = await login(formData.email, formData.password);
      } else {
        // Validate password match for signup
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match");
          setIsLoading(false);
          return;
        }

        // Use verification flow for signup
        result = await signupWithVerification({
          name: formData.username,
          email: formData.email,
          password: formData.password,
          requireVerification: true
        });
      }

      if (result.success) {
        if (isLogin) {
          setSuccess("Login successful! Redirecting...");
          // Wait a moment before redirecting to show the success message
          setTimeout(() => {
            navigate("/"); // Redirect to home page after successful login
          }, 1500);
        } else {
          setSuccess("Account created! Please check your email for the verification code.");
          // Wait a moment before redirecting to verification page
          setTimeout(() => {
            navigate("/verify-email", { state: { email: formData.email } });
          }, 2000);
        }
      } else {
        setError(result.error || (isLogin ? "Login failed" : "Signup failed"));
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await googleLogin();
      if (result.success) {
        setSuccess("Google login successful! Redirecting...");
        setTimeout(() => {
          navigate("/"); // Redirect to home page after successful login
        }, 1500);
      } else {
        setError(result.error || "Google login failed");
      }
    } catch (err) {
      setError(err.message || "An error occurred during Google login");
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      email: "",
      password: "",
      confirmPassword: "",
      username: "",
      rememberMe: false,
    });
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center p-4 sm:p-6 pt-20">
      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full mix-blend-multiply opacity-30 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-full mix-blend-multiply opacity-30 blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full mix-blend-multiply opacity-30 blur-3xl animate-pulse delay-2000"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          duration: 0.6,
          ease: [0.22, 0.61, 0.36, 1]
        }}
        className="w-full max-w-lg mx-4 sm:mx-auto"
      >
        {/* Main Container */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 overflow-hidden max-h-[70vh] md:max-h-[none] overflow-y-hidden md:overflow-y-visible">
          {/* Header */}
          <div className="relative p-2 sm:p-4">
            <div className="flex justify-center">
              <div className="relative bg-gray-100 rounded-full p-1 inline-block">
                <button
                  onClick={() => setIsLogin(true)}
                  className={`relative px-4 py-1.5 sm:px-5 sm:py-2 rounded-full text-xs sm:text-sm font-medium z-10 transition-all duration-300 ${
                    isLogin 
                      ? "text-white bg-gradient-to-r from-indigo-500 to-purple-500 shadow-md" 
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`relative px-4 py-1.5 sm:px-5 sm:py-2 rounded-full text-xs sm:text-sm font-medium z-10 transition-all duration-300 ${
                    !isLogin 
                      ? "text-white bg-gradient-to-r from-indigo-500 to-purple-500 shadow-md" 
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Sign Up
                </button>
                <motion.div
                  className="absolute inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-md"
                  initial={false}
                  animate={{ left: isLogin ? "0%" : "50%" }}
                  transition={{ 
                    type: "spring", 
                    damping: 25, 
                    stiffness: 300,
                    mass: 0.5 
                  }}
                  style={{ width: "50%" }}
                />
              </div>
            </div>
            
            {/* Title */}
            <div className="mt-4 sm:mt-6 px-2 sm:px-4 text-center">
              <motion.h1 
                key={isLogin ? "login" : "signup"}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="text-lg sm:text-xl font-bold text-gray-800 mb-1"
              >
                {isLogin ? "Welcome Back" : "Create Account"}
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="text-gray-500 text-xs sm:text-sm"
              >
                {isLogin ? "Sign in to continue" : "Join us to get started"}
              </motion.p>
            </div>
          </div>

          {/* Form */}
          <div className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Scrollable Input Fields Container */}
              <div className="max-h-[30vh] overflow-y-auto pr-2 -mr-2">
                {/* Custom scrollbar styles for input fields container */}
                <style jsx>{`
                  div.max-h-\\[30vh\\].overflow-y-auto::-webkit-scrollbar {
                    width: 6px;
                  }
                  
                  div.max-h-\\[30vh\\].overflow-y-auto::-webkit-scrollbar-track {
                    background: rgba(249, 250, 251, 0.5); /* bg-gray-50 with opacity */
                    border-radius: 3px;
                  }
                  
                  div.max-h-\\[30vh\\].overflow-y-auto::-webkit-scrollbar-thumb {
                    background: #818cf8; /* indigo-400 */
                    border-radius: 3px;
                  }
                  
                  div.max-h-\\[30vh\\].overflow-y-auto::-webkit-scrollbar-thumb:hover {
                    background: #6366f1; /* indigo-500 */
                  }
                  
                  /* Firefox */
                  div.max-h-\\[30vh\\].overflow-y-auto {
                    scrollbar-width: thin;
                    scrollbar-color: #818cf8 #f9fafb80;
                  }
                `}</style>
                
                <div className="space-y-4 sm:space-y-6">
                  <AnimatePresence mode="wait">
                    {!isLogin && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: "auto", marginBottom: "1.5rem" }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Username
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              name="username"
                              value={formData.username}
                              onChange={handleInputChange}
                              className="w-full px-4 sm:px-5 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 text-gray-900 placeholder-gray-400"
                              placeholder="Enter username"
                              required={!isLogin}
                            />
                            <div className="absolute right-3 top-3 text-gray-400">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 sm:px-5 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 text-gray-900 placeholder-gray-400"
                        placeholder="Enter your email"
                        required
                      />
                      <div className="absolute right-3 top-3 text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full px-4 sm:px-5 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 text-gray-900 placeholder-gray-400"
                        placeholder="Enter your password"
                        required
                      />
                      <div className="absolute right-3 top-3 text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {!isLogin && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: "auto", marginBottom: "1.5rem" }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confirm Password
                          </label>
                          <div className="relative">
                            <input
                              type="password"
                              name="confirmPassword"
                              value={formData.confirmPassword}
                              onChange={handleInputChange}
                              className="w-full px-4 sm:px-5 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 text-gray-900 placeholder-gray-400"
                              placeholder="Confirm password"
                              required={!isLogin}
                            />
                            <div className="absolute right-3 top-3 text-gray-400">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between">
                    {isLogin && (
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="rememberMe"
                          checked={formData.rememberMe}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <label className="ml-2 text-sm text-gray-600">
                          Remember me
                        </label>
                      </div>
                    )}
                    {isLogin && (
                      <button
                        type="button"
                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors duration-200"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Success Message */}
              {success && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm"
                >
                  {success}
                </motion.div>
              )}
              
              {/* Error Message */}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm"
                >
                  {error}
                </motion.div>
              )}

              {/* Submit Button */}
              <motion.button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                whileHover={{ 
                  scale: isLoading ? 1 : 1.02,
                  boxShadow: isLoading ? "none" : "0 20px 25px -5px rgba(99, 102, 241, 0.1), 0 10px 10px -5px rgba(99, 102, 241, 0.04)"
                }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-3 px-4 rounded-xl font-semibold shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin mr-2"></div>
                    {isLogin ? "Signing In..." : "Creating Account..."}
                  </div>
                ) : isLogin ? (
                  "Sign In"
                ) : (
                  "Sign Up"
                )}
              </motion.button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-white text-gray-500 text-sm">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Social Buttons */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 group"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="text-gray-700 group-hover:text-gray-900 transition-colors">Continue with Google</span>
                </button>
              </div>

              {/* Switch Mode Text */}
              <div className="text-center pt-4">
                <p className="text-gray-600 text-sm">
                  {isLogin
                    ? "Don't have an account?"
                    : "Already have an account?"}
                  <button
                    type="button"
                    onClick={switchMode}
                    className="ml-1 text-indigo-600 hover:text-indigo-700 font-medium transition-colors duration-200"
                  >
                    {isLogin ? "Sign up" : "Sign in"}
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-4 sm:mt-6 text-center text-gray-500 text-xs px-4"
        >
          By continuing, you agree to our Terms of Service and Privacy Policy
        </motion.p>
      </motion.div>
      
      <style jsx>{`
        .overflow-y-auto::-webkit-scrollbar {
          width: 8px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 4px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #6366f1;
          border-radius: 4px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: #4f46e5;
        }
        
        /* Firefox */
        .overflow-y-auto {
          scrollbar-width: thin;
          scrollbar-color: #6366f1 transparent;
        }
        
        /* Hide scrollbar on medium and larger screens */
        @media (min-width: 768px) {
          .md\\:overflow-y-visible::-webkit-scrollbar {
            display: none;
          }
          .md\\:overflow-y-visible {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
          }
        }
      `}</style>
    </div>
  );
};

export default Login;