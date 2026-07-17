import "./style.css";
import { applyLanguage, getInitialLang } from "./i18n";
import { projects, contact, ui, type Lang } from "./content";
import {
  initHeaderScroll,
  heroIntro,
  capabilitiesReveal,
  initWorkScroll,
  projectCardsReveal,
  sectionReveal,
  refresh,
  openModalAnimation,
  closeModalAnimation,
} from "./animations";

let currentLang: Lang = getInitialLang();
let heroPlayed = false;

function openProject(slug: string, lang: Lang) {
  const project = projects.find((p) => p.slug === slug);
  if (!project) return;

  document.getElementById("modalCategory")!.textContent = project.category[lang];
  document.getElementById("modalTitle")!.textContent = project.title[lang];
  document.getElementById("modalDescription")!.textContent = project.description[lang];

  const gallery = document.getElementById("modalGallery")!;
  gallery.innerHTML = project.images
    .map((src) => `<img src="${src}" alt="${project.title[lang]}" loading="lazy" />`)
    .join("");

  openModalAnimation();
}

function closeProject() {
  closeModalAnimation(() => {});
}

function wireWorkClicks() {
  document.getElementById("workTrack")!.addEventListener("click", (e) => {
    const card = (e.target as HTMLElement).closest<HTMLElement>(".project-card");
    if (!card?.dataset.slug) return;
    openProject(card.dataset.slug, currentLang);
  });
}

function wireModalClose() {
  document.getElementById("modalClose")!.addEventListener("click", closeProject);
  document.getElementById("modalBackdrop")!.addEventListener("click", closeProject);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeProject();
  });
}

function wireLangToggle() {
  document.getElementById("langToggle")!.addEventListener("click", () => {
    currentLang = currentLang === "en" ? "he" : "en";
    render(currentLang);
  });
}

function wireContactForm() {
  const form = document.getElementById("contactForm") as HTMLFormElement;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = (document.getElementById("fieldName") as HTMLInputElement).value;
    const email = (document.getElementById("fieldEmail") as HTMLInputElement).value;
    const message = (document.getElementById("fieldMessage") as HTMLTextAreaElement).value;
    const subject = encodeURIComponent(`New message from ${name}`);
    const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
    window.location.href = `mailto:${contact.email}?subject=${subject}&body=${body}`;
  });
}

function render(lang: Lang) {
  applyLanguage(lang);
  const dir = ui[lang].dir as "ltr" | "rtl";

  requestAnimationFrame(() => {
    projectCardsReveal();
    initWorkScroll(dir);
    sectionReveal();
    refresh();
  });
}

function init() {
  initHeaderScroll();
  render(currentLang);
  wireWorkClicks();
  wireModalClose();
  wireLangToggle();
  wireContactForm();

  if (!heroPlayed) {
    heroPlayed = true;
    heroIntro();
    capabilitiesReveal();
  }

  let resizeTimer: number | undefined;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      initWorkScroll(ui[currentLang].dir as "ltr" | "rtl");
      refresh();
    }, 200);
  });
}

init();
