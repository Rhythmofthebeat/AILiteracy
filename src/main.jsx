import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./AILiteracyAcademy.jsx";
import Auth from "./Auth.jsx";
import { supabase } from "./supabase.js";

function Root() {
  const [session, setSession] = useState(null);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => setSession(session ?? null))
      .catch(() => setSession(null));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null);
      if (session) setShowAuth(false);
    });

    // Re-check session when tab regains focus (catches OAuth redirect on return)
    const onFocus = () => {
      supabase.auth.getSession()
        .then(({ data: { session } }) => setSession(session ?? null))
        .catch(() => {});
    };
    window.addEventListener("focus", onFocus);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return (
    <>
      <App
        session={session}
        onSignIn={() => setShowAuth(true)}
        onSignOut={() => supabase.auth.signOut()}
      />

      {showAuth && !session && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(14,29,34,.72)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAuth(false); }}
        >
          <Auth onClose={() => setShowAuth(false)} />
        </div>
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
