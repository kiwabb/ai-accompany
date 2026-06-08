import { useRef, useCallback, useEffect } from 'react';

interface UseAudioOptions {
    enableSounds?: boolean;
    enableBackgroundMusic?: boolean;
    volume?: number;
}

export const useAudio = (options: UseAudioOptions = {}) => {
    const {
        enableSounds = true,
        enableBackgroundMusic = true,
        volume = 0.5,
    } = options;

    const audioContextRef = useRef<AudioContext | null>(null);
    const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
    const isMusicPlayingRef = useRef(false);

    // Initialize Audio Context
    const getAudioContext = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        }
        return audioContextRef.current;
    }, []);

    // Generate a pleasant bell sound for start/end notifications
    const playBellSound = useCallback((frequency: number = 800, duration: number = 0.3) => {
        if (!enableSounds) return;

        const ctx = getAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        // Create envelope for a bell-like sound
        const now = ctx.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume * 0.3, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

        oscillator.start(now);
        oscillator.stop(now + duration);
    }, [enableSounds, volume, getAudioContext]);

    // Play a pleasant chime for session start
    const playStartSound = useCallback(() => {
        if (!enableSounds) return;

        // Play ascending chime (C - E - G)
        playBellSound(523.25, 0.2); // C5
        setTimeout(() => playBellSound(659.25, 0.2), 100); // E5
        setTimeout(() => playBellSound(783.99, 0.3), 200); // G5
    }, [enableSounds, playBellSound]);

    // Play a gentle notification for session end
    const playEndSound = useCallback(() => {
        if (!enableSounds) return;

        // Play descending chime (G - E - C)
        playBellSound(783.99, 0.2); // G5
        setTimeout(() => playBellSound(659.25, 0.2), 100); // E5
        setTimeout(() => playBellSound(523.25, 0.3), 200); // C5
    }, [enableSounds, playBellSound]);

    // Start background music for focus sessions
    const startBackgroundMusic = useCallback(() => {
        if (!enableBackgroundMusic || isMusicPlayingRef.current) return;

        // Create a simple ambient background using Web Audio API
        const ctx = getAudioContext();

        // Create a gentle white noise for ambient sound
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        // Create a low-pass filter for a softer sound
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;

        const gainNode = ctx.createGain();
        gainNode.gain.value = volume * 0.05; // Very quiet ambient sound

        whiteNoise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        whiteNoise.start();

        // Store reference to stop later
        backgroundMusicRef.current = whiteNoise as unknown as HTMLAudioElement;
        isMusicPlayingRef.current = true;

        // Also add a subtle low-frequency oscillation for depth
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.5; // Very slow oscillation
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = volume * 0.03;

        lfo.connect(lfoGain);
        lfoGain.connect(ctx.destination);
        lfo.start();
    }, [enableBackgroundMusic, volume, getAudioContext]);

    // Stop background music
    const stopBackgroundMusic = useCallback(() => {
        if (backgroundMusicRef.current) {
            try {
                // @ts-expect-error - Web Audio node type mismatch with HTMLAudioElement, known issue in this mock impl
                (backgroundMusicRef.current).stop();
            } catch {
                // Ignore errors if already stopped
            }
            backgroundMusicRef.current = null;
            isMusicPlayingRef.current = false;
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopBackgroundMusic();
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, [stopBackgroundMusic]);

    return {
        playStartSound,
        playEndSound,
        playBellSound,
        startBackgroundMusic,
        stopBackgroundMusic,
    };
};
