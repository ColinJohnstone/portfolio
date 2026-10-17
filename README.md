# Colin Johnstone — portfolio

Hand-written static site: HTML, CSS and a little JavaScript. No framework, no build step, no runtime dependencies.

- `index.html` — home: hero, selected work, five project sections, contact
- `about/index.html` — About: career timeline, authentication, piping record, teaching, IRONMAN 70.3 splits
- `404.html` — not-found page
- `assets/css/site.css` — the whole design system (tokens for light and dark, layout, components)
- `assets/js/ui.js` — theme, header, reveals, counters, hero grid, scroll-spy, timeline filters
- `assets/js/gallery.js` — screenshot tabs, phone carousel, lightbox
- `assets/img/` — optimised WebP screenshots and the portrait
- `assets/fonts/` — Geist and Geist Mono (SIL Open Font License, licences included)

## Preview locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy on GitHub Pages

The site is hosted directly from this repository; nothing is deployed anywhere else.

1. Merge to `main`.
2. In the repository go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions** (one-time).
3. Every push to `main` runs `.github/workflows/pages.yml` and publishes to `https://colinjohnstone.github.io/portfolio/`.

All links are relative, so the site works at that sub-path or at the root of a custom domain.

## Editing content

Everything is plain HTML. Each project is an `<article class="project">` in `index.html`; screenshots live in `assets/img/` and are referenced from the `<figure class="shot">` elements. The About timeline is the `<ol class="timeline">` in `about/index.html`.

## About the screenshots

- **Pipe Stats, PipeMaster, Pipedle, Phish or Legit?, SecTor 2026**: captured from the live sites.
- **Fuel Quest and Training Dashboard** are private. Their screenshots come from the real, unmodified apps running locally on generated demo data (a "Demo Athlete"), never from personal logs. The pages say so.

The social preview image (`assets/og.png`) is 1200 × 630.
