import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = axios.create({ baseURL: `${API_URL}/api` });

// Attach JWT token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auth ──────────────────────────────────────────────────────────────────────
export async function register(email: string, password: string, full_name?: string) {
  const { data } = await api.post("/auth/register", { email, password, full_name });
  return data;
}

export async function login(email: string, password: string): Promise<{ access_token: string }> {
  const { data } = await api.post("/auth/login", { email, password });
  return data;
}

// ── Documents ─────────────────────────────────────────────────────────────────
export async function uploadDocument(file: File) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post("/documents/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function listDocuments(skip = 0, limit = 20) {
  const { data } = await api.get("/documents/", { params: { skip, limit } });
  return data as { total: number; items: DocumentOut[] };
}

export async function getDocument(id: string) {
  const { data } = await api.get(`/documents/${id}`);
  return data as DocumentOut;
}

export async function getDocumentStatus(id: string) {
  const { data } = await api.get(`/documents/${id}/status`);
  return data as PipelineStatus;
}

export async function deleteDocument(id: string) {
  await api.delete(`/documents/${id}`);
}

// ── Search ────────────────────────────────────────────────────────────────────
export async function semanticSearch(query: string, top_k = 5, category_filter?: string) {
  const { data } = await api.post("/search/", { query, top_k, category_filter: category_filter || null });
  return data as SearchResponse;
}

// ── Types ─────────────────────────────────────────────────────────────────────
export type DocumentStatus = "pending" | "processing" | "ready" | "failed";
export type DocumentCategory = "legal" | "financial" | "technical" | "hr" | "marketing" | "operations" | "general";

export interface DocumentOut {
  id: string;
  filename: string;
  original_name: string;
  file_type: string;
  file_size: number;
  s3_url?: string;
  status: DocumentStatus;
  category?: DocumentCategory;
  summary?: string;
  key_topics?: string[];
  owner_id: string;
  created_at: string;
  updated_at?: string;
  processed_at?: string;
  error_message?: string;
}

export interface PipelineStatus {
  document_id: string;
  status: DocumentStatus;
  message: string;
  progress: number;
}

export interface SearchResult {
  document_id: string;
  document_name: string;
  category?: string;
  score: number;
  chunk_text: string;
  summary?: string;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  ai_answer?: string;
}
