import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CAMPAIGN_PAGES } from "@/lib/features";
import { Check, Download } from "lucide-react";
import { Markdown } from "@/components/site/Markdown";
import { Img } from "@/components/site/Media";
import { Empty, PageHero } from "@/components/site/Section";
import { getSite, list } from "@/lib/api";
import { num, pick, pickList, t } from "@/lib/i18n";
import { getLang } from "@/lib/lang";

export async function generateMetadata(): Promise<Metadata> {
  if (!CAMPAIGN_PAGES) return {};
  const lang = await getLang();
  return { title: t(lang).vision.kicker };
}

export default async function VisionPage() {
  if (!CAMPAIGN_PAGES) notFound();
  const [site, lang, ideas] = await Promise.all([getSite(), getLang(), list("ideas")]);
  const d = t(lang);
  const manifesto = typeof site.manifesto_pdf === "string" ? site.manifesto_pdf : "";

  return (
    <>
      <PageHero kicker={d.vision.kicker} title={d.vision.title} lead={d.vision.lead}>
        {manifesto && (
          <a href={manifesto} download className="btn btn-primary">
            <Download className="size-4" /> {d.about.manifesto}
          </a>
        )}
      </PageHero>

      <div className="wrap grid gap-12 py-16 md:py-24 lg:grid-cols-12">
        {/* Index */}
        <nav className="hidden lg:col-span-3 lg:block" aria-label={d.vision.kicker}>
          <ol className="sticky top-32 space-y-1 border-l border-line">
            {ideas.items.map((idea, i) => (
              <li key={idea.id}>
                <a href={`#${idea.slug}`} className="-ml-px flex gap-3 border-l-2 border-transparent py-2 pl-4 text-sm text-muted transition-colors hover:border-blue hover:text-ink">
                  <span className="font-serif italic text-blue">{num(String(i + 1).padStart(2, "0"), lang)}</span>
                  {pick(idea, "title", lang)}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="lg:col-span-9">
          {ideas.items.length === 0 && <Empty>{d.common.noItems}</Empty>}
          {ideas.items.map((idea, i) => {
            const points = pickList(idea, "points", lang);
            return (
              <article key={idea.id} id={idea.slug ?? undefined} className="scroll-mt-28 border-t border-ink py-14 first:pt-10">
                <div className="grid gap-8 md:grid-cols-[7rem_1fr]">
                  <p className="font-serif text-7xl italic leading-none text-blue">{num(String(i + 1).padStart(2, "0"), lang)}</p>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{pick(idea, "kicker", lang)}</p>
                    <h2 className="display mt-3 text-[clamp(2rem,3.8vw,3rem)]">{pick(idea, "title", lang)}</h2>
                    {pick(idea, "summary", lang) && <p className="mt-5 max-w-2xl text-xl leading-relaxed text-ink/80">{pick(idea, "summary", lang)}</p>}
                    {typeof idea.image === "string" && idea.image && (
                      <Img src={idea.image} alt={pick(idea, "title", lang)} className="mt-8 aspect-[16/8] w-full object-cover" />
                    )}
                    {points.length > 0 && (
                      <div className="mt-8 border border-line bg-paper p-6 md:p-8">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue">{d.vision.commitments}</p>
                        <ul className="mt-5 grid gap-4 md:grid-cols-2">
                          {points.map((p) => (
                            <li key={p} className="flex gap-3">
                              <Check className="mt-1 size-4 shrink-0 text-blue" strokeWidth={2.5} />
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <Markdown className="mt-8 max-w-2xl">{pick(idea, "body", lang)}</Markdown>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </>
  );
}
