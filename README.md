# kare-site

Kare's public website: the home page, `/privacy/` and `/support/`.

React with React Router in framework mode, prerendered to static HTML at build time (`ssr: false` with `prerender`
in `react-router.config.ts`).

The sand tray on the home page draws with Kare's own WGSL scene shader on WebGPU, so the wood, grain, light and rod
match the app. `scripts/sync-kare-shaders.mjs` copies that shader from the app's checkout (`../Kare`, or
`KARE_REPO`) into `app/sand/kare/` before every dev run and build; the copy is not committed. The site supplies its
own height field (`app/sand/gpu-sim.ts`): a raked bed, the words and finger strokes, and the rod's raking. Browsers
without WebGPU get a simpler WebGL2 tray (`app/sand/gl-tray.ts`). The screenshots in `public/shots/` come from the
App Store set in the Kare repo (`prototypes/storefront-final/raw`).

```bash
bun install
bun run dev       # http://localhost:5173
bun run build     # static site in build/client
bun run preview   # serves build/client through wrangler, as in production
bun run deploy    # build, then wrangler deploy
```

Served as static assets by a Cloudflare Worker at https://kare.fyi (and www.kare.fyi; the old https://kare-site.gregjarvez.workers.dev still works). Pushing does not
deploy; run `bun run deploy`.
