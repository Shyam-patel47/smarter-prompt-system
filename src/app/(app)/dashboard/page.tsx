import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Wand2, Library, GitCompare, Star, Clock, TrendingUp, Zap, ArrowRight } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  let stats = { totalPrompts: 0, thisWeek: 0, favorites: 0, templates: 0 };
  let recentPrompts: Array<{ id: string; title: string; taskType: string; updatedAt: Date; isFavorite: boolean }> = [];

  if (userId) {
    try {
      const [totalPrompts, thisWeek, favorites, templates, recent] = await Promise.all([
        prisma.prompt.count({ where: { userId, deletedAt: null } }),
        prisma.prompt.count({
          where: { userId, deletedAt: null, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
        }),
        prisma.prompt.count({ where: { userId, deletedAt: null, isFavorite: true } }),
        prisma.prompt.count({ where: { userId, deletedAt: null, isTemplate: true } }),
        prisma.prompt.findMany({
          where: { userId, deletedAt: null },
          orderBy: { updatedAt: "desc" },
          take: 6,
          select: { id: true, title: true, taskType: true, updatedAt: true, isFavorite: true },
        }),
      ]);
      stats = { totalPrompts, thisWeek, favorites, templates };
      recentPrompts = recent;
    } catch {
      // DB not connected yet — show empty state
    }
  }

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="pm-content">
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ marginBottom: 4 }}>
          Good {getTimeOfDay()}, {firstName} 👋
        </h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.9375rem" }}>
          Here&apos;s your prompt workspace overview.
        </p>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 40 }}>
        <StatCard icon={<Wand2 size={16} />} value={stats.totalPrompts} label="Total prompts" color="var(--color-accent)" />
        <StatCard icon={<TrendingUp size={16} />} value={stats.thisWeek} label="This week" color="#10B981" />
        <StatCard icon={<Star size={16} />} value={stats.favorites} label="Favorites" color="#F59E0B" />
        <StatCard icon={<Library size={16} />} value={stats.templates} label="Templates" color="#3B82F6" />
      </div>

      {/* Quick actions */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: "1rem", marginBottom: 16, fontFamily: "var(--font-heading)" }}>Quick actions</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          <QuickAction
            href="/builder"
            icon={<Wand2 size={18} />}
            title="New Prompt"
            desc="Build a structured prompt"
            accent
          />
          <QuickAction
            href="/library"
            icon={<Library size={18} />}
            title="My Library"
            desc="Browse saved prompts"
          />
          <QuickAction
            href="/builder/compare"
            icon={<GitCompare size={18} />}
            title="A/B Compare"
            desc="Test two prompt variants"
          />
        </div>
      </div>

      {/* Recent prompts */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ fontSize: "1rem", fontFamily: "var(--font-heading)" }}>Recent prompts</h2>
          <Link href="/library" className="pm-btn pm-btn-ghost pm-btn-sm" style={{ fontSize: "0.8125rem" }}>
            View all <ArrowRight size={13} />
          </Link>
        </div>

        {recentPrompts.length === 0 ? (
          <div className="pm-empty-state pm-card">
            <div className="pm-empty-icon">
              <Zap size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 600, color: "var(--color-text)", marginBottom: 4 }}>No prompts yet</div>
              <div style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                Build your first prompt and it will appear here.
              </div>
            </div>
            <Link href="/builder" className="pm-btn pm-btn-primary pm-btn-sm">
              <Wand2 size={13} /> Build first prompt
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {recentPrompts.map(p => (
              <Link
                key={p.id}
                href={`/library/${p.id}`}
                className="pm-card pm-card-hover"
                style={{ textDecoration: "none", display: "block" }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, color: "var(--color-text)", fontSize: "0.9rem", lineHeight: 1.3 }}>
                    {p.title}
                  </span>
                  {p.isFavorite && <Star size={13} style={{ color: "var(--color-accent)", flexShrink: 0, marginTop: 2 }} fill="currentColor" />}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="pm-badge pm-badge-default" style={{ fontSize: "0.6875rem" }}>
                    {formatTaskType(p.taskType)}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-subtle)", display: "flex", alignItems: "center", gap: 4 }}>
                    <Clock size={11} />
                    {formatRelativeTime(p.updatedAt)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: number; label: string; color: string }) {
  return (
    <div className="pm-stat-card">
      <div style={{ color, marginBottom: 4 }}>{icon}</div>
      <div className="pm-stat-value">{value}</div>
      <div className="pm-stat-label">{label}</div>
    </div>
  );
}

function QuickAction({ href, icon, title, desc, accent }: {
  href: string; icon: React.ReactNode; title: string; desc: string; accent?: boolean;
}) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div
        className="pm-card pm-card-hover"
        style={{
          display: "flex", alignItems: "flex-start", gap: 14,
          ...(accent ? { borderColor: "rgba(245,158,11,0.2)", background: "var(--color-accent-glow)" } : {}),
        }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: "var(--radius-sm)",
          background: accent ? "var(--color-accent-soft)" : "var(--color-surface-2)",
          border: `1px solid ${accent ? "rgba(245,158,11,0.2)" : "var(--color-border)"}`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          color: accent ? "var(--color-accent)" : "var(--color-text-muted)",
        }}>
          {icon}
        </div>
        <div>
          <div style={{ fontWeight: 600, color: "var(--color-text)", fontSize: "0.9rem", marginBottom: 2 }}>{title}</div>
          <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>{desc}</div>
        </div>
      </div>
    </Link>
  );
}

function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function formatTaskType(t: string): string {
  return t.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}
