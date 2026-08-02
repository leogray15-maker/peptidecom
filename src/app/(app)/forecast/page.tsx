import { ForecastClient, type SavedForecastItem } from "@/components/forecast-client";
import { PageHeader } from "@/components/page-header";
import { getCurrentUser } from "@/lib/auth";
import { safe } from "@/lib/safe-db";
import {
  type SavedForecast,
  type TswProfile,
  getProfile,
  listForecasts,
  tswKey,
} from "@/lib/tsw-db";

export const metadata = { title: "Flare forecast" };

export default async function ForecastPage() {
  const user = await getCurrentUser();
  const uid = user ? tswKey(user) : null;

  const [profile, saved] = uid
    ? await Promise.all([
        safe(() => getProfile(uid), {} as TswProfile),
        safe(() => listForecasts(uid, 14), [] as SavedForecast[]),
      ])
    : [{} as TswProfile, [] as SavedForecast[]];

  const history: SavedForecastItem[] = saved.map((f) => ({
    date: f.date,
    score: f.score,
    band: f.band,
    tone: f.tone,
    factors: f.factors ?? [],
    place: f.place ?? null,
  }));

  return (
    <div>
      <PageHeader
        title="Flare forecast"
        subtitle="What today's weather tends to do to skin like yours — and what helps."
      />
      <ForecastClient savedLocation={profile.location ?? null} history={history} />
    </div>
  );
}
