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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: "error"|"success", text }

  async function signInWithGoogle() {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      setMessage({ type: "error", text: error.message });
      setGoogleLoading(false);
    }
  }

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

        {/* Divider */}
        {mode !== "reset" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0" }}>
              <div style={{ flex: 1, height: 1, background: C.line }} />
              <span style={{ fontSize: 12, color: C.inkSoft, letterSpacing: 0.3 }}>or</span>
              <div style={{ flex: 1, height: 1, background: C.line }} />
            </div>

            {/* Google button */}
            <button
              onClick={signInWithGoogle}
              disabled={googleLoading || loading}
              style={{
                width: "100%", padding: "10px 0", borderRadius: 8,
                border: `1px solid ${C.line}`, background: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                fontSize: 14, fontWeight: 600, color: C.ink, cursor: "pointer",
                fontFamily: "inherit", opacity: (googleLoading || loading) ? 0.7 : 1,
              }}
            >
              {/* Google "G" SVG */}
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              {googleLoading ? "Redirecting…" : "Continue with Google"}
            </button>
          </>
        )}

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
