import type { Metadata } from "next";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { getSite } from "@/lib/api";
import { pick, t, todayLine } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import { DEFAULT_PORTRAIT } from "@/lib/utils";
import { campaignOn } from "@/lib/features";

export async function generateMetadata(): Promise<Metadata> {
  const [site, lang] = await Promise.all([getSite(), getLang()]);
  const name = pick(site, "name", lang);
  const description = pick(site, "seo_description", lang);
  const og = typeof site.og_image === "string" && site.og_image ? site.og_image : (site.hero_image as string | undefined) || DEFAULT_PORTRAIT;
  return {
    title: { default: `${name} — ${pick(site, "position", lang)}`, template: `%s · ${name}` },
    description,
    openGraph: { title: name, description, images: og ? [og] : undefined, type: "website" },
    twitter: { card: "summary_large_image" },
  };
}

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const [site, lang] = await Promise.all([getSite(), getLang()]);
  const d = t(lang);
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-blue focus:px-4 focus:py-2 focus:text-white">
        {d.common.skip}
      </a>
      <Header
        lang={lang}
        nav={d.nav}
        name={pick(site, "name", lang)}
        position={pick(site, "position", lang)}
        region={pick(site, "constituency", lang)}
        today={todayLine(lang)}
        phone={(site.phone as string) || undefined}
        email={(site.email as string) || undefined}
        logo={(site.logo as string) || DEFAULT_PORTRAIT}
        campaign={campaignOn(site)}
      />
      <main id="main">{children}</main>
      <Footer site={site} lang={lang} d={d} />
    </>
  );
}
