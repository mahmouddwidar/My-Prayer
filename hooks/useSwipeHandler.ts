import { useEffect, useRef } from "react";

interface SwipeHandlerOptions {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    threshold?: number; // Minimum distance to trigger swipe (px)
    enabled?: boolean;
}

/**
 * Hook for handling swipe gestures on a container
 * Supports touch and mouse/pointer events
 */
export function useSwipeHandler(
    containerRef: React.RefObject<HTMLElement>,
    {
        onSwipeLeft,
        onSwipeRight,
        threshold = 50,
        enabled = true,
    }: SwipeHandlerOptions
) {
    const startXRef = useRef<number>(0);
    const startYRef = useRef<number>(0);

    useEffect(() => {
        if (!enabled || !containerRef.current) return;

        const container = containerRef.current;

        const handleTouchStart = (e: TouchEvent) => {
            startXRef.current = e.touches[0].clientX;
            startYRef.current = e.touches[0].clientY;
        };

        const handleTouchEnd = (e: TouchEvent) => {
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;

            const diffX = startXRef.current - endX;
            const diffY = startYRef.current - endY;

            // Only trigger if vertical movement is minimal (horizontal swipe)
            if (Math.abs(diffY) < Math.abs(diffX)) {
                if (diffX > threshold && onSwipeLeft) {
                    onSwipeLeft();
                } else if (diffX < -threshold && onSwipeRight) {
                    onSwipeRight();
                }
            }
        };

        // Pointer events for mouse/stylus
        const handlePointerDown = (e: PointerEvent) => {
            if (e.isPrimary) {
                startXRef.current = e.clientX;
                startYRef.current = e.clientY;
            }
        };

        const handlePointerUp = (e: PointerEvent) => {
            if (!e.isPrimary) return;

            const endX = e.clientX;
            const endY = e.clientY;

            const diffX = startXRef.current - endX;
            const diffY = startYRef.current - endY;

            // Only trigger if vertical movement is minimal
            if (Math.abs(diffY) < Math.abs(diffX)) {
                if (diffX > threshold && onSwipeLeft) {
                    onSwipeLeft();
                } else if (diffX < -threshold && onSwipeRight) {
                    onSwipeRight();
                }
            }
        };

        container.addEventListener("touchstart", handleTouchStart, false);
        container.addEventListener("touchend", handleTouchEnd, false);
        container.addEventListener("pointerdown", handlePointerDown, false);
        container.addEventListener("pointerup", handlePointerUp, false);

        return () => {
            container.removeEventListener("touchstart", handleTouchStart);
            container.removeEventListener("touchend", handleTouchEnd);
            container.removeEventListener("pointerdown", handlePointerDown);
            container.removeEventListener("pointerup", handlePointerUp);
        };
    }, [enabled, onSwipeLeft, onSwipeRight, threshold, containerRef]);
}
