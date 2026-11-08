// GSAP motion for the app: cards rise in as they scroll into view, pages slide in,
// the home illustration drifts with the scroll, hearts pop, empty-state characters bounce in.
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useLayoutEffect, type RefObject } from "react";

gsap.registerPlugin(ScrollTrigger);
const scroller = () => document.getElementById("scroll-root") ?? undefined;

/** Reveal every [data-reveal] element inside `ref` as it scrolls into view (batched, staggered). */
export function useScrollReveal(ref: RefObject<HTMLElement>, deps: unknown[] = []) {
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      const els = gsap.utils.toArray<HTMLElement>("[data-reveal]", root).filter((e) => !e.dataset.revealed);
      if (!els.length) return;
      gsap.set(els, { autoAlpha: 0, y: 28, scale: 0.97 });
      ScrollTrigger.batch(els, {
        scroller: scroller(),
        start: "top 96%",
        once: true,
        onEnter: (batch) => {
          batch.forEach((e) => ((e as HTMLElement).dataset.revealed = "1"));
          gsap.to(batch, { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, ease: "power3.out", stagger: 0.07, overwrite: true });
        },
      });
      // cards that start inside a horizontal row reveal as the row is scrolled sideways too
      ScrollTrigger.refresh();
    }, root);
    return () => ctx.revert();
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}

/** Parallax: the element drifts up and fades a little as the page scrolls past it. */
export function useParallax(ref: RefObject<HTMLElement>) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.to(el, {
        yPercent: -18, scale: 0.94, opacity: 0.35, ease: "none",
        scrollTrigger: { trigger: el, scroller: scroller(), start: "top top+=120", end: "bottom top", scrub: 0.6 },
      });
    });
    return () => ctx.revert();
  }, [ref]);
}

/** Page entrance on every route change. */
export function pageIn(el: HTMLElement | null) {
  if (!el) return;
  gsap.fromTo(el, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.42, ease: "power2.out", clearProps: "transform,opacity,visibility" });
}

/** Slide step content in from the direction of travel (RTL: next comes from the left). */
export function stepIn(el: HTMLElement | null, dir: 1 | -1) {
  if (!el) return;
  gsap.fromTo(el, { autoAlpha: 0, x: -32 * dir }, { autoAlpha: 1, x: 0, duration: 0.45, ease: "power3.out", clearProps: "transform,opacity,visibility" });
}

/** A bouncy entrance for a character or a confirmation. */
export function popIn(el: Element | null, delay = 0) {
  if (!el) return;
  gsap.fromTo(el, { autoAlpha: 0, scale: 0.6, y: 20 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.7, delay, ease: "back.out(1.8)", clearProps: "transform,opacity,visibility" });
}

/** The heart pops when an item is saved. */
export function heartPop(el: Element | null) {
  if (!el) return;
  gsap.timeline()
    .to(el, { scale: 0.7, duration: 0.08, ease: "power1.in" })
    .to(el, { scale: 1.25, duration: 0.18, ease: "power2.out" })
    .to(el, { scale: 1, duration: 0.35, ease: "elastic.out(1, 0.4)" });
}

export function usePopIn(ref: RefObject<Element>, deps: unknown[] = []) {
  useEffect(() => { popIn(ref.current); }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}

export { gsap, ScrollTrigger };
