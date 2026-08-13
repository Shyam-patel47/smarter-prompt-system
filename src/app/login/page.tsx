"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, Mail, Phone, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { isEmail, isPhone } from "@/lib/utils";

type ContactMethod = "email" | "phone";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justVerified = searchParams.get("verified") === "1";

  const [method, setMethod] = useState<ContactMethod>("email");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        contact: contact.trim(),
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === "CredentialsSignin") {
          setError("Invalid email/phone or password. Check your credentials and try again.");
        } else {
          setError("Something went wrong. Please try again.");
        }
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error — please try again");
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

        {justVerified && (
          <div style={{
            background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)",
            borderRadius: "var(--radius-sm)", padding: "12px 16px", marginBottom: 24,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <CheckCircle size={16} style={{ color: "#10B981", flexShrink: 0 }} />
            <span style={{ fontSize: "0.875rem", color: "#10B981" }}>
              Account verified! Sign in to get started.
            </span>
          </div>
        )}

        <h1 style={{ fontSize: "1.5rem", marginBottom: 4 }}>Welcome back</h1>
        <p style={{ fontSize: "0.875rem", marginBottom: 28, color: "var(--color-text-muted)" }}>
          Don&apos;t have an account?{" "}
          <Link href="/signup" style={{ color: "var(--color-accent)", textDecoration: "none", fontWeight: 500 }}>
            Sign up free
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
              <Mail size={14} /> Email
            </span>
          </button>
          <button
            type="button"
            className={`pm-tab ${method === "phone" ? "pm-tab-active" : ""}`}
            onClick={() => { setMethod("phone"); setContact(""); setError(""); }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
              <Phone size={14} /> Phone
            </span>
          </button>
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="pm-field">
            <label className="pm-label" htmlFor="login-contact">
              {method === "email" ? "Email address" : "Phone number"}
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="login-contact"
                className={`pm-input${error ? " pm-input-error" : ""}`}
                type={method === "email" ? "email" : "tel"}
                placeholder={method === "email" ? "you@example.com" : "+91 98765 43210"}
                value={contact}
                onChange={e => setContact(e.target.value)}
                required
                autoComplete={method === "email" ? "email" : "tel"}
                style={{ paddingLeft: 38 }}
              />
              {method === "email"
                ? <Mail size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-subtle)" }} />
                : <Phone size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-subtle)" }} />
              }
            </div>
          </div>

          <div className="pm-field">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label className="pm-label" htmlFor="login-password" style={{ margin: 0 }}>Password</label>
              <Link
                href="/reset-password"
                style={{ fontSize: "0.8125rem", color: "var(--color-accent)", textDecoration: "none", fontWeight: 500 }}
              >
                Forgot password?
              </Link>
            </div>
            <div style={{ position: "relative" }}>
              <input
                id="login-password"
                className={`pm-input${error ? " pm-input-error" : ""}`}
                type={showPass ? "text" : "password"}
                placeholder="Your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
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
          </div>

          {error && (
            <p className="pm-field-error" style={{ margin: "-4px 0" }} role="alert">{error}</p>
          )}

          <button
            type="submit"
            id="login-submit"
            className="pm-btn pm-btn-primary pm-btn-lg"
            disabled={loading}
            style={{ marginTop: 4, justifyContent: "center" }}
          >
            {loading ? <Loader2 size={16} className="pm-spinner" /> : <ArrowRight size={16} />}
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

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
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="pm-auth-root">
        <div className="pm-auth-card" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Loader2 size={24} className="pm-spinner" />
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
