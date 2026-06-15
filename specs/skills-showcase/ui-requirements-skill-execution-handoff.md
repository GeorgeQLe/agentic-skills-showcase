# Preliminary UI Requirements - Skill Execution Handoff

- **Status:** canonical
- **Skill:** `$ui-interview --requirements-only skill-execution-handoff`
- **Product path:** `skills-showcase`
- **Working packet (archived):** `docs/history/archive/2026-06-15/101414/research/skills-showcase/_working/preliminary-ui-interview-research.md`
- **Review page:** `alignment/ui-interview-skill-execution-handoff.html` (confirmed)
- **Canonical files written from this approved packet:**
  - `specs/skills-showcase/ui-requirements-skill-execution-handoff.md`
  - `specs/skills-showcase/ui-requirements-skill-execution-handoff-interview.md`
- **Mode boundary:** requirements-only. This packet defines content, entities, actions, states, constraints, hierarchy, and relationships. It does not lock layout, visual treatment, component library, spacing, responsive composition, or implementation tasks.

## 1. Source Evidence

| Evidence | Observed fact | Requirement impact | Confidence |
|---|---|---|---|
| `specs/skills-showcase/user-flow-skill-execution-handoff.md` | Confirmed flow covers completed deck output, `/workflows`, direct command, config download, hybrid delegate, async handoff, Codex-only path, prerequisites, stale packets, and recovery. | The requirements must cover all six flow surfaces and cannot remove approved branches or states. | High |
| `specs/skills-showcase/user-flow-deck-creation.md` | Deck completion exposes CLI copy, `project.json` download, share, and keep-editing. Canonical decks emit `install-deck`; custom/modified decks emit explicit pack lists. | The handoff source must support canonical and custom output forms and show whether the current artifact is generated, locked, or stale. | High |
| `research/skills-showcase/idea-brief.md` | Building a deck produces actionable output: a copyable CLI command and downloadable `project.json`. No accounts or real inventory. | Browser actions stop at copy/download/share; local execution is outside the website. | High |
| `docs/operating-modes.md` | Modes are `claude-only`, `codex-only`, and `hybrid`; hybrid uses `/delegate`; async handoff uses `/handoff --target=codex`; Codex consumes with `$exec --execute-approved`. | Mode choices need explicit content and caveats so users do not confuse browser copy with local execution. | High |
| `docs/operating-modes.md` | Approval packet has lifecycle `draft`, `approved`, `consumed`, `stale`, `superseded`, `uncertain`; only `approved` is executable; freshness checks can mark stale. | The UI needs packet-lifecycle explanation and stale-packet recovery content, but not hidden packet creation. | High |
| `docs/decks.md` | `npx skillpacks install-deck <slug>` exists for five decks; current npm deck materialization requires `bash` and `jq`; direct `npx skillpacks install <pack-or-skill>` does not require `jq`. | Prerequisites must be branch-specific and distinguish deck install from direct pack/config routes. | High |
| `apps/skills-showcase/app/workflows/page.tsx` and `workflow-data.ts` | `/workflows` renders seven AFPS workflows; Production includes `$roadmap`, plan phase, `$exec`, `$ship`, `$ship-end`. | Workflow Lab can be an entry source with workflow-derived command/guidance, not only a deck output source. | High |
| `apps/skills-showcase/src/showcase/tui/TuiWorkflow.tsx` | Current workflow UI has chip navigation, transcript cards, dot controls, playback controls, benchmark receipts, and a right-side notebook. | Requirements must account for a selected workflow and active step as source data, without choosing where handoff content sits visually. | High |
| `apps/skills-showcase/app/deck/[slug]/page.tsx` and `DeckRoutingSpikeShell.tsx` | `/deck/[slug]` currently hard-loads a hidden routing spike; spike proves path/state behavior but not production deck UI. | Route state can identify active deck slugs, but handoff content remains a new production requirement. | Medium-high |
| `apps/skills-showcase/app/layout.tsx` and `globals.css` | App loads generated data through `window.SKILLS_SHOWCASE_DATA`, has sticky header/mobile panel, light blueprint grid tokens, and existing focus/overflow patterns. | Requirements should rely on static/generated client data and preserve accessibility/reduced-motion expectations. | High |

## 2. UI Assumptions Manifest

| Area | Assumption | Source tag |
|---|---|---|
| Product and user context | Users are developers evaluating or reusing GSkillPacks, and the handoff must help them run setup locally with confidence. | [from spec] |
| Pages/routes/entry points | Entry points are completed deck output, `/deck/[slug]`, `/workflows` Production step, direct docs/npm links, shared deck URL, and prior copied/downloaded config context. | [from spec + codebase] |
| Prototype-first boundary | First clickable proof should let a user start from fake/generated deck/workflow data, choose a handoff path, copy/download/share, and see recovery guidance. Production local execution, packet mutation, git inspection, auth, analytics, and admin are visually represented only. | [from spec + inferred] |
| Primary tasks | Users review the generated artifact, choose execution mode, copy/download/share, understand prerequisites, recover from browser/local-state problems, and return to edit if output is incomplete. | [from spec] |
| Navigation model | Existing global app navigation remains available; the handoff flow must also allow returning to the source deck/workflow and switching handoff path. | [from codebase + spec] |
| Information hierarchy | Primary content is the selected output and exact local artifact. Secondary content is mode explanation and prerequisites. Tertiary content is packet lifecycle education, source evidence, and share/help context. | [inferred] |
| Layout grid and spatial density | No layout is locked here. Requirements imply dense, scan-friendly content because command/config and recovery detail are operational, not marketing copy. | [inferred] |
| Component inventory | Requirements imply source summary, output preview, mode choices, prerequisite notices, action controls, recovery messages, packet lifecycle details, and status confirmations. Concrete component choices remain open. | [inferred] |
| Button/link semantics | Copy, download, share, retry, switch path, edit source, and open help/docs are actions; external docs/GitHub/CLI references are links. | [from spec + codebase] |
| Forms/validation/errors | The flow has no account form. Validation applies to selected source, command text, config JSON, branch selection, clipboard permission, and share/config payload integrity. | [from spec] |
| Empty/loading/disabled/success/failure states | Must cover no source, data loading, output missing, incomplete deck/workflow, copy/download success, clipboard denied, missing `jq`/`bash`, stale packet, mode mismatch, dirty-tree blocker, invalid source, offline after first load, and stale config. | [from spec] |
| Responsive/mobile behavior | All requirements must remain usable on mobile with tap-first controls and no drag-only dependency; exact arrangement is deferred. | [from deck-creation spec] |
| Accessibility | Keyboard navigation, screen-reader labels, visible focus, color-blind-safe status indicators, reduced motion, and text alternatives are required. | [from skill contract + codebase] |
| Visual language | Existing showcase uses a light blueprint/grid palette with game-deck terminology and technical parentheticals. This packet does not lock final visual treatment. | [from codebase + research] |
| Implementation constraints | Next.js 16/React 19 app, static generated data via `window.SKILLS_SHOWCASE_DATA`, no accounts, no browser-side local execution, no GitHub Actions, no local environment introspection from the website. | [from codebase + spec] |

## 3. Page Inventory And Content Requirements

### P0 - Global Shell Context

- **Surface:** existing root app shell: sticky header, mobile panel, route content.
- **Data:** current route, active nav item, global links, generated skills/workflow data availability.
- **Actions:** navigate to home, workflows, packs, catalog, follow, external links; open/close mobile navigation.
- **States:** normal, active route, mobile menu open/closed, data script unavailable, reduced motion.
- **Constraints:** handoff content must not require removing global navigation; global links must remain keyboard accessible.
- **Content hierarchy:** global orientation is tertiary during the handoff flow; source artifact and action content are primary.
- **Relationships:** global shell wraps all handoff pages/surfaces.

### P1 - Handoff Source

- **Purpose:** identify what the user is handing off and whether it is ready.
- **Entities:** one selected `HandoffSource`, which may reference one `DeckSelection` or one `WorkflowSelection`; many source evidence items; optional prior config/share context.
- **Required data fields:**
  - `source_type`: `deck`, `workflow`, `shared-deck`, `prior-config`, or `docs-link`.
  - `source_id`: deck slug, workflow key, or share/config id.
  - `source_title`, `source_summary`, `source_origin_route`.
  - `readiness_status`: empty, partial, ready, stale, invalid.
  - `selected_deck` or `selected_workflow` reference.
  - `generated_output_available`: boolean.
  - `source_evidence`: many text/file references, optional.
- **Actions:** open output review, return to deck/workflow editing, inspect source details, retry data load, choose a different source.
- **States:** empty/no source, loading, ready, partial/incomplete, invalid slug/workflow, stale restored data, offline-after-load, data-load error.
- **Constraints:** do not show copy/download actions until an output artifact exists; do not claim local execution state.
- **Content hierarchy:** primary: selected source title and readiness. Secondary: what will be produced. Tertiary: source evidence and origin route.
- **Relationships:** one source produces zero or one `GeneratedArtifactSet`; one source can have many prerequisites and recovery issues.

### P2 - Output Review

- **Purpose:** preview the exact command/config/guidance that the user can take locally.
- **Entities:** one `GeneratedArtifactSet`; one or many `ArtifactItem`; many `PrerequisiteNotice`; optional `ConfigPreview`.
- **Required data fields:**
  - `artifact_set_id`, `source_id`, `artifact_mode`: canonical deck, custom deck, workflow guidance, config, packet guidance.
  - `primary_command`: exact string when present.
  - `command_kind`: `install-deck`, explicit `install`, `workflow-command`, `delegate-guidance`, `handoff-guidance`, `exec-guidance`.
  - `config_preview`: parseable JSON summary and full JSON text when config exists.
  - `included_packs`: many pack ids/names.
  - `included_skills`: many skill ids/names when explicit.
  - `overlay_lines`: many extra install lines when present.
  - `prerequisites`: many branch-specific items.
  - `copy_text`: exact text that copy actions will place on clipboard.
  - `download_payload`: exact file name and content when download exists.
- **Actions:** inspect command/config, choose handoff path, copy artifact, download config, keep editing, open prerequisite details, switch source.
- **States:** ready, command absent, config invalid, canonical output, custom output, workflow output, prerequisite warning, stale config warning.
- **Constraints:** command/config preview must match copy/download payload exactly; config JSON must be parseable before download.
- **Content hierarchy:** primary: exact artifact text. Secondary: what it changes locally. Tertiary: prerequisites and evidence.
- **Relationships:** one artifact set belongs to one source; an artifact set can produce many action outcomes and many recovery issues.

### P3 - Mode Choice

- **Purpose:** let the user select the execution context that matches their local agent setup.
- **Entities:** many `HandoffPath` choices; optional `AgentModeHint`; one selected path.
- **Required data fields:**
  - `path_id`: `direct-terminal`, `config-download`, `hybrid-delegate`, `async-codex-handoff`, `codex-only`.
  - `path_label`, `path_summary`, `local_actor`: user terminal, repo filesystem, Claude, Codex, or teammate.
  - `recommended_when`: conditions for choosing the path.
  - `command_or_guidance`: exact local command/guidance text.
  - `requires`: many prerequisites.
  - `cannot_do`: browser boundary caveats.
  - `selected`: boolean.
- **Actions:** select path, compare consequences, switch path, open advanced explanation, continue to artifact actions, return to output review.
- **States:** no path selected, selected, unavailable/unsupported, warning, needs clarification, mode mismatch.
- **Constraints:** the website cannot read `SKILLS_AGENT_MODE`, `.agents/project.json.agent_mode`, git state, or local installed binaries; all mode matching is instructional.
- **Content hierarchy:** primary: selected path and next local action. Secondary: when to choose it. Tertiary: lifecycle details and caveats.
- **Relationships:** one selected path determines which artifact actions, prerequisites, and recovery messages are shown.

### P4 - Artifact Actions

- **Purpose:** perform browser-side handoff actions.
- **Entities:** many `ArtifactAction`; one or many `BrowserActionResult`; optional `SharePayload`.
- **Required data fields:**
  - `action_id`: copy command, copy guidance, copy config, download config, copy share URL, retry, switch path, edit source.
  - `action_label`, `action_type`, `payload_text`, `payload_filename`, `payload_mime`.
  - `enabled`: boolean and disabled reason.
  - `result_status`: idle, success, failed, permission-denied, fallback-shown.
  - `timestamp` for local UI confirmation only.
- **Actions:** copy command/guidance/config/share URL, download `project.json`, retry failed copy/download, select text manually, switch path, edit source.
- **States:** copy-ready, copying, copied, copy-failed, download-ready, downloaded, download-failed, manual fallback visible, share-ready, disabled.
- **Constraints:** browser action success means only that copy/download/share succeeded; it is not proof the local command ran.
- **Content hierarchy:** primary: the action and payload being copied/downloaded. Secondary: result confirmation. Tertiary: fallback instructions.
- **Relationships:** actions operate on the selected artifact/path; results can create recovery issues or post-handoff status.

### P5 - Recovery Guidance

- **Purpose:** route users out of known blocked or ambiguous states.
- **Entities:** one or many `RecoveryIssue`; many `RecoveryStep`; optional related prerequisite or packet lifecycle item.
- **Required data fields:**
  - `issue_id`: no output, data failure, clipboard denied, missing `jq`, missing `bash`, stale packet, mode mismatch, dirty tree, invalid config, browser boundary confusion, offline.
  - `issue_title`, `issue_summary`, `severity`: info, warning, blocking.
  - `detected_by`: browser, generated data, local command result reported by user, docs prerequisite.
  - `recovery_steps`: ordered many.
  - `retry_target`: source review, mode choice, artifact action, or external local command.
  - `copyable_fix_text`: optional.
- **Actions:** copy fix guidance, retry action, switch mode/path, return to source edit, open relevant docs, mark as understood.
- **States:** warning, blocking error, info-only caveat, retrying, resolved-in-browser, unresolved-local.
- **Constraints:** recovery guidance must not invent automatic local fixes. Local state remains local.
- **Content hierarchy:** primary: what is blocked and what to do next. Secondary: why it happened. Tertiary: detailed lifecycle or prerequisite explanation.
- **Relationships:** each recovery issue references the source/path/action it blocks; stale-packet issues reference packet lifecycle facts.

### P6 - Post-Handoff Status

- **Purpose:** close the browser-side handoff honestly and keep the user oriented.
- **Entities:** one `PostHandoffOutcome`; optional share payload; optional next source suggestion.
- **Required data fields:**
  - `outcome_type`: copied, downloaded, shared, fallback-used, abandoned, edited-source.
  - `browser_action_status`: success, failed, unknown.
  - `local_execution_status`: always unknown unless explicit future proof is added outside this requirements scope.
  - `next_options`: keep browsing, share, start another deck/workflow, return to source.
- **Actions:** share, keep browsing, start another deck/workflow, copy again, download again, return to source.
- **States:** copied, downloaded, shared, done-with-caveat, failed, local-status-unknown.
- **Constraints:** must not say "installed", "executed", or "shipped" based only on browser copy/download.
- **Content hierarchy:** primary: browser action result. Secondary: local next step. Tertiary: related browsing/share options.
- **Relationships:** one outcome follows an artifact action result.

## 4. Core Data Model Requirements

| Entity | Cardinality | Required fields | Relationships |
|---|---|---|---|
| `HandoffSource` | One active | `source_type`, `source_id`, `source_title`, `source_origin_route`, `readiness_status`, `generated_output_available` | Parent of artifact set; references deck or workflow selection. |
| `DeckSelection` | Zero or one | `slug`, `name`, `canonical_status`, `phase_count`, `core_card_count`, `overlay_count`, `completion_status`, `share_url` | Can generate canonical or explicit-pack artifact set. |
| `WorkflowSelection` | Zero or one | `workflow_key`, `title`, `active_step`, `command`, `artifacts`, `failure_summary`, `benchmark_receipt_status` | Can generate workflow guidance artifact set. |
| `GeneratedArtifactSet` | Zero or one per active source | `artifact_mode`, `primary_command`, `config_json`, `guidance_text`, `included_packs`, `included_skills`, `prerequisites` | Drives mode choices and artifact actions. |
| `ArtifactItem` | One or many | `kind`, `label`, `payload_text`, `payload_filename`, `payload_mime`, `enabled`, `disabled_reason` | Used by copy/download/share actions. |
| `HandoffPath` | Many, one selected | `path_id`, `path_label`, `summary`, `recommended_when`, `requires`, `cannot_do`, `guidance_text` | Determines prerequisites, artifact actions, and recovery copy. |
| `PrerequisiteNotice` | Zero or many | `prerequisite_id`, `label`, `applies_to`, `required`, `known_status`, `explanation`, `install_hint` | May become recovery issue. |
| `ApprovalPacketLifecycle` | One reference table | `state`, `meaning`, `can_execute`, `recovery` | Referenced by hybrid/async paths and stale packet recovery. |
| `RecoveryIssue` | Zero or many | `issue_id`, `severity`, `title`, `summary`, `detected_by`, `recovery_steps`, `retry_target` | References source/path/action/prerequisite. |
| `BrowserActionResult` | Zero or many | `action_id`, `status`, `payload_kind`, `fallback_available`, `timestamp` | Feeds post-handoff status. |
| `SharePayload` | Zero or one | `url`, `summary`, `source_id`, `artifact_summary`, `expires_or_static` | Can be copied or handed to another person. |

## 5. Action Inventory

| Action | Applies to | Required behavior | Disabled/blocked rule |
|---|---|---|---|
| Open output review | P1 | Move from selected source to artifact preview. | Disabled when no generated output exists. |
| Return to edit source | P1/P2/P3/P5/P6 | Return to deck/workflow context without losing generated state when possible. | Always available unless source is invalid and cannot be restored. |
| Select handoff path | P3 | Mark one execution path active and reveal its payload/prerequisites. | Paths can be shown as warning/unavailable when required payload does not exist. |
| Copy command | P4 | Copy exact visible command text; show success or fallback. | Disabled when command text is empty. |
| Copy guidance | P4/P5 | Copy exact local steps for delegate/handoff/recovery. | Disabled when guidance text is empty. |
| Copy config | P4 | Copy full parseable config JSON. | Disabled when config JSON is absent or invalid. |
| Download `project.json` | P4 | Download exact visible/previewed config payload with predictable filename. | Disabled when config JSON is absent or invalid. |
| Copy share URL | P4/P6 | Copy URL plus enough source context for recipient orientation. | Disabled when source/share payload is invalid. |
| Retry action | P5 | Retry failed copy/download/data action. | Hidden/disabled when no retry target exists. |
| Switch path | P3/P5 | Return to mode choice preserving source and artifact set. | Always available when multiple paths exist. |
| Open docs/help | P5 | Navigate to relevant docs or expose help reference. | Link target must be explicit and accessible. |

## 6. State Coverage

| State | Required meaning | Applies to |
|---|---|---|
| Empty/no source | No deck/workflow/prior config can produce output. | P1 |
| Loading | Data or generated output is not ready; copy/download actions hidden or disabled. | P1/P2 |
| Partial/incomplete | Deck/workflow exists but output is not ready. | P1/P2 |
| Ready | Source and artifact set can be reviewed. | P1/P2 |
| Selected path | One handoff path is active. | P3 |
| Browser action success | Copy/download/share succeeded in browser. | P4/P6 |
| Browser action failure | Clipboard/download failed; fallback available when possible. | P4/P5 |
| Permission denied | Clipboard/download permission blocked. | P4/P5 |
| Missing prerequisite | Required local capability such as `jq`/`bash` may block selected path. | P2/P3/P5 |
| Stale packet | Local packet freshness failed; re-approval required. | P5 |
| Mode mismatch | User selected or tried a path incompatible with local mode. | P3/P5 |
| Dirty-tree blocker | Approved packet cannot execute because local worktree violates freshness check. | P5 |
| Invalid source | Deck slug, workflow key, share payload, or config cannot be resolved. | P1/P5 |
| Offline after load | Already-rendered output remains usable; initial offline load remains browser-level failure. | P1-P6 |
| Reduced motion | State transitions must not depend on animation. | P0-P6 |
| Local execution unknown | Browser cannot verify whether the copied command ran. | P6 |

## 7. Constraints And Non-Goals

- No layout, component, or visual style decisions are approved by this packet.
- No browser-side execution of CLI, git, jq, bash, Claude, Codex, or packet commands.
- No account, login, server inventory, user storage backend, or multi-tenant state.
- No automatic local environment detection from the website.
- No GitHub Actions.
- No change to CLI semantics, deck materialization, approval-packet schema, or operating-mode resolver.
- Fake/fixture data is acceptable for first clickable prototype as long as command/config payloads are labeled fixture-backed.
- Performance budget for the eventual UI: static/generated handoff content should render without network fetch beyond existing generated data scripts; copy/download interactions should not block on server calls.
- Accessibility requirements are mandatory: keyboard order, labels, visible focus, screen-reader names for action controls, color-blind-safe status cues, and reduced-motion parity.

## 8. Content Hierarchy

| Priority | Content | Rationale |
|---|---|---|
| Primary | Selected source, exact command/config/guidance payload, selected path, enabled copy/download action, blocking recovery issue. | These determine whether the user can safely act locally. |
| Secondary | What changes locally, prerequisites, included packs/skills, branch explanation, browser action result. | These build trust and reduce wrong-mode/wrong-command usage. |
| Tertiary | Source evidence, packet lifecycle education, share context, global navigation, benchmark/proof context. | Useful for confidence, but should not obscure the action. |

## 9. Coverage Checkpoint

| Requirement area | Status |
|---|---|
| Pages/surfaces | Covered: global shell context, source, output review, mode choice, artifact actions, recovery, post-handoff. |
| Data/entities | Covered: source, deck/workflow selection, artifact set, artifact item, path, prerequisite, lifecycle, recovery issue, action result, share payload. |
| Actions | Covered: review, edit, select path, copy, download, share, retry, switch path, open docs. |
| States | Covered: empty, loading, partial, ready, success, permission denied, missing prerequisite, stale packet, mode mismatch, dirty tree, invalid source, offline, reduced motion. |
| Constraints | Covered: browser/local boundary, no accounts, no hidden packet creation, no CLI changes, no layout lock. |
| Content hierarchy | Covered: primary/secondary/tertiary content priorities. |
| Relationships | Covered: parent-child and reference relationships across source, artifact, path, prerequisites, actions, and recovery. |

## 10. Proposed File Changes

These changes were performed for the UI alignment lifecycle:

| File | Change timing | Notes |
|---|---|---|
| `research/skills-showcase/_working/preliminary-ui-interview-research.md` | Written for review, now archived | Non-canonical working packet; archived and removed after canonical writes. |
| `alignment/ui-interview-skill-execution-handoff.html` | Written in review state, now confirmed | Renders this full packet inline with approval gates; converted to confirmed after canonical writes. |
| `alignment/index.html` | Updated | Carries the confirmed page entry. |
| `specs/skills-showcase/ui-requirements-skill-execution-handoff.md` | Written now (canonical) | Canonical UI requirements. |
| `specs/skills-showcase/ui-requirements-skill-execution-handoff-interview.md` | Written now (canonical) | Canonical interview log. |
| `docs/history/archive/2026-06-15/101414/research/skills-showcase/_working/preliminary-ui-interview-research.md` | Written now (archive) | Working packet archive after approval. |

## 11. Interview Record

| Item | Record |
|---|---|
| Invocation | `$ui-interview --requirements-only skill-execution-handoff` via approved post-user-flow route. |
| Source approval consumed | `alignment/user-flow-map-skill-execution-handoff.html` final compiled YAML had `approval_status: ready-for-agent-review`, all gates answered, and no section feedback. |
| Scope decision | Requirements-only. Layout, visual, component, spatial, and implementation decisions are deferred. |
| Product path | `skills-showcase`, resolved from `research/.progress.yaml`. |
| Assumptions | Drafted from confirmed user-flow spec, idea brief, operating-mode docs, deck-creation spec, and current app code. |
| Content requirements | Drafted page-by-page from approved flow screens P0-P6. |
| Open review question | Does the review page approve these requirements as the content contract for later layout exploration? Resolved: approved via final compiled YAML with `approval_status: ready-for-agent-review`. |
