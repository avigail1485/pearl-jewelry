export type Lang = "en" | "he";

export interface LocalizedText {
  en: string;
  he: string;
}

export interface Project {
  slug: string;
  category: LocalizedText;
  title: LocalizedText;
  summary: LocalizedText;
  description: LocalizedText;
  cover: string;
  images: string[];
}

export interface TimelineItem {
  years: string;
  text: LocalizedText;
}

export const projects: Project[] = [
  {
    slug: "jewelry-stand",
    category: { en: "Jewelry & Judaica · Laser Cutting", he: "תכשיטים ויודאיקה · חיתוך לייזר" },
    title: { en: "Jewelry Stand", he: "מעמד לתכשיטים" },
    summary: {
      en: "A minimalist acrylic jewelry stand designed for effortless display.",
      he: "מעמד תכשיטים מינימליסטי מאקריליך, לתצוגה בלי מאמץ.",
    },
    description: {
      en: "Designed for young women who want their jewelry seen, not tangled in a drawer. Built from clear 5mm and 2mm acrylic using laser cutting and engraving, the stand ships flat as a compact 2D kit and assembles by hand — turning the unboxing itself into part of the product. The transparent material keeps it light, affordable, and quietly luxurious, while the sturdy joinery holds rings, chains, and earrings without ever feeling cluttered.",
      he: "מעמד שתוכנן עבור נערות ונשים צעירות שרוצות לראות את התכשיטים שלהן, לא לחפש אותם מסובכים במגירה. בנוי מאקריליך שקוף בעובי 5 מילימטר ו-2 מילימטר בטכנולוגית חיתוך וחריטת לייזר, המעמד נשלח כערכה שטוחה ודו-ממדית ומורכב ביד — כך שההרכבה עצמה הופכת לחלק מהחוויה. השקיפות שומרת עליו קליל, נגיש ומפואר בעדינות, והחיבורים היציבים מחזיקים טבעות, שרשראות ועגילים בלי שייראה עמוס.",
    },
    cover: "/images/jewelry-stand/6-final.webp",
    images: [
      "/images/jewelry-stand/6-final.webp",
      "/images/jewelry-stand/1.webp",
      "/images/jewelry-stand/2.webp",
      "/images/jewelry-stand/3.webp",
      "/images/jewelry-stand/4.webp",
      "/images/jewelry-stand/5.webp",
    ],
  },
  {
    slug: "purim-vase",
    category: { en: "Laser Cutting · Product Design", he: "חיתוך לייזר · עיצוב מוצר" },
    title: { en: "Purim Vase", he: "אגרטל פורים" },
    summary: {
      en: "A festive, laser-cut vase inspired by the jester's hat.",
      he: "אגרטל חגיגי בחיתוך לייזר, בהשראת כובע הליצן.",
    },
    description: {
      en: "Created for a laser-cutting course around the Purim holiday, this vase reinterprets the traditional jester's hat as an elegant tabletop object. Clear acrylic meets gold acrylic to keep the piece festive without losing sophistication; three legs on a triangular base give it stability, while the flared upper section holds flowers and reflects light through the water below — designed to fit any table, any style, any event.",
      he: "אגרטל שנוצר במסגרת קורס חיתוך לייזר סביב חג הפורים, ומפרש מחדש את כובע הליצן המסורתי כחפץ מעוצב לשולחן. שילוב של אקריליך שקוף ואקריליך זהב שומר על החגיגיות בלי לוותר על תחכום; שלוש רגליים על בסיס משולש מעניקות יציבות, והחלק העליון המתרחב מחזיק פרחים ומשקף אור דרך המים — כך שהאגרטל מתאים לכל שולחן, סגנון ואירוע.",
    },
    cover: "/images/vase/5-final.webp",
    images: [
      "/images/vase/5-final.webp",
      "/images/vase/1-research.webp",
      "/images/vase/2-inspiration.webp",
      "/images/vase/3-sketch.webp",
      "/images/vase/4-design.webp",
    ],
  },
  {
    slug: "cake-knife",
    category: { en: "Kitchenware · Product Design", he: "כלי מטבח · עיצוב מוצר" },
    title: { en: "Cake Cutting Knife", he: "סכין קורצן לעוגה" },
    summary: {
      en: "A triangular blade for perfectly equal cake slices.",
      he: "להב משולש לפרוסות עוגה שווות ומדויקות.",
    },
    description: {
      en: "A simple problem, precisely solved: cutting a round cake into equal, symmetrical triangular slices. The flexible blade lets the user control portion size in real time, while ergonomic handles keep the grip comfortable through every cut — turning an everyday kitchen frustration into a small, satisfying ritual.",
      he: "בעיה פשוטה שנפתרה בדיוק: חיתוך עוגה עגולה לפרוסות משולשות, שווות וסימטריות. הלהב הגמיש מאפשר לשלוט בגודל הפרוסה בזמן אמת, והידיות הארגונומיות שומרות על אחיזה נוחה לאורך כל החיתוך — והופכות תסכול מטבחי יומיומי לטקס קטן ומספיק.",
    },
    cover: "/images/cake-knife/2-final.webp",
    images: [
      "/images/cake-knife/2-final.webp",
      "/images/cake-knife/1-process.webp",
      "/images/cake-knife/3-thumb.webp",
    ],
  },
  {
    slug: "mobile-shelf",
    category: { en: "Storage · Product Design", he: "אחסון · עיצוב מוצר" },
    title: { en: "Mobile Shelf System", he: "מתקן מדפים נייד" },
    summary: {
      en: "A collapsible, flexible shelving system for sports balls.",
      he: "מערכת מדפים גמישה ומתקפלת לכדורי ספורט.",
    },
    description: {
      en: "A storage system that adjusts its own height and wall tension to however much it's holding. Inspired by archery, it pairs a dense rotating rubber base for stability with spaced rubber walls for flexibility; the shelves themselves are lightweight and compact, closing with 3D-printed clips designed specifically for this build.",
      he: "מערכת אחסון שמתאימה את גובהה ואת מתח הדפנות שלה לכמות הפריטים שבתוכה. בהשראת ענף הקשת, המתקן משלב בסיס גומי צפוף שמסתובב ליציבות עם דפנות גומי מרווחות לגמישות; המדפים עצמם קלים וקומפקטיים, ונסגרים באמצעות קליפסים מודפסים בתלת מימד שתוכננו בייחוד עבור המוצר.",
    },
    cover: "/images/shelving/6-final.webp",
    images: [
      "/images/shelving/6-final.webp",
      "/images/shelving/1-sketch.webp",
      "/images/shelving/2-model.webp",
      "/images/shelving/3-model.webp",
      "/images/shelving/4-process.webp",
      "/images/shelving/5-process.webp",
    ],
  },
  {
    slug: "building-modeling",
    category: { en: "3D Modeling · CAD", he: "מידול תלת מימד · CAD" },
    title: { en: "Building & Modeling", he: "בניה ומידול" },
    summary: {
      en: "A collection of 3D-modeled products, from concept to render.",
      he: "אוסף מוצרים שמודלו בתלת מימד, מקונספט ועד רנדר.",
    },
    description: {
      en: "A running collection of 3D construction and modeling work — products designed, surfaced, and rendered in Rhino and SolidWorks before ever touching a printer. Each piece is an exercise in translating a sketch into clean, manufacturable geometry.",
      he: "אוסף מתמשך של עבודות בניה ומידול תלת מימדי — מוצרים שעוצבו, נבנו ורונדרו ב-Rhino וב-SolidWorks עוד לפני שנגעו במדפסת. כל פריט הוא תרגיל בתרגום סקיצה לגאומטריה נקייה וברת-ייצור.",
    },
    cover: "/images/modeling/1.webp",
    images: [
      "/images/modeling/1.webp",
      "/images/modeling/2.webp",
      "/images/modeling/3.webp",
      "/images/modeling/4.webp",
      "/images/modeling/5.webp",
    ],
  },
];

export const education: TimelineItem[] = [
  { years: "2022–2024", text: { en: "Engineering technician certificate in Product Design, Horizons Seminar", he: "תעודת הנדסאי עיצוב מוצר, סמינר הורייזנס" } },
  { years: "2022–2024", text: { en: "Teaching certification in Arts & Judaism", he: "הכשרת הוראה באמנות ויהדות" } },
  { years: "2018–2022", text: { en: "Graphic design diploma, Beit Meir High School", he: "תעודת גרפיקה, תיכון בית מאיר" } },
];

export const experience: TimelineItem[] = [
  { years: "2023–2024", text: { en: "3D product printing", he: "הדפסת מוצרים בתלת מימד" } },
  { years: "2022–2023", text: { en: "Art workshops for children", he: "סדנאות אמנות לילדים" } },
  { years: "2021–2022", text: { en: "Shift manager, “Hakol LeGan” craft supply store", he: "אחראית משמרת, חנות “הכל לגן”" } },
];

export const skills = ["Rhino", "SolidWorks", "Photoshop", "Illustrator", "Clip Studio"];
export const skillsLocalized = {
  en: [...skills, "3D Printing", "Laser Cutting", "Ceramics"],
  he: [...skills, "הדפסת תלת מימד", "חיתוך לייזר", "קרמיקה"],
};

export const languagesLocalized = {
  en: ["Hebrew — native", "English — advanced"],
  he: ["עברית — שפת אם", "אנגלית — רמה מתקדמת"],
};

export const capabilities: LocalizedText[] = [
  { en: "Product Design", he: "עיצוב מוצר" },
  { en: "Jewelry & Judaica", he: "תכשיטים ויודאיקה" },
  { en: "Packaging Design", he: "עיצוב אריזות" },
  { en: "3D Modeling", he: "מידול תלת מימד" },
  { en: "Laser Cutting", he: "חיתוך לייזר" },
  { en: "Ceramics", he: "קרמיקה" },
];

export const contact = {
  phone: "053-418-6716",
  phoneHref: "tel:+972534186716",
  email: "tamarfinkel525@gmail.com",
};

export const ui = {
  en: {
    dir: "ltr",
    lang: "en",
    nav: { work: "Work", about: "About", contact: "Contact" },
    langToggle: "עב",
    hero: {
      eyebrow: "Product Design Studio",
      headline: "Ideas, engineered into objects.",
      sub: "Tamar Finkel is a product designer turning sketches into 3D-printed, laser-cut, and hand-finished pieces — precise, considered, and a little playful.",
      cta: "View the work",
    },
    capabilitiesHeading: "What I work with",
    work: {
      heading: "Selected Work",
      lead: "Five projects, five problems — each solved from research to finished object.",
      viewProject: "View project",
      close: "Close",
    },
    about: {
      heading: "About",
      lead: "Tamar Finkel is a product designer working across jewelry, packaging, and 3D-printed objects — precise in process, playful in outcome.",
      bio: "A graduate of product design engineering studies, Tamar builds every project on thorough research, responsible planning, and hands-on prototyping. She treats each brief — whether it's a kitchen tool or a jewelry stand — as a chance to combine technical knowledge with a genuine passion for design, creative thinking, and a commitment to getting the details right.",
      educationHeading: "Education",
      experienceHeading: "Experience",
      skillsHeading: "Tools & Materials",
      languagesHeading: "Languages",
    },
    contact: {
      heading: "Let’s make something.",
      lead: "Have a product in mind, or a project that needs precise hands? Reach out.",
      phoneLabel: "Phone",
      emailLabel: "Email",
      formName: "Name",
      formEmail: "Email",
      formMessage: "Message",
      formSubmit: "Send message",
    },
    footer: {
      rights: "© 2026 Tamar Finkel. All rights reserved.",
    },
  },
  he: {
    dir: "rtl",
    lang: "he",
    nav: { work: "עבודות", about: "אודות", contact: "צור קשר" },
    langToggle: "EN",
    hero: {
      eyebrow: "סטודיו לעיצוב מוצר",
      headline: "רעיונות, שהופכים לחפצים.",
      sub: "תמר פינקל היא מעצבת מוצר שמהפכת סקיצות לפריטים מודפסים בתלת מימד, חתוכים בלייזר ומושלמים ביד — מדויקים, מחושבים ומלאי אופי.",
      cta: "לצפייה בעבודות",
    },
    capabilitiesHeading: "תחומי עבודה",
    work: {
      heading: "עבודות נבחרות",
      lead: "חמשה פרויקטים, חמשה בעיות — כל אחד נפתר ממחקר ועד חפץ גמור.",
      viewProject: "לצפייה בפרויקט",
      close: "סגירה",
    },
    about: {
      heading: "אודות",
      lead: "תמר פינקל היא מעצבת מוצר שעובדת בין תכשיטים, אריזות ופריטים מודפסים בתלת מימד — מדויקת בתהליך, מלאת אופי בתוצאה.",
      bio: "בוגרת לימודי הנדסאי עיצוב מוצר, תמר בונה כל פרויקט על בסיס מחקר יסודי, תכנון אחראי ועבודת פרוטוטייפ מעשית. היא מתייחסת לכל בריף — בין אם זה כלי מטבח או מעמד לתכשיטים — כהזדמנות לשלב ידע טכני עם תשוקה אמיתית לעיצוב, חשיבה יצירתית ומחויבות לדיוק בפרטים הקטנים.",
      educationHeading: "השכלה",
      experienceHeading: "ניסיון",
      skillsHeading: "כלים וחומרים",
      languagesHeading: "שפות",
    },
    contact: {
      heading: "בואו ניצור משהו.",
      lead: "יש לך מוצר בראש, או פרויקט שדורש ידיים מדויקות? אשמח לשמוע.",
      phoneLabel: "טלפון",
      emailLabel: "אימייל",
      formName: "שם",
      formEmail: "אימייל",
      formMessage: "הודעה",
      formSubmit: "שליחת הודעה",
    },
    footer: {
      rights: "© 2026 תמר פינקל. כל הזכויות שמורות.",
    },
  },
} as const;
