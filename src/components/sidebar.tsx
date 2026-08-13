"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, Wand2, Library, GitCompare, Settings,
  LogOut, ChevronRight, Zap, Menu, X
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/builder", icon: Wand2, label: "Prompt Builder" },
  { href: "/library", icon: Library, label: "Library" },
  { href: "/builder/compare", icon: GitCompare, label: "Compare" },
];

interface SidebarProps {
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
}

export function Sidebar({ userName, userEmail, userImage }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = userName
    ? userName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid var(--color-border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, background: "var(--color-accent)", borderRadius: 9,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
          }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M3 5h14M3 10h10M3 15h6" stroke="#080C18" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "0.9375rem", color: "var(--color-text)", lineHeight: 1.2 }}>
              PromptMe
            </div>
            <div style={{ fontSize: "0.6875rem", color: "var(--color-text-subtle)", lineHeight: 1 }}>
              Build better prompts
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
        <div style={{ marginBottom: 4 }}>
          <div style={{ padding: "4px 8px 8px", fontSize: "0.6875rem", fontWeight: 600, color: "var(--color-text-subtle)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Workspace
          </div>
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname?.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`pm-nav-item ${active ? "pm-nav-item-active" : ""}`}
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={15} style={{ flexShrink: 0 }} />
                {label}
                {active && <ChevronRight size={13} style={{ marginLeft: "auto", opacity: 0.5 }} />}
              </Link>
            );
          })}
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ padding: "4px 8px 8px", fontSize: "0.6875rem", fontWeight: 600, color: "var(--color-text-subtle)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Account
          </div>
          <Link href="/settings" className={`pm-nav-item ${pathname === "/settings" ? "pm-nav-item-active" : ""}`}
            onClick={() => setMobileOpen(false)}>
            <Settings size={15} style={{ flexShrink: 0 }} />
            Settings
          </Link>
        </div>

        {/* Quick action */}
        <div style={{ margin: "16px 0 0" }}>
          <Link href="/builder" className="pm-btn pm-btn-primary pm-btn-sm"
            style={{ width: "100%", justifyContent: "center", display: "flex" }}
            onClick={() => setMobileOpen(false)}>
            <Zap size={13} />
            New Prompt
          </Link>
        </div>
      </nav>

      {/* User footer */}
      <div style={{ padding: "12px 8px", borderTop: "1px solid var(--color-border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px", borderRadius: "var(--radius-sm)" }}>
          <div style={{
            width: 30, height: 30, borderRadius: "50%", background: "var(--color-elevated)",
            border: "1px solid var(--color-border)", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: "0.75rem", fontWeight: 600, color: "var(--color-accent)",
            flexShrink: 0, overflow: "hidden"
          }}>
            {userImage
              ? <img src={userImage} alt={userName ?? ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : initials
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--color-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {userName ?? "User"}
            </div>
            <div style={{ fontSize: "0.6875rem", color: "var(--color-text-subtle)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {userEmail ?? ""}
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-subtle)", display: "flex", padding: 4, borderRadius: 4, transition: "color 0.15s" }}
            title="Sign out"
            onMouseEnter={e => (e.currentTarget.style.color = "var(--color-error)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--color-text-subtle)")}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="pm-sidebar" style={{ display: "flex", flexDirection: "column" }}>
        <SidebarContent />
      </aside>

      {/* Mobile hamburger */}
      <button
        className="pm-btn pm-btn-ghost pm-btn-sm"
        onClick={() => setMobileOpen(!mobileOpen)}
        style={{
          position: "fixed", top: 12, left: 12, zIndex: 50,
          display: "none", padding: 8,
        }}
        id="mobile-menu-toggle"
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 39, backdropFilter: "blur(2px)" }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`pm-sidebar ${mobileOpen ? "pm-sidebar-open" : ""}`}
        style={{ display: "flex", flexDirection: "column", zIndex: 50 }}
        aria-hidden={!mobileOpen}
      >
        <SidebarContent />
      </aside>

      {/* Mobile CSS */}
      <style>{`
        @media (max-width: 768px) {
          #mobile-menu-toggle { display: flex !important; }
        }
      `}</style>
    </>
  );
}
