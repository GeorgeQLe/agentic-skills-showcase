/**
 * manualClock.ts — slow-motion time scaling for the /prototype animation.
 *
 * ── API-verification spike result (framer-motion@12.40.0) ──────────────────
 * The plan's preferred mechanism was framer-motion's manual frame clock
 * (`MotionGlobalConfig.useManualTiming = true` + driving the `frame`/`frameData`
 * frameloop at speed×realtime). Investigation of the installed version:
 *
 *   • `MotionGlobalConfig` IS re-exported from "framer-motion"
 *     (framer-motion/dist/es/index.mjs:40 → motion-utils/global-config.mjs).
 *   • `frame`, `frameData`, `frameSteps`, `cancelFrame` are NOT exported from
 *     "framer-motion" — they live in `motion-dom@12.40.0`
 *     (motion-dom/dist/es/frameloop/frame.mjs), which is a *transitive* dep:
 *     not declared in package.json and not hoisted under pnpm, so it is not
 *     importable from app code without adding a fragile internal dependency.
 *   • Driving manual timing requires writing `frameData.timestamp`/`delta` each
 *     tick (batcher.mjs:21-30 reads `state.timestamp` and skips delta-compute
 *     when `useManualTiming` is on), i.e. it depends on those non-exported
 *     internals plus RAF-ordering against framer's own keep-alive loop.
 *
 * Conclusion: the manual-timing surface is not safely reachable in this version
 * without coupling to undocumented internals. We take the plan's documented
 * fallback: scale each authored `transition` config by the slow-mo factor.
 *
 * ── Why the fallback is faithful here ──────────────────────────────────────
 * Every animation that matters to the apex bug is authored in a `transition`
 * prop or an imperative `animate()` config in this codebase:
 *   • the apex shared-layout morph (SealedPack `layout` tween, PackOpener card0
 *     `layout` spring),
 *   • the AnimatePresence sheet + scrim exits (BottomSheet `transition`),
 *   • the fan-out / collapse springs and the tear/curl tweens.
 * scaleTransition() reaches all of them. Spring shape is preserved exactly:
 * scaling stiffness by speed² and damping by speed (mass fixed) keeps the
 * damping ratio ζ = c / (2√(k·m)) constant while the natural frequency
 * ω₀ = √(k/m) scales by `speed`, so the trajectory is identical, just 1/speed
 * times longer — overshoot and bounce are unchanged. Tween durations/delays
 * scale by 1/speed.
 */

type AnyTransition = Record<string, unknown> | undefined | null;

function isSpringConfig(t: Record<string, unknown>): boolean {
  if (t.type === "spring") return true;
  if (t.type != null) return false; // explicit non-spring (tween, keyframes, inertia)
  // type omitted: framer infers a spring when these are present
  return (
    t.stiffness != null ||
    t.damping != null ||
    t.bounce != null ||
    t.visualDuration != null ||
    t.mass != null
  );
}

function scaleOne(t: AnyTransition, speed: number): AnyTransition {
  if (!t || typeof t !== "object") return t;
  const inv = 1 / speed;
  const out: Record<string, unknown> = { ...t };

  if (isSpringConfig(out)) {
    // Preserve damping ratio → identical overshoot, 1/speed times slower.
    if (typeof out.stiffness === "number") out.stiffness = out.stiffness * speed * speed;
    if (typeof out.damping === "number") out.damping = out.damping * speed;
    // mass is intentionally left untouched.
    if (typeof out.visualDuration === "number") out.visualDuration = out.visualDuration * inv;
    if (typeof out.duration === "number") out.duration = out.duration * inv;
  } else if (typeof out.duration === "number") {
    out.duration = out.duration * inv; // tween / default
  }

  if (typeof out.delay === "number") out.delay = out.delay * inv;

  // Nested per-property transition blocks (e.g. { layout: { ... } }).
  for (const key of ["layout", "default", "x", "y", "opacity", "scale", "rotateZ"]) {
    const nested = out[key];
    if (nested && typeof nested === "object") {
      out[key] = scaleOne(nested as AnyTransition, speed);
    }
  }

  return out;
}

/**
 * Scale a framer-motion transition (or imperative animate() config) by the
 * slow-mo factor. `speed === 1` (or a falsy transition) returns the input
 * unchanged so debug-off / 1x is byte-for-byte the production config.
 */
export function scaleTransition<T extends AnyTransition>(transition: T, speed: number): T {
  if (!transition || speed === 1) return transition;
  return scaleOne(transition, speed) as T;
}

/**
 * Investigation outcome flag — surfaced in the panel so the chosen mechanism
 * is visible at a glance and future devs know the manual clock was evaluated.
 */
export const SLOWMO_MECHANISM = "transition-scaling" as const;
