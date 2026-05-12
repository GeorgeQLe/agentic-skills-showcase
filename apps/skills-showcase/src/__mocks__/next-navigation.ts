export function usePathname(): string {
  return "/";
}

export function useRouter() {
  return {
    push: () => {},
    replace: () => {},
    prefetch: () => {},
    back: () => {},
    forward: () => {}
  };
}

export function useSearchParams() {
  return new URLSearchParams();
}
