"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Phone, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import { isEmail, isPhone } from "@/lib/utils";

type Step = "contact" | "otp" | "newPassword" | "done";
type ContactMethod = "email" | "phone";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("contact");
  const [method, setMethod] = useState<ContactMethod>("email");
  const [contact, setContact] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const startResendCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown(p => { if (p <= 1) { clearInterval(interval); return 0; } return p - 1; });
    }, 1000);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const contactVal = contact.trim();
    if (method === "email" && !isEmail(contactVal)) { setError("Enter a valid email address"); return; }
    if (method === "phone" && !isPhone(contactVal)) { setError("Enter a valid phone number"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: contactVal }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error); return; }
      setStep("otp");
      startResendCooldown();
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) document.getElementById(`rotp-${index + 1}`)?.focus();
    if (newOtp.every(d => d !== "")) handleVerifyOtp(newOtp.join(""));
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`rotp-${index - 1}`)?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) { setOtp(pasted.split("")); handleVerifyOtp(pasted); }
  };

  const handleVerifyOtp = async (code: string) => {
    if (code.length !== 6) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: contact.trim(), code, purpose: "reset" }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error); setLoading(false); return; }
      setStep("newPassword");
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (newPassword !== confirmPassword) { setError("Passwords don't match"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: contact.trim(), code: otp.join(""), newPassword }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error); return; }
      setStep("done");
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  };

  return (
    <div className="pm-auth-root">
      <div className="pm-auth-card animate-fade-up">
        {/* Logo */}
        <div className="pm-auth-logo">
          <div className="pm-auth-logo-mark">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 5h14M3 10h10M3 15h6" stroke="#080C18" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "1.1rem", color: "var(--color-text)" }}>
            PromptMe
          </span>
        </div>

        {step === "contact" && (
          <>
            <h1 style={{ fontSize: "1.5rem", marginBottom: 8 }}>Reset your password</h1>
            <p style={{ fontSize: "0.875rem", marginBottom: 28, color: "var(--color-text-muted)" }}>
              Enter your email or phone and we&apos;ll send a verification code.
            </p>

            <div className="pm-tab-group" style={{ marginBottom: 20 }}>
              <button type="button" className={`pm-tab ${method === "email" ? "pm-tab-active" : ""}`}
                onClick={() => { setMethod("email"); setContact(""); setError(""); }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}><Mail size={14} /> Email</span>
              </button>
              <button type="button" className={`pm-tab ${method === "phone" ? "pm-tab-active" : ""}`}
                onClick={() => { setMethod("phone"); setContact(""); setError(""); }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}><Phone size={14} /> Phone</span>
              </button>
            </div>

            <form onSubmit={handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="pm-field">
                <label className="pm-label" htmlFor="reset-contact">{method === "email" ? "Email address" : "Phone number"}</label>
                <div style={{ position: "relative" }}>
                  <input id="reset-contact" className={`pm-input${error ? " pm-input-error" : ""}`}
                    type={method === "email" ? "email" : "tel"}
                    placeholder={method === "email" ? "you@example.com" : "+91 98765 43210"}
                    value={contact} onChange={e => setContact(e.target.value)} required style={{ paddingLeft: 38 }}
                  />
                  {method === "email"
                    ? <Mail size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-subtle)" }} />
                    : <Phone size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-subtle)" }} />
                  }
                </div>
              </div>
              {error && <p className="pm-field-error" role="alert">{error}</p>}
              <button type="submit" className="pm-btn pm-btn-primary pm-btn-lg" disabled={loading} style={{ justifyContent: "center" }}>
                {loading ? <Loader2 size={16} className="pm-spinner" /> : null}
                {loading ? "Sending..." : "Send Reset Code"}
              </button>
            </form>

            <p style={{ marginTop: 24, textAlign: "center", fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
              <Link href="/login" style={{ color: "var(--color-accent)", textDecoration: "none", fontWeight: 500 }}>
                ← Back to sign in
              </Link>
            </p>
          </>
        )}

        {step === "otp" && (
          <div className="animate-fade-up">
            <button type="button" onClick={() => { setStep("contact"); setOtp(["","","","","",""]); setError(""); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", fontSize: "0.8125rem", marginBottom: 24, display: "flex", alignItems: "center", gap: 6, padding: 0 }}>
              ← Back
            </button>
            <h2 style={{ marginBottom: 8 }}>Enter verification code</h2>
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginBottom: 32 }}>
              We sent a code to <strong style={{ color: "var(--color-text)" }}>{contact}</strong>
            </p>
            <div className="pm-otp-grid" onPaste={handleOtpPaste} style={{ marginBottom: 24 }}>
              {otp.map((digit, i) => (
                <input key={i} id={`rotp-${i}`} className="pm-otp-input" type="text" inputMode="numeric"
                  maxLength={1} value={digit} onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)} autoFocus={i === 0} aria-label={`Digit ${i + 1}`}
                />
              ))}
            </div>
            {error && <p className="pm-field-error" style={{ marginBottom: 16 }} role="alert">{error}</p>}
            <button type="button" className="pm-btn pm-btn-primary pm-btn-lg"
              onClick={() => handleVerifyOtp(otp.join(""))}
              disabled={loading || otp.join("").length !== 6}
              style={{ width: "100%", justifyContent: "center", marginBottom: 16 }}>
              {loading ? <Loader2 size={16} className="pm-spinner" /> : null}
              {loading ? "Verifying..." : "Verify Code"}
            </button>
            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", textAlign: "center" }}>
              <button type="button" onClick={handleSendOtp as unknown as React.MouseEventHandler}
                disabled={resendCooldown > 0}
                style={{ background: "none", border: "none", cursor: resendCooldown > 0 ? "not-allowed" : "pointer",
                  color: resendCooldown > 0 ? "var(--color-text-subtle)" : "var(--color-accent)",
                  fontWeight: 500, fontSize: "inherit", padding: 0 }}>
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
              </button>
            </p>
          </div>
        )}

        {step === "newPassword" && (
          <div className="animate-fade-up">
            <h2 style={{ marginBottom: 8 }}>Set new password</h2>
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginBottom: 28 }}>
              Choose a strong password for your account.
            </p>
            <form onSubmit={handleSetPassword} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="pm-field">
                <label className="pm-label" htmlFor="new-password">New password</label>
                <div style={{ position: "relative" }}>
                  <input id="new-password" className="pm-input" type={showPass ? "text" : "password"}
                    placeholder="At least 8 characters" value={newPassword}
                    onChange={e => setNewPassword(e.target.value)} required style={{ paddingRight: 42 }} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-subtle)", display: "flex" }}
                    aria-label="Toggle password visibility">
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div className="pm-field">
                <label className="pm-label" htmlFor="confirm-password">Confirm password</label>
                <input id="confirm-password" className={`pm-input${error.includes("match") ? " pm-input-error" : ""}`}
                  type={showPass ? "text" : "password"} placeholder="Repeat your password"
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
              </div>
              {error && <p className="pm-field-error" role="alert">{error}</p>}
              <button type="submit" className="pm-btn pm-btn-primary pm-btn-lg" disabled={loading}
                style={{ justifyContent: "center" }}>
                {loading ? <Loader2 size={16} className="pm-spinner" /> : null}
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>
        )}

        {step === "done" && (
          <div className="animate-fade-up" style={{ textAlign: "center" }}>
            <div style={{ width: 56, height: 56, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
              <CheckCircle size={24} style={{ color: "#10B981" }} />
            </div>
            <h2 style={{ marginBottom: 8 }}>Password updated!</h2>
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginBottom: 28 }}>
              Your password has been changed successfully. Sign in with your new password.
            </p>
            <Link href="/login" className="pm-btn pm-btn-primary pm-btn-lg"
              style={{ justifyContent: "center", display: "flex" }}>
              Sign in now
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
