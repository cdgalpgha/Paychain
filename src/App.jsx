import { useState, useEffect } from "react";
import { useAccount, useDisconnect, useReadContract, useWriteContract, usePublicClient } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { parseEther, formatEther } from 'viem';
import { supabase } from './supabase';

const CONTRACT_ADDRESS = "0x1E6d93B4641cAFDA9e629b9bbd747aE7261BB786";
const CONTRACT_ABI = [
  { name: "addEmployee", type: "function", stateMutability: "nonpayable", inputs: [{ name: "wallet", type: "address" }, { name: "name", type: "string" }, { name: "salaryWei", type: "uint256" }], outputs: [{ name: "id", type: "uint256" }] },
  { name: "deactivateEmployee", type: "function", stateMutability: "nonpayable", inputs: [{ name: "id", type: "uint256" }], outputs: [] },
  { name: "runPayroll", type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { name: "payEmployee", type: "function", stateMutability: "nonpayable", inputs: [{ name: "id", type: "uint256" }], outputs: [] },
  { name: "deposit", type: "function", stateMutability: "payable", inputs: [], outputs: [] },
  { name: "withdraw", type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { name: "getActiveEmployees", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "ids", type: "uint256[]" }, { name: "wallets", type: "address[]" }, { name: "names", type: "string[]" }, { name: "salaries", type: "uint256[]" }, { name: "lastPaidAts", type: "uint256[]" }] },
  { name: "totalPayrollCost", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "total", type: "uint256" }] },
  { name: "treasuryBalance", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "owner", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
];

const CHAINS = ["ERC20", "BEP20", "Polygon", "Arbitrum", "Optimism"];

// ── Animated Logo ─────────────────────────────────────────────────────────
const PayChainLogo = ({ size = 36 }) => (
  <div style={{ width: size, height: size, position: 'relative', flexShrink: 0, isolation: 'isolate' }}>
    <div style={{ position: 'absolute', inset: 0, zIndex: 1, animation: 'logo-ring-spin 6s linear infinite' }}>
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: 'block' }}>
        <defs><linearGradient id="og1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#7c3aed" /><stop offset="100%" stopColor="#2563eb" /></linearGradient></defs>
        <polygon points="29,7 71,7 93,29 93,71 71,93 29,93 7,71 7,29" fill="none" stroke="url(#og1)" strokeWidth="3" strokeDasharray="8 4" />
      </svg>
    </div>
    <div style={{ position: 'absolute', inset: size * 0.1, zIndex: 2 }}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ display: 'block' }}>
        <defs><linearGradient id="og2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#7c3aed" /><stop offset="50%" stopColor="#2563eb" /><stop offset="100%" stopColor="#06b6d4" /></linearGradient></defs>
        <polygon points="29,7 71,7 93,29 93,71 71,93 29,93 7,71 7,29" fill="url(#og2)" />
      </svg>
    </div>
    <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.4, fontWeight: 900, lineHeight: 1, color: '#ffffff', animation: 'logo-core-breathe 2.5s ease-in-out infinite', textShadow: '0 0 10px rgba(255,255,255,0.9), 0 0 25px rgba(255,255,255,0.5)', fontFamily: 'system-ui, sans-serif', userSelect: 'none' }}>$</div>
  </div>
);

// ── Wallet Logos ──────────────────────────────────────────────────────────
const MetaMaskLogo = ({ size = 38 }) => (
  <svg width={size} height={size} viewBox="0 0 318 318" xmlns="http://www.w3.org/2000/svg">
    <polygon fill="#E2761B" stroke="#E2761B" strokeLinecap="round" strokeLinejoin="round" points="274.1,35.5 174.6,109.4 193,65.8"/>
    <polygon fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" points="44,35.5 142.7,110.1 125.1,65.8"/>
    <polygon fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" points="238.3,206.8 211.8,247.4 268.5,263 284.8,207.7"/>
    <polygon fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" points="33.4,207.7 49.6,263 106.3,247.4 79.8,206.8"/>
    <polygon fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" points="103.6,138.2 87.8,162.1 144.1,164.6 142.1,104.1"/>
    <polygon fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" points="214.5,138.2 175.9,103.4 174.6,164.6 230.3,162.1"/>
    <polygon fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" points="106.3,247.4 140.6,230.9 110.9,208.1"/>
    <polygon fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" points="177.5,230.9 211.8,247.4 207.2,208.1"/>
    <polygon fill="#D7C1B3" stroke="#D7C1B3" strokeLinecap="round" strokeLinejoin="round" points="211.8,247.4 177.5,230.9 180.2,252.9 179.8,262.3"/>
    <polygon fill="#D7C1B3" stroke="#D7C1B3" strokeLinecap="round" strokeLinejoin="round" points="106.3,247.4 138.3,262.3 137.9,252.9 140.6,230.9"/>
    <polygon fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round" points="138.8,193.5 110.2,185.3 130.1,176.3"/>
    <polygon fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round" points="179.3,193.5 188,176.3 207.9,185.3"/>
    <polygon fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round" points="106.3,247.4 111.1,206.8 79.8,207.7"/>
    <polygon fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round" points="207,206.8 211.8,247.4 238.3,207.7"/>
    <polygon fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round" points="230.3,162.1 174.6,164.6 179.3,193.5 188,176.3 207.9,185.3"/>
    <polygon fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round" points="110.2,185.3 130.1,176.3 138.8,193.5 144.1,164.6 87.8,162.1"/>
    <polygon fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round" points="87.8,162.1 138.8,193.5 110.9,208.1"/>
    <polygon fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round" points="207.9,185.3 179.3,193.5 207.2,208.1"/>
    <polygon fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round" points="144.1,164.6 138.8,193.5 145.5,227.4 147,182.8"/>
    <polygon fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round" points="174.6,164.6 171.1,182.7 172.6,227.4 179.3,193.5"/>
    <polygon fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round" points="179.3,193.5 172.6,227.4 177.5,230.9 207.2,208.1"/>
    <polygon fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round" points="110.9,208.1 140.6,230.9 145.5,227.4 138.8,193.5"/>
    <polygon fill="#C0AD9E" stroke="#C0AD9E" strokeLinecap="round" strokeLinejoin="round" points="179.8,262.3 180.2,252.9 177.7,250.7 140.4,250.7 137.9,252.9 138.3,262.3 106.3,247.4 117.2,256.3 140.1,271.9 177.9,271.9 200.9,256.3 211.8,247.4"/>
    <polygon fill="#161616" stroke="#161616" strokeLinecap="round" strokeLinejoin="round" points="177.5,230.9 172.6,227.4 145.5,227.4 140.6,230.9 137.9,252.9 140.4,250.7 177.7,250.7 180.2,252.9"/>
    <polygon fill="#763D16" stroke="#763D16" strokeLinecap="round" strokeLinejoin="round" points="278.3,114.2 286.8,73.4 274.1,35.5 177.5,106.9 214.5,138.2 267.2,153.5 278.9,140 273.8,136.4 281.8,129.1 275.6,124.4 283.6,118.2"/>
    <polygon fill="#763D16" stroke="#763D16" strokeLinecap="round" strokeLinejoin="round" points="31.3,73.4 39.8,114.2 34.4,118.2 42.4,124.4 36.3,129.1 44.3,136.4 39.1,140 50.9,153.5 103.6,138.2 140.6,106.9 44,35.5"/>
    <polygon fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round" points="267.2,153.5 214.5,138.2 230.3,162.1 207.2,208.1 238.3,207.7 284.8,207.7"/>
    <polygon fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round" points="103.6,138.2 50.9,153.5 33.4,207.7 79.8,207.7 110.9,208.1 87.8,162.1"/>
    <polygon fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round" points="174.6,164.6 177.5,106.9 193.1,65.8 125.1,65.8 140.6,106.9 144.1,164.6 145.4,183 145.5,227.4 172.6,227.4 172.6,183"/>
  </svg>
);

const WalletConnectLogo = ({ size = 38 }) => (
  <svg width={size} height={size} viewBox="0 0 480 480" xmlns="http://www.w3.org/2000/svg">
    <rect width="480" height="480" rx="100" fill="#3B99FC"/>
    <path d="M126.6 168.9c62.7-61.4 164.4-61.4 227.1 0l7.5 7.4c3.1 3.1 3.1 8 0 11.1l-25.8 25.3c-1.6 1.5-4.1 1.5-5.7 0l-10.4-10.2c-43.7-42.8-114.6-42.8-158.3 0l-11.1 10.9c-1.6 1.5-4.1 1.5-5.7 0l-25.8-25.3c-3.1-3.1-3.1-8 0-11.1l8.2-8.1zm280.5 52.3l22.9 22.5c3.1 3.1 3.1 8 0 11.1L320.7 362.9c-3.1 3.1-8.2 3.1-11.3 0l-83.7-82.1c-.8-.8-2.1-.8-2.8 0l-83.7 82.1c-3.1 3.1-8.2 3.1-11.3 0L18.6 254.8c-3.1-3.1-3.1-8 0-11.1l22.9-22.5c3.1-3.1 8.2-3.1 11.3 0l83.7 82.1c.8.8 2.1.8 2.8 0l83.7-82.1c3.1-3.1 8.2-3.1 11.3 0l83.7 82.1c.8.8 2.1.8 2.8 0l83.7-82.1c3.1-3.1 8.2-3.1 11.3 0z" fill="white"/>
  </svg>
);

// ── Chain Badge ───────────────────────────────────────────────────────────
const ChainBadge = ({ chain }) => {
  const colors = {
    "base mainnet": { bg: "rgba(6,182,212,0.12)", color: "#06b6d4", border: "rgba(6,182,212,0.25)" },
    "base sepolia": { bg: "rgba(6,182,212,0.12)", color: "#06b6d4", border: "rgba(6,182,212,0.25)" },
    erc20: { bg: "rgba(96,165,250,0.12)", color: "#60a5fa", border: "rgba(96,165,250,0.25)" },
    bep20: { bg: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "rgba(245,158,11,0.25)" },
    polygon: { bg: "rgba(167,139,250,0.12)", color: "#a78bfa", border: "rgba(167,139,250,0.25)" },
    arbitrum: { bg: "rgba(16,185,129,0.12)", color: "#10b981", border: "rgba(16,185,129,0.25)" },
    optimism: { bg: "rgba(248,113,113,0.12)", color: "#f87171", border: "rgba(248,113,113,0.25)" },
  };
  const key = chain.toLowerCase().replace(/\s/g, " ");
  const s = colors[key] || { bg: "rgba(124,58,237,0.1)", color: "#a78bfa", border: "rgba(124,58,237,0.2)" };
  return <span style={{ background: s.bg, color: s.color, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, border: `1px solid ${s.border}`, letterSpacing: "0.02em" }}>{chain}</span>;
};

const StatusBadge = ({ status }) => {
  const colors = {
    Success: { bg: "rgba(16,185,129,0.12)", color: "#10b981", border: "rgba(16,185,129,0.25)" },
    Pending: { bg: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "rgba(245,158,11,0.25)" },
    Approved: { bg: "rgba(37,99,235,0.12)", color: "#60a5fa", border: "rgba(37,99,235,0.25)" },
    Rejected: { bg: "rgba(239,68,68,0.12)", color: "#f87171", border: "rgba(239,68,68,0.25)" },
  };
  const s = colors[status] || { bg: "rgba(124,58,237,0.1)", color: "#a78bfa", border: "rgba(124,58,237,0.2)" };
  return <span style={{ background: s.bg, color: s.color, padding: "3px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, border: `1px solid ${s.border}`, letterSpacing: "0.05em", textTransform: "uppercase" }}>{status}</span>;
};

const Particles = () => {
  const particles = Array.from({ length: 30 }, (_, i) => ({ id: i, size: Math.random() * 3 + 1, left: Math.random() * 100, top: Math.random() * 100, delay: Math.random() * 6, duration: Math.random() * 6 + 6, animNum: Math.floor(Math.random() * 3) + 1, color: ['#7c3aed','#2563eb','#06b6d4','#a78bfa','#60a5fa'][Math.floor(Math.random() * 5)], shape: Math.random() > 0.7 ? '0%' : '50%' }));
  return <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>{particles.map(p => <div key={p.id} style={{ position: 'absolute', left: `${p.left}%`, top: `${p.top}%`, width: p.size, height: p.size, borderRadius: p.shape, background: p.color, opacity: 0.4, animation: `float${p.animNum} ${p.duration}s ${p.delay}s ease-in-out infinite`, boxShadow: `0 0 ${p.size * 3}px ${p.color}` }} />)}</div>;
};

const Confetti = ({ show }) => {
  if (!show) return null;
  const pieces = Array.from({ length: 50 }, (_, i) => ({ id: i, left: Math.random() * 100, delay: Math.random() * 1.5, duration: Math.random() * 1.5 + 2, size: Math.random() * 10 + 4, color: ['#7c3aed','#2563eb','#06b6d4','#a78bfa','#60a5fa','#f59e0b','#10b981'][Math.floor(Math.random() * 7)], animNum: Math.floor(Math.random() * 6) + 1, shape: Math.random() > 0.5 ? '50%' : '2px' }));
  return <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999, overflow: 'hidden' }}>{pieces.map(p => <div key={p.id} style={{ position: 'absolute', left: `${p.left}%`, top: '-10px', width: p.size, height: p.size, background: p.color, borderRadius: p.shape, animation: `confetti-fall-${p.animNum} ${p.duration}s ${p.delay}s ease-in forwards`, boxShadow: `0 0 8px ${p.color}` }} />)}</div>;
};

export default function App() {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { disconnect } = useDisconnect();
  const publicClient = usePublicClient();
  const [showConfetti, setShowConfetti] = useState(false);
  const [loading, setLoading] = useState(true);
  const [txPending, setTxPending] = useState(false);
  const [page, setPage] = useState("wallet");
  const [pageKey, setPageKey] = useState(0);
  const [employees, setEmployees] = useState([]);
  const [contractEmployees, setContractEmployees] = useState([]);
  const [chainFilter, setChainFilter] = useState("All");
  const [searchQ, setSearchQ] = useState("");
  const [history, setHistory] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [nextApprovalId, setNextApprovalId] = useState(1);
  const [signers, setSigners] = useState([{ id: 1, name: "CFO — Diana Park", addr: "0xCFO1...1234" }, { id: 2, name: "CEO — James Wu", addr: "0xCEO2...5678" }]);
  const [nextSignerId, setNextSignerId] = useState(3);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [showSignerModal, setShowSignerModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [reviewingId, setReviewingId] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [success, setSuccess] = useState(null);
  const [expandedRun, setExpandedRun] = useState(null);
  const [formData, setFormData] = useState({ name: "", email: "", addr: "", chain: "ERC20", salary: "" });
  const [csvText, setCsvText] = useState("");
  const [newSignerName, setNewSignerName] = useState("");
  const [newSignerAddr, setNewSignerAddr] = useState("");

  const { writeContractAsync } = useWriteContract();
  const { data: treasuryData, refetch: refetchTreasury } = useReadContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'treasuryBalance' });
  const { data: payrollCostData, refetch: refetchPayrollCost } = useReadContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'totalPayrollCost' });
  const { data: ownerData } = useReadContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'owner' });
  const { data: activeEmployeesData, refetch: refetchEmployees } = useReadContract({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'getActiveEmployees' });

  const treasuryBalance = treasuryData ? formatEther(treasuryData) : "0";
  const payrollCost = payrollCostData ? formatEther(payrollCostData) : "0";
  const isOwner = ownerData && address ? ownerData.toLowerCase() === address.toLowerCase() : false;
  const enoughFunds = parseFloat(treasuryBalance) >= parseFloat(payrollCost) && parseFloat(payrollCost) > 0;

  useEffect(() => {
    if (activeEmployeesData) {
      const [ids, wallets, names, salaries, lastPaids] = activeEmployeesData;
      setContractEmployees(ids.map((id, i) => ({ id: id.toString(), contractId: id, name: names[i], addr: wallets[i], salary: formatEther(salaries[i]), lastPaid: lastPaids[i].toString() === '0' ? 'Never' : new Date(Number(lastPaids[i]) * 1000).toLocaleDateString(), chain: "Base Mainnet", email: "", isOnChain: true })));
    }
  }, [activeEmployeesData]);

  const bg = "#03010a", surface = "#080514", surface2 = "#0d0920", border = "#1a1035", border2 = "#241848";
  const brand = "#7c3aed", brandDark = "#5b21b6", brandLight = "rgba(124,58,237,0.12)";
  const blue = "#2563eb", cyan = "#06b6d4", green = "#10b981", greenLight = "rgba(16,185,129,0.1)";
  const amber = "#f59e0b", amberLight = "rgba(245,158,11,0.1)", red = "#ef4444", redLight = "rgba(239,68,68,0.1)";
  const textPrimary = "#e2d9f3", textSecondary = "#7c6fa0", textMuted = "#4a4168";

  const btn = { padding: "8px 18px", border: `1px solid ${border2}`, borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600, background: surface2, color: textSecondary, transition: "all 0.2s", fontFamily: "inherit", letterSpacing: "0.01em" };
  const btnBrand = { ...btn, background: `linear-gradient(135deg, ${brand}, ${blue})`, color: "#fff", border: "none", boxShadow: `0 0 20px rgba(124,58,237,0.4), 0 4px 15px rgba(0,0,0,0.3)` };
  const btnGreen = { ...btn, background: `linear-gradient(135deg, ${green}, #059669)`, color: "#fff", border: "none", boxShadow: "0 0 15px rgba(16,185,129,0.3)" };
  const btnRed = { ...btn, background: redLight, border: `1px solid rgba(239,68,68,0.3)`, color: red };
  const btnSm = { ...btn, padding: "5px 14px", fontSize: 12 };
  const btnBrandSm = { ...btnSm, background: `linear-gradient(135deg, ${brand}, ${blue})`, color: "#fff", border: "none", boxShadow: `0 0 12px rgba(124,58,237,0.35)` };
  const btnRedSm = { ...btnSm, background: redLight, border: `1px solid rgba(239,68,68,0.3)`, color: red };
  const input = { width: "100%", padding: "10px 14px", border: `1px solid ${border2}`, borderRadius: 10, fontSize: 13, background: surface2, color: textPrimary, fontFamily: "inherit", boxSizing: "border-box", outline: "none", transition: "all 0.2s" };
  const glowCard = { background: `linear-gradient(135deg, ${surface} 0%, ${surface2} 100%)`, border: `1px solid ${border}`, borderRadius: 16, position: "relative", overflow: "hidden", transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)" };

  useEffect(() => { loadEmployees(); loadHistory(); }, []);
  async function loadEmployees() { setLoading(true); const { data, error } = await supabase.from('employees').select('*').order('created_at', { ascending: true }); if (!error && data) setEmployees(data); setLoading(false); }
  async function loadHistory() { const { data, error } = await supabase.from('payroll_runs').select('*').order('created_at', { ascending: false }); if (!error && data) setHistory(data.map((r, i) => ({ ...r, id: i + 1, date: r.run_date, time: r.run_time, count: r.items?.length || 0, items: r.items || [] }))); }

  const allEmployees = [...contractEmployees, ...employees.filter(e => !contractEmployees.find(c => c.addr?.toLowerCase() === e.addr?.toLowerCase()))];
  const filteredEmployees = allEmployees.filter(e => { const ms = !searchQ || e.name.toLowerCase().includes(searchQ) || (e.email || "").toLowerCase().includes(searchQ); return ms && (chainFilter === "All" || e.chain === chainFilter); });
  const pendingApprovals = approvals.filter(a => a.status === "Pending").length;
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";

  function navigateTo(p) { setPage(p); setPageKey(k => k + 1); }
  function triggerConfetti() { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 4000); }
  function connectWallet() { if (openConnectModal) openConnectModal(); }
  function openAddModal() { setEditingEmployee(null); setFormData({ name: "", email: "", addr: "", chain: "ERC20", salary: "" }); setShowAddModal(true); }
  function openEditModal(emp) { setEditingEmployee(emp); setFormData({ name: emp.name, email: emp.email || "", addr: emp.addr, chain: emp.chain, salary: emp.salary || "" }); setShowAddModal(true); }

  async function saveEmployee() {
    if (!formData.name || !formData.addr) return;
    if (!isConnected) { alert("Connect your wallet first."); return; }
    try {
      setTxPending(true);
      const salaryEth = parseFloat(formData.salary) || 0.001;
      const txHash = await writeContractAsync({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'addEmployee', args: [formData.addr, formData.name, parseEther(salaryEth.toString())] });
      await publicClient.waitForTransactionReceipt({ hash: txHash });
      await supabase.from('employees').insert([{ name: formData.name, email: formData.email, addr: formData.addr, chain: formData.chain, salary: salaryEth }]);
      await refetchEmployees(); await loadEmployees(); await refetchPayrollCost();
      setSuccess({ icon: "✓", title: "Employee added!", msg: `${formData.name} added to Base Mainnet payroll.`, bg: greenLight, color: green });
      triggerConfetti();
    } catch (e) { alert("Transaction failed: " + (e.shortMessage || e.message)); }
    finally { setTxPending(false); setShowAddModal(false); }
  }

  async function removeEmployee(contractId, name) {
    if (!isConnected || !isOwner) { alert("Only the contract owner can remove employees."); return; }
    if (!window.confirm(`Remove ${name} from payroll? This cannot be undone.`)) return;
    try {
      setTxPending(true);
      const txHash = await writeContractAsync({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'deactivateEmployee', args: [contractId] });
      await publicClient.waitForTransactionReceipt({ hash: txHash });
      await refetchEmployees(); await refetchPayrollCost();
      setSuccess({ icon: "✓", title: "Employee removed!", msg: `${name} has been deactivated.`, bg: redLight, color: red });
    } catch (e) { alert("Failed: " + (e.shortMessage || e.message)); }
    finally { setTxPending(false); }
  }

  async function depositToTreasury() {
    if (!depositAmount || parseFloat(depositAmount) <= 0) { alert("Enter a valid amount."); return; }
    try {
      setTxPending(true);
      const txHash = await writeContractAsync({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'deposit', value: parseEther(depositAmount) });
      await publicClient.waitForTransactionReceipt({ hash: txHash });
      await refetchTreasury();
      setDepositAmount(""); setShowDepositModal(false);
      setSuccess({ icon: "✓", title: "Deposit successful!", msg: `${depositAmount} ETH added to treasury.`, bg: greenLight, color: green });
    } catch (e) { alert("Deposit failed: " + (e.shortMessage || e.message)); }
    finally { setTxPending(false); }
  }

  async function executePayroll() {
    if (!isConnected || !isOwner) { alert("Only the contract owner can run payroll."); return; }
    if (contractEmployees.length === 0) { alert("No employees yet."); return; }
    if (!enoughFunds) { alert(`Need ${(parseFloat(payrollCost) - parseFloat(treasuryBalance)).toFixed(4)} more ETH.`); return; }
    try {
      setTxPending(true);
      const txHash = await writeContractAsync({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'runPayroll' });
      await publicClient.waitForTransactionReceipt({ hash: txHash });
      const items = contractEmployees.map(e => ({ name: e.name, chain: e.chain, amt: parseFloat(e.salary), token: "ETH", addr: e.addr, email: "" }));
      const total = contractEmployees.reduce((s, e) => s + parseFloat(e.salary), 0);
      await supabase.from('payroll_runs').insert([{ run_date: new Date().toLocaleDateString(), run_time: new Date().toLocaleTimeString(), total, token: "ETH", status: "Success", items }]);
      await loadHistory(); await refetchTreasury(); await refetchEmployees();
      setSuccess({ icon: "✓", title: "Payroll executed! 🚀", msg: `${contractEmployees.length} employee(s) paid ${parseFloat(payrollCost).toFixed(4)} ETH on Base Mainnet!`, bg: greenLight, color: green });
      triggerConfetti();
    } catch (e) { alert("Payroll failed: " + (e.shortMessage || e.message)); }
    finally { setTxPending(false); }
  }

  async function submitForApproval() {
    if (!isConnected) { alert("Connect wallet first."); return; }
    if (contractEmployees.length === 0) { alert("No employees yet."); return; }
    const items = contractEmployees.map(e => ({ name: e.name, chain: e.chain, amt: parseFloat(e.salary), token: "ETH", addr: e.addr, email: "" }));
    const total = contractEmployees.reduce((s, e) => s + parseFloat(e.salary), 0);
    setApprovals([{ id: nextApprovalId, date: new Date().toLocaleDateString(), time: new Date().toLocaleTimeString(), count: items.length, total, token: "ETH", items, status: "Pending", signerStatuses: signers.map(s => ({ ...s, status: "Pending" })) }, ...approvals]);
    setNextApprovalId(nextApprovalId + 1);
    setSuccess({ icon: "⏳", title: "Submitted for approval!", msg: `${total.toFixed(4)} ETH sent to ${signers.length} signer(s).`, bg: amberLight, color: amber });
  }

  async function approveAndExecute() {
    const a = approvals.find(x => x.id === reviewingId); if (!a) return;
    try {
      setTxPending(true);
      const txHash = await writeContractAsync({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'runPayroll' });
      await publicClient.waitForTransactionReceipt({ hash: txHash });
      setApprovals(approvals.map(x => x.id === reviewingId ? { ...x, status: "Approved", signerStatuses: x.signerStatuses.map(s => ({ ...s, status: "Approved" })) } : x));
      await supabase.from('payroll_runs').insert([{ run_date: a.date, run_time: a.time, total: a.total, token: a.token, status: "Approved", items: a.items }]);
      await loadHistory(); await refetchTreasury();
      setShowReviewModal(false); triggerConfetti();
      setSuccess({ icon: "✓", title: "Approved & executed!", msg: "Payroll broadcast on Base Mainnet.", bg: greenLight, color: green });
    } catch (e) { alert("Failed: " + (e.shortMessage || e.message)); }
    finally { setTxPending(false); }
  }

  function rejectApproval() { setApprovals(approvals.map(x => x.id === reviewingId ? { ...x, status: "Rejected", signerStatuses: x.signerStatuses.map(s => ({ ...s, status: "Rejected" })) } : x)); setShowReviewModal(false); }

  async function importCsv() {
    const lines = csvText.trim().split("\n").filter(l => l.trim()); if (lines.length < 2) return;
    const h = lines[0].toLowerCase().split(",").map(x => x.trim());
    const ni = h.indexOf("name"), ei = h.indexOf("email"), wi = h.indexOf("wallet"), ci = h.indexOf("chain"), si = h.indexOf("salary");
    const newEmps = [];
    for (let i = 1; i < lines.length; i++) { const c = lines[i].split(",").map(x => x.trim()); if (c.length < 3) continue; newEmps.push({ name: c[ni] || "Unknown", email: c[ei] || "", addr: c[wi] || "0x...", chain: c[ci] || "ERC20", salary: parseFloat(c[si]) || null }); }
    const { error } = await supabase.from('employees').insert(newEmps); if (!error) await loadEmployees();
    setShowCsvModal(false); setCsvText("");
  }

  function exportCSV() {
    if (history.length === 0) { alert("No history yet."); return; }
    let csv = "Run #,Date,Employee,Wallet,Chain,Amount,Token,Status\n";
    history.forEach(r => { r.items.forEach(i => { csv += `${r.id},"${r.date} ${r.time}","${i.name}","${i.addr}",${i.chain},${i.amt},${i.token},${r.status}\n`; }); });
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "payroll-report.csv"; a.click();
  }

  function exportPDF() {
    if (history.length === 0) { alert("No history yet."); return; }
    let html = `<html><head><title>PayChain Report</title><style>body{font-family:Arial,sans-serif;padding:40px;color:#111;background:#fff;}h1{color:#7c3aed;margin-bottom:4px;font-size:24px;}.sub{color:#666;font-size:13px;margin-bottom:30px;}table{width:100%;border-collapse:collapse;margin-bottom:30px;}th{background:#7c3aed;color:#fff;padding:10px 12px;text-align:left;font-size:12px;}td{padding:10px 12px;border-bottom:1px solid #eee;font-size:13px;}.run-header{background:#f5f3ff;padding:12px 16px;border-left:4px solid #7c3aed;margin-bottom:8px;border-radius:4px;}.total{font-weight:bold;color:#7c3aed;}.amount{color:#059669;font-weight:bold;}</style></head><body><h1>$ PayChain — Payroll Report</h1><div class="sub">Generated: ${new Date().toLocaleString()} | Contract: ${CONTRACT_ADDRESS}</div>`;
    history.forEach(r => { html += `<div class="run-header"><strong>Run #${r.id}</strong> — ${r.date} at ${r.time} | <strong>${r.status}</strong> | Total: <span class="total">${r.total.toFixed(4)} ${r.token}</span></div><table><tr><th>Employee</th><th>Wallet</th><th>Chain</th><th>Amount</th></tr>`; r.items.forEach(i => { html += `<tr><td>${i.name}</td><td style="font-family:monospace;font-size:11px">${i.addr}</td><td>${i.chain}</td><td class="amount">${i.amt.toFixed(4)} ${i.token}</td></tr>`; }); html += `</table>`; });
    html += `<div style="border-top:2px solid #7c3aed;padding-top:16px;font-size:16px;font-weight:bold;color:#7c3aed">Total Disbursed: ${history.reduce((s, r) => s + r.total, 0).toFixed(4)} ETH</div></body></html>`;
    const win = window.open("", "_blank"); win.document.write(html); win.document.close(); win.print();
  }

  const navItems = [
    { id: "wallet", label: "Wallet", icon: "◎" },
    { id: "employees", label: "Employees", icon: "◫" },
    { id: "payout", label: "Run Payroll", icon: "◈" },
    { id: "approvals", label: "Approvals", icon: "◉", badge: pendingApprovals },
    { id: "history", label: "History", icon: "◷", badge: history.length },
  ];

  const modal = { position: "fixed", inset: 0, background: "rgba(3,1,10,0.85)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 };
  const modalBox = { background: `linear-gradient(135deg, ${surface} 0%, ${surface2} 100%)`, borderRadius: 20, padding: 28, width: 420, border: `1px solid ${border2}`, boxShadow: `0 0 60px rgba(124,58,237,0.2), 0 25px 60px rgba(0,0,0,0.7)`, animation: "scaleIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards" };
  const walletOptions = [
    { name: "MetaMask", chain: "EVM chains", logo: <MetaMaskLogo size={38} /> },
    { name: "WalletConnect", chain: "Any wallet", logo: <WalletConnectLogo size={38} /> },
  ];

  return (
    <div style={{ fontFamily: "'Outfit', system-ui, sans-serif", color: textPrimary, fontSize: 14, background: bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, position: "relative" }}>
      <Particles /><Confetti show={showConfetti} />
      <div style={{ display: "flex", width: "100%", maxWidth: 1160, height: 720, border: `1px solid ${border}`, borderRadius: 24, overflow: "hidden", background: surface, boxShadow: `0 0 80px rgba(124,58,237,0.15), 0 0 160px rgba(37,99,235,0.08), 0 40px 80px rgba(0,0,0,0.8)`, position: "relative", zIndex: 1 }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: 24, background: `linear-gradient(135deg, rgba(124,58,237,0.15), transparent, rgba(37,99,235,0.1))`, pointerEvents: "none", zIndex: 0 }} />

        {/* SIDEBAR */}
        <div style={{ width: 230, borderRight: `1px solid ${border}`, background: `linear-gradient(180deg, #06030f 0%, #08041a 100%)`, display: "flex", flexDirection: "column", padding: "20px 0", position: "relative", zIndex: 1 }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 200, background: "radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ padding: "0 20px 20px", borderBottom: `1px solid ${border}`, marginBottom: 12, display: "flex", alignItems: "center", gap: 12 }}>
            <PayChainLogo size={40} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em", background: "linear-gradient(135deg, #a78bfa, #60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>PayChain</div>
              <div style={{ fontSize: 9, color: textMuted, marginTop: 1, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em" }}>Crypto Payroll</div>
            </div>
          </div>
          {navItems.map(item => (
            <div key={item.id} onClick={() => navigateTo(item.id)} style={{ padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontSize: 13, margin: "2px 10px", borderRadius: 12, background: page === item.id ? `linear-gradient(135deg, rgba(124,58,237,0.2), rgba(37,99,235,0.1))` : "transparent", color: page === item.id ? "#a78bfa" : textSecondary, fontWeight: page === item.id ? 700 : 400, border: page === item.id ? `1px solid rgba(124,58,237,0.3)` : "1px solid transparent", transition: "all 0.2s cubic-bezier(0.16,1,0.3,1)", boxShadow: page === item.id ? "0 0 20px rgba(124,58,237,0.15)" : "none" }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: page === item.id ? `linear-gradient(135deg, ${brand}, ${blue})` : surface2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: page === item.id ? "#fff" : textMuted, boxShadow: page === item.id ? `0 0 12px rgba(124,58,237,0.5)` : "none", transition: "all 0.2s", flexShrink: 0 }}>{item.icon}</div>
              {item.label}
              {item.badge > 0 && <span style={{ marginLeft: "auto", background: item.id === "approvals" ? red : brand, color: "#fff", fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 700, boxShadow: `0 0 8px ${item.id === "approvals" ? red : brand}66` }}>{item.badge}</span>}
            </div>
          ))}
          <div style={{ margin: "auto 10px 0", padding: "14px", borderTop: `1px solid ${border}`, borderRadius: 12, background: surface2 }}>
            <div style={{ fontSize: 9, color: textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Contract</div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: brand, wordBreak: "break-all", lineHeight: 1.5 }}>{CONTRACT_ADDRESS.slice(0,10)}...{CONTRACT_ADDRESS.slice(-6)}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
              <div className={isConnected ? "pulse-green" : ""} style={{ width: 7, height: 7, borderRadius: "50%", background: isConnected ? green : border2, flexShrink: 0 }} />
              <div style={{ fontSize: 11, color: isConnected ? green : textMuted, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{isConnected ? shortAddress : "Not connected"}</div>
            </div>
          </div>
        </div>

        {/* MAIN */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0, position: "relative", zIndex: 1 }}>
          <div style={{ padding: "16px 28px", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: `linear-gradient(90deg, ${surface} 0%, rgba(13,9,32,0.8) 100%)`, backdropFilter: "blur(10px)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em", background: "linear-gradient(135deg, #e2d9f3, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{{ wallet: "Treasury Wallet", employees: "Employees", payout: "Run Payroll", approvals: "Approvals", history: "Payroll History" }[page]}</span>
              {page === "employees" && <span style={{ fontSize: 11, color: brand, background: brandLight, padding: "3px 10px", borderRadius: 20, border: `1px solid rgba(124,58,237,0.25)`, fontWeight: 600 }}>{contractEmployees.length} on-chain</span>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {txPending && <span style={{ fontSize: 11, color: amber, background: amberLight, padding: "5px 12px", borderRadius: 20, border: `1px solid rgba(245,158,11,0.25)`, display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}><span style={{ width: 8, height: 8, border: "2px solid rgba(245,158,11,0.3)", borderTop: `2px solid ${amber}`, borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />Broadcasting...</span>}
              {isConnected && isOwner && <span style={{ fontSize: 11, color: "#fbbf24", background: "rgba(251,191,36,0.1)", padding: "5px 12px", borderRadius: 20, border: "1px solid rgba(251,191,36,0.25)", fontWeight: 700 }}>👑 Owner</span>}
              <div onClick={isConnected ? () => disconnect() : connectWallet} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", border: isConnected ? `1px solid rgba(16,185,129,0.3)` : `1px solid ${border2}`, borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: 600, background: isConnected ? "rgba(16,185,129,0.1)" : surface2, color: isConnected ? green : textSecondary, transition: "all 0.2s", boxShadow: isConnected ? "0 0 15px rgba(16,185,129,0.15)" : "none" }}>
                <span className={isConnected ? "pulse-green" : ""} style={{ width: 7, height: 7, borderRadius: "50%", background: isConnected ? green : border2, display: "inline-block" }} />
                {isConnected ? shortAddress : "Connect Wallet"}
              </div>
            </div>
          </div>

          <div key={pageKey} className="page-transition" style={{ flex: 1, overflowY: "auto", padding: 28, background: `radial-gradient(ellipse 80% 60% at 50% -20%, rgba(124,58,237,0.06) 0%, transparent 60%), ${bg}` }}>

            {/* WALLET PAGE */}
            {page === "wallet" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 10 }}>
                <div style={{ position: "relative", marginBottom: 20 }}>
                  <PayChainLogo size={100} />
                  <div style={{ position: "absolute", inset: -20, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)", animation: "logo-pulse 3s ease-in-out infinite", pointerEvents: "none" }} />
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.03em", textAlign: "center", background: "linear-gradient(135deg, #e2d9f3, #a78bfa, #60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 8 }}>On-Chain Payroll</div>
                <div style={{ fontSize: 14, color: textSecondary, marginBottom: 32, textAlign: "center", maxWidth: 340, lineHeight: 1.7 }}>Connect your wallet to manage employees and run payroll on <span style={{ color: brand, fontWeight: 600 }}>Base Mainnet</span></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, width: 440 }}>
                  {walletOptions.map(w => (
                    <div key={w.name} onClick={() => connectWallet()} className="card-hover" style={{ ...glowCard, padding: "22px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 16 }}>
                      <div style={{ width: 54, height: 54, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", background: surface2, border: `1px solid ${border2}`, flexShrink: 0, overflow: "hidden" }}>{w.logo}</div>
                      <div><div style={{ fontSize: 15, fontWeight: 700, color: textPrimary }}>{w.name}</div><div style={{ fontSize: 11, color: textMuted, marginTop: 3 }}>{w.chain}</div></div>
                      {isConnected && <div style={{ marginLeft: "auto", width: 9, height: 9, borderRadius: "50%", background: green, boxShadow: `0 0 10px ${green}` }} />}
                    </div>
                  ))}
                </div>
                {isConnected && (
                  <div style={{ marginTop: 24, padding: "24px", border: `1px solid rgba(124,58,237,0.3)`, borderRadius: 20, width: 440, background: `linear-gradient(135deg, rgba(124,58,237,0.1), rgba(37,99,235,0.05))`, boxShadow: "0 0 40px rgba(124,58,237,0.15)" }}>
                    <div style={{ fontSize: 10, color: brand, marginBottom: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>✓ Connected Wallet</div>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, marginBottom: 16, color: textSecondary, wordBreak: "break-all", lineHeight: 1.6 }}>{address}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
                      {[["Network", "Base Mainnet", textPrimary], ["Treasury", `${parseFloat(treasuryBalance).toFixed(4)} ETH`, green], ["Role", isOwner ? "👑 Owner" : "Viewer", isOwner ? amber : textSecondary]].map(([label, val, color]) => (
                        <div key={label}><div style={{ fontSize: 9, color: textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{label}</div><div style={{ fontSize: 13, fontWeight: 700, color }}>{val}</div></div>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={() => setShowDepositModal(true)} className="btn-hover-glow" style={{ flex: 1, padding: "11px", border: `1px solid rgba(124,58,237,0.4)`, borderRadius: 12, cursor: "pointer", background: brandLight, color: "#a78bfa", fontSize: 13, fontFamily: "inherit", fontWeight: 700 }}>+ Deposit ETH</button>
                      <button onClick={() => disconnect()} style={{ flex: 1, padding: "11px", border: `1px solid rgba(239,68,68,0.3)`, borderRadius: 12, cursor: "pointer", background: redLight, color: red, fontSize: 13, fontFamily: "inherit", fontWeight: 700 }}>Disconnect</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* EMPLOYEES PAGE */}
            {page === "employees" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 }}>
                  {[{ label: "On-Chain Employees", val: contractEmployees.length, color: "#a78bfa", accent: brand }, { label: "Treasury Balance", val: `${parseFloat(treasuryBalance).toFixed(4)} ETH`, color: green, accent: green }, { label: "Monthly Cost", val: `${parseFloat(payrollCost).toFixed(4)} ETH`, color: enoughFunds ? green : red, accent: enoughFunds ? green : red }].map(card => (
                    <div key={card.label} className="card-hover" style={{ ...glowCard, padding: "18px 20px" }}>
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${card.accent}, transparent)`, borderRadius: "16px 16px 0 0" }} />
                      <div style={{ fontSize: 10, color: textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, fontWeight: 600 }}>{card.label}</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: card.color, letterSpacing: "-0.02em" }}>{card.val}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: textMuted, fontSize: 14 }}>🔍</span>
                    <input style={{ ...input, width: 200, paddingLeft: 34 }} placeholder="Search employees..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
                  </div>
                  {["All", "Base Mainnet", ...CHAINS.slice(0, 2)].map(c => <button key={c} onClick={() => setChainFilter(c)} style={{ ...btnSm, borderRadius: 20, background: chainFilter === c ? `linear-gradient(135deg, ${brand}, ${blue})` : surface2, color: chainFilter === c ? "#fff" : textSecondary, border: chainFilter === c ? "none" : `1px solid ${border}`, boxShadow: chainFilter === c ? `0 0 12px rgba(124,58,237,0.4)` : "none" }}>{c}</button>)}
                  <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                    <button style={btnSm} onClick={() => setShowCsvModal(true)}>📂 CSV import</button>
                    <button className="btn-hover-glow" style={btnBrandSm} onClick={openAddModal}>+ Add Employee</button>
                  </div>
                </div>
                {loading ? <div style={{ textAlign: "center", padding: "60px 0", color: textMuted }}><div style={{ width: 32, height: 32, border: `2px solid ${border2}`, borderTop: `2px solid ${brand}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />Loading from blockchain...</div> : (
                  <div style={{ ...glowCard, overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead><tr style={{ background: `linear-gradient(90deg, ${surface2}, rgba(13,9,32,0.5))` }}>{["Name", "Wallet", "Chain", "Salary", "Last Paid", "Actions"].map(h => <th key={h} style={{ fontSize: 10, color: textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", padding: "14px 16px", borderBottom: `1px solid ${border}`, textAlign: "left" }}>{h}</th>)}</tr></thead>
                      <tbody>
                        {filteredEmployees.map((e, idx) => (
                          <tr key={e.id} style={{ borderBottom: idx < filteredEmployees.length - 1 ? `1px solid ${border}` : "none", transition: "background 0.15s" }} onMouseEnter={el => el.currentTarget.style.background = `rgba(124,58,237,0.05)`} onMouseLeave={el => el.currentTarget.style.background = "transparent"}>
                            <td style={{ padding: "14px 16px", fontWeight: 700, color: textPrimary }}>{e.name}{e.isOnChain && <span style={{ marginLeft: 8, fontSize: 10, color: cyan, background: "rgba(6,182,212,0.1)", padding: "2px 7px", borderRadius: 10, border: "1px solid rgba(6,182,212,0.2)", fontWeight: 600 }}>⛓</span>}</td>
                            <td style={{ padding: "14px 16px", fontFamily: "'Space Mono', monospace", fontSize: 10, color: textSecondary }}>{e.addr ? `${e.addr.slice(0,8)}...${e.addr.slice(-6)}` : "—"}</td>
                            <td style={{ padding: "14px 16px" }}><ChainBadge chain={e.chain} /></td>
                            <td style={{ padding: "14px 16px", fontWeight: 700, color: green, fontFamily: "'Space Mono', monospace", fontSize: 13 }}>{e.salary ? `${parseFloat(e.salary).toFixed(4)}` : <span style={{ color: textMuted }}>—</span>} <span style={{ color: textMuted, fontSize: 11 }}>ETH</span></td>
                            <td style={{ padding: "14px 16px", fontSize: 12, color: textMuted }}>{e.lastPaid || "—"}</td>
                            <td style={{ padding: "14px 16px" }}><div style={{ display: "flex", gap: 6 }}><button style={btnSm} onClick={() => openEditModal(e)}>Edit</button>{e.isOnChain && isOwner && <button style={btnRedSm} onClick={() => removeEmployee(e.contractId, e.name)} disabled={txPending}>Remove</button>}</div></td>
                          </tr>
                        ))}
                        {filteredEmployees.length === 0 && <tr><td colSpan={6} style={{ padding: "60px", textAlign: "center", color: textMuted }}><div style={{ fontSize: 32, marginBottom: 12 }}>👥</div>No employees yet.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* PAYOUT PAGE */}
            {page === "payout" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 }}>
                  {[{ label: "Active Employees", val: contractEmployees.length, sub: "on Base Mainnet", color: "#a78bfa", accent: brand }, { label: "Payroll Cost", val: `${parseFloat(payrollCost).toFixed(4)} ETH`, sub: enoughFunds ? "✓ treasury funded" : "⚠ needs top-up", color: enoughFunds ? green : red, accent: enoughFunds ? green : red }, { label: "Treasury Balance", val: `${parseFloat(treasuryBalance).toFixed(4)} ETH`, sub: shortAddress || "Connect wallet", color: "#60a5fa", accent: blue }].map(card => (
                    <div key={card.label} className="card-hover" style={{ ...glowCard, padding: "20px" }}>
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${card.accent}, transparent)` }} />
                      <div style={{ position: "absolute", top: -30, right: -30, width: 100, height: 100, borderRadius: "50%", background: card.accent, opacity: 0.06, filter: "blur(20px)" }} />
                      <div style={{ fontSize: 10, color: textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, fontWeight: 600 }}>{card.label}</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: card.color, marginBottom: 4, letterSpacing: "-0.02em" }}>{card.val}</div>
                      <div style={{ fontSize: 11, color: textMuted }}>{card.sub}</div>
                    </div>
                  ))}
                </div>
                {!enoughFunds && parseFloat(payrollCost) > 0 && <div style={{ background: redLight, border: `1px solid rgba(239,68,68,0.25)`, borderRadius: 14, padding: "14px 18px", marginBottom: 20, fontSize: 13, color: red, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 0 20px rgba(239,68,68,0.1)" }}><span>⚠️ Need <strong>{(parseFloat(payrollCost) - parseFloat(treasuryBalance)).toFixed(4)} more ETH</strong> to run payroll</span><button className="btn-hover-glow" style={{ ...btnSm, background: "rgba(239,68,68,0.15)", color: red, border: `1px solid rgba(239,68,68,0.3)` }} onClick={() => setShowDepositModal(true)}>Deposit ETH →</button></div>}
                <div style={{ ...glowCard, overflow: "hidden", marginBottom: 20 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr style={{ background: `linear-gradient(90deg, ${surface2}, transparent)` }}>{["Employee", "Wallet", "Chain", "Salary", "Last Paid"].map(h => <th key={h} style={{ fontSize: 10, color: textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", padding: "14px 16px", borderBottom: `1px solid ${border}`, textAlign: "left" }}>{h}</th>)}</tr></thead>
                    <tbody>
                      {contractEmployees.map((e, idx) => <tr key={e.id} style={{ borderBottom: idx < contractEmployees.length - 1 ? `1px solid ${border}` : "none" }}><td style={{ padding: "14px 16px", fontWeight: 700, color: textPrimary }}>{e.name}</td><td style={{ padding: "14px 16px", fontFamily: "'Space Mono', monospace", fontSize: 10, color: textSecondary }}>{e.addr ? `${e.addr.slice(0,8)}...${e.addr.slice(-6)}` : "—"}</td><td style={{ padding: "14px 16px" }}><ChainBadge chain={e.chain} /></td><td style={{ padding: "14px 16px", fontWeight: 700, color: green, fontFamily: "'Space Mono', monospace" }}>{parseFloat(e.salary).toFixed(4)} ETH</td><td style={{ padding: "14px 16px", fontSize: 12, color: textMuted }}>{e.lastPaid}</td></tr>)}
                      {contractEmployees.length === 0 && <tr><td colSpan={5} style={{ padding: "40px", textAlign: "center", color: textMuted }}>No on-chain employees yet.</td></tr>}
                    </tbody>
                  </table>
                </div>
                <div style={{ padding: "20px 24px", borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "space-between", background: `linear-gradient(135deg, rgba(124,58,237,0.15), rgba(37,99,235,0.08))`, border: `1px solid rgba(124,58,237,0.25)`, boxShadow: "0 0 30px rgba(124,58,237,0.1)" }}>
                  <div><div style={{ fontSize: 11, color: "#a78bfa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Total to disburse</div><div style={{ fontSize: 30, fontWeight: 900, color: textPrimary, letterSpacing: "-0.03em", fontFamily: "'Space Mono', monospace" }}>{parseFloat(payrollCost).toFixed(4)} <span style={{ fontSize: 16, color: textSecondary }}>ETH</span></div></div>
                  <div style={{ display: "flex", gap: 12 }}>
                    <button style={btn} onClick={submitForApproval}>Submit for approval</button>
                    <button className="btn-hover-glow" style={{ ...btnBrand, padding: "12px 28px", fontSize: 14, fontWeight: 800, opacity: (!isOwner || !enoughFunds || txPending) ? 0.5 : 1 }} onClick={executePayroll} disabled={!isOwner || !enoughFunds || txPending}>{txPending ? "⏳ Broadcasting..." : "🚀 Execute Payroll"}</button>
                  </div>
                </div>
              </div>
            )}

            {/* APPROVALS PAGE */}
            {page === "approvals" && (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}><div style={{ fontSize: 13, color: textSecondary }}>{pendingApprovals} pending · {approvals.length} total</div><button style={btnSm} onClick={() => setShowSignerModal(true)}>⚙️ Manage signers</button></div>
                {approvals.length === 0 && <div style={{ textAlign: "center", padding: "80px 0", color: textMuted }}><div style={{ fontSize: 48, marginBottom: 16 }}>✅</div><div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: textSecondary }}>No pending approvals</div></div>}
                {approvals.map(a => (
                  <div key={a.id} className="card-hover" style={{ ...glowCard, marginBottom: 14, overflow: "hidden" }}>
                    <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", background: `linear-gradient(90deg, ${surface2}, transparent)`, borderBottom: `1px solid ${border}` }}>
                      <div><div style={{ fontWeight: 700, fontSize: 15, color: textPrimary }}>{a.total.toFixed(4)} {a.token} — {a.count} employee(s)</div><div style={{ fontSize: 12, color: textMuted, marginTop: 4 }}>{a.date} at {a.time}</div></div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}><StatusBadge status={a.status} />{a.status === "Pending" && <button className="btn-hover-glow" style={btnBrandSm} onClick={() => { setReviewingId(a.id); setShowReviewModal(true); }}>Review →</button>}</div>
                    </div>
                    <div style={{ padding: "14px 20px" }}>{a.signerStatuses.map(s => <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${border}` }}><div style={{ width: 34, height: 34, borderRadius: "50%", background: brandLight, border: `1px solid rgba(124,58,237,0.25)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#a78bfa" }}>{s.name.split(" ").map(x => x[0]).join("").slice(0, 2)}</div><div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: textPrimary }}>{s.name}</div><div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: textMuted }}>{s.addr}</div></div><StatusBadge status={s.status} /></div>)}</div>
                  </div>
                ))}
              </div>
            )}

            {/* HISTORY PAGE */}
            {page === "history" && (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                  <div><div style={{ fontSize: 13, color: textSecondary }}>{history.length} payroll run(s)</div><div style={{ fontSize: 22, fontWeight: 800, color: green, fontFamily: "'Space Mono', monospace", letterSpacing: "-0.02em" }}>{history.reduce((s, r) => s + r.total, 0).toFixed(4)} <span style={{ fontSize: 14, color: textMuted }}>ETH total</span></div></div>
                  <div style={{ display: "flex", gap: 10 }}><button style={btnSm} onClick={exportCSV}>📊 Export CSV</button><button className="btn-hover-glow" style={btnBrandSm} onClick={exportPDF}>📄 Export PDF</button></div>
                </div>
                {history.length === 0 && <div style={{ textAlign: "center", padding: "80px 0", color: textMuted }}><div style={{ fontSize: 48, marginBottom: 16 }}>📋</div><div style={{ fontSize: 15, fontWeight: 600, color: textSecondary, marginBottom: 8 }}>No payroll runs yet</div></div>}
                {history.map(r => (
                  <div key={r.id} className="card-hover" style={{ ...glowCard, marginBottom: 14, overflow: "hidden" }}>
                    <div onClick={() => setExpandedRun(expandedRun === r.id ? null : r.id)} style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", background: `linear-gradient(90deg, ${surface2}, transparent)`, cursor: "pointer" }}>
                      <div><div style={{ fontWeight: 700, fontSize: 15, color: textPrimary }}>Run #{r.id} — <span style={{ color: green, fontFamily: "'Space Mono', monospace" }}>{r.total.toFixed(4)} {r.token}</span></div><div style={{ fontSize: 12, color: textMuted, marginTop: 4 }}>{r.date} at {r.time} · {r.count} employee(s)</div></div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}><StatusBadge status={r.status} /><span style={{ color: textMuted, fontSize: 16 }}>{expandedRun === r.id ? "▲" : "▼"}</span></div>
                    </div>
                    {expandedRun === r.id && <div style={{ padding: "0 20px 16px", animation: "fadeSlideIn 0.2s ease" }}><table style={{ width: "100%", borderCollapse: "collapse", marginTop: 14 }}><thead><tr>{["Employee", "Wallet", "Chain", "Amount"].map(h => <th key={h} style={{ fontSize: 10, color: textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", padding: "10px 12px", borderBottom: `1px solid ${border}`, textAlign: "left" }}>{h}</th>)}</tr></thead><tbody>{r.items.map((i, idx) => <tr key={idx}><td style={{ padding: "12px", fontWeight: 600, color: textPrimary }}>{i.name}</td><td style={{ padding: "12px", fontFamily: "'Space Mono', monospace", fontSize: 10, color: textSecondary }}>{i.addr}</td><td style={{ padding: "12px" }}><ChainBadge chain={i.chain} /></td><td style={{ padding: "12px", color: green, fontWeight: 700, fontFamily: "'Space Mono', monospace" }}>{i.amt.toFixed(4)} {i.token}</td></tr>)}</tbody></table></div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODALS */}
      {showDepositModal && <div style={modal}><div style={{ ...modalBox, width: 360 }}><div style={{ fontSize: 18, fontWeight: 800, color: textPrimary, marginBottom: 4 }}>💰 Deposit ETH</div><div style={{ fontSize: 13, color: textSecondary, marginBottom: 20 }}>Treasury: <span style={{ color: green, fontWeight: 700 }}>{parseFloat(treasuryBalance).toFixed(4)} ETH</span></div><label style={{ display: "block", fontSize: 11, color: textMuted, marginBottom: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Amount (ETH)</label><input type="number" step="0.001" placeholder="e.g. 0.05" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} style={input} /><div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}><button style={btn} onClick={() => setShowDepositModal(false)}>Cancel</button><button className="btn-hover-glow" style={btnBrand} onClick={depositToTreasury} disabled={txPending}>{txPending ? "⏳ Pending..." : "Deposit"}</button></div></div></div>}
      {showAddModal && <div style={modal}><div style={modalBox}><div style={{ fontSize: 18, fontWeight: 800, color: textPrimary, marginBottom: 4 }}>{editingEmployee ? "✏️ Edit Employee" : "👤 Add Employee"}</div><div style={{ fontSize: 12, color: textSecondary, marginBottom: 24, padding: "8px 12px", background: brandLight, borderRadius: 8, border: `1px solid rgba(124,58,237,0.2)` }}>⛓ Blockchain transaction on Base Mainnet</div>{[["Full name", "name", "text", "Sarah Chen"], ["Email (optional)", "email", "email", "sarah@company.com"], ["Wallet address", "addr", "text", "0x..."], ["Monthly salary (ETH)", "salary", "number", "0.05"]].map(([label, field, type, ph]) => (<div key={field} style={{ marginBottom: 16 }}><label style={{ display: "block", fontSize: 11, color: textMuted, marginBottom: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</label><input type={type} placeholder={ph} value={formData[field]} onChange={e => setFormData({ ...formData, [field]: e.target.value })} style={input} /></div>))}<div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}><button style={btn} onClick={() => setShowAddModal(false)}>Cancel</button><button className="btn-hover-glow" style={btnBrand} onClick={saveEmployee} disabled={txPending}>{txPending ? "⏳ Broadcasting..." : "Add to Blockchain"}</button></div></div></div>}
      {showCsvModal && <div style={modal}><div style={modalBox}><div style={{ fontSize: 18, fontWeight: 800, color: textPrimary, marginBottom: 8 }}>📂 CSV Import</div><div style={{ fontSize: 12, color: textMuted, marginBottom: 16 }}>Columns: <code style={{ background: surface2, padding: "2px 8px", borderRadius: 6, color: "#a78bfa" }}>name, email, wallet, chain, salary</code></div><textarea rows={5} placeholder="Paste CSV data here..." value={csvText} onChange={e => setCsvText(e.target.value)} style={{ ...input, resize: "vertical" }} /><div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}><button style={btn} onClick={() => setShowCsvModal(false)}>Cancel</button><button className="btn-hover-glow" style={btnBrand} onClick={importCsv}>Import</button></div></div></div>}
      {showSignerModal && <div style={modal}><div style={modalBox}><div style={{ fontSize: 18, fontWeight: 800, color: textPrimary, marginBottom: 8 }}>⚙️ Approval Signers</div><div style={{ fontSize: 12, color: textSecondary, marginBottom: 20 }}>Payroll requires sign-off from these addresses.</div>{signers.map(s => (<div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: `1px solid ${border}` }}><div style={{ width: 36, height: 36, borderRadius: "50%", background: brandLight, border: `1px solid rgba(124,58,237,0.25)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#a78bfa" }}>{s.name.split(" ").map(x => x[0]).join("").slice(0, 2)}</div><div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: textPrimary }}>{s.name}</div><div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: textMuted }}>{s.addr}</div></div><button style={btnRedSm} onClick={() => setSigners(signers.filter(x => x.id !== s.id))}>Remove</button></div>))}<div style={{ display: "flex", gap: 8, marginTop: 16 }}><input placeholder="Name" value={newSignerName} onChange={e => setNewSignerName(e.target.value)} style={{ ...input, flex: 1 }} /><input placeholder="0x..." value={newSignerAddr} onChange={e => setNewSignerAddr(e.target.value)} style={{ ...input, flex: 2 }} /><button style={btnBrandSm} onClick={() => { if (!newSignerName || !newSignerAddr) return; setSigners([...signers, { id: nextSignerId, name: newSignerName, addr: newSignerAddr }]); setNextSignerId(nextSignerId + 1); setNewSignerName(""); setNewSignerAddr(""); }}>Add</button></div><div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}><button className="btn-hover-glow" style={btnBrand} onClick={() => setShowSignerModal(false)}>Done</button></div></div></div>}
      {showReviewModal && (() => { const a = approvals.find(x => x.id === reviewingId); if (!a) return null; return <div style={modal}><div style={{ ...modalBox, width: 460 }}><div style={{ fontSize: 18, fontWeight: 800, color: textPrimary, marginBottom: 20 }}>🔍 Review Payroll</div>{[["Date", `${a.date} ${a.time}`], ["Employees", a.count], ["Token", a.token], ["Total", `${a.total.toFixed(4)} ETH`]].map(([label, val]) => <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "10px 0", borderBottom: `1px solid ${border}` }}><span style={{ color: textMuted, fontWeight: 600 }}>{label}</span><span style={{ fontWeight: label === "Total" ? 800 : 600, color: label === "Total" ? green : textPrimary }}>{val}</span></div>)}<div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}><button style={btnRed} onClick={rejectApproval}>Reject</button><button className="btn-hover-glow" style={btnGreen} onClick={approveAndExecute} disabled={txPending}>{txPending ? "⏳ Broadcasting..." : "✓ Approve & Execute"}</button></div></div></div>; })()}
      {success && <div style={{ ...modal, backdropFilter: "blur(16px)" }}><div style={{ ...modalBox, textAlign: "center", width: 380, animation: "scaleIn 0.35s cubic-bezier(0.16,1,0.3,1) forwards" }}><div style={{ width: 72, height: 72, borderRadius: "50%", background: success.bg, border: `1px solid ${success.color}33`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 32, boxShadow: `0 0 50px ${success.color}44`, animation: "success-pop 0.4s ease forwards" }}>{success.icon}</div><div style={{ fontSize: 20, fontWeight: 800, marginBottom: 10, color: success.color }}>{success.title}</div><div style={{ fontSize: 14, color: textSecondary, lineHeight: 1.7 }}>{success.msg}</div><button className="btn-hover-glow" style={{ ...btnBrand, marginTop: 28, width: "100%", padding: "14px", fontSize: 15, fontWeight: 800 }} onClick={() => setSuccess(null)}>Done ✓</button></div></div>}
    </div>
  );
}
