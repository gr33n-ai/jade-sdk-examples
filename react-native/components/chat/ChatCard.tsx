import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CornerRadius, Spacing } from '../../utils/designConstants';
import { useThemeColors } from '../../utils/theme';

interface ChatCardProps {
  children: React.ReactNode;
}

export default function ChatCard({ children }: ChatCardProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: CornerRadius.large,
    padding: Spacing.cardPadding,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
});
