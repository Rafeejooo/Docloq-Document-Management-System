import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import useAuthStore from "@/app/store/auth.store";
import authService from "@/services/auth.service";

export default function OTPVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginSuccess } = useAuthStore();
  
  // Get user data from login redirect
  const { userId, email, rememberMe } = location.state || {};
  
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(30);
  const inputRefs = useRef([]);

  // Redirect if no user data
  useEffect(() => {
    if (!userId || !email) {
      navigate("/login");
    }
  }, [userId, email, navigate]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Auto-focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError("");

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (value && index === 5) {
      const code = newOtp.join("");
      if (code.length === 6) {
        handleVerify(code);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    // Handle paste
    if (e.key === "v" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      navigator.clipboard.readText().then((text) => {
        const digits = text.replace(/\D/g, "").slice(0, 6).split("");
        const newOtp = [...otp];
        digits.forEach((digit, i) => {
          if (i < 6) newOtp[i] = digit;
        });
        setOtp(newOtp);
        if (digits.length === 6) {
          handleVerify(newOtp.join(""));
        } else {
          inputRefs.current[Math.min(digits.length, 5)]?.focus();
        }
      });
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text");
    const digits = text.replace(/\D/g, "").slice(0, 6).split("");
    const newOtp = [...otp];
    digits.forEach((digit, i) => {
      if (i < 6) newOtp[i] = digit;
    });
    setOtp(newOtp);
    if (digits.length === 6) {
      handleVerify(newOtp.join(""));
    } else {
      inputRefs.current[Math.min(digits.length, 5)]?.focus();
    }
  };

  const handleVerify = async (code) => {
    if (code.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Verify OTP
      const verifyResponse = await authService.verifyTOTP(userId, code);
      
      if (verifyResponse.success) {
        // Complete login
        const loginResponse = await authService.completeLogin(userId, rememberMe);
        
        if (loginResponse.success) {
          loginSuccess(loginResponse.data);
          navigate("/dashboard");
        } else {
          setError(loginResponse.message || "Login failed");
        }
      } else {
        setError(verifyResponse.message || "Invalid code");
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError(err.message || "Verification failed. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    // For now, just reset timer (in real app, would resend code)
    setResendTimer(30);
    setError("");
    setOtp(["", "", "", "", "", ""]);
    inputRefs.current[0]?.focus();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-800/50 shadow-2xl shadow-black/20 overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-10 pb-6 text-center">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30"
            >
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-white mb-2"
            >
              Two-Factor Authentication
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-slate-400 text-sm"
            >
              Enter the 6-digit code from your authenticator app
            </motion.p>
            {email && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-indigo-400 text-sm mt-2 font-medium"
              >
                {email}
              </motion.p>
            )}
          </div>

          {/* OTP Input */}
          <div className="px-8 pb-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex gap-2 sm:gap-3 justify-center mb-6"
            >
              {otp.map((digit, index) => (
                <motion.input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  disabled={isLoading}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 * index }}
                  className={`w-11 h-14 sm:w-12 sm:h-16 text-center text-xl sm:text-2xl font-bold rounded-xl border-2 transition-all duration-200 bg-slate-800/50 text-white outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 ${
                    error 
                      ? "border-red-500/50 focus:border-red-500" 
                      : digit 
                        ? "border-indigo-500/50 focus:border-indigo-500" 
                        : "border-slate-700 focus:border-indigo-500"
                  }`}
                />
              ))}
            </motion.div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2"
                >
                  <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-red-400 text-sm">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Verify Button */}
            <motion.button
              onClick={() => handleVerify(otp.join(""))}
              disabled={isLoading || otp.some((d) => !d)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium transition-all duration-200 shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Verifying...
                </>
              ) : (
                <>
                  Verify Code
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </>
              )}
            </motion.button>

            {/* Testing Hint */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20"
            >
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-amber-400 text-sm font-medium">Testing Mode</p>
                  <p className="text-amber-400/70 text-xs mt-0.5">Use code <span className="font-mono font-bold">123456</span> for testing</p>
                </div>
              </div>
            </motion.div>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-slate-500 text-sm">or</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            {/* Back to Login */}
            <button
              onClick={() => navigate("/login")}
              className="w-full py-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white font-medium transition-all duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Login
            </button>
          </div>
        </div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center text-slate-500 text-sm mt-6"
        >
          Having trouble?{" "}
          <a href="/contact" className="text-indigo-400 hover:text-indigo-300 transition-colors">
            Contact Support
          </a>
        </motion.p>
      </motion.div>
    </div>
  );
}
