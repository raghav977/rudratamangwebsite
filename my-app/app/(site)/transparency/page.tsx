import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CAMPAIGN_PAGES } from "@/lib/features";
import Link from "next/link";
import { Check, Search, X } from "lucide-react";
import { DocumentRow } from "@/components/site/DocumentRow";
import { FilterChips } from "@/components/site/Filters";
import { PageHero } from "@/components/site/Section";
import { api, getSite, list } from "@/lib/api";
import { label, num, pick, pickList, t } from "@/lib/i18n";
import { getLang } from "@/lib/lang";

type Facet = { value: string; count: number };

export async function generateMetadata(): Promise<Metadata> {
  if (!CAMPAIGN_PAGES) return {};
  const lang = await getLang();
  return { title: t(lang).transparency.kicker };
}

export default async function TransparencyPage({ searchParams }: PageProps<"/transparency">) {
  if (!CAMPAIGN_PAGES) notFound();
  const sp = await searchParams;
  const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);
  const q = str(sp.q);
  const category = str(sp.category);
  const fy = str(sp.fy);

  const [site, lang, docs, facets] = await Promise.all([
    getSite(),
    getLang(),
    list("documents", { q, category, fiscal_year: fy, limit: 500 }),
    api<{ categories: Facet[]; years: Facet[] }>("/documents/facets"),
  ]);
  const d = t(lang);
  const pledge = pickList(site, "transparency_pledge", lang);

  return (
    <>
      <PageHero kicker={d.transparency.kicker} title={d.transparency.title} lead={pick(site, "transparency_intro", lang)} />

      {pledge.length > 0 && (
        <section className="border-b border-line">
          <div className="wrap py-14">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{d.transparency.pledge}</p>
            <ol className="mt-6 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-5">
              {pledge.map((p, i) => (
                <li key={p} className="flex flex-col gap-4 bg-white p-5 lg:first:pl-0">
                  <span className="flex items-center gap-3">
                    <span className="flex size-6 items-center justify-center bg-blue text-white">
                      <Check className="size-3.5" strokeWidth={3} />
                    </span>
                    <span className="font-serif text-sm italic text-muted">{num(String(i + 1).padStart(2, "0"), lang)}</span>
                  </span>
                  <span className="text-[15px] leading-snug">{p}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      <section className="wrap py-14 md:py-20" id="library">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <h2 className="display text-4xl">{d.transparency.library}</h2>
          <form action="/transparency#library" className="relative w-full md:w-96">
            {category && <input type="hidden" name="category" value={category} />}
            {fy && <input type="hidden" name="fy" value={fy} />}
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder={d.transparency.searchPlaceholder}
              className="field h-12 pl-10"
              aria-label={d.common.search}
            />
          </form>
        </div>

        <div className="mt-8 space-y-4">
          <FilterChips
            base="/transparency"
            param="category"
            current={category}
            allLabel={d.common.all}
            extra={{ q, fy }}
            options={(facets?.categories ?? []).map((c) => ({ value: c.value, label: label(c.value, lang), count: c.count }))}
          />
          {(facets?.years.length ?? 0) > 1 && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="mr-1 text-muted">{d.transparency.fiscalYear}:</span>
              {facets!.years.map((y) => {
                const qs = new URLSearchParams();
                if (q) qs.set("q", q);
                if (category) qs.set("category", category);
                if (fy !== y.value) qs.set("fy", y.value);
                return (
                  <Link
                    key={y.value}
                    href={`/transparency?${qs}`}
                    scroll={false}
                    className={`px-2.5 py-1 font-medium tabular-nums transition-colors ${fy === y.value ? "bg-blue text-white" : "text-ink/70 hover:bg-blue-soft hover:text-ink"}`}
                  >
                    {num(y.value, lang)}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-10 flex items-center justify-between border-b border-ink pb-3 text-sm">
          <p className="font-medium">
            {num(docs.total, lang)} {d.transparency.results}
          </p>
          {(q || category || fy) && (
            <Link href="/transparency#library" className="inline-flex items-center gap-1 text-muted hover:text-ink">
              <X className="size-4" /> {d.common.all}
            </Link>
          )}
        </div>
        {docs.items.length ? (
          <ul>
            {docs.items.map((doc) => (
              <DocumentRow key={doc.id} doc={doc} lang={lang} />
            ))}
          </ul>
        ) : (
          <p className="py-16 text-center text-muted">{d.transparency.none}</p>
        )}
      </section>
    </>
  );
}
