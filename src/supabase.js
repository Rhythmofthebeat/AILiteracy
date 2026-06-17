import { createClient } from "@supabase/supabase-js";

// Anon key is a public client credential — safe to ship in client code.
// Override via VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY if needed.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  || "https://ipyseagsvyrgzargpkac.supabase.co";

const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlweXNlYWdzdnlyZ3phcmdwa2FjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2NTA0NjQsImV4cCI6MjA5NzIyNjQ2NH0.mtTiazw2sT0DuXGJKU5y7Ab8ZbodXfZy8PaRD9kLRGg";

export const supabase = createClient(supabaseUrl, supabaseKey);
