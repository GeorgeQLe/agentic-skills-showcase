import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { renderAnimationStateMachineReferencePage } from "../src/components/debug/animationMachineStaticPage";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(scriptDir, "../alignment/animation-state-machine.html");

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, renderAnimationStateMachineReferencePage(), "utf8");

console.log(`Wrote ${outputPath}`);
