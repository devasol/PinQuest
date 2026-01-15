import React from 'react';
import { useRouteError, Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, RefreshCw, Home, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const ErrorPage = () => {
  const error = useRouteError();
  const navigate = useNavigate();

  console.error('Route Error:', error);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-['Outfit',_sans-serif]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-xl w-full bg-white rounded-[32px] shadow-2xl shadow-slate-200/60 p-10 text-center relative overflow-hidden"
      >
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-400 via-orange-400 to-amber-400" />
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-50 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-50 rounded-full blur-3xl opacity-50" />

        <div className="relative z-10">
          <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
            <AlertTriangle className="w-12 h-12 text-rose-500" strokeWidth={2.5} />
          </div>

          <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
            Something's not right
          </h1>
          
          <p className="text-lg text-slate-600 mb-8 max-w-md mx-auto leading-relaxed">
            {error?.statusText || error?.message || "An unexpected error occurred while navigating the map."}
          </p>

          <div className="bg-slate-50 rounded-2xl p-5 mb-10 text-left border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-rose-400" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Error Details</span>
            </div>
            <code className="text-sm text-rose-600 font-mono break-all line-clamp-3 block">
              {error?.data || error?.stack || "Error code: PINQUEST-300-FAIL"}
            </code>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
            >
              <RefreshCw className="w-5 h-5" />
              Try Again
            </button>
            <Link
              to="/"
              className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-slate-900 border-2 border-slate-100 rounded-2xl font-bold hover:border-slate-200 hover:bg-slate-50 transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            >
              <Home className="w-5 h-5" />
              Back to Discover
            </Link>
          </div>

          <button 
            onClick={() => navigate(-1)}
            className="mt-8 text-slate-400 hover:text-slate-600 font-semibold flex items-center justify-center gap-1 mx-auto transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Go back to previous page
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ErrorPage;
