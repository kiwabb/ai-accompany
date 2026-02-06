import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Volume2, ChevronDown, Play, Pause } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTimerContext } from '../contexts/TimerContext';
import { FOCUS_TRACKS, BREAK_TRACKS } from '../constants/pomodoro';
import CustomSelect from './ui/CustomSelect';

const MusicControls: React.FC = () => {
    const { t } = useTranslation();
    const { state, handleUpdateSetting } = useTimerContext();
    const { settings, phase } = state;
    const [isExpanded, setIsExpanded] = React.useState(false);

    const tracks = phase === 'focus' ? FOCUS_TRACKS : BREAK_TRACKS;
    const currentTrackId = phase === 'focus' ? settings.focusTrack : settings.breakTrack;
    const currentTrackName = tracks.find(track => track.id === currentTrackId)?.name || tracks[0].name;

    const handleTrackChange = (val: string) => {
        if (phase === 'focus') {
            handleUpdateSetting({ focusTrack: val });
        } else {
            handleUpdateSetting({ breakTrack: val });
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleUpdateSetting({ soundVolume: parseFloat(e.target.value) });
    };

    return (
        <div className="w-full max-w-sm mt-6">
            <div className="flex items-center gap-2">
                <motion.button
                    layout
                     onClick={() => setIsExpanded(!isExpanded)}
                     className="flex-1 flex items-center justify-between px-6 py-4 bg-theme-surface/40 hover:bg-theme-surface/60 backdrop-blur-xl rounded-[28px] border border-theme-border shadow-sm transition-all group overflow-hidden"
                 >
                     <div className="flex items-center gap-3 min-w-0">
                         <div className="w-10 h-10 bg-theme-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-theme-primary/20 shrink-0">
                             <Music size={18} />
                         </div>
                         <div className="text-left min-w-0">
                             <div className="text-[9px] font-bold text-theme-text-muted uppercase tracking-widest leading-none mb-1">
                                 {phase === 'focus' ? t('common.focus') : t('common.shortBreak')} Music
                             </div>
                             <div className="text-sm font-bold text-theme-text truncate">
                                 {currentTrackName}
                             </div>
                         </div>
                     </div>
                     <motion.div
                         animate={{ rotate: isExpanded ? 180 : 0 }}
                         className="text-theme-text-muted group-hover:text-theme-text ml-2"
                     >
                         <ChevronDown size={18} />
                     </motion.div>
                 </motion.button>

                 {/* Direct Toggle for Music */}
                 <motion.button
                     whileTap={{ scale: 0.9 }}
                     onClick={() => handleUpdateSetting({ enableBackgroundMusic: !settings.enableBackgroundMusic })}
                     className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg ${settings.enableBackgroundMusic
                             ? 'bg-theme-primary text-white shadow-theme-primary/20'
                             : 'bg-theme-surface text-theme-text-muted border border-theme-border'
                         }`}
                 >
                     {settings.enableBackgroundMusic ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                 </motion.button>
             </div>

             <AnimatePresence>
                 {isExpanded && (
                     <motion.div
                         initial={{ height: 0, opacity: 0, margin: 0 }}
                         animate={{ height: 'auto', opacity: 1, margin: '8px 0 0 0' }}
                         exit={{ height: 0, opacity: 0, margin: 0 }}
                         className="overflow-visible"
                     >
                         <div className="p-6 bg-theme-surface/70 backdrop-blur-3xl rounded-[36px] border border-theme-border shadow-2xl space-y-6 relative z-50">
                             {/* Track Selector */}
                             <div className="space-y-3">
                                 <label className="text-[10px] font-bold text-theme-text-muted uppercase tracking-widest pl-1">
                                     {t('settings.focusTrack', 'Select Track')}
                                 </label>
                                    <CustomSelect
                                        value={currentTrackId || tracks[0].id}
                                        onChange={handleTrackChange}
                                        options={tracks.map(track => ({ value: track.id, label: track.name }))}
                                    />
                                </div>


                             {/* Volume Slider */}
                             <div className="space-y-4 pt-2">
                                 <div className="flex justify-between items-center px-1">
                                     <div className="flex items-center gap-2 text-theme-text-muted">
                                         <Volume2 size={14} />
                                         <span className="text-[10px] font-bold uppercase tracking-widest">{t('settings.volume', 'Volume')}</span>
                                     </div>
                                     <span className="text-[10px] font-bold text-theme-primary">{Math.round((settings.soundVolume || 0.5) * 100)}%</span>
                                 </div>
                                 <div className="px-1">
                                     <input
                                         type="range"
                                         min="0"
                                         max="1"
                                         step="0.01"
                                         value={settings.soundVolume || 0.5}
                                         onChange={handleVolumeChange}
                                         className="w-full h-2 bg-theme-surface rounded-full appearance-none cursor-pointer accent-theme-primary"
                                     />
                                 </div>
                             </div>

                             {/* Secondary Toggle */}
                             <button
                                 onClick={() => handleUpdateSetting({ enableSounds: !settings.enableSounds })}
                                 className={`w-full py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all border flex items-center justify-center gap-2 ${settings.enableSounds
                                         ? 'bg-theme-text text-theme-bg border-theme-text shadow-xl'
                                         : 'bg-theme-surface text-theme-text-muted border-theme-border hover:border-theme-border-strong'
                                     }`}
                             >
                                 <div className={`w-2 h-2 rounded-full ${settings.enableSounds ? 'bg-theme-secondary shadow-[0_0_8px_var(--color-secondary)]' : 'bg-theme-text-muted/50'}`} />
                                 {t('settings.soundEffects', 'Notification Bell')} {settings.enableSounds ? 'Active' : 'Muted'}
                             </button>
                         </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MusicControls;
