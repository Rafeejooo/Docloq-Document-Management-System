import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import adminService from "../../services/admin.service";
import { Pagination, TableSkeleton } from "../../components/ui/Skeleton";

// Format currency
const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount);
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const dashParticlesOptions = {
  fullScreen: false,
  background: { color: { value: "transparent" } },
  fpsLimit: 60,
  particles: {
    color: { value: ["#06b6d4", "#14b8a6"] },
    links: { color: "#06b6d4", distance: 120, enable: true, opacity: 0.04, width: 1 },
    move: { enable: true, speed: 0.3, direction: "none", outModes: { default: "out" } },
    number: { density: { enable: true, area: 1200 }, value: 30 },
    opacity: { value: { min: 0.05, max: 0.2 } },
    size: { value: { min: 1, max: 2 } },
  },
  detectRetina: true,
};

// 3D Globe Component using Canvas
const Globe3D = ({ totalUsers = 0 }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const rotationRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2.5;

    // Generate random points on sphere for "users"
    const points = [];
    const numPoints = Math.min(200, totalUsers || 50);
    for (let i = 0; i < numPoints; i++) {
      const phi = Math.acos(-1 + (2 * i) / numPoints);
      const theta = Math.sqrt(numPoints * Math.PI) * phi;
      points.push({
        phi,
        theta,
        size: Math.random() * 2 + 1,
        brightness: Math.random() * 0.5 + 0.5,
      });
    }

    // Draw function
    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw glow effect
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 1.5);
      gradient.addColorStop(0, 'rgba(6, 182, 212, 0.1)');
      gradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.05)');
      gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw outer ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 5, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw globe outline with gradient
      const globeGradient = ctx.createLinearGradient(
        centerX - radius, centerY - radius,
        centerX + radius, centerY + radius
      );
      globeGradient.addColorStop(0, 'rgba(15, 118, 110, 0.3)');
      globeGradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.2)');
      globeGradient.addColorStop(1, 'rgba(20, 184, 166, 0.3)');

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = globeGradient;
      ctx.fill();
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw latitude lines
      for (let lat = -60; lat <= 60; lat += 30) {
        const y = centerY + radius * Math.sin(lat * Math.PI / 180);
        const latRadius = radius * Math.cos(lat * Math.PI / 180);
        
        ctx.beginPath();
        ctx.ellipse(centerX, y, latRadius, latRadius * 0.2, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw longitude lines (rotating)
      for (let lon = 0; lon < 180; lon += 30) {
        const angle = (lon + rotationRef.current) * Math.PI / 180;
        
        ctx.beginPath();
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle);
        ctx.scale(Math.cos(angle * 0.5), 1);
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.restore();
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw points (users) on the globe
      points.forEach(point => {
        const rotatedTheta = point.theta + rotationRef.current * Math.PI / 180;
        const x = centerX + radius * Math.sin(point.phi) * Math.cos(rotatedTheta);
        const y = centerY + radius * Math.cos(point.phi);
        const z = Math.sin(point.phi) * Math.sin(rotatedTheta);

        // Only draw points on the front of the globe
        if (z > -0.2) {
          const opacity = (z + 1) / 2 * point.brightness;
          const size = point.size * (z + 1) / 2;

          // Point glow
          const pointGradient = ctx.createRadialGradient(x, y, 0, x, y, size * 3);
          pointGradient.addColorStop(0, `rgba(6, 182, 212, ${opacity * 0.8})`);
          pointGradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
          ctx.fillStyle = pointGradient;
          ctx.fillRect(x - size * 3, y - size * 3, size * 6, size * 6);

          // Point core
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(6, 182, 212, ${opacity})`;
          ctx.fill();
        }
      });

      // Update rotation
      rotationRef.current += 0.3;

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [totalUsers]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={400}
      className="w-full h-full"
    />
  );
};

// Stat Card Component
const StatCard = ({ title, value, subtitle, icon, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    whileHover={{ y: -4, transition: { duration: 0.2 } }}
    className="relative overflow-hidden bg-white dark:bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-200 dark:border-slate-800/50 rounded-2xl p-5 group hover:border-cyan-500/20 transition-all duration-300"
  >
    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-all" />
    <div className="absolute bottom-0 left-0 h-px w-0 group-hover:w-full bg-linear-to-r from-cyan-500/40 to-transparent transition-all duration-500" />
    <div className="relative">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-200 dark:border-slate-700/50 group-hover:border-cyan-500/20 transition-all">
          {icon}
        </div>
      </div>
      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{value}</h3>
      <p className="text-sm text-slate-400">{title}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </div>
  </motion.div>
);

// Quick Action Card
const QuickActionCard = ({ title, description, icon, href, color }) => (
  <Link
    to={href}
    className="group relative overflow-hidden bg-white dark:bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-200 dark:border-slate-800/50 rounded-2xl p-5 hover:border-cyan-500/20 transition-all duration-300"
  >
    <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-all" />
    <div className="absolute bottom-0 left-0 h-px w-0 group-hover:w-full bg-linear-to-r from-cyan-500/40 to-transparent transition-all duration-500" />
    <div className="relative flex items-center gap-4">
      <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-200 dark:border-slate-700/50 group-hover:border-cyan-500/20 transition-all">
        {icon}
      </div>
      <div className="flex-1">
        <h4 className="text-white font-medium group-hover:text-cyan-400 transition-colors">{title}</h4>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <svg className="w-5 h-5 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  </Link>
);

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [activity, setActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [admin, setAdmin] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [particlesReady, setParticlesReady] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [clientsPage, setClientsPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [activityPage, setActivityPage] = useState(1);
  const PAGE_SIZE = 10;

  // Init particles
  useEffect(() => {
    initParticlesEngine(async (engine) => { await loadSlim(engine); }).then(() => setParticlesReady(true));
  }, []);

  // Mouse parallax
  useEffect(() => {
    const h = (e) => setMousePos({ x: (e.clientX / window.innerWidth - 0.5) * 15, y: (e.clientY / window.innerHeight - 0.5) * 15 });
    window.addEventListener("mousemove", h, { passive: true });
    return () => window.removeEventListener("mousemove", h);
  }, []);

  // Check authentication
  useEffect(() => {
    if (!adminService.isAuthenticated()) {
      navigate("/login2");
      return;
    }
    setAdmin(adminService.getCurrentAdmin());
    loadDashboardData();
  }, [navigate]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, usersRes, activityRes] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getUsers({ limit: 10 }),
        adminService.getRecentActivity(15),
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (usersRes.success) setUsers(usersRes.data.users || []);
      if (activityRes.success) setActivity(activityRes.data || []);
    } catch (error) {
      console.error('Load dashboard data error:', error);
    }
    setIsLoading(false);
  };

  // Paginated data slices
  const paginatedClients = useMemo(() => {
    const items = stats?.clients || [];
    const start = (clientsPage - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [stats?.clients, clientsPage]);

  const paginatedUsers = useMemo(() => {
    const start = (usersPage - 1) * PAGE_SIZE;
    return users.slice(start, start + PAGE_SIZE);
  }, [users, usersPage]);

  const paginatedActivity = useMemo(() => {
    const start = (activityPage - 1) * PAGE_SIZE;
    return activity.slice(start, start + PAGE_SIZE);
  }, [activity, activityPage]);

  const handleLogout = async () => {
    await adminService.logout();
    navigate("/login2");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-transparent border-t-cyan-500 rounded-full animate-spin" />
          </div>
          <p className="text-slate-400 animate-pulse">Loading dashboard...</p>
        </motion.div>
      </div>
    );
  }

  const navItems = [
    { id: 'overview', label: 'Overview', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    )},
    { id: 'clients', label: 'Clients', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    )},
    { id: 'users', label: 'Users', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    )},
    { id: 'activity', label: 'Activity', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    )},
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-50 dark:bg-slate-950">
      {/* Particles */}
      {particlesReady && (
        <Particles id="dash-particles" options={dashParticlesOptions} className="fixed inset-0 z-0 pointer-events-none" />
      )}

      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          animate={{ x: mousePos.x * 1.2, y: mousePos.y * 1.2 }}
          transition={{ type: "spring", damping: 40, stiffness: 80 }}
          className="absolute top-0 left-1/4 w-200 h-200 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)" }}
        />
        <motion.div
          animate={{ x: mousePos.x * -0.8, y: mousePos.y * -0.8 }}
          transition={{ type: "spring", damping: 40, stiffness: 80 }}
          className="absolute bottom-0 right-1/4 w-150 h-150 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(20,184,166,0.06) 0%, transparent 70%)" }}
        />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "linear-gradient(rgba(6,182,212,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.4) 1px, transparent 1px)", backgroundSize: "80px 80px" }} />
        {/* Scan line */}
        <motion.div className="absolute left-0 right-0 h-px bg-linear-to-r from-transparent via-cyan-500/20 to-transparent" animate={{ top: ["0%", "100%"] }} transition={{ duration: 12, repeat: Infinity, ease: "linear" }} />
      </div>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`fixed left-0 top-0 bottom-0 ${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-white dark:bg-white dark:bg-slate-900/90 backdrop-blur-2xl border-r border-cyan-500/10 flex flex-col z-50 transition-all duration-300`}
      >
        {/* Sidebar inner glow */}
        <div className="absolute inset-0 bg-linear-to-b from-cyan-500/2 to-transparent pointer-events-none" />

        {/* Logo */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-200 dark:border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-linear-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div className="absolute inset-0 rounded-xl bg-linear-to-br from-cyan-400/20 to-teal-400/20 blur-lg" />
            </div>
            {!isSidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h1 className="text-lg font-bold text-slate-900 dark:text-white">DocLoq</h1>
                <p className="text-xs text-cyan-400">Admin Portal</p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item, index) => (
            <motion.button
              key={item.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === item.id
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-lg shadow-cyan-500/5'
                  : 'text-slate-400 hover:bg-slate-100 dark:bg-slate-100 dark:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {item.icon}
              {!isSidebarCollapsed && <span className="font-medium">{item.label}</span>}
            </motion.button>
          ))}

          {/* Divider */}
          <div className="my-4 border-t border-slate-200 dark:border-slate-200 dark:border-slate-800/50" />

          {/* Settings Links */}
          <Link
            to="/admin/blockchain"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-100 dark:bg-slate-100 dark:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-900 dark:hover:text-white transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            {!isSidebarCollapsed && <span className="font-medium">Blockchain</span>}
          </Link>

          <Link
            to="/admin/ai"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-100 dark:bg-slate-100 dark:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-900 dark:hover:text-white transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            {!isSidebarCollapsed && <span className="font-medium">AI Management</span>}
          </Link>
        </nav>

        {/* Collapse Button */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-slate-200 dark:bg-slate-200 dark:bg-slate-800 border border-cyan-500/20 rounded-full flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-all shadow-lg"
        >
          <svg className={`w-4 h-4 transition-transform ${isSidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-200 dark:border-slate-800/50">
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-slate-700 to-slate-800 flex items-center justify-center">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {admin?.firstName?.[0] || 'A'}
              </span>
            </div>
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-900 dark:text-slate-900 dark:text-white truncate">
                  {admin?.firstName} {admin?.lastName}
                </p>
                <p className="text-xs text-slate-500 truncate">{admin?.email}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={`mt-3 w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-2'} px-4 py-2.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!isSidebarCollapsed && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className={`${isSidebarCollapsed ? 'ml-20' : 'ml-64'} p-8 transition-all duration-300 relative z-10`}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-end justify-between"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-3">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500" />
              </span>
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-[0.15em]">Live</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            {activeTab === 'overview' && 'Dashboard Overview'}
            {activeTab === 'clients' && 'Client Organizations'}
            {activeTab === 'users' && 'User Management'}
            {activeTab === 'activity' && 'Activity Log'}
          </h1>
          <p className="text-slate-400">
            {activeTab === 'overview' && 'Welcome back! Here\'s what\'s happening with your platform.'}
            {activeTab === 'clients' && 'View and manage all registered client organizations.'}
            {activeTab === 'users' && 'Manage and monitor all registered users.'}
            {activeTab === 'activity' && 'Track all API activities and requests.'}
          </p>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Hero Section with Globe */}
              <motion.div variants={itemVariants} className="grid lg:grid-cols-2 gap-6">
                {/* Globe Card */}
                <div className="relative bg-linear-to-br from-slate-900/80 to-slate-900/40 backdrop-blur-2xl border border-cyan-500/10 rounded-3xl p-8 overflow-hidden group">
                  <div className="absolute inset-0 bg-linear-to-br from-cyan-500/3 to-teal-500/3" />
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-cyan-500/20 to-transparent" />
                  
                  <div className="relative flex flex-col items-center">
                    <div className="w-64 h-64 mb-6">
                      <Globe3D totalUsers={stats?.totalUsers || 0} />
                    </div>
                    
                    <div className="text-center">
                      <motion.p
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.5, type: "spring" }}
                        className="text-5xl font-bold bg-linear-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent"
                      >
                        {stats?.totalUsers?.toLocaleString() || '0'}
                      </motion.p>
                      <p className="text-slate-400 mt-2">Total Users Worldwide</p>
                      <div className="flex items-center justify-center gap-2 mt-3">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-xs text-emerald-400">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                          </svg>
                          +{stats?.newUsersToday || 0} today
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <StatCard
                    title="Organizations"
                    value={stats?.totalOrganizations?.toLocaleString() || '0'}
                    subtitle="Active clients"
                    delay={0.1}
                    color="purple"
                    icon={
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    }
                  />
                  <StatCard
                    title="Documents"
                    value={stats?.totalDocuments?.toLocaleString() || '0'}
                    subtitle="Total stored"
                    delay={0.2}
                    color="emerald"
                    icon={
                      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    }
                  />
                  <StatCard
                    title="Storage"
                    value={stats?.storageUsage?.totalUsed || '0 MB'}
                    subtitle={`${stats?.storageUsage?.totalFiles || 0} files`}
                    delay={0.3}
                    color="amber"
                    icon={
                      <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                      </svg>
                    }
                  />
                  <StatCard
                    title="Revenue"
                    value={formatCurrency(stats?.totalRevenue || 0)}
                    subtitle="All time"
                    delay={0.4}
                    color="cyan"
                    icon={
                      <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                  />
                </div>
              </motion.div>

              {/* Quick Actions */}
              <motion.div variants={itemVariants}>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h3>
                <div className="grid md:grid-cols-4 gap-4">
                  <QuickActionCard
                    title="Blockchain Settings"
                    description="Configure wallet & transactions"
                    href="/admin/blockchain"
                    color="purple"
                    icon={
                      <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    }
                  />
                  <QuickActionCard
                    title="AI Management"
                    description="Test AI & manage credits"
                    href="/admin/ai"
                    color="violet"
                    icon={
                      <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    }
                  />
                  <QuickActionCard
                    title="View All Clients"
                    description="Manage organizations"
                    href="#"
                    color="cyan"
                    icon={
                      <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                      </svg>
                    }
                  />
                  <QuickActionCard
                    title="System Settings"
                    description="Platform configuration"
                    href="#"
                    color="emerald"
                    icon={
                      <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    }
                  />
                </div>
              </motion.div>

              {/* Recent Activity */}
              <motion.div variants={itemVariants} className="grid lg:grid-cols-2 gap-6">
                {/* Recent Users */}
                <div className="bg-white dark:bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-cyan-500/10 rounded-2xl overflow-hidden group">
                  <div className="p-5 border-b border-slate-200 dark:border-slate-200 dark:border-slate-800/50 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      Recent Users
                    </h3>
                    <button 
                      onClick={() => setActiveTab('users')}
                      className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      View all →
                    </button>
                  </div>
                  <div className="p-4 space-y-2">
                    {users.slice(0, 5).map((user, index) => (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-50 dark:bg-slate-800/30 rounded-xl hover:bg-slate-100 dark:bg-slate-100 dark:bg-slate-800/50 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {user.firstName?.[0] || user.email[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-900 dark:text-slate-900 dark:text-white truncate">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          user.isActive 
                            ? 'bg-emerald-500/10 text-emerald-400' 
                            : 'bg-red-500/10 text-red-400'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Recent Activity Log */}
                <div className="bg-white dark:bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-cyan-500/10 rounded-2xl overflow-hidden group">
                  <div className="p-5 border-b border-slate-200 dark:border-slate-200 dark:border-slate-800/50 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                      Recent Activity
                    </h3>
                    <button 
                      onClick={() => setActiveTab('activity')}
                      className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      View all →
                    </button>
                  </div>
                  <div className="p-4 space-y-2">
                    {activity.slice(0, 5).map((log, index) => (
                      <motion.div
                        key={log.id || index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-50 dark:bg-slate-800/30 rounded-xl"
                      >
                        <div className={`w-2 h-2 rounded-full ${
                          log.statusCode >= 200 && log.statusCode < 300 ? 'bg-emerald-400' :
                          log.statusCode >= 400 ? 'bg-red-400' : 'bg-amber-400'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-mono text-slate-300 truncate">{log.endpoint}</p>
                          <p className="text-xs text-slate-500">{formatDate(log.createdAt)}</p>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${
                          log.method === 'GET' ? 'bg-blue-500/10 text-blue-400' :
                          log.method === 'POST' ? 'bg-emerald-500/10 text-emerald-400' :
                          'bg-amber-500/10 text-amber-400'
                        }`}>
                          {log.method}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Clients Tab */}
          {activeTab === 'clients' && (
            <motion.div
              key="clients"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white dark:bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-cyan-500/10 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-slate-200 dark:border-slate-200 dark:border-slate-800/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-purple-400" />Client Organizations</h3>
                      <p className="text-sm text-slate-400 mt-1">View organization details and usage statistics</p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                      <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span className="text-xs font-medium text-amber-400">Documents protected</span>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-50 dark:bg-slate-800/30">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Organization</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Users</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Documents</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Storage</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Plan</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {paginatedClients.length > 0 ? paginatedClients.map(client => (
                        <tr key={client.id} className="hover:bg-slate-50 dark:bg-slate-50 dark:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-cyan-500/20 to-teal-500/20 flex items-center justify-center">
                                <span className="text-sm font-bold text-cyan-400">
                                  {client.name?.[0]?.toUpperCase() || 'O'}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-900 dark:text-white">{client.name}</p>
                                <p className="text-xs text-slate-500">@{client.slug}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-300">{client.totalUsers || 0}</td>
                          <td className="px-6 py-4 text-sm text-slate-300">{client.totalDocuments || 0}</td>
                          <td className="px-6 py-4 text-sm text-slate-300">{client.storageUsed || '0 MB'}</td>
                          <td className="px-6 py-4">
                            <span className={`text-xs px-2.5 py-1 rounded-full ${
                              client.plan === 'enterprise' ? 'bg-purple-500/10 text-purple-400' :
                              client.plan === 'professional' ? 'bg-blue-500/10 text-blue-400' :
                              'bg-slate-500/10 text-slate-400'
                            }`}>
                              {client.plan || 'basic'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-400">{formatDate(client.createdAt)}</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                            No client organizations found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  currentPage={clientsPage}
                  totalItems={(stats?.clients || []).length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setClientsPage}
                />
              </div>
            </motion.div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="bg-white dark:bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-cyan-500/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-50 dark:bg-slate-800/30">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">User</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Role</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Last Login</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {paginatedUsers.map(user => (
                        <tr key={user.id} className="hover:bg-slate-50 dark:bg-slate-50 dark:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                  {user.firstName?.[0] || user.email[0].toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-900 dark:text-white">{user.firstName} {user.lastName}</p>
                                <p className="text-xs text-slate-500">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-300 capitalize">{user.role}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${
                              user.isActive
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-red-500/10 text-red-400'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-400">{formatDate(user.lastLoginAt)}</td>
                          <td className="px-6 py-4 text-sm text-slate-400">{formatDate(user.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  currentPage={usersPage}
                  totalItems={users.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setUsersPage}
                />
              </div>
            </motion.div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="bg-white dark:bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-cyan-500/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-50 dark:bg-slate-800/30">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Endpoint</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Method</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Duration</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">IP</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {paginatedActivity.map((log, index) => (
                        <tr key={log.id || index} className="hover:bg-slate-50 dark:bg-slate-50 dark:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4">
                            <span className="text-sm font-mono text-slate-300">{log.endpoint}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-xs font-semibold px-2 py-1 rounded ${
                              log.method === 'GET' ? 'bg-blue-500/10 text-blue-400' :
                              log.method === 'POST' ? 'bg-emerald-500/10 text-emerald-400' :
                              log.method === 'PUT' || log.method === 'PATCH' ? 'bg-amber-500/10 text-amber-400' :
                              'bg-red-500/10 text-red-400'
                            }`}>
                              {log.method}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-sm ${
                              log.statusCode >= 200 && log.statusCode < 300 ? 'text-emerald-400' :
                              log.statusCode >= 400 ? 'text-red-400' : 'text-amber-400'
                            }`}>
                              {log.statusCode}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-400">{log.requestDuration}ms</td>
                          <td className="px-6 py-4 text-sm text-slate-400 font-mono">{log.ipAddress}</td>
                          <td className="px-6 py-4 text-sm text-slate-400">{formatDate(log.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  currentPage={activityPage}
                  totalItems={activity.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setActivityPage}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
