export type DailyFrameworkCompletion = {
  dateKey: string; // YYYY-MM-DD
  completedSceneIds: string[]; // SceneId but keep string for forward compatibility
};

export function dateKeyOf(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function computeStreak(dateKeysCompleted: string[], todayKey: string): number {
  const set = new Set(dateKeysCompleted);
  let streak = 0;

  // walk backwards from today
  let cursor = new Date(`${todayKey}T00:00:00`);
  while (true) {
    const key = dateKeyOf(cursor);
    if (!set.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

