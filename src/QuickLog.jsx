// Quick-log scorecard grid — a faster alternative to the hole-by-hole flow.
// One row per hole (score / putts / fairway / penalty / picked-up / did-not-play),
// the whole round saved in a single action. No approach bands, putt distances,
// shots inside 50, or short-game reasons are captured here. GIR is derived on
// save by the parent (StudentLogging) rather than asked for.
import { useState, useMemo } from "react";

const css = `
  .ql-root {
    --green-dark:#0F3D2E; --green:#1A6B4A; --green-mid:#2A8A60; --green-light:#3DAA78;
    --bg:#F4F1EB; --gold:#C9A84C; --red:#C94040; --orange:#D4763A;
    --text:#1C1C1C; --text-mid:#555; --text-dim:#999; --border:#E2DDD4;
    font-family:'Outfit',sans-serif; color:var(--text);
    max-width:520px; margin:0 auto; padding:0 16px 120px;
  }
  .ql-sticky {
    position:sticky; top:0; z-index:20; background:var(--bg);
    padding:14px 0 12px; border-bottom:1.5px solid var(--border); margin-bottom:16px;
  }
  .ql-totals { display:flex; gap:10px; }
  .ql-stat {
    flex:1; background:white; border:1.5px solid var(--border); border-radius:12px;
    padding:8px 10px; text-align:center;
  }
  .ql-stat-lbl { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--text-dim); margin-bottom:2px; }
  .ql-stat-val { font-family:'Playfair Display',serif; font-size:22px; line-height:1; }
  .ql-card {
    background:white; border:1.5px solid var(--border); border-radius:14px;
    padding:12px 14px; margin-bottom:10px;
  }
  .ql-card.disabled { opacity:.5; }
  .ql-card-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
  .ql-hole { font-weight:700; font-size:15px; }
  .ql-hole span { color:var(--text-dim); font-weight:600; font-size:13px; margin-left:6px; }
  .ql-toggles { display:flex; gap:6px; }
  .ql-tog {
    background:none; border:1.3px solid var(--border); border-radius:8px;
    padding:5px 9px; font-family:'Outfit',sans-serif; font-size:11px; font-weight:700;
    color:var(--text-mid); cursor:pointer;
  }
  .ql-tog.on { background:var(--green); border-color:var(--green); color:white; }
  .ql-row { display:flex; flex-wrap:wrap; gap:14px 18px; align-items:center; }
  .ql-field { display:flex; align-items:center; gap:8px; }
  .ql-field-lbl { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:var(--text-dim); }
  .ql-step { display:flex; align-items:center; gap:0; }
  .ql-step button {
    width:30px; height:30px; border:1.3px solid var(--border); background:var(--bg);
    font-size:18px; font-weight:700; color:var(--green); cursor:pointer; line-height:1;
    display:flex; align-items:center; justify-content:center;
  }
  .ql-step button:first-child { border-radius:8px 0 0 8px; }
  .ql-step button:last-child { border-radius:0 8px 8px 0; }
  .ql-step .ql-val {
    min-width:34px; height:30px; border-top:1.3px solid var(--border); border-bottom:1.3px solid var(--border);
    display:flex; align-items:center; justify-content:center; font-weight:700; font-size:15px;
  }
  .ql-val.under { color:var(--red); }
  .ql-val.over  { color:var(--green-mid); }
  .ql-seg { display:flex; }
  .ql-seg button {
    width:34px; height:30px; border:1.3px solid var(--border); border-left:none;
    background:var(--bg); font-family:'Outfit',sans-serif; font-size:12px; font-weight:700;
    color:var(--text-mid); cursor:pointer;
  }
  .ql-seg button:first-child { border-left:1.3px solid var(--border); border-radius:8px 0 0 8px; }
  .ql-seg button:last-child  { border-radius:0 8px 8px 0; }
  .ql-seg button.on { color:white; }
  .ql-seg button.on.hit  { background:var(--green-mid); border-color:var(--green-mid); }
  .ql-seg button.on.miss { background:var(--orange); border-color:var(--orange); }
  .ql-pen {
    display:flex; align-items:center; gap:7px; background:var(--bg);
    border:1.3px solid var(--border); border-radius:8px; padding:5px 10px;
    font-family:'Outfit',sans-serif; font-size:13px; font-weight:700; color:var(--text-mid); cursor:pointer;
  }
  .ql-pen.on { background:var(--red); border-color:var(--red); color:white; }
  .ql-save-bar {
    position:fixed; left:0; right:0; bottom:0; background:white;
    border-top:1.5px solid var(--border); padding:12px 16px;
    display:flex; justify-content:center; z-index:30;
  }
  .ql-save {
    width:100%; max-width:488px; background:var(--green); color:white; border:none;
    border-radius:14px; padding:15px; font-family:'Outfit',sans-serif; font-size:16px;
    font-weight:700; cursor:pointer;
  }
  .ql-save:disabled { opacity:.6; cursor:default; }
`;

function emptyQuickHole(par) {
  return { score: par, putts: 2, fairway: null, penalty: 0, pickedUp: false, dna: false };
}

export default function QuickLog({ holes, courseName, handicap, netDoubleBogey, saving, saveError, onSave, onCancel }) {
  const hcp = parseInt(handicap, 10) || 0;
  const [rows, setRows] = useState(() => holes.map(h => emptyQuickHole(h.par)));

  function update(i, fields) {
    setRows(prev => { const n = [...prev]; n[i] = { ...n[i], ...fields }; return n; });
  }

  const totals = useMemo(() => {
    let score = 0, par = 0, putts = 0;
    holes.forEach((h, i) => {
      const r = rows[i];
      if (r.dna) return;
      par += h.par;
      score += r.pickedUp ? netDoubleBogey(h.par, h.idx, hcp, holes.length) : r.score;
      if (!r.pickedUp) putts += r.putts;
    });
    return { score, par, putts, vsPar: score - par };
  }, [rows, holes, hcp, netDoubleBogey]);

  const vsParLabel = totals.vsPar === 0 ? "E" : totals.vsPar > 0 ? `+${totals.vsPar}` : String(totals.vsPar);

  // Fairway cycles between a chosen state and off; par 3s never show it.
  function setFairway(i, val) {
    update(i, { fairway: rows[i].fairway === val ? null : val });
  }

  return (
    <div className="ql-root">
      <style>{css}</style>

      <div className="ql-sticky">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18 }}>{courseName || "Quick log"}</div>
          <button onClick={onCancel} style={{ background: "none", border: "none", fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 700, color: "var(--text-mid)", cursor: "pointer" }}>← Back</button>
        </div>
        <div className="ql-totals">
          <div className="ql-stat">
            <div className="ql-stat-lbl">Score</div>
            <div className="ql-stat-val">{totals.score}</div>
          </div>
          <div className="ql-stat">
            <div className="ql-stat-lbl">vs Par</div>
            <div className="ql-stat-val" style={{ color: totals.vsPar < 0 ? "var(--red)" : totals.vsPar > 0 ? "var(--green-mid)" : "var(--text)" }}>{vsParLabel}</div>
          </div>
          <div className="ql-stat">
            <div className="ql-stat-lbl">Putts</div>
            <div className="ql-stat-val">{totals.putts}</div>
          </div>
        </div>
      </div>

      {holes.map((h, i) => {
        const r = rows[i];
        const locked = r.dna || r.pickedUp;
        const scoreClass = r.score < h.par ? "under" : r.score > h.par ? "over" : "";
        return (
          <div key={h.n} className={"ql-card" + (r.dna ? " disabled" : "")}>
            <div className="ql-card-head">
              <div className="ql-hole">Hole {h.n}<span>Par {h.par}</span></div>
              <div className="ql-toggles">
                <button
                  className={"ql-tog" + (r.pickedUp ? " on" : "")}
                  onClick={() => update(i, { pickedUp: !r.pickedUp, dna: false })}
                >Picked up</button>
                <button
                  className={"ql-tog" + (r.dna ? " on" : "")}
                  onClick={() => update(i, { dna: !r.dna, pickedUp: false })}
                >Did not play</button>
              </div>
            </div>

            {!locked && (
              <div className="ql-row">
                <div className="ql-field">
                  <span className="ql-field-lbl">Score</span>
                  <div className="ql-step">
                    <button onClick={() => update(i, { score: Math.max(1, r.score - 1) })}>−</button>
                    <div className={"ql-val " + scoreClass}>{r.score}</div>
                    <button onClick={() => update(i, { score: r.score + 1 })}>+</button>
                  </div>
                </div>

                <div className="ql-field">
                  <span className="ql-field-lbl">Putts</span>
                  <div className="ql-step">
                    <button onClick={() => update(i, { putts: Math.max(0, r.putts - 1) })}>−</button>
                    <div className="ql-val">{r.putts}</div>
                    <button onClick={() => update(i, { putts: r.putts + 1 })}>+</button>
                  </div>
                </div>

                {h.par >= 4 && (
                  <div className="ql-field">
                    <span className="ql-field-lbl">Fairway</span>
                    <div className="ql-seg">
                      <button className={r.fairway === "yes" ? "on hit" : ""} onClick={() => setFairway(i, "yes")}>Hit</button>
                      <button className={r.fairway === "left" ? "on miss" : ""} onClick={() => setFairway(i, "left")}>Left</button>
                      <button className={r.fairway === "right" ? "on miss" : ""} onClick={() => setFairway(i, "right")}>Right</button>
                    </div>
                  </div>
                )}

                <button
                  className={"ql-pen" + (r.penalty > 0 ? " on" : "")}
                  onClick={() => update(i, { penalty: (r.penalty + 1) % 4 })}
                  title="Tap to add a penalty stroke"
                >⚑ {r.penalty > 0 ? r.penalty : "Penalty"}</button>
              </div>
            )}
          </div>
        );
      })}

      {saveError && (
        <div style={{ color: "var(--red)", fontSize: 13, fontWeight: 600, textAlign: "center", marginTop: 8 }}>{saveError}</div>
      )}

      <div className="ql-save-bar">
        <button className="ql-save" disabled={saving} onClick={() => onSave(rows)}>
          {saving ? "Saving…" : "Save round"}
        </button>
      </div>
    </div>
  );
}
