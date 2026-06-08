// 成就奖励图标：旧贴纸图标和原创卡通主题角色并存，可在 ThemeManagement 的图标选择中使用。
// iconKey 与 FocusTheme.iconType / 历史代码里的 stickers id 保持一致。

import { ORIGINAL_CARTOON_THEME_IDS, type OriginalCartoonThemeId } from './themes';

export type LegacyIconSet = 'chiikawa' | 'shinchan';
export type IconSet = LegacyIconSet | OriginalCartoonThemeId;

interface AchievementIconBase {
    iconKey: string;
    achievementKey: string; // 对应 Achievement.key（数据库）
    set: IconSet;
}

interface FreeIconBase {
    iconKey: string;
    set: IconSet;
}

interface LegacyIconDefinition {
    img: string;
    themeId?: never;
}

interface OriginalIconDefinition {
    themeId: OriginalCartoonThemeId;
    img?: never;
}

export type AchievementIcon = AchievementIconBase & (LegacyIconDefinition | OriginalIconDefinition);
export type FreeIcon = FreeIconBase & (LegacyIconDefinition | OriginalIconDefinition);

const themeId = (index: number) => ORIGINAL_CARTOON_THEME_IDS[index % ORIGINAL_CARTOON_THEME_IDS.length];

export const ACHIEVEMENT_ICONS: AchievementIcon[] = [
    // Chiikawa 系列（保留旧主题贴纸）
    { iconKey: 'chiikawa',  img: '/assets/chiikawa/sticker-0.png',  achievementKey: 'first_session', set: 'chiikawa' },
    { iconKey: 'hachiware', img: '/assets/chiikawa/sticker-1.png',  achievementKey: 'session_10',    set: 'chiikawa' },
    { iconKey: 'usagi',     img: '/assets/chiikawa/sticker-2.png',  achievementKey: 'session_50',    set: 'chiikawa' },
    { iconKey: 'momonga',   img: '/assets/chiikawa/sticker-5.png',  achievementKey: 'session_100',   set: 'chiikawa' },
    { iconKey: 'shisa',     img: '/assets/chiikawa/sticker-6.png',  achievementKey: 'focus_10h',     set: 'chiikawa' },
    { iconKey: 'kurimanju', img: '/assets/chiikawa/sticker-10.png', achievementKey: 'focus_25h',     set: 'chiikawa' },
    { iconKey: 'rakko',     img: '/assets/chiikawa/sticker-11.png', achievementKey: 'focus_100h',    set: 'chiikawa' },
    // Shin-chan 系列（保留旧主题贴纸）
    { iconKey: 'shinchan',  img: '/assets/shinchan/shinchan.png',         achievementKey: 'streak_3d',  set: 'shinchan' },
    { iconKey: 'kazama',    img: '/assets/shinchan/kazama.png',           achievementKey: 'streak_7d',  set: 'shinchan' },
    { iconKey: 'bo-chan',   img: '/assets/shinchan/bo-chan.png',          achievementKey: 'streak_14d', set: 'shinchan' },
    { iconKey: 'masao',     img: '/assets/shinchan/masao.png',            achievementKey: 'streak_30d', set: 'shinchan' },
    { iconKey: 'shiro',     img: '/assets/shinchan/shiro-animated.gif',   achievementKey: 'night_owl',  set: 'shinchan' },
    // 原创卡通系列
    { iconKey: 'mochi-coach', themeId: 'mochi-camp', achievementKey: 'first_session', set: 'mochi-camp' },
    { iconKey: 'pencil-post', themeId: 'stationery-town', achievementKey: 'session_10', set: 'stationery-town' },
    { iconKey: 'cloud-tutor', themeId: 'cloud-academy', achievementKey: 'session_50', set: 'cloud-academy' },
    { iconKey: 'bean-lab', themeId: 'bean-planet', achievementKey: 'session_100', set: 'bean-planet' },
    { iconKey: 'lighthouse-sprout', themeId: 'forest-lighthouse', achievementKey: 'focus_10h', set: 'forest-lighthouse' },
    { iconKey: 'moon-librarian', themeId: 'moon-library', achievementKey: 'focus_25h', set: 'moon-library' },
    { iconKey: 'deep-reader', themeId: themeId(5), achievementKey: 'focus_100h', set: themeId(5) },
    { iconKey: 'streak-mochi', themeId: themeId(0), achievementKey: 'streak_3d', set: themeId(0) },
    { iconKey: 'streak-pencil', themeId: themeId(1), achievementKey: 'streak_7d', set: themeId(1) },
    { iconKey: 'streak-cloud', themeId: themeId(2), achievementKey: 'streak_14d', set: themeId(2) },
    { iconKey: 'streak-bean', themeId: themeId(3), achievementKey: 'streak_30d', set: themeId(3) },
    { iconKey: 'night-guide', themeId: themeId(5), achievementKey: 'night_owl', set: themeId(5) },
];

// 无需解锁，始终可用
export const FREE_ICONS: FreeIcon[] = [
    { iconKey: 'nene',        img: '/assets/shinchan/nene.png',        set: 'shinchan' },
    { iconKey: 'action-mask', img: '/assets/shinchan/action-mask.png', set: 'shinchan' },
    { iconKey: 'starter-mochi', themeId: 'mochi-camp', set: 'mochi-camp' },
    { iconKey: 'starter-pencil', themeId: 'stationery-town', set: 'stationery-town' },
    { iconKey: 'starter-cloud', themeId: 'cloud-academy', set: 'cloud-academy' },
];

// 通过 achievement key 查图标
export const ACHIEVEMENT_TO_ICON: Record<string, AchievementIcon> = Object.fromEntries(
    ACHIEVEMENT_ICONS.reduce<[string, AchievementIcon][]>((entries, icon) => {
        if (!entries.some(([key]) => key === icon.achievementKey)) {
            entries.push([icon.achievementKey, icon]);
        }
        return entries;
    }, [])
);

// 通过 iconKey 查图标定义（成就 + 免费都查）
export const ICON_BY_KEY: Record<string, AchievementIcon | FreeIcon> = Object.fromEntries(
    [...ACHIEVEMENT_ICONS, ...FREE_ICONS].map(i => [i.iconKey, i])
);
