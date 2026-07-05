import Link from "next/link";
import { BookOpen, ExternalLink, FlaskConical, Globe, GraduationCap, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PeerSupportNote } from "@/components/peer-support-note";
import { RESOURCE_SECTIONS, type Resource } from "@/lib/resources";

export const metadata = { title: "Resource library" };

const kindIcon: Record<Resource["kind"], React.ElementType> = {
  org: Globe,
  article: BookOpen,
  study: FlaskConical,
  video: BookOpen,
  community: Users,
  guide: GraduationCap,
};

const kindLabel: Record<Resource["kind"], string> = {
  org: "Organisation",
  article: "Article",
  study: "Study",
  video: "Video",
  community: "Community",
  guide: "Guide",
};

export default function ResourcesPage() {
  return (
    <div>
      <PageHeader
        title="Resource library"
        subtitle="A short shelf, deliberately. Every entry is vetted and summarised so you don't have to doom-scroll for answers."
      />

      <div className="space-y-8">
        {RESOURCE_SECTIONS.map((section) => (
          <div key={section.title}>
            <h2 className="text-lg font-semibold text-white">{section.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{section.blurb}</p>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {section.items.map((item) => {
                const Icon = kindIcon[item.kind];
                const external = item.url.startsWith("http");
                const inner = (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-900/60 text-brand-300">
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <span className="badge border border-lab-border text-slate-500">
                        {kindLabel[item.kind]}
                      </span>
                    </div>
                    <p className="mt-3 font-semibold text-white">
                      {item.title}
                      {external && <ExternalLink className="ml-1.5 inline h-3.5 w-3.5 text-slate-500" />}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">{item.source}</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.summary}</p>
                  </>
                );
                return external ? (
                  <a
                    key={item.title}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card transition hover:border-brand-600"
                  >
                    {inner}
                  </a>
                ) : (
                  <Link key={item.title} href={item.url} className="card transition hover:border-brand-600">
                    {inner}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <PeerSupportNote />
    </div>
  );
}
