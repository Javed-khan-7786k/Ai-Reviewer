import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Mail, User } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleGoogleLogin = () => {
    setIsLoading('google');
    // Simulate Google OAuth
    setTimeout(() => {
      navigate('/dashboard');
    }, 1000);
  };

  const handleGuestLogin = () => {
    setIsLoading('guest');
    setTimeout(() => {
      navigate('/dashboard');
    }, 500);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Logo and title */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-navy-900">AI Reviewer</span>
          </Link>
          <h1 className="text-2xl font-bold text-navy-900">Welcome back</h1>
          <p className="text-sm text-neutral-500 mt-2">
            Sign in to access your documents and analysis
          </p>
        </div>

        {/* Login card */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
          {/* Google Sign In */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading !== null}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-medium text-navy-900 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 hover:border-neutral-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading === 'google' ? (
              <div className="w-5 h-5 border-2 border-neutral-300 border-t-navy-900 rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-neutral-400">or</span>
            </div>
          </div>

          {/* Email input (for Gmail) */}
          <div className="space-y-3">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-navy-900 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="email"
                  id="email"
                  placeholder="you@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                />
              </div>
            </div>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-navy-900 hover:bg-navy-800 rounded-lg transition-colors">
              Continue with Email
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-neutral-400">or</span>
            </div>
          </div>

          {/* Guest access */}
          <button
            onClick={handleGuestLogin}
            disabled={isLoading !== null}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-neutral-600 bg-neutral-50 border border-neutral-200 rounded-lg hover:bg-neutral-100 hover:border-neutral-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading === 'guest' ? (
              <div className="w-4 h-4 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
            ) : (
              <User className="w-4 h-4" />
            )}
            <span>Continue as Guest</span>
          </button>
        </div>

        {/* Footer text */}
        <p className="text-center text-xs text-neutral-400 mt-6">
          By continuing, you agree to our{' '}
          <a href="#" className="text-neutral-600 hover:text-navy-900 underline">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="text-neutral-600 hover:text-navy-900 underline">Privacy Policy</a>
        </p>

        {/* Back to home */}
        <div className="text-center mt-4">
          <Link to="/" className="text-xs text-neutral-500 hover:text-navy-900 transition-colors">
            ← Back to home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
