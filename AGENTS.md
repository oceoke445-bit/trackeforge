# TrackForge

Next.js App Router project for a fleet intelligence dashboard. Styling uses Tailwind CSS v4.

## Scripts

- `npm run dev` — start the Next.js development server
- `npm run build` — create a production build
- `npm start` — serve the production build
- `npm run lint` — run ESLint

## Project Structure

- `src/app/layout.tsx` — root layout, metadata, and Inter font
- `src/app/globals.css` — global CSS and Tailwind CSS v4 import
- `src/app/login/` — login route and its components
- `src/app/(platform)/` — dashboard routes; each module keeps its own `components/`
- `src/components/` — global shell only: `Layout.tsx`, `Sidebar.tsx`, `TopHeader.tsx`, `PlaceholderPage.tsx`
- `src/components/ui/` — shared icons
- `src/components/shared/` — UI used by more than one module, such as the map
- `src/components/data/` — demo fleet data
- `src/lib/` — theme and sidebar state
- `next.config.ts` — Next.js configuration
- `postcss.config.mjs` — Tailwind CSS v4 PostCSS plugin
- `package.json` — dependencies and scripts

## Dependencies

- Runtime: Next.js 16, React 19, and React DOM 19
- Styling: Tailwind CSS v4 with `@tailwindcss/postcss`
- Tooling: TypeScript 5.7 and ESLint

## Styling

This project uses Tailwind CSS v4 through `@tailwindcss/postcss`. `app/globals.css` imports Tailwind with `@import "tailwindcss";`. Use Tailwind utility classes in JSX and put global CSS or theme customization in `app/globals.css`.

The Inter font is loaded with `next/font/google` in `app/layout.tsx`.

## Code quality

- Use double quotes for strings containing apostrophes (`"We're here to help"`), or escape them in single-quoted strings. An unescaped apostrophe in a single-quoted string breaks the build.
- Ensure JSX tags are closed and braces are balanced.
- Export page and shared UI components as default exports.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.