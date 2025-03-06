import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// Cliente normal para operações regulares
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
  global: {
    headers: {
      "X-Client-Info": "supabase-js@2.39.7",
    },
  },
});

// Cliente admin para operações privilegiadas
export const adminAuthClient = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
  },
  global: {
    headers: {
      "X-Client-Info": "supabase-js@2.39.7",
    },
  },
});

// Test connection on initialization
async function testConnection() {
  try {
    const { error } = await supabase.from("buildings").select("count").single();

    if (error) {
      console.error("Supabase connection error:", error);
      if (error.message.includes("JWTError")) {
        console.error(
          "Authentication error - Please check if you are logged in"
        );
      }
    }
  } catch (e) {
    console.error("Unexpected error testing connection:", e);
  }
}

testConnection();
