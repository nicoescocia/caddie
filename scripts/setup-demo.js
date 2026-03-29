// scripts/setup-demo.js
// 1. Create proper login credentials for Jamie & Craig (update existing auth users)
// 2. Delete all profiles/auth users except the 4 keepers
// 3. Update coach display name to "Coach Demo"
// Run with: node scripts/setup-demo.js

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } }
);

const KEEP_IDS = new Set([
  "2dfb89f4-3c40-4c70-a025-7d486d0acda1", // Nico McNelis
  "2390d6cf-b83f-43e3-9810-e3bd225c876e", // Coach Demo
]);
const JAMIE_EMAIL = "jamie@caddie-test.com";
const CRAIG_EMAIL = "craig@caddie-test.com";
const TEST_PASSWORD = "CaddieTest123!";

async function main() {
  console.log("=== Demo Setup ===\n");

  // ── 1. Find Jamie & Craig by their seed emails ──
  const { data: { users: allUsers }, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) throw new Error("listUsers: " + listErr.message);

  const jamie = allUsers.find(u => u.email === "test.jamie.stewart@caddie-seed.invalid");
  const craig = allUsers.find(u => u.email === "test.craig.burns@caddie-seed.invalid");

  if (!jamie) throw new Error("Jamie's auth user not found — run seed-test-data.js first");
  if (!craig) throw new Error("Craig's auth user not found — run seed-test-data.js first");

  console.log(`Found Jamie: ${jamie.id}`);
  console.log(`Found Craig: ${craig.id}`);

  // Add them to the keep set now that we know their IDs
  KEEP_IDS.add(jamie.id);
  KEEP_IDS.add(craig.id);

  // ── 1b. Delete any stale accounts with the target demo emails (from previous runs) ──
  for (const email of [JAMIE_EMAIL, CRAIG_EMAIL]) {
    const stale = allUsers.find(u => u.email === email);
    if (stale && !KEEP_IDS.has(stale.id)) {
      const { data: staleRounds } = await supabase.from("rounds").select("id").eq("student_id", stale.id);
      if (staleRounds?.length) {
        const ids = staleRounds.map(r => r.id);
        await supabase.from("round_holes").delete().in("round_id", ids);
        await supabase.from("rounds").delete().in("id", ids);
      }
      await supabase.from("coach_students").delete().eq("student_id", stale.id);
      await supabase.from("invites").update({ used_by: null }).eq("used_by", stale.id);
      await supabase.from("profiles").delete().eq("id", stale.id);
      await supabase.auth.admin.deleteUser(stale.id);
      console.log(`  Removed stale demo account: ${email}`);
    }
  }

  // ── 2. Update Jamie & Craig auth accounts with real credentials ──
  const { error: je } = await supabase.auth.admin.updateUserById(jamie.id, {
    email: JAMIE_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
  });
  if (je) throw new Error("Update Jamie auth: " + je.message);
  console.log(`✓ Jamie auth updated → ${JAMIE_EMAIL}`);

  const { error: ce } = await supabase.auth.admin.updateUserById(craig.id, {
    email: CRAIG_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
  });
  if (ce) throw new Error("Update Craig auth: " + ce.message);
  console.log(`✓ Craig auth updated → ${CRAIG_EMAIL}`);

  // ── 3. Delete all other users ──
  console.log("\nCleaning up other users...");
  const toDelete = allUsers.filter(u => !KEEP_IDS.has(u.id));
  console.log(`  Found ${toDelete.length} user(s) to delete`);

  for (const u of toDelete) {
    // Delete rounds + holes
    const { data: rounds } = await supabase.from("rounds").select("id").eq("student_id", u.id);
    if (rounds?.length) {
      const ids = rounds.map(r => r.id);
      await supabase.from("round_holes").delete().in("round_id", ids);
      await supabase.from("rounds").delete().in("id", ids);
    }
    await supabase.from("coach_students").delete().eq("student_id", u.id);
    await supabase.from("coach_students").delete().eq("coach_id", u.id);
    await supabase.from("profiles").delete().eq("id", u.id);
    const { error: delErr } = await supabase.auth.admin.deleteUser(u.id);
    if (delErr) console.warn(`  ⚠ Could not delete auth user ${u.email}: ${delErr.message}`);
    else console.log(`  ✓ Deleted ${u.email || u.id}`);
  }

  // ── 4. Update coach profile name ──
  const { error: coachErr } = await supabase
    .from("profiles")
    .update({ first_name: "Coach", last_name: "Demo" })
    .eq("id", "2390d6cf-b83f-43e3-9810-e3bd225c876e");
  if (coachErr) throw new Error("Update coach: " + coachErr.message);
  console.log("\n✓ Coach profile updated → Coach Demo");

  // ── 5. Summary ──
  console.log("\n=== Final state ===");
  const { data: profiles } = await supabase.from("profiles").select("id, first_name, last_name, role");
  for (const p of profiles || []) {
    console.log(`  ${p.role?.padEnd(8)} ${p.first_name} ${p.last_name} (${p.id})`);
  }
  console.log("\nDone.");
}

main().catch(err => {
  console.error("Setup failed:", err.message);
  process.exit(1);
});
