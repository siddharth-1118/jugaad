import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://jhcadspkcnbewnvdakax.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoY2Fkc3BrY25iZXdudmRha2F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MTcxMDAsImV4cCI6MjA5Njk5MzEwMH0.RPs69xkSV8Pop5ec5sSF_lizu7tQlLdJ6U9CHBuz8a8";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function check() {
  console.log("Checking notifications table in Supabase...");
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .limit(10);
  
  if (error) {
    console.error("Error querying notifications:", error);
  } else {
    console.log("Notifications in DB:", data);
  }
}

check();
