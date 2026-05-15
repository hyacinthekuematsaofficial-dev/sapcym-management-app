import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

// Robust URL validation to prevent initialization crashes
const isValidSupabaseUrl = (url: any): url is string => {
  if (typeof url !== 'string' || !url) return false;
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
};

if (!isValidSupabaseUrl(supabaseUrl) || !supabaseKey) {
  console.warn(
    'Supabase configuration incomplete or invalid. Please set VITE_SUPABASE_URL and VITE_SUPABASE_KEY correctly.'
  );
}

// Initialize with a guaranteed valid URL fallback to avoid top-level crashes
export const supabase = createClient(
  isValidSupabaseUrl(supabaseUrl) ? supabaseUrl : 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder'
);

// Simplified Auth Helpers
export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  });
  return { data, error };
};

export const signOut = () => supabase.auth.signOut();
