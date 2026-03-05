# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Serve apps in development
npx nx serve api        # NestJS API on http://localhost:3000/api
npx nx serve client     # Angular client on http://localhost:4200

# Build
npx nx build api
npx nx build client
npx nx run-many -t build   # Build everything

# Test
npx nx test api
npx nx test client
npx nx test shared-models

# Lint
npx nx lint api
npx nx lint client

# Visualize project graph
npx nx graph
```

## Architecture

**Nx Integrated Monorepo** with three projects:

- `api/` — NestJS 11 backend, built with webpack, served via `@nx/js:node`
- `client/` — Angular 21 frontend with SSR, served via `@angular/build:dev-server` (storefront + admin merged with route-based separation)
- `libs/shared-models` — TypeScript-only library with shared interfaces, enums, and DTOs; imported as `@mamy/shared-models`

**Database**: Supabase (hosted PostgreSQL). Connection via `@supabase/supabase-js` client SDK on both frontend and backend, plus direct Postgres connection for NestJS when needed.

**API** (`api/src`):
- `AppModule` imports `ConfigModule.forRoot({ isGlobal: true })` — `ConfigModule` must be available before other modules.
- All routes prefixed with `/api` globally.
- Feature modules are imported into `AppModule`.

**Client** (`client/src`):
- Standalone components, no NgModules.
- SSR is enabled — avoid direct DOM access; use `isPlatformBrowser` when needed.
- Styles: SCSS + Tailwind v4 (via `@tailwindcss/postcss`).
- Route-based separation: public storefront routes + protected admin routes behind auth guard.

## Mandatory Conventions

**Shared library first**: Define all interfaces, enums, and DTOs in `libs/shared-models/src/lib/` and re-export from `libs/shared-models/src/index.ts` before implementing in apps.

**Angular state**: Use Signals for all UI state. Avoid RxJS unless managing complex async streams. Write zoneless-compatible code (no `zone.js` assumptions).

**Angular forms**: Use Signal-based forms (`FormControl`, `FormGroup` with signals) for all new forms. Prefer signal-based reactive patterns over traditional `valueChanges` observables.

**Angular templates**: Use `@if`/`@for` control flow syntax (not `*ngIf`/`*ngFor`).

**RTL-First UI (mandatory)**: The app is Arabic-first (`dir="rtl"`). Never use physical directional classes. Always use CSS logical properties:
- Margins: `ms-*` / `me-*` (not `ml-*` / `mr-*`)
- Padding: `ps-*` / `pe-*` (not `pl-*` / `pr-*`)
- Position: `start-*` / `end-*` (not `left-*` / `right-*`)
- Text align: `text-start` / `text-end` (not `text-left` / `text-right`)
- `px-*`, `py-*`, `p-*` are symmetric and safe to use.

**NestJS DTOs**: Annotate with `class-validator` decorators to enforce validation.

**Media & Storage**: Images are stored externally (Supabase Storage or Cloudinary). The database only stores URLs (strings), never binary data. Use `NgOptimizedImage` (`ngSrc`) for all `<img>` elements; add the `priority` attribute to the first 2 images on the storefront for LCP.

**SEO & Meta**: Public store pages must dynamically update `Title`, `Meta` (`description`, `og:image`) after data loads. This is required for social media link previews.

**Angular DI**: Use `inject()` for all dependency injection (standard in Angular 21) — no constructor injection. Guards must be functional (`CanActivateFn`). Use `input()`/`output()` signal APIs instead of `@Input()`/`@Output()` decorators.

**Security**:
- Passwords must be hashed with `bcrypt` — never store plaintext.
- Route protection via functional guards (`CanActivateFn`).
- JWT role checks must read from `user_metadata` in the token payload.
- Supabase Row Level Security (RLS) must be enabled on all tables.

**Error handling**:
- API: Register a global `HttpExceptionFilter` in `main.ts` (`app.useGlobalFilters(...)`) to return consistent error shapes.
- Client: Register a global `HttpInterceptor` that catches `401`/`403` responses and redirects to the login route.

**PWA**: The app ships as a PWA (`ngsw-config.json`). Any new static assets (icons, fonts, images) must be added to the appropriate `assetGroups` in `ngsw-config.json` so they are cached for offline use.

**Environment variables** (`.env` at workspace root, loaded by `ConfigModule`):
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_ANON_KEY` — Supabase anonymous/public key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (API only, never expose to client)
- `JWT_SECRET`
- `NODE_ENV`

## UI & Theming

**Design system**: Spartan UI (shadcn for Angular) with CLI-generated helm components in `libs/ui/`. Import from `@spartan-ng/helm/*`. Add new components via `npx nx g @spartan-ng/cli:ui --name=<component>`.

**Theme**: Zinc base + Violet primary accent. All colors use OKLCH in `client/src/styles.scss`.
- Primary (Violet): `oklch(0.541 0.281 293.009)` — buttons, links, focus rings
- Destructive (Red): `oklch(0.577 0.245 27.325)` — errors, delete actions
- Base grays: Zinc palette (hue ~286, subtle cool tint)
- Radius: `0.5rem`

**Typography**: Inter (English) + Cairo (Arabic) via Google Fonts (`--font-sans: 'Inter', 'Cairo', sans-serif`). The browser uses Inter for Latin glyphs and falls back to Cairo for Arabic. RTL-first layout.

## Workflow Hints

- When creating a new feature, always start by updating `libs/shared-models`.
- After generating a new entity, run `npx nx build api` to verify the project graph is still valid.
- When adding a new environment variable: update `.env`, register it in `AppModule`'s `ConfigService` usage.
- Supabase migrations: Use `supabase migration new <name>` to create SQL migrations, apply with `supabase db push`.
