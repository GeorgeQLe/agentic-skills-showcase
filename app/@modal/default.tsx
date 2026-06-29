/*
 * Default state for the @modal parallel slot: render nothing. Next.js requires
 * a default for a slot so non-intercepted renders (anything that isn't a soft
 * navigation to /card/[id]) don't error.
 */
export default function ModalDefault() {
  return null;
}
