import { useState, useEffect } from "react";
import { useAccount, useDisconnect, useReadContract, useWriteContract, usePublicClient } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { parseEther, formatEther } from 'viem';
import { supabase } from './supabase';

const CONTRACT_ADDRESS = "0x55271b6f111178A9e53413995eaef2867dea8E02";
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

const chainClass = (c) => c.toLowerCase().replace(/\s/g, "");

const ChainBadge = ({ chain }) => {
  const colors = {
    erc20: { bg: "#1D3461", color: "#60A5FA" },
    bep20: { bg: "#2D1F06", color: "#F59E0B" },
    polygon: { bg: "#2D1F6E", color: "#A78BFA" },
    arbitrum: { bg: "#063D33", color: "#10B981" },
    optimism: { bg: "#3D0614", color: "#F87171" },
    "base sepolia": { bg: "#063D33", color: "#10B981" },
  };
  const s = colors[chainClass(chain)] || { bg: "#1E1E2E", color: "#9999BB" };
  return (
    <span style={{ background: s.bg, color: s.color, padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600, border: `1px solid ${s.color}22` }}>
      {chain}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const colors = {
    Success: { bg: "#063D1F", color: "#10B981", border: "#10B98133" },
    Pending: { bg: "#2D1F06", color: "#F59E0B", border: "#F59E0B33" },
    Approved: { bg: "#0D1F3D", color: "#3B82F6", border: "#3B82F633" },
    Rejected: { bg: "#3D0614", color: "#EF4444", border: "#EF444433" },
  };
  const s = colors[status] || { bg: "#1E1E2E", color: "#9999BB", border: "#9999BB33" };
  return (
    <span style={{ background: s.bg, color: s.color, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, border: `1px solid ${s.border}` }}>
      {status}
    </span>
  );
};

const Particles = () => {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i, size: Math.random() * 4 + 1, left: Math.random() * 100, top: Math.random() * 100,
    delay: Math.random() * 4, duration: Math.random() * 4 + 4, animNum: Math.floor(Math.random() * 3) + 1,
    color: ['#7C5CFC', '#10B981', '#3B82F6', '#F59E0B'][Math.floor(Math.random() * 4)],
  }));
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {particles.map(p => (
        <div key={p.id} style={{ position: 'absolute', left: `${p.left}%`, top: `${p.top}%`, width: p.size, height: p.size, borderRadius: '50%', background: p.color, opacity: 0.3, animation: `float${p.animNum} ${p.duration}s ${p.delay}s ease-in-out infinite`, boxShadow: `0 0 ${p.size * 2}px ${p.color}` }} />
      ))}
    </div>
  );
};

const Confetti = ({ show }) => {
  if (!show) return null;
  const pieces = Array.from({ length: 40 }, (_, i) => ({
    id: i, left: Math.random() * 100, delay: Math.random() * 1.5, duration: Math.random() * 1.5 + 2,
    size: Math.random() * 8 + 4, color: ['#7C5CFC', '#10B981', '#F59E0B', '#3B82F6', '#EF4444', '#EC4899', '#F97316'][Math.floor(Math.random() * 7)],
    animNum: Math.floor(Math.random() * 6) + 1, shape: Math.random() > 0.5 ? '50%' : '0%',
  }));
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999, overflow: 'hidden' }}>
      {pieces.map(p => (
        <div key={p.id} style={{ position: 'absolute', left: `${p.left}%`, top: '-10px', width: p.size, height: p.size, background: p.color, borderRadius: p.shape, animation: `confetti-fall-${p.animNum} ${p.duration}s ${p.delay}s ease-in forwards`, boxShadow: `0 0 6px ${p.color}88` }} />
      ))}
    </div>
  );
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
  const [signers, setSigners] = useState([
    { id: 1, name: "CFO — Diana Park", addr: "0xCFO1...1234" },
    { id: 2, name: "CEO — James Wu", addr: "0xCEO2...5678" },
  ]);
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
  const [exportPreview, setExportPreview] = useState(null);

  const { writeContractAsync } = useWriteContract();

  const { data: treasuryData, refetch: refetchTreasury } = useReadContract({
    address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'treasuryBalance',
  });
  const { data: payrollCostData, refetch: refetchPayrollCost } = useReadContract({
    address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'totalPayrollCost',
  });
  const { data: ownerData } = useReadContract({
    address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'owner',
  });
  const { data: activeEmployeesData, refetch: refetchEmployees } = useReadContract({
    address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'getActiveEmployees',
  });

  const treasuryBalance = treasuryData ? formatEther(treasuryData) : "0";
  const payrollCost = payrollCostData ? formatEther(payrollCostData) : "0";
  const isOwner = ownerData && address ? ownerData.toLowerCase() === address.toLowerCase() : false;
  const enoughFunds = parseFloat(treasuryBalance) >= parseFloat(payrollCost) && parseFloat(payrollCost) > 0;

  useEffect(() => {
    if (activeEmployeesData) {
      const [ids, wallets, names, salaries, lastPaids] = activeEmployeesData;
      const emps = ids.map((id, i) => ({
        id: id.toString(), contractId: id, name: names[i], addr: wallets[i],
        salary: formatEther(salaries[i]),
        lastPaid: lastPaids[i].toString() === '0' ? 'Never' : new Date(Number(lastPaids[i]) * 1000).toLocaleDateString(),
        chain: "Base Sepolia", email: "", isOnChain: true,
      }));
      setContractEmployees(emps);
    }
  }, [activeEmployeesData]);

  const bg = "#0A0A0F", surface = "#13131A", surface2 = "#1A1A28", border = "#1E1E2E", border2 = "#2A2A3E";
  const brand = "#7C5CFC", brandDark = "#5C3FE0", brandLight = "#2D1F6E";
  const green = "#10B981", greenLight = "#063D1F", amber = "#F59E0B", amberLight = "#2D1F06";
  const red = "#EF4444", redLight = "#3D0614", blue = "#3B82F6", blueLight = "#0D1F3D";
  const textPrimary = "#E2E2FF", textSecondary = "#9999BB", textMuted = "#6B6B8A";

  const btn = { padding: "8px 16px", border: `1px solid ${border2}`, borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 500, background: surface2, color: textSecondary, transition: "all 0.2s", fontFamily: "inherit" };
  const btnBrand = { ...btn, background: `linear-gradient(135deg, ${brand}, ${brandDark})`, color: "#fff", border: "none", boxShadow: `0 0 20px ${brand}44` };
  const btnGreen = { ...btn, background: `linear-gradient(135deg, ${green}, #059669)`, color: "#fff", border: "none" };
  const btnRed = { ...btn, background: redLight, border: `1px solid ${red}44`, color: red };
  const btnSm = { ...btn, padding: "5px 12px", fontSize: 12 };
  const btnBrandSm = { ...btnSm, background: `linear-gradient(135deg, ${brand}, ${brandDark})`, color: "#fff", border: "none", boxShadow: `0 0 12px ${brand}44` };
  const btnRedSm = { ...btnSm, background: redLight, border: `1px solid ${red}44`, color: red };
  const input = { width: "100%", padding: "9px 12px", border: `1px solid ${border}`, borderRadius: 8, fontSize: 13, background: surface2, color: textPrimary, fontFamily: "inherit", boxSizing: "border-box", outline: "none", transition: "border-color 0.15s" };

  useEffect(() => { loadEmployees(); loadHistory(); }, []);

  async function loadEmployees() {
    setLoading(true);
    const { data, error } = await supabase.from('employees').select('*').order('created_at', { ascending: true });
    if (!error && data) setEmployees(data);
    setLoading(false);
  }

  async function loadHistory() {
    const { data, error } = await supabase.from('payroll_runs').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setHistory(data.map((r, i) => ({ ...r, id: i + 1, date: r.run_date, time: r.run_time, count: r.items?.length || 0, items: r.items || [] })));
    }
  }

  const allEmployees = [
    ...contractEmployees,
    ...employees.filter(e => !contractEmployees.find(c => c.addr?.toLowerCase() === e.addr?.toLowerCase())),
  ];

  const filteredEmployees = allEmployees.filter((e) => {
    const ms = !searchQ || e.name.toLowerCase().includes(searchQ) || (e.email || "").toLowerCase().includes(searchQ);
    const mc = chainFilter === "All" || e.chain === chainFilter;
    return ms && mc;
  });

  const pendingApprovals = approvals.filter((a) => a.status === "Pending").length;
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";

  function navigateTo(newPage) { setPage(newPage); setPageKey(k => k + 1); }
  function triggerConfetti() { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 4000); }
  function connectWallet() { if (openConnectModal) openConnectModal(); }

  function openAddModal() {
    setEditingEmployee(null);
    setFormData({ name: "", email: "", addr: "", chain: "ERC20", salary: "" });
    setShowAddModal(true);
  }

  function openEditModal(emp) {
    setEditingEmployee(emp);
    setFormData({ name: emp.name, email: emp.email || "", addr: emp.addr, chain: emp.chain, salary: emp.salary || "" });
    setShowAddModal(true);
  }

  async function saveEmployee() {
    if (!formData.name || !formData.addr) return;
    if (!isConnected) { alert("Connect your wallet first."); return; }
    try {
      setTxPending(true);
      const salaryEth = parseFloat(formData.salary) || 0.001;
      const salaryWei = parseEther(salaryEth.toString());
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'addEmployee',
        args: [formData.addr, formData.name, salaryWei],
      });
      await publicClient.waitForTransactionReceipt({ hash: txHash });
      await supabase.from('employees').insert([{ name: formData.name, email: formData.email, addr: formData.addr, chain: formData.chain, salary: salaryEth }]);
      await refetchEmployees();
      await loadEmployees();
      await refetchPayrollCost();
      setSuccess({ icon: "✓", title: "Employee added!", msg: `${formData.name} has been added to the blockchain payroll.`, bg: greenLight, color: green });
      triggerConfetti();
    } catch (e) {
      alert("Transaction failed: " + (e.shortMessage || e.message));
    } finally {
      setTxPending(false);
      setShowAddModal(false);
    }
  }

  async function removeEmployee(contractId, name) {
    if (!isConnected) { alert("Connect your wallet first."); return; }
    if (!isOwner) { alert("Only the contract owner can remove employees."); return; }
    if (!window.confirm(`Remove ${name} from payroll? This cannot be undone.`)) return;
    try {
      setTxPending(true);
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESS, abi: CONTRACT_ABI,
        functionName: 'deactivateEmployee',
        args: [contractId],
      });
      await publicClient.waitForTransactionReceipt({ hash: txHash });
      await refetchEmployees();
      await refetchPayrollCost();
      setSuccess({ icon: "✓", title: "Employee removed!", msg: `${name} has been deactivated from the blockchain payroll.`, bg: redLight, color: red });
    } catch (e) {
      alert("Failed: " + (e.shortMessage || e.message));
    } finally {
      setTxPending(false);
    }
  }

  async function depositToTreasury() {
    if (!depositAmount || parseFloat(depositAmount) <= 0) { alert("Enter a valid amount."); return; }
    try {
      setTxPending(true);
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'deposit',
        value: parseEther(depositAmount),
      });
      await publicClient.waitForTransactionReceipt({ hash: txHash });
      await refetchTreasury();
      setDepositAmount("");
      setShowDepositModal(false);
      setSuccess({ icon: "✓", title: "Deposit successful!", msg: `${depositAmount} ETH added to treasury.`, bg: greenLight, color: green });
    } catch (e) {
      alert("Deposit failed: " + (e.shortMessage || e.message));
    } finally {
      setTxPending(false);
    }
  }

  async function executePayroll() {
    if (!isConnected) { alert("Connect your treasury wallet first."); return; }
    if (!isOwner) { alert("Only the contract owner can run payroll."); return; }
    if (contractEmployees.length === 0) { alert("No employees on the contract yet."); return; }
    if (!enoughFunds) { alert(`Treasury needs ${(parseFloat(payrollCost) - parseFloat(treasuryBalance)).toFixed(4)} more ETH.`); return; }
    try {
      setTxPending(true);
      const txHash = await writeContractAsync({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'runPayroll' });
      await publicClient.waitForTransactionReceipt({ hash: txHash });
      const items = contractEmployees.map(e => ({ name: e.name, chain: e.chain, amt: parseFloat(e.salary), token: "ETH", addr: e.addr, email: "" }));
      const total = contractEmployees.reduce((s, e) => s + parseFloat(e.salary), 0);
      await supabase.from('payroll_runs').insert([{ run_date: new Date().toLocaleDateString(), run_time: new Date().toLocaleTimeString(), total, token: "ETH", status: "Success", items }]);
      await loadHistory();
      await refetchTreasury();
      await refetchEmployees();
      setSuccess({ icon: "✓", title: "Payroll executed on-chain! 🎉", msg: `${contractEmployees.length} employee(s) paid ${parseFloat(payrollCost).toFixed(4)} ETH. Confirmed on Base Sepolia!`, bg: greenLight, color: green });
      triggerConfetti();
    } catch (e) {
      alert("Payroll failed: " + (e.shortMessage || e.message));
    } finally {
      setTxPending(false);
    }
  }

  async function submitForApproval() {
    if (!isConnected) { alert("Connect your treasury wallet first."); return; }
    if (contractEmployees.length === 0) { alert("No employees yet."); return; }
    const items = contractEmployees.map(e => ({ name: e.name, chain: e.chain, amt: parseFloat(e.salary), token: "ETH", addr: e.addr, email: "" }));
    const total = contractEmployees.reduce((s, e) => s + parseFloat(e.salary), 0);
    const req = { id: nextApprovalId, date: new Date().toLocaleDateString(), time: new Date().toLocaleTimeString(), count: items.length, total, token: "ETH", items, status: "Pending", signerStatuses: signers.map((s) => ({ ...s, status: "Pending" })) };
    setApprovals([req, ...approvals]);
    setNextApprovalId(nextApprovalId + 1);
    setSuccess({ icon: "⏳", title: "Submitted for approval!", msg: `${total.toFixed(4)} ETH sent to ${signers.length} signer(s) for review.`, bg: amberLight, color: amber });
  }

  async function approveAndExecute() {
    const a = approvals.find((x) => x.id === reviewingId);
    if (!a) return;
    try {
      setTxPending(true);
      const txHash = await writeContractAsync({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'runPayroll' });
      await publicClient.waitForTransactionReceipt({ hash: txHash });
      setApprovals(approvals.map((x) => x.id === reviewingId ? { ...x, status: "Approved", signerStatuses: x.signerStatuses.map((s) => ({ ...s, status: "Approved" })) } : x));
      await supabase.from('payroll_runs').insert([{ run_date: a.date, run_time: a.time, total: a.total, token: a.token, status: "Approved", items: a.items }]);
      await loadHistory();
      await refetchTreasury();
      setShowReviewModal(false);
      triggerConfetti();
      setSuccess({ icon: "✓", title: "Approved & executed on-chain!", msg: `Payroll broadcast on Base Sepolia.`, bg: greenLight, color: green });
    } catch (e) {
      alert("Failed: " + (e.shortMessage || e.message));
    } finally {
      setTxPending(false);
    }
  }

  function rejectApproval() {
    setApprovals(approvals.map((x) => x.id === reviewingId ? { ...x, status: "Rejected", signerStatuses: x.signerStatuses.map((s) => ({ ...s, status: "Rejected" })) } : x));
    setShowReviewModal(false);
  }

  async function importCsv() {
    const lines = csvText.trim().split("\n").filter((l) => l.trim());
    if (lines.length < 2) return;
    const h = lines[0].toLowerCase().split(",").map((x) => x.trim());
    const ni = h.indexOf("name"), ei = h.indexOf("email"), wi = h.indexOf("wallet"), ci = h.indexOf("chain"), si = h.indexOf("salary");
    const newEmps = [];
    for (let i = 1; i < lines.length; i++) {
      const c = lines[i].split(",").map((x) => x.trim());
      if (c.length < 3) continue;
      newEmps.push({ name: c[ni] || "Unknown", email: c[ei] || "", addr: c[wi] || "0x...", chain: c[ci] || "ERC20", salary: parseFloat(c[si]) || null });
    }
    const { error } = await supabase.from('employees').insert(newEmps);
    if (!error) await loadEmployees();
    setShowCsvModal(false);
    setCsvText("");
  }

  function exportCSV() {
    if (history.length === 0) { alert("No history yet."); return; }
    let csv = "Run #,Date,Employee,Wallet,Chain,Amount,Token,Status\n";
    history.forEach((r) => { r.items.forEach((i) => { csv += `${r.id},"${r.date} ${r.time}","${i.name}","${i.addr}",${i.chain},${i.amt},${i.token},${r.status}\n`; }); });
    setExportPreview({ title: "Export CSV", content: csv, filename: "payroll-report.csv", type: "text/csv" });
  }

  function exportPDF() {
    if (history.length === 0) { alert("No history yet."); return; }
    let c = "PAYCHAIN — PAYROLL REPORT\nGenerated: " + new Date().toLocaleString() + "\n" + "=".repeat(46) + "\n\n";
    history.forEach((r) => {
      c += `Run #${r.id} | ${r.date} | ${r.status}\nTotal: ${r.total.toFixed(4)} ${r.token} | ${r.count} employee(s)\n` + "-".repeat(46) + "\n";
      r.items.forEach((i) => { c += `  ${i.name.padEnd(20)} ${i.chain.padEnd(10)} ${i.amt.toFixed(4)} ${i.token}\n`; });
      c += "\n";
    });
    c += "=".repeat(46) + "\nTOTAL DISBURSED: " + history.reduce((s, r) => s + r.total, 0).toFixed(4) + " ETH";
    setExportPreview({ title: "Export PDF", content: c, filename: "payroll-report.txt", type: "text/plain" });
  }

  function downloadFile(content, filename, type) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([content], { type }));
    a.download = filename;
    a.click();
  }

  const navItems = [
    { id: "wallet", label: "Wallet", icon: "◎" },
    { id: "employees", label: "Employees", icon: "◫" },
    { id: "payout", label: "Run Payroll", icon: "◈" },
    { id: "approvals", label: "Approvals", icon: "◉", badge: pendingApprovals },
    { id: "history", label: "History", icon: "◷", badge: history.length },
  ];

  const modal = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 };
  const modalBox = { background: surface, borderRadius: 16, padding: 24, width: 400, border: `1px solid ${border}`, boxShadow: `0 0 60px rgba(0,0,0,0.6)`, animation: "scaleIn 0.25s ease forwards" };

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: textPrimary, fontSize: 14, background: bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, position: "relative" }}>
      <Particles />
      <Confetti show={showConfetti} />
      <div style={{ display: "flex", width: "100%", maxWidth: 1100, height: 700, border: `1px solid ${border}`, borderRadius: 20, overflow: "hidden", background: surface, boxShadow: "0 8px 60px rgba(0,0,0,0.6)", position: "relative", zIndex: 1 }}>

        {/* Sidebar */}
        <div style={{ width: 220, borderRight: `1px solid ${border}`, background: "#0D0D14", display: "flex", flexDirection: "column", padding: "16px 0" }}>
          <div style={{ padding: "0 16px 16px", borderBottom: `1px solid ${border}`, marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
            <div className="pulse-brand" style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg, ${brand}, ${brandDark})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 18 }}>⬡</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: textPrimary, letterSpacing: "-0.01em" }}>PayChain</div>
              <div style={{ fontSize: 10, color: textMuted, marginTop: 1, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>Crypto Payroll</div>
            </div>
          </div>
          {navItems.map((item) => (
            <div key={item.id} onClick={() => navigateTo(item.id)}
              style={{ padding: "9px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontSize: 13, margin: "2px 8px", borderRadius: 10, background: page === item.id ? `linear-gradient(135deg, ${brand}22, ${brandDark}11)` : "transparent", color: page === item.id ? brand : textSecondary, fontWeight: page === item.id ? 600 : 400, border: page === item.id ? `1px solid ${brand}33` : "1px solid transparent", transition: "all 0.2s" }}>
              <div style={{ width: 24, height: 24, borderRadius: 7, background: page === item.id ? `linear-gradient(135deg, ${brand}, ${brandDark})` : surface2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: page === item.id ? "#fff" : textMuted, boxShadow: page === item.id ? `0 0 10px ${brand}66` : "none", transition: "all 0.2s" }}>{item.icon}</div>
              {item.label}
              {item.badge > 0 && <span style={{ marginLeft: "auto", background: item.id === "approvals" ? red : brand, color: "#fff", fontSize: 10, padding: "1px 7px", borderRadius: 20, fontWeight: 600 }}>{item.badge}</span>}
            </div>
          ))}
          <div style={{ marginTop: "auto", padding: "12px 16px", borderTop: `1px solid ${border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div className={isConnected ? "pulse-green" : ""} style={{ width: 8, height: 8, borderRadius: "50%", background: isConnected ? green : border2 }}></div>
              <div style={{ fontSize: 11, color: isConnected ? green : textMuted, fontWeight: 500 }}>{isConnected ? shortAddress : "Not connected"}</div>
            </div>
          </div>
        </div>

        {/* Main */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
          <div style={{ padding: "14px 24px", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: surface }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: textPrimary, letterSpacing: "-0.01em" }}>{{ wallet: "Wallet connect", employees: "Employees", payout: "Run payroll", approvals: "Approvals", history: "History" }[page]}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {txPending && <span style={{ fontSize: 11, color: amber, background: amberLight, padding: "4px 10px", borderRadius: 20, border: `1px solid ${amber}44` }}>⏳ Tx pending...</span>}
              {isConnected && isOwner && <span style={{ fontSize: 11, color: brand, background: brandLight, padding: "4px 10px", borderRadius: 20, border: `1px solid ${brand}44` }}>👑 Owner</span>}
              <div onClick={isConnected ? () => disconnect() : connectWallet}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", border: isConnected ? `1px solid ${green}44` : `1px solid ${border2}`, borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: 500, background: isConnected ? `${green}11` : surface2, color: isConnected ? green : textSecondary, transition: "all 0.2s" }}>
                <span className={isConnected ? "pulse-green" : ""} style={{ width: 7, height: 7, borderRadius: "50%", background: isConnected ? green : border2, display: "inline-block" }}></span>
                {isConnected ? shortAddress : "Connect wallet"}
              </div>
            </div>
          </div>

          <div key={pageKey} className="fade-slide-in" style={{ flex: 1, overflowY: "auto", padding: 24, background: bg }}>

            {/* WALLET PAGE */}
            {page === "wallet" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 8 }}>
                <div className="pulse-brand" style={{ width: 60, height: 60, borderRadius: 18, background: `linear-gradient(135deg, ${brand}, ${brandDark})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, marginBottom: 12 }}>⬡</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: textPrimary, letterSpacing: "-0.02em", marginBottom: 6 }}>Connect treasury wallet</div>
                <div style={{ fontSize: 13, color: textSecondary, marginBottom: 28, textAlign: "center", maxWidth: 320, lineHeight: 1.6 }}>Connect the wallet that deployed the PayChain contract on Base Sepolia</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: 380 }}>
                  {[{ name: "MetaMask", icon: "🦊", chain: "EVM chains" }, { name: "Rabby", icon: "🐰", chain: "EVM chains" }, { name: "Phantom", icon: "👻", chain: "Solana + EVM" }, { name: "WalletConnect", icon: "🔗", chain: "Any wallet" }].map((w) => (
                    <div key={w.name} onClick={() => connectWallet()} className="card-hover"
                      style={{ padding: "16px", border: `1px solid ${isConnected ? brand + "44" : border}`, borderRadius: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, background: isConnected ? `${brand}11` : surface }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, background: surface2 }}>{w.icon}</div>
                      <div><div style={{ fontSize: 13, fontWeight: 600, color: textPrimary }}>{w.name}</div><div style={{ fontSize: 11, color: textMuted }}>{w.chain}</div></div>
                    </div>
                  ))}
                </div>
                {isConnected && (
                  <div style={{ marginTop: 24, padding: "18px 20px", border: `1px solid ${brand}44`, borderRadius: 16, width: 380, background: `linear-gradient(135deg, ${brandLight}66, ${bg})`, boxShadow: `0 0 30px ${brand}22` }}>
                    <div style={{ fontSize: 11, color: brand, marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Connected wallet</div>
                    <div style={{ fontFamily: "monospace", fontSize: 12, marginBottom: 14, color: textSecondary, wordBreak: "break-all" }}>{address}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
                      <div><div style={{ fontSize: 10, color: textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Network</div><div style={{ fontSize: 13, fontWeight: 700, color: textPrimary }}>Base Sepolia</div></div>
                      <div><div style={{ fontSize: 10, color: textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Treasury</div><div style={{ fontSize: 13, fontWeight: 700, color: green }}>{parseFloat(treasuryBalance).toFixed(4)} ETH</div></div>
                      <div><div style={{ fontSize: 10, color: textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Role</div><div style={{ fontSize: 13, fontWeight: 700, color: isOwner ? amber : textSecondary }}>{isOwner ? "👑 Owner" : "Viewer"}</div></div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setShowDepositModal(true)} style={{ flex: 1, padding: "10px", border: `1px solid ${brand}44`, borderRadius: 10, cursor: "pointer", background: `${brand}22`, color: brand, fontSize: 13, fontFamily: "inherit", fontWeight: 600 }}>+ Deposit ETH</button>
                      <button onClick={() => disconnect()} style={{ flex: 1, padding: "10px", border: `1px solid ${red}44`, borderRadius: 10, cursor: "pointer", background: redLight, color: red, fontSize: 13, fontFamily: "inherit", fontWeight: 600 }}>Disconnect</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* EMPLOYEES PAGE */}
            {page === "employees" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
                  {[
                    { label: "On-chain employees", val: contractEmployees.length, color: brand },
                    { label: "Treasury balance", val: `${parseFloat(treasuryBalance).toFixed(4)} ETH`, color: green },
                    { label: "Monthly payroll cost", val: `${parseFloat(payrollCost).toFixed(4)} ETH`, color: enoughFunds ? green : red },
                  ].map(card => (
                    <div key={card.label} style={{ background: surface, border: `1px solid ${border}`, borderRadius: 12, padding: "14px 16px" }}>
                      <div style={{ fontSize: 10, color: textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{card.label}</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: card.color }}>{card.val}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                  <input style={{ ...input, width: 180 }} placeholder="Search employees..." value={searchQ} onChange={(e) => setSearchQ(e.target.value)} />
                  {["All", "Base Sepolia", ...CHAINS.slice(0, 2)].map((c) => (
                    <button key={c} onClick={() => setChainFilter(c)}
                      style={{ ...btnSm, borderRadius: 20, background: chainFilter === c ? brand : surface2, color: chainFilter === c ? "#fff" : textSecondary, border: chainFilter === c ? "none" : `1px solid ${border}`, boxShadow: chainFilter === c ? `0 0 10px ${brand}44` : "none" }}>{c}</button>
                  ))}
                  <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                    <button style={btnSm} onClick={() => setShowCsvModal(true)}>CSV import</button>
                    <button className="btn-hover-glow" style={btnBrandSm} onClick={openAddModal}>+ Add employee</button>
                  </div>
                </div>
                {loading ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: textMuted }}>Loading employees...</div>
                ) : (
                  <div style={{ background: surface, borderRadius: 12, border: `1px solid ${border}`, overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: surface2 }}>
                          {["Name", "Wallet", "Chain", "Salary (ETH)", "Last Paid", "Actions"].map((h) => (
                            <th key={h} style={{ fontSize: 11, color: textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", padding: "12px 14px", borderBottom: `1px solid ${border}`, textAlign: "left" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEmployees.map((e, idx) => (
                          <tr key={e.id} style={{ borderBottom: idx < filteredEmployees.length - 1 ? `1px solid ${border}` : "none", transition: "background 0.15s" }}
                            onMouseEnter={el => el.currentTarget.style.background = surface2}
                            onMouseLeave={el => el.currentTarget.style.background = "transparent"}>
                            <td style={{ padding: "12px 14px", fontWeight: 600, color: textPrimary }}>
                              {e.name}
                              {e.isOnChain && <span style={{ marginLeft: 6, fontSize: 10, color: green, background: greenLight, padding: "2px 6px", borderRadius: 10, border: `1px solid ${green}33` }}>⛓ on-chain</span>}
                            </td>
                            <td style={{ padding: "12px 14px", fontFamily: "monospace", fontSize: 11, color: textMuted }}>{e.addr ? `${e.addr.slice(0,6)}...${e.addr.slice(-4)}` : "—"}</td>
                            <td style={{ padding: "12px 14px" }}><ChainBadge chain={e.chain} /></td>
                            <td style={{ padding: "12px 14px", fontWeight: 600, color: green }}>{e.salary ? `${parseFloat(e.salary).toFixed(4)} ETH` : <span style={{ color: textMuted }}>—</span>}</td>
                            <td style={{ padding: "12px 14px", fontSize: 12, color: textMuted }}>{e.lastPaid || "—"}</td>
                            <td style={{ padding: "12px 14px" }}>
                              <div style={{ display: "flex", gap: 6 }}>
                                <button style={btnSm} onClick={() => openEditModal(e)}>Edit</button>
                                {e.isOnChain && isOwner && (
                                  <button style={btnRedSm} onClick={() => removeEmployee(e.contractId, e.name)} disabled={txPending}>
                                    Remove
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredEmployees.length === 0 && (
                          <tr><td colSpan={6} style={{ padding: "40px", textAlign: "center", color: textMuted }}>No employees yet. Add your first employee!</td></tr>
                        )}
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
                  {[
                    { label: "Active employees", val: contractEmployees.length, sub: "on Base Sepolia", color: brand, light: brandLight, glow: brand },
                    { label: "Payroll cost", val: `${parseFloat(payrollCost).toFixed(4)} ETH`, sub: enoughFunds ? "✓ funded" : "⚠ insufficient", color: enoughFunds ? green : red, light: enoughFunds ? greenLight : redLight, glow: enoughFunds ? green : red },
                    { label: "Treasury", val: `${parseFloat(treasuryBalance).toFixed(4)} ETH`, sub: isConnected ? shortAddress : "Connect wallet", color: blue, light: blueLight, glow: blue },
                  ].map((card) => (
                    <div key={card.label} className="card-hover" style={{ background: `linear-gradient(135deg, ${card.light}, ${bg})`, borderRadius: 14, padding: "16px 18px", border: `1px solid ${card.color}44`, position: "relative", overflow: "hidden" }}>
                      <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: card.glow, opacity: 0.15, filter: "blur(20px)" }}></div>
                      <div style={{ fontSize: 11, color: card.color, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{card.label}</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: textPrimary }}>{card.val}</div>
                      <div style={{ fontSize: 11, color: textMuted, marginTop: 2 }}>{card.sub}</div>
                    </div>
                  ))}
                </div>
                {!enoughFunds && parseFloat(payrollCost) > 0 && (
                  <div style={{ background: redLight, border: `1px solid ${red}44`, borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: red, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>⚠️ Treasury needs {(parseFloat(payrollCost) - parseFloat(treasuryBalance)).toFixed(4)} more ETH</span>
                    <button style={{ ...btnSm, background: `${red}22`, color: red, border: `1px solid ${red}44` }} onClick={() => setShowDepositModal(true)}>Deposit ETH →</button>
                  </div>
                )}
                <div style={{ background: surface, borderRadius: 12, border: `1px solid ${border}`, overflow: "hidden", marginBottom: 16 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: surface2 }}>
                        {["Employee", "Wallet", "Chain", "Salary", "Last Paid"].map((h) => <th key={h} style={{ fontSize: 11, color: textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", padding: "12px 14px", borderBottom: `1px solid ${border}`, textAlign: "left" }}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {contractEmployees.map((e, idx) => (
                        <tr key={e.id} style={{ borderBottom: idx < contractEmployees.length - 1 ? `1px solid ${border}` : "none" }}>
                          <td style={{ padding: "12px 14px", fontWeight: 600, color: textPrimary }}>{e.name}</td>
                          <td style={{ padding: "12px 14px", fontFamily: "monospace", fontSize: 11, color: textMuted }}>{e.addr ? `${e.addr.slice(0,6)}...${e.addr.slice(-4)}` : "—"}</td>
                          <td style={{ padding: "12px 14px" }}><ChainBadge chain={e.chain} /></td>
                          <td style={{ padding: "12px 14px", fontWeight: 600, color: green }}>{parseFloat(e.salary).toFixed(4)} ETH</td>
                          <td style={{ padding: "12px 14px", fontSize: 12, color: textMuted }}>{e.lastPaid}</td>
                        </tr>
                      ))}
                      {contractEmployees.length === 0 && (
                        <tr><td colSpan={5} style={{ padding: "40px", textAlign: "center", color: textMuted }}>No on-chain employees yet. Add employees first!</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div style={{ padding: "16px 20px", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "space-between", background: `linear-gradient(135deg, ${brandLight}, ${bg})`, border: `1px solid ${brand}44` }}>
                  <div>
                    <div style={{ fontSize: 11, color: brand, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Total to disburse</div>
                    <div style={{ fontSize: 26, fontWeight: 700, color: textPrimary }}>{parseFloat(payrollCost).toFixed(4)} ETH</div>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button style={btn} onClick={submitForApproval}>Submit for approval</button>
                    <button className="btn-hover-glow" style={{ ...btnBrand, opacity: (!isOwner || !enoughFunds || txPending) ? 0.5 : 1 }} onClick={executePayroll} disabled={!isOwner || !enoughFunds || txPending}>
                      {txPending ? "⏳ Processing..." : "Execute payroll →"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* APPROVALS PAGE */}
            {page === "approvals" && (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <div style={{ fontSize: 13, color: textSecondary }}>{pendingApprovals} pending · {approvals.length} total</div>
                  <button style={btnSm} onClick={() => setShowSignerModal(true)}>Manage signers</button>
                </div>
                {approvals.length === 0 && <div style={{ color: textMuted, fontSize: 13, textAlign: "center", padding: "60px 0" }}>No approval requests yet.</div>}
                {approvals.map((a) => (
                  <div key={a.id} className="card-hover" style={{ border: `1px solid ${border}`, borderRadius: 14, marginBottom: 12, overflow: "hidden", background: surface }}>
                    <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", background: surface2 }}>
                      <div><div style={{ fontWeight: 600, fontSize: 14, color: textPrimary }}>{a.total.toFixed(4)} {a.token} — {a.count} employee(s)</div><div style={{ fontSize: 12, color: textMuted, marginTop: 4 }}>{a.date} at {a.time}</div></div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <StatusBadge status={a.status} />
                        {a.status === "Pending" && <button className="btn-hover-glow" style={btnBrandSm} onClick={() => { setReviewingId(a.id); setShowReviewModal(true); }}>Review →</button>}
                      </div>
                    </div>
                    <div style={{ padding: "14px 18px" }}>
                      {a.signerStatuses.map((s) => (
                        <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${border}` }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${brand}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: brand }}>{s.name.split(" ").map((x) => x[0]).join("").slice(0, 2)}</div>
                          <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: textPrimary }}>{s.name}</div><div style={{ fontFamily: "monospace", fontSize: 11, color: textMuted }}>{s.addr}</div></div>
                          <StatusBadge status={s.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* HISTORY PAGE */}
            {page === "history" && (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <div style={{ fontSize: 13, color: textSecondary }}>{history.length} run(s) · {history.reduce((s, r) => s + r.total, 0).toFixed(4)} ETH total disbursed</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={btnSm} onClick={exportCSV}>Export CSV</button>
                    <button className="btn-hover-glow" style={btnBrandSm} onClick={exportPDF}>Export PDF</button>
                  </div>
                </div>
                {history.length === 0 && <div style={{ color: textMuted, fontSize: 13, textAlign: "center", padding: "60px 0" }}>No payroll runs yet.</div>}
                {history.map((r) => (
                  <div key={r.id} className="card-hover" style={{ border: `1px solid ${border}`, borderRadius: 14, marginBottom: 12, overflow: "hidden", background: surface }}>
                    <div onClick={() => setExpandedRun(expandedRun === r.id ? null : r.id)}
                      style={{ padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", background: surface2, cursor: "pointer" }}>
                      <div><div style={{ fontWeight: 600, fontSize: 14, color: textPrimary }}>Run #{r.id} — <span style={{ color: green }}>{r.total.toFixed(4)} {r.token}</span></div><div style={{ fontSize: 12, color: textMuted, marginTop: 4 }}>{r.date} at {r.time} · {r.count} employee(s)</div></div>
                      <StatusBadge status={r.status} />
                    </div>
                    {expandedRun === r.id && (
                      <div style={{ padding: "0 18px 14px" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
                          <thead><tr>{["Name", "Wallet", "Chain", "Amount"].map((h) => <th key={h} style={{ fontSize: 11, color: textMuted, fontWeight: 600, textTransform: "uppercase", padding: "8px 10px", borderBottom: `1px solid ${border}`, textAlign: "left" }}>{h}</th>)}</tr></thead>
                          <tbody>{r.items.map((i, idx) => (
                            <tr key={idx}>
                              <td style={{ padding: "10px", fontWeight: 600, color: textPrimary }}>{i.name}</td>
                              <td style={{ padding: "10px", fontFamily: "monospace", fontSize: 11, color: textMuted }}>{i.addr}</td>
                              <td style={{ padding: "10px" }}><ChainBadge chain={i.chain} /></td>
                              <td style={{ padding: "10px", color: green, fontWeight: 600 }}>{i.amt.toFixed(4)} {i.token}</td>
                            </tr>
                          ))}</tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DEPOSIT MODAL */}
      {showDepositModal && (
        <div style={modal}>
          <div style={{ ...modalBox, width: 360 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: textPrimary, marginBottom: 8 }}>Deposit ETH to Treasury</div>
            <div style={{ fontSize: 12, color: textMuted, marginBottom: 16 }}>Current balance: <span style={{ color: green }}>{parseFloat(treasuryBalance).toFixed(4)} ETH</span></div>
            <label style={{ display: "block", fontSize: 12, color: textMuted, marginBottom: 6 }}>Amount (ETH)</label>
            <input type="number" step="0.001" placeholder="e.g. 0.05" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} style={input} />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <button style={btn} onClick={() => setShowDepositModal(false)}>Cancel</button>
              <button className="btn-hover-glow" style={btnBrand} onClick={depositToTreasury} disabled={txPending}>{txPending ? "⏳ Pending..." : "Deposit"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD EMPLOYEE MODAL */}
      {showAddModal && (
        <div style={modal}>
          <div style={modalBox}>
            <div style={{ fontSize: 16, fontWeight: 700, color: textPrimary, marginBottom: 4 }}>{editingEmployee ? "Edit employee" : "Add employee"}</div>
            <div style={{ fontSize: 12, color: textMuted, marginBottom: 20 }}>This will create a blockchain transaction on Base Sepolia</div>
            {[["Full name", "name", "text", "Sarah Chen"], ["Email (optional)", "email", "email", "sarah@company.com"], ["Wallet address", "addr", "text", "0x..."], ["Monthly salary (ETH)", "salary", "number", "0.05"]].map(([label, field, type, ph]) => (
              <div key={field} style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, color: textMuted, marginBottom: 6, fontWeight: 500 }}>{label}</label>
                <input type={type} placeholder={ph} value={formData[field]} onChange={(e) => setFormData({ ...formData, [field]: e.target.value })} style={input} />
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <button style={btn} onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn-hover-glow" style={btnBrand} onClick={saveEmployee} disabled={txPending}>{txPending ? "⏳ Pending..." : "Add to blockchain"}</button>
            </div>
          </div>
        </div>
      )}

      {/* CSV MODAL */}
      {showCsvModal && (
        <div style={modal}>
          <div style={modalBox}>
            <div style={{ fontSize: 16, fontWeight: 700, color: textPrimary, marginBottom: 8 }}>CSV import</div>
            <div style={{ fontSize: 12, color: textMuted, marginBottom: 14 }}>Columns: <code style={{ background: surface2, padding: "2px 6px", borderRadius: 4, color: brand }}>name, email, wallet, chain, salary</code></div>
            <textarea rows={4} placeholder="Paste CSV data here..." value={csvText} onChange={(e) => setCsvText(e.target.value)} style={{ ...input, resize: "vertical" }} />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <button style={btn} onClick={() => setShowCsvModal(false)}>Cancel</button>
              <button className="btn-hover-glow" style={btnBrand} onClick={importCsv}>Import</button>
            </div>
          </div>
        </div>
      )}

      {/* SIGNERS MODAL */}
      {showSignerModal && (
        <div style={modal}>
          <div style={modalBox}>
            <div style={{ fontSize: 16, fontWeight: 700, color: textPrimary, marginBottom: 8 }}>Approval signers</div>
            <div style={{ fontSize: 12, color: textMuted, marginBottom: 16 }}>Payroll submitted for approval requires sign-off from these addresses.</div>
            {signers.map((s) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${border}` }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${brand}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: brand }}>{s.name.split(" ").map((x) => x[0]).join("").slice(0, 2)}</div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: textPrimary }}>{s.name}</div><div style={{ fontFamily: "monospace", fontSize: 11, color: textMuted }}>{s.addr}</div></div>
                <button style={btnRedSm} onClick={() => setSigners(signers.filter((x) => x.id !== s.id))}>Remove</button>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <input placeholder="Name" value={newSignerName} onChange={(e) => setNewSignerName(e.target.value)} style={{ ...input, flex: 1 }} />
              <input placeholder="0x... or email" value={newSignerAddr} onChange={(e) => setNewSignerAddr(e.target.value)} style={{ ...input, flex: 2 }} />
              <button style={btnBrandSm} onClick={() => { if (!newSignerName || !newSignerAddr) return; setSigners([...signers, { id: nextSignerId, name: newSignerName, addr: newSignerAddr }]); setNextSignerId(nextSignerId + 1); setNewSignerName(""); setNewSignerAddr(""); }}>Add</button>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <button className="btn-hover-glow" style={btnBrand} onClick={() => setShowSignerModal(false)}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* REVIEW MODAL */}
      {showReviewModal && (() => { const a = approvals.find((x) => x.id === reviewingId); if (!a) return null; return (
        <div style={modal}>
          <div style={{ ...modalBox, width: 440 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: textPrimary, marginBottom: 20 }}>Review payroll request</div>
            {[["Date", `${a.date} ${a.time}`], ["Employees", a.count], ["Token", a.token], ["Total", `${a.total.toFixed(4)} ETH`]].map(([label, val]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: `1px solid ${border}` }}>
                <span style={{ color: textMuted }}>{label}</span>
                <span style={{ fontWeight: label === "Total" ? 700 : 500, color: label === "Total" ? green : textPrimary }}>{val}</span>
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <button style={btnRed} onClick={rejectApproval}>Reject</button>
              <button className="btn-hover-glow" style={btnGreen} onClick={approveAndExecute} disabled={txPending}>{txPending ? "⏳ Pending..." : "Approve & execute"}</button>
            </div>
          </div>
        </div>
      ); })()}

      {/* EXPORT MODAL */}
      {exportPreview && (
        <div style={modal}>
          <div style={{ ...modalBox, width: 460 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: textPrimary, marginBottom: 14 }}>{exportPreview.title}</div>
            <pre style={{ fontFamily: "monospace", fontSize: 12, background: surface2, padding: 14, borderRadius: 10, maxHeight: 300, overflowY: "auto", whiteSpace: "pre-wrap", lineHeight: 1.6, color: textSecondary }}>{exportPreview.content}</pre>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <button style={btn} onClick={() => setExportPreview(null)}>Close</button>
              <button className="btn-hover-glow" style={btnBrand} onClick={() => downloadFile(exportPreview.content, exportPreview.filename, exportPreview.type)}>Download</button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS OVERLAY */}
      {success && (
        <div style={{ ...modal, backdropFilter: "blur(12px)" }}>
          <div style={{ ...modalBox, textAlign: "center", width: 360, animation: "scaleIn 0.3s ease forwards" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: success.bg, border: `1px solid ${success.color}44`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 28, boxShadow: `0 0 40px ${success.color}66`, animation: "success-pop 0.4s ease forwards" }}>{success.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: success.color }}>{success.title}</div>
            <div style={{ fontSize: 13, color: textSecondary, lineHeight: 1.6 }}>{success.msg}</div>
            <button className="btn-hover-glow" style={{ ...btnBrand, marginTop: 24, width: "100%", padding: "12px" }} onClick={() => setSuccess(null)}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}
