import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { createPortal } from 'react-dom';

interface Option {
    value: string;
    label: string;
}

interface CustomSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Select...',
    disabled = false,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);

    useEffect(() => {
        const updatePosition = () => {
            if (isOpen && triggerRef.current) {
                const rect = triggerRef.current.getBoundingClientRect();
                setMenuPosition({
                    top: rect.bottom + 8,
                    left: rect.left,
                    width: rect.width,
                });
            }
        };

        if (isOpen) {
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
        }

        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isOpen]);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                triggerRef.current &&
                !triggerRef.current.contains(event.target as Node) &&
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };



        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleOpen = () => {
        if (disabled) return;
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setMenuPosition({
                top: rect.bottom + 8,
                left: rect.left,
                width: rect.width,
            });
        }
        setIsOpen(!isOpen);
    };

    const handleSelect = (newValue: string) => {
        onChange(newValue);
        setIsOpen(false);
    };

    const dropdownMenu = (
        <div
            className="fixed inset-0 z-[9999] pointer-events-none"
        >
            <div
                ref={menuRef}
                className="pointer-events-auto"
                style={{
                    position: 'fixed',
                    top: menuPosition.top,
                    left: menuPosition.left,
                    width: menuPosition.width,
                }}
            >
                <motion.div
                    initial={{ opacity: 0, y: -10, scaleY: 0.95 }}
                    animate={{ opacity: 1, y: 0, scaleY: 1 }}
                    exit={{ opacity: 0, y: -10, scaleY: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="flex flex-col bg-white/95 backdrop-blur-xl border border-white/80 rounded-2xl shadow-elevated py-2 max-h-[280px] overflow-y-auto overflow-x-hidden pointer-events-auto custom-scrollbar no-scrollbar"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {options.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => handleSelect(option.value)}
                            className={`
                group flex items-center justify-between px-4 py-3 text-sm font-bold text-left transition-colors w-full
                ${option.value === value
                                     ? 'bg-cozy-orange text-white'
                                     : 'text-cozy-text-light hover:bg-cozy-orange/10 hover:text-cozy-text'}
              `}
                        >
                            <span className="truncate flex-1 pr-2">{option.label}</span>
                            {option.value === value && (
                                <Check size={16} strokeWidth={3} className="text-white shrink-0" />
                            )}
                        </button>
                    ))}
                </motion.div>

            </div>
        </div>
    );

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                onClick={handleOpen}
                disabled={disabled}
                className={`
           relative w-full flex items-center justify-between pl-4 pr-3 py-3 rounded-xl font-bold text-sm transition-all duration-300
           ${isOpen ? 'ring-2 ring-cozy-orange/50 bg-white/80' : 'bg-cozy-cream/50 hover:bg-white/60'}
           ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer lift-hover'}
           text-cozy-orange
        `}
            >
                <span className="truncate mr-2">
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown
                    size={16}
                    strokeWidth={3}
                    className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
                />
            </button>

            {/* Render Portal for Dropdown */}
            {isOpen && createPortal(dropdownMenu, document.body)}
        </>
    );
};

export default CustomSelect;
