import { useState, useEffect } from "react";

export default function LandingPage({ onLaunch }) {
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState({});

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) setVisible(v => ({ ...v, [e.target.id]: true }));
      }),
      { threshold: 0.15 }
    );
    document.querySelectorAll("[data-animate]").forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const s = {
    page: { fontFamily: "'Outfit', system-ui, sans-serif", background: "#fafbff", color: "#0f0a2e", minHeight: "100vh", overflowX: "hidden" },
    nav: { position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "0 5%", height: 70, display: "flex", alignItems: "center", justifyContent: "space-between", background: scrolled ? "rgba(250,251,255,0.92)" : "transparent", backdropFilter: scrolled ? "blur(12px)" : "none", borderBottom: scrolled ? "1px solid rgba(124,58,237,0.1)" : "none", transition: "all 0.3s" },
    logo: { display: "flex", alignItems: "center", gap: 10 },
    logoIcon: { width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #7c3aed, #2563eb)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 18 },
    logoText: { fontSize: 18, fontWeight: 800, background: "linear-gradient(135deg, #7c3aed, #2563eb)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
    navBtn: { padding: "9px 22px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, background: "linear-gradient(135deg, #7c3aed, #2563eb)", color: "#fff", boxShadow: "0 4px 20px rgba(124,58,237,0.3)", transition: "all 0.2s", fontFamily: "inherit" },
    hero: { paddingTop: 160, paddingBottom: 100, paddingLeft: "5%", paddingRight: "5%", textAlign: "center", position: "relative" },
    heroBadge: { display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 20, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", fontSize: 13, fontWeight: 600, color: "#7c3aed", marginBottom: 28 },
    heroTitle: { fontSize: "clamp(36px, 6vw, 72px)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: 24, maxWidth: 800, margin: "0 auto 24px" },
    heroSub: { fontSize: "clamp(16px, 2vw, 20px)", color: "#6b7280", lineHeight: 1.7, maxWidth: 560, margin: "0 auto 40px" },
    heroCta: { display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" },
    btnPrimary: { padding: "14px 32px", borderRadius: 12, border: "none", cursor: "pointer", fontSize: 15, fontWeight: 700, background: "linear-gradient(135deg, #7c3aed, #2563eb)", color: "#fff", boxShadow: "0 8px 30px rgba(124,58,237,0.35)", transition: "all 0.2s", fontFamily: "inherit" },
    btnSecondary: { padding: "14px 32px", borderRadius: 12, border: "1px solid rgba(124,58,237,0.25)", cursor: "pointer", fontSize: 15, fontWeight: 600, background: "transparent", color: "#7c3aed", transition: "all 0.2s", fontFamily: "inherit" },
    statsRow: { display: "flex", justifyContent: "center", gap: "clamp(24px, 5vw, 60px)", flexWrap: "wrap", padding: "60px 5%", borderTop: "1px solid rgba(124,58,237,0.08)", borderBottom: "1px solid rgba(124,58,237,0.08)", background: "rgba(124,58,237,0.02)" },
    statItem: { textAlign: "center" },
    statNum: { fontSize: "clamp(24px, 4vw, 40px)", fontWeight: 900, background: "linear-gradient(135deg, #7c3aed, #2563eb)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", display: "block" },
    statLabel: { fontSize: 14, color: "#9ca3af", fontWeight: 500, marginTop: 4 },
    section: { padding: "80px 5%" },
    sectionTitle: { fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, textAlign: "center", letterSpacing: "-0.02em", marginBottom: 16 },
    sectionSub: { fontSize: 17, color: "#6b7280", textAlign: "center", maxWidth: 520, margin: "0 auto 60px", lineHeight: 1.7 },
    stepsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24, maxWidth: 1100, margin: "0 auto" },
    stepCard: { padding: "32px 28px", borderRadius: 20, background: "#fff", border: "1px solid rgba(124,58,237,0.1)", boxShadow: "0 4px 24px rgba(0,0,0,0.05)", transition: "all 0.3s" },
    stepNum: { width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #7c3aed, #2563eb)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 18, marginBottom: 20 },
    stepTitle: { fontSize: 18, fontWeight: 800, marginBottom: 10, color: "#0f0a2e" },
    stepDesc: { fontSize: 15, color: "#6b7280", lineHeight: 1.7 },
    featuresGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, maxWidth: 1100, margin: "0 auto" },
    featureCard: { padding: "28px 24px", borderRadius: 16, background: "#fff", border: "1px solid rgba(124,58,237,0.1)", boxShadow: "0 2px 16px rgba(0,0,0,0.04)" },
    featureIcon: { fontSize: 28, marginBottom: 14 },
    featureTitle: { fontSize: 16, fontWeight: 700, marginBottom: 8, color: "#0f0a2e" },
    featureDesc: { fontSize: 14, color: "#9ca3af", lineHeight: 1.6 },
    ctaSection: { padding: "80px 5%", textAlign: "center", background: "linear-gradient(135deg, #7c3aed08, #2563eb08)", borderTop: "1px solid rgba(124,58,237,0.1)" },
    footer: { padding: "40px 5%", borderTop: "1px solid rgba(124,58,237,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 },
    footerText: { fontSize: 14, color: "#9ca3af" },
  };

  const fadeIn = (id) => ({
    id,
    "data-animate": true,
    style: {
      opacity: visible[id] ? 1 : 0,
      transform: visible[id] ? "translateY(0)" : "translateY(32px)",
      transition: "all 0.7s cubic-bezier(0.16,1,0.3,1)",
    }
  });

  return (
    <div style={s.page}>
      {/* Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />

      {/* Background blobs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-20%", left: "-10%", width: "50vw", height: "50vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "-20%", right: "-10%", width: "40vw", height: "40vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 70%)" }} />
      </div>

      {/* NAV */}
      <nav style={s.nav}>
        <div style={s.logo}>
          <div style={s.logoIcon}>$</div>
          <span style={s.logoText}>PayChain</span>
        </div>
        <button style={s.navBtn} onClick={onLaunch}>Launch App →</button>
      </nav>

      {/* HERO */}
      <section style={s.hero}>
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={s.heroBadge}>
            <span>⛓</span> Live on Base Mainnet
          </div>
          <h1 style={s.heroTitle}>
            Crypto Payroll,{" "}
            <span style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              On-Chain
            </span>
          </h1>
          <p style={s.heroSub}>
            Pay your team in ETH instantly. No banks, no delays, no borders. 
            Fully transparent, verifiable payroll on Base.
          </p>
          <div style={s.heroCta}>
            <button style={s.btnPrimary} onClick={onLaunch}>
              Launch App →
            </button>
            <a href="https://basescan.org/address/0x1E6d93B4641cAFDA9e629b9bbd747aE7261BB786" target="_blank" rel="noreferrer" style={{ ...s.btnSecondary, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
              View Contract ↗
            </a>
          </div>
        </div>

        {/* Hero visual */}
        <div style={{ marginTop: 60, position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: 700, margin: "0 auto", borderRadius: 20, background: "#fff", border: "1px solid rgba(124,58,237,0.15)", boxShadow: "0 20px 80px rgba(124,58,237,0.15), 0 4px 20px rgba(0,0,0,0.08)", overflow: "hidden" }}>
            {/* Mock app bar */}
            <div style={{ padding: "14px 20px", background: "linear-gradient(135deg, #080514, #0d0920)", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981" }} />
              <div style={{ flex: 1, textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>paychain-one.vercel.app</div>
            </div>
            {/* Mock dashboard */}
            <div style={{ padding: 24, background: "#03010a" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 16 }}>
                {[["Treasury", "2.4500 ETH", "#10b981"], ["Employees", "12", "#a78bfa"], ["Next Payroll", "3 days", "#f59e0b"]].map(([label, val, color]) => (
                  <div key={label} style={{ padding: "14px", borderRadius: 12, background: "#080514", border: "1px solid #1a1035" }}>
                    <div style={{ fontSize: 10, color: "#4a4168", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>{label}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color }}>{val}</div>
                  </div>
                ))}
              </div>
              <div style={{ borderRadius: 12, background: "#080514", border: "1px solid #1a1035", overflow: "hidden" }}>
                <div style={{ padding: "10px 14px", background: "#0d0920", borderBottom: "1px solid #1a1035", display: "flex", gap: 20 }}>
                  {["NAME", "WALLET", "SALARY"].map(h => <span key={h} style={{ fontSize: 10, color: "#4a4168", fontWeight: 700, letterSpacing: "0.1em" }}>{h}</span>)}
                </div>
                {[["Alice Chen", "0x44...0737", "0.05 ETH"], ["Bob Smith", "0x1E...C5E4", "0.08 ETH"], ["Carol Wu", "0x5b...3eDd", "0.06 ETH"]].map(([name, addr, sal]) => (
                  <div key={name} style={{ padding: "10px 14px", borderBottom: "1px solid #1a103522", display: "flex", gap: 20, alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#e2d9f3", flex: 1 }}>{name}</span>
                    <span style={{ fontSize: 11, color: "#4a4168", fontFamily: "monospace", flex: 1 }}>{addr}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#10b981" }}>{sal}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <div style={s.statsRow}>
        {[["Base Mainnet", "Network"], ["Instant", "Payments"], ["0% Fees", "Platform"], ["Open Source", "Contract"]].map(([num, label]) => (
          <div key={label} style={s.statItem}>
            <span style={s.statNum}>{num}</span>
            <span style={s.statLabel}>{label}</span>
          </div>
        ))}
      </div>

      {/* HOW IT WORKS */}
      <section style={{ ...s.section, background: "#fff" }}>
        <div {...fadeIn("steps")}>
          <h2 style={s.sectionTitle}>How it works</h2>
          <p style={s.sectionSub}>Three simple steps to run your first on-chain payroll</p>
          <div style={s.stepsGrid}>
            {[
              { num: "1", title: "Connect Treasury Wallet", desc: "Connect the wallet that deployed the PayChain contract. This becomes your owner wallet with full admin access." },
              { num: "2", title: "Add Your Team", desc: "Add employees with their wallet addresses and monthly ETH salary. All data is stored on-chain — fully transparent and immutable." },
              { num: "3", title: "Fund & Execute", desc: "Deposit ETH into the treasury contract. When ready, hit Execute Payroll and all employees are paid instantly in one transaction." },
            ].map((step, i) => (
              <div key={i} style={{ ...s.stepCard, animationDelay: `${i * 0.1}s` }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 8px 40px rgba(124,58,237,0.15)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.05)"}>
                <div style={s.stepNum}>{step.num}</div>
                <div style={s.stepTitle}>{step.title}</div>
                <div style={s.stepDesc}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={s.section}>
        <div {...fadeIn("features")}>
          <h2 style={s.sectionTitle}>Everything you need</h2>
          <p style={s.sectionSub}>Built for modern crypto-native teams</p>
          <div style={s.featuresGrid}>
            {[
              { icon: "⛓", title: "On-Chain & Transparent", desc: "Every transaction is verifiable on Base. Your employees can independently verify every payment." },
              { icon: "🚀", title: "One-Click Payroll", desc: "Pay your entire team in a single transaction. No manual transfers, no missed payments." },
              { icon: "👥", title: "Employee Management", desc: "Add, edit or remove employees with full on-chain records. Export reports as CSV or PDF." },
              { icon: "✅", title: "Approval Workflows", desc: "Multi-sig approval flows let CFOs and CEOs review payroll before execution." },
              { icon: "💰", title: "Treasury Management", desc: "Deposit ETH to your treasury contract. Always know exactly how much runway you have." },
              { icon: "📊", title: "Payroll History", desc: "Full audit trail of every payroll run with timestamps, amounts and employee details." },
            ].map((f, i) => (
              <div key={i} style={s.featureCard}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.3)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.1)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                <div style={s.featureIcon}>{f.icon}</div>
                <div style={s.featureTitle}>{f.title}</div>
                <div style={s.featureDesc}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={s.ctaSection}>
        <div {...fadeIn("cta")}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg, #7c3aed, #2563eb)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 28, margin: "0 auto 24px" }}>$</div>
          <h2 style={{ ...s.sectionTitle, marginBottom: 16 }}>Ready to go on-chain?</h2>
          <p style={{ ...s.sectionSub, marginBottom: 36 }}>Start paying your team in crypto today. It takes less than 5 minutes to set up.</p>
          <button style={{ ...s.btnPrimary, fontSize: 16, padding: "16px 40px" }} onClick={onLaunch}>
            Launch PayChain →
          </button>
          <div style={{ marginTop: 20, fontSize: 13, color: "#9ca3af" }}>
            Live on Base Mainnet · Contract verified on BaseScan
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={s.footer}>
        <div style={s.logo}>
          <div style={{ ...s.logoIcon, width: 28, height: 28, fontSize: 14 }}>$</div>
          <span style={{ ...s.logoText, fontSize: 15 }}>PayChain</span>
        </div>
        <span style={s.footerText}>Built on Base · Open Source · 2025</span>
        <a href="https://basescan.org/address/0x1E6d93B4641cAFDA9e629b9bbd747aE7261BB786" target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "#7c3aed", textDecoration: "none", fontWeight: 600 }}>View Contract ↗</a>
      </footer>
    </div>
  );
}
