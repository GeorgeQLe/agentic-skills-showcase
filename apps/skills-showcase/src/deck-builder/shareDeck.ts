/*
 * shareDeck — backend-free share encoding for custom decks (unified-experience
 * §8 "Share deck encodes contents into a compact URL param `/deck/custom?c=…`").
 *
 * A custom deck (the `custom` slug, composed beyond a canonical blueprint) is
 * made shareable with no server by encoding its contents — name, phase chain
 * (keys/names + per-phase card ids), and any overlay card ids — into a compact
 * base64url JSON param. `/deck/custom?c=<param>` decodes it back into a synthetic
 * `Deck` on hard-load, round-tripping the contents exactly.
 *
 * The encoding is base64url(JSON), byte-compatible with Node's
 * `Buffer.from(json, "utf8").toString("base64url")` so tests (and any tooling)
 * can construct a `?c=` param without importing this module.
 */
import type { Skill } from "@/hooks/useSkillsData";
import { CUSTOM_SLUG, deckPacks, type Deck, type DeckData, type Phase } from "./decks";

/** Compact phase payload: `k`ey, `n`ame, `c`ard ids. */
interface PhasePayload {
  k: string;
  n: string;
  c: string[];
}

/** The decoded share payload. `p`hases, optional `n`ame, optional `o`verlays. */
interface DeckPayload {
  n?: string;
  p: PhasePayload[];
  o?: string[];
}

function encodeBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  const b64 =
    typeof btoa !== "undefined"
      ? btoa(bin)
      : Buffer.from(str, "utf8").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeBase64Url(param: string): string | null {
  try {
    const b64 = param.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
    const full = b64 + pad;
    const bin =
      typeof atob !== "undefined"
        ? atob(full)
        : Buffer.from(full, "base64").toString("binary");
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

/** Encode a custom deck's contents into the `?c=` share param. */
export function encodeDeckParam(deck: Deck): string {
  const payload: DeckPayload = {
    n: deck.name && deck.name !== "Custom deck" ? deck.name : undefined,
    p: deck.phases.map((phase) => ({
      k: phase.key,
      n: phase.name,
      c: phase.suggestedSkills.map((s) => s.id),
    })),
    o: deck.overlaySkills?.length
      ? deck.overlaySkills.map((s) => s.id)
      : undefined,
  };
  return encodeBase64Url(JSON.stringify(payload));
}

/** Decode + validate a `?c=` share param. Returns null on any malformed input. */
export function decodeDeckParam(param: string): DeckPayload | null {
  const json = decodeBase64Url(param);
  if (!json) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const obj = parsed as Record<string, unknown>;
  if (!Array.isArray(obj.p)) return null;
  const phases: PhasePayload[] = [];
  for (const raw of obj.p) {
    if (!raw || typeof raw !== "object") return null;
    const ph = raw as Record<string, unknown>;
    if (typeof ph.k !== "string" || typeof ph.n !== "string" || !isStringArray(ph.c)) {
      return null;
    }
    phases.push({ k: ph.k, n: ph.n, c: ph.c });
  }
  const name = typeof obj.n === "string" ? obj.n : undefined;
  const overlays = isStringArray(obj.o) ? obj.o : undefined;
  return { n: name, p: phases, o: overlays };
}

/**
 * Build the synthetic custom `Deck` from a `?c=` param, resolving card ids
 * against the loaded catalog. Unresolved ids are dropped; returns null when the
 * param is malformed or resolves to zero cards (so the route can fall back).
 */
export function buildCustomDeck(param: string, data: DeckData): Deck | null {
  const payload = decodeDeckParam(param);
  if (!payload) return null;
  const byId = new Map(data.skills.map((skill) => [skill.id, skill]));

  const phases: Phase[] = payload.p.map((ph) => ({
    key: ph.k,
    name: ph.n,
    suggestedSkills: ph.c
      .map((id) => byId.get(id))
      .filter((s): s is Skill => Boolean(s)),
  }));

  const seen = new Set<string>();
  const skills: Skill[] = [];
  for (const phase of phases) {
    for (const skill of phase.suggestedSkills) {
      if (seen.has(skill.id)) continue;
      seen.add(skill.id);
      skills.push(skill);
    }
  }
  if (skills.length === 0) return null;

  const overlaySkills = (payload.o ?? [])
    .map((id) => byId.get(id))
    .filter((s): s is Skill => Boolean(s));

  return {
    name: payload.n?.trim() || "Custom deck",
    slug: CUSTOM_SLUG,
    domain: "custom",
    tempo: "custom",
    phases,
    skills,
    overlayPacks: deckPacks(overlaySkills),
    overlaySkills,
  };
}

/**
 * The explicit install lines for a custom/modified deck (§7 "custom → explicit
 * `install <pack>` list + overlay lines"): one `npx skillpacks install <pack>`
 * per distinct core pack, plus one per overlay pack not already covered by the
 * core. Pristine starter decks keep the one-line `install-deck <slug>` instead.
 */
export function customInstallLines(deck: Deck): string[] {
  const core = deckPacks(deck.skills);
  const coreSet = new Set(core);
  const overlay = (deck.overlayPacks ?? []).filter((p) => !coreSet.has(p));
  return [...core, ...overlay].map((pack) => `npx skillpacks install ${pack}`);
}
