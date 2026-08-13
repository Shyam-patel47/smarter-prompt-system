"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Trash2, Copy, Check, Save, Wand2, ChevronDown,
  Loader2, Variable, Eye, Settings2
} from "lucide-react";
import {
  buildPrompt, TASK_TYPES, TONES, OUTPUT_FORMATS, TARGET_MODELS,
  type PromptBuildInput
} from "@/lib/prompt-engine";

interface Variable {
  id: string;
  key: string;
  label: string;
  defaultValue: string;
}

const DEFAULT_VARIABLE = (): Variable => ({
  id: Math.random().toString(36).slice(2),
  key: "",
  label: "",
  defaultValue: "",
});

export default function BuilderPage() {
  const router = useRouter();

  // Form state
  const [title, setTitle] = useState("");
  const [taskType, setTaskType] = useState("MARKETING_COPY");
  const [details, setDetails] = useState("");
  const [tone, setTone] = useState("PROFESSIONAL");
  const [outputFormat, setOutputFormat] = useState("PARAGRAPH");
  const [targetModel, setTargetModel] = useState("GPT_4O");
  const [variables, setVariables] = useState<Variable[]>([]);

  // UI state
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"builder" | "preview">("builder");
  const [error, setError] = useState("");

  // Live preview — regenerate whenever inputs change
  useEffect(() => {
    if (!details.trim()) { setGeneratedPrompt(""); return; }

    const input: PromptBuildInput = {
      title: title || "Untitled Prompt",
      taskType,
      details,
      tone,
      outputFormat,
      targetModel,
      variables: variables.filter(v => v.key && v.label),
    };

    setGeneratedPrompt(buildPrompt(input));
  }, [title, taskType, details, tone, outputFormat, targetModel, variables]);

  const addVariable = () => setVariables(v => [...v, DEFAULT_VARIABLE()]);

  const updateVariable = (id: string, field: keyof Variable, value: string) => {
    setVariables(v => v.map(va => va.id === id ? { ...va, [field]: value } : va));
  };

  const removeVariable = (id: string) => {
    setVariables(v => v.filter(va => va.id !== id));
  };

  const handleCopy = useCallback(() => {
    if (!generatedPrompt) return;
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [generatedPrompt]);

  const handleSave = async () => {
    if (!generatedPrompt) { setError("Generate a prompt first"); return; }
    if (!title.trim()) { setError("Add a title before saving"); return; }
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          taskType,
          detailsInput: details,
          tone,
          outputFormat,
          targetModel,
          generatedBody: generatedPrompt,
          variables: variables.filter(v => v.key && v.label).map((v, i) => ({
            key: v.key, label: v.label, defaultValue: v.defaultValue || undefined, orderIndex: i,
          })),
        }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error); return; }
      setSaved(true);
      setTimeout(() => {
        router.push("/library");
      }, 1200);
    } catch {
      setError("Network error — please try again");
    } finally {
      setSaving(false);
    }
  };

  const renderVariableTokens = (text: string) => {
    const parts = text.split(/(\{[^}]+\})/g);
    return parts.map((part, i) => {
      if (/^\{[^}]+\}$/.test(part)) {
        return <span key={i} className="pm-variable-token">{part}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* LEFT PANEL — Builder form */}
      <div style={{
        width: "50%", borderRight: "1px solid var(--color-border)",
        display: "flex", flexDirection: "column", overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px 16px", borderBottom: "1px solid var(--color-border)",
          display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0,
          background: "var(--color-bg)", zIndex: 10, backdropFilter: "blur(8px)",
        }}>
          <div style={{ width: 28, height: 28, background: "var(--color-accent-soft)", borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Wand2 size={14} style={{ color: "var(--color-accent)" }} />
          </div>
          <div>
            <h1 style={{ fontSize: "1rem", marginBottom: 0, fontFamily: "var(--font-heading)" }}>Prompt Builder</h1>
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: 0 }}>
              Fill in the fields — preview updates live
            </p>
          </div>

          {/* Mobile tab toggle */}
          <div className="pm-tab-group" style={{ marginLeft: "auto", display: "none" }} id="mobile-tab-toggle">
            <button type="button" className={`pm-tab ${activeTab === "builder" ? "pm-tab-active" : ""}`}
              onClick={() => setActiveTab("builder")} style={{ padding: "5px 12px" }}>
              <Settings2 size={13} />
            </button>
            <button type="button" className={`pm-tab ${activeTab === "preview" ? "pm-tab-active" : ""}`}
              onClick={() => setActiveTab("preview")} style={{ padding: "5px 12px" }}>
              <Eye size={13} />
            </button>
          </div>
        </div>

        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 20, flex: 1 }}>
          {/* Title */}
          <div className="pm-field">
            <label className="pm-label" htmlFor="prompt-title">Prompt title</label>
            <input id="prompt-title" className="pm-input" type="text"
              placeholder="e.g. Product launch email template"
              value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          {/* Task type */}
          <div className="pm-field">
            <label className="pm-label" htmlFor="task-type">Task type</label>
            <div style={{ position: "relative" }}>
              <select id="task-type" className="pm-input" value={taskType}
                onChange={e => setTaskType(e.target.value)}
                style={{ appearance: "none", paddingRight: 36, cursor: "pointer" }}>
                {TASK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <ChevronDown size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-subtle)", pointerEvents: "none" }} />
            </div>
          </div>

          {/* Details */}
          <div className="pm-field">
            <label className="pm-label" htmlFor="details">Details & context</label>
            <textarea id="details" className="pm-input"
              placeholder="Describe exactly what you need. Be specific — the more context you give, the better the output."
              value={details} onChange={e => setDetails(e.target.value)}
              rows={5} style={{ resize: "vertical", lineHeight: 1.6 }} />
            {variables.length > 0 && (
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-subtle)", marginTop: 4 }}>
                Tip: use <code style={{ background: "var(--color-surface-2)", padding: "1px 4px", borderRadius: 3 }}>{"{variable_name}"}</code> in your details to reference variables below.
              </p>
            )}
          </div>

          {/* Tone + Output format — 2 col */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="pm-field">
              <label className="pm-label" htmlFor="tone">Tone</label>
              <div style={{ position: "relative" }}>
                <select id="tone" className="pm-input" value={tone}
                  onChange={e => setTone(e.target.value)}
                  style={{ appearance: "none", paddingRight: 36, cursor: "pointer" }}>
                  {TONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <ChevronDown size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-subtle)", pointerEvents: "none" }} />
              </div>
            </div>

            <div className="pm-field">
              <label className="pm-label" htmlFor="output-format">Output format</label>
              <div style={{ position: "relative" }}>
                <select id="output-format" className="pm-input" value={outputFormat}
                  onChange={e => setOutputFormat(e.target.value)}
                  style={{ appearance: "none", paddingRight: 36, cursor: "pointer" }}>
                  {OUTPUT_FORMATS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
                <ChevronDown size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-subtle)", pointerEvents: "none" }} />
              </div>
            </div>
          </div>

          {/* Target model */}
          <div className="pm-field">
            <label className="pm-label" htmlFor="target-model">
              Target model <span style={{ color: "var(--color-text-subtle)", fontWeight: 400 }}>(optional, metadata only)</span>
            </label>
            <div style={{ position: "relative" }}>
              <select id="target-model" className="pm-input" value={targetModel}
                onChange={e => setTargetModel(e.target.value)}
                style={{ appearance: "none", paddingRight: 36, cursor: "pointer" }}>
                {TARGET_MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <ChevronDown size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-subtle)", pointerEvents: "none" }} />
            </div>
          </div>

          {/* Variables */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <label className="pm-label" style={{ margin: 0 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Variable size={13} />
                  Variables / Placeholders
                </span>
              </label>
              <button type="button" className="pm-btn pm-btn-ghost pm-btn-sm"
                onClick={addVariable} style={{ fontSize: "0.75rem" }}>
                <Plus size={13} /> Add variable
              </button>
            </div>

            {variables.length === 0 ? (
              <div
                onClick={addVariable}
                style={{
                  border: "1px dashed var(--color-border)", borderRadius: "var(--radius-sm)",
                  padding: "16px", textAlign: "center", cursor: "pointer", color: "var(--color-text-muted)",
                  fontSize: "0.8125rem", transition: "border-color 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--color-accent)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--color-border)")}
              >
                + Add a variable like <code style={{ color: "var(--color-accent)" }}>{"{product_name}"}</code>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {variables.map((v) => (
                  <div key={v.id} style={{
                    display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 8, alignItems: "end",
                    background: "var(--color-surface-2)", border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-sm)", padding: "12px",
                  }}>
                    <div className="pm-field" style={{ gap: 4 }}>
                      <label className="pm-label" style={{ fontSize: "0.6875rem", marginBottom: 4 }}>Key</label>
                      <input className="pm-input" type="text" placeholder="product_name"
                        value={v.key}
                        onChange={e => updateVariable(v.id, "key", e.target.value.replace(/\s/g, "_").toLowerCase())}
                        style={{ fontSize: "0.8125rem", padding: "6px 10px" }} />
                    </div>
                    <div className="pm-field" style={{ gap: 4 }}>
                      <label className="pm-label" style={{ fontSize: "0.6875rem", marginBottom: 4 }}>Label</label>
                      <input className="pm-input" type="text" placeholder="Product Name"
                        value={v.label} onChange={e => updateVariable(v.id, "label", e.target.value)}
                        style={{ fontSize: "0.8125rem", padding: "6px 10px" }} />
                    </div>
                    <div className="pm-field" style={{ gap: 4 }}>
                      <label className="pm-label" style={{ fontSize: "0.6875rem", marginBottom: 4 }}>Default</label>
                      <input className="pm-input" type="text" placeholder="Optional"
                        value={v.defaultValue} onChange={e => updateVariable(v.id, "defaultValue", e.target.value)}
                        style={{ fontSize: "0.8125rem", padding: "6px 10px" }} />
                    </div>
                    <button type="button"
                      onClick={() => removeVariable(v.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-subtle)",
                        padding: 6, borderRadius: 4, display: "flex", alignItems: "center",
                        transition: "color 0.15s", marginBottom: 1 }}
                      onMouseEnter={e => (e.currentTarget.style.color = "var(--color-error)")}
                      onMouseLeave={e => (e.currentTarget.style.color = "var(--color-text-subtle)")}
                      aria-label="Remove variable">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error */}
          {error && <p className="pm-field-error" role="alert">{error}</p>}
        </div>
      </div>

      {/* RIGHT PANEL — Live preview */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", overflowY: "auto",
        background: "var(--color-surface)",
      }}>
        {/* Preview header */}
        <div style={{
          padding: "20px 24px 16px", borderBottom: "1px solid var(--color-border)",
          display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0,
          background: "var(--color-surface)", zIndex: 10, backdropFilter: "blur(8px)",
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text)" }}>Live Preview</div>
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
              Updates as you type
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="pm-btn pm-btn-ghost pm-btn-sm" onClick={handleCopy}
              disabled={!generatedPrompt} title="Copy to clipboard">
              {copied ? <Check size={13} style={{ color: "var(--color-success)" }} /> : <Copy size={13} />}
              {copied ? "Copied!" : "Copy"}
            </button>
            <button type="button" className="pm-btn pm-btn-primary pm-btn-sm" onClick={handleSave}
              disabled={saving || !generatedPrompt || saved}>
              {saving ? <Loader2 size={13} className="pm-spinner" /> : saved ? <Check size={13} /> : <Save size={13} />}
              {saving ? "Saving..." : saved ? "Saved!" : "Save to Library"}
            </button>
          </div>
        </div>

        {/* Preview content */}
        <div style={{ padding: 24, flex: 1 }}>
          {!generatedPrompt ? (
            <div className="pm-empty-state" style={{ paddingTop: 80 }}>
              <div className="pm-empty-icon" style={{ width: 56, height: 56 }}>
                <Wand2 size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 600, color: "var(--color-text)", marginBottom: 6 }}>
                  Your prompt will appear here
                </div>
                <div style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                  Fill in the details on the left to see a live preview.
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* Metadata bar */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                <span className="pm-badge pm-badge-accent">{TASK_TYPES.find(t => t.value === taskType)?.label}</span>
                <span className="pm-badge pm-badge-default">{TONES.find(t => t.value === tone)?.label}</span>
                <span className="pm-badge pm-badge-default">{OUTPUT_FORMATS.find(f => f.value === outputFormat)?.label}</span>
                <span className="pm-badge pm-badge-default">{TARGET_MODELS.find(m => m.value === targetModel)?.label}</span>
                {variables.filter(v => v.key).length > 0 && (
                  <span className="pm-badge pm-badge-default">
                    {variables.filter(v => v.key).length} variable{variables.filter(v => v.key).length > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {/* Prompt block */}
              <div className="pm-prompt-block animate-fade-in">
                {renderVariableTokens(generatedPrompt)}
              </div>

              {/* Character count */}
              <div style={{ marginTop: 12, fontSize: "0.75rem", color: "var(--color-text-subtle)", display: "flex", gap: 16 }}>
                <span>{generatedPrompt.length} characters</span>
                <span>~{Math.ceil(generatedPrompt.length / 4)} tokens</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile responsive override */}
      <style>{`
        @media (max-width: 768px) {
          #mobile-tab-toggle { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
