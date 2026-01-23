/**
 * CompactToolNode - Small tool icon for compact graph view
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GRAPH_COLORS } from './types';
import { COMPACT_TOOL_WIDTH, COMPACT_TOOL_HEIGHT } from './mobile-layout';

interface CompactToolNodeProps {
  toolName: string;
  style?: object;
}

const TOOL_ICONS: Record<string, string> = {
  'mcp__jade__generative_image': '✦',
  'mcp__jade__generative_video': '▶',
  'mcp__jade__generative_audio': '♫',
  'mcp__jade__generative_character': '👤',
  'mcp__jade__background_removal': '✂',
  'mcp__jade__captions_highlights': '💬',
  'mcp__jade__import_media': '↓',
  default: '⚙',
};

function getToolIcon(toolName: string): string {
  return TOOL_ICONS[toolName] || TOOL_ICONS.default;
}

export function CompactToolNode({ toolName, style }: CompactToolNodeProps) {
  const icon = getToolIcon(toolName);

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.icon}>{icon}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: COMPACT_TOOL_WIDTH,
    height: COMPACT_TOOL_HEIGHT,
    borderRadius: 12,
    backgroundColor: GRAPH_COLORS.glassBackground,
    borderWidth: 1,
    borderColor: GRAPH_COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: GRAPH_COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },
  icon: {
    fontSize: 20,
    color: GRAPH_COLORS.primary,
  },
});

export default CompactToolNode;
