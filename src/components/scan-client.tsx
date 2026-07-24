"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Barcode,
  Loader2,
  ScanLine,
  Sparkles,
  Trash2,
} from "lucide-react";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { ProductResult } from "@/components/product-result";
import {
  type ProductAnalysis,
  type ScannedProduct,
  analyzeIngredients,
} from "@/lib/product-score";
import {
  type GradingCounts,
  type ScanRecord,
  addScan,
  clearScans,
  gradingCounts,
  loadScans,
} from "@/lib/scan-history";
import { cn } from "@/lib/utils";

const EXAMPLE =
  "Aqua, Glycerin, Cetearyl Alcohol, Parfum, Linalool, Limonene, Sodium Lauryl Sulfate, Methylisothiazolinone, Lavandula Angustifolia Oil, Phenoxyethanol";

const gradeMeta: { label: keyof GradingCounts; dot: string; text: string }[] = [
  { label: "Excellent", dot: "bg-emerald-400", text: "text-emerald-300" },
  { label: "Good", dot: "bg-lime-400", text: "text-lime-300" },
  { label: "Poor", dot: "bg-orange-400", text: "text-orange-300" },
  { label: "Bad", dot: "bg-rose-500", text: "text-rose-300" },
];

export function ScanClient() {
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<ScannedProduct | null>(null);
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const [manualBarcode, setManualBarcode] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [pasteName, setPasteName] = useState("");
  const [history, setHistory] = useState<ScanRecord[]>([]);

  useEffect(() => {
    setHistory(loadScans());
  }, []);

  const counts = useMemo(() => gradingCounts(history), [history]);
  const totalScans = history.length;

  function record(p: ScannedProduct, a: ProductAnalysis) {
    if (a.empty) return;
    const next = addScan({
      at: new Date().toISOString(),
      code: p.code || null,
      name: p.name,
      brand: p.brand,
      imageUrl: p.imageUrl,
      score: a.score,
      band: a.band.label,
      tone: a.band.tone,
    });
    setHistory(next);
  }

  function showProduct(p: ScannedProduct) {
    const a = analyzeIngredients(p.ingredientsText ?? "");
    setProduct(p);
    setAnalysis(a);
    if (!a.empty) record(p, a);
  }

  async function lookupBarcode(code: string) {
    setScanning(false);
    setError(null);
    setLoading(true);
    setProduct(null);
    setAnalysis(null);
    try {
      const res = await fetch(`/api/scan/product?barcode=${encodeURIComponent(code)}`);
      const data = (await res.json().catch(() => null)) as ScannedProduct | null;
      if (res.status === 404 || !data?.found) {
        setError(
          `No product found for barcode ${code} in the open databases yet. You can paste its ingredients below to score it.`
        );
        setPasteName("");
        setShowPaste(true);
        return;
      }
      if (!data.ingredientsText) {
        setProduct(data);
        setAnalysis(null);
        setPasteName(data.name ?? "");
        setShowPaste(true);
        setError(
          `We found ${data.name ?? "this product"} but its ingredient list isn't in the database yet. Paste it from the pack to score it.`
        );
        return;
      }
      showProduct(data);
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
    };
    setProduct(p);
    setAnalysis(a);
    setError(null);
    record(p, a);
  }

  function reset() {
    setProduct(null);
    setAnalysis(null);
    setError(null);
    setShowPaste(false);
    setPasteText("");
    setPasteName("");
    setManualBarcode("");
  }

  function wipeHistory() {
    if (!confirm("Clear your scan history on this device?")) return;
    clearScans();
    setHistory([]);
  }

  // ── Result view ──────────────────────────────────────────────────────────
  if (analysis && product) {
    return (
      <div className="space-y-5">
        <button onClick={reset} className="btn-ghost -ml-2">
          <ArrowLeft className="h-4 w-4" /> Scan another
        </button>
        <ProductResult product={product} analysis={analysis} />
      </div>
    );
  }

  // ── Home view ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {scanning && (
        <BarcodeScanner onDetected={(code) => lookupBarcode(code)} onClose={() => setScanning(false)} />
      )}

      {/* Scan CTA */}
      <div className="card !rounded-3xl">
        <div className="flex flex-col items-center py-6 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-3xl bg-brand-500/12 text-brand-300 ring-1 ring-inset ring-brand-500/20">
            <Barcode className="h-8 w-8" />
          </div>
          <p className="mt-4 text-lg font-semibold text-white">Scan a product barcode</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-400">
            Point your camera at the barcode. We look it up in the open cosmetics database and
            score it for sensitive, eczema-prone skin.
          </p>
          <button onClick={() => setScanning(true)} disabled={loading} className="btn-primary mt-5">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />}
            {loading ? "Looking up…" : "Open scanner"}
          </button>
        </div>

        {/* Manual barcode */}
        <div className="border-t border-lab-border pt-4">
          <label className="label">Or type the barcode</label>
          <div className="flex gap-2">
            <input
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitManualBarcode()}
              inputMode="numeric"
              placeholder="e.g. 3337875597197"
              className="input flex-1"
            />
            <button onClick={submitManualBarcode} disabled={loading} className="btn-secondary">
              Look up
            </button>
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-amber-300">{error}</p>}
      </div>

      {/* Paste ingredients (manual / fallback) */}
      <div className="card !rounded-3xl">
        {!showPaste ? (
          <button
            onClick={() => setShowPaste(true)}
            className="flex w-full items-center justify-between text-left"
          >
            <div>
              <p className="font-semibold text-white">No barcode? Paste the ingredients</p>
              <p className="mt-0.5 text-sm text-slate-400">
                Type or paste the list from the back of the pack and score it directly.
              </p>
            </div>
            <ScanLine className="h-5 w-5 text-slate-500" />
          </button>
        ) : (
          <>
            <label className="label">Ingredient list</label>
            <input
              value={pasteName}
              onChange={(e) => setPasteName(e.target.value)}
              placeholder="Product name (optional)"
              className="input mb-2"
            />
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={5}
              placeholder="Aqua, Glycerin, Cetearyl Alcohol, Parfum…"
              className="input min-h-[120px] resize-y"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => analysePasted(pasteName)} disabled={!pasteText.trim()} className="btn-primary">
                <ScanLine className="h-4 w-4" /> Score ingredients
              </button>
              <button
                onClick={() => {
                  setPasteText(EXAMPLE);
                  setPasteName("Example lotion");
                }}
                className="btn-secondary"
              >
                <Sparkles className="h-4 w-4" /> Try an example
              </button>
            </div>
          </>
        )}
        <p className="mt-3 text-xs text-slate-500">
          Ingredient analysis runs entirely on your device — the list never leaves your phone.
        </p>
      </div>

      {/* Grading overview */}
      {totalScans > 0 && (
        <div className="card !rounded-3xl">
          <h2 className="font-semibold text-white">Grading overview</h2>
          <p className="mt-0.5 text-sm text-slate-400">{totalScans} product{totalScans === 1 ? "" : "s"} scanned on this device</p>
          <div className="mt-4 space-y-2">
            {gradeMeta.map((g) => (
              <div key={g.label} className="flex items-center justify-between rounded-xl border border-lab-border bg-lab-bg px-4 py-2.5">
                <span className="flex items-center gap-3">
                  <span className={cn("h-2.5 w-2.5 rounded-full", g.dot)} />
                  <span className="text-sm font-medium text-white">{g.label}</span>
                </span>
                <span className={cn("text-sm font-semibold tabular-nums", g.text)}>{counts[g.label]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      {totalScans > 0 && (
        <div className="card !rounded-3xl">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Recent scans</h2>
            <button onClick={wipeHistory} className="text-xs text-slate-500 hover:text-rose-400">
              <Trash2 className="mr-1 inline h-3.5 w-3.5" /> Clear
            </button>
          </div>
          <ul className="mt-4 space-y-2">
            {[...history].reverse().slice(0, 12).map((s) => {
              const meta = gradeMeta.find((g) => g.label === s.band)!;
              return (
                <li
                  key={s.at}
                  className="flex items-center gap-3 rounded-xl border border-lab-border bg-lab-bg px-3 py-2.5"
                >
                  {s.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.imageUrl} alt="" className="h-9 w-9 shrink-0 rounded-lg bg-white/5 object-contain p-0.5" />
                  ) : (
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-500/10 text-brand-300">
                      <ScanLine className="h-4 w-4" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{s.name ?? "Unnamed product"}</p>
                    <p className="truncate text-xs text-slate-500">
                      {s.brand ?? (s.code ? `#${s.code}` : "Pasted ingredients")}
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className={cn("h-2.5 w-2.5 rounded-full", meta.dot)} />
                    <span className="text-sm font-semibold tabular-nums text-white">{s.score}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <p className="text-xs leading-relaxed text-slate-500">
        Educational tool for sensitive / eczema-prone skin — not a safety verdict or medical
        advice. Product data comes from Open Beauty Facts &amp; Open Food Facts, community-run
        databases that can be incomplete or out of date, so always check the physical pack.
      </p>
    </div>
  );
}
