# PULSE Racing website

A single-page scroll tour: the car sits on black, and as you scroll the camera flies
around it, zooming in on features while popups (with photos) tell the story.

## Preview it

```
py serve.py
```

This opens http://localhost:8080. Caching is off, so after you edit a file just refresh.
(Double-clicking `index.html` won't work; browsers block 3D models loaded from files.)

## What to edit

| I want to change… | Edit |
|---|---|
| Popup text, team members, sponsors, budget table, photos | `config/tour.js` |
| Camera angles, zoom, the order of stops, scroll speed | `config/tour.js` |
| Paint colour, gloss, lights, reflections, floor glow | `config/render.js` |
| Fonts, colours, card styling | `css/style.css` |

You shouldn't need to touch anything in `js/`.

### Change the paint colours

Set `paint:` near the top of `config/render.js` to one of the schemes listed under `paintSchemes`
(pastel-blue, pulse-green, pastel-mint, pearl-white, liquid-silver, gloss-black), or add your own.
Preview any scheme without editing: http://localhost:8080/?paint=pearl-white

### Screenshots for the portfolio

`http://localhost:8080/?stop=team&still` freezes the site on one section (use any stop `id` from
`config/tour.js`). `py tools/render_previews.py` (with the site running) saves screenshots of every
paint scheme into `colour-previews/`, plus a side-by-side `_comparison.png`.

### Set camera angles visually

Open **http://localhost:8080/?edit**:

1. Pick a stop from the dropdown (or tick *Free camera*).
2. Drag to orbit, right-drag to pan, scroll to zoom. Double-click the car to orbit around that spot.
3. Press **Copy camera** and paste it over that stop's `camera: {...}` line in `config/tour.js`.
4. Click a point on the car and press **Copy anchor** to move the glowing pin.

### Add photos

Put images in `assets/photos/` and add `src` to the placeholder in `config/tour.js`:

```js
photos: [
  { src: 'assets/photos/cnc.jpg', caption: 'CNC machining' },
],
```

Leave out `src` and a grey placeholder frame appears. Team headshots go in `members`
with `photo: 'assets/team/name.jpg'`.

### Add or remove a section

Copy any `{ id: ..., camera: ..., popup: ... }` block in `config/tour.js` and change it.
The side navigation dots update automatically.

## Update the car from Onshape

When the CAD changes:

```
cd tools
py export_from_onshape.py
```

By default this exports Assembly 2 (car + helmet) using 4 Onshape API calls (logged in `tools/onshape_api_calls.log`) and needs
`ONSHAPE_ACCESS_KEY` / `ONSHAPE_SECRET_KEY` set as environment variables. Use `--url` to
export a different Part Studio, or `--quality medium` for a smaller file.
Coordinates in the config match Onshape (mm, nose at −Y, Z up), so pins stay put
as long as the part isn't moved.

## The live website

Live at **https://leosemiletov1.github.io/pulse-racing/** (GitHub repo: https://github.com/leosemiletov1/pulse-racing).

To publish changes: double-click `tools\publish.bat` (or run `git add -A`, `git commit -m "..."`, `git push`).
The live site updates about a minute later. `colour-previews/`, `.claude/` and the Onshape API log are never uploaded (see `.gitignore`).

## Publish it elsewhere

It's a static site: upload the whole folder (without `tools/` and `serve.py`) to
GitHub Pages, Netlify or your school's web host. No build step.
