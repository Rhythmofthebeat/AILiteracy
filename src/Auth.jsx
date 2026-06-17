import React, { useState } from "react";
import { supabase } from "./supabase";

const C = {
  paper: "#F7FAF9", card: "#FFFFFF", ink: "#14232B", inkSoft: "#4A5C66",
  teal: "#0F6B66", tealSoft: "#E2F0EE", amber: "#E8A33D", amberSoft: "#FBEFD9",
  line: "#E3EAE8", red: "#C24B3A",
};

const inp = {
  display: "block", width: "100%", padding: "10px 12px",
  border: `1px solid ${C.line}`, borderRadius: 8,
  fontSize: 15, color: C.ink, background: C.card,
  outline: "none", boxSizing: "border-box",
  fontFamily: "inherit",
};

const btn = {
  width: "100%", padding: "11px 0", borderRadius: 8, border: "none",
  background: C.teal, color: "#fff", fontSize: 15, fontWeight: 600,
  cursor: "pointer", letterSpacing: 0.2,
};

export default function Auth({ onClose }) {
  const [mode, setMode]       = useState("login"); // "login" | "signup" | "reset"
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: "error"|"success", text }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage({ type: "success", text: "Check your email for a confirmation link!" });
      } else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // session change triggers App re-render via onAuthStateChange
      } else if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setMessage({ type: "success", text: "Password reset email sent — check your inbox." });
      }
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  }

  const titles = { login: "Sign in", signup: "Create account", reset: "Reset password" };

  const card = (
    <div style={{
      background: C.card, borderRadius: 16, padding: "40px 36px",
      width: "100%", maxWidth: 400, boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
      position: "relative", fontFamily: "'Inter', 'Segoe UI', sans-serif",
    }}>
      {onClose && (
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 16, background: "none", border: "none", fontSize: 22, color: C.inkSoft, cursor: "pointer", lineHeight: 1, padding: "0 4px" }}>
          ×
        </button>
      )}
        {/* Logo / wordmark */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 48, height: 48, borderRadius: 12,
            background: C.teal, marginBottom: 12,
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{ fontWeight: 700, fontSize: 18, color: C.ink, lineHeight: 1.2 }}>
            AI Literacy Academy
          </div>
          <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 4 }}>
            {titles[mode]}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.inkSoft, display: "block", marginBottom: 5 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              style={inp}
            />
          </div>

          {mode !== "reset" && (
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.inkSoft, display: "block", marginBottom: 5 }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder={mode === "signup" ? "At least 6 characters" : "••••••••"}
                minLength={6}
                style={inp}
              />
            </div>
          )}

          {message && (
            <div style={{
              padding: "10px 12px", borderRadius: 8, fontSize: 13,
              background: message.type === "error" ? "#FEF2F2" : C.tealSoft,
              color: message.type === "error" ? C.red : C.teal,
              border: `1px solid ${message.type === "error" ? "#FECACA" : "#A7D7D4"}`,
            }}>
              {message.text}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            ...btn,
            opacity: loading ? 0.7 : 1,
            marginTop: 4,
          }}>
            {loading ? "Please wait…" : titles[mode]}
          </button>
        </form>

        {/* Mode switchers */}
        <div style={{ marginTop: 20, textAlign: "center", fontSize: 13, color: C.inkSoft }}>
          {mode === "login" && (
            <>
              <span>No account? </span>
              <button onClick={() => { setMode("signup"); setMessage(null); }}
                style={{ background: "none", border: "none", color: C.teal, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
                Sign up
              </button>
              <span style={{ margin: "0 8px" }}>·</span>
              <button onClick={() => { setMode("reset"); setMessage(null); }}
                style={{ background: "none", border: "none", color: C.inkSoft, cursor: "pointer", fontSize: 13 }}>
                Forgot password?
              </button>
            </>
          )}
          {mode === "signup" && (
            <>
              <span>Already have an account? </span>
              <button onClick={() => { setMode("login"); setMessage(null); }}
                style={{ background: "none", border: "none", color: C.teal, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
                Sign in
              </button>
            </>
          )}
          {mode === "reset" && (
            <button onClick={() => { setMode("login"); setMessage(null); }}
              style={{ background: "none", border: "none", color: C.teal, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
              Back to sign in
            </button>
          )}
        </div>
    </div>
  );

  if (onClose) return card;

  return (
    <div style={{
      minHeight: "100vh", background: C.paper,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter', 'Segoe UI', sans-serif", padding: 16,
    }}>
      {card}
    </div>
  );
}
