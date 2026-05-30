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
import { useAuth } from '../contexts/AuthContext';

interface BottomNavProps {
    /**
     * 桌面（md+）是否显示。子页面可能在桌面端已经有自己的顶栏不需要再底部导航。
     * 默认 true。
     */
    showOnDesktop?: boolean;
}

/**
 * 全站底部固定导航：主页 / 待办 / 书架 / 专注分析 / 成就墙 / 设置 / 个人。
 * 当前路由对应的按钮自动高亮。CozyPal 头像 z-index 高于 nav，所以会盖在右下角。
 */
const BottomNav: React.FC<BottomNavProps> = ({ showOnDesktop = true }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();
    const { isAuthenticated, username } = useAuth();

    const items: Array<{
        path: string;
        label: string;
        icon: React.ReactNode;
        color: string;
        hoverBg: string;
        renderIcon?: React.ReactNode;
    }> = [
            { path: '/', label: t('common.home', '主页'), icon: <HomeIcon size={18} strokeWidth={2.5} />, color: 'text-cozy-warmOrange', hoverBg: 'rgba(255, 183, 102, 0.05)' },
            { path: '/tasks', label: t('todo.title', '待办'), icon: <CheckSquareIcon size={18} strokeWidth={2.5} />, color: 'text-indigo-500', hoverBg: 'rgba(99, 102, 241, 0.05)' },
            { path: '/library', label: t('common.library', '书架'), icon: <BookIcon size={18} strokeWidth={2.5} />, color: 'text-indigo-500', hoverBg: 'rgba(99, 102, 241, 0.05)' },
            { path: '/stats', label: t('common.stats', '专注分析'), icon: <BarChartIcon size={18} strokeWidth={2.5} />, color: 'text-emerald-500', hoverBg: 'rgba(16, 185, 129, 0.05)' },
            { path: '/achievements', label: t('common.achievements', '成就墙'), icon: <TrophyIcon size={18} strokeWidth={2.5} />, color: 'text-yellow-500', hoverBg: 'rgba(234, 179, 8, 0.05)' },
            { path: '/settings', label: t('common.settings', '设置'), icon: <SettingsIcon size={18} strokeWidth={2.5} />, color: 'text-orange-500', hoverBg: 'rgba(249, 115, 22, 0.05)' },
            {
                path: isAuthenticated ? '/profile' : '/login',
                label: isAuthenticated ? (username || '') : t('common.login', '登录'),
                icon: isAuthenticated ? (
                    <div className="w-[18px] h-[18px] md:w-5 md:h-5 rounded-full bg-cozy-pastelGreen flex items-center justify-center text-cozy-text font-bold text-[10px]">
                        {username?.charAt(0).toUpperCase()}
                    </div>
                ) : (
                    <LogInIcon size={18} strokeWidth={2.5} />
                ),
                color: 'text-cozy-warmOrange',
                hoverBg: 'rgba(255, 183, 102, 0.05)',
            },
        ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            className={`fixed bottom-4 md:bottom-10 left-0 right-0 mx-auto flex w-full md:w-auto px-2 md:p-2 bg-white/85 md:bg-white/60 backdrop-blur-2xl border border-white/80 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.12)] z-40 overflow-x-auto heatmap-scroll md:overflow-visible justify-around md:justify-center rounded-2xl md:rounded-[32px] py-1 md:py-0 max-w-[96vw] ${showOnDesktop ? '' : 'md:hidden'}`}
        >
            {items.map((item, idx) => {
                const isActive = location.pathname === item.path
                    || (item.path === '/profile' && location.pathname === '/login');
                return (
                    <React.Fragment key={item.path + idx}>
                        {idx > 0 && <div className="hidden md:block w-px h-8 bg-[#E6E2DE] self-center mx-2" />}
                        <motion.button
                            whileHover={{ scale: 1.05, backgroundColor: item.hoverBg }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate(item.path)}
                            className={`shrink-0 flex flex-col md:flex-row items-center gap-1 md:gap-2.5 px-2 md:px-8 py-2 md:py-4 rounded-xl md:rounded-2xl transition-all group ${item.color} ${isActive ? 'bg-slate-900/5 md:bg-transparent' : ''}`}
                        >
                            <span className={isActive ? 'scale-110' : ''}>{item.icon}</span>
                            <span className="text-[9px] md:text-[11px] font-bold uppercase tracking-widest truncate max-w-[60px] md:max-w-none">
                                {item.label}
                            </span>
                        </motion.button>
                    </React.Fragment>
                );
            })}
        </motion.div>
    );
};

export default BottomNav;
