import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import AOS from 'aos';
import 'aos/dist/aos.css';

// Throttle helper for performance
const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
};

export default function LandingPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);

  useEffect(() => {
    // Reduced intro animation timer (800ms instead of 2500ms)
    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    AOS.init({
      duration: 600, // Reduced from 1200ms
      once: true,
      easing: 'ease-out-cubic',
    });

    // Throttled mouse move handler (every 50ms instead of every frame)
    const handleMouseMove = throttle((e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 30,
        y: (e.clientY / window.innerHeight - 0.5) * 30,
      });
    }, 50);
    
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(loadingTimer);
    };
  }, []);

  const features = [
    {
      title: "AI Document Analysis",
      description: "Leverage cutting-edge AI to automatically analyze, extract insights, and categorize your documents with unprecedented accuracy.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
      delay: 0,
    },
    {
      title: "Smart Chatbot Assistant",
      description: "Get instant answers about your documents with our intelligent AI chatbot. Ask questions, get summaries, and extract key information effortlessly.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      gradient: "from-cyan-500 via-blue-500 to-indigo-500",
      delay: 100,
    },
    {
      title: "Blockchain Verification",
      description: "Immutable document authenticity powered by blockchain technology. Every document gets a unique cryptographic hash stored on-chain for tamper-proof verification.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      gradient: "from-emerald-500 via-green-500 to-teal-500",
      delay: 200,
    },
    {
      title: "OSINT Tracker",
      description: "Monitor the web for leaked documents and sensitive data. Stay ahead of threats with real-time open-source intelligence tracking.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
        </svg>
      ),
      gradient: "from-amber-500 via-orange-500 to-red-500",
      delay: 300,
    },
    {
      title: "Role Management",
      description: "Granular access control with customizable roles and permissions. Ensure the right people have access to the right documents.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      gradient: "from-pink-500 via-rose-500 to-red-500",
      delay: 400,
    },
    {
      title: "Task & Workflow",
      description: "Streamline your document workflows with integrated task management. Assign, track, and complete document-related tasks efficiently.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      gradient: "from-indigo-500 via-purple-500 to-pink-500",
      delay: 500,
    },
  ];

  const stats = [
    { value: "99.9%", label: "Uptime Guarantee" },
    { value: "2.5M+", label: "Documents Verified" },
    { value: "150+", label: "Enterprise Clients" },
    { value: "45+", label: "Countries Served" },
    { value: "SHA-256", label: "Blockchain Hash" },
    { value: "<100ms", label: "Verification Time" },
    { value: "100%", label: "Tamper Detection" },
    { value: "24/7", label: "Expert Support" },
  ];

  const floatingElements = [...Array(20)].map((_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5,
  }));

  return (
    <>
      {/* Intro Loading Animation - Optimized */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="fixed inset-0 z-[100] bg-slate-950 flex items-center justify-center"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="relative flex flex-col items-center">
              {/* Animated Logo */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="relative mb-8"
              >
                {/* Outer ring */}
                <motion.div
                  className="absolute -inset-4 rounded-2xl"
                  animate={{
                    background: [
                      "linear-gradient(0deg, rgba(139, 92, 246, 0.5), rgba(6, 182, 212, 0.5))",
                      "linear-gradient(180deg, rgba(139, 92, 246, 0.5), rgba(6, 182, 212, 0.5))",
                      "linear-gradient(360deg, rgba(139, 92, 246, 0.5), rgba(6, 182, 212, 0.5))",
                    ],
                  }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  style={{ filter: "blur(20px)" }}
                />
                
                {/* Logo container */}
                <div className="relative w-24 h-24 bg-gradient-to-br from-violet-600 to-cyan-600 rounded-2xl flex items-center justify-center">
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-4xl font-bold text-white"
                  >
                    D
                  </motion.span>
                </div>
              </motion.div>

              {/* Brand name */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="text-3xl font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent mb-4"
              >
                Docloq
              </motion.h1>

              {/* Loading bar */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden"
              >
                <motion.div
                  className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.5, delay: 0.3, ease: "easeInOut" }}
                />
              </motion.div>

              {/* Tagline */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-4 text-slate-400 text-sm"
              >
                Documents That Think & Prove
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
        {/* Animated Background */}
        <div className="fixed inset-0 z-0">
        {/* Gradient Orbs */}
        <motion.div
          className="absolute top-1/4 -left-32 w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
          }}
          animate={{
            x: mousePosition.x * 0.5,
            y: mousePosition.y * 0.5,
          }}
          transition={{ type: "spring", stiffness: 50, damping: 30 }}
        />
        <motion.div
          className="absolute bottom-1/4 -right-32 w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%)',
          }}
          animate={{
            x: mousePosition.x * -0.5,
            y: mousePosition.y * -0.5,
          }}
          transition={{ type: "spring", stiffness: 50, damping: 30 }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(236, 72, 153, 0.1) 0%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '100px 100px',
          }}
        />

        {/* Floating Particles */}
        {floatingElements.map((el) => (
          <motion.div
            key={el.id}
            className="absolute rounded-full bg-white/10"
            style={{
              width: el.size,
              height: el.size,
              left: `${el.x}%`,
              top: `${el.y}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: el.duration,
              repeat: Infinity,
              delay: el.delay,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Navigation */}
      <nav className="fixed w-full z-50 transition-all duration-300">
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl border-b border-white/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <motion.div 
              className="flex items-center"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-r from-violet-600 to-cyan-600 rounded-lg blur opacity-30" />
                <h1 className="relative text-2xl font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  Docloq
                </h1>
              </div>
            </motion.div>

            {/* Desktop Navigation */}
            <motion.div 
              className="hidden md:flex items-center space-x-8"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <a href="#features" className="text-slate-400 hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-slate-400 hover:text-white transition-colors">How it Works</a>
              <a href="#security" className="text-slate-400 hover:text-white transition-colors">Security</a>
              <Link to="/contact" className="text-slate-400 hover:text-white transition-colors">Contact</Link>
            </motion.div>

            <motion.div 
              className="hidden md:flex items-center space-x-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Link
                to="/login"
                className="text-slate-300 hover:text-white px-4 py-2 rounded-lg font-medium transition-all hover:bg-white/5"
              >
                Sign In
              </Link>
              <Link
                to="/contact"
                className="relative group"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-cyan-600 rounded-lg blur opacity-60 group-hover:opacity-100 transition duration-300" />
                <span className="relative flex items-center px-6 py-2.5 bg-slate-950 rounded-lg font-medium text-white group-hover:bg-slate-900 transition-colors">
                  Request Access
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </Link>
            </motion.div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden text-white p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-slate-900/95 backdrop-blur-xl border-b border-white/5"
            >
              <div className="px-4 py-6 space-y-4">
                <a href="#features" className="block text-slate-300 hover:text-white py-2">Features</a>
                <a href="#how-it-works" className="block text-slate-300 hover:text-white py-2">How it Works</a>
                <a href="#security" className="block text-slate-300 hover:text-white py-2">Security</a>
                <Link to="/contact" className="block text-slate-300 hover:text-white py-2">Contact</Link>
                <div className="pt-4 space-y-3">
                  <Link to="/login" className="block text-center py-3 text-white border border-white/20 rounded-lg">Sign In</Link>
                  <Link to="/contact" className="block text-center py-3 bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-lg">Request Access</Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-20">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 mb-8"
            >
              <span className="flex items-center gap-2 text-sm text-violet-400 font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI-Powered
              </span>
              <span className="w-px h-4 bg-white/20" />
              <span className="flex items-center gap-2 text-sm text-emerald-400 font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Blockchain-Secured
              </span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-tight mb-8"
            >
              <span className="text-white">Stop Worrying</span>
              <br />
              <span className="relative">
                <span className="absolute -inset-2 bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-600 blur-2xl opacity-30" />
                <span className="relative bg-gradient-to-r from-violet-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                 Just Use Docloq
                </span>
              </span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed"
            >
              Transform how you manage documents with <span className="text-violet-400 font-medium">AI-powered insights</span> and 
              <span className="text-emerald-400 font-medium"> blockchain-verified authenticity</span>. 
              <br className="hidden sm:block" />
              One platform. Total confidence.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link
                to="/contact"
                className="group relative inline-flex items-center"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-600 rounded-xl blur-lg opacity-70 group-hover:opacity-100 transition duration-300 group-hover:duration-200" />
                <span className="relative flex items-center px-8 py-4 bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-600 rounded-xl text-lg font-semibold text-white shadow-2xl">
                  Request Access
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </Link>
              <Link
                to="/login"
                className="group flex items-center px-8 py-4 rounded-xl text-lg font-semibold text-white border border-white/20 hover:bg-white/5 transition-all duration-300"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Watch Demo
              </Link>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Why Docloq Section */}
      <section className="relative py-24 overflow-hidden">
        {/* Background accent */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-950/20 to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold text-white mb-4"
            >
              Why <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">Docloq</span>?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-slate-400 max-w-xl mx-auto"
            >
              The smarter way to manage, analyze, and verify your documents
            </motion.p>
          </div>

          {/* Main Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left - Free Card (Large) */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="lg:row-span-2 relative group"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-500" />
              <div className="relative h-full p-8 bg-gradient-to-br from-emerald-950/80 to-slate-900/80 backdrop-blur-sm rounded-3xl border border-emerald-500/30 overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl" />
                
                <div className="relative z-10">
                  <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/30 mb-6">
                    <span className="text-emerald-400 text-sm font-semibold">✨ Start Free Today</span>
                  </div>
                  
                  <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    Free to Use,
                    <br />
                    <span className="text-emerald-400">Powerful by Design</span>
                  </h3>
                  
                  <p className="text-slate-300 mb-8 leading-relaxed">
                    Get started with Docloq completely free. Access AI analysis, blockchain verification, 
                    and all core features without paying a dime.
                  </p>

                  <div className="space-y-3">
                    {["AI Document Analysis", "Blockchain Verification", "Smart Chatbot", "Task Management"].map((feature, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-slate-300 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Link
                    to="/contact"
                    className="mt-8 inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl text-white font-semibold hover:from-emerald-400 hover:to-cyan-400 transition-all"
                  >
                    Request Access
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Right - Feature Cards (2x2 Grid) */}
            {[
              {
                icon: "⚡",
                title: "Lightning Fast",
                desc: "AI analysis in seconds, not hours",
                gradient: "from-violet-500 to-purple-500",
              },
              {
                icon: "🔐",
                title: "Blockchain Secured",
                desc: "Tamper-proof document verification",
                gradient: "from-cyan-500 to-blue-500",
              },
              {
                icon: "🧠",
                title: "AI-Powered",
                desc: "Smart insights & summaries",
                gradient: "from-fuchsia-500 to-pink-500",
              },
              {
                icon: "🎯",
                title: "All-in-One",
                desc: "Everything you need, one platform",
                gradient: "from-amber-500 to-orange-500",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group relative p-6 bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-white/5 hover:border-white/20 transition-all duration-300"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`} />
                <span className="text-3xl mb-4 block">{item.icon}</span>
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6"
            >
              <span className="text-sm text-emerald-400">Our Impact</span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold text-white mb-4"
            >
              Numbers That Speak for Themselves
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-slate-400 max-w-2xl mx-auto"
            >
              Join thousands of organizations that trust Docloq for their document intelligence needs
            </motion.p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative group"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600/20 to-cyan-600/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                <div className="relative p-6 bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-white/5 group-hover:border-white/10 transition-all text-center">
                  <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                    {stat.value}
                  </div>
                  <div className="text-slate-400 text-sm">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6"
            >
              <span className="text-sm text-violet-400">Powerful Features</span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
            >
              <span className="text-white">Everything You Need to</span>
              <br />
              <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Master Your Documents
              </span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-xl text-slate-400 max-w-2xl mx-auto"
            >
              Six powerful modules working together to revolutionize how you handle documents
            </motion.p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group relative"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r opacity-0 group-hover:opacity-100 rounded-2xl blur transition duration-500"
                  style={{ backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))` }}
                />
                <div className={`absolute -inset-0.5 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-30 rounded-2xl blur-xl transition duration-500`} />
                <div className="relative h-full p-8 bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-white/5 group-hover:border-white/10 transition-all duration-500">
                  {/* Icon */}
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-r ${feature.gradient} mb-6 text-white shadow-lg`}>
                    {feature.icon}
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300 group-hover:bg-clip-text transition-all duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Arrow */}
                  <div className="mt-6 flex items-center text-sm font-medium text-slate-500 group-hover:text-white transition-colors">
                    <span>Learn more</span>
                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Document Analysis Section */}
      <section className="relative py-32 overflow-hidden">
        {/* Subtle AI Grid Background */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgb(139, 92, 246) 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6">
                <svg className="w-4 h-4 mr-2 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span className="text-sm text-violet-400">AI-Powered Analysis</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Understand Your
                <br />
                <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                  Documents Instantly
                </span>
              </h2>
              <p className="text-xl text-slate-400 mb-8 leading-relaxed">
                Our AI reads, summarizes, and extracts key insights from any document. 
                Get <span className="text-violet-400 font-medium">visual analytics</span> and actionable intelligence in seconds.
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { icon: "📊", title: "Smart Charts", desc: "Visual data extraction" },
                  { icon: "📝", title: "Auto Summary", desc: "Key points at a glance" },
                  { icon: "🔍", title: "Deep Insights", desc: "Pattern recognition" },
                  { icon: "⚡", title: "Instant Analysis", desc: "Results in seconds" },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="p-4 bg-slate-900/50 rounded-xl border border-white/5 hover:border-violet-500/30 transition-colors"
                  >
                    <span className="text-2xl mb-2 block">{item.icon}</span>
                    <h4 className="text-white font-semibold mb-1">{item.title}</h4>
                    <p className="text-slate-500 text-sm">{item.desc}</p>
                  </motion.div>
                ))}
              </div>

              <Link
                to="/contact"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl text-white font-semibold hover:from-violet-500 hover:to-fuchsia-500 transition-all"
              >
                Try AI Analysis
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </Link>
            </motion.div>

            {/* Visual - AI Analysis Preview */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 rounded-3xl blur-3xl" />
              <div className="relative bg-slate-900/80 backdrop-blur-sm rounded-3xl border border-white/10 p-6 overflow-hidden">
                {/* Mock Analysis UI */}
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white font-medium">Q4_Report.pdf</p>
                        <p className="text-xs text-slate-500">Analyzed just now</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">Complete</span>
                  </div>

                  {/* Summary */}
                  <div className="p-4 bg-slate-800/50 rounded-xl">
                    <p className="text-xs text-violet-400 font-medium mb-2">AI SUMMARY</p>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      Revenue increased by 23% YoY. Key growth drivers: enterprise segment (+45%), 
                      APAC region (+38%). Recommendation: expand cloud infrastructure investment.
                    </p>
                  </div>

                  {/* Mini Chart */}
                  <div className="p-4 bg-slate-800/50 rounded-xl">
                    <p className="text-xs text-violet-400 font-medium mb-3">EXTRACTED METRICS</p>
                    <div className="flex items-end gap-2 h-20">
                      {[40, 55, 45, 70, 65, 85, 90].map((height, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          whileInView={{ height: `${height}%` }}
                          transition={{ duration: 0.5, delay: i * 0.1 }}
                          viewport={{ once: true }}
                          className="flex-1 bg-gradient-to-t from-violet-600 to-fuchsia-500 rounded-t"
                        />
                      ))}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-slate-500">
                      <span>Q1</span>
                      <span>Q2</span>
                      <span>Q3</span>
                      <span>Q4</span>
                    </div>
                  </div>

                  {/* Key Insights */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Sentiment", value: "Positive", color: "text-emerald-400" },
                      { label: "Risk Level", value: "Low", color: "text-cyan-400" },
                      { label: "Confidence", value: "94%", color: "text-violet-400" },
                    ].map((metric, i) => (
                      <div key={i} className="p-3 bg-slate-800/50 rounded-lg text-center">
                        <p className="text-xs text-slate-500 mb-1">{metric.label}</p>
                        <p className={`text-sm font-semibold ${metric.color}`}>{metric.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative py-32 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6"
            >
              <span className="text-sm text-cyan-400">Simple Process</span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white"
            >
              How It Works
            </motion.h2>
          </div>

          {/* Steps */}
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-24 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-violet-500/50 via-purple-500/50 to-cyan-500/50" />
            
            {[
              { step: "01", title: "Upload Documents", desc: "Drag and drop your documents or import from cloud storage. We support all major file formats.", icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" },
              { step: "02", title: "AI Processing", desc: "Our advanced AI analyzes, categorizes, and extracts key information from your documents automatically.", icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" },
              { step: "03", title: "Manage & Collaborate", desc: "Access your intelligent document library, share securely, and collaborate with your team in real-time.", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="relative text-center"
              >
                {/* Step Number */}
                <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-violet-600 to-cyan-600 mb-8">
                  <span className="text-2xl font-bold text-white">{item.step}</span>
                  <div className="absolute -inset-2 bg-gradient-to-r from-violet-600 to-cyan-600 rounded-full blur-xl opacity-30" />
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-4">{item.title}</h3>
                <p className="text-slate-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Blockchain Authenticity Section */}
      <section className="relative py-32 overflow-hidden">
        {/* Blockchain Grid Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310b981' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Visual - Blockchain Animation */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="relative order-2 lg:order-1"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-3xl blur-3xl" />
              <div className="relative bg-slate-900/80 backdrop-blur-sm rounded-3xl border border-white/10 p-8">
                {/* Blockchain Chain Visualization */}
                <div className="flex flex-col items-center space-y-4">
                  {[1, 2, 3].map((block, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: index * 0.2 }}
                      viewport={{ once: true }}
                      className="w-full"
                    >
                      {index > 0 && (
                        <div className="flex justify-center mb-4">
                          <motion.div 
                            className="w-0.5 h-8 bg-gradient-to-b from-emerald-500 to-cyan-500"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                          />
                        </div>
                      )}
                      <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl blur opacity-30 group-hover:opacity-60 transition" />
                        <div className="relative bg-slate-800 rounded-xl p-4 border border-emerald-500/30">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-emerald-400 font-mono">Block #{2024100 + index}</span>
                            <span className="text-xs text-slate-500">Verified ✓</span>
                          </div>
                          <div className="text-xs text-slate-400 font-mono truncate mb-2">
                            Hash: 0x{['7a3f2d8e9c4b1a5f6d2e', '8b4c3e9f2a1d5c6b7e8f', '9c5d4f0a3b2e6d7c8f9a'][index]}...
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500">{['Contract.pdf', 'Invoice.pdf', 'Report.docx'][index]}</span>
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-xs text-emerald-400">Immutable</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
                <svg className="w-4 h-4 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span className="text-sm text-emerald-400">Blockchain-Powered</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Immutable Document
                <br />
                <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  Authenticity
                </span>
              </h2>
              <p className="text-xl text-slate-400 mb-8 leading-relaxed">
                Every document uploaded to Docloq receives a unique cryptographic fingerprint 
                stored on the blockchain. This ensures <span className="text-emerald-400 font-medium">100% tamper detection</span> and 
                provides irrefutable proof of document authenticity.
              </p>
              
              <div className="space-y-4">
                {[
                  { title: "SHA-256 Cryptographic Hashing", desc: "Military-grade encryption for document fingerprinting" },
                  { title: "Distributed Ledger Storage", desc: "Decentralized verification across multiple nodes" },
                  { title: "Instant Verification", desc: "Verify any document's authenticity in milliseconds" },
                  { title: "Audit Trail", desc: "Complete history of document access and modifications" },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-start space-x-3"
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center mt-0.5">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-white font-medium">{item.title}</span>
                      <p className="text-sm text-slate-500">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                viewport={{ once: true }}
                className="mt-8"
              >
                <Link
                  to="/contact"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-xl text-white font-semibold hover:from-emerald-500 hover:to-cyan-500 transition-all"
                >
                  Start Verifying Documents
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="relative py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
                <span className="text-sm text-emerald-400">Enterprise Security</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Your Documents Are
                <br />
                <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  Fort Knox Secure
                </span>
              </h2>
              <p className="text-xl text-slate-400 mb-8 leading-relaxed">
                We take security seriously. Your documents are protected with military-grade encryption 
                and stored in compliance with global data protection regulations.
              </p>
              
              <div className="space-y-4">
                {[
                  "256-bit AES encryption at rest and in transit",
                  "SOC 2 Type II certified infrastructure",
                  "GDPR and HIPAA compliant",
                  "Real-time threat monitoring and detection",
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center space-x-3"
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-slate-300">{item}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Visual */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-3xl blur-3xl" />
              <div className="relative bg-slate-900/80 backdrop-blur-sm rounded-3xl border border-white/10 p-8">
                <div className="flex items-center justify-center h-80">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="relative w-64 h-64"
                  >
                    {/* Orbiting Elements */}
                    {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 flex items-center justify-center"
                        style={{
                          top: '50%',
                          left: '50%',
                          transform: `rotate(${deg}deg) translateX(120px) translateY(-50%)`,
                        }}
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                      >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </motion.div>
                    ))}
                    
                    {/* Center Shield */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 flex items-center justify-center">
                      <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 via-purple-600/20 to-cyan-600/20" />
          <div className="absolute inset-0 bg-slate-950/80" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Ready to Transform Your
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Document Workflow?
              </span>
            </h2>
            <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
              Join organizations who have revolutionized their document management. 
              Contact us to request access.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contact"
                className="group relative inline-flex items-center justify-center"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-600 rounded-xl blur-lg opacity-70 group-hover:opacity-100 transition duration-300" />
                <span className="relative flex items-center px-10 py-5 bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-600 rounded-xl text-lg font-semibold text-white">
                  Request Access
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </Link>
              <Link
                to="/login"
                className="px-10 py-5 rounded-xl text-lg font-semibold text-white border border-white/20 hover:bg-white/5 transition-all duration-300"
              >
                Sign In
              </Link>
            </div>
            <p className="mt-6 text-sm text-slate-500">
              Enterprise-grade security • Invitation-only access • 24/7 support
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/5 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-5 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="relative inline-block mb-4">
                <div className="absolute -inset-2 bg-gradient-to-r from-violet-600 to-cyan-600 rounded-lg blur opacity-20" />
                <h3 className="relative text-2xl font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  Docloq
                </h3>
              </div>
              <p className="text-slate-500 mb-6 max-w-sm">
                Docloq Technologies Inc. is a leading provider of AI-powered document intelligence solutions, 
                helping enterprises streamline their document workflows since 2021.
              </p>
              <div className="flex space-x-4">
                {['twitter', 'github', 'linkedin'].map((social) => (
                  <a key={social} href="#" className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                    <span className="sr-only">{social}</span>
                    <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z"/>
                    </svg>
                  </a>
                ))}
              </div>
            </div>
            
            {[
              { title: 'Product', links: ['Features', 'Security', 'Pricing', 'Changelog'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Press'] },
              { title: 'Support', links: ['Help Center', 'Contact', 'Status', 'API Docs'] },
            ].map((column, i) => (
              <div key={i}>
                <h4 className="text-white font-semibold mb-4">{column.title}</h4>
                <ul className="space-y-3">
                  {column.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-slate-500 hover:text-white transition-colors text-sm">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-600 text-sm">© 2026 Docloq Technologies Inc. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-slate-600 hover:text-white text-sm transition-colors">Privacy Policy</a>
              <a href="#" className="text-slate-600 hover:text-white text-sm transition-colors">Terms of Service</a>
              <a href="#" className="text-slate-600 hover:text-white text-sm transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </>
  );
}
