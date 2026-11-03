import './styles/index.css';
import './styles/specimen.css';
import { he } from './content/he';
import { ASSETS, fontStatus, markMissingAssets } from './core/assets';
import { mountGridOverlay } from './ui/grid-overlay';

const root = document.getElementById('specimen')!;

const colors = [
  ['--brand', '#E84B25', 'צבע המותג'],
  ['--ink', '#1D1D1B', 'רקע ראשי'],
  ['--black', '#000000', 'עומק, טקסט על כתום'],
  ['--grey', '#575756', 'שכבות עומק, 36%'],
  ['--white', '#FFFFFF', 'טקסט, קווי מתאר'],
] as const;

const scale = [
  ['t-mega', 'Bold', '5'],
  ['t-h1', 'Bold', he.hero.h1],
  ['t-h2', 'Bold', he.gears[0].h2],
  ['t-h3', 'Bold', he.lights.title],
  ['t-sub', 'Regular', he.hero.domains],
  ['t-hud', 'Light', he.hero.hint],
  ['t-body', 'Google Sans 400', he.contact.sub],
  ['t-small', 'Google Sans 400', he.contact.error],
] as const;

root.innerHTML = `
  <section class="sp-sec grid">
    <p class="sp-label t-hud">00 / מערכת עיצוב</p>
    <h1 class="sp-full t-h1">${he.hero.h1}</h1>
    <p class="sp-full t-sub">${he.hero.domains}</p>
    <ul class="sp-full sp-fonts t-small" id="font-status"></ul>
  </section>

  <section class="sp-sec grid" aria-label="לוגו">
    <p class="sp-label t-hud">01 / לוגו</p>
    <figure class="sp-logo sp-logo--dark"><img src="${ASSETS.logoOnDark}" alt="DYNAMICS על רקע כהה" /></figure>
    <figure class="sp-logo sp-logo--light"><img src="${ASSETS.logoOnLight}" alt="DYNAMICS על רקע בהיר" /></figure>
    <figure class="sp-logo sp-logo--c"><img src="${ASSETS.cMark}" alt="ה-C של DYNAMICS" /></figure>
    <figure class="sp-logo sp-logo--dark sp-logo--stack"><img src="/assets/brand/logo-stacked-on-dark.svg" alt="DYNAMICS, גרסה מוערמת" /></figure>
    <figure class="sp-logo sp-logo--light sp-logo--stack"><img src="/assets/brand/logo-stacked-on-light.svg" alt="DYNAMICS, גרסה מוערמת על בהיר" /></figure>
    <figure class="sp-pattern sp-pattern--src"><img src="${ASSETS.pattern}" alt="גרפיקת המותג, מקור המסלול" /></figure>
    <figure class="sp-pattern sp-pattern--track" id="track-preview" aria-label="קו המירוץ הראשי מסומן"></figure>
  </section>

  <section class="sp-sec grid" aria-label="צבעים">
    <p class="sp-label t-hud">02 / צבע</p>
    ${colors.map(([t, v, use]) => `
      <div class="sp-swatch" style="--c: var(${t})">
        <span class="sp-chip"></span>
        <p class="t-hud t-num">${t} ${v}</p>
        <p class="t-small">${use}</p>
      </div>`).join('')}
    <div class="sp-full sp-contrast">
      <p class="sp-on-brand t-body">${he.lights.title} טקסט רץ על כתום הוא שחור.</p>
      <p class="sp-on-brand-big t-h2">${he.lights.out}</p>
      <p class="sp-brand-on-ink t-h2">${he.finish.title}</p>
    </div>
  </section>

  <section class="sp-sec grid" aria-label="סולם טיפוגרפי">
    <p class="sp-label t-hud">03 / טיפוגרפיה</p>
    ${scale.map(([cls, face, text]) => `
      <div class="sp-row">
        <p class="sp-meta t-hud t-num" data-measure="${cls}">.${cls} / ${face}</p>
        <p class="${cls}">${text}</p>
      </div>`).join('')}
  </section>

  <section class="sp-sec grid" aria-label="כל הטקסטים">
    <p class="sp-label t-hud">04 / הילוכים</p>
    ${he.gears.map((g) => `
      <article class="sp-gear">
        <p class="t-mega t-num sp-gear__n">${g.n}</p>
        <h2 class="t-h2">${g.h2}</h2>
        <p class="t-sub">${g.line}</p>
        <ul class="sp-tags t-hud">${g.tags.map((t) => `<li>${t}</li>`).join('')}</ul>
        <p class="t-small sp-cue">${g.cue}</p>
      </article>`).join('')}
  </section>

  <section class="sp-sec grid" aria-label="מיקרו">
    <p class="sp-label t-hud">05 / מיקרו וסיום</p>
    <div class="sp-full sp-micro t-sub">
      ${[he.loading, he.ignition.hold, he.ignition.skip, he.micro.reverse, he.micro.shortcut, he.micro.soundOn, he.micro.soundOff, he.finish.lap('01:42.7'), he.finish.best('01:39.3'), he.finish.again].map((t) => `<span>${t}</span>`).join('')}
    </div>
    <p class="sp-full t-small">${he.billboards.join(' / ')}</p>
    <p class="sp-full t-small">${he.ideas.join(' / ')}</p>
    <a class="sp-cta t-h3" href="/contact/">${he.finish.cta}</a>
  </section>
`;

markMissingAssets(root);

// בדיקת מקור המסלול: מסמנים את קו המירוץ הראשי (ה-path הלבן הארוך) ואת קווי העזר.
fetch(ASSETS.pattern).then((r) => r.text()).then((svg) => {
  const fig = document.getElementById('track-preview')!;
  fig.innerHTML = svg;
  const whites = [...fig.querySelectorAll<SVGPathElement>('path[stroke="white"]')];
  const main = whites.reduce((a, b) => (b.getTotalLength() > a.getTotalLength() ? b : a));
  whites.forEach((p) => p.setAttribute('opacity', '0.35'));
  main.setAttribute('stroke', 'var(--white)');
  main.setAttribute('stroke-width', '4');
  main.removeAttribute('opacity');
  fig.dataset.main = main.getAttribute('d')!.slice(0, 12);
});
mountGridOverlay();

fontStatus().then((s) => {
  const ul = document.getElementById('font-status')!;
  const row = (name: string, ok: boolean) => `<li data-ok="${ok}">${ok ? '✓' : '✗'} <bdi>Tel Aviv Brutalist ${name}</bdi>${ok ? '' : ' (חסר, מוצג פונט חלופי)'}</li>`;
  const gs = document.fonts.check('400 1em "Google Sans"', 'א');
  ul.innerHTML = row('Bold', s.bold) + row('Regular', s.regular) + row('Light', s.light) +
    `<li data-ok="${gs}">${gs ? '✓' : '✗'} <bdi>Google Sans (hebrew, latin)</bdi></li>`;
  document.querySelectorAll<HTMLElement>('[data-measure]').forEach((el) => {
    const target = el.nextElementSibling as HTMLElement;
    const px = parseFloat(getComputedStyle(target).fontSize);
    el.textContent += ` / ${Math.round(px)}px`;
  });
  document.documentElement.dataset.ready = '1';
});
