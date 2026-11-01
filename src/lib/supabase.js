import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** null when the project isn't configured yet (no .env) — the app then shows setup instructions. */
export const supabase = url && anonKey ? createClient(url, anonKey) : null;

/** Where Supabase sends users back after email confirmation / password reset. */
export const redirectUrl = () => window.location.origin + window.location.pathname;
