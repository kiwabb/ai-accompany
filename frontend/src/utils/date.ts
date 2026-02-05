export function getFormattedDate(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateTime(date: Date): string {
    return date.toLocaleString();
}

export const formatDuration = (minutes: number, t: (key: string, defaultVal: string) => string = (_, v) => v) => {
    if (minutes < 60) return `${minutes} ${t('timer.minutes', 'm')}`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};
