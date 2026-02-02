import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTimerContext } from '../contexts/TimerContext';
import PomodoroTimer from '../components/PomodoroTimer';
import { motion } from 'framer-motion';
import { ChevronLeft as ChevronLeftIcon } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { useTranslation } from 'react-i18next';
import CountdownWidget from '../components/CountdownWidget'; // Added CountdownWidget import

import AmbientBackground from '../components/AmbientBackground';

const TimerPage: React.FC = () => {
    const { themeId } = useParams<{ themeId: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { handleThemeChange, state, isActive, timeLeft, totalTimeValue, reset } = useTimerContext(); // Corrected destructuring

    const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
    const [pendingThemeId, setPendingThemeId] = React.useState<string | null>(null);

    useEffect(() => {
        if (themeId && state.activeThemeId !== themeId) {
            const isOngoing = isActive || (timeLeft > 0 && timeLeft < totalTimeValue);

            if (isOngoing) {
                setPendingThemeId(themeId);
                setIsConfirmOpen(true);
            } else {
                handleThemeChange(themeId);
            }
        }
    }, [themeId, state.activeThemeId, handleThemeChange, isActive, timeLeft, totalTimeValue]); // Re-added dependencies for correctness

    const handleConfirm = () => {
        if (pendingThemeId) {
            reset();
            handleThemeChange(pendingThemeId);
        }
        setIsConfirmOpen(false);
        setPendingThemeId(null);
    };

    const handleCancel = () => {
        setIsConfirmOpen(false);
        setPendingThemeId(null);
        navigate(-1);
    };


    return (
        <main className="min-h-screen w-full bg-[#FCFAF7] flex flex-col items-center justify-start p-6 relative overflow-hidden"> {/* Changed justify-center to justify-start for better vertical space */}
            <AmbientBackground />

            <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ x: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/')}
                className="fixed top-8 left-8 py-3 px-6 bg-white/60 backdrop-blur-2xl border border-white shadow-xl rounded-2xl flex items-center gap-2 group z-50 text-slate-400 hover:text-slate-900 transition-colors font-bold uppercase tracking-widest text-[10px]"
            >
                <ChevronLeftIcon size={16} className="group-hover:-translate-x-1 transition-transform" />
                <span>返回列表</span>
            </motion.button>

            <div className="relative z-10 w-full max-w-6xl flex items-center justify-center py-12">
                <PomodoroTimer />
            </div>

            <ConfirmModal
                isOpen={isConfirmOpen}
                title={t('common.confirm', '确认切换')}
                message={t('timer.switchConfirmSimple', '您当前有正在进行的专注任务。确定要停止并切换到新主题吗？')}
                confirmLabel={t('common.confirmSwitch', '确认切换')}
                cancelLabel={t('common.cancel', '继续专注')}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                type="warning"
            />
        </main>
    );
};

export default TimerPage;
