import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Search } from "lucide-react";
import { AchievementCard, EventRow, PostCard } from "@/components/site/Cards";
import { DocumentRow } from "@/components/site/DocumentRow";
import { Markdown } from "@/components/site/Markdown";
import { Cover, Img, VideoTile } from "@/components/site/Media";
import { SectionHead } from "@/components/site/Section";
import { api } from "@/lib/api";
import { num, pick, pickList, t } from "@/lib/i18n";
import { campaignOn } from "@/lib/features";
import { getLang } from "@/lib/lang";
import type { GalleryImage, Item, Lang, Stat } from "@/lib/types";
import { DEFAULT_PORTRAIT, splitEmphasis } from "@/lib/utils";

interface Home {
  site: Item;
  achievements: Item[];
  ideas: Item[];
  posts: Item[];
  events: Item[];
  albums: Item[];
  documents: Item[];
  testimonials: Item[];
  videos: Item[];
}

export default async function HomePage() {
  const [data, lang] = await Promise.all([api<Home>("/home"), getLang()]);
  if (!data) return null;
  const d = t(lang);
  const { site } = data;
  const campaign = campaignOn(site);

  return (
    <>
      <Hero site={site} lang={lang} campaign={campaign} />
      <Stats stats={(site.stats as Stat[]) ?? []} lang={lang} />

      {/* Personal message */}
      {pick(site, "message_body", lang) && <Message site={site} lang={lang} />}

      {/* Vision (campaign mode) */}
      {campaign && data.ideas.length > 0 && (
        <section className="relative overflow-hidden bg-navy py-24 text-white md:py-32">
          <div className="grid-lines absolute inset-0" aria-hidden />
          <div className="wrap relative">
            <SectionHead light kicker={d.home.visionKicker} title={d.home.visionTitle} lead={d.home.visionLead} href="/vision" hrefLabel={d.home.readVision} />
            <ol className="mt-16 grid gap-px border border-white/15 bg-white/15 md:grid-cols-2 lg:grid-cols-3">
              {data.ideas.slice(0, 6).map((idea, i) => (
                <li key={idea.id} className="bg-navy">
                  <Link href={`/vision#${idea.slug}`} className="group flex h-full flex-col p-7 transition-colors hover:bg-[#0d3278] md:p-9">
                    <div className="flex items-baseline justify-between">
                      <span className="font-serif text-5xl italic text-[#9db8ff]">{num(String(i + 1).padStart(2, "0"), lang)}</span>
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/50">{pick(idea, "kicker", lang)}</span>
                    </div>
                    <h3 className="mt-10 font-serif text-[1.65rem] leading-tight">{pick(idea, "title", lang)}</h3>
                    <p className="mt-4 leading-relaxed text-white/65">{pick(idea, "summary", lang)}</p>
                    <span className="mt-auto inline-flex items-center gap-2 pt-8 text-sm font-medium text-white/80 group-hover:text-white">
                      {d.common.readMore} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* Track record */}
      {data.achievements.length > 0 && (
        <section className="py-24 md:py-32">
          <div className="wrap">
            <SectionHead kicker={d.home.workKicker} title={d.home.workTitle} href="/work" hrefLabel={d.common.viewAll} />
            <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {data.achievements.slice(0, 6).map((a) => (
                <AchievementCard key={a.id} item={a} lang={lang} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Transparency (campaign mode) */}
      {campaign && (
      <section className="border-y border-line bg-paper py-24 md:py-32">
        <div className="wrap grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="kicker">{d.home.transparencyKicker}</p>
            <h2 className="display mt-4 text-[clamp(2.2rem,4.2vw,3.25rem)]">{d.home.transparencyTitle}</h2>
            {pick(site, "transparency_intro", lang) && <p className="mt-6 text-lg leading-relaxed text-muted">{pick(site, "transparency_intro", lang)}</p>}
            <ul className="mt-8 space-y-3">
              {pickList(site, "transparency_pledge", lang).map((p) => (
                <li key={p} className="flex gap-3">
                  <span className="mt-1 flex size-5 shrink-0 items-center justify-center bg-blue text-white">
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                  <span className="text-ink/85">{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-7">
            <div className="border border-line bg-white p-6 md:p-8">
              <div className="flex items-center justify-between border-b border-line pb-4">
                <p className="font-semibold">{d.home.latestDocs}</p>
                <Search className="size-4 text-muted" />
              </div>
              <ul>
                {data.documents.map((doc) => (
                  <DocumentRow key={doc.id} doc={doc} lang={lang} compact />
                ))}
              </ul>
              <Link href="/transparency" className="group mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue">
                <span className="link-draw">{d.home.allDocs}</span>
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* News */}
      {data.posts.length > 0 && (
        <section className="py-24 md:py-32">
          <div className="wrap">
            <SectionHead kicker={d.home.newsKicker} title={d.home.newsTitle} href="/news" hrefLabel={d.common.viewAll} />
            <div className="mt-14 grid gap-12 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <PostCard item={data.posts[0]} lang={lang} large />
              </div>
              <div className="flex flex-col gap-10 lg:col-span-5">
                {data.posts.slice(1, 3).map((p) => (
                  <PostCard key={p.id} item={p} lang={lang} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Events + get involved */}
      <section className="pb-24 md:pb-32">
        <div className="wrap grid gap-5 lg:grid-cols-2">
          <div className="border border-line p-8 md:p-10">
            <div className="flex items-baseline justify-between">
              <div>
                <p className="kicker">{d.home.eventsKicker}</p>
                <h2 className="display mt-3 text-4xl">{d.home.eventsTitle}</h2>
              </div>
              <Link href="/events" className="text-sm font-semibold text-blue">
                <span className="link-draw">{d.common.viewAll}</span>
              </Link>
            </div>
            {data.events.length ? (
              <ul className="mt-6">
                {data.events.map((e) => (
                  <EventRow key={e.id} item={e} lang={lang} />
                ))}
              </ul>
            ) : (
              <p className="mt-8 text-muted">{d.events.none}</p>
            )}
          </div>
          {campaign ? (
          <div className="relative overflow-hidden bg-blue p-8 text-white md:p-10">
            <div className="grid-lines absolute inset-0" aria-hidden />
            <div className="relative flex h-full flex-col">
              <p className="kicker kicker-light text-white/80">{d.grievance.kicker}</p>
              <h2 className="display mt-3 text-[clamp(2rem,3.6vw,2.75rem)]">{d.home.grievanceTitle}</h2>
              <p className="mt-5 max-w-md text-lg leading-relaxed text-white/80">{d.home.grievanceText}</p>
              <div className="mt-auto flex flex-wrap gap-3 pt-10">
                <Link href="/grievance" className="btn btn-white">
                  {d.home.grievanceCta} <ArrowRight className="size-4" />
                </Link>
                <Link href="/grievance#track" className="btn btn-ghost-light">
                  {d.home.trackCta}
                </Link>
              </div>
            </div>
          </div>
          ) : (
          <div className="relative overflow-hidden bg-blue p-8 text-white md:p-10">
            <div className="grid-lines absolute inset-0" aria-hidden />
            <div className="relative flex h-full flex-col">
              <p className="kicker kicker-light text-white/80">{d.volunteer.kicker}</p>
              <h2 className="display mt-3 text-[clamp(2rem,3.6vw,2.75rem)]">{d.home.joinTitle}</h2>
              <p className="mt-5 max-w-md text-lg leading-relaxed text-white/80">{d.home.joinText}</p>
              <div className="mt-auto flex flex-wrap gap-3 pt-10">
                <Link href="/get-involved" className="btn btn-white">
                  {d.home.volunteer} <ArrowRight className="size-4" />
                </Link>
                <Link href="/contact" className="btn btn-ghost-light">
                  {d.home.contact}
                </Link>
              </div>
            </div>
          </div>
          )}
        </div>
      </section>

      {/* Gallery */}
      {data.albums.length > 0 && <GalleryStrip albums={data.albums} lang={lang} />}

      {/* Voices */}
      {data.testimonials.length > 0 && (
        <section className="py-24 md:py-32">
          <div className="wrap">
            <p className="kicker">{d.home.voicesKicker}</p>
            <div className="mt-10 grid gap-x-12 gap-y-14 md:grid-cols-2">
              {data.testimonials.slice(0, 4).map((v) => (
                <figure key={v.id} className="border-l-2 border-blue pl-7">
                  <blockquote className="font-serif text-[clamp(1.35rem,2.2vw,1.75rem)] leading-snug text-ink">
                    “{pick(v, "quote", lang)}”
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-4">
                    {typeof v.photo === "string" && v.photo && <Img src={v.photo} alt="" className="size-12 rounded-full object-cover" />}
                    <span>
                      <span className="block font-semibold">{String(v.name)}</span>
                      <span className="block text-sm text-muted">{pick(v, "role", lang)}</span>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Videos */}
      {data.videos.length > 0 && (
        <section className="border-t border-line bg-paper py-24">
          <div className="wrap">
            <SectionHead kicker={d.gallery.videos} title={pick(data.videos[0], "title", lang)} href="/gallery#videos" hrefLabel={d.common.viewAll} />
            <div className="mt-12">
              <VideoTile url={data.videos[0].url} thumbnail={data.videos[0].thumbnail} title={pick(data.videos[0], "title", lang)} lang={lang} />
            </div>
          </div>
        </section>
      )}

      {/* Closing call to action */}
      <section className="relative overflow-hidden bg-navy-deep py-24 text-white md:py-32">
        <div className="grid-lines absolute inset-0" aria-hidden />
        <div className="wrap relative grid items-end gap-10 lg:grid-cols-12">
          <h2 className="display text-[clamp(2.4rem,5.5vw,4.5rem)] lg:col-span-8">{pick(site, "cta_title", lang)}</h2>
          <div className="lg:col-span-4">
            <p className="text-lg leading-relaxed text-white/70">{pick(site, "cta_text", lang)}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/get-involved" className="btn btn-white">
                {d.home.volunteer} <ArrowUpRight className="size-4" />
              </Link>
              <Link href="/contact" className="btn btn-ghost-light">
                {d.home.contact}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function Hero({ site, lang, campaign }: { site: Item; lang: Lang; campaign: boolean }) {
  const d = t(lang);
  const name = pick(site, "name", lang);
  const title = pick(site, "hero_title", lang) || name;
  const portrait = typeof site.hero_image === "string" && site.hero_image ? site.hero_image : DEFAULT_PORTRAIT;

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-y-0 right-0 hidden w-[42%] bg-paper lg:block" aria-hidden />
      <div className="wrap relative grid items-stretch gap-12 lg:grid-cols-12 lg:gap-0">
        <div className="flex flex-col justify-center py-16 md:py-24 lg:col-span-7 lg:pr-16 lg:py-32">
          <p className="kicker reveal">{pick(site, "hero_kicker", lang)}</p>
          <h1 className="display reveal reveal-delay-1 mt-6 text-[clamp(2.75rem,6vw,5.1rem)] text-ink">
            {splitEmphasis(title).map((part, i) => (part.em ? <em key={i}>{part.text}</em> : <span key={i}>{part.text}</span>))}
          </h1>
          {pick(site, "hero_text", lang) && (
            <p className="reveal reveal-delay-2 mt-8 max-w-xl text-lg leading-relaxed text-muted md:text-xl">{pick(site, "hero_text", lang)}</p>
          )}
          <div className="reveal reveal-delay-3 mt-10 flex flex-wrap gap-3">
            <Link href="/about" className="btn btn-primary">
              {d.home.aboutMe} <ArrowRight className="size-4" />
            </Link>
            <Link href="/work" className="btn btn-outline">
              {d.home.seeRecord}
            </Link>
          </div>
        </div>

        <div className="relative lg:col-span-5">
          <div className="relative h-full min-h-[460px] lg:-mr-8 lg:min-h-[640px]">
            <div className="absolute inset-0 overflow-hidden bg-navy lg:inset-y-10 lg:left-6">
              {portrait ? (
                <Img src={portrait} alt={name} eager className="reveal absolute inset-0 h-full w-full object-cover object-top" />
              ) : (
                <div className="grid-lines absolute inset-0 flex items-center justify-center">
                  <span className="font-serif text-[9rem] italic leading-none text-white/90">
                    {name
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((w) => w[0])
                      .join("")}
                  </span>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-navy-deep/70 to-transparent" aria-hidden />
            </div>
            <div className="absolute bottom-6 left-0 right-6 bg-white p-5 shadow-[0_20px_60px_-20px_rgb(6_24_61/0.45)] lg:bottom-0 lg:-left-10 lg:right-auto lg:w-80">
              <p className="font-serif text-2xl leading-tight text-ink">{name}</p>
              <p className="mt-1.5 text-sm text-muted">{pick(site, "position", lang)}</p>
              {campaign && pick(site, "party", lang) && (
                <p className="mt-3 border-t border-line pt-3 text-xs font-semibold uppercase tracking-[0.12em] text-blue">{pick(site, "party", lang)}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stats({ stats, lang }: { stats: Stat[]; lang: Lang }) {
  if (!stats.length) return null;
  return (
    <section className="border-y border-line bg-white">
      <div className="wrap">
      <dl className="grid grid-cols-2 gap-px bg-line lg:grid-cols-4">
        {stats.slice(0, 4).map((s, i) => (
          <div
            key={i}
            className="bg-white py-8 pr-4 max-lg:[&:nth-child(even)]:pl-6 lg:py-10 lg:[&:not(:first-child)]:pl-8"
          >
            <dt className="sr-only">{lang === "np" ? s.label_np || s.label : s.label}</dt>
            <dd className="font-serif text-[clamp(2.4rem,4vw,3.4rem)] leading-none tracking-tight text-ink">{num(s.value, lang)}</dd>
            <dd className="mt-3 text-sm text-muted">{lang === "np" ? s.label_np || s.label : s.label}</dd>
          </div>
        ))}
      </dl>
      </div>
    </section>
  );
}

function GalleryStrip({ albums, lang }: { albums: Item[]; lang: Lang }) {
  const d = t(lang);
  const tiles = albums.slice(0, 5).map((a) => {
    const photos = (a.photos as GalleryImage[]) ?? [];
    return { album: a, src: (a.cover as string) || photos[0]?.url, count: photos.length };
  });
  return (
    <section className="pb-24 md:pb-32">
      <div className="wrap">
        <SectionHead kicker={d.home.galleryKicker} title={d.home.galleryTitle} href="/gallery" hrefLabel={d.common.viewAll} />
        <div className="mt-12 grid auto-rows-[220px] grid-cols-2 gap-3 md:grid-cols-4 md:auto-rows-[260px]">
          {tiles.map(({ album, src, count }, i) => (
            <Link
              key={album.id}
              href={`/gallery/${album.slug ?? album.id}`}
              className={`group relative overflow-hidden ${i === 0 ? "col-span-2 row-span-2" : ""}`}
            >
              <Cover src={src} alt={pick(album, "title", lang)} className="absolute inset-0" imgClassName="transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/85 via-navy-deep/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <p className={`font-serif leading-tight ${i === 0 ? "text-3xl" : "text-lg"}`}>{pick(album, "title", lang)}</p>
                <p className="mt-1 text-xs text-white/70">
                  {num(count, lang)} {d.common.photos}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function Message({ site, lang }: { site: Item; lang: Lang }) {
  const d = t(lang);
  const name = pick(site, "name", lang);
  const photo = typeof site.message_image === "string" && site.message_image ? site.message_image : null;
  const signoff = (
    <div className="mt-10 flex items-end gap-5 border-t border-line pt-6">
      {typeof site.signature === "string" && site.signature ? (
        <Img src={site.signature} alt="" className="h-14 w-auto" />
      ) : (
        <span className="font-serif text-3xl italic text-blue">{name}</span>
      )}
      <span className="pb-1 text-sm text-muted">{pick(site, "position", lang)}</span>
    </div>
  );

  if (!photo) {
    return (
      <section className="py-24 md:py-32">
        <div className="wrap grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="kicker">{d.home.messageKicker}</p>
            <h2 className="display mt-4 text-[clamp(2.2rem,4.5vw,3.5rem)]">{pick(site, "message_title", lang)}</h2>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <Markdown className={lang === "en" ? "text-[1.2rem] first-letter:float-left first-letter:mr-3 first-letter:font-serif first-letter:text-[4.2rem] first-letter:leading-[0.85] first-letter:text-blue" : "text-[1.2rem]"}>
              {pick(site, "message_body", lang)}
            </Markdown>
            {signoff}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 md:py-32">
      <div className="wrap grid items-start gap-14 lg:grid-cols-12">
        <div className="relative lg:col-span-5">
          <div className="absolute -bottom-5 -right-5 hidden h-2/3 w-2/3 bg-blue-soft lg:block" aria-hidden />
          <Cover src={photo} alt={name} className="relative aspect-[4/5]" />
        </div>
        <div className="lg:col-span-6 lg:col-start-7">
          <p className="kicker">{d.home.messageKicker}</p>
          <h2 className="display mt-4 text-[clamp(2.2rem,4.5vw,3.5rem)]">{pick(site, "message_title", lang)}</h2>
          <Markdown className="mt-8 text-[1.15rem]">{pick(site, "message_body", lang)}</Markdown>
          {signoff}
        </div>
      </div>
    </section>
  );
}
