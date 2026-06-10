# Idea Brief: Skills Showcase Deck-Builder

**Slug:** `skills-showcase`
**Status:** Idea-scoped, ready for ICP
**Created:** 2026-06-09

## Summary

Rebuild `gskillpacks.com` from an informational skill catalog into an interactive deck-building experience. Users tear open sealed booster packs (categories), inspect skill cards (benchmarks, platform, tags), and assemble workflow decks mapped to the five canonical workflow types. Building a deck produces actionable output: a copyable CLI command (`npx skillpacks install-deck ...`) and a downloadable `project.json` config.

The site uses **dual branding**: card-game terminology as the primary voice (the GSkillPacks brand), with technical terms in parentheticals and tooltips so developers always know what they're installing. Dual branding is scoped to the showcase only; docs and CLI keep current terminology.

The current showcase pages will be archived once the deck-builder replacement is live. This is a fresh start on page structure, not a retrofit of existing pages.

## Problem Hypothesis

The current showcase presents skills as a flat searchable catalog with workflow documentation pages. Users can read about packs and skills but don't get an intuitive feel for how to compose their own skill library.

The deck-building metaphor makes the selection process tactile and exploratory. Users tear open packs, inspect cards, and assemble decks, which communicates the composable nature of the system in a way that a table of names and descriptions cannot.

Additionally, the existing card-game primitives (SealedPack, SkillCard, PackOpener, BottomSheet, debug harness) already exist on a hidden `/prototype` debug page. The investment is partially made but invisible to users.

## Beneficiary Hypothesis

- **Primary:** Developers evaluating GSkillPacks who want to understand what skills exist and how to assemble them into workflows (decks). The deck-builder is both a discovery tool and a configuration wizard.
- **Secondary:** Existing users configuring new projects who already know the system but want a faster way to pick packs for a new repo.

## Product Category Guess

Developer tool interactive catalog / configuration UI with a card-game brand wrapper. Not a standalone game. The card-game metaphor is a UX convention for real skill library management and brand differentiation.

## Value Wedge

- No other AI skill/agent marketplace uses a deck-builder metaphor
- The card-game framing makes the abstract concept of "composing AI workflow toolchains" concrete and engaging
- Dual branding keeps it accessible: card-game voice for brand personality, technical parentheticals for clarity
- The actionable output (CLI command + config download) bridges the gap from "fun browsing" to "actually installed in my project"

## Constraints

| Constraint | Source | Rationale |
|---|---|---|
| Existing card primitives (SealedPack, SkillCard, PackOpener, BottomSheet, debug harness) are the starting asset library | from repo | 678-line SealedPack + full animation state machine already built |
| Current generated inventory is 373 platform entries, 190 unique mirrored skills, 179 unique pack skills, 11 unique global skills, and 41 active packs; the old 157-card / 7-set map in `tasks/pack-card-hierarchy.md` is historical prototype display scope | from repo | Content inventory exists, but deck-builder set data must be regenerated from `apps/skills-showcase/public/assets/skills-data.js` before implementation |
| Must coexist with npm `skillpacks` CLI distribution | from repo | Showcase is visual; CLI is the install mechanism |
| Must coexist with shadcn-style repo distribution | from prompt | Both distribution paths feed from the same manifest |
| Next.js 16 + React 19 + Framer Motion + Tailwind 4 stack stays | from repo | No framework migration |
| No GitHub Actions | from repo | Project convention |
| Fresh start on page structure | from prompt | Deck-builder IS the experience, not a retrofit |
| Dual branding scoped to showcase only | from prompt | Docs and CLI keep current terminology |
| Archive old showcase once replacement is live | from prompt | Preserve old code in archive, don't delete |

## Non-Goals

- No real trading/collecting system with accounts, inventories, or progression
- Not replacing the npm CLI distribution
- Not designing new animation primitives (existing state machine covers the interaction model)
- Not an e-commerce or paid card system
- Not renaming terminology outside the showcase (docs, CLI, SKILL.md frontmatter stay as-is)

## Assumptions And Unknowns

### Assumptions

| Assumption | Source | Status | What would change it |
|---|---|---|---|
| The historical 7 booster-set prototype map from `pack-card-hierarchy.md` can seed the sealed-pack experience after current generated data is regenerated into deck-builder set data | from repo | Provisional | User wants a different grouping, fewer/more sets, or generated-data analysis shows the old display grouping is no longer useful |
| The 2 archetypes (RD, AFPS) and 5 canonical decks (VARD, ORD, Business AFPS, Devtool AFPS, Game AFPS) are the deck-building structure | from repo | Provisional | User wants custom/freeform deck building beyond the convention |
| Users understand the deck-builder metaphor without onboarding | inferred | Assumed | User testing reveals confusion |
| CLI command + project.json export is sufficient to bridge browsing to installation | inferred | Assumed | Users expect one-click web install or direct GitHub integration |

### Unknowns to Resolve Downstream

1. **Deck composition UX:** How does a user add cards to a deck? Drag-and-drop, click-to-add, auto-suggest based on archetype?
2. **Page/route structure:** One interactive canvas, or distinct routes (e.g., `/` shelf, `/deck/:id` builder, `/card/:id` detail)?
3. **Mobile experience:** Current card animations are gesture-heavy (drag-to-tear). How does this work on mobile?
4. **Data generation pipeline:** Does `generate-skills-showcase-data.mjs` need restructuring for deck-builder data shapes?
5. **shadcn registry browser tie-in:** Does the showcase double as the shadcn-style registry browser, or are those separate surfaces?

### Dual Branding Map

| Card Game (GSkillPacks) | Technical | Current Term | Scope |
|---|---|---|---|
| Deck | Named workflow sequence | Deck | Showcase UI |
| Archetype | Workflow tempo class | RD / AFPS | Showcase UI |
| Pack / Booster | Category / Pack | Pack | Showcase UI |
| Card | Skill | Skill | Showcase UI |
| Tear open / Collect | Install / Enable | Install | Showcase UI |

### Existing Asset Inventory

| Component | Lines | Status | Notes |
|---|---|---|---|
| SealedPack.tsx | 678 | Prototype | Tear-to-open with horizontal drag, shimmer foil, page curl |
| SkillCard.tsx | 90 | Prototype | Flippable card with front/back faces, 180x252px |
| CardFace.tsx | 72 | Prototype | Type badge, benchmark grade, title, command, version |
| PackOpener.tsx | 385 | Prototype | Fan-out drawer with staggered springs, collapse-to-target |
| BottomSheet.tsx | 194 | Prototype | Slide-up drawer with drag-to-dismiss |
| debug/* | ~500 | Prototype | Full animation debug harness |

**Key reference documents:** `tasks/pack-card-hierarchy.md`, `docs/decks.md`, `docs/skillpacks-npm-distribution.md`, `alignment/uat-card-pack-migration.html`, `apps/skills-showcase/alignment/animation-state-machine.html`

## ICP Readiness

The concept is **ready for ICP analysis** with the following inputs:

- **Primary beneficiary hypothesis:** Developers evaluating GSkillPacks for project adoption
- **Secondary beneficiary:** Existing users configuring new projects
- **Market structure:** Single-sided (developer tool catalog, not a marketplace)
- **Assumptions to test first:** Whether the deck-builder metaphor resonates with developers vs. feeling gimmicky; whether the 2 archetypes (RD/AFPS) and [descriptor]+[archetype] naming convention cover real workflow patterns
- **Existing evidence:** Devtool research docs in `research/` (positioning, adoption, DX journey, user map, monetization) provide market context

**Note:** The `business-discovery` pack is not currently enabled. ICP analysis requires `/pack install business-discovery` first.

## Next Steps

**Primary:** `/pack install business-discovery` then `/customer-discovery`

This installs the research skills (customer discovery, competitive analysis, value prop, positioning, lean canvas) needed before any design or development work.

**Other options:**
- `/customer-discovery` directly if `business-discovery` is already installed
- `/pack recommend` if unsure about which research skills to install
