import { describe, expect, it } from "vitest";

import { buildCustomDeck, customInstallLines, decodeDeckParam, encodeDeckParam } from "./shareDeck";
import { CUSTOM_SLUG, type Deck, type DeckData } from "./decks";

const skills = [
  { id: "a", name: "a", title: "A", pack: "vard", description: "", platform: "claude", scope: "pack", version: "v0.0", tags: [] },
  { id: "b", name: "b", title: "B", pack: "vard", description: "", platform: "claude", scope: "pack", version: "v0.0", tags: [] },
  { id: "c", name: "c", title: "C", pack: "ord", description: "", platform: "claude", scope: "pack", version: "v0.0", tags: [] },
  { id: "d", name: "d", title: "D", pack: "biz", description: "", platform: "claude", scope: "pack", version: "v0.0", tags: [] },
] as unknown as DeckData["skills"];

const data: DeckData = { skills };

function customDeck(): Deck {
  return {
    name: "My mix",
    slug: CUSTOM_SLUG,
    domain: "custom",
    tempo: "custom",
    phases: [
      { key: "scan", name: "Scan", suggestedSkills: [skills[0]] },
      { key: "ship", name: "Ship", suggestedSkills: [skills[2]] },
    ],
    skills: [skills[0], skills[2]],
    overlayPacks: ["biz"],
    overlaySkills: [skills[3]],
  };
}

describe("shareDeck encode/decode", () => {
  it("round-trips a custom deck through the ?c= param", () => {
    const param = encodeDeckParam(customDeck());
    const payload = decodeDeckParam(param);
    expect(payload).toEqual({
      n: "My mix",
      p: [
        { k: "scan", n: "Scan", c: ["a"] },
        { k: "ship", n: "Ship", c: ["c"] },
      ],
      o: ["d"],
    });
  });

  it("is byte-compatible with Node base64url(JSON)", () => {
    // A param a test (or any tooling) constructs with Buffer base64url decodes
    // identically — the e2e round-trip relies on this.
    const payload = { n: "x", p: [{ k: "scan", n: "Scan", c: ["a", "b"] }] };
    const param = Buffer.from(JSON.stringify(payload)).toString("base64url");
    expect(decodeDeckParam(param)).toEqual(payload);
  });

  it("returns null for malformed params", () => {
    expect(decodeDeckParam("not-base64-$$$")).toBeNull();
    expect(decodeDeckParam(Buffer.from("{}").toString("base64url"))).toBeNull();
    expect(decodeDeckParam(Buffer.from('{"p":"nope"}').toString("base64url"))).toBeNull();
  });

  it("builds the synthetic custom deck, resolving cards + overlay packs", () => {
    const param = encodeDeckParam(customDeck());
    const built = buildCustomDeck(param, data)!;
    expect(built.slug).toBe(CUSTOM_SLUG);
    expect(built.name).toBe("My mix");
    expect(built.skills.map((s) => s.id)).toEqual(["a", "c"]);
    expect(built.phases.map((p) => p.key)).toEqual(["scan", "ship"]);
    expect(built.overlayPacks).toEqual(["biz"]);
  });

  it("drops unresolved card ids and returns null when nothing resolves", () => {
    const param = Buffer.from(
      JSON.stringify({ p: [{ k: "x", n: "X", c: ["missing"] }] }),
    ).toString("base64url");
    expect(buildCustomDeck(param, data)).toBeNull();
  });

  it("custom install lines: one per distinct core pack + overlay packs", () => {
    expect(customInstallLines(customDeck())).toEqual([
      "npx skillpacks install vard",
      "npx skillpacks install ord",
      "npx skillpacks install biz",
    ]);
  });
});
