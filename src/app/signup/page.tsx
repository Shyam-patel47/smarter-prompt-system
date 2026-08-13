"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Phone, User, ArrowRight, Loader2 } from "lucide-react";
import { isEmail, isPhone } from "@/lib/utils";

type Step = "form" | "otp";
type ContactMethod = "email" | "phone";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const [method, setMethod] = useState<ContactMethod>("email");
  const [contact, setContact] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const contactVal = contact.trim();
    if (method === "email" && !isEmail(contactVal)) {
      setError("Enter a valid email address");
      return;
    }
    if (method === "phone" && !isPhone(contactVal)) {
      setError("Enter a valid phone number (e.g. +919876543210)");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: contactVal, name: name.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setStep("otp");
      startResendCooldown();
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
    // Auto-submit when all 6 digits entered
    if (newOtp.every(d => d !== "") && newOtp.join("").length === 6) {
      handleVerifyOtp(newOtp.join(""));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newOtp = pasted.split("");
      setOtp(newOtp);
      document.getElementById("otp-5")?.focus();
      handleVerifyOtp(pasted);
    }
  };

  const handleVerifyOtp = async (code: string) => {
    if (code.length !== 6) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: contact.trim(), code, purpose: "signup" }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setLoading(false); return; }
      router.push("/login?verified=1");
    } catch {
      setError("Network error — please try again");
      setLoading(false);
    }
  };

  const startResendCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: contact.trim(), name: name.trim(), password }),
      });
      startResendCooldown();
    } finally {
      setLoading(false);
    }
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

        {step === "form" ? (
          <>
            <h1 style={{ fontSize: "1.5rem", marginBottom: 4 }}>Create your account</h1>
            <p style={{ fontSize: "0.875rem", marginBottom: 28, color: "var(--color-text-muted)" }}>
              Already have an account?{" "}
              <Link href="/login" style={{ color: "var(--color-accent)", textDecoration: "none", fontWeight: 500 }}>
                Sign in
              </Link>
            </p>

            {/* Email / Phone toggle */}
            <div className="pm-tab-group" style={{ marginBottom: 20 }}>
              <button
                type="button"
                className={`pm-tab ${method === "email" ? "pm-tab-active" : ""}`}
                onClick={() => { setMethod("email"); setContact(""); setError(""); }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
                  <Mail size={14} />
                  Email
                </span>
              </button>
              <button
                type="button"
                className={`pm-tab ${method === "phone" ? "pm-tab-active" : ""}`}
                onClick={() => { setMethod("phone"); setContact(""); setError(""); }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
                  <Phone size={14} />
                  Phone
                </span>
              </button>
            </div>

            <form onSubmit={handleSubmitForm} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="pm-field">
                <label className="pm-label" htmlFor="name">Full name</label>
                <div style={{ position: "relative" }}>
                  <input
                    id="name"
                    className="pm-input"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    style={{ paddingLeft: 38 }}
                  />
                  <User size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-subtle)" }} />
                </div>
              </div>

              <div className="pm-field">
                <label className="pm-label" htmlFor="contact">
                  {method === "email" ? "Email address" : "Phone number"}
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id="contact"
                    className={`pm-input${error && !error.includes("Password") ? " pm-input-error" : ""}`}
                    type={method === "email" ? "email" : "tel"}
                    placeholder={method === "email" ? "you@example.com" : "+91 98765 43210"}
                    value={contact}
                    onChange={e => setContact(e.target.value)}
                    required
                    style={{ paddingLeft: 38 }}
                  />
                  {method === "email"
                    ? <Mail size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-subtle)" }} />
                    : <Phone size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-subtle)" }} />
                  }
                </div>
              </div>

              <div className="pm-field">
                <label className="pm-label" htmlFor="password">Create password</label>
                <div style={{ position: "relative" }}>
                  <input
                    id="password"
                    className={`pm-input${error.includes("Password") || error.includes("password") ? " pm-input-error" : ""}`}
                    type={showPass ? "text" : "password"}
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    style={{ paddingRight: 42 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-subtle)", display: "flex" }}
                    aria-label={showPass ? "Hide password" : "Show password"}
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {password && (
                  <PasswordStrength password={password} />
                )}
              </div>

              {error && (
                <p className="pm-field-error" style={{ margin: "-4px 0" }} role="alert">{error}</p>
              )}

              <button
                type="submit"
                className="pm-btn pm-btn-primary pm-btn-lg"
                disabled={loading}
                style={{ marginTop: 4, justifyContent: "center" }}
              >
                {loading ? <Loader2 size={16} className="pm-spinner" /> : <ArrowRight size={16} />}
                {loading ? "Sending code..." : "Continue"}
              </button>
            </form>

            {/* Google OAuth */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
              <hr className="pm-divider" style={{ flex: 1 }} />
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-subtle)", flexShrink: 0 }}>or</span>
              <hr className="pm-divider" style={{ flex: 1 }} />
            </div>

            <a
              href="/api/auth/signin/google"
              className="pm-btn pm-btn-outline"
              style={{ width: "100%", justifyContent: "center" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </a>
          </>
        ) : (
          /* OTP Step */
          <div className="animate-fade-up">
            <button
              type="button"
              onClick={() => { setStep("form"); setOtp(["","","","","",""]); setError(""); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", fontSize: "0.8125rem", marginBottom: 24, display: "flex", alignItems: "center", gap: 6, padding: 0 }}
            >
              ← Back
            </button>
            <h2 style={{ marginBottom: 8 }}>Check your {method === "email" ? "inbox" : "messages"}</h2>
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginBottom: 32 }}>
              We sent a 6-digit verification code to{" "}
              <strong style={{ color: "var(--color-text)" }}>{contact}</strong>
            </p>

            <div className="pm-otp-grid" onPaste={handleOtpPaste} style={{ marginBottom: 24 }}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  className="pm-otp-input"
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  autoFocus={i === 0}
                  aria-label={`Digit ${i + 1}`}
                />
              ))}
            </div>

            {error && (
              <p className="pm-field-error" style={{ marginBottom: 16 }} role="alert">{error}</p>
            )}

            <button
              type="button"
              className="pm-btn pm-btn-primary pm-btn-lg"
              onClick={() => handleVerifyOtp(otp.join(""))}
              disabled={loading || otp.join("").length !== 6}
              style={{ width: "100%", justifyContent: "center", marginBottom: 16 }}
            >
              {loading ? <Loader2 size={16} className="pm-spinner" /> : null}
              {loading ? "Verifying..." : "Verify & Create Account"}
            </button>

            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", textAlign: "center" }}>
              Didn&apos;t get the code?{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0}
                style={{
                  background: "none", border: "none", cursor: resendCooldown > 0 ? "not-allowed" : "pointer",
                  color: resendCooldown > 0 ? "var(--color-text-subtle)" : "var(--color-accent)",
                  fontWeight: 500, fontSize: "inherit", padding: 0
                }}
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend"}
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const colors = ["#EF4444", "#F59E0B", "#10B981", "#10B981"];
  const labels = ["Weak", "Fair", "Good", "Strong"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
      <div style={{ display: "flex", gap: 4 }}>
        {[0,1,2,3].map(i => (
          <div
            key={i}
            style={{
              flex: 1, height: 3, borderRadius: 2,
              background: i < score ? colors[score - 1] : "var(--color-border)",
              transition: "background 0.2s",
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: "0.75rem", color: colors[score - 1] || "var(--color-text-subtle)" }}>
        {score > 0 ? labels[score - 1] : "Enter a password"}
      </span>
    </div>
  );
}
