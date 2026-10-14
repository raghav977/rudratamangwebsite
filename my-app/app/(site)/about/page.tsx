import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";
import { Markdown } from "@/components/site/Markdown";
import { Cover, Img } from "@/components/site/Media";
import { getSite, list } from "@/lib/api";
import { num, pick, t } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import { DEFAULT_PORTRAIT } from "@/lib/utils";
import { campaignOn } from "@/lib/features";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return { title: t(lang).about.kicker };
}

export default async function AboutPage() {
  const [site, lang, timeline] = await Promise.all([getSite(), getLang(), list("timeline")]);
  const d = t(lang);
  const name = pick(site, "name", lang);
  const facts = [
    [d.about.born, pick(site, "born", lang)],
    [d.about.hometown, pick(site, "hometown", lang)],
    [d.about.education, pick(site, "education", lang)],
    [d.about.family, pick(site, "family", lang)],
  ].filter(([, v]) => v);

  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <div className="absolute inset-y-0 left-0 hidden w-[38%] bg-navy lg:block" aria-hidden>
          <div className="grid-lines absolute inset-0" />
        </div>
        <div className="wrap relative grid gap-12 py-16 md:py-24 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-5">
            <Cover src={site.about_image || site.hero_image || DEFAULT_PORTRAIT} alt={name} tone="navy" className="reveal aspect-[4/5] shadow-[0_30px_80px_-30px_rgb(6_24_61/0.6)]" eager />
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <p className="kicker reveal">{d.about.kicker}</p>
            <h1 className="display reveal reveal-delay-1 mt-5 text-[clamp(3rem,7vw,5.5rem)]">{name}</h1>
            <p className="reveal reveal-delay-1 mt-3 text-lg text-muted">{pick(site, "position", lang)}</p>
            {pick(site, "about_intro", lang) && (
              <p className="reveal reveal-delay-2 mt-8 font-serif text-[clamp(1.35rem,2.2vw,1.7rem)] leading-snug text-ink">{pick(site, "about_intro", lang)}</p>
            )}
            {facts.length > 0 && (
              <dl className="reveal reveal-delay-3 mt-10 grid grid-cols-2 gap-px border border-line bg-line">
                {facts.map(([k, v]) => (
                  <div key={k} className="bg-white p-5">
                    <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{k}</dt>
                    <dd className="mt-2 font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
      </section>

      {pick(site, "about_body", lang) && (
        <section className="py-20 md:py-28">
          <div className="wrap grid gap-12 lg:grid-cols-12">
            <aside className="lg:col-span-3">
              <div className="lg:sticky lg:top-32">
                {campaignOn(site) && typeof site.manifesto_pdf === "string" && site.manifesto_pdf && (
                  <a href={site.manifesto_pdf} className="group block border border-line p-6 transition-colors hover:border-blue" download>
                    <Download className="size-5 text-blue" />
                    <p className="mt-4 font-semibold leading-snug">{d.about.manifesto}</p>
                    <p className="mt-1 text-xs text-muted">PDF</p>
                  </a>
                )}
              </div>
            </aside>
            <div className="max-w-[44rem] lg:col-span-8 lg:col-start-5">
              <Markdown>{pick(site, "about_body", lang)}</Markdown>
            </div>
          </div>
        </section>
      )}

      {timeline.items.length > 0 && (
        <section className="border-t border-line bg-paper py-20 md:py-28">
          <div className="wrap">
            <p className="kicker">{d.about.journey}</p>
            <ol className="relative mt-14">
              <span className="absolute bottom-0 left-[7px] top-2 w-px bg-line md:left-1/2" aria-hidden />
              {timeline.items.map((m, i) => (
                <li key={m.id} className={`relative grid gap-4 pb-14 pl-10 last:pb-0 md:grid-cols-2 md:gap-16 md:pl-0`}>
                  <span className="absolute left-0 top-2 size-[15px] border-[3px] border-paper bg-blue md:left-1/2 md:-translate-x-1/2" aria-hidden />
                  <div className={i % 2 ? "md:order-2" : "md:text-right"}>
                    <p className="font-serif text-5xl italic leading-none text-blue">{num(m.year as string, lang)}</p>
                  </div>
                  <div className={i % 2 ? "md:order-1 md:text-right" : ""}>
                    <h3 className="text-xl font-semibold">{pick(m, "title", lang)}</h3>
                    {pick(m, "description", lang) && <p className="mt-2 leading-relaxed text-muted">{pick(m, "description", lang)}</p>}
                    {typeof m.image === "string" && m.image && (
                      <Img src={m.image} alt={pick(m, "title", lang)} className={`mt-5 aspect-[3/2] w-full max-w-sm object-cover ${i % 2 ? "md:ml-auto" : ""}`} />
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      <section className="py-20">
        <div className="wrap flex flex-col items-start justify-between gap-6 border-t border-line pt-12 md:flex-row md:items-center">
          <p className="display max-w-xl text-3xl">{d.about.moreTitle}</p>
          <Link href="/work" className="btn btn-primary">
            {d.home.seeRecord} <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
