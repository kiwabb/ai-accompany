import React from 'react';
import { useTranslation } from 'react-i18next';

interface GeneralSettingsProps {
  i18n: any; // i18n instance from react-i18next
}

const GeneralSettings: React.FC<GeneralSettingsProps> = ({
  i18n,
}) => {
  const { t } = useTranslation();

  return (
    <section className="space-y-4 md:space-y-6">
      <header className="flex items-center gap-3 md:gap-4 px-1">
        <div className="h-[2px] w-8 bg-blue-400 rounded-full" />
        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">
          {t('settings.language')}
        </h2>
      </header>
      <div className="flex bg-white/40 backdrop-blur-xl p-1 md:p-2 rounded-xl md:rounded-[32px] border border-white shadow-sm w-full md:max-w-md">
        {[
          { code: 'en', label: 'English' },
          { code: 'zh', label: '简体中文' }
        ].map((lang) => (
          <button
            key={lang.code}
            onClick={() => i18n.changeLanguage(lang.code)}
            className={`
              flex-1 py-3 md:py-4 px-3 md:px-6 rounded-lg md:rounded-[24px] font-bold uppercase tracking-widest text-[10px] transition-all
              ${i18n.language === lang.code
                ? 'bg-slate-900 text-white shadow-xl'
                : 'text-slate-400 hover:text-slate-900 hover:bg-white'}
            `}
          >
            {lang.label}
          </button>
        ))}
      </div>
    </section>
  );
};

export default GeneralSettings;
