import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://jhcadspkcnbewnvdakax.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoY2Fkc3BrY25iZXdudmRha2F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MTcxMDAsImV4cCI6MjA5Njk5MzEwMH0.RPs69xkSV8Pop5ec5sSF_lizu7tQlLdJ6U9CHBuz8a8";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testInsert() {
  const { data, error } = await supabase
    .from('items')
    .insert([{
      type: "MATERIAL",
      title: "CS101 Final Exam Paper 2024",
      description: "https://example.com/pdf",
      category: "pyq",
      location: "pdf",
      user_email: "test@srmist.edu.in",
      photo_url: JSON.stringify({ 
        downloadsCount: 5, 
        uploadedBy: "Prof. Alan Turing", 
        ratings: [], 
        versions: [],
        courseId: "cs101"
      }),
      status: "Approved"
    }])
    .select();
  
  if (error) {
    console.error("Error details:", error);
  } else {
    console.log("Insert Succeeded! Data:", data);
  }
}

testInsert();
