/**
 * Updates a memory fragment via API
 */
export async function updateFragment(
  fragmentId: number,
  content: string
): Promise<boolean> {
  try {
    const response = await fetch(`/api/diagnostics/memory/fragments/${fragmentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to update fragment', error);
    return false;
  }
}

/**
 * Deletes a memory fragment via API
 */
export async function deleteFragment(fragmentId: number): Promise<boolean> {
  try {
    const response = await fetch(`/api/diagnostics/memory/fragments/${fragmentId}`, {
      method: 'DELETE',
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to delete fragment', error);
    return false;
  }
}

/**
 * Deletes a profile item (fact or preference) via API
 */
export async function deleteProfileItem(
  category: 'facts' | 'preferences',
  value: string
): Promise<boolean> {
  try {
    const response = await fetch(`/api/diagnostics/profile/${category}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });
    return response.ok;
  } catch (error) {
    console.error(`Failed to delete ${category} item`, error);
    return false;
  }
}

/**
 * Updates a profile item (fact or preference) via API
 */
export async function updateProfileItem(
  category: 'facts' | 'preferences',
  oldValue: string,
  newValue: string
): Promise<boolean> {
  try {
    const response = await fetch(`/api/diagnostics/profile/${category}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        old_value: oldValue,
        new_value: newValue,
      }),
    });
    return response.ok;
  } catch (error) {
    console.error(`Failed to update ${category} item`, error);
    return false;
  }
}

/**
 * Resets all user memory via API
 */
export async function resetMemory(): Promise<boolean> {
  try {
    const response = await fetch('/api/diagnostics/reset', { method: 'POST' });
    return response.ok;
  } catch (error) {
    console.error('Failed to reset memory', error);
    return false;
  }
}

/**
 * Updates the known refs when a profile item is deleted
 */
export function removeFromKnownRefs(
  category: 'facts' | 'preferences',
  value: string,
  knownFactsRef: React.MutableRefObject<Set<string>>,
  knownPrefsRef: React.MutableRefObject<Set<string>>
): void {
  if (category === 'facts') {
    knownFactsRef.current.delete(value);
  } else {
    knownPrefsRef.current.delete(value);
  }
}

/**
 * Updates the known refs when a profile item is changed
 */
export function updateKnownRefs(
  category: 'facts' | 'preferences',
  oldValue: string,
  newValue: string,
  knownFactsRef: React.MutableRefObject<Set<string>>,
  knownPrefsRef: React.MutableRefObject<Set<string>>
): void {
  if (category === 'facts') {
    knownFactsRef.current.delete(oldValue);
    knownFactsRef.current.add(newValue);
  } else {
    knownPrefsRef.current.delete(oldValue);
    knownPrefsRef.current.add(newValue);
  }
}
