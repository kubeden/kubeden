---
name: set-landing-page
description: >-
  Build the landing/marketing page (stage 2) of a web app whose foundation already exists
  (see set-project-structure). Reads project specifics from PROJECT.md, studies the brief's
  reference sites and wired design tokens, writes real copy from the brief, then builds the
  marketing route and components/landing/* with tasteful motion — STOPPING at a design-language
  gate before building and doing a visual self-review after. Engineered to defeat generic
  "AI landing page" output: enforces the project's specific voice and design language. Use after
  the foundation stage, before dashboard work. Touches only the marketing route and landing
  components — never schema, env, lib clients, or gated areas.
---

# Set Landing Page — the marketing page, on top of an existing foundation

This skill builds **only the landing page** (stage 2). It assumes the foundation skill
(`set-project-structure`) already laid the contracts: the `(marketing)` route, `components/landing/`,
wired design tokens (palette + fonts), and a `PROJECT.md` brief. Later stages (dashboard, payments,
deploy) are **separate skills that read the same brief** — adding them never edits this one.

> **Mental model:** the foundation skill is about *correctness* (build passes, migration generates —
> all verifiable). This skill is about *taste and persuasion*, where AI agents fail in a predictable
> way: the gradient hero, "Supercharge your workflow," three icon cards, a fake testimonial. **This
> skill's real job is to defeat that default** — to drag output away from the generic template and
> toward *this product's* actual voice and *this brief's* actual design language. Almost every step
> below exists for that reason.

---

## Step 0 — Load the brief and verify the foundation (required first)

1. Read **`./PROJECT.md`** in the target repo. It is the single source of truth for identity,
   one-liner, business model / plans table, design (style adjectives, reference sites, palette,
   fonts), and gated areas. Wherever this skill says "*per the brief*," read it from `PROJECT.md` —
   never invent it.
2. **Verify the foundation contracts exist** before building anything:
   - the marketing route (e.g. `src/app/(marketing)/`) and `src/components/landing/`,
   - design tokens wired into the Tailwind theme (the brief's palette + the body/display font
     families via `next/font`),
   - the auth entry route the CTAs will point at (e.g. `/login`, `/signup`).
   If these are missing, **stop** and tell the user to run the foundation skill first. This skill
   does not lay foundation.

---

## Operating principles (apply throughout)

1. **Defeat the default.** The enemy is generic. Every decision should be traceable to the brief
   (its one-liner, plans, reference sites, palette, fonts) or to the reference sites you studied —
   not to a generic SaaS template. If you can't justify a choice from those, reconsider it.
2. **Copy before layout.** Write the real words first — from the brief, never lorem, never invented
   features. Layout serves copy, not the reverse.
3. **Specific over generic.** Use the brief's actual product voice and the reference sites' actual
   rhythm. Lean into what makes this product unlike others.
4. **Motion serves hierarchy, not decoration.** Tasteful, restrained, and always honoring
   `prefers-reduced-motion`. A page that's calm beats a page that's busy.
5. **Stay in your lane.** Additive only. Touch the marketing route and `components/landing/*`.
   Never edit schema, env, `lib/` clients, the gate file, or `components/dashboard`.
6. **Ship-complete in one pass.** Iteration *will* happen — but never rely on it. Every pass must
   leave a **complete, shippable page**: all sections built and populated with real content, no
   `TODO`/placeholder/lorem, no half-styled or commented-out sections, no "we'll polish this later"
   gaps. The human-iteration checkpoint (Step 8) is for **raising the ceiling**, not for finishing
   work you left undone. If you run low on effort, cut a *section* cleanly rather than ship a
   broken or stubbed one.

---

## Procedure

### 1. Load brief & verify foundation
Per Step 0.

### 2. Study the reference (don't just "get inspired")
- **Actually look at the brief's reference site(s).** If the Chrome browser tools are available,
  open each reference URL, screenshot it, and read its layout. If they aren't, fetch the page and
  reason from its markup, and say you did the lighter version.
- Extract **concrete, copyable decisions**, not vibes: type scale ratio, whitespace rhythm / spacing
  unit, section order, how much motion, how restrained the palette use is, serif-vs-sans roles.
- Also read the **already-wired design tokens** in the repo (Tailwind theme + font families) so the
  page uses them as-is — do **not** invent a parallel token system.

### 3. Write the copy (from the brief)
- Draft the **actual words**: hero headline + subhead, the value props, section headings, pricing-card
  labels (straight from the brief's plans table), and the CTA text.
- Source everything from the brief's one-liner, business model, and voice. **No lorem. No invented
  features or fake testimonials/logos.** If a needed fact isn't in the brief, **ask the user** rather
  than fabricating it.

### 4. Produce the design-language note + section IA
A short artifact (≈8–12 lines) that turns the brief's *adjectives into numbers* — adjectives
underdetermine a layout, so commit to specifics here (see "Making it actually beautiful" below):
- **Type scale:** the actual display/body sizes and the ratio between steps (e.g. 1.25), plus which
  font + weight each role uses.
- **Spacing unit & section rhythm:** the base unit and the vertical breathing room between sections.
- **Color usage:** which token grounds the page, which is the *sparing* accent, and where each appears.
- **Motion stance:** what animates and how restrained.
- **Ordered section inventory:** e.g. hero → how-it-works → features → pricing → footer CTA — each
  section tied to specific brief content (no section without a reason to exist).

### 5. Gate 1 — STOP and wait (before building)
Present and **wait for explicit approval. Build nothing until approved.** Show:
1. What you learned from the **reference site(s)** and the wired tokens.
2. The **copy** (headline, subhead, value props, pricing labels, CTA).
3. The **design-language note + section IA**.
4. Motion plan (what animates, how restrained) and the **banned-patterns** you're avoiding.
5. Anything you're unsure about or assuming.

### 6. Build (only after approval)
- Build the marketing route's page(s) and **section components in `components/landing/`** — one
  component per section, composed in the route. Reuse `components/ui/` (shadcn) where it fits.
- **Use the wired design tokens as-is** (Tailwind color classes, the display/body font families,
  `rounded-*`, spacing). The display font is the personality — use it deliberately.
- **Copy is real** (from Step 3). CTAs route to the brief's auth entry (e.g. `/signup`) — no backend.
- **Motion via the stack's animation lib** (e.g. Framer Motion): gentle scroll reveals / hero
  settle, generous easing. Wrap motion so `prefers-reduced-motion` disables it.
- **Images:** ship-with-app art in `public/`, served via `next/image` (sized, no layout shift).
- **Responsive + semantic + accessible:** mobile-first, real landmark elements (`header`/`main`/
  `section`/`footer`), alt text, focus states, sufficient contrast.

### 7. Visual self-review loop (core; degrade gracefully)
- **If the Chrome browser tools are available:** run the dev server, open the page, and screenshot
  at **mobile (~390px)** and **desktop (~1280px)** widths. Critique your own output against the
  design-language note and the **banned-patterns list** below — then fix what's off, and repeat
  until it holds. This is the landing-page equivalent of "build passes": it closes the gap that
  agents can't normally *see* what they made.
- **If browser tools aren't connected:** say so, and run the **manual review checklist** (Definition
  of Done) by inspection instead, flagging anything you can't verify without rendering.
- **The page must be complete and shippable when this step ends** — self-review raises quality, it
  does not finish unbuilt sections (principle 6).

### 8. Human-iteration checkpoint (raise the ceiling)
The self-review loop raises the *floor*; a human eye raises the *ceiling*. The page is already
shippable at this point — this step is for polish, not completion.
- Present the rendered result: the **mobile + desktop screenshots** (or the running dev URL), a
  one-line summary of each section, and **2–4 specific things you're least sure about** ("the hero
  whitespace", "orange used here vs. there", "headline size") — invite direct critique.
- Then **iterate on the user's feedback** until they're happy. Treat "more whitespace / bigger
  headline / calmer motion" as normal, expected rounds — this is where beauty actually comes from.
- If the user gives no feedback / says ship it, the page stands as-is (it's already complete).

### 9. Verify & commit
- `npm run build` succeeds; dev server boots; no console errors; no layout shift.
- Commit the landing page as its own clean change on top of the foundation baseline. Do not touch
  files outside the marketing route and `components/landing/`.

---

## Banned patterns — actively avoid these tells of AI slop
- Generic gradient hero (purple→blue) with no relation to the brief's palette.
- "Supercharge / Unleash / Effortless / Seamless / Elevate your [noun]" copy.
- Three feature cards with generic icons and no real substance.
- Fake testimonials, fake company logos, fabricated stats.
- Emoji used as feature icons; everything centered; uniform card grids as a crutch.
- Motion for its own sake (parallax/float that doesn't serve hierarchy).
- A screenshot-in-a-browser-frame hero used reflexively instead of something specific.

If the brief or reference genuinely calls for one of these, justify it explicitly. Otherwise, don't.

---

## Making it actually beautiful (raise the ceiling)

Avoiding the banned patterns gets you to *not generic*. Beauty needs more — and it comes from
**specificity, restraint, and iteration**. A text skill can't supply taste, but it can force the
conditions that let taste happen.

1. **Turn adjectives into numbers (the biggest lever).** "Elegant / warm" renders a hundred ways;
   commit to specifics in the Step-4 note and hold them: an explicit type scale and ratio, a base
   spacing unit, generous and *consistent* section rhythm. Vague intent is what produces mediocre,
   safe output — concrete constraints produce considered output.
2. **Let the display type carry the page.** One large, confident display headline in the brief's
   display font does more than any decoration. Set it big, give it room, get the line-length and
   leading right. This single move is most of the difference between striking and forgettable.
3. **Whitespace is the design.** Editorial references earn their calm through space, not ornament.
   Err toward more breathing room than feels necessary, especially around the hero and between
   sections. Crowding reads as cheap.
4. **Restraint with color.** One grounding color, accents used *once or twice* where they earn
   attention. A page that uses its accent everywhere has no accent.
5. **Coherence over features.** The page should feel made by someone who understands the product's
   soul (its style adjectives + one-liner). Every section in service of one feeling beats a pile of
   impressive-but-unrelated sections.
6. **Honesty about the ceiling.** The agent should *say* when something is competent-but-not-lovely
   rather than declaring victory — and surface it at the Step-8 checkpoint. Naming the gap is what
   makes the human iteration productive. Beauty is reached by revision, not by one perfect pass.

---

## Definition of Done
1. `npm run build` succeeds; dev server boots; no console errors.
2. **Complete & shippable in one pass** — every section in the IA is built and fully populated; no
   `TODO`/placeholder/lorem, no half-styled or commented-out sections. A page someone could deploy
   today, before any iteration.
3. The page reads as **specific to this product** — copy from the brief, design language from the
   reference + wired tokens. It would not be mistaken for a generic template.
4. **Real copy** throughout (no lorem); pricing reflects the brief's actual plans; no fabricated
   social proof.
5. Sections built as components in `components/landing/`, composed in the marketing route.
6. **Responsive** at mobile + desktop; **semantic** landmarks; accessible (alt text, focus,
   contrast).
7. **Motion is tasteful and honors `prefers-reduced-motion`.**
8. Images via `next/image`; no layout shift; tokens used as-is (no parallel design system).
9. Visual self-review done (browser loop, or manual checklist with the gap flagged).
10. Nothing outside the marketing route + `components/landing/` was modified.

## Out of scope — do NOT build in this stage
Dashboard or any gated UI; real signup/auth flows or backends behind the CTAs; payments/Stripe
checkout; data-driven sections needing the DB; editing schema, env, `lib/` clients, or the gate
file. CTAs **route**; they don't transact.

---

## Knowledge Appendix — landing-page craft notes

> A starting point, not gospel. Re-verify package APIs at runtime; confirm versions match the set
> the foundation pinned (don't introduce a conflicting major of the animation or UI libs).

- **Display font is the personality.** A distinctive display face (e.g. a soft optical serif like
  Fraunces) used large in the hero separates a page from every sans-serif SaaS clone instantly.
  Let the body font (e.g. Inter) recede into UI/body. Both should already be wired by the foundation.
- **Sell the feeling, then the features.** The hero should convey what the product *feels like*
  (from the brief's style adjectives and one-liner), not lead with a feature dump.
- **Color discipline.** Use the primary as the grounding color, secondary/tertiary as sparing
  accents (one warm pop, not everywhere). Whitespace is a design element — editorial references
  earn their calm through space, not decoration.
- **Framer Motion (or the stack's lib):** prefer small, intentional reveals — `whileInView` with
  `viewport={{ once: true }}`, generous easing, short stagger. Gate all of it behind
  `useReducedMotion()` so reduced-motion users get a static page. Motion should guide the eye down
  the page, reinforcing hierarchy — never compete with the content.
- **`next/image`:** always set width/height (or `fill` + sized container) to avoid CLS; use
  `priority` only on the hero image. Decorative SVGs can be inline.
- **Accessibility baseline:** one `<h1>`, logical heading order, landmark elements, visible focus
  states, alt text, and contrast that meets WCAG AA against the chosen palette.
- **Performance:** keep the hero light; lazy-load below-the-fold media; avoid blocking fonts (the
  foundation's `next/font` setup handles this). Aim for a clean Lighthouse pass.

**Reads from the brief:** identity & one-liner (hero voice), style adjectives + reference sites
(design language), palette + fonts (already wired tokens), plans table (pricing section), gated
areas (where CTAs point).
