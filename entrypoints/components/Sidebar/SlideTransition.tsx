import React, { ReactNode, useEffect, useRef } from "react";

interface SlideTransitionProps {
	children: ReactNode;
	isActive: boolean;
	direction: "left" | "right";
	animationDuration?: number;
}

/**
 * Slide Transition Wrapper Component
 * Animates content sliding in/out based on tab changes
 * Direction is data-driven: higher index = slide from right
 */
export const SlideTransition = React.forwardRef<
	HTMLDivElement,
	SlideTransitionProps
>(function SlideTransition(
	{ children, isActive, direction, animationDuration = 300 },
	ref,
) {
	const internalRef = useRef<HTMLDivElement>(null);
	const divRef = ref || internalRef;

	useEffect(() => {
		if (typeof divRef === "object" && divRef?.current) {
			if (isActive) {
				// Slide in
				divRef.current.style.animation = `slideIn${direction === "left" ? "Left" : "Right"} ${animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1) forwards`;
				divRef.current.style.opacity = "1";
				divRef.current.style.pointerEvents = "auto";
			} else {
				// Slide out
				divRef.current.style.animation = `slideOut${direction === "left" ? "Left" : "Right"} ${animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1) forwards`;
				divRef.current.style.opacity = "0";
				divRef.current.style.pointerEvents = "none";
			}
		}
	}, [isActive, direction, animationDuration, divRef]);

	return (
		<div
			ref={divRef}
			role="tabpanel"
			className="slide-transition-wrapper"
			style={{
				opacity: isActive ? 1 : 0,
				pointerEvents: isActive ? "auto" : "none",
				willChange: "transform, opacity",
			}}
		>
			{children}
		</div>
	);
});

SlideTransition.displayName = "SlideTransition";
