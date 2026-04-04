/**
 * Migration: add phone, home_courses, bio, is_premium to profiles table
 *
 * Run once:
 *   node scripts/add-profile-columns.js
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_KEY in .env
 */

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const SQL = `
  ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS phone        text,
    ADD COLUMN IF NOT EXISTS home_courses text[],
    ADD COLUMN IF NOT EXISTS bio          text,
    ADD COLUMN IF NOT EXISTS is_premium   boolean NOT NULL DEFAULT false;
`;

async function run() {
  const { error } = await supabase.rpc("exec_sql", { sql: SQL }).single();
  if (error) {
    // exec_sql RPC may not exist — print the SQL to run manually instead
    console.error("Could not run via RPC:", error.message);
    console.log("\nRun this SQL directly in the Supabase SQL editor:\n");
    console.log(SQL);
    process.exit(1);
  }
  console.log("Migration complete.");
}

run();
