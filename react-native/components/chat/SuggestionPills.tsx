import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useThemeColors } from '../../utils/theme';

interface SuggestionPillsProps {
  suggestions: string[];
  onTap: (suggestion: string) => void;
}

export default function SuggestionPills({ suggestions, onTap }: SuggestionPillsProps) {
  const colors = useThemeColors();
  const items = suggestions;

  return (
    <View style={styles.container}>
      {items.map((text, i) => (
        <TouchableOpacity
          key={i}
          style={[styles.pill, { backgroundColor: colors.suggestionPill }]}
          onPress={() => onTap(text)}
          activeOpacity={0.7}
        >
          <Text style={[styles.text, { color: colors.suggestionPillText }]}>
            {text}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function SuggestionPillsForMedia({
  suggestions,
  onTap,
  before,
}: {
  suggestions: string[];
  onTap: (suggestion: string) => void;
  before?: React.ReactNode;
}) {
  const colors = useThemeColors();
  if (suggestions.length === 0 && !before) return null;
  return (
    <View style={styles.container}>
      {before}
      {suggestions.map((text, i) => (
        <TouchableOpacity
          key={i}
          style={[styles.pill, { backgroundColor: colors.suggestionPill }]}
          onPress={() => onTap(text)}
          activeOpacity={0.7}
        >
          <Text style={[styles.text, { color: colors.suggestionPillText }]}>
            {text}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function ContinueGeneratingPill({ onTap, remaining }: { onTap: () => void; remaining: number }) {
  const colors = useThemeColors();
  return (
    <TouchableOpacity
      style={[styles.pill, { backgroundColor: colors.accentBackground }]}
      onPress={onTap}
      activeOpacity={0.7}
    >
      <Text style={[styles.continueText, { color: colors.accent }]}>
        ▶ {remaining} remaining todo{remaining !== 1 ? 's' : ''}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    paddingHorizontal: 4,
  },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
  continueText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
