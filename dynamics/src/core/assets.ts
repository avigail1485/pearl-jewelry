/** נתיב לנכס מתיקיית public, יחסי לבסיס הבנייה (עובד גם כשהאתר לא יושב בשורש הדומיין). */
export const asset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;

/** נכסי הלקוחה. אם קובץ חסר מסמנים זאת בבירור במקום להחליף בשקט. */
export const ASSETS = {
  logoOnDark: asset('/assets/brand/logo-on-dark.svg'),
  logoOnLight: asset('/assets/brand/logo-on-light.svg'),
  cMark: asset('/assets/brand/logo-c-mark.svg'),
  pattern: asset('/assets/brand/brand-pattern.svg'),
  fonts: {
    bold: asset('/assets/fonts/TelAvivBrutalist-Bold.ttf'),
    regular: asset('/assets/fonts/TelAvivBrutalist-Regular.ttf'),
    light: asset('/assets/fonts/TelAvivBrutalist-Light.ttf'),
  },
} as const;

export function markMissingAssets(root: ParentNode = document) {
  root.querySelectorAll<HTMLImageElement>('img[src*="assets/"]').forEach((img) => {
    const flag = () => {
      img.dataset.missing = img.getAttribute('src') ?? '';
      const box = img.closest<HTMLElement>('a, figure');
      box?.classList.add('is-missing-asset');
      box?.setAttribute('data-missing-label', (img.getAttribute('src') ?? '').split('/').pop() ?? '');
    };
    if (img.complete && img.naturalWidth === 0) flag();
    else img.addEventListener('error', flag, { once: true });
  });
}

export async function fontStatus() {
  await document.fonts.ready;
  return {
    bold: document.fonts.check('700 1em "Tel Aviv Brutalist"', 'א'),
    regular: document.fonts.check('400 1em "Tel Aviv Brutalist"', 'א'),
    light: document.fonts.check('300 1em "Tel Aviv Brutalist"', 'א'),
  };
}
