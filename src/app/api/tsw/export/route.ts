import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { siteLabel } from "@/lib/peptides";
import { SYMPTOMS, goalLabel, zoneLabel } from "@/lib/tsw";
import { listJournal, listLogs, listPeptideLogs, listTriggers, tswKey } from "@/lib/tsw-db";

const symptomLabel = (id: string) => SYMPTOMS.find((s) => s.id === id)?.label ?? id;

function toCsv(rows: (string | number | null | undefined)[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const s = cell == null ? "" : String(cell);
          return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(",")
    )
    .join("\r\n");
}

const EFFECT_LABELS: Record<number, string> = {
  1: "helped",
  0: "no change",
  [-1]: "flared",
};

/** Download the member's own tracking data as CSV.
 * ?data=logs (default) | triggers | journal | peptides */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const kind = new URL(req.url).searchParams.get("data") ?? "logs";
  const uid = tswKey(user);

  try {
    let rows: (string | number | null | undefined)[][];
    if (kind === "triggers") {
      const triggers = await listTriggers(uid);
      rows = [
        ["date", "kind", "name", "effect", "note"],
        ...triggers.map((t) => [t.date, t.kind, t.name, EFFECT_LABELS[t.effect] ?? t.effect, t.note]),
      ];
    } else if (kind === "journal") {
      const entries = await listJournal(uid);
      rows = [
        ["date", "goal", "rating_1_to_10", "weight_kg", "note"],
        ...entries.map((e) => [e.date, goalLabel(e.goal) ?? e.goal, e.rating, e.weightKg, e.note]),
      ];
    } else if (kind === "peptides") {
      const entries = await listPeptideLogs(uid);
      rows = [
        ["date", "peptide", "dose_mg", "site", "purpose", "note"],
        ...entries.map((e) => [
          e.date,
          e.peptide,
          e.doseMg,
          siteLabel(e.site) ?? "",
          goalLabel(e.purpose) ?? "",
          e.note,
        ]),
      ];
    } else {
      const logs = await listLogs(uid);
      rows = [
        ["date", "severity_1_to_10", "areas", "symptoms", "sleep_1_to_5", "mood_1_to_5", "note"],
        ...logs.map((l) => [
          l.date,
          l.severity,
          l.areas.map(zoneLabel).join("; "),
          l.symptoms.map(symptomLabel).join("; "),
          l.sleep,
          l.mood,
          l.note,
        ]),
      ];
    }

    const name = ["triggers", "journal", "peptides"].includes(kind) ? kind : "daily-logs";
    return new NextResponse(toCsv(rows) + "\r\n", {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="arcane-${name}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Failed to export data:", err);
    return NextResponse.json(
      { error: "Couldn't export — the database isn't reachable yet." },
      { status: 503 }
    );
  }
}
