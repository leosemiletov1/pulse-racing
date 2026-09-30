// Builds the popup cards from the `popup` field of each stop in config/tour.js.
// Text fields may contain simple HTML (<strong>, <em>, <a>, <br>).

const h = (tag, cls, html) => {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (html != null) el.innerHTML = html;
  return el;
};

const initials = (name) =>
  name.replace(/[^\p{L}\s]/gu, '').split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';

export function buildPopup(stop) {
  const p = stop.popup;
  const hero = p.style === 'hero';
  const wrap = h('section', `popup popup--${hero ? 'hero' : p.side || 'left'}`);
  wrap.id = `popup-${stop.id}`;
  wrap.setAttribute('aria-label', p.title || stop.label || stop.id);
  const card = wrap.appendChild(h('div', 'popup__card'));

  if (p.kicker) card.append(h('div', 'popup__kicker', p.kicker));
  if (p.title) card.append(h(hero ? 'h1' : 'h2', 'popup__title', p.title));
  for (const para of [].concat(p.text || [])) card.append(h('p', 'popup__text', para));

  if (p.bullets?.length) {
    const ul = h('ul', 'popup__bullets');
    p.bullets.forEach((b) => ul.append(h('li', null, b)));
    card.append(ul);
  }

  if (p.stats?.length) {
    const grid = h('div', 'stats');
    p.stats.forEach((s) => {
      const cell = h('div', 'stat');
      cell.append(h('b', null, s.value), h('small', null, s.label));
      grid.append(cell);
    });
    card.append(grid);
  }

  if (p.table) {
    const t = h('table', 'popup__table');
    const head = t.createTHead().insertRow();
    p.table.columns.forEach((c) => head.append(h('th', null, c)));
    const body = t.createTBody();
    p.table.rows.forEach((r) => {
      const tr = body.insertRow();
      r.forEach((c) => tr.append(h('td', null, c)));
    });
    card.append(t);
  }

  if (p.members?.length) {
    const grid = h('div', 'members');
    p.members.forEach((m) => {
      const row = h('div', 'member');
      const av = h('div', 'member__avatar');
      if (m.photo) {
        const img = new Image();
        img.src = m.photo;
        img.alt = m.name;
        img.loading = 'lazy';
        av.append(img);
      } else {
        av.textContent = initials(m.name);
      }
      const info = h('div');
      info.append(h('div', 'member__name', m.name), h('div', 'member__role', m.role || ''));
      row.append(av, info);
      if (m.bio) row.append(h('div', 'member__bio', m.bio));
      grid.append(row);
    });
    card.append(grid);
  }

  if (p.sponsors?.length) {
    const list = h('div', 'sponsors');
    p.sponsors.forEach((s) => {
      const item = h(s.url ? 'a' : 'div', 'sponsor');
      if (s.url) Object.assign(item, { href: s.url, target: '_blank', rel: 'noopener' });
      const logo = h('div', 'sponsor__logo');
      const wordmark = () => { logo.textContent = s.name; logo.classList.add('sponsor__logo--text'); };
      if (s.logo) {
        const img = new Image();
        img.src = s.logo;
        img.alt = `${s.name} logo`;
        img.onerror = wordmark; // no file yet: show the name instead
        logo.append(img);
      } else wordmark();
      const info = h('div', 'sponsor__info');
      info.append(h('div', 'sponsor__name', s.name));
      if (s.tier) info.append(h('div', 'sponsor__tier', s.tier));
      if (s.description) info.append(h('p', 'sponsor__desc', s.description));
      item.append(logo, info);
      list.append(item);
    });
    card.append(list);
  }

  // Tiers are collapsible: click a tier to see its benefits. `open: true` starts it expanded.
  if (p.tiers?.length) {
    const tiers = h('div', 'tiers');
    p.tiers.forEach((t) => {
      const tier = h('details', `tier${t.highlight ? ' tier--highlight' : ''}`);
      tier.open = !!t.open;
      const head = h('summary', 'tier__head');
      head.append(h('span', 'tier__name', t.name), h('span', 'tier__price', t.price || ''));
      tier.append(head);
      if (t.qualifies) tier.append(h('p', 'tier__note', `<b>Qualifies with:</b> ${t.qualifies}`));
      if (t.examples) tier.append(h('p', 'tier__note', `<b>Examples:</b> ${t.examples}`));
      if (t.perks?.length) {
        const ul = h('ul');
        t.perks.forEach((perk) => ul.append(h('li', null, perk)));
        tier.append(ul);
      }
      tiers.append(tier);
    });
    card.append(tiers);
  }

  if (p.cta) {
    const a = h('a', 'cta', `${p.cta.label} <span aria-hidden="true">→</span>`);
    a.href = p.cta.href;
    card.append(a);
  }

  if (hero) card.append(h('div', 'scroll-hint', '<i></i>Scroll to explore'));

  // Photos that pop up around the card. No `src` = a placeholder frame.
  (p.photos || []).forEach((ph, i) => {
    const fig = h('figure', 'photo');
    fig.style.setProperty('--i', i);
    fig.style.setProperty('--tilt', `${[-3, 2.5, -1.5, 3, -2][i % 5]}deg`);
    if (ph.src) {
      const img = new Image();
      img.src = ph.src;
      img.alt = ph.caption || '';
      img.loading = 'lazy';
      fig.append(img);
    } else {
      fig.classList.add('photo--empty');
      fig.append(h('div', 'photo__icon', '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/></svg>'));
    }
    if (ph.caption) fig.append(h('figcaption', null, ph.caption));
    wrap.append(fig);
  });

  return wrap;
}

/* Place the photos in free space around the card: above, below, then beside it
   (on the side facing the car), skipping any spot that would leave the screen
   or overlap another photo. Photos that don't fit anywhere are hidden. */
export function layoutPhotos(wrap) {
  const photos = [...wrap.querySelectorAll(':scope > .photo')];
  if (!photos.length) return;
  const vw = innerWidth, vh = innerHeight;
  const portrait = vw / vh < 0.9;
  const r = wrap.getBoundingClientRect(); // only the inner card animates, so this is the resting position
  const PW = photos[0].offsetWidth, PH = photos[0].offsetHeight;
  const gap = 16;
  const out = wrap.classList.contains('popup--right') ? -1 : 1; // side facing the car
  const fromInner = (dx) => (out > 0 ? r.left + dx : r.right - dx - PW);
  const beside = (dx) => (out > 0 ? r.right + dx : r.left - dx - PW);

  const slots = portrait
    ? [0, 1, 2, 3].map((k) => [16 + k * (PW + 10), r.top - PH - 14])
    : [
        [fromInner(8), r.top - PH - gap],
        [fromInner(70), r.bottom + gap],
        [beside(26), r.top + 8],
        [fromInner(PW + 34), r.top - PH - gap - 10],
        [fromInner(PW + 110), r.bottom + gap + 6],
        [beside(26), r.bottom - PH - 8],
        [beside(70), r.top + r.height / 2 - PH / 2],
      ];

  const placed = [];
  const fits = ([x, y]) =>
    x >= 12 && y >= 64 && x + PW <= vw - (portrait ? 12 : 70) && y + PH <= vh - 12 &&
    placed.every(([px, py]) => x + PW + 8 < px || px + PW + 8 < x || y + PH + 8 < py || py + PH + 8 < y);

  photos.forEach((ph) => {
    const slot = slots.find((s) => fits(s));
    if (!slot) { ph.hidden = true; return; }
    placed.push(slot);
    ph.hidden = false;
    ph.style.left = `${slot[0] - r.left}px`;
    ph.style.top = `${slot[1] - r.top}px`;
  });
}
