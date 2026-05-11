import { Config, Context } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

export default async (req: Request, context: Context) => {
  console.log("Running daily health check...");
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase credentials for health check.");
    return new Response("Configuration Error", { status: 500 });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. DB Connectivity Check
    const { data: dbData, error: dbError } = await supabase
      .from("users")
      .select("id")
      .limit(1);
      
    if (dbError) {
      console.error("Database connectivity check failed:", dbError);
      return new Response("Database Error", { status: 500 });
    }

    console.log("Database connectivity OK.");

    // 2. Additional health checks can be added here
    
    return new Response("Health check passed", { status: 200 });
  } catch (error) {
    console.error("Health check encountered an unexpected error:", error);
    return new Response("Server Error", { status: 500 });
  }
};

export const config: Config = {
  schedule: "30 23 * * *", // 5:00 AM IST is 23:30 UTC
};
