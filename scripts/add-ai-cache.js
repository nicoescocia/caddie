// scripts/add-ai-cache.js
// Adds ai_analysis column to rounds and creates the ai_cache table.
// Attempts DDL via exec_sql RPC; if that function is not present, prints the SQL
// for manual execution in the Supabase SQL editor, then verifies the result.
//
// Run with: node scripts/add-ai-cache.js

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } }
);

const SQL_ADD_COLUMN = `
ALTER TABLE rounds
  ADD COLUMN IF NOT EXISTS ai_analysis text;
`.trim();

const SQL_CREATE_TABLE = `
CREATE TABLE IF NOT EXISTS ai_cache (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id    uuid        REFERENCES profiles(id) ON DELETE CASCADE,
  student_id  uuid        REFERENCES profiles(id) ON DELETE CASCADE,
  cache_type  text        NOT NULL,
  content     text        NOT NULL,
  round_ids   text[]      NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (coach_id, student_id, cache_type)
);
`.trim();

async function execSql(sql) {
  const { error } = await supabase.rpc("exec_sql", { sql });
  if (error) throw new Error(error.message);
}

async function columnExists() {
  // SELECT the column; PostgREST errors with "column does not exist" when missing
  const { error } = await supabase.from("rounds").select("ai_analysis").limit(1);
  if (!error) return true;
  if (error.message.includes("does not exist")) return false;
  throw new Error("Unexpected error checking column: " + error.message);
}

async function tableExists() {
  const { error } = await supabase.from("ai_cache").select("id").limit(1);
  if (!error) return true;
  // PostgREST returns a schema-cache error when the table is missing
  if (error.message.includes("schema cache") || error.message.includes("does not exist")) return false;
  throw new Error("Unexpected error checking table: " + error.message);
}

async function main() {
  console.log("─".repeat(60));
  console.log("Caddie migration: add-ai-cache");
  console.log("─".repeat(60));

  // ── 1. Check current state ────────────────────────────────────
  const colBefore  = await columnExists();
  const tblBefore  = await tableExists();

  console.log(`\nCurrent state:`);
  console.log(`  rounds.ai_analysis column : ${colBefore  ? "✓ exists" : "✗ missing"}`);
  console.log(`  ai_cache table            : ${tblBefore  ? "✓ exists" : "✗ missing"}`);

  const needsCol = !colBefore;
  const needsTbl = !tblBefore;

  if (!needsCol && !needsTbl) {
    console.log("\n✓ Nothing to do — schema is already up to date.");
    return;
  }

  // ── 2. Attempt automatic DDL via exec_sql RPC ─────────────────
  let ddlApplied = false;
  try {
    if (needsCol) {
      console.log("\nApplying: ADD COLUMN ai_analysis ...");
      await execSql(SQL_ADD_COLUMN);
    }
    if (needsTbl) {
      console.log("Applying: CREATE TABLE ai_cache ...");
      await execSql(SQL_CREATE_TABLE);
    }
    ddlApplied = true;
  } catch (err) {
    if (err.message.includes("exec_sql") || err.message.includes("schema cache")) {
      // exec_sql function not present — fall back to manual instructions
      ddlApplied = false;
    } else {
      throw err;
    }
  }

  // ── 3. If automatic DDL failed, print SQL for manual execution ─
  if (!ddlApplied) {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║  exec_sql() not found — run the SQL below manually           ║
║  Supabase Dashboard → SQL Editor → New query → paste → Run  ║
╚══════════════════════════════════════════════════════════════╝
`);
    if (needsCol) {
      console.log("-- 1. Add ai_analysis column to rounds");
      console.log(SQL_ADD_COLUMN);
      console.log();
    }
    if (needsTbl) {
      console.log("-- 2. Create ai_cache table");
      console.log(SQL_CREATE_TABLE);
      console.log();
    }
    console.log("After running the SQL, re-run this script to confirm.");
    process.exit(1);
  }

  // ── 4. Verify ─────────────────────────────────────────────────
  console.log("\nVerifying ...");
  const colAfter = await columnExists();
  const tblAfter = await tableExists();

  console.log(`\nResult:`);
  console.log(`  rounds.ai_analysis column : ${colAfter ? "✓ exists" : "✗ STILL MISSING"}`);
  console.log(`  ai_cache table            : ${tblAfter ? "✓ exists" : "✗ STILL MISSING"}`);

  if (!colAfter || !tblAfter) {
    console.error("\n✗ Migration failed — one or more objects are still missing.");
    process.exit(1);
  }

  console.log("\n✓ Migration complete.");
}

main().catch(err => {
  console.error("\nFatal error:", err.message);
  process.exit(1);
});
