import type { SessionResponse, UserAchievementResponse, AchievementResponse } from '../../api/types';

export const ACHIEVEMENT_CATALOG: AchievementResponse[] = [
  { id: 1, key: 'first_session', name: 'First Step', description: 'Complete your first focus session', category: 'milestone', target_type: 'session_count', target_value: 1, is_hidden: false },
  { id: 2, key: 'session_10', name: 'Getting Warmed Up', description: 'Complete 10 focus sessions', category: 'milestone', target_type: 'session_count', target_value: 10, is_hidden: false },
  { id: 3, key: 'session_50', name: 'Half Century', description: 'Complete 50 focus sessions', category: 'milestone', target_type: 'session_count', target_value: 50, is_hidden: false },
  { id: 4, key: 'session_100', name: 'Centurion', description: 'Complete 100 focus sessions', category: 'milestone', target_type: 'session_count', target_value: 100, is_hidden: false },

  { id: 5, key: 'focus_10h', name: 'Focus Apprentice', description: 'Accumulate 10 hours of focus time', category: 'focus', target_type: 'total_focus_time', target_value: 10 * 3600, is_hidden: false },
  { id: 6, key: 'focus_25h', name: 'Deep Worker', description: 'Accumulate 25 hours of focus time', category: 'focus', target_type: 'total_focus_time', target_value: 25 * 3600, is_hidden: false },
  { id: 7, key: 'focus_100h', name: 'Focus Master', description: 'Accumulate 100 hours of focus time', category: 'focus', target_type: 'total_focus_time', target_value: 100 * 3600, is_hidden: false },

  { id: 8, key: 'streak_3d', name: 'Three in a Row', description: 'Keep a 3-day focus streak', category: 'streak', target_type: 'streak_days', target_value: 3, is_hidden: false },
  { id: 9, key: 'streak_7d', name: 'Persistence Wins', description: 'Keep a 7-day focus streak', category: 'streak', target_type: 'streak_days', target_value: 7, is_hidden: false },
  { id: 10, key: 'streak_14d', name: 'Habit Formed', description: 'Keep a 14-day focus streak', category: 'streak', target_type: 'streak_days', target_value: 14, is_hidden: false },
  { id: 11, key: 'streak_30d', name: 'Iron Will', description: 'Keep a 30-day focus streak', category: 'streak', target_type: 'streak_days', target_value: 30, is_hidden: false },

  { id: 12, key: 'night_owl', name: 'Night Owl', description: 'Complete a focus session between 0:00 - 4:00', category: 'hidden', target_type: 'night_session', target_value: 1, is_hidden: true }
];

function getStreakDays(sessions: SessionResponse[]): number {
  const focusSessions = sessions.filter(s => s.phase_type === 'focus' && s.status === 'completed');
  if (focusSessions.length === 0) return 0;

  // Extract unique local dates sorted in descending order
  const uniqueDatesStr = Array.from(new Set(
    focusSessions.map(s => s.start_time.split('T')[0])
  )).sort((a, b) => b.localeCompare(a));

  if (uniqueDatesStr.length === 0) return 0;

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const firstDateStr = uniqueDatesStr[0];
  if (firstDateStr !== todayStr && firstDateStr !== yesterdayStr) {
    return 0;
  }

  let streak = 1;
  for (let i = 0; i < uniqueDatesStr.length - 1; i++) {
    const cur = new Date(uniqueDatesStr[i]);
    const next = new Date(uniqueDatesStr[i + 1]);
    const diffTime = Math.abs(cur.getTime() - next.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export function computeAchievements(sessions: SessionResponse[]): UserAchievementResponse[] {
  const focusSessions = sessions.filter(s => s.phase_type === 'focus' && s.status === 'completed');
  
  const totalFocusSeconds = focusSessions.reduce((acc, curr) => acc + curr.duration_seconds, 0);
  const sessionCount = focusSessions.length;
  const streak = getStreakDays(sessions);
  
  // Night sessions checking (local time between 00:00 and 04:00)
  const hasNightSession = focusSessions.some(s => {
    const sDate = new Date(s.start_time);
    const hour = sDate.getHours();
    return hour >= 0 && hour < 4;
  });

  return ACHIEVEMENT_CATALOG.map(ach => {
    let currentProgress = 0;
    let isUnlocked = false;

    switch (ach.target_type) {
      case 'session_count':
        currentProgress = sessionCount;
        isUnlocked = sessionCount >= ach.target_value;
        break;
      case 'total_focus_time':
        currentProgress = totalFocusSeconds;
        isUnlocked = totalFocusSeconds >= ach.target_value;
        break;
      case 'night_session':
        currentProgress = hasNightSession ? 1 : 0;
        isUnlocked = hasNightSession;
        break;
      case 'streak_days':
        currentProgress = streak;
        isUnlocked = streak >= ach.target_value;
        break;
    }

    // Cap the progress to target value
    const actualProgress = Math.min(currentProgress, ach.target_value);

    // Try to find if we already computed unlocked_at or guess one based on session times
    let unlockedAt: string | undefined = undefined;
    if (isUnlocked) {
      // Find the specific session that triggered this achievement
      let sortedFocus = [...focusSessions].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
      
      if (ach.target_type === 'session_count') {
        const index = ach.target_value - 1;
        if (sortedFocus[index]) {
          unlockedAt = sortedFocus[index].end_time;
        }
      } else if (ach.target_type === 'total_focus_time') {
        let runningTotal = 0;
        const triggerSession = sortedFocus.find(s => {
          runningTotal += s.duration_seconds;
          return runningTotal >= ach.target_value;
        });
        if (triggerSession) {
          unlockedAt = triggerSession.end_time;
        }
      } else if (ach.target_type === 'night_session') {
        const triggerSession = sortedFocus.find(s => {
          const sDate = new Date(s.start_time);
          const hour = sDate.getHours();
          return hour >= 0 && hour < 4;
        });
        if (triggerSession) {
          unlockedAt = triggerSession.end_time;
        }
      } else if (ach.target_type === 'streak_days') {
        // Streaks can trigger on the end_time of the last focus session of the streak day
        if (sortedFocus.length > 0) {
          unlockedAt = sortedFocus[sortedFocus.length - 1].end_time;
        }
      }

      if (!unlockedAt && sortedFocus.length > 0) {
        unlockedAt = sortedFocus[sortedFocus.length - 1].end_time;
      }
    }

    return {
      id: ach.id,
      achievement_id: ach.id,
      current_progress: actualProgress,
      status: isUnlocked ? 'unlocked' : 'in_progress',
      unlocked_at: unlockedAt,
      updated_at: new Date().toISOString(),
      achievement: ach
    };
  });
}


export function checkNewlyUnlocked(
  prev: UserAchievementResponse[],
  next: UserAchievementResponse[]
): UserAchievementResponse[] {
  const newlyUnlocked: UserAchievementResponse[] = [];
  next.forEach(nxt => {
    if (nxt.status === 'unlocked') {
      const prv = prev.find(p => p.achievement_id === nxt.achievement_id);
      if (!prv || prv.status !== 'unlocked') {
        newlyUnlocked.push(nxt);
      }
    }
  });
  return newlyUnlocked;
}
