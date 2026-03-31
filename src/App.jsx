import { useState, useEffect, useContext, createContext } from "react";
import { useAccount, useDisconnect, useReadContract, useWriteContract, usePublicClient } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { parseEther, formatEther } from 'viem';
import { supabase } from './supabase';

const CONTRACT_ADDRESS = "0x1E6d93B4641cAFDA9e629b9bbd747aE7261BB786";
const CONTRACT_ABI = [
  { name: "addEmployee", type: "function", stateMutability: "nonpayable", inputs: [{ name: "wallet", type: "address" }, { name: "name", type: "string" }, { name: "salaryWei", type: "uint256" }], outputs: [{ name: "id", type: "uint256" }] },
  { name: "deactivateEmployee", type: "function", stateMutability: "nonpayable", inputs: [{ name: "id", type: "uint256" }], outputs: [] },
  { name: "runPayroll", type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { name: "deposit", type: "function", stateMutability: "payable", inputs: [], outputs: [] },
  { name: "withdraw", type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { name: "getActiveEmployees", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "ids", type: "uint256[]" }, { name: "wallets", type: "address[]" }, { name: "names", type: "string[]" }, { name: "salaries", type: "uint256[]" }, { name: "lastPaidAts", type: "uint256[]" }] },
  { name: "totalPayrollCost", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "total", type: "uint256" }] },
  { name: "treasuryBalance", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "owner", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
];

const CHAINS = ["ERC20", "BEP20", "Polygon", "Arbitrum", "Optimism"];
const ThemeCtx = createContext("dark");

function useIsMobile() {
  const [m, setM] = useState(window.innerWidth < 768);
  useEffect(() => { const h = () => setM(window.innerWidth < 768); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, []);
  return m;
}

// ── Logo ──────────────────────────────────────────────────────────────────
const PayLanLogo = ({ size = "md" }) => {
  const fs = size === "sm" ? 16 : size === "lg" ? 28 : 20;
  return (
    <span style={{ fontSize: fs, fontWeight: 800, background: "linear-gradient(135deg, #7c3aed, #a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.5px", fontFamily: "'Inter', -apple-system, sans-serif", flexShrink: 0 }}>PayLan</span>
  );
};

// ── Wallet Logos ──────────────────────────────────────────────────────────
const MetaMaskLogo = ({ size = 32 }) => (
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

const WalletConnectLogo = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 480 480" xmlns="http://www.w3.org/2000/svg">
    <rect width="480" height="480" rx="100" fill="#3B99FC"/>
    <path d="M126.6 168.9c62.7-61.4 164.4-61.4 227.1 0l7.5 7.4c3.1 3.1 3.1 8 0 11.1l-25.8 25.3c-1.6 1.5-4.1 1.5-5.7 0l-10.4-10.2c-43.7-42.8-114.6-42.8-158.3 0l-11.1 10.9c-1.6 1.5-4.1 1.5-5.7 0l-25.8-25.3c-3.1-3.1-3.1-8 0-11.1l8.2-8.1zm280.5 52.3l22.9 22.5c3.1 3.1 3.1 8 0 11.1L320.7 362.9c-3.1 3.1-8.2 3.1-11.3 0l-83.7-82.1c-.8-.8-2.1-.8-2.8 0l-83.7 82.1c-3.1 3.1-8.2 3.1-11.3 0L18.6 254.8c-3.1-3.1-3.1-8 0-11.1l22.9-22.5c3.1-3.1 8.2-3.1 11.3 0l83.7 82.1c.8.8 2.1.8 2.8 0l83.7-82.1c3.1-3.1 8.2-3.1 11.3 0l83.7 82.1c.8.8 2.1.8 2.8 0l83.7-82.1c3.1-3.1 8.2-3.1 11.3 0z" fill="white"/>
  </svg>
);

const StatusBadge = ({ status }) => {
  const c = { Success: ["#dcfce7","#16a34a"], Pending: ["#fef9c3","#ca8a04"], Approved: ["#dbeafe","#2563eb"], Rejected: ["#fee2e2","#dc2626"] }[status] || ["#f3e8ff","#9333ea"];
  return <span style={{ background: c[0], color: c[1], padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>{status}</span>;
};

const ChainBadge = ({ chain }) => {
  const key = chain.toLowerCase();
  const c = key.includes("base") ? ["#e0f2fe","#0369a1"] : key === "polygon" ? ["#f3e8ff","#9333ea"] : key === "arbitrum" ? ["#dcfce7","#16a34a"] : ["#f1f5f9","#64748b"];
  return <span style={{ background: c[0], color: c[1], padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>{chain}</span>;
};

const Confetti = ({ show }) => {
  if (!show) return null;
  const pieces = Array.from({ length: 40 }, (_, i) => ({ id: i, left: Math.random() * 100, delay: Math.random() * 1.5, duration: Math.random() * 1.5 + 2, size: Math.random() * 8 + 4, color: ['#7c3aed','#a855f7','#22c55e','#3b82f6','#f59e0b'][Math.floor(Math.random() * 5)], animNum: Math.floor(Math.random() * 6) + 1, shape: Math.random() > 0.5 ? '50%' : '2px' }));
  return <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999, overflow: 'hidden' }}>{pieces.map(p => <div key={p.id} style={{ position: 'absolute', left: `${p.left}%`, top: '-10px', width: p.size, height: p.size, background: p.color, borderRadius: p.shape, animation: `confetti-fall-${p.animNum} ${p.duration}s ${p.delay}s ease-in forwards` }} />)}</div>;
};

export default function App() {
  const isMobile = useIsMobile();
  const [theme, setTheme] = useState("dark");
  const isDark = theme === "dark";
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

  // Theme colors
  const c = isDark ? {
    bg: "#0a0a0f", surface: "#111118", surface2: "#16161f", surface3: "#1c1c28",
    border: "rgba(124,58,237,0.12)", border2: "rgba(124,58,237,0.2)",
    text: "#f1f0ff", textSub: "#a09dc0", textMuted: "#5a5770",
    sidebarBg: "#0d0d14", headerBg: "rgba(17,17,24,0.95)",
  } : {
    bg: "#f8f7ff", surface: "#ffffff", surface2: "#f4f3ff", surface3: "#edeaff",
    border: "rgba(124,58,237,0.1)", border2: "rgba(124,58,237,0.2)",
    text: "#0f0a1e", textSub: "#6b6880", textMuted: "#9490a8",
    sidebarBg: "#ffffff", headerBg: "rgba(255,255,255,0.95)",
  };

  const brand = "#7c3aed", brandLight = "#a855f7";
  const green = "#16a34a", greenBg = isDark ? "rgba(22,163,74,0.1)" : "#dcfce7";
  const red = "#dc2626", redBg = isDark ? "rgba(220,38,38,0.1)" : "#fee2e2";
  const amber = "#d97706", amberBg = isDark ? "rgba(217,119,6,0.1)" : "#fef9c3";

  const btn = { padding: "8px 18px", border: `1px solid ${c.border2}`, borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 500, background: c.surface2, color: c.textSub, transition: "all 0.15s", fontFamily: "inherit" };
  const btnBrand = { ...btn, background: `linear-gradient(135deg, ${brand}, ${brandLight})`, color: "#fff", border: "none", boxShadow: "0 4px 16px rgba(124,58,237,0.3)", fontWeight: 600 };
  const btnGreen = { ...btn, background: isDark ? "rgba(22,163,74,0.15)" : "#dcfce7", color: green, border: `1px solid rgba(22,163,74,0.3)`, fontWeight: 600 };
  const btnRed = { ...btn, background: redBg, border: `1px solid rgba(220,38,38,0.3)`, color: red };
  const btnSm = { ...btn, padding: "6px 14px", fontSize: 12 };
  const btnBrandSm = { ...btnSm, background: `linear-gradient(135deg, ${brand}, ${brandLight})`, color: "#fff", border: "none", boxShadow: "0 2px 12px rgba(124,58,237,0.3)", fontWeight: 600 };
  const btnRedSm = { ...btnSm, background: redBg, border: `1px solid rgba(220,38,38,0.3)`, color: red };
  const input = { width: "100%", padding: "11px 14px", border: `1px solid ${c.border2}`, borderRadius: 10, fontSize: 14, background: c.surface2, color: c.text, fontFamily: "inherit", boxSizing: "border-box", outline: "none" };
  const card = { background: c.surface, border: `1px solid ${c.border}`, borderRadius: 16, position: "relative", overflow: "hidden" };
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";
  const pendingApprovals = approvals.filter(a => a.status === "Pending").length;
  const allEmployees = [...contractEmployees, ...employees.filter(e => !contractEmployees.find(c => c.addr?.toLowerCase() === e.addr?.toLowerCase()))];
  const filteredEmployees = allEmployees.filter(e => { const ms = !searchQ || e.name.toLowerCase().includes(searchQ) || (e.email || "").toLowerCase().includes(searchQ); return ms && (chainFilter === "All" || e.chain === chainFilter); });
  const pageTitle = { wallet: "Treasury", employees: "Employees", payout: "Run Payroll", approvals: "Approvals", history: "History" }[page];

  useEffect(() => { loadEmployees(); loadHistory(); }, []);
  async function loadEmployees() { setLoading(true); const { data, error } = await supabase.from('employees').select('*').order('created_at', { ascending: true }); if (!error && data) setEmployees(data); setLoading(false); }
  async function loadHistory() { const { data, error } = await supabase.from('payroll_runs').select('*').order('created_at', { ascending: false }); if (!error && data) setHistory(data.map((r, i) => ({ ...r, id: i + 1, date: r.run_date, time: r.run_time, count: r.items?.length || 0, items: r.items || [] }))); }

  function navigateTo(p) { setPage(p); setPageKey(k => k + 1); }
  function triggerConfetti() { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 3500); }
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
      setSuccess({ icon: "✓", title: "Employee added!", msg: `${formData.name} added to PayLan.`, color: green, bg: greenBg });
      triggerConfetti();
    } catch (e) { alert("Transaction failed: " + (e.shortMessage || e.message)); }
    finally { setTxPending(false); setShowAddModal(false); }
  }

  async function removeEmployee(contractId, name) {
    if (!window.confirm(`Remove ${name}?`)) return;
    try {
      setTxPending(true);
      const txHash = await writeContractAsync({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'deactivateEmployee', args: [contractId] });
      await publicClient.waitForTransactionReceipt({ hash: txHash });
      await refetchEmployees(); await refetchPayrollCost();
      setSuccess({ icon: "✓", title: "Removed", msg: `${name} deactivated.`, color: red, bg: redBg });
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
      setSuccess({ icon: "✓", title: "Deposit successful!", msg: `${depositAmount} ETH added to treasury.`, color: green, bg: greenBg });
    } catch (e) { alert("Deposit failed: " + (e.shortMessage || e.message)); }
    finally { setTxPending(false); }
  }

  async function executePayroll() {
    if (!isConnected || !isOwner) { alert("Only the owner can run payroll."); return; }
    if (contractEmployees.length === 0) { alert("No employees yet."); return; }
    if (!enoughFunds) { alert(`Need ${(parseFloat(payrollCost) - parseFloat(treasuryBalance)).toFixed(4)} more ETH.`); return; }
    try {
      setTxPending(true);
      const txHash = await writeContractAsync({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'runPayroll' });
      await publicClient.waitForTransactionReceipt({ hash: txHash });
      const items = contractEmployees.map(e => ({ name: e.name, chain: e.chain, amt: parseFloat(e.salary), token: "ETH", addr: e.addr }));
      const total = contractEmployees.reduce((s, e) => s + parseFloat(e.salary), 0);
      await supabase.from('payroll_runs').insert([{ run_date: new Date().toLocaleDateString(), run_time: new Date().toLocaleTimeString(), total, token: "ETH", status: "Success", items }]);
      await loadHistory(); await refetchTreasury(); await refetchEmployees();
      setSuccess({ icon: "🚀", title: "Payroll executed!", msg: `${contractEmployees.length} member(s) paid ${parseFloat(payrollCost).toFixed(4)} ETH.`, color: green, bg: greenBg });
      triggerConfetti();
    } catch (e) { alert("Payroll failed: " + (e.shortMessage || e.message)); }
    finally { setTxPending(false); }
  }

  async function submitForApproval() {
    if (!isConnected) { alert("Connect wallet first."); return; }
    if (contractEmployees.length === 0) { alert("No employees yet."); return; }
    const items = contractEmployees.map(e => ({ name: e.name, chain: e.chain, amt: parseFloat(e.salary), token: "ETH", addr: e.addr }));
    const total = contractEmployees.reduce((s, e) => s + parseFloat(e.salary), 0);
    setApprovals([{ id: nextApprovalId, date: new Date().toLocaleDateString(), time: new Date().toLocaleTimeString(), count: items.length, total, token: "ETH", items, status: "Pending", signerStatuses: signers.map(s => ({ ...s, status: "Pending" })) }, ...approvals]);
    setNextApprovalId(nextApprovalId + 1);
    setSuccess({ icon: "⏳", title: "Submitted!", msg: `Awaiting ${signers.length} signer(s).`, color: amber, bg: amberBg });
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
      setSuccess({ icon: "✓", title: "Approved & executed!", msg: "Payroll broadcast on Base.", color: green, bg: greenBg });
    } catch (e) { alert("Failed: " + (e.shortMessage || e.message)); }
    finally { setTxPending(false); }
  }

  function rejectApproval() { setApprovals(approvals.map(x => x.id === reviewingId ? { ...x, status: "Rejected", signerStatuses: x.signerStatuses.map(s => ({ ...s, status: "Rejected" })) } : x)); setShowReviewModal(false); }

  async function importCsv() {
    const lines = csvText.trim().split("\n").filter(l => l.trim()); if (lines.length < 2) return;
    const h = lines[0].toLowerCase().split(",").map(x => x.trim());
    const ni = h.indexOf("name"), ei = h.indexOf("email"), wi = h.indexOf("wallet"), ci = h.indexOf("chain"), si = h.indexOf("salary");
    const newEmps = [];
    for (let i = 1; i < lines.length; i++) { const col = lines[i].split(",").map(x => x.trim()); if (col.length < 3) continue; newEmps.push({ name: col[ni] || "Unknown", email: col[ei] || "", addr: col[wi] || "0x...", chain: col[ci] || "ERC20", salary: parseFloat(col[si]) || null }); }
    const { error } = await supabase.from('employees').insert(newEmps); if (!error) await loadEmployees();
    setShowCsvModal(false); setCsvText("");
  }

  function exportCSV() {
    if (history.length === 0) { alert("No history yet."); return; }
    let csv = "Run #,Date,Employee,Wallet,Chain,Amount,Token,Status\n";
    history.forEach(r => { r.items.forEach(i => { csv += `${r.id},"${r.date} ${r.time}","${i.name}","${i.addr}",${i.chain},${i.amt},${i.token},${r.status}\n`; }); });
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "paylan-report.csv"; a.click();
  }

  function exportPDF() {
    if (history.length === 0) { alert("No history yet."); return; }
    let html = `<html><head><title>PayLan Report</title><style>body{font-family:Inter,sans-serif;padding:40px;color:#111;}h1{color:#7c3aed;font-size:24px;}table{width:100%;border-collapse:collapse;margin-top:20px;}th{background:#7c3aed;color:#fff;padding:10px;text-align:left;font-size:12px;}td{padding:10px;border-bottom:1px solid #eee;font-size:13px;}.amount{color:#16a34a;font-weight:700;}</style></head><body><h1>PayLan — Payroll Report</h1><p style="color:#666;font-size:13px">Generated: ${new Date().toLocaleString()}</p>`;
    history.forEach(r => { html += `<h3>Run #${r.id} — ${r.date} — ${r.total.toFixed(4)} ${r.token} — ${r.status}</h3><table><tr><th>Employee</th><th>Wallet</th><th>Chain</th><th>Amount</th></tr>`; r.items.forEach(i => { html += `<tr><td>${i.name}</td><td style="font-family:monospace;font-size:11px">${i.addr}</td><td>${i.chain}</td><td class="amount">${i.amt.toFixed(4)} ${i.token}</td></tr>`; }); html += `</table>`; });
    html += `</body></html>`;
    const win = window.open("", "_blank"); win.document.write(html); win.document.close(); win.print();
  }

  const navItems = [
    { id: "wallet", label: "Treasury", icon: "◎" },
    { id: "employees", label: "Team", icon: "◫" },
    { id: "payout", label: "Payroll", icon: "◈" },
    { id: "approvals", label: "Approvals", icon: "◉", badge: pendingApprovals },
    { id: "history", label: "History", icon: "◷", badge: history.length },
  ];

  const modal = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", zIndex: 200 };
  const modalBox = { background: c.surface, borderRadius: isMobile ? "20px 20px 0 0" : 16, padding: isMobile ? "24px 20px 40px" : 28, width: isMobile ? "100%" : 440, border: `1px solid ${c.border}`, boxShadow: "0 25px 60px rgba(0,0,0,0.4)", maxHeight: isMobile ? "90vh" : "auto", overflowY: "auto" };

  // ── STAT CARD ──────────────────────────────────────────────────────────
  const StatCard = ({ label, value, sub, color, accent }) => (
    <div style={{ ...card, padding: "20px 22px" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${accent}, transparent)` }} />
      <div style={{ fontSize: 11, color: c.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color, letterSpacing: "-0.02em" }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: c.textMuted, marginTop: 4 }}>{sub}</div>}
    </div>
  );

  // ── EMPLOYEE CARD (mobile) ─────────────────────────────────────────────
  const EmployeeCard = ({ e }) => (
    <div style={{ ...card, padding: 16, marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ fontWeight: 600, color: c.text, fontSize: 15 }}>{e.name}{e.isOnChain && <span style={{ marginLeft: 8, fontSize: 10, color: "#0ea5e9", background: "rgba(14,165,233,0.1)", padding: "2px 7px", borderRadius: 10, fontWeight: 600 }}>on-chain</span>}</div>
          <div style={{ fontSize: 11, color: c.textMuted, fontFamily: "monospace", marginTop: 4 }}>{e.addr ? `${e.addr.slice(0,10)}...${e.addr.slice(-4)}` : "—"}</div>
        </div>
        <div style={{ fontWeight: 700, color: green, fontFamily: "monospace", fontSize: 14 }}>{e.salary ? parseFloat(e.salary).toFixed(4) : "—"} <span style={{ fontSize: 10, color: c.textMuted }}>ETH</span></div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <ChainBadge chain={e.chain} />
          <span style={{ fontSize: 11, color: c.textMuted }}>{e.lastPaid || "—"}</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={btnSm} onClick={() => openEditModal(e)}>Edit</button>
          {e.isOnChain && isOwner && <button style={btnRedSm} onClick={() => removeEmployee(e.contractId, e.name)} disabled={txPending}>Remove</button>}
        </div>
      </div>
    </div>
  );

  // ── MOBILE LAYOUT ──────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <ThemeCtx.Provider value={theme}>
        <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", color: c.text, background: c.bg, minHeight: "100vh" }}>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
          <Confetti show={showConfetti} />

          {/* Header */}
          <div style={{ padding: "12px 16px", background: c.surface, borderBottom: `1px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(10px)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <PayLanLogo size="sm" />
              <span style={{ fontSize: 10, color: c.textMuted, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em" }}>{pageTitle}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button onClick={() => setTheme(isDark ? "light" : "dark")} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${c.border}`, background: "transparent", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>{isDark ? "☀️" : "🌙"}</button>
              {txPending && <span style={{ fontSize: 10, color: amber, background: amberBg, padding: "3px 8px", borderRadius: 20, fontWeight: 600 }}>⏳</span>}
              {isConnected && isOwner && <span style={{ fontSize: 10, color: brand, background: isDark ? "rgba(124,58,237,0.1)" : "#f3e8ff", padding: "3px 8px", borderRadius: 20, fontWeight: 700 }}>Owner</span>}
              <div onClick={isConnected ? () => disconnect() : connectWallet} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 11px", border: isConnected ? `1px solid rgba(22,163,74,0.3)` : `1px solid ${c.border}`, borderRadius: 20, cursor: "pointer", fontSize: 11, fontWeight: 600, background: isConnected ? greenBg : c.surface2, color: isConnected ? green : c.textSub }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: isConnected ? green : c.textMuted, display: "inline-block" }} />
                {isConnected ? shortAddress : "Connect"}
              </div>
            </div>
          </div>

          {/* Content */}
          <div key={pageKey} style={{ flex: 1, overflowY: "auto", padding: 16, paddingBottom: 90 }}>

            {page === "wallet" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 20, gap: 20 }}>
                <div style={{ textAlign: "center" }}>
                  <PayLanLogo size="lg" />
                  <div style={{ fontSize: 12, color: c.textMuted, marginTop: 6, letterSpacing: "0.1em", textTransform: "uppercase" }}>On-Chain Payroll</div>
                </div>
                <p style={{ fontSize: 14, color: c.textSub, textAlign: "center", lineHeight: 1.7, maxWidth: 280 }}>Connect your wallet to manage payroll on <span style={{ color: brand, fontWeight: 600 }}>Base Mainnet</span></p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%" }}>
                  {[{ name: "MetaMask", chain: "EVM chains", logo: <MetaMaskLogo size={32} /> }, { name: "WalletConnect", chain: "Any wallet", logo: <WalletConnectLogo size={32} /> }].map(w => (
                    <div key={w.name} onClick={connectWallet} style={{ ...card, padding: "16px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: c.surface2, flexShrink: 0 }}>{w.logo}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{w.name}</div>
                        <div style={{ fontSize: 10, color: c.textMuted }}>{w.chain}</div>
                      </div>
                      {isConnected && <div style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", background: green }} />}
                    </div>
                  ))}
                </div>
                {isConnected && (
                  <div style={{ width: "100%", padding: 20, borderRadius: 16, background: c.surface, border: `1px solid ${c.border}` }}>
                    <div style={{ fontSize: 10, color: brand, marginBottom: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>✓ Connected</div>
                    <div style={{ fontFamily: "monospace", fontSize: 10, marginBottom: 14, color: c.textSub, wordBreak: "break-all", lineHeight: 1.6 }}>{address}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
                      {[["Network", "Base Mainnet", c.text], ["Treasury", `${parseFloat(treasuryBalance).toFixed(3)} ETH`, green], ["Role", isOwner ? "Owner" : "Viewer", isOwner ? brand : c.textSub]].map(([l, v, col]) => (
                        <div key={l}><div style={{ fontSize: 9, color: c.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{l}</div><div style={{ fontSize: 12, fontWeight: 600, color: col }}>{v}</div></div>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={() => setShowDepositModal(true)} style={{ flex: 1, padding: "11px", border: `1px solid rgba(124,58,237,0.3)`, borderRadius: 10, cursor: "pointer", background: isDark ? "rgba(124,58,237,0.1)" : "#f3e8ff", color: brand, fontSize: 13, fontFamily: "inherit", fontWeight: 600 }}>+ Deposit ETH</button>
                      <button onClick={() => disconnect()} style={{ flex: 1, padding: "11px", border: `1px solid rgba(220,38,38,0.3)`, borderRadius: 10, cursor: "pointer", background: redBg, color: red, fontSize: 13, fontFamily: "inherit", fontWeight: 600 }}>Disconnect</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {page === "employees" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                  <StatCard label="On-Chain" value={contractEmployees.length} color={brand} accent={brand} />
                  <StatCard label="Monthly Cost" value={`${parseFloat(payrollCost).toFixed(3)} ETH`} color={enoughFunds ? green : red} accent={enoughFunds ? green : red} />
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  <input style={{ ...input, flex: 1, padding: "10px 14px", fontSize: 13 }} placeholder="Search team..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
                  <button style={{ ...btnBrandSm, padding: "10px 16px", whiteSpace: "nowrap" }} onClick={openAddModal}>+ Add</button>
                </div>
                {loading ? <div style={{ textAlign: "center", padding: "40px 0", color: c.textMuted }}>Loading...</div>
                  : filteredEmployees.length === 0 ? <div style={{ textAlign: "center", padding: "40px 0", color: c.textMuted }}>No team members yet.</div>
                  : filteredEmployees.map(e => <EmployeeCard key={e.id} e={e} />)}
              </div>
            )}

            {page === "payout" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                  <StatCard label="Team Size" value={contractEmployees.length} sub="on-chain" color={brand} accent={brand} />
                  <StatCard label="Total Cost" value={`${parseFloat(payrollCost).toFixed(4)} ETH`} sub={enoughFunds ? "✓ funded" : "⚠ low"} color={enoughFunds ? green : red} accent={enoughFunds ? green : red} />
                  <StatCard label="Treasury" value={`${parseFloat(treasuryBalance).toFixed(4)} ETH`} sub="balance" color="#3b82f6" accent="#3b82f6" />
                </div>
                {!enoughFunds && parseFloat(payrollCost) > 0 && <div style={{ background: redBg, border: `1px solid rgba(220,38,38,0.25)`, borderRadius: 12, padding: "12px 14px", marginBottom: 14, fontSize: 13, color: red, display: "flex", justifyContent: "space-between", alignItems: "center" }}><span>Need {(parseFloat(payrollCost) - parseFloat(treasuryBalance)).toFixed(4)} more ETH</span><button style={btnRedSm} onClick={() => setShowDepositModal(true)}>Deposit →</button></div>}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                  {contractEmployees.map(e => (
                    <div key={e.id} style={{ ...card, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div><div style={{ fontWeight: 600, color: c.text }}>{e.name}</div><div style={{ fontSize: 11, color: c.textMuted, fontFamily: "monospace" }}>{e.addr?.slice(0,10)}...</div></div>
                      <div style={{ textAlign: "right" }}><div style={{ fontWeight: 700, color: green, fontFamily: "monospace" }}>{parseFloat(e.salary).toFixed(4)} ETH</div><div style={{ fontSize: 10, color: c.textMuted }}>{e.lastPaid}</div></div>
                    </div>
                  ))}
                  {contractEmployees.length === 0 && <div style={{ textAlign: "center", padding: 30, color: c.textMuted }}>No on-chain team members.</div>}
                </div>
                <div style={{ padding: 18, borderRadius: 16, background: isDark ? "rgba(124,58,237,0.08)" : "#f3e8ff", border: `1px solid rgba(124,58,237,0.2)` }}>
                  <div style={{ fontSize: 11, color: brand, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Total to disburse</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: c.text, fontFamily: "monospace", marginBottom: 16 }}>{parseFloat(payrollCost).toFixed(4)} <span style={{ fontSize: 14, color: c.textSub }}>ETH</span></div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <button style={{ ...btn, textAlign: "center", padding: 13 }} onClick={submitForApproval}>Submit for Approval</button>
                    <button style={{ ...btnBrand, textAlign: "center", padding: 14, fontSize: 15, opacity: (!isOwner || !enoughFunds || txPending) ? 0.5 : 1 }} onClick={executePayroll} disabled={!isOwner || !enoughFunds || txPending}>{txPending ? "Broadcasting..." : "🚀 Execute Payroll"}</button>
                  </div>
                </div>
              </div>
            )}

            {page === "approvals" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <span style={{ fontSize: 13, color: c.textSub }}>{pendingApprovals} pending</span>
                  <button style={btnSm} onClick={() => setShowSignerModal(true)}>⚙️ Signers</button>
                </div>
                {approvals.length === 0 && <div style={{ textAlign: "center", padding: "60px 0", color: c.textMuted }}><div style={{ fontSize: 36, marginBottom: 12 }}>✅</div><div style={{ color: c.textSub, fontWeight: 600 }}>No pending approvals</div></div>}
                {approvals.map(a => (
                  <div key={a.id} style={{ ...card, marginBottom: 12, padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div style={{ fontWeight: 600, color: c.text }}>{a.total.toFixed(4)} {a.token}</div>
                      <StatusBadge status={a.status} />
                    </div>
                    <div style={{ fontSize: 12, color: c.textMuted, marginBottom: a.status === "Pending" ? 12 : 0 }}>{a.date} · {a.count} member(s)</div>
                    {a.status === "Pending" && <button style={{ ...btnBrand, width: "100%", textAlign: "center", padding: 10 }} onClick={() => { setReviewingId(a.id); setShowReviewModal(true); }}>Review →</button>}
                  </div>
                ))}
              </div>
            )}

            {page === "history" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, color: c.textSub }}>{history.length} run(s)</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: green, fontFamily: "monospace" }}>{history.reduce((s, r) => s + r.total, 0).toFixed(4)} <span style={{ fontSize: 13, color: c.textMuted }}>ETH</span></div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={btnSm} onClick={exportCSV}>CSV</button>
                    <button style={btnBrandSm} onClick={exportPDF}>PDF</button>
                  </div>
                </div>
                {history.length === 0 && <div style={{ textAlign: "center", padding: "60px 0", color: c.textMuted }}><div style={{ fontSize: 36, marginBottom: 12 }}>📋</div><div style={{ color: c.textSub, fontWeight: 600 }}>No runs yet</div></div>}
                {history.map(r => (
                  <div key={r.id} style={{ ...card, marginBottom: 12 }}>
                    <div onClick={() => setExpandedRun(expandedRun === r.id ? null : r.id)} style={{ padding: "14px 16px", cursor: "pointer" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <div style={{ fontWeight: 600, color: c.text }}>Run #{r.id} — <span style={{ color: green, fontFamily: "monospace" }}>{r.total.toFixed(4)} {r.token}</span></div>
                        <span style={{ color: c.textMuted }}>{expandedRun === r.id ? "▲" : "▼"}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 12, color: c.textMuted }}>{r.date} · {r.count} member(s)</span>
                        <StatusBadge status={r.status} />
                      </div>
                    </div>
                    {expandedRun === r.id && <div style={{ padding: "0 16px 14px" }}>{r.items.map((i, idx) => <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: `1px solid ${c.border}` }}><div><div style={{ fontWeight: 600, color: c.text, fontSize: 13 }}>{i.name}</div><div style={{ fontSize: 10, color: c.textMuted, fontFamily: "monospace" }}>{i.addr?.slice(0,12)}...</div></div><div style={{ color: green, fontWeight: 700, fontFamily: "monospace" }}>{i.amt.toFixed(4)} {i.token}</div></div>)}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Nav */}
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: `${c.surface}f0`, backdropFilter: "blur(20px)", borderTop: `1px solid ${c.border}`, display: "flex", zIndex: 50 }}>
            {navItems.map(item => (
              <button key={item.id} onClick={() => navigateTo(item.id)} style={{ flex: 1, padding: "8px 4px 14px", border: "none", background: "transparent", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, position: "relative", fontFamily: "inherit" }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: page === item.id ? `linear-gradient(135deg, ${brand}, ${brandLight})` : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, color: page === item.id ? "#fff" : c.textMuted, transition: "all 0.2s" }}>{item.icon}</div>
                <span style={{ fontSize: 9, fontWeight: page === item.id ? 700 : 400, color: page === item.id ? brand : c.textMuted }}>{item.label}</span>
                {item.badge > 0 && <div style={{ position: "absolute", top: 4, right: "18%", width: 15, height: 15, borderRadius: "50%", background: item.id === "approvals" ? red : brand, color: "#fff", fontSize: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{item.badge}</div>}
              </button>
            ))}
          </div>

          {/* Mobile Modals */}
          {showDepositModal && <div style={modal}><div style={modalBox}><div style={{ fontSize: 17, fontWeight: 700, color: c.text, marginBottom: 4 }}>Deposit ETH</div><div style={{ fontSize: 13, color: c.textSub, marginBottom: 20 }}>Treasury: <span style={{ color: green, fontWeight: 600 }}>{parseFloat(treasuryBalance).toFixed(4)} ETH</span></div><label style={{ display: "block", fontSize: 11, color: c.textMuted, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Amount (ETH)</label><input type="number" step="0.001" placeholder="0.05" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} style={input} /><div style={{ display: "flex", gap: 10, marginTop: 20 }}><button style={{ ...btn, flex: 1 }} onClick={() => setShowDepositModal(false)}>Cancel</button><button style={{ ...btnBrand, flex: 1, textAlign: "center" }} onClick={depositToTreasury} disabled={txPending}>{txPending ? "..." : "Deposit"}</button></div></div></div>}
          {showAddModal && <div style={modal}><div style={modalBox}><div style={{ fontSize: 17, fontWeight: 700, color: c.text, marginBottom: 4 }}>{editingEmployee ? "Edit Member" : "Add Member"}</div><div style={{ fontSize: 12, color: c.textSub, marginBottom: 20, padding: "8px 12px", background: isDark ? "rgba(124,58,237,0.08)" : "#f3e8ff", borderRadius: 8 }}>Transaction on Base Mainnet</div>{[["Full name", "name", "text", "Sarah Chen"], ["Email (optional)", "email", "email", "sarah@co.com"], ["Wallet address", "addr", "text", "0x..."], ["Salary (ETH/mo)", "salary", "number", "0.05"]].map(([label, field, type, ph]) => (<div key={field} style={{ marginBottom: 14 }}><label style={{ display: "block", fontSize: 11, color: c.textMuted, marginBottom: 5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</label><input type={type} placeholder={ph} value={formData[field]} onChange={e => setFormData({ ...formData, [field]: e.target.value })} style={input} /></div>))}<div style={{ display: "flex", gap: 10, marginTop: 8 }}><button style={{ ...btn, flex: 1 }} onClick={() => setShowAddModal(false)}>Cancel</button><button style={{ ...btnBrand, flex: 1, textAlign: "center" }} onClick={saveEmployee} disabled={txPending}>{txPending ? "..." : "Add"}</button></div></div></div>}
          {showReviewModal && (() => { const a = approvals.find(x => x.id === reviewingId); if (!a) return null; return <div style={modal}><div style={modalBox}><div style={{ fontSize: 17, fontWeight: 700, color: c.text, marginBottom: 20 }}>Review Payroll</div>{[["Date", `${a.date}`], ["Members", a.count], ["Total", `${a.total.toFixed(4)} ETH`]].map(([l, v]) => <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${c.border}` }}><span style={{ color: c.textSub }}>{l}</span><span style={{ fontWeight: 600, color: c.text }}>{v}</span></div>)}<div style={{ display: "flex", gap: 10, marginTop: 20 }}><button style={{ ...btnRed, flex: 1, textAlign: "center" }} onClick={rejectApproval}>Reject</button><button style={{ ...btnGreen, flex: 1, textAlign: "center" }} onClick={approveAndExecute} disabled={txPending}>{txPending ? "..." : "Approve"}</button></div></div></div>; })()}
          {success && <div style={{ ...modal, backdropFilter: "blur(16px)" }}><div style={{ ...modalBox, textAlign: "center", margin: "0 16px", borderRadius: 20 }}><div style={{ width: 60, height: 60, borderRadius: "50%", background: success.bg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 26 }}>{success.icon}</div><div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: success.color }}>{success.title}</div><div style={{ fontSize: 14, color: c.textSub, lineHeight: 1.7 }}>{success.msg}</div><button style={{ ...btnBrand, marginTop: 20, width: "100%", padding: 14, fontSize: 15, textAlign: "center" }} onClick={() => setSuccess(null)}>Done</button></div></div>}
        </div>
      </ThemeCtx.Provider>
    );
  }

  // ── DESKTOP LAYOUT ─────────────────────────────────────────────────────
  return (
    <ThemeCtx.Provider value={theme}>
      <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", color: c.text, background: c.bg, minHeight: "100vh", display: "flex" }}>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <Confetti show={showConfetti} />

        {/* Sidebar */}
        <div style={{ width: 240, background: c.sidebarBg, borderRight: `1px solid ${c.border}`, display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 10 }}>
          <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${c.border}` }}>
            <PayLanLogo size="md" />
            <div style={{ fontSize: 10, color: c.textMuted, marginTop: 4, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em" }}>On-Chain Payroll</div>
          </div>
          <nav style={{ padding: "12px 10px", flex: 1 }}>
            {navItems.map(item => (
              <div key={item.id} onClick={() => navigateTo(item.id)} style={{ padding: "9px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontSize: 13, borderRadius: 10, marginBottom: 2, background: page === item.id ? isDark ? "rgba(124,58,237,0.12)" : "#f3e8ff" : "transparent", color: page === item.id ? brand : c.textSub, fontWeight: page === item.id ? 600 : 400, transition: "all 0.15s", position: "relative" }}>
                <span style={{ fontSize: 14 }}>{item.icon}</span>
                {item.label}
                {item.badge > 0 && <span style={{ marginLeft: "auto", background: item.id === "approvals" ? red : brand, color: "#fff", fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>{item.badge}</span>}
              </div>
            ))}
          </nav>
          <div style={{ padding: "14px 16px", borderTop: `1px solid ${c.border}`, margin: "0 10px 16px" }}>
            <div style={{ fontSize: 9, color: c.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontWeight: 600 }}>Contract</div>
            <div style={{ fontFamily: "monospace", fontSize: 10, color: brand, wordBreak: "break-all", lineHeight: 1.5, marginBottom: 10 }}>{CONTRACT_ADDRESS.slice(0,12)}...{CONTRACT_ADDRESS.slice(-6)}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: isConnected ? green : c.border, flexShrink: 0 }} />
              <div style={{ fontSize: 11, color: isConnected ? green : c.textMuted, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{isConnected ? shortAddress : "Not connected"}</div>
            </div>
          </div>
        </div>

        {/* Main */}
        <div style={{ marginLeft: 240, flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
          {/* Topbar */}
          <div style={{ padding: "0 28px", height: 60, borderBottom: `1px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: c.headerBg, backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 9 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: c.text }}>{{ wallet: "Treasury", employees: "Team Members", payout: "Run Payroll", approvals: "Approvals", history: "Payroll History" }[page]}</span>
              {page === "employees" && <span style={{ fontSize: 11, color: brand, background: isDark ? "rgba(124,58,237,0.1)" : "#f3e8ff", padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>{contractEmployees.length} on-chain</span>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {txPending && <span style={{ fontSize: 11, color: amber, background: amberBg, padding: "5px 12px", borderRadius: 20, fontWeight: 600 }}>Broadcasting...</span>}
              {isConnected && isOwner && <span style={{ fontSize: 11, color: brand, background: isDark ? "rgba(124,58,237,0.1)" : "#f3e8ff", padding: "5px 12px", borderRadius: 20, fontWeight: 700 }}>Owner</span>}
              <button onClick={() => setTheme(isDark ? "light" : "dark")} style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${c.border}`, background: "transparent", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>{isDark ? "☀️" : "🌙"}</button>
              <div onClick={isConnected ? () => disconnect() : connectWallet} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", border: isConnected ? `1px solid rgba(22,163,74,0.3)` : `1px solid ${c.border}`, borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: 500, background: isConnected ? greenBg : c.surface2, color: isConnected ? green : c.textSub }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: isConnected ? green : c.border }} />
                {isConnected ? shortAddress : "Connect Wallet"}
              </div>
            </div>
          </div>

          {/* Page Content */}
          <div key={pageKey} style={{ flex: 1, overflowY: "auto", padding: 28 }}>

            {/* TREASURY PAGE */}
            {page === "wallet" && (
              <div style={{ maxWidth: 560, margin: "60px auto 0", textAlign: "center" }}>
                <PayLanLogo size="lg" />
                <div style={{ fontSize: 12, color: c.textMuted, marginTop: 6, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 32 }}>On-Chain Payroll</div>
                <p style={{ fontSize: 15, color: c.textSub, lineHeight: 1.7, marginBottom: 40 }}>Connect your wallet to manage your team and run payroll on <span style={{ color: brand, fontWeight: 600 }}>Base Mainnet</span></p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 28 }}>
                  {[{ name: "MetaMask", chain: "EVM chains", logo: <MetaMaskLogo size={36} /> }, { name: "WalletConnect", chain: "Any wallet", logo: <WalletConnectLogo size={36} /> }].map(w => (
                    <div key={w.name} onClick={connectWallet} style={{ ...card, padding: "20px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, transition: "all 0.15s" }}>
                      <div style={{ width: 50, height: 50, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: c.surface2, flexShrink: 0 }}>{w.logo}</div>
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: c.text }}>{w.name}</div>
                        <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>{w.chain}</div>
                      </div>
                      {isConnected && <div style={{ marginLeft: "auto", width: 9, height: 9, borderRadius: "50%", background: green }} />}
                    </div>
                  ))}
                </div>
                {isConnected && (
                  <div style={{ ...card, padding: 24, textAlign: "left" }}>
                    <div style={{ fontSize: 10, color: brand, marginBottom: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>✓ Connected Wallet</div>
                    <div style={{ fontFamily: "monospace", fontSize: 11, marginBottom: 16, color: c.textSub, wordBreak: "break-all", lineHeight: 1.6 }}>{address}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
                      {[["Network", "Base Mainnet", c.text], ["Treasury", `${parseFloat(treasuryBalance).toFixed(4)} ETH`, green], ["Role", isOwner ? "Owner" : "Viewer", isOwner ? brand : c.textSub]].map(([l, v, col]) => (
                        <div key={l}><div style={{ fontSize: 9, color: c.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{l}</div><div style={{ fontSize: 13, fontWeight: 600, color: col }}>{v}</div></div>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={() => setShowDepositModal(true)} style={{ flex: 1, padding: 11, border: `1px solid rgba(124,58,237,0.3)`, borderRadius: 10, cursor: "pointer", background: isDark ? "rgba(124,58,237,0.08)" : "#f3e8ff", color: brand, fontSize: 13, fontFamily: "inherit", fontWeight: 600 }}>+ Deposit ETH</button>
                      <button onClick={() => disconnect()} style={{ flex: 1, padding: 11, border: `1px solid rgba(220,38,38,0.3)`, borderRadius: 10, cursor: "pointer", background: redBg, color: red, fontSize: 13, fontFamily: "inherit", fontWeight: 600 }}>Disconnect</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* EMPLOYEES PAGE */}
            {page === "employees" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 }}>
                  <StatCard label="On-Chain Members" value={contractEmployees.length} color={brand} accent={brand} />
                  <StatCard label="Treasury Balance" value={`${parseFloat(treasuryBalance).toFixed(4)} ETH`} color={green} accent={green} />
                  <StatCard label="Monthly Cost" value={`${parseFloat(payrollCost).toFixed(4)} ETH`} color={enoughFunds ? green : red} accent={enoughFunds ? green : red} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                  <input style={{ ...input, width: 220 }} placeholder="Search team..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
                  {["All", "Base Mainnet", ...CHAINS.slice(0, 2)].map(cf => <button key={cf} onClick={() => setChainFilter(cf)} style={{ ...btnSm, borderRadius: 20, background: chainFilter === cf ? `linear-gradient(135deg, ${brand}, ${brandLight})` : c.surface2, color: chainFilter === cf ? "#fff" : c.textSub, border: chainFilter === cf ? "none" : `1px solid ${c.border}` }}>{cf}</button>)}
                  <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                    <button style={btnSm} onClick={() => setShowCsvModal(true)}>Import CSV</button>
                    <button style={btnBrandSm} onClick={openAddModal}>+ Add Member</button>
                  </div>
                </div>
                {loading ? <div style={{ textAlign: "center", padding: "60px 0", color: c.textMuted }}>Loading from blockchain...</div> : (
                  <div style={{ ...card, overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead><tr style={{ background: c.surface2, borderBottom: `1px solid ${c.border}` }}>{["Name", "Wallet", "Chain", "Salary", "Last Paid", "Actions"].map(h => <th key={h} style={{ fontSize: 10, color: c.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", padding: "12px 16px", textAlign: "left" }}>{h}</th>)}</tr></thead>
                      <tbody>
                        {filteredEmployees.map((e, idx) => (
                          <tr key={e.id} style={{ borderBottom: idx < filteredEmployees.length - 1 ? `1px solid ${c.border}` : "none" }} onMouseEnter={el => el.currentTarget.style.background = isDark ? "rgba(124,58,237,0.04)" : "#faf9ff"} onMouseLeave={el => el.currentTarget.style.background = "transparent"}>
                            <td style={{ padding: "13px 16px", fontWeight: 600, color: c.text, fontSize: 14 }}>{e.name}{e.isOnChain && <span style={{ marginLeft: 8, fontSize: 10, color: "#0ea5e9", background: "rgba(14,165,233,0.1)", padding: "2px 7px", borderRadius: 10, fontWeight: 600 }}>on-chain</span>}</td>
                            <td style={{ padding: "13px 16px", fontFamily: "monospace", fontSize: 11, color: c.textSub }}>{e.addr ? `${e.addr.slice(0,8)}...${e.addr.slice(-6)}` : "—"}</td>
                            <td style={{ padding: "13px 16px" }}><ChainBadge chain={e.chain} /></td>
                            <td style={{ padding: "13px 16px", fontWeight: 600, color: green, fontFamily: "monospace", fontSize: 13 }}>{e.salary ? parseFloat(e.salary).toFixed(4) : "—"} <span style={{ color: c.textMuted, fontSize: 11 }}>ETH</span></td>
                            <td style={{ padding: "13px 16px", fontSize: 12, color: c.textMuted }}>{e.lastPaid || "—"}</td>
                            <td style={{ padding: "13px 16px" }}><div style={{ display: "flex", gap: 6 }}><button style={btnSm} onClick={() => openEditModal(e)}>Edit</button>{e.isOnChain && isOwner && <button style={btnRedSm} onClick={() => removeEmployee(e.contractId, e.name)} disabled={txPending}>Remove</button>}</div></td>
                          </tr>
                        ))}
                        {filteredEmployees.length === 0 && <tr><td colSpan={6} style={{ padding: "60px", textAlign: "center", color: c.textMuted }}>No team members yet.</td></tr>}
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
                  <StatCard label="Active Members" value={contractEmployees.length} sub="on Base Mainnet" color={brand} accent={brand} />
                  <StatCard label="Payroll Cost" value={`${parseFloat(payrollCost).toFixed(4)} ETH`} sub={enoughFunds ? "✓ treasury funded" : "⚠ needs top-up"} color={enoughFunds ? green : red} accent={enoughFunds ? green : red} />
                  <StatCard label="Treasury Balance" value={`${parseFloat(treasuryBalance).toFixed(4)} ETH`} sub={shortAddress || "Connect wallet"} color="#3b82f6" accent="#3b82f6" />
                </div>
                {!enoughFunds && parseFloat(payrollCost) > 0 && <div style={{ background: redBg, border: `1px solid rgba(220,38,38,0.25)`, borderRadius: 12, padding: "13px 18px", marginBottom: 20, fontSize: 13, color: red, display: "flex", alignItems: "center", justifyContent: "space-between" }}><span>Need <strong>{(parseFloat(payrollCost) - parseFloat(treasuryBalance)).toFixed(4)} more ETH</strong> to run payroll</span><button style={btnRedSm} onClick={() => setShowDepositModal(true)}>Deposit ETH →</button></div>}
                <div style={{ ...card, overflow: "hidden", marginBottom: 20 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr style={{ background: c.surface2, borderBottom: `1px solid ${c.border}` }}>{["Member", "Wallet", "Chain", "Salary", "Last Paid"].map(h => <th key={h} style={{ fontSize: 10, color: c.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", padding: "12px 16px", textAlign: "left" }}>{h}</th>)}</tr></thead>
                    <tbody>
                      {contractEmployees.map((e, idx) => <tr key={e.id} style={{ borderBottom: idx < contractEmployees.length - 1 ? `1px solid ${c.border}` : "none" }}><td style={{ padding: "13px 16px", fontWeight: 600, color: c.text }}>{e.name}</td><td style={{ padding: "13px 16px", fontFamily: "monospace", fontSize: 11, color: c.textSub }}>{e.addr?.slice(0,8)}...{e.addr?.slice(-6)}</td><td style={{ padding: "13px 16px" }}><ChainBadge chain={e.chain} /></td><td style={{ padding: "13px 16px", fontWeight: 600, color: green, fontFamily: "monospace" }}>{parseFloat(e.salary).toFixed(4)} ETH</td><td style={{ padding: "13px 16px", fontSize: 12, color: c.textMuted }}>{e.lastPaid}</td></tr>)}
                      {contractEmployees.length === 0 && <tr><td colSpan={5} style={{ padding: "40px", textAlign: "center", color: c.textMuted }}>No on-chain members yet.</td></tr>}
                    </tbody>
                  </table>
                </div>
                <div style={{ padding: "20px 24px", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "space-between", background: isDark ? "rgba(124,58,237,0.08)" : "#f3e8ff", border: `1px solid rgba(124,58,237,0.2)` }}>
                  <div>
                    <div style={{ fontSize: 11, color: brand, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Total to disburse</div>
                    <div style={{ fontSize: 30, fontWeight: 700, color: c.text, letterSpacing: "-0.02em", fontFamily: "monospace" }}>{parseFloat(payrollCost).toFixed(4)} <span style={{ fontSize: 16, color: c.textSub }}>ETH</span></div>
                  </div>
                  <div style={{ display: "flex", gap: 12 }}>
                    <button style={btn} onClick={submitForApproval}>Submit for Approval</button>
                    <button style={{ ...btnBrand, padding: "12px 28px", fontSize: 14, opacity: (!isOwner || !enoughFunds || txPending) ? 0.5 : 1 }} onClick={executePayroll} disabled={!isOwner || !enoughFunds || txPending}>{txPending ? "Broadcasting..." : "🚀 Execute Payroll"}</button>
                  </div>
                </div>
              </div>
            )}

            {/* APPROVALS PAGE */}
            {page === "approvals" && (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}><div style={{ fontSize: 13, color: c.textSub }}>{pendingApprovals} pending · {approvals.length} total</div><button style={btnSm} onClick={() => setShowSignerModal(true)}>Manage Signers</button></div>
                {approvals.length === 0 && <div style={{ textAlign: "center", padding: "80px 0", color: c.textMuted }}><div style={{ fontSize: 40, marginBottom: 16 }}>✅</div><div style={{ fontSize: 15, fontWeight: 600, color: c.textSub }}>No pending approvals</div></div>}
                {approvals.map(a => (
                  <div key={a.id} style={{ ...card, marginBottom: 14 }}>
                    <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${c.border}` }}>
                      <div><div style={{ fontWeight: 600, fontSize: 15, color: c.text }}>{a.total.toFixed(4)} {a.token} — {a.count} member(s)</div><div style={{ fontSize: 12, color: c.textMuted, marginTop: 4 }}>{a.date} at {a.time}</div></div>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}><StatusBadge status={a.status} />{a.status === "Pending" && <button style={btnBrandSm} onClick={() => { setReviewingId(a.id); setShowReviewModal(true); }}>Review →</button>}</div>
                    </div>
                    <div style={{ padding: "14px 20px" }}>{a.signerStatuses.map(s => <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${c.border}` }}><div style={{ width: 32, height: 32, borderRadius: "50%", background: isDark ? "rgba(124,58,237,0.1)" : "#f3e8ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: brand }}>{s.name.split(" ").map(x => x[0]).join("").slice(0,2)}</div><div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 500, color: c.text }}>{s.name}</div><div style={{ fontFamily: "monospace", fontSize: 10, color: c.textMuted }}>{s.addr}</div></div><StatusBadge status={s.status} /></div>)}</div>
                  </div>
                ))}
              </div>
            )}

            {/* HISTORY PAGE */}
            {page === "history" && (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                  <div><div style={{ fontSize: 13, color: c.textSub }}>{history.length} payroll run(s)</div><div style={{ fontSize: 24, fontWeight: 700, color: green, fontFamily: "monospace" }}>{history.reduce((s, r) => s + r.total, 0).toFixed(4)} <span style={{ fontSize: 14, color: c.textMuted }}>ETH total</span></div></div>
                  <div style={{ display: "flex", gap: 10 }}><button style={btnSm} onClick={exportCSV}>Export CSV</button><button style={btnBrandSm} onClick={exportPDF}>Export PDF</button></div>
                </div>
                {history.length === 0 && <div style={{ textAlign: "center", padding: "80px 0", color: c.textMuted }}><div style={{ fontSize: 40, marginBottom: 16 }}>📋</div><div style={{ fontSize: 15, fontWeight: 600, color: c.textSub }}>No payroll runs yet</div></div>}
                {history.map(r => (
                  <div key={r.id} style={{ ...card, marginBottom: 14 }}>
                    <div onClick={() => setExpandedRun(expandedRun === r.id ? null : r.id)} style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                      <div><div style={{ fontWeight: 600, fontSize: 15, color: c.text }}>Run #{r.id} — <span style={{ color: green, fontFamily: "monospace" }}>{r.total.toFixed(4)} {r.token}</span></div><div style={{ fontSize: 12, color: c.textMuted, marginTop: 4 }}>{r.date} at {r.time} · {r.count} member(s)</div></div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}><StatusBadge status={r.status} /><span style={{ color: c.textMuted }}>{expandedRun === r.id ? "▲" : "▼"}</span></div>
                    </div>
                    {expandedRun === r.id && <div style={{ padding: "0 20px 16px", borderTop: `1px solid ${c.border}` }}><table style={{ width: "100%", borderCollapse: "collapse", marginTop: 14 }}><thead><tr>{["Member", "Wallet", "Chain", "Amount"].map(h => <th key={h} style={{ fontSize: 10, color: c.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", padding: "10px 12px", borderBottom: `1px solid ${c.border}`, textAlign: "left" }}>{h}</th>)}</tr></thead><tbody>{r.items.map((i, idx) => <tr key={idx}><td style={{ padding: "12px", fontWeight: 500, color: c.text }}>{i.name}</td><td style={{ padding: "12px", fontFamily: "monospace", fontSize: 10, color: c.textSub }}>{i.addr}</td><td style={{ padding: "12px" }}><ChainBadge chain={i.chain} /></td><td style={{ padding: "12px", color: green, fontWeight: 600, fontFamily: "monospace" }}>{i.amt.toFixed(4)} {i.token}</td></tr>)}</tbody></table></div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* DESKTOP MODALS */}
        {showDepositModal && <div style={modal}><div style={modalBox}><div style={{ fontSize: 17, fontWeight: 700, color: c.text, marginBottom: 4 }}>Deposit ETH</div><div style={{ fontSize: 13, color: c.textSub, marginBottom: 20 }}>Treasury: <span style={{ color: green, fontWeight: 600 }}>{parseFloat(treasuryBalance).toFixed(4)} ETH</span></div><label style={{ display: "block", fontSize: 11, color: c.textMuted, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Amount (ETH)</label><input type="number" step="0.001" placeholder="0.05" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} style={input} /><div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}><button style={btn} onClick={() => setShowDepositModal(false)}>Cancel</button><button style={{ ...btnBrand, padding: "9px 22px" }} onClick={depositToTreasury} disabled={txPending}>{txPending ? "Pending..." : "Deposit"}</button></div></div></div>}
        {showAddModal && <div style={modal}><div style={modalBox}><div style={{ fontSize: 17, fontWeight: 700, color: c.text, marginBottom: 4 }}>{editingEmployee ? "Edit Member" : "Add Team Member"}</div><div style={{ fontSize: 12, color: c.textSub, marginBottom: 24, padding: "8px 12px", background: isDark ? "rgba(124,58,237,0.08)" : "#f3e8ff", borderRadius: 8 }}>On-chain transaction · Base Mainnet</div>{[["Full name", "name", "text", "Sarah Chen"], ["Email (optional)", "email", "email", "sarah@company.com"], ["Wallet address", "addr", "text", "0x..."], ["Monthly salary (ETH)", "salary", "number", "0.05"]].map(([label, field, type, ph]) => (<div key={field} style={{ marginBottom: 16 }}><label style={{ display: "block", fontSize: 11, color: c.textMuted, marginBottom: 5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</label><input type={type} placeholder={ph} value={formData[field]} onChange={e => setFormData({ ...formData, [field]: e.target.value })} style={input} /></div>))}<div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}><button style={btn} onClick={() => setShowAddModal(false)}>Cancel</button><button style={{ ...btnBrand, padding: "9px 22px" }} onClick={saveEmployee} disabled={txPending}>{txPending ? "Broadcasting..." : "Add to Blockchain"}</button></div></div></div>}
        {showCsvModal && <div style={modal}><div style={modalBox}><div style={{ fontSize: 17, fontWeight: 700, color: c.text, marginBottom: 8 }}>Import CSV</div><div style={{ fontSize: 12, color: c.textMuted, marginBottom: 16 }}>Columns: <code style={{ background: c.surface2, padding: "2px 8px", borderRadius: 6, color: brand }}>name, email, wallet, chain, salary</code></div><textarea rows={5} placeholder="Paste CSV data here..." value={csvText} onChange={e => setCsvText(e.target.value)} style={{ ...input, resize: "vertical" }} /><div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}><button style={btn} onClick={() => setShowCsvModal(false)}>Cancel</button><button style={{ ...btnBrand, padding: "9px 22px" }} onClick={importCsv}>Import</button></div></div></div>}
        {showSignerModal && <div style={modal}><div style={{ ...modalBox, width: 460 }}><div style={{ fontSize: 17, fontWeight: 700, color: c.text, marginBottom: 8 }}>Approval Signers</div><div style={{ fontSize: 12, color: c.textSub, marginBottom: 20 }}>Payroll requires sign-off from these addresses.</div>{signers.map(s => (<div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: `1px solid ${c.border}` }}><div style={{ width: 34, height: 34, borderRadius: "50%", background: isDark ? "rgba(124,58,237,0.1)" : "#f3e8ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: brand }}>{s.name.split(" ").map(x => x[0]).join("").slice(0,2)}</div><div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 500, color: c.text }}>{s.name}</div><div style={{ fontFamily: "monospace", fontSize: 10, color: c.textMuted }}>{s.addr}</div></div><button style={btnRedSm} onClick={() => setSigners(signers.filter(x => x.id !== s.id))}>Remove</button></div>))}<div style={{ display: "flex", gap: 8, marginTop: 16 }}><input placeholder="Name" value={newSignerName} onChange={e => setNewSignerName(e.target.value)} style={{ ...input, flex: 1 }} /><input placeholder="0x..." value={newSignerAddr} onChange={e => setNewSignerAddr(e.target.value)} style={{ ...input, flex: 2 }} /><button style={btnBrandSm} onClick={() => { if (!newSignerName || !newSignerAddr) return; setSigners([...signers, { id: nextSignerId, name: newSignerName, addr: newSignerAddr }]); setNextSignerId(nextSignerId + 1); setNewSignerName(""); setNewSignerAddr(""); }}>Add</button></div><div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}><button style={{ ...btnBrand, padding: "9px 22px" }} onClick={() => setShowSignerModal(false)}>Done</button></div></div></div>}
        {showReviewModal && (() => { const a = approvals.find(x => x.id === reviewingId); if (!a) return null; return <div style={modal}><div style={{ ...modalBox, width: 460 }}><div style={{ fontSize: 17, fontWeight: 700, color: c.text, marginBottom: 20 }}>Review Payroll</div>{[["Date", `${a.date} ${a.time}`], ["Members", a.count], ["Token", a.token], ["Total", `${a.total.toFixed(4)} ETH`]].map(([label, val]) => <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "10px 0", borderBottom: `1px solid ${c.border}` }}><span style={{ color: c.textSub }}>{label}</span><span style={{ fontWeight: label === "Total" ? 700 : 500, color: c.text }}>{val}</span></div>)}<div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}><button style={{ ...btnRed, padding: "9px 20px" }} onClick={rejectApproval}>Reject</button><button style={{ ...btnGreen, padding: "9px 20px" }} onClick={approveAndExecute} disabled={txPending}>{txPending ? "Broadcasting..." : "✓ Approve & Execute"}</button></div></div></div>; })()}
        {success && <div style={{ ...modal, backdropFilter: "blur(16px)" }}><div style={{ ...modalBox, textAlign: "center", width: 380 }}><div style={{ width: 64, height: 64, borderRadius: "50%", background: success.bg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 }}>{success.icon}</div><div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: success.color }}>{success.title}</div><div style={{ fontSize: 14, color: c.textSub, lineHeight: 1.7 }}>{success.msg}</div><button style={{ ...btnBrand, marginTop: 24, width: "100%", padding: 14, fontSize: 15, textAlign: "center" }} onClick={() => setSuccess(null)}>Done</button></div></div>}
      </div>
    </ThemeCtx.Provider>
  );
}
