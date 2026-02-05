import { useReducer, useEffect, useMemo } from 'react';
import type { FocusTheme, TimerSettings, Phase } from '../types/pomodoro';
import { DEFAULT_THEMES, DEFAULT_SETTINGS } from '../constants/pomodoro';
import { DEFAULT_VISUAL_THEME_ID } from '../constants/themes';

export interface PomodoroState {
    themes: FocusTheme[];
    activeThemeId: string;
    activeVisualThemeId: string;
    settings: TimerSettings;
    phase: Phase;
    completedSessions: number;
    documentContext?: {
        id: number;
        title: string;
        content: string;
    };
}

export type PomodoroAction =
    | { type: 'SET_ACTIVE_THEME'; themeId: string }
    | { type: 'SET_VISUAL_THEME'; themeId: string }
    | { type: 'SAVE_SETTINGS'; settings: TimerSettings; themes: FocusTheme[] }
    | { type: 'SET_THEMES'; themes: FocusTheme[] }
    | { type: 'NEXT_PHASE' }
    | { type: 'RESET_TO_FOCUS' }
    | { type: 'SET_DOCUMENT_CONTEXT'; context?: PomodoroState['documentContext'] };

const initialState: PomodoroState = {
    themes: DEFAULT_THEMES,
    activeThemeId: DEFAULT_THEMES && DEFAULT_THEMES.length > 0 ? DEFAULT_THEMES[0].id : '',
    activeVisualThemeId: DEFAULT_VISUAL_THEME_ID,
    settings: DEFAULT_SETTINGS,
    phase: 'focus',
    completedSessions: 0,
};

function pomodoroReducer(state: PomodoroState, action: PomodoroAction): PomodoroState {
    switch (action.type) {
        case 'SET_ACTIVE_THEME':
            return { ...state, activeThemeId: action.themeId, phase: 'focus' };
        case 'SET_VISUAL_THEME':
            return { ...state, activeVisualThemeId: action.themeId };
        case 'SAVE_SETTINGS': {
            const newThemes = action.themes && action.themes.length > 0 ? action.themes : state.themes;
            // Priority: action.settings.activeThemeId (backend) > current state.activeThemeId (local) > first theme
            const idFromSettings = action.settings.activeThemeId;
            const newActiveThemeId = (idFromSettings && newThemes.some(t => t.id === idFromSettings))
                ? idFromSettings
                : (newThemes.some(t => t.id === state.activeThemeId)
                    ? state.activeThemeId
                    : (newThemes.length > 0 ? newThemes[0].id : state.activeThemeId));

            return {
                ...state,
                settings: action.settings,
                themes: newThemes,
                activeThemeId: newActiveThemeId,
            };
        }
        case 'SET_THEMES':
            return {
                ...state,
                themes: action.themes,
                activeThemeId: action.themes.some(t => t.id === state.activeThemeId)
                    ? state.activeThemeId
                    : (action.themes.length > 0 ? action.themes[0].id : state.activeThemeId),
            };
        case 'NEXT_PHASE': {
            if (state.phase === 'focus') {
                const nextSessions = state.completedSessions + 1;
                const nextPhase = nextSessions % (state.settings.longBreakInterval || 4) === 0 ? 'longBreak' : 'shortBreak';
                return { ...state, completedSessions: nextSessions, phase: nextPhase };
            }
            return { ...state, phase: 'focus' };
        }
        case 'RESET_TO_FOCUS':
            return { ...state, phase: 'focus' };
        case 'SET_DOCUMENT_CONTEXT':
            return { ...state, documentContext: action.context };
        default:
            return state;
    }
}

const CONTEXT_STORAGE_KEY = 'pomodoro_context_state';

const loadInitialState = (): PomodoroState => {
    try {
        const saved = localStorage.getItem(CONTEXT_STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            return {
                ...initialState,
                activeThemeId: parsed.activeThemeId || initialState.activeThemeId,
                activeVisualThemeId: parsed.activeVisualThemeId || initialState.activeVisualThemeId,
                phase: parsed.phase || initialState.phase,
                settings: parsed.settings || initialState.settings,
                themes: parsed.themes || initialState.themes
            };
        }
    } catch (e) {
        console.error("Failed to load context state", e);
    }
    return initialState;
};

export const usePomodoroState = () => {
    const [state, dispatch] = useReducer(pomodoroReducer, undefined, loadInitialState);

    useEffect(() => {
        const stateToSave = {
            activeThemeId: state.activeThemeId,
            activeVisualThemeId: state.activeVisualThemeId,
            phase: state.phase,
            settings: state.settings,
            themes: state.themes
        };
        localStorage.setItem(CONTEXT_STORAGE_KEY, JSON.stringify(stateToSave));
    }, [state.activeThemeId, state.activeVisualThemeId, state.phase, state.settings, state.themes]);

    const activeTheme = useMemo(() => {
        return state.themes.find(t => t.id === state.activeThemeId) || state.themes[0];
    }, [state.themes, state.activeThemeId]);

    const totalTimeValue = useMemo(() => {
        if (!activeTheme) return 25 * 60;
        if (state.phase === 'focus') return (activeTheme.focusDuration || 25) * 60;
        return (state.phase === 'shortBreak' ? (state.settings.shortBreakDuration || 5) : (state.settings.longBreakDuration || 15)) * 60;
    }, [state.phase, activeTheme, state.settings]);

    return { state, dispatch, activeTheme, totalTimeValue };
};
