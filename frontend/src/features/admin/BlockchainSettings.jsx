import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import adminService from "../../services/admin.service";

// Format date
const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function BlockchainSettings() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [blockchainData, setBlockchainData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [walletConfig, setWalletConfig] = useState({
    walletAddress: '',
    rpcUrl: 'https://polygon-rpc.com',
    network: 'polygon-mainnet',
  });

  useEffect(() => {
    if (!adminService.isAuthenticated()) {
      navigate("/login2");
      return;
    }
    loadBlockchainData();
  }, [navigate]);

  const loadBlockchainData = async () => {
    setIsLoading(true);
    try {
      const result = await adminService.getBlockchainStats();
      if (result.success) {
        setBlockchainData(result.data);
        setTransactions(result.data.transactions || []);
        if (result.data.walletAddress) {
          setWalletConfig(prev => ({
            ...prev,
            walletAddress: result.data.walletAddress,
          }));
        }
      }
    } catch (error) {
      console.error('Load blockchain data error:', error);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-slate-400">Loading blockchain data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                to="/admin/dashboard" 
                className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">Blockchain Settings</h1>
                <p className="text-sm text-slate-400">Manage blockchain configuration and view transactions</p>
              </div>
            </div>
            
            {/* Network Status */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-emerald-400">Polygon Mainnet</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Stats Cards */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* MATIC Balance */}
            <div className="relative bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 rounded-2xl p-5 overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-purple-500/20 rounded-xl">
                    <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-sm text-slate-400">MATIC Balance</span>
                </div>
                <p className="text-3xl font-bold text-white mb-1">
                  {blockchainData?.polygonBalance || '0.00'}
                </p>
                <p className="text-xs text-slate-500">≈ ${blockchainData?.maticUsdValue || '0.00'} USD</p>
              </div>
            </div>

            {/* Total Transactions */}
            <div className="relative bg-gradient-to-br from-cyan-500/10 to-transparent border border-cyan-500/20 rounded-2xl p-5 overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-cyan-500/20 rounded-xl">
                    <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span className="text-sm text-slate-400">Total Transactions</span>
                </div>
                <p className="text-3xl font-bold text-white mb-1">
                  {blockchainData?.totalTransactions?.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-slate-500">{blockchainData?.pendingTransactions || 0} pending</p>
              </div>
            </div>

            {/* Documents Verified */}
            <div className="relative bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-2xl p-5 overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-emerald-500/20 rounded-xl">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-sm text-slate-400">Documents Verified</span>
                </div>
                <p className="text-3xl font-bold text-white mb-1">
                  {blockchainData?.documentsHashed?.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-slate-500">On-chain verification</p>
              </div>
            </div>

            {/* Gas Used */}
            <div className="relative bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 rounded-2xl p-5 overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-amber-500/20 rounded-xl">
                    <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                    </svg>
                  </div>
                  <span className="text-sm text-slate-400">Total Gas Used</span>
                </div>
                <p className="text-3xl font-bold text-white mb-1">
                  {blockchainData?.gasUsed || '0.00'} <span className="text-lg">MATIC</span>
                </p>
                <p className="text-xs text-slate-500">All time gas fees</p>
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <motion.div variants={itemVariants} className="flex gap-2 border-b border-slate-800/50 pb-4">
            {[
              { id: 'overview', label: 'Wallet Config', icon: '⚙️' },
              { id: 'transactions', label: 'Transactions', icon: '📜' },
              { id: 'contracts', label: 'Smart Contracts', icon: '📄' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </motion.div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Wallet Configuration */}
                <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-6">Wallet Configuration</h3>
                  
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">
                        Wallet Address
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={walletConfig.walletAddress}
                          onChange={(e) => setWalletConfig({...walletConfig, walletAddress: e.target.value})}
                          placeholder="0x..."
                          className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
                        />
                        <button className="px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-400 hover:text-white hover:border-slate-600 transition-all">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">
                        Network
                      </label>
                      <div className="relative">
                        <select
                          value={walletConfig.network}
                          onChange={(e) => setWalletConfig({...walletConfig, network: e.target.value})}
                          className="w-full appearance-none px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white hover:border-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all cursor-pointer"
                        >
                          <option value="polygon-mainnet" className="bg-slate-800 text-white">Polygon Mainnet</option>
                          <option value="polygon-amoy" className="bg-slate-800 text-white">Polygon Amoy Testnet</option>
                          <option value="ethereum-mainnet" className="bg-slate-800 text-white">Ethereum Mainnet</option>
                          <option value="ethereum-sepolia" className="bg-slate-800 text-white">Ethereum Sepolia</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-400 mb-2">
                        RPC URL
                      </label>
                      <input
                        type="text"
                        value={walletConfig.rpcUrl}
                        onChange={(e) => setWalletConfig({...walletConfig, rpcUrl: e.target.value})}
                        placeholder="https://polygon-rpc.com"
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-800/50">
                    <button className="px-5 py-2.5 text-slate-400 hover:text-white transition-colors">
                      Reset
                    </button>
                    <button className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-white font-medium rounded-xl transition-all">
                      Save Configuration
                    </button>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                        <span className="text-lg">🔗</span>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Last Block</p>
                        <p className="text-lg font-semibold text-white">#68,234,512</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                        <span className="text-lg">⛽</span>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Gas Price</p>
                        <p className="text-lg font-semibold text-white">30 Gwei</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <span className="text-lg">📡</span>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Network Status</p>
                        <p className="text-lg font-semibold text-emerald-400">Connected</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'transactions' && (
              <motion.div
                key="transactions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl overflow-hidden">
                  <div className="p-5 border-b border-slate-800/50">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">Transaction History</h3>
                      <button className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
                        View on PolygonScan →
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-800/30">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Tx Hash</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Type</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Gas Fee</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {(transactions.length > 0 ? transactions : [
                          { hash: '0x1a2b3c...4d5e6f', type: 'Document Hash', status: 'confirmed', gas: '0.00234', time: new Date() },
                          { hash: '0x7g8h9i...0j1k2l', type: 'Verification', status: 'confirmed', gas: '0.00189', time: new Date(Date.now() - 3600000) },
                          { hash: '0x3m4n5o...6p7q8r', type: 'Document Hash', status: 'pending', gas: '0.00256', time: new Date(Date.now() - 7200000) },
                        ]).map((tx, index) => (
                          <tr key={index} className="hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4">
                              <span className="font-mono text-sm text-cyan-400 hover:text-cyan-300 cursor-pointer">
                                {tx.hash}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-300">{tx.type}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${
                                tx.status === 'confirmed' 
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : 'bg-amber-500/10 text-amber-400'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  tx.status === 'confirmed' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                                }`} />
                                {tx.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-400">{tx.gas} MATIC</td>
                            <td className="px-6 py-4 text-sm text-slate-400">{formatDate(tx.time)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'contracts' && (
              <motion.div
                key="contracts"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Document Verification Contract</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-slate-400">Contract Address</label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 px-4 py-3 bg-slate-800/50 rounded-xl text-cyan-400 font-mono text-sm">
                          0x742d35Cc6634C0532925a3b844Bc9e7595f8b3E1
                        </code>
                        <button className="p-3 bg-slate-800/50 rounded-xl text-slate-400 hover:text-white transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-slate-400">Network</label>
                        <p className="text-white mt-1">Polygon Mainnet</p>
                      </div>
                      <div>
                        <label className="text-sm text-slate-400">Status</label>
                        <p className="text-emerald-400 mt-1">✓ Verified</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-amber-500/20 rounded-xl">
                      <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-amber-400 mb-1">Smart Contract Notice</h4>
                      <p className="text-sm text-amber-400/80">
                        Modifying smart contract settings requires careful consideration. 
                        Changes may affect document verification functionality.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>
    </div>
  );
}
