import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Home as HomeIcon,
    CheckSquare as CheckSquareIcon,
    Book as BookIcon,
    BarChart3 as BarChartIcon,
    Trophy as TrophyIcon,
    Settings as SettingsIcon,
    LogIn as LogInIcon,
} from 'lucide-react';
import { useAuth } from '../contexts/useAuth';

/**
 * 全站底部固定导航：主页 / 待办 / 书架 / 专注分析 / 成就墙 / 设置 / 个人。
 * 7 个按钮等宽 grid 分布，规范化的统一视觉。
 */
const BottomNav: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();
    const { isAuthenticated, username } = useAuth();

    const ICON_SIZE = 18;
    const ICON_STROKE = 2.5;

    const items: Array<{
        path: string;
        label: string;
        icon: React.ReactNode;
    }> = [
            { path: '/', label: t('common.home', '主页'), icon: <HomeIcon size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
            { path: '/tasks', label: t('todo.title', '待办'), icon: <CheckSquareIcon size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
            { path: '/library', label: t('common.library', '书架'), icon: <BookIcon size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
            { path: '/stats', label: t('common.stats', '专注分析'), icon: <BarChartIcon size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
            { path: '/achievements', label: t('common.achievements', '成就墙'), icon: <TrophyIcon size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
            { path: '/settings', label: t('common.settings', '设置'), icon: <SettingsIcon size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
            {
                path: isAuthenticated ? '/profile' : '/login',
                label: isAuthenticated ? (username || '') : t('common.login', '登录'),
                icon: isAuthenticated ? (
                    <div
                        className="rounded-full bg-cozy-pastelGreen flex items-center justify-center text-cozy-text font-bold text-[10px]"
                        style={{ width: ICON_SIZE, height: ICON_SIZE }}
                    >
                        {username?.charAt(0).toUpperCase()}
                    </div>
                ) : (
                    <LogInIcon size={ICON_SIZE} strokeWidth={ICON_STROKE} />
                ),
            },
        ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            className="
                bottomnav-root
                fixed bottom-3 md:bottom-6 left-3 right-3
                md:left-1/2 md:-translate-x-1/2 md:right-auto md:w-full md:max-w-3xl
                grid grid-cols-7 gap-1
                bg-white/85 backdrop-blur-2xl
                border border-white/80
                shadow-[0_20px_50px_-10px_rgba(0,0,0,0.12)]
                p-1.5 md:p-2
                z-40
            "
        >
            {items.map((item) => {
                const isActive = location.pathname === item.path
                    || (item.path === '/profile' && location.pathname === '/login');
                return (
                    <motion.button
                        key={item.path}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => navigate(item.path)}
                        className={`
                            bottomnav-btn no-round
                            flex flex-col items-center justify-center gap-0.5 md:gap-1
                            py-1.5 md:py-2 px-1
                            transition-colors
                            ${isActive
                                ? 'text-cozy-orange bg-cozy-orange/10'
                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}
                        `}
                        aria-current={isActive ? 'page' : undefined}
                    >
                        <span className="flex items-center justify-center" style={{ width: ICON_SIZE, height: ICON_SIZE }}>
                            {item.icon}
                        </span>
                        <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-tight md:tracking-wider leading-none truncate max-w-full">
                            {item.label}
                        </span>
                    </motion.button>
                );
            })}
        </motion.div>
    );
};

export default BottomNav;
