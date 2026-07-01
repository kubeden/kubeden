---
name: set-dashboard
description: >-
  Build the gated dashboard UI (stage 4) of a web app whose backend already works (see
  set-app-backend). Reads project specifics from PROJECT.md, studies the wired design tokens and
  reference sites, then builds the full-screen app shell (left sidebar + user block + dropup), the
  interactive weekly calendar with create/edit/delete entry modals, the shared glassmorphic
  settings/billing modal (3/5 × 3/5, centered, its own sub-sidebar), and a live streaming AI-chat
  view with per-user calendar context — all consuming the backend stage's endpoint + server-helper
  contracts. STOPS at a design-language gate before building and does a visual self-review after.
  Engineered to defeat generic "AI dashboard" output. Touches only the gated route + its
  components — never schema, env, lib clients, enforcement, or the marketing route.
---

# Set Dashboard — the gated app UI, on top of a working backend

This skill builds **only the dashboard** (stage 4). It assumes `set-app-backend` already made the
seams real: `requireUser()` / `getBillingState()`, the primary-entity CRUD + presign + chat +
Stripe endpoints, and the typed `402` bodies. Earlier stages laid the foundation, the landing page,
and those backend contracts; this skill is the last app surface before deploy.

> **Mental model:** the foundation was *correctness of seams*; the backend was *correctness of money
> and limits*; the landing was *taste, once*. **This skill is taste under interaction** — the place
> where the product stops being endpoints and becomes something a person lives inside daily. The
> failure mode here is the generic admin panel: a boxy sidebar, a data-table dump, three stat cards,
> a modal that's just a centered white rectangle. **This skill's real job is to defeat that** — to
> make the calendar, the modals, and the chat feel like *this* product (its style adjectives, its
> palette, its voice), calm and considered, not a bootstrapped CRUD template.

---

## Step 0 — Load the brief & verify BOTH prior contracts (required first)

1. Read **`./PROJECT.md`**: identity, one-liner, style adjectives, reference sites, palette, fonts,
   plans table, and the primary entity's shape. Wherever this skill says "*per the brief*," read it
   from `PROJECT.md` — never invent it.
2. **Verify the design foundation** (from `set-project-structure`): the gated route exists (e.g.
   `src/app/dashboard/`) with its component dir (`src/components/dashboard/`); design tokens are
   wired (palette + `--sidebar-*` tokens + body/display fonts via `next/font`); shadcn/ui is
   initialized. Reuse the landing's visual language where it exists (e.g.
   `components/landing/weekly-calendar.tsx` as the calendar's starting vocabulary).
3. **Verify the backend contract** (from `set-app-backend`): `requireUser()`, `getBillingState()`,
   the primary-entity CRUD endpoints, `/api/assets`, `/api/chat`, `/api/stripe/checkout|portal`,
   the logout action, and the typed `402` shapes. If these are missing, **stop** and tell the user
   to run `set-app-backend` first. This skill builds UI; it does not wire backend, edit schema/env,
   or touch enforcement.

---

## Operating principles (apply throughout)

1. **Defeat the default.** The enemy is the generic dashboard. Every decision traces to the brief
   (adjectives, palette, voice) or the reference sites — not to an admin-template reflex. Boxy
   grids, stat-card rows, and centered-white-rectangle modals are tells; avoid them.
2. **Consume, never re-implement.** All data and mutations go through the backend stage's contracts.
   Never re-check quota, re-derive plan, presign, or call the LLM from the client — the server owns
   those. The UI *renders state and dispatches intent*; it enforces nothing.
3. **Handle every state.** Loading, empty, error, and the typed **`402`** are first-class, not
   afterthoughts. Quota-exhausted must route the user to upgrade/top-up (open Billing); a failed
   mutation must never look like success. Optimistic UI must roll back on failure.
4. **Motion serves hierarchy.** Modals, dropups, entry placement, and streaming text animate with
   restraint, and always honor `prefers-reduced-motion`. Calm beats busy.
5. **Accessible by construction.** Modals and the dropup are real dialogs/menus (focus trap, `Esc`,
   `aria-*`, return focus), the calendar is keyboard-navigable, contrast meets AA. Use Radix/shadcn
   primitives rather than hand-rolled `div`s.
6. **Stay in your lane.** Additive only. Touch the gated route and `components/dashboard/*`. Never
   edit schema, env, `lib/` clients, enforcement routes, the gate file, or the marketing route.
7. **Ship-complete in one pass.** Every pass leaves a **complete, usable** dashboard — all views
   built, all states handled, no `TODO`/lorem/half-styled sections. The human-iteration checkpoint
   raises the ceiling; it does not finish unbuilt work. If low on effort, cut a *feature* cleanly
   (e.g. attachments) rather than ship a broken one.

---

## Procedure

### 1. Load brief & verify contracts
Per Step 0 — both the design foundation and the backend seam.

### 2. Study the reference & the wired language (don't just "get inspired")
- Re-open the brief's reference site(s) (Chrome tools if available; else fetch + reason from markup)
  and read the **landing page you already shipped** — the dashboard must feel like the same product,
  not a different app bolted on. Extract concrete decisions: spacing rhythm, type scale, how
  restrained the color use is, the calendar vocabulary already established.
- Read the **wired tokens** in `globals.css` (palette, `--sidebar-*`, radii, fonts) and use them
  as-is. Do **not** invent a parallel token system.

### 3. Produce the design-language note + view/interaction IA
A short artifact (≈10–14 lines) turning the brief's adjectives into numbers **and** committing to
the interaction model:
- **Shell:** sidebar width, nav item rhythm, where the user block sits, how the dropup emerges.
- **Calendar:** the weekly (Mon–Sun) grid — column proportions, how an entry cell reads (dot color
  from the brand palette, time, title in the display font), how a day's empty area invites a click,
  week-nav affordance, today emphasis.
- **Entry modal:** create vs edit; the fields (per the entity shape); how the color picker, time,
  and duration read; where delete lives; how the live quota state and the `402`→upgrade path appear.
- **Settings/Billing modal:** the shared glassmorphic surface — its exact sizing (**≈3/5 viewport
  width × 3/5 height, centered**), the glass recipe (translucency + blur + hairline border), the
  left sub-sidebar (Settings | Billing) and what each pane shows.
- **AI chat:** the streaming view — message rhythm, how assistant text settles in, where remaining
  tokens show, empty-state prompt.
- **Motion stance & the banned-patterns you're avoiding.**

### 4. Gate — STOP and wait (before building)
Present and **wait for explicit approval. Build nothing until approved.** Show:
1. What you took from the reference site(s) + the shipped landing + the wired tokens.
2. The **design-language note + view/interaction IA** (§3).
3. The **glassmorphism recipe** and the modal sizing math.
4. Motion plan and the **banned-patterns** list you're honoring.
5. Which backend contracts each view consumes (so the seam is explicit).
6. Anything you're unsure about or assuming.

### 5. Build (only after approval)
Build under the gated route with a server layout that reads the user + billing state once and passes
it down (`export const dynamic = 'force-dynamic'`). One component per concern in
`components/dashboard/*`:

- **App shell / sidebar.** Full-screen flex; fixed left **sidebar** using `--sidebar-*` tokens with
  nav items — **Calendar** (active) · **Actions (coming soon)** (visibly disabled, not a dead link)
  · **AI Chat**. At the **bottom, a user block**: the gravatar identicon (`gravatarUrl(email)` from
  `lib/avatar.ts`), name, email. Clicking it opens a **dropup** (menu emerging *upward*) with
  **Settings · Billing · Logout** — Settings/Billing open the shared modal on the right tab; Logout
  calls the backend logout action.
- **Weekly calendar** (primary view). Interactive Mon–Sun grid evolving the landing's
  `weekly-calendar` vocabulary: week navigation (prev / next / today), entries placed per day
  (dot color = `bg-brand` / `bg-brand-orange` / `bg-brand-brown`, time, display-font title).
  **Clicking a day's open area → create-entry modal** (that day prefilled); **clicking an entry →
  edit/delete modal.** Fetch the visible week's entries server-side (or via the CRUD read);
  mutations revalidate.
- **Entry modal.** Create/edit form for the entity's fields (e.g. title, description, color from the
  three brand dots, start time, duration; optional attachment via `/api/assets` presign → PUT).
  Submit → CRUD endpoint; delete → DELETE with confirmation. **Show live quota** ("3 of 10 this
  cycle"); on a `402`, surface the upgrade/top-up path (open Billing) instead of a raw error.
- **Settings/Billing modal (one shared surface).** A Radix Dialog, **≈`60vw × 60vh`, centered**,
  **glassmorphic** (translucent background + `backdrop-blur` + hairline border + soft shadow), with
  a **left sub-sidebar** (Settings | Billing) and content on the right. Gracefully **fall back to
  full-screen on small viewports**. Panes:
  - **Settings:** profile (identicon, name, email), the **referral code + copyable invite link**,
    current plan.
  - **Billing:** plan card; **entry-quota usage** (used / limit / resets-at) and **AI-token usage**
    (used / budget) from `getBillingState()`; **Upgrade** (Pro/Max) and **$-top-up** buttons →
    `/api/stripe/checkout` (redirect); **Manage / cancel** → `/api/stripe/portal`.
- **AI chat view** (separate view via the AI-Chat nav item). A live **streaming** chat against
  `/api/chat` (AI-SDK `useChat` or equivalent) — the server injects the user's calendar context, so
  the client just renders the exchange. Assistant text streams in with restrained motion; render
  markdown safely; autoscroll; show **remaining tokens** from billing state; empty state offers a
  starter prompt tied to the calendar. On `ai_budget_exhausted` `402`, route to Billing.

Use the wired tokens as-is; the **display font carries headings**; images via `next/image`. Reuse
`components/ui/` (shadcn) primitives; keep motion behind `useReducedMotion()`.

### 6. Visual self-review loop (core; degrade gracefully)
- **If Chrome tools are available:** run the dev server, sign in, and screenshot each surface —
  calendar, an open entry modal, the glassmorphic settings/billing modal, and the chat — at
  **mobile (~390px)** and **desktop (~1280px)**. Critique against the design-language note + the
  banned-patterns list; fix; repeat until it holds. Verify the glass actually reads as glass over
  real content behind it (not a flat panel), and the modal sizing is right.
- **If browser tools aren't connected:** say so, and run the manual review checklist (Definition of
  Done) by inspection, flagging what you couldn't verify without rendering.
- The dashboard must be **complete and usable when this step ends** — self-review raises quality, it
  doesn't finish unbuilt views.

### 7. Human-iteration checkpoint (raise the ceiling)
Present the rendered result (screenshots or the running URL), a one-line summary of each view, and
**2–4 things you're least sure about** (e.g. "the glass opacity", "calendar column density", "how
the dropup emerges", "chat message rhythm") — invite direct critique, then iterate until the user is
happy. "More whitespace / calmer motion / bigger headings" are expected rounds — this is where the
polish comes from. If the user says ship it, it stands (it's already complete).

### 8. Verify & commit
`npm run build` succeeds; dev server boots; no console errors; no layout shift. Commit as its own
clean change on top of the backend baseline. Touch nothing outside the gated route +
`components/dashboard/*`.

---

## Banned patterns — actively avoid these tells of AI dashboard slop
- A boxy grey **admin-panel sidebar** with generic icon+label rows and no relation to the palette.
- A **data-table dump** or a row of three **stat cards** as the primary surface.
- A settings modal that's a **plain centered white rectangle** — "glassmorphic" that's just a solid
  card with a drop shadow (no real translucency, no blur over content behind it).
- **Emoji as nav/feature icons**; everything centered; uniform card grids as a crutch.
- Calendar entries rendered as a **flat bulleted list** instead of living in the day cells.
- **Fake data** left in the calendar/chat; unhandled empty/error/`402` states; a chat that clearly
  doesn't stream. Motion for its own sake (parallax/float that doesn't serve hierarchy).

If the brief or reference genuinely calls for one of these, justify it. Otherwise, don't.

---

## Making it actually beautiful (raise the ceiling)
1. **The calendar is the product — give it the display font and room.** The week grid, its titles in
   the display face, generous cell breathing room, and disciplined dot color do more than any chrome.
2. **Glass is about depth, not decoration.** Real translucency + blur over *actual content behind it*
   (the dimmed calendar), one hairline border, a soft shadow — so the modal floats. A solid card
   with blur classes but nothing behind it is not glass.
3. **Restraint with color.** Green grounds; orange/brown are sparing accents (a dot, a single CTA),
   never everywhere. A dashboard that uses its accent constantly has no accent.
4. **The dropup should feel physical.** It emerges upward from the user block with a short,
   well-eased transition and correct anchoring — not a menu that teleports in.
5. **Coherence with the landing.** Someone moving from the marketing page into the app should feel
   one continuous product — same type, same calm, same palette discipline.
6. **Honesty about the ceiling.** Say when something is competent-but-not-lovely and surface it at
   the Step-7 checkpoint. Beauty comes from revision, not one perfect pass.

---

## Definition of Done
1. `npm run build` succeeds; dev server boots; no console errors; no layout shift.
2. **Complete & usable in one pass:** shell, weekly calendar, entry create/edit/delete modal,
   shared settings/billing modal, and streaming AI-chat all built and populated — no
   `TODO`/lorem/half-styled sections.
3. **Consumes the backend contracts only** — no client-side quota/plan/presign/LLM logic; all
   mutations dispatch to the stage-3 endpoints; the typed `402` routes to upgrade/top-up.
4. **Sidebar + user block + dropup** work (Calendar active, Actions disabled-not-dead, AI Chat;
   Settings/Billing/Logout wired).
5. **Weekly calendar** is interactive: day-click creates, entry-click edits/deletes, week nav works,
   entries live in day cells with brand-dot colors and display-font titles.
6. **Settings/Billing modal** is one shared glassmorphic surface (~3/5 × 3/5, centered, real
   translucency+blur, left sub-sidebar), full-screen fallback on mobile; Billing shows entry + AI
   usage and wires checkout/top-up/portal.
7. **AI chat** streams with server-injected calendar context and shows remaining tokens.
8. **Every state handled** (loading/empty/error/402); optimistic UI rolls back on failure.
9. **Accessible + responsive:** real dialogs/menus (focus trap, `Esc`, return focus), keyboard-
   navigable calendar, AA contrast, mobile → desktop; **motion honors `prefers-reduced-motion`.**
10. Tokens used as-is (no parallel system); display font carries headings; images via `next/image`.
11. Visual self-review done (browser loop, or manual checklist with the gap flagged).
12. Nothing outside the gated route + `components/dashboard/*` was modified.

## Out of scope — do NOT build in this stage
Schema/env/`lib/` clients/enforcement/webhooks (stage 3 owns them — consume, don't touch); the
marketing route (stage 2); deployment (a later stage); the disabled "Actions (coming soon)" feature
itself; multi-calendar/team features. The UI **renders and dispatches**; it never enforces or transacts.

---

## Knowledge Appendix — dashboard craft notes

> A starting point, not gospel. Re-verify component APIs at runtime; keep versions aligned with what
> the foundation pinned (no conflicting major of the UI/animation/AI libs).

- **Server layout, client leaves.** The gated `layout.tsx` is a server component: `requireUser()` +
  `getBillingState()` once, `export const dynamic = 'force-dynamic'`, then pass state to client
  components (calendar, modals, chat). Keep data-fetching on the server; interactivity on the client.
- **Dropup.** A Radix `DropdownMenu`/`Popover` anchored to the user block with `side="top"` (and
  collision handling) — real menu semantics (focus, `Esc`, arrow keys), not a toggled `div`.
- **Glassmorphism recipe.** Translucent background + blur + hairline border + soft shadow over a
  dimmed backdrop, e.g. `bg-background/60 backdrop-blur-xl border border-border/60 shadow-2xl` on a
  Radix `Dialog.Content` sized `w-[60vw] h-[60vh]` (with min/max clamps) and centered; the overlay
  dims the calendar so the blur has *content to blur*. Collapse to `w-screen h-screen` on small
  screens. Respect reduced-transparency/motion preferences.
- **Weekly calendar.** Evolve `components/landing/weekly-calendar.tsx`: seven columns, entries placed
  in day cells (dot = `bg-brand`/`bg-brand-orange`/`bg-brand-brown`, time, display-font title), a
  clickable empty area per day, `prev/next/today` week nav, today emphasis. Fetch the visible range;
  revalidate after mutations. Keyboard-navigable cells.
- **Streaming chat.** AI-SDK `useChat` (or equivalent) → `/api/chat`; the server injects calendar
  context so the client sends only the user turns. Stream assistant text with restrained motion,
  render markdown safely (sanitize), autoscroll to the latest, and read remaining tokens from billing
  state. On `ai_budget_exhausted`, open Billing rather than erroring.
- **402 as UX.** Treat `quota_exhausted` / `ai_budget_exhausted` as a designed moment: a calm prompt
  that opens the Billing pane with the right CTA (upgrade or top-up), not a red error toast.
- **Avatar.** `gravatarUrl(email)` from `lib/avatar.ts` yields the identicon — no extra network state.
- **Motion.** Framer Motion for modal/dropup entrances and entry placement — short, well-eased,
  `useReducedMotion()`-gated. Motion guides attention (a modal settling, text streaming); it never
  competes with the calendar.

**Reads from the brief:** identity/voice (chat + empty-state tone), style adjectives + reference
sites + palette + fonts (the whole visual language), plans table (Billing pane), primary-entity
shape (calendar + entry modal fields), gated route (where this all mounts).

**Depends on `set-app-backend` for:** `requireUser()`, `getBillingState()`, primary-entity CRUD,
`/api/assets`, `/api/chat`, `/api/stripe/checkout|portal`, the logout action, and the typed `402`
shapes. Build against those contracts; never reach past them into schema or enforcement.
