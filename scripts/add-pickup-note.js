// scripts/add-pickup-note.js
// Adds pickup_note text column to round_holes.
// Prints the SQL it would run, then waits for confirmation before executing.
//
// Run with: node scripts/add-pickup-note.js
// To actually apply: node scripts/add-pickup-note.js --apply

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } }
);

const SQL = `ALTER TABLE round_holes ADD COLUMN IF NOT EXISTS pickup_note text;`;

console.log("─".repeat(60));
console.log("Caddie migration: add-pickup-note");
console.log("─".repeat(60));
console.log("\nThis script requires the following SQL to be run in the Supabase SQL editor:\n");
console.log(SQL);
console.log();

const apply = process.argv.includes("--apply");

if (!apply) {
  console.log("This migration requires DDL which cannot be run via the service role key.");
  console.log("Run the SQL above in the Supabase SQL editor, then re-run this script with --apply to verify.");
  process.exit(0);
}

async function main() {
  console.log("Verifying column exists...");
  const { data, error } = await supabase
    .from("round_holes")
    .select("pickup_note")
    .limit(1);

  if (error) {
    console.error("\n✗ Verification failed — column may not exist yet:", error.message);
    console.log("Run the SQL above in the Supabase SQL editor first.");
    process.exit(1);
  }

  console.log("\n✓ Column pickup_note exists on round_holes.");
}

main().catch(err => {
  console.error("\nFatal error:", err.message);
  process.exit(1);
});
