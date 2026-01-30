import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import adminService from "../../services/admin.service";

// Static animation variants
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

export default function AdminLogin() {
  const navigate = useNavigate();
  
  // Login step: 'credentials' or 'otp'
  const [step, setStep] = useState('credentials');
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [formErrors, setFormErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  
  // OTP state
  const [adminId, setAdminId] = useState(null);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef([]);

  // Redirect if already authenticated
  useEffect(() => {
    if (adminService.isAuthenticated()) {
      navigate("/admin/dashboard");
    }
  }, [navigate]);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

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
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData.email, formData.password]);

  // Step 1: Verify credentials and request OTP
  const handleCredentialsSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError(null);

    const result = await adminService.login(formData.email, formData.password);

    setIsLoading(false);

    if (result.success && result.data?.requires2FA) {
      // Move to OTP step
      setAdminId(result.data.adminId);
      setMaskedEmail(result.data.email);
      setStep('otp');
      setResendTimer(60);
    } else if (!result.success) {
      setError(result.message || "Login failed. Please try again.");
    }
  }, [validateForm, formData.email, formData.password]);

  // OTP input handlers
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError(null);
    
    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;
    
    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    
    const lastIndex = Math.min(pastedData.length, 5);
    otpRefs.current[lastIndex]?.focus();
  };

  // Step 2: Verify OTP
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }
    
    setIsLoading(true);
    setError(null);

    const result = await adminService.verifyOTP(adminId, code);

    setIsLoading(false);

    if (result.success) {
      navigate("/admin/dashboard");
    } else {
      setError(result.message || "Invalid verification code");
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    
    setIsLoading(true);
    const result = await adminService.resendOTP(adminId);
    setIsLoading(false);

    if (result.success) {
      setResendTimer(60);
      setError(null);
    } else {
      setError(result.message || "Failed to resend code");
    }
  };

  const handleBackToCredentials = () => {
    setStep('credentials');
    setOtp(['', '', '', '', '', '']);
    setError(null);
  };

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

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(6, 182, 212, 0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(6, 182, 212, 0.15) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
        
        {/* Floating Orbs */}
        <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[150px] animate-float" />
        <div className="absolute bottom-1/4 -right-32 w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-[120px] animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative"
        >
          {/* Main Card */}
          <div className="relative bg-slate-900/70 backdrop-blur-2xl rounded-3xl border border-slate-800/50 shadow-2xl shadow-cyan-900/10 overflow-hidden">
            {/* Top Gradient Accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500" />
            
            {/* Inner Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />

            <div className="relative p-8 lg:p-10">
              {/* Logo & Title */}
              <motion.div variants={itemVariants} className="text-center mb-10">
                {/* Logo */}
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-teal-500/20 rounded-2xl blur-xl animate-pulse-slow" />
                  <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 flex items-center justify-center shadow-xl">
                    <div className="relative">
                      <svg className="w-10 h-10 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      {/* Glow effect */}
                      <div className="absolute inset-0 bg-cyan-400/20 blur-md rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Admin Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-cyan-500/10 to-teal-500/10 border border-cyan-500/20 rounded-full mb-5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </span>
                  <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Admin Portal</span>
                </div>

                <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
                  {step === 'credentials' ? 'Welcome Back' : 'Verify Identity'}
                </h1>
                <p className="text-slate-400 text-sm">
                  {step === 'credentials' 
                    ? 'Sign in to access DocLoq Admin Dashboard' 
                    : `Enter the 6-digit code sent to ${maskedEmail}`}
                </p>
              </motion.div>

              {/* Error Alert */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl backdrop-blur-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1 bg-red-500/20 rounded-lg">
                      <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                </motion.div>
              )}

              {/* Login Form */}
              {step === 'credentials' && (
              <motion.form variants={itemVariants} onSubmit={handleCredentialsSubmit} className="space-y-5">
                <div className="space-y-4">
                  {/* Email Input */}
                  <div className="group">
                    <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors duration-200">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                      </div>
                      <input
                        type="email"
                        placeholder="admin@docloq.site"
                        value={formData.email}
                        onChange={handleEmailChange}
                        className={`w-full pl-12 pr-4 py-3.5 bg-slate-800/50 border-2 rounded-xl text-white placeholder:text-slate-500 focus:outline-none transition-all duration-200 ${
                          formErrors.email 
                            ? 'border-red-500/50 focus:border-red-500' 
                            : 'border-slate-700/50 focus:border-cyan-500/50 focus:bg-slate-800/70'
                        }`}
                      />
                    </div>
                    {formErrors.email && (
                      <p className="mt-2 text-xs text-red-400 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {formErrors.email}
                      </p>
                    )}
                  </div>

                  {/* Password Input */}
                  <div className="group">
                    <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors duration-200">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handlePasswordChange}
                        className={`w-full pl-12 pr-12 py-3.5 bg-slate-800/50 border-2 rounded-xl text-white placeholder:text-slate-500 focus:outline-none transition-all duration-200 ${
                          formErrors.password 
                            ? 'border-red-500/50 focus:border-red-500' 
                            : 'border-slate-700/50 focus:border-cyan-500/50 focus:bg-slate-800/70'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={toggleShowPassword}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-cyan-400 transition-colors"
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
                      <p className="mt-2 text-xs text-red-400 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {formErrors.password}
                      </p>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="relative w-full py-4 px-6 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-semibold rounded-xl transition-all duration-300 overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98] shadow-lg shadow-cyan-500/25"
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  
                  <span className="relative flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Verifying credentials...</span>
                      </>
                    ) : (
                      <>
                        <span>Continue</span>
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </>
                    )}
                  </span>
                </button>
              </motion.form>
              )}

              {/* OTP Form */}
              {step === 'otp' && (
                <motion.form 
                  variants={itemVariants} 
                  onSubmit={handleOtpSubmit} 
                  className="space-y-6"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  {/* OTP Input Boxes */}
                  <div className="flex justify-center gap-3">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (otpRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        onPaste={handleOtpPaste}
                        className="w-12 h-14 text-center text-xl font-bold bg-slate-800/50 border-2 border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-cyan-500 focus:bg-slate-800/70 transition-all duration-200"
                      />
                    ))}
                  </div>

                  {/* Resend Code */}
                  <div className="text-center">
                    {resendTimer > 0 ? (
                      <p className="text-sm text-slate-500">
                        Resend code in <span className="text-cyan-400 font-semibold">{resendTimer}s</span>
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={isLoading}
                        className="text-sm text-cyan-400 hover:text-cyan-300 font-medium transition-colors disabled:opacity-50"
                      >
                        Didn't receive code? Resend
                      </button>
                    )}
                  </div>

                  {/* Verify Button */}
                  <button
                    type="submit"
                    disabled={isLoading || otp.join('').length !== 6}
                    className="relative w-full py-4 px-6 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-semibold rounded-xl transition-all duration-300 overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98] shadow-lg shadow-cyan-500/25"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    
                    <span className="relative flex items-center justify-center gap-2">
                      {isLoading ? (
                        <>
                          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <span>Verify & Sign In</span>
                          <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </>
                      )}
                    </span>
                  </button>

                  {/* Back Button */}
                  <button
                    type="button"
                    onClick={handleBackToCredentials}
                    className="w-full flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-white transition-colors py-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to login
                  </button>
                </motion.form>
              )}

              {/* User Login Link */}
              {step === 'credentials' && (
              <motion.div variants={itemVariants} className="mt-8 pt-6 border-t border-slate-800/50">
                <p className="text-center text-slate-500 text-sm">
                  Not an admin?{" "}
                  <Link 
                    to="/login" 
                    className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                  >
                    Go to user login
                  </Link>
                </p>
              </motion.div>
              )}
            </div>
          </div>

          {/* Footer */}
          <motion.p 
            variants={itemVariants} 
            className="text-center mt-8 text-xs text-slate-600"
          >
            © 2026 DocLoq Admin Portal • Restricted Access
          </motion.p>
        </motion.div>
      </div>

      {/* Custom CSS */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(-5deg); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 10s ease-in-out infinite;
          animation-delay: 2s;
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
