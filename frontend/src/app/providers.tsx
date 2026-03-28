"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect, createContext, useContext } from "react";

/* ── Theme context ─────────────────────────────────────────── */
type Theme = "light" | "dark";

const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "light",
  toggle: () => {},
});

export const useTheme = () => useContext(ThemeCtx);

/* ── Providers ─────────────────────────────────────────────── */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000 } },
  }));

  const [theme, setTheme] = useState<Theme>("light");

  // Restore saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null;
    if (saved === "dark" || saved === "light") setTheme(saved);
  }, []);

  // Apply theme to <html data-theme="...">
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <ThemeCtx.Provider value={{ theme, toggle: () => setTheme(t => t === "light" ? "dark" : "light") }}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ThemeCtx.Provider>
  );
}
