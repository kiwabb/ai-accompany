import type { TFunction } from 'i18next';
import { getAuthHeaders } from '../../api/client';

interface KnownMemoryRefs {
  knownFactsRef: React.MutableRefObject<Set<string>>;
  knownPrefsRef: React.MutableRefObject<Set<string>>;
  isInitializedRef: React.MutableRefObject<boolean>;
}

interface MemoryCheckResult {
  addedFact: string | null;
  addedPref: string | null;
}

/**
 * Fetches the latest memory update from the API
 */
export async function fetchLatestMemoryUpdate(): Promise<{
  has_update: boolean;
  facts?: string[];
  preferences?: string[];
  timestamp?: string;
} | null> {
  try {
    const response = await fetch('/api/diagnostics/latest-memory-update', { headers: getAuthHeaders() });
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error('Failed to fetch memory updates', error);
    return null;
  }
}

/**
 * Seeds the known memory cache with initial values
 */
export function seedKnownMemory(
  facts: string[],
  prefs: string[],
  refs: KnownMemoryRefs
): void {
  facts.forEach((fact) => refs.knownFactsRef.current.add(fact));
  prefs.forEach((pref) => refs.knownPrefsRef.current.add(pref));
  refs.isInitializedRef.current = true;
}

/**
 * Checks for new memory items and returns any newly discovered ones
 */
export function detectNewMemoryItems(
  newFacts: string[],
  newPrefs: string[],
  refs: KnownMemoryRefs
): MemoryCheckResult {
  let addedFact: string | null = null;
  let addedPref: string | null = null;

  for (const fact of newFacts) {
    if (!refs.knownFactsRef.current.has(fact)) {
      addedFact = fact;
      refs.knownFactsRef.current.add(fact);
    }
  }

  for (const pref of newPrefs) {
    if (!refs.knownPrefsRef.current.has(pref)) {
      addedPref = pref;
      refs.knownPrefsRef.current.add(pref);
    }
  }

  return { addedFact, addedPref };
}

/**
 * Shows a toast message for newly learned memory items
 */
export function showMemoryLearnedToast(
  result: MemoryCheckResult,
  t: TFunction,
  setToastMessage: (msg: string | null) => void
): boolean {
  const item = result.addedFact || result.addedPref;
  if (item) {
    setToastMessage(`${t('cozyPal.memory.learned')}: ${item}`);
    setTimeout(() => setToastMessage(null), 4000);
    return true;
  }
  return false;
}
