import { useSyncExternalStore } from 'react';

const MOBILE_QUERY = '(max-width: 767px)';

const getSnapshot = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(MOBILE_QUERY).matches;
};

const subscribe = (onStoreChange: () => void) => {
  if (typeof window === 'undefined') return () => undefined;

  const mql = window.matchMedia(MOBILE_QUERY);
  mql.addEventListener('change', onStoreChange);
  return () => mql.removeEventListener('change', onStoreChange);
};

export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
