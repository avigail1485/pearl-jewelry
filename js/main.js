/* Tamar Design Studio — interactions & GSAP animations */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
    }

    initNavScroll();
    initMobileMenu();
    initHeroEntrance();
    initReveals();
    initScroller();
    initCursorPreview();
    initWorkPage();
    initForms();

    if (window.ScrollTrigger) {
      window.addEventListener("load", () => ScrollTrigger.refresh());
      setTimeout(() => ScrollTrigger.refresh(), 400);
    }

    document.addEventListener("langchange", () => {
      renderWorkGrid(getActiveFilter());
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
  }

  /* ---------------- Nav ---------------- */
  function initNavScroll() {
    const nav = document.getElementById("siteNav");
    if (!nav) return;
    const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function initMobileMenu() {
    const burger = document.getElementById("burger");
    const menu = document.getElementById("mobileMenu");
    if (!burger || !menu) return;
    const close = () => {
      burger.classList.remove("is-open");
      menu.classList.remove("is-open");
      document.body.classList.remove("no-scroll");
    };
    burger.addEventListener("click", () => {
      const open = burger.classList.toggle("is-open");
      menu.classList.toggle("is-open", open);
      document.body.classList.toggle("no-scroll", open);
    });
    menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));
  }

  /* ---------------- Hero entrance (home page) ---------------- */
  function initHeroEntrance() {
    const heroCard = document.getElementById("heroCard");
    const heroVisual = document.getElementById("heroVisual");
    if (!heroCard || !heroVisual || !window.gsap) return;

    const tl = gsap.timeline({ defaults: { ease: "power3.out", duration: 0.9 } });
    tl.from(heroCard.querySelector(".eyebrow"), { opacity: 0, y: 18 })
      .from(heroCard.querySelectorAll(".hero-title span"), { opacity: 0, y: 34, stagger: 0.12 }, "-=0.55")
      .from(heroCard.querySelector(".hero-sub"), { opacity: 0, y: 18 }, "-=0.5")
      .from(heroCard.querySelector(".hero-cta-row"), { opacity: 0, y: 18 }, "-=0.5")
      .from(heroCard.querySelector(".hero-meta"), { opacity: 0, y: 18 }, "-=0.5")
      .from(heroVisual, { opacity: 0, x: 32, duration: 1.05 }, "-=0.85")
      .from(heroVisual.querySelectorAll(".floating-badge"), { opacity: 0, y: 12, stagger: 0.1 }, "-=0.5")
      .from(heroVisual.querySelector(".hero-visual-caption"), { opacity: 0, y: 12 }, "-=0.4");
  }

  /* ---------------- Scroll reveals ---------------- */
  function initReveals() {
    if (!window.gsap || !window.ScrollTrigger) return;
    document.querySelectorAll("[data-reveal]").forEach((el) => {
      const type = el.getAttribute("data-reveal");
      const delay = parseFloat(el.getAttribute("data-reveal-delay") || "0");
      const fromVars = { opacity: 0 };
      if (type === "fade-up") fromVars.y = 32;
      if (type === "scale") { fromVars.scale = 0.65; fromVars.y = 0; }
      gsap.set(el, fromVars);
      ScrollTrigger.create({
        trigger: el,
        start: "top 88%",
        once: true,
        onEnter: () => gsap.to(el, { opacity: 1, y: 0, scale: 1, duration: 0.85, delay, ease: "power3.out" }),
      });
    });
  }

  /* ---------------- Horizontal scrolling cards ---------------- */
  function initScroller() {
    const track = document.getElementById("scrollerTrack");
    if (!track) return;
    const pin = track.closest(".scroller-pin");

    if (window.innerWidth > 900 && window.gsap && window.ScrollTrigger) {
      pin.style.overflow = "hidden";
      const getDistance = () => Math.max(track.scrollWidth - window.innerWidth, 0);
      gsap.to(track, {
        x: () => -getDistance(),
        ease: "none",
        scrollTrigger: {
          trigger: pin,
          start: "top top",
          end: () => "+=" + getDistance(),
          scrub: 0.6,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
    } else {
      pin.style.overflowX = "auto";
      pin.style.scrollSnapType = "x proximity";
      track.style.paddingBottom = "8px";
    }
  }

  /* ---------------- Cursor-follow preview (work table) ---------------- */
  function initCursorPreview() {
    const preview = document.getElementById("cursorPreview");
    const img = document.getElementById("cursorPreviewImg");
    const rows = document.querySelectorAll(".work-row[data-preview]");
    if (!preview || !img || !rows.length || !window.gsap) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const xTo = gsap.quickTo(preview, "x", { duration: 0.45, ease: "power3" });
    const yTo = gsap.quickTo(preview, "y", { duration: 0.45, ease: "power3" });

    window.addEventListener("mousemove", (e) => {
      xTo(e.clientX + 26);
      yTo(e.clientY - 150);
    });

    rows.forEach((row) => {
      row.addEventListener("mouseenter", () => {
        img.src = row.getAttribute("data-preview");
        gsap.to(preview, { opacity: 1, duration: 0.3 });
        gsap.to(img, { opacity: 1, duration: 0.3 });
      });
      row.addEventListener("mouseleave", () => {
        gsap.to(preview, { opacity: 0, duration: 0.3 });
      });
    });
  }

  /* ---------------- Work page: grid, filters, lightbox ---------------- */
  let currentLightboxProject = null;

  function getActiveFilter() {
    const active = document.querySelector(".filter-pill.active");
    return active ? active.getAttribute("data-filter") : "all";
  }

  function filterLabel(category, lang) {
    const dict = window.TDS_I18N ? window.TDS_I18N.dict : null;
    if (!dict) return category;
    const strings = dict[lang] || dict.en;
    return strings["filter." + category] || category;
  }

  function renderWorkGrid(filter) {
    const grid = document.getElementById("workGrid");
    if (!grid || !window.TDS_PROJECTS) return;
    const lang = window.TDS_I18N ? window.TDS_I18N.getLang() : "en";
    grid.innerHTML = "";

    window.TDS_PROJECTS.forEach((p) => {
      if (filter !== "all" && p.category !== filter) return;
      const card = document.createElement("div");
      card.className = "work-card";
      card.innerHTML =
        '<div class="thumb"><img src="' + p.image + '" alt="' + p.title[lang] + '" loading="lazy"></div>' +
        '<div class="body"><span class="cat">' + filterLabel(p.category, lang) + '</span><h3>' + p.title[lang] + "</h3></div>";
      card.addEventListener("click", () => openLightbox(p));
      grid.appendChild(card);
    });

    if (window.gsap) {
      gsap.fromTo(grid.children, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.55, stagger: 0.045, ease: "power2.out" });
    }
  }

  function openLightbox(project) {
    currentLightboxProject = project;
    const lang = window.TDS_I18N ? window.TDS_I18N.getLang() : "en";
    const lightbox = document.getElementById("lightbox");
    if (!lightbox) return;
    document.getElementById("lightboxImg").src = project.image;
    document.getElementById("lightboxImg").alt = project.title[lang];
    document.getElementById("lightboxCat").textContent = filterLabel(project.category, lang);
    document.getElementById("lightboxTitle").textContent = project.title[lang];
    document.getElementById("lightboxDesc").textContent = project.desc[lang];
    document.getElementById("lightboxYear").textContent = project.year;
    lightbox.classList.add("is-open");
    document.body.classList.add("no-scroll");
  }

  function closeLightbox() {
    const lightbox = document.getElementById("lightbox");
    if (!lightbox) return;
    lightbox.classList.remove("is-open");
    document.body.classList.remove("no-scroll");
    currentLightboxProject = null;
  }

  function initWorkPage() {
    const grid = document.getElementById("workGrid");
    if (!grid) return;

    renderWorkGrid("all");

    document.querySelectorAll(".filter-pill").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".filter-pill").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        renderWorkGrid(btn.getAttribute("data-filter"));
      });
    });

    const lightbox = document.getElementById("lightbox");
    const closeBtn = document.getElementById("lightboxClose");
    if (closeBtn) closeBtn.addEventListener("click", closeLightbox);
    if (lightbox) {
      lightbox.addEventListener("click", (e) => {
        if (e.target === lightbox) closeLightbox();
      });
    }
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeLightbox();
    });
  }

  /* keep lightbox in sync with language changes */
  document.addEventListener("langchange", () => {
    if (currentLightboxProject) openLightbox(currentLightboxProject);
  });

  /* ---------------- Forms (mailto fallback, no backend) ---------------- */
  function initForms() {
    document.querySelectorAll("#footerForm").forEach((form) => {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = form.querySelector('input[type="email"]').value;
        const body = "Reply-to email: " + email;
        window.location.href = "mailto:tamarfinkel525@gmail.com?subject=" + encodeURIComponent("Project Inquiry") + "&body=" + encodeURIComponent(body);
      });
    });

    const contactForm = document.getElementById("contactForm");
    if (contactForm) {
      contactForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const data = new FormData(contactForm);
        const name = data.get("name") || "";
        const email = data.get("email") || "";
        const subject = data.get("subject") || "New project inquiry";
        const message = data.get("message") || "";
        const body = "Name: " + name + "\nEmail: " + email + "\n\n" + message;
        window.location.href = "mailto:tamarfinkel525@gmail.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      });
    }
  }
})();
