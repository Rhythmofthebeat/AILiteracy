import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fallback stub so the app renders even if env vars aren't set yet
const stub = {
  auth: {
    getSession: async () => ({ data: { session: null } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: async () => ({ error: new Error("Supabase not configured") }),
    signUp: async () => ({ error: new Error("Supabase not configured") }),
    resetPasswordForEmail: async () => ({ error: new Error("Supabase not configured") }),
    signInWithOAuth: async () => ({ error: new Error("Supabase not configured") }),
    signOut: async () => {},
  },
};

export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : stub;
