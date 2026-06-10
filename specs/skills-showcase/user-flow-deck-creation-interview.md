# Interview Log — User Flow Map: gskillpacks.com Deck Creation

- **Skill:** `/user-flow-map` v0.0 (product-design pack)
- **Date:** 2026-06-10
- **Product path:** `skills-showcase`
- **Spec:** `specs/skills-showcase/user-flow-deck-creation.md`
- **Alignment page:** `alignment/user-flow-map-deck-creation.html` (confirmed)

## 1. Evidence Consulted

- `apps/skills-showcase/docs/deck-builder-ux.md` — four locked UX decisions ("Decided with user 2026-06-10"): deck-first entry, one-canvas site with real URLs, tap-to-add gesture, phase-labeled slots; plus state & persistence section (localStorage per deck slug, packs reseal per session, no accounts).
- `docs/decks.md` — five preset decks (VARD, ORD, Business AFPS, Devtool AFPS, Game AFPS) on a domain × tempo grid; graduation paths VARD→Business AFPS, ORD→Devtool AFPS.
- `docs/skillpacks-npm-distribution.md` — `npx skillpacks install-deck <slug>` maps deck slug → pack list via manifest; modified decks need explicit pack lists.
- Animation plan Amendment 2 (`alignment/animation-design-planner-deck-builder-transitions.html`) — routed the phase-slot chore question to this flow map: demo's 1:1 card-to-slot mapping "reads as building a deck is a chore with no choices".
- `research/skills-showcase/idea-brief.md` — persona basis (ICP/positioning not yet run; manifest `next_skill: /icp`).
- `research/.progress.yaml` — active product path `skills-showcase`.
- Repo observation: `apps/skills-showcase/app/` has no `/deck/*` or `/card/*` routes; `public/assets/skills-data.js` contains zero deck definitions.

## 2. Flow Assumptions Checkpoint (terminal interview)

### Delivery attempts

The checkpoint was presented three times before it reached the user:

1. **Attempt 1 (failed text delivery):** checkpoint text printed before the question dialog did not reach the user. Answers: Checkpoint = *"where are the assumptions?"*; slot-model direction answered anyway, recorded verbatim: **"we have preset decks which users can modify as needed with default phases."**; mobile scope = "Include mobile branch notes (Recommended)".
2. **Attempt 2 (failed text delivery):** re-presented as text above a single confirm question. Answer: *"there are no assumptions above"* — text still not visible to the user.
3. **Attempt 3 (preview-pane re-ask, succeeded):** the full 19-item checkpoint was embedded directly in the question dialog as a preview pane. Answer: **"Confirmed as-is"** — all assumptions carry into the flow spec.

### Questions asked, options, and answers

| Question | Options presented | Recommendation | User answer |
|---|---|---|---|
| Does the Flow Assumptions Checkpoint hold, or corrections? (attempt 1) | Confirmed as-is / Corrections (I'll specify) | — | "where are the assumptions?" (text had not reached the user) |
| Which slot-model direction should the flow map encode for canonical decks? | Keep phase slots + speed/choice fixes (Recommended) / Slot alternates (draft-style same-phase choices) / Loosen canonical to user-defined phases | Keep phase slots + speed/choice fixes | Free-form, verbatim: **"we have preset decks which users can modify as needed with default phases."** |
| Should the flow map include a mobile branch, or mark mobile out of scope? | Include mobile branch notes (Recommended) / Out of scope | Include mobile branch notes | "Include mobile branch notes (Recommended)" |
| Do the 19 assumptions above hold? (attempt 2) | Confirmed as-is / Corrections (I'll specify) | — | "there are no assumptions above" (text still not visible) |
| Flow Assumptions Checkpoint — full list in the preview pane. Confirm or correct? (attempt 3) | Confirmed as-is (full 19-item checkpoint in preview) / Corrections (I'll specify) | — | **"Confirmed as-is"** |

### Confirmed checkpoint content

The 19 confirmed assumptions (persona & goal 1–3, entry points 4–7, happy path 8, branches 9–13, decisions 14, states 15–16, handoffs 17, boundaries 18–19) are recorded in full in §2 of the spec. Key user-driven items: #9 (preset decks have default phases, users modify as needed → custom variant with explicit pack-list CLI — from the verbatim slot-model answer) and #19 (mobile wireframe-level branch notes included).

## 3. Flow Coverage Checkpoint

Presented after mapping, before building the alignment page, with the full coverage list in a preview pane: persona & goal ✓; entry points ✓ (6); happy path ✓ (9 steps); branches ✓ (10, including the new B1 deck-level Collect-all); decision points ✓ (10: 6 user, 4 system); screens/routes ✓ (7); actions + states per screen ✓; failure/recovery ✓ (10); handoffs ✓ (5); wireframe notes ✓ per screen + mobile; non-goals preserved ✓; known gaps carried as open questions (Collect-all motion mechanics, swap gesture detail, custom phase editing depth, Next 16.2.6 intercepting-route spike).

**User answer:** "Coverage complete — build it."

## 4. Alignment-Page Gate Answers (final compiled YAML, 2026-06-10)

All 12 gates answered, `section_feedback: []`, no `needs-clarification`, no requested edits.

| Gate | Answer |
|---|---|
| Evidence coverage | Sufficient — proceed on idea-brief personas |
| Assumptions record | Accurate — carry into the spec |
| Slot-model verdict | Accept resolution as written |
| Proposed flow map | Accept as proposed |
| Branch & decision coverage | Complete for v1 |
| Screen inventory & matrix | Right surface set |
| State coverage | Covers v1 |
| Failure & handoff coverage | Covered for v1 |
| Wireframe notes | Right as handoff guidance |
| Artifact destination | Approve destination (`specs/skills-showcase/user-flow-deck-creation.md`) |
| Proposed file changes | Approve file change set |
| Post-approval route | `/pack install ui-interview`, then `/ui-interview --requirements-only deck-creation` |

The verbatim final compiled YAML is preserved in the approval-record block of the confirmed alignment page.

## 5. Remaining Gaps

- **ICP/positioning not run** — Evaluator/Returner personas come from the idea brief only; approved as a recorded risk, resolves via `/icp` → positioning (business-discovery pack).
- **Collect-all animation amendment** — the new deck-level Collect-all batching trigger needs a small amendment to the animation design plan (sequential pack opens vs direct shelf flights).
- **Swap gesture detail** — how a filled slot's card gets swapped (tap-while-occupied prompt vs slot context action) resolves in `/ui-interview --requirements-only deck-creation`.
- **Custom phase editing depth** — proposed add/rename/remove only, drag-reorder deferred from v1; confirm in `/ui-interview`.
