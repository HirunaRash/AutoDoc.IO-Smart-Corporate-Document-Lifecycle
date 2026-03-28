"use client";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listDocuments, DocumentCategory } from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { DocumentCard } from "@/components/DocumentCard";
import { UploadModal } from "@/components/UploadModal";
import { Plus, FileText, CheckCircle, Loader2, FolderOpen } from "lucide-react";

const CATEGORIES: (DocumentCategory | "all")[] = [
  "all", "legal", "financial", "technical", "hr", "marketing", "operations", "general",
];

export default function DashboardPage() {
  const queryClient   = useQueryClient();
  const [showUpload, setShowUpload]         = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategory | "all">("all");

  const { data, isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: () => listDocuments(0, 50),
    refetchInterval: 6000,
  });

  const items    = data?.items ?? [];
  const filtered = categoryFilter === "all" ? items : items.filter((d) => d.category === categoryFilter);
  const stats    = {
    total:      data?.total ?? 0,
    ready:      items.filter((d) => d.status === "ready").length,
    processing: items.filter((d) => ["pending", "processing"].includes(d.status)).length,
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--neu-bg)" }}>
      <Navbar />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1.5rem" }}>

        {/* ── Header ──────────────────────────────────────────── */}
        <div className="animate-fade-up" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem" }}>
          <div>
            <p style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--neu-text-muted)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 6 }}>
              Your Workspace
            </p>
            <h1 style={{ fontSize: "2rem", fontWeight: 900, color: "var(--neu-text)", letterSpacing: "-0.025em" }}>
              Document Library
            </h1>
            <p style={{ color: "var(--neu-text-muted)", fontSize: "0.85rem", marginTop: 4 }}>AI classifies, summarizes &amp; indexes every file</p>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="neu-btn-accent"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.85rem 1.4rem", borderRadius: 18, border: "none", cursor: "pointer", fontSize: "0.9rem" }}
          >
            <Plus size={18} /> Upload Document
          </button>
        </div>

        {/* ── Stats ───────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25rem", marginBottom: "2rem" }}>
          {[
            { label: "Total Documents", value: stats.total,      icon: <FileText size={22} />,  color: "#6c63ff" },
            { label: "AI-Indexed",       value: stats.ready,      icon: <CheckCircle size={22} />, color: "#22c55e" },
            { label: "Processing",       value: stats.processing, icon: <Loader2 size={22} className={stats.processing > 0 ? "animate-spin" : ""} />, color: "#f59e0b" },
          ].map((s, i) => (
            <div
              key={s.label}
              className={`animate-fade-up stagger-${i + 1}`}
              style={{
                background: "var(--neu-bg)", borderRadius: 22, padding: "1.4rem",
                boxShadow: "var(--shadow-raised)",
                display: "flex", alignItems: "center", gap: "1rem",
                transition: "box-shadow 0.25s, transform 0.25s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "12px 12px 28px var(--neu-shadow-dark), -12px -12px 28px var(--neu-shadow-light)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-raised)"; (e.currentTarget as HTMLElement).style.transform = "none"; }}
            >
              <div style={{
                width: 52, height: 52, borderRadius: 17, flexShrink: 0,
                background: "var(--neu-bg)",
                boxShadow: "var(--shadow-raised-sm)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: s.color,
              }}>
                {s.icon}
              </div>
              <div>
                <p style={{ fontSize: "2rem", fontWeight: 900, color: "var(--neu-text)", lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: "0.78rem", color: "var(--neu-text-muted)", marginTop: 4, fontWeight: 600 }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Empty banner ─────────────────────────────────────── */}
        {stats.total === 0 && !isLoading && (
          <div className="animate-fade-up" style={{
            borderRadius: 24, padding: "2rem", marginBottom: "2rem",
            background: "var(--neu-bg)",
            boxShadow: "var(--shadow-inset)",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1.5rem",
          }}>
            <div>
              <p style={{ fontSize: "0.65rem", fontWeight: 700, color: "#6c63ff", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>
                ✦ Getting Started
              </p>
              <h3 style={{ fontWeight: 800, color: "var(--neu-text)", fontSize: "1.2rem", marginBottom: 8 }}>Upload your first document</h3>
              <p style={{ color: "var(--neu-text-muted)", fontSize: "0.83rem", maxWidth: 400, lineHeight: 1.6 }}>
                Drop any PDF, Word doc, or text file. AutoDoc.IO instantly classifies it, writes an executive summary, and makes it searchable.
              </p>
            </div>
            <div className="animate-float" style={{
              width: 72, height: 72, borderRadius: 22, flexShrink: 0,
              background: "var(--neu-bg)",
              boxShadow: "var(--shadow-raised)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <FileText size={32} style={{ color: "#6c63ff" }} />
            </div>
          </div>
        )}

        {/* ── Category filter ──────────────────────────────────── */}
        {stats.total > 0 && (
          <div className="animate-fade-up" style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
            {CATEGORIES.map((cat) => {
              const active = categoryFilter === cat;
              const count  = cat === "all" ? items.length : items.filter((d) => d.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  style={{
                    padding: "0.45rem 1rem", borderRadius: 99, border: "none", cursor: "pointer",
                    fontSize: "0.8rem", fontWeight: 700, textTransform: "capitalize",
                    transition: "all 0.2s ease",
                    ...(active ? {
                      background: "linear-gradient(145deg, #7c74ff, #5a52e0)",
                      color: "#fff",
                      boxShadow: "inset 3px 3px 7px rgba(0,0,0,0.15), inset -2px -2px 5px rgba(255,255,255,0.1)",
                    } : {
                      background: "var(--neu-bg)", color: "var(--neu-text-muted)",
                      boxShadow: "var(--shadow-raised-sm)",
                    }),
                  }}
                >
                  {cat}{cat !== "all" && count > 0 && <span style={{ marginLeft: 5, opacity: 0.7, fontSize: "0.7rem" }}>{count}</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Grid ─────────────────────────────────────────────── */}
        {isLoading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ background: "var(--neu-bg)", borderRadius: 24, padding: "1.4rem", boxShadow: "var(--shadow-raised)", display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div className="skeleton" style={{ height: 18, width: "70%", borderRadius: 8 }} />
                <div className="skeleton" style={{ height: 12, width: "45%", borderRadius: 8 }} />
                <div className="skeleton" style={{ height: 70, borderRadius: 14 }} />
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <div className="skeleton" style={{ height: 24, width: 70, borderRadius: 99 }} />
                  <div className="skeleton" style={{ height: 24, width: 85, borderRadius: 99 }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="animate-fade-up" style={{ textAlign: "center", padding: "5rem 0", color: "var(--neu-text-light)" }}>
            <FolderOpen size={52} style={{ margin: "0 auto 1rem", opacity: 0.4 }} />
            <p style={{ fontWeight: 700, color: "var(--neu-text-muted)", fontSize: "1.05rem" }}>No documents found</p>
            <p style={{ color: "var(--neu-text-light)", fontSize: "0.83rem", marginTop: 4 }}>
              {categoryFilter !== "all" ? `No ${categoryFilter} documents yet` : "Upload your first document above"}
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" }}>
            {filtered.map((doc, i) => (
              <div key={doc.id} style={{ animationDelay: `${i * 0.05}s` }}>
                <DocumentCard doc={doc} onDeleted={() => queryClient.invalidateQueries({ queryKey: ["documents"] })} />
              </div>
            ))}
          </div>
        )}
      </main>

      {showUpload && (
        <UploadModal onClose={() => setShowUpload(false)} onUploaded={() => queryClient.invalidateQueries({ queryKey: ["documents"] })} />
      )}
    </div>
  );
}
