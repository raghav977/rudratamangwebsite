import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { campaignOn } from "@/lib/features";
import { PageHero } from "@/components/site/Section";
import { list, getSite } from "@/lib/api";
import { num, pick, pickList, t } from "@/lib/i18n";
import { getLang } from "@/lib/lang";

export async function generateMetadata(): Promise<Metadata> {
  if (!campaignOn(await getSite())) return {};
  const lang = await getLang();
  return { title: t(lang).urlabari.title };
}

const fmt = (n: unknown, lang: "en" | "np", digits = 0) =>
  typeof n === "number" ? num(n.toLocaleString("en-IN", { maximumFractionDigits: digits }), lang) : "—";

export default async function UrlabariPage() {
  if (!campaignOn(await getSite())) notFound();
  const [lang, wards] = await Promise.all([getLang(), list("wards")]);
  const d = t(lang);
  const totals = wards.items.reduce<{ pop: number; hh: number; area: number }>(
    (acc, w) => ({
      pop: acc.pop + (Number(w.population) || 0),
      hh: acc.hh + (Number(w.households) || 0),
      area: acc.area + (Number(w.area_km2) || 0),
    }),
    { pop: 0, hh: 0, area: 0 },
  );
  const maxPop = Math.max(...wards.items.map((w) => Number(w.population) || 0), 1);

  return (
    <>
      <PageHero kicker={d.urlabari.kicker} title={d.urlabari.title} lead={d.urlabari.lead}>
        <dl className="grid max-w-3xl grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
          {[
            [num(wards.total, lang), d.common.wards],
            [fmt(totals.pop, lang), d.urlabari.population],
            [fmt(totals.hh, lang), d.urlabari.households],
            [`${fmt(totals.area, lang, 1)} km²`, d.urlabari.area],
          ].map(([v, k]) => (
            <div key={k} className="bg-white p-5">
              <dd className="font-serif text-3xl leading-none">{v}</dd>
              <dt className="mt-2 text-sm text-muted">{k}</dt>
            </div>
          ))}
        </dl>
      </PageHero>

      <section className="wrap py-14 md:py-20">
        <div className="grid gap-px border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
          {wards.items.map((w) => {
            const priorities = pickList(w, "priorities", lang);
            const share = ((Number(w.population) || 0) / maxPop) * 100;
            return (
              <article key={w.id} className="flex flex-col bg-white p-7">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue">{d.common.ward}</p>
                    <p className="font-serif text-6xl leading-none">{num(w.number as number, lang)}</p>
                  </div>
                  <p className="max-w-[55%] text-right text-sm text-muted">{pick(w, "name", lang)}</p>
                </div>
                <div className="mt-8">
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-muted">{d.urlabari.population}</span>
                    <span className="font-semibold tabular-nums">{fmt(w.population, lang)}</span>
                  </div>
                  <div className="mt-2 h-1 bg-blue-soft">
                    <div className="h-full bg-blue" style={{ width: `${share}%` }} />
                  </div>
                </div>
                <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-muted">{d.urlabari.households}</dt>
                    <dd className="mt-0.5 font-semibold tabular-nums">{fmt(w.households, lang)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">{d.urlabari.area}</dt>
                    <dd className="mt-0.5 font-semibold tabular-nums">{fmt(w.area_km2, lang, 2)} km²</dd>
                  </div>
                  {pick(w, "chair", lang) && (
                    <div className="col-span-2">
                      <dt className="text-muted">{d.urlabari.chair}</dt>
                      <dd className="mt-0.5 font-semibold">{pick(w, "chair", lang)}</dd>
                    </div>
                  )}
                </dl>
                {priorities.length > 0 && (
                  <ul className="mt-6 space-y-1.5 border-t border-line pt-5 text-sm">
                    {priorities.map((p) => (
                      <li key={p} className="flex gap-2">
                        <span className="mt-2 size-1 shrink-0 bg-blue" /> {p}
                      </li>
                    ))}
                  </ul>
                )}
                {pick(w, "note", lang) && <p className="mt-4 text-sm leading-relaxed text-muted">{pick(w, "note", lang)}</p>}
              </article>
            );
          })}
        </div>
        <p className="mt-6 text-sm text-muted">{d.urlabari.source}</p>
      </section>
    </>
  );
}
