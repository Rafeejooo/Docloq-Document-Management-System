import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AOS from 'aos';
import 'aos/dist/aos.css';

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

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      easing: 'ease-out-cubic',
    });
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const contactInfo = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      title: "Headquarters",
      lines: ["Docloq Technologies Inc.", "1250 Innovation Drive, Suite 400", "San Francisco, CA 94107", "United States"],
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      title: "Email Us",
      lines: ["General: hello@docloq.io", "Sales: sales@docloq.io", "Support: support@docloq.io", "Press: media@docloq.io"],
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      title: "Call Us",
      lines: ["US: +1 (888) 462-3625", "UK: +44 20 7946 0958", "EU: +49 30 901820", "24/7 Enterprise Support"],
    },
  ];

  const offices = [
    { city: "San Francisco", country: "USA", role: "Global Headquarters", timezone: "PST (UTC-8)" },
    { city: "London", country: "UK", role: "EMEA Headquarters", timezone: "GMT (UTC+0)" },
    { city: "Singapore", country: "Singapore", role: "APAC Headquarters", timezone: "SGT (UTC+8)" },
    { city: "Sydney", country: "Australia", role: "ANZ Operations", timezone: "AEDT (UTC+11)" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-1/4 -left-32 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)' }}
        />
        <div className="absolute bottom-1/4 -right-32 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%)' }}
        />
        <div className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
            backgroundSize: '100px 100px',
          }}
        />
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
              <Link to="/" className="relative">
                <div className="absolute -inset-2 bg-gradient-to-r from-violet-600 to-cyan-600 rounded-lg blur opacity-30" />
                <h1 className="relative text-2xl font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  Docloq
                </h1>
              </Link>
            </motion.div>

            {/* Desktop Navigation */}
            <motion.div 
              className="hidden md:flex items-center space-x-8"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Link to="/#features" className="text-slate-400 hover:text-white transition-colors">Features</Link>
              <Link to="/#how-it-works" className="text-slate-400 hover:text-white transition-colors">How it Works</Link>
              <Link to="/#security" className="text-slate-400 hover:text-white transition-colors">Security</Link>
              <span className="text-violet-400 font-medium">Contact</span>
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
                to="/register"
                className="relative group"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-cyan-600 rounded-lg blur opacity-60 group-hover:opacity-100 transition duration-300" />
                <span className="relative flex items-center px-6 py-2.5 bg-slate-950 rounded-lg font-medium text-white group-hover:bg-slate-900 transition-colors">
                  Get Started
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
                <Link to="/#features" className="block text-slate-300 hover:text-white py-2">Features</Link>
                <Link to="/#how-it-works" className="block text-slate-300 hover:text-white py-2">How it Works</Link>
                <Link to="/#security" className="block text-slate-300 hover:text-white py-2">Security</Link>
                <span className="block text-violet-400 py-2 font-medium">Contact</span>
                <div className="pt-4 space-y-3">
                  <Link to="/login" className="block text-center py-3 text-white border border-white/20 rounded-lg">Sign In</Link>
                  <Link to="/register" className="block text-center py-3 bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-lg">Get Started</Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6"
          >
            <span className="text-sm text-violet-400">Get in Touch</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6"
          >
            <span className="text-white">We'd Love to</span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Hear From You
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-slate-400 max-w-2xl mx-auto"
          >
            Have questions about Docloq? Our team is here to help you transform your document workflow.
          </motion.p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="relative py-12 px-4 sm:px-6 lg:px-8">
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {contactInfo.map((info, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group relative"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600/20 to-cyan-600/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                <div className="relative p-8 bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-white/5 group-hover:border-white/10 transition-all">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 mb-4 text-white">
                    {info.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">{info.title}</h3>
                  <div className="space-y-2">
                    {info.lines.map((line, i) => (
                      <p key={i} className="text-slate-400 text-sm">{line}</p>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-white mb-8">Send Us a Message</h2>
              
              {isSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-8 bg-slate-900/80 rounded-2xl border border-emerald-500/30 text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Message Sent!</h3>
                  <p className="text-slate-400">Thank you for reaching out. Our team will get back to you within 24 hours.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">First Name</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-slate-900/80 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-slate-900/80 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-slate-900/80 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                        placeholder="john@company.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-900/80 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Company</label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-900/80 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                      placeholder="Your Company Name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Subject</label>
                    <div className="relative">
                      <select
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-slate-900/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all appearance-none cursor-pointer [&>option]:bg-slate-900 [&>option]:text-white"
                      >
                        <option value="" className="bg-slate-900 text-slate-400">Select a topic</option>
                        <option value="sales" className="bg-slate-900">Sales Inquiry</option>
                        <option value="support" className="bg-slate-900">Technical Support</option>
                        <option value="partnership" className="bg-slate-900">Partnership Opportunities</option>
                        <option value="enterprise" className="bg-slate-900">Enterprise Solutions</option>
                        <option value="demo" className="bg-slate-900">Request a Demo</option>
                        <option value="other" className="bg-slate-900">Other</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Message</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      className="w-full px-4 py-3 bg-slate-900/80 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all resize-none"
                      placeholder="Tell us about your needs..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group relative w-full"
                  >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-600 rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-300" />
                    <span className="relative flex items-center justify-center w-full px-8 py-4 bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-600 rounded-xl text-lg font-semibold text-white">
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sending...
                        </>
                      ) : (
                        <>
                          Send Message
                          <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </>
                      )}
                    </span>
                  </button>
                </form>
              )}
            </motion.div>

            {/* Right Side - Company Info */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              {/* About Company */}
              <div className="p-8 bg-slate-900/50 rounded-2xl border border-white/5">
                <h3 className="text-2xl font-bold text-white mb-4">About Docloq Technologies</h3>
                <p className="text-slate-400 leading-relaxed mb-4">
                  Founded in 2021, Docloq Technologies Inc. is a pioneer in AI-powered document intelligence solutions. 
                  Our platform serves over 150 enterprise clients across 45+ countries, processing millions of documents daily.
                </p>
                <p className="text-slate-400 leading-relaxed">
                  Backed by leading venture capital firms including Sequoia Capital, Andreessen Horowitz, and Accel Partners, 
                  we're on a mission to revolutionize how organizations manage, analyze, and secure their documents.
                </p>
              </div>

              {/* Global Offices */}
              <div className="p-8 bg-slate-900/50 rounded-2xl border border-white/5">
                <h3 className="text-2xl font-bold text-white mb-6">Global Offices</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {offices.map((office, index) => (
                    <div
                      key={index}
                      className="p-4 bg-slate-800/50 rounded-xl border border-white/5"
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-lg font-semibold text-white">{office.city}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-400 text-sm">{office.country}</span>
                      </div>
                      <p className="text-violet-400 text-sm mb-1">{office.role}</p>
                      <p className="text-slate-500 text-xs">{office.timezone}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="p-8 bg-gradient-to-r from-violet-600/10 to-cyan-600/10 rounded-2xl border border-white/5">
                <h3 className="text-2xl font-bold text-white mb-6">Why Choose Docloq?</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">150+</div>
                    <div className="text-slate-400 text-sm">Enterprise Clients</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">45+</div>
                    <div className="text-slate-400 text-sm">Countries</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">99.9%</div>
                    <div className="text-slate-400 text-sm">Uptime SLA</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">24/7</div>
                    <div className="text-slate-400 text-sm">Expert Support</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Map Placeholder */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="p-1 rounded-2xl bg-gradient-to-r from-violet-600/30 via-purple-600/30 to-cyan-600/30">
            <div className="bg-slate-900 rounded-2xl p-8 md:p-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-violet-500/20 mb-6">
                <svg className="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Serving Customers Globally</h3>
              <p className="text-slate-400 max-w-2xl mx-auto">
                With offices in San Francisco, London, Singapore, and Sydney, we provide localized support 
                and services to our clients across all time zones.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <Link to="/" className="text-xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Docloq
              </Link>
              <span className="text-slate-600">|</span>
              <span className="text-slate-500 text-sm">© 2026 Docloq Technologies Inc.</span>
            </div>
            <div className="flex space-x-6">
              <Link to="/" className="text-slate-500 hover:text-white text-sm transition-colors">Home</Link>
              <a href="#" className="text-slate-500 hover:text-white text-sm transition-colors">Privacy Policy</a>
              <a href="#" className="text-slate-500 hover:text-white text-sm transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
