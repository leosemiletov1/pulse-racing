/* ==========================================================================
   SPONSORSHIP: one place for partners, tiers and contact details.
   Used by BOTH the sponsor page (sponsor.html) and the 3D tour popups,
   so a change here updates everywhere.
   ========================================================================== */

export default {
  // Sponsorship enquiries (shown on the sponsor page and used by every "Become a sponsor" button)
  email: 'Zhang-C-25@kcs.org.uk',

  // Individual donations. Leave '' until the page exists; the button shows "coming soon".
  gofundme: '',

  // Current partners. logo: file in assets/sponsors/ (the name is shown if the file is missing).
  sponsors: [
    {
      name: 'Quintilia',
      tier: 'Title Sponsor · £500',
      logo: 'assets/sponsors/quintilia.png',
      url: 'https://www.quintilia.com',
      description: 'World-class admissions consulting, guiding students through US and Oxbridge university applications.',
    },
    {
      name: 'SimScale',
      tier: 'Pole Position Partner · £5,000 in simulation credits',
      logo: 'assets/sponsors/simscale.svg',
      url: 'https://www.simscale.com',
      description: 'Cloud-based engineering simulation. Their credits power the CFD runs behind every aerodynamic change on our car.',
    },
    {
      name: 'The Maris Practice',
      tier: 'Gold Sponsor · £150',
      logo: 'assets/sponsors/maris.jpg',
      url: 'https://themarispractice.com',
      description: 'Natural health and wellbeing clinic in Twickenham, offering osteopathy, acupuncture and other complementary therapies since 2001.',
    },
  ],

  // Monetary sponsorship tiers
  monetaryTiers: [
    {
      name: 'Title Sponsor', price: '£500+', highlight: true,
      perks: [
        'Naming rights: [Your Company] PULSE Racing',
        'Premium large car logo placement',
        'Largest pit display logo',
        'Largest Enterprise Portfolio logo placement',
        'Advertisement on our social media account',
        'Largest logo on uniforms',
        '(Optional) One-to-one updates on progress',
      ],
    },
    {
      name: 'Platinum Sponsor', price: '£250+',
      perks: [
        'Premium large car logo placement',
        'Premium large pit display logo',
        'Premium large Enterprise Portfolio placement',
        'Advertisement on our social media account',
        'Premium large logo on uniforms',
        '(Optional) One-to-one updates on progress',
      ],
    },
    {
      name: 'Gold Sponsor', price: '£100+',
      perks: [
        'Medium car logo placement',
        'Medium pit display logo',
        'Medium Enterprise Portfolio placement',
        'Advertisement on our social media account',
        'Medium logo on uniforms',
        '(Optional) One-to-one updates on progress',
      ],
    },
    {
      name: 'Silver Sponsor', price: '£50+',
      perks: [
        'Small car logo placement',
        'Medium pit display logo',
        'Medium Enterprise Portfolio placement',
        'Advertisement on our social media account',
        'Small logo on uniforms',
      ],
    },
    {
      name: 'Bronze Sponsor', price: '£25+',
      perks: [
        'Small pit display logo',
        'Small Enterprise Portfolio placement',
        'Advertisement on our social media account',
        'Small logo on uniforms',
        'PULSE Racing sponsor certificate',
      ],
    },
  ],

  // Equipment & services sponsorship tiers
  equipmentTiers: [
    {
      name: 'Pole Position Partner', price: '£350+', highlight: true,
      qualifies: 'equipment or services worth over £350',
      examples: 'a 3D printer, a laptop for CAD and CFD work, a full pit display build, or a season’s CNC machining for both race cars',
      perks: [
        '“Technical partner of PULSE Racing” naming',
        'Premium large car logo placement',
        'Largest pit display logo',
        'Largest Enterprise Portfolio logo placement',
        'Featured “built with” post on our social media account',
        'Largest logo on uniforms',
        '(Optional) One-to-one updates on progress',
        'Extensive detail in the enterprise and engineering portfolios and presentations submitted to judges',
      ],
    },
    {
      name: 'Podium Partner', price: '£180+',
      qualifies: 'equipment or services worth over £180',
      examples: 'CNC machining of our race cars, a full set of team polo shirts, cloud simulation credits for aero testing, or a season’s supply of 3D printing filament',
      perks: [
        'Medium car logo placement',
        'Medium pit display logo',
        'Medium Enterprise Portfolio placement',
        'Advertisement on our social media account',
        'Medium logo on uniforms',
        '(Optional) One-to-one updates on progress',
      ],
    },
    {
      name: 'Points Partner', price: '£80+',
      qualifies: 'equipment or services worth over £80',
      examples: 'custom team T-shirts, printed banners for the pit display, specialist paint and finishing materials, or printing of our portfolios',
      perks: [
        'Small car logo placement',
        'Medium pit display logo',
        'Medium Enterprise Portfolio placement',
        'Advertisement on our social media account',
        'Small logo on uniforms',
      ],
    },
    {
      name: 'Grid Partner', price: '£30+',
      qualifies: 'equipment or services worth over £30',
      examples: 'primer and finishing supplies, car paint, a spool of 3D printing filament, vinyl decals for the car, or tools such as Vernier callipers',
      perks: [
        'Small pit display logo',
        'Small Enterprise Portfolio placement',
        'Advertisement on our social media account',
        'Small logo on uniforms',
        'PULSE Racing technical partner certificate',
      ],
    },
  ],
};
