/*
 * SQL to run in Supabase SQL editor before this feature is live:
 *
 *   ALTER TABLE profiles ADD COLUMN IF NOT EXISTS settings jsonb DEFAULT '{}'::jsonb;
 *   ALTER TABLE round_holes ADD COLUMN IF NOT EXISTS putt3 text;
 */

import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Outfit:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
  :root {
    --green-dark:#0F3D2E; --green:#1A6B4A; --green-mid:#2A8A60; --green-light:#3DAA78;
    --grass:#52C97A; --bg:#F4F1EB; --gold:#C9A84C; --red:#C94040; --orange:#D4763A;
    --sky:#4A90D9; --text:#1C1C1C; --text-mid:#555; --text-dim:#999; --border:#E2DDD4;
    --shadow:0 2px 16px rgba(0,0,0,0.08); --shadow-lg:0 8px 32px rgba(0,0,0,0.12);
  }
  body { font-family:'Outfit',sans-serif; background:var(--bg); color:var(--text); min-height:100vh; }

  .set-bar { background:var(--green-dark); padding:0 20px; display:flex; align-items:center; justify-content:space-between; height:54px; position:sticky; top:0; z-index:100; }
  .set-logo { font-family:'Playfair Display',serif; font-size:20px; color:var(--gold); }
  .set-bar-right { display:flex; align-items:center; gap:10px; }
  .set-back-btn { background:none; border:none; color:rgba(255,255,255,0.7); font-family:'Outfit',sans-serif; font-size:13px; font-weight:600; cursor:pointer; padding:0; display:flex; align-items:center; gap:5px; transition:color .15s; }
  .set-back-btn:hover { color:white; }
  .set-signout-btn { background:none; border:1px solid rgba(255,255,255,0.2); color:rgba(255,255,255,0.6); border-radius:8px; padding:5px 12px; font-family:'Outfit',sans-serif; font-size:12px; cursor:pointer; transition:all .2s; }
  .set-signout-btn:hover { border-color:rgba(255,255,255,0.5); color:white; }

  .set-wrap { max-width:480px; margin:0 auto; padding:24px 16px 80px; }

  .set-page-title { font-family:'Playfair Display',serif; font-size:26px; color:var(--text); margin-bottom:6px; }
  .set-page-sub { font-size:13px; color:var(--text-dim); margin-bottom:24px; line-height:1.6; }

  .set-card { background:white; border:1.5px solid var(--border); border-radius:16px; padding:20px; margin-bottom:16px; }
  .set-section-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.09em; color:var(--text-dim); margin-bottom:14px; }

  .set-row { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; }
  .set-row-info { flex:1; }
  .set-row-title { font-size:15px; font-weight:700; color:var(--text); margin-bottom:4px; }
  .set-row-desc { font-size:13px; color:var(--text-dim); line-height:1.55; }

  .set-toggle-group { display:flex; border:1.5px solid var(--border); border-radius:12px; overflow:hidden; flex-shrink:0; margin-top:12px; }
  .set-toggle-opt { flex:1; padding:10px 14px; font-family:'Outfit',sans-serif; font-size:13px; font-weight:600; color:var(--text-mid); background:white; border:none; cursor:pointer; transition:all .18s; white-space:nowrap; text-align:center; }
  .set-toggle-opt:not(:last-child) { border-right:1.5px solid var(--border); }
  .set-toggle-opt.active { background:var(--green-dark); color:white; }
  .set-toggle-opt.locked { opacity:.45; cursor:not-allowed; }

  .set-premium-badge { display:inline-flex; align-items:center; gap:5px; background:#FFF8E6; border:1px solid #E8D080; color:#7A5A00; border-radius:7px; padding:3px 8px; font-size:11px; font-weight:700; margin-top:8px; }

  .loading-wrap { display:flex; align-items:center; justify-content:center; padding:60px; }
  .big-spinner { width:28px; height:28px; border:3px solid var(--border); border-top-color:var(--green); border-radius:50%; animation:spin .7s linear infinite; }
  @keyframes spin { to{transform:rotate(360deg)} }
`;

export default function StudentSettings({ user, onBack, onSignOut }) {
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [puttTracking, setPuttTracking] = useState("standard");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("profiles")
        .select("settings, is_premium")
        .eq("id", user.id)
        .single();
      setIsPremium(!!data?.is_premium);
      setPuttTracking(data?.settings?.putt_tracking || "standard");
      setLoading(false);
    }
    load();
  }, [user.id]);

  async function handlePuttTrackingChange(val) {
    if (val === "full" && !isPremium) return;
    setSaving(true);
    const newSettings = { putt_tracking: val };
    const { error } = await supabase
      .from("profiles")
      .update({ settings: newSettings })
      .eq("id", user.id);
    if (!error) setPuttTracking(val);
    setSaving(false);
  }

  if (loading) return (
    <>
      <style>{css}</style>
      <div className="set-bar">
        <button className="set-back-btn" onClick={onBack}>← Back</button>
        <div className="set-logo">Caddie</div>
        <button className="set-signout-btn" onClick={onSignOut}>Sign out</button>
      </div>
      <div className="loading-wrap"><div className="big-spinner" /></div>
    </>
  );

  return (
    <>
      <style>{css}</style>
      <div className="set-bar">
        <button className="set-back-btn" onClick={onBack}>← Back</button>
        <div className="set-logo">Caddie</div>
        <div className="set-bar-right">
          <button className="set-signout-btn" onClick={onSignOut}>Sign out</button>
        </div>
      </div>

      <div className="set-wrap">
        <div className="set-page-title">Settings</div>
        <div className="set-page-sub">Manage your round logging preferences.</div>

        <div className="set-card">
          <div className="set-section-label">Putting</div>
          <div>
            <div className="set-row-title">Putt tracking detail</div>
            <div className="set-row-desc" style={{marginTop:4,marginBottom:12}}>
              Controls how much putt distance data is recorded per hole.
            </div>

            <div style={{marginBottom:12}}>
              <div style={{
                background: puttTracking === "standard" ? "var(--green-dark)" : "white",
                border: "1.5px solid " + (puttTracking === "standard" ? "var(--green-dark)" : "var(--border)"),
                borderRadius: 12, padding: "14px 16px", marginBottom: 8, cursor: "pointer",
                transition: "all .18s",
              }} onClick={() => handlePuttTrackingChange("standard")}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <div>
                    <div style={{
                      fontSize: 14, fontWeight: 700,
                      color: puttTracking === "standard" ? "white" : "var(--text)",
                      marginBottom: 3,
                    }}>
                      Standard
                    </div>
                    <div style={{
                      fontSize: 12,
                      color: puttTracking === "standard" ? "rgba(255,255,255,0.6)" : "var(--text-dim)",
                      lineHeight: 1.5,
                    }}>
                      Record first putt distance. On 3-putts, also record second putt distance.
                    </div>
                  </div>
                  {puttTracking === "standard" && (
                    <div style={{
                      width: 20, height: 20, borderRadius: "50%", background: "var(--gold)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, marginLeft: 12, fontSize: 12, color: "var(--green-dark)", fontWeight: 700,
                    }}>✓</div>
                  )}
                </div>
              </div>

              <div style={{
                background: puttTracking === "full" ? "var(--green-dark)" : "white",
                border: "1.5px solid " + (puttTracking === "full" ? "var(--green-dark)" : "var(--border)"),
                borderRadius: 12, padding: "14px 16px",
                cursor: isPremium ? "pointer" : "not-allowed",
                opacity: isPremium ? 1 : 0.65,
                transition: "all .18s",
              }} onClick={() => isPremium && handlePuttTrackingChange("full")}>
                <div style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}>
                  <div>
                    <div style={{
                      fontSize: 14, fontWeight: 700,
                      color: puttTracking === "full" ? "white" : "var(--text)",
                      marginBottom: 3, display: "flex", alignItems: "center", gap: 8,
                    }}>
                      Full putt distances
                      {!isPremium && (
                        <span style={{
                          background: "var(--gold)", color: "var(--green-dark)",
                          fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5,
                          textTransform: "uppercase", letterSpacing: ".05em",
                        }}>Premium</span>
                      )}
                    </div>
                    <div style={{
                      fontSize: 12,
                      color: puttTracking === "full" ? "rgba(255,255,255,0.6)" : "var(--text-dim)",
                      lineHeight: 1.5,
                    }}>
                      Record a distance for every putt — 1 putt, 2 putts, or 3 putts.
                    </div>
                  </div>
                  {puttTracking === "full" && (
                    <div style={{
                      width: 20, height: 20, borderRadius: "50%", background: "var(--gold)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, marginLeft: 12, fontSize: 12, color: "var(--green-dark)", fontWeight: 700,
                    }}>✓</div>
                  )}
                </div>
              </div>
            </div>

            {!isPremium && (
              <div style={{
                background: "#FFF8E6", border: "1px solid #E8D080", borderRadius: 10,
                padding: "10px 13px", fontSize: 12, color: "#7A5A00", lineHeight: 1.55,
              }}>
                Full putt distances is a <strong>Premium</strong> feature. Upgrade to unlock detailed putt tracking.
              </div>
            )}

            {saving && (
              <div style={{fontSize:12,color:"var(--text-dim)",marginTop:8,textAlign:"center"}}>Saving…</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
