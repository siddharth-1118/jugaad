import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://jhcadspkcnbewnvdakax.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoY2Fkc3BrY25iZXdudmRha2F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MTcxMDAsImV4cCI6MjA5Njk5MzEwMH0.RPs69xkSV8Pop5ec5sSF_lizu7tQlLdJ6U9CHBuz8a8";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function check() {
  console.log("Checking tables...");
  
  // Try querying 'items' table
  const { data: items, error: itemsError } = await supabase
    .from('items')
    .select('*')
    .limit(5);

  if (itemsError) {
    console.error("Error querying items:", itemsError);
  } else {
    console.log("Items:", items);
  }

  // Try querying other potential tables like 'resources', 'materials', 'documents', 'courses'
  const tables = ['resources', 'materials', 'documents', 'courses', 'files'];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*').limit(1);
    if (error) {
      console.log(`Table '${t}' query failed:`, error.message);
    } else {
      console.log(`Table '${t}' exists! Data:`, data);
    }
  }
}

check();
