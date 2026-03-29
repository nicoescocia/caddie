// scripts/seed-test-data.js
// Inserts two test students with realistic, complete round data and updates Nico's profile.
// Run with: node scripts/seed-test-data.js

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const { createClient } = require("@supabase/supabase-js");
const { randomUUID } = require("crypto");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } }
);

const COACH_ID  = "2390d6cf-b83f-43e3-9810-e3bd225c876e";
const NICO_ID   = "2dfb89f4-3c40-4c70-a025-7d486d0acda1";
const COURSE_9  = "89e2ad4e-8d5a-4244-8568-b2c8a448a77f"; // par 32, 9 holes
const COURSE_18 = "b1a2c3d4-e5f6-7890-abcd-ef1234567890"; // par 68, 18 holes

const HOLE_PARS_9  = [4,4,3,4,3,4,4,3,3];
const HOLE_PARS_18 = [4,4,3,4,5,4,3,4,4,3,4,4,3,4,4,3,4,4];

// Distribute a total overage across holes, keeping each score >= par
function distributeOverage(holePars, totalOverage) {
  const scores = [...holePars];
  let remaining = totalOverage;
  const indices = holePars.map((_, i) => i).sort(() => Math.random() - 0.5);
  for (const i of indices) {
    if (remaining <= 0) break;
    const add = Math.min(remaining, Math.random() < 0.2 ? 2 : 1);
    scores[i] += add;
    remaining -= add;
  }
  for (let i = 0; i < scores.length && remaining > 0; i++) {
    scores[i]++;
    remaining--;
  }
  return scores;
}

// Space 12 rounds ~7 days apart over the last ~90 days, oldest first
function buildRoundSchedule() {
  const now = Date.now();
  const schedule = [];
  for (let i = 0; i < 12; i++) {
    const daysAgo = (11 - i) * 7 + Math.floor(Math.random() * 3);
    const date = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
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

// Generate realistic per-hole details
// abilityLevel: 0.0 = best (hcp ~8), 1.0 = worst (hcp ~14)
function generateHoleDetails(holePar, score, abilityLevel) {
  const overPar = Math.max(0, score - holePar);

  // --- GIR ---
  let gir;
  if (overPar === 0)      gir = Math.random() < 0.80;
  else if (overPar === 1) gir = Math.random() < 0.22;
  else                    gir = Math.random() < 0.04;

  // --- Fairway (par 4/5 only) ---
  let fairway = null;
  if (holePar >= 4) {
    const hitChance = 0.62 - abilityLevel * 0.14; // 62% → 48%
    if (Math.random() < hitChance) fairway = "yes";
    else fairway = Math.random() < 0.52 ? "left" : "right";
  }

  // --- Approach distance ---
  let approach = null;
  if (holePar === 3) {
    const bands = ["50–75", "75–100", "100–125", "125–150"];
    approach = bands[Math.min(3, Math.floor(abilityLevel * 2 + Math.random() * 2))];
  } else if (holePar === 4) {
    const bands = fairway === "yes"
      ? ["100–125", "125–150", "150+"]
      : ["125–150", "150+"];
    approach = bands[Math.floor(Math.random() * bands.length)];
  } else { // par 5
    const bands = ["50–75", "75–100", "100–125", "125–150"];
    approach = bands[Math.floor(Math.random() * bands.length)];
  }

  // --- Shots inside 50 ---
  let shots_inside_50 = 0;
  if (!gir) {
    if (overPar === 0) shots_inside_50 = 1;          // good up-and-down
    else if (overPar === 1) shots_inside_50 = Math.random() < 0.3 ? 2 : 1;
    else shots_inside_50 = Math.floor(Math.random() * 2) + 2; // 2–3 struggling
  }

  // --- Penalty ---
  // Occasional OB/hazard on bad holes; more likely for worse players
  const penaltyChance = overPar >= 2 ? 0.04 + abilityLevel * 0.05 : 0;
  const penalty = Math.random() < penaltyChance
    ? (Math.random() < 0.55 ? "OB" : "Hazard")
    : "None";

  // --- Putts ---
  let putts;
  if (gir) {
    if (score < holePar) {
      putts = 1;                                                       // birdie
    } else if (score === holePar) {
      putts = Math.random() < 0.78 ? 2 : 1;                          // par, usually 2-putt
    } else {
      const threePuttChance = 0.20 + abilityLevel * 0.18;
      putts = Math.random() < threePuttChance ? 3 : 2;               // bogey on GIR
    }
  } else {
    if (score <= holePar) {
      putts = 1;                                                       // up-and-down save
    } else {
      const threePuttChance = 0.08 + abilityLevel * 0.10;
      putts = Math.random() < threePuttChance ? 3 : 2;
    }
  }

  // --- Putt distances ---
  let putt1 = null;
  let putt2 = null;
  if (gir) {
    const longDists = ["8", "10", "12", "15", "18", "20+", "25+"];
    putt1 = longDists[Math.floor(Math.random() * longDists.length)];
  } else {
    const shortDists = ["3", "4", "5", "6", "8", "10"];
    putt1 = shortDists[Math.floor(Math.random() * shortDists.length)];
  }
  if (putts >= 3) {
    const missedDists = ["3", "4", "5", "6"];
    putt2 = missedDists[Math.floor(Math.random() * missedDists.length)];
  }

  return { gir, fairway, approach, shots_inside_50, penalty, putts, putt1, putt2 };
}

async function insertStudent(firstName, lastName, officialHandicap = null) {
  const email = `test.${firstName.toLowerCase()}.${lastName.toLowerCase()}@caddie-seed.invalid`;
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email,
    password: randomUUID(),
    email_confirm: true,
  });
  if (authErr) throw new Error(`Create auth user ${firstName}: ${authErr.message}`);
  const id = authData.user.id;

  // Base profile upsert (always works)
  const { error } = await supabase
    .from("profiles")
    .upsert({ id, first_name: firstName, last_name: lastName, role: "student" });
  if (error) throw new Error(`Upsert profile ${firstName}: ${error.message}`);

  // Set official_handicap (requires profiles.official_handicap column)
  if (officialHandicap != null) {
    const { error: hcpErr } = await supabase
      .from("profiles")
      .update({ official_handicap: officialHandicap })
      .eq("id", id);
    if (hcpErr) {
      console.warn(`  ⚠ Could not set official_handicap for ${firstName}: ${hcpErr.message}`);
      console.warn(`    Run in Supabase SQL editor: ALTER TABLE profiles ADD COLUMN IF NOT EXISTS official_handicap numeric(4,1);`);
    } else {
      console.log(`  official_handicap set to ${officialHandicap}`);
    }
  }

  return id;
}

async function linkToCoach(studentId) {
  // Upsert to safely re-link after re-seed
  const { error } = await supabase
    .from("coach_students")
    .upsert({ coach_id: COACH_ID, student_id: studentId }, { onConflict: "coach_id,student_id" });
  if (error) throw new Error(`Link coach for ${studentId}: ${error.message}`);
}

async function insertRoundsForStudent(studentId, vsParValues, schedule, startHandicap, endHandicap, isImproving) {
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

    // abilityLevel: 0.0 = best (hcp 8), 1.0 = worst (hcp 14)
    const abilityLevel = isImproving
      ? 1.0 - i / (schedule.length - 1)   // improving: starts worst, ends best
      : i / (schedule.length - 1);         // worsening: starts best, ends worst

    const holeScores = distributeOverage(holePars, vsPar);

    // Build per-hole details
    const holeDetails = holeScores.map((score, idx) => {
      const holePar = holePars[idx];
      const details = generateHoleDetails(holePar, score, abilityLevel);
      return {
        hole_number: idx + 1,
        par:         holePar,
        score,
        gir:         details.gir,
        fairway:     details.fairway,
        approach:    details.approach,
        shots_inside_50: details.shots_inside_50,
        penalty:     details.penalty,
        putts:       details.putts,
        putt1:       details.putt1,
        putt2:       details.putt2,
      };
    });

    const totalPutts = holeDetails.reduce((s, h) => s + h.putts, 0);

    // Insert round
    const { data: round, error: rErr } = await supabase
      .from("rounds")
      .insert({
        student_id:    studentId,
        course_id:     courseId,
        holes_played:  is18 ? 18 : 9,
        total_score:   totalScore,
        total_putts:   totalPutts,
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
      round_id:        round.id,
      hole_number:     h.hole_number,
      par:             h.par,
      score:           h.score,
      gir:             h.gir,
      fairway:         h.fairway,
      approach:        h.approach,
      shots_inside_50: h.shots_inside_50,
      penalty:         h.penalty,
      putts:           h.putts,
      putt1:           h.putt1,
      putt2:           h.putt2,
    }));

    const { error: hErr } = await supabase.from("round_holes").insert(holeRows);
    if (hErr) throw new Error(`Insert holes for round ${round.id}: ${hErr.message}`);
    totalHoles += holeRows.length;
  }

  return { totalRounds, totalHoles };
}

async function cleanupTestStudent(firstName, lastName) {
  const email = `test.${firstName.toLowerCase()}.${lastName.toLowerCase()}@caddie-seed.invalid`;
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) return;
  const existing = users.find(u => u.email === email);
  if (!existing) return;
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

  // 2. Insert Jamie (improving: +14 → +8, handicap 14 → 8)
  console.log("\nInserting Jamie Stewart (improving)...");
  await cleanupTestStudent("Jamie", "Stewart");
  // Jamie official WHS index: 4.0 (course hcp on rounds ≈ 8, Big Course adds ~4 shots)
  const jamieId       = await insertStudent("Jamie", "Stewart", 4.0);
  await linkToCoach(jamieId);
  const jamieSchedule = buildRoundSchedule();
  const jamieVsPar    = generateVsParValues(14, 8, 12);
  const jamieResult   = await insertRoundsForStudent(jamieId, jamieVsPar, jamieSchedule, 14, 8, true);
  console.log(`✓ Jamie Stewart (id: ${jamieId})`);
  console.log(`  Rounds inserted: ${jamieResult.totalRounds}`);
  console.log(`  Holes inserted:  ${jamieResult.totalHoles}`);
  console.log(`  vs-par values:   ${jamieVsPar.join(", ")}`);

  // 3. Insert Craig (worsening: +8 → +14, handicap 8 → 14)
  console.log("\nInserting Craig Burns (worsening)...");
  await cleanupTestStudent("Craig", "Burns");
  // Craig official WHS index: 10.0 (course hcp on rounds ≈ 14, Big Course adds ~4 shots)
  const craigId       = await insertStudent("Craig", "Burns", 10.0);
  await linkToCoach(craigId);
  const craigSchedule = buildRoundSchedule();
  const craigVsPar    = generateVsParValues(8, 14, 12);
  const craigResult   = await insertRoundsForStudent(craigId, craigVsPar, craigSchedule, 8, 14, false);
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
