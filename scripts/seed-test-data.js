// scripts/seed-test-data.js
// Inserts two test students with realistic round data, and updates Nico's profile.
// Run with: node scripts/seed-test-data.js

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const { createClient } = require("@supabase/supabase-js");
const { randomUUID } = require("crypto");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } }
);

const COACH_ID     = "2390d6cf-b83f-43e3-9810-e3bd225c876e";
const NICO_ID      = "2dfb89f4-3c40-4c70-a025-7d486d0acda1";
const COURSE_9     = "89e2ad4e-8d5a-4244-8568-b2c8a448a77f"; // par 32, 9 holes
const COURSE_18    = "b1a2c3d4-e5f6-7890-abcd-ef1234567890"; // par 68, 18 holes

const HOLE_PARS_9  = [4,4,3,4,3,4,4,3,3];          // sum = 32
const HOLE_PARS_18 = [4,4,3,4,5,4,3,4,4,3,4,4,3,4,4,3,4,4]; // sum = 68

// Distribute a total overage across holes, keeping each hole score >= par
function distributeOverage(holePars, totalOverage) {
  const scores = [...holePars];
  let remaining = totalOverage;
  // Spread bogeys/doubles somewhat randomly
  const indices = holePars.map((_, i) => i).sort(() => Math.random() - 0.5);
  for (const i of indices) {
    if (remaining <= 0) break;
    const add = Math.min(remaining, Math.random() < 0.2 ? 2 : 1);
    scores[i] += add;
    remaining -= add;
  }
  // If still remaining (rare), dump on first holes
  for (let i = 0; i < scores.length && remaining > 0; i++) {
    scores[i]++;
    remaining--;
  }
  return scores;
}

// Build 12 round date/course combos spread over last ~90 days, oldest first
function buildRoundSchedule() {
  const now = Date.now();
  const schedule = [];
  for (let i = 0; i < 12; i++) {
    // Space rounds ~7 days apart, with small jitter, going backwards from today
    const daysAgo = (11 - i) * 7 + Math.floor(Math.random() * 3);
    const date = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
    // Alternate 9/18 with a slight bias toward 9-hole
    const is18 = i % 3 === 2; // every 3rd round is 18-hole
    schedule.push({ date: date.toISOString(), is18 });
  }
  return schedule;
}

// Generate vs-par values for a student: 12 rounds trending from startDiff to endDiff
function generateVsParValues(startDiff, endDiff, count = 12, jitter = 3) {
  return Array.from({ length: count }, (_, i) => {
    const trend = startDiff + ((endDiff - startDiff) * i) / (count - 1);
    const noise = (Math.random() - 0.5) * 2 * jitter;
    return Math.max(0, Math.round(trend + noise));
  });
}

async function insertStudent(firstName, lastName) {
  // Create a real auth user so profiles FK is satisfied
  const email = `test.${firstName.toLowerCase()}.${lastName.toLowerCase()}@caddie-seed.invalid`;
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email,
    password: randomUUID(),
    email_confirm: true,
  });
  if (authErr) throw new Error(`Create auth user ${firstName}: ${authErr.message}`);
  const id = authData.user.id;

  // Upsert profile (trigger may have already created a skeleton row)
  const { error } = await supabase
    .from("profiles")
    .upsert({ id, first_name: firstName, last_name: lastName, role: "student" });
  if (error) throw new Error(`Upsert profile ${firstName}: ${error.message}`);
  return id;
}

async function linkToCoach(studentId) {
  const { error } = await supabase
    .from("coach_students")
    .insert({ coach_id: COACH_ID, student_id: studentId });
  if (error) throw new Error(`Link coach for ${studentId}: ${error.message}`);
}

async function insertRoundsForStudent(studentId, vsParValues, schedule, startHandicap, endHandicap) {
  let totalRounds = 0;
  let totalHoles  = 0;

  for (let i = 0; i < schedule.length; i++) {
    const { date, is18 } = schedule[i];
    const courseId  = is18 ? COURSE_18 : COURSE_9;
    const holePars  = is18 ? HOLE_PARS_18 : HOLE_PARS_9;
    const par       = holePars.reduce((a, b) => a + b, 0);
    const vsPar     = vsParValues[i];
    const totalScore = par + vsPar;
    const handicap  = Math.round(startHandicap + ((endHandicap - startHandicap) * i) / Math.max(schedule.length - 1, 1));

    const holeScores = distributeOverage(holePars, vsPar);

    // Count GIR and 3-putts from hole scores
    let girCount = 0;
    let threePuttCount = 0;
    const holeDetails = holeScores.map((score, idx) => {
      const holePar = holePars[idx];
      const gir = score <= holePar; // hit in regulation if score <= par
      if (gir) girCount++;
      // Simulate 3-putts: more likely on bad holes
      const threePutt = score >= holePar + 2 && Math.random() < 0.4;
      if (threePutt) threePuttCount++;
      return { hole_number: idx + 1, par: holePar, score, gir, putts: threePutt ? 3 : score === holePar ? 2 : score > holePar ? 2 : 1 };
    });

    // Insert round (gir_count/three_putt_count/attempted_holes are computed client-side from round_holes)
    const { data: round, error: rErr } = await supabase
      .from("rounds")
      .insert({
        student_id:    studentId,
        course_id:     courseId,
        holes_played:  is18 ? 18 : 9,
        total_score:   totalScore,
        handicap,
        sent_to_coach: true,
        created_at:    date,
      })
      .select("id")
      .single();

    if (rErr) throw new Error(`Insert round for ${studentId}: ${rErr.message}`);
    totalRounds++;

    // Insert round_holes
    const holeRows = holeDetails.map(h => ({
      round_id:    round.id,
      hole_number: h.hole_number,
      par:         h.par,
      score:       h.score,
      gir:         h.gir,
      putts:       h.putts,
    }));

    const { error: hErr } = await supabase.from("round_holes").insert(holeRows);
    if (hErr) throw new Error(`Insert holes for round ${round.id}: ${hErr.message}`);
    totalHoles += holeRows.length;
  }

  return { totalRounds, totalHoles };
}

async function cleanupTestStudent(firstName, lastName) {
  const email = `test.${firstName.toLowerCase()}.${lastName.toLowerCase()}@caddie-seed.invalid`;
  // Find by email in auth
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) return;
  const existing = users.find(u => u.email === email);
  if (!existing) return;
  // Delete rounds + holes via cascade or explicit delete
  const { data: rounds } = await supabase.from("rounds").select("id").eq("student_id", existing.id);
  if (rounds?.length) {
    const ids = rounds.map(r => r.id);
    await supabase.from("round_holes").delete().in("round_id", ids);
    await supabase.from("rounds").delete().in("id", ids);
  }
  await supabase.from("coach_students").delete().eq("student_id", existing.id);
  await supabase.from("profiles").delete().eq("id", existing.id);
  await supabase.auth.admin.deleteUser(existing.id);
  console.log(`  Cleaned up existing user: ${email}`);
}

async function main() {
  console.log("Starting seed...\n");

  // 1. Update Nico's profile
  const { error: nicoErr } = await supabase
    .from("profiles")
    .update({ first_name: "Nico", last_name: "McNelis" })
    .eq("id", NICO_ID);
  if (nicoErr) {
    console.error("Failed to update Nico's profile:", nicoErr.message);
  } else {
    console.log("✓ Updated profile for Nico McNelis (id:", NICO_ID + ")");
  }

  // 2. Insert Jamie (improving: +14 → +8)
  console.log("\nInserting Jamie Stewart (improving)...");
  await cleanupTestStudent("Jamie", "Stewart");
  const jamieId  = await insertStudent("Jamie", "Stewart");
  await linkToCoach(jamieId);
  const jamieSchedule = buildRoundSchedule();
  const jamieVsPar    = generateVsParValues(14, 8, 12);
  const jamieResult   = await insertRoundsForStudent(jamieId, jamieVsPar, jamieSchedule, 14, 8);
  console.log(`✓ Jamie Stewart (id: ${jamieId})`);
  console.log(`  Rounds inserted: ${jamieResult.totalRounds}`);
  console.log(`  Holes inserted:  ${jamieResult.totalHoles}`);
  console.log(`  vs-par values:   ${jamieVsPar.join(", ")}`);

  // 3. Insert Craig (worsening: +8 → +14)
  console.log("\nInserting Craig Burns (worsening)...");
  await cleanupTestStudent("Craig", "Burns");
  const craigId  = await insertStudent("Craig", "Burns");
  await linkToCoach(craigId);
  const craigSchedule = buildRoundSchedule();
  const craigVsPar    = generateVsParValues(8, 14, 12);
  const craigResult   = await insertRoundsForStudent(craigId, craigVsPar, craigSchedule, 8, 14);
  console.log(`✓ Craig Burns (id: ${craigId})`);
  console.log(`  Rounds inserted: ${craigResult.totalRounds}`);
  console.log(`  Holes inserted:  ${craigResult.totalHoles}`);
  console.log(`  vs-par values:   ${craigVsPar.join(", ")}`);

  console.log("\nSeed complete.");
}

main().catch(err => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
