export interface UserProfile {
  name?: string;
  learningGoals?: string;
  facts: string[];
  preferences: string[];
}

const STORAGE_KEY = 'cozypal_user_profile';

const DEFAULT_PROFILE: UserProfile = {
  name: '学子',
  learningGoals: '深入掌握计算机软硬件知识，养成规律专注的学习习惯',
  facts: [
    '正在备考或进行高强度自主学习',
    '喜欢舒适、有陪伴感的学习环境'
  ],
  preferences: [
    '喜欢温和鼓励的声音，拒绝打压',
    '希望 AI 的回答言简意赅，不要啰嗦'
  ]
};

export function getUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw);
    return {
      name: parsed.name ?? DEFAULT_PROFILE.name,
      learningGoals: parsed.learningGoals ?? DEFAULT_PROFILE.learningGoals,
      facts: Array.isArray(parsed.facts) ? parsed.facts : DEFAULT_PROFILE.facts,
      preferences: Array.isArray(parsed.preferences) ? parsed.preferences : DEFAULT_PROFILE.preferences,
    };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveUserProfile(profile: UserProfile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}
