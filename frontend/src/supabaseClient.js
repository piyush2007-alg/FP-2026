import { createClient } from '@supabase/supabase-js';

// Retrieve Supabase URL & Anon Key from Environment or LocalStorage config
export const getSupabaseConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const localUrl = localStorage.getItem('kukoo_supabase_url');
  const localKey = localStorage.getItem('kukoo_supabase_anon_key');

  const url = (localUrl || envUrl || '').trim();
  const anonKey = (localKey || envKey || '').trim();

  const isDummy = (str) => !str || str.includes('your-project-id') || str.includes('placeholder') || str.startsWith('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
  const isConfigured = Boolean(url && anonKey && !isDummy(url) && !isDummy(anonKey));

  return { url, anonKey, isConfigured };
};

let supabaseInstance = null;
let currentConfigKey = '';

export const getSupabase = () => {
  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;

  const configKey = `${url}::${anonKey}`;
  if (supabaseInstance && currentConfigKey === configKey) {
    return supabaseInstance;
  }

  try {
    supabaseInstance = createClient(url, anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
    currentConfigKey = configKey;
    return supabaseInstance;
  } catch (err) {
    console.error('[kukoo] Failed to initialize Supabase client:', err);
    return null;
  }
};

export const isSupabaseConfigured = () => {
  return getSupabaseConfig().isConfigured;
};

export const saveSupabaseConfig = (url, anonKey) => {
  const cleanedUrl = (url || '').trim();
  const cleanedKey = (anonKey || '').trim();

  if (cleanedUrl && cleanedKey) {
    localStorage.setItem('kukoo_supabase_url', cleanedUrl);
    localStorage.setItem('kukoo_supabase_anon_key', cleanedKey);
  } else {
    localStorage.removeItem('kukoo_supabase_url');
    localStorage.removeItem('kukoo_supabase_anon_key');
  }
  supabaseInstance = null;
  currentConfigKey = '';
  return getSupabase();
};

// Supabase Auth Helpers
export const supabaseSignIn = async (email, password) => {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured yet. Please open Configure in the modal and provide your real Supabase URL & Anon Key.');
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  } catch (err) {
    if (err.message?.includes('Failed to fetch') || err.name === 'TypeError') {
      throw new Error('Unable to connect to Supabase (Failed to fetch). Please click "Configure" to enter your valid Supabase Project URL and Anon Key, or switch to "Built-In / Demo" tab.');
    }
    throw err;
  }
};

export const supabaseSignUp = async ({ email, password, name, role = 'Staff', username }) => {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured yet. Please open Configure in the modal and provide your real Supabase URL & Anon Key.');
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || username || email.split('@')[0],
          role: role || 'Staff',
          username: username || email.split('@')[0]
        }
      }
    });
    if (error) throw error;
    return data;
  } catch (err) {
    if (err.message?.includes('Failed to fetch') || err.name === 'TypeError') {
      throw new Error('Unable to connect to Supabase (Failed to fetch). Please click "Configure" to enter your valid Supabase Project URL and Anon Key, or switch to "Built-In / Demo" tab.');
    }
    throw err;
  }
};

export const supabaseSignOut = async () => {
  const supabase = getSupabase();
  if (supabase) {
    await supabase.auth.signOut().catch(() => {});
  }
};

export const supabaseSignInWithOAuth = async (provider = 'google') => {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured yet. Provide Supabase URL & Anon Key.');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: window.location.origin
    }
  });
  if (error) throw error;
  return data;
};
