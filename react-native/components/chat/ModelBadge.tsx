import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { modelDisplayName } from '../../utils/modelDisplayName';

interface ModelBadgeProps {
  model?: string;
}

export default function ModelBadge({ model }: ModelBadgeProps) {
  const name = modelDisplayName(model);
  if (!name) return null;

  return (
    <View style={styles.badge}>
      <Text style={styles.sparkle}>✦</Text>
      <Text style={styles.text}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sparkle: {
    color: '#FFFFFF',
    fontSize: 10,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
});
