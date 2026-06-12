# User Flow Spec - Skills Showcase Skill Execution Handoff

- **Status:** confirmed (approved 2026-06-12 via final compiled YAML; 7/7 gates answered, `section_feedback: []`)
- **Skill:** `$user-flow-map` v0.2
- **Product path:** `skills-showcase` (active in `research/.progress.yaml`)
- **Alignment page:** `alignment/user-flow-map-skill-execution-handoff.html`
- **Interview log:** `specs/skills-showcase/user-flow-skill-execution-handoff-interview.md`
- **Scope:** Flow structure only - screens, routes, actions, decisions, branches, states, failure paths, handoffs, and wireframe-level notes for the step where a user leaves the showcase with a local execution artifact.
- **Explicit non-goals:** no implementation code, CLI behavior changes, GitHub Actions, production architecture, account system, visual styling, layout polish, or backend execution from the browser.

## 1. Scope And Source Evidence

The flow starts after a user has selected a deck or workflow and needs to leave the site with an actionable local execution artifact. It connects the existing deck-builder output model to the operating-mode model in `docs/operating-modes.md`: direct terminal execution, hybrid `/delegate`, async `/handoff --target=codex`, and Codex execution of an approved packet through `$exec --execute-approved`.

Corrected persona wording carried into this spec:

> Personas covered: a new evaluator choosing a GSkillPacks deck for adoption, and an existing user configuring another repo. Their shared goal is to leave the site with a clear command or config they can run locally.

| Evidence | Observed fact | Decision impact | Confidence |
|---|---|---|---|
| `research/.progress.yaml` | Exactly one active product path: `skills-showcase`. | Write canonical specs under `specs/skills-showcase/`. | High |
| `research/skills-showcase/idea-brief.md` | The showcase should produce actionable output: copyable CLI command and downloadable `project.json`. | The handoff flow must end in a local command/config artifact, not a web-only success state. | High |
| `specs/skills-showcase/user-flow-deck-creation.md` | Deck completion unlocks CLI, project.json download, share, and keep-editing paths. | Skill execution handoff starts from the completed deck/output state and extends artifact handoff. | High |
| `specs/skills-showcase/user-flow-deck-creation-interview.md` | Deck flow approval recorded artifact destination, file changes, and post-approval route gates. | Reuse the alignment-gated review model and do not overwrite deck-creation files. | High |
| `apps/skills-showcase/docs/deck-builder-ux.md` | Locked choices: deck-first entry, canvas plus real URLs, tap-to-add, phase-labeled slots, localStorage progress, no accounts. | Do not introduce account-backed install state or server-side execution. | High |
| `docs/decks.md` | Npm deck installs use `npx skillpacks install-deck <slug>`; the current release requires `bash` and `jq` for deck materialization, while direct npm pack installs do not require `jq`. | Prerequisite states must distinguish deck install from direct pack install/config download. | High |
| `docs/operating-modes.md` | Modes are `claude-only`, `codex-only`, and `hybrid`. Hybrid uses `/delegate`; async handoff uses `/handoff --target=codex`; Codex consumes with `$exec --execute-approved`. | The flow must branch by user execution mode and packet lifecycle without inventing new local automation. | High |
| `docs/operating-modes.md` and `scripts/approved-plan.sh` | Approval packet writes require `jq`; only lifecycle `approved` is executable; freshness checks can mark a packet `stale`. | Handoff branch needs prerequisite and stale-packet recovery states. | High |
| `apps/skills-showcase/app/workflows/page.tsx` and `workflow-data.ts` | `/workflows` presents AFPS phase walkthroughs; the Production workflow includes roadmap, plan phase, run, ship, and close steps. | Current app surface can enter handoff from workflow selection as well as from completed deck output. | High |
| Conversation checkpoints | Assumptions confirmed as-is, coverage reviewed, persona wording corrected. | Carry the corrected persona wording and show approval gates instead of re-asking terminal interview questions. | High |

## 2. Flow Assumptions Checkpoint

Checkpoint status from prior conversation context: assumptions confirmed as-is. Persona wording was corrected and treated as authoritative.

| # | Assumption | Source |
|---|---|---|
| 1 | The primary persona is a new evaluator choosing a GSkillPacks deck for adoption. | [from corrected conversation checkpoint] |
| 2 | The secondary persona is an existing user configuring another repo. | [from corrected conversation checkpoint] |
| 3 | Both personas share one success condition: leave the site with a clear command or config they can run locally. | [from corrected conversation checkpoint] |
| 4 | Entry can come from a completed deck output panel, the `/workflows` Production walkthrough, a shared deck URL, or docs/npm links that land on a deck/workflow surface. | [from spec + codebase] |
| 5 | Direct web-to-terminal execution is a copy path, not browser-side execution. | [from docs/decks.md + inferred boundary] |
| 6 | Web-to-repo execution is a download/copy path for `project.json` or command text; the user places or runs it locally. | [from idea brief + deck-creation spec] |
| 7 | Hybrid and async handoff paths explain existing commands: `/delegate`, `/handoff --target=codex`, and `$exec --execute-approved`. The showcase does not create hidden approval packets for the user. | [from operating-modes.md] |
| 8 | Approval packet lifecycle and freshness matter enough to be visible in the flow: draft, approved, consumed, stale, superseded, uncertain; only approved is executable. | [from operating-modes.md] |
| 9 | `jq` prerequisite messaging is required for packet write paths and npm deck materialization prerequisites. | [from docs/decks.md + scripts/approved-plan.sh] |
| 10 | States to represent: empty/no selection, loading data, generated output ready, copied/downloaded success, clipboard denied, missing prerequisite, stale packet, mode mismatch, invalid deck/workflow, offline after first load, and review/edit before handoff. | [inferred from evidence] |
| 11 | Handoffs include web to terminal, web to repo config, web to Claude orchestration, Claude to Codex through approval packet, and person-to-person sharing. | [from spec + operating-modes.md] |
| 12 | Layout and styling remain wireframe-level; UI details move to `$ui-interview --requirements-only skill-execution-handoff` after approval. | [from skill contract] |

## 3. Persona, Goal, And Success Condition

| Persona | Goal | Success condition | Tempo |
|---|---|---|---|
| New evaluator choosing a GSkillPacks deck for adoption | Understand enough about the deck/workflow to trust running it in a project. | Leaves with a clear local command, config download, or agent handoff route. | Exploratory: may inspect deck contents, prerequisites, and execution mode before copying. |
| Existing user configuring another repo | Move quickly from known deck/workflow to runnable setup. | Copies a command or downloads `project.json` with minimal friction. | Direct: wants fast copy/download plus recovery if local state is stale. |

## 4. Entry Points And Preconditions

| ID | Entry | Trigger | Precondition | Lands on |
|---|---|---|---|---|
| E1 | Completed deck output panel | User fills deck core slots or selects a completed preset. | Deck output command/config can be generated. | S1 Handoff source. |
| E2 | `/workflows` Production workflow | User explores the AFPS Production workflow in the current TUI surface. | Workflow data loads and the Production workflow is selectable. | S1 Handoff source with workflow-derived command path. |
| E3 | Direct deck URL such as `/deck/[slug]` | Shared or bookmarked deck. | Slug is known; otherwise recover through invalid-deck state. | S1 or S2, depending on completion state. |
| E4 | Downloaded or copied `project.json` from a prior session | Returning user wants to reuse config in another repo. | File still matches current deck/package model. | S3 Config review or F7 stale-config recovery. |
| E5 | Docs/npm README link to showcase | User arrives from package documentation. | Skills data and workflow data load. | S1 with source context from link target when available. |

## 5. Happy Path

| # | Step | Screen |
|---|---|---|
| 1 | User reaches a completed deck output or the `/workflows` Production workflow. | S1 Handoff source |
| 2 | The site shows the generated command/config plus what it will change locally: enabled packs, deck slug or explicit pack list, and any prerequisites. | S2 Output review |
| 3 | User chooses a handoff path: direct terminal command, config download, hybrid delegate guidance, or async Codex handoff guidance. | S3 Mode choice |
| 4 | System validates in-page prerequisites it can know: deck/config available, command not empty, browser can copy/download, and selected branch has required explanation. | S3/S4 |
| 5 | User copies command or downloads config/packet guidance. | S4 Artifact actions |
| 6 | User runs the command locally, places config in repo, or uses Claude/Codex commands to produce/consume an approval packet. | External local terminal/repo |
| 7 | If local execution reports stale packet, missing `jq`, mode mismatch, or dirty-tree blocker, the user returns to S5 recovery guidance instead of guessing. | S5 Recovery |
| 8 | After local success, the site offers keep-browsing/share paths but does not claim the local run succeeded unless the user did it. | S6 Post-handoff state |

## 6. Alternate Paths And Branches

| ID | Branch | Diverges at | Behavior | Rejoins |
|---|---|---|---|---|
| B1 | Direct terminal command | S3 | User copies `npx skillpacks install-deck <slug>` for canonical decks or explicit install commands for modified/custom decks. | S4 copy/download success, then local terminal. |
| B2 | Config download | S3 | User downloads `project.json` or copies its JSON preview for placement in another repo. | S4 download success, then local repo. |
| B3 | Hybrid delegate guidance | S3 | User in Claude/hybrid mode follows guidance that `/delegate` creates an approval packet and invokes Codex execution inside Claude after approval. | S4 guidance copied, then Claude local session. |
| B4 | Async handoff to Codex | S3 | User follows guidance that `/handoff --target=codex` produces the approval packet plus `tasks/handoff.md`; Codex resumes with `$exec --execute-approved`. | S4 guidance copied, then local Claude/Codex sessions. |
| B5 | Codex-only execution | S3 | User skips Claude packet language and uses Codex-side execution routes when Codex is the planner/executor. | S4 copied command/guidance. |
| B6 | Review/edit before handoff | S2/S3 | User returns to deck/workflow selection to adjust packs, overlays, or workflow step before copying. | S1 source surface. |
| B7 | Prerequisite warning | S3/S4 | Missing `jq`, missing `bash` for deck materialization, or unsupported browser clipboard/download surfaces inline recovery. | S5 recovery, then S4 retry. |
| B8 | Stale approval packet | External run returns stale | Freshness check failed: lifecycle, HEAD, todo hash, dirty path, manual blocker, or TTL. User is told to re-draft/re-approve rather than force execution. | S5 recovery; may return to S3 for async/hybrid path. |
| B9 | Share handoff choice | S4 | User copies a share URL plus command/config summary for a teammate, without implying the teammate's local packet is approved. | Recipient starts at E3/E5. |

## 7. Decision-Point Table

| ID | Type | Where | Decision | Branch rule |
|---|---|---|---|---|
| D1 | User | S1/S2 | Proceed with current deck/workflow or edit first? | Edit returns to deck/workflow; proceed opens S3. |
| D2 | User | S3 | Direct command, config download, hybrid delegate, async handoff, or Codex-only guidance? | Routes to B1-B5. |
| D3 | System | S2 | Canonical deck intact? | Yes: one-line `install-deck`. No: explicit pack list/config. |
| D4 | System | S3/S4 | Prerequisites known and explainable? | Missing prerequisite opens warning/recovery; output stays copyable if safe with caveat. |
| D5 | Permission | S4 | Clipboard/download permission granted? | Success confirmation or manual select/save fallback. |
| D6 | External/manual | Local terminal | Approval packet freshness passes? | Pass executes; fail becomes stale and requires re-approval. |
| D7 | External/manual | Local terminal | Mode compatible with selected command? | Compatible proceeds; mode mismatch requires choosing the correct local route. |
| D8 | User | S5 | Resolve issue, change path, or abandon handoff? | Retry S4, change S3, or return S1. |

## 8. Screen/Route Inventory

| ID | Screen | Route / surface | Purpose | Inputs | Outputs |
|---|---|---|---|---|---|
| S1 | Handoff source | Completed deck panel, `/deck/[slug]`, `/workflows` | Orient the user around the selected deck/workflow and show that local execution is possible. | Deck slug/config, workflow key/step, local progress. | S2 output review or return to deck/workflow edit. |
| S2 | Output review | Panel within deck/workflow surface | Preview command/config, prerequisites, and what will be handed off. | Deck/workflow output model and operating-mode evidence copy. | S3 mode choice, S1 edit. |
| S3 | Mode choice | Panel/drawer/modal within the same route | Select direct, config, hybrid delegate, async handoff, or Codex-only path. | User selection and generated output availability. | S4 action panel or S5 prerequisite recovery. |
| S4 | Artifact actions | Panel in flow | Copy command, copy guidance, download config, copy share URL. | Selected branch, command text, config JSON. | External local terminal/repo, S6 success, or S5 recovery. |
| S5 | Recovery guidance | Inline warning/error state | Explain missing prerequisites, stale packet, mode mismatch, clipboard failure, invalid selection, or stale config. | Error/recovery reason. | Retry S4, switch branch S3, or edit S1. |
| S6 | Post-handoff state | Same flow surface | Confirm browser-side copy/download only and offer share/keep-browsing. | Completed browser action. | Share URL, return to deck/workflows, no false local-exec claim. |

## 9. Per-Screen Action/State Matrix

| Screen | Actions | Navigation | Disabled / blocked rules | Validation | States |
|---|---|---|---|---|---|
| S1 Handoff source | Open output review; edit deck/workflow; inspect deck/workflow evidence. | S2 or upstream deck/workflow route. | Open review disabled if no deck/workflow output exists. | Known deck slug or workflow key required. | empty, loading, ready, invalid source, restored. |
| S2 Output review | Inspect command/config preview; view prerequisites; keep editing. | S3 or S1. | Mode choice blocked if generated output is empty or inconsistent. | Canonical vs explicit pack list; config JSON parseable. | ready, needs edit, stale config warning. |
| S3 Mode choice | Select direct/config/delegate/handoff/Codex-only; compare consequences. | S4, S5, or S2. | Hybrid/async choices marked guidance-only; browser cannot create local packet. | Selected mode has required explanation and target command text. | selected, unselected, warning, clarification. |
| S4 Artifact actions | Copy command; copy guidance; download `project.json`; copy share URL. | External local tool, S5, S6. | Copy button disabled only when text is absent; fallback available when clipboard denied. | Command/config shown exactly as copied/downloaded. | copy-ready, copied, download-ready, downloaded, copy-failed. |
| S5 Recovery guidance | Read issue, copy fix command/guidance, switch branch, retry. | S3/S4/S1. | Execution claim never shown from browser recovery alone. | Error reason maps to one recovery path. | missing jq, missing bash, stale packet, mode mismatch, dirty tree, invalid deck, offline, clipboard denied. |
| S6 Post-handoff state | Share, keep browsing, start another deck/workflow. | S1, share URL. | No "successfully ran" wording unless local proof exists outside browser scope. | Browser action succeeded. | copied, downloaded, shared, done-with-caveat. |

## 10. Required State Coverage

| State class | Where it appears | Handling |
|---|---|---|
| Empty | S1 no selected deck/workflow; S4 no command/config. | Ask user to choose a deck/workflow first. |
| Loading | S1/S2 data load for deck/workflow output. | Show non-interactive skeleton; do not render copy actions from partial data. |
| Error | Invalid slug/workflow, data load failure, corrupt config. | Route to S5 with specific recovery. |
| Partial | Deck incomplete or workflow step not selected. | Show locked/needs-selection message; allow edit path. |
| Success | Copy/download/share completed in browser. | Confirm browser action only; local execution remains outside site. |
| Permission denied | Clipboard/download blocked by browser. | Manual select/save fallback with visible command/config. |
| Offline | After initial app load or when assets are already cached. | Copy/download existing rendered output; initial load offline remains browser-level failure. |
| Validation | Config JSON, command text, branch selection. | Do not allow empty or mismatched artifact output. |
| Stale packet | External `$exec --execute-approved` check fails. | Explain that consumer marks packet stale and re-prompts with diff; re-draft/re-approve required. |
| Mode mismatch | Wrong local command for `claude-only`, `codex-only`, or `hybrid`. | Return to mode choice and show compatible route. |
| Reduced motion | Any interactive preview or drawer/sheet. | All states reachable without animation. |

## 11. Failure And Recovery Paths

| ID | Failure | Recovery |
|---|---|---|
| F1 | No deck/workflow output exists. | Return to deck/workflow selection; explain that handoff needs a generated artifact. |
| F2 | Skills/workflow data fails to load. | Retry; no copy/download action renders from partial data. |
| F3 | Clipboard API denied/unavailable. | Auto-select command/guidance text and show keyboard copy hint. |
| F4 | `jq` missing for approval packet writes or current npm deck materialization path. | Show prerequisite explanation and install hints; direct pack install/config branch remains available when applicable. |
| F5 | `bash` unavailable for current npm deck materialization backend. | Warn before copy; offer config download or explicit direct pack-install path when possible. |
| F6 | Approval packet stale. | Do not retry blindly. Re-draft/re-approve after inspecting diff from moved HEAD, changed todo hash, dirty tree, manual blockers, or expired TTL. |
| F7 | Mode mismatch. | Show compatible path: Claude-only inline, Codex-only `$exec`, hybrid `/delegate`, async `/handoff --target=codex` then `$exec --execute-approved`. |
| F8 | Dirty tree blocks approved packet freshness. | Commit/stash/re-approve locally, or use allowed-dirty path only through proper packet creation. |
| F9 | Downloaded config is stale relative to current deck/package model. | Regenerate from current deck output; never silently use old config. |
| F10 | User chooses hybrid/async but expects the website to execute locally. | Clarify browser boundary and local command requirement. |

## 12. Handoffs And External Dependencies

| ID | Handoff | Mechanism | Failure surface |
|---|---|---|---|
| H1 | Web to terminal | Copy `npx skillpacks install-deck <slug>`, explicit install commands, or workflow command guidance. | Clipboard failure; missing local prerequisites; CLI-side errors out of browser scope. |
| H2 | Web to repo | Download or copy `project.json` matching the deck/config output. | Browser download blocked; stale config. |
| H3 | Web to Claude orchestration | Copy guidance for `/delegate` or `/handoff --target=codex` as local session actions. | Mode mismatch, missing `jq`, user has only Codex available. |
| H4 | Claude to Codex | Approval packet `.agents/approved-plan.json` plus mirror `tasks/approved-plan.md`; consumed by `$exec --execute-approved`. | Stale, superseded, consumed, uncertain, or missing packet. |
| H5 | Person to person | Share URL plus command/config summary. | Recipient local environment may differ; packet approval is not transferable unless intentionally recreated. |
| H6 | Browser to local filesystem | Download only; no direct write into repo from website. | User must place files correctly; site can explain destination but cannot verify placement. |

## 13. Low-Fidelity Wireframe Notes

Structural regions only. No visual styling, spacing, or component design is locked here.

### S1/S2: Source And Output Review

```text
[Deck or Workflow]
title, slug/key, purpose
enabled packs / workflow steps

[Output Preview]
command line or project.json summary
prerequisite badges
[choose handoff path]
```

### S3/S4: Mode Choice And Artifact Actions

```text
[Direct] [Config] [Hybrid delegate] [Async handoff] [Codex-only]

Selected path detail
exact copied text preview
[copy] [download] [share] [back]
```

### S5: Recovery

```text
Problem: stale approved packet
Reason: todo hash changed
Impact: local execution blocked
Next local action: re-draft/re-approve
[copy guidance] [choose another path]
```

### S6: Post-Handoff

```text
Copied / downloaded
Browser action complete
Local execution happens in your terminal
[share] [keep browsing] [start another deck]
```

Mobile branch notes: mode-choice cards stack vertically; command/config preview wraps with copy controls adjacent; recovery guidance appears above copy/download actions; all actions remain tap-first with no drag-only controls.

## 14. Flow Coverage Checkpoint

| Coverage item | Status |
|---|---|
| Persona and goal | Covered with corrected wording. |
| Entry points | Covered: completed deck, workflow lab, direct deck URL, prior config, docs/npm link. |
| Happy path | Covered: source to output review to mode choice to local run. |
| Branches and decision points | Covered: direct, config, hybrid, async, Codex-only, edit, prerequisite, stale packet, share. |
| Screen/route inventory | Covered: six screens/surfaces. |
| Actions per screen | Covered in action/state matrix. |
| Required states | Covered including stale packet and mode mismatch. |
| Failure/recovery paths | Covered: ten named failures. |
| Handoffs | Covered: web-to-terminal, web-to-repo, web-to-Claude, Claude-to-Codex, person-to-person, browser-to-local boundary. |
| Wireframe-level notes | Covered without locking visual design. |
| Layout/styling non-goals | Preserved. |

## 15. Open Questions, Risks, And Explicit Non-Goals

| Item | Detail | Where it resolves |
|---|---|---|
| Surface placement | Does the full handoff panel appear in both deck output and workflow lab, or is workflow lab a route into the deck/output handoff? | `$ui-interview --requirements-only skill-execution-handoff` |
| Config detail depth | How much of `project.json` should be previewed before download? | UI requirements. |
| Prerequisite detection | Website cannot inspect local `jq`, `bash`, git state, or agent mode directly. | UI copy/state design; local commands remain source of truth. |
| Packet education | Approval packet lifecycle is important but could overwhelm new evaluators. | UI requirements and copy hierarchy. |
| False success risk | Browser copy/download success is not local execution success. | Spec must keep language precise. |

Explicit non-goals:

- No CLI behavior changes.
- No GitHub Actions.
- No account, cloud execution, or browser write access to the user's repo.
- No visual design or component detail beyond wireframe notes.
- No changes to existing deck-creation canonical files.

## 16. Downstream Handoff

Approved post-approval route: `$ui-interview --requirements-only skill-execution-handoff`.

That downstream step should define per-screen content requirements, data, actions, states, constraints, hierarchy, and relationships before any layout variations or implementation planning.
