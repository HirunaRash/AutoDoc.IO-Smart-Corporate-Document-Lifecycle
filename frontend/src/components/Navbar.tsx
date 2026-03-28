import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Search, LogOut, Sun, Moon } from "lucide-react";
import { useTheme } from "@/providers";

export function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/search",    label: "AI Search",  icon: Search },
  ];

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 50,
      background: "var(--neu-bg)",
      boxShadow: "0 4px 20px var(--neu-shadow-dark), 0 -2px 8px var(--neu-shadow-light)",
      padding: "0 1.5rem",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>

        {/* Brand */}
        <Link to="/dashboard" style={{ display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none" }}>
          <div style={{
            width: 40, height: 40, borderRadius: 14,
            background: "var(--neu-bg)",
            boxShadow: "var(--shadow-raised-sm)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 9,
              background: "linear-gradient(145deg, #7c74ff, #5a52e0)",
              boxShadow: "3px 3px 7px rgba(108,99,255,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M9 12h6M9 16h6M9 8h3" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <path d="M5 4h10l4 4v13a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" stroke="white" strokeWidth="2"/>
                <path d="M15 4v4h4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
          <span style={{ fontWeight: 900, fontSize: "1.1rem", color: "var(--neu-text)", letterSpacing: "-0.02em" }}>
            AutoDoc<span style={{ color: "#6c63ff" }}>.IO</span>
          </span>
        </Link>

        {/* Links + actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} to={href} style={{ textDecoration: "none" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.55rem 1.1rem", borderRadius: 14,
                  fontSize: "0.85rem", fontWeight: 700,
                  color: active ? "#6c63ff" : "var(--neu-text-muted)",
                  background: "var(--neu-bg)",
                  boxShadow: active ? "var(--shadow-inset)" : "var(--shadow-raised-sm)",
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                }}>
                  <Icon size={15} />
                  {label}
                </div>
              </Link>
            );
          })}

          {/* AI badge */}
          <div style={{
            display: "flex", alignItems: "center", gap: "0.4rem",
            padding: "0.45rem 0.85rem", borderRadius: 99,
            background: "var(--neu-bg)",
            boxShadow: "var(--shadow-inset-sm)",
            fontSize: "0.7rem", fontWeight: 700, color: "#6c63ff",
            marginLeft: "0.25rem",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6c63ff", boxShadow: "0 0 6px #6c63ff" }} />
            AI Active
          </div>

          {/* Dark / Light toggle */}
          <button
            onClick={toggle}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            style={{
              width: 38, height: 38, borderRadius: 12, border: "none", cursor: "pointer",
              background: "var(--neu-bg)",
              boxShadow: "var(--shadow-raised-sm)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: theme === "dark" ? "#f59e0b" : "#6c63ff",
              marginLeft: "0.15rem",
              transition: "all 0.25s ease",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-inset-sm)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-raised-sm)"; }}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <div style={{ width: 1, height: 24, background: "var(--neu-shadow-dark)", margin: "0 0.4rem" }} />

          {/* Logout */}
          <button
            onClick={() => { localStorage.removeItem("token"); navigate("/"); }}
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.55rem 1rem", borderRadius: 14,
              fontSize: "0.82rem", fontWeight: 700, color: "var(--neu-text-muted)",
              background: "var(--neu-bg)", border: "none", cursor: "pointer",
              boxShadow: "var(--shadow-raised-sm)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#ef4444"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = ""; }}
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
