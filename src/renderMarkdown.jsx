// Lightweight markdown renderer for AI-generated coach text (briefs, pattern
// analysis). Intentionally minimal — no library. Handles: ## headings, whole-line
// **bold** headings (incl. numbered "1. ..."), **bold** inline, "-"/"–"/"•"
// bullets, and "---" dividers. Returns an array of React elements.

const HEADING_STYLE = { fontSize: 13, fontWeight: 700, color: "var(--text)", textTransform: "uppercase", letterSpacing: ".04em", margin: "12px 0 6px" };

function parseInline(text, keyPrefix) {
  const parts = [];
  const regex = /\*\*(.+?)\*\*/g;
  let last = 0, m, i = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(<strong key={`${keyPrefix}-b${i}`}>{m[1]}</strong>);
    last = m.index + m[0].length;
    i++;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export default function renderMarkdown(text) {
  if (!text) return null;
  const out = [];
  String(text).split("\n").forEach((raw, idx) => {
    const line = raw.trim();
    const key = `md-${idx}`;
    if (!line) return; // blank line — spacing comes from element margins

    // Divider (--- or *** or ___)
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) {
      out.push(<hr key={key} style={{ border: "none", borderTop: "1px solid var(--border)", margin: "10px 0" }} />);
      return;
    }

    // Heading (## Heading)
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      out.push(<div key={key} style={HEADING_STYLE}>{parseInline(h[2], key)}</div>);
      return;
    }

    // Bold heading: a whole line that is a single bold span, optionally prefixed
    // by a number (e.g. "**Title**", "**1. Title**", "1. **Title**"). The model
    // emits section titles this way instead of ## headings, so treat them as
    // headings too. The !includes("**") guard rules out body lines that merely
    // start and end with separate bold spans.
    const boldHeading = line.match(/^(\d+\.\s+)?\*\*(.+?)\*\*$/);
    if (boldHeading && !boldHeading[2].includes("**")) {
      out.push(<div key={key} style={HEADING_STYLE}>{(boldHeading[1] || "") + boldHeading[2]}</div>);
      return;
    }

    // Bullet (- / – / •)
    const b = line.match(/^[-–•]\s+(.*)$/);
    if (b) {
      out.push(
        <div key={key} style={{ display: "flex", gap: 8, margin: "3px 0", lineHeight: 1.55 }}>
          <span style={{ color: "var(--green)", flexShrink: 0 }}>•</span>
          <span>{parseInline(b[1], key)}</span>
        </div>
      );
      return;
    }

    // Paragraph
    out.push(
      <div key={key} style={{ margin: "4px 0", lineHeight: 1.6 }}>{parseInline(line, key)}</div>
    );
  });
  return out;
}
