import { useState, useRef, DragEvent } from "react";
import { uploadDocument } from "@/lib/api";
import { Upload, X, FileText, CheckCircle } from "lucide-react";

interface Props { onClose: () => void; onUploaded: () => void; }

export function UploadModal({ onClose, onUploaded }: Props) {
  const [file,      setFile]      = useState<File | null>(null);
  const [dragging,  setDragging]  = useState(false);
  const [uploading, setUploading] = useState(false);
  const [done,      setDone]      = useState(false);
  const [error,     setError]     = useState("");
  const [progress,  setProgress]  = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: DragEvent) {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true); setError("");
    const iv = setInterval(() => setProgress((p) => Math.min(p + 10, 82)), 250);
    try {
      await uploadDocument(file);
      clearInterval(iv); setProgress(100); setDone(true);
      setTimeout(() => { onUploaded(); onClose(); }, 1600);
    } catch (err: any) {
      clearInterval(iv); setProgress(0);
      setError(err?.response?.data?.detail || "Upload failed. Check your connection.");
    } finally { setUploading(false); }
  }

  return (
    <div className="animate-fade-in" style={{
      position: "fixed", inset: 0, zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
      background: "rgba(0,0,0,0.35)", backdropFilter: "blur(8px)",
    }}>
      <div className="animate-fade-up" style={{
        background: "var(--neu-bg)",
        boxShadow: "var(--shadow-raised-lg)",
        width: "100%", maxWidth: 440, borderRadius: 28, overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ padding: "1.5rem 1.5rem 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h2 style={{ fontWeight: 800, color: "var(--neu-text)", fontSize: "1.1rem" }}>Upload Document</h2>
            <p style={{ color: "var(--neu-text-light)", fontSize: "0.75rem", marginTop: 3 }}>AI will process it automatically</p>
          </div>
          <button onClick={onClose} style={{
            width: 34, height: 34, borderRadius: 11, border: "none", cursor: "pointer",
            background: "var(--neu-bg)", color: "var(--neu-text-muted)",
            boxShadow: "var(--shadow-raised-sm)",
            display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s",
          }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* Drop zone */}
          {!file && !done && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              style={{
                borderRadius: 20, padding: "2.5rem 1rem", textAlign: "center", cursor: "pointer",
                transition: "all 0.2s ease",
                background: "var(--neu-bg)",
                boxShadow: dragging ? "var(--shadow-inset)" : "var(--shadow-inset-sm)",
                transform: dragging ? "scale(0.98)" : "scale(1)",
              }}
            >
              <input ref={inputRef} type="file" className="hidden" accept=".pdf,.docx,.doc,.txt"
                onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])} />
              <div style={{
                width: 60, height: 60, borderRadius: 18, margin: "0 auto 1rem",
                background: "var(--neu-bg)",
                boxShadow: "var(--shadow-raised)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Upload size={26} style={{ color: "#6c63ff" }} />
              </div>
              <p style={{ fontWeight: 700, color: "var(--neu-text)", fontSize: "0.9rem" }}>Drop file here</p>
              <p style={{ color: "var(--neu-text-light)", fontSize: "0.75rem", marginTop: 4 }}>
                or <span style={{ color: "#6c63ff", fontWeight: 700 }}>browse to upload</span>
              </p>
              <p style={{ color: "var(--neu-text-light)", fontSize: "0.7rem", marginTop: 10, opacity: 0.6 }}>PDF · DOCX · TXT — max 20 MB</p>
            </div>
          )}

          {/* Selected file */}
          {file && !done && (
            <div className="animate-fade-up" style={{
              borderRadius: 18, padding: "1rem 1.1rem",
              background: "var(--neu-bg)",
              boxShadow: "var(--shadow-inset-sm)",
              display: "flex", alignItems: "center", gap: "0.85rem",
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 13, flexShrink: 0,
                background: "var(--neu-bg)",
                boxShadow: "var(--shadow-raised-sm)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <FileText size={20} style={{ color: "#6c63ff" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, color: "var(--neu-text)", fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</p>
                <p style={{ color: "var(--neu-text-light)", fontSize: "0.72rem", marginTop: 2 }}>{(file.size/1024).toFixed(1)} KB</p>
              </div>
              {!uploading && (
                <button onClick={() => setFile(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--neu-text-light)" }}>
                  <X size={15} />
                </button>
              )}
            </div>
          )}

          {/* Progress */}
          {uploading && (
            <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--neu-text-muted)", fontWeight: 600 }}>
                <span>Uploading &amp; triggering AI pipeline…</span>
                <span>{progress}%</span>
              </div>
              <div style={{
                height: 8, borderRadius: 99,
                boxShadow: "var(--shadow-inset-sm)",
                background: "var(--neu-bg)", overflow: "hidden",
              }}>
                <div style={{
                  height: "100%", borderRadius: 99,
                  background: "linear-gradient(90deg, #6c63ff, #a78bfa)",
                  boxShadow: "0 0 8px rgba(108,99,255,0.5)",
                  width: `${progress}%`, transition: "width 0.3s ease",
                }} />
              </div>
            </div>
          )}

          {/* Done */}
          {done && (
            <div className="animate-fade-up" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", padding: "1.5rem 0" }}>
              <div style={{
                width: 70, height: 70, borderRadius: "50%",
                background: "var(--neu-bg)",
                boxShadow: "var(--shadow-raised)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <CheckCircle size={34} style={{ color: "#22c55e" }} />
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontWeight: 800, color: "var(--neu-text)", fontSize: "1rem" }}>Upload Complete!</p>
                <p style={{ color: "var(--neu-text-muted)", fontSize: "0.78rem", marginTop: 4 }}>✨ AI is now classifying &amp; summarizing…</p>
              </div>
            </div>
          )}

          {error && (
            <div className="animate-fade-in" style={{
              padding: "0.75rem 1rem", borderRadius: 14, fontSize: "0.8rem",
              color: "#dc2626", background: "#fee2e2",
              boxShadow: "inset 3px 3px 7px rgba(220,38,38,0.1), inset -2px -2px 5px rgba(255,255,255,0.7)",
            }}>
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Footer */}
        {!done && (
          <div style={{ padding: "0 1.5rem 1.5rem", display: "flex", gap: "0.75rem" }}>
            <button onClick={onClose} className="neu-btn" style={{
              flex: 1, padding: "0.85rem", borderRadius: 16, border: "none", cursor: "pointer", fontSize: "0.88rem",
            }}>Cancel</button>
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="neu-btn-accent"
              style={{ flex: 1, padding: "0.85rem", borderRadius: 16, border: "none", cursor: "pointer", fontSize: "0.88rem" }}
            >
              {uploading ? "Uploading…" : "Upload & Process"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
