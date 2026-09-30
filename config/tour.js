/* ==========================================================================
   SCROLL TOUR: the camera path and the popup at each stop.

   Each entry in `stops` is one scroll stop: where the camera looks, plus the
   popup shown there. Reorder, delete or copy stops freely.

   EASIEST WAY TO SET A CAMERA: open the site with ?edit on the end
   (e.g. http://localhost:8080/?edit), orbit to the view you want, press
   "Copy camera" and paste the result over a stop's `camera: {...}` line.
   Click the car in edit mode to copy an `anchor` point too.

   camera:
     target     [x, y, z] mm: the point the camera looks at (Onshape coordinates)
     azimuth    degrees around the car: 0 = nose-on, 90 = car's right side,
                180 = rear, 270 (or -90) = left side. Numbers are taken literally,
                so 0 -> 270 swings the long way round; use -90 for the short way.
     elevation  degrees above the ground (0 = level, 89 = straight down)
     distance   mm from the target (smaller = more zoomed in)
     fov        lens angle in degrees (smaller = more telephoto / flatter)
   anchor       [x, y, z] mm: where the glowing pin + line points (optional)
   drift        degrees the camera slowly orbits while this stop is on screen
   hold / move  scroll length (in screen-heights) to stay here / to fly to the next stop
   carOnScreen  [x, y] nudges the car on screen on desktop (0.2 = 20% of the width
                to the right). Default: moved away from the popup automatically.
                Phones always put the car above the popup.

   popup fields (all optional; use whichever you need):
     side: 'left' | 'right'     style: 'hero' (big title, no card)
     kicker, title, text (string or list of paragraphs; simple HTML allowed)
     bullets: ['...']           stats: [{ value, label }]
     table: { columns: [...], rows: [[...], ...] }
     members: [{ name, role, photo, bio }]
     tiers: [{ name, price, perks: [...], highlight }]
     cta: { label, href }
     photos: [{ src: 'assets/photos/wing.jpg', caption: '...' }]
             Photos pop up around the card. Leave out `src` for a grey placeholder.
             Put image files in assets/photos/. Landscape ~3:2 images look best.
   ========================================================================== */

export default {
  brand: {
    teamName: 'PULSE Racing',
    tagline: 'STEM Racing · King’s College School Wimbledon',
    accent: '#39ff88',        // PULSE neon green: pins, lines, buttons
  },

  // Countdown in the top bar. Time is UK time (January = GMT, so the Z at the end is correct).
  countdown: {
    label: 'London Regionals',
    date: '2027-01-21T09:00:00Z',
    after: 'Race day!',       // shown once the date has passed ('' hides the countdown)
  },

  defaults: {
    hold: 1.0,                // screen-heights of scrolling spent at each stop
    move: 1.2,                // screen-heights of scrolling to fly between stops
    easing: 'inOutCubic',     // 'linear' | 'inOutSine' | 'inOutCubic' | 'inOutQuint'
    smoothing: 0.35,          // seconds; how softly the camera catches up with the scrollbar
    mobileZoomOut: 0.75,      // pulls the camera back on tall/narrow phone screens (0 = off)
  },

  stops: [
    // ------------------------------------------------------------------ HERO
    {
      id: 'home',
      label: 'Home',
      camera: { target: [0, 28, -6], azimuth: 38, elevation: 12, distance: 470, fov: 28 },
      drift: 16,
      hold: 1.2,
      popup: {
        style: 'hero',
        kicker: 'STEM Racing · London Regional Finals · 21 January 2027',
        title: 'PULSE Racing',
        text: 'Dominating the track with precision engineering, relentless innovation and unstoppable team spirit.',
      },
    },

    // --------------------------------------------------------- FRONT WING
    {
      id: 'front-wing',
      label: 'Front wing',
      camera: { target: [0, -70, -17], azimuth: -32, elevation: 24, distance: 230, fov: 30 },
      anchor: [22, -82, -19],
      drift: 8,
      popup: {
        side: 'left',
        kicker: 'Design · 01',
        title: 'Unibody front wing',
        text: 'Our first car had a poorly shaped front slope and wing with harsh edges that caused airflow separation. Iteration 2 introduced a single unibody front wing; iteration 3 put it through our CFD loop and cut the drag coefficient by <strong>22%</strong>. It has stayed unchanged since.',
        stats: [
          { value: '−22%', label: 'Drag coefficient (iteration 3)' },
          { value: '65 mm', label: 'Span' },
        ],
        photos: [
          { caption: 'Front wing CFD result' },
          { caption: 'Iteration 1 vs. iteration 3' },
        ],
      },
    },

    // ------------------------------------------------------------- WHEELS
    {
      id: 'wheels',
      label: 'Wheels',
      camera: { target: [-24, -39, -10], azimuth: 100, elevation: 14, distance: 195, fov: 30 },
      anchor: [-32.5, -39, -9.8],
      drift: 8,
      popup: {
        side: 'right',
        kicker: 'Design · 02',
        title: 'Wheels & stance',
        text: 'The rules let us 3D-print the wheels, halo and aerofoils. We prototype on the school’s FDM printers so we can test on the track within days, then print the final wheels in resin for a smooth, precise finish.',
        stats: [
          { value: '30 mm', label: 'Wheel diameter' },
          { value: '85.5 mm', label: 'Wheelbase' },
        ],
        photos: [
          { caption: 'Printed wheel prototypes' },
          { caption: 'Track testing' },
        ],
      },
    },

    // ---------------------------------------------------------- SIDE PODS
    {
      id: 'side-pods',
      label: 'Aero',
      camera: { target: [-18, 8, -6], azimuth: 62, elevation: 30, distance: 230, fov: 30 },
      anchor: [-26, 10, -8],
      drift: 10,
      popup: {
        side: 'left',
        kicker: 'Design · 03',
        title: 'Side pods & the aero loop',
        text: 'Every component goes through the same cycle: sketch options, model them in Onshape, simulate them in SimScale CFD (thanks to our partner SimScale), then keep the best. For the side pods we tested five variants (E15, E17.5, E20, E23 and E26). You’re looking at <strong>E23</strong>.',
        stats: [
          { value: '−37%', label: 'Total drag vs. design 1' },
          { value: '23', label: 'Car designs' },
          { value: '17', label: 'CFD simulations' },
        ],
        photos: [
          { caption: 'SimScale pressure plot' },
          { caption: 'Side pod variants E15–E26' },
          { caption: 'Design sketches' },
        ],
      },
    },

    // ----------------------------------------------------- MANUFACTURING (to fill in)
    {
      id: 'manufacturing',
      label: 'Manufacturing',
      camera: { target: [0, -38, 4], azimuth: -58, elevation: 30, distance: 250, fov: 30 },
      anchor: [0, -38, 15],
      drift: 10,
      popup: {
        side: 'left',
        kicker: 'Manufacturing',
        title: 'How we built it',
        text: '[Add how the car was made: CNC machining of the body, 3D-printed halo, wings and wheels, finishing and painting.]',
        bullets: [
          '[Step 1]',
          '[Step 2]',
          '[Step 3]',
        ],
        stats: [
          { value: '6', label: 'Physical prototypes' },
          { value: '[—]', label: 'Hours of machining' },
        ],
        photos: [
          { caption: 'CNC machining' },
          { caption: 'Printed parts' },
          { caption: 'Painting & finishing' },
        ],
      },
    },

    // ---------------------------------------------------------- REAR / TAIL
    {
      id: 'rear',
      label: 'Rear',
      camera: { target: [0, 105, 0], azimuth: 150, elevation: 18, distance: 260, fov: 30 },
      anchor: [0, 139, 5],
      drift: 10,
      popup: {
        side: 'left',
        kicker: 'Design · 04',
        title: 'Tail & canister housing',
        text: 'When we studied past podium cars, a sharp cut-off at the rear stood out as a likely cause of flow separation. Our fourth iteration refined the rear and side pods, tapering the tail smoothly around the CO₂ canister to shrink the turbulent wake.',
        stats: [
          { value: '228 mm', label: 'Overall length' },
          { value: '[—] g', label: 'Race weight' },
        ],
        photos: [
          { caption: 'Wake visualisation' },
          { caption: 'Rear view' },
        ],
      },
    },

    // --------------------------------------------------------------- TEAM
    {
      id: 'team',
      label: 'Team',
      camera: { target: [0, 30, -4], azimuth: 160, elevation: 60, distance: 600, fov: 28 },
      carOnScreen: [-0.25, 0],
      drift: 14,
      hold: 1.4,
      popup: {
        side: 'right',
        kicker: 'The crew',
        title: 'Meet the team',
        text: 'Six students from King’s College School Wimbledon. Everyone has a lead role, and our fluid-roles system lets anyone jump in wherever the workload peaks.',
        members: [
          // photo: 'assets/team/coen.jpg'  (optional; initials are shown if left out)
          { name: 'Coen Zhang', role: 'Team Principal' },
          { name: 'Marco Neri', role: 'Marketing & Branding Lead, Deputy Principal' },
          { name: 'Leonid Semiletov', role: 'CTO · Car Design & Engineering' },
          { name: 'Alastair Lightbody', role: 'Sponsorship Lead' },
          { name: 'Jamie Powles', role: 'Finance Director' },
          { name: 'Benjamin Robare', role: 'PR & Communications Lead' },
        ],
        photos: [
          { caption: 'Team photo' },
          { caption: 'In the workshop' },
        ],
      },
    },

    // ------------------------------------------------------------ BUDGET (to fill in)
    {
      id: 'budget',
      label: 'Budget',
      camera: { target: [0, 26, -6], azimuth: 270, elevation: 6, distance: 540, fov: 28 },
      drift: 12,
      popup: {
        side: 'left',
        kicker: 'Budget',
        title: 'Where the money goes',
        text: '[Add a short summary of how you’ve spent your sponsorship so far.]',
        table: {
          columns: ['Item', 'Planned', 'Spent'],
          rows: [
            ['Prototyping', '—', '—'],
            ['Final car production', '—', '—'],
            ['Paint & decals', '—', '—'],
            ['Car accessories', '—', '—'],
            ['Uniforms', '—', '—'],
            ['Pit display', '—', '—'],
            ['<strong>Total</strong>', '—', '—'],
          ],
        },
        photos: [
          { caption: 'Budget breakdown' },
          { caption: 'Receipts / purchases' },
        ],
      },
    },

    // ---------------------------------------------------------- PARTNERS
    {
      id: 'partners',
      label: 'Partners',
      camera: { target: [0, 30, -6], azimuth: 300, elevation: 14, distance: 600, fov: 28 },
      drift: 14,
      hold: 1.3,
      popup: {
        side: 'right',
        kicker: 'Our partners',
        title: 'Powered by',
        // logo: put the file in assets/sponsors/. If it's missing, the name is shown instead.
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
        photos: [
          { caption: 'Sponsor logos on the car' },
          { caption: 'Pit display' },
        ],
      },
    },

    // ------------------------------------------------ MONETARY SPONSORSHIP
    {
      id: 'sponsor-us',
      label: 'Sponsor us',
      camera: { target: [0, 30, -6], azimuth: 340, elevation: 20, distance: 620, fov: 28 },
      drift: 14,
      hold: 1.4,
      popup: {
        side: 'left',
        kicker: 'Sponsorship drive',
        title: 'Race with us',
        text: 'Every contribution goes straight into car development, testing, competition entry and building the team’s STEM skills. Tap a tier to see what you get.',
        tiers: [
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
        cta: { label: 'Become a sponsor', href: 'mailto:[your-team-email]?subject=Sponsoring%20PULSE%20Racing' },
        photos: [
          { caption: 'Logo placement on the car' },
          { caption: 'Team uniform' },
        ],
      },
    },

    // ----------------------------------------------- EQUIPMENT SPONSORSHIP
    {
      id: 'equipment',
      label: 'Equipment',
      camera: { target: [0, 30, -6], azimuth: 385, elevation: 14, distance: 600, fov: 28 },
      drift: 16,
      hold: 1.4,
      popup: {
        side: 'right',
        kicker: 'Equipment & services',
        title: 'Help us build it',
        text: 'Not cash? Equipment, materials and services count too, and come with technical-partner recognition.',
        tiers: [
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
        cta: { label: 'Offer equipment', href: 'mailto:[your-team-email]?subject=Equipment%20partnership%20with%20PULSE%20Racing' },
        photos: [
          { caption: 'Workshop equipment' },
          { caption: 'Manufactured parts' },
        ],
      },
    },
  ],
};
