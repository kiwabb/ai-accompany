// 成就奖励图标：每个成就解锁后对应一个卡通贴纸，可在 ThemeManagement 的图标选择中使用。
// iconKey 与 FocusTheme.iconType / 历史代码里的 stickers id 保持一致。

export type IconSet = 'chiikawa' | 'shinchan';

export interface AchievementIcon {
    iconKey: string;
    img: string;
    achievementKey: string; // 对应 Achievement.key（数据库）
    set: IconSet;
}

export interface FreeIcon {
    iconKey: string;
    img: string;
    set: IconSet;
}

export const ACHIEVEMENT_ICONS: AchievementIcon[] = [
    // Chiikawa 系列（按场次/累计时长解锁）
    { iconKey: 'chiikawa',  img: '/assets/chiikawa/sticker-0.png',  achievementKey: 'first_session', set: 'chiikawa' },
    { iconKey: 'hachiware', img: '/assets/chiikawa/sticker-1.png',  achievementKey: 'session_10',    set: 'chiikawa' },
    { iconKey: 'usagi',     img: '/assets/chiikawa/sticker-2.png',  achievementKey: 'session_50',    set: 'chiikawa' },
    { iconKey: 'momonga',   img: '/assets/chiikawa/sticker-5.png',  achievementKey: 'session_100',   set: 'chiikawa' },
    { iconKey: 'shisa',     img: '/assets/chiikawa/sticker-6.png',  achievementKey: 'focus_10h',     set: 'chiikawa' },
    { iconKey: 'kurimanju', img: '/assets/chiikawa/sticker-10.png', achievementKey: 'focus_25h',     set: 'chiikawa' },
    { iconKey: 'rakko',     img: '/assets/chiikawa/sticker-11.png', achievementKey: 'focus_100h',    set: 'chiikawa' },
    // Shin-chan 系列（按连续天数 + 隐藏解锁）
    { iconKey: 'shinchan',  img: '/assets/shinchan/shinchan.png',         achievementKey: 'streak_3d',  set: 'shinchan' },
    { iconKey: 'kazama',    img: '/assets/shinchan/kazama.png',           achievementKey: 'streak_7d',  set: 'shinchan' },
    { iconKey: 'bo-chan',   img: '/assets/shinchan/bo-chan.png',          achievementKey: 'streak_14d', set: 'shinchan' },
    { iconKey: 'masao',     img: '/assets/shinchan/masao.png',            achievementKey: 'streak_30d', set: 'shinchan' },
    { iconKey: 'shiro',     img: '/assets/shinchan/shiro-animated.gif',   achievementKey: 'night_owl',  set: 'shinchan' },
];

// 无需解锁，始终可用
export const FREE_ICONS: FreeIcon[] = [
    { iconKey: 'nene',        img: '/assets/shinchan/nene.png',        set: 'shinchan' },
    { iconKey: 'action-mask', img: '/assets/shinchan/action-mask.png', set: 'shinchan' },
];

// 通过 achievement key 查图标
export const ACHIEVEMENT_TO_ICON: Record<string, AchievementIcon> = Object.fromEntries(
    ACHIEVEMENT_ICONS.map(i => [i.achievementKey, i])
);

// 通过 iconKey 查图标定义（成就 + 免费都查）
export const ICON_BY_KEY: Record<string, AchievementIcon | FreeIcon> = Object.fromEntries(
    [...ACHIEVEMENT_ICONS, ...FREE_ICONS].map(i => [i.iconKey, i])
);
