import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Dict } from "@/lib/i18n";
import { pick } from "@/lib/i18n";
import type { Item, Lang } from "@/lib/types";
import { SocialLinks } from "./Social";

export function Footer({ site, lang, d }: { site: Item; lang: Lang; d: Dict }) {
  const name = pick(site, "name", lang);
  const explore = [
    { href: "/about", label: d.nav.about },
    { href: "/work", label: d.nav.work },
    { href: "/news", label: d.nav.news },
    { href: "/gallery", label: d.nav.gallery },
    { href: "/events", label: d.nav.events },
  ];
  const participate = [
    { href: "/get-involved", label: d.nav.volunteer },
    { href: "/contact", label: d.nav.contact },
  ];
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-navy-deep text-white">
      <div className="grid-lines absolute inset-0" aria-hidden />
      <div className="wrap relative pt-20 pb-10">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="font-serif text-[clamp(2.5rem,5vw,3.75rem)] leading-none tracking-tight">{name}</p>
            <p className="mt-3 text-white/60">{pick(site, "position", lang)}</p>
            <p className="mt-8 max-w-sm text-lg leading-relaxed text-white/80">{d.footer.tagline}</p>
            <SocialLinks site={site} className="mt-8 -ml-2" iconClass="text-white/60 hover:text-white" />
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-7">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40">{d.footer.explore}</p>
              <ul className="mt-5 space-y-3">
                {explore.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="link-draw text-white/80 hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40">{d.footer.participate}</p>
              <ul className="mt-5 space-y-3">
                {participate.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="link-draw text-white/80 hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40">{d.contact.office}</p>
              <address className="mt-5 space-y-3 not-italic text-white/80">
                {pick(site, "address", lang) && <p>{pick(site, "address", lang)}</p>}
                {typeof site.phone === "string" && site.phone && (
                  <p>
                    <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="hover:text-white">
                      {site.phone}
                    </a>
                  </p>
                )}
                {typeof site.email === "string" && site.email && (
                  <p>
                    <a href={`mailto:${site.email}`} className="break-all hover:text-white">
                      {site.email}
                    </a>
                  </p>
                )}
                {pick(site, "office_hours", lang) && <p className="text-sm text-white/50">{pick(site, "office_hours", lang)}</p>}
              </address>
            </div>
          </div>
        </div>

        <div className="mt-20 flex flex-col gap-4 border-t border-white/10 pt-8 text-sm text-white/50 md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {name}. {d.footer.rights}
          </p>
          <Link href="/admin" className="inline-flex items-center gap-1.5 hover:text-white">
            {d.footer.admin} <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
