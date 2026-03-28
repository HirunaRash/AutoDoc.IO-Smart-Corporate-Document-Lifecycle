import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, register } from "@/lib/api";
import { SplashScreen } from "@/components/SplashScreen";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/providers";

function NeuInput({ label, type = "text", placeholder, value, onChange, required }: {
  label: string; type?: string; placeholder: string;
  value: string; onChange: (v: string) => void; required?: boolean;
}) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: "var(--neu-text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.6rem" }}>
        {label}
      </label>
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="neu-input"
        style={{ width: "100%", padding: "0.85rem 1.1rem", borderRadius: "14px", fontSize: "0.9rem" }}
      />
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const [showSplash, setShowSplash] = useState(true);
  const [isRegister, setIsRegister] = useState(false);
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      if (isRegister) await register(email, password, fullName);
      const { access_token } = await login(email, password);
      localStorage.setItem("token", access_token);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Connection failed. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
      <div style={{ minHeight: "100vh", background: "var(--neu-bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", position: "relative" }}>
        <button onClick={toggle} style={{ position: "absolute", top: "1.5rem", right: "1.5rem", width: 42, height: 42, borderRadius: 14, border: "none", cursor: "pointer", background: "var(--neu-bg)", boxShadow: "var(--shadow-raised-sm)", display: "flex", alignItems: "center", justifyContent: "center", color: theme === "dark" ? "#f59e0b" : "#6c63ff" }}>
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div className="animate-fade-up" style={{ width: "100%", maxWidth: 460 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "2.5rem", gap: "1rem" }}>
            <div style={{ width: 56, height: 56, borderRadius: 18, background: "var(--neu-bg)", boxShadow: "var(--shadow-raised)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: "linear-gradient(145deg, #7c74ff, #5a52e0)", boxShadow: "4px 4px 10px rgba(108,99,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12h6M9 16h6M9 8h3" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M5 4h10l4 4v13a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" stroke="white" strokeWidth="2"/>
                  <path d="M15 4v4h4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
            <div>
              <h1 style={{ fontSize: "1.6rem", fontWeight: 900, color: "var(--neu-text)", letterSpacing: "-0.02em", lineHeight: 1 }}>AutoDoc<span style={{ color: "#6c63ff" }}>.IO</span></h1>
              <p style={{ fontSize: "0.65rem", color: "var(--neu-text-muted)", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 600 }}>Smart Document Lifecycle</p>
            </div>
          </div>
          <div style={{ background: "var(--neu-bg)", borderRadius: 28, padding: "2.5rem", boxShadow: "var(--shadow-raised-lg)" }}>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem", padding: "0.4rem", borderRadius: 16, boxShadow: "var(--shadow-inset)" }}>
              {["Sign In", "Register"].map((tab, i) => {
                const active = isRegister === (i === 1);
                return (
                  <button key={tab} onClick={() => { setIsRegister(i === 1); setError(""); }} style={{ flex: 1, padding: "0.65rem", borderRadius: 12, fontSize: "0.85rem", fontWeight: 700, border: "none", cursor: "pointer", transition: "all 0.25s ease", ...(active ? { background: "linear-gradient(145deg, #7c74ff, #5a52e0)", color: "#fff", boxShadow: "4px 4px 12px rgba(108,99,255,0.4)" } : { background: "transparent", color: "var(--neu-text-muted)" }) }}>{tab}</button>
                );
              })}
            </div>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              {isRegister && <div className="animate-fade-up"><NeuInput label="Full Name" placeholder="Your Name" value={fullName} onChange={setFullName} /></div>}
              <NeuInput label="Email Address" type="email" placeholder="you@company.com" value={email} onChange={setEmail} required />
              <NeuInput label="Password" type="password" placeholder="••••••••" value={password} onChange={setPassword} required />
              {error && <div className="animate-fade-in" style={{ padding: "0.85rem 1rem", borderRadius: 14, fontSize: "0.82rem", color: "#dc2626", background: "#fee2e2" }}>⚠️ {error}</div>}
              <button type="submit" disabled={loading} className="neu-btn-accent" style={{ width: "100%", padding: "1rem", borderRadius: 16, fontSize: "0.95rem", border: "none", cursor: loading ? "not-allowed" : "pointer", marginTop: "0.5rem" }}>
                {loading ? "Processing…" : isRegister ? "Create Account →" : "Sign In →"}
              </button>
            </form>
          </div>
          <div style={{ display: "flex", gap: "0.6rem", justifyContent: "center", marginTop: "2rem", flexWrap: "wrap" }}>
            {["🧠 AI Classification", "⚡ Auto Summary", "🔍 Semantic Search"].map((f) => (
              <span key={f} style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--neu-text-muted)", padding: "0.4rem 0.85rem", borderRadius: 99, background: "var(--neu-bg)", boxShadow: "var(--shadow-raised-sm)" }}>{f}</span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
