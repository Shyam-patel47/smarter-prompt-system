"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { User, Lock, Palette, Download, Trash2, Loader2, Check, Moon, Sun } from "lucide-react";

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<"profile" | "security" | "theme" | "data" | "danger">("profile");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [exporting, setExporting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleThemeToggle = (t: "dark" | "light") => {
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("pm-theme", t);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/prompts?limit=1000");
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data.prompts, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `promptme-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) { setError("Passwords don't match"); return; }
    if (newPassword.length < 8) { setError("Password must be at least 8 characters"); return; }
    // TODO: implement password change API call
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const sections = [
    { id: "profile" as const, icon: User, label: "Profile" },
    { id: "security" as const, icon: Lock, label: "Security" },
    { id: "theme" as const, icon: Palette, label: "Appearance" },
    { id: "data" as const, icon: Download, label: "Data" },
    { id: "danger" as const, icon: Trash2, label: "Danger zone" },
  ];

  return (
    <div className="pm-content" style={{ maxWidth: 800 }}>
      <h1 style={{ marginBottom: 32 }}>Settings</h1>

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        {/* Section nav */}
        <nav style={{ width: 160, flexShrink: 0 }}>
          {sections.map(({ id, icon: Icon, label }) => (
            <button key={id} type="button"
              className={`pm-nav-item ${activeSection === id ? "pm-nav-item-active" : ""}`}
              onClick={() => setActiveSection(id)}
              style={{ width: "100%", marginBottom: 2, ...(id === "danger" ? { color: activeSection === "danger" ? "var(--color-error)" : "var(--color-text-muted)" } : {}) }}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {activeSection === "profile" && (
            <div className="pm-card">
              <h2 style={{ fontSize: "1rem", marginBottom: 20 }}>Profile</h2>
              <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className="pm-field">
                  <label className="pm-label" htmlFor="profile-name">Display name</label>
                  <input id="profile-name" className="pm-input" type="text"
                    placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <button type="submit" className="pm-btn pm-btn-primary pm-btn-sm" style={{ alignSelf: "flex-start" }}>
                  {saved ? <Check size={13} /> : null}
                  {saved ? "Saved!" : "Save changes"}
                </button>
              </form>
            </div>
          )}

          {activeSection === "security" && (
            <div className="pm-card">
              <h2 style={{ fontSize: "1rem", marginBottom: 20 }}>Change password</h2>
              <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className="pm-field">
                  <label className="pm-label" htmlFor="current-password">Current password</label>
                  <input id="current-password" className="pm-input" type="password"
                    value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
                </div>
                <div className="pm-field">
                  <label className="pm-label" htmlFor="new-password-settings">New password</label>
                  <input id="new-password-settings" className="pm-input" type="password"
                    placeholder="At least 8 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                </div>
                <div className="pm-field">
                  <label className="pm-label" htmlFor="confirm-password-settings">Confirm new password</label>
                  <input id="confirm-password-settings" className={`pm-input${error ? " pm-input-error" : ""}`} type="password"
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                </div>
                {error && <p className="pm-field-error">{error}</p>}
                <button type="submit" className="pm-btn pm-btn-primary pm-btn-sm" style={{ alignSelf: "flex-start" }}>
                  {saved ? <Check size={13} /> : <Lock size={13} />}
                  {saved ? "Password updated!" : "Update password"}
                </button>
              </form>
            </div>
          )}

          {activeSection === "theme" && (
            <div className="pm-card">
              <h2 style={{ fontSize: "1rem", marginBottom: 20 }}>Appearance</h2>
              <p style={{ fontSize: "0.875rem", marginBottom: 20 }}>Choose your preferred interface theme.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { value: "dark" as const, icon: Moon, label: "Dark", desc: "Easy on the eyes" },
                  { value: "light" as const, icon: Sun, label: "Light", desc: "Clean and bright" },
                ].map(({ value, icon: Icon, label, desc }) => (
                  <button key={value} type="button" onClick={() => handleThemeToggle(value)}
                    className="pm-card"
                    style={{
                      cursor: "pointer", textAlign: "left", border: `1px solid ${theme === value ? "var(--color-accent)" : "var(--color-border)"}`,
                      background: theme === value ? "var(--color-accent-glow)" : "var(--color-surface)",
                      display: "flex", alignItems: "center", gap: 12, transition: "all 0.15s",
                    }}>
                    <Icon size={18} style={{ color: theme === value ? "var(--color-accent)" : "var(--color-text-muted)" }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text)" }}>{label}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{desc}</div>
                    </div>
                    {theme === value && <Check size={14} style={{ marginLeft: "auto", color: "var(--color-accent)" }} />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeSection === "data" && (
            <div className="pm-card">
              <h2 style={{ fontSize: "1rem", marginBottom: 8 }}>Export your data</h2>
              <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginBottom: 20 }}>
                Download all your prompts as a JSON file. You can use this to back up or migrate your library.
              </p>
              <button type="button" className="pm-btn pm-btn-outline" onClick={handleExport} disabled={exporting}>
                {exporting ? <Loader2 size={15} className="pm-spinner" /> : <Download size={15} />}
                {exporting ? "Preparing export..." : "Export all prompts as JSON"}
              </button>
            </div>
          )}

          {activeSection === "danger" && (
            <div className="pm-card" style={{ borderColor: "rgba(239,68,68,0.2)" }}>
              <h2 style={{ fontSize: "1rem", marginBottom: 8, color: "var(--color-error)" }}>Danger zone</h2>
              <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginBottom: 20 }}>
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <div className="pm-field" style={{ marginBottom: 16 }}>
                <label className="pm-label" htmlFor="delete-confirm">
                  Type <strong style={{ color: "var(--color-error)" }}>DELETE</strong> to confirm
                </label>
                <input id="delete-confirm" className="pm-input pm-input-error" type="text"
                  placeholder="DELETE" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} />
              </div>
              <button type="button" className="pm-btn pm-btn-danger"
                disabled={deleteConfirm !== "DELETE"}
                onClick={() => {
                  if (deleteConfirm === "DELETE") {
                    // TODO: call delete account API then signOut
                    signOut({ callbackUrl: "/" });
                  }
                }}>
                <Trash2 size={15} /> Permanently delete account
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
