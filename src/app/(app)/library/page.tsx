"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search, Grid3X3, List, Star, Trash2, Copy, Edit,
  FolderOpen, Tag, Plus, Filter, SortAsc, Clock, Wand2, Loader2
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

interface Prompt {
  id: string;
  title: string;
  taskType: string;
  generatedBody: string;
  isFavorite: boolean;
  isTemplate: boolean;
  updatedAt: string;
  folder: { id: string; name: string } | null;
  tags: Array<{ tag: { id: string; name: string } }>;
}

type ViewMode = "grid" | "list";
type SortMode = "updated" | "alpha" | "used";

export default function LibraryPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sort, setSort] = useState<SortMode>("updated");
  const [filterFavorite, setFilterFavorite] = useState(false);
  const [filterTemplate, setFilterTemplate] = useState(false);
  const [page, setPage] = useState(1);

  const fetchPrompts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        sort,
        page: String(page),
        limit: "20",
        ...(filterFavorite ? { favorite: "1" } : {}),
        ...(filterTemplate ? { template: "1" } : {}),
      });
      const res = await fetch(`/api/prompts?${params}`);
      const data = await res.json();
      setPrompts(data.prompts ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [search, sort, page, filterFavorite, filterTemplate]);

  useEffect(() => {
    const timer = setTimeout(fetchPrompts, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchPrompts, search]);

  const toggleFavorite = async (id: string, current: boolean) => {
    await fetch(`/api/prompts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFavorite: !current }),
    });
    setPrompts(p => p.map(pr => pr.id === id ? { ...pr, isFavorite: !current } : pr));
  };

  const deletePrompt = async (id: string) => {
    if (!confirm("Move this prompt to trash? You can recover it within 30 days from Settings.")) return;
    await fetch(`/api/prompts/${id}`, { method: "DELETE" });
    setPrompts(p => p.filter(pr => pr.id !== id));
    setTotal(t => t - 1);
  };

  const duplicatePrompt = async (prompt: Prompt) => {
    await fetch("/api/prompts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `${prompt.title} (copy)`,
        taskType: prompt.taskType,
        detailsInput: "",
        tone: "PROFESSIONAL",
        outputFormat: "PARAGRAPH",
        generatedBody: prompt.generatedBody,
        variables: [],
      }),
    });
    fetchPrompts();
  };

  const formatType = (t: string) => t.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="pm-content">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>Prompt Library</h1>
          <p style={{ fontSize: "0.875rem" }}>
            {total} prompt{total !== 1 ? "s" : ""} in your library
          </p>
        </div>
        <Link href="/builder" className="pm-btn pm-btn-primary">
          <Plus size={15} /> New Prompt
        </Link>
      </div>

      {/* Search + filter bar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: 220, position: "relative" }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-subtle)" }} />
          <input
            id="library-search"
            className="pm-input"
            type="search"
            placeholder="Search prompts, tags..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ paddingLeft: 38 }}
          />
        </div>

        {/* Filters */}
        <button type="button"
          className={`pm-btn pm-btn-sm ${filterFavorite ? "pm-btn-primary" : "pm-btn-ghost"}`}
          onClick={() => { setFilterFavorite(!filterFavorite); setPage(1); }}>
          <Star size={13} fill={filterFavorite ? "currentColor" : "none"} /> Favorites
        </button>
        <button type="button"
          className={`pm-btn pm-btn-sm ${filterTemplate ? "pm-btn-primary" : "pm-btn-ghost"}`}
          onClick={() => { setFilterTemplate(!filterTemplate); setPage(1); }}>
          <Filter size={13} /> Templates
        </button>

        {/* Sort */}
        <select className="pm-input" value={sort} onChange={e => { setSort(e.target.value as SortMode); setPage(1); }}
          style={{ width: "auto", padding: "7px 28px 7px 12px", fontSize: "0.8125rem", cursor: "pointer" }}>
          <option value="updated">Recently updated</option>
          <option value="alpha">A → Z</option>
          <option value="used">Most used</option>
        </select>

        {/* View toggle */}
        <div className="pm-tab-group" style={{ flexShrink: 0 }}>
          <button type="button" className={`pm-tab ${viewMode === "grid" ? "pm-tab-active" : ""}`}
            onClick={() => setViewMode("grid")} style={{ padding: "6px 10px" }} aria-label="Grid view">
            <Grid3X3 size={14} />
          </button>
          <button type="button" className={`pm-tab ${viewMode === "list" ? "pm-tab-active" : ""}`}
            onClick={() => setViewMode("list")} style={{ padding: "6px 10px" }} aria-label="List view">
            <List size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 64 }}>
          <Loader2 size={24} className="pm-spinner" style={{ color: "var(--color-accent)" }} />
        </div>
      ) : prompts.length === 0 ? (
        <div className="pm-empty-state pm-card">
          <div className="pm-empty-icon" style={{ width: 56, height: 56 }}>
            {search ? <Search size={22} /> : <Wand2 size={22} />}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: "var(--color-text)", marginBottom: 6 }}>
              {search ? `No prompts matching "${search}"` : "No prompts yet"}
            </div>
            <div style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
              {search ? "Try a different search term or clear filters." : "Build your first prompt and save it to your library."}
            </div>
          </div>
          {!search && (
            <Link href="/builder" className="pm-btn pm-btn-primary pm-btn-sm">
              <Wand2 size={13} /> Build first prompt
            </Link>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
          {prompts.map(p => <PromptCard key={p.id} prompt={p} onFavorite={toggleFavorite} onDelete={deletePrompt} onDuplicate={duplicatePrompt} formatType={formatType} />)}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {prompts.map(p => <PromptRow key={p.id} prompt={p} onFavorite={toggleFavorite} onDelete={deletePrompt} formatType={formatType} />)}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 32 }}>
          <button className="pm-btn pm-btn-ghost pm-btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
            Previous
          </button>
          <span style={{ display: "flex", alignItems: "center", fontSize: "0.875rem", color: "var(--color-text-muted)", padding: "0 8px" }}>
            Page {page} of {Math.ceil(total / 20)}
          </span>
          <button className="pm-btn pm-btn-ghost pm-btn-sm" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function PromptCard({ prompt: p, onFavorite, onDelete, onDuplicate, formatType }: {
  prompt: Prompt;
  onFavorite: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
  onDuplicate: (p: Prompt) => void;
  formatType: (t: string) => string;
}) {
  return (
    <div className="pm-card pm-card-hover" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Top */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <Link href={`/library/${p.id}`} style={{ textDecoration: "none", flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, color: "var(--color-text)", fontSize: "0.9rem", lineHeight: 1.3,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {p.title}
          </div>
        </Link>
        <button type="button" onClick={() => onFavorite(p.id, p.isFavorite)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: p.isFavorite ? "var(--color-accent)" : "var(--color-text-subtle)", flexShrink: 0 }}
          aria-label={p.isFavorite ? "Remove from favorites" : "Add to favorites"}>
          <Star size={14} fill={p.isFavorite ? "currentColor" : "none"} />
        </button>
      </div>

      {/* Preview */}
      <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", lineHeight: 1.5,
        display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", margin: 0 }}>
        {p.generatedBody}
      </p>

      {/* Meta */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        <span className="pm-badge pm-badge-accent" style={{ fontSize: "0.6875rem" }}>{formatType(p.taskType)}</span>
        {p.isTemplate && <span className="pm-badge pm-badge-default" style={{ fontSize: "0.6875rem" }}>Template</span>}
        {p.folder && (
          <span className="pm-badge pm-badge-default" style={{ fontSize: "0.6875rem" }}>
            <FolderOpen size={10} /> {p.folder.name}
          </span>
        )}
        {p.tags.slice(0, 2).map(t => (
          <span key={t.tag.id} className="pm-badge pm-badge-default" style={{ fontSize: "0.6875rem" }}>
            <Tag size={10} /> {t.tag.name}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid var(--color-border)" }}>
        <span style={{ fontSize: "0.75rem", color: "var(--color-text-subtle)", display: "flex", alignItems: "center", gap: 4 }}>
          <Clock size={11} /> {formatRelativeTime(p.updatedAt)}
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          <button type="button" onClick={() => onDuplicate(p)}
            className="pm-btn pm-btn-ghost pm-btn-sm" style={{ padding: "4px 8px" }} title="Duplicate">
            <Copy size={13} />
          </button>
          <Link href={`/library/${p.id}`} className="pm-btn pm-btn-ghost pm-btn-sm" style={{ padding: "4px 8px" }} title="Edit">
            <Edit size={13} />
          </Link>
          <button type="button" onClick={() => onDelete(p.id)}
            className="pm-btn pm-btn-ghost pm-btn-sm" style={{ padding: "4px 8px", color: "var(--color-text-subtle)" }}
            title="Delete"
            onMouseEnter={e => (e.currentTarget.style.color = "var(--color-error)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--color-text-subtle)")}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

function PromptRow({ prompt: p, onFavorite, onDelete, formatType }: {
  prompt: Prompt;
  onFavorite: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
  formatType: (t: string) => string;
}) {
  return (
    <div className="pm-card" style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}>
      <button type="button" onClick={() => onFavorite(p.id, p.isFavorite)}
        style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: p.isFavorite ? "var(--color-accent)" : "var(--color-text-subtle)", flexShrink: 0 }}>
        <Star size={14} fill={p.isFavorite ? "currentColor" : "none"} />
      </button>
      <Link href={`/library/${p.id}`} style={{ textDecoration: "none", flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, color: "var(--color-text)", fontSize: "0.875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {p.title}
        </div>
      </Link>
      <span className="pm-badge pm-badge-accent" style={{ fontSize: "0.6875rem", flexShrink: 0 }}>{formatType(p.taskType)}</span>
      <span style={{ fontSize: "0.75rem", color: "var(--color-text-subtle)", flexShrink: 0, whiteSpace: "nowrap" }}>
        {formatRelativeTime(p.updatedAt)}
      </span>
      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
        <Link href={`/library/${p.id}`} className="pm-btn pm-btn-ghost pm-btn-sm" style={{ padding: "4px 8px" }}>
          <Edit size={13} />
        </Link>
        <button type="button" onClick={() => onDelete(p.id)}
          className="pm-btn pm-btn-ghost pm-btn-sm" style={{ padding: "4px 8px" }}>
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
