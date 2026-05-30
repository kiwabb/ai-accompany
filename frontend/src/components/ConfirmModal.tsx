import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, CheckCircle2 } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel: string;
    onConfirm: () => void;
    onCancel: () => void;
    type?: 'warning' | 'info' | 'danger';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    confirmLabel,
    cancelLabel,
    onConfirm,
    onCancel,
    type = 'warning'
}) => {
    // Elegant Color Configurations based on Type
    const getTheme = () => {
        switch (type) {
            case 'danger':
                return {
                    icon: <AlertTriangle className="text-red-500" size={24} />,
                    iconBg: 'bg-red-50',
                    primaryBtn: 'bg-red-600 hover:bg-red-700 shadow-red-200',
                    accent: 'text-red-600'
                };
            case 'info':
                return {
                    icon: <CheckCircle2 className="text-indigo-500" size={24} />,
                    iconBg: 'bg-indigo-50',
                    primaryBtn: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200',
                    accent: 'text-indigo-600'
                };
            default: // warning
                return {
                    icon: <AlertTriangle className="text-amber-500" size={24} />,
                    iconBg: 'bg-amber-50',
                    primaryBtn: 'bg-slate-900 hover:bg-slate-800 shadow-slate-200',
                    accent: 'text-amber-600'
                };
        }
    };

    const theme = getTheme();

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 md:p-6">
                    {/* Premium Backdrop Blur */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={onCancel}
                        className="absolute inset-0 bg-slate-900/40"
                    />

                    {/* Modal Card - Glassmorphism & Claymorphism Blend */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 30 }}
                        transition={{ type: "spring", damping: 25, stiffness: 350 }}
                        className="relative w-full max-w-[95vw] sm:max-w-md bg-white/95 backdrop-blur-2xl rounded-2xl md:rounded-[40px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.2)] border border-white/60 overflow-hidden"
                    >
                        {/* Internal Grain/Noise Texture for Premium Feel */}
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] blur-[1px]" />

                        <div className="relative z-10 p-5 md:p-12">
                            {/* Header Section */}
                            <div className="flex justify-between items-start mb-4 md:mb-8">
                                <motion.div
                                    initial={{ rotate: -10, scale: 0.8 }}
                                    animate={{ rotate: 0, scale: 1 }}
                                    className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-3xl ${theme.iconBg} flex items-center justify-center shadow-inner border border-white/50`}
                                >
                                    {theme.icon}
                                </motion.div>
                                <button
                                    onClick={onCancel}
                                    className="p-2 md:p-3 bg-slate-50 hover:bg-slate-100 rounded-xl md:rounded-2xl transition-all duration-200 text-slate-400 hover:text-slate-600 active:scale-90 cursor-pointer"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Content Section */}
                            <div className="space-y-2 md:space-y-4 mb-5 md:mb-10">
                                <h3 className="text-xl md:text-3xl font-bold tracking-tight text-slate-900 font-heading leading-tight">
                                    {title}
                                </h3>
                                <p className="text-slate-500 text-sm md:text-base leading-relaxed font-medium">
                                    {message}
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-row gap-2 md:gap-4">
                                <button
                                    onClick={onCancel}
                                    className="
                                        flex-1 py-3 md:py-4 px-3 md:px-6 bg-slate-50 hover:bg-slate-100 text-slate-600
                                        rounded-xl md:rounded-[24px] font-bold text-xs md:text-sm uppercase tracking-wider md:tracking-widest
                                        transition-all duration-300 active:scale-[0.98] cursor-pointer
                                    "
                                >
                                    {cancelLabel}
                                </button>
                                <button
                                    onClick={onConfirm}
                                    className={`
                                        flex-1 py-3 md:py-4 px-3 md:px-6 ${theme.primaryBtn} text-white rounded-xl md:rounded-[24px]
                                        font-bold text-xs md:text-sm uppercase tracking-wider md:tracking-widest transition-all duration-300
                                        hover:translate-y-[-2px] active:translate-y-[1px] active:scale-[0.98]
                                        shadow-xl hover:shadow-2xl cursor-pointer
                                    `}
                                >
                                    {confirmLabel}
                                </button>
                            </div>
                        </div>

                        {/* Subtle Bottom Accent Glow */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-50" />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmModal;
