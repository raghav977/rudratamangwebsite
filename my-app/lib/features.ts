import type { Item } from "./types";

/**
 * Election-campaign pages and sections (Vision, Transparency, Urlabari wards,
 * Grievances) only show while Dashboard → Settings → Campaign → "Campaign mode"
 * is ticked. Otherwise the site presents Rudra Tamang as a social activist.
 */
export const campaignOn = (site: Item | null | undefined) => Boolean(site?.campaign_mode);
