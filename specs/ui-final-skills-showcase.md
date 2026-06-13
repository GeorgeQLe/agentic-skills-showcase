# Final UI Specification: gSkillPacks — Playful Blueprint Theme

## Consolidation Summary

Five TUI variations (Hacker, Clean, Retro, Playful Lab, Professional) were built and compared. V4 Playful Lab was chosen as the winner and merged with the Swiss grid design system to create a "playful blueprint" hybrid applied consistently across the entire project. The other four variations have been removed.

## Source Attribution

| Element | Source | Notes |
|---|---|---|
| Background `#F7F8F5` warm neutral paper | Swiss design system | Unchanged |
| Blueprint grid teal at `rgba(0,212,170,0.06)` | Swiss (halved from 0.12) | Reduced to avoid visual noise |
| Text ink `#111827`, muted `#5B6472` | Swiss design system | Unchanged |
| Primary accent teal `#00D4AA` / `#00A88A` | Swiss (reduced usage) | Structural only — borders, connectors, focus |
| Secondary accent coral `#ff6b6b` / `#e85555` | V4 Playful Lab | Active chips, labels, selected workflow indicators |
| Progressive corner radius 0/4/8/12/999px | Hybrid | Scale: structural→none, tags→sm, cards→md, buttons→lg, chips→pill |
| Card shadows `0 4px 16px rgba(17,24,39,0.06)` | Hybrid | Interactive cards only; static surfaces stay flat |
| Horizontal chip/pill workflow selector | V4 Playful Lab | Coral active state, pill radius |
| Lab-notebook sidebar | Hybrid | Lavender wash, coral accent strip, 0.5deg max tilt |
| Bounce-in animation | V4 (reduced overshoot) | `cubic-bezier(0.34, 1.3, 0.64, 1)` — was 1.56 |
| Hover scale/lift on interactive elements | V4 (adopted) | `scale(1.02)` + `translateY(-1px)` |
| 12-column Swiss grid, 1180px container | Swiss design system | Unchanged |
| Typography Inter + Fira Code mono | Swiss + V4 | Fira Code promoted to primary monospace |
| Hero blueprint-panel shadow | Swiss design system | Unchanged |

## Consolidation Matrix

| Dimension | Swiss | V4 Playful | Winner | Conflict Resolution |
|---|---|---|---|---|
| Background color | `#F7F8F5` paper | `#f3f0ff` lavender | Swiss | Paper is more neutral; lavender reserved for notebook sidebar only |
| Grid opacity | 0.12 | N/A | Halved to 0.06 | Grid was too prominent against rounded cards |
| Text colors | Ink/muted system | Purple palette | Swiss | Ink system has better contrast ratios |
| Primary accent | Teal everywhere | Teal for dots only | Reduced teal | Teal marks structure; coral marks interaction energy |
| Corner radius | `0` everywhere | `12px` cards, `999px` chips | Progressive scale | Structural elements stay square; interactive elements get progressive rounding |
| Elevation | Hero panel only | Cards + sticky note | Hybrid | Interactive cards get subtle shadow; static surfaces stay flat |
| Sticky note | N/A | Yellow, 2deg tilt, purple labels | Evolved to lab-notebook | Lavender wash, coral labels, 0.5deg max tilt, coral accent strip |
| Animation | Node pulse only | Bounce-in 1.56 overshoot | Reduced bounce | Overshoot reduced from 1.56 to 1.3 |
| Workflow selector | Vertical list | Horizontal chips | Chips | Coral active state on Swiss ink border |
| Selected states | Teal border + inset | Coral chip background | Coral for workflow, teal for structure | Workflow items use coral; pack nodes keep teal |

## Component Definitions

### Chip (new)
- Pill radius (`999px`), 2px ink border
- Active: coral background, coral border, white text
- Hover: teal wash background, `scale(1.04)`
- Used for workflow selection in the TUI player

### Lab-Notebook Sidebar (new)
- Light lavender wash (`#f8f0ff`)
- 3px coral left accent strip
- Asymmetric rounding: 0 top, 12px bottom
- 0.5deg max tilt (varies by workflow index)
- Sticky positioning below header
- Coral uppercase labels for metadata sections

### Button (updated)
- `12px` border radius (was `0`)
- Hover: `translateY(-1px)` + card shadow
- Secondary hover: coral-strong text (was teal-strong)

### Card/Row (updated)
- `8px` border radius (was `0`)
- Interactive cards: hover lift + card shadow
- Workflow items: coral selected state (was teal)

### Tag (updated)
- `4px` border radius (was `0`)

### Structural Elements (unchanged)
- Blueprint panel, metrics, state nodes, terminals: remain at `0` radius

## Files Changed

| File | Change |
|---|---|
| `DESIGN.md` | Added coral tokens, progressive radius, chip/lab-notebook components |
| `apps/skills-showcase/app/globals.css` | CSS variables, progressive radius, chip styles, hover interactions, bounce-in |
| `apps/skills-showcase/src/showcase/tui/TuiWorkflow.tsx` | New consolidated component from V4 |
| `apps/skills-showcase/src/showcase/tui/workflow.css` | New consolidated styles using CSS variables |
| `apps/skills-showcase/app/workflows/page.tsx` | Removed variation cards, added TuiWorkflow |
| `specs/ui-skills-showcase-website.md` | Updated visual language references |

## Files Removed

- `apps/skills-showcase/src/showcase/tui/v1/` (TuiHacker.tsx, hacker.css)
- `apps/skills-showcase/src/showcase/tui/v2/` (TuiClean.tsx, clean.css)
- `apps/skills-showcase/src/showcase/tui/v3/` (TuiRetro.tsx, retro.css)
- `apps/skills-showcase/src/showcase/tui/v4/` (TuiPlayful.tsx, playful.css)
- `apps/skills-showcase/src/showcase/tui/v5/` (TuiProfessional.tsx, professional.css)
- `apps/skills-showcase/src/showcase/tui/shared/VariationNav.tsx`
- `apps/skills-showcase/app/workflows/v1-v5/page.tsx` (5 route pages)

## Files Preserved

- `apps/skills-showcase/src/showcase/tui/shared/useWorkflowPlayer.ts`
- `apps/skills-showcase/src/showcase/tui/shared/useTypewriter.ts`
- `apps/skills-showcase/src/showcase/tui/workflow-data.ts`
