// =============================================================================
// useCelebration - Hook para animação de celebração com confetti e haptics
// =============================================================================

import { useCallback, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { haptics } from '@/lib/haptics';

interface CelebrationOptions {
    duration?: number;
    particleCount?: number;
    spread?: number;
    colors?: string[];
}

export function useCelebration() {
    const celebrationRef = useRef<NodeJS.Timeout | null>(null);

    const celebrate = useCallback((options?: CelebrationOptions) => {
        // Trigger haptic feedback for mobile
        haptics.medium();

        const {
            duration = 3000,
            particleCount = 100,
            spread = 70,
            colors = ['#22c55e', '#3b82f6', '#eab308', '#ef4444', '#8b5cf6'],
        } = options || {};

        const end = Date.now() + duration;

        // Main burst
        confetti({
            particleCount,
            spread,
            origin: { y: 0.6, x: 0.5 },
            colors,
            disableForReducedMotion: true,
        });

        // Side bursts with interval
        const frame = () => {
            confetti({
                particleCount: 2,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors,
                disableForReducedMotion: true,
            });
            confetti({
                particleCount: 2,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors,
                disableForReducedMotion: true,
            });

            if (Date.now() < end) {
                celebrationRef.current = setTimeout(frame, 50);
            }
        };

        frame();
    }, []);

    const celebrateGoalComplete = useCallback(() => {
        // Trigger haptic feedback for mobile
        haptics.success();

        // Special celebration for goal completion
        const duration = 4000;
        const end = Date.now() + duration;

        // Initial big burst
        confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.5, x: 0.5 },
            colors: ['#22c55e', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'],
            startVelocity: 45,
            disableForReducedMotion: true,
        });

        // Stars
        confetti({
            particleCount: 30,
            spread: 360,
            origin: { y: 0.5, x: 0.5 },
            shapes: ['star'],
            colors: ['#fbbf24', '#f59e0b'],
            scalar: 1.2,
            disableForReducedMotion: true,
        });

        // Continuous side bursts
        const frame = () => {
            confetti({
                particleCount: 4,
                angle: 60,
                spread: 80,
                origin: { x: 0, y: 0.6 },
                colors: ['#22c55e', '#3b82f6', '#fbbf24'],
                disableForReducedMotion: true,
            });
            confetti({
                particleCount: 4,
                angle: 120,
                spread: 80,
                origin: { x: 1, y: 0.6 },
                colors: ['#22c55e', '#3b82f6', '#fbbf24'],
                disableForReducedMotion: true,
            });

            if (Date.now() < end) {
                celebrationRef.current = setTimeout(frame, 80);
            }
        };

        frame();
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (celebrationRef.current) {
                clearTimeout(celebrationRef.current);
            }
        };
    }, []);

    return {
        celebrate,
        celebrateGoalComplete,
    };
}
