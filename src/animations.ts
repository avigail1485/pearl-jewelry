import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

let workScrollTrigger: ScrollTrigger | null = null;
let revealTriggers: ScrollTrigger[] = [];

export function initHeaderScroll() {
  const header = document.getElementById("siteHeader")!;
  ScrollTrigger.create({
    start: 40,
    end: 99999,
    onUpdate: (self) => {
      header.classList.toggle("is-scrolled", self.scroll() > 40);
    },
  });
}

export function heroIntro() {
  gsap.set([".hero__sub", ".hero__cta", ".hero__gallery figure"], { opacity: 1 });

  const tl = gsap.timeline({ defaults: { ease: "power3.out", duration: 1 } });
  tl.from(".eyebrow", { y: 16, opacity: 0 })
    .from(".hero__headline .line span", { yPercent: 110, opacity: 0, duration: 1.1 }, "-=0.6")
    .from(".hero__sub", { y: 20, opacity: 0 }, "-=0.7")
    .from(".hero__cta", { y: 20, opacity: 0 }, "-=0.7")
    .from(".hero__gallery figure", { y: 40, opacity: 0, stagger: 0.08, duration: 0.8 }, "-=0.5")
    .from(".hero__blob", { scale: 0.6, opacity: 0, duration: 1.4, ease: "power2.out" }, 0);
}

export function capabilitiesReveal() {
  ScrollTrigger.create({
    trigger: ".capabilities",
    start: "top 85%",
    onEnter: () =>
      gsap.from(".pill", {
        y: 18,
        opacity: 0,
        stagger: 0.05,
        duration: 0.6,
        ease: "power2.out",
      }),
    once: true,
  });
}

export function initWorkScroll(dir: "ltr" | "rtl") {
  if (workScrollTrigger) {
    workScrollTrigger.kill();
    workScrollTrigger = null;
  }

  const pin = document.querySelector<HTMLElement>(".work__pin");
  const track = document.getElementById("workTrack");
  const progress = document.getElementById("scrollProgress");
  if (!pin || !track) return;

  gsap.set(track, { x: 0 });
  if (progress) gsap.set(progress, { scaleX: 0.2, transformOrigin: dir === "rtl" ? "right" : "left" });

  requestAnimationFrame(() => {
    const distance = Math.max(track.scrollWidth - pin.clientWidth, 0);
    if (distance <= 0) return;
    const sign = dir === "rtl" ? 1 : -1;

    workScrollTrigger = ScrollTrigger.create({
      trigger: pin,
      start: "top top",
      end: () => `+=${distance}`,
      pin: true,
      scrub: 0.8,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        gsap.set(track, { x: sign * distance * self.progress });
        if (progress) gsap.set(progress, { scaleX: 0.2 + self.progress * 0.8 });
      },
    });
  });
}

export function projectCardsReveal() {
  gsap.utils.toArray<HTMLElement>(".project-card").forEach((card, i) => {
    gsap.from(card, {
      opacity: 0,
      y: 30,
      duration: 0.7,
      delay: i * 0.05,
      ease: "power2.out",
    });
  });
}

export function sectionReveal() {
  revealTriggers.forEach((t) => t.kill());
  revealTriggers = [];

  document.querySelectorAll<HTMLElement>(".about .reveal, .contact .reveal").forEach((el) => {
    gsap.set(el, { opacity: 1, y: 0 });
    const anim = gsap.from(el, {
      y: 30,
      opacity: 0,
      duration: 0.8,
      ease: "power2.out",
      scrollTrigger: {
        trigger: el,
        start: "top 88%",
      },
    });
    if (anim.scrollTrigger) revealTriggers.push(anim.scrollTrigger);
  });

  gsap.utils.toArray<HTMLElement>(".timeline li").forEach((li, i) => {
    gsap.set(li, { opacity: 1, x: 0 });
    const anim = gsap.from(li, {
      x: 16,
      opacity: 0,
      duration: 0.5,
      delay: i * 0.04,
      ease: "power2.out",
      scrollTrigger: {
        trigger: li,
        start: "top 92%",
      },
    });
    if (anim.scrollTrigger) revealTriggers.push(anim.scrollTrigger);
  });
}

export function refresh() {
  ScrollTrigger.refresh();
}

export function openModalAnimation() {
  const modal = document.getElementById("projectModal")!;
  const panel = document.getElementById("modalPanel")!;
  const backdrop = document.getElementById("modalBackdrop")!;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  gsap.to(backdrop, { opacity: 1, duration: 0.35, ease: "power1.out" });
  gsap.fromTo(
    panel,
    { opacity: 0, y: 40 },
    { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }
  );
}

export function closeModalAnimation(onComplete: () => void) {
  const modal = document.getElementById("projectModal")!;
  const panel = document.getElementById("modalPanel")!;
  const backdrop = document.getElementById("modalBackdrop")!;

  gsap.to(backdrop, { opacity: 0, duration: 0.3, ease: "power1.in" });
  gsap.to(panel, {
    opacity: 0,
    y: 30,
    duration: 0.3,
    ease: "power1.in",
    onComplete: () => {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      onComplete();
    },
  });
}
