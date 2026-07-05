import { JournalClient } from "@/components/journal-client";
import { PageHeader } from "@/components/page-header";
import { getCurrentUser } from "@/lib/auth";
import { safe } from "@/lib/safe-db";
import { type JournalEntry, listJournal, tswKey } from "@/lib/tsw-db";

export const metadata = { title: "Journal" };

export default async function ProgressPage() {
  const user = await getCurrentUser();
  const entries = user
    ? await safe(() => listJournal(tswKey(user)), [] as JournalEntry[])
    : [];

  return (
    <div>
      <PageHeader
        title="Research journal"
        subtitle="Weight loss, muscle, skin, focus, sleep — whatever you're running research for, track how it's actually going."
      />
      <JournalClient
        initialEntries={entries.map((e) => ({
          id: e.id,
          date: e.date,
          goal: e.goal,
          rating: e.rating,
          weightKg: e.weightKg,
          note: e.note,
        }))}
      />
    </div>
  );
}
