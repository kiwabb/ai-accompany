import type { CountdownEvent } from '../../types/pomodoro';

const STORAGE_KEY = 'pomodoro_countdowns';

export async function getCountdowns(): Promise<CountdownEvent[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function createCountdown(title: string, targetDate: Date): Promise<CountdownEvent> {
  const list = await getCountdowns();
  const newEvent: CountdownEvent = {
    id: Date.now(),
    title,
    targetDate: targetDate.toISOString(),
  };
  list.push(newEvent);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return newEvent;
}

export async function deleteCountdown(id: number): Promise<void> {
  const list = await getCountdowns();
  const updated = list.filter(item => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}
