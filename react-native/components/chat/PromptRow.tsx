import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeSyntheticEvent, TextLayoutEventData } from 'react-native';
import { Avatar } from '../../utils/designConstants';
import { useThemeColors } from '../../utils/theme';

const LINE_HEIGHT = 20;

interface PromptRowProps {
  text: string;
}

export default function PromptRow({ text }: PromptRowProps) {
  const colors = useThemeColors();
  const [isMultiline, setIsMultiline] = useState(false);

  const handleTextLayout = (e: NativeSyntheticEvent<TextLayoutEventData>) => {
    setIsMultiline(e.nativeEvent.lines.length > 1);
  };

  return (
    <View style={[styles.row, isMultiline && styles.rowTop]}>
      <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
        <Text style={styles.avatarText}>✦</Text>
      </View>
      <Text
        style={[styles.prompt, { color: colors.cardText }]}
        numberOfLines={3}
        onTextLayout={handleTextLayout}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowTop: {
    alignItems: 'flex-start',
  },
  avatar: {
    width: Avatar.size,
    height: Avatar.size,
    borderRadius: Avatar.size / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  prompt: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: LINE_HEIGHT,
  },
});
