import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { VolunteerForm } from "@/components/site/Forms";
import { PageHero } from "@/components/site/Section";
import { t } from "@/lib/i18n";
import { getLang } from "@/lib/lang";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return { title: t(lang).volunteer.title };
}

export default async function GetInvolvedPage() {
  const lang = await getLang();
  const d = t(lang);
  return (
    <>
      <PageHero kicker={d.volunteer.kicker} title={d.volunteer.title} lead={d.volunteer.lead} />
      <section className="wrap grid gap-14 py-14 md:py-20 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="border border-line p-6 md:p-10">
            <VolunteerForm d={d} />
          </div>
        </div>
        <aside className="space-y-5 lg:col-span-4 lg:col-start-9">
          {[
            { href: "/work", title: d.nav.work, text: d.work.lead },
            { href: "/events", title: d.nav.events, text: d.events.title },
            { href: "/contact", title: d.nav.contact, text: d.contact.lead },
          ].map((c) => (
            <Link key={c.href} href={c.href} className="group block border border-line p-6 transition-colors hover:border-blue">
              <p className="flex items-center justify-between font-serif text-2xl">
                {c.title} <ArrowRight className="size-5 text-blue transition-transform group-hover:translate-x-1" />
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{c.text}</p>
            </Link>
          ))}
        </aside>
      </section>
    </>
  );
}
