import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Trash2, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { createUserTheme, deleteUserTheme, getAchievements } from '../../api/client';
import type { FocusTheme } from '../../types/pomodoro';
import { ACHIEVEMENT_ICONS, FREE_ICONS, ICON_BY_KEY, type AchievementIcon, type FreeIcon, type IconSet } from '../../constants/achievementIcons';
import { ORIGINAL_CARTOON_THEME_IDS, resolveVisualTheme } from '../../constants/themes';
import OriginalMascot from '../OriginalMascot';

interface ThemeManagementProps {
  themes: FocusTheme[];
  setThemes: React.Dispatch<React.SetStateAction<FocusTheme[]>>;
  handleThemesChange: (themes: FocusTheme[]) => void;
}

const ThemeManagement: React.FC<ThemeManagementProps> = ({
  themes,
  setThemes,
  handleThemesChange,
}) => {
  const { t } = useTranslation();
  const [newThemeName, setNewThemeName] = useState('');
  const [newThemeDuration, setNewThemeDuration] = useState(25);
  const [selectedIcon, setSelectedIcon] = useState('nene');
  const [unlockedAchievements, setUnlockedAchievements] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    getAchievements()
      .then((data) => {
        if (cancelled) return;
        const keys = new Set(
          data
            .filter((ua) => ua.status === 'unlocked' && ua.achievement?.key)
            .map((ua) => ua.achievement!.key)
        );
        setUnlockedAchievements(keys);
      })
      .catch((err) => console.error('Failed to fetch achievements for icon gating', err));
    return () => { cancelled = true; };
  }, []);

  const isIconLocked = useCallback(
    (iconKey: string) => {
      const def = ICON_BY_KEY[iconKey];
      if (!def || !('achievementKey' in def)) return false;
      return !unlockedAchievements.has(def.achievementKey);
    },
    [unlockedAchievements]
  );

  const iconGroups = useMemo(() => {
    const sets: IconSet[] = ['chiikawa', 'shinchan', ...ORIGINAL_CARTOON_THEME_IDS];
    return sets.map((set) => ({
      set,
      icons: [
        ...FREE_ICONS.filter((i) => i.set === set),
        ...ACHIEVEMENT_ICONS.filter((i) => i.set === set),
      ],
    })).filter((group) => group.icons.length > 0);
  }, []);

  const renderIconPreview = (iconDef: AchievementIcon | FreeIcon, locked = false, size = 46) => {
    if (iconDef.img) {
      return (
        <img
          src={iconDef.img}
          alt={iconDef.iconKey}
          className={`w-full h-full object-contain ${locked ? 'grayscale opacity-40' : ''}`}
        />
      );
    }

    return (
      <OriginalMascot
        theme={resolveVisualTheme(iconDef.themeId)}
        size={size}
        className={locked ? 'grayscale opacity-40' : ''}
      />
    );
  };

  const getIconDef = (key?: string) => (key ? ICON_BY_KEY[key] : undefined);

  const handleThemeNameChange = useCallback((id: string, name: string) => {
    setThemes((prev) => prev.map((theme) => (theme.id === id ? { ...theme, name } : theme)));
  }, [setThemes]);

  const handleThemeDurationChange = useCallback((id: string, duration: number) => {
    setThemes((prev) => prev.map((theme) => (theme.id === id ? { ...theme, focusDuration: Math.max(1, duration) } : theme)));
  }, [setThemes]);

  const handleAddTheme = useCallback(async () => {
    if (newThemeName.trim() && newThemeDuration > 0) {
      const newTheme: FocusTheme = {
        id: uuidv4(),
        name: newThemeName.trim(),
        focusDuration: newThemeDuration,
        isDefault: false,
        iconType: selectedIcon
      };

      try {
        await createUserTheme(newTheme);
        const updatedThemes = [...themes, newTheme];
        setThemes(updatedThemes);
        handleThemesChange(updatedThemes);
        setNewThemeName('');
        setNewThemeDuration(25);
      } catch (error) {
        console.error("Failed to create theme:", error);
      }
    }
  }, [newThemeName, newThemeDuration, selectedIcon, themes, handleThemesChange, setThemes]);

  const handleRemoveTheme = useCallback(async (id: string) => {
    try {
      await deleteUserTheme(id);
      const updatedThemes = themes.filter((theme) => theme.id !== id);
      setThemes(updatedThemes);
      handleThemesChange(updatedThemes);
    } catch (error) {
      console.error("Failed to delete theme:", error);
    }
  }, [themes, handleThemesChange, setThemes]);

  return (
    <section className="space-y-4 md:space-y-6">
      <header className="flex items-center gap-3 md:gap-4 px-1">
        <div className="h-[2px] w-8 bg-rose-400 rounded-full" />
        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">
          {t('settings.themes')}
        </h2>
      </header>

      <div className="grid grid-cols-1 gap-3 md:gap-4">
        {/* Add New Theme Card */}
        <div className="bg-slate-900/5 border-2 border-dashed border-slate-200 rounded-2xl md:rounded-[40px] p-4 md:p-8 mb-2">
          <div className="flex flex-col gap-3 md:gap-6">
            <div className="flex flex-col md:flex-row gap-3 md:gap-6 items-stretch md:items-end">
              <div className="flex-1 space-y-1.5 md:space-y-2 w-full">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-3 md:ml-4">新主题名称</label>
                <input
                  type="text"
                  value={newThemeName}
                  onChange={(e) => setNewThemeName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTheme()}
                  placeholder={t('settings.newThemeName')}
                  className="w-full bg-white px-4 md:px-8 py-3 md:py-5 rounded-xl md:rounded-[24px] border border-slate-100 font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition-all"
                />
              </div>
              <div className="space-y-1.5 md:space-y-2 w-full md:w-32">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-3 md:ml-4">时长</label>
                <div className="bg-white px-4 md:px-6 py-3 md:py-5 rounded-xl md:rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-center">
                  <input
                    type="number"
                    min={1}
                    value={newThemeDuration}
                    onChange={(e) => setNewThemeDuration(parseInt(e.target.value))}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTheme()}
                    className="w-full bg-transparent text-center font-bold text-slate-700 focus:outline-none"
                  />
                </div>
              </div>
              <button
                onClick={handleAddTheme}
                className="w-full md:w-auto px-6 md:px-10 py-3 md:py-5 bg-slate-900 text-white rounded-xl md:rounded-[24px] font-bold uppercase tracking-widest text-[10px] shadow-2xl hover:bg-indigo-600 transition-all active:scale-95"
              >
                {t('common.add')}
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">选择卡通图标</label>
              <div className="flex flex-wrap gap-4">
                {iconGroups.map((group) => (
                  <div key={group.set} className="flex flex-wrap items-center gap-2">
                    {group.icons.map((icon) => {
                      const locked = isIconLocked(icon.iconKey);
                      const achievementKey = 'achievementKey' in icon ? icon.achievementKey : undefined;
                      const lockTitle = locked
                        ? t('settings.iconLockedHint', { defaultValue: '解锁成就 "{{key}}" 后可用', key: achievementKey || '' })
                        : icon.iconKey;
                      return (
                        <button
                          key={icon.iconKey}
                          type="button"
                          disabled={locked}
                          onClick={() => !locked && setSelectedIcon(icon.iconKey)}
                          title={lockTitle}
                          aria-disabled={locked}
                          className={`
                            relative w-14 h-14 rounded-2xl border-2 transition-all p-1
                            ${locked ? 'border-slate-200 bg-slate-50 cursor-not-allowed' :
                              selectedIcon === icon.iconKey
                              ? 'border-rose-400 bg-rose-50 ring-4 ring-rose-400/10'
                              : 'border-white bg-white/50 hover:border-slate-300'}
                          `}
                        >
                          {renderIconPreview(icon, locked)}
                          {locked && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-[1px] rounded-2xl">
                              <Lock size={14} className="text-slate-400" />
                            </div>
                          )}
                          {!locked && selectedIcon === icon.iconKey && (
                            <div className="absolute -top-2 -right-2 w-5 h-5 bg-rose-400 rounded-full flex items-center justify-center shadow-md">
                              <div className="w-2 h-2 bg-white rounded-full" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {themes.map((theme) => (
          <div
            key={theme.id}
            className="bg-white/60 backdrop-blur-xl rounded-2xl md:rounded-[32px] p-3 md:p-6 border border-white shadow-sm flex flex-row items-center gap-3 md:gap-6 group hover:shadow-xl transition-all duration-500"
          >
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white/70 border border-white p-1.5 md:p-2 flex-shrink-0 flex items-center justify-center shadow-inner">
              {getIconDef(theme.iconType || theme.id) ? (
                renderIconPreview(getIconDef(theme.iconType || theme.id)!, false, 44)
              ) : (
                <span className="text-base md:text-xl font-bold text-slate-300 font-heading">
                  {theme.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={theme.name}
                onChange={(e) => handleThemeNameChange(theme.id, e.target.value)}
                disabled={theme.isDefault}
                placeholder="Theme name"
                className="w-full bg-transparent font-bold text-base md:text-xl text-slate-800 focus:outline-none placeholder:text-slate-300 disabled:opacity-50 truncate"
              />
              <div className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 md:mt-1">卡片标题</div>
            </div>

            <div className="flex items-center gap-2 md:gap-4 bg-slate-50/50 p-2 md:p-3 rounded-xl md:rounded-2xl border border-slate-100 shrink-0">
              <input
                type="number"
                min={1}
                value={theme.focusDuration}
                onChange={(e) => handleThemeDurationChange(theme.id, parseInt(e.target.value))}
                className="w-10 md:w-16 bg-transparent text-center font-bold text-slate-700 focus:outline-none"
              />
              <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest border-l border-slate-200 pl-2 md:pl-4 hidden sm:inline">MINUTES</span>
            </div>

            <button
              onClick={() => handleRemoveTheme(theme.id)}
              className="p-2 md:p-4 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl md:rounded-2xl transition-all active:scale-90 shrink-0"
            >
              <Trash2 size={20} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ThemeManagement;
