import React, { useState, useCallback } from 'react';
import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { createUserTheme, deleteUserTheme } from '../../api/client';
import type { FocusTheme } from '../../types/pomodoro';

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
  const [selectedIcon, setSelectedIcon] = useState('chiikawa');

  const chiikawaIcons = [
    { id: 'chiikawa', img: '/assets/chiikawa/sticker-0.png' },
    { id: 'hachiware', img: '/assets/chiikawa/sticker-1.png' },
    { id: 'usagi', img: '/assets/chiikawa/sticker-2.png' },
    { id: 'momonga', img: '/assets/chiikawa/sticker-5.png' },
    { id: 'shisa', img: '/assets/chiikawa/sticker-6.png' },
    { id: 'kurimanju', img: '/assets/chiikawa/sticker-10.png' },
    { id: 'rakko', img: '/assets/chiikawa/sticker-11.png' },
  ];

  const shinchanIcons = [
    { id: 'shinchan', img: '/assets/shinchan/shinchan.png' },
    { id: 'kazama', img: '/assets/shinchan/kazama.png' },
    { id: 'bo-chan', img: '/assets/shinchan/bo-chan.png' },
    { id: 'masao', img: '/assets/shinchan/masao.png' },
    { id: 'nene', img: '/assets/shinchan/nene.png' },
    { id: 'shiro', img: '/assets/shinchan/shiro-animated.gif' },
    { id: 'action-mask', img: '/assets/shinchan/action-mask.png' },
  ];

  const findIconImg = (key?: string) =>
    key ? [...chiikawaIcons, ...shinchanIcons].find((i) => i.id === key)?.img : undefined;

  const getThemeIconImg = (theme: FocusTheme) =>
    findIconImg(theme.iconType) || findIconImg(theme.id);

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
    <section className="space-y-6">
      <header className="flex items-center gap-4">
        <div className="h-[2px] w-8 bg-rose-400 rounded-full" />
        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">
          {t('settings.themes')}
        </h2>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {/* Add New Theme Card */}
        <div className="bg-slate-900/5 border-2 border-dashed border-slate-200 rounded-[40px] p-8 mb-2">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row gap-6 items-end">
              <div className="flex-1 space-y-2 w-full">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">新主题名称</label>
                <input
                  type="text"
                  value={newThemeName}
                  onChange={(e) => setNewThemeName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTheme()}
                  placeholder={t('settings.newThemeName')}
                  className="w-full bg-white px-8 py-5 rounded-[24px] border border-slate-100 font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition-all"
                />
              </div>
              <div className="space-y-2 w-full md:w-32">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">时长</label>
                <div className="bg-white px-6 py-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-center">
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
                className="w-full md:w-auto px-10 py-5 bg-slate-900 text-white rounded-[24px] font-bold uppercase tracking-widest text-[10px] shadow-2xl hover:bg-indigo-600 transition-all active:scale-95"
              >
                {t('common.add')}
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">选择图标主题 (Chiikawa / Shin-chan)</label>
              <div className="flex flex-wrap gap-3">
                {chiikawaIcons.map((icon) => (
                  <button
                    key={icon.id}
                    onClick={() => setSelectedIcon(icon.id)}
                    className={`
                      relative w-14 h-14 rounded-2xl border-2 transition-all p-2
                      ${selectedIcon === icon.id
                        ? 'border-rose-400 bg-rose-50 ring-4 ring-rose-400/10'
                        : 'border-white bg-white/50 hover:border-slate-300'}
                    `}
                  >
                    <img src={icon.img} alt={icon.id} className="w-full h-full object-contain" />
                    {selectedIcon === icon.id && (
                      <div className="absolute -top-2 -right-2 w-5 h-5 bg-rose-400 rounded-full flex items-center justify-center shadow-md">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </button>
                ))}
                <div className="w-px h-10 bg-slate-200 mx-2 self-center" />
                {shinchanIcons.map((icon) => (
                  <button
                    key={icon.id}
                    onClick={() => setSelectedIcon(icon.id)}
                    className={`
                      relative w-14 h-14 rounded-2xl border-2 transition-all p-2
                      ${selectedIcon === icon.id
                        ? 'border-yellow-400 bg-yellow-50 ring-4 ring-yellow-400/10'
                        : 'border-white bg-white/50 hover:border-slate-300'}
                    `}
                  >
                    <img src={icon.img} alt={icon.id} className="w-full h-full object-contain" />
                    {selectedIcon === icon.id && (
                      <div className="absolute -top-2 -right-2 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center shadow-md">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {themes.map((theme) => (
          <div
            key={theme.id}
            className="bg-white/60 backdrop-blur-xl rounded-[32px] p-6 border border-white shadow-sm flex flex-col md:flex-row items-center gap-6 group hover:shadow-xl transition-all duration-500"
          >
            <div className="w-14 h-14 rounded-2xl bg-white/70 border border-white p-2 flex-shrink-0 flex items-center justify-center shadow-inner">
              {getThemeIconImg(theme) ? (
                <img src={getThemeIconImg(theme)!} alt={theme.iconType || theme.id} className="w-full h-full object-contain" />
              ) : (
                <span className="text-xl font-bold text-slate-300 font-heading">
                  {theme.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex-1 w-full">
              <input
                type="text"
                value={theme.name}
                onChange={(e) => handleThemeNameChange(theme.id, e.target.value)}
                disabled={theme.isDefault}
                placeholder="Theme name"
                className="w-full bg-transparent font-bold text-xl text-slate-800 focus:outline-none placeholder:text-slate-300 disabled:opacity-50"
              />
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">卡片标题</div>
            </div>

            <div className="flex items-center gap-4 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
              <input
                type="number"
                min={1}
                value={theme.focusDuration}
                onChange={(e) => handleThemeDurationChange(theme.id, parseInt(e.target.value))}
                className="w-16 bg-transparent text-center font-bold text-slate-700 focus:outline-none"
              />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-l border-slate-200 pl-4">MINUTES</span>
            </div>

            <button
              onClick={() => handleRemoveTheme(theme.id)}
              className="p-4 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all active:scale-90"
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
