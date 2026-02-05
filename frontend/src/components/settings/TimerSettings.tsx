import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { TimerSettings } from '../../types/pomodoro';

interface TimerSettingsProps {
  settings: TimerSettings;
  handleSettingChange: (key: keyof TimerSettings, value: number) => void;
}

const TimerSettings: React.FC<TimerSettingsProps> = ({
  settings,
  handleSettingChange,
}) => {
  const { t } = useTranslation();

  return (
    <section className="space-y-6">
      <header className="flex items-center gap-4">
        <div className="h-[2px] w-8 bg-cozy-orange rounded-full" />
        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">
          {t('settings.durations')}
        </h2>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { key: 'shortBreakDuration', label: t('common.shortBreak'), color: 'bg-emerald-50 text-emerald-600' },
          { key: 'longBreakDuration', label: t('common.longBreak'), color: 'bg-indigo-50 text-indigo-600' },
          { key: 'longBreakInterval', label: t('settings.longBreakInterval'), color: 'bg-orange-50 text-orange-600' },
        ].map(({ key, label, color }) => (
          <div
            key={key}
            className="bg-white/60 backdrop-blur-xl rounded-[32px] p-8 border border-white shadow-sm group hover:shadow-xl transition-all duration-500 flex flex-col items-center text-center gap-4"
          >
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min={1}
                value={settings[key as keyof TimerSettings] as number}
                onChange={(e) => handleSettingChange(key as keyof TimerSettings, parseInt(e.target.value))}
                className={`w-24 text-4xl font-bold bg-transparent text-center focus:outline-none focus:scale-110 transition-transform ${color.split(' ')[1]}`}
              />
            </div>
            <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">{t('timer.minutes')}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TimerSettings;
