# InfraStudio — Landing Page

A high-end, static marketing site for **InfraStudio**, an AI-native engineering
design platform that turns natural-language design intent into computable,
editable, and validated BIM/IFC models.

## Stack

Plain HTML/CSS/JS — no build step required. 3D visuals use [Three.js](https://threejs.org/)
loaded from a CDN as a progressive enhancement (the page degrades gracefully
without it). Fonts are Inter + JetBrains Mono via Google Fonts.

## Running locally

Any static file server works, e.g.:

```bash
cd InfraStudio
python3 -m http.server 8080
# then open http://localhost:8080
```

Opening `index.html` directly in a browser also works.

## Structure

```
InfraStudio/
├── index.html        # full page markup (all sections)
├── css/style.css      # design system + layout + components
├── js/main.js          # nav, scroll reveals, waitlist modal, 3D scenes
├── assets/
│   ├── favicon.svg
│   └── og-image.svg
└── README.md
```

## Notes

- The **"Request Early Access" / "Join the waitlist"** modal collects name,
  email, and profession (plus an optional note on what to automate). Entries
  are currently stored in `localStorage` on the visitor's device — there is no
  backend wired up yet. Swap `js/main.js`'s submit handler for a real endpoint
  (e.g. a serverless function, Airtable, or Supabase) when one exists.
- **"Try Now"** links out to the live prototype at
  `https://infra-studio-z3xc.vercel.app`.
- No fabricated metrics, logos, testimonials, or traction claims are used,
  per the product's current working-prototype stage.
