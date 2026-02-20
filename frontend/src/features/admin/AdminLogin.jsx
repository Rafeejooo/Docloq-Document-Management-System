import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import adminService from "../../services/admin.service";

// ─── Dev bypass flag ────────────────────────────────────────
const DEV_BYPASS = true;

const particlesOptions = {
  fullScreen: false,
  background: { color: { value: "transparent" } },
  fpsLimit: 60,
  particles: {
    color: { value: ["#06b6d4", "#14b8a6", "#22d3ee"] },
    links: { color: "#06b6d4", distance: 150, enable: true, opacity: 0.08, width: 1 },
    move: { enable: true, speed: 0.6, direction: "none", outModes: { default: "out" } },
    number: { density: { enable: true, area: 900 }, value: 40 },
    opacity: { value: { min: 0.1, max: 0.4 } },
    size: { value: { min: 1, max: 2 } },
  },
  detectRetina: true,
};

// Replaced old animation variants
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
  const [step, setStep] = useState("credentials");
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [formErrors, setFormErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [adminId, setAdminId] = useState(null);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef([]);
  const [particlesReady, setParticlesReady] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Init particles engine
  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setParticlesReady(true));
  }, []);

  useEffect(() => {
    if (adminService.isAuthenticated()) navigate("/admin/dashboard");
  }, [navigate]);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  // Mouse parallax tracking
  useEffect(() => {
    const h = (e) =>
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    window.addEventListener("mousemove", h, { passive: true });
    return () => window.removeEventListener("mousemove", h);
  }, []);

  const validateForm = useCallback(() => {
    const errors = {};
    if (!formData.email) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Invalid email format";
    if (!formData.password) errors.password = "Password is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData.email, formData.password]);

  // ─── Dev bypass ────────────────────────────────────────────
  const handleDevBypass = () => {
    localStorage.setItem("adminToken", "dev-bypass-token-" + Date.now());
    localStorage.setItem("adminRefreshToken", "dev-bypass-refresh-" + Date.now());
    localStorage.setItem(
      "adminUser",
      JSON.stringify({ id: 1, firstName: "Dev", lastName: "Admin", email: "admin@docloq.dev", role: "super_admin" })
    );
    navigate("/admin/dashboard");
  };

  const handleCredentialsSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!validateForm()) return;
      setIsLoading(true);
      setError(null);
      const result = await adminService.login(formData.email, formData.password);
      setIsLoading(false);
      if (result.success && result.data?.requires2FA) {
        setAdminId(result.data.adminId);
        setMaskedEmail(result.data.email);
        setStep("otp");
        setResendTimer(60);
      } else if (!result.success) {
        setError(result.message || "Login failed. Please try again.");
      }
    },
    [validateForm, formData.email, formData.password]
  );

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError(null);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const d = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(d)) return;
    const newOtp = [...otp];
    for (let i = 0; i < d.length; i++) newOtp[i] = d[i];
    setOtp(newOtp);
    otpRefs.current[Math.min(d.length, 5)]?.focus();
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) { setError("Please enter the complete 6-digit code"); return; }
    setIsLoading(true);
    setError(null);
    const result = await adminService.verifyOTP(adminId, code);
    setIsLoading(false);
    if (result.success) navigate("/admin/dashboard");
    else {
      setError(result.message || "Invalid verification code");
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setIsLoading(true);
    const result = await adminService.resendOTP(adminId);
    setIsLoading(false);
    if (result.success) { setResendTimer(60); setError(null); }
    else setError(result.message || "Failed to resend code");
  };

  // Floating hexagons (cyberpunk decorations)
  const hexagons = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        id: i,
        size: Math.random() * 60 + 30,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 5,
        duration: Math.random() * 10 + 15,
        opacity: Math.random() * 0.06 + 0.02,
      })),
    []
  );

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Particle Layer */}
      {particlesReady && (
        <Particles id="admin-particles" options={particlesOptions} className="absolute inset-0 z-0" />
      )}

      {/* Parallax orbs + scanline + grid */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <motion.div
          animate={{ x: mousePos.x * 1.5, y: mousePos.y * 1.5 }}
          transition={{ type: "spring", damping: 30, stiffness: 100 }}
          className="absolute top-1/4 -left-20 w-125 h-125 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)" }}
        />
        <motion.div
          animate={{ x: mousePos.x * -1, y: mousePos.y * -1 }}
          transition={{ type: "spring", damping: 30, stiffness: 100 }}
          className="absolute bottom-1/4 -right-20 w-100 h-100 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(20,184,166,0.12) 0%, transparent 70%)" }}
        />

        {/* Hexagon drift */}
        {hexagons.map((h) => (
          <motion.div
            key={h.id}
            className="absolute"
            style={{
              left: `${h.x}%`,
              top: `${h.y}%`,
              width: h.size,
              height: h.size,
              opacity: h.opacity,
              border: "1px solid rgba(6,182,212,0.3)",
              clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
            }}
            animate={{ y: [-20, 20, -20], rotate: [0, 180, 360] }}
            transition={{ duration: h.duration, delay: h.delay, repeat: Infinity, ease: "linear" }}
          />
        ))}

        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(6,182,212,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.4) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Scan line */}
        <motion.div
          className="absolute left-0 right-0 h-px bg-linear-to-r from-transparent via-cyan-500/30 to-transparent"
          animate={{ top: ["0%", "100%"] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* ─── Card ───────────────────────────────────────────── */}
      <div className="w-full max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="relative group">
            {/* Outer glow */}
            <div className="absolute -inset-1 bg-linear-to-r from-cyan-500/20 via-teal-500/20 to-cyan-500/20 rounded-3xl blur-xl opacity-60 group-hover:opacity-80 transition-all duration-700" />

            <div className="relative bg-slate-900/80 backdrop-blur-2xl rounded-3xl border border-cyan-500/10 shadow-2xl shadow-cyan-950/50 overflow-hidden">
              {/* Top accent */}
              <div className="h-px bg-linear-to-r from-transparent via-cyan-400 to-transparent" />

              {/* Corner brackets */}
              <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-cyan-500/20 rounded-tl-lg" />
              <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-cyan-500/20 rounded-tr-lg" />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-cyan-500/20 rounded-bl-lg" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-cyan-500/20 rounded-br-lg" />

              <div className="relative p-8 lg:p-10">
                {/* Logo + Title */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="text-center mb-8"
                >
                  <div className="relative w-20 h-20 mx-auto mb-5">
                    <motion.div
                      className="absolute inset-0 rounded-2xl bg-linear-to-br from-cyan-500/20 to-teal-500/20"
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <div className="absolute inset-0 bg-linear-to-br from-cyan-500/10 to-teal-500/10 rounded-2xl blur-xl animate-pulse" />
                    <div className="relative w-full h-full rounded-2xl bg-linear-to-br from-slate-800/80 to-slate-900/80 border border-cyan-500/20 flex items-center justify-center">
                      <svg className="w-10 h-10 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-4">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
                    </span>
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-[0.2em]">Admin Portal</span>
                  </div>

                  <h1 className="text-2xl font-bold text-white mb-1.5 tracking-tight">
                    {step === "credentials" ? "Welcome Back" : "Verify Identity"}
                  </h1>
                  <p className="text-sm text-slate-500">
                    {step === "credentials"
                      ? "Sign in to the DocLoq admin panel"
                      : `Enter the 6-digit code sent to ${maskedEmail}`}
                  </p>
                </motion.div>

                {/* Dev Bypass */}
                {DEV_BYPASS && step === "credentials" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mb-6">
                    <button
                      onClick={handleDevBypass}
                      className="w-full relative overflow-hidden group/dev py-3 px-4 rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-all duration-300"
                    >
                      <div className="absolute inset-0 bg-linear-to-r from-amber-500/0 via-amber-500/10 to-amber-500/0 -translate-x-full group-hover/dev:translate-x-full transition-transform duration-700" />
                      <div className="relative flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="text-sm font-medium text-amber-400">Dev Bypass Login</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded font-mono">DEV</span>
                      </div>
                    </button>
                    <div className="flex items-center gap-2 mt-3">
                      <div className="flex-1 h-px bg-slate-800" />
                      <span className="text-[10px] text-slate-600 uppercase tracking-widest">or sign in normally</span>
                      <div className="flex-1 h-px bg-slate-800" />
                    </div>
                  </motion.div>
                )}

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, y: -10, height: 0 }}
                      className="mb-5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
                          <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                        <p className="text-red-400 text-sm">{error}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ─── Credentials Form ─── */}
                {step === "credentials" && (
                  <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleCredentialsSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-widest">Email Address</label>
                      <div className="relative group/input">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-600 group-focus-within/input:text-cyan-400 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                          </svg>
                        </div>
                        <input
                          type="email"
                          placeholder="admin@docloq.site"
                          value={formData.email}
                          onChange={(e) => { setFormData((p) => ({ ...p, email: e.target.value })); setFormErrors((p) => ({ ...p, email: null })); }}
                          className={`w-full pl-11 pr-4 py-3 bg-slate-800/40 border rounded-xl text-white text-sm placeholder:text-slate-600 focus:outline-none focus:bg-slate-800/60 transition-all ${formErrors.email ? "border-red-500/40 focus:border-red-500/60" : "border-slate-700/40 focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20"}`}
                        />
                      </div>
                      {formErrors.email && <p className="mt-1.5 text-xs text-red-400">{formErrors.email}</p>}
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-widest">Password</label>
                      <div className="relative group/input">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-600 group-focus-within/input:text-cyan-400 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={(e) => { setFormData((p) => ({ ...p, password: e.target.value })); setFormErrors((p) => ({ ...p, password: null })); }}
                          className={`w-full pl-11 pr-12 py-3 bg-slate-800/40 border rounded-xl text-white text-sm placeholder:text-slate-600 focus:outline-none focus:bg-slate-800/60 transition-all ${formErrors.password ? "border-red-500/40 focus:border-red-500/60" : "border-slate-700/40 focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20"}`}
                        />
                        <button type="button" onClick={() => setShowPassword((p) => !p)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-600 hover:text-cyan-400 transition-colors">
                          {showPassword ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          )}
                        </button>
                      </div>
                      {formErrors.password && <p className="mt-1.5 text-xs text-red-400">{formErrors.password}</p>}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="relative w-full py-3.5 mt-2 bg-linear-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-semibold text-sm rounded-xl transition-all duration-300 overflow-hidden group/btn disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] shadow-lg shadow-cyan-500/20"
                    >
                      <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                      <span className="relative flex items-center justify-center gap-2">
                        {isLoading ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Verifying...
                          </>
                        ) : (
                          <>
                            Continue
                            <svg className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </>
                        )}
                      </span>
                    </button>
                  </motion.form>
                )}

                {/* ─── OTP Form ─── */}
                {step === "otp" && (
                  <motion.form onSubmit={handleOtpSubmit} className="space-y-6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
                    <div className="flex justify-center gap-2.5">
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
                          className="w-12 h-14 text-center text-xl font-bold bg-slate-800/40 border border-slate-700/40 rounded-xl text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 focus:bg-slate-800/60 transition-all"
                        />
                      ))}
                    </div>

                    <div className="text-center">
                      {resendTimer > 0 ? (
                        <p className="text-xs text-slate-500">Resend code in <span className="text-cyan-400 font-semibold">{resendTimer}s</span></p>
                      ) : (
                        <button type="button" onClick={handleResendOtp} disabled={isLoading} className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                          Didn't receive code? Resend
                        </button>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || otp.join("").length !== 6}
                      className="relative w-full py-3.5 bg-linear-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-semibold text-sm rounded-xl transition-all overflow-hidden group/btn disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20"
                    >
                      <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                      <span className="relative flex items-center justify-center gap-2">
                        {isLoading ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Verifying...
                          </>
                        ) : (
                          "Verify & Sign In"
                        )}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setStep("credentials"); setOtp(["", "", "", "", "", ""]); setError(null); }}
                      className="w-full flex items-center justify-center gap-2 text-xs text-slate-500 hover:text-white transition-colors py-2"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Back to login
                    </button>
                  </motion.form>
                )}

                {/* Footer link */}
                {step === "credentials" && (
                  <div className="mt-6 pt-5 border-t border-slate-800/50">
                    <p className="text-center text-slate-600 text-xs">
                      Not an admin?{" "}
                      <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                        Go to user login
                      </Link>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <p className="text-center mt-6 text-[10px] text-slate-700">© 2026 DocLoq Admin Portal • Restricted Access</p>
        </motion.div>
      </div>
    </div>
  );
}
