"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  CheckCircle2,
  Download,
  ImageOff,
  Loader2,
  Megaphone,
  ShieldX,
  Trophy,
} from "lucide-react";
import { CONDITIONS, conditionLabel } from "@/lib/conditions";
import type { StoryPrompts, StoryStatus } from "@/lib/tsw-db";
import { cn, formatDate, timeAgo } from "@/lib/utils";

export interface AdminStory {
  id: string;
  title: string;
  body: string;
  prompts: StoryPrompts | null;
  authorName: string | null;
  monthsIn: number | null;
  condition: string;
  createdAt: string;
  marketingConsent: boolean;
  marketingConsentAt: string | null;
  photoConsent: boolean;
  status: StoryStatus;
  postedAt: string | null;
  beforeUrl: string | null;
  afterUrl: string | null;
}

const STATUS_META: Record<StoryStatus, { label: string; cls: string }> = {
  new: { label: "New", cls: "bg-brand-500/15 text-brand-200" },
  approved: { label: "Ready to post", cls: "bg-emerald-500/15 text-emerald-300" },
  posted: { label: "Posted", cls: "bg-slate-500/15 text-slate-300" },
  skipped: { label: "Skipped", cls: "bg-amber-500/15 text-amber-300" },
};

export function StoriesPanel({
  stories,
  daysSinceLast,
}: {
  stories: AdminStory[];
  daysSinceLast: number | null;
}) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<StoryStatus | "all">("all");
  const [consentOnly, setConsentOnly] = useState(false);
  const [conditionFilter, setConditionFilter] = useState("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [generatorFor, setGeneratorFor] = useState<string | null>(null);

  const visible = useMemo(
    () =>
      stories.filter(
        (s) =>
          (statusFilter === "all" || s.status === statusFilter) &&
          (!consentOnly || s.marketingConsent) &&
          (conditionFilter === "all" || s.condition === conditionFilter)
      ),
    [stories, statusFilter, consentOnly, conditionFilter]
  );

  async function setStatus(id: string, status: StoryStatus) {
    setBusy(id);
    await fetch(`/api/admin/stories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(null);
    router.refresh();
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Recovery stories</h1>
          <p className="mt-1 text-sm text-slate-400">
            Triage submissions, check consent, generate post-ready cards.
          </p>
        </div>
        {/* Pipeline health: how fresh is the content well? */}
        <div className="card !px-4 !py-3">
          <p className="text-xs text-slate-500">Since last story</p>
          <p
            className={cn(
              "text-lg font-bold",
              daysSinceLast == null || daysSinceLast > 14 ? "text-amber-300" : "text-white"
            )}
          >
            {daysSinceLast == null ? "No stories yet" : `${daysSinceLast} day${daysSinceLast === 1 ? "" : "s"}`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-5 flex flex-wrap items-center gap-1.5">
        {(["all", "new", "approved", "posted", "skipped"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "badge border transition",
              statusFilter === s
                ? "border-brand-500 bg-brand-500/20 text-brand-200"
                : "border-lab-border text-slate-400 hover:text-slate-200"
            )}
          >
            {s === "all" ? "All" : STATUS_META[s].label}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-lab-border" />
        <button
          onClick={() => setConsentOnly((v) => !v)}
          className={cn(
            "badge border transition",
            consentOnly
              ? "border-emerald-500 bg-emerald-500/15 text-emerald-300"
              : "border-lab-border text-slate-400 hover:text-slate-200"
          )}
        >
          <Megaphone className="h-3 w-3" /> Consented only
        </button>
        <select
          className="input !w-auto !py-1 text-xs"
          value={conditionFilter}
          onChange={(e) => setConditionFilter(e.target.value)}
        >
          <option value="all">All conditions</option>
          {CONDITIONS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Stories */}
      <div className="mt-5 space-y-4">
        {visible.length === 0 ? (
          <div className="card py-10 text-center text-sm text-slate-400">
            Nothing matches these filters.
          </div>
        ) : (
          visible.map((s) => (
            <div key={s.id} className="card">
              <div className="flex flex-wrap items-center gap-2">
                <Trophy className="h-4 w-4 shrink-0 text-gold-400" />
                <p className="font-semibold text-white">{s.title}</p>
                <span className={cn("badge", STATUS_META[s.status].cls)}>
                  {STATUS_META[s.status].label}
                </span>
                <span className="badge border border-lab-border text-slate-400">
                  {conditionLabel(s.condition)}
                </span>
                {s.marketingConsent ? (
                  <span
                    className="badge bg-emerald-500/15 text-emerald-300"
                    title={`Marketing consent given ${s.marketingConsentAt ? formatDate(s.marketingConsentAt) : ""}`}
                  >
                    <Megaphone className="h-3 w-3" /> consented
                  </span>
                ) : (
                  <span className="badge bg-rose-500/15 text-rose-300" title="Wall-only — no marketing use">
                    <ShieldX className="h-3 w-3" /> wall only
                  </span>
                )}
                {s.marketingConsent &&
                  (s.photoConsent && (s.beforeUrl || s.afterUrl) ? (
                    <span className="badge bg-emerald-500/15 text-emerald-300">
                      <Camera className="h-3 w-3" /> photos ok
                    </span>
                  ) : (
                    <span className="badge border border-lab-border text-slate-500">
                      <ImageOff className="h-3 w-3" /> no photos
                    </span>
                  ))}
              </div>
              <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm text-slate-400">{s.body}</p>
              <p className="mt-2 text-xs text-slate-500">
                {s.authorName ?? "A member"}
                {s.monthsIn != null && ` · ${s.monthsIn} months in`} · {timeAgo(s.createdAt)}
                {s.postedAt && ` · posted ${formatDate(s.postedAt)}`}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {s.status !== "approved" && s.status !== "posted" && (
                  <button onClick={() => setStatus(s.id, "approved")} disabled={busy === s.id} className="btn-secondary !py-1.5 text-xs">
                    {busy === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                    Ready to post
                  </button>
                )}
                {s.status !== "posted" && (
                  <button onClick={() => setStatus(s.id, "posted")} disabled={busy === s.id} className="btn-secondary !py-1.5 text-xs">
                    Mark posted
                  </button>
                )}
                {s.status !== "skipped" && s.status !== "posted" && (
                  <button onClick={() => setStatus(s.id, "skipped")} disabled={busy === s.id} className="btn-ghost !py-1.5 text-xs">
                    Skip
                  </button>
                )}
                {s.status === "posted" && (
                  <button onClick={() => setStatus(s.id, "approved")} disabled={busy === s.id} className="btn-ghost !py-1.5 text-xs">
                    Un-mark posted
                  </button>
                )}
                {s.marketingConsent && (
                  <button
                    onClick={() => setGeneratorFor(generatorFor === s.id ? null : s.id)}
                    className="btn-primary !py-1.5 text-xs"
                  >
                    <Download className="h-3 w-3" /> {generatorFor === s.id ? "Hide card" : "Generate card"}
                  </button>
                )}
              </div>

              {generatorFor === s.id && s.marketingConsent && (
                <div className="mt-4 border-t border-lab-border pt-4">
                  <StoryCardGenerator story={s} />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Quote-card generator (client-side canvas — no paid image APIs) ─────────

const CARD_W = 1080;
const CARD_H = 1920; // 9:16 for TikTok / IG stories & reels covers

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) {
        lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, " …");
        return lines;
      }
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, maxLines);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image failed"));
    img.src = src;
  });
}

/** drawImage with cover-fit inside a rounded rect. */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.clip();
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  ctx.restore();
}

function StoryCardGenerator({ story }: { story: AdminStory }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendering, setRendering] = useState(false);
  const [rendered, setRendered] = useState(false);
  // The most quotable line: "what changed" > "advice" > story body.
  const quote =
    story.prompts?.changed?.trim() || story.prompts?.advice?.trim() || story.body.trim();
  const [quoteText, setQuoteText] = useState(quote.length > 260 ? `${quote.slice(0, 257)}…` : quote);

  async function render() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setRendering(true);
    const ctx = canvas.getContext("2d")!;

    // Background — matches the app's dark lab theme.
    ctx.fillStyle = "#0f0f15";
    ctx.fillRect(0, 0, CARD_W, CARD_H);
    let g = ctx.createRadialGradient(160, 260, 0, 160, 260, 900);
    g.addColorStop(0, "rgba(124, 92, 255, 0.28)");
    g.addColorStop(1, "rgba(124, 92, 255, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CARD_W, CARD_H);
    g = ctx.createRadialGradient(CARD_W - 120, CARD_H - 300, 0, CARD_W - 120, CARD_H - 300, 800);
    g.addColorStop(0, "rgba(212, 175, 55, 0.16)");
    g.addColorStop(1, "rgba(212, 175, 55, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CARD_W, CARD_H);

    let y = 150;

    // Consented before/after photos.
    const hasPhotos = story.photoConsent && story.beforeUrl && story.afterUrl;
    if (hasPhotos) {
      try {
        const [before, after] = await Promise.all([
          loadImage(story.beforeUrl!),
          loadImage(story.afterUrl!),
        ]);
        const pw = 460;
        const ph = 560;
        const gap = CARD_W - 80 * 2 - pw * 2;
        drawCover(ctx, before, 80, y, pw, ph, 28);
        drawCover(ctx, after, 80 + pw + gap, y, pw, ph, 28);
        ctx.fillStyle = "#e2e8f0";
        ctx.font = "600 34px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("THEN", 80 + pw / 2, y + ph + 54);
        ctx.fillText("NOW", 80 + pw + gap + pw / 2, y + ph + 54);
        y += ph + 130;
      } catch {
        y += 40; // photos failed to decode — render as text-only card
      }
    } else {
      y += 120;
    }

    // Quote.
    ctx.textAlign = "left";
    ctx.fillStyle = "#7c5cff";
    ctx.font = "700 160px Georgia, serif";
    ctx.fillText("“", 64, y + 60);
    y += 110;
    ctx.fillStyle = "#f8fafc";
    ctx.font = "600 58px Georgia, serif";
    const lines = wrapText(ctx, quoteText, CARD_W - 180, hasPhotos ? 7 : 10);
    for (const line of lines) {
      ctx.fillText(line, 96, y);
      y += 82;
    }

    // Attribution.
    y += 40;
    ctx.fillStyle = "#a78bfa";
    ctx.font = "600 40px system-ui, sans-serif";
    const who = story.authorName?.split(" ")[0] ?? "A member";
    const months = story.monthsIn != null ? ` · ${story.monthsIn} months in` : "";
    ctx.fillText(`— ${who}${months}`, 96, y);
    ctx.fillStyle = "#64748b";
    ctx.font = "400 32px system-ui, sans-serif";
    ctx.fillText(`${conditionLabel(story.condition)} recovery, tracked in the lab`, 96, y + 52);

    // Footer brand.
    ctx.fillStyle = "#d4af37";
    ctx.font = "700 40px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("T H E   A R C A N E   L A B", CARD_W / 2, CARD_H - 110);
    ctx.fillStyle = "#475069";
    ctx.font = "400 28px system-ui, sans-serif";
    ctx.fillText("Real member story, shared with permission", CARD_W / 2, CARD_H - 60);

    setRendering(false);
    setRendered(true);
  }

  function download() {
    canvasRef.current?.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `arcane-story-${story.id}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px,1fr]">
      <div>
        <canvas
          ref={canvasRef}
          width={CARD_W}
          height={CARD_H}
          className="w-full max-w-[280px] rounded-xl border border-lab-border bg-lab-bg"
        />
      </div>
      <div className="space-y-3">
        <div>
          <label className="label">Quote on the card</label>
          <textarea
            className="input min-h-24"
            value={quoteText}
            maxLength={300}
            onChange={(e) => {
              setQuoteText(e.target.value);
              setRendered(false);
            }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={render} disabled={rendering} className="btn-secondary">
            {rendering && <Loader2 className="h-4 w-4 animate-spin" />}
            {rendered ? "Re-render" : "Render card"}
          </button>
          <button onClick={download} disabled={!rendered} className="btn-primary">
            <Download className="h-4 w-4" /> Download PNG (1080×1920)
          </button>
        </div>
        <p className="text-xs text-slate-500">
          Rendered entirely in your browser — no image APIs, no cost. Photos appear only when the
          member ticked the photo-consent box{story.photoConsent ? "" : " (they didn't for this one)"}.
        </p>
      </div>
    </div>
  );
}
