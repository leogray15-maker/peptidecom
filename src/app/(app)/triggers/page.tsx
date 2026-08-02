import { PageHeader } from "@/components/page-header";
import { PeerSupportNote } from "@/components/peer-support-note";
import { type ChecklistItem, TriggersClient } from "@/components/triggers-client";
import { getCurrentUser } from "@/lib/auth";
import { getCondition } from "@/lib/conditions";
import { safe } from "@/lib/safe-db";
import { COMMON_TRIGGERS } from "@/lib/tsw";
import { type TriggerLog, type TswProfile, getProfile, listTriggers, tswKey } from "@/lib/tsw-db";

export const metadata = { title: "Triggers" };

/** The everyday list, plus anything specific to the member's condition that
 * isn't already on it. De-duped on name so a condition suggestion never
 * appears twice. */
function buildChecklist(suggestions: { kind: string; name: string }[]): ChecklistItem[] {
  const items: ChecklistItem[] = COMMON_TRIGGERS.map((t) => ({
    name: t.name,
    kind: t.kind,
    icon: t.icon,
  }));
  const seen = new Set(items.map((i) => i.name.toLowerCase()));
  for (const s of suggestions) {
    if (seen.has(s.name.toLowerCase())) continue;
    seen.add(s.name.toLowerCase());
    items.push({ name: s.name, kind: s.kind, icon: "Sparkles" });
  }
  return items;
}

export default async function TriggersPage() {
  const user = await getCurrentUser();
  const uid = user ? tswKey(user) : null;
  const [entries, profile] = uid
    ? await Promise.all([
        safe(() => listTriggers(uid), [] as TriggerLog[]),
        safe(() => getProfile(uid), {} as TswProfile),
      ])
    : [[], {} as TswProfile];
  const condition = getCondition(profile.condition);

  return (
    <div>
      <PageHeader
        title="Triggers"
        subtitle="Tick what touched your skin today. Over a few weeks your own patterns surface."
        back="/dashboard"
      />
      <TriggersClient
        initialEntries={entries.map((e) => ({
          id: e.id,
          date: e.date,
          kind: e.kind,
          name: e.name,
          effect: e.effect,
          note: e.note,
        }))}
        checklist={buildChecklist(condition.triggerSuggestions)}
      />
      <PeerSupportNote />
    </div>
  );
}
