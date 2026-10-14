import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CAMPAIGN_PAGES } from "@/lib/features";
import { GrievanceForm, GrievanceTracker } from "@/components/site/Forms";
import { PageHero } from "@/components/site/Section";
import { t } from "@/lib/i18n";
import { getLang } from "@/lib/lang";

export async function generateMetadata(): Promise<Metadata> {
  if (!CAMPAIGN_PAGES) return {};
  const lang = await getLang();
  return { title: t(lang).grievance.title };
}

export default async function GrievancePage() {
  if (!CAMPAIGN_PAGES) notFound();
  const lang = await getLang();
  const d = t(lang);
  return (
    <>
      <PageHero kicker={d.grievance.kicker} title={d.grievance.title} lead={d.grievance.lead} />
      <section className="wrap grid gap-14 py-14 md:py-20 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <h2 className="display text-3xl">{d.grievance.file}</h2>
          <div className="mt-8 border border-line p-6 md:p-10">
            <GrievanceForm d={d} />
          </div>
        </div>
        <aside id="track" className="scroll-mt-28 lg:col-span-4 lg:col-start-9">
          <div className="sticky top-28 bg-paper p-6 md:p-8">
            <h2 className="display text-3xl">{d.grievance.track}</h2>
            <p className="mt-3 text-muted">{d.grievance.trackLead}</p>
            <div className="mt-6">
              <GrievanceTracker d={d} lang={lang} />
            </div>
          </div>
        </aside>
      </section>
    </>
  );
}
