/**
 * Reusable animation hooks for workflow graph components
 */

import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

/**
 * Creates a pulsing opacity animation
 * @param min - Minimum opacity value
 * @param max - Maximum opacity value
 * @param duration - Duration of one pulse cycle in ms
 */
export function usePulseAnimation(
  min: number = 0.25,
  max: number = 0.6,
  duration: number = 2000
): Animated.Value {
  const animValue = useRef(new Animated.Value(min)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, {
          toValue: max,
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(animValue, {
          toValue: min,
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [animValue, min, max, duration]);

  return animValue;
}

/**
 * Creates a translating shimmer animation
 * @param width - Width of the shimmer surface
 * @param duration - Duration of one shimmer cycle in ms
 */
export function useShimmerAnimation(
  width: number = 120,
  duration: number = 3000
): Animated.Value {
  const animValue = useRef(new Animated.Value(-width)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, {
          toValue: width * 2,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(animValue, {
          toValue: -width,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [animValue, width, duration]);

  return animValue;
}

/**
 * Creates a flowing grid animation for background patterns
 * @param cellSize - Size of grid cells in pixels
 * @param duration - Duration of one flow cycle in ms
 */
export function useGridFlowAnimation(
  cellSize: number = 20,
  duration: number = 4000
): Animated.Value {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(animValue, {
        toValue: cellSize,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();

    return () => animation.stop();
  }, [animValue, cellSize, duration]);

  return animValue;
}

/**
 * Creates a scale bounce animation for appearing elements
 * @param toValue - Target scale value (1 = normal)
 * @param delay - Delay before animation starts
 */
export function useScaleInAnimation(
  toValue: number = 1,
  delay: number = 0
): Animated.Value {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.delay(delay),
      Animated.spring(animValue, {
        toValue,
        tension: 200,
        friction: 15,
        useNativeDriver: true,
      }),
    ]);
    animation.start();

    return () => animation.stop();
  }, [animValue, toValue, delay]);

  return animValue;
}

/**
 * Creates a rotating animation
 * @param duration - Duration of one full rotation in ms
 */
export function useRotateAnimation(duration: number = 8000): Animated.Value {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(animValue, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();

    return () => animation.stop();
  }, [animValue, duration]);

  return animValue;
}
