/**
 * Fills an empty database with starter content so the site is presentable on
 * first run. Everything here is meant to be edited or replaced from the
 * dashboard. Ward figures and municipal documents are real (Census 2078,
 * Urlabari Municipality); biography and achievements are placeholders.
 *
 *   pnpm seed            seed only if the database is empty
 *   pnpm seed --force    wipe content tables first (keeps users)
 */
import fs from "node:fs";
import path from "node:path";
import { config } from "./config.js";
import { db, migrate, pool, q } from "./db.js";
import { collectionMap, collections, settingsFields } from "./schema.js";
import { createItem, saveSettings, type Row } from "./lib/content.js";
import { hashPassword } from "./lib/auth.js";

const force = process.argv.includes("--force");
const SOURCES = path.resolve(process.cwd(), "../..");

await migrate();
const hasContent = (await db.get<{ n: number }>(`SELECT COUNT(*) AS n FROM ideas`))!.n > 0;
if (hasContent && !force) {
  console.log("Database already has content. Run with --force to reset it.");
  await pool.end();
  process.exit(0);
}
if (force) {
  for (const c of collections) await db.run(`DELETE FROM ${q(c.key)}`);
  await db.run(`DELETE FROM settings`);
  await db.run(`DELETE FROM activity`);
}

const add = async (key: string, rows: Row[]) => {
  for (const [i, r] of rows.entries()) await createItem(collectionMap.get(key)!, { sort_order: i, ...r });
};

// ---- Admin account ------------------------------------------------------

const adminEmail = "admin@rudratamang.com";
if (!(await db.get(`SELECT id FROM users WHERE email = ?`, [adminEmail]))) {
  await db.run(`INSERT INTO users (name, email, role, password_hash) VALUES (?, ?, 'admin', ?)`, [
    "Site Administrator",
    adminEmail,
    await hashPassword("ChangeMe@2026"),
  ]);
  console.log(`Admin: ${adminEmail} / ChangeMe@2026  ← change this after first login`);
}

// ---- Settings -----------------------------------------------------------

await saveSettings(settingsFields, {
  name: "Rudra Tamang",
  name_np: "रुद्र तामाङ",
  position: "Social Activist",
  position_np: "समाजसेवी",
  constituency: "Urlabari, Morang",
  constituency_np: "उर्लाबारी, मोरङ",
  party: "",
  campaign_mode: false,
  hero_kicker: "Social activist · Urlabari, Morang",
  hero_kicker_np: "समाजसेवी · उर्लाबारी, मोरङ",
  hero_title: "Serving society, *standing with the people*.",
  hero_title_np: "समाजको सेवा, *जनताको साथ*।",
  hero_text: "Community programmes, relief work and everyday help for the people of Urlabari. This site is a record of that work.",
  hero_text_np: "उर्लाबारीका जनताका लागि सामुदायिक कार्यक्रम, राहत र दैनिक सहयोग। यो साइट त्यही कामको अभिलेख हो।",
  // His own figures (years of service, programmes run, people reached…), or leave empty to hide the strip.
  stats: [],
  message_title: "Who is Rudra Tamang?",
  message_title_np: "को हुन् रुद्र तामाङ?",
  message_body: "I am Rudra Tamang, a social activist from Urlabari.\n\nI believe a community moves forward when its people look out for each other — when a family in trouble is not left alone, when young people have something to work towards, and when problems are solved together instead of only complained about.\n\nThat is the work I try to do every day: organising programmes, helping where help is needed and bringing people together. This website is a record of that work — the photos, the news and the people behind it.\n\nIf you would like to join in, or simply want to talk, my door is always open.",
  message_body_np: "म रुद्र तामाङ, उर्लाबारीको एक सामाजिक अभियन्ता।\n\nमानिसहरूले एकअर्काको ख्याल गर्दा समाज अघि बढ्छ भन्ने मेरो विश्वास छ — दुःखमा परेको परिवार एक्लो नपरोस्, युवाहरूसँग अघि बढ्ने बाटो होस्, र समस्याको गुनासो मात्र होइन, मिलेर समाधान होस्।\n\nत्यही काम म हरेक दिन गर्ने प्रयास गर्छु: कार्यक्रम आयोजना गर्ने, आवश्यक परेकालाई सहयोग गर्ने र मानिसहरूलाई एकै ठाउँमा ल्याउने। यो वेबसाइट त्यही कामको अभिलेख हो — तस्बिर, समाचार र त्यसपछाडिका मानिसहरू।\n\nसँगै काम गर्न चाहनुहुन्छ वा कुरा मात्र गर्न चाहनुहुन्छ भने, मेरो ढोका सधैं खुला छ।",
  cta_title: "Let's work together and change society.",
  cta_title_np: "सँगै काम गरौं, समाज बदलौं।",
  cta_text: "Join a programme, lend a hand, or simply tell us what you think.",
  cta_text_np: "कुनै कार्यक्रममा सहभागी हुनुहोस्, सहयोगको हात बढाउनुहोस्, वा आफ्नो विचार भन्नुहोस्।",
  about_intro:
    "Born and raised in Urlabari, Rudra Tamang has spent nearly two decades in community organising, cooperative work and local government.",
  about_intro_np: "उर्लाबारीमै जन्मिएका र हुर्किएका रुद्र तामाङले झन्डै दुई दशक सामुदायिक संगठन, सहकारी र स्थानीय सरकारमा बिताएका छन्।",
  about_body:
    "*This biography is placeholder text. Replace it from Dashboard → Settings → About.*\n\nRudra Tamang grew up in a farming family in Urlabari. After completing his studies he returned home to work with farmers' cooperatives, where he learned how much a village can do when its money and decisions stay close to home.\n\n## In public life\n\nHe has served as a ward-level representative, chaired a community forest user group and led relief coordination during the flood seasons along the Ratuwa and Bakraha rivers.\n\n## What he believes\n\nThat local government should be the most open government. That a citizen should never have to know someone to get something done. And that the measure of a term in office is what is still standing ten years later.",
  about_body_np:
    "*यो जीवनी नमुना पाठ हो। ड्यासबोर्ड → सेटिङ → About बाट परिवर्तन गर्नुहोस्।*\n\nरुद्र तामाङ उर्लाबारीको एक किसान परिवारमा हुर्किए। अध्ययनपछि उनी किसान सहकारीसँग काम गर्न घर फर्किए, जहाँ उनले गाउँको पैसा र निर्णय गाउँमै रहँदा कति धेरै गर्न सकिन्छ भन्ने सिके।\n\n## सार्वजनिक जीवनमा\n\nउनले वडा स्तरको प्रतिनिधिको रूपमा काम गरेका छन्, सामुदायिक वन उपभोक्ता समूहको अध्यक्षता गरेका छन् र रतुवा तथा बक्राहा खोलाको बाढीका बेला राहत समन्वयको नेतृत्व गरेका छन्।\n\n## उनको विश्वास\n\nस्थानीय सरकार सबैभन्दा खुला सरकार हुनुपर्छ। काम गराउन कुनै नागरिकले कसैलाई चिन्नु नपरोस्। र कार्यकालको मापन दस वर्षपछि पनि के उभिइरहेको छ भन्ने हो।",
  born: "Urlabari, Morang",
  born_np: "उर्लाबारी, मोरङ",
  hometown: "Urlabari-7",
  hometown_np: "उर्लाबारी-७",
  education: "Master's in Rural Development",
  education_np: "ग्रामीण विकासमा स्नातकोत्तर",
  family: "Married, two children",
  family_np: "विवाहित, दुई सन्तान",
  transparency_intro:
    "Public money deserves public records. Asset declarations, budgets, audits and project reports are published here as soon as they exist — no request needed.",
  transparency_intro_np: "सार्वजनिक पैसाको सार्वजनिक अभिलेख हुनुपर्छ। सम्पत्ति विवरण, बजेट, लेखापरीक्षण र आयोजना प्रतिवेदन तयार हुनासाथ यहाँ प्रकाशित गरिन्छ — माग गर्नु पर्दैन।",
  transparency_pledge: [
    "Personal asset declaration published every year",
    "Every contract above Rs 5 lakh listed with its contractor",
    "Quarterly spending reports for every ward",
    "Public hearing in each ward twice a year",
    "Grievances answered within 15 days, tracked by code",
  ],
  transparency_pledge_np: [
    "हरेक वर्ष व्यक्तिगत सम्पत्ति विवरण सार्वजनिक",
    "५ लाखभन्दा माथिका सबै ठेक्का ठेकेदारसहित सूचीकृत",
    "हरेक वडाको त्रैमासिक खर्च प्रतिवेदन",
    "हरेक वडामा वर्षमा दुई पटक सार्वजनिक सुनुवाइ",
    "गुनासो १५ दिनभित्र जवाफ, कोडमार्फत ट्र्याक",
  ],
  email: "contact@rudratamang.com",
  phone: "+977 98XXXXXXXX",
  address: "Urlabari-4, Aaitabare, Morang",
  address_np: "उर्लाबारी-४, आइतबारे, मोरङ",
  office_hours: "Sunday–Friday, 10:00–17:00",
  office_hours_np: "आइतबार–शुक्रबार, १०:००–१७:००",
  map_embed: "https://www.google.com/maps?q=Urlabari,Morang,Nepal&output=embed",
  facebook: "https://facebook.com/",
  youtube: "https://youtube.com/",
  seo_description: "Rudra Tamang — social activist from Urlabari, Morang. His work, news, photos and how to get in touch.",
  seo_description_np: "रुद्र तामाङ — उर्लाबारी, मोरङका समाजसेवी। उनका काम, समाचार, तस्बिर र सम्पर्क।",
  // image:"https://scontent.fbir1-1.fna.fbcdn.net/v/t39.30808-6/497397560_1413607886441484_405079896117427247_n.jpg?stp=dst-jpg_tt6&cstp=mx1200x1600&ctp=s1200x1600&_nc_cat=106&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=cc71e4&_nc_eui2=AeGD0azBa3pQfgYbyFuMBJozCujHL7nuG2AK6Mcvue4bYIMzliNzF8AbHR5i0hNJGTQ3s2qxBo-CfNNknekRm4O1&_nc_ohc=EVXkRgKU67kQ7kNvwFLeMat&_nc_oc=AdqWogrI2HghyEG377qsOKQM8MVPOoBpgj7223p-d_4oWhDMq3X3hl4zQsH3_93TMjtNQoFOLsieE9ZaEPsSX8v7&_nc_zt=23&_nc_ht=scontent.fbir1-1.fna&_nc_gid=UxtPJWRVl-4bLwi-yjiNTQ&_nc_ss=7b2a8&oh=00_AQN_NbasxyKQTTb1lEELiTFHuutH5zsWwteCpTWLQhAhYQ&oe=6AC805FC"
});

// ---- Vision ------------------------------------------------------------

await add("ideas", [
  {
    kicker: "Open government",
    kicker_np: "खुला सरकार",
    title: "Every rupee, in public",
    title_np: "हरेक रुपैयाँ, सार्वजनिक",
    summary: "Budgets, contracts and spending published ward by ward, in plain language, every quarter.",
    summary_np: "बजेट, ठेक्का र खर्च वडागत रूपमा, सरल भाषामा, हरेक त्रैमासिक सार्वजनिक।",
    points: ["Online register of all contracts and contractors", "Quarterly ward spending reports", "Twice-yearly public hearings in every ward"],
    points_np: ["सबै ठेक्का र ठेकेदारको अनलाइन दर्ता", "त्रैमासिक वडा खर्च प्रतिवेदन", "हरेक वडामा वर्षमा दुई पटक सार्वजनिक सुनुवाइ"],
  },
  {
    kicker: "Farming",
    kicker_np: "कृषि",
    title: "Farmers paid fairly, on time",
    title_np: "किसानलाई उचित मूल्य, समयमै",
    summary: "78% of our land is farmland. A cold store, a collection centre in each cluster and direct buyer links.",
    summary_np: "हाम्रो ७८% जमिन खेतीयोग्य छ। शीत भण्डार, हरेक क्लस्टरमा संकलन केन्द्र र खरिदकर्तासँग प्रत्यक्ष सम्पर्क।",
    points: ["Municipal cold store and vegetable market", "Irrigation from Ratuwa and Mawa rivers", "Soil testing and seed support at ward offices"],
    points_np: ["नगरपालिकाको शीत भण्डार र तरकारी बजार", "रतुवा र मावा खोलाबाट सिँचाइ", "वडा कार्यालयमा माटो परीक्षण र बीउ सहयोग"],
  },
  {
    kicker: "Jobs",
    kicker_np: "रोजगारी",
    title: "Work at home, not only abroad",
    title_np: "विदेश मात्र होइन, घरमै काम",
    summary: "More than 7,500 of our people are working abroad. Skills, start-up loans and local enterprise to bring the next generation home.",
    summary_np: "हाम्रा ७,५०० भन्दा बढी मानिस विदेशमा काम गरिरहेका छन्। अर्को पुस्तालाई घर फर्काउन सीप, सुरुवाती ऋण र स्थानीय उद्यम।",
    points: ["Vocational training centre with returnee programme", "Low-interest youth enterprise fund", "Local hiring targets for municipal projects"],
    points_np: ["फर्किएकाहरूका लागि कार्यक्रमसहित व्यावसायिक तालिम केन्द्र", "न्यून ब्याजको युवा उद्यम कोष", "नगरपालिकाका आयोजनामा स्थानीय रोजगारी लक्ष्य"],
  },
  {
    kicker: "Schools",
    kicker_np: "शिक्षा",
    title: "Public schools parents choose",
    title_np: "अभिभावकले रोज्ने सामुदायिक विद्यालय",
    summary: "Science labs, trained teachers and a free midday meal in all 23 community schools.",
    summary_np: "सबै २३ सामुदायिक विद्यालयमा विज्ञान प्रयोगशाला, तालिमप्राप्त शिक्षक र निःशुल्क दिवा खाजा।",
    points: ["Lab and library in every secondary school", "Teacher training with the community campuses", "Scholarships for girls and Dalit students"],
    points_np: ["हरेक माध्यमिक विद्यालयमा प्रयोगशाला र पुस्तकालय", "सामुदायिक क्याम्पससँग शिक्षक तालिम", "छात्रा र दलित विद्यार्थीलाई छात्रवृत्ति"],
  },
  {
    kicker: "Health",
    kicker_np: "स्वास्थ्य",
    title: "Care within thirty minutes",
    title_np: "तीस मिनेटभित्र उपचार",
    summary: "A staffed health post within half an hour of every home, with a 24-hour birthing centre.",
    summary_np: "हरेक घरबाट आधा घण्टाभित्र कर्मचारीसहितको स्वास्थ्य चौकी, २४ घण्टे प्रसूति केन्द्रसहित।",
    points: ["24-hour birthing centre", "Free health insurance enrolment drive", "Mobile clinics for elderly residents"],
    points_np: ["२४ घण्टे प्रसूति केन्द्र", "निःशुल्क स्वास्थ्य बीमा दर्ता अभियान", "ज्येष्ठ नागरिकका लागि घुम्ती क्लिनिक"],
  },
  {
    kicker: "Rivers & land",
    kicker_np: "नदी र जमिन",
    title: "Safe from the monsoon",
    title_np: "बर्खाबाट सुरक्षित",
    summary: "River training on the Bakraha and Ratuwa, proper drainage in the bazaar, and protected wetlands.",
    summary_np: "बक्राहा र रतुवामा तटबन्ध, बजारमा व्यवस्थित ढल, र सिमसार क्षेत्रको संरक्षण।",
    points: ["Embankments on flood-prone stretches", "Bazaar drainage master plan", "Protect Betini and Lampate wetlands"],
    points_np: ["बाढी जोखिम क्षेत्रमा तटबन्ध", "बजार ढल गुरुयोजना", "बेतिनी र लम्पटे सिमसारको संरक्षण"],
  },
]);

// ---- Achievements (placeholders) ---------------------------------------

await add("achievements", [
  {
    title: "Blacktopped the Urlabari–Rajghat link road",
    title_np: "उर्लाबारी–राजघाट जोडने सडक कालोपत्रे",
    category: "Infrastructure",
    year: "2080",
    metric: "11 km",
    metric_label: "of all-weather road",
    metric_label_np: "बाह्रै महिना चल्ने सडक",
    ward: "Wards 8 & 9",
    ward_np: "वडा ८ र ९",
    status: "Completed",
    summary: "Placeholder — replace with real work. Connects farms in Rajghat to the Urlabari market year-round.",
    summary_np: "नमुना — वास्तविक कामले बदल्नुहोस्। राजघाटका खेतलाई बाह्रै महिना उर्लाबारी बजारसँग जोड्छ।",
    featured: true,
  },
  {
    title: "Science labs for five community schools",
    title_np: "पाँच सामुदायिक विद्यालयमा विज्ञान प्रयोगशाला",
    category: "Education",
    year: "2081",
    metric: "5",
    metric_label: "schools equipped",
    metric_label_np: "विद्यालय सुसज्जित",
    ward: "Wards 2, 6, 8",
    ward_np: "वडा २, ६, ८",
    status: "Completed",
    summary: "Placeholder — replace with real work. Equipment, training and a maintenance budget for each lab.",
    summary_np: "नमुना — वास्तविक कामले बदल्नुहोस्। हरेक प्रयोगशालाका लागि उपकरण, तालिम र मर्मत बजेट।",
    featured: true,
  },
  {
    title: "Flood embankment on the Bakraha",
    title_np: "बक्राहा खोलामा बाढी तटबन्ध",
    category: "Environment",
    year: "2081",
    metric: "2.4 km",
    metric_label: "of river training",
    metric_label_np: "तटबन्ध निर्माण",
    ward: "Ward 1",
    ward_np: "वडा १",
    status: "Ongoing",
    summary: "Placeholder — replace with real work. Protects homes and farmland that flooded in three of the last five monsoons.",
    summary_np: "नमुना — वास्तविक कामले बदल्नुहोस्। पछिल्ला पाँचमध्ये तीन बर्खामा डुबेका घर र खेत जोगाउँछ।",
    featured: true,
  },
  {
    title: "Vegetable collection centre",
    title_np: "तरकारी संकलन केन्द्र",
    category: "Agriculture",
    year: "2080",
    metric: "640",
    metric_label: "farming families selling direct",
    metric_label_np: "किसान परिवार प्रत्यक्ष बिक्रीमा",
    ward: "Ward 4",
    ward_np: "वडा ४",
    status: "Completed",
    summary: "Placeholder — replace with real work.",
    summary_np: "नमुना — वास्तविक कामले बदल्नुहोस्।",
    featured: true,
  },
  {
    title: "Senior citizens' day-care centre",
    title_np: "ज्येष्ठ नागरिक दिवा सेवा केन्द्र",
    category: "Social welfare",
    year: "2079",
    metric: "120",
    metric_label: "elders served weekly",
    metric_label_np: "ज्येष्ठ नागरिक साप्ताहिक सेवामा",
    ward: "Ward 7",
    ward_np: "वडा ७",
    status: "Completed",
    summary: "Placeholder — replace with real work.",
    summary_np: "नमुना — वास्तविक कामले बदल्नुहोस्।",
    featured: true,
  },
  {
    title: "Women's enterprise revolving fund",
    title_np: "महिला उद्यम घुम्ती कोष",
    category: "Women & inclusion",
    year: "2081",
    metric: "Rs 1.2 cr",
    metric_label: "lent to 300+ women",
    metric_label_np: "३०० भन्दा बढी महिलालाई ऋण",
    ward: "All wards",
    ward_np: "सबै वडा",
    status: "Ongoing",
    summary: "Placeholder — replace with real work.",
    summary_np: "नमुना — वास्तविक कामले बदल्नुहोस्।",
    featured: true,
  },
]);

// ---- Timeline -----------------------------------------------------------

await add("timeline", [
  { year: "1980s", title: "Childhood in Urlabari", title_np: "उर्लाबारीमा बाल्यकाल", description: "Placeholder milestone — edit in Dashboard → Life & Journey.", description_np: "नमुना — ड्यासबोर्डबाट सम्पादन गर्नुहोस्।" },
  { year: "2063", title: "Founded a farmers' cooperative", title_np: "किसान सहकारी स्थापना", description: "Placeholder milestone.", description_np: "नमुना।" },
  { year: "2070", title: "Chair, community forest user group", title_np: "सामुदायिक वन उपभोक्ता समूहको अध्यक्ष", description: "Placeholder milestone.", description_np: "नमुना।" },
  { year: "2074", title: "Elected ward representative", title_np: "वडा प्रतिनिधिमा निर्वाचित", description: "Placeholder milestone.", description_np: "नमुना।" },
  { year: "2079", title: "Flood relief coordinator", title_np: "बाढी राहत संयोजक", description: "Placeholder milestone.", description_np: "नमुना।" },
]);

// ---- Wards (real: Census 2078 via urlabari-data.json) ------------------

const dataFile = path.join(SOURCES, "urlabari-data.json");
if (fs.existsSync(dataFile)) {
  const data = JSON.parse(fs.readFileSync(dataFile, "utf8"));
  const np = "०१२३४५६७८९";
  const toNp = (s: string) => s.replace(/\d/g, (d) => np[Number(d)]);
  const chairs = new Map<number, string>(data.ward_party.map((w: { ward: number; winner_name: string }) => [w.ward, w.winner_name]));
  await add(
    "wards",
    data.wards.map((w: { ward: number; former: string; population: number; households: number; area_km2: number }) => ({
      number: w.ward,
      name: w.former,
      name_np: toNp(w.former.replace("Madhumalla VDC wards", "मधुमल्ला गाविस वडा").replace("Old Urlabari wards", "साविक उर्लाबारी वडा").replace("Old Urlabari ward", "साविक उर्लाबारी वडा").replace("Rajghat VDC wards", "राजघाट गाविस वडा")),
      population: w.population,
      households: w.households,
      area_km2: w.area_km2,
      chair: chairs.get(w.ward) ?? "",
    })),
  );
}

// ---- Documents (real municipal records) --------------------------------

async function importFile(src: string, title: string): Promise<string | null> {
  if (!fs.existsSync(src)) return null;
  const dir = path.join(config.uploadDir, "documents");
  fs.mkdirSync(dir, { recursive: true });
  const name = path.basename(src);
  fs.copyFileSync(src, path.join(dir, name));
  const url = `/uploads/documents/${name}`;
  await db.run(`INSERT INTO media (url, filename, original_name, mime, size, alt) VALUES (?, ?, ?, 'application/pdf', ?, ?)`, [
    url,
    name,
    name,
    fs.statSync(src).size,
    title,
  ]);
  return url;
}

const docs = [
  {
    src: "raw-sources/policy8384.pdf",
    title: "Urlabari Municipality — Policy & Programme, FY 2083/84",
    title_np: "उर्लाबारी नगरपालिका — आर्थिक वर्ष २०८३/८४ को नीति तथा कार्यक्रम",
    category: "Policy & plan",
    fiscal_year: "2083/84",
    published_at: "2026-07-03",
    description: "The municipal executive's annual policy and programme, as presented to the municipal assembly.",
    description_np: "नगर सभामा प्रस्तुत नगर कार्यपालिकाको वार्षिक नीति तथा कार्यक्रम।",
  },
  {
    src: "raw-sources/plan_vol1.pdf",
    title: "First Periodic Plan 2079/80–2083/84 — Main report & maps",
    title_np: "प्रथम आवधिक योजना २०७९/८०–२०८३/८४ — मूल प्रतिवेदन तथा नक्सा",
    category: "Policy & plan",
    fiscal_year: "2079/80",
    published_at: "2022-07-15",
    description: "Five-year development plan for Urlabari Municipality, volume 1.",
    description_np: "उर्लाबारी नगरपालिकाको पञ्चवर्षीय विकास योजना, खण्ड १।",
  },
  {
    src: "raw-sources/plan_vol2.pdf",
    title: "First Periodic Plan — Annexes",
    title_np: "प्रथम आवधिक योजना — अनुसूचीहरू",
    category: "Policy & plan",
    fiscal_year: "2079/80",
    published_at: "2022-07-15",
    description: "Volume 2 of the periodic plan: data tables and annexes.",
    description_np: "आवधिक योजनाको खण्ड २: तथ्यांक तालिका तथा अनुसूची।",
  },
  {
    src: "raw-sources/plan_review.pdf",
    title: "Periodic plan review",
    title_np: "आवधिक योजना समीक्षा",
    category: "Project report",
    fiscal_year: "2081/82",
    published_at: "2025-01-10",
    description: "Mid-term review of progress against the periodic plan.",
    description_np: "आवधिक योजनाविरुद्धको प्रगतिको मध्यावधि समीक्षा।",
  },
  {
    src: "Urlabari-Campaign-Report.pdf",
    title: "Urlabari ward-by-ward facts report",
    title_np: "उर्लाबारी वडागत तथ्य प्रतिवेदन",
    category: "Other",
    fiscal_year: "2083/84",
    published_at: "2026-10-03",
    description: "Population, economy, schools and election results for each ward, compiled from Census 2078 and Election Commission data.",
    description_np: "जनगणना २०७८ र निर्वाचन आयोगको तथ्यांकबाट संकलित वडागत जनसंख्या, अर्थतन्त्र, विद्यालय र निर्वाचन परिणाम।",
  },
];

const docRows: Row[] = [];
for (const { src, ...d } of docs) {
  const file = await importFile(path.join(SOURCES, src), d.title);
  if (file) docRows.push({ ...d, file });
}
await add("documents", docRows);

// ---- News, events, voices ----------------------------------------------

await add("posts", [
  {
    title: "Ward dialogue series begins in Rajghat",
    title_np: "राजघाटबाट वडा संवाद शृङ्खला सुरु",
    type: "News",
    published_at: "2026-09-28",
    excerpt: "Placeholder post — the first of nine open meetings, one in every ward, to shape the agenda together.",
    excerpt_np: "नमुना पोस्ट — सँगै एजेन्डा तय गर्न हरेक वडामा एउटा गरी नौवटा खुला भेलामध्ये पहिलो।",
    body: "This is a placeholder article. Write real news from **Dashboard → News & Press**.\n\nThe body supports headings, lists, links and images.",
    body_np: "यो नमुना लेख हो। **ड्यासबोर्ड → News & Press** बाट वास्तविक समाचार लेख्नुहोस्।",
    featured: true,
  },
  {
    title: "Asset declaration published",
    title_np: "सम्पत्ति विवरण सार्वजनिक",
    type: "Press release",
    published_at: "2026-09-15",
    excerpt: "Placeholder post — personal and family assets made public ahead of the campaign.",
    excerpt_np: "नमुना पोस्ट — अभियानअघि व्यक्तिगत तथा पारिवारिक सम्पत्ति सार्वजनिक।",
    body: "Placeholder article.",
    body_np: "नमुना लेख।",
    featured: true,
  },
  {
    title: "Why Urlabari needs a cold store",
    title_np: "उर्लाबारीलाई किन शीत भण्डार चाहिन्छ",
    type: "Article",
    published_at: "2026-08-30",
    excerpt: "Placeholder post — 7,824 households grow no food of their own; the rest sell at harvest-time prices.",
    excerpt_np: "नमुना पोस्ट — ७,८२४ घरधुरीले आफ्नै खाद्यान्न उब्जाउँदैनन्; बाँकीले फसल भित्र्याउने बेलाको मूल्यमा बेच्छन्।",
    body: "Placeholder article.",
    body_np: "नमुना लेख।",
    featured: true,
  },
]);

const inDays = (d: number, h = 11) => {
  const t = new Date(Date.now() + d * 86400000);
  return `${t.toISOString().slice(0, 10)}T${String(h).padStart(2, "0")}:00`;
};

await add("events", [
  {
    title: "Ward 4 public dialogue",
    title_np: "वडा ४ सार्वजनिक संवाद",
    starts_at: inDays(6),
    ends_at: inDays(6, 14),
    location: "Ward 4 office hall, Aaitabare",
    location_np: "वडा ४ कार्यालय हल, आइतबारे",
    description: "Placeholder event. Bring your questions — open to everyone.",
    description_np: "नमुना कार्यक्रम। आफ्ना प्रश्न लिएर आउनुहोस् — सबैका लागि खुला।",
  },
  {
    title: "Farmers' meeting on the cold store",
    title_np: "शीत भण्डारबारे किसान भेला",
    starts_at: inDays(13, 10),
    location: "Rajghat, Ward 8",
    location_np: "राजघाट, वडा ८",
    description: "Placeholder event.",
    description_np: "नमुना कार्यक्रम।",
  },
  {
    title: "Youth & returnee jobs forum",
    title_np: "युवा तथा फर्किएका श्रमिक रोजगार मञ्च",
    starts_at: inDays(20, 13),
    location: "Urlabari Multiple Campus",
    location_np: "उर्लाबारी बहुमुखी क्याम्पस",
    description: "Placeholder event.",
    description_np: "नमुना कार्यक्रम।",
  },
]);

await add("testimonials", [
  {
    name: "Sample Name",
    role: "Farmer, Ward 8",
    role_np: "किसान, वडा ८",
    quote: "Placeholder quote — add real voices from Dashboard → Voices. Short and specific works best.",
    quote_np: "नमुना भनाइ — ड्यासबोर्ड → Voices बाट वास्तविक भनाइ थप्नुहोस्।",
  },
  {
    name: "Sample Name",
    role: "Teacher, Ward 2",
    role_np: "शिक्षक, वडा २",
    quote: "Placeholder quote — one or two sentences from a resident about work they have seen first-hand.",
    quote_np: "नमुना भनाइ — आफूले प्रत्यक्ष देखेको कामबारे बासिन्दाका एक-दुई वाक्य।",
  },
]);

console.log("Seeded starter content.");
await pool.end();
