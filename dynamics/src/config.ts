/** כתובת האתר המלא. כל עוד null, שום כפתור לאתר המלא לא מופיע (סעיף 10). */
export const FULL_SITE_URL: string | null = null;

export const CONTACT = {
  phoneDisplay: '053-3179024',
  phoneHref: 'tel:+972533179024',
  email: 'a0533179024@gmail.com',
} as const;

export const WEB3FORMS_KEY: string = import.meta.env.VITE_WEB3FORMS_KEY ?? '';

export const STORAGE_KEYS = {
  bestLap: 'dynamics.bestLap',
  sound: 'dynamics.sound',
  reverseHintSeen: 'dynamics.reverseHint',
} as const;
