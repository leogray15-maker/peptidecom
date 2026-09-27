"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Barcode, ChevronDown, Loader2, Lock, ScanLine, Sparkles, Trash2 } from "lucide-react";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { ProductResult } from "@/components/product-result";
import { FoodResult } from "@/components/food-result";
import {
  type ProductAnalysis,
  type ScannedProduct,
  type ScoreBand,
  analyzeIngredients,
} from "@/lib/product-score";
import { type FoodAnalysis, analyzeFood } from "@/lib/food-score";
import {
  type GradingCounts,
  type ScanRecord,
  addScan,
  clearScans,
  gradingCounts,
  groupScans,
  loadScans,
  syncScans,
} from "@/lib/scan-history";
import { EmptyState, ListRow, SCORE_COLOR, ScoreBadge, SegmentedControl, Tag, toneLevel } from "@/components/ui";
import type { ScoreLevel } from "@/lib/tokens";
import { cn } from "@/lib/utils";

const EXAMPLE =
  "Aqua, Glycerin, Cetearyl Alcohol, Parfum, Linalool, Limonene, Sodium Lauryl Sulfate, Methylisothiazolinone, Lavandula Angustifolia Oil, Phenoxyethanol";

const GRADES: { label: keyof GradingCounts; level: ScoreLevel }[] = [
  { label: "Excellent", level: "excellent" },
  { label: "Good", level: "good" },
  { label: "Poor", level: "poor" },
  { label: "Bad", level: "bad" },
];

type KindFilter = "all" | "food" | "cosmetic";

export function ScanClient() {
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<ScannedProduct | null>(null);
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const [foodAnalysis, setFoodAnalysis] = useState<FoodAnalysis | null>(null);
  const [manualBarcode, setManualBarcode] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [pasteName, setPasteName] = useState("");
  const [notFoundCode, setNotFoundCode] = useState<string | null>(null);
  const [history, setHistory] = useState<ScanRecord[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [filter, setFilter] = useState<KindFilter>("all");

  // This device's scans render instantly; the account's are merged in behind.
  useEffect(() => {
    setHistory(loadScans());
    setHistoryLoaded(true);
    void syncScans().then(setHistory);
  }, []);

  const counts = useMemo(() => gradingCounts(history), [history]);
  const totalScans = history.length;
  const grouped = useMemo(
    () => groupScans(history).filter((g) => filter === "all" || g.latest.kind === filter),
    [history, filter]
  );

  function record(p: ScannedProduct, a: { score: number; band: ScoreBand }, kind: "food" | "cosmetic") {
    const next = addScan({
      at: new Date().toISOString(),
      code: p.code || null,
      name: p.name,
      brand: p.brand,
      imageUrl: p.imageUrl,
      score: a.score,
      band: a.band.label,
      tone: a.band.tone,
      kind,
    });
    setHistory(next);
  }

  /** Score + display a product. Foods get the nutrition scorer, cosmetics the
   * skin scorer. Returns false when there wasn't enough data to score. */
  function showProduct(p: ScannedProduct): boolean {
    if (p.kind === "food") {
      const fa = analyzeFood(p);
      if (fa.hasData) {
        setProduct(p);
        setFoodAnalysis(fa);
        setAnalysis(null);
        record(p, fa, "food");
        return true;
      }
    }
    const a = analyzeIngredients(p.ingredientsText ?? "");
    if (!a.empty) {
      setProduct(p);
      setAnalysis(a);
      setFoodAnalysis(null);
      record(p, a, "cosmetic");
      return true;
    }
    return false;
  }

  async function lookupBarcode(code: string) {
    setScanning(false);
    setError(null);
    setNotFoundCode(null);
    setLoading(true);
    setProduct(null);
    setAnalysis(null);
    setFoodAnalysis(null);
    try {
      const res = await fetch(`/api/scan/product?barcode=${encodeURIComponent(code)}`);
      const data = (await res.json().catch(() => null)) as ScannedProduct | null;
      if (res.status === 404 || !data?.found) {
        setError(
          `No product found for barcode ${code} in the open databases yet. Paste its ingredients below to score it now — or add it to the free database so it's there next time.`
        );
        setNotFoundCode(code);
        setPasteName("");
        setShowPaste(true);
        return;
      }
      if (!showProduct(data)) {
        // Found the product, but not enough data (no nutrition, no ingredients).
        setProduct(data);
        setPasteName(data.name ?? "");
        setShowPaste(true);
        setError(
          `We found ${data.name ?? "this product"} but there isn't enough data to score it yet. Paste its ingredients from the pack to score it now.`
        );
      }
    } catch {
      setError("Couldn't reach the product database. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function submitManualBarcode() {
    const code = manualBarcode.replace(/\D/g, "");
    if (code.length < 6) {
      setError("A barcode is 6–14 digits.");
      return;
    }
    void lookupBarcode(code);
  }

  function analysePasted(name: string) {
    const a = analyzeIngredients(pasteText);
    if (a.empty) {
      setError("Paste an ingredient list first.");
      return;
    }
    const p: ScannedProduct = {
      code: "",
      name: name.trim() || "Pasted ingredients",
      brand: null,
      imageUrl: product?.imageUrl ?? null,
      ingredientsText: pasteText,
      source: "manual",
      found: false,
      kind: "cosmetic",
      nutriscoreGrade: null,
      novaGroup: null,
      additives: [],
      organic: false,
      nutriments: null,
    };
    setProduct(p);
    setAnalysis(a);
    setFoodAnalysis(null);
    setError(null);
    record(p, a, "cosmetic");
  }

  function reset() {
    setProduct(null);
    setAnalysis(null);
    setFoodAnalysis(null);
    setError(null);
    setNotFoundCode(null);
    setShowPaste(false);
    setPasteText("");
    setPasteName("");
    setManualBarcode("");
  }

  async function wipeHistory() {
    if (!confirm("Clear your scan history? This clears it on every device.")) return;
    setHistory([]);
    await clearScans();
  }

  // ── Result view ──────────────────────────────────────────────────────────
  if (product && (foodAnalysis || (analysis && !analysis.empty))) {
    return (
      <div className="space-y-5">
        <button onClick={reset} className="btn-ghost -ml-2">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Scan another
        </button>
        {foodAnalysis ? (
          <FoodResult product={product} analysis={foodAnalysis} />
        ) : (
          <ProductResult product={product} analysis={analysis!} />
        )}
      </div>
    );
  }

  // ── Home view ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {scanning && (
        <BarcodeScanner onDetected={(code) => lookupBarcode(code)} onClose={() => setScanning(false)} />
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* Scan: viewfinder, barcode entry, paste fallback */}
        <section className="card" aria-labelledby="scan-title">
          <h2 id="scan-title" className="card-title">
            Scan a product
          </h2>
          <p className="mt-0.5 text-meta text-fg-muted">
            Skincare is scored for sensitive, eczema-prone skin; food and drink on nutrition.
          </p>

          <div className="relative mt-4 grid aspect-[16/9] max-h-64 w-full place-items-center rounded-control border border-line bg-surface-sunken">
            {(["left-3 top-3 border-l-2 border-t-2 rounded-tl-[6px]", "right-3 top-3 border-r-2 border-t-2 rounded-tr-[6px]", "left-3 bottom-3 border-l-2 border-b-2 rounded-bl-[6px]", "right-3 bottom-3 border-r-2 border-b-2 rounded-br-[6px]"] as const).map((c) => (
              <span key={c} className={cn("absolute h-6 w-6 border-accent", c)} aria-hidden />
            ))}
            <div className="flex flex-col items-center px-6 text-center">
              <Barcode className="h-9 w-9 text-fg-muted" strokeWidth={1.5} aria-hidden />
              <p className="mt-2 text-meta text-fg-muted">Point your camera at the barcode</p>
              <button onClick={() => setScanning(true)} disabled={loading} className="btn-primary mt-4 min-h-11">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <ScanLine className="h-4 w-4" aria-hidden />}
                {loading ? "Looking up…" : "Open scanner"}
              </button>
            </div>
          </div>

          <form
            className="mt-4"
            onSubmit={(e) => {
              e.preventDefault();
              submitManualBarcode();
            }}
          >
            <label htmlFor="barcode" className="label">
              Or type the barcode
            </label>
            <div className="flex gap-2">
              <input
                id="barcode"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                inputMode="numeric"
                autoComplete="off"
                placeholder="e.g. 3337875597197"
                aria-invalid={error === "A barcode is 6–14 digits." ? true : undefined}
                aria-describedby={error ? "scan-error" : undefined}
                className="input flex-1"
              />
              <button type="submit" disabled={loading} className="btn-secondary min-h-11">
                Look up
              </button>
            </div>
          </form>

          {error && (
            <p id="scan-error" role="alert" className="mt-2 text-meta text-score-moderate">
              {error}
            </p>
          )}
          {notFoundCode && (
            <a
              href={`https://world.openbeautyfacts.org/cgi/product.pl?type=add&code=${notFoundCode}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-[13.5px] font-medium text-accent-strong hover:underline"
            >
              Add this product to the open database →
            </a>
          )}

          {/* Paste ingredients (manual / fallback) */}
          <div className="mt-5 border-t border-line-subtle pt-4">
            <button
              type="button"
              onClick={() => setShowPaste((v) => !v)}
              aria-expanded={showPaste}
              aria-controls="paste-panel"
              className="flex min-h-11 w-full items-center justify-between gap-3 text-left"
            >
              <span className="text-sm font-semibold text-fg">No barcode? Paste the ingredients</span>
              <ChevronDown
                className={cn("h-4 w-4 shrink-0 text-fg-muted transition-transform duration-150", showPaste && "rotate-180")}
                aria-hidden
              />
            </button>
            {showPaste && (
              <div id="paste-panel" className="mt-3 space-y-2">
                <label htmlFor="paste-name" className="sr-only">
                  Product name (optional)
                </label>
                <input
                  id="paste-name"
                  value={pasteName}
                  onChange={(e) => setPasteName(e.target.value)}
                  placeholder="Product name (optional)"
                  className="input"
                />
                <label htmlFor="paste-text" className="label !mb-0 pt-1">
                  Ingredient list
                </label>
                <textarea
                  id="paste-text"
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  rows={5}
                  placeholder="Aqua, Glycerin, Cetearyl Alcohol, Parfum…"
                  className="input min-h-[120px] resize-y"
                />
                <div className="flex flex-wrap gap-2 pt-1">
                  <button onClick={() => analysePasted(pasteName)} disabled={!pasteText.trim()} className="btn-primary">
                    <ScanLine className="h-4 w-4" aria-hidden /> Score ingredients
                  </button>
                  <button
                    onClick={() => {
                      setPasteText(EXAMPLE);
                      setPasteName("Example lotion");
                    }}
                    className="btn-ghost"
                  >
                    <Sparkles className="h-4 w-4" aria-hidden /> Try an example
                  </button>
                </div>
              </div>
            )}
            <p className="mt-2 flex items-center gap-1.5 text-meta text-fg-muted">
              <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Ingredient analysis runs on your device. The list never leaves your phone.
            </p>
          </div>
        </section>

        {/* Grading overview */}
        <section className="card flex flex-col" aria-labelledby="overview-title">
          <h2 id="overview-title" className="card-title">
            Grading overview
          </h2>
          <p className="mt-0.5 text-meta text-fg-muted">
            {totalScans} scan{totalScans === 1 ? "" : "s"} on your account
          </p>
          {!historyLoaded ? (
            <div className="mt-5 h-3 animate-pulse rounded-full bg-surface-active" aria-hidden />
          ) : totalScans === 0 ? (
            <EmptyState
              icon={ScanLine}
              title="Nothing scanned yet"
              body="Your grades add up here as you scan."
              className="mt-5 flex-1"
            />
          ) : (
            <>
              <div
                className="mt-5 flex h-3 w-full gap-0.5 overflow-hidden rounded-full"
                role="img"
                aria-label={GRADES.map((g) => `${g.label} ${counts[g.label]}`).join(", ")}
              >
                {GRADES.filter((g) => counts[g.label] > 0).map((g) => (
                  <span
                    key={g.label}
                    style={{ flexGrow: counts[g.label], backgroundColor: SCORE_COLOR[g.level] }}
                    className="h-full"
                  />
                ))}
              </div>
              <ul className="mt-5 space-y-1">
                {GRADES.map((g) => (
                  <li key={g.label} className="flex min-h-9 items-center justify-between text-sm">
                    <span className="flex items-center gap-2.5 text-fg-secondary">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SCORE_COLOR[g.level] }} aria-hidden />
                      {g.label}
                    </span>
                    <span className="font-mono tabular-nums text-fg">
                      {counts[g.label]}
                      <span className="ml-2 text-fg-muted">
                        {Math.round((counts[g.label] / totalScans) * 100)}%
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>

      {/* Recent scans */}
      {totalScans > 0 && (
        <section className="card !px-0 !pb-2" aria-labelledby="recent-title">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6">
            <h2 id="recent-title" className="card-title">
              Recent scans
            </h2>
            <div className="flex items-center gap-2">
              <SegmentedControl
                label="Filter scans"
                size="sm"
                value={filter}
                onChange={setFilter}
                options={[
                  { value: "all", label: "All" },
                  { value: "food", label: "Food" },
                  { value: "cosmetic", label: "Skincare" },
                ]}
              />
              <button onClick={wipeHistory} className="btn-ghost min-h-11 sm:min-h-9 px-2.5 text-[13px]">
                <Trash2 className="h-3.5 w-3.5" aria-hidden /> Clear
              </button>
            </div>
          </div>
          {grouped.length === 0 ? (
            <p className="px-5 py-8 text-center text-meta text-fg-muted sm:px-6">
              No {filter === "food" ? "food" : "skincare"} scans yet.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-line-subtle border-t border-line-subtle">
              {grouped.slice(0, 20).map(({ latest: s, count }) => {
                const band = GRADES.find((g) => g.label === s.band);
                return (
                  <li key={s.at}>
                    <ListRow
                      className="sm:px-6"
                      leading={
                        s.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={s.imageUrl}
                            alt=""
                            className="h-10 w-10 rounded-[8px] border border-line bg-surface-sunken object-contain p-0.5"
                          />
                        ) : (
                          <span className="grid h-10 w-10 place-items-center rounded-[8px] border border-line bg-surface-sunken text-fg-muted">
                            <ScanLine className="h-4 w-4" aria-hidden />
                          </span>
                        )
                      }
                      title={s.name ?? "Unnamed product"}
                      meta={
                        <span className="flex items-center gap-2">
                          <span className="truncate">{s.brand ?? (s.code ? `#${s.code}` : "Pasted ingredients")}</span>
                          {count > 1 && <span className="shrink-0">· Scanned {count}×</span>}
                        </span>
                      }
                      trailing={
                        <>
                          {s.kind && (
                            <Tag className="hidden sm:inline-flex">{s.kind === "food" ? "Food" : "Skincare"}</Tag>
                          )}
                          <ScoreBadge
                            level={band ? band.level : toneLevel(s.tone)}
                            value={s.score}
                            label={band ? s.band : null}
                            size="sm"
                          />
                        </>
                      }
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      <p className="text-meta leading-relaxed text-fg-muted">
        Educational scores, not a safety verdict or medical advice. Product data comes from Open
        Beauty Facts, Open Products Facts and Open Food Facts, community-run databases that can be
        incomplete or out of date, so always check the physical pack.
      </p>
    </div>
  );
}
