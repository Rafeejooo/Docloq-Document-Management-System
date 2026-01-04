import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    company: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [currentStep, setCurrentStep] = useState(1);

  // Track mouse for subtle parallax effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setIsLoading(false);
    navigate("/dashboard");
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.15,
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

  const floatingVariants = {
    animate: {
      y: [0, -8, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  const inputFields = [
    { key: "name", label: "Full Name", type: "text", placeholder: "John Doe", icon: "user" },
    { key: "email", label: "Email", type: "email", placeholder: "you@company.com", icon: "email" },
    { key: "company", label: "Company", type: "text", placeholder: "Acme Corporation", icon: "building" },
    { key: "password", label: "Password", type: "password", placeholder: "••••••••", icon: "lock" },
    { key: "confirmPassword", label: "Confirm Password", type: "password", placeholder: "••••••••", icon: "check" },
  ];

  const icons = {
    user: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    email: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
      </svg>
    ),
    building: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    lock: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    check: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 opacity-20">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Gradient Orbs */}
      <motion.div
        className="absolute top-1/3 -left-32 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[150px]"
        animate={{
          x: mousePosition.x * 0.5,
          y: mousePosition.y * 0.5,
        }}
        transition={{ type: "spring", stiffness: 50, damping: 30 }}
      />
      <motion.div
        className="absolute bottom-1/3 -right-32 w-[500px] h-[500px] bg-slate-600/15 rounded-full blur-[150px]"
        animate={{
          x: mousePosition.x * -0.5,
          y: mousePosition.y * -0.5,
        }}
        transition={{ type: "spring", stiffness: 50, damping: 30 }}
      />

      {/* Floating particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-indigo-400/30 rounded-full"
          style={{
            left: `${10 + i * 12}%`,
            top: `${15 + (i % 4) * 20}%`,
          }}
          animate={{
            y: [0, -25, 0],
            opacity: [0.15, 0.5, 0.15],
          }}
          transition={{
            duration: 3 + i * 0.4,
            repeat: Infinity,
            delay: i * 0.25,
          }}
        />
      ))}

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
              <motion.div variants={itemVariants} className="text-center mb-8">
                <motion.div
                  variants={floatingVariants}
                  animate="animate"
                  className="relative w-16 h-16 mx-auto mb-5"
                >
                  {/* Logo container with glow */}
                  <div className="absolute inset-0 bg-indigo-500/20 rounded-2xl blur-xl" />
                  <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 flex items-center justify-center shadow-lg">
                    <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                </motion.div>

                <h1 className="text-2xl font-semibold text-white mb-2 tracking-tight">
                  Create account
                </h1>
                <p className="text-slate-400 text-sm">
                  Join us and secure your documents
                </p>
              </motion.div>

              {/* Progress Steps */}
              <motion.div variants={itemVariants} className="flex items-center justify-center gap-2 mb-8">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        step <= currentStep 
                          ? "bg-indigo-500 w-6" 
                          : "bg-slate-700"
                      }`}
                    />
                  </div>
                ))}
              </motion.div>

              {/* Registration Form */}
              <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-4">
                {inputFields.map((field, index) => (
                  <motion.div 
                    key={field.key}
                    variants={itemVariants}
                    className="group"
                  >
                    <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                      {field.label}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                        {icons[field.icon]}
                      </div>
                      <input
                        type={field.type}
                        placeholder={field.placeholder}
                        value={formData[field.key]}
                        onChange={(e) => {
                          setFormData({ ...formData, [field.key]: e.target.value });
                          // Update progress based on filled fields
                          const filledCount = Object.values({ ...formData, [field.key]: e.target.value }).filter(v => v).length;
                          setCurrentStep(Math.min(3, Math.ceil(filledCount / 2) + 1));
                        }}
                        className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                      />
                    </div>
                  </motion.div>
                ))}

                {/* Terms Checkbox */}
                <motion.div variants={itemVariants}>
                  <label className="flex items-start gap-3 cursor-pointer group py-2">
                    <div className="relative flex items-center mt-0.5">
                      <input 
                        type="checkbox" 
                        className="peer sr-only" 
                      />
                      <div className="w-5 h-5 rounded-md border border-slate-600 bg-slate-800/50 peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-all duration-200">
                      </div>
                      <svg className="w-3 h-3 text-white absolute left-1 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm text-slate-400 leading-relaxed">
                      I agree to the{" "}
                      <Link to="/terms" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link to="/privacy" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                        Privacy Policy
                      </Link>
                    </span>
                  </label>
                </motion.div>

                <motion.button
                  variants={itemVariants}
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="relative w-full py-3.5 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all duration-200 overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed mt-6"
                >
                  {/* Button shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  
                  <span className="relative flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Creating account...
                      </>
                    ) : (
                      <>
                        Create account
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </>
                    )}
                  </span>
                </motion.button>
              </motion.form>

              {/* Sign In Link */}
              <motion.p variants={itemVariants} className="text-center mt-8 text-slate-400 text-sm">
                Already have an account?{" "}
                <Link 
                  to="/login" 
                  className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                >
                  Sign in
                </Link>
              </motion.p>
            </div>
          </div>

          {/* Footer */}
          <motion.p 
            variants={itemVariants} 
            className="text-center mt-8 text-xs text-slate-600"
          >
            © 2025 Secure Document Management System
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
