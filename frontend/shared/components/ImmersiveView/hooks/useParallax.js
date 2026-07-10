// C:\quran-similarity-app\frontend\src\shared\components\ImmersiveView\hooks\useParallax.js

import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for 4-directional space navigation
 * Feels like floating through space, not scrolling a webpage
 */
export default function useParallax({ visible, onClose }) {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const animRef = useRef(null);
    const velRef = useRef({ x: 0, y: 0 });
    const targetRef = useRef({ x: 0, y: 0 });
    const keysRef = useRef({});
    const touchRef = useRef({ startX: 0, startY: 0, startTarget: { x: 0, y: 0 } });

    // Animation loop with spring physics
    useEffect(() => {
        if (!visible) return;
        let id;
        const KEY_SPEED = 0.25;
        
        const tick = () => {
            if (keysRef.current.ArrowRight || keysRef.current.ArrowLeft || keysRef.current.ArrowUp || keysRef.current.ArrowDown) {
                if (keysRef.current.ArrowRight) targetRef.current.x += KEY_SPEED;
                if (keysRef.current.ArrowLeft) targetRef.current.x -= KEY_SPEED;
                if (keysRef.current.ArrowUp) targetRef.current.y -= KEY_SPEED;
                if (keysRef.current.ArrowDown) targetRef.current.y += KEY_SPEED;
            }

            setPosition(prev => {
                const target = targetRef.current;
                let vel = velRef.current;

                // Spring physics for both axes
                vel.x += (target.x - prev.x) * 0.04;
                vel.y += (target.y - prev.y) * 0.04;
                vel.x *= 0.9;
                vel.y *= 0.9;

                // Stop微小运动
                if (Math.abs(vel.x) < 0.02 && Math.abs(target.x - prev.x) < 0.02) vel.x = 0;
                if (Math.abs(vel.y) < 0.02 && Math.abs(target.y - prev.y) < 0.02) vel.y = 0;

                velRef.current = vel;
                return { x: prev.x + vel.x, y: prev.y + vel.y };
            });

            id = requestAnimationFrame(tick);
            animRef.current = id;
        };

        tick();
        return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
    }, [visible]);

    // Keyboard controls - 4 directions
    useEffect(() => {
        const KEY_SPEED = 0.25;

        const updateTargetFromKeys = () => {
            if (keysRef.current.ArrowRight) targetRef.current.x += KEY_SPEED;
            if (keysRef.current.ArrowLeft) targetRef.current.x -= KEY_SPEED;
            if (keysRef.current.ArrowUp) targetRef.current.y -= KEY_SPEED;
            if (keysRef.current.ArrowDown) targetRef.current.y += KEY_SPEED;
        };

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose?.();
                return;
            }

            if (['ArrowRight','ArrowLeft','ArrowUp','ArrowDown'].includes(e.key)) {
                keysRef.current[e.key] = true;
                updateTargetFromKeys();
                e.preventDefault();
            }
        };

        const handleKeyUp = (e) => {
            if (['ArrowRight','ArrowLeft','ArrowUp','ArrowDown'].includes(e.key)) {
                delete keysRef.current[e.key];
            }
        };

        const handleBlur = () => { keysRef.current = {}; };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('blur', handleBlur);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('blur', handleBlur);
        };
    }, [onClose]);

    // Touch handlers for mobile (2D pan)
    const onTouchStart = (e) => {
        const touch = e.touches[0];
        touchRef.current = {
            startX: touch.clientX,
            startY: touch.clientY,
            startTarget: { ...targetRef.current }
        };
    };

    const onTouchMove = (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const dx = touch.clientX - touchRef.current.startX;
        const dy = touch.clientY - touchRef.current.startY;
        targetRef.current = {
            x: touchRef.current.startTarget.x + dx * 0.3,
            y: touchRef.current.startTarget.y + dy * 0.3
        };
    };

    const onTouchEnd = () => {
        // Keep current position - don't snap back
    };

    return {
        position,
        touchHandlers: { onTouchStart, onTouchMove, onTouchEnd }
    };
}