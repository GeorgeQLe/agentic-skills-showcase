# Idea Brief Interview Log: Skills Showcase Deck-Builder

**Skill:** idea-scope-brief
**Slug:** skills-showcase
**Date:** 2026-06-09

## Interview Summary

This concept was scoped from an existing alignment page and repo context rather than a live terminal interview. The user had already built card-game prototype components (SealedPack, SkillCard, PackOpener, BottomSheet) on a hidden `/prototype` debug page, preserved a historical 157-card / 7-set prototype display map in `tasks/pack-card-hierarchy.md`, and defined five canonical decks on a domain x tempo matrix in `docs/decks.md`. Current generated data is larger: 373 platform entries, 190 unique mirrored skills, 179 unique pack skills, 11 unique global skills, and 41 active packs.

The idea is to rebuild `gskillpacks.com` from its current informational catalog into an interactive deck-builder experience using these existing primitives. The concept uses dual branding (card-game terminology for the showcase, technical terms in parentheticals) scoped only to the showcase UI.

## Context Sources

- **From repo:** Existing card-game prototype components, current generated inventory counts (373 platform entries, 190 unique mirrored skills, 179 unique pack skills, 11 unique global skills, 41 active packs), historical 157-card / 7-set prototype display map, 5 canonical decks (VARD, ORD, Business AFPS, Devtool AFPS, Game AFPS), 2 archetypes (RD, AFPS), animation state machine, Next.js 16 + React 19 + Framer Motion + Tailwind 4 stack
- **From prompt:** Fresh start on page structure (not retrofit), dual branding scoped to showcase only, archive old showcase when replacement is live, coexist with shadcn-style repo distribution
- **Inferred:** Users will understand the metaphor without onboarding, CLI + config export bridges browsing to installation

## Gate Responses

| Gate | Answer |
|---|---|
| Idea Identity & Slug | Yes -- skills-showcase is correct |
| Scope & Non-Goals | Correct as listed |
| ICP Readiness | Ready for ICP |
| Artifact Destination | Approve all three files |
| Post-Approval Route | /pack install business-discovery then /customer-discovery |

## Section Feedback

No section feedback was provided.
