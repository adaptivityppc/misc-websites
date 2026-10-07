# Misc websites and client previews

This repository keeps the existing SLC trip planner at root and a separate folder for each client preview under `demos/<client>/`. DigitalOcean app: `misc-websites` (ID `b23b39ee-68b8-4918-a01e-da1087ac3ecb`). The repository retains its original name so existing integrations stay connected. Big Bash Up remains in the separate `adaptivityppc/website` repository and app.

## Current client preview

- Austin Post: `demos/austinpost/`, component `austinpost`, hostname https://austinpost.adaptivitypro.org/.
- The current page is a connection placeholder, not the actual Austin Post website. Replace it with the approved client website files.
- Source: `main`, automatic deployments enabled. Plain HTML requires no build command.
- GoDaddy CNAME: `austinpost` -> `slc-trip-planner-n33cg.ondigitalocean.app`, TTL 1 hour. Keep GoDaddy nameservers and existing records.

## Update an existing client

1. Export the ChatGPT-created website with all HTML, CSS, JavaScript and assets. For React/Vite supply the complete source project with package.json and lockfile.
2. Replace only that client folder, preserving file paths and asset names. Never put credentials or private client information in this public repository.
3. For plain HTML keep the component type Static Site and source directory `/demos/<client>` with no build command. For Vite/React set the project build command (for example `npm run build` or `pnpm build`) and output directory `dist`. Server-side apps need a separate architecture/cost review.
4. Keep `<meta name="robots" content="noindex,nofollow,noarchive">` in every HTML entry/page and keep robots.txt with `User-agent: *` and `Disallow: /`. These discourage indexing; they do not restrict public access or guarantee removal from search results.
5. Commit to main. DigitalOcean automatically rebuilds; verify deployment success, HTTPS, assets and any client-side routes. Other components may also rebuild when this shared repository changes.

## Add another client

1. Create `demos/<client>/` containing the approved website.
2. Add one Static Site component in the existing misc-websites app using this repository, main, autodeploy On, and source `/demos/<client>`.
3. Add `<client>.adaptivitypro.org` as an externally managed custom domain. Add an ingress rule matching that exact hostname and path prefix `/`, targeting only that client component; put it before the existing catch-all SLC planner rule.
4. Inspect GoDaddy DNS for conflicts; add a CNAME `<client>` pointing to `slc-trip-planner-n33cg.ondigitalocean.app`. Do not change nameservers or email records.
5. Wait for DigitalOcean domain/certificate activation, then verify the exact HTTPS URL and client content.

## Costs and limits verified October 7, 2026

DigitalOcean permits up to three static-only apps at $0 base cost, with multiple static-site components in one app. This account currently uses two apps. Each free app adds 1 GiB/month outbound allowance, pooled at team level; overage is $0.02/GiB. A fourth static-only app adds $3/month. DigitalOcean documents up to 500 domains per app, but that is not a verified 500-website component guarantee. Ask before adding paid services.

Pricing: https://docs.digitalocean.com/products/app-platform/details/pricing/
Limits: https://docs.digitalocean.com/products/app-platform/details/limits/
