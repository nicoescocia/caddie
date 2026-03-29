// scripts/migrate-official-handicap.js
// Adds official_handicap column to profiles table (WHS index, numeric to 1dp).
// Non-destructive — uses IF NOT EXISTS.
//
// SQL being run:
//   ALTER TABLE profiles ADD COLUMN IF NOT EXISTS official_handicap numeric(4,1);
//
// Run with: node scripts/migrate-official-handicap.js

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const SQL = `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS official_handicap numeric(4,1);`;

console.log("Migration SQL:");
console.log("  " + SQL);
console.log("");

// Supabase exposes a query endpoint for service-role clients via pg_meta.
// We call it via a raw HTTP POST to the internal query API.
const url = process.env.SUPABASE_URL.replace("supabase.co", "supabase.co") + "/rest/v1/rpc/exec_sql";

// Try via rpc first (works if exec_sql function exists in the project)
async function tryViaRpc() {
  const { createClient } = require("@supabase/supabase-js");
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    { auth: { persistSession: false } }
  );

  // Verify column presence by attempting a select
  const { error: checkErr } = await supabase
    .from("profiles")
    .select("official_handicap")
    .limit(1);

  if (!checkErr) {
    console.log("✓ Column official_handicap already exists — nothing to do.");
    return true;
  }

  if (!checkErr.message.includes("official_handicap")) {
    // Some other error
    console.error("Unexpected error checking column:", checkErr.message);
    return false;
  }

  // Column doesn't exist — try to add it
  const { error: rpcErr } = await supabase.rpc("exec_sql", { sql: SQL });
  if (!rpcErr) {
    console.log("✓ Migration applied via exec_sql RPC.");
    return true;
  }

  return false;
}

async function main() {
  const ok = await tryViaRpc();
  if (!ok) {
    console.log("⚠  Could not run migration automatically.");
    console.log("   Please run the following SQL in your Supabase SQL Editor:");
    console.log("   https://supabase.com/dashboard/project/xyruyxfcwxhdyzvrzxqg/sql/new");
    console.log("");
    console.log("   " + SQL);
    console.log("");
    console.log("   Then re-run: node scripts/seed-test-data.js");
    process.exit(1);
  }
}

main().catch(err => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
