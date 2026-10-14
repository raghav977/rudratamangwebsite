import NepaliDate from "nepali-date-converter";
import type { Item, Lang } from "./types";

/** Read a localized field, falling back to English when Nepali is empty. */
export function pick(item: Item | null | undefined, field: string, lang: Lang): string {
  if (!item) return "";
  const np = item[`${field}_np`];
  const en = item[field];
  if (lang === "np" && typeof np === "string" && np.trim()) return np;
  if (typeof en === "string") return en;
  return typeof np === "string" ? np : "";
}

export function pickList(item: Item | null | undefined, field: string, lang: Lang): string[] {
  if (!item) return [];
  const np = item[`${field}_np`];
  const en = item[field];
  if (lang === "np" && Array.isArray(np) && np.length) return np as string[];
  return Array.isArray(en) ? (en as string[]) : [];
}

const NP_DIGITS = "०१२३४५६७८९";
export const npDigits = (s: string | number) => String(s).replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
export const num = (s: string | number | null | undefined, lang: Lang) =>
  s === null || s === undefined ? "" : lang === "np" ? npDigits(s) : String(s);

/** Bikram Sambat month names as people say them. */
export const BS_MONTHS = ["बैशाख", "जेठ", "असार", "साउन", "भदौ", "असोज", "कात्तिक", "मंसिर", "पुस", "माघ", "फागुन", "चैत"];
const BS_MONTHS_EN = ["Baishakh", "Jestha", "Asar", "Shrawan", "Bhadra", "Asoj", "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"];

function toDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value) return null;
  const d = new Date(value.length === 10 ? `${value}T00:00` : value.replace(" ", "T"));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Converts a Gregorian date to Bikram Sambat. Null outside the supported range. */
export function toBS(date: Date): { year: number; month: number; day: number } | null {
  try {
    const n = new NepaliDate(date);
    return { year: n.getYear(), month: n.getMonth(), day: n.getDate() };
  } catch {
    return null;
  }
}

export function bsString(value: unknown, script: "np" | "en" = "np"): string {
  const d = value instanceof Date ? value : toDate(value);
  const bs = d && toBS(d);
  if (!bs) return "";
  return script === "np"
    ? `${npDigits(bs.year)} ${BS_MONTHS[bs.month]} ${npDigits(bs.day)}`
    : `${bs.day} ${BS_MONTHS_EN[bs.month]} ${bs.year} B.S.`;
}

function npTime(d: Date) {
  const h = d.getHours();
  const period = h < 12 ? "बिहान" : h < 17 ? "दिउँसो" : "बेलुका";
  const h12 = h % 12 || 12;
  return `${period} ${npDigits(h12)}:${npDigits(String(d.getMinutes()).padStart(2, "0"))} बजे`;
}

const NP_WEEKDAYS = ["आइतबार", "सोमबार", "मंगलबार", "बुधबार", "बिहीबार", "शुक्रबार", "शनिबार"];

/** Today's date in Nepal time, e.g. "आइतबार, २०८३ असोज १८". */
export function todayLine(lang: Lang): string {
  const now = new Date(Date.now() + (345 + new Date().getTimezoneOffset()) * 60 * 1000);
  if (lang === "np") return `${NP_WEEKDAYS[now.getDay()]}, ${bsString(now)}`;
  const ad = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return `${ad} · ${bsString(now, "en")}`;
}

/** Nepali shows Bikram Sambat; English shows the Gregorian date. */
export function formatDate(value: unknown, lang: Lang, opts: { withTime?: boolean; short?: boolean } = {}): string {
  const d = toDate(value);
  if (!d) return typeof value === "string" ? value : "";
  if (lang === "np") {
    const base = bsString(d) || d.toLocaleDateString("en-GB");
    return opts.withTime ? `${base}, ${npTime(d)}` : base;
  }
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: opts.short ? "short" : "long",
    year: "numeric",
    ...(opts.withTime ? { hour: "numeric", minute: "2-digit", hour12: true } : {}),
  });
}

/** Day + short month for date tiles (BS in Nepali). */
export function dateParts(value: unknown, lang: Lang): { day: string; month: string; time: string } {
  const d = toDate(value);
  if (!d) return { day: "", month: "", time: "" };
  if (lang === "np") {
    const bs = toBS(d);
    return bs ? { day: npDigits(bs.day), month: BS_MONTHS[bs.month], time: npTime(d) } : { day: "", month: "", time: "" };
  }
  return {
    day: String(d.getDate()),
    month: d.toLocaleString("en-GB", { month: "short" }),
    time: d.toLocaleString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true }),
  };
}

export const dict = {
  en: {
    nav: {
      about: "About",
      vision: "Vision",
      work: "Work",
      transparency: "Transparency",
      news: "News",
      gallery: "Gallery",
      events: "Events",
      urlabari: "Urlabari",
      contact: "Contact",
      grievance: "File a grievance",
      volunteer: "Join the work",
      getInTouch: "Get in touch",
    },
    common: {
      readMore: "Read more",
      viewAll: "View all",
      download: "Download",
      view: "View",
      back: "Back",
      share: "Share",
      photos: "photos",
      noItems: "Nothing here yet.",
      search: "Search",
      all: "All",
      ward: "Ward",
      wards: "Wards",
      status: "Status",
      category: "Category",
      year: "Year",
      published: "Published",
      skip: "Skip to content",
      menu: "Menu",
      close: "Close",
      language: "नेपाली",
      submit: "Submit",
      sending: "Sending…",
      required: "required",
      optional: "optional",
    },
    home: {
      readVision: "Read the vision",
      aboutMe: "About me",
      seeRecord: "See my work",
      messageKicker: "A personal note",
      visionKicker: "The agenda",
      visionTitle: "Six commitments for Urlabari",
      visionLead: "Each one has a budget line, a ward and a deadline. Track them as they happen.",
      workKicker: "Social work",
      workTitle: "Work in the community",
      transparencyKicker: "Open books",
      transparencyTitle: "Every document, public by default",
      latestDocs: "Latest documents",
      allDocs: "Open the document library",
      newsKicker: "Latest",
      newsTitle: "News & activities",
      eventsKicker: "Diary",
      eventsTitle: "Upcoming",
      galleryKicker: "In the community",
      galleryTitle: "Gallery",
      voicesKicker: "What people say",
      joinTitle: "Let's work together",
      joinText: "Programmes, relief work, awareness campaigns — there's always more to do. Lend a hand, share an idea, or just say hello.",
      grievanceTitle: "Have a problem? Put it on record.",
      grievanceText: "File a grievance online and get a tracking code. Every case is logged, answered and visible to you until it's resolved.",
      grievanceCta: "File a grievance",
      trackCta: "Track a code",
      volunteer: "Join the work",
      contact: "Get in touch",
    },
    about: {
      kicker: "About",
      born: "Born",
      hometown: "Hometown",
      education: "Education",
      family: "Family",
      journey: "Life & journey",
      moreTitle: "See what I've been working on",
      manifesto: "Download the full manifesto",
    },
    work: {
      kicker: "Social work",
      title: "My work",
      lead: "Community programmes, campaigns and initiatives — with photos and details of each.",
      completed: "Completed",
      ongoing: "Ongoing",
      planned: "Planned",
      supporting: "Supporting document",
      morePhotos: "Photos",
      related: "More work",
    },
    vision: {
      kicker: "Vision",
      title: "A plan for Urlabari",
      lead: "Not slogans — commitments. Each pillar below is something you can hold us to.",
      commitments: "Commitments",
    },
    transparency: {
      kicker: "Transparency",
      title: "Public money, public records",
      pledge: "Our transparency pledge",
      library: "Document library",
      searchPlaceholder: "Search documents…",
      fiscalYear: "Fiscal year",
      results: "documents",
      none: "No documents match these filters.",
      preview: "Preview",
      size: "Size",
    },
    news: { kicker: "Newsroom", title: "News & press", lead: "Updates, press releases and articles.", source: "Source", attachment: "Attachment" },
    gallery: { kicker: "Gallery", title: "Photos & videos", albums: "Albums", videos: "Videos", empty: "Albums will appear here soon." },
    events: { kicker: "Events", title: "Events & programmes", upcoming: "Upcoming", past: "Past", none: "No upcoming events right now.", map: "Map", register: "Register" },
    urlabari: {
      kicker: "The constituency",
      title: "Urlabari, ward by ward",
      lead: "Nine wards, 74.6 km² and 70,908 people at the 2078 census. These are the places this plan is for.",
      population: "Population",
      households: "Households",
      area: "Area",
      chair: "Ward chair",
      source: "Source: National Population and Housing Census 2078 (2021); Election Commission.",
    },
    contact: {
      kicker: "Contact",
      title: "Get in touch",
      lead: "Write, call or drop by. Every message is read.",
      office: "Office",
      hours: "Office hours",
      phone: "Phone",
      email: "Email",
      name: "Your name",
      subject: "Subject",
      message: "Message",
      send: "Send message",
      sent: "Thank you. Your message has been received — we'll reply soon.",
    },
    volunteer: {
      kicker: "Get involved",
      title: "Join the work",
      lead: "Community programmes, relief work, awareness campaigns or a few hours at an event — there's room for everyone.",
      interests: "How would you like to help?",
      areas: ["Community programmes", "Relief & social work", "Events", "Social media", "Youth & education", "Environment"],
      send: "Count me in",
      sent: "Thank you for joining. We'll give you a call within a few days.",
    },
    grievance: {
      kicker: "Grievance desk",
      title: "Raise an issue",
      lead: "Roads, water, services, corruption — tell us. You'll get a code to track progress.",
      file: "File a grievance",
      track: "Track your grievance",
      trackLead: "Enter the code you received when you filed.",
      code: "Tracking code",
      check: "Check status",
      subject: "Subject",
      details: "Describe the issue",
      attachment: "Photo or document",
      attachmentHelp: "Image or PDF, up to 8 MB",
      sent: "Your grievance has been recorded.",
      keepCode: "Keep this code to check progress:",
      filed: "Filed",
      updated: "Last updated",
      response: "Response",
      categories: ["Road & transport", "Water & sanitation", "Electricity", "Health", "Education", "Agriculture", "Social security", "Corruption", "Other"],
      statuses: { Received: "Received", "In review": "In review", "In progress": "In progress", Resolved: "Resolved", Closed: "Closed" } as Record<string, string>,
    },
    footer: {
      tagline: "Working with the people of Urlabari, for the people of Urlabari.",
      explore: "Explore",
      participate: "Participate",
      follow: "Follow",
      rights: "All rights reserved.",
      admin: "Team login",
    },
  },
  np: {
    nav: {
      about: "परिचय",
      vision: "दृष्टिकोण",
      work: "काम",
      transparency: "पारदर्शिता",
      news: "समाचार",
      gallery: "ग्यालरी",
      events: "कार्यक्रम",
      urlabari: "उर्लाबारी",
      contact: "सम्पर्क",
      grievance: "गुनासो दर्ता",
      volunteer: "सँगै काम गरौं",
      getInTouch: "सम्पर्क गर्नुहोस्",
    },
    common: {
      readMore: "थप पढ्नुहोस्",
      viewAll: "सबै हेर्नुहोस्",
      download: "डाउनलोड",
      view: "हेर्नुहोस्",
      back: "फर्कनुहोस्",
      share: "सेयर",
      photos: "तस्बिर",
      noItems: "अहिलेसम्म केही छैन।",
      search: "खोज्नुहोस्",
      all: "सबै",
      ward: "वडा",
      wards: "वडाहरू",
      status: "स्थिति",
      category: "वर्ग",
      year: "वर्ष",
      published: "प्रकाशित",
      skip: "सामग्रीमा जानुहोस्",
      menu: "मेनु",
      close: "बन्द",
      language: "English",
      submit: "पठाउनुहोस्",
      sending: "पठाउँदै…",
      required: "अनिवार्य",
      optional: "ऐच्छिक",
    },
    home: {
      readVision: "दृष्टिकोण पढ्नुहोस्",
      aboutMe: "मेरो बारेमा",
      seeRecord: "मेरा काम हेर्नुहोस्",
      messageKicker: "व्यक्तिगत सन्देश",
      visionKicker: "एजेन्डा",
      visionTitle: "उर्लाबारीका लागि छ प्रतिबद्धता",
      visionLead: "हरेकको बजेट शीर्षक, वडा र समयसीमा छ। काम हुँदै गर्दा ट्र्याक गर्नुहोस्।",
      workKicker: "सामाजिक काम",
      workTitle: "समुदायमा गरेका काम",
      transparencyKicker: "खुला किताब",
      transparencyTitle: "हरेक कागजात, स्वतः सार्वजनिक",
      latestDocs: "पछिल्ला कागजात",
      allDocs: "कागजात संग्रह खोल्नुहोस्",
      newsKicker: "पछिल्लो",
      newsTitle: "समाचार तथा गतिविधि",
      eventsKicker: "डायरी",
      eventsTitle: "आगामी कार्यक्रम",
      galleryKicker: "समुदायमा",
      galleryTitle: "ग्यालरी",
      voicesKicker: "मानिसहरूको भनाइ",
      joinTitle: "सँगै काम गरौं",
      joinText: "कार्यक्रम, राहत, जनचेतना अभियान — गर्नुपर्ने काम सधैं बाँकी छ। हात दिनुहोस्, सुझाव दिनुहोस्, वा नमस्कार मात्र भन्नुहोस्।",
      grievanceTitle: "समस्या छ? अभिलेखमा राख्नुहोस्।",
      grievanceText: "अनलाइन गुनासो दर्ता गर्नुहोस् र ट्र्याकिङ कोड पाउनुहोस्। हरेक गुनासो दर्ता, जवाफ र समाधान नहुन्जेल तपाईंले देख्न सक्नुहुन्छ।",
      grievanceCta: "गुनासो दर्ता गर्नुहोस्",
      trackCta: "कोड ट्र्याक गर्नुहोस्",
      volunteer: "सँगै काम गरौं",
      contact: "सम्पर्क गर्नुहोस्",
    },
    about: {
      kicker: "परिचय",
      born: "जन्म",
      hometown: "गृहनगर",
      education: "शिक्षा",
      family: "परिवार",
      journey: "जीवन यात्रा",
      moreTitle: "मैले गरिरहेका कामहरू हेर्नुहोस्",
      manifesto: "पूर्ण घोषणापत्र डाउनलोड गर्नुहोस्",
    },
    work: {
      kicker: "सामाजिक काम",
      title: "मेरा कामहरू",
      lead: "सामुदायिक कार्यक्रम, अभियान र पहलहरू — हरेकको तस्बिर र विवरणसहित।",
      completed: "सम्पन्न",
      ongoing: "जारी",
      planned: "योजनामा",
      supporting: "प्रमाण कागजात",
      morePhotos: "तस्बिरहरू",
      related: "थप काम",
    },
    vision: {
      kicker: "दृष्टिकोण",
      title: "उर्लाबारीका लागि योजना",
      lead: "नारा होइन — प्रतिबद्धता। तलका हरेक स्तम्भमा तपाईं हामीलाई जवाफदेही बनाउन सक्नुहुन्छ।",
      commitments: "प्रतिबद्धताहरू",
    },
    transparency: {
      kicker: "पारदर्शिता",
      title: "सार्वजनिक पैसा, सार्वजनिक अभिलेख",
      pledge: "हाम्रो पारदर्शिता प्रतिज्ञा",
      library: "कागजात संग्रह",
      searchPlaceholder: "कागजात खोज्नुहोस्…",
      fiscalYear: "आर्थिक वर्ष",
      results: "कागजात",
      none: "यी फिल्टरसँग मिल्ने कागजात छैन।",
      preview: "पूर्वावलोकन",
      size: "साइज",
    },
    news: { kicker: "समाचार कक्ष", title: "समाचार तथा प्रेस", lead: "अपडेट, प्रेस विज्ञप्ति र लेखहरू।", source: "स्रोत", attachment: "संलग्न फाइल" },
    gallery: { kicker: "ग्यालरी", title: "तस्बिर तथा भिडियो", albums: "एल्बम", videos: "भिडियो", empty: "एल्बमहरू छिट्टै यहाँ देखिनेछन्।" },
    events: { kicker: "कार्यक्रम", title: "कार्यक्रमहरू", upcoming: "आगामी", past: "विगत", none: "अहिले कुनै आगामी कार्यक्रम छैन।", map: "नक्सा", register: "दर्ता" },
    urlabari: {
      kicker: "निर्वाचन क्षेत्र",
      title: "उर्लाबारी, वडागत रूपमा",
      lead: "नौ वडा, ७४.६ वर्ग किमी र २०७८ को जनगणनामा ७०,९०८ जनसंख्या। यो योजना यिनै ठाउँका लागि हो।",
      population: "जनसंख्या",
      households: "घरधुरी",
      area: "क्षेत्रफल",
      chair: "वडाध्यक्ष",
      source: "स्रोत: राष्ट्रिय जनगणना २०७८; निर्वाचन आयोग।",
    },
    contact: {
      kicker: "सम्पर्क",
      title: "सम्पर्क गर्नुहोस्",
      lead: "लेख्नुहोस्, फोन गर्नुहोस्, वा भेट्न आउनुहोस्। हरेक सन्देश पढिन्छ।",
      office: "कार्यालय",
      hours: "कार्यालय समय",
      phone: "फोन",
      email: "इमेल",
      name: "तपाईंको नाम",
      subject: "विषय",
      message: "सन्देश",
      send: "सन्देश पठाउनुहोस्",
      sent: "धन्यवाद। तपाईंको सन्देश प्राप्त भयो — हामी छिट्टै जवाफ दिनेछौं।",
    },
    volunteer: {
      kicker: "सहभागी हुनुहोस्",
      title: "सँगै काम गरौं",
      lead: "सामुदायिक कार्यक्रम, राहत, जनचेतना अभियान वा कुनै कार्यक्रममा केही घण्टा — सबैका लागि ठाउँ छ।",
      interests: "कसरी सहयोग गर्न चाहनुहुन्छ?",
      areas: ["सामुदायिक कार्यक्रम", "राहत तथा समाजसेवा", "कार्यक्रम", "सामाजिक सञ्जाल", "युवा तथा शिक्षा", "वातावरण"],
      send: "म सहभागी हुन्छु",
      sent: "सहभागी हुनुभएकोमा धन्यवाद। हामी केही दिनभित्र फोन गर्नेछौं।",
    },
    grievance: {
      kicker: "गुनासो डेस्क",
      title: "समस्या उठाउनुहोस्",
      lead: "सडक, पानी, सेवा, भ्रष्टाचार — हामीलाई भन्नुहोस्। प्रगति ट्र्याक गर्न तपाईंले कोड पाउनुहुनेछ।",
      file: "गुनासो दर्ता",
      track: "गुनासो ट्र्याक गर्नुहोस्",
      trackLead: "दर्ता गर्दा पाएको कोड प्रविष्ट गर्नुहोस्।",
      code: "ट्र्याकिङ कोड",
      check: "स्थिति हेर्नुहोस्",
      subject: "विषय",
      details: "समस्याको विवरण",
      attachment: "तस्बिर वा कागजात",
      attachmentHelp: "तस्बिर वा PDF, ८ MB सम्म",
      sent: "तपाईंको गुनासो दर्ता भयो।",
      keepCode: "प्रगति हेर्न यो कोड राख्नुहोस्:",
      filed: "दर्ता मिति",
      updated: "पछिल्लो अपडेट",
      response: "जवाफ",
      categories: ["सडक तथा यातायात", "खानेपानी तथा सरसफाइ", "बिजुली", "स्वास्थ्य", "शिक्षा", "कृषि", "सामाजिक सुरक्षा", "भ्रष्टाचार", "अन्य"],
      statuses: { Received: "प्राप्त", "In review": "अध्ययनमा", "In progress": "कार्यान्वयनमा", Resolved: "समाधान भयो", Closed: "बन्द" } as Record<string, string>,
    },
    footer: {
      tagline: "उर्लाबारीका जनतासँग, उर्लाबारीका जनताका लागि।",
      explore: "हेर्नुहोस्",
      participate: "सहभागिता",
      follow: "फलो गर्नुहोस्",
      rights: "सर्वाधिकार सुरक्षित।",
      admin: "टिम लगइन",
    },
  },
};

export type Dict = (typeof dict)["en"];
export const t = (lang: Lang): Dict => dict[lang] as Dict;

/** Category/status labels stored in English in the DB, shown translated. */
export const categoryNp: Record<string, string> = {
  Infrastructure: "पूर्वाधार",
  Education: "शिक्षा",
  Health: "स्वास्थ्य",
  Agriculture: "कृषि",
  "Social welfare": "समाज कल्याण",
  Environment: "वातावरण",
  Governance: "सुशासन",
  "Youth & sports": "युवा तथा खेलकुद",
  "Women & inclusion": "महिला तथा समावेशीकरण",
  Completed: "सम्पन्न",
  Ongoing: "जारी",
  Planned: "योजनामा",
  "Asset declaration": "सम्पत्ति विवरण",
  "Budget & expenditure": "बजेट तथा खर्च",
  "Audit report": "लेखापरीक्षण प्रतिवेदन",
  "Project report": "आयोजना प्रतिवेदन",
  "Policy & plan": "नीति तथा योजना",
  "Meeting minutes": "बैठक निर्णय",
  "Campaign finance": "अभियान खर्च",
  "Public notice": "सार्वजनिक सूचना",
  Other: "अन्य",
  News: "समाचार",
  "Press release": "प्रेस विज्ञप्ति",
  Article: "लेख",
  Speech: "भाषण",
  Interview: "अन्तर्वार्ता",
};

export const label = (value: unknown, lang: Lang) => {
  const s = typeof value === "string" ? value : "";
  return lang === "np" ? (categoryNp[s] ?? s) : s;
};
