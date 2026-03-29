import { useState } from "react";
import { useAccount, useDisconnect } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';

const CHAINS = ["ERC20", "BEP20", "Polygon", "Arbitrum", "Optimism"];
const TOKENS = ["USDT", "USDC"];

const initialEmployees = [
  { id: 1, name: "Sarah Chen", email: "sarah@acme.com", addr: "0xA1B2...7890", chain: "ERC20", salary: 4000 },
  { id: 2, name: "Marcus Osei", email: "marcus@acme.com", addr: "0xF9E8...3210", chain: "BEP20", salary: 3500 },
  { id: 3, name: "Priya Sharma", email: "priya@acme.com", addr: "0x1A2B...ABCD", chain: "ERC20", salary: 5000 },
  { id: 4, name: "Jake Torres", email: "jake@acme.com", addr: "0x9Z8Y...EFGH", chain: "Polygon", salary: 3200 },
  { id: 5, name: "Lena Müller", email: "lena@acme.com", addr: "0x2B3C...IJKL", chain: "BEP20", salary: 4500 },
];

const chainClass = (c) => c.toLowerCase().replace(/\s/g, "");

const ChainBadge = ({ chain }) => {
  const colors = {
    erc20: { bg: "#DBEAFE", color: "#1D4ED8" },
    bep20: { bg: "#FEF3C7", color: "#92400E" },
    polygon: { bg: "#EDE9FE", color: "#6D28D9" },
    arbitrum: { bg: "#CCFBF1", color: "#0F766E" },
    optimism: { bg: "#FFE4E6", color: "#BE123C" },
  };
  const s = colors[chainClass(chain)] || { bg: "#F3F4F6", color: "#374151" };
  return (
    <span style={{ background: s.bg, color: s.color, padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 500 }}>
      {chain}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const colors = {
    Success: { bg: "#DCFCE7", color: "#16A34A" },
    Pending: { bg: "#FEF3C7", color: "#D97706" },
    Approved: { bg: "#DBEAFE", color: "#2563EB" },
    Rejected: { bg: "#FEE2E2", color: "#DC2626" },
  };
  const s = colors[status] || { bg: "#F3F4F6", color: "#374151" };
  return (
    <span style={{ background: s.bg, color: s.color, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500 }}>
      {status}
    </span>
  );
};

export default function App() {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { disconnect } = useDisconnect();

  const [page, setPage] = useState("wallet");
  const [employees, setEmployees] = useState(initialEmployees);
  const [nextId, setNextId] = useState(6);
  const [payAmounts, setPayAmounts] = useState({});
  const [payTokens, setPayTokens] = useState({});
  const [chainFilter, setChainFilter] = useState("All");
  const [payFilter, setPayFilter] = useState("All");
  const [searchQ, setSearchQ] = useState("");
  const [history, setHistory] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [nextApprovalId, setNextApprovalId] = useState(1);
  const [signers, setSigners] = useState([
    { id: 1, name: "CFO — Diana Park", addr: "0xCFO1...1234" },
    { id: 2, name: "CEO — James Wu", addr: "0xCEO2...5678" },
  ]);
  const [nextSignerId, setNextSignerId] = useState(3);
  const [selectedEmployees, setSelectedEmployees] = useState({});
  const [globalToken, setGlobalToken] = useState("USDT");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [showSetAllModal, setShowSetAllModal] = useState(false);
  const [showSignerModal, setShowSignerModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewingId, setReviewingId] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [success, setSuccess] = useState(null);
  const [expandedRun, setExpandedRun] = useState(null);
  const [formData, setFormData] = useState({ name: "", email: "", addr: "", chain: "ERC20", salary: "" });
  const [bulkAmount, setBulkAmount] = useState("");
  const [csvText, setCsvText] = useState("");
  const [newSignerName, setNewSignerName] = useState("");
  const [newSignerAddr, setNewSignerAddr] = useState("");
  const [exportPreview, setExportPreview] = useState(null);

  const brand = "#6C47FF";
  const brandLight = "#EEE9FF";
  const brandDark = "#4A2FCC";
  const green = "#16A34A";
  const greenLight = "#DCFCE7";
  const amber = "#D97706";
  const amberLight = "#FEF3C7";
  const red = "#DC2626";
  const redLight = "#FEE2E2";
  const blue = "#2563EB";
  const blueLight = "#DBEAFE";

  const btn = {
    padding: "7px 14px", border: "0.5px solid #ccc", borderRadius: 8, cursor: "pointer",
    fontSize: 13, background: "transparent", color: "#111", transition: "all 0.15s", fontFamily: "inherit",
  };
  const btnBrand = { ...btn, background: brand, color: "#fff", border: `1px solid ${brand}` };
  const btnGreen = { ...btn, background: green, color: "#fff", border: `1px solid ${green}` };
  const btnRed = { ...btn, border: `1px solid ${red}`, color: red };
  const btnSm = { ...btn, padding: "4px 10px", fontSize: 12 };
  const btnBrandSm = { ...btnSm, background: brand, color: "#fff", border: `1px solid ${brand}` };

  const input = {
    width: "100%", padding: "7px 10px", border: "0.5px solid #ddd", borderRadius: 8,
    fontSize: 13, background: "#f9f9f9", color: "#111", fontFamily: "inherit", boxSizing: "border-box",
  };
  const select = { ...input, width: "auto" };

  const filteredEmployees = employees.filter((e) => {
    const ms = !searchQ || e.name.toLowerCase().includes(searchQ) || e.email.toLowerCase().includes(searchQ);
    const mc = chainFilter === "All" || e.chain === chainFilter;
    return ms && mc;
  });

  const payFilteredEmployees = employees.filter((e) => payFilter === "All" || e.chain === payFilter);

  const totalPayout = payFilteredEmployees.reduce((sum, e) => {
    if (selectedEmployees[e.id]) return sum + (parseFloat(payAmounts[e.id]) || 0);
    return sum;
  }, 0);

  const selectedCount = Object.values(selectedEmployees).filter(Boolean).length;
  const pendingApprovals = approvals.filter((a) => a.status === "Pending").length;
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";

  function connectWallet() {
    if (openConnectModal) openConnectModal();
  }

  function openAddModal() {
    setEditingEmployee(null);
    setFormData({ name: "", email: "", addr: "", chain: "ERC20", salary: "" });
    setShowAddModal(true);
  }

  function openEditModal(emp) {
    setEditingEmployee(emp);
    setFormData({ name: emp.name, email: emp.email, addr: emp.addr, chain: emp.chain, salary: emp.salary || "" });
    setShowAddModal(true);
  }

  function saveEmployee() {
    if (!formData.name || !formData.email || !formData.addr) return;
    if (editingEmployee) {
      setEmployees(employees.map((e) => e.id === editingEmployee.id ? { ...e, ...formData, salary: parseFloat(formData.salary) || null } : e));
    } else {
      setEmployees([...employees, { id: nextId, ...formData, salary: parseFloat(formData.salary) || null }]);
      setNextId(nextId + 1);
    }
    setShowAddModal(false);
  }

  function importCsv() {
    const lines = csvText.trim().split("\n").filter((l) => l.trim());
    if (lines.length < 2) return;
    const h = lines[0].toLowerCase().split(",").map((x) => x.trim());
    const ni = h.indexOf("name"), ei = h.indexOf("email"), wi = h.indexOf("wallet"), ci = h.indexOf("chain"), si = h.indexOf("salary");
    let id = nextId;
    const newEmps = [];
    for (let i = 1; i < lines.length; i++) {
      const c = lines[i].split(",").map((x) => x.trim());
      if (c.length < 3) continue;
      newEmps.push({ id: id++, name: c[ni] || "Unknown", email: c[ei] || "", addr: c[wi] || "0x...", chain: c[ci] || "ERC20", salary: parseFloat(c[si]) || null });
    }
    setEmployees([...employees, ...newEmps]);
    setNextId(id);
    setShowCsvModal(false);
    setCsvText("");
  }

  function loadPresets() {
    const newAmounts = { ...payAmounts };
    const newSelected = { ...selectedEmployees };
    payFilteredEmployees.forEach((e) => { if (e.salary) { newAmounts[e.id] = e.salary; newSelected[e.id] = true; } });
    setPayAmounts(newAmounts);
    setSelectedEmployees(newSelected);
  }

  function applyBulk() {
    const newAmounts = { ...payAmounts };
    const newSelected = { ...selectedEmployees };
    payFilteredEmployees.forEach((e) => { newAmounts[e.id] = bulkAmount; newSelected[e.id] = true; });
    setPayAmounts(newAmounts);
    setSelectedEmployees(newSelected);
    setBulkAmount("");
    setShowSetAllModal(false);
  }

  function collectPayrollData() {
    const items = [];
    let total = 0;
    payFilteredEmployees.forEach((e) => {
      if (selectedEmployees[e.id]) {
        const amt = parseFloat(payAmounts[e.id]) || 0;
        const tok = payTokens[e.id] || globalToken;
        items.push({ name: e.name, chain: e.chain, amt, token: tok, addr: e.addr, email: e.email });
        total += amt;
      }
    });
    return { items, total };
  }

  function executePayroll() {
    if (!isConnected) { alert("Connect your treasury wallet first."); return; }
    const { items, total } = collectPayrollData();
    if (items.length === 0) { alert("Select at least one employee."); return; }
    const run = { id: history.length + 1, date: new Date().toLocaleDateString(), time: new Date().toLocaleTimeString(), count: items.length, total, token: globalToken, items, status: "Success" };
    setHistory([run, ...history]);
    setSuccess({ icon: "✓", title: "Payroll executed!", msg: `${items.length} payment(s) totaling $${total.toFixed(2)} ${globalToken} broadcast.`, bg: greenLight, color: green });
    setPayAmounts({});
    setSelectedEmployees({});
  }

  function submitForApproval() {
    if (!isConnected) { alert("Connect your treasury wallet first."); return; }
    const { items, total } = collectPayrollData();
    if (items.length === 0) { alert("Select at least one employee."); return; }
    const req = { id: nextApprovalId, date: new Date().toLocaleDateString(), time: new Date().toLocaleTimeString(), count: items.length, total, token: globalToken, items, status: "Pending", signerStatuses: signers.map((s) => ({ ...s, status: "Pending" })) };
    setApprovals([req, ...approvals]);
    setNextApprovalId(nextApprovalId + 1);
    setSuccess({ icon: "⏳", title: "Submitted for approval!", msg: `$${total.toFixed(2)} ${globalToken} sent to ${signers.length} signer(s) for review.`, bg: amberLight, color: amber });
    setPayAmounts({});
    setSelectedEmployees({});
  }

  function approveAndExecute() {
    const a = approvals.find((x) => x.id === reviewingId);
    if (!a) return;
    const updated = approvals.map((x) => x.id === reviewingId ? { ...x, status: "Approved", signerStatuses: x.signerStatuses.map((s) => ({ ...s, status: "Approved" })) } : x);
    setApprovals(updated);
    const run = { id: history.length + 1, date: a.date, time: a.time, count: a.count, total: a.total, token: a.token, items: a.items, status: "Approved" };
    setHistory([run, ...history]);
    setShowReviewModal(false);
    setSuccess({ icon: "✓", title: "Approved & executed!", msg: `$${a.total.toFixed(2)} ${a.token} payroll approved and broadcast.`, bg: greenLight, color: green });
  }

  function rejectApproval() {
    const updated = approvals.map((x) => x.id === reviewingId ? { ...x, status: "Rejected", signerStatuses: x.signerStatuses.map((s) => ({ ...s, status: "Rejected" })) } : x);
    setApprovals(updated);
    setShowReviewModal(false);
  }

  function exportCSV() {
    if (history.length === 0) { alert("No history yet."); return; }
    let csv = "Run #,Date,Employee,Email,Wallet,Chain,Amount,Token,Status\n";
    history.forEach((r) => { r.items.forEach((i) => { csv += `${r.id},"${r.date} ${r.time}","${i.name}","${i.email || ""}","${i.addr}",${i.chain},${i.amt},${i.token},${r.status}\n`; }); });
    const total = history.reduce((s, r) => s + r.total, 0);
    csv += `\nTotal disbursed,,,,,,$${total.toFixed(2)},,`;
    setExportPreview({ title: "Export CSV", content: csv, filename: "payroll-report.csv", type: "text/csv" });
  }

  function exportPDF() {
    if (history.length === 0) { alert("No history yet."); return; }
    let c = "PAYCHAIN — PAYROLL REPORT\nGenerated: " + new Date().toLocaleString() + "\n" + "=".repeat(46) + "\n\n";
    history.forEach((r) => {
      c += `Run #${r.id} | ${r.date} | ${r.status}\nTotal: $${r.total.toFixed(2)} ${r.token} | ${r.count} employee(s)\n` + "-".repeat(46) + "\n";
      r.items.forEach((i) => { c += `  ${i.name.padEnd(20)} ${i.chain.padEnd(10)} $${i.amt.toFixed(2)} ${i.token}\n`; });
      c += "\n";
    });
    c += "=".repeat(46) + "\nTOTAL DISBURSED: $" + history.reduce((s, r) => s + r.total, 0).toFixed(2);
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

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", color: "#111", fontSize: 14, background: "#f5f5f5", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ display: "flex", width: "100%", maxWidth: 1100, height: 680, border: "0.5px solid #e5e7eb", borderRadius: 16, overflow: "hidden", background: "#fff", boxShadow: "0 4px 32px rgba(0,0,0,0.08)" }}>

        {/* Sidebar */}
        <div style={{ width: 210, borderRight: "0.5px solid #e5e7eb", background: "#fafafa", display: "flex", flexDirection: "column", padding: "16px 0" }}>
          <div style={{ padding: "0 16px 16px", borderBottom: "0.5px solid #e5e7eb", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: brand, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 16 }}>⬡</div>
            <div><div style={{ fontSize: 15, fontWeight: 500 }}>PayChain</div><div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>Crypto Payroll</div></div>
          </div>
          {navItems.map((item) => (
            <div key={item.id} onClick={() => setPage(item.id)}
              style={{ padding: "9px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontSize: 13, margin: "1px 8px", borderRadius: 8, background: page === item.id ? brandLight : "transparent", color: page === item.id ? brand : "#6b7280", fontWeight: page === item.id ? 500 : 400, transition: "all 0.15s" }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: page === item.id ? brand : "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: page === item.id ? "#fff" : "#6b7280" }}>{item.icon}</div>
              {item.label}
              {item.badge > 0 && <span style={{ marginLeft: "auto", background: item.id === "approvals" ? red : brand, color: "#fff", fontSize: 10, padding: "1px 7px", borderRadius: 20 }}>{item.badge}</span>}
            </div>
          ))}
        </div>

        {/* Main */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
          {/* Topbar */}
          <div style={{ padding: "12px 20px", borderBottom: "0.5px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff" }}>
            <span style={{ fontSize: 15, fontWeight: 500 }}>{{ wallet: "Wallet connect", employees: "Employees", payout: "Run payroll", approvals: "Approvals", history: "History" }[page]}</span>
            <div onClick={isConnected ? () => disconnect() : connectWallet}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", border: isConnected ? `0.5px solid ${green}` : "0.5px solid #e5e7eb", borderRadius: 20, cursor: "pointer", fontSize: 12, background: isConnected ? greenLight : "transparent", color: isConnected ? green : "#6b7280", transition: "all 0.15s" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: isConnected ? green : "#d1d5db", display: "inline-block" }}></span>
              {isConnected ? shortAddress : "Not connected"}
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: "auto", padding: 20, position: "relative" }}>

            {/* WALLET PAGE */}
            {page === "wallet" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 8 }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: brand, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, marginBottom: 8 }}>⬡</div>
                <div style={{ fontSize: 19, fontWeight: 500, marginBottom: 4 }}>Connect treasury wallet</div>
                <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 20, textAlign: "center", maxWidth: 300 }}>Connect the wallet holding your company USDT/USDC to authorize payroll</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: 360 }}>
                  {[{ name: "MetaMask", icon: "🦊", chain: "EVM chains" }, { name: "Rabby", icon: "🐰", chain: "EVM chains" }, { name: "Phantom", icon: "👻", chain: "Solana + EVM" }, { name: "WalletConnect", icon: "🔗", chain: "Any wallet" }].map((w) => (
                    <div key={w.name} onClick={() => connectWallet()}
                      style={{ padding: "14px 16px", border: `0.5px solid ${isConnected ? brand : "#e5e7eb"}`, borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, background: isConnected ? brandLight : "#fff", transition: "all 0.15s" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, background: "#f3f4f6" }}>{w.icon}</div>
                      <div><div style={{ fontSize: 13, fontWeight: 500 }}>{w.name}</div><div style={{ fontSize: 11, color: "#9ca3af" }}>{w.chain}</div></div>
                    </div>
                  ))}
                </div>
                {isConnected && (
                  <div style={{ marginTop: 20, padding: "14px 18px", border: `0.5px solid #c4b5fd`, borderRadius: 12, width: 360, background: brandLight }}>
                    <div style={{ fontSize: 12, color: brandDark, marginBottom: 8, fontWeight: 500 }}>Connected wallet</div>
                    <div style={{ fontFamily: "monospace", fontSize: 12, marginBottom: 10, color: brand }}>{address}</div>
                    <div style={{ display: "flex", gap: 20, marginBottom: 12 }}>
                      <div><div style={{ fontSize: 10, color: brandDark, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>Network</div><div style={{ fontSize: 16, fontWeight: 500, color: brandDark }}>Base</div></div>
                      <div><div style={{ fontSize: 10, color: brandDark, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</div><div style={{ fontSize: 16, fontWeight: 500, color: green }}>Connected ✓</div></div>
                    </div>
                    <button onClick={() => disconnect()}
                      style={{ width: "100%", padding: "8px", border: `1px solid ${red}`, borderRadius: 8, cursor: "pointer", background: redLight, color: red, fontSize: 13, fontFamily: "inherit", fontWeight: 500 }}>
                      Disconnect wallet
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* EMPLOYEES PAGE */}
            {page === "employees" && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                  <input style={{ ...input, width: 160 }} placeholder="Search..." value={searchQ} onChange={(e) => setSearchQ(e.target.value)} />
                  {["All", ...CHAINS.slice(0, 3)].map((c) => (
                    <button key={c} onClick={() => setChainFilter(c)}
                      style={{ ...btnSm, borderRadius: 20, background: chainFilter === c ? brand : "transparent", color: chainFilter === c ? "#fff" : "#6b7280", border: chainFilter === c ? `0.5px solid ${brand}` : "0.5px solid #e5e7eb" }}>{c}</button>
                  ))}
                  <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                    <button style={btnSm} onClick={() => setShowCsvModal(true)}>CSV import</button>
                    <button style={btnBrandSm} onClick={openAddModal}>+ Add employee</button>
                  </div>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr>{["Name", "Email", "Wallet", "Chain", "Salary", ""].map((h) => <th key={h} style={{ fontSize: 11, color: "#6b7280", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", padding: "8px 10px", borderBottom: "0.5px solid #e5e7eb", textAlign: "left" }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {filteredEmployees.map((e) => (
                      <tr key={e.id}>
                        <td style={{ padding: "9px 10px", borderBottom: "0.5px solid #f3f4f6", fontWeight: 500 }}>{e.name}</td>
                        <td style={{ padding: "9px 10px", borderBottom: "0.5px solid #f3f4f6", color: "#6b7280", fontSize: 12 }}>{e.email}</td>
                        <td style={{ padding: "9px 10px", borderBottom: "0.5px solid #f3f4f6", fontFamily: "monospace", fontSize: 11, color: "#6b7280" }}>{e.addr}</td>
                        <td style={{ padding: "9px 10px", borderBottom: "0.5px solid #f3f4f6" }}><ChainBadge chain={e.chain} /></td>
                        <td style={{ padding: "9px 10px", borderBottom: "0.5px solid #f3f4f6", fontWeight: 500, color: green }}>{e.salary ? `$${e.salary.toLocaleString()}` : <span style={{ color: "#d1d5db" }}>—</span>}</td>
                        <td style={{ padding: "9px 10px", borderBottom: "0.5px solid #f3f4f6" }}><button style={btnSm} onClick={() => openEditModal(e)}>Edit</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* PAYOUT PAGE */}
            {page === "payout" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
                  <div style={{ background: brandLight, borderRadius: 12, padding: "14px 16px" }}><div style={{ fontSize: 11, color: brandDark, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Selected</div><div style={{ fontSize: 22, fontWeight: 500, color: brandDark }}>{selectedCount}</div><div style={{ fontSize: 11, color: brandDark, opacity: 0.6, marginTop: 2 }}>employees</div></div>
                  <div style={{ background: greenLight, borderRadius: 12, padding: "14px 16px" }}><div style={{ fontSize: 11, color: green, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Total payout</div><div style={{ fontSize: 22, fontWeight: 500, color: green }}>${totalPayout.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div><div style={{ fontSize: 11, color: green, opacity: 0.6, marginTop: 2 }}>{globalToken}</div></div>
                  <div style={{ background: blueLight, borderRadius: 12, padding: "14px 16px" }}><div style={{ fontSize: 11, color: blue, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Treasury</div><div style={{ fontSize: 22, fontWeight: 500, color: blue }}>{isConnected ? "Connected" : "—"}</div><div style={{ fontSize: 11, color: blue, opacity: 0.6, marginTop: 2 }}>{isConnected ? shortAddress : "Connect wallet"}</div></div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                  <select style={{ ...select }} value={globalToken} onChange={(e) => setGlobalToken(e.target.value)}>{TOKENS.map((t) => <option key={t}>{t}</option>)}</select>
                  {["All", "ERC20", "BEP20", "Polygon"].map((f) => (
                    <button key={f} onClick={() => setPayFilter(f)}
                      style={{ ...btnSm, borderRadius: 20, background: payFilter === f ? brand : "transparent", color: payFilter === f ? "#fff" : "#6b7280", border: payFilter === f ? `0.5px solid ${brand}` : "0.5px solid #e5e7eb" }}>{f}</button>
                  ))}
                  <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                    <button style={{ ...btnSm, color: "#6b7280" }} onClick={loadPresets}>Load presets</button>
                    <button style={btnSm} onClick={() => setShowSetAllModal(true)}>Set all</button>
                  </div>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr>
                    <th style={{ padding: "8px 10px", borderBottom: "0.5px solid #e5e7eb", textAlign: "left" }}><input type="checkbox" onChange={(e) => { const s = {}; if (e.target.checked) payFilteredEmployees.forEach((emp) => s[emp.id] = true); setSelectedEmployees(s); }} style={{ accentColor: brand }} /></th>
                    {["Name", "Wallet", "Chain", "Token", "Amount"].map((h) => <th key={h} style={{ fontSize: 11, color: "#6b7280", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", padding: "8px 10px", borderBottom: "0.5px solid #e5e7eb", textAlign: "left" }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {payFilteredEmployees.map((e) => (
                      <tr key={e.id}>
                        <td style={{ padding: "9px 10px", borderBottom: "0.5px solid #f3f4f6" }}><input type="checkbox" checked={!!selectedEmployees[e.id]} onChange={(ev) => setSelectedEmployees({ ...selectedEmployees, [e.id]: ev.target.checked })} style={{ accentColor: brand }} /></td>
                        <td style={{ padding: "9px 10px", borderBottom: "0.5px solid #f3f4f6", fontWeight: 500 }}>
                          {e.name}
                          {e.salary && <button onClick={() => { setPayAmounts({ ...payAmounts, [e.id]: e.salary }); setSelectedEmployees({ ...selectedEmployees, [e.id]: true }); }}
                            style={{ fontSize: 10, padding: "2px 7px", border: `0.5px solid ${brand}`, borderRadius: 20, cursor: "pointer", background: "transparent", color: brand, marginLeft: 5 }}>${e.salary.toLocaleString()}</button>}
                        </td>
                        <td style={{ padding: "9px 10px", borderBottom: "0.5px solid #f3f4f6", fontFamily: "monospace", fontSize: 11, color: "#6b7280" }}>{e.addr}</td>
                        <td style={{ padding: "9px 10px", borderBottom: "0.5px solid #f3f4f6" }}><ChainBadge chain={e.chain} /></td>
                        <td style={{ padding: "9px 10px", borderBottom: "0.5px solid #f3f4f6" }}>
                          <select value={payTokens[e.id] || globalToken} onChange={(ev) => setPayTokens({ ...payTokens, [e.id]: ev.target.value })} style={{ ...select, padding: "4px 6px", fontSize: 11 }}>{TOKENS.map((t) => <option key={t}>{t}</option>)}</select>
                        </td>
                        <td style={{ padding: "9px 10px", borderBottom: "0.5px solid #f3f4f6" }}>
                          <input type="number" placeholder="0.00" value={payAmounts[e.id] || ""} onChange={(ev) => setPayAmounts({ ...payAmounts, [e.id]: ev.target.value })}
                            style={{ ...input, width: 90, padding: "5px 8px" }} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop: 16, padding: "14px 16px", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between", background: brandLight, border: `0.5px solid #c4b5fd` }}>
                  <div><div style={{ fontSize: 12, color: brandDark, fontWeight: 500 }}>Total to disburse</div><div style={{ fontSize: 22, fontWeight: 500, color: brandDark }}>${totalPayout.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div></div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={btn} onClick={submitForApproval}>Submit for approval</button>
                    <button style={btnBrand} onClick={executePayroll}>Execute payroll →</button>
                  </div>
                </div>
              </div>
            )}

            {/* APPROVALS PAGE */}
            {page === "approvals" && (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ fontSize: 13, color: "#6b7280" }}>{pendingApprovals} pending · {approvals.length} total</div>
                  <button style={btnSm} onClick={() => setShowSignerModal(true)}>Manage signers</button>
                </div>
                {approvals.length === 0 && <div style={{ color: "#9ca3af", fontSize: 13, textAlign: "center", padding: "40px 0" }}>No approval requests yet.</div>}
                {approvals.map((a) => (
                  <div key={a.id} style={{ border: "0.5px solid #e5e7eb", borderRadius: 10, marginBottom: 10, overflow: "hidden" }}>
                    <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fafafa" }}>
                      <div><div style={{ fontWeight: 500, fontSize: 14 }}>${a.total.toFixed(2)} {a.token} — {a.count} employee(s)</div><div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{a.date} at {a.time}</div></div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <StatusBadge status={a.status} />
                        {a.status === "Pending" && <button style={btnBrandSm} onClick={() => { setReviewingId(a.id); setShowReviewModal(true); }}>Review →</button>}
                      </div>
                    </div>
                    <div style={{ padding: "12px 16px", borderTop: "0.5px solid #e5e7eb" }}>
                      {a.signerStatuses.map((s) => (
                        <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "0.5px solid #f3f4f6" }}>
                          <div style={{ width: 30, height: 30, borderRadius: "50%", background: brandLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 500, color: brand }}>{s.name.split(" ").map((x) => x[0]).join("").slice(0, 2)}</div>
                          <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</div><div style={{ fontFamily: "monospace", fontSize: 11, color: "#6b7280" }}>{s.addr}</div></div>
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
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ fontSize: 13, color: "#6b7280" }}>{history.length} run(s) · ${history.reduce((s, r) => s + r.total, 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total disbursed</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button style={btnSm} onClick={exportCSV}>Export CSV</button>
                    <button style={btnBrandSm} onClick={exportPDF}>Export PDF</button>
                  </div>
                </div>
                {history.length === 0 && <div style={{ color: "#9ca3af", fontSize: 13, textAlign: "center", padding: "40px 0" }}>No payroll runs yet.</div>}
                {history.map((r) => (
                  <div key={r.id} style={{ border: "0.5px solid #e5e7eb", borderRadius: 10, marginBottom: 10, overflow: "hidden" }}>
                    <div onClick={() => setExpandedRun(expandedRun === r.id ? null : r.id)}
                      style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fafafa", cursor: "pointer" }}>
                      <div><div style={{ fontWeight: 500, fontSize: 14 }}>Run #{r.id} — <span style={{ color: green }}>${r.total.toFixed(2)} {r.token}</span></div><div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{r.date} at {r.time} · {r.count} employee(s)</div></div>
                      <StatusBadge status={r.status} />
                    </div>
                    {expandedRun === r.id && (
                      <div style={{ padding: "0 16px 12px", borderTop: "0.5px solid #e5e7eb" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}>
                          <thead><tr>{["Name", "Wallet", "Chain", "Amount"].map((h) => <th key={h} style={{ fontSize: 11, color: "#6b7280", fontWeight: 500, textTransform: "uppercase", padding: "6px 8px", borderBottom: "0.5px solid #e5e7eb", textAlign: "left" }}>{h}</th>)}</tr></thead>
                          <tbody>{r.items.map((i, idx) => (
                            <tr key={idx}>
                              <td style={{ padding: "8px", fontWeight: 500 }}>{i.name}</td>
                              <td style={{ padding: "8px", fontFamily: "monospace", fontSize: 11, color: "#6b7280" }}>{i.addr}</td>
                              <td style={{ padding: "8px" }}><ChainBadge chain={i.chain} /></td>
                              <td style={{ padding: "8px", color: green, fontWeight: 500 }}>${i.amt.toFixed(2)} {i.token}</td>
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

      {/* ADD EMPLOYEE MODAL */}
      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, width: 400, border: "0.5px solid #e5e7eb" }}>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 16 }}>{editingEmployee ? "Edit employee" : "Add employee"}</div>
            {[["Full name", "name", "text", "Sarah Chen"], ["Email", "email", "email", "sarah@company.com"], ["Wallet address", "addr", "text", "0x..."], ["Monthly salary preset (USD) — optional", "salary", "number", "3500"]].map(([label, field, type, ph]) => (
              <div key={field} style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 12, color: "#6b7280", marginBottom: 4 }}>{label}</label>
                <input type={type} placeholder={ph} value={formData[field]} onChange={(e) => setFormData({ ...formData, [field]: e.target.value })} style={input} />
              </div>
            ))}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Chain</label>
              <select value={formData.chain} onChange={(e) => setFormData({ ...formData, chain: e.target.value })} style={{ ...input }}>{CHAINS.map((c) => <option key={c}>{c}</option>)}</select>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
              <button style={btn} onClick={() => setShowAddModal(false)}>Cancel</button>
              <button style={btnBrand} onClick={saveEmployee}>Save employee</button>
            </div>
          </div>
        </div>
      )}

      {/* CSV MODAL */}
      {showCsvModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, width: 400, border: "0.5px solid #e5e7eb" }}>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>CSV import</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>Columns: <code style={{ background: "#f3f4f6", padding: "2px 6px", borderRadius: 4 }}>name, email, wallet, chain, salary</code></div>
            <div onClick={() => setCsvText("name,email,wallet,chain,salary\nAlex Wong,alex@company.com,0xD4E5...1234,ERC20,4200\nFatima Hassan,fatima@company.com,0xB3C4...5678,BEP20,3800")}
              style={{ border: `1.5px dashed #c4b5fd`, borderRadius: 10, padding: 24, textAlign: "center", cursor: "pointer", color: brand, background: brandLight, marginBottom: 12 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>↑</div>
              <div style={{ fontWeight: 500 }}>Click to load demo CSV</div>
            </div>
            <textarea rows={4} placeholder="Or paste CSV data here..." value={csvText} onChange={(e) => setCsvText(e.target.value)} style={{ ...input, resize: "vertical" }} />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
              <button style={btn} onClick={() => setShowCsvModal(false)}>Cancel</button>
              <button style={btnBrand} onClick={importCsv}>Import</button>
            </div>
          </div>
        </div>
      )}

      {/* SET ALL MODAL */}
      {showSetAllModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, width: 360, border: "0.5px solid #e5e7eb" }}>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 16 }}>Set amount for all employees</div>
            <input type="number" placeholder="e.g. 3000" value={bulkAmount} onChange={(e) => setBulkAmount(e.target.value)} style={input} />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
              <button style={btn} onClick={() => setShowSetAllModal(false)}>Cancel</button>
              <button style={btnGreen} onClick={applyBulk}>Apply to all</button>
            </div>
          </div>
        </div>
      )}

      {/* SIGNERS MODAL */}
      {showSignerModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, width: 400, border: "0.5px solid #e5e7eb" }}>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>Approval signers</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>Payroll submitted for approval requires sign-off from these addresses.</div>
            {signers.map((s) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "0.5px solid #f3f4f6" }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: brandLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 500, color: brand }}>{s.name.split(" ").map((x) => x[0]).join("").slice(0, 2)}</div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</div><div style={{ fontFamily: "monospace", fontSize: 11, color: "#6b7280" }}>{s.addr}</div></div>
                <button style={{ ...btnSm, border: `0.5px solid ${red}`, color: red }} onClick={() => setSigners(signers.filter((x) => x.id !== s.id))}>Remove</button>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <input placeholder="Name" value={newSignerName} onChange={(e) => setNewSignerName(e.target.value)} style={{ ...input, flex: 1 }} />
              <input placeholder="0x... or email" value={newSignerAddr} onChange={(e) => setNewSignerAddr(e.target.value)} style={{ ...input, flex: 2 }} />
              <button style={btnBrandSm} onClick={() => { if (!newSignerName || !newSignerAddr) return; setSigners([...signers, { id: nextSignerId, name: newSignerName, addr: newSignerAddr }]); setNextSignerId(nextSignerId + 1); setNewSignerName(""); setNewSignerAddr(""); }}>Add</button>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
              <button style={btnBrand} onClick={() => setShowSignerModal(false)}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* REVIEW MODAL */}
      {showReviewModal && (() => { const a = approvals.find((x) => x.id === reviewingId); if (!a) return null; return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, width: 420, border: "0.5px solid #e5e7eb" }}>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 16 }}>Review payroll request</div>
            {[["Date", `${a.date} ${a.time}`], ["Employees", a.count], ["Token", a.token], ["Total", `$${a.total.toFixed(2)}`]].map(([label, val]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0" }}>
                <span style={{ color: "#6b7280" }}>{label}</span>
                <span style={{ fontWeight: label === "Total" ? 500 : 400, color: label === "Total" ? green : "#111" }}>{val}</span>
              </div>
            ))}
            <div style={{ height: "0.5px", background: "#e5e7eb", margin: "12px 0" }}></div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{["Name", "Chain", "Amount"].map((h) => <th key={h} style={{ fontSize: 11, color: "#6b7280", fontWeight: 500, textTransform: "uppercase", padding: "6px 8px", borderBottom: "0.5px solid #e5e7eb", textAlign: "left" }}>{h}</th>)}</tr></thead>
              <tbody>{a.items.map((i, idx) => (
                <tr key={idx}>
                  <td style={{ padding: "8px", fontWeight: 500 }}>{i.name}</td>
                  <td style={{ padding: "8px" }}><ChainBadge chain={i.chain} /></td>
                  <td style={{ padding: "8px", color: green, fontWeight: 500 }}>${i.amt.toFixed(2)} {i.token}</td>
                </tr>
              ))}</tbody>
            </table>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
              <button style={btnRed} onClick={rejectApproval}>Reject</button>
              <button style={btnGreen} onClick={approveAndExecute}>Approve & execute</button>
            </div>
          </div>
        </div>
      ); })()}

      {/* EXPORT MODAL */}
      {exportPreview && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, width: 440, border: "0.5px solid #e5e7eb" }}>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 12 }}>{exportPreview.title}</div>
            <pre style={{ fontFamily: "monospace", fontSize: 12, background: "#f9f9f9", padding: 12, borderRadius: 8, maxHeight: 300, overflowY: "auto", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{exportPreview.content}</pre>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
              <button style={btn} onClick={() => setExportPreview(null)}>Close</button>
              <button style={btnBrand} onClick={() => downloadFile(exportPreview.content, exportPreview.filename, exportPreview.type)}>Download</button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS OVERLAY */}
      {success && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 36, textAlign: "center", width: 340, border: "0.5px solid #e5e7eb" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: success.bg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 26 }}>{success.icon}</div>
            <div style={{ fontSize: 17, fontWeight: 500, marginBottom: 6, color: success.color }}>{success.title}</div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>{success.msg}</div>
            <button style={{ ...btnBrand, marginTop: 22, width: "100%" }} onClick={() => setSuccess(null)}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}