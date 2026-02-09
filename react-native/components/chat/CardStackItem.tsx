import React from 'react';
import Animated, { useAnimatedStyle, interpolate } from 'react-native-reanimated';
import { CardStack as CS } from '../../utils/designConstants';

interface CardStackItemProps {
  position: number;
  dragOffset: Animated.SharedValue<number>;
  isTopCard: boolean;
  containerHeight: number;
  children: React.ReactNode;
}

export default function CardStackItem({
  position,
  dragOffset,
  isTopCard,
  containerHeight,
  children,
}: CardStackItemProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const drag = isTopCard ? dragOffset.value : 0;

    if (position === 0) {
      // Current card
      return {
        transform: [
          { translateY: drag * 0.5 },
          { scale: 1.0 },
        ],
        opacity: 1,
        zIndex: 100,
      };
    }

    if (position > 0) {
      // Upcoming cards (behind the current card in the stack)
      const pos = Math.min(position, CS.maxVisibleCards);

      // When dragging down (to go back), upcoming cards peek more
      const dragFactor = drag > 0 ? interpolate(drag, [0, 200], [0, 1], 'clamp') : 0;
      const offsetY = -pos * CS.cardOffset + dragFactor * CS.cardOffset;
      const scale = 1 - pos * CS.scaleDecrement + dragFactor * CS.scaleDecrement;
      const opacity = 1 - pos * CS.opacityDecrement + dragFactor * CS.opacityDecrement;

      return {
        transform: [
          { translateY: offsetY },
          { scale: Math.max(scale, 0.85) },
        ],
        opacity: Math.max(opacity, 0.3),
        zIndex: 100 - position,
      };
    }

    // Dismissed cards (below current, pos < 0)
    const absPos = Math.abs(position);
    const dismissProgress = Math.min(absPos, CS.maxDismissedVisible);
    const peekFromBottom = containerHeight - CS.dismissedPeek + dismissProgress * 10;

    // When dragging up (to dismiss), current card slides away
    const dragDismissFactor = drag < 0 ? interpolate(drag, [-200, 0], [1, 0], 'clamp') : 0;

    return {
      transform: [
        { translateY: isTopCard ? peekFromBottom * dragDismissFactor : peekFromBottom },
        { scale: CS.dismissedScale },
      ],
      opacity: interpolate(absPos, [0, CS.maxDismissedVisible], [0.5, 0.1]),
      zIndex: 100 - absPos * 10,
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
        },
        animatedStyle,
      ]}
    >
      {children}
    </Animated.View>
  );
}
