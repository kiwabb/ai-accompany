import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TFunction } from 'i18next';
import { User, Target, Plus, X, Award, Heart } from 'lucide-react';
import { getUserProfile, saveUserProfile, type UserProfile } from '../../lib/storage/userProfile';

interface CozyPalMemoryTabProps {
  onResetMemory: () => void;
  isSavingEdit: boolean;
  t: TFunction;
  // Optional legacy props to satisfy TypeScript and CozyPal.tsx
  diagnostics?: any;
  memoryFragments?: any;
  onEditProfileItem?: any;
  onDeleteProfileItem?: any;
  onEditFragment?: any;
  onDeleteFragment?: any;
}

const CozyPalMemoryTab = ({
  onResetMemory,
  isSavingEdit,
  t: _t,
}: CozyPalMemoryTabProps) => {
  const [profile, setProfile] = useState<UserProfile>(() => getUserProfile());
  const [newFact, setNewFact] = useState('');
  const [newPref, setNewPref] = useState('');
  const [activeSection, setActiveSection] = useState<'basic' | 'facts' | 'prefs'>('basic');

  // Load latest state
  const reloadProfile = () => {
    setProfile(getUserProfile());
  };

  useEffect(() => {
    reloadProfile();
    // Watch for resets
    const handleReset = () => reloadProfile();
    window.addEventListener('storage', handleReset);
    return () => window.removeEventListener('storage', handleReset);
  }, []);

  const updateProfileField = (key: keyof UserProfile, value: any) => {
    const updated = {
      ...profile,
      [key]: value
    };
    setProfile(updated);
    saveUserProfile(updated);
  };

  const handleAddFact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFact.trim()) return;
    const trimmed = newFact.trim();
    if (profile.facts.includes(trimmed)) return;
    
    const updatedFacts = [...profile.facts, trimmed];
    updateProfileField('facts', updatedFacts);
    setNewFact('');
  };

  const handleAddPreference = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPref.trim()) return;
    const trimmed = newPref.trim();
    if (profile.preferences.includes(trimmed)) return;

    const updatedPrefs = [...profile.preferences, trimmed];
    updateProfileField('preferences', updatedPrefs);
    setNewPref('');
  };

  const handleRemoveFact = (fact: string) => {
    const updatedFacts = profile.facts.filter(f => f !== fact);
    updateProfileField('facts', updatedFacts);
  };

  const handleRemovePreference = (pref: string) => {
    const updatedPrefs = profile.preferences.filter(p => p !== pref);
    updateProfileField('preferences', updatedPrefs);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-4 space-y-5 flex flex-col flex-grow select-none max-h-[80vh] overflow-y-auto"
    >
      {/* Category Tabs */}
      <div className="flex bg-slate-100/60 p-1 rounded-2xl border border-slate-200/50">
        {[
          { id: 'basic', label: '基本资料', icon: <User size={14} /> },
          { id: 'facts', label: '我的事实', icon: <Award size={14} /> },
          { id: 'prefs', label: '偏好特征', icon: <Heart size={14} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSection === tab.id
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeSection === 'basic' && (
          <motion.div
            key="basic"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-4 flex-grow"
          >
            {/* Username */}
            <div className="glass-surface rounded-2xl p-4 shadow-sm space-y-2 border border-white">
              <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                <User size={12} />
                如何称呼你
              </label>
              <input
                type="text"
                value={profile.name || ''}
                onChange={(e) => updateProfileField('name', e.target.value)}
                placeholder="例如：学子、小帅"
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 font-medium text-slate-700 text-xs transition-all"
              />
            </div>

            {/* Learning Goals */}
            <div className="glass-surface rounded-2xl p-4 shadow-sm space-y-2 border border-white">
              <label className="text-[10px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                <Target size={12} />
                学习与专注目标
              </label>
              <textarea
                value={profile.learningGoals || ''}
                onChange={(e) => updateProfileField('learningGoals', e.target.value)}
                placeholder="例如：备考雅思，每天坚持专注3小时..."
                rows={4}
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 font-medium text-slate-700 text-xs transition-all resize-none"
              />
            </div>
          </motion.div>
        )}

        {activeSection === 'facts' && (
          <motion.div
            key="facts"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-4 flex-grow"
          >
            {/* Facts form */}
            <form onSubmit={handleAddFact} className="flex gap-2">
              <input
                type="text"
                value={newFact}
                onChange={(e) => setNewFact(e.target.value)}
                placeholder="添加关于你的事实（如：正在学习前端开发）"
                className="flex-grow px-4 py-3 bg-white border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 font-medium text-slate-700 text-xs transition-all"
              />
              <button
                type="submit"
                className="px-4 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-slate-800 transition-colors shadow-md active:scale-95"
              >
                <Plus size={18} />
              </button>
            </form>

            {/* Facts list */}
            <div className="glass-surface rounded-2xl p-4 shadow-sm min-h-[160px] border border-white">
              <h4 className="text-[10px] font-bold text-indigo-400 uppercase mb-3 tracking-widest flex items-center gap-1.5">
                关于你的事实 ({profile.facts.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {profile.facts.length > 0 ? (
                  profile.facts.map((fact, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ scale: 1.02 }}
                      className="group relative text-[11px] bg-white text-indigo-700 pl-3 pr-2 py-1.5 rounded-xl border border-indigo-50 shadow-sm flex items-center gap-1.5"
                    >
                      <span className="font-semibold">{fact}</span>
                      <button
                        onClick={() => handleRemoveFact(fact)}
                        className="p-0.5 hover:bg-red-50 rounded text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <X size={10} strokeWidth={3} />
                      </button>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 font-medium py-4 px-1">尚未添加任何个人事实，在上方输入并回车即可添加。</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeSection === 'prefs' && (
          <motion.div
            key="prefs"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-4 flex-grow"
          >
            {/* Preferences form */}
            <form onSubmit={handleAddPreference} className="flex gap-2">
              <input
                type="text"
                value={newPref}
                onChange={(e) => setNewPref(e.target.value)}
                placeholder="添加你的喜好与偏好特征"
                className="flex-grow px-4 py-3 bg-white border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 font-medium text-slate-700 text-xs transition-all"
              />
              <button
                type="submit"
                className="px-4 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-slate-800 transition-colors shadow-md active:scale-95"
              >
                <Plus size={18} />
              </button>
            </form>

            {/* Preferences list */}
            <div className="glass-surface rounded-2xl p-4 shadow-sm min-h-[160px] border border-white">
              <h4 className="text-[10px] font-bold text-amber-600 uppercase mb-3 tracking-widest flex items-center gap-1.5">
                对话偏好特征 ({profile.preferences.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {profile.preferences.length > 0 ? (
                  profile.preferences.map((pref, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ scale: 1.02 }}
                      className="group relative text-[11px] bg-white text-amber-700 pl-3 pr-2 py-1.5 rounded-xl border border-amber-50 shadow-sm flex items-center gap-1.5"
                    >
                      <span className="font-semibold">{pref}</span>
                      <button
                        onClick={() => handleRemovePreference(pref)}
                        className="p-0.5 hover:bg-red-50 rounded text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <X size={10} strokeWidth={3} />
                      </button>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 font-medium py-4 px-1">尚未添加任何对话偏好，在上方输入并回车即可添加。</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset Button */}
      <div className="mt-auto pt-4 border-t border-slate-100 flex justify-center flex-shrink-0">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            onResetMemory();
            setTimeout(reloadProfile, 100);
          }}
          disabled={isSavingEdit}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-50/50 transition-all border border-red-100 shadow-sm"
        >
          <X size={12} strokeWidth={3} />
          重置记忆档案
        </motion.button>
      </div>
    </motion.div>
  );
};

export default CozyPalMemoryTab;
