import React from 'react';
import { useTranslation } from 'react-i18next';
import type { TimerSettings } from '../../types/pomodoro';

interface GeneralSettingsProps {
  settings: TimerSettings;
  handleSettingChange: (key: keyof TimerSettings, value: string | number | boolean) => void;
  i18n: any; // i18n instance from react-i18next
}

const GeneralSettings: React.FC<GeneralSettingsProps> = ({
  settings,
  handleSettingChange,
  i18n,
}) => {
  const { t } = useTranslation();

  return (
    <section className="space-y-6">
      <header className="flex items-center gap-4">
        <div className="h-[2px] w-8 bg-blue-400 rounded-full" />
        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">
          {t('settings.language')}
        </h2>
      </header>
      <div className="flex bg-white/40 backdrop-blur-xl p-2 rounded-[32px] border border-white shadow-sm max-w-md">
        {[
          { code: 'en', label: 'English' },
          { code: 'zh', label: '简体中文' }
        ].map((lang) => (
          <button
            key={lang.code}
            onClick={() => i18n.changeLanguage(lang.code)}
            className={`
              flex-1 py-4 px-6 rounded-[24px] font-bold uppercase tracking-widest text-[10px] transition-all
              ${i18n.language === lang.code
                ? 'bg-slate-900 text-white shadow-xl'
                : 'text-slate-400 hover:text-slate-900 hover:bg-white'}
            `}
          >
            {lang.label}
          </button>
        ))}
      </div>
      {/* Add other general settings here if needed */}

      {/* Automatic Start Switch */}
      <div className="bg-white/60 backdrop-blur-xl rounded-[32px] p-6 border border-white shadow-sm flex flex-col md:flex-row items-center gap-6 group hover:shadow-xl transition-all duration-500">
        <div className="w-full md:w-1/3">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">{t('settings.autoStart')}</label>
          <p className="text-sm text-slate-400 font-medium">专注或休息结束，无缝进入下一段旅程</p>
        </div>
        <div className="w-full md:flex-1 flex justify-end">
          <button
            onClick={() => handleSettingChange('autoStartNext', !settings.autoStartNext)}
            className={`
              w-16 h-8 rounded-full transition-all duration-300 relative
              ${settings.autoStartNext ? 'bg-indigo-500' : 'bg-slate-200'}
            `}
          >
            <div className={`
              absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm transition-all duration-300
              ${settings.autoStartNext ? 'left-9' : 'left-1'}
            `} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default GeneralSettings;
