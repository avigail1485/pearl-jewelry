// The app scrolls inside its own phone-sized frame (iPhone 17: 402×874), not the window.
export const scroller = () => document.getElementById("scroll-root");
export const frameEl = () => document.getElementById("app-frame") ?? document.body;
export const scrollTop = () => scroller()?.scrollTop ?? 0;
export const scrollToTop = () => scroller()?.scrollTo({ top: 0 });
