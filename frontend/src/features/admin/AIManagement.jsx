import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import adminService from "../../services/admin.service";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

// Particles configuration - violet/purple AI theme
const aiParticlesOptions = {
  fullScreen: { enable: false },
  background: { color: { value: "transparent" } },
  fpsLimit: 60,
  particles: {
    color: { value: ["#8b5cf6", "#a78bfa", "#7c3aed", "#06b6d4"] },
    links: {
      color: "#8b5cf6",
      distance: 150,
      enable: true,
      opacity: 0.08,
      width: 1,
    },
    move: {
      enable: true,
      speed: 0.4,
      direction: "none",
      random: true,
      straight: false,
      outModes: { default: "out" },
    },
    number: { value: 30, density: { enable: true, area: 1200 } },
    opacity: { value: { min: 0.1, max: 0.3 } },
    size: { value: { min: 1, max: 2.5 } },
  },
  detectRetina: true,
};

export default function AIManagement() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('playground');
  const [isLoading, setIsLoading] = useState(true);
  const [admin, setAdmin] = useState(null);
  
  // AI Playground State
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamStatus, setStreamStatus] = useState('idle'); // idle, connecting, streaming, complete, error
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const responseRef = useRef(null);
  
  // Particles & Effects State
  const [particlesReady, setParticlesReady] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { damping: 30, stiffness: 100 });
  const smoothY = useSpring(mouseY, { damping: 30, stiffness: 100 });

  // Floating neural network nodes
  const neuralNodes = useMemo(() => 
    Array.from({ length: 6 }, (_, i) => ({
      id: i,
      x: 10 + Math.random() * 80,
      y: 10 + Math.random() * 80,
      size: 4 + Math.random() * 8,
      delay: i * 0.8,
      duration: 6 + Math.random() * 4,
    })), []
  );
  
  // Credits State
  const [credits, setCredits] = useState({
    total: 100000,
    used: 45230,
    remaining: 54770,
    resetDate: '2026-02-01',
  });
  
  // Usage Stats
  const [usageStats, setUsageStats] = useState({
    totalRequests: 12450,
    totalTokens: 892340,
    avgResponseTime: 1.2,
    successRate: 99.2,
  });
  
  // AI Models
  const aiModels = [
    { id: 'gpt-4o', name: 'GPT-4o', description: 'Most capable model', tokensPerCredit: 1 },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Fast and efficient', tokensPerCredit: 10 },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'High performance', tokensPerCredit: 2 },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Cost effective', tokensPerCredit: 20 },
  ];

  // Initialize particles engine
  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setParticlesReady(true));
  }, []);

  // Mouse tracking for parallax
  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseX.set(e.clientX - window.innerWidth / 2);
      mouseY.set(e.clientY - window.innerHeight / 2);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  const particlesLoaded = useCallback(async (container) => {
    // Particles loaded
  }, []);

  useEffect(() => {
    if (!adminService.isAuthenticated()) {
      navigate("/login2");
      return;
    }
    setAdmin(adminService.getCurrentAdmin());
    loadAIStats();
  }, [navigate]);

  const loadAIStats = async () => {
    setIsLoading(true);
    try {
      // Simulated API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 800));
      // Data would come from API
    } catch (error) {
      console.error('Load AI stats error:', error);
    }
    setIsLoading(false);
  };

  // Simulate AI streaming response
  const handleTestAI = async () => {
    if (!prompt.trim() || isStreaming) return;
    
    setIsStreaming(true);
    setStreamStatus('connecting');
    setResponse('');
    
    try {
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setStreamStatus('streaming');
      
      // Simulated streaming response
      const sampleResponse = `Hello! I'm responding to your prompt: "${prompt}"

This is a simulated streaming response from the ${selectedModel} model. In a production environment, this would be a real API call to OpenAI's streaming endpoint.

Here's what I can help you with:
1. **Document Analysis** - Extract key information from documents
2. **Content Generation** - Create summaries, reports, and more
3. **Data Extraction** - Pull structured data from unstructured text
4. **Question Answering** - Answer questions about your documents

The AI integration in DocLoq uses advanced language models to provide intelligent assistance for document management and analysis tasks.

Response completed successfully! ✅`;

      // Stream character by character
      for (let i = 0; i < sampleResponse.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 15));
        setResponse(prev => prev + sampleResponse[i]);
        
        // Auto scroll
        if (responseRef.current) {
          responseRef.current.scrollTop = responseRef.current.scrollHeight;
        }
      }
      
      setStreamStatus('complete');
    } catch (error) {
      setStreamStatus('error');
      setResponse('Error: Failed to connect to AI service. Please check your configuration.');
    }
    
    setIsStreaming(false);
  };

  const handleClearChat = () => {
    setPrompt('');
    setResponse('');
    setStreamStatus('idle');
  };

  const creditPercentage = (credits.remaining / credits.total) * 100;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-transparent border-t-cyan-500 rounded-full animate-spin" />
          </div>
          <p className="text-slate-400 animate-pulse">Loading AI Management...</p>
        </motion.div>
      </div>
    );
  }

  const tabs = [
    { id: 'playground', label: 'AI Playground', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )},
    { id: 'credits', label: 'Credits & Usage', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )},
    { id: 'settings', label: 'AI Settings', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )},
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      {/* === ENHANCED BACKGROUND EFFECTS === */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Particles Layer */}
        {particlesReady && (
          <Particles
            id="ai-particles"
            particlesLoaded={particlesLoaded}
            options={aiParticlesOptions}
            className="absolute inset-0"
          />
        )}
        
        {/* Parallax Gradient Orbs */}
        <motion.div
          className="absolute top-0 right-1/4 w-150 h-150 bg-violet-500/8 rounded-full blur-[150px]"
          style={{ x: smoothX, y: smoothY }}
        />
        <motion.div
          className="absolute bottom-0 left-1/4 w-125 h-125 bg-cyan-500/6 rounded-full blur-[120px]"
          style={{
            x: smoothX,
            y: smoothY,
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-100 h-100 bg-purple-500/5 rounded-full blur-[100px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* CSS Grid Overlay */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(139,92,246,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.02) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Floating Neural Nodes */}
        {neuralNodes.map((node) => (
          <motion.div
            key={node.id}
            className="absolute rounded-full border border-violet-500/15 bg-violet-500/5"
            style={{
              left: `${node.x}%`,
              top: `${node.y}%`,
              width: node.size,
              height: node.size,
            }}
            animate={{
              y: [-15, 15, -15],
              x: [-8, 8, -8],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: node.duration,
              repeat: Infinity,
              delay: node.delay,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Scan Line */}
        <motion.div
          className="absolute left-0 right-0 h-px bg-linear-to-r from-transparent via-violet-500/20 to-transparent"
          animate={{ top: ["0%", "100%"] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/70 backdrop-blur-2xl border-b border-violet-500/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                to="/admin/dashboard"
                className="p-2.5 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-xl border border-slate-700/50 hover:border-violet-500/30 transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-linear-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20">
                    <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <span className="flex items-center gap-2">
                    AI Management
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-violet-500/20 text-violet-400 rounded-full border border-violet-500/30">NEURAL</span>
                  </span>
                </h1>
                <p className="text-sm text-slate-400 ml-12">Test AI availability and manage credits</p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 bg-slate-800/60 backdrop-blur-sm rounded-xl border border-violet-500/20">
                <p className="text-xs text-slate-400">Credits Remaining</p>
                <p className="text-lg font-bold text-violet-400">{credits.remaining.toLocaleString()}</p>
              </div>
              <div className={`px-3 py-1.5 rounded-lg flex items-center gap-2 ${
                streamStatus === 'streaming' ? 'bg-green-500/10 border border-green-500/30' :
                streamStatus === 'error' ? 'bg-red-500/10 border border-red-500/30' :
                'bg-slate-800/50 border border-slate-700/50'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  streamStatus === 'streaming' ? 'bg-green-400 animate-pulse' :
                  streamStatus === 'error' ? 'bg-red-400' :
                  'bg-slate-500'
                }`} />
                <span className={`text-xs font-medium ${
                  streamStatus === 'streaming' ? 'text-green-400' :
                  streamStatus === 'error' ? 'text-red-400' :
                  'text-slate-400'
                }`}>
                  {streamStatus === 'idle' && 'Ready'}
                  {streamStatus === 'connecting' && 'Connecting...'}
                  {streamStatus === 'streaming' && 'Streaming'}
                  {streamStatus === 'complete' && 'Complete'}
                  {streamStatus === 'error' && 'Error'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 p-1.5 bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-violet-500/10 w-fit">
          {tabs.map(tab => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-linear-to-r from-violet-500/20 to-purple-500/20 text-violet-400 border border-violet-500/30 shadow-lg shadow-violet-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* AI Playground Tab */}
          {activeTab === 'playground' && (
            <motion.div
              key="playground"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Model Selector */}
              <motion.div variants={itemVariants} className="grid md:grid-cols-4 gap-4">
                {aiModels.map(model => (
                  <motion.button
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-4 rounded-2xl border transition-all duration-200 text-left group ${
                      selectedModel === model.id
                        ? 'bg-violet-500/10 border-violet-500/30 shadow-lg shadow-violet-500/10 backdrop-blur-xl'
                        : 'bg-slate-900/60 backdrop-blur-xl border-violet-500/10 hover:border-violet-500/25'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-semibold ${selectedModel === model.id ? 'text-violet-400' : 'text-white'}`}>
                        {model.name}
                      </span>
                      {selectedModel === model.id && (
                        <motion.svg
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-4 h-4 text-violet-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </motion.svg>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{model.description}</p>
                    <p className="text-xs text-slate-600 mt-1">{model.tokensPerCredit} tokens/credit</p>
                    {/* Bottom border reveal on hover */}
                    <div className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl transition-all duration-300 ${
                      selectedModel === model.id
                        ? 'bg-linear-to-r from-violet-500 to-purple-500 opacity-100'
                        : 'bg-linear-to-r from-violet-500 to-purple-500 opacity-0 group-hover:opacity-50'
                    }`} />
                  </motion.button>
                ))}
              </motion.div>

              {/* Chat Interface */}
              <motion.div variants={itemVariants} className="grid lg:grid-cols-2 gap-6">
                {/* Input */}
                <div className="bg-slate-900/60 backdrop-blur-xl border border-violet-500/10 rounded-2xl overflow-hidden group hover:border-violet-500/20 transition-all duration-300">
                  <div className="p-4 border-b border-violet-500/10 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                      Prompt Input
                    </h3>
                    <span className="text-xs text-slate-500 font-mono">{prompt.length} chars</span>
                  </div>
                  <div className="p-4">
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Enter your test prompt here..."
                      rows={10}
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 resize-none font-mono text-sm"
                    />
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={handleTestAI}
                        disabled={isStreaming || !prompt.trim()}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-medium transition-all duration-200 ${
                          isStreaming || !prompt.trim()
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-linear-to-r from-violet-600 to-purple-600 text-white hover:from-violet-500 hover:to-purple-500 shadow-lg shadow-violet-500/25'
                        }`}
                      >
                        {isStreaming ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Test AI Stream
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleClearChat}
                        className="px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>

                {/* Response */}
                <div className="bg-slate-900/60 backdrop-blur-xl border border-violet-500/10 rounded-2xl overflow-hidden group hover:border-violet-500/20 transition-all duration-300">
                  <div className="p-4 border-b border-violet-500/10 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      AI Response
                    </h3>
                    <div className="flex items-center gap-2">
                      {streamStatus === 'streaming' && (
                        <span className="flex items-center gap-1 text-xs text-green-400">
                          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                          Streaming
                        </span>
                      )}
                      <span className="text-xs text-slate-500">{response.length} chars</span>
                    </div>
                  </div>
                  <div 
                    ref={responseRef}
                    className="p-4 h-80 overflow-y-auto"
                  >
                    {response ? (
                      <div className="prose prose-invert prose-sm max-w-none">
                        <pre className="whitespace-pre-wrap font-mono text-sm text-slate-300 bg-transparent p-0 m-0">
                          {response}
                          {isStreaming && <span className="inline-block w-2 h-4 bg-violet-400 animate-pulse ml-1" />}
                        </pre>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                        <div className="text-center">
                          <svg className="w-12 h-12 mx-auto mb-3 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          AI response will appear here
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Connection Test Info */}
              <motion.div variants={itemVariants} className="grid md:grid-cols-3 gap-4">
                <motion.div whileHover={{ y: -4 }} className="bg-slate-900/60 backdrop-blur-xl border border-violet-500/10 rounded-2xl p-5 group hover:border-green-500/20 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">API Status</p>
                      <p className="text-xs text-green-400">Connected</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">Last checked: Just now</p>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl bg-linear-to-r from-green-500 to-emerald-500 opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
                </motion.div>
                
                <motion.div whileHover={{ y: -4 }} className="bg-slate-900/60 backdrop-blur-xl border border-violet-500/10 rounded-2xl p-5 group hover:border-violet-500/20 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
                      <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Avg Response Time</p>
                      <p className="text-xs text-violet-400">{usageStats.avgResponseTime}s</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">Based on last 100 requests</p>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl bg-linear-to-r from-violet-500 to-purple-500 opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
                </motion.div>
                
                <motion.div whileHover={{ y: -4 }} className="bg-slate-900/60 backdrop-blur-xl border border-violet-500/10 rounded-2xl p-5 group hover:border-cyan-500/20 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                      <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Success Rate</p>
                      <p className="text-xs text-cyan-400">{usageStats.successRate}%</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">All-time average</p>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl bg-linear-to-r from-cyan-500 to-teal-500 opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
                </motion.div>
              </motion.div>
            </motion.div>
          )}

          {/* Credits & Usage Tab */}
          {activeTab === 'credits' && (
            <motion.div
              key="credits"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Credit Overview */}
              <motion.div variants={itemVariants} className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900/60 backdrop-blur-xl border border-violet-500/10 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                    Credit Balance
                  </h3>
                  
                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-400">Used: {credits.used.toLocaleString()}</span>
                      <span className="text-slate-400">Total: {credits.total.toLocaleString()}</span>
                    </div>
                    <div className="h-4 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${100 - creditPercentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-linear-to-r from-violet-600 to-purple-600 rounded-full"
                      />
                    </div>
                    <div className="flex justify-between text-xs mt-2">
                      <span className="text-violet-400">{(100 - creditPercentage).toFixed(1)}% used</span>
                      <span className="text-slate-500">Resets on {credits.resetDate}</span>
                    </div>
                  </div>

                  {/* Credit Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-violet-400">{credits.remaining.toLocaleString()}</p>
                      <p className="text-xs text-slate-500 mt-1">Remaining Credits</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-amber-400">{credits.used.toLocaleString()}</p>
                      <p className="text-xs text-slate-500 mt-1">Credits Used</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-cyan-400">{credits.total.toLocaleString()}</p>
                      <p className="text-xs text-slate-500 mt-1">Total Credits</p>
                    </div>
                  </div>
                </div>

                {/* Add Credits Card */}
                <div className="bg-linear-to-br from-violet-500/10 to-purple-500/10 backdrop-blur-xl border border-violet-500/20 rounded-2xl p-6 relative overflow-hidden">
                  {/* Decorative glow */}
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl" />
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-linear-to-br from-violet-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center">
                      <svg className="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-white mb-2">Need More Credits?</h4>
                    <p className="text-sm text-slate-400 mb-4">Upgrade your plan or purchase additional credits.</p>
                    <button className="w-full py-3 px-4 bg-linear-to-r from-violet-600 to-purple-600 text-white font-medium rounded-xl hover:from-violet-500 hover:to-purple-500 transition-all shadow-lg shadow-violet-500/25">
                      Add Credits
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Usage Stats */}
              <motion.div variants={itemVariants} className="grid md:grid-cols-4 gap-4">
                <motion.div whileHover={{ y: -4 }} className="bg-slate-900/60 backdrop-blur-xl border border-violet-500/10 rounded-2xl p-5 group hover:border-violet-500/20 transition-all duration-300 relative overflow-hidden">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
                      <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-white">{usageStats.totalRequests.toLocaleString()}</p>
                  <p className="text-sm text-slate-400">Total Requests</p>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r from-violet-500 to-purple-500 opacity-0 group-hover:opacity-50 transition-opacity" />
                </motion.div>
                
                <motion.div whileHover={{ y: -4 }} className="bg-slate-900/60 backdrop-blur-xl border border-violet-500/10 rounded-2xl p-5 group hover:border-cyan-500/20 transition-all duration-300 relative overflow-hidden">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                      <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-white">{(usageStats.totalTokens / 1000).toFixed(0)}K</p>
                  <p className="text-sm text-slate-400">Tokens Processed</p>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r from-cyan-500 to-teal-500 opacity-0 group-hover:opacity-50 transition-opacity" />
                </motion.div>
                
                <motion.div whileHover={{ y: -4 }} className="bg-slate-900/60 backdrop-blur-xl border border-violet-500/10 rounded-2xl p-5 group hover:border-emerald-500/20 transition-all duration-300 relative overflow-hidden">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-white">{usageStats.avgResponseTime}s</p>
                  <p className="text-sm text-slate-400">Avg Response Time</p>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r from-emerald-500 to-green-500 opacity-0 group-hover:opacity-50 transition-opacity" />
                </motion.div>
                
                <motion.div whileHover={{ y: -4 }} className="bg-slate-900/60 backdrop-blur-xl border border-violet-500/10 rounded-2xl p-5 group hover:border-amber-500/20 transition-all duration-300 relative overflow-hidden">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-white">{usageStats.successRate}%</p>
                  <p className="text-sm text-slate-400">Success Rate</p>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r from-amber-500 to-orange-500 opacity-0 group-hover:opacity-50 transition-opacity" />
                </motion.div>
              </motion.div>

              {/* Usage History Chart Placeholder */}
              <motion.div variants={itemVariants} className="bg-slate-900/60 backdrop-blur-xl border border-violet-500/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  Usage History
                </h3>
                <div className="h-64 flex items-center justify-center text-slate-500 border border-dashed border-violet-500/20 rounded-xl bg-slate-800/20">
                  <div className="text-center">
                    <svg className="w-12 h-12 mx-auto mb-3 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="text-sm">Usage chart will be displayed here</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* AI Settings Tab */}
          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* API Configuration */}
              <motion.div variants={itemVariants} className="bg-slate-900/60 backdrop-blur-xl border border-violet-500/10 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-violet-500/10">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                    API Configuration
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">Configure your OpenAI API settings</p>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">API Key</label>
                    <div className="flex gap-3">
                      <input
                        type="password"
                        placeholder="sk-..."
                        defaultValue="sk-••••••••••••••••••••••••••••••••"
                        className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 font-mono text-sm"
                      />
                      <button className="px-4 py-3 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors">
                        Reveal
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Your OpenAI API key is securely encrypted</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Organization ID (Optional)</label>
                    <input
                      type="text"
                      placeholder="org-..."
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 font-mono text-sm"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Default Model</label>
                      <div className="relative">
                        <select className="w-full appearance-none bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white hover:border-slate-600 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all cursor-pointer">
                          <option value="gpt-4o-mini" className="bg-slate-800 text-white">GPT-4o Mini</option>
                          <option value="gpt-4o" className="bg-slate-800 text-white">GPT-4o</option>
                          <option value="gpt-4-turbo" className="bg-slate-800 text-white">GPT-4 Turbo</option>
                          <option value="gpt-3.5-turbo" className="bg-slate-800 text-white">GPT-3.5 Turbo</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Max Tokens per Request</label>
                      <input
                        type="number"
                        defaultValue={4096}
                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/50"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Rate Limits */}
              <motion.div variants={itemVariants} className="bg-slate-900/60 backdrop-blur-xl border border-violet-500/10 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-violet-500/10">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    Rate Limits
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">Configure usage limits for AI features</p>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Requests per Minute</label>
                      <input
                        type="number"
                        defaultValue={60}
                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Requests per Day</label>
                      <input
                        type="number"
                        defaultValue={1000}
                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Tokens per Day</label>
                      <input
                        type="number"
                        defaultValue={100000}
                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/50"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Features Toggle */}
              <motion.div variants={itemVariants} className="bg-slate-900/60 backdrop-blur-xl border border-violet-500/10 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-violet-500/10">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    AI Features
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">Enable or disable AI features</p>
                </div>
                <div className="p-6 space-y-4">
                  {[
                    { name: 'Document Analysis', desc: 'AI-powered document analysis and extraction', enabled: true },
                    { name: 'Chatbot', desc: 'Interactive AI chatbot for users', enabled: true },
                    { name: 'Auto Summarization', desc: 'Automatic document summarization', enabled: true },
                    { name: 'Content Generation', desc: 'AI-generated content and reports', enabled: false },
                    { name: 'Smart Search', desc: 'Semantic search across documents', enabled: true },
                  ].map((feature, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ x: 4 }}
                      className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl border border-violet-500/5 hover:border-violet-500/15 transition-all duration-200"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">{feature.name}</p>
                        <p className="text-xs text-slate-500">{feature.desc}</p>
                      </div>
                      <button className={`relative w-12 h-6 rounded-full transition-colors ${feature.enabled ? 'bg-violet-600' : 'bg-slate-700'}`}>
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${feature.enabled ? 'right-1' : 'left-1'}`} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Save Button */}
              <motion.div variants={itemVariants} className="flex justify-end gap-3">
                <button className="px-6 py-3 text-slate-400 hover:text-white transition-colors rounded-xl hover:bg-slate-800/50">
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-3 bg-linear-to-r from-violet-600 to-purple-600 text-white font-medium rounded-xl hover:from-violet-500 hover:to-purple-500 transition-all shadow-lg shadow-violet-500/25"
                >
                  Save Settings
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
