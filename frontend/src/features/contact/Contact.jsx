import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function Contact() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const contactInfo = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      title: "Visit Us",
      detail: "1250 Innovation Drive, Suite 400",
      sub: "San Francisco, CA 94107",
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      title: "Email Us",
      detail: "hello@docloq.io",
      sub: "We reply within 24 hours",
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      title: "Call Us",
      detail: "+1 (888) 462-3625",
      sub: "Mon-Fri 9AM-6PM PST",
    },
  ];

  const faqs = [
    {
      q: "How do I get access to Docloq?",
      a: "Docloq is an enterprise solution. Fill out the contact form and our team will review your request within 24-48 hours.",
    },
    {
      q: "Is there a free trial available?",
      a: "Yes, we offer a 14-day free trial for qualified organizations. Contact our sales team to get started.",
    },
    {
      q: "What kind of support do you offer?",
      a: "We provide 24/7 enterprise support via email, phone, and dedicated account managers for premium plans.",
    },
    {
      q: "Can Docloq integrate with my existing tools?",
      a: "Absolutely. Docloq integrates with popular tools like Google Workspace, Microsoft 365, Slack, and more via our API.",
    },
  ];

  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="min-h-screen bg-slate-950 text-white antialiased">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(ellipse, rgba(139, 92, 246, 0.6) 0%, transparent 70%)' }}
        />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[400px] rounded-full opacity-[0.05]"
          style={{ background: 'radial-gradient(ellipse, rgba(6, 182, 212, 0.6) 0%, transparent 70%)' }}
        />
        <div className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }}
        />
      </div>

      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-500 ${scrolled ? 'py-0' : 'py-1'}`}>
        <div className={`absolute inset-0 transition-all duration-500 ${scrolled ? 'bg-slate-950/90 backdrop-blur-2xl border-b border-white/[0.06]' : 'bg-transparent'}`} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-18">
            <motion.div
              className="flex items-center"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Link to="/" className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-r from-violet-600 to-cyan-600 rounded-lg blur opacity-0 group-hover:opacity-30 transition duration-500" />
                <h1 className="relative text-2xl font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  Docloq
                </h1>
              </Link>
            </motion.div>

            {/* Desktop Navigation */}
            <motion.div
              className="hidden md:flex items-center gap-1"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {[
                { label: 'Features', to: '/#features' },
                { label: 'How it Works', to: '/#how-it-works' },
                { label: 'Security', to: '/#security' },
              ].map((item) => (
                <Link key={item.label} to={item.to} className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-all">
                  {item.label}
                </Link>
              ))}
              <span className="px-4 py-2 text-sm text-violet-400 font-medium rounded-lg bg-violet-500/10">Contact</span>
            </motion.div>

            <motion.div
              className="hidden md:flex items-center gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Link
                to="/login"
                className="text-sm text-slate-300 hover:text-white px-5 py-2.5 rounded-xl font-medium transition-all hover:bg-white/5 border border-transparent hover:border-white/10"
              >
                Sign In
              </Link>
              <Link
                to="/login"
                className="relative group"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-cyan-600 rounded-xl blur opacity-50 group-hover:opacity-80 transition duration-300" />
                <span className="relative flex items-center px-5 py-2.5 bg-slate-950 rounded-xl text-sm font-medium text-white group-hover:bg-slate-900 transition-colors">
                  Get Started
                  <svg className="w-3.5 h-3.5 ml-2 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </Link>
            </motion.div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              transition={{ duration: 0.3 }}
              className="md:hidden bg-slate-950/95 backdrop-blur-2xl border-b border-white/[0.06]"
            >
              <div className="px-4 py-5 space-y-1">
                <Link to="/#features" className="block text-slate-300 hover:text-white py-2.5 px-3 rounded-lg hover:bg-white/5 transition-all text-sm">Features</Link>
                <Link to="/#how-it-works" className="block text-slate-300 hover:text-white py-2.5 px-3 rounded-lg hover:bg-white/5 transition-all text-sm">How it Works</Link>
                <Link to="/#security" className="block text-slate-300 hover:text-white py-2.5 px-3 rounded-lg hover:bg-white/5 transition-all text-sm">Security</Link>
                <span className="block text-violet-400 py-2.5 px-3 rounded-lg bg-violet-500/10 text-sm font-medium">Contact</span>
                <div className="pt-3 mt-2 border-t border-white/[0.06] space-y-2">
                  <Link to="/login" className="block text-center py-2.5 text-sm text-white border border-white/10 rounded-xl hover:bg-white/5 transition-all">Sign In</Link>
                  <Link to="/login" className="block text-center py-2.5 text-sm bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-xl font-medium">Get Started</Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-28 sm:pt-32 pb-8 sm:pb-12 px-4 sm:px-6 lg:px-8">
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-xs font-medium text-violet-400 tracking-wide uppercase">Contact Us</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-5 leading-tight tracking-tight"
          >
            <span className="text-white">Let's Start a </span>
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Conversation
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed"
          >
            Have a question or want to learn more about how Docloq can transform your
            document workflow? We're here to help.
          </motion.p>
        </div>
      </section>

      {/* Contact Info Strip */}
      <section className="relative py-6 px-4 sm:px-6 lg:px-8">
        <div className="relative z-10 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            {contactInfo.map((info, index) => (
              <div
                key={index}
                className="group flex items-start gap-4 p-5 rounded-2xl bg-slate-900/40 border border-white/[0.06] hover:border-violet-500/20 hover:bg-slate-900/60 transition-all duration-300"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-violet-500/10 flex items-center justify-center text-violet-400 group-hover:from-violet-500/30 group-hover:to-cyan-500/30 transition-all">
                  {info.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{info.title}</p>
                  <p className="text-sm font-semibold text-white truncate">{info.detail}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{info.sub}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Main Content: Form + Sidebar */}
      <section id="contact-form" className="relative py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">

            {/* Contact Form - 3 cols */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="lg:col-span-3"
            >
              <div className="relative">
                <div className="absolute -inset-px bg-gradient-to-b from-violet-500/20 via-transparent to-cyan-500/20 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <div className="relative bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-white/[0.06] p-6 sm:p-8">
                  <div className="mb-7">
                    <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Send a Message</h2>
                    <p className="text-sm text-slate-500">Fill out the form below and we'll get back to you shortly.</p>
                  </div>

                  {isSubmitted ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="py-16 text-center"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
                        <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">Message Sent!</h3>
                      <p className="text-slate-400 text-sm max-w-sm mx-auto">Thank you for reaching out. Our team will get back to you within 24 hours.</p>
                      <button
                        onClick={() => {
                          setIsSubmitted(false);
                          setFormData({ firstName: '', lastName: '', email: '', company: '', phone: '', subject: '', message: '' });
                        }}
                        className="mt-6 text-sm text-violet-400 hover:text-violet-300 font-medium transition-colors"
                      >
                        Send another message
                      </button>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">First Name *</label>
                          <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 focus:bg-slate-800/70 transition-all"
                            placeholder="John"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Last Name *</label>
                          <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 focus:bg-slate-800/70 transition-all"
                            placeholder="Doe"
                          />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Email *</label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 focus:bg-slate-800/70 transition-all"
                            placeholder="john@company.com"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Phone</label>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 focus:bg-slate-800/70 transition-all"
                            placeholder="+1 (555) 000-0000"
                          />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Company</label>
                          <input
                            type="text"
                            name="company"
                            value={formData.company}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 focus:bg-slate-800/70 transition-all"
                            placeholder="Your Company"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Subject *</label>
                          <div className="relative">
                            <select
                              name="subject"
                              value={formData.subject}
                              onChange={handleChange}
                              required
                              className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 focus:bg-slate-800/70 transition-all appearance-none cursor-pointer [&>option]:bg-slate-900 [&>option]:text-white"
                            >
                              <option value="" className="text-slate-500">Select a topic</option>
                              <option value="account-request">Request Account Access</option>
                              <option value="sales">Sales Inquiry</option>
                              <option value="support">Technical Support</option>
                              <option value="partnership">Partnership</option>
                              <option value="enterprise">Enterprise Solutions</option>
                              <option value="demo">Request a Demo</option>
                              <option value="other">Other</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Message *</label>
                        <textarea
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          required
                          rows={4}
                          className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 focus:bg-slate-800/70 transition-all resize-none"
                          placeholder="Tell us how we can help..."
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="group relative w-full mt-2"
                      >
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-cyan-600 rounded-xl blur opacity-40 group-hover:opacity-70 transition duration-300" />
                        <span className="relative flex items-center justify-center w-full px-6 py-3 bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-600 rounded-xl text-sm font-semibold text-white transition-all">
                          {isSubmitting ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Sending...
                            </>
                          ) : (
                            <>
                              Send Message
                              <svg className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                              </svg>
                            </>
                          )}
                        </span>
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Sidebar - 2 cols */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="lg:col-span-2 space-y-6"
            >
              {/* Request Access CTA */}
              <div className="relative overflow-hidden rounded-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-cyan-600/20" />
                <div className="absolute inset-0 bg-slate-900/80" />
                <div className="relative p-6 border border-violet-500/15 rounded-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-white">Need Access?</h3>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed mb-5">
                    Docloq is an enterprise platform with invitation-only access. Request an account and we'll review your application within 24-48 hours.
                  </p>
                  <div className="space-y-2.5 mb-5">
                    {['Verified organizations only', 'Enterprise-grade security', 'Dedicated onboarding support'].map((item, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <div className="w-5 h-5 rounded-md bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-xs text-slate-300">{item}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      setFormData(prev => ({ ...prev, subject: 'account-request' }));
                      document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full py-2.5 text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-cyan-600 rounded-xl hover:from-violet-500 hover:to-cyan-500 transition-all"
                  >
                    Request Access
                  </button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: '150+', label: 'Enterprise Clients' },
                  { value: '45+', label: 'Countries' },
                  { value: '99.9%', label: 'Uptime SLA' },
                  { value: '<2h', label: 'Avg Response' },
                ].map((stat, i) => (
                  <div key={i} className="p-4 rounded-xl bg-slate-900/40 border border-white/[0.06] text-center">
                    <div className="text-xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">{stat.value}</div>
                    <div className="text-[11px] text-slate-500 mt-1 font-medium uppercase tracking-wider">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Social / Connect */}
              <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/[0.06]">
                <h4 className="text-sm font-semibold text-white mb-4">Connect With Us</h4>
                <div className="flex gap-3">
                  {[
                    { name: 'X', icon: <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /> },
                    { name: 'LinkedIn', icon: <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /> },
                    { name: 'GitHub', icon: <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /> },
                  ].map((social, i) => (
                    <a
                      key={i}
                      href="#"
                      aria-label={social.name}
                      className="w-10 h-10 rounded-xl bg-slate-800/60 border border-white/[0.06] flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 hover:border-violet-500/20 transition-all"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">{social.icon}</svg>
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="relative z-10 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Frequently Asked Questions</h2>
            <p className="text-sm text-slate-400">Quick answers to common questions</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="space-y-3"
          >
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="group rounded-xl border border-white/[0.06] bg-slate-900/30 hover:bg-slate-900/50 transition-all overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <span className="text-sm font-medium text-white pr-4">{faq.q}</span>
                  <svg
                    className={`w-4 h-4 text-slate-500 flex-shrink-0 transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <AnimatePresence>
                  {openFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="px-5 pb-4">
                        <p className="text-sm text-slate-400 leading-relaxed">{faq.a}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="relative z-10 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="relative rounded-2xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 via-purple-600/10 to-cyan-600/10" />
            <div className="absolute inset-0 bg-slate-900/50" />
            <div className="relative px-6 sm:px-10 py-10 sm:py-12 text-center border border-white/[0.06] rounded-2xl">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-violet-500/15 border border-violet-500/20 mb-5">
                <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">Trusted by Teams Worldwide</h3>
              <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed mb-6">
                With offices in San Francisco, London, Singapore, and Sydney, we provide dedicated support
                across every timezone.
              </p>
              <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-xs text-slate-500">
                <span className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  San Francisco, USA
                </span>
                <span className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  London, UK
                </span>
                <span className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Singapore
                </span>
                <span className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Sydney, AU
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/[0.04] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <Link to="/" className="text-lg font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Docloq
              </Link>
              <span className="text-slate-800">|</span>
              <span className="text-slate-600 text-xs">&copy; 2026 Docloq Technologies Inc.</span>
            </div>
            <div className="flex items-center gap-6">
              <Link to="/" className="text-slate-600 hover:text-slate-300 text-xs transition-colors">Home</Link>
              <a href="#" className="text-slate-600 hover:text-slate-300 text-xs transition-colors">Privacy</a>
              <a href="#" className="text-slate-600 hover:text-slate-300 text-xs transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
