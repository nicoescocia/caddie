/*
 * SQL to run in Supabase SQL editor before this feature is live:
 *
 *   CREATE TABLE IF NOT EXISTS feedback (
 *     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *     user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
 *     category text NOT NULL DEFAULT 'General',
 *     message text NOT NULL,
 *     page text,
 *     created_at timestamptz DEFAULT now()
 *   );
 *   ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
 *   CREATE POLICY "Users can insert own feedback" ON feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
 */

import { useState } from "react";
import { supabase } from "./supabaseClient";

const CATEGORIES = ["Bug", "Suggestion", "General"];

const css = `
  .fb-btn {
    position: fixed; bottom: 24px; right: 16px; z-index: 200;
    background: var(--green-dark); color: white;
    border: none; border-radius: 100px;
    padding: 10px 18px; font-family: 'Outfit', sans-serif;
    font-size: 13px; font-weight: 600; cursor: pointer;
    box-shadow: 0 4px 16px rgba(0,0,0,0.18);
    display: flex; align-items: center; gap: 7px;
    transition: background .18s, transform .15s;
    -webkit-tap-highlight-color: transparent;
  }
  .fb-btn:hover { background: var(--green); transform: translateY(-1px); }
  .fb-btn:active { transform: translateY(0); }

  .fb-backdrop {
    position: fixed; inset: 0; background: rgba(0,0,0,0.45);
    z-index: 300; display: flex; align-items: flex-end; justify-content: center;
  }
  .fb-sheet {
    background: white; border-radius: 20px 20px 0 0;
    padding: 28px 22px 44px; width: 100%; max-width: 520px;
    font-family: 'Outfit', sans-serif;
    animation: fb-slide-up .22s ease;
  }
  @keyframes fb-slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }

  .fb-sheet-title { font-family: 'Playfair Display', serif; font-size: 20px; color: var(--text); margin-bottom: 4px; }
  .fb-sheet-sub { font-size: 13px; color: var(--text-dim); margin-bottom: 20px; line-height: 1.5; }

  .fb-cat-row { display: flex; gap: 8px; margin-bottom: 16px; }
  .fb-cat-pill {
    flex: 1; padding: 8px 0; border: 1.5px solid var(--border);
    border-radius: 10px; font-family: 'Outfit', sans-serif;
    font-size: 13px; font-weight: 600; color: var(--text-dim);
    background: white; cursor: pointer; transition: all .15s;
    text-align: center;
  }
  .fb-cat-pill.active { background: var(--green-dark); border-color: var(--green-dark); color: white; }

  .fb-textarea {
    width: 100%; border: 1.5px solid var(--border); border-radius: 12px;
    padding: 12px 14px; font-family: 'Outfit', sans-serif;
    font-size: 14px; color: var(--text); resize: none;
    min-height: 110px; outline: none; transition: border-color .15s;
    background: white;
  }
  .fb-textarea:focus { border-color: var(--green); }
  .fb-textarea::placeholder { color: var(--text-dim); }

  .fb-submit {
    width: 100%; background: var(--green-dark); color: white;
    border: none; border-radius: 12px; padding: 14px;
    font-family: 'Outfit', sans-serif; font-size: 15px; font-weight: 700;
    cursor: pointer; margin-top: 12px; transition: background .2s;
  }
  .fb-submit:hover:not(:disabled) { background: var(--green); }
  .fb-submit:disabled { background: #C8C4BB; cursor: not-allowed; }

  .fb-cancel {
    width: 100%; background: none; border: 1.5px solid var(--border);
    border-radius: 12px; padding: 12px;
    font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 600;
    color: var(--text-mid); cursor: pointer; margin-top: 8px;
  }
  .fb-cancel:hover { border-color: var(--text-mid); }

  .fb-thanks {
    text-align: center; padding: 16px 0 8px;
    font-size: 16px; font-weight: 600; color: var(--green-dark);
  }
  .fb-thanks-sub { text-align: center; font-size: 13px; color: var(--text-dim); margin-bottom: 20px; }
`;

export default function FeedbackButton({ userId, page }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("General");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function openSheet() {
    setCategory("General");
    setMessage("");
    setSubmitted(false);
    setOpen(true);
  }

  function closeSheet() {
    setOpen(false);
  }

  async function handleSubmit() {
    if (!message.trim()) return;
    setSaving(true);
    await supabase.from("feedback").insert([{
      user_id: userId,
      category,
      message: message.trim(),
      page: page || null,
      created_at: new Date().toISOString(),
    }]);
    setSaving(false);
    setSubmitted(true);
    setTimeout(() => setOpen(false), 2000);
  }

  return (
    <>
      <style>{css}</style>
      <button className="fb-btn" onClick={openSheet}>
        <span style={{ fontSize: 15 }}>💬</span> Feedback
      </button>

      {open && (
        <div className="fb-backdrop" onClick={closeSheet}>
          <div className="fb-sheet" onClick={e => e.stopPropagation()}>
            {submitted ? (
              <>
                <div className="fb-thanks">Thanks for your feedback!</div>
                <div className="fb-thanks-sub">We read every submission.</div>
              </>
            ) : (
              <>
                <div className="fb-sheet-title">Send feedback</div>
                <div className="fb-sheet-sub">Something broken, or have an idea? Let us know.</div>

                <div className="fb-cat-row">
                  {CATEGORIES.map(c => (
                    <button
                      key={c}
                      className={"fb-cat-pill" + (category === c ? " active" : "")}
                      onClick={() => setCategory(c)}
                    >{c}</button>
                  ))}
                </div>

                <textarea
                  className="fb-textarea"
                  placeholder="Describe the issue or your idea…"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                />

                <button
                  className="fb-submit"
                  disabled={saving || !message.trim()}
                  onClick={handleSubmit}
                >
                  {saving ? "Sending…" : "Send feedback"}
                </button>
                <button className="fb-cancel" onClick={closeSheet}>Cancel</button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
