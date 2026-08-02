# Design Standards

This document is the design system for `atlas-web`. It is derived from the
approved UI concepts (install flow, dashboard, repository detail) and is
binding for all UI work in this repository, human or agent.

Implementation lives in `apps/atlas-web/src/app/globals.css` as CSS custom
properties consumed by Tailwind v4 (`@theme inline`) and shadcn/ui
(`base-nova` style, `neutral` base). Do not hardcode hex/oklch values in
components — use the Tailwind tokens (`bg-background`, `text-foreground`,
`border-border`, etc.) so both themes stay correct automatically.

## Principles

- **Dark-first.** Design and review every screen in dark mode first. Light
  mode is a full second-class citizen, not an inverted afterthought — but
  dark is where defaults get set.
- **Native, low-chrome.** Linear/Vercel register: minimal ornamentation,
  hairline borders instead of heavy shadows, restraint over decoration.
- **Data wants monospace.** Anything the user scans as data — repo names,
  IDs, timestamps, delivery hashes, HTTP statuses, the wordmark — is set in
  the mono stack with `tabular-nums`. Prose and UI chrome stay in the sans
  stack. This split is the single most identifying trait of the system;
  don't blur it.
- **Accent is not status.** The brand accent (indigo-blue) is reserved for
  interactive/brand elements: primary buttons, active nav/tabs, links, focus
  rings, chart lines. It never means "synced," "pending," or "error" — those
  are the semantic colors below. If a new state needs a color, pull from the
  semantic set, never from the accent.
- **Real content, not lorem.** Mock realistic repo names, counts, and
  timestamps when prototyping — placeholder text hides real layout problems.

## Color tokens

Defined as CSS variables in `globals.css`, both under `:root` (light) and
`.dark` (dark), then mapped through `@theme inline` to Tailwind utilities.
Values are oklch to stay perceptually consistent across the two themes.

| Token | Role | Tailwind utility |
|---|---|---|
| `--background` / `--foreground` | Page canvas / primary text | `bg-background`, `text-foreground` |
| `--card` / `--card-foreground` | Elevated surfaces (panels, tiles, table containers) | `bg-card`, `text-card-foreground` |
| `--popover` / `--popover-foreground` | Menus, tooltips, dropdowns | `bg-popover` |
| `--border` | Hairline dividers and outlines | `border-border` |
| `--muted` / `--muted-foreground` | Secondary surfaces, secondary text | `bg-muted`, `text-muted-foreground` |
| `--primary` / `--primary-foreground` | Brand accent (indigo-blue) and its ink | `bg-primary`, `text-primary` |
| `--secondary` / `--secondary-foreground` | Secondary buttons, chips | `bg-secondary` |
| `--accent` / `--accent-foreground` | Hover/active surface tint (kept distinct from `--primary`, the brand accent) | `bg-accent` |
| `--destructive` | Error status, destructive actions | `bg-destructive`, `text-destructive` |
| `--success` | Success/synced status | `text-success`, `bg-success/10` |
| `--warning` | Pending/syncing status | `text-warning`, `bg-warning/10` |
| `--ring` | Focus ring | `ring-ring` |

`--success` and `--warning` are new tokens this system adds on top of the
shadcn defaults — shadcn ships `destructive` but not the other two semantic
states, and this product needs all three (synced / syncing / error) for
sync-status pills.

**Brand accent (`--primary`):** a desaturated indigo-blue, deliberately off
Tailwind's default `blue-500`/`indigo-500` and off Linear's exact purple.
Kept cool so it never gets confused with the warm semantic states.

**Neutrals:** cool, blue-tinted near-black in dark mode (not pure `#000`),
warm-neutral off-white in light mode (not pure `#fff`) — a chosen tint, not
an inherited default.

## Typography

- **UI/sans** — system font stack (`-apple-system, BlinkMacSystemFont,
  "Segoe UI", "Helvetica Neue", Arial, sans-serif`). Used for headings, body
  copy, buttons, nav.
- **Mono** — `ui-monospace, "SF Mono", "JetBrains Mono", "Cascadia Code",
  Menlo, Consolas, monospace`. Used for: the wordmark, repo/org names,
  timestamps, IDs and hashes, HTTP status codes, table numeric columns.
- Set `font-variant-numeric: tabular-nums` wherever digits line up in a
  column (stat tiles, table numeric cells).
- Headings get `text-wrap: balance`.
- No webfonts. The CSP in some rendering contexts (e.g. published artifacts)
  blocks font CDNs, and the system stack already matches the native,
  low-chrome direction — don't introduce a webfont dependency to chase a
  "custom" look.

## Layout & components

- **Radius:** base `--radius: 0.5rem`, scaled via the existing
  `--radius-sm/md/lg/xl/...` tokens. Crisp, not pill-shaped — avoid
  `rounded-full` outside of true circles (avatars, status dots).
  Avoid `rounded-lg` as a reflexive default: choose the radius token that
  matches the element's role.
- **Surfaces:** prefer a 1px `border-border` hairline over a heavy shadow.
  Use `--shadow` sparingly, for genuinely floating elements (dropdowns,
  the app frame itself), not for every card.
- **Status pills:** dot + label, color from the semantic token, background
  at ~10% opacity of that token, not a solid fill. Never reuse `--primary`
  for a status pill.
- **Stat tiles:** label (muted, small, uppercase-tracked) above a mono,
  tabular-nums value, above an optional trend line. Trend color is
  `--success` for "good" movement regardless of arrow direction (a latency
  drop and an events increase are both good — both render in `--success`).
- **Tables:** sticky/muted header row (`bg-muted`, uppercase, tracked,
  small), 1px row dividers, numeric columns right-aligned and mono.
  Wrap in `overflow-x-auto` — never let a table force horizontal scroll on
  the page body.
- **Charts:** every sparkline/area chart gets a faint horizontal grid, a
  gradient area fill fading to transparent, and an emphasized endpoint dot
  in `--primary`. Treat chart styling with the same care as a heading — it
  is not a decorative afterthought.
- **Icons:** `lucide-react` (already a dependency). Keep stroke width
  consistent with the weight shadcn's `base-nova` style already sets.

## Copy

- Name things the way a user recognizes them, not how the system implements
  them — "Repositories," not "webhook config." "Re-sync now," not "trigger
  manual reconciliation."
- Buttons say exactly what they do ("Continue with GitHub," "Re-sync all").
  Confirmations state what happened in the same words ("Synced" not
  "Operation successful").
- Errors say what's wrong and what to do next — no apologies, no vague
  "Something went wrong."

## Reference

The approved visual direction (three-screen flow: connect, dashboard,
repository detail) is the source of truth for how these tokens compose in
practice. It is not checked into the repo — ask in chat if you need it
re-rendered as an artifact for comparison.
