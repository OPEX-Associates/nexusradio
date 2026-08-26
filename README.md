# PWA Starter

[**Straight to Full Documentation**](https://docs.pwabuilder.com/#/starter/quick-start)

The PWABuilder pwa-starter is our opinionated, best practices, production tested starter that we use to build all of our PWAs, including [PWABuilder itself](https://blog.pwabuilder.com/posts/introducing-the-brand-new-pwa-builder/)! The pwa-starter is a starter codebase, just like create-react-app or the Angular CLI can generate, that uses the PWABuilder team&#39;s preferred front-end tech stack. We also have a CLI tool to allow you to create a PWA template from the command line.

## Jump Right In

Install the PWABuilder CLI:

`npm i -g @pwabuilder/cli`

And create a new app with this command:

# Nexus Radio

Nexus Radio is a bilingual Arabic and English progressive web app for listening to Moroccan, French, international, news, and music stations in one place. It is built with Lit, TypeScript, and Vite.

## Run locally

```bash
npm install
npm run dev
```

The production build is:

```bash
npm run build
```

## Features

- Persistent audio player with volume control and media-session support
- Automatic retry across all declared stream URLs for a station
- Station search across Arabic names, English names, and descriptions
- Persistent favorites, sorted to the front of the station list
- Keyboard shortcuts, dark mode, share support, and PWA installation assets

## Stations

The catalog in `src/services/radio-service.ts` currently includes Moroccan, French, international news, and music stations. The Moroccan catalog includes MFM Radio, Hit Radio, Atlantic Radio, U Radio, Aswat, SNRT Chaine Inter, Radio Mars, and Med Radio.

Stream endpoints are maintained as direct browser-playable URLs where the broadcaster exposes them. The current review confirmed the direct MFM endpoint, refreshed Atlantic Radio, Radio Mars, and RTL endpoints, and added Med Radio. Radio 24's official HLS endpoint is currently access-restricted and its available MP3 fallbacks are HTTP-only, so no unverified HTTPS replacement was promoted.

Stream availability can change without notice because the endpoints are operated by the stations or their streaming providers. When a station has multiple candidates, playback tries them in the order declared in the station record.

## Project structure

- `src/services/radio-service.ts`: station catalog and audio playback logic
- `src/components/radio-player.ts`: player UI, search, favorites, and controls
- `src/pages/app-home.ts`: home page composition
- `public/`: PWA manifest, service worker, and static assets
