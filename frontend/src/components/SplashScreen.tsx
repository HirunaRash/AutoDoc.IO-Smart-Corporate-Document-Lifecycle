import { useEffect, useState } from "react";

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), 400);
    const t2 = setTimeout(() => setPhase("out"),  2400);
    const t3 = setTimeout(() => onDone(),          2900);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{
        background: "#e4e9f0",
        transition: "opacity 0.5s ease",
        opacity: phase === "out" ? 0 : 1,
        pointerEvents: phase === "out" ? "none" : "all",
      }}
    >
      <div
        style={{
          transition: "opacity 0.6s ease, transform 0.6s ease",
          opacity:    phase === "in" ? 0 : 1,
          transform:  phase === "in" ? "translateY(24px) scale(0.95)" : "translateY(0) scale(1)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "2rem",
        }}
      >
        {/* Outer ring */}
        <div style={{
          width: 160, height: 160, borderRadius: "50%",
          background: "#e4e9f0",
          boxShadow: "16px 16px 40px rgba(163,177,198,0.7), -16px -16px 40px rgba(255,255,255,0.9)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {/* Inner icon circle */}
          <div style={{
            width: 110, height: 110, borderRadius: "50%",
            boxShadow: "inset 6px 6px 16px rgba(163,177,198,0.65), inset -6px -6px 16px rgba(255,255,255,0.85)",
            background: "#e4e9f0",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {/* Accent icon */}
            <div style={{
              width: 72, height: 72, borderRadius: "22px",
              background: "linear-gradient(145deg, #7c74ff, #5a52e0)",
              boxShadow: "6px 6px 16px rgba(108,99,255,0.45), -3px -3px 8px rgba(255,255,255,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: "float 3s ease-in-out infinite",
            }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                <path d="M9 12h6M9 16h6M9 8h3" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
                <path d="M5 4h10l4 4v13a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" stroke="white" strokeWidth="2.2"/>
                <path d="M15 4v4h4" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Brand name */}
        <div style={{ textAlign: "center" }}>
          <h1 style={{
            fontSize: "2.8rem", fontWeight: 900, letterSpacing: "-0.03em",
            color: "#44476a",
            textShadow: "2px 2px 4px rgba(163,177,198,0.5), -1px -1px 3px rgba(255,255,255,0.9)",
          }}>
            AutoDoc<span style={{ color: "#6c63ff" }}>.IO</span>
          </h1>
          <p style={{ color: "#8890a4", fontSize: "0.75rem", letterSpacing: "0.2em", marginTop: "0.4rem", textTransform: "uppercase", fontWeight: 600 }}>
            Smart Document Lifecycle
          </p>
        </div>

        {/* Loading bar */}
        <div style={{
          width: 200, height: 6, borderRadius: 99,
          boxShadow: "inset 3px 3px 7px rgba(163,177,198,0.65), inset -3px -3px 7px rgba(255,255,255,0.85)",
          background: "#e4e9f0",
          overflow: "hidden",
        }}>
          <div style={{
            height: "100%", borderRadius: 99,
            background: "linear-gradient(90deg, #6c63ff, #a78bfa)",
            transition: "width 2s ease",
            width: phase === "in" ? "0%" : "100%",
            boxShadow: "0 0 8px rgba(108,99,255,0.5)",
          }} />
        </div>

        <p style={{ color: "#b2b8cc", fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 600 }}>
          Initializing AI Engine…
        </p>
      </div>
    </div>
  );
}
