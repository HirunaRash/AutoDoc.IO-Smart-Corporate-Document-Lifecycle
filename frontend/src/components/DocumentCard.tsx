"use client";
import { DocumentOut, deleteDocument } from "@/lib/api";
import { FileText, Trash2, Clock, CheckCircle, AlertCircle, Loader2, Tag } from "lucide-react";

const CAT_COLOR: Record<string, string> = {
  legal: "#7c3aed", financial: "#059669", technical: "#2563eb",
  hr: "#d97706", marketing: "#db2777", operations: "#ea580c", general: "#6b7280",
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; badgeClass: string }> = {
  pending:    { label: "Queued",       icon: <Clock size={12} />,    badgeClass: "badge-pending" },
  processing: { label: "Processing…",  icon: <Loader2 size={12} className="animate-spin" />, badgeClass: "badge-processing" },
  ready:      { label: "Ready",        icon: <CheckCircle size={12} />, badgeClass: "badge-ready" },
  failed:     { label: "Failed",       icon: <AlertCircle size={12} />, badgeClass: "badge-failed" },
};

interface Props { doc: DocumentOut; onDeleted: () => void; }

export function DocumentCard({ doc, onDeleted }: Props) {
  const sizeKB   = (doc.file_size / 1024).toFixed(1);
  const status   = STATUS_CONFIG[doc.status] ?? STATUS_CONFIG.pending;
  const catColor = CAT_COLOR[doc.category ?? "general"] ?? "#6b7280";

  async function handleDelete() {
    if (!confirm(`Delete "${doc.original_name}"?`)) return;
    try {
      await deleteDocument(doc.id);
      onDeleted();
    } catch {
      alert("Failed to delete document. Please try again.");
    }
  }

  return (
    <div
      className="animate-fade-up"
      style={{
        background: "var(--neu-bg)",
        borderRadius: 24, padding: "1.4rem",
        boxShadow: "var(--shadow-raised)",
        display: "flex", flexDirection: "column", gap: "1rem",
        transition: "box-shadow 0.25s ease, transform 0.25s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "12px 12px 28px var(--neu-shadow-dark), -12px -12px 28px var(--neu-shadow-light)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-raised)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", minWidth: 0 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 15, flexShrink: 0,
            background: "var(--neu-bg)",
            boxShadow: "var(--shadow-raised-sm)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <FileText size={22} style={{ color: "#6c63ff" }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontWeight: 800, color: "var(--neu-text)", fontSize: "0.88rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {doc.original_name}
            </p>
            <p style={{ color: "var(--neu-text-light)", fontSize: "0.72rem", marginTop: 2 }}>
              {sizeKB} KB · {doc.file_type.toUpperCase()}
            </p>
          </div>
        </div>

        <button
          onClick={handleDelete}
          style={{
            width: 32, height: 32, borderRadius: 10, border: "none", flexShrink: 0,
            background: "var(--neu-bg)", cursor: "pointer",
            boxShadow: "var(--shadow-raised-sm)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--neu-text-light)", transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#ef4444"; (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-inset-sm)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = ""; (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-raised-sm)"; }}
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Status + Category */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <span className={status.badgeClass} style={{
          display: "inline-flex", alignItems: "center", gap: "0.35rem",
          fontSize: "0.72rem", fontWeight: 700, padding: "0.3rem 0.75rem", borderRadius: 99,
        }}>
          {status.icon} {status.label}
        </span>
        {doc.category && (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "0.4rem",
            fontSize: "0.72rem", fontWeight: 700, padding: "0.3rem 0.75rem", borderRadius: 99,
            color: catColor, background: "var(--neu-bg)",
            boxShadow: "var(--shadow-inset-sm)",
            textTransform: "capitalize",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: catColor }} />
            {doc.category}
          </span>
        )}
      </div>

      {/* Summary */}
      {doc.summary && (
        <div style={{
          padding: "0.75rem 1rem", borderRadius: 14,
          boxShadow: "var(--shadow-inset-sm)",
          background: "var(--neu-bg)",
        }}>
          <p style={{ fontSize: "0.78rem", color: "var(--neu-text-muted)", lineHeight: 1.6,
            display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {doc.summary}
          </p>
        </div>
      )}

      {/* Topics */}
      {doc.key_topics && doc.key_topics.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
          {doc.key_topics.slice(0, 5).map((t) => (
            <span key={t} style={{
              display: "inline-flex", alignItems: "center", gap: "0.3rem",
              fontSize: "0.68rem", fontWeight: 700, padding: "0.25rem 0.65rem", borderRadius: 99,
              color: "#6c63ff", background: "var(--neu-bg)",
              boxShadow: "var(--shadow-raised-sm)",
            }}>
              <Tag size={9} /> {t}
            </span>
          ))}
        </div>
      )}

      {doc.error_message && (
        <p style={{ fontSize: "0.75rem", color: "#dc2626", padding: "0.6rem 0.85rem", borderRadius: 12,
          background: "#fee2e2", boxShadow: "inset 2px 2px 6px rgba(220,38,38,0.1), inset -2px -2px 6px rgba(255,255,255,0.7)" }}>
          {doc.error_message}
        </p>
      )}

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
        paddingTop: "0.75rem", borderTop: "1px solid var(--neu-shadow-dark)" }}>
        <span style={{ fontSize: "0.7rem", color: "var(--neu-text-light)" }}>
          {new Date(doc.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
        {doc.status === "ready" && (
          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#16a34a", display: "flex", alignItems: "center", gap: 4 }}>
            <CheckCircle size={11} /> Indexed
          </span>
        )}
      </div>
    </div>
  );
}
