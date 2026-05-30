import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Check } from 'lucide-react';
import CustomSelect from '../ui/CustomSelect';
import { getProviderModels } from '../../api/client';
import type { TimerSettings } from '../../types/pomodoro';

interface AISettingsProps {
  settings: TimerSettings;
  handleSettingChange: (key: keyof TimerSettings, value: string | number | boolean) => void;
}

const AISettings: React.FC<AISettingsProps> = ({
  settings,
  handleSettingChange,
}) => {
  const { t } = useTranslation();
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);

  const fetchModels = useCallback(async (provider: string, apiKey?: string) => {
    if (!provider) return;
    setIsFetchingModels(true);
    try {
      const models = await getProviderModels(provider, apiKey);
      setAvailableModels(models);
    } catch (error) {
      console.error("Failed to fetch models:", error);
      setAvailableModels([]);
    } finally {
      setIsFetchingModels(false);
    }
  }, []);

  useEffect(() => {
    if (settings.aiProvider) {
      let key = undefined;
      if (settings.aiProvider === 'gemini') key = settings.googleApiKey;
      else if (settings.aiProvider === 'gpt') key = settings.openaiApiKey;
      else if (settings.aiProvider === 'deepseek') key = settings.deepseekApiKey;
      else if (settings.aiProvider === 'zhipu') key = settings.zhipuApiKey;

      fetchModels(settings.aiProvider, key);
    }
  }, [settings.aiProvider, settings.googleApiKey, settings.openaiApiKey, settings.deepseekApiKey, settings.zhipuApiKey, fetchModels]);

  return (
    <section className="space-y-4 md:space-y-6">
      <header className="flex items-center gap-3 md:gap-4 px-1">
        <div className="h-[2px] w-8 bg-indigo-500 rounded-full" />
        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">
          {t('settings.aiProviderTitle')}
        </h2>
      </header>

      <div className="grid grid-cols-1 gap-3 md:gap-4">
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl md:rounded-[32px] p-4 md:p-6 border border-white shadow-sm group hover:shadow-xl transition-all duration-500 divide-y divide-slate-100/80">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-6 pb-4 md:pb-6">
            <div className="w-full md:w-1/3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">{t('settings.provider')}</label>
              <p className="text-xs md:text-sm text-slate-400 font-medium">使用的 AI 核心服务商</p>
            </div>
            <div className="w-full md:flex-1">
              <CustomSelect
                value={settings.aiProvider || 'gemini'}
                onChange={(val) => handleSettingChange('aiProvider', val)}
                options={[
                  { value: 'gemini', label: 'Google Gemini Pro 1.5' },
                  { value: 'gpt', label: 'OpenAI (GPT-4o)' },
                  { value: 'deepseek', label: 'DeepSeek V3' },
                  { value: 'zhipu', label: '智谱 AI (GLM-4)' },
                  { value: 'ollama', label: 'Ollama (Local Provider)' },
                ]}
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-6 pt-4 md:pt-6">
            <div className="w-full md:w-1/3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">{t('settings.model')}</label>
              <p className="text-xs md:text-sm text-slate-400 font-medium">选择具体的 AI 模型版本</p>
            </div>
            <div className="w-full md:flex-1">
              <CustomSelect
                value={settings.aiModel || ''}
                onChange={(val) => handleSettingChange('aiModel', val)}
                options={[
                  { value: '', label: isFetchingModels ? t('settings.loading') : t('settings.default') },
                  ...availableModels.map(model => ({ value: model, label: model }))
                ]}
                disabled={isFetchingModels}
              />
            </div>
          </div>
        </div>

        {['gemini', 'gpt', 'deepseek', 'zhipu'].includes(settings.aiProvider || '') && (
          <div className="bg-amber-500/10 backdrop-blur-xl rounded-2xl md:rounded-[32px] p-4 md:p-8 border border-amber-500/20 shadow-inner group transition-all duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-6">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-500/20 rounded-xl md:rounded-[18px] flex items-center justify-center text-amber-600 border border-amber-500/30 shrink-0">
                  <Save size={18} />
                </div>
                <div className="min-w-0">
                  <label className="text-[10px] font-bold text-amber-700 uppercase tracking-widest block mb-1 truncate">
                    {settings.aiProvider?.toUpperCase()} API KEY
                  </label>
                  <p className="text-xs md:text-sm text-amber-600/80 font-medium">密钥将加密存储在您的设备中</p>
                </div>
              </div>
              <input
                type="password"
                value={
                  settings.aiProvider === 'gemini' ? settings.googleApiKey :
                    settings.aiProvider === 'gpt' ? settings.openaiApiKey :
                      (settings as any)[`${settings.aiProvider}ApiKey`] || ''
                }
                onChange={(e) => {
                  const key = settings.aiProvider === 'gemini' ? 'googleApiKey' :
                    settings.aiProvider === 'gpt' ? 'openaiApiKey' :
                      `${settings.aiProvider}ApiKey` as keyof TimerSettings;
                  handleSettingChange(key, e.target.value);
                }}
                placeholder={t('settings.enterKey')}
                className="w-full md:w-80 bg-white/80 px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl font-mono text-xs text-slate-700 border border-amber-200/50 focus:outline-none focus:ring-4 focus:ring-amber-500/10 transition-all shadow-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* AI Persona Section */}
      <section className="space-y-4 md:space-y-6">
        <header className="flex items-center gap-3 md:gap-4 px-1">
          <div className="h-[2px] w-8 bg-purple-500 rounded-full" />
          <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">
            {t('settings.aiPersonaTitle')}
          </h2>
        </header>
        <div className="grid grid-cols-2 md:grid-cols-2 gap-2 md:gap-4">
          {[
            'gentle_encourager',
            'strict_coach',
            'logical_analyst',
            'humorous_buddy'
          ].map((persona) => (
            <button
              key={persona}
              onClick={() => handleSettingChange('aiPersona', persona)}
              className={`
                p-4 md:p-8 rounded-2xl md:rounded-[40px] border-2 text-left transition-all duration-500 relative overflow-hidden group
                ${settings.aiPersona === persona
                  ? 'bg-slate-900 border-slate-900 text-white shadow-2xl scale-[1.02]'
                  : 'bg-white/40 backdrop-blur-xl border-white text-slate-700 hover:border-slate-200 shadow-sm hover:shadow-xl'
                }`}
            >
              {settings.aiPersona === persona && (
                <div className="absolute top-3 md:top-8 right-3 md:right-8 w-5 h-5 md:w-6 md:h-6 bg-purple-500 rounded-full flex items-center justify-center text-white scale-100 md:scale-125 shadow-lg">
                  <Check size={12} strokeWidth={3} />
                </div>
              )}
              <div className="font-bold text-sm md:text-xl mb-2 md:mb-3 uppercase tracking-tight font-heading pr-6 md:pr-8">
                {t(`settings.personas.${persona}`)}
              </div>
              <div className={`text-xs md:text-sm leading-relaxed font-medium line-clamp-3 ${settings.aiPersona === persona ? 'text-slate-400' : 'text-slate-500'}`}>
                {t('settings.aiPersonaDescription', { persona: t(`settings.personas.${persona}`) })}
              </div>
            </button>
          ))}
        </div>
      </section>
    </section>
  );
};

export default AISettings;
