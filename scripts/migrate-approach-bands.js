// scripts/migrate-approach-bands.js
// Migrates existing 'Under 50' approach values to '25–50'.
// Prints the SQL it would run, then waits for confirmation before executing.
//
// Run with: node scripts/migrate-approach-bands.js
// To actually apply: node scripts/migrate-approach-bands.js --apply

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } }
);

const SQL = `UPDATE round_holes SET approach = '25\u201350' WHERE approach = 'Under 50' OR approach = 'Under 50';`;

console.log("─".repeat(60));
console.log("Caddie migration: migrate-approach-bands");
console.log("─".repeat(60));
console.log("\nThis script will run the following SQL:\n");
console.log(SQL);
console.log();

const apply = process.argv.includes("--apply");

if (!apply) {
  console.log("Dry run only. To apply, re-run with: node scripts/migrate-approach-bands.js --apply");
  process.exit(0);
}

async function main() {
  console.log("Applying migration...");
  const { error, count } = await supabase
    .from("round_holes")
    .update({ approach: "25\u201350" })
    .or("approach.eq.Under 50,approach.eq.Under 50")
    .select("id", { count: "exact", head: true });

  if (error) {
    console.error("\n✗ Migration failed:", error.message);
    process.exit(1);
  }

  console.log(`\n✓ Migration complete. ${count ?? "?"} rows updated.`);
}

main().catch(err => {
  console.error("\nFatal error:", err.message);
  process.exit(1);
});
