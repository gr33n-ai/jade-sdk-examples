import React, { useEffect, useRef } from 'react';
import { Animated, Easing, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface Props {
  size?: number;
  color?: string;
  style?: ViewStyle;
}

export default function SpinningLoader({
  size = 20,
  color = '#4a9eff',
  style,
}: Props) {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [rotation]);

  const rotationDeg = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[{ transform: [{ rotate: rotationDeg }] }, style]}>
      <Feather name="loader" size={size} color={color} />
    </Animated.View>
  );
}
