"use client";

import { useState } from "react";
import { GitCompare, Trophy, Minus, Loader2, Check } from "lucide-react";

type Winner = "a" | "b" | "tie" | "none";

export default function ComparePage() {
  const [baseTask, setBaseTask] = useState("");
  const [promptA, setPromptA] = useState("");
  const [promptB, setPromptB] = useState("");
  const [scoreA, setScoreA] = useState<number | "">("");
  const [scoreB, setScoreB] = useState<number | "">("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const winner: Winner = (() => {
    if (scoreA === "" || scoreB === "") return "none";
    if (scoreA > scoreB) return "a";
    if (scoreB > scoreA) return "b";
    return "tie";
  })();

  const handleSave = async () => {
    if (!promptA || !promptB) { setError("Both prompt variants are required"); return; }
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/comparisons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseTaskDescription: baseTask,
          promptABody: promptA,
          promptAScore: scoreA === "" ? null : scoreA,
          promptBBody: promptB,
          promptBScore: scoreB === "" ? null : scoreB,
          winner,
        }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Network error — try again");
    } finally {
      setSaving(false);
    }
  };

  const ScoreBar = ({ score }: { score: number | "" }) => {
    const pct = score === "" ? 0 : score;
    const color = pct >= 70 ? "var(--color-success)" : pct >= 40 ? "var(--color-accent)" : "var(--color-error)";
    return (
      <div style={{ height: 6, background: "var(--color-surface-2)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width 0.4s ease, background 0.3s" }} />
      </div>
    );
  };

  return (
    <div className="pm-content">
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ marginBottom: 4 }}>A/B Compare</h1>
        <p style={{ fontSize: "0.875rem" }}>
          Test two prompt variants side-by-side, score them, and find the winner.
        </p>
      </div>

      {/* Base task */}
      <div className="pm-field" style={{ marginBottom: 28 }}>
        <label className="pm-label" htmlFor="base-task">Base task description (optional)</label>
        <input id="base-task" className="pm-input" type="text"
          placeholder="What are both prompts trying to accomplish?"
          value={baseTask} onChange={e => setBaseTask(e.target.value)} />
      </div>

      {/* Winner banner */}
      {winner !== "none" && (
        <div style={{
          background: winner === "tie" ? "var(--color-surface-2)" : "var(--color-accent-soft)",
          border: `1px solid ${winner === "tie" ? "var(--color-border)" : "rgba(245,158,11,0.2)"}`,
          borderRadius: "var(--radius-md)", padding: "14px 20px", marginBottom: 20,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          {winner === "tie" ? <Minus size={18} style={{ color: "var(--color-text-muted)" }} /> : <Trophy size={18} style={{ color: "var(--color-accent)" }} />}
          <span style={{ fontWeight: 600, color: "var(--color-text)" }}>
            {winner === "tie" ? "It's a tie!" : `Prompt ${winner.toUpperCase()} wins`}
          </span>
          {winner !== "tie" && (
            <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
              with a score of {winner === "a" ? scoreA : scoreB}/100
            </span>
          )}
        </div>
      )}

      {/* Side-by-side panels */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        {/* Prompt A */}
        <div className="pm-card" style={{
          borderColor: winner === "a" ? "rgba(245,158,11,0.4)" : "var(--color-border)",
          ...(winner === "a" ? { background: "var(--color-accent-glow)" } : {}),
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: winner === "a" ? "var(--color-accent)" : "var(--color-surface-2)",
              border: `1px solid ${winner === "a" ? "transparent" : "var(--color-border)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.75rem", fontWeight: 700, color: winner === "a" ? "#080C18" : "var(--color-text-muted)" }}>
              A
            </div>
            <span style={{ fontWeight: 600, color: "var(--color-text)", fontSize: "0.9rem" }}>Prompt A</span>
            {winner === "a" && <Trophy size={14} style={{ color: "var(--color-accent)", marginLeft: "auto" }} />}
          </div>
          <textarea className="pm-input" rows={8}
            placeholder="Paste or type Prompt A here..."
            value={promptA} onChange={e => setPromptA(e.target.value)}
            style={{ resize: "vertical", fontFamily: "var(--font-mono)", fontSize: "0.8125rem", marginBottom: 14 }} />
          <div className="pm-field">
            <label className="pm-label" htmlFor="score-a">Score (0–100)</label>
            <input id="score-a" className="pm-input" type="number" min={0} max={100}
              placeholder="Rate this prompt..."
              value={scoreA} onChange={e => setScoreA(e.target.value === "" ? "" : Math.min(100, Math.max(0, parseInt(e.target.value))))} />
          </div>
          {scoreA !== "" && <ScoreBar score={scoreA} />}
        </div>

        {/* Prompt B */}
        <div className="pm-card" style={{
          borderColor: winner === "b" ? "rgba(245,158,11,0.4)" : "var(--color-border)",
          ...(winner === "b" ? { background: "var(--color-accent-glow)" } : {}),
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: winner === "b" ? "var(--color-accent)" : "var(--color-surface-2)",
              border: `1px solid ${winner === "b" ? "transparent" : "var(--color-border)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.75rem", fontWeight: 700, color: winner === "b" ? "#080C18" : "var(--color-text-muted)" }}>
              B
            </div>
            <span style={{ fontWeight: 600, color: "var(--color-text)", fontSize: "0.9rem" }}>Prompt B</span>
            {winner === "b" && <Trophy size={14} style={{ color: "var(--color-accent)", marginLeft: "auto" }} />}
          </div>
          <textarea className="pm-input" rows={8}
            placeholder="Paste or type Prompt B here..."
            value={promptB} onChange={e => setPromptB(e.target.value)}
            style={{ resize: "vertical", fontFamily: "var(--font-mono)", fontSize: "0.8125rem", marginBottom: 14 }} />
          <div className="pm-field">
            <label className="pm-label" htmlFor="score-b">Score (0–100)</label>
            <input id="score-b" className="pm-input" type="number" min={0} max={100}
              placeholder="Rate this prompt..."
              value={scoreB} onChange={e => setScoreB(e.target.value === "" ? "" : Math.min(100, Math.max(0, parseInt(e.target.value))))} />
          </div>
          {scoreB !== "" && <ScoreBar score={scoreB} />}
        </div>
      </div>

      {error && <p className="pm-field-error" style={{ marginBottom: 12 }}>{error}</p>}

      <button type="button" className="pm-btn pm-btn-primary" onClick={handleSave}
        disabled={saving || saved || !promptA || !promptB}
        style={{ display: "flex", alignItems: "center" }}>
        {saving ? <Loader2 size={15} className="pm-spinner" /> : saved ? <Check size={15} /> : <GitCompare size={15} />}
        {saving ? "Saving..." : saved ? "Comparison saved!" : "Save Comparison"}
      </button>

      <style>{`
        @media (max-width: 768px) {
          .compare-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
