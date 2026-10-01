// Fills sponsor.html from config/sponsorship.js (partners, tiers, email, GoFundMe).
import TOUR from '../config/tour.js';
import SPONSORSHIP from '../config/sponsorship.js';
import { renderSponsors, renderTiers } from './popups.js';

const $ = (id) => document.getElementById(id);

// Branding, kept in sync with config/tour.js
document.documentElement.style.setProperty('--accent', TOUR.brand.accent);
$('brand').textContent = TOUR.brand.teamName;
$('footer-name').textContent = `${TOUR.brand.teamName} · ${TOUR.brand.tagline}`;
document.title = `Sponsor ${TOUR.brand.teamName}`;

// Partners and tiers
$('partner-list').append(renderSponsors(SPONSORSHIP.sponsors));
$('monetary-tiers').append(renderTiers(SPONSORSHIP.monetaryTiers, { allOpen: true }));
$('equipment-tiers').append(renderTiers(SPONSORSHIP.equipmentTiers, { allOpen: true }));

// GoFundMe: disabled "coming soon" button until a link is set
const gofundme = $('gofundme');
if (SPONSORSHIP.gofundme) {
  Object.assign(gofundme, { href: SPONSORSHIP.gofundme, target: '_blank', rel: 'noopener' });
} else {
  gofundme.removeAttribute('href');
  gofundme.classList.add('cta--disabled');
  gofundme.setAttribute('aria-disabled', 'true');
  gofundme.textContent = 'GoFundMe link coming soon';
}

// Enquiry email
const email = SPONSORSHIP.email;
const mailto = `mailto:${email}?subject=${encodeURIComponent(`Sponsoring ${TOUR.brand.teamName}`)}`;
$('email-link').textContent = email;
$('email-link').href = mailto;
$('email-button').href = mailto;
$('copy-email').addEventListener('click', async (e) => {
  try {
    await navigator.clipboard.writeText(email);
    e.target.textContent = 'Copied!';
  } catch {
    prompt('Copy this email address:', email);
  }
  setTimeout(() => (e.target.textContent = 'Copy email'), 1500);
});
