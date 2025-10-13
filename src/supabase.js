import { createClient } from "@supabase/supabase-js";
const supabaseUrl = "https://zbnwiwkyvcnlqblkxomo.supabase.co/";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpibndpd2t5dmNubHFibGt4b21vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMDM2MzUsImV4cCI6MjA3NTg3OTYzNX0.LlL3SDwtMmNXpPF9eN5fq2MamJzuCPJvgBD__8IYMBE";
export const supabase = createClient(supabaseUrl, supabaseKey);
const adminEmail = "admin@monapp.local";

export async function loginWithPasswordOnly(password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password,
  });
  if (error) {
    console.error("Erreur login:", error.message);
    return false;
  }
  return true;
}
