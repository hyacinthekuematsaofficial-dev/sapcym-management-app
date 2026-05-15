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

const isConfigured = isValidSupabaseUrl(supabaseUrl) && supabaseKey && supabaseKey !== 'placeholder';

if (!isConfigured) {
  console.warn(
    'Supabase configuration incomplete or invalid. Requests will fail.\n' +
    'Please set VITE_SUPABASE_URL and VITE_SUPABASE_KEY in your environment variables.'
  );
}

// Initialize with a guaranteed valid URL fallback to avoid top-level crashes
export const supabase = createClient(
  isValidSupabaseUrl(supabaseUrl) ? supabaseUrl : 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder'
);

/**
 * Uploads a file to a Supabase Storage bucket.
 * @param bucket - The name of the bucket (e.g., 'gallery')
 * @param path - The internal path (e.g., 'uploads/my-image.jpg')
 * @param file - The File object from an input or drag-and-drop
 */
export const uploadFile = async (bucket: string, path: string, file: File) => {
  if (!isConfigured) {
    throw new Error('Supabase is not configured. Please add your API keys.');
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) throw error;
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return { data, publicUrl };
};

// Simplified Auth Helpers
export const signInWithGoogle = async () => {
  if (!isConfigured) {
    console.error('Sign-in failed: Supabase keys missing.');
    return;
  }
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  });
  if (error) throw error;
  return data;
};

export const signOut = () => supabase.auth.signOut();
