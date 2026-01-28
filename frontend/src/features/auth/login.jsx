import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import useAuthStore from "../../app/store/auth.store";
import authService from "../../services/auth.service";

// hCaptcha configuration - disable for local testing
const HCAPTCHA_SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY || "10000000-ffff-ffff-ffff-000000000001";
const HCAPTCHA_ENABLED = import.meta.env.VITE_HCAPTCHA_ENABLED === "true";

// Static animation variants - defined outside component to prevent recreation
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export default function Login() {
  const navigate = useNavigate();
  const captchaRef = useRef(null);
  
  const { isAuthenticated, pending2FA, isLoading: authLoading, error: authError, clearError } = useAuthStore();
  
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [formErrors, setFormErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [hcaptchaToken, setHcaptchaToken] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already authenticated (but not if pending 2FA)
  useEffect(() => {
    if (isAuthenticated && !pending2FA) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, pending2FA, navigate]);

  // Clear errors on mount
  useEffect(() => {
    clearError();
  }, [clearError]);

  const validateForm = useCallback(() => {
    const errors = {};
    
    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Invalid email format";
    }
    
    if (!formData.password) {
      errors.password = "Password is required";
    }

    if (HCAPTCHA_ENABLED && !hcaptchaToken) {
      errors.captcha = "Please complete the captcha";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData.email, formData.password, hcaptchaToken]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);

    const result = await authService.login(
      formData.email,
      formData.password,
      hcaptchaToken,
      rememberMe
    );

    setIsLoading(false);

    if (result.success) {
      // Check if 2FA is required
      if (result.requires2FA) {
        navigate("/verify-otp", { 
          state: { 
            userId: result.userId, 
            email: result.email || formData.email,
            rememberMe 
          } 
        });
      } else {
        navigate("/dashboard");
      }
    } else {
      // Reset captcha on failed login
      if (captchaRef.current) {
        captchaRef.current.resetCaptcha();
        setHcaptchaToken(null);
      }
    }
  }, [validateForm, formData.email, formData.password, hcaptchaToken, rememberMe, navigate]);

  const handleCaptchaVerify = useCallback((token) => {
    setHcaptchaToken(token);
    setFormErrors((prev) => ({ ...prev, captcha: null }));
  }, []);

  const handleCaptchaExpire = useCallback(() => {
    setHcaptchaToken(null);
  }, []);

  const handleEmailChange = useCallback((e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, email: value }));
    setFormErrors(prev => ({ ...prev, email: null }));
  }, []);

  const handlePasswordChange = useCallback((e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, password: value }));
    setFormErrors(prev => ({ ...prev, password: null }));
  }, []);

  const toggleShowPassword = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const handleRememberMeChange = useCallback((e) => {
    setRememberMe(e.target.checked);
  }, []);

  const isSubmitDisabled = isLoading || authLoading;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Static Background Grid - CSS only, no JS */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Static Gradient Orbs - CSS animations instead of JS-driven */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-slate-600/20 rounded-full blur-[120px] animate-pulse-slow animation-delay-1000" />

      <div className="w-full max-w-md relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative"
        >
          {/* Card with glass effect */}
          <div className="relative bg-slate-900/80 backdrop-blur-2xl rounded-3xl border border-slate-800/50 shadow-2xl shadow-black/50 overflow-hidden">
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
            
            {/* Subtle inner glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-800/20 to-transparent pointer-events-none" />

            <div className="relative p-8 lg:p-10">
              {/* Logo & Title */}
              <motion.div variants={itemVariants} className="text-center mb-10">
                <div className="relative w-16 h-16 mx-auto mb-6">
                  {/* Logo container with glow */}
                  <div className="absolute inset-0 bg-indigo-500/20 rounded-2xl blur-xl" />
                  <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 flex items-center justify-center shadow-lg">
                    <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>

                <h1 className="text-2xl font-semibold text-white mb-2 tracking-tight">
                  Welcome back
                </h1>
                <p className="text-slate-400 text-sm">
                  Sign in to access your documents
                </p>
              </motion.div>

              {/* Error Alert */}
              {authError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
                >
                  <p className="text-red-400 text-sm text-center">{authError}</p>
                </motion.div>
              )}

              {/* Login Form */}
              <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-4">
                  <div className="group">
                    <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                      Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                      </div>
                      <input
                        type="email"
                        placeholder="you@company.com"
                        value={formData.email}
                        onChange={handleEmailChange}
                        className={`w-full pl-12 pr-4 py-3.5 bg-slate-800/50 border rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all duration-200 ${
                          formErrors.email 
                            ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20' 
                            : 'border-slate-700/50 focus:border-indigo-500/50 focus:ring-indigo-500/20'
                        }`}
                      />
                    </div>
                    {formErrors.email && (
                      <p className="mt-1 text-xs text-red-400">{formErrors.email}</p>
                    )}
                  </div>

                  <div className="group">
                    <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handlePasswordChange}
                        className={`w-full pl-12 pr-12 py-3.5 bg-slate-800/50 border rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all duration-200 ${
                          formErrors.password 
                            ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20' 
                            : 'border-slate-700/50 focus:border-indigo-500/50 focus:ring-indigo-500/20'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={toggleShowPassword}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {formErrors.password && (
                      <p className="mt-1 text-xs text-red-400">{formErrors.password}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input 
                        type="checkbox"
                        checked={rememberMe}
                        onChange={handleRememberMeChange}
                        className="peer sr-only" 
                      />
                      <div className="w-5 h-5 rounded-md border border-slate-600 bg-slate-800/50 peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-all duration-200 flex items-center justify-center">
                      </div>
                      <svg className="w-3 h-3 text-white absolute left-1 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                      Remember me
                    </span>
                  </label>
                  <Link 
                    to="/forgot-password" 
                    className="text-sm text-slate-400 hover:text-indigo-400 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* hCaptcha - disabled for local testing */}
                {HCAPTCHA_ENABLED && (
                  <div className="flex flex-col items-center">
                    <HCaptcha
                      ref={captchaRef}
                      sitekey={HCAPTCHA_SITE_KEY}
                      onVerify={handleCaptchaVerify}
                      onExpire={handleCaptchaExpire}
                      theme="dark"
                    />
                    {formErrors.captcha && (
                      <p className="mt-2 text-xs text-red-400">{formErrors.captcha}</p>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitDisabled}
                  className="relative w-full py-3.5 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all duration-200 overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  {/* Button shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  
                  <span className="relative flex items-center justify-center gap-2">
                    {isSubmitDisabled ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign in
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </>
                    )}
                  </span>
                </button>
              </motion.form>

              {/* Contact Us Link */}
              <motion.p variants={itemVariants} className="text-center mt-8 text-slate-400 text-sm">
                Need an account?{" "}
                <Link 
                  to="/contact" 
                  className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                >
                  Contact us to request access
                </Link>
              </motion.p>
            </div>
          </div>

          {/* Footer */}
          <motion.p 
            variants={itemVariants} 
            className="text-center mt-8 text-xs text-slate-600"
          >
            © 2026 DocLoq - Secure Document Management System
          </motion.p>

          {/* Dev Note - Only shows in development mode */}
          {import.meta.env.DEV && (
            <motion.div
              variants={itemVariants}
              className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl"
            >
              <p className="text-amber-400 text-xs text-center">
                <strong>Dev Mode:</strong> admin@docloq.site / Admin123!
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* CSS for custom animations */}
      <style>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.05); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
        .animation-delay-1000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
