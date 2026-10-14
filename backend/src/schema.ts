/**
 * Single source of truth for every piece of content on the site.
 *
 * Each collection here becomes a SQL table, a set of public + admin API
 * routes, and a form in the dashboard (the dashboard reads this schema from
 * GET /api/admin/schema). Add a field here and it shows up everywhere.
 */

export type FieldType =
  | "text"
  | "textarea"
  | "richtext"
  | "number"
  | "date"
  | "datetime"
  | "select"
  | "boolean"
  | "image"
  | "file"
  | "gallery"
  | "url"
  | "email"
  | "list"
  | "stats";

export interface Field {
  name: string;
  label: string;
  type: FieldType;
  /** Stored twice: `name` (English) and `name_np` (Nepali). */
  localized?: boolean;
  required?: boolean;
  options?: string[];
  help?: string;
  /** Show as a column in the dashboard table. */
  column?: boolean;
  /** For settings: which tab of the settings form the field sits in. */
  group?: string;
  /** Hide from public API responses (inbox notes, contact details). */
  private?: boolean;
  /** Admin form width: half fields sit side by side. */
  half?: boolean;
}

export interface Collection {
  key: string;
  label: string;
  singular: string;
  description: string;
  /** content = managed in dashboard and public; inbox = submitted by visitors. */
  kind: "content" | "inbox";
  icon: string;
  fields: Field[];
  /** Field used to build the URL slug. */
  slugFrom?: string;
  /** Default order for lists. */
  orderBy: string;
  /** Field shown as the row title in the dashboard. */
  titleField: string;
  /** Left out of the dashboard menu (data and API stay as they are). */
  hidden?: boolean;
}

/**
 * Election-campaign sections. They only appear — on the site and in the
 * dashboard menu — while Settings → Campaign → "Campaign mode" is turned on.
 * Their data is kept either way.
 */
export const CAMPAIGN_COLLECTIONS = new Set(["ideas", "documents", "wards", "grievances"]);

const DOCUMENT_CATEGORIES = [
  "Asset declaration",
  "Budget & expenditure",
  "Audit report",
  "Project report",
  "Policy & plan",
  "Meeting minutes",
  "Campaign finance",
  "Public notice",
  "Other",
];

export const collections: Collection[] = [
  {
    key: "achievements",
    label: "My work",
    singular: "Work item",
    description: "Community programmes, relief work, campaigns and other initiatives.",
    kind: "content",
    icon: "award",
    orderBy: "featured DESC, year DESC, sort_order ASC, id DESC",
    titleField: "title",
    slugFrom: "title",
    fields: [
      { name: "title", label: "Title", type: "text", localized: true, required: true, column: true },
      {
        name: "category",
        label: "Category",
        type: "select",
        options: ["Infrastructure", "Education", "Health", "Agriculture", "Social welfare", "Environment", "Governance", "Youth & sports", "Women & inclusion"],
        column: true,
        half: true,
      },
      { name: "year", label: "Year (B.S. or A.D.)", type: "text", column: true, half: true, help: "e.g. 2081" },
      { name: "metric", label: "Headline figure", type: "text", half: true, help: "e.g. 18 km, 1,200 families, Rs 4.2 crore" },
      { name: "metric_label", label: "Figure caption", type: "text", localized: true, half: true, help: "e.g. of road blacktopped" },
      { name: "ward", label: "Ward / location", type: "text", localized: true, half: true },
      { name: "status", label: "Status", type: "select", options: ["Completed", "Ongoing", "Planned"], half: true, column: true },
      { name: "summary", label: "Short summary", type: "textarea", localized: true },
      { name: "body", label: "Full story", type: "richtext", localized: true },
      { name: "image", label: "Cover photo", type: "image" },
      { name: "gallery", label: "More photos", type: "gallery" },
      { name: "document", label: "Supporting document (PDF)", type: "file", help: "Completion report, bill of quantities, etc." },
      { name: "featured", label: "Feature on home page", type: "boolean", column: true },
    ],
  },
  {
    key: "ideas",
    label: "Vision & Ideas",
    singular: "Idea",
    description: "The agenda: pillars of the plan, with concrete commitments.",
    kind: "content",
    icon: "lightbulb",
    orderBy: "sort_order ASC, id ASC",
    titleField: "title",
    slugFrom: "title",
    fields: [
      { name: "title", label: "Title", type: "text", localized: true, required: true, column: true },
      { name: "kicker", label: "Theme (one or two words)", type: "text", localized: true, column: true, help: "e.g. Agriculture, Jobs" },
      { name: "summary", label: "Summary", type: "textarea", localized: true },
      { name: "points", label: "Commitments (one per line)", type: "list", localized: true },
      { name: "body", label: "Detailed write-up", type: "richtext", localized: true },
      { name: "image", label: "Image", type: "image" },
    ],
  },
  {
    key: "posts",
    label: "News & Press",
    singular: "Post",
    description: "News, press releases, articles and speeches.",
    kind: "content",
    icon: "newspaper",
    orderBy: "published_at DESC, id DESC",
    titleField: "title",
    slugFrom: "title",
    fields: [
      { name: "title", label: "Headline", type: "text", localized: true, required: true, column: true },
      { name: "type", label: "Type", type: "select", options: ["News", "Press release", "Article", "Speech", "Interview"], column: true, half: true },
      { name: "published_at", label: "Date", type: "date", column: true, half: true },
      { name: "excerpt", label: "Excerpt", type: "textarea", localized: true },
      { name: "body", label: "Body", type: "richtext", localized: true },
      { name: "cover", label: "Cover image", type: "image" },
      { name: "source_name", label: "Source / publication", type: "text", half: true, help: "If covered by media, e.g. Kantipur" },
      { name: "source_url", label: "Source link", type: "url", half: true },
      { name: "attachment", label: "Attachment (press release PDF)", type: "file" },
      { name: "featured", label: "Feature on home page", type: "boolean", column: true },
    ],
  },
  {
    key: "albums",
    label: "Photo Gallery",
    singular: "Album",
    description: "Photo albums from programmes, visits and events.",
    kind: "content",
    icon: "images",
    orderBy: "date DESC, sort_order ASC, id DESC",
    titleField: "title",
    slugFrom: "title",
    fields: [
      { name: "title", label: "Album title", type: "text", localized: true, required: true, column: true },
      { name: "date", label: "Date", type: "date", column: true, half: true },
      { name: "location", label: "Location", type: "text", localized: true, half: true },
      { name: "description", label: "Description", type: "textarea", localized: true },
      { name: "cover", label: "Cover photo", type: "image", help: "Leave empty to use the first photo." },
      { name: "photos", label: "Photos", type: "gallery" },
    ],
  },
  {
    key: "documents",
    label: "Transparency Documents",
    singular: "Document",
    description: "Asset declarations, budgets, audits, reports — public records.",
    kind: "content",
    icon: "file-text",
    orderBy: "published_at DESC, id DESC",
    titleField: "title",
    fields: [
      { name: "title", label: "Document title", type: "text", localized: true, required: true, column: true },
      { name: "category", label: "Category", type: "select", options: DOCUMENT_CATEGORIES, required: true, column: true, half: true },
      { name: "fiscal_year", label: "Fiscal year", type: "text", column: true, half: true, help: "e.g. 2081/82" },
      { name: "published_at", label: "Published on", type: "date", column: true, half: true },
      { name: "reference", label: "Reference no.", type: "text", half: true },
      { name: "description", label: "Description", type: "textarea", localized: true },
      { name: "file", label: "File", type: "file", required: true },
    ],
  },
  {
    key: "events",
    label: "Events",
    singular: "Event",
    description: "Upcoming and past programmes, rallies and public hearings.",
    kind: "content",
    icon: "calendar",
    orderBy: "starts_at DESC, id DESC",
    titleField: "title",
    slugFrom: "title",
    fields: [
      { name: "title", label: "Event title", type: "text", localized: true, required: true, column: true },
      { name: "starts_at", label: "Starts", type: "datetime", required: true, column: true, half: true },
      { name: "ends_at", label: "Ends", type: "datetime", half: true },
      { name: "location", label: "Venue", type: "text", localized: true, column: true },
      { name: "description", label: "Description", type: "richtext", localized: true },
      { name: "image", label: "Poster / image", type: "image" },
      { name: "map_url", label: "Google Maps link", type: "url", half: true },
      { name: "register_url", label: "Registration link", type: "url", half: true },
    ],
  },
  {
    key: "videos",
    label: "Videos",
    singular: "Video",
    description: "Speeches, interviews and reports from YouTube or Facebook.",
    kind: "content",
    icon: "video",
    orderBy: "date DESC, id DESC",
    titleField: "title",
    fields: [
      { name: "title", label: "Title", type: "text", localized: true, required: true, column: true },
      { name: "url", label: "Video link", type: "url", required: true, help: "YouTube, Facebook or TikTok link. YouTube videos play on the site; others open in a new tab." },
      {
        name: "thumbnail",
        label: "Thumbnail image",
        type: "image",
        help: "Cover picture shown for Facebook and TikTok videos. Not needed for YouTube."
      },
      { name: "date", label: "Date", type: "date", column: true },
      { name: "description", label: "Description", type: "textarea", localized: true },
    ],
  },
  {
    key: "timeline",
    label: "Life & Journey",
    singular: "Milestone",
    description: "Milestones on the biography page, from early life to today.",
    kind: "content",
    icon: "milestone",
    orderBy: "sort_order ASC, id ASC",
    titleField: "title",
    fields: [
      { name: "year", label: "Year", type: "text", required: true, column: true, half: true },
      { name: "title", label: "Title", type: "text", localized: true, required: true, column: true },
      { name: "description", label: "Description", type: "textarea", localized: true },
      { name: "image", label: "Photo", type: "image" },
    ],
  },
  {
    key: "testimonials",
    label: "Voices",
    singular: "Testimonial",
    description: "What residents, colleagues and community leaders say.",
    kind: "content",
    icon: "quote",
    orderBy: "sort_order ASC, id DESC",
    titleField: "name",
    fields: [
      { name: "name", label: "Name", type: "text", required: true, column: true, half: true },
      { name: "role", label: "Role / place", type: "text", localized: true, column: true, half: true },
      { name: "quote", label: "Quote", type: "textarea", localized: true, required: true },
      { name: "photo", label: "Photo", type: "image" },
    ],
  },
  {
    key: "wards",
    label: "Wards",
    singular: "Ward",
    description: "Ward-by-ward profile shown on the constituency page.",
    kind: "content",
    icon: "map",
    orderBy: "number ASC",
    titleField: "name",
    fields: [
      { name: "number", label: "Ward no.", type: "number", required: true, column: true, half: true },
      { name: "name", label: "Area / former VDC", type: "text", localized: true, column: true, half: true },
      { name: "population", label: "Population", type: "number", column: true, half: true },
      { name: "households", label: "Households", type: "number", half: true },
      { name: "area_km2", label: "Area (km²)", type: "number", half: true },
      { name: "chair", label: "Ward chair", type: "text", localized: true, half: true },
      { name: "priorities", label: "Key priorities (one per line)", type: "list", localized: true },
      { name: "note", label: "Note", type: "textarea", localized: true },
    ],
  },
  // ---- Inbox: written by visitors, read and actioned in the dashboard ----
  {
    key: "grievances",
    label: "Grievances",
    singular: "Grievance",
    description: "Complaints and requests from citizens, with a public tracking code.",
    kind: "inbox",
    icon: "megaphone",
    orderBy: "id DESC",
    titleField: "subject",
    fields: [
      { name: "code", label: "Tracking code", type: "text", column: true, half: true },
      { name: "status", label: "Status", type: "select", options: ["Received", "In review", "In progress", "Resolved", "Closed"], column: true, half: true },
      { name: "subject", label: "Subject", type: "text", column: true },
      { name: "category", label: "Category", type: "select", options: ["Road & transport", "Water & sanitation", "Electricity", "Health", "Education", "Agriculture", "Social security", "Corruption", "Other"], column: true, half: true },
      { name: "ward", label: "Ward", type: "text", half: true },
      { name: "name", label: "Name", type: "text", private: true, half: true },
      { name: "phone", label: "Phone", type: "text", private: true, half: true },
      { name: "email", label: "Email", type: "email", private: true },
      { name: "message", label: "Details", type: "textarea", private: true },
      { name: "attachment", label: "Attachment", type: "file", private: true },
      { name: "response", label: "Public response", type: "textarea", help: "Shown to the citizen when they track this code." },
      { name: "internal_note", label: "Internal note", type: "textarea", private: true, help: "Never shown publicly." },
    ],
  },
  {
    key: "messages",
    label: "Messages",
    singular: "Message",
    description: "Contact-form messages.",
    kind: "inbox",
    icon: "mail",
    orderBy: "id DESC",
    titleField: "subject",
    fields: [
      { name: "status", label: "Status", type: "select", options: ["New", "Read", "Replied", "Archived"], column: true, half: true },
      { name: "name", label: "Name", type: "text", column: true, half: true },
      { name: "email", label: "Email", type: "email", half: true },
      { name: "phone", label: "Phone", type: "text", half: true },
      { name: "subject", label: "Subject", type: "text", column: true },
      { name: "message", label: "Message", type: "textarea" },
      { name: "internal_note", label: "Internal note", type: "textarea" },
    ],
  },
  {
    key: "volunteers",
    label: "Volunteers",
    singular: "Volunteer",
    description: "People who signed up to help.",
    kind: "inbox",
    icon: "users",
    orderBy: "id DESC",
    titleField: "name",
    fields: [
      { name: "status", label: "Status", type: "select", options: ["New", "Contacted", "Active", "Inactive"], column: true, half: true },
      { name: "name", label: "Name", type: "text", column: true, half: true },
      { name: "phone", label: "Phone", type: "text", column: true, half: true },
      { name: "email", label: "Email", type: "email", half: true },
      { name: "ward", label: "Ward", type: "text", column: true, half: true },
      { name: "interests", label: "Wants to help with", type: "text", half: true },
      { name: "message", label: "Message", type: "textarea" },
      { name: "internal_note", label: "Internal note", type: "textarea" },
    ],
  },
];

/** Site-wide settings, edited on the dashboard's Settings page. */
export const settingsFields: Field[] = [
  // Identity
  { name: "name", label: "Full name", type: "text", localized: true, required: true, group: "Identity" },
  { name: "position", label: "Position / title", type: "text", localized: true, group: "Identity", help: "Shown under the name, e.g. Social activist / समाजसेवी" },
  { name: "constituency", label: "Place", type: "text", localized: true, group: "Identity", half: true, help: "Shown in the top bar, e.g. Urlabari, Morang" },
  { name: "logo", label: "Logo / emblem (optional)", type: "image", group: "Identity", half: true },
  { name: "signature", label: "Signature image (transparent PNG)", type: "image", group: "Identity", half: true },

  // Home page
  { name: "hero_kicker", label: "Hero small heading", type: "text", localized: true, group: "Home page" },
  { name: "hero_title", label: "Hero headline", type: "textarea", localized: true, group: "Home page", help: "Wrap words in *asterisks* to set them in italic blue." },
  { name: "hero_text", label: "Hero paragraph", type: "textarea", localized: true, group: "Home page" },
  { name: "hero_image", label: "Hero portrait", type: "image", group: "Home page", help: "Tall portrait, at least 1200px high. A clean background works best." },
  { name: "stats", label: "Numbers strip", type: "stats", group: "Home page", help: "Four short facts shown under the hero." },
  { name: "message_title", label: "Personal message heading", type: "text", localized: true, group: "Home page" },
  { name: "message_body", label: "Personal message", type: "richtext", localized: true, group: "Home page" },
  { name: "message_image", label: "Photo beside the message", type: "image", group: "Home page" },
  { name: "cta_title", label: "Closing call-to-action heading", type: "text", localized: true, group: "Home page" },
  { name: "cta_text", label: "Closing call-to-action text", type: "textarea", localized: true, group: "Home page" },

  // About
  { name: "about_intro", label: "About page lead", type: "textarea", localized: true, group: "About" },
  { name: "about_body", label: "Biography", type: "richtext", localized: true, group: "About" },
  { name: "about_image", label: "About page photo", type: "image", group: "About" },
  { name: "born", label: "Born", type: "text", localized: true, group: "About", half: true },
  { name: "hometown", label: "Hometown", type: "text", localized: true, group: "About", half: true },
  { name: "education", label: "Education", type: "text", localized: true, group: "About", half: true },
  { name: "family", label: "Family", type: "text", localized: true, group: "About", half: true },

  // Contact
  { name: "email", label: "Public email", type: "email", group: "Contact", half: true },
  { name: "phone", label: "Public phone", type: "text", group: "Contact", half: true },
  { name: "address", label: "Office address", type: "text", localized: true, group: "Contact" },
  { name: "office_hours", label: "Office hours", type: "text", localized: true, group: "Contact" },
  { name: "map_embed", label: "Google Maps embed URL", type: "url", group: "Contact", help: "Google Maps → Share → Embed a map → copy only the src=\"…\" link." },

  // Social
  { name: "facebook", label: "Facebook", type: "url", group: "Social", half: true },
  { name: "youtube", label: "YouTube", type: "url", group: "Social", half: true },
  { name: "instagram", label: "Instagram", type: "url", group: "Social", half: true },
  { name: "x", label: "X (Twitter)", type: "url", group: "Social", half: true },
  { name: "tiktok", label: "TikTok", type: "url", group: "Social", half: true },

  // SEO
  { name: "seo_description", label: "Search description", type: "textarea", localized: true, group: "SEO" },
  { name: "og_image", label: "Share image (1200×630)", type: "image", group: "SEO" },

  // Campaign: everything below is only used while campaign mode is on.
  {
    name: "campaign_mode",
    label: "Campaign mode",
    type: "boolean",
    group: "Campaign",
    help: "Turn on to show the election pages (Vision, Transparency, Urlabari wards, Grievances) on the site and in this dashboard menu. Turn off to present him as a social activist only. Nothing is deleted either way.",
  },
  { name: "party", label: "Party", type: "text", localized: true, group: "Campaign", half: true },
  { name: "manifesto_pdf", label: "Full manifesto (PDF)", type: "file", group: "Campaign" },
  { name: "transparency_intro", label: "Transparency page introduction", type: "textarea", localized: true, group: "Campaign" },
  { name: "transparency_pledge", label: "Transparency pledge (one per line)", type: "list", localized: true, group: "Campaign" },
];

export const collectionMap = new Map(collections.map((c) => [c.key, c]));

/** Physical column names for a field (localized fields have two). */
export function columnsFor(field: Field): string[] {
  return field.localized ? [field.name, `${field.name}_np`] : [field.name];
}
