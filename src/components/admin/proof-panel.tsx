"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  CheckCircle2,
  Crown,
  ExternalLink,
  FileCode2,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Trophy,
  X,
} from "lucide-react";
import { CONDITIONS, conditionLabel } from "@/lib/conditions";
import { compressImage } from "@/lib/image-compress";
import { MAX_PROOF_IMAGES, PROOF_IMAGE_BUDGET, type ProofSource } from "@/lib/proof";
import type { ProofRow, ProofWall } from "@/lib/proof-admin";
import { cn, formatDate } from "@/lib/utils";

const SOURCE_META: Record<ProofSource, { label: string; icon: typeof Sparkles; cls: string }> = {
  custom: { label: "Collected by you", icon: Sparkles, cls: "bg-brand-500/15 text-brand-200" },
  curated: { label: "In the codebase", icon: FileCode2, cls: "bg-slate-500/15 text-slate-300" },
  story: { label: "Member story", icon: Trophy, cls: "bg-gold-500/15 text-gold-300" },
};

/** Publishing a member story is the existing "feature on site" toggle, which
 * is gated on the member's own marketing consent. Everything else is the
 * proof entry's own published flag. */
function publishRequest(row: ProofRow, live: boolean): [string, RequestInit] {
  if (row.source === "story") {
    return [
      `/api/admin/stories/${row.sourceId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: live }),
      },
    ];
  }
  return [
    `/api/admin/proof/${row.id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        published: live,
        ...(row.source === "curated" && { seed: { source: "curated", sourceId: row.sourceId } }),
      }),
    },
  ];
}

export function ProofPanel({ wall }: { wall: ProofWall }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [failure, setFailure] = useState<{ id: string; message: string } | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  /** Every mutation on this screen goes through here so a refusal (missing
   * consent, a photo that's too big) is shown against the row rather than
   * swallowed. */
  async function call(id: string, url: string, init: RequestInit): Promise<boolean> {
    setBusy(id);
    setFailure(null);
    try {
      const res = await fetch(url, init);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFailure({ id, message: data.error ?? "Couldn't save that." });
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setFailure({ id, message: "Couldn't reach the server." });
      return false;
    } finally {
      setBusy(null);
    }
  }

  const setLive = (row: ProofRow, live: boolean) => call(row.id, ...publishRequest(row, live));

  /** Reordering rewrites the whole running order in one request, so what's on
   * screen is exactly what the site renders — there's no second "featured"
   * flag that could disagree with the list. */
  function reorder(next: ProofRow[], busyId: string) {
    return call(busyId, "/api/admin/proof", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entries: next.map((r) => ({ source: r.source, sourceId: r.sourceId })),
      }),
    });
  }

  function move(index: number, direction: -1 | 1) {
    const next = [...wall.live];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    return reorder(next, wall.live[index].id);
  }

  /** Position 0 is the landing page's big card, so "make this the lead" is a
   * move to the top. */
  function makeLead(index: number) {
    const next = [...wall.live];
    const [row] = next.splice(index, 1);
    return reorder([row, ...next], row.id);
  }

  const leadName = wall.live[0]?.name;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Photo proof wall</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            Everything the public pages show as proof — the landing page, /pricing and /results
            all read this list, in this order. Approve what goes live, set the running order
            (whatever sits at the top is the landing page&apos;s big card), and upload the photos
            here rather than committing image files.
          </p>
        </div>
        <a
          href="/#results"
          target="_blank"
          rel="noreferrer"
          className="btn-secondary shrink-0 !py-1.5 text-xs"
        >
          View on the site <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Health of the wall */}
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Live on the site" value={wall.live.length} />
        <Stat label="Lead card" value={leadName ?? "—"} />
        <Stat
          label="Awaiting approval"
          value={wall.storiesAwaitingApproval}
          tone={wall.storiesAwaitingApproval > 0 ? "brand" : undefined}
        />
        <Stat
          label="Missing photos"
          value={wall.liveNeedingPhotos}
          tone={wall.liveNeedingPhotos > 0 ? "warn" : undefined}
        />
      </div>

      {wall.liveNeedingPhotos > 0 && (
        <div className="card mt-4 flex items-start gap-3 border-amber-500/30">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
          <p className="text-sm leading-relaxed text-amber-100">
            <span className="font-semibold">
              {wall.liveNeedingPhotos} live {wall.liveNeedingPhotos === 1 ? "entry" : "entries"}
            </span>{" "}
            {wall.liveNeedingPhotos === 1 ? "has" : "have"} no photos to show. They point at image
            files under <code className="text-amber-200">/public</code> that were never added to the
            repo, so the site skips those pictures and publishes the words alone — and an entry with
            no photos doesn&apos;t take the landing page&apos;s lead card. Upload the photos on the
            entry below and the wall uses those instead — no deploy needed.
          </p>
        </div>
      )}

      {/* What the landing page will render */}
      {wall.live.length > 0 && (
        <div className="card mt-4">
          <h2 className="font-semibold text-white">What the landing page shows</h2>
          <p className="mt-1 text-xs text-slate-500">
            The first entry runs as the big card with its photos; the next two run as pull quotes.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {["Lead card — quote + photos", "Pull quote", "Pull quote"].map((slot, i) => {
              const row = wall.live[i];
              return (
                <div
                  key={slot + i}
                  className={cn(
                    "rounded-xl border p-3",
                    row ? "border-lab-border bg-lab-bg" : "border-dashed border-lab-border"
                  )}
                >
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">{slot}</p>
                  {row ? (
                    <>
                      <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-slate-300">
                        &ldquo;{i === 0 ? row.quote : row.highlight}&rdquo;
                      </p>
                      <p className="mt-2 text-xs font-medium text-brand-200">— {row.name}</p>
                      {i === 0 && (
                        <p className="mt-1 text-[11px] text-slate-500">
                          {row.images.length > 0
                            ? `${row.images.length} photo${row.images.length === 1 ? "" : "s"} from the CRM`
                            : row.filePhotosUnverified
                              ? `${row.fileImages.length} image file${row.fileImages.length === 1 ? "" : "s"} — missing from /public`
                              : row.fileImages.length > 0
                                ? `${row.fileImages.length} photo${row.fileImages.length === 1 ? "" : "s"}`
                                : "No photos"}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="mt-1.5 text-xs text-slate-600">Empty — nothing to show here yet.</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add proof */}
      <div className="mt-6">
        {adding ? (
          <NewProofForm onDone={() => setAdding(false)} onSaved={() => router.refresh()} />
        ) : (
          <button onClick={() => setAdding(true)} className="btn-primary">
            <Plus className="h-4 w-4" /> Add proof you collected
          </button>
        )}
      </div>

      <Section
        title="Live on the site"
        subtitle="In render order. The top entry is the lead card."
        count={wall.live.length}
        empty="Nothing is live — the public pages are showing no proof at all."
      >
        {wall.live.map((row, i) => (
          <ProofCard
            key={row.id}
            row={row}
            busy={busy === row.id}
            failure={failure?.id === row.id ? failure.message : null}
            editing={editing === row.id}
            position={{ index: i, total: wall.live.length }}
            onEdit={() => setEditing(editing === row.id ? null : row.id)}
            onMove={(dir) => move(i, dir)}
            onSetLive={(live) => setLive(row, live)}
            onMakeLead={() => makeLead(i)}
            onChanged={() => {
              setEditing(null);
              router.refresh();
            }}
            onError={(message) => setFailure({ id: row.id, message })}
          />
        ))}
      </Section>

      <Section
        title="Not on the site"
        subtitle="Drafts, entries you've hidden, and member stories waiting for your approval."
        count={wall.offSite.length}
        empty="Everything the CRM holds is already live."
      >
        {wall.offSite.map((row) => (
          <ProofCard
            key={row.id}
            row={row}
            busy={busy === row.id}
            failure={failure?.id === row.id ? failure.message : null}
            editing={editing === row.id}
            onEdit={() => setEditing(editing === row.id ? null : row.id)}
            onSetLive={(live) => setLive(row, live)}
            onChanged={() => {
              setEditing(null);
              router.refresh();
            }}
            onError={(message) => setFailure({ id: row.id, message })}
          />
        ))}
      </Section>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: "warn" | "brand";
}) {
  return (
    <div className="card !px-4 !py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p
        className={cn(
          "mt-0.5 truncate text-lg font-bold",
          tone === "warn" ? "text-amber-300" : tone === "brand" ? "text-brand-200" : "text-white"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function Section({
  title,
  subtitle,
  count,
  empty,
  children,
}: {
  title: string;
  subtitle: string;
  count: number;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-baseline gap-x-3">
        <h2 className="font-semibold text-white">{title}</h2>
        <span className="text-xs text-slate-500">{count}</span>
      </div>
      <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
      <div className="mt-3 space-y-3">
        {count === 0 ? (
          <div className="card py-8 text-center text-sm text-slate-400">{empty}</div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

function ProofCard({
  row,
  busy,
  failure,
  editing,
  position,
  onEdit,
  onMove,
  onSetLive,
  onMakeLead,
  onChanged,
  onError,
}: {
  row: ProofRow;
  busy: boolean;
  failure: string | null;
  editing: boolean;
  position?: { index: number; total: number };
  onEdit: () => void;
  onMove?: (dir: -1 | 1) => void;
  onSetLive: (live: boolean) => void;
  onMakeLead?: () => void;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  const meta = SOURCE_META[row.source];
  // The top of the live list *is* the lead card — there's no separate flag.
  const isLead = position?.index === 0;

  return (
    <div className={cn("card", isLead && "border-gold-500/40")}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("badge", meta.cls)}>
          <meta.icon className="h-3 w-3" /> {meta.label}
        </span>
        <p className="font-semibold text-white">{row.name}</p>
        <span className="badge border border-lab-border text-slate-400">
          {conditionLabel(row.condition)}
        </span>
        {isLead && (
          <span className="badge bg-gold-500/15 text-gold-300" title="The landing page's big card">
            <Crown className="h-3 w-3" /> lead card
          </span>
        )}
        {row.live ? (
          <span className="badge bg-emerald-500/15 text-emerald-300">
            <CheckCircle2 className="h-3 w-3" /> live
          </span>
        ) : (
          <span className="badge border border-lab-border text-slate-500">draft</span>
        )}
        {row.consentedAt ? (
          <span
            className="badge bg-emerald-500/15 text-emerald-300"
            title={row.consentNote ?? `Permission recorded ${row.consentedAt}`}
          >
            <ShieldCheck className="h-3 w-3" /> consent {formatDate(row.consentedAt)}
          </span>
        ) : (
          <span className="badge bg-rose-500/15 text-rose-300">no consent on record</span>
        )}
        {row.filePhotosUnverified && row.live && (
          <span
            className="badge bg-amber-500/15 text-amber-300"
            title="This entry's image files aren't in /public, so the site publishes it without photos. Upload them here instead."
          >
            <AlertTriangle className="h-3 w-3" /> photos missing
          </span>
        )}
      </div>

      <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm text-slate-400">{row.quote}</p>
      <p className="mt-1.5 text-xs text-slate-500">
        {row.timeframe && <>{row.timeframe} · </>}
        {row.note}
      </p>

      <PhotoStrip row={row} onChanged={onChanged} onError={onError} />

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => onSetLive(!row.live)}
          disabled={busy || (!row.live && !!row.blocker)}
          title={row.blocker ?? undefined}
          className={cn("!py-1.5 text-xs", row.live ? "btn-ghost" : "btn-primary")}
        >
          {busy ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : row.live ? (
            <X className="h-3 w-3" />
          ) : (
            <Check className="h-3 w-3" />
          )}
          {row.live ? "Take off the site" : "Approve & publish"}
        </button>

        {onMakeLead && !isLead && (
          <button
            onClick={onMakeLead}
            disabled={busy}
            className="btn-secondary !py-1.5 text-xs"
            title="Move to the top, where the landing page's big card is drawn from"
          >
            <Crown className="h-3 w-3" /> Make lead card
          </button>
        )}

        {position && onMove && (
          <div className="flex gap-1">
            <button
              onClick={() => onMove(-1)}
              disabled={busy || position.index === 0}
              className="btn-secondary !px-2 !py-1.5 text-xs disabled:opacity-40"
              aria-label="Move up"
            >
              <ArrowUp className="h-3 w-3" />
            </button>
            <button
              onClick={() => onMove(1)}
              disabled={busy || position.index === position.total - 1}
              className="btn-secondary !px-2 !py-1.5 text-xs disabled:opacity-40"
              aria-label="Move down"
            >
              <ArrowDown className="h-3 w-3" />
            </button>
          </div>
        )}

        {row.source === "custom" && (
          <button onClick={onEdit} disabled={busy} className="btn-secondary !py-1.5 text-xs">
            <Pencil className="h-3 w-3" /> {editing ? "Close" : "Edit words"}
          </button>
        )}

        {row.source === "story" && (
          <Link href="/admin/stories" className="btn-ghost !py-1.5 text-xs">
            Open in Stories
          </Link>
        )}

        {row.hasRecord && <DangerButton row={row} onChanged={onChanged} onError={onError} />}
      </div>

      {row.blocker && !row.live && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-amber-300">
          <AlertTriangle className="h-3 w-3 shrink-0" /> {row.blocker}
        </p>
      )}
      {failure && <p className="mt-3 text-xs text-rose-400">{failure}</p>}

      {editing && row.source === "custom" && (
        <div className="mt-4 border-t border-lab-border pt-4">
          <EditProofForm row={row} onSaved={onChanged} />
        </div>
      )}
    </div>
  );
}

/** Delete a custom entry, or reset a curated/story entry's CRM overrides. */
function DangerButton({
  row,
  onChanged,
  onError,
}: {
  row: ProofRow;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const custom = row.source === "custom";

  return (
    <button
      disabled={busy}
      onClick={async () => {
        const confirmation = custom
          ? `Delete ${row.name}'s entry and its photos for good?`
          : `Reset ${row.name} back to defaults? Photos uploaded here are removed and its ordering is forgotten.`;
        if (!window.confirm(confirmation)) return;
        setBusy(true);
        try {
          const res = await fetch(`/api/admin/proof/${row.id}`, { method: "DELETE" });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            onError(data.error ?? "Couldn't do that.");
            return;
          }
          onChanged();
        } finally {
          setBusy(false);
        }
      }}
      className="btn-ghost !py-1.5 text-xs text-rose-300"
    >
      {busy ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : custom ? (
        <Trash2 className="h-3 w-3" />
      ) : (
        <RotateCcw className="h-3 w-3" />
      )}
      {custom ? "Delete" : "Reset overrides"}
    </button>
  );
}

// ─── Photos ──────────────────────────────────────────────────────────────────

function PhotoStrip({
  row,
  onChanged,
  onError,
}: {
  row: ProofRow;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    setBusy(true);
    try {
      const src = await compressImage(file, PROOF_IMAGE_BUDGET);
      const res = await fetch(`/api/admin/proof/${row.id}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          src,
          // A sensible default the admin can't forget to write; the wall is a
          // public page, so every image needs describing.
          alt: `${row.name}'s progress photo`,
          kind: "photo",
          seed: { source: row.source, sourceId: row.sourceId },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        onError(data.error ?? "Couldn't save that photo.");
        return;
      }
      onChanged();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Couldn't read that image.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(imageId: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/proof/${row.id}/images?imageId=${imageId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        onError("Couldn't remove that photo.");
        return;
      }
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  const full = row.images.length >= MAX_PROOF_IMAGES;
  // A member's story publishes their own consented before/after and nothing
  // else, so there's nothing to upload here.
  const uploadable = row.source !== "story";

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-start gap-2">
        {row.images.map((img) => (
          <figure key={img.id} className="relative overflow-hidden rounded-lg border border-lab-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.src} alt={img.alt} className="h-20 w-20 object-cover" />
            <button
              type="button"
              onClick={() => remove(img.id)}
              disabled={busy}
              aria-label="Remove photo"
              className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-slate-200 hover:text-white"
            >
              <X className="h-3 w-3" />
            </button>
            {img.caption && (
              <figcaption className="max-w-20 truncate bg-lab-bg px-1 py-0.5 text-[9px] text-slate-500">
                {img.caption}
              </figcaption>
            )}
          </figure>
        ))}

        {/* Photos the entry brings with it. Curated ones are file paths that
            may 404; story ones are the member's consented before/after. */}
        {row.images.length === 0 &&
          row.fileImages.map((img) => (
            <figure
              key={img.src.slice(0, 64)}
              className={cn(
                "overflow-hidden rounded-lg border",
                row.filePhotosUnverified ? "border-dashed border-amber-500/40" : "border-lab-border"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.src} alt={img.alt} className="h-20 w-20 object-cover" />
              <figcaption className="max-w-20 truncate bg-lab-bg px-1 py-0.5 text-[9px] text-slate-500">
                {row.filePhotosUnverified ? "file" : (img.caption ?? "photo")}
              </figcaption>
            </figure>
          ))}

        {uploadable && (
          <>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy || full}
              title={full ? `Limit of ${MAX_PROOF_IMAGES} photos reached` : "Upload a photo"}
              className="grid h-20 w-20 place-items-center rounded-lg border border-dashed border-lab-border text-slate-500 transition hover:border-brand-600 hover:text-brand-300 disabled:opacity-40"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4" />
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void upload(file);
              }}
            />
          </>
        )}
      </div>
      {row.source === "story" ? (
        <p className="mt-1.5 text-[11px] text-slate-500">
          {row.fileImages.length > 0
            ? "The member's own before/after — the only photos a story ever publishes."
            : "This member didn't tick photo consent, so their story goes out as words alone."}
        </p>
      ) : (
        row.images.length === 0 &&
        row.fileImages.length > 0 && (
          <p className="mt-1.5 text-[11px] text-slate-500">
            Showing the image files this entry points at. Upload photos here and these are
            replaced.
          </p>
        )
      )}
    </div>
  );
}

// ─── Forms ───────────────────────────────────────────────────────────────────

interface DraftFields {
  name: string;
  condition: string;
  quote: string;
  highlight: string;
  timeframe: string;
  consentedAt: string;
  consentNote: string;
}

function Fields({
  draft,
  set,
  disabled,
}: {
  draft: DraftFields;
  set: (patch: Partial<DraftFields>) => void;
  disabled: boolean;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <label className="label">First name</label>
        <input
          className="input"
          value={draft.name}
          disabled={disabled}
          maxLength={40}
          placeholder="Daniel"
          onChange={(e) => set({ name: e.target.value })}
        />
      </div>
      <div>
        <label className="label">Condition</label>
        <select
          className="input"
          value={draft.condition}
          disabled={disabled}
          onChange={(e) => set({ condition: e.target.value })}
        >
          {CONDITIONS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="label">Their words, verbatim</label>
        <textarea
          className="input min-h-28"
          value={draft.quote}
          disabled={disabled}
          maxLength={4000}
          placeholder="Paste the message exactly as they sent it. Light punctuation fixes only — never rewrite it."
          onChange={(e) => set({ quote: e.target.value })}
        />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Pull quote (optional)</label>
        <input
          className="input"
          value={draft.highlight}
          disabled={disabled}
          maxLength={300}
          placeholder="The one line for compact cards. Defaults to the start of their message."
          onChange={(e) => set({ highlight: e.target.value })}
        />
      </div>
      <div>
        <label className="label">Timeframe (optional)</label>
        <input
          className="input"
          value={draft.timeframe}
          disabled={disabled}
          maxLength={120}
          placeholder="Visible change by day 4 · healed in 4 months"
          onChange={(e) => set({ timeframe: e.target.value })}
        />
      </div>
      <div>
        <label className="label">Date they gave permission</label>
        <input
          type="date"
          className="input"
          value={draft.consentedAt}
          disabled={disabled}
          onChange={(e) => set({ consentedAt: e.target.value })}
        />
      </div>
      <div className="sm:col-span-2">
        <label className="label">How permission was given</label>
        <input
          className="input"
          value={draft.consentNote}
          disabled={disabled}
          maxLength={500}
          placeholder="e.g. said yes over WhatsApp on 2 Aug, screenshot saved"
          onChange={(e) => set({ consentNote: e.target.value })}
        />
        <p className="mt-1 text-xs text-slate-500">
          Nothing publishes without a permission date — consent stays a record, not a memory.
        </p>
      </div>
    </div>
  );
}

const EMPTY: DraftFields = {
  name: "",
  condition: "eczema",
  quote: "",
  highlight: "",
  timeframe: "",
  consentedAt: "",
  consentNote: "",
};

function NewProofForm({ onDone, onSaved }: { onDone: () => void; onSaved: () => void }) {
  const [draft, setDraft] = useState<DraftFields>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name.trim(),
          condition: draft.condition,
          quote: draft.quote.trim(),
          highlight: draft.highlight.trim() || null,
          timeframe: draft.timeframe.trim() || null,
          consentedAt: draft.consentedAt || null,
          consentNote: draft.consentNote.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Couldn't save that entry.");
        return;
      }
      setDraft(EMPTY);
      onDone();
      onSaved();
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <h2 className="font-semibold text-white">New proof entry</h2>
      <p className="mt-1 text-sm text-slate-400">
        It saves as a draft. Add the photos on its card below, then approve it to put it live.
      </p>
      <div className="mt-4">
        <Fields draft={draft} set={(p) => setDraft({ ...draft, ...p })} disabled={busy} />
      </div>
      {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}
      <div className="mt-4 flex gap-2">
        <button
          onClick={submit}
          disabled={busy || !draft.name.trim() || !draft.quote.trim()}
          className="btn-primary"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save draft
        </button>
        <button onClick={onDone} disabled={busy} className="btn-ghost">
          Cancel
        </button>
      </div>
    </div>
  );
}

function EditProofForm({ row, onSaved }: { row: ProofRow; onSaved: () => void }) {
  const [draft, setDraft] = useState<DraftFields>({
    name: row.name,
    condition: row.condition,
    quote: row.quote,
    highlight: row.highlight,
    timeframe: row.timeframe ?? "",
    consentedAt: row.consentedAt ?? "",
    consentNote: row.consentNote ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = useMemo(
    () =>
      draft.name !== row.name ||
      draft.condition !== row.condition ||
      draft.quote !== row.quote ||
      draft.highlight !== row.highlight ||
      draft.timeframe !== (row.timeframe ?? "") ||
      draft.consentedAt !== (row.consentedAt ?? "") ||
      draft.consentNote !== (row.consentNote ?? ""),
    [draft, row]
  );

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/proof/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name.trim(),
          condition: draft.condition,
          quote: draft.quote.trim(),
          highlight: draft.highlight.trim() || null,
          timeframe: draft.timeframe.trim() || null,
          consentedAt: draft.consentedAt || null,
          consentNote: draft.consentNote.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Couldn't save those changes.");
        return;
      }
      onSaved();
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Fields draft={draft} set={(p) => setDraft({ ...draft, ...p })} disabled={busy} />
      {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}
      <div className="mt-3">
        <button onClick={submit} disabled={busy || !dirty} className="btn-primary !py-1.5 text-xs">
          {busy && <Loader2 className="h-3 w-3 animate-spin" />} Save changes
        </button>
      </div>
    </div>
  );
}
