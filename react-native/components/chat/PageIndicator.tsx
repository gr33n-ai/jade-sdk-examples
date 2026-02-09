import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useThemeColors } from '../../utils/theme';

interface PageIndicatorProps {
  count: number;
  activeIndex: number;
}

export default function PageIndicator({ count, activeIndex }: PageIndicatorProps) {
  const colors = useThemeColors();
  if (count <= 1) return null;

  return (
    <View style={styles.container}>
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              backgroundColor: i === activeIndex ? colors.accent : colors.cardTextSecondary,
              opacity: i === activeIndex ? 1 : 0.4,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
