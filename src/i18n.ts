import {
  ui,
  projects,
  education,
  experience,
  skillsLocalized,
  languagesLocalized,
  capabilities,
  contact,
  type Lang,
} from "./content";

const STORAGE_KEY = "tamar-lang";

function resolve(path: string, obj: unknown): string {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return "";
  }, obj) as string;
}

export function getInitialLang(): Lang {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "en" || stored === "he") return stored;
  return "en";
}

function renderStaticText(lang: Lang) {
  const dict = ui[lang];
  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n!;
    const value = resolve(key, dict);
    if (value) el.textContent = value;
  });
}

function renderCapabilities(lang: Lang) {
  const list = document.getElementById("capabilitiesList")!;
  list.innerHTML = "";
  capabilities.forEach((c) => {
    const li = document.createElement("li");
    li.className = "pill";
    li.textContent = c[lang];
    list.appendChild(li);
  });
}

function renderHeroGallery() {
  const gallery = document.getElementById("heroGallery")!;
  if (gallery.childElementCount) return;
  projects.slice(0, 4).forEach((p) => {
    const figure = document.createElement("figure");
    const img = document.createElement("img");
    img.src = p.cover;
    img.alt = "";
    img.loading = "lazy";
    figure.appendChild(img);
    gallery.appendChild(figure);
  });
}

function renderWork(lang: Lang) {
  const track = document.getElementById("workTrack")!;
  track.innerHTML = "";
  projects.forEach((project, i) => {
    const card = document.createElement("article");
    card.className = "project-card";
    card.dataset.slug = project.slug;
    card.innerHTML = `
      <span class="project-card__index">0${i + 1}</span>
      <button class="project-card__open" type="button" aria-label="${ui[lang].work.viewProject}">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 12L12 4M12 4H5M12 4V11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div class="project-card__media">
        <img src="${project.cover}" alt="${project.title[lang]}" loading="lazy" />
      </div>
      <div class="project-card__body">
        <div class="project-card__category">${project.category[lang]}</div>
        <h3 class="project-card__title">${project.title[lang]}</h3>
        <p class="project-card__summary">${project.summary[lang]}</p>
      </div>
    `;
    track.appendChild(card);
  });
}

function renderAbout(lang: Lang) {
  const edu = document.getElementById("educationList")!;
  edu.innerHTML = education
    .map((item) => `<li><span>${item.years}</span><span>${item.text[lang]}</span></li>`)
    .join("");

  const exp = document.getElementById("experienceList")!;
  exp.innerHTML = experience
    .map((item) => `<li><span>${item.years}</span><span>${item.text[lang]}</span></li>`)
    .join("");

  const skills = document.getElementById("skillsList")!;
  skills.innerHTML = skillsLocalized[lang].map((s) => `<li>${s}</li>`).join("");

  const languages = document.getElementById("languagesList")!;
  languages.innerHTML = languagesLocalized[lang].map((l) => `<li>${l}</li>`).join("");
}

function renderContact() {
  const phoneLink = document.getElementById("contactPhone") as HTMLAnchorElement;
  const emailLink = document.getElementById("contactEmail") as HTMLAnchorElement;
  phoneLink.href = contact.phoneHref;
  emailLink.href = `mailto:${contact.email}`;
  document.getElementById("contactPhoneValue")!.textContent = contact.phone;
  document.getElementById("contactEmailValue")!.textContent = contact.email;
}

export function applyLanguage(lang: Lang) {
  const dict = ui[lang];
  document.documentElement.lang = dict.lang;
  document.documentElement.dir = dict.dir;
  localStorage.setItem(STORAGE_KEY, lang);

  renderStaticText(lang);
  renderCapabilities(lang);
  renderHeroGallery();
  renderWork(lang);
  renderAbout(lang);
  renderContact();

  const toggle = document.getElementById("langToggle")!;
  toggle.textContent = dict.langToggle;
}
