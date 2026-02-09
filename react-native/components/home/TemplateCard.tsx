import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { TemplatePresentation } from '../../types/TemplatePresentation';
import { CardSize, CornerRadius } from '../../utils/designConstants';
import { useThemeColors } from '../../utils/theme';

interface TemplateCardProps {
  template: TemplatePresentation;
  onPress: () => void;
  width?: number;
}

function hueFromString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 45%, 35%)`;
}

export default function TemplateCard({
  template,
  onPress,
  width = CardSize.templateWidth,
}: TemplateCardProps) {
  const colors = useThemeColors();
  const gradientColor = useMemo(
    () => hueFromString(template.id),
    [template.id],
  );

  return (
    <TouchableOpacity
      style={[styles.card, { width, height: CardSize.templateHeight }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {template.imageURL ? (
        <Image
          source={{ uri: template.imageURL }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
      ) : (
        <LinearGradient
          colors={[gradientColor, '#000000']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}

      <LinearGradient
        colors={['transparent', 'rgba(0, 0, 0, 0.6)']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        <Text style={styles.label}>
          {template.displayLabel.toUpperCase()}
        </Text>
        <Text style={styles.name} numberOfLines={1}>
          {template.displayArticle
            ? `${template.displayArticle} ${template.displayName}`
            : template.displayName}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: CornerRadius.medium,
    overflow: 'hidden',
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
  },
  label: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 2,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
});
