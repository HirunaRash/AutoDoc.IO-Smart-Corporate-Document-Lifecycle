import { useState } from "react";
import { semanticSearch, SearchResult, DocumentCategory } from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import {
  Search, Sparkles, FileText, ChevronDown, ChevronUp,
  Gavel, BarChart2, Code2, Users, Briefcase, Globe, ArrowRight,
} from "lucide-react";

/* ── Category filter circles ───────────────────────────────── */
const CAT_CIRCLES = [
  { label: "All",       value: "" as const,          icon: Globe,     color: "#6c63ff" },
  { label: "Legal",     value: "legal" as const,      icon: Gavel,     color: "#7c3aed" },
  { label: "Finance",   value: "financial" as const,  icon: BarChart2, color: "#059669" },
  { label: "Technical", value: "technical" as const,  icon: Code2,     color: "#2563eb" },
  { label: "HR",        value: "hr" as const,         icon: Users,     color: "#d97706" },
  { label: "General",   value: "general" as const,    icon: Briefcase, color: "#64748b" },
] as const;

/* ── Trending question cards ────────────────────────────────── */
const CARDS = [
  {
    query: "What are the termination clauses?",
    label: "Legal · Contract",
    gradient: "linear-gradient(135deg, #7c74ff 0%, #5a52e0 100%)",
    icon: Gavel,
  },
  {
    query: "Summarize the Q4 financial results",
    label: "Finance · Report",
    gradient: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
    icon: BarChart2,
  },
  {
    query: "What are the onboarding requirements?",
    label: "HR · Policy",
    gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    icon: Users,
  },
  {
    query: "List all compliance obligations",
    label: "Legal · Compliance",
    gradient: "linear-gradient(135deg, #22c55e 0%, #15803d 100%)",
    icon: FileText,
  },
];

export default function SearchPage() {
  const [query,    setQuery]    = useState("");
  const [category, setCategory] = useState<DocumentCategory | "">("");
  const [results,  setResults]  = useState<SearchResult[]>([]);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [searched, setSearched] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function doSearch(q = query) {
    if (!q.trim()) return;
    setQuery(q); setLoading(true); setSearched(true); setResults([]); setAiAnswer(null);
    try {
      const res = await semanticSearch(q, 8, category || undefined);
      setResults(res.results);
      setAiAnswer(res.ai_answer ?? null);
    } catch {
      setAiAnswer("Search failed. Make sure the backend is running.");
    } finally { setLoading(false); }
  }

  const scoreColor = (s: number) =>
    s >= 80 ? { bg: "#dcfce7", color: "#16a34a" }
    : s >= 60 ? { bg: "#fef9c3", color: "#92400e" }
    : { bg: "var(--neu-bg-dark)", color: "var(--neu-text-muted)" };

  return (
    <div style={{ minHeight: "100vh", background: "var(--neu-bg)" }}>
      <Navbar />

      <main style={{ maxWidth: 860, margin: "0 auto", padding: "2rem 1.5rem" }}>

        {/* ══ HERO (only when not yet searched) ══════════════════ */}
        {!searched && (
          <div className="animate-fade-up" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "1rem 0 2rem" }}>

            {/* Concentric neumorphic rings */}
            <div style={{ position: "relative", width: 200, height: 200, marginBottom: "2rem", flexShrink: 0 }}>
              {/* Outer raised ring */}
              <div className="animate-pulse-ring" style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                background: "var(--neu-bg)",
                boxShadow: "var(--shadow-raised-lg)",
              }} />
              {/* Middle inset ring */}
              <div style={{
                position: "absolute", inset: 26, borderRadius: "50%",
                background: "var(--neu-bg)",
                boxShadow: "var(--shadow-inset)",
              }} />
              {/* Inner raised ring */}
              <div style={{
                position: "absolute", inset: 54, borderRadius: "50%",
                background: "var(--neu-bg)",
                boxShadow: "var(--shadow-raised)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {/* Gradient orb */}
                <div className="animate-float" style={{
                  width: 62, height: 62, borderRadius: "50%",
                  background: "linear-gradient(145deg, #7c74ff, #5a52e0)",
                  boxShadow: "8px 8px 20px rgba(108,99,255,0.5), -4px -4px 12px rgba(255,255,255,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Sparkles size={26} color="white" />
                </div>
              </div>
            </div>

            <div style={{ textAlign: "center", maxWidth: 500 }}>
              <p style={{ fontSize: "0.65rem", fontWeight: 700, color: "#6c63ff", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 10 }}>
                Semantic AI Search
              </p>
              <h1 style={{ fontSize: "2.4rem", fontWeight: 900, color: "var(--neu-text)", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 10 }}>
                Ask Anything
              </h1>
              <p style={{ color: "var(--neu-text-muted)", fontSize: "0.9rem", lineHeight: 1.6 }}>
                Powered by vector embeddings — search across every document you&apos;ve uploaded
              </p>
            </div>
          </div>
        )}

        {/* ══ SEARCH BAR ═════════════════════════════════════════ */}
        <form
          onSubmit={(e) => { e.preventDefault(); doSearch(); }}
          className={searched ? "" : "animate-fade-up stagger-1"}
          style={{
            background: "var(--neu-bg)",
            borderRadius: 22, padding: "0.45rem",
            display: "flex", gap: "0.4rem",
            marginBottom: "1.5rem",
            boxShadow: "var(--shadow-raised)",
          }}
        >
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.75rem", padding: "0 0.85rem" }}>
            <Search size={17} style={{ color: "var(--neu-text-light)", flexShrink: 0 }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. What are the key deliverables in the contract?"
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                fontSize: "0.9rem", color: "var(--neu-text)", padding: "0.75rem 0",
              }}
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as DocumentCategory | "")}
            style={{
              background: "var(--neu-bg)", border: "none", outline: "none",
              borderRadius: 16, padding: "0 0.85rem",
              fontSize: "0.82rem", color: "var(--neu-text-muted)", fontWeight: 600,
              boxShadow: "var(--shadow-inset-sm)", cursor: "pointer",
            }}
          >
            <option value="">All categories</option>
            {(["legal","financial","technical","hr","marketing","operations","general"] as DocumentCategory[]).map((c) => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>

          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="neu-btn-accent"
            style={{ padding: "0.7rem 1.4rem", borderRadius: 16, border: "none", cursor: "pointer", fontSize: "0.88rem", display: "flex", alignItems: "center", gap: "0.5rem", whiteSpace: "nowrap" }}
          >
            {loading
              ? <><span style={{ width: 15, height: 15, borderRadius: "50%", border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.7s linear infinite", display: "inline-block" }} /> Searching</>
              : <><Search size={14} /> Search</>}
          </button>
        </form>

        {/* ══ PRE-SEARCH CONTENT ═════════════════════════════════ */}
        {!searched && (
          <>
            {/* Category circles — like Monthly Ranking */}
            <div className="animate-fade-up stagger-2" style={{ marginBottom: "2.5rem" }}>
              <p style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--neu-text-light)", letterSpacing: "0.15em", textTransform: "uppercase", textAlign: "center", marginBottom: "1.25rem" }}>
                Filter by Category
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem", flexWrap: "wrap" }}>
                {CAT_CIRCLES.map(({ label, value, icon: Icon, color }) => {
                  const active = category === value;
                  return (
                    <button
                      key={label}
                      onClick={() => setCategory(value)}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.55rem", background: "none", border: "none", cursor: "pointer" }}
                    >
                      <div style={{
                        width: 58, height: 58, borderRadius: "50%",
                        background: active ? `linear-gradient(145deg, ${color}dd, ${color}aa)` : "var(--neu-bg)",
                        boxShadow: active ? `inset 3px 3px 8px rgba(0,0,0,0.2), inset -2px -2px 5px rgba(255,255,255,0.1), 0 0 0 3px ${color}44` : "var(--shadow-raised)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.25s ease",
                      }}>
                        <Icon size={22} style={{ color: active ? "#fff" : color }} />
                      </div>
                      <span style={{ fontSize: "0.7rem", fontWeight: 700, color: active ? color : "var(--neu-text-muted)" }}>
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Trending question cards — like Popular Playlists */}
            <div className="animate-fade-up stagger-3" style={{ marginBottom: "2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.1rem" }}>
                <p style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--neu-text-light)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                  Trending Searches
                </p>
                <span style={{ fontSize: "0.7rem", color: "var(--neu-text-light)", fontWeight: 600 }}>Tap to search</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                {CARDS.map(({ query: q, label, gradient, icon: Icon }, i) => (
                  <button
                    key={q}
                    onClick={() => doSearch(q)}
                    className={`animate-fade-up stagger-${i + 1}`}
                    style={{
                      borderRadius: 24, padding: "1.5rem",
                      background: gradient,
                      border: "none", cursor: "pointer", textAlign: "left",
                      boxShadow: "8px 8px 24px rgba(0,0,0,0.18), -3px -3px 10px rgba(255,255,255,0.1)",
                      transition: "transform 0.25s ease, box-shadow 0.25s ease",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "12px 12px 30px rgba(0,0,0,0.25), -4px -4px 12px rgba(255,255,255,0.12)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "8px 8px 24px rgba(0,0,0,0.18), -3px -3px 10px rgba(255,255,255,0.1)";
                    }}
                  >
                    {/* Card header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 13,
                        background: "rgba(255,255,255,0.2)",
                        backdropFilter: "blur(8px)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Icon size={18} color="white" />
                      </div>
                      <ArrowRight size={16} color="rgba(255,255,255,0.6)" />
                    </div>
                    {/* Query text */}
                    <p style={{ fontWeight: 700, fontSize: "0.88rem", color: "#fff", lineHeight: 1.45, marginBottom: "0.6rem" }}>
                      {q}
                    </p>
                    <p style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.6)", fontWeight: 600, letterSpacing: "0.05em" }}>
                      {label}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ══ LOADING SKELETONS ══════════════════════════════════ */}
        {loading && (
          <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ background: "var(--neu-bg)", borderRadius: 20, padding: "1.25rem", boxShadow: "var(--shadow-raised)", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div className="skeleton" style={{ height: 14, width: "55%", borderRadius: 8 }} />
                <div className="skeleton" style={{ height: 12, width: "35%", borderRadius: 8 }} />
                <div className="skeleton" style={{ height: 60, borderRadius: 12 }} />
              </div>
            ))}
          </div>
        )}

        {/* ══ AI ANSWER ══════════════════════════════════════════ */}
        {!loading && aiAnswer && (
          <div className="animate-fade-up" style={{
            borderRadius: 22, padding: "1.4rem", marginBottom: "1.25rem",
            background: "var(--neu-bg)",
            boxShadow: "var(--shadow-inset)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.85rem" }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: "linear-gradient(145deg, #7c74ff, #5a52e0)",
                boxShadow: "3px 3px 8px rgba(108,99,255,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Sparkles size={14} color="#fff" />
              </div>
              <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#6c63ff", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                AI Answer
              </span>
            </div>
            <p style={{ fontSize: "0.9rem", color: "var(--neu-text)", lineHeight: 1.75, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{aiAnswer}</p>
          </div>
        )}

        {/* ══ RESULTS ════════════════════════════════════════════ */}
        {!loading && searched && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {results.length === 0 ? (
              <div className="animate-fade-up" style={{
                textAlign: "center", padding: "4rem 0",
                background: "var(--neu-bg)", borderRadius: 24,
                boxShadow: "var(--shadow-inset)",
              }}>
                <div style={{
                  width: 72, height: 72, borderRadius: "50%", margin: "0 auto 1.25rem",
                  background: "var(--neu-bg)", boxShadow: "var(--shadow-raised)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Search size={30} style={{ color: "var(--neu-text-light)" }} />
                </div>
                <p style={{ fontWeight: 700, color: "var(--neu-text-muted)", fontSize: "1rem" }}>No matching documents</p>
                <p style={{ color: "var(--neu-text-light)", fontSize: "0.82rem", marginTop: 6 }}>Try uploading more documents or changing the query</p>
              </div>
            ) : (
              <>
                {/* Results header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                  <p style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--neu-text-light)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                    {results.length} result{results.length !== 1 ? "s" : ""} found
                  </p>
                  <button
                    onClick={() => { setSearched(false); setQuery(""); setResults([]); setAiAnswer(null); }}
                    style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6c63ff", background: "none", border: "none", cursor: "pointer" }}
                  >
                    ← New search
                  </button>
                </div>

                {results.map((r, i) => {
                  const id     = `${r.document_id}-${i}`;
                  const isOpen = expanded === id;
                  const score  = Math.round(r.score * 100);
                  const sc     = scoreColor(score);
                  return (
                    <div
                      key={id}
                      className="animate-fade-up"
                      style={{ animationDelay: `${i * 0.05}s`,
                        background: "var(--neu-bg)", borderRadius: 20, padding: "1.25rem",
                        boxShadow: "var(--shadow-raised)",
                        transition: "box-shadow 0.25s, transform 0.25s",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "12px 12px 28px var(--neu-shadow-dark), -12px -12px 28px var(--neu-shadow-light)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-raised)"; (e.currentTarget as HTMLElement).style.transform = "none"; }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem", marginBottom: "1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
                          <div style={{
                            width: 42, height: 42, borderRadius: 13, flexShrink: 0,
                            background: "var(--neu-bg)",
                            boxShadow: "var(--shadow-raised-sm)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <FileText size={18} style={{ color: "#6c63ff" }} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontWeight: 800, color: "var(--neu-text)", fontSize: "0.88rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {r.document_name}
                            </p>
                            {r.category && (
                              <p style={{ color: "var(--neu-text-light)", fontSize: "0.7rem", marginTop: 2, textTransform: "capitalize" }}>
                                {r.category}
                              </p>
                            )}
                          </div>
                        </div>
                        <span style={{
                          fontSize: "0.72rem", fontWeight: 800, padding: "0.3rem 0.8rem", borderRadius: 99, flexShrink: 0,
                          background: sc.bg, color: sc.color,
                          boxShadow: "inset 2px 2px 5px rgba(0,0,0,0.06), inset -2px -2px 5px rgba(255,255,255,0.5)",
                        }}>{score}% match</span>
                      </div>

                      <button onClick={() => setExpanded(isOpen ? null : id)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.68rem", fontWeight: 700, color: "var(--neu-text-light)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                          Excerpt {isOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                        </div>
                        <div style={{
                          borderRadius: 14, padding: "0.85rem 1rem",
                          background: "var(--neu-bg)",
                          boxShadow: "var(--shadow-inset-sm)",
                          borderLeft: "3px solid #6c63ff",
                          overflow: "hidden",
                        }}>
                          <p style={{
                            fontSize: "0.83rem", color: "var(--neu-text-muted)", lineHeight: 1.65,
                            wordBreak: "break-word",
                            maxHeight: isOpen ? "none" : "3.3em",
                            overflow: "hidden",
                          }}>{r.chunk_text}</p>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
