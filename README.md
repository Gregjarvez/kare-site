# kare-site

Kare's public website: the home page, `/privacy/` and `/support/`.

React with React Router in framework mode, prerendered to static HTML at build time (`ssr: false` with `prerender`
in `react-router.config.ts`). The sand tray on the home page is a small WebGL2 height-field simulation in
`app/sand/`, written for the site; it is not the app's renderer. The screenshots in `public/shots/` come from the
App Store set in the Kare repo (`prototypes/storefront-final/raw`).

```bash
bun install
bun run dev       # http://localhost:5173
bun run build     # static site in build/client
bun run preview   # serves build/client through wrangler, as in production
bun run deploy    # build, then wrangler deploy
```

Served as static assets by a Cloudflare Worker at https://kare-site.gregjarvez.workers.dev. Pushing does not
deploy; run `bun run deploy`.
