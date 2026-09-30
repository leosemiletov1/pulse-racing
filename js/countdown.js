// Live countdown to the date in config/tour.js (countdown.date), shown in the top bar.
export function startCountdown(el, cfg) {
  if (!el || !cfg?.date) return;
  const target = new Date(cfg.date).getTime();
  if (Number.isNaN(target)) return console.warn('countdown.date is not a valid date:', cfg.date);
  el.innerHTML = `<span class="countdown__label"></span><span class="countdown__time"></span>`;
  const [label, time] = el.children;
  label.textContent = cfg.label ?? '';
  const pad = (n) => String(n).padStart(2, '0');

  function tick() {
    const s = Math.floor((target - Date.now()) / 1000);
    if (s <= 0) {
      if (!cfg.after) return (el.hidden = true);
      label.textContent = '';
      time.textContent = cfg.after;
      return;
    }
    const d = Math.floor(s / 86400), h = Math.floor(s / 3600) % 24, m = Math.floor(s / 60) % 60;
    time.innerHTML = `${d}<small>d</small> ${pad(h)}<small>h</small> <span class="countdown__m">${pad(m)}<small>m</small></span> <span class="countdown__s">${pad(s % 60)}<small>s</small></span>`;
    setTimeout(tick, 1000 - (Date.now() % 1000));
  }
  el.setAttribute('aria-label', `Countdown to ${cfg.label ?? 'race day'}`);
  el.hidden = false;
  tick();
}
