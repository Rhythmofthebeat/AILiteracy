import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./AILiteracyAcademy.jsx";
import Auth from "./Auth.jsx";
import { supabase } from "./supabase.js";

function Root() {
  const [session, setSession] = useState(undefined); // undefined = loading
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) setShowAuth(false); // close modal on sign-in
    });
    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) return null;

  return (
    <>
      <App session={session} onSignIn={() => setShowAuth(true)} />

      {/* Auth modal */}
      {showAuth && !session && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(14,29,34,.72)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAuth(false); }}
        >
          <Auth onClose={() => setShowAuth(false)} />
        </div>
      )}

      {/* Floating sign-in / sign-out */}
      {session ? (
        <button
          onClick={() => supabase.auth.signOut()}
          style={{ position: "fixed", bottom: 20, right: 20, padding: "8px 14px", borderRadius: 8, border: "none", background: "#E3EAE8", color: "#4A5C66", fontSize: 13, fontWeight: 600, cursor: "pointer", zIndex: 9999, fontFamily: "inherit" }}
        >
          Sign out
        </button>
      ) : (
        <button
          onClick={() => setShowAuth(true)}
          style={{ position: "fixed", bottom: 20, right: 20, padding: "8px 16px", borderRadius: 8, border: "none", background: "#0F6B66", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", zIndex: 9999, fontFamily: "inherit" }}
        >
          Sign in
        </button>
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
