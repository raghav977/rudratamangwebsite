"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUpRight, Mail, Menu, Phone, X } from "lucide-react";
import type { Dict } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { cn } from "@/lib/utils";
import { LangToggle } from "./LangToggle";

interface Props {
  lang: Lang;
  nav: Dict["nav"];
  name: string;
  position: string;
  region: string;
  today: string;
  phone?: string;
  email?: string;
  logo?: string | null;
}

export function Header({ lang, nav, name, position, region, today, phone, email, logo }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close the mobile menu after navigating.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  const links = [
    { href: "/about", label: nav.about },
    { href: "/work", label: nav.work },
    { href: "/news", label: nav.news },
    { href: "/gallery", label: nav.gallery },
    { href: "/events", label: nav.events },
    { href: "/contact", label: nav.contact },
  ];
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  return (
    <>
      {/* Utility bar */}
      <div className="hidden bg-navy-deep text-[13px] text-white/70 md:block">
        <div className="wrap flex h-10 items-center justify-between">
          <p className="flex items-center gap-3 tracking-wide">
            <span>{region}</span>
            <span className="h-3 w-px bg-white/20" />
            <span className="text-white/55">{today}</span>
          </p>
          <div className="flex items-center gap-6">
            {phone && (
              <a href={`tel:${phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 hover:text-white">
                <Phone className="size-3.5" /> {phone}
              </a>
            )}
            {email && (
              <a href={`mailto:${email}`} className="inline-flex items-center gap-2 hover:text-white">
                <Mail className="size-3.5" /> {email}
              </a>
            )}
            <span className="h-4 w-px bg-white/15" />
            <LangToggle lang={lang} className="font-medium text-white hover:text-white" />
          </div>
        </div>
      </div>

      <header
        className={cn(
          "sticky top-0 z-40 bg-white/95 backdrop-blur-md transition-[box-shadow,border-color] duration-300",
          scrolled ? "border-b border-line shadow-[0_8px_30px_-12px_rgb(10_42_102/0.15)]" : "border-b border-transparent",
        )}
      >
        <div className="wrap flex h-[72px] items-center justify-between gap-6 lg:h-20">
          <Link href="/" className="group flex items-center gap-3" aria-label={name}>
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" className="size-11 object-contain" />
            ) : (
              <span className="flex size-11 items-center justify-center bg-blue font-serif text-lg italic text-white transition-colors group-hover:bg-navy">
                {initials}
              </span>
            )}
            <span className="flex flex-col leading-tight">
              <span className="font-serif text-[1.3rem] font-semibold tracking-tight text-ink">{name}</span>
              <span className="hidden text-[12px] text-muted sm:block">{position}</span>
            </span>
          </Link>

          <nav className="hidden items-center xl:flex" aria-label="Main">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "relative px-3 py-2 text-[14.5px] font-medium transition-colors",
                  isActive(l.href) ? "text-blue" : "text-ink/80 hover:text-ink",
                )}
              >
                {l.label}
                <span
                  className={cn(
                    "absolute inset-x-3 -bottom-[3px] h-[2px] origin-left bg-blue transition-transform duration-300",
                    isActive(l.href) ? "scale-x-100" : "scale-x-0",
                  )}
                />
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/get-involved" className="btn btn-primary hidden h-11 sm:inline-flex">
              {nav.volunteer}
            </Link>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex size-11 items-center justify-center text-ink xl:hidden"
              aria-label="Open menu"
              aria-expanded={open}
            >
              <Menu className="size-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <div
        className={cn(
          "fixed inset-0 z-50 flex flex-col bg-navy-deep text-white transition-[opacity,visibility] duration-300 xl:hidden",
          open ? "visible opacity-100" : "invisible opacity-0",
        )}
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
      >
        <div className="grid-lines absolute inset-0 opacity-60" aria-hidden />
        <div className="wrap relative flex h-[72px] items-center justify-between">
          <span className="font-serif text-xl">{name}</span>
          <button type="button" onClick={() => setOpen(false)} className="flex size-11 items-center justify-center" aria-label="Close menu">
            <X className="size-6" />
          </button>
        </div>
        <nav className="wrap relative flex-1 overflow-y-auto pb-10 pt-6">
          <ul className="border-t border-white/10">
            {[{ href: "/", label: lang === "np" ? "गृहपृष्ठ" : "Home" }, ...links].map((l, i) => (
              <li key={l.href} className="border-b border-white/10">
                <Link
                  href={l.href}
                  className={cn(
                    "flex items-baseline justify-between py-4 font-serif text-[1.75rem] transition-[opacity,transform] duration-500",
                    open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
                    isActive(l.href) && l.href !== "/" ? "text-[#9db8ff]" : "",
                  )}
                  style={{ transitionDelay: open ? `${80 + i * 30}ms` : "0ms" }}
                >
                  {l.label}
                  <span className="font-sans text-xs text-white/40">{String(i + 1).padStart(2, "0")}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Link href="/get-involved" className="btn btn-white">
              {nav.volunteer} <ArrowUpRight className="size-4" />
            </Link>
            <Link href="/contact" className="btn btn-ghost-light">
              {nav.getInTouch}
            </Link>
          </div>
          <div className="mt-8 flex items-center justify-between text-sm text-white/70">
            <LangToggle lang={lang} className="text-white" />
            {phone && <a href={`tel:${phone.replace(/\s/g, "")}`}>{phone}</a>}
          </div>
        </nav>
      </div>
    </>
  );
}
