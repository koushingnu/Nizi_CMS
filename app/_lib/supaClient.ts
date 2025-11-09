import { createClient } from "@supabase/supabase-js";

// Anon キーを使ったクライアント（クライアント側でも使用可能）
export function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error("Supabase URL or Anon Key is not set");
  }

  return createClient(supabaseUrl, anonKey);
}
